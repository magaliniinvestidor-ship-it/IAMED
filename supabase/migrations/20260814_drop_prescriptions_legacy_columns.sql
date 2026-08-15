-- ============================================================
-- Remoção de colunas legadas do cabeçalho de receitas
-- ============================================================
-- Estas colunas eram do modelo antigo (1 medicamento por linha).
-- Desde a migração 20260813_prescription_items.sql, os medicamentos
-- ficam em prescription_items e o cabeçalho usa apenas:
--   id, patient_id, created_by, created_at, qr_code_data,
--   signed_at, signature_id, status
-- A tela (HCE / /verify) não lê nem exibe nenhuma das colunas abaixo.
-- ============================================================

ALTER TABLE public.prescriptions
  DROP COLUMN IF EXISTS prescription_type,
  DROP COLUMN IF EXISTS drug_name,
  DROP COLUMN IF EXISTS active_ingredient,
  DROP COLUMN IF EXISTS dosage,
  DROP COLUMN IF EXISTS frequency,
  DROP COLUMN IF EXISTS route,
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS end_date,
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS refill_count,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS presentation,
  DROP COLUMN IF EXISTS snomed_code,
  DROP COLUMN IF EXISTS snomed_description,
  DROP COLUMN IF EXISTS title;