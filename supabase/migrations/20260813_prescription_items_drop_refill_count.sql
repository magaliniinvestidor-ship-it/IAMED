-- ============================================================
-- Remove coluna refill_count de prescription_items (não utilizada)
-- ============================================================

ALTER TABLE public.prescription_items DROP COLUMN IF EXISTS refill_count;