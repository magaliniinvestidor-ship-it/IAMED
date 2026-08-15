// ============================================================
// Correção de códigos SNOMED placeholder no seed (snomed_concepts)
// ============================================================
// O seed curado usou códigos FICTÍCIOS (ex.: 3727560061, 3872070081,
// 1003755001...) derivados de um código base real + contador.
// Este script resolve o código SNOMED REAL via RxNav/RxNorm para
// cada conceito suspeito e atualiza:
//   1. snomed_concepts  (concept_id corrigido / merge com o real)
//   2. drug_catalog     (snomed_code / snomed_description)
//   3. prescription_items (snomed_code gravado)
//
// Uso:
//   node scripts/fix_placeholder_snomed.mjs [--dry-run] [--limit 50] [--delay 150]
//
// Fonte: RxNav/RxNorm - https://rxnav.nlm.nih.gov (NIH/NLM, gratuito)
// Cache local em .rxnav_cache.json (reaproveitado).
// ============================================================

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST';
const ROOT = path.resolve(process.cwd(), 'scripts');
const CACHE_FILE = path.join(ROOT, '..', '.rxnav_cache.json');

const args = process.argv.slice(2);
function argVal(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const limit = argVal('--limit') ? parseInt(argVal('--limit'), 10) : 0;
const dryRun = args.includes('--dry-run');
const delayMs = parseInt(argVal('--delay') || '150', 10);

function readEnv() {
  const envPath = path.join(ROOT, '..', '.env.local');
  const vars = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        vars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
  return vars;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function httpJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'iamed-enrich/0.1 (contact: admin)' } });
  if (!res.ok) return null;
  return res.json();
}

async function rxcuiForName(name) {
  const d = await httpJson(`${RXNAV_BASE}/rxcui.json?name=${encodeURIComponent(name)}`);
  return d?.idGroup?.rxnormId?.[0] || null;
}

async function snomedForRxcui(rxcui) {
  const d = await httpJson(`${RXNAV_BASE}/rxcui/${rxcui}/property.json?propName=SNOMEDCT`);
  return (d?.propConceptGroup?.propConcept || []).map((p) => p.propValue).filter(Boolean);
}

async function nameForRxcui(rxcui) {
  const d = await httpJson(`${RXNAV_BASE}/rxcui/${rxcui}.json`);
  return d?.rxnormdata?.conceptGroup?.[0]?.conceptProperties?.[0]?.name || null;
}

