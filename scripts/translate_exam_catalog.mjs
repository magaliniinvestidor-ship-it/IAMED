// ════════════════════════════════════════════════════════════════
// translate_exam_catalog.mjs — Traduz os nomes dos exames importados
// (TUSS=pt-BR, PAMI=es) para todos os locales e gera um SQL que
// preenche exam_catalog_translations.
//
// Estratégia:
//   * Lê os SQLs gerados em scripts/output/tuss_import_*.sql (pt-BR)
//     e pami_import_*.sql (es) e extrai os nomes únicos.
//   * Traduz com a API gratuita do Google Translate (sem chave).
//       pt-BR -> pt-PT, es, en   (es-AR/es-PY reusam o es)
//       es    -> pt-BR, pt-PT, en (es-AR/es-PY reusam o es)
//   * Cache em scripts/output/translations_cache.json permite
//     retomar se cair no meio.
//   * Gera scripts/output/translations_<data>.sql (idempotente;
//     casa os nomes no banco por _norm_text e insere onde faltar).
//
// Env opcionais: TRANSLATE_BASE (default Google), CONCURRENCY,
// RATE_DELAY_MS. Para usar DeepL: DEEPL_KEY e TRANSLATE_BASE aponta
// para a API do DeepL (v2). Apenas o fluxo Google é implementado aqui.
//
// Uso:  node scripts/translate_exam_catalog.mjs
// ════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'output');
const CACHE_FILE = join(OUT_DIR, 'translations_cache.json');

const GOOGLE = 'https://translate.googleapis.com/translate_a/single';
const TRANSLATE_BASE = process.env.TRANSLATE_BASE || GOOGLE;
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const RATE_DELAY_MS = Number(process.env.RATE_DELAY_MS || 60);

