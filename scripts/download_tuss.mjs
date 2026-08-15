// ════════════════════════════════════════════════════════════════
// download_tuss.mjs — Baixa a TUSS (ANS/Brasil) da API oficial da
// ANS (host OCL/Mendix, acesso público) e gera um SQL que:
//   1) cadastra os exames que faltam no exam_catalog (pt-BR);
//   2) grava os códigos BR em exam_catalog_codes (TUSS).
//
// Fonte oficial (aberta, sem auth):
//   https://consulta-ocl.apps.sa-1a.mendixcloud.com/rest/oclservice/ANS
//   - /source  -> tabelas TUSS (tuss-22 = "Procedimentos em saúde")
//   - /concepts/tuss-22?page=N -> conceitos (página fixa = 25 itens)
//
// Classificação por grupo de código (validada contra dados reais):
//   laboratorio          -> 403/404/405 (análises clínicas)
//   anatomia_patologica  -> 406 + biópsias (301)
//   imagem               -> 409 (US) 410 (TC) 411 (RM) + 407 cintilografias
//                           não-terapêuticas + laudos de imagem em 408
//   outro                -> 401 (provas funcionais) 402 (endoscopia)
//                           408 (intervencionista) 412 (radioterapia)
//                           413 (oftalmo) 414 (alergo) 415 (métodos gráficos)
//   (consultas 101, perícias 201, terapias 202, psicologia 500,
//    cirurgias 30x/31x e odonto 8xx ficam fora — não são exames)
//
// Uso:  node scripts/download_tuss.mjs
// Saída: scripts/output/tuss_import_<data>.sql
// Env:  ANS_BASE (base da API) | ANS_SOURCE (ex.: tuss-22)
// ════════════════════════════════════════════════════════════════

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'output');

const ANS_BASE = process.env.ANS_BASE || 'https://consulta-ocl.apps.sa-1a.mendixcloud.com/rest/oclservice/ANS';
const ANS_SOURCE = process.env.ANS_SOURCE || '';
const CONCURRENCY = 12;

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'iamed-tuss/0.1 (contact: admin)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

const PAGE_SIZE = 25;

async function discoverSource() {
  if (ANS_SOURCE) {
    const sources = await getJson(`${ANS_BASE}/source`);
    const src = sources.find(s => s.Codigo === ANS_SOURCE);
    return { code: ANS_SOURCE, total: src ? src.Total_sources : 0 };
  }
  const sources = await getJson(`${ANS_BASE}/source`);
  const found = sources.find(s => /procedimento/i.test(s.Descricao || ''));
  if (!found) {
    const avail = (sources || []).map(s => `${s.Codigo} (${s.Descricao})`).join(', ');
    throw new Error(`Fonte de procedimentos não encontrada. Disponíveis: ${avail || '(nenhuma)'}`);
  }
  return { code: found.Codigo, total: found.Total_sources || 0 };
}

