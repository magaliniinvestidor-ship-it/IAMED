-- ==========================================
-- IAMED INTERNAÇÃO E CENTRO CIRÚRGICO
-- Schema completo: leitos, agenda cirúrgica,
-- gestão de pacientes internados, relatórios
-- ==========================================

-- ==========================================
-- 1. CATÁLOGO DE LEITOS (V2)
-- ==========================================
CREATE TABLE beds_v2 (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('UCI','UTI','UCO','enfermaria','apartamento_individual','duplo','suite')),
  sector TEXT NOT NULL CHECK (sector IN ('Alas Gerais','UTI','UCO','Centro Cirúrgico','Enfermaria','Apartamentos','Pediatria','Maternidade')),
  wing TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('livre','ocupado','limpeza','manutencao','reservado','bloqueado')) DEFAULT 'livre',
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT,
  entry_date DATE,
  specialty TEXT,
  doctor TEXT,
  special_features TEXT[] DEFAULT '{}',
  isolation BOOLEAN DEFAULT FALSE,
  negative_pressure BOOLEAN DEFAULT FALSE,
  last_cleaning_at TIMESTAMP WITH TIME ZONE,
  maintenance_reason TEXT,
  reserved_until DATE,
  reserved_for_patient TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 2. TRANFERÊNCIA DE LEITOS
-- ==========================================
CREATE TABLE bed_transfers (
  id TEXT PRIMARY KEY,
  bed_from_id TEXT REFERENCES beds_v2(id) ON DELETE CASCADE NOT NULL,
  bed_from_name TEXT NOT NULL,
  bed_to_id TEXT REFERENCES beds_v2(id) ON DELETE CASCADE NOT NULL,
  bed_to_name TEXT NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  transferred_by TEXT NOT NULL,
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 3. AGENDA CIRÚRGICA
-- ==========================================
CREATE TABLE surgery_schedule (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  surgeon TEXT NOT NULL,
  team_surgeon TEXT NOT NULL DEFAULT '',
  team_anesthesiologist TEXT NOT NULL DEFAULT '',
  team_instrumentator TEXT DEFAULT '',
  team_circulator TEXT DEFAULT '',
  team_assistants TEXT[] DEFAULT '{}',
  room TEXT NOT NULL,
  procedure_type TEXT NOT NULL,
  procedure_code TEXT NOT NULL DEFAULT '',
  estimated_duration INTEGER NOT NULL DEFAULT 60,
  anesthesia_type TEXT NOT NULL CHECK (anesthesia_type IN ('geral','regional','local','sedacao','bloqueio','combinada')),
  special_materials TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('programada','confirmada','paciente_em_sala','em_intervencao','em_recuperacao','finalizada','suspensa','cancelada')) DEFAULT 'programada',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  pre_op_diagnosis TEXT NOT NULL DEFAULT '',
  post_op_diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 4. CHECKLIST PRÉ-CIRÚRGICO (OMS)
-- ==========================================
CREATE TABLE surgical_checklists (
  id TEXT PRIMARY KEY,
  surgery_id TEXT REFERENCES surgery_schedule(id) ON DELETE CASCADE NOT NULL,
  patient_identity_verified BOOLEAN DEFAULT FALSE,
  laterality_verified BOOLEAN DEFAULT FALSE,
  fasting_verified BOOLEAN DEFAULT FALSE,
  pre_op_exams_verified BOOLEAN DEFAULT FALSE,
  informed_consent_signed BOOLEAN DEFAULT FALSE,
  antibiotic_prophylaxis BOOLEAN DEFAULT FALSE,
  checklist_completed_by TEXT NOT NULL,
  checklist_completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 5. REGISTRO INTRAOPERATÓRIO
-- ==========================================
CREATE TABLE intraoperative_records (
  id TEXT PRIMARY KEY,
  surgery_id TEXT REFERENCES surgery_schedule(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  intercurrences TEXT DEFAULT '',
  materials_consumed JSONB DEFAULT '[]'::JSONB,
  anesthetic_notes TEXT DEFAULT '',
  vital_signs JSONB DEFAULT '[]'::JSONB,
  recorded_by TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 6. EPISÓDIO DE INTERNAÇÃO
-- ==========================================
CREATE TABLE hospitalizations (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  admission_date DATE NOT NULL,
  admission_time TIME NOT NULL,
  reason TEXT NOT NULL,
  initial_diagnosis TEXT NOT NULL,
  initial_cid10 TEXT,
  responsible_doctor TEXT NOT NULL,
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('particular','convênio','ips','sanidade_militar','sanidade_policial','seguro_privado','corporativo','mercosul')),
  coverage_authorization TEXT DEFAULT '',
  bed_id TEXT REFERENCES beds_v2(id) ON DELETE SET NULL,
  bed_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('ativa','alta_medica','alta_voluntaria','alta_administrativa','transferencia','obito')) DEFAULT 'ativa',
  discharge_date TIMESTAMP WITH TIME ZONE,
  discharge_summary TEXT,
  discharge_doctor TEXT,
  transfer_institution TEXT,
  death_cause TEXT,
  death_certificate TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 7. EVOLUÇÃO MÉDICA
-- ==========================================
CREATE TABLE medical_evolutions (
  id TEXT PRIMARY KEY,
  hospitalization_id TEXT REFERENCES hospitalizations(id) ON DELETE CASCADE NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  doctor TEXT NOT NULL,
  subjective TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  assessment TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT '',
  vital_signs JSONB DEFAULT '{}'::JSONB,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 8. FOLHA DE ENFERMAGEM
-- ==========================================
CREATE TABLE nursing_sheets (
  id TEXT PRIMARY KEY,
  hospitalization_id TEXT REFERENCES hospitalizations(id) ON DELETE CASCADE NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('manha','tarde','noite')),
  nurse TEXT NOT NULL,
  vital_signs JSONB DEFAULT '[]'::JSONB,
  fluid_balance JSONB DEFAULT '{}'::JSONB,
  medications JSONB DEFAULT '[]'::JSONB,
  interventions JSONB DEFAULT '[]'::JSONB,
  observations TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 9. ALERTAS HOSPITALARES
-- ==========================================
CREATE TABLE hospital_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('alta_prevista','tempo_internacao_excedido','limpeza_excedida','conflito_sala','checklist_pendente')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')) DEFAULT 'info',
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT
);

-- ==========================================
-- RLS POLICIES
-- ==========================================
ALTER TABLE beds_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bed_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgery_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgical_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE intraoperative_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read beds_v2" ON beds_v2 FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes beds_v2" ON beds_v2 FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read bed_transfers" ON bed_transfers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes bed_transfers" ON bed_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read surgery_schedule" ON surgery_schedule FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes surgery_schedule" ON surgery_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read surgical_checklists" ON surgical_checklists FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes surgical_checklists" ON surgical_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read intraoperative_records" ON intraoperative_records FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes intraoperative_records" ON intraoperative_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read hospitalizations" ON hospitalizations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes hospitalizations" ON hospitalizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read medical_evolutions" ON medical_evolutions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes medical_evolutions" ON medical_evolutions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read nursing_sheets" ON nursing_sheets FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes nursing_sheets" ON nursing_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read hospital_alerts" ON hospital_alerts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes hospital_alerts" ON hospital_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- NOTA: Para habilitar atualização automática do updated_at,
-- utilize trigger ou mantenha via aplicação.
-- ==========================================
