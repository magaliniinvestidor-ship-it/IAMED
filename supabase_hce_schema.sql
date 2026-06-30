-- ==========================================
-- IAMED HCE - HISTÓRICO CLÍNICO ELETRÔNICO
-- Schema completo para todas as funcionalidades HCE
-- ==========================================

-- ==========================================
-- 1. ANAMNESE ESTRUTURADA
-- ==========================================
CREATE TABLE anamnese (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Antecedentes pessoais patológicos
  personal_pathological TEXT[] DEFAULT '{}',
  -- Antecedentes pessoais não patológicos
  smoking TEXT DEFAULT 'não',
  alcohol TEXT DEFAULT 'não',
  physical_activity TEXT DEFAULT 'não',
  diet TEXT DEFAULT '',
  sleep TEXT DEFAULT '',
  -- Antecedentes familiares
  family_history JSONB DEFAULT '[]'::JSONB,
  -- Alergias estruturadas
  allergies JSONB DEFAULT '[]'::JSONB,
  -- Medicações em uso
  current_medications JSONB DEFAULT '[]'::JSONB,
  -- Antecedentes cirúrgicos
  surgical_history JSONB DEFAULT '[]'::JSONB,
  -- Antecedentes ginecológicos (para pacientes femininos)
  gynecological JSONB DEFAULT NULL,
  -- Antecedentes obstétricos
  obstetric JSONB DEFAULT NULL,
  -- Histórico social
  occupation TEXT DEFAULT '',
  marital_status TEXT DEFAULT '',
  notes TEXT DEFAULT ''
);

