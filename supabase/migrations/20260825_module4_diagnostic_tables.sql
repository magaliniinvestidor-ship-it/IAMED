-- ============================================================
-- Módulo 4 — Diagnóstico por Imagens e Laboratório
-- Tabelas: PACS/DICOM, Laudos, Worklist, HL7, FHIR, Lab
-- Idempotente — seguro para rodar múltiplas vezes
-- ============================================================

-- ── PACS / DICOM ──

CREATE TABLE IF NOT EXISTS public.dicom_studies (
  id text NOT NULL PRIMARY KEY,
  study_instance_uid text NOT NULL,
  accession_number text NOT NULL,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  modality text NOT NULL,
  modality_name text DEFAULT '' NOT NULL,
  body_part text DEFAULT '' NOT NULL,
  study_description text DEFAULT '' NOT NULL,
  clinical_history text DEFAULT '',
  referring_physician text DEFAULT '' NOT NULL,
  performing_physician text DEFAULT '',
  institution_name text DEFAULT 'IAMED Centro Médico',
  station_name text DEFAULT '',
  scheduled_at timestamptz NOT NULL,
  performed_at timestamptz,
  status text DEFAULT 'agendado' NOT NULL,
  series_count integer DEFAULT 0,
  instance_count integer DEFAULT 0,
  thumbnail_url text DEFAULT '',
  dicom_file_ref text DEFAULT '',
  pacs_server_id text DEFAULT 'PACS-MAIN',
  vendor text DEFAULT '',
  mwl_entry_id text,
  report_id text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT dicom_studies_modality_check CHECK (modality IN ('RX','TC','RM','US','MG','PET','XA')),
  CONSTRAINT dicom_studies_status_check CHECK (status IN ('agendado','em_execucao','laudo_pendente','laudado','cancelado'))
);

CREATE TABLE IF NOT EXISTS public.dicom_annotations (
  id text NOT NULL PRIMARY KEY,
  study_id text NOT NULL,
  series_number integer DEFAULT 1 NOT NULL,
  instance_number integer DEFAULT 1 NOT NULL,
  annotation_type text NOT NULL,
  x numeric DEFAULT 0 NOT NULL,
  y numeric DEFAULT 0 NOT NULL,
  width numeric,
  height numeric,
  label text DEFAULT '',
  value text DEFAULT '',
  unit text DEFAULT '',
  created_by text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT dicom_annotations_annotation_type_check CHECK (annotation_type IN ('arrow','circle','ruler','angle','text','roi'))
);

-- FK (adiciona só se não existir)
DO $$ BEGIN
  ALTER TABLE public.dicom_annotations ADD CONSTRAINT dicom_annotations_study_id_fkey
    FOREIGN KEY (study_id) REFERENCES public.dicom_studies(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── WORKLIST DICOM ──

CREATE TABLE IF NOT EXISTS public.dicom_worklist (
  id text NOT NULL PRIMARY KEY,
  step_id text NOT NULL,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  patient_birthdate date NOT NULL,
  patient_sex text NOT NULL,
  patient_document text DEFAULT '',
  accession_number text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  modality text NOT NULL,
  modality_aet text DEFAULT '',
  station_aet text DEFAULT '',
  requested_procedure_id text DEFAULT '',
  requested_procedure_description text DEFAULT '',
  scheduled_station_aet text DEFAULT '',
  scheduled_procedure_step_id text DEFAULT '',
  referring_physician text DEFAULT '',
  clinical_indication text DEFAULT '',
  status text DEFAULT 'pendente' NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  performed_by text DEFAULT '',
  notes text DEFAULT '',
  hl7_message_id text,
  study_id text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT dicom_worklist_patient_sex_check CHECK (patient_sex IN ('M','F','O')),
  CONSTRAINT dicom_worklist_status_check CHECK (status IN ('pendente','em_execucao','concluido','cancelado','nao_compareceu'))
);

DO $$ BEGIN
  ALTER TABLE public.dicom_worklist ADD CONSTRAINT dicom_worklist_study_id_fkey
    FOREIGN KEY (study_id) REFERENCES public.dicom_studies(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── LAUDOS ──

CREATE TABLE IF NOT EXISTS public.imaging_reports (
  id text NOT NULL PRIMARY KEY,
  study_id text NOT NULL,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  modality text NOT NULL,
  template_id text,
  technique text DEFAULT '',
  findings text DEFAULT '' NOT NULL,
  impression text DEFAULT '' NOT NULL,
  recommendations text DEFAULT '',
  key_images text[] DEFAULT '{}',
  body_part text DEFAULT '',
  status text DEFAULT 'rascunho' NOT NULL,
  reported_by text NOT NULL,
  reported_at timestamptz,
  signed_by text,
  signed_at timestamptz,
  signature_id text,
  distribution_channels text[] DEFAULT '{}',
  voice_transcription_used boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT imaging_reports_status_check CHECK (status IN ('rascunho','pre_laudo','laudado','corrigido','cancelado'))
);

DO $$ BEGIN
  ALTER TABLE public.imaging_reports ADD CONSTRAINT imaging_reports_study_id_fkey
    FOREIGN KEY (study_id) REFERENCES public.dicom_studies(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.report_templates (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  modality text NOT NULL,
  specialist_name text DEFAULT '',
  sections jsonb DEFAULT '[]',
  vocabulary_hints text[] DEFAULT '{}',
  language text DEFAULT 'es' NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT report_templates_language_check CHECK (language IN ('es','pt','en')),
  CONSTRAINT report_templates_modality_check CHECK (modality IN ('RX','TC','RM','US','MG','PET','XA','ALL'))
);

CREATE TABLE IF NOT EXISTS public.report_distributions (
  id text NOT NULL PRIMARY KEY,
  report_id text NOT NULL,
  channel text NOT NULL,
  recipient text NOT NULL,
  recipient_type text NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'enviado' NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT report_distributions_channel_check CHECK (channel IN ('portal_paciente','email_solicitante','email_paciente','whatsapp','hl7_fhir','impressao')),
  CONSTRAINT report_distributions_recipient_type_check CHECK (recipient_type IN ('paciente','medico_solicitante','medico_laudo','outro')),
  CONSTRAINT report_distributions_status_check CHECK (status IN ('enviado','entregue','lido','falhou'))
);

DO $$ BEGIN
  ALTER TABLE public.report_distributions ADD CONSTRAINT report_distributions_report_id_fkey
    FOREIGN KEY (report_id) REFERENCES public.imaging_reports(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── HL7 / FHIR ──

CREATE TABLE IF NOT EXISTS public.hl7_messages (
  id text NOT NULL PRIMARY KEY,
  message_type text NOT NULL,
  trigger_event text DEFAULT '' NOT NULL,
  control_id text NOT NULL,
  sending_app text NOT NULL,
  sending_facility text DEFAULT '',
  receiving_app text DEFAULT '',
  receiving_facility text DEFAULT '',
  patient_id text,
  patient_name text DEFAULT '',
  raw_message text DEFAULT '' NOT NULL,
  parsed_segments jsonb DEFAULT '[]',
  status text DEFAULT 'recebido' NOT NULL,
  error_message text,
  received_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  processed_at timestamptz,
  protocol text DEFAULT 'HL7_v2.x' NOT NULL,
  direction text NOT NULL,
  source_system text DEFAULT '',
  related_order_id text,
  related_result_id text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT hl7_messages_direction_check CHECK (direction IN ('inbound','outbound')),
  CONSTRAINT hl7_messages_message_type_check CHECK (message_type IN ('ORM','ORU','ADT','SIU','MDM','ACK')),
  CONSTRAINT hl7_messages_protocol_check CHECK (protocol IN ('HL7_v2.x','ASTM','FHIR_R4','DICOM')),
  CONSTRAINT hl7_messages_status_check CHECK (status IN ('recebido','processado','erro','pendente'))
);

CREATE TABLE IF NOT EXISTS public.fhir_resources (
  id text NOT NULL PRIMARY KEY,
  resource_type text NOT NULL,
  fhir_version text DEFAULT 'R4' NOT NULL,
  json_content text DEFAULT '{}' NOT NULL,
  patient_id text,
  source_message_id text,
  sent_at timestamptz,
  received_at timestamptz,
  status text DEFAULT 'rascunho' NOT NULL,
  endpoint text DEFAULT '',
  direction text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT fhir_resources_direction_check CHECK (direction IN ('inbound','outbound')),
  CONSTRAINT fhir_resources_resource_type_check CHECK (resource_type IN ('Patient','Observation','DiagnosticReport','ImagingStudy','ServiceRequest','Practitioner','Organization')),
  CONSTRAINT fhir_resources_status_check CHECK (status IN ('rascunho','enviado','recebido','processado','erro'))
);

-- ── LABORATÓRIO CLÍNICO ──

CREATE TABLE IF NOT EXISTS public.lab_tests (
  id text NOT NULL PRIMARY KEY,
  code text NOT NULL,
  nomenclator_code text DEFAULT '',
  name text NOT NULL,
  category text NOT NULL,
  sample_type text NOT NULL,
  unit text DEFAULT '' NOT NULL,
  reference_ranges jsonb DEFAULT '[]',
  critical_low numeric,
  critical_high numeric,
  method text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT lab_tests_category_check CHECK (category IN ('hematologia','bioquimica','urinalise','microbiologia','imunologia','hormonios','coagulacao','gasometria','outro'))
);

CREATE TABLE IF NOT EXISTS public.lab_orders (
  id text NOT NULL PRIMARY KEY,
  order_number text NOT NULL,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  patient_birthdate date NOT NULL,
  patient_sex text NOT NULL,
  requesting_physician text NOT NULL,
  insurance_type text DEFAULT 'Particular',
  insurance_number text DEFAULT '',
  priority text DEFAULT 'rotina' NOT NULL,
  observations text DEFAULT '',
  status text DEFAULT 'solicitado' NOT NULL,
  collected_at timestamptz,
  received_at timestamptz,
  completed_at timestamptz,
  items jsonb DEFAULT '[]',
  lis_message_id text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT lab_orders_patient_sex_check CHECK (patient_sex IN ('M','F')),
  CONSTRAINT lab_orders_priority_check CHECK (priority IN ('rotina','urgente','emergencia')),
  CONSTRAINT lab_orders_status_check CHECK (status IN ('solicitado','em_coleta','em_processamento','parcial','concluido','cancelado'))
);

CREATE TABLE IF NOT EXISTS public.lab_order_items (
  id text NOT NULL PRIMARY KEY,
  order_id text NOT NULL,
  code text NOT NULL,
  nomenclator_code text DEFAULT '',
  name text NOT NULL,
  sample_type text NOT NULL,
  container text DEFAULT '',
  status text DEFAULT 'solicitado' NOT NULL,
  result_id text,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT lab_order_items_sample_type_check CHECK (sample_type IN ('sangue','urina','fezes','saliva','liquor','secrecao','tecido','outro')),
  CONSTRAINT lab_order_items_status_check CHECK (status IN ('solicitado','em_coleta','em_processamento','parcial','concluido','cancelado'))
);

DO $$ BEGIN
  ALTER TABLE public.lab_order_items ADD CONSTRAINT lab_order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.lab_orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.lab_results (
  id text NOT NULL PRIMARY KEY,
  order_id text NOT NULL,
  order_item_id text NOT NULL,
  test_id text,
  test_code text NOT NULL,
  test_name text NOT NULL,
  patient_id text NOT NULL,
  value numeric,
  value_text text,
  unit text DEFAULT '' NOT NULL,
  reference_low numeric,
  reference_high numeric,
  reference_description text DEFAULT '',
  flag text DEFAULT 'normal' NOT NULL,
  performed_at timestamptz NOT NULL,
  performed_by text DEFAULT '',
  released_at timestamptz,
  released_by text DEFAULT '',
  observations text DEFAULT '',
  method text DEFAULT '',
  equipment text DEFAULT '',
  lis_message_id text,
  alert_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  CONSTRAINT lab_results_flag_check CHECK (flag IN ('normal','baixo','alto','critico_baixo','critico_alto','indeterminado'))
);

DO $$ BEGIN
  ALTER TABLE public.lab_results ADD CONSTRAINT lab_results_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.lab_orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.lab_results ADD CONSTRAINT lab_results_test_id_fkey
    FOREIGN KEY (test_id) REFERENCES public.lab_tests(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.lab_alerts (
  id text NOT NULL PRIMARY KEY,
  result_id text NOT NULL,
  order_id text NOT NULL,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  test_name text NOT NULL,
  value text DEFAULT '' NOT NULL,
  flag text NOT NULL,
  severity text DEFAULT 'info' NOT NULL,
  message text DEFAULT '' NOT NULL,
  notified_to text[] DEFAULT '{}',
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  acknowledged_at timestamptz,
  acknowledged_by text,
  CONSTRAINT lab_alerts_severity_check CHECK (severity IN ('info','warning','critical'))
);

DO $$ BEGIN
  ALTER TABLE public.lab_alerts ADD CONSTRAINT lab_alerts_result_id_fkey
    FOREIGN KEY (result_id) REFERENCES public.lab_results(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.lab_alerts ADD CONSTRAINT lab_alerts_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.lab_orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── INDEXES ──

CREATE INDEX IF NOT EXISTS idx_dicom_studies_patient ON public.dicom_studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_status ON public.dicom_studies(status);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_modality ON public.dicom_studies(modality);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_accession ON public.dicom_studies(accession_number);
CREATE INDEX IF NOT EXISTS idx_dicom_worklist_patient ON public.dicom_worklist(patient_id);
CREATE INDEX IF NOT EXISTS idx_dicom_worklist_status ON public.dicom_worklist(status);
CREATE INDEX IF NOT EXISTS idx_dicom_worklist_scheduled ON public.dicom_worklist(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_imaging_reports_patient ON public.imaging_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_imaging_reports_study ON public.imaging_reports(study_id);
CREATE INDEX IF NOT EXISTS idx_imaging_reports_status ON public.imaging_reports(status);
CREATE INDEX IF NOT EXISTS idx_hl7_messages_status ON public.hl7_messages(status);
CREATE INDEX IF NOT EXISTS idx_hl7_messages_type ON public.hl7_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON public.lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON public.lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_number ON public.lab_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON public.lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_order ON public.lab_results(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_alerts_patient ON public.lab_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_alerts_severity ON public.lab_alerts(severity);

-- ── RLS (Row-Level Security) ──

ALTER TABLE public.dicom_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicom_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicom_worklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hl7_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fhir_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (auth.uid() IS NOT NULL)
-- Ajustar conforme RBAC do Módulo 14

DO $$ BEGIN
  CREATE POLICY "auth_read_dicom_studies" ON public.dicom_studies FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_dicom_studies" ON public.dicom_studies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_dicom_studies" ON public.dicom_studies FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_dicom_studies" ON public.dicom_studies FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_dicom_annotations" ON public.dicom_annotations FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_dicom_annotations" ON public.dicom_annotations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_dicom_annotations" ON public.dicom_annotations FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_dicom_annotations" ON public.dicom_annotations FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_dicom_worklist" ON public.dicom_worklist FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_dicom_worklist" ON public.dicom_worklist FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_dicom_worklist" ON public.dicom_worklist FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_dicom_worklist" ON public.dicom_worklist FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_imaging_reports" ON public.imaging_reports FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_imaging_reports" ON public.imaging_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_imaging_reports" ON public.imaging_reports FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_imaging_reports" ON public.imaging_reports FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_report_templates" ON public.report_templates FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_report_templates" ON public.report_templates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_report_templates" ON public.report_templates FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_report_templates" ON public.report_templates FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_report_distributions" ON public.report_distributions FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_report_distributions" ON public.report_distributions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_report_distributions" ON public.report_distributions FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_report_distributions" ON public.report_distributions FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_hl7_messages" ON public.hl7_messages FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_hl7_messages" ON public.hl7_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_hl7_messages" ON public.hl7_messages FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_hl7_messages" ON public.hl7_messages FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_fhir_resources" ON public.fhir_resources FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_fhir_resources" ON public.fhir_resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_fhir_resources" ON public.fhir_resources FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_fhir_resources" ON public.fhir_resources FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_lab_tests" ON public.lab_tests FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_lab_tests" ON public.lab_tests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_lab_tests" ON public.lab_tests FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_lab_tests" ON public.lab_tests FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_lab_orders" ON public.lab_orders FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_lab_orders" ON public.lab_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_lab_orders" ON public.lab_orders FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_lab_orders" ON public.lab_orders FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_lab_order_items" ON public.lab_order_items FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_lab_order_items" ON public.lab_order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_lab_order_items" ON public.lab_order_items FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_lab_order_items" ON public.lab_order_items FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_lab_results" ON public.lab_results FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_lab_results" ON public.lab_results FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_lab_results" ON public.lab_results FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_lab_results" ON public.lab_results FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_lab_alerts" ON public.lab_alerts FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_insert_lab_alerts" ON public.lab_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_update_lab_alerts" ON public.lab_alerts FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_delete_lab_alerts" ON public.lab_alerts FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
