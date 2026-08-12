// ============================================================
// Parser RF2 (MLDS) — SNOMED CT
// ============================================================
// Funções puras para ler os arquivos TSV do release oficial e
// extrair: conceitos, termos preferidos por idioma (via language
// refset) e eixo semântico (via hierarquia "Is a").
//
// Sem dependência de banco — testável isoladamente.
// ============================================================

export const FSN = '900000000000003001';
export const SYNONYM = '900000000000013009';
export const IS_A = '116680003';
export const PREFERRED = '900000000000548007';
export const ACCEPTABLE = '900000000000549004';

// Raiz da hierarquia (top-level concepts) → eixo semântico do schema
export const TOP_LEVEL_AXIS = {
  // Clinical finding → finding; Disease (disorder) → disorder
  '404684003': 'finding',
  '64572001': 'disorder',
  '71388002': 'procedure',
  '123037004': 'body_structure',
  '105590001': 'substance',
  '373873005': 'substance', // Pharmaceutical / biologic product
  '363787002': 'observable',
  '243796009': 'situation',
  '123038009': 'specimen',
};

const SUPPORTED_LANGS = ['pt', 'es', 'en'];

// ── TSV ────────────────────────────────────────────────────────
export function parseTsvRows(text) {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = cleaned.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const cells = line.split('\t');
    const row = {};
    header.forEach((col, i) => { row[col] = (cells[i] ?? '').trim(); });
    return row;
  });
}

export function findFile(files, pattern) {
  return files.find((f) => pattern.test(f));
}

// ── Termos preferidos por idioma ───────────────────────────────
// Para cada idioma-alvo, escolhe o termo preferido:
//   1. synonym marcado como PREFERRED no language refset
//   2. synonym ACCEPTABLE no language refset
//   3. qualquer synonym ativo no idioma
//   4. FSN ativo no idioma
export function buildPreferredTerms(descriptions, langRefsetRows) {
  const active = (row) => row.active === '1';
  const isSynonym = (row) => row.typeId === SYNONYM;
  const isFsn = (row) => row.typeId === FSN;

  // descId → { conceptId, term, lang } para synonyms ativos
  const synDesc = new Map();
  // conceptId → { synonym, fsn } por idioma (fallback)
  const byLang = { pt: new Map(), es: new Map(), en: new Map() };

  for (const row of descriptions) {
    if (!active(row)) continue;
    const lang = (row.languageCode || '').toLowerCase();
    if (!SUPPORTED_LANGS.includes(lang)) continue;
    if (isSynonym(row)) synDesc.set(row.id, { conceptId: row.conceptId, term: row.term, lang });
    const map = byLang[lang];
    if (!map.has(row.conceptId)) map.set(row.conceptId, {});
    const entry = map.get(row.conceptId);
    if (isSynonym(row) && !entry.synonym) entry.synonym = row.term;
    if (isFsn(row) && !entry.fsn) entry.fsn = row.term;
  }

  // conceptId → term preferido por idioma, marcado via refset
  const preferred = { pt: new Map(), es: new Map(), en: new Map() };
  for (const row of langRefsetRows) {
    if (!active(row)) continue;
    const desc = synDesc.get(row.referencedComponentId);
    if (!desc) continue;
    if (!SUPPORTED_LANGS.includes(desc.lang)) continue;
    if (row.acceptabilityId !== PREFERRED && row.acceptabilityId !== ACCEPTABLE) continue;
    const map = preferred[desc.lang];
    if (!map.has(desc.conceptId) || row.acceptabilityId === PREFERRED) {
      map.set(desc.conceptId, desc.term);
    }
  }

  // Fallback para conceitos sem entry no refset
  for (const lang of SUPPORTED_LANGS) {
    const map = preferred[lang];
    for (const [conceptId, entry] of byLang[lang]) {
      if (!map.has(conceptId)) {
        map.set(conceptId, entry.synonym || entry.fsn || '');
      }
    }
  }
  return preferred;
}

// ── Eixo semântico via "Is a" ──────────────────────────────────
// parentMap: Map(conceptId → Set(parentIds))
export function resolveAxis(conceptId, parentMap, visited = new Set()) {
  if (TOP_LEVEL_AXIS[conceptId]) return TOP_LEVEL_AXIS[conceptId];
  if (visited.has(conceptId)) return 'other';
  visited.add(conceptId);
  const parents = parentMap.get(String(conceptId)) || new Set();
  if (parents.size === 0) return 'other';
  // prioriza disorder (64572001) antes de finding (404684003)
  if (parents.has('64572001')) return 'disorder';
  for (const p of parents) {
    if (TOP_LEVEL_AXIS[p]) return TOP_LEVEL_AXIS[p];
  }
  for (const p of parents) {
    const axis = resolveAxis(p, parentMap, visited);
    if (axis !== 'other') return axis;
  }
  return 'other';
}

export function buildParentMap(relationships) {
  const parentMap = new Map();
  for (const row of relationships) {
    if (row.active !== '1' || row.typeId !== IS_A) continue;
    const source = String(row.sourceId);
    const dest = String(row.destinationId);
    if (!parentMap.has(source)) parentMap.set(source, new Set());
    parentMap.get(source).add(dest);
  }
  return parentMap;
}

// ── Monta conceitos para upsert ────────────────────────────────
// Retorna array de { concept_id, preferred_term, term_pt, term_es,
//   term_en, semantic_axis, is_active } (cid10 fica a cargo do chamador)
export function buildConcepts({ concepts, preferredTerms, parentMap, axisFilter }) {
  const out = [];
  for (const c of concepts) {
    if (c.active !== '1') continue;
    const id = String(c.id);
    const en = preferredTerms.en.get(id);
    const pt = preferredTerms.pt.get(id);
    const es = preferredTerms.es.get(id);
    const preferred = en || pt || es || c.id;
    const axis = resolveAxis(id, parentMap);
    if (axisFilter && axisFilter.length > 0 && !axisFilter.includes(axis)) continue;
    out.push({
      concept_id: parseInt(id, 10),
      preferred_term: preferred,
      term_pt: pt || null,
      term_es: es || null,
      term_en: en || null,
      semantic_axis: axis,
      is_active: true,
    });
  }
  return out;
}