function normalize(text) {
  return (text || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function unescapeSql(s) {
  return s.replace(/''/g, "'");
}

function parseRows(filePath) {
  if (!existsSync(filePath)) return [];
  const txt = readFileSync(filePath, 'utf8');
  const rows = [];
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*\('([^']+)',\s*'((?:[^']|'')*)'/);
    if (m) rows.push({ code: m[1], name: unescapeSql(m[2]) });
  }
  return rows;
}

function collectNames() {
  const names = new Map(); // key -> { src_locale, name }
  const tussFiles = readdirSync(OUT_DIR).filter(f => matchGlob(f, 'tuss_import_*.sql'));
  const pamiFiles = readdirSync(OUT_DIR).filter(f => matchGlob(f, 'pami_import_*.sql'));
  for (const f of tussFiles) {
    for (const r of parseRows(join(OUT_DIR, f))) {
      const k = 'pt-BR|' + normalize(r.name);
      if (!names.has(k)) names.set(k, { src_locale: 'pt-BR', name: r.name });
    }
  }
  for (const f of pamiFiles) {
    for (const r of parseRows(join(OUT_DIR, f))) {
      const k = 'es|' + normalize(r.name);
      if (!names.has(k)) names.set(k, { src_locale: 'es', name: r.name });
    }
  }
  return names;
}

function matchGlob(name, pattern) {
  const re = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
  return re.test(name);
}

async function translateGoogle(text, sl, tl) {
  const url = `${TRANSLATE_BASE}?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  const out = j && j[0] && j[0][0] && j[0][0][0];
  if (typeof out !== 'string' || !out) throw new Error('Resposta inválida do tradutor');
  return out;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function translateWithRetry(item, tl) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await translateGoogle(item.name, item.src_locale, tl);
    } catch (e) {
      lastErr = e;
      await sleep(400 * (attempt + 1));
    }
  }
  throw new Error(`tradução ${item.src_locale}->${tl} de "${item.name.slice(0, 40)}" falhou: ${lastErr.message}`);
}

function quote(v) {
  return v.replace(/'/g, "''");
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function buildCsv(flat) {
  const header = 'src_locale,src_name,locale,name';
  const lines = flat.map(e =>
    [csvCell(e.src_locale), csvCell(e.src_name), csvCell(e.locale), csvCell(e.name)].join(','));
  return [header, ...lines].join('\n');
}

function buildSql(entries) {
  const vals = entries
    .map(e => ` ('${e.src_locale}', '${quote(e.src_name)}', '${e.locale}', '${quote(e.name)}')`)
    .join(',\n');

  return `-- ============================================================
-- Traduções de exames gerado em ${new Date().toISOString()}
-- ${entries.length} traduções (TUSS pt-BR e PAMI es -> todos os locales)
-- Casa os nomes no catálogo via _norm_text e insere onde faltar.
-- Idempotente: ON CONFLICT DO NOTHING.
-- ============================================================

CREATE OR REPLACE FUNCTION public._norm_text(input text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT translate(lower(COALESCE(input, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
$$;

CREATE TEMP TABLE IF NOT EXISTS _exam_tr (src_locale text, src_name text, locale text, name text);
TRUNCATE _exam_tr;
INSERT INTO _exam_tr (src_locale, src_name, locale, name) VALUES
${vals};

INSERT INTO public.exam_catalog_translations (catalog_id, locale, name)
SELECT DISTINCT t.catalog_id, x.locale, x.name
FROM _exam_tr x
JOIN public.exam_catalog_translations t
  ON t.locale = x.src_locale
 AND public._norm_text(t.name) = public._norm_text(x.src_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exam_catalog_translations e
  WHERE e.catalog_id = t.catalog_id AND e.locale = x.locale
)
ON CONFLICT (catalog_id, locale) DO NOTHING;

SELECT (SELECT count(DISTINCT catalog_id) FROM public.exam_catalog_translations) AS catalogs_com_traducao;
`;
}

async function main() {
  const names = collectNames();
  const items = [...names.values()];
  console.log(`Nomes únicos a traduzir: ${items.length}`);

  const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
  const entries = [];
  let calls = 0;

  const targets = (src) =>
    src === 'pt-BR'
      ? ['pt-PT', 'es', 'en']
      : ['pt-BR', 'pt-PT', 'en'];

  let idx = 0;
  const worker = async () => {
    while (idx < items.length) {
      const item = items[idx++];
      const key = item.src_locale + '|' + normalize(item.name);
      const cached = cache[key] || {};
      const tls = targets(item.src_locale);

      const row = { src_locale: item.src_locale, src_name: item.name };
      const out = {};
      for (const tl of tls) {
        if (cached[tl]) {
          out[tl] = cached[tl];
        } else {
          out[tl] = await translateWithRetry(item, tl);
          calls++;
          if (RATE_DELAY_MS > 0) await sleep(RATE_DELAY_MS);
        }
      }

      // es -> es-AR/es-PY (reuso); pt-BR -> es-AR/es-PY (reuso do es)
      const esVal = out.es || item.name;
      row.locales = { ...out, 'es-AR': esVal, 'es-PY': esVal };

      cache[key] = out;
      entries.push(row);
      if (calls % 25 === 0) writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 0), 'utf8');
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 0), 'utf8');
  console.log(`Itens processados: ${entries.length} (${calls} chamadas novas de tradução)`);

  const flat = [];
  for (const e of entries) {
    for (const [locale, name] of Object.entries(e.locales)) {
      if (!locale || !name) continue;
      flat.push({ src_locale: e.src_locale, src_name: e.src_name, locale, name });
    }
  }

  const sql = buildSql(flat);
  const csv = buildCsv(flat);
  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = join(OUT_DIR, `translations_${stamp}.sql`);
  const csvFile = join(OUT_DIR, `translations_${stamp}.csv`);
  writeFileSync(outFile, sql, 'utf8');
  writeFileSync(csvFile, csv, 'utf8');
  console.log(`SQL gerado: ${outFile} (${flat.length} linhas)`);
  console.log(`CSV gerado: ${csvFile}`);
}

main().catch(err => {
  console.error('FALHOU:', err.message);
  process.exit(1);
});