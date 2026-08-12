// ============================================================
// Importador oficial SNOMED CT (MLDS / RF2)
// ============================================================
// Lê os arquivos .txt (TSV) extraídos do release oficial baixado
// do MLDS (mlds.ihtsdotools.org) e faz upsert na snomed_concepts,
// separando termos por bundle (pt/es/en).
//
// Uso:
//   node scripts/import_snomed_mlds.mjs --dir <pasta-do-release> [--axis disorder,procedure,substance] [--limit 5000] [--dry-run]
//
// Estrutura esperada dentro de <pasta-do-release>:
//   Full/Terminology/sct2_Concept_Full_*.txt
//   Full/Terminology/sct2_Description_Full-pt_*.txt | -es_*.txt | -en_*.txt
//   Full/Terminology/sct2_Relationship_Full_*.txt
//   Full/Refset/Language/der2_cRefset_LanguageFull-pt_*.txt | -es_*.txt | -en_*.txt
//   Full/Refset/Content/der2_iissscRefset_ExtendedMapFull_*.txt  (CID-10, opcional)
//
// Lê credenciais de .env.local (SUPABASE_SERVICE_ROLE_KEY).
// ============================================================

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

import {
  parseTsvRows,
  buildPreferredTerms,
  buildParentMap,
  resolveAxis,
  buildConcepts,
} from '../lib/snomed/import/mldsParser.mjs';

const ROOT = path.resolve(process.cwd(), 'scripts');

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

function glob(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => pattern.test(f)).map((f) => path.join(dir, f));
}

function findFiles(base, re) {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (re.test(entry.name)) out.push(full);
    }
  };
  walk(base);
  return out;
}

