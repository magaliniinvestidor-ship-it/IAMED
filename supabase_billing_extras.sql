-- ==========================================
-- IAMED - NOVAS TABELAS DE FATURAMENTO
-- Convênios, Honorários, Coparticipação, Lotes, Elegibilidade, Repasse, Estrangeiros
-- ==========================================

-- Limpeza preventiva
DROP TABLE IF EXISTS foreign_billings CASCADE;
DROP TABLE IF EXISTS professional_settlements CASCADE;
DROP TABLE IF EXISTS eligibility_checks CASCADE;
DROP TABLE IF EXISTS batch_invoices CASCADE;
DROP TABLE IF EXISTS pre_authorizations CASCADE;
DROP TABLE IF EXISTS fee_schedules CASCADE;
DROP TABLE IF EXISTS insurance_companies CASCADE;

-- 1. Convênios / Seguradoras
CREATE TABLE insurance_companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('IPS', 'Sanidade Militar', 'Sanidade Policial', 'EMP', 'Seguro Privado', 'Corporativo', 'Particular', 'Mercosul')),
  ruc TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  has_webservice BOOLEAN DEFAULT FALSE,
  webservice_url TEXT,
  requires_authorization BOOLEAN DEFAULT FALSE,
  requires_pre_approval BOOLEAN DEFAULT FALSE,
  copay_rules TEXT,
  coverage_ceiling NUMERIC(12,0) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela de Honorários Parametrizável
CREATE TABLE fee_schedules (
  id TEXT PRIMARY KEY,
  insurance_type TEXT NOT NULL,
  insurance_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  procedure_code TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  base_price NUMERIC(12,0) NOT NULL,
  repasse_percent NUMERIC(5,2) NOT NULL DEFAULT 60,
  copay_amount NUMERIC(12,0) DEFAULT 0,
  copay_percent NUMERIC(5,2) DEFAULT 0,
  coverage_limit NUMERIC(12,0) DEFAULT 0,
  requires_authorization BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Autorizações Prévias
CREATE TABLE pre_authorizations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  insurance_id TEXT REFERENCES insurance_companies(id) ON DELETE SET NULL,
  insurance_name TEXT NOT NULL,
  procedure_code TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  requested_amount NUMERIC(12,0) NOT NULL,
  authorized_amount NUMERIC(12,0),
  status TEXT NOT NULL CHECK (status IN ('solicitada', 'autorizada', 'negada', 'parcial')),
  authorization_number TEXT,
  request_date DATE NOT NULL,
  response_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Lotes Massivos de Faturamento
CREATE TABLE batch_invoices (
  id TEXT PRIMARY KEY,
  insurance_id TEXT REFERENCES insurance_companies(id) ON DELETE SET NULL,
  insurance_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount NUMERIC(12,0) NOT NULL,
  dte_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('gerado', 'enviado', 'aprovado', 'rejeitado')),
  dte_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Consulta de Elegibilidade
CREATE TABLE eligibility_checks (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  insurance_id TEXT REFERENCES insurance_companies(id) ON DELETE SET NULL,
  insurance_name TEXT NOT NULL,
  procedure_code TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'coberto', 'negado', 'erro')),
  coverage_percent NUMERIC(5,2) DEFAULT 0,
  copay_amount NUMERIC(12,0) DEFAULT 0,
  network TEXT,
  authorization_required BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  response TEXT
);

-- 6. Controle de Honorários e Repasse
CREATE TABLE professional_settlements (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  professional_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_amount NUMERIC(12,0) NOT NULL,
  deductions NUMERIC(12,0) DEFAULT 0,
  net_amount NUMERIC(12,0) NOT NULL,
  irp_withheld NUMERIC(12,0) DEFAULT 0,
  iva_withheld NUMERIC(12,0) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('calculado', 'liquidado', 'pago')),
  dte_ids TEXT[] DEFAULT '{}',
  settlement_date DATE,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Faturamento Pacientes Estrangeiros
