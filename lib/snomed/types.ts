export type SnomedSemanticAxis =
  | 'disorder'
  | 'finding'
  | 'body_structure'
  | 'procedure'
  | 'substance'
  | 'observable'
  | 'situation'
  | 'specimen'
  | 'other';

export interface SnomedConcept {
  concept_id: number;
  preferred_term: string;
  term_pt: string | null;
  term_es: string | null;
  term_en: string | null;
  cid10_code: string | null;
  semantic_axis: SnomedSemanticAxis;
  is_active: boolean;
  rxnorm_code: string | null;
  inn: string | null;
  atc_code: string | null;
}

export interface SnomedResolvedTerm {
  term: string;
  source: 'pt' | 'es' | 'en' | 'preferred';
  bundle: SnomedBundle;
}

export type SnomedLocale = 'pt-BR' | 'pt-PT' | 'en' | 'es' | 'es-AR' | 'es-PY';

export type SnomedBundle = 'pt' | 'es' | 'en';

export interface SnomedSearchOptions {
  locale?: SnomedLocale;
  limit?: number;
  semanticAxis?: SnomedSemanticAxis;
  activeOnly?: boolean;
}
