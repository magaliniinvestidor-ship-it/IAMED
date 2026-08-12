-- ============================================================
-- SNOMED-CT em prescrições
-- ============================================================
-- Adiciona o vínculo SNOMED-CT (substância/medicamento) às
-- prescrições, espelhando o padrão já usado em diagnoses.
-- ============================================================

ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS snomed_code text,
  ADD COLUMN IF NOT EXISTS snomed_description text;