function normalize(text) {
  return (text || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

const PATHOLOGY_RE = /\b(anatomopat|biopsia|citolog|citopat|histopat|congelacao|papanicolaou|imunoistoquimica|marcador tumoral)\b/i;
const IMAGING_RE = /\b(mamograf|raio x|raio-x|radiograf|densitometri|histerossalpingograf|angiograf)\b/i;
const TREATMENT_RE = /\b(tratamento|terapia|infusao|administracao|aplicacao|marcacao)\b/i;

const GROUP_LAB = new Set(['403', '404', '405']);
const GROUP_IMG = new Set(['409', '410', '411']);
const GROUP_OUTRO = new Set(['401', '402', '412', '413', '414', '415']);

function classify(code, name) {
  const n = normalize(name);
  const g = code.slice(0, 3);
  if (GROUP_LAB.has(g)) return { exam_type: 'laboratorio', category: groupCategory(g) };
  if (g === '406') return { exam_type: 'anatomia_patologica', category: 'tuss_anatomia_patologica' };
  if (GROUP_IMG.has(g)) return { exam_type: 'imagem', category: groupCategory(g) };
  if (g === '407') {
    const treatment = TREATMENT_RE.test(n);
    return { exam_type: treatment ? 'outro' : 'imagem', category: 'tuss_medicina_nuclear' };
  }
  if (g === '408') {
    if (IMAGING_RE.test(n)) return { exam_type: 'imagem', category: 'tuss_imagem' };
    return { exam_type: 'outro', category: 'tuss_intervencionista' };
  }
  if (GROUP_OUTRO.has(g)) return { exam_type: 'outro', category: groupCategory(g) };
  if (g.startsWith('30') || g.startsWith('31')) {
    if (PATHOLOGY_RE.test(n)) return { exam_type: 'anatomia_patologica', category: 'tuss_biopsias' };
    return null;
  }
  return null; // 101 consultas, 201 perícias, 202 terapias, 500 psicologia, 8xx odonto
}

function groupCategory(g) {
  const map = {
    '403': 'tuss_analises_clinicas',
    '404': 'tuss_imuno_hematologia',
    '405': 'tuss_liquor',
    '409': 'tuss_ultrassonografia',
    '410': 'tuss_tomografia',
    '411': 'tuss_ressonancia',
    '401': 'tuss_provas_funcionais',
    '402': 'tuss_endoscopia',
    '412': 'tuss_radioterapia',
    '413': 'tuss_oftalmologia',
    '414': 'tuss_alergologia',
    '415': 'tuss_metodos_graficos',
  };
  return map[g] || 'tuss_outro';
}

function isActive(fimVigencia) {
  if (!fimVigencia || fimVigencia === '-') return true;
  const d = new Date(fimVigencia);
  return !Number.isNaN(d.getTime()) && d >= new Date();
}

async function download(source, total) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const all = new Map(); // code -> item
  let page = 1;

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (true) {
      const p = page;
      if (p > totalPages) return;
      page += 1;
      const res = await fetch(`${ANS_BASE}/concepts/${source}?page=${p}`, {
        headers: { 'User-Agent': 'iamed-tuss/0.1 (contact: admin)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} página ${p}`);
      const json = await res.json();
      for (const c of json) {
        if (!c || !c.id) continue;
        if (!all.has(c.id)) {
          all.set(c.id, {
            code: c.id,
            name: (c.display_name || c.id).trim(),
            active: isActive(c.extras && c.extras.fim_vigencia),
          });
        }
      }
    }
  });

  await Promise.all(workers);
  return [...all.values()];
}

function quote(v) {
  return v.replace(/'/g, "''");
}

function main() {
  return (async () => {
    const source = await discoverSource();
    console.log(`Fonte: ${source.code} — ${source.total} conceitos (${ANS_BASE})`);
    const concepts = await download(source.code, source.total);
    console.log(`Conceitos baixados: ${concepts.length}`);

    const seen = new Map();
    const items = [];
    for (const c of concepts) {
      const cls = classify(c.code, c.name);
      if (!cls) continue;
      const key = normalize(c.name);
      if (seen.has(key)) continue;
      seen.set(key, true);
      items.push({ code: c.code, name: c.name, active: c.active, ...cls });
    }
    items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    console.log(`Exames para importar: ${items.length}`);

    const vals = items
      .map(i =>
        ` ('${quote(i.code)}', '${quote(i.name)}', '${i.exam_type}', '${i.category}', ${i.active})`)
      .join(',\n');

    const sql = `-- ============================================================
-- Import TUSS (ANS/Brasil) gerado em ${new Date().toISOString()}
-- ${items.length} exames — fonte: ANS/OCL (${source.code})
-- Observações:
--   * _norm_text() é recriada aqui porque a migration 20260813 a droppa.
--   * seq_exam_catalog é sincronizada com o seed (ecat_0001..ecat_0100)
--     para que next_exam_catalog_id() não colida com IDs existentes.
--   * Itens com fim de vigência já passado entram com active=false.
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

CREATE TEMP TABLE IF NOT EXISTS _tuss_new (code text PRIMARY KEY, name text, exam_type text, category text, active boolean);
TRUNCATE _tuss_new;
INSERT INTO _tuss_new (code, name, exam_type, category, active) VALUES
${vals};

-- 1) Novos exames que ainda não existem no catálogo (por nome pt-BR normalizado)
CREATE TEMP TABLE IF NOT EXISTS _tuss_new_rows (name text, exam_type text, category text, active boolean, id text);
TRUNCATE _tuss_new_rows;
INSERT INTO _tuss_new_rows (name, exam_type, category, active)
SELECT DISTINCT n.name, n.exam_type, n.category, n.active
FROM _tuss_new n
WHERE NOT EXISTS (
  SELECT 1 FROM public.exam_catalog_translations t
  WHERE t.locale = 'pt-BR' AND public._norm_text(t.name) = public._norm_text(n.name)
);
UPDATE _tuss_new_rows SET id = public.next_exam_catalog_id();

INSERT INTO public.exam_catalog (id, exam_type, category, active)
SELECT id, exam_type, category, active FROM _tuss_new_rows;

INSERT INTO public.exam_catalog_translations (catalog_id, locale, name)
SELECT id, 'pt-BR', name FROM _tuss_new_rows;

-- 2) Códigos BR (TUSS) para novos e existentes
INSERT INTO public.exam_catalog_codes (catalog_id, country, code, source)
SELECT COALESCE(nr.id, t.catalog_id) AS catalog_id, 'BR', n.code, 'TUSS'
FROM _tuss_new n
LEFT JOIN public.exam_catalog_translations t
  ON t.locale = 'pt-BR' AND public._norm_text(t.name) = public._norm_text(n.name)
LEFT JOIN _tuss_new_rows nr
  ON public._norm_text(nr.name) = public._norm_text(n.name)
WHERE COALESCE(nr.id, t.catalog_id) IS NOT NULL
ON CONFLICT (catalog_id, country) DO NOTHING;

-- 3) Relatório
SELECT (SELECT count(*) FROM _tuss_new_rows) AS novos_exames,
       (SELECT count(*) FROM _tuss_new) AS total_tuss;
`;

    mkdirSync(OUT_DIR, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const outFile = join(OUT_DIR, `tuss_import_${stamp}.sql`);
    writeFileSync(outFile, sql, 'utf8');
    console.log(`SQL gerado: ${outFile}`);
  })();
}

main().catch(err => {
  console.error('FALHOU:', err.message);
  process.exit(1);
});