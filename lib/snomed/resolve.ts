import type {
  SnomedBundle,
  SnomedConcept,
  SnomedLocale,
  SnomedResolvedTerm,
  SnomedSearchOptions,
} from './types';

const LOCALE_TO_BUNDLE: Record<SnomedLocale, SnomedBundle> = {
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  'en': 'en',
  'es': 'es',
  'es-AR': 'es',
  'es-PY': 'es',
};

const BUNDLE_FIELD: Record<SnomedBundle, 'term_pt' | 'term_es' | 'term_en'> = {
  pt: 'term_pt',
  es: 'term_es',
  en: 'term_en',
};

export function resolveSnomedBundle(locale: SnomedLocale): SnomedBundle {
  return LOCALE_TO_BUNDLE[locale] ?? 'en';
}

export function resolveSnomedTerm(
  concept: Pick<SnomedConcept, 'term_pt' | 'term_es' | 'term_en' | 'preferred_term'>,
  locale: SnomedLocale,
): SnomedResolvedTerm {
  const bundle = resolveSnomedBundle(locale);
  const localized = concept[BUNDLE_FIELD[bundle]]?.trim();
  if (localized) {
    return { term: localized, source: bundle, bundle };
  }
  const fallback = concept.preferred_term?.trim();
  if (fallback) {
    return { term: fallback, source: 'preferred', bundle };
  }
  return { term: '', source: 'preferred', bundle };
}

export function filterSnomedByQuery(
  concepts: SnomedConcept[],
  query: string,
  options: SnomedSearchOptions = {},
): SnomedConcept[] {
  const { locale, limit = 100, semanticAxis, activeOnly = true } = options;
  const bundle = locale ? resolveSnomedBundle(locale) : 'en';
  const field = BUNDLE_FIELD[bundle];
  const q = query.trim().toLowerCase();

  return concepts
    .filter(c => (activeOnly ? c.is_active : true))
    .filter(c => (semanticAxis ? c.semantic_axis === semanticAxis : true))
    .filter(c => {
      if (!q) return true;
      const cidMatch = c.cid10_code?.toLowerCase().includes(q) ?? false;
      const idMatch = String(c.concept_id).includes(q);
      if (cidMatch || idMatch) return true;
      const haystacks = [
        c.preferred_term,
        c.term_pt ?? '',
        c.term_es ?? '',
        c.term_en ?? '',
      ];
      return haystacks.some(h => h.toLowerCase().includes(q));
    })
    .slice(0, limit);
}

export { BUNDLE_FIELD, LOCALE_TO_BUNDLE };
