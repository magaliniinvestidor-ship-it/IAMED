-- ============================================================
-- IAMED - Supabase Migration SQL
-- Gera todas as tabelas do sistema
-- ============================================================

-- 1. PATIENTS (Pacientes)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  birthdate TEXT NOT NULL,
  gender TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'aguardando',
  document_type TEXT,
  document_number TEXT,
  place_of_birth TEXT,
  civil_status TEXT,
  nationality TEXT,
  address_department TEXT,
  address_district TEXT,
  address_city TEXT,
  address_neighborhood TEXT,
  address_street TEXT,
  address_number TEXT,
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  blood_type TEXT,
  allergies TEXT,
  health_insurance_type TEXT,
  health_insurance_number TEXT,
  health_insurance_company TEXT,
  employer TEXT,
  guardian_name TEXT,
  guardian_document TEXT,
  guardian_relationship TEXT,
  photo_url TEXT,
  preferred_language TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLINICAL HISTORY (Histórico Clínico)
CREATE TABLE IF NOT EXISTS clinical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  diagnosis TEXT,
  cid10 TEXT,
  prescriptions JSONB DEFAULT '[]',
  notes TEXT,
  doctor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFESSIONALS (Profissionais de Saúde)
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  specialty TEXT,
  council TEXT,
  council_number TEXT,
  shift TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ativo',
  admission_date TEXT,
  color TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. APPOINTMENTS (Consultas/Agendamentos)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado',
  branch TEXT,
  room TEXT,
  resource TEXT,
  type TEXT,
  modality TEXT,
  is_overturn BOOLEAN DEFAULT FALSE,
  overturn_reason TEXT,
  insurance TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDIT LOGS (Logs de Auditoria)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BEDS (Leitos)
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  wing TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponível',
  patient_name TEXT,
  entry_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FINANCIAL POSTINGS (Lançamentos Financeiros)
CREATE TABLE IF NOT EXISTS financial_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STOCK ITEMS (Itens de Estoque - Admin)
CREATE TABLE IF NOT EXISTS stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PHARMACY ITEMS (Itens de Farmácia)
CREATE TABLE IF NOT EXISTS pharmacy_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  form TEXT,
  presentation TEXT,
  manufacturer TEXT,
  dinavisa_registration TEXT,
  requires_prescription BOOLEAN DEFAULT FALSE,
  total_quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC NOT NULL DEFAULT 0,
  storage_location TEXT,
  unit_cost NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LOT CONTROLS (Controle de Lotes)
CREATE TABLE IF NOT EXISTS lot_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES pharmacy_items(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  serial_number TEXT,
  manufacture_date TEXT,
  expiry_date TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  initial_quantity NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC DEFAULT 0,
  dinavisa_registration TEXT,
  dte_entry_number TEXT,
  supplier_name TEXT,
  supplier_ruc TEXT,
  received_date TEXT,
  status TEXT NOT NULL DEFAULT 'disponivel',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STOCK MOVEMENTS (Movimentações de Estoque)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES pharmacy_items(id) ON DELETE CASCADE,
  item_name TEXT,
  lot_id TEXT,
  lot_number TEXT,
  movement_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  date TEXT NOT NULL,
  operator_name TEXT,
  dte_number TEXT,
  supplier_name TEXT,
  patient_name TEXT,
  procedure_name TEXT,
  sector TEXT,
  room TEXT,
  doctor_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. INVENTORY COUNTS (Contagens de Inventário)
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES pharmacy_items(id) ON DELETE CASCADE,
  lot_id TEXT,
  expected_quantity NUMERIC,
  counted_quantity NUMERIC,
  difference NUMERIC,
  date TEXT NOT NULL,
  operator_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ADVERSE EVENTS (Eventos Adversos)
CREATE TABLE IF NOT EXISTS adverse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT,
  patient_id TEXT,
  medication_name TEXT NOT NULL,
  item_id TEXT,
  lot_id TEXT,
  lot_number TEXT,
  adverse_reaction TEXT NOT NULL,
  severity TEXT NOT NULL,
  start_date TEXT,
  outcome TEXT,
  suspected_drug BOOLEAN DEFAULT TRUE,
  concomitant_drugs JSONB DEFAULT '[]',
  description TEXT,
  notifier_name TEXT,
  notifier_role TEXT,
  notification_date TEXT,
  status TEXT DEFAULT 'rascunho',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. QUALITY DEVIATIONS (Desvios de Qualidade)
CREATE TABLE IF NOT EXISTS quality_deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES pharmacy_items(id) ON DELETE CASCADE,
  item_name TEXT,
  lot_id TEXT,
  lot_number TEXT,
  deviation_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  affected_quantity NUMERIC,
  description TEXT,
  report_date TEXT,
  reporter_name TEXT,
  status TEXT DEFAULT 'aberto',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. BATCH RECALLS (Recolhas de Lotes)
CREATE TABLE IF NOT EXISTS batch_recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT,
  item_name TEXT,
  lot_id TEXT,
  lot_number TEXT,
  recall_type TEXT NOT NULL,
  reason TEXT,
  risk_level TEXT,
  alert_date TEXT NOT NULL,
  affected_quantity NUMERIC,
  recollected_quantity NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'aberto',
  dinavisa_notice TEXT,
  instructions TEXT,
  completed_at TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. DTES (Documentos Tributarios Electrónicos)
CREATE TABLE IF NOT EXISTS dtes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cdc TEXT,
  type TEXT NOT NULL,
  number TEXT,
  timbrado TEXT,
  establishment TEXT,
  expedition_point TEXT,
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,
  date TEXT,
  amount NUMERIC NOT NULL,
  iva_5 NUMERIC DEFAULT 0,
  iva_10 NUMERIC DEFAULT 0,
  environment TEXT DEFAULT 'homologacao',
  status TEXT DEFAULT 'pendente',
  payment_status TEXT DEFAULT 'pendente',
  xml_content TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. ASO EXAMS (Exames Ocupacionais)
CREATE TABLE IF NOT EXISTS aso_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  type TEXT NOT NULL,
  risks JSONB DEFAULT '[]',
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  doctor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. ANAMNESE (Anamneses)
CREATE TABLE IF NOT EXISTS anamnese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinical_history_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  personal_pathological JSONB DEFAULT '[]',
  smoking TEXT,
  alcohol TEXT,
  physical_activity TEXT,
  diet TEXT,
  sleep TEXT,
  family_history JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  current_medications JSONB DEFAULT '[]',
  surgical_history JSONB DEFAULT '[]',
  gynecological JSONB,
  obstetric JSONB,
  occupation TEXT,
  marital_status TEXT,
  notes TEXT
);

