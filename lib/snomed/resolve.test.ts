import { describe, it, expect } from 'vitest';
import {
  resolveSnomedBundle,
  resolveSnomedTerm,
  filterSnomedByQuery,
  LOCALE_TO_BUNDLE,
} from './resolve';
import type { SnomedConcept } from './types';

const mockConcept: SnomedConcept = {
  concept_id: 38341003,
  preferred_term: 'Hypertensive disorder',
  term_pt: 'Hipertensão arterial',
  term_es: 'Hipertensión arterial',
  term_en: 'Hypertensive disorder',
  cid10_code: 'I10',
  semantic_axis: 'disorder',
  is_active: true,
  rxnorm_code: null,
  inn: null,
  atc_code: null,
};

const conceptEnOnly: SnomedConcept = {
  ...mockConcept,
  concept_id: 999001,
  term_pt: null,
  term_es: null,
  term_en: 'Asthma',
  preferred_term: 'Asthma',
};

describe('resolveSnomedBundle', () => {
  it('mapeia pt-BR e pt-PT para pt', () => {
    expect(resolveSnomedBundle('pt-BR')).toBe('pt');
    expect(resolveSnomedBundle('pt-PT')).toBe('pt');
  });
  it('mapeia es, es-AR e es-PY para es', () => {
    expect(resolveSnomedBundle('es')).toBe('es');
    expect(resolveSnomedBundle('es-AR')).toBe('es');
    expect(resolveSnomedBundle('es-PY')).toBe('es');
  });
  it('mapeia en para en', () => {
    expect(resolveSnomedBundle('en')).toBe('en');
  });
  it('LOCALE_TO_BUNDLE contém todos os 6 locales', () => {
    expect(Object.keys(LOCALE_TO_BUNDLE).sort()).toEqual(
      ['en', 'es', 'es-AR', 'es-PY', 'pt-BR', 'pt-PT'].sort(),
    );
  });
});

describe('resolveSnomedTerm', () => {
  it('resolve para pt quando locale=pt-BR e há term_pt', () => {
    const r = resolveSnomedTerm(mockConcept, 'pt-BR');
    expect(r.term).toBe('Hipertensão arterial');
    expect(r.source).toBe('pt');
  });
  it('resolve para es quando locale=es-AR e há term_es', () => {
    const r = resolveSnomedTerm(mockConcept, 'es-AR');
    expect(r.term).toBe('Hipertensión arterial');
    expect(r.source).toBe('es');
  });
  it('resolve para en quando locale=en', () => {
    const r = resolveSnomedTerm(mockConcept, 'en');
    expect(r.term).toBe('Hypertensive disorder');
    expect(r.source).toBe('en');
  });
  it('cai para preferred_term quando faltam termos no bundle', () => {
    const r = resolveSnomedTerm(conceptEnOnly, 'pt-BR');
    expect(r.term).toBe('Asthma');
    expect(r.source).toBe('preferred');
  });
  it('cai para preferred quando term do bundle é string vazia', () => {
    const emptyBundle: SnomedConcept = { ...mockConcept, term_pt: '   ' };
    const r = resolveSnomedTerm(emptyBundle, 'pt-BR');
    expect(r.source).toBe('preferred');
  });
});

describe('filterSnomedByQuery', () => {
  const corpus: SnomedConcept[] = [
    { ...mockConcept, concept_id: 1 },
    { ...mockConcept, concept_id: 2, term_pt: 'Diabetes mellitus tipo 2', cid10_code: 'E11' },
    { ...mockConcept, concept_id: 3, term_pt: 'Asma', is_active: false },
    { ...conceptEnOnly, concept_id: 4, term_pt: 'Enxaqueca', term_en: 'Migraine' },
  ];

  it('retorna tudo quando query vazia e activeOnly=true (ignora inativos)', () => {
    const result = filterSnomedByQuery(corpus, '', { locale: 'pt-BR' });
    expect(result.length).toBe(3);
    expect(result.find(c => c.concept_id === 3)).toBeUndefined();
  });

  it('inclui inativos quando activeOnly=false', () => {
    const result = filterSnomedByQuery(corpus, '', { locale: 'pt-BR', activeOnly: false });
    expect(result.length).toBe(4);
  });

  it('busca por código CID-10', () => {
    const result = filterSnomedByQuery(corpus, 'E11', { locale: 'pt-BR' });
    expect(result.length).toBe(1);
    expect(result[0].concept_id).toBe(2);
  });

  it('busca por concept_id numérico', () => {
    const result = filterSnomedByQuery(corpus, '4', { locale: 'pt-BR' });
    expect(result.map(c => c.concept_id)).toContain(4);
  });

  it('busca por termo no idioma do locale', () => {
    const result = filterSnomedByQuery(corpus, 'enxaqueca', { locale: 'pt-BR' });
    expect(result.length).toBe(1);
    expect(result[0].concept_id).toBe(4);
  });

  it('busca em espanhol usa term_es quando locale=es', () => {
    const corpusEs: SnomedConcept[] = [
      { ...mockConcept, concept_id: 1, term_es: 'Diabetes tipo 2' },
    ];
    const result = filterSnomedByQuery(corpusEs, 'diabetes', { locale: 'es' });
    expect(result.length).toBe(1);
  });

  it('filtra por semanticAxis', () => {
    const result = filterSnomedByQuery(corpus, '', { locale: 'pt-BR', semanticAxis: 'disorder' });
    expect(result.every(c => c.semantic_axis === 'disorder')).toBe(true);
  });

  it('respeita limit', () => {
    const bigCorpus: SnomedConcept[] = Array.from({ length: 50 }, (_, i) => ({
      ...mockConcept,
      concept_id: i,
    }));
    const result = filterSnomedByQuery(bigCorpus, '', { locale: 'pt-BR', limit: 10 });
    expect(result.length).toBe(10);
  });
});
