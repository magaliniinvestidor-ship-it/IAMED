-- ============================================================
-- Remove coluna end_date de prescription_items (não utilizada)
-- ============================================================

ALTER TABLE public.prescription_items DROP COLUMN IF EXISTS end_date;