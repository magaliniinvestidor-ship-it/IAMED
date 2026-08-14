// ============================================================
// Enriquecimento SNOMED do drug_catalog via RxNav (NIH/NLM)
// ============================================================
// Para cada princípio ativo pendente (snomed_code IS NULL):
//   1. Gera candidatos em INN/inglês (dicionário PT→EN simples)
//   2. Busca o RxCUI na RxNorm API (pública e oficial)
//   3. Obtém o código SNOMED-CT de substância (SNOMEDCT_US)
//   4. Insere o conceito em snomed_concepts (se não existir)
//   5. Atualiza drug_catalog.snomed_code / snomed_description
//
// Uso:
//   node scripts/enrich_drug_catalog_snomed.mjs [--limit 50] [--dry-run] [--delay 200]
//
// Fonte: RxNav/RxNorm - https://rxnav.nlm.nih.gov (NIH/NLM, gratuito)
// Lê credenciais de .env.local (SUPABASE_SERVICE_ROLE_KEY).
// Cache local em .rxnav_cache.json (re-rodadas são incrementais).
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

// Busca o RxCUI do nome (genérico/INN)
async function rxcuiForName(name) {
  const d = await httpJson(`${RXNAV_BASE}/rxcui.json?name=${encodeURIComponent(name)}`);
  return d?.idGroup?.rxnormId?.[0] || null;
}

// Obtém o código SNOMED-CT de um RxCUI (propriedade SNOMEDCT)
async function snomedForRxcui(rxcui) {
  const d = await httpJson(`${RXNAV_BASE}/rxcui/${rxcui}/property.json?propName=SNOMEDCT`);
  return (d?.propConceptGroup?.propConcept || []).map((p) => p.propValue).filter(Boolean);
}

// Nome do conceito (para termo preferido)
async function nameForRxcui(rxcui) {
  const d = await httpJson(`${RXNAV_BASE}/rxcui/${rxcui}.json`);
  return d?.rxnormdata?.conceptGroup?.[0]?.conceptProperties?.[0]?.name || null;
}

// ── Dicionário PT→EN (substituição de tokens) ──
const TOKEN_MAP = {
  'acido': 'acid', 'ácido': 'acid',
  'acetilsalicilico': 'aspirin', 'acetilsalicílico': 'aspirin',
  'cloridrato': 'hydrochloride', 'dicloridrato': 'dihydrochloride',
  'sulfato': 'sulfate', 'nitrato': 'nitrate', 'fosfato': 'phosphate',
  'fumarato': 'fumarate', 'maleato': 'maleate', 'citrato': 'citrate',
  'hidroxido': 'hydroxide', 'hidróxido': 'hydroxide',
  'oxido': 'oxide', 'óxido': 'oxide',
  'bicarbonato': 'bicarbonate', 'carbonato': 'carbonate',
  'cloreto': 'chloride', 'brometo': 'bromide', 'iodeto': 'iodide',
  'gluconato': 'gluconate', 'lactato': 'lactate', 'benzoato': 'benzoate',
  'propionato': 'propionate', 'acetato': 'acetate', 'pamoato': 'pamoate',
  'succinato': 'succinate', 'mesilato': 'mesylate', 'besilato': 'besylate',
  'sodico': 'sodium', 'sódico': 'sodium', 'sodica': 'sodium', 'sódica': 'sodium',
  'potassico': 'potassium', 'potássico': 'potassium', 'potassica': 'potassium', 'potássica': 'potassium',
  'calcico': 'calcium', 'cálcico': 'calcium', 'calcica': 'calcium', 'cálcica': 'calcium',
  'magnesio': 'magnesium', 'magnésio': 'magnesium',
  'ferroso': 'ferrous', 'ferrico': 'ferric', 'férrico': 'ferric',
  'cafeina': 'caffeine', 'cafeína': 'caffeine',
  'heparina': 'heparin', 'anidra': 'anhydrous',
  'de': '', 'cloridrato de': 'hydrochloride',
  'sulfato ferroso': 'ferrous sulfate',
};

