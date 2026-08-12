-- ============================================================
-- SNOMED-CT em procedimentos
-- ============================================================
-- Adiciona o vínculo SNOMED-CT (procedure) aos procedimentos,
-- espelhando o padrão já usado em diagnoses e prescriptions.
-- ============================================================

ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS snomed_code text,
  ADD COLUMN IF NOT EXISTS snomed_description text;