const args = process.argv.slice(2);
function argVal(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const releaseDir = argVal('--dir');
const axisFilter = argVal('--axis') ? argVal('--axis').split(',').map((s) => s.trim()) : [];
const limit = argVal('--limit') ? parseInt(argVal('--limit'), 10) : 0;
const dryRun = args.includes('--dry-run');

if (!releaseDir) {
  console.error('❌ Uso: node scripts/import_snomed_mlds.mjs --dir <pasta-do-release> [--axis ...] [--limit N] [--dry-run]');
  process.exit(1);
}

const BATCH = 500;

async function main() {
  const env = readEnv();
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ── 1. Localizar arquivos ──
  const conceptFile = findFiles(releaseDir, /sct2_Concept_Full.*\.txt$/)[0];
  const relFile = findFiles(releaseDir, /sct2_Relationship_Full.*\.txt$/)[0];
  const descFiles = {
    pt: findFiles(releaseDir, /sct2_Description_Full-pt_.*\.txt$/),
    es: findFiles(releaseDir, /sct2_Description_Full-es_.*\.txt$/),
    en: findFiles(releaseDir, /sct2_Description_Full-en_.*\.txt$/),
  };
  const refsetFiles = {
    pt: findFiles(releaseDir, /der2_cRefset_LanguageFull-pt_.*\.txt$/),
    es: findFiles(releaseDir, /der2_cRefset_LanguageFull-es_.*\.txt$/),
    en: findFiles(releaseDir, /der2_cRefset_LanguageFull-en_.*\.txt$/),
  };
  const mapFiles = findFiles(releaseDir, /der2_iissscRefset_ExtendedMapFull.*\.txt$/);

  if (!conceptFile) return console.error('❌ Arquivo de conceitos (sct2_Concept_Full) não encontrado.');
  if (!relFile) return console.error('❌ Arquivo de relações (sct2_Relationship_Full) não encontrado.');

  console.log('📁 Arquivos encontrados:');
  console.log(`  Concept: ${conceptFile}`);
  console.log(`  Relationship: ${relFile}`);
  for (const lang of ['pt', 'es', 'en']) {
    console.log(`  Desc ${lang}: ${descFiles[lang].join(', ') || '(não encontrado — termo fica nulo)'}`);
    console.log(`  Refset ${lang}: ${refsetFiles[lang].join(', ') || '(não encontrado — usa fallback synonym/FSN)'}`);
  }
  console.log(`  CID-10 map: ${mapFiles[0] || '(não encontrado — cid10_code fica nulo)'}`);

  // ── 2. Parse ──
  console.log('\n⏳ Lendo e parseando arquivos...');
  const conceptsRows = parseTsvRows(fs.readFileSync(conceptFile, 'utf8'));
  const relRows = parseTsvRows(fs.readFileSync(relFile, 'utf8'));
  console.log(`  Conceitos: ${conceptsRows.length} | Relações: ${relRows.length}`);

  const allDescriptions = [];
  const allRefsets = [];
  for (const lang of ['pt', 'es', 'en']) {
    for (const f of descFiles[lang]) allDescriptions.push(...parseTsvRows(fs.readFileSync(f, 'utf8')));
    for (const f of refsetFiles[lang]) allRefsets.push(...parseTsvRows(fs.readFileSync(f, 'utf8')));
  }
  const preferredTerms = buildPreferredTerms(allDescriptions, allRefsets);
  for (const lang of ['pt', 'es', 'en']) {
    console.log(`  Termos preferidos ${lang}: ${preferredTerms[lang].size}`);
  }

  // ── 3. Eixo semântico ──
  const parentMap = buildParentMap(relRows);
  const cid10ByConcept = new Map();
  if (mapFiles[0]) {
    const mapRows = parseTsvRows(fs.readFileSync(mapFiles[0], 'utf8'));
    const groups = new Map();
    for (const row of mapRows) {
      if (row.active !== '1') continue;
      if (row.mapGroup !== '1' || row.mapPriority !== '1') continue;
      if (!row.mapTarget) continue;
      if (!groups.has(row.referencedComponentId)) groups.set(row.referencedComponentId, []);
      groups.get(row.referencedComponentId).push(row.mapTarget);
    }
    for (const [concept, targets] of groups) {
      cid10ByConcept.set(concept, [...new Set(targets)].join(','));
    }
    console.log(`  CID-10 (ExtendedMap): ${cid10ByConcept.size} conceitos mapeados`);
  }

  // ── 4. Montar conceitos ──
  let concepts = buildConcepts({ concepts: conceptsRows, preferredTerms, parentMap, axisFilter });
  if (limit > 0) concepts = concepts.slice(0, limit);
  concepts = concepts.map((c) => ({ ...c, cid10_code: cid10ByConcept.get(String(c.concept_id)) || null }));

  console.log(`\n✅ Conceitos a importar: ${concepts.length}`);
  const byAxis = {};
  for (const c of concepts) byAxis[c.semantic_axis] = (byAxis[c.semantic_axis] || 0) + 1;
  console.log('  Por eixo:', JSON.stringify(byAxis));

  if (dryRun) {
    console.log('🧪 Dry-run — nenhuma escrita no banco.');
    console.log('  Amostra:', JSON.stringify(concepts.slice(0, 5), null, 1));
    return;
  }

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Variáveis do Supabase não encontradas no .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // ── 5. Upsert em lotes ──
  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < concepts.length; i += BATCH) {
    const chunk = concepts.slice(i, i + BATCH);
    const { data, error } = await supabase.from('snomed_concepts').upsert(chunk, {
      onConflict: 'concept_id',
      ignoreDuplicates: false,
    });
    if (error) {
      console.error('❌ Erro no upsert (lote', i / BATCH + 1, '):', error.message);
      process.exit(1);
    }
    inserted += data && Array.isArray(data) ? data.length : chunk.length;
    updated += chunk.length;
    console.log(`  Lote ${i / BATCH + 1}: ${chunk.length} (${((i + chunk.length) / concepts.length) * 100 | 0}%)`);
  }
  console.log(`\n🎉 Importação concluída: ${concepts.length} conceitos (${inserted} escritos).`);
}

main().catch((err) => {
  console.error('❌ Falha na importação:', err);
  process.exit(1);
});