-- ==========================================
-- 2. EXAME FÍSICO ESTRUTURADO
-- ==========================================
CREATE TABLE physical_exams (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  clinical_history_id TEXT REFERENCES clinical_history(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Sinais vitais
  vital_signs JSONB DEFAULT '{}'::JSONB,
  -- Exame por aparelho/sistema
  exam_head_neck TEXT DEFAULT '',
  exam_cardiovascular TEXT DEFAULT '',
  exam_respiratory TEXT DEFAULT '',
  exam_abdomen TEXT DEFAULT '',
  exam_genitourinary TEXT DEFAULT '',
  exam_musculoskeletal TEXT DEFAULT '',
  exam_neurological TEXT DEFAULT '',
  exam_skin TEXT DEFAULT '',
  exam_eyes TEXT DEFAULT '',
  exam_ears TEXT DEFAULT '',
  exam_mouth TEXT DEFAULT '',
  exam_rectal TEXT DEFAULT '',
  exam_psychiatric TEXT DEFAULT '',
  general_aspect TEXT DEFAULT '',
  notes TEXT DEFAULT ''
);

-- ==========================================
-- 3. EVOLUÇÃO SOAP
-- ==========================================
CREATE TABLE soap_notes (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  clinical_history_id TEXT REFERENCES clinical_history(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  subjective TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  assessment TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT ''
);

-- ==========================================
-- 4. DIAGNÓSTICOS CID-10 E SNOMED-CT
-- ==========================================
CREATE TABLE diagnoses (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  clinical_history_id TEXT REFERENCES clinical_history(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  cid10_code TEXT NOT NULL,
  cid10_description TEXT NOT NULL,
  snomed_code TEXT,
  snomed_description TEXT,
  diagnosis_type TEXT NOT NULL CHECK (diagnosis_type IN ('principal', 'secundário', 'diferencial', 'presuntivo')),
  status TEXT NOT NULL CHECK (status IN ('ativo', 'resolvido', 'crônico', 'em_tratamento')),
  notes TEXT DEFAULT ''
);

-- ==========================================
-- 5. CATÁLOGO DE MEDICAMENTOS
-- ==========================================
CREATE TABLE drug_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active_ingredient TEXT NOT NULL,
  presentation TEXT NOT NULL DEFAULT '',
  manufacturer TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  controlled_category TEXT CHECK (controlled_category IN ('comum', 'controlado', 'entorpecente', 'especial')),
  requires_prescription BOOLEAN DEFAULT true,
  min_age_months INTEGER DEFAULT 0,
  max_age_months INTEGER DEFAULT NULL,
  pregnant_category TEXT DEFAULT '',
  breastfeeding_safe BOOLEAN DEFAULT true,
  common_dose_adult TEXT DEFAULT '',
  common_dose_pediatric TEXT DEFAULT '',
  route TEXT DEFAULT 'oral',
  contraindications TEXT[] DEFAULT '{}',
  side_effects TEXT[] DEFAULT '{}',
  interactions JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 6. PRESCRIPÇÕES ESTRUTURADAS
-- ==========================================
CREATE TABLE prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  clinical_history_id TEXT REFERENCES clinical_history(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  prescription_type TEXT NOT NULL CHECK (prescription_type IN ('comum', 'controlado', 'arquivado')),
  drug_name TEXT NOT NULL,
  active_ingredient TEXT DEFAULT '',
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT 'oral',
  duration TEXT DEFAULT '',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'unidade',
  refill_count INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  qr_code_data TEXT DEFAULT '',
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('rascunho', 'assinado', 'cancelado', 'dispensado'))
);

-- ==========================================
-- 7. INTERAÇÕES MEDICAMENTOSAS
-- ==========================================
CREATE TABLE drug_interactions (
  id TEXT PRIMARY KEY,
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('leve', 'moderada', 'grave', 'contraindicado')),
  description TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 8. SOLICITAÇÃO DE EXAMES
-- ==========================================
CREATE TABLE exam_requests (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  clinical_history_id TEXT REFERENCES clinical_history(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  exam_type TEXT NOT NULL CHECK (exam_type IN ('laboratorio', 'imagem', 'anatomia_patologica', 'outro')),
  exam_name TEXT NOT NULL,
  clinical_indication TEXT NOT NULL DEFAULT '',
  urgency TEXT NOT NULL DEFAULT 'rotina' CHECK (urgency IN ('rotina', 'urgente', 'emergencia')),
  status TEXT NOT NULL CHECK (status IN ('solicitado', 'em_execucao', 'laudo_pendente', 'concluido', 'cancelado')),
  result_notes TEXT DEFAULT '',
  result_date DATE,
  result_file_url TEXT DEFAULT '',
  result_file_name TEXT DEFAULT '',
  signed_by TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_id TEXT
);

-- ==========================================
-- 9. PROCEDIMENTOS REALIZADOS
-- ==========================================
CREATE TABLE procedures (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  clinical_history_id TEXT REFERENCES clinical_history(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  procedure_code TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  procedure_category TEXT NOT NULL DEFAULT '',
  quantity INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  complications TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('programado', 'em_execucao', 'concluido', 'cancelado')),
  performed_at TIMESTAMP WITH TIME ZONE,
  signed_by TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_id TEXT
);

-- ==========================================
-- 10. ANEXOS / DOCUMENTOS CLÍNICOS
-- ==========================================
CREATE TABLE clinical_attachments (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  clinical_history_id TEXT REFERENCES clinical_history(id) ON DELETE SET NULL,
  exam_request_id TEXT REFERENCES exam_requests(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  category TEXT NOT NULL CHECK (category IN ('exame_imagem', 'exame_laboratorio', 'documento', 'receita', 'laudo', 'anexo_paciente', 'outro')),
  description TEXT DEFAULT '',
  is_sensitive BOOLEAN DEFAULT false,
  signed_by TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_id TEXT
);

-- ==========================================
-- 11. ASSINATURA ELETRÔNICA QUALIFICADA
-- ==========================================
CREATE TABLE electronic_signatures (
  id TEXT PRIMARY KEY,
  signer_id TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signer_council TEXT NOT NULL,
  signer_council_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  document_type TEXT NOT NULL CHECK (document_type IN ('prescricao', 'receita', 'laudo', 'atestado', 'alta', 'procedimento', 'exame', 'outro')),
  document_id TEXT NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,

  signature_hash TEXT NOT NULL,
  certificate_serial TEXT DEFAULT '',
  certificate_issuer TEXT DEFAULT '',
  certificate_valid_from TIMESTAMP WITH TIME ZONE,
  certificate_valid_to TIMESTAMP WITH TIME ZONE,
  timestamp_token TEXT DEFAULT '',
  timestamp_authority TEXT DEFAULT 'IAMED-TSA',

  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  verification_code TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('valida', 'revogada', 'expirada'))
);

-- ==========================================
-- 12. CONTROLE DE ACESSO E CONFIDENCIALIDADE
-- ==========================================
CREATE TABLE access_controls (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  accessed_by TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  access_type TEXT NOT NULL CHECK (access_type IN ('normal', 'break_the_glass', 'emergencia')),
  justification TEXT DEFAULT '',
  fields_accessed TEXT[] DEFAULT '{}',
  ip_address TEXT DEFAULT '',

  notified_privacy_officer BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 13. CAMPOS SENSÍVEIS (configuração)
-- ==========================================
CREATE TABLE sensitive_field_config (
  id TEXT PRIMARY KEY,
  field_name TEXT NOT NULL UNIQUE,
  field_label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hiv', 'saude_mental', 'dependencia_quimica', 'saude_reprodutiva', 'outro')),
  requires_elevated_permission BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 14. TIMELINE DO PACIENTE (vista materializada para consultas rápidas)
-- ==========================================
CREATE TABLE patient_timeline (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('consulta', 'internacao', 'cirurgia', 'exame', 'prescricao', 'vacina', 'procedimento', 'alta', 'emergencia')),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT DEFAULT '',
  event_source TEXT NOT NULL,
  event_source_id TEXT NOT NULL,
  doctor_name TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  cid10_code TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE anamnese ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_field_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_timeline ENABLE ROW LEVEL SECURITY;

-- Public read for drug catalog and interactions
CREATE POLICY "Allow public read drug_catalog" ON drug_catalog FOR SELECT USING (true);
CREATE POLICY "Allow public read drug_interactions" ON drug_interactions FOR SELECT USING (true);
CREATE POLICY "Allow public read sensitive_field_config" ON sensitive_field_config FOR SELECT USING (true);

-- Authenticated full access for clinical tables
CREATE POLICY "Allow authenticated anamnese" ON anamnese FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated physical_exams" ON physical_exams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated soap_notes" ON soap_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated diagnoses" ON diagnoses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated prescriptions" ON prescriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated exam_requests" ON exam_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated procedures" ON procedures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated clinical_attachments" ON clinical_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated electronic_signatures" ON electronic_signatures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access_controls" ON access_controls FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated patient_timeline" ON patient_timeline FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- SEED DATA - CID-10 (Amostra para Paraguai)
-- ==========================================
CREATE TABLE cid10_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  chapter TEXT NOT NULL DEFAULT '',
  block TEXT NOT NULL DEFAULT ''
);

INSERT INTO cid10_codes (code, description, chapter, block) VALUES
('A00', 'Cólera', 'I', 'A00-A09'),
('A09', 'Outras doenças infecciosas e parasitárias intestinais', 'I', 'A00-A09'),
('B20', 'Doença pelo HIV', 'I', 'B20-B24'),
('C34', 'Neoplasia maligna dos brônquios e do pulmão', 'II', 'C30-C39'),
('C50', 'Neoplasia maligna da mama', 'II', 'C50-C50'),
('E11', 'Diabetes mellitus tipo 2', 'IV', 'E08-E13'),
('E78', 'Transtornos do metabolismo lipídico', 'IV', 'E70-E90'),
('F32', 'Episódios depressivos', 'V', 'F30-F39'),
('F41', 'Outros transtornos de ansiedade', 'V', 'F40-F48'),
('G40', 'Epilepsia', 'VI', 'G40-G47'),
('G43', 'Enxaqueca', 'VI', 'G40-G47'),
('I10', 'Hipertensão arterial primária', 'IX', 'I10-I15'),
('I25', 'Doença arterial coronariana crônica', 'IX', 'I20-I25'),
('I50', 'Insuficiência cardíaca', 'IX', 'I50-I50'),
('J06', 'Infecções agudas das vias aéreas superiores', 'X', 'J00-J06'),
('J18', 'Pneumonia por fungos', 'X', 'J09-J18'),
('K21', 'Doença de refluxo gastroesofágico', 'XI', 'K20-K31'),
('K80', 'Colelitíase', 'XI', 'K80-K87'),
('M17', 'Artrose do joelho', 'XIII', 'M15-M19'),
('M47', 'Espondilose', 'XIII', 'M40-M54'),
('M54', 'Dorsalgia', 'XIII', 'M40-M54'),
('M76', 'Enfermidades dos tecidos moles peritendinosos', 'XIII', 'M70-M79'),
('N18', 'Insuficiência renal crônica', 'XIV', 'N17-N19'),
('N39', 'Outros transtornos do trato urinário', 'XIV', 'N30-N39'),
('O80', 'Parto normal', 'XV', 'O80-O84'),
('Q21', 'Defeitos cardíacos congênitos', 'XVII', 'Q20-Q24'),
('R50', 'Febre, não especificada', 'XVIII', 'R50-R69'),
('S72', 'Fratura do fêmur', 'XIX', 'S70-S79'),
('T78', 'Efeitos adversos, não classificados em outra parte', 'XX', 'T66-T78'),
('V89', 'Acidente de veículo de via terrestre, tipo não especificado', 'XX', 'V80-V89'),
('Y84', 'Outras causas de morbidade pós-tratamento médico', 'XX', 'Y84-Y84'),
('Z00', 'Exame geral e investigação de pessoas sem queixa', 'XXI', 'Z00-Z13'),
('Z23', 'Necessidade de imunização contra doença bacteriana', 'XXI', 'Z20-Z29'),
('Z34', 'Supervisão de gravidez normal', 'XXI', 'Z30-Z39'),
('Z72', 'Problemas associados ao estilo de vida', 'XXI', 'Z70-Z76');

-- ==========================================
-- SEED - CATÁLOGO DE MEDICAMENTOS (Amostra Paraguai)
-- ==========================================
INSERT INTO drug_catalog (id, name, active_ingredient, presentation, category, controlled_category, common_dose_adult, common_dose_pediatric, route, contraindications) VALUES
('drug_1', 'Paracetamol 500mg', 'Paracetamol', 'Comprimido 500mg', 'Analgésico', 'comum', '500mg-1g a cada 6-8h', '10-15mg/kg/dose a cada 6-8h', 'oral', '{}'),
('drug_2', 'Ibuprofeno 600mg', 'Ibuprofeno', 'Comprimido 600mg', 'AINE', 'comum', '200-600mg a cada 6-8h', '5-10mg/kg/dose a cada 6-8h', 'oral', '{úlcera péptica ativa,insuficiência renal grave}'),
('drug_3', 'Amoxicilina 500mg', 'Amoxicilina', 'Cápsula 500mg', 'Antibiótico', 'comum', '500mg a cada 8h', '25-50mg/kg/dia fracionado', 'oral', '{alergia a penicilinas}'),
('drug_4', 'Losartana 50mg', 'Losartana Potássica', 'Comprimido 50mg', 'Anti-hipertensivo', 'comum', '50-100mg 1x/dia', '', 'oral', '{gravidez,estenose bilateral da artéria renal}'),
('drug_5', 'Omeprazol 20mg', 'Omeprazol', 'Cápsula 20mg', 'Inibidor Bomba Prótons', 'comum', '20mg 1x/dia', '0.7-3.5mg/kg/dia', 'oral', '{}'),
('drug_6', 'Dipirona 500mg', 'Dipirona Sódica', 'Comprimido 500mg', 'Analgésico/Antipirético', 'comum', '500mg-1g a cada 6h', '10-15mg/kg/dose', 'oral', '{asma induzida por AAS,grávidas no 1º trimestre}'),
('drug_7', 'Rivotril 2mg', 'Clonazepam', 'Comprimido 2mg', 'Benzodiazepínico', 'controlado', '0.5-4mg/dia', '0.01-0.03mg/kg/dia', 'oral', '{}'),
('drug_8', 'Ritalina 10mg', 'Metilfenidato', 'Comprimido 10mg', 'Psicoestimulante', 'controlado', '10-20mg 2-3x/dia', '5mg 2x/dia', 'oral', '{}'),
('drug_9', 'Sulfato Ferroso 40mg', 'Sulfato Ferroso', 'Comprimido 40mg', 'Suplemento de Ferro', 'comum', '40mg 1x/dia', '3-6mg/kg/dia', 'oral', '{}'),
('drug_10', 'Ácido Fólico 5mg', 'Ácido Fólico', 'Comprimido 5mg', 'Vitamina', 'comum', '5mg 1x/dia', '0.1-0.4mg/dia', 'oral', '{}');

-- ==========================================
-- SEED - INTERAÇÕES MEDICAMENTOSAS
-- ==========================================
INSERT INTO drug_interactions (id, drug_a, drug_b, severity, description, recommendation) VALUES
('int_1', 'Ibuprofeno', 'Losartana', 'moderada', 'AINEs podem reduzir o efeito anti-hipertensivo dos BNRAs.', 'Monitorar pressão arterial. Considerar alternativa analgésica.'),
('int_2', 'Amoxicilina', 'Omeprazol', 'leve', 'Omeprazol pode reduzir ligeiramente a absorção de amoxicilina.', 'Tomar amoxicilina com 2h de intervalo do omeprazol.'),
('int_3', 'Clonazepam', 'Metilfenidato', 'moderada', 'Psicoestimulantes podem reduzir o efeito sedativo das benzodiazepinas.', 'Ajustar doses conforme resposta clínica.'),
('int_4', 'Dipirona', 'Ibuprofeno', 'leve', 'Efeito aditivo analgésico/antipirético.', 'Evitar uso concomitante prolongado. Monitorar.'),
('int_5', 'Losartana', 'Potássio', 'grave', 'BNRAs podem causar hipercalemia quando associados a suplementos de potássio.', 'Monitorar K+ séricos regularmente.');

-- ==========================================
-- SEED - CAMPOS SENSÍVEIS
-- ==========================================
INSERT INTO sensitive_field_config (id, field_name, field_label, category, requires_elevated_permission) VALUES
('sf_1', 'hiv_status', 'Estado HIV', 'hiv', true),
('sf_2', 'mental_health', 'Saúde Mental', 'saude_mental', true),
('sf_3', 'substance_use', 'Uso de Substâncias', 'dependencia_quimica', true),
('sf_4', 'reproductive_health', 'Saúde Reprodutiva', 'saude_reprodutiva', true),
('sf_5', 'sexual_history', 'Histórico Sexual', 'saude_reprodutiva', true);