CREATE TABLE foreign_billings (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'ARS', 'BRL', 'EUR')),
  exchange_rate NUMERIC(12,2) DEFAULT 1,
  amount_local NUMERIC(12,0) NOT NULL,
  amount_foreign NUMERIC(12,2) NOT NULL,
  documents_generated TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('gerado', 'entregue', 'reembolsado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE foreign_billings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON insurance_companies FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON insurance_companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON fee_schedules FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON fee_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON pre_authorizations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON pre_authorizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON batch_invoices FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON batch_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON eligibility_checks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON eligibility_checks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON professional_settlements FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON professional_settlements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON foreign_billings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON foreign_billings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Data - Insurance Companies
INSERT INTO insurance_companies (id, name, type, ruc, contact, phone, email, has_webservice, webservice_url, requires_authorization, requires_pre_approval, copay_rules, coverage_ceiling, active) VALUES
('ins_1', 'IPS - Instituto de Previsión Social', 'IPS', '80005123-1', 'Lic. María González', '+59521234567', 'facturacion@ips.gov.py', TRUE, 'https://ws.ips.gov.py/elegibilidad', TRUE, TRUE, 'Copago 5% sobre nomenclador IPS', 50000000, TRUE),
('ins_2', 'Sanidad Militar - FF.AA.', 'Sanidade Militar', '80010001-2', 'Gral. Rodríguez', '+59521230000', 'sanidad@mdn.gov.py', TRUE, 'https://ws.sanidad.mil.py/cobertura', TRUE, TRUE, 'Sin copago para personal activo', 30000000, TRUE),
('ins_3', 'Sanidad Policial - P.N.', 'Sanidade Policial', '80020001-1', 'Comisario Benítez', '+59521240000', 'sanidad@policia.gov.py', FALSE, '', TRUE, FALSE, 'Copago 10% sobre tabla', 20000000, TRUE),
('ins_4', 'Plan Med Salud', 'EMP', '80069563-1', 'Sr. López', '+595981111111', 'facturacion@planmed.com.py', TRUE, 'https://api.planmed.com.py/v2/elegibilidad', TRUE, TRUE, 'Copago fijo 50.000 Gs. consulta; 20% procedimientos', 100000000, TRUE),
('ins_5', 'Seguros Yacyretá S.A.', 'Seguro Privado', '80045678-1', 'Lic. Martínez', '+59521222222', 'reembolso@yacyreta.com.py', TRUE, 'https://ws.yacyreta.com.py/cobertura', FALSE, FALSE, 'Reembolso 80% tabla referencial', 150000000, TRUE),
('ins_6', 'Grupo Industrial Norte S.A.', 'Corporativo', '80123456-1', 'Sra. Duarte', '+595985555555', 'rh@norte.com.py', FALSE, '', FALSE, FALSE, 'Descuento 15% convenio corporativo', 80000000, TRUE);

-- Seed Data - Fee Schedule
INSERT INTO fee_schedules (id, insurance_type, insurance_name, specialty, procedure_code, procedure_name, base_price, repasse_percent, copay_amount, copay_percent, coverage_limit, requires_authorization, active) VALUES
('fee_1', 'Particular', 'Particular', 'Clínica Geral', '10101012', 'Consulta Médica Geral', 150000, 60, 0, 0, 0, FALSE, TRUE),
('fee_2', 'IPS', 'IPS - Instituto de Previsión Social', 'Cardiologia', '10101025', 'Consulta Cardiológica', 120000, 55, 6000, 5, 5000000, TRUE, TRUE),
('fee_3', 'EMP', 'Plan Med Salud', 'Cardiologia', '10101025', 'Consulta Cardiológica', 200000, 60, 50000, 0, 10000000, TRUE, TRUE),
('fee_4', 'Sanidade Militar', 'Sanidad Militar - FF.AA.', 'Ortopedia', '10101012', 'Consulta Médica Geral', 90000, 50, 0, 0, 3000000, TRUE, TRUE),
('fee_5', 'Seguro Privado', 'Seguros Yacyretá S.A.', 'Cardiologia', '40201011', 'Ultrassonografia Obstétrica', 500000, 65, 0, 0, 0, FALSE, TRUE),
('fee_6', 'Corporativo', 'Grupo Industrial Norte S.A.', 'Clínica Geral', '10101012', 'Consulta Médica Geral', 127500, 60, 0, 0, 0, FALSE, TRUE),
('fee_7', 'Particular', 'Particular', 'Radiologia', '30101000', 'Raio-X Tórax (2 incidências)', 180000, 50, 0, 0, 0, FALSE, TRUE),
('fee_8', 'Sanidade Policial', 'Sanidad Policial - P.N.', 'Clínica Geral', '10101012', 'Consulta Médica Geral', 80000, 50, 8000, 10, 2000000, FALSE, TRUE);

-- Seed Data - Pre-Authorizations
INSERT INTO pre_authorizations (id, patient_id, patient_name, insurance_id, insurance_name, procedure_code, procedure_name, requested_amount, authorized_amount, status, authorization_number, request_date, response_date, notes) VALUES
('pre_1', 'pat_1', 'Carlos Eduardo Almeida', 'ins_1', 'IPS - Instituto de Previsión Social', '40201011', 'Ultrassonografia Obstétrica', 500000, 450000, 'autorizada', 'AUTH-2026-0042', '2026-06-15', '2026-06-17', 'Autorizado parcial - 90% cobertura'),
('pre_2', 'pat_2', 'Mariana Rosa Santos', 'ins_4', 'Plan Med Salud', '40201011', 'Ultrassonografia Obstétrica', 500000, 500000, 'autorizada', 'AUTH-2026-0045', '2026-06-18', '2026-06-19', 'Autorizado total conforme plano');

-- Seed Data - Batch Invoices
INSERT INTO batch_invoices (id, insurance_id, insurance_name, period_start, period_end, total_amount, dte_count, status, dte_ids) VALUES
('batch_1', 'ins_1', 'IPS - Instituto de Previsión Social', '2026-06-01', '2026-06-30', 2350000, 3, 'gerado', ARRAY['dte_1', 'dte_2']),
('batch_2', 'ins_4', 'Plan Med Salud', '2026-06-01', '2026-06-30', 1100000, 1, 'enviado', ARRAY['dte_3']);

-- Seed Data - Eligibility Checks
INSERT INTO eligibility_checks (id, patient_id, patient_name, insurance_id, insurance_name, procedure_code, procedure_name, status, coverage_percent, copay_amount, network, authorization_required, checked_at, response) VALUES
('elig_1', 'pat_1', 'Carlos Eduardo Almeida', 'ins_1', 'IPS - Instituto de Previsión Social', '10101025', 'Consulta Cardiológica', 'coberto', 95, 6000, 'RED_IPS', TRUE, '2026-06-22T08:00:00', 'Contribuyente activo. Cobertura vigente. Autorización requerida: S01'),
('elig_2', 'pat_2', 'Mariana Rosa Santos', 'ins_4', 'Plan Med Salud', '40201011', 'Ultrassonografia Obstétrica', 'coberto', 100, 0, 'RED_PLANMED', TRUE, '2026-06-22T08:05:00', 'Plan Premium vigente. Sin copago para estudios obstétricos.');

-- Seed Data - Professional Settlements
INSERT INTO professional_settlements (id, professional_id, professional_name, period_start, period_end, gross_amount, deductions, net_amount, irp_withheld, iva_withheld, status, dte_ids, settlement_date, payment_date) VALUES
('sett_1', 'prof_1', 'Dra. Amanda Silva', '2026-06-01', '2026-06-15', 3500000, 525000, 2975000, 105000, 420000, 'liquidado', ARRAY['dte_1', 'dte_2'], '2026-06-20', '2026-06-22'),
('sett_2', 'prof_2', 'Dr. Adriano Lima', '2026-06-01', '2026-06-15', 2800000, 420000, 2380000, 84000, 336000, 'pago', ARRAY['dte_3'], '2026-06-20', '2026-06-21');

-- Seed Data - Foreign Billings
INSERT INTO foreign_billings (id, patient_id, patient_name, country, currency, exchange_rate, amount_local, amount_foreign, documents_generated, status) VALUES
('frn_1', 'pat_5', 'Roberto de Oliveira Cruz', 'BR', 'USD', 7500, 450000, 60, ARRAY['Invoice_INV-2026-001.pdf', 'Recibo_Rec-2026-001.pdf'], 'gerado');
