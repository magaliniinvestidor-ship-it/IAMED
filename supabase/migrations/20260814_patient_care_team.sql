-- ============================================================
-- Confidencialidade e Acesso (Lei 1682/2001)
-- Equipe assistencial designada ao paciente
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.seq_patient_care_team START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS public.patient_care_team (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  professional_name text NOT NULL,
  professional_id text,
  role text NOT NULL DEFAULT 'assistencial',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_care_team_patient
  ON public.patient_care_team(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_care_team_professional
  ON public.patient_care_team(professional_name);

ALTER TABLE public.patient_care_team ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_care_team' AND policyname = 'care_team_select_auth'
  ) THEN
    CREATE POLICY care_team_select_auth
      ON public.patient_care_team FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_care_team' AND policyname = 'care_team_insert_auth'
  ) THEN
    CREATE POLICY care_team_insert_auth
      ON public.patient_care_team FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_care_team' AND policyname = 'care_team_update_auth'
  ) THEN
    CREATE POLICY care_team_update_auth
      ON public.patient_care_team FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_care_team' AND policyname = 'care_team_delete_auth'
  ) THEN
    CREATE POLICY care_team_delete_auth
      ON public.patient_care_team FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- RPC next_clinical_id passa a aceitar prefixo 'ct'
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
    WHEN 'ct'    THEN 'seq_patient_care_team'
    ELSE NULL
  END;
  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'Prefixo desconhecido: %', p_prefix;
  END IF;
  v_num := nextval(v_seq);
  RETURN p_prefix || '_' || lpad(v_num::text, 4, '0');
END$$;

GRANT EXECUTE ON FUNCTION public.next_clinical_id(text) TO authenticated;