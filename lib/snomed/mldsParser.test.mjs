import { describe, it, expect } from 'vitest';
import {
  parseTsvRows,
  buildPreferredTerms,
  buildParentMap,
  resolveAxis,
  buildConcepts,
  FSN,
  SYNONYM,
  IS_A,
  PREFERRED,
  ACCEPTABLE,
} from './import/mldsParser.mjs';

const CONCEPTS_TSV = [
  'id\teffectiveTime\tactive\tmoduleId\tdefinitionStatusId',
  '38341003\t20250131\t1\t900000000000207008\t900000000000073002',
  '404684003\t20250131\t1\t900000000000207008\t900000000000074009',
  '64572001\t20250131\t1\t900000000000207008\t900000000000073002',
  '71388002\t20250131\t1\t900000000000207008\t900000000000074009',
  '999001\t20250131\t1\t900000000000207008\t900000000000073002',
].join('\n');

const DESCRIPTIONS_TSV = [
  'id\teffectiveTime\tactive\tmoduleId\tconceptId\tlanguageCode\ttypeId\tterm\tcaseSignificanceId',
  `1001\t20250131\t1\t900000000000207008\t38341003\ten\t${SYNONYM}\tHypertensive disorder\t900000000000448009`,
  `1002\t20250131\t1\t900000000000207008\t38341003\ten\t${FSN}\tHypertensive disorder (disorder)\t900000000000448009`,
  `1003\t20250131\t1\t900000000000207008\t38341003\tpt\t${SYNONYM}\tTranstorno hipertensivo\t900000000000448009`,
  `1004\t20250131\t1\t900000000000207008\t38341003\tes\t${SYNONYM}\tTrastorno hipertensivo\t900000000000448009`,
  `1005\t20250131\t1\t900000000000207008\t404684003\ten\t${SYNONYM}\tClinical finding\t900000000000448009`,
  `1006\t20250131\t1\t900000000000207008\t64572001\ten\t${SYNONYM}\tDisorder\t900000000000448009`,
  `1007\t20250131\t1\t900000000000207008\t71388002\ten\t${SYNONYM}\tProcedure\t900000000000448009`,
  `1008\t20250131\t1\t900000000000207008\t999001\ten\t${SYNONYM}\tAsthma\t900000000000448009`,
  `1009\t20250131\t1\t900000000000207008\t999001\tpt\t${SYNONYM}\tAsma\t900000000000448009`,
].join('\n');

const REFSET_TSV = [
  'id\teffectiveTime\tactive\tmoduleId\trefsetId\treferencedComponentId\tacceptabilityId',
  `r1\t20250131\t1\t900000000000207008\t900000000000509007\t1001\t${PREFERRED}`,
  `r2\t20250131\t1\t900000000000207008\t32570271000036106\t1003\t${PREFERRED}`,
  `r3\t20250131\t1\t900000000000207008\t32570271000036106\t1004\t${ACCEPTABLE}`,
].join('\n');

const REL_TSV = [
  'id\teffectiveTime\tactive\tmoduleId\tsourceId\tdestinationId\trelationshipGroup\ttypeId\tcharacteristicTypeId\tmodifierId',
  `rel1\t20250131\t1\t900000000000207008\t38341003\t64572001\t0\t${IS_A}\t900000000000011006\t900000000000451002`,
  `rel2\t20250131\t1\t900000000000207008\t999001\t404684003\t0\t${IS_A}\t900000000000011006\t900000000000451002`,
].join('\n');

describe('mldsParser (RF2)', () => {
  it('parseTsvRows ignora o header e remove \\r', () => {
    const rows = parseTsvRows(CONCEPTS_TSV);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ id: '38341003', active: '1' });
  });

  it('buildPreferredTerms usa PREFERRED do refset e prioriza synonym', () => {
    const desc = parseTsvRows(DESCRIPTIONS_TSV);
    const refset = parseTsvRows(REFSET_TSV);
    const preferred = buildPreferredTerms(desc, refset);
    expect(preferred.en.get('38341003')).toBe('Hypertensive disorder');
    expect(preferred.pt.get('38341003')).toBe('Transtorno hipertensivo');
    expect(preferred.es.get('38341003')).toBe('Trastorno hipertensivo');
    expect(preferred.en.get('999001')).toBe('Asthma');
    expect(preferred.pt.get('999001')).toBe('Asma');
  });

  it('buildParentMap monta hierarquia Is a', () => {
    const parentMap = buildParentMap(parseTsvRows(REL_TSV));
    expect(parentMap.get('38341003')?.has('64572001')).toBe(true);
    expect(parentMap.get('999001')?.has('404684003')).toBe(true);
  });

  it('resolveAxis deriva disorder via Disease (disorder)', () => {
    const parentMap = buildParentMap(parseTsvRows(REL_TSV));
    expect(resolveAxis('38341003', parentMap)).toBe('disorder');
    expect(resolveAxis('999001', parentMap)).toBe('finding');
    expect(resolveAxis('71388002', parentMap)).toBe('procedure');
    expect(resolveAxis('404684003', parentMap)).toBe('finding');
  });

  it('buildConcepts monta linhas de upsert e respeita axisFilter', () => {
    const concepts = buildConcepts({
      concepts: parseTsvRows(CONCEPTS_TSV),
      preferredTerms: buildPreferredTerms(parseTsvRows(DESCRIPTIONS_TSV), parseTsvRows(REFSET_TSV)),
      parentMap: buildParentMap(parseTsvRows(REL_TSV)),
      axisFilter: [],
    });
    expect(concepts).toHaveLength(5);
    const h = concepts.find((c) => c.concept_id === 38341003);
    expect(h).toMatchObject({
      concept_id: 38341003,
      preferred_term: 'Hypertensive disorder',
      term_pt: 'Transtorno hipertensivo',
      term_es: 'Trastorno hipertensivo',
      term_en: 'Hypertensive disorder',
      semantic_axis: 'disorder',
    });
    const filtered = buildConcepts({
      concepts: parseTsvRows(CONCEPTS_TSV),
      preferredTerms: buildPreferredTerms(parseTsvRows(DESCRIPTIONS_TSV), parseTsvRows(REFSET_TSV)),
      parentMap: buildParentMap(parseTsvRows(REL_TSV)),
      axisFilter: ['disorder'],
    });
    expect(filtered.map((c) => c.concept_id)).toContain(38341003);
    expect(filtered.map((c) => c.concept_id)).not.toContain(999001);
  });

  it('ignora conceitos inativos', () => {
    const inactive = CONCEPTS_TSV + '\n999002\t20250131\t0\t900000000000207008\t900000000000073002';
    const concepts = buildConcepts({
      concepts: parseTsvRows(inactive),
      preferredTerms: buildPreferredTerms(parseTsvRows(DESCRIPTIONS_TSV), parseTsvRows(REFSET_TSV)),
      parentMap: buildParentMap(parseTsvRows(REL_TSV)),
      axisFilter: [],
    });
    expect(concepts.find((c) => c.concept_id === 999002)).toBeUndefined();
  });
});