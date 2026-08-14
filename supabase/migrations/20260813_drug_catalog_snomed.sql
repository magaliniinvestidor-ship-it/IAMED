-- ============================================================
-- SNOMED-CT em drug_catalog
-- ============================================================
-- Adiciona o vínculo SNOMED-CT (substância/medicamento) aos
-- itens do catálogo de medicamentos, permitindo preenchimento
-- automático na receita quando o dado existir.
-- ============================================================

ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS snomed_code text,
  ADD COLUMN IF NOT EXISTS snomed_description text;