-- 19. SOAP NOTES (Evoluções SOAP)
CREATE TABLE IF NOT EXISTS soap_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinical_history_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT
);

-- 20. PHYSICAL EXAMS (Exames Físicos)
CREATE TABLE IF NOT EXISTS physical_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  clinical_history_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  vital_signs JSONB DEFAULT '{}',
  exam_head_neck TEXT,
  exam_cardiovascular TEXT,
  exam_respiratory TEXT,
  exam_abdomen TEXT,
  exam_genitourinary TEXT,
  exam_musculoskeletal TEXT,
  exam_neurological TEXT,
  exam_skin TEXT,
  exam_eyes TEXT,
  exam_ears TEXT,
  exam_mouth TEXT,
  exam_rectal TEXT,
  exam_psychiatric TEXT,
  general_aspect TEXT,
  notes TEXT
);

-- 21. BLOCKED SLOTS (Bloqueios de Agenda)
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_name TEXT NOT NULL,
  branch TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. WAITING LIST (Lista de Espera)
CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  phone TEXT,
  specialty TEXT,
  doctor_name TEXT,
  priority_criteria TEXT,
  priority_score NUMERIC DEFAULT 0,
  preferred_days JSONB DEFAULT '[]',
  preferred_hours JSONB DEFAULT '[]',
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. WHATSAPP REMINDERS (Lembretes WhatsApp)
CREATE TABLE IF NOT EXISTS whatsapp_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  message_template TEXT,
  language TEXT DEFAULT 'es',
  status TEXT DEFAULT 'pendente',
  scheduled_for TEXT,
  sent_at TEXT,
  response_received TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. CALL CENTER LOGS (Logs de Call Center)
CREATE TABLE IF NOT EXISTS call_center_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_name TEXT NOT NULL,
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  duration_seconds NUMERIC,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. CRM CAMPAIGNS (Campanhas)
CREATE TABLE IF NOT EXISTS crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  template TEXT,
  segmento_alvo TEXT,
  mensagem TEXT,
  data_disparo TEXT,
  status TEXT DEFAULT 'rascunho',
  total_contatos NUMERIC DEFAULT 0,
  total_enviados NUMERIC DEFAULT 0,
  total_falhas NUMERIC DEFAULT 0,
  total_optout NUMERIC DEFAULT 0,
  consentimento_obrigatorio BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. CRM LEADS (Leads)
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  origem TEXT NOT NULL,
  data_primeiro_contato TEXT,
  etapa_funil TEXT DEFAULT 'novo',
  interesse TEXT,
  observacoes TEXT,
  convertido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. CRM OPPORTUNITIES (Oportunidades)
CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_nome TEXT NOT NULL,
  paciente_telefone TEXT,
  tipo TEXT NOT NULL,
  descricao TEXT,
  valor_estimado NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'aberta',
  probabilidade NUMERIC DEFAULT 0,
  data_criacao TEXT,
  responsavel TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. CRM OPTOUTS (Opt-Outs)
CREATE TABLE IF NOT EXISTS crm_optouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_nome TEXT NOT NULL,
  paciente_contato TEXT NOT NULL,
  canal TEXT NOT NULL,
  data_optout TEXT,
  confirmado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. CRM NPS SURVEYS (Pesquisas NPS)
CREATE TABLE IF NOT EXISTS crm_nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_nome TEXT NOT NULL,
  data_atendimento TEXT,
  score NUMERIC DEFAULT 0,
  categoria TEXT DEFAULT 'neutro',
  origem TEXT,
  respondido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_document ON patients(document_number);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_name);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_name);
CREATE INDEX IF NOT EXISTS idx_professionals_role ON professionals(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_history_patient ON clinical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_items_name ON pharmacy_items(name);
CREATE INDEX IF NOT EXISTS idx_lot_controls_item ON lot_controls(item_id);
CREATE INDEX IF NOT EXISTS idx_lot_controls_expiry ON lot_controls(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_dtes_status ON dtes(status);
CREATE INDEX IF NOT EXISTS idx_aso_exams_patient ON aso_exams(patient_name);

-- ============================================================
-- RLS (Row Level Security) - Desabilitado para desenvolvimento
-- ============================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dtes ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_postings ENABLE ROW LEVEL SECURITY;

-- Política pública para desenvolvimento (substituir em produção)
CREATE POLICY "Public access for dev" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON professionals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON clinical_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON pharmacy_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON lot_controls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON dtes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for dev" ON financial_postings FOR ALL USING (true) WITH CHECK (true);
