// ════════════════════════════════════════════════════════════════
// download_pami.mjs — Baixa o Nomenclador Común (PAMI/Argentina) do
// portal de dados abertos e gera um SQL que:
//   1) cadastra os exames que faltam no exam_catalog (es-AR + pt-BR);
//   2) grava os códigos AR em exam_catalog_codes (PAMI).
//
// Fonte oficial (aberta):
//   http://datos.pami.org.ar/dataset/.../nomenclador-comun.csv
//   (módulo;código;descripción;valor) — o Nomenclador Común agrupa
//   nomencladores em "módulos": 2/7 radiologia, 3/8 ecografia,
//   5/9/34 laboratório, 22 doppler, 23 RM, 24 TC, 28 medicina nuclear,
//   131 angiografia, 19/30/38 outros funcionais. Pares (ex.: 2/7)
//   são o mesmo conteúdo com códigos distintos — a deduplicação por
//   nome mantém o primeiro código do arquivo.
//
// Classificação por módulo + palavras-chave:
//   imagem               -> 2,3,7,8,22,23,24,28 (não-terapêutico), 131
//   laboratorio          -> 5,9,34
//   anatomia_patologica  -> palavras-chave (biópsia/citologia/etc.)
//   outro                -> 19 (eletromiografia), 30 (radioterapia),
//                           38 (oftalmologia diagnóstica)
//   (consultas 1/422, fisioterapia 4/10, cirurgias 6/12/37/75,
//    medicamentos 120/910 ficam fora — não são exames)
//
// Uso:  node scripts/download_pami.mjs
// Saída: scripts/output/pami_import_<data>.sql
// Env:  PAMI_CSV_URL (url alternativa do CSV)
// ════════════════════════════════════════════════════════════════

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'output');

const PAMI_CSV_URL =
  process.env.PAMI_CSV_URL ||
  'http://datos.pami.org.ar/dataset/9937b24d-abad-45fb-8158-c1c5684d2635/resource/5d32d7a8-3d6a-4ed4-9701-6d4fd024c657/download/nomenclador-comun.csv';