// ── Mapeamentos completos comuns (casos especiais) ──
const FULL_MAP = {
  'dipirona sodica': 'metamizole sodium',
  'dipirona': 'metamizole',
  'paracetamol': 'acetaminophen',
  'acido folico': 'folic acid',
  'acido acetilsalicilico': 'aspirin',
  'acido valproico': 'valproic acid',
  'acido ascorbico': 'ascorbic acid',
  'sulfato ferroso': 'ferrous sulfate',
  'salbutamol': 'salbutamol',
  'cloridrato de': 'hydrochloride',
  'insulina': 'insulin',
  'insulina regular': 'insulin regular',
  'insulina nph': 'insulin nph',
  'levotiroxina': 'levothyroxine',
  'metformina': 'metformin',
  'omeprazol': 'omeprazole',
  'amoxicilina': 'amoxicillin',
  'azitromicina': 'azithromycin',
  'cefalexina': 'cephalexin',
  'fluoxetina': 'fluoxetine',
  'sertralina': 'sertraline',
  'clonazepam': 'clonazepam',
  'alprazolam': 'alprazolam',
  'diazepam': 'diazepam',
  'loratadina': 'loratadine',
  'cetirizina': 'cetirizine',
  'ibuprofeno': 'ibuprofen',
  'naproxeno': 'naproxen',
  'diclofenaco': 'diclofenac',
  'celecoxibe': 'celecoxib',
  'tramadol': 'tramadol',
  'morfina': 'morphine',
  'codeina': 'codeine',
  'prednisona': 'prednisone',
  'prednisolona': 'prednisolone',
  'dexametasona': 'dexamethasone',
  'hidrocortisona': 'hydrocortisone',
  'losartana': 'losartan',
  'enalapril': 'enalapril',
  'captopril': 'captopril',
  'hidroclorotiazida': 'hydrochlorothiazide',
  'furosemida': 'furosemide',
  'espironolactona': 'spironolactone',
  'propranolol': 'propranolol',
  'atenolol': 'atenolol',
  'anlodipino': 'amlodipine',
  'anlodipina': 'amlodipine',
  'nifedipino': 'nifedipine',
  'atorvastatina': 'atorvastatin',
  'sinvastatina': 'simvastatin',
  'rosuvastatina': 'rosuvastatin',
  'digoxina': 'digoxin',
  'amiodarona': 'amiodarone',
  'clopidogrel': 'clopidogrel',
  'varfarina': 'warfarin',
  'rivaroxabana': 'rivaroxaban',
  'apixabana': 'apixaban',
  'fluconazol': 'fluconazole',
  'itraconazol': 'itraconazole',
  'nistatina': 'nystatin',
  'terbinafina': 'terbinafine',
  'albendazol': 'albendazole',
  'mebendazol': 'mebendazole',
  'ivermectina': 'ivermectin',
  'aciclovir': 'acyclovir',
  'oseltamivir': 'oseltamivir',
  'salbutamol': 'salbutamol',
  'montelucaste': 'montelukast',
  'budesonida': 'budesonide',
  'fluticasona': 'fluticasone',
  'omeprazol': 'omeprazole',
  'pantoprazol': 'pantoprazole',
  'ranitidina': 'ranitidine',
  'metoclopramida': 'metoclopramide',
  'ondansetrona': 'ondansetron',
  'loperamida': 'loperamide',
  'simeticona': 'simethicone',
  'metotrexato': 'methotrexate',
  'azatioprina': 'azathioprine',
  'ciclosporina': 'cyclosporine',
  'cloroquina': 'chloroquine',
  'glibenclamida': 'glibenclamide',
  'glimepirida': 'glimepiride',
  'alopurinol': 'allopurinol',
  'colchicina': 'colchicine',
  'misoprostol': 'misoprostol',
  'levonorgestrel': 'levonorgestrel',
  'estradiol': 'estradiol',
  'medroxiprogesterona': 'medroxyprogesterone',
  'mupirocina': 'mupirocin',
  'clotrimazol': 'clotrimazole',
  'cetoconazol': 'ketoconazole',
  'permetrina': 'permethrin',
  'lidocaina': 'lidocaine',
  'bupivacaina': 'bupivacaine',
  'propofol': 'propofol',
  'cetamina': 'ketamine',
  'sevoflurano': 'sevoflurane',
  'atropina': 'atropine',
  'fenobarbital': 'phenobarbital',
  'fenitoina': 'phenytoin',
  'carbamazepina': 'carbamazepine',
  'haloperidol': 'haloperidol',
  'risperidona': 'risperidone',
  'quetiapina': 'quetiapine',
  'lítio': 'lithium',
  'litio': 'lithium',
  'glucagon': 'glucagon',
  'metimazol': 'methimazole',
  'betametasona': 'betamethasone',
};

function stripAccents(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Tokens de dose/unidade que devem ser removidos do nome
const DOSE_RE = /^\d+([.,]\d+)?(\s*(mg|g|mcg|mcg|ml|l|ui|iu|meq|mmol|%))?$/;

// Mapa de tokens: TOKEN_MAP + entradas de palavra única do FULL_MAP
const SINGLE_WORD_MAP = { ...TOKEN_MAP };
for (const [k, v] of Object.entries(FULL_MAP)) {
  if (!k.includes(' ')) SINGLE_WORD_MAP[k] = v;
}
// Frases multi-token do FULL_MAP, ordenadas da maior para a menor
const PHRASE_KEYS = Object.keys(FULL_MAP).filter((k) => k.includes(' ')).sort((a, b) => b.length - a.length);

function toEnglishIngredient(ing) {
  const low = stripAccents(ing).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (FULL_MAP[low]) return FULL_MAP[low];
  let working = low;
  for (const phrase of PHRASE_KEYS) {
    if (working.includes(phrase)) {
      working = working.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), FULL_MAP[phrase]);
    }
  }
  const mapped = working
    .split(' ')
    .filter(Boolean)
    .filter((w) => !DOSE_RE.test(w))
    .map((w) => SINGLE_WORD_MAP[w] ?? w)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return mapped;
}

