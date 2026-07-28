-- =====================================================
-- CRIAÇÃO DAS TABELAS DO MÓDULO 3 - PRONTUÁRIO HCE
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. TABELA: anamnese
-- Estrutura baseada na interface Anamnese (lib/mockData.ts:46-67)
CREATE TABLE IF NOT EXISTS public.anamnese (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Histórico Pessoal Patológico (array de strings)
  personal_pathological text[] DEFAULT '{}',
  
  -- Hábitos de Vida
  smoking text DEFAULT '',
  alcohol text DEFAULT '',
  physical_activity text DEFAULT '',
  diet text DEFAULT '',
  sleep text DEFAULT '',
  
  -- Histórico Familiar (JSON array)
  family_history jsonb DEFAULT '[]',
  
  -- Alergias (JSON array)
  allergies jsonb DEFAULT '[]',
  
  -- Medicamentos em Uso (JSON array)
  current_medications jsonb DEFAULT '[]',
  
  -- Histórico Cirúrgico (JSON array)
  surgical_history jsonb DEFAULT '[]',
  
  -- Dados Ginecológicos (JSON nullable)
  gynecological jsonb DEFAULT NULL,
  
  -- Dados Obstétricos (JSON nullable)
  obstetric jsonb DEFAULT NULL,
  
  -- Dados Pessoais
  occupation text DEFAULT '',
  marital_status text DEFAULT '',
  
  -- Observações Gerais
  notes text DEFAULT ''
);

