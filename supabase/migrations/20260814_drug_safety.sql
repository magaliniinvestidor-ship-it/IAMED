-- ============================================================
-- Segurança medicamentosa (Receituário Eletrônico)
-- 1) Tabela de interações medicamentosas
-- 2) Colunas pediátricas/gestação/lactação e advertências no drug_catalog
-- ============================================================

-- 1) Sequence para IDs de interações
CREATE SEQUENCE IF NOT EXISTS public.seq_drug_interactions START 1 INCREMENT 1;

-- 2) Tabela de interações
CREATE TABLE IF NOT EXISTS public.drug_interactions (
  id text PRIMARY KEY,
  drug_a text NOT NULL,
  drug_b text NOT NULL,
  drug_a_ingredient text,
  drug_b_ingredient text,
  severity text NOT NULL DEFAULT 'moderada'
    CHECK (severity IN ('leve', 'moderada', 'grave', 'contraindicado')),
  description text,
  recommendation text,
  source text DEFAULT 'local'
    CHECK (source IN ('local', 'dinavisa', 'anvisa', 'fda', 'infarmed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Caso a tabela já exista (criada antes desta migração), garante as colunas novas
ALTER TABLE public.drug_interactions
  ADD COLUMN IF NOT EXISTS drug_a_ingredient text;
ALTER TABLE public.drug_interactions
  ADD COLUMN IF NOT EXISTS drug_b_ingredient text;
ALTER TABLE public.drug_interactions
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'local';

CREATE INDEX IF NOT EXISTS idx_drug_interactions_a
  ON public.drug_interactions(drug_a_ingredient);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_b
  ON public.drug_interactions(drug_b_ingredient);

-- 3) Colunas de segurança no drug_catalog
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS common_dose_pediatric text DEFAULT '';
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS min_age_months int DEFAULT 0;
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS max_age_months int;
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS pregnant_category text DEFAULT '';
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS breastfeeding_safe boolean DEFAULT true;
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS contraindications text[] DEFAULT '{}';
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS side_effects text[] DEFAULT '{}';

-- 4) RLS (espelha padrão do HCE)
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'drug_interactions' AND policyname = 'drug_interactions_select_auth'
  ) THEN
    CREATE POLICY drug_interactions_select_auth
      ON public.drug_interactions FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 5) RPC next_clinical_id passa a aceitar prefixo 'int'
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
    WHEN 'int'   THEN 'seq_drug_interactions'
    ELSE NULL
  END;
  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'Prefixo desconhecido: %', p_prefix;
  END IF;
  v_num := nextval(v_seq);
  RETURN p_prefix || '_' || lpad(v_num::text, 4, '0');
END$$;

GRANT EXECUTE ON FUNCTION public.next_clinical_id(text) TO authenticated;