// Gera candidatos em ordem de preferência
function candidates(ing) {
  const out = [];
  const en = toEnglishIngredient(ing);
  out.push(ing);
  if (en && en !== ing) out.push(en);
  // Combinações "A + B": tenta a 1ª parte como último recurso
  const combo = ing.split('+').map((s) => s.trim()).filter(Boolean);
  if (combo.length > 1) {
    for (const part of combo) {
      const pe = toEnglishIngredient(part);
      if (pe && !out.includes(pe)) out.push(pe);
    }
  }
  return out;
}

async function main() {
  const env = readEnv();
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Variáveis do Supabase não encontradas no .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // ── 1. Ingredientes pendentes distintos (paginação de 1000) ──
  console.log('⏳ Buscando princípios ativos pendentes...');
  const ingredients = [];
  for (let from = 0; ; from += 1000) {
    const { data: rows, error } = await supabase
      .from('drug_catalog')
      .select('active_ingredient')
      .is('snomed_code', null)
      .not('active_ingredient', 'is', null)
      .range(from, from + 999);
    if (error) {
      console.error('❌ Erro ao listar pendentes:', error.message);
      process.exit(1);
    }
    for (const r of rows) {
      const v = String(r.active_ingredient || '').trim();
      if (v && !ingredients.includes(v)) ingredients.push(v);
    }
    if (rows.length < 1000) break;
    await sleep(50);
  }
  console.log(`  ${ingredients.length} princípios ativos distintos pendentes`);
  const slice = limit > 0 ? ingredients.slice(0, limit) : ingredients;

  // ── 2. Cache local ──
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { cache = {}; }
  }
  const save = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  // ── 3. Loop RxNav ──
  const mapped = [];
  let fromCache = 0;
  let errorsCount = 0;

  for (let i = 0; i < slice.length; i++) {
    const ing = slice[i];
    if (cache[ing] !== undefined) {
      if (cache[ing]?.conceptId) mapped.push({ ingredient: ing, ...cache[ing] });
      fromCache++;
      continue;
    }
    let rec = null;
    try {
      for (const cand of candidates(ing)) {
        const rxcui = await rxcuiForName(cand);
        if (!rxcui) continue;
        const codes = await snomedForRxcui(rxcui);
        if (codes.length) {
          const term = (await nameForRxcui(rxcui)) || cand;
          rec = { conceptId: codes[0], term, inn: term, rxnormCode: rxcui };
          break;
        }
      }
    } catch (e) {
      errorsCount++;
      console.error(`  ⚠️ ${ing}: ${e.message}`);
      await sleep(1000);
    }
    cache[ing] = rec ? { conceptId: rec.conceptId, term: rec.term, inn: rec.inn, rxnormCode: rec.rxnormCode } : { conceptId: null };
    save();
    if (rec) mapped.push({ ingredient: ing, ...rec });
    else errorsCount++;
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${slice.length} consultados | ${mapped.length} mapeados`);
    await sleep(delayMs);
  }

  console.log(`\n✅ Mapeados: ${mapped.length} de ${slice.length} princípios ativos (${fromCache} do cache, ${errorsCount} sem match/erro)`);
  if (dryRun) {
    console.log('🧪 Dry-run — nenhuma escrita no banco.');
    console.log('  Amostra:', JSON.stringify(mapped.slice(0, 5), null, 1));
    return;
  }
  if (!mapped.length) return;

  // ── 4. Inserir conceitos em snomed_concepts (ignora IDs já existentes) ──
  const concepts = mapped.map((m) => ({
    concept_id: Number(m.conceptId),
    preferred_term: m.term,
    term_en: m.term,
    inn: m.inn,
    rxnorm_code: m.rxnormCode,
    semantic_axis: 'substance',
    is_active: true,
  }));
  let inserted = 0;
  for (let i = 0; i < concepts.length; i += 500) {
    const chunk = concepts.slice(i, i + 500);
    const { error: uErr } = await supabase.from('snomed_concepts').upsert(chunk, {
      onConflict: 'concept_id',
      ignoreDuplicates: true,
    });
    if (uErr) {
      console.error('❌ Erro no upsert de conceitos:', uErr.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  Conceitos: lote ${i / 500 + 1} (${inserted})`);
  }

  // ── 5. Atualizar drug_catalog por ingrediente ──
  let updatedIngs = 0;
  for (const m of mapped) {
    const { error: uErr } = await supabase
      .from('drug_catalog')
      .update({ snomed_code: m.conceptId, snomed_description: m.term })
      .eq('active_ingredient', m.ingredient)
      .is('snomed_code', null);
    if (uErr) console.error(`  ⚠️ update ${m.ingredient}:`, uErr.message);
    else updatedIngs++;
  }

  // ── 6. Resumo final ──
  const { data: after, error: e2 } = await supabase.from('drug_catalog').select('id').not('snomed_code', 'is', null);
  console.log(`\n🎉 Concluído: ${concepts.length} conceitos novos | ${updatedIngs} ingredientes atualizados`);
  console.log(`  Total no drug_catalog com SNOMED: ${after?.length || (e2 ? `(erro: ${e2.message})` : 0)}`);
}

main().catch((err) => {
  console.error('❌ Falha na execução:', err);
  process.exit(1);
});