function normalize(text) {
  return (text || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

const MOD_IMG = new Set(['2', '3', '7', '8', '22', '23', '24', '131']);
const MOD_LAB = new Set(['5', '9', '34']);
const MOD_FUNC = new Set(['19', '30', '38']);
const MOD_NUCLEAR = '28';

const PATHOLOGY_RE = /\b(biopsia|citologia|citologico|histopat|anatomia patologica|papanicolau|congelacion|inmunohistoquimica)\b/i;
const TREATMENT_RE = /\b(dosis|tratamiento|terapeutica|terapia|aplicacion)\b/i;

function classify(module, name) {
  const n = normalize(name);
  if (PATHOLOGY_RE.test(n)) return { exam_type: 'anatomia_patologica', category: 'pami_patologia' };
  if (module === MOD_NUCLEAR) {
    return TREATMENT_RE.test(n)
      ? { exam_type: 'outro', category: 'pami_medicina_nuclear' }
      : { exam_type: 'imagem', category: 'pami_medicina_nuclear' };
  }
  if (MOD_IMG.has(module)) return { exam_type: 'imagem', category: pamiCategory(module) };
  if (MOD_LAB.has(module)) return { exam_type: 'laboratorio', category: 'pami_laboratorio' };
  if (MOD_FUNC.has(module)) return { exam_type: 'outro', category: pamiCategory(module) };
  return null;
}

function pamiCategory(module) {
  const map = {
    '2': 'pami_radiologia',
    '3': 'pami_ecografia',
    '7': 'pami_radiologia',
    '8': 'pami_ecografia',
    '22': 'pami_doppler',
    '23': 'pami_ressonancia',
    '24': 'pami_tomografia',
    '131': 'pami_angiografia',
    '19': 'pami_eletrofisiologia',
    '30': 'pami_radioterapia',
    '38': 'pami_oftalmologia',
  };
  return map[module] || 'pami_outro';
}

function quote(v) {
  return v.replace(/'/g, "''");
}

async function main() {
  console.log(`Baixando CSV: ${PAMI_CSV_URL}`);
  const res = await fetch(PAMI_CSV_URL, { headers: { 'User-Agent': 'iamed-pami/0.1 (contact: admin)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${PAMI_CSV_URL}`);
  const buf = await res.arrayBuffer();
  const text = new TextDecoder('latin1').decode(buf);

  const seen = new Map();
  const items = [];
  for (const line of text.split('\n')) {
    if (!/^\d+;/.test(line)) continue;
    const cols = line.split(';');
    const module = cols[0].trim();
    const code = (cols[1] || '').trim();
    const name = (cols[2] || '').trim();
    if (!code || !name) continue;
    const cls = classify(module, name);
    if (!cls) continue;
    const key = normalize(name);
    if (seen.has(key)) continue;
    seen.set(key, true);
    items.push({ code, name, ...cls });
  }
  items.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  console.log(`Exames para importar: ${items.length}`);

  const byType = {};
  for (const i of items) byType[i.exam_type] = (byType[i.exam_type] || 0) + 1;
  console.log('breakdown:', JSON.stringify(byType));

  const vals = items
    .map(i => ` ('${quote(i.code)}', '${quote(i.name)}', '${i.exam_type}', '${i.category}')`)
    .join(',\n');

  const sql = `-- ============================================================
-- Import Nomenclador PAMI (Argentina) gerado em ${new Date().toISOString()}
-- ${items.length} exames — fonte: PAMI / datos.gob.ar
-- Observações:
--   * _norm_text() é recriada aqui (a migration 20260813 a droppa).
--   * seq_exam_catalog é sincronizada para que next_exam_catalog_id()
--     não colida com IDs existentes.
--   * A descrição fica em es (nome real do nomenclador). O nome pt-BR
--     é opcional; se não houver tradução o app usa o es como fallback.
-- Rode com a role autenticada (as políticas RLS permitem).
-- ============================================================

CREATE OR REPLACE FUNCTION public._norm_text(input text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT translate(lower(COALESCE(input, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
$$;

SELECT setval('public.seq_exam_catalog',
  GREATEST((SELECT COALESCE(MAX((regexp_replace(id, '^ecat_', ''))::int), 0)
            FROM public.exam_catalog), 0));

CREATE TEMP TABLE IF NOT EXISTS _pami_new (code text PRIMARY KEY, name text, exam_type text, category text);
TRUNCATE _pami_new;
INSERT INTO _pami_new (code, name, exam_type, category) VALUES
${vals};

-- 1) Novos exames que ainda não existem no catálogo (por nome es normalizado)
CREATE TEMP TABLE IF NOT EXISTS _pami_new_rows (name text, exam_type text, category text, id text);
TRUNCATE _pami_new_rows;
INSERT INTO _pami_new_rows (name, exam_type, category)
SELECT DISTINCT n.name, n.exam_type, n.category
FROM _pami_new n
WHERE NOT EXISTS (
  SELECT 1 FROM public.exam_catalog_translations t
  WHERE t.locale = 'es' AND public._norm_text(t.name) = public._norm_text(n.name)
) AND NOT EXISTS (
  SELECT 1 FROM public.exam_catalog_translations t
  WHERE t.locale = 'pt-BR' AND public._norm_text(t.name) = public._norm_text(n.name)
);
UPDATE _pami_new_rows SET id = public.next_exam_catalog_id();

INSERT INTO public.exam_catalog (id, exam_type, category)
SELECT id, exam_type, category FROM _pami_new_rows;

INSERT INTO public.exam_catalog_translations (catalog_id, locale, name)
SELECT id, 'es', name FROM _pami_new_rows;

-- 2) Códigos AR (PAMI) para novos e existentes
-- Prioridade: novo exame criado (es) > catálogo existente em es > em pt-BR
INSERT INTO public.exam_catalog_codes (catalog_id, country, code, source)
SELECT COALESCE(
         nr.id,
         (SELECT t.catalog_id FROM public.exam_catalog_translations t
           WHERE t.locale = 'es' AND public._norm_text(t.name) = public._norm_text(n.name) LIMIT 1),
         (SELECT t.catalog_id FROM public.exam_catalog_translations t
           WHERE t.locale = 'pt-BR' AND public._norm_text(t.name) = public._norm_text(n.name) LIMIT 1)
       ) AS catalog_id, 'AR', n.code, 'PAMI'
FROM _pami_new n
LEFT JOIN _pami_new_rows nr
  ON public._norm_text(nr.name) = public._norm_text(n.name)
WHERE COALESCE(
         nr.id,
         (SELECT t.catalog_id FROM public.exam_catalog_translations t
           WHERE t.locale = 'es' AND public._norm_text(t.name) = public._norm_text(n.name) LIMIT 1),
         (SELECT t.catalog_id FROM public.exam_catalog_translations t
           WHERE t.locale = 'pt-BR' AND public._norm_text(t.name) = public._norm_text(n.name) LIMIT 1)
       ) IS NOT NULL
ON CONFLICT (catalog_id, country) DO NOTHING;

-- 3) Relatório
SELECT (SELECT count(*) FROM _pami_new_rows) AS novos_exames,
       (SELECT count(*) FROM _pami_new) AS total_pami;
`;

  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = join(OUT_DIR, `pami_import_${stamp}.sql`);
  writeFileSync(outFile, sql, 'utf8');
  console.log(`SQL gerado: ${outFile}`);
}

main().catch(err => {
  console.error('FALHOU:', err.message);
  process.exit(1);
});