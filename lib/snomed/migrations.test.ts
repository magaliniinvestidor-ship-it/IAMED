import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

interface SeedRow {
  id: number;
  term: string;
}

function parseSeed(fileName: string): SeedRow[] {
  const raw = readFileSync(join(MIGRATIONS_DIR, fileName), 'utf8');
  const rows: SeedRow[] = [];
  for (const line of raw.split('\n')) {
    const m = /^\s*\((\d+),\s*'([^']*)'/.exec(line);
    if (m) rows.push({ id: Number(m[1]), term: m[2] });
  }
  return rows;
}

// Conceitos do v1 que foram descartados pelo DISTINCT ON do v1 e que o v2
// já cobre com dados melhores — NÃO devem ser duplicados na fix.
const COVERED_BY_V2 = [
  'Acetaminophen',
  'Ibuprofen',
  'Metformin',
  'Atorvastatin',
  'Losartan',
  'Enalapril',
  'Omeprazole',
  'Salbutamol',
  'Insulin',
];

function droppedByDistinctOn(rows: SeedRow[]): SeedRow[] {
  const seen = new Set<number>();
  const dropped: SeedRow[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) dropped.push(r);
    else seen.add(r.id);
  }
  return dropped;
}

describe('migrations SNOMED-CT (integridade do seed)', () => {
  const v1 = parseSeed('20260812_snomed_ct.sql');
  const v2 = parseSeed('20260812_snomed_ct_v2.sql');
  const fix = parseSeed('20260812_snomed_ct_fix.sql');

  it('v2 e fix não têm concept_id duplicados (regressão do bug do v1)', () => {
    expect(v2.length).toBe(new Set(v2.map(r => r.id)).size);
    expect(fix.length).toBe(new Set(fix.map(r => r.id)).size);
  });

  it('IDs da fix não colidem com v1/v2 (1019 = placeholders, 363746003 = Faringite oficial)', () => {
    const existing = new Set([...v1, ...v2].map(r => r.id));
    for (const row of fix) {
      expect(existing.has(row.id)).toBe(false);
    }
    const placeholders = fix.filter(r => r.id !== 363746003);
    expect(placeholders.every(r => r.id >= 1019000001 && r.id <= 1019000064)).toBe(true);
  });

  it('fix cobre todos os conceitos perdidos pelo DISTINCT ON do v1 (exceto os cobertos pelo v2)', () => {
    const dropped = droppedByDistinctOn(v1).filter(r => !COVERED_BY_V2.includes(r.term));
    expect(dropped.length).toBe(55);
    const fixTerms = new Set(fix.map(r => r.term));
    for (const d of dropped) {
      expect(fixTerms.has(d.term), `conceito faltando na fix: ${d.term}`).toBe(true);
    }
  });

  it('fix não duplica os medicamentos já cobertos pelo v2', () => {
    const fixTerms = new Set(fix.map(r => r.term));
    for (const term of COVERED_BY_V2) {
      expect(fixTerms.has(term)).toBe(false);
    }
  });

  it('conflito 39579001 (v1 Faringite × v2 Anafilaxia) é resolvido na fix', () => {
    const fixStatements = readFileSync(join(MIGRATIONS_DIR, '20260812_snomed_ct_fix.sql'), 'utf8');
    expect(fixStatements).toContain("AND preferred_term = 'Pharyngitis'");
    expect(fixStatements).toContain('(363746003, \'Pharyngitis\', \'Faringite\'');
  });
});