function stripAccents(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Heurística: considera-se suspeito todo código com mais de 9 dígitos.
// (SNOMED internacional = ≤9 dígitos; códigos US >9 dígitos como
//  981000124106 não resolvem no RxNav e serão ignorados sem dano.)
function isSuspicious(code) {
  return /^\d{10,}$/.test(code);
}

// Candidatos de busca em ordem de preferência
function candidates(concept) {
  const out = [];
  const push = (v) => {
    const s = String(v || '').trim();
    if (s && !out.includes(s)) out.push(s);
  };
  push(concept.preferred_term);
  push(concept.term_en);
  push(concept.inn);
  const pt = stripAccents(concept.term_pt || concept.term_es || '')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (pt) push(pt);
  // Combinações "A + B": RxNorm usa "and" ou "/"
  for (const base of [concept.preferred_term, concept.term_en, pt]) {
    if (/\+/.test(String(base || ''))) {
      push(String(base).replace(/\+/g, 'and'));
      push(String(base).replace(/\+/g, '/'));
      push(String(base).replace(/\s*\+\s*/g, ' '));
    }
  }
  return out;
}

// Tabelas com coluna snomed_code que apontam para os conceitos
const REF_TABLES = ['drug_catalog', 'prescription_items'];

async function main() {
  const env = readEnv();
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Variáveis do Supabase não encontradas no .env.local.');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // ── 1. Carregar todos os conceitos (paginação) ──
  console.log('⏳ Carregando snomed_concepts...');
  const concepts = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('snomed_concepts').select('*').range(from, from + 999);
    if (error) { console.error('❌', error.message); process.exit(1); }
    concepts.push(...data);
    if (data.length < 1000) break;
  }
  console.log(`  ${concepts.length} conceitos no total`);

  const suspects = concepts.filter((c) => isSuspicious(String(c.concept_id)));
  console.log(`  ${suspects.length} conceitos suspeitos (>9 dígitos)`);
  if (!suspects.length) { console.log('✅ Nada a corrigir.'); return; }

  const slice = limit > 0 ? suspects.slice(0, limit) : suspects;

  // ── 2. Cache local ──
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { cache = {}; }
  }
  const save = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  // ── 3. Resolver códigos reais via RxNav ──
  const resolved = [];
  const unresolved = [];
  let fromCache = 0;

  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    const key = `@fix2:${c.preferred_term || c.inn || c.concept_id}`;
    let rec = null;
    if (cache[key] !== undefined) {
      rec = cache[key];
      if (rec?.conceptId) { resolved.push({ concept: c, ...rec }); fromCache++; }
      else unresolved.push(c);
      continue;
    }
    try {
      for (const cand of candidates(c)) {
        const rxcui = await rxcuiForName(cand);
        if (!rxcui) continue;
        const codes = await snomedForRxcui(rxcui);
        if (codes.length) {
          const term = (await nameForRxcui(rxcui)) || cand;
          rec = { conceptId: codes[0], term, rxnormCode: rxcui };
          break;
        }
      }
    } catch (e) {
      console.error(`  ⚠️ ${c.preferred_term} (${c.concept_id}): ${e.message}`);
      await sleep(1000);
    }
    cache[key] = rec ? { conceptId: rec.conceptId, term: rec.term, rxnormCode: rec.rxnormCode } : { conceptId: null };
    save();
    if (rec) { resolved.push({ concept: c, ...rec }); }
    else unresolved.push(c);
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${slice.length} consultados | ${resolved.length} resolvidos`);
    await sleep(delayMs);
  }

  console.log(`\n✅ Resolvidos: ${resolved.length} | sem match: ${unresolved.length} (${fromCache} do cache)`);
  if (unresolved.length) {
    console.log('  Sem match (serão mantidos como estão):');
    for (const u of unresolved.slice(0, 20)) console.log(`    ${u.concept_id}  ${u.preferred_term}`);
  }
  if (dryRun) {
    console.log('🧪 Dry-run — nenhuma escrita no banco.');
    for (const r of resolved.slice(0, 20)) {
      console.log(`  ${r.concept.concept_id} → ${r.conceptId}  ${r.term} (${r.concept.preferred_term})`);
    }
    return;
  }
  if (!resolved.length) return;

  // ── 4. Aplicar correções ──
  let changedConcepts = 0;
  let mergedConcepts = 0;
  let updatedRefs = 0;

  for (const r of resolved) {
    const current = String(r.concept.concept_id);
    const target = String(r.conceptId);
    if (current === target) continue;

    // 4a. Atualizar tabelas de referência (drug_catalog, prescrições)
    for (const tbl of REF_TABLES) {
      const { error: uErr } = await supabase
        .from(tbl)
        .update({ snomed_code: target, snomed_description: r.term })
        .eq('snomed_code', current);
      if (!uErr && uErr === null) updatedRefs++;
      else if (uErr && !/column/.test(uErr.message)) {
        console.error(`  ⚠️ ${tbl} update ${current}: ${uErr.message}`);
      }
    }

    // 4b. Conceito alvo já existe? → merge (herda traduções e desativa o placeholder)
    const { data: existing } = await supabase.from('snomed_concepts').select('*').eq('concept_id', target).limit(1);
    if (existing && existing.length > 0) {
      const patch = {};
      if (!existing[0].term_pt && r.concept.term_pt) patch.term_pt = r.concept.term_pt;
      if (!existing[0].term_es && r.concept.term_es) patch.term_es = r.concept.term_es;
      if (!existing[0].term_en && r.concept.term_en) patch.term_en = r.concept.term_en;
      if (Object.keys(patch).length) {
        await supabase.from('snomed_concepts').update(patch).eq('concept_id', target);
      }
      await supabase.from('snomed_concepts').delete().eq('concept_id', current);
      mergedConcepts++;
    } else {
      const { error: uErr } = await supabase
        .from('snomed_concepts')
        .update({
          concept_id: target,
          preferred_term: r.term,
          term_en: r.term,
          inn: r.term,
          rxnorm_code: r.rxnormCode,
        })
        .eq('concept_id', current);
      if (uErr) console.error(`  ⚠️ update conceito ${current}: ${uErr.message}`);
      changedConcepts++;
    }
  }

  // ── 5. Resumo ──
  const { data: after } = await supabase.from('snomed_concepts').select('concept_id');
  console.log(`\n🎉 Concluído: ${changedConcepts} conceitos corrigidos | ${mergedConcepts} mesclados | ${updatedRefs} refs atualizadas`);
  console.log(`  Total de conceitos agora: ${after?.length}`);
}

main().catch((err) => {
  console.error('❌ Falha na execução:', err);
  process.exit(1);
});