-- Índices para anamnese
CREATE INDEX IF NOT EXISTS idx_anamnese_patient_id ON public.anamnese(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnese_created_at ON public.anamnese(created_at DESC);

-- RLS (Row Level Security) para anamnese
ALTER TABLE public.anamnese ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to anamnese" ON public.anamnese
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 2. TABELA: physical_exams
-- Estrutura baseada na interface PhysicalExam (lib/mockData.ts:118-140)
CREATE TABLE IF NOT EXISTS public.physical_exams (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  clinical_history_id text DEFAULT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Sinais Vitais (JSON)
  vital_signs jsonb DEFAULT NULL,
  
  -- Exame por Região/Systems
  exam_head_neck text DEFAULT '',
  exam_cardiovascular text DEFAULT '',
  exam_respiratory text DEFAULT '',
  exam_abdomen text DEFAULT '',
  exam_genitourinary text DEFAULT '',
  exam_musculoskeletal text DEFAULT '',
  exam_neurological text DEFAULT '',
  exam_skin text DEFAULT '',
  exam_eyes text DEFAULT '',
  exam_ears text DEFAULT '',
  exam_mouth text DEFAULT '',
  exam_rectal text DEFAULT '',
  exam_psychiatric text DEFAULT '',
  
  -- Aspecto Geral
  general_aspect text DEFAULT '',
  
  -- Observações
  notes text DEFAULT ''
);

-- Índices para physical_exams
CREATE INDEX IF NOT EXISTS idx_physical_exams_patient_id ON public.physical_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_physical_exams_created_at ON public.physical_exams(created_at DESC);

-- RLS para physical_exams
ALTER TABLE public.physical_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to physical_exams" ON public.physical_exams
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 3. TABELA: soap_notes
-- Estrutura baseada na interface SoapNote (lib/mockData.ts:156-167)
CREATE TABLE IF NOT EXISTS public.soap_notes (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  clinical_history_id text DEFAULT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Modelo SOAP
  subjective text DEFAULT '',    -- Subjetivo (queixa principal, história da doença)
  objective text DEFAULT '',     -- Objetivo (exame físico, sinais vitais, achados)
  assessment text DEFAULT '',    -- Avaliação (hipótese diagnóstica, CID-10)
  plan text DEFAULT '',          -- Plano (conduta terapêutica, prescrições)
  
  -- Observações Adicionais
  notes text DEFAULT ''
);

-- Índices para soap_notes
CREATE INDEX IF NOT EXISTS idx_soap_notes_patient_id ON public.soap_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_created_at ON public.soap_notes(created_at DESC);

-- RLS para soap_notes
ALTER TABLE public.soap_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to soap_notes" ON public.soap_notes
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 4. TABELA: diagnoses
-- Estrutura baseada na interface Diagnosis (lib/mockData.ts:172-185)
CREATE TABLE IF NOT EXISTS public.diagnoses (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  clinical_history_id text DEFAULT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  cid10_code text NOT NULL,
  cid10_description text DEFAULT '',
  snomed_code text DEFAULT NULL,
  snomed_description text DEFAULT NULL,
  diagnosis_type text DEFAULT 'principal',
  status text DEFAULT 'ativo',
  notes text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_patient_id ON public.diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON public.diagnoses(created_at DESC);

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to diagnoses" ON public.diagnoses
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 5. TABELA: prescriptions
-- Estrutura baseada na interface Prescription (lib/mockData.ts:228-251)
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  clinical_history_id text DEFAULT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  prescription_type text DEFAULT 'comum',
  drug_name text NOT NULL,
  active_ingredient text DEFAULT '',
  dosage text DEFAULT '',
  frequency text DEFAULT '',
  route text DEFAULT 'oral',
  duration text DEFAULT '',
  start_date date DEFAULT CURRENT_DATE,
  end_date date DEFAULT NULL,
  quantity integer DEFAULT 1,
  unit text DEFAULT 'unidade',
  refill_count integer DEFAULT 0,
  notes text DEFAULT '',
  qr_code_data text DEFAULT '',
  signed_at timestamp with time zone DEFAULT NULL,
  signature_id text DEFAULT NULL,
  status text DEFAULT 'rascunho'
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON public.prescriptions(created_at DESC);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to prescriptions" ON public.prescriptions
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 6. TABELA: exam_requests
-- Estrutura baseada na interface ExamRequest (lib/mockData.ts:256-274)
CREATE TABLE IF NOT EXISTS public.exam_requests (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  clinical_history_id text DEFAULT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  exam_type text DEFAULT 'laboratorio',
  exam_name text NOT NULL,
  clinical_indication text DEFAULT '',
  urgency text DEFAULT 'rotina',
  status text DEFAULT 'solicitado',
  result_notes text DEFAULT '',
  result_date date DEFAULT NULL,
  result_file_url text DEFAULT '',
  result_file_name text DEFAULT '',
  signed_by text DEFAULT NULL,
  signed_at timestamp with time zone DEFAULT NULL,
  signature_id text DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_exam_requests_patient_id ON public.exam_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_exam_requests_created_at ON public.exam_requests(created_at DESC);

ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to exam_requests" ON public.exam_requests
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 7. TABELA: procedures
-- Estrutura baseada na interface Procedure (lib/mockData.ts:279-296)
CREATE TABLE IF NOT EXISTS public.procedures (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  clinical_history_id text DEFAULT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  procedure_code text NOT NULL,
  procedure_name text NOT NULL,
  procedure_category text DEFAULT '',
  quantity integer DEFAULT 1,
  notes text DEFAULT '',
  complications text DEFAULT '',
  status text DEFAULT 'programado',
  performed_at timestamp with time zone DEFAULT NULL,
  signed_by text DEFAULT NULL,
  signed_at timestamp with time zone DEFAULT NULL,
  signature_id text DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_procedures_patient_id ON public.procedures(patient_id);
CREATE INDEX IF NOT EXISTS idx_procedures_created_at ON public.procedures(created_at DESC);

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to procedures" ON public.procedures
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 8. TABELA: clinical_attachments
-- Estrutura baseada na interface ClinicalAttachment (lib/mockData.ts:301-318)
CREATE TABLE IF NOT EXISTS public.clinical_attachments (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  clinical_history_id text DEFAULT NULL,
  exam_request_id text DEFAULT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  file_name text NOT NULL,
  file_path text DEFAULT '',
  file_size_bytes integer DEFAULT 0,
  mime_type text DEFAULT 'application/octet-stream',
  category text DEFAULT 'outro',
  description text DEFAULT '',
  is_sensitive boolean DEFAULT false,
  signed_by text DEFAULT NULL,
  signed_at timestamp with time zone DEFAULT NULL,
  signature_id text DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_clinical_attachments_patient_id ON public.clinical_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_attachments_created_at ON public.clinical_attachments(created_at DESC);

ALTER TABLE public.clinical_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to clinical_attachments" ON public.clinical_attachments
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 9. TABELA: electronic_signatures
-- Estrutura baseada na interface ElectronicSignature (lib/mockData.ts:323-345)
CREATE TABLE IF NOT EXISTS public.electronic_signatures (
  id text PRIMARY KEY,
  signer_id text NOT NULL,
  signer_name text NOT NULL,
  signer_council text DEFAULT '',
  signer_council_number text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  document_type text NOT NULL,
  document_id text NOT NULL,
  patient_id text NOT NULL,
  signature_hash text DEFAULT '',
  certificate_serial text DEFAULT '',
  certificate_issuer text DEFAULT '',
  certificate_valid_from timestamp with time zone DEFAULT NULL,
  certificate_valid_to timestamp with time zone DEFAULT NULL,
  timestamp_token text DEFAULT '',
  timestamp_authority text DEFAULT 'IAMED-TSA',
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  signed_at timestamp with time zone DEFAULT NULL,
  verification_code text DEFAULT '',
  status text DEFAULT 'valida'
);

CREATE INDEX IF NOT EXISTS idx_electronic_signatures_patient_id ON public.electronic_signatures(patient_id);
CREATE INDEX IF NOT EXISTS idx_electronic_signatures_created_at ON public.electronic_signatures(created_at DESC);

ALTER TABLE public.electronic_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to electronic_signatures" ON public.electronic_signatures
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 10. TABELA: access_controls
-- Estrutura baseada na interface AccessControl (lib/mockData.ts:350-361)
CREATE TABLE IF NOT EXISTS public.access_controls (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  accessed_by text NOT NULL,
  accessed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  access_type text DEFAULT 'normal',
  justification text DEFAULT '',
  fields_accessed text[] DEFAULT '{}',
  ip_address text DEFAULT '',
  notified_privacy_officer boolean DEFAULT false,
  notification_sent_at timestamp with time zone DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_access_controls_patient_id ON public.access_controls(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_controls_accessed_at ON public.access_controls(accessed_at DESC);

ALTER TABLE public.access_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to access_controls" ON public.access_controls
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================

-- 11. TABELA: patient_timeline
-- Estrutura baseada na interface PatientTimelineEvent (lib/mockData.ts:366-378)
CREATE TABLE IF NOT EXISTS public.patient_timeline (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  
  event_type text NOT NULL,
  event_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  event_title text DEFAULT '',
  event_description text DEFAULT '',
  event_source text DEFAULT '',
  event_source_id text DEFAULT '',
  doctor_name text DEFAULT '',
  specialty text DEFAULT '',
  cid10_code text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patient_timeline_patient_id ON public.patient_timeline(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_timeline_event_date ON public.patient_timeline(event_date DESC);

ALTER TABLE public.patient_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to patient_timeline" ON public.patient_timeline
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  'Tabelas criadas com sucesso!' as status,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anamnese') as anamnese,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'physical_exams') as physical_exams,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'soap_notes') as soap_notes,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diagnoses') as diagnoses,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prescriptions') as prescriptions,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exam_requests') as exam_requests,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'procedures') as procedures,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinical_attachments') as clinical_attachments,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'electronic_signatures') as electronic_signatures,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'access_controls') as access_controls,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_timeline') as patient_timeline;