-- ==========================================
-- IAMED - DIAGNÓSTICO POR IMAGENS E LABORATÓRIO
-- Schema completo para PACS/DICOM, Worklist, HL7/FHIR, Laboratório
-- ==========================================

-- ==========================================
-- 1. ESTUDOS DICOM / PACS
-- ==========================================
CREATE TABLE dicom_studies (
  id TEXT PRIMARY KEY,
  study_instance_uid TEXT UNIQUE NOT NULL,
  accession_number TEXT UNIQUE NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('RX', 'TC', 'RM', 'US', 'MG', 'PET', 'XA')),
  modality_name TEXT NOT NULL DEFAULT '',
  body_part TEXT NOT NULL DEFAULT '',
  study_description TEXT NOT NULL DEFAULT '',
  clinical_history TEXT DEFAULT '',
  referring_physician TEXT NOT NULL DEFAULT '',
  performing_physician TEXT DEFAULT '',
  institution_name TEXT DEFAULT 'IAMED Centro Médico',
  station_name TEXT DEFAULT '',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('agendado', 'em_execucao', 'laudo_pendente', 'laudado', 'cancelado')) DEFAULT 'agendado',
  series_count INTEGER DEFAULT 0,
  instance_count INTEGER DEFAULT 0,
  thumbnail_url TEXT DEFAULT '',
  dicom_file_ref TEXT DEFAULT '',
  pacs_server_id TEXT DEFAULT 'PACS-MAIN',
  vendor TEXT DEFAULT '',
  mwl_entry_id TEXT,
  report_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 2. ANOTAÇÕES DICOM (medições e ROI)
-- ==========================================
CREATE TABLE dicom_annotations (
  id TEXT PRIMARY KEY,
  study_id TEXT REFERENCES dicom_studies(id) ON DELETE CASCADE NOT NULL,
  series_number INTEGER NOT NULL DEFAULT 1,
  instance_number INTEGER NOT NULL DEFAULT 1,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('arrow', 'circle', 'ruler', 'angle', 'text', 'roi')),
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC,
  height NUMERIC,
  label TEXT DEFAULT '',
  value TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 3. WORKLIST DICOM (DMWL)
-- ==========================================
CREATE TABLE dicom_worklist (
  id TEXT PRIMARY KEY,
  step_id TEXT NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_birthdate DATE NOT NULL,
  patient_sex TEXT NOT NULL CHECK (patient_sex IN ('M', 'F', 'O')),
  patient_document TEXT DEFAULT '',
  accession_number TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  modality TEXT NOT NULL,
  modality_aet TEXT DEFAULT '',
  station_aet TEXT DEFAULT '',
  requested_procedure_id TEXT DEFAULT '',
  requested_procedure_description TEXT DEFAULT '',
  scheduled_station_aet TEXT DEFAULT '',
  scheduled_procedure_step_id TEXT DEFAULT '',
  referring_physician TEXT DEFAULT '',
  clinical_indication TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pendente', 'em_execucao', 'concluido', 'cancelado', 'nao_compareceu')) DEFAULT 'pendente',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  performed_by TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  hl7_message_id TEXT,
  study_id TEXT REFERENCES dicom_studies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 4. TEMPLATES DE LAUDOS
-- ==========================================
CREATE TABLE report_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('RX', 'TC', 'RM', 'US', 'MG', 'PET', 'XA', 'ALL')),
  specialist_name TEXT DEFAULT '',
  sections JSONB DEFAULT '[]'::JSONB,
  vocabulary_hints TEXT[] DEFAULT '{}',
  language TEXT NOT NULL CHECK (language IN ('es', 'pt', 'en')) DEFAULT 'es',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 5. LAUDOS DE IMAGEM
-- ==========================================
CREATE TABLE imaging_reports (
  id TEXT PRIMARY KEY,
  study_id TEXT REFERENCES dicom_studies(id) ON DELETE CASCADE NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  modality TEXT NOT NULL,
  template_id TEXT,
  technique TEXT DEFAULT '',
  findings TEXT NOT NULL DEFAULT '',
  impression TEXT NOT NULL DEFAULT '',
  recommendations TEXT DEFAULT '',
  key_images TEXT[] DEFAULT '{}',
  body_part TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('rascunho', 'pre_laudo', 'laudado', 'corrigido', 'cancelado')) DEFAULT 'rascunho',
  reported_by TEXT NOT NULL,
  reported_at TIMESTAMP WITH TIME ZONE,
  signed_by TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_id TEXT,
  distribution_channels TEXT[] DEFAULT '{}',
  voice_transcription_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 6. DISTRIBUIÇÃO DE LAUDOS
-- ==========================================
CREATE TABLE report_distributions (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES imaging_reports(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('portal_paciente', 'email_solicitante', 'email_paciente', 'whatsapp', 'hl7_fhir', 'impressao')),
  recipient TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('paciente', 'medico_solicitante', 'medico_laudo', 'outro')),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('enviado', 'entregue', 'lido', 'falhou')) DEFAULT 'enviado',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 7. MENSAGENS HL7 v2.x
-- ==========================================
CREATE TABLE hl7_messages (
  id TEXT PRIMARY KEY,
  message_type TEXT NOT NULL CHECK (message_type IN ('ORM', 'ORU', 'ADT', 'SIU', 'MDM', 'ACK')),
  trigger_event TEXT NOT NULL DEFAULT '',
  control_id TEXT NOT NULL,
  sending_app TEXT NOT NULL,
  sending_facility TEXT DEFAULT '',
  receiving_app TEXT DEFAULT '',
  receiving_facility TEXT DEFAULT '',
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT DEFAULT '',
  raw_message TEXT NOT NULL DEFAULT '',
  parsed_segments JSONB DEFAULT '[]'::JSONB,
  status TEXT NOT NULL CHECK (status IN ('recebido', 'processado', 'erro', 'pendente')) DEFAULT 'recebido',
  error_message TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  protocol TEXT NOT NULL CHECK (protocol IN ('HL7_v2.x', 'ASTM', 'FHIR_R4', 'DICOM')) DEFAULT 'HL7_v2.x',
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  source_system TEXT DEFAULT '',
  related_order_id TEXT,
  related_result_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 8. RECURSOS FHIR R4
-- ==========================================
CREATE TABLE fhir_resources (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('Patient', 'Observation', 'DiagnosticReport', 'ImagingStudy', 'ServiceRequest', 'Practitioner', 'Organization')),
  fhir_version TEXT NOT NULL DEFAULT 'R4',
  json_content TEXT NOT NULL DEFAULT '{}',
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  source_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('rascunho', 'enviado', 'recebido', 'processado', 'erro')) DEFAULT 'rascunho',
  endpoint TEXT DEFAULT '',
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 9. PEDIDOS DE LABORATÓRIO
-- ==========================================
CREATE TABLE lab_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_birthdate DATE NOT NULL,
  patient_sex TEXT NOT NULL CHECK (patient_sex IN ('M', 'F')),
  requesting_physician TEXT NOT NULL,
  insurance_type TEXT DEFAULT 'Particular',
  insurance_number TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'rotina' CHECK (priority IN ('rotina', 'urgente', 'emergencia')),
  observations TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('solicitado', 'em_coleta', 'em_processamento', 'parcial', 'concluido', 'cancelado')) DEFAULT 'solicitado',
  collected_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  items JSONB DEFAULT '[]'::JSONB,
  lis_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 10. ITENS DO PEDIDO DE LABORATÓRIO
-- ==========================================
CREATE TABLE lab_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES lab_orders(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  nomenclator_code TEXT DEFAULT '',
  name TEXT NOT NULL,
  sample_type TEXT NOT NULL CHECK (sample_type IN ('sangue', 'urina', 'fezes', 'saliva', 'liquor', 'secrecao', 'tecido', 'outro')),
  container TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('solicitado', 'em_coleta', 'em_processamento', 'parcial', 'concluido', 'cancelado')) DEFAULT 'solicitado',
  result_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 11. CATÁLOGO DE TESTES LABORATORIAIS
-- ==========================================
CREATE TABLE lab_tests (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  nomenclator_code TEXT DEFAULT '',
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hematologia', 'bioquimica', 'urinalise', 'microbiologia', 'imunologia', 'hormonios', 'coagulacao', 'gasometria', 'outro')),
  sample_type TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  reference_ranges JSONB DEFAULT '[]'::JSONB,
  critical_low NUMERIC,
  critical_high NUMERIC,
  method TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 12. RESULTADOS LABORATORIAIS
-- ==========================================
CREATE TABLE lab_results (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES lab_orders(id) ON DELETE CASCADE NOT NULL,
  order_item_id TEXT NOT NULL,
  test_id TEXT REFERENCES lab_tests(id) ON DELETE SET NULL,
  test_code TEXT NOT NULL,
  test_name TEXT NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC,
  value_text TEXT,
  unit TEXT NOT NULL DEFAULT '',
  reference_low NUMERIC,
  reference_high NUMERIC,
  reference_description TEXT DEFAULT '',
  flag TEXT NOT NULL CHECK (flag IN ('normal', 'baixo', 'alto', 'critico_baixo', 'critico_alto', 'indeterminado')) DEFAULT 'normal',
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  performed_by TEXT DEFAULT '',
  released_at TIMESTAMP WITH TIME ZONE,
  released_by TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  method TEXT DEFAULT '',
  equipment TEXT DEFAULT '',
  lis_message_id TEXT,
  alert_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 13. ALERTAS LABORATORIAIS
-- ==========================================
CREATE TABLE lab_alerts (
  id TEXT PRIMARY KEY,
  result_id TEXT REFERENCES lab_results(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT REFERENCES lab_orders(id) ON DELETE CASCADE NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  test_name TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  flag TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
  message TEXT NOT NULL DEFAULT '',
  notified_to TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT
);

-- ==========================================
-- INDEXES PARA PERFORMANCE
-- ==========================================
CREATE INDEX idx_dicom_studies_patient ON dicom_studies(patient_id);
CREATE INDEX idx_dicom_studies_modality ON dicom_studies(modality);
CREATE INDEX idx_dicom_studies_status ON dicom_studies(status);
CREATE INDEX idx_dicom_studies_accession ON dicom_studies(accession_number);
CREATE INDEX idx_dicom_worklist_patient ON dicom_worklist(patient_id);
CREATE INDEX idx_dicom_worklist_status ON dicom_worklist(status);
CREATE INDEX idx_dicom_worklist_scheduled ON dicom_worklist(scheduled_at);
CREATE INDEX idx_imaging_reports_patient ON imaging_reports(patient_id);
CREATE INDEX idx_imaging_reports_status ON imaging_reports(status);
CREATE INDEX idx_hl7_messages_patient ON hl7_messages(patient_id);
CREATE INDEX idx_hl7_messages_status ON hl7_messages(status);
CREATE INDEX idx_hl7_messages_received ON hl7_messages(received_at);
CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);
CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);
CREATE INDEX idx_lab_results_order ON lab_results(order_id);
CREATE INDEX idx_lab_results_flag ON lab_results(flag);
CREATE INDEX idx_lab_alerts_patient ON lab_alerts(patient_id);
CREATE INDEX idx_lab_alerts_severity ON lab_alerts(severity);

-- ==========================================
-- RLS POLICIES
-- ==========================================
ALTER TABLE dicom_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicom_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicom_worklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE imaging_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hl7_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_alerts ENABLE ROW LEVEL SECURITY;

-- Public read for templates and tests
CREATE POLICY "Allow public read report_templates" ON report_templates FOR SELECT USING (true);
CREATE POLICY "Allow public read lab_tests" ON lab_tests FOR SELECT USING (true);

-- Authenticated full access
CREATE POLICY "Allow authenticated dicom_studies" ON dicom_studies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated dicom_annotations" ON dicom_annotations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated dicom_worklist" ON dicom_worklist FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated imaging_reports" ON imaging_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated report_distributions" ON report_distributions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated hl7_messages" ON hl7_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated fhir_resources" ON fhir_resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated lab_orders" ON lab_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated lab_order_items" ON lab_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated lab_results" ON lab_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated lab_alerts" ON lab_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- SEED DATA - TESTES LABORATORIAIS (Paraguai nomenclatura)
-- ==========================================
INSERT INTO lab_tests (id, code, nomenclator_code, name, category, sample_type, unit, reference_ranges, critical_low, critical_high, method, active) VALUES
('lab_1', 'HEMO-LEUC', '90.01.03', 'Leucocitos', 'hematologia', 'sangue', 'mm3', '[{"sex":"A","low":4500,"high":11000,"unit":"mm3"}]'::JSONB, 2000, 30000, 'Impedancia', true),
('lab_2', 'HEMO-HGB', '90.01.05', 'Hemoglobina', 'hematologia', 'sangue', 'g/dL', '[{"sex":"M","low":13.0,"high":17.0,"unit":"g/dL"},{"sex":"F","low":12.0,"high":15.5,"unit":"g/dL"}]'::JSONB, 7.0, 20.0, 'Cianometahemoglobina', true),
('lab_3', 'HEMO-HCT', '90.01.06', 'Hematocrito', 'hematologia', 'sangue', '%', '[{"sex":"M","low":40.0,"high":52.0,"unit":"%"},{"sex":"F","low":36.0,"high":48.0,"unit":"%"}]'::JSONB, 20.0, 60.0, 'Calculado', true),
('lab_4', 'BIO-GLU', '90.02.10', 'Glucosa en ayunas', 'bioquimica', 'sangue', 'mg/dL', '[{"sex":"A","ageMinMonths":216,"low":70,"high":100,"unit":"mg/dL","description":"Ayunas"}]'::JSONB, 40, 500, 'Hexoquinasa', true),
('lab_5', 'BIO-COL', '90.02.20', 'Colesterol total', 'bioquimica', 'sangue', 'mg/dL', '[{"sex":"A","low":0,"high":200,"unit":"mg/dL","description":"Deseable"}]'::JSONB, NULL, NULL, 'Enzimático', true),
('lab_6', 'BIO-HDL', '90.02.25', 'HDL Colesterol', 'bioquimica', 'sangue', 'mg/dL', '[{"sex":"M","low":40,"high":100,"unit":"mg/dL"},{"sex":"F","low":50,"high":100,"unit":"mg/dL"}]'::JSONB, NULL, NULL, 'Enzimático directo', true),
('lab_7', 'BIO-CREA', '90.02.45', 'Creatinina', 'bioquimica', 'sangue', 'mg/dL', '[{"sex":"M","low":0.7,"high":1.3,"unit":"mg/dL"},{"sex":"F","low":0.6,"high":1.1,"unit":"mg/dL"}]'::JSONB, NULL, 7.0, 'Jaffé', true),
('lab_8', 'URI-EG', '90.30.10', 'Examen general de orina', 'urinalise', 'urina', '', '[{"sex":"A","low":0,"high":0,"unit":"","description":"Ver parámetros individuales"}]'::JSONB, NULL, NULL, 'Tira reactiva + Sedimento', true),
('lab_9', 'COA-PT', '90.05.10', 'Tiempo de protrombina', 'coagulacao', 'sangue', 'seg', '[{"sex":"A","low":11.0,"high":13.5,"unit":"seg"}]'::JSONB, NULL, 40.0, 'Coagulométrico', true),
('lab_10', 'HOR-TSH', '90.10.10', 'TSH', 'hormonios', 'sangue', 'uUI/mL', '[{"sex":"A","low":0.4,"high":4.0,"unit":"uUI/mL"}]'::JSONB, 0.1, 100.0, 'Quimioluminiscencia', true);

-- ==========================================
-- SEED DATA - REPORT TEMPLATES
-- ==========================================
INSERT INTO report_templates (id, name, modality, specialist_name, sections, vocabulary_hints, language, active) VALUES
('tpl_rx_torax', 'Rx Tórax - Estándar', 'RX', 'Dr. Adriano Lima',
'[{"key":"tecnica","title":"Técnica","content":"Se realizó radiografía de tórax en proyecciones PA y lateral, con equipo digital directo Siemens.","required":true,"order":1},{"key":"hallazgos","title":"Hallazgos","content":"Campos pulmonares: {...}. Silueta cardíaca: {...}. Mediastino: {...}.","required":true,"order":2},{"key":"impresion","title":"Impresión diagnóstica","content":"","required":true,"order":3},{"key":"recomendaciones","title":"Recomendaciones","content":"","required":false,"order":4}]'::JSONB,
ARRAY['cardiomegalia', 'atelectasia', 'derrame pleural', 'consolidación', 'nódulo pulmonar', 'neumotórax', 'infiltrado'], 'es', true),
('tpl_us_obst', 'US Obstétrica - 2do Trimestre', 'US', 'Dra. Amanda Silva',
'[{"key":"tecnica","title":"Técnica","content":"Ecografía obstétrica transabdominal con equipo GE Voluson.","required":true,"order":1},{"key":"biometria","title":"Biometría fetal","content":"DBP: {...} mm. LF: {...} mm. CA: {...} mm.","required":true,"order":2},{"key":"anatomia","title":"Anatomía fetal","content":"Cráneo, Columna, Tórax, Abdomen, Extremidades.","required":true,"order":3},{"key":"impresion","title":"Impresión","content":"","required":true,"order":5}]'::JSONB,
ARRAY['gestación', 'biometría', 'placenta', 'líquido amniótico'], 'es', true),
('tpl_lab_hemo', 'Laboratorio - Hemograma', 'ALL', 'Bioq. María González',
'[{"key":"muestra","title":"Muestra","content":"Sangre venosa EDTA, recibida en condiciones adecuadas.","required":true,"order":1},{"key":"serie_roja","title":"Serie Roja","content":"","required":true,"order":2},{"key":"serie_blanca","title":"Serie Blanca","content":"","required":true,"order":3},{"key":"plaquetas","title":"Plaquetas","content":"","required":true,"order":4}]'::JSONB,
ARRAY['anemia', 'leucocitosis', 'leucopenia', 'trombocitosis'], 'es', true);
