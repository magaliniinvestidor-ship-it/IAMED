-- ============================================================
-- Modelo de receita com múltiplos medicamentos (itens)
-- ============================================================
-- `prescriptions` passa a ser o CABEÇALHO da receita;
-- `prescription_items` guarda cada medicamento da receita.
-- Backfill: cada prescrição existente vira cabeçalho + 1 item.
-- ============================================================

-- 1) Sequence para IDs de itens
CREATE SEQUENCE IF NOT EXISTS public.seq_prescription_items START 1 INCREMENT 1;

-- 2) Tabela de itens
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id text PRIMARY KEY,
  prescription_id text NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 1,
  drug_name text,
  active_ingredient text,
  presentation text,
  dosage text,
  frequency text,
  route text,
  duration text,
  start_date text,
  quantity int NOT NULL DEFAULT 1,
  unit text,
  prescription_type text NOT NULL DEFAULT 'comum',
  notes text,
  snomed_code text,
  snomed_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription
  ON public.prescription_items(prescription_id);

-- 3) Título do cabeçalho (opcional)
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS title text;

-- 4) Backfill: prescrições existentes viram cabeçalho + 1 item
INSERT INTO public.prescription_items (
  id, prescription_id, position, drug_name, active_ingredient, presentation,
  dosage, frequency, route, duration, start_date, quantity, unit,
  prescription_type, notes, snomed_code, snomed_description
)
SELECT
  'pitem_' || lpad(nextval('public.seq_prescription_items')::text, 4, '0'),
  p.id, 1, p.drug_name, p.active_ingredient, p.presentation,
  p.dosage, p.frequency, p.route, p.duration, p.start_date, p.quantity, p.unit,
  p.prescription_type, p.notes, p.snomed_code, p.snomed_description
FROM public.prescriptions p
WHERE p.drug_name IS NOT NULL AND btrim(p.drug_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.prescription_items i WHERE i.prescription_id = p.id
  );

-- 5) RLS (espelha o padrão já usado em outras tabelas do HCE)
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescription_items' AND policyname = 'presc_items_select_auth'
  ) THEN
    CREATE POLICY presc_items_select_auth
      ON public.prescription_items FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescription_items' AND policyname = 'presc_items_insert_auth'
  ) THEN
    CREATE POLICY presc_items_insert_auth
      ON public.prescription_items FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescription_items' AND policyname = 'presc_items_update_auth'
  ) THEN
    CREATE POLICY presc_items_update_auth
      ON public.prescription_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescription_items' AND policyname = 'presc_items_delete_auth'
  ) THEN
    CREATE POLICY presc_items_delete_auth
      ON public.prescription_items FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 6) RPC next_clinical_id passa a aceitar prefixo 'pitem'
CREATE OR REPLACE FUNCTION public.next_clinical_id(p_prefix text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq text;
  v_num int;
BEGIN
  v_seq := CASE p_prefix
    WHEN 'presc' THEN 'seq_prescriptions'
    WHEN 'pitem' THEN 'seq_prescription_items'
    WHEN 'anam'  THEN 'seq_anamnese'
    WHEN 'soap'  THEN 'seq_soap_notes'
    WHEN 'diag'  THEN 'seq_diagnoses'
    WHEN 'exam'  THEN 'seq_exam_requests'
    WHEN 'proc'  THEN 'seq_procedures'
    WHEN 'att'   THEN 'seq_clinical_attachments'
    WHEN 'sig'   THEN 'seq_electronic_signatures'
    WHEN 'aso'   THEN 'seq_aso_exams'
    WHEN 'ac'    THEN 'seq_access_control'
    WHEN 'pexam' THEN 'seq_physical_exams'
    ELSE NULL
  END;
  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'Prefixo desconhecido: %', p_prefix;
  END IF;
  v_num := nextval(v_seq);
  RETURN p_prefix || '_' || lpad(v_num::text, 4, '0');
END$$;

GRANT EXECUTE ON FUNCTION public.next_clinical_id(text) TO authenticated;
