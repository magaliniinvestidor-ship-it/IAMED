-- ============================================================
-- Backfill otimizado: SNOMED-CT no drug_catalog (v3)
-- ============================================================
-- v3: ANALYZE após criar as tabelas temporárias para o
--     planejador escolher plano de hash join (corrige timeout),
--     e processa em 2 etapas: igualdade -> prefixo.
-- ============================================================

SET statement_timeout = 0;

CREATE OR REPLACE FUNCTION public._norm_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT translate(lower(COALESCE(input, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn');
$$;

-- 1) Medicamentos sem SNOMED (normalizados 1x)
CREATE TEMP TABLE _dc_norm ON COMMIT DROP AS
SELECT
  id,
  active_ingredient,
  public._norm_text(active_ingredient) AS ai_norm
FROM public.drug_catalog
WHERE active_ingredient IS NOT NULL
  AND btrim(active_ingredient) <> ''
  AND snomed_code IS NULL;
ANALYZE _dc_norm;

-- 2) Conceitos de substância (normalizados 1x)
CREATE TEMP TABLE _sc_norm ON COMMIT DROP AS
SELECT
  concept_id,
  COALESCE(term_pt, preferred_term) AS snomed_description,
  public._norm_text(COALESCE(inn, ''))     AS inn_norm,
  public._norm_text(COALESCE(term_pt, '')) AS pt_norm
FROM public.snomed_concepts
WHERE semantic_axis = 'substance' AND is_active;
ANALYZE _sc_norm;

-- 3) Passo A: casamento EXATO (inn / term_pt)
UPDATE public.drug_catalog dc
SET snomed_code        = s.concept_id::text,
    snomed_description = s.snomed_description
FROM _dc_norm d
JOIN _sc_norm s
  ON d.ai_norm = s.inn_norm OR d.ai_norm = s.pt_norm
WHERE d.id = dc.id
  AND dc.snomed_code IS NULL;

-- 4) Remove os já preenchidos da fila (acelera o passo B)
DELETE FROM _dc_norm d
USING public.drug_catalog dc
WHERE dc.id = d.id AND dc.snomed_code IS NOT NULL;
ANALYZE _dc_norm;

-- 5) Passo B: casamento por PREFIXO (termo do conceito é início do princípio ativo)
UPDATE public.drug_catalog dc
SET snomed_code        = m.concept_id::text,
    snomed_description = m.snomed_description
FROM (
  SELECT DISTINCT ON (d.id) d.id, s.concept_id, s.snomed_description
  FROM _dc_norm d
  JOIN _sc_norm s
    ON d.ai_norm LIKE s.pt_norm || '%'
  ORDER BY d.id, length(s.pt_norm) DESC
) m
WHERE m.id = dc.id
  AND dc.snomed_code IS NULL;

DROP FUNCTION IF EXISTS public._norm_text(text);
DROP TABLE IF EXISTS _dc_norm;
DROP TABLE IF EXISTS _sc_norm;

-- ============================================================
-- Verificação
-- ============================================================
SELECT
  count(*) FILTER (WHERE snomed_code IS NOT NULL) AS preenchidos,
  count(*) FILTER (WHERE snomed_code IS NULL)     AS pendentes
FROM public.drug_catalog;