-- ==========================================
-- IAMED DATABASE SCHEMA & SEED DATA
-- Copie e cole este script no editor SQL do seu console do Supabase.
-- ==========================================

-- Limpeza preventiva de tabelas
DROP TABLE IF EXISTS professionals CASCADE;
DROP TABLE IF EXISTS aso_exams CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS financial_postings CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS clinical_history CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Perfis de Operadores
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Recepcionista', 'Médico', 'Gestor', 'Servidor', 'Diretor Clínico')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Pacientes
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birthdate DATE NOT NULL,
  gender TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'preferencial', 'emergência')),
  status TEXT NOT NULL CHECK (status IN ('agendado', 'aguardando', 'atendimento', 'atendido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Histórico Clínico (HCE)
CREATE TABLE clinical_history (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  type TEXT NOT NULL,
  diagnosis TEXT,
  cid10 TEXT,
  prescriptions TEXT[] DEFAULT '{}',
  notes TEXT NOT NULL,
  doctor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Consultas / Agendamentos
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmado', 'pendente', 'cancelado', 'atendido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Financeiro
CREATE TABLE financial_postings (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Estoque / Insumos
CREATE TABLE stock_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Leitos de Internação
CREATE TABLE beds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  wing TEXT NOT NULL CHECK (wing IN ('Alas Gerais', 'UTI', 'Centro Cirúrgico')),
  status TEXT NOT NULL CHECK (status IN ('disponível', 'ocupado')),
  patient_name TEXT,
  entry_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Auditoria (LGPD)
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  operator TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ip TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. ASO (Medicina do Trabalho)
CREATE TABLE aso_exams (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Admissional', 'Periódico', 'Demissional')),
  risks TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('apto', 'inapto')),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  doctor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Documentos Tributários Eletrônicos (DTE/SIFEN)
CREATE TABLE dtes (
  id TEXT PRIMARY KEY,
  cdc TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Fatura Eletrônica', 'Nota de Crédito', 'Nota de Débito', 'Nota de Remessa', 'Autofatura')),
  number TEXT NOT NULL,
  timbrado TEXT NOT NULL,
  establishment TEXT NOT NULL,
  expedition_point TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT,
  patient_phone TEXT,
  ruc TEXT,
  date DATE NOT NULL,
  amount NUMERIC(12,0) NOT NULL,
  iva_5 NUMERIC(12,0) DEFAULT 0,
  iva_10 NUMERIC(12,0) DEFAULT 0,
  environment TEXT NOT NULL CHECK (environment IN ('homologacao', 'producao')),
  status TEXT NOT NULL CHECK (status IN ('Gerado', 'Pendente de Envio', 'Enviado', 'Aprovado', 'Rejeitado', 'Cancelado', 'Inutilizado')),
  payment_gateway TEXT CHECK (payment_gateway IN ('Bancard', 'Pagopar', 'Tigo Money', 'Personal Pay', 'Eko Network', 'Transferência') OR payment_gateway IS NULL),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pendente', 'pago', 'conciliado', 'cancelado')),
  xml_content TEXT,
  rejection_reason TEXT,
  items JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Profissionais de Saúde
CREATE TABLE professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Médico(a)', 'Enfermeiro(a)', 'Fisioterapeuta', 'Psicólogo(a)', 'Nutricionista', 'Técnico(a) de Enfermagem', 'Administrador(a)', 'Recepcionista')),
  specialty TEXT NOT NULL,
  council TEXT NOT NULL CHECK (council IN ('CRM', 'COREN', 'CREFITO', 'CFP', 'CFN', 'CRO', 'N/A')),
  council_number TEXT NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('Manhã', 'Tarde', 'Noite', 'Integral', 'Plantão 12h', 'Plantão 24h')),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo', 'férias')),
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  color TEXT,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para profissionais
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Allow public read access" ON professionals FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON professionals FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ==========================================
-- SEED DATA - INSERÇÃO DE DADOS INICIAIS
-- ==========================================

-- Pacientes
INSERT INTO patients (id, name, email, phone, birthdate, gender, priority, status) VALUES
('pat_1', 'Carlos Eduardo Almeida', 'carlos.almeida@gmail.com', '(11) 98765-4321', '1984-06-15', 'Masculino', 'normal', 'aguardando'),
('pat_2', 'Mariana Rosa Santos', 'mariana.santos@yahoo.com.br', '(11) 91234-5678', '1998-11-28', 'Feminino', 'preferencial', 'atendimento'),
('pat_3', 'Joaquim Bento Pereira', 'joaquim.pereira@outlook.com', '(21) 99888-7766', '1959-02-03', 'Masculino', 'preferencial', 'agendado'),
('pat_4', 'Ana Júlia de Souza', 'anajulia.souza@gmail.com', '(11) 97777-8888', '2011-09-02', 'Feminino', 'emergência', 'aguardando'),
('pat_5', 'Roberto de Oliveira Cruz', 'roberto.cruz@industria.com.br', '(19) 98122-3344', '1991-07-24', 'Masculino', 'normal', 'atendido');

-- Histórico Clínico (HCE)
INSERT INTO clinical_history (id, patient_id, date, type, diagnosis, cid10, prescriptions, notes, doctor) VALUES
('his_1', 'pat_1', '2026-03-10', 'Consulta Ortopédica', 'Tendinite de Aquiles', 'M76.6', ARRAY['Ibuprofeno 600mg', 'Fisioterapia 10 sessões'], 'Paciente relata dor ao correr. Iniciado tratamento conservador.', 'Dr. Adriano Lima'),
('his_2', 'pat_1', '2026-05-22', 'Consulta Geral', 'Hipertensão arterial primária', 'I10', ARRAY['Losartana Potássica 50mg'], 'Pressão aferida: 140/90 mmHg. Recomendado acompanhamento.', 'Dra. Amanda Silva'),
('his_3', 'pat_2', '2026-04-15', 'Acompanhamento Ginecológico', 'Gravidez de baixo risco (Pré-natal)', 'Z34.0', ARRAY['Ácido Fólico 5mg', 'Sulfato Ferroso 40mg'], 'Primeiro trimestre, ultrassom inicial confirma 8 semanas normais.', 'Dra. Amanda Silva'),
('his_4', 'pat_3', '2026-01-20', 'Consulta Ortopédica', 'Lombocatalgia crônica', 'M54.5', ARRAY['Pregabalina 75mg', 'Alongamentos diários'], 'Dor lombar há mais de 3 anos, irradia para membro inferior esquerdo.', 'Dr. Adriano Lima'),
('his_5', 'pat_5', '2025-06-20', 'Exame de Medicina do Trabalho', 'Aptidão no trabalho em altura (NR-35)', 'Z02.7', ARRAY[]::TEXT[], 'Exame de acuidade visual, ECG e EEG normais. Homologado.', 'Dr. Bruno Castro');

-- Consultas
INSERT INTO appointments (id, patient_id, patient_name, doctor_name, specialty, date, time, status) VALUES
('app_1', 'pat_3', 'Joaquim Bento Pereira', 'Dr. Adriano Lima', 'Ortopedia', '2026-06-22', '09:00:00', 'confirmado'),
('app_2', 'pat_1', 'Carlos Eduardo Almeida', 'Dra. Amanda Silva', 'Cardiologia', '2026-06-22', '10:30:00', 'confirmado'),
('app_3', 'pat_2', 'Mariana Rosa Santos', 'Dr. Bruno Castro', 'Clínico Geral', '2026-06-22', '13:00:00', 'atendido'),
('app_4', 'pat_5', 'Roberto de Oliveira Cruz', 'Dr. Bruno Castro', 'Medicina do Trabalho', '2026-06-23', '14:15:00', 'pendente');

-- Financeiro
INSERT INTO financial_postings (id, description, type, amount, category, date) VALUES
('fin_1', 'Faturamento Consulta - Plano Amil (Carlos)', 'receita', 150.00, 'Consultas', '2026-06-21'),
('fin_2', 'Procedimento Raio-X - Particular', 'receita', 220.00, 'Exames de Imagem', '2026-06-21'),
('fin_3', 'Compra de Insumos - Seringas e Gaze', 'despesa', 480.00, 'Insumos Médicos', '2026-06-20'),
('fin_4', 'Faturamento Internação Particular', 'receita', 1250.00, 'Internação', '2026-06-19'),
('fin_5', 'Energia Elétrica e Telefonia Clínica', 'despesa', 890.00, 'Operacional', '2026-06-18'),
('fin_6', 'Assessoria Jurídica e Contábil', 'despesa', 1200.00, 'Serviços', '2026-06-15');

-- Estoque
INSERT INTO stock_items (id, name, category, quantity, min_quantity, unit) VALUES
('stk_1', 'Amoxicilina 500mg (Cps)', 'Antibióticos', 240, 50, 'cápsulas'),
('stk_2', 'Insulina NPH 10ml', 'Insumo Diabéticos', 8, 10, 'frascos'),
('stk_3', 'Seringas Descartáveis Luer Lock 5ml', 'Consumíveis', 1500, 300, 'unidades'),
('stk_4', 'Dipirona Monoidratada Gotas', 'Analgésicos', 38, 15, 'frascos'),
('stk_5', 'Cateter Gelco calibre 20G', 'Cirúrgico', 12, 40, 'unidades');

-- Leitos
INSERT INTO beds (id, name, wing, status, patient_name, entry_date) VALUES
('bd_1', 'Leito 101-A (Enfermaria)', 'Alas Gerais', 'ocupado', 'Carlos Eduardo Almeida', '2026-06-21'),
('bd_2', 'Leito 101-B (Enfermaria)', 'Alas Gerais', 'disponível', NULL, NULL),
('bd_3', 'UTI Cardiológica — Box 01', 'UTI', 'disponível', NULL, NULL),
('bd_4', 'Sala Cirúrgica Alpha', 'Centro Cirúrgico', 'ocupado', 'Mariana Rosa Santos', '2026-06-21');

-- Auditoria
INSERT INTO audit_logs (id, operator, role, action, target, timestamp, ip) VALUES
('log_1', 'Marcela Ramos', 'Recepcionista', 'Visualizou Prontuário', 'Carlos Eduardo Almeida', '2026-06-21 11:34:00', '192.168.1.45'),
('log_2', 'Dra. Amanda Silva', 'Médico', 'Adicionou Diagnóstico', 'Mariana Rosa Santos', '2026-06-21 11:12:00', '10.0.0.12'),
('log_3', 'Adriano Lima', 'Gestor', 'Baixou Lote SIFEN', 'SIFEN XML #302', '2026-06-21 10:20:00', '192.168.1.10'),
('log_4', 'Sistema IAMED', 'Servidor', 'Backup Automático', 'Database_Cloud', '2026-06-21 04:00:00', '127.0.0.1');

-- ASOs
INSERT INTO aso_exams (id, patient_name, type, risks, status, date, doctor) VALUES
('aso_1', 'Roberto de Oliveira Cruz', 'Periódico', ARRAY['Ruído Contínuo', 'Ergonômico', 'Trabalho em Altura'], 'apto', '2026-06-21', 'Dr. Bruno Castro'),
('aso_2', 'Cláudio Siqueira', 'Admissional', ARRAY['Postura Física', 'Poeira Mineral'], 'apto', '2026-06-20', 'Dr. Bruno Castro');

-- DTEs (Documentos Tributários Eletrônicos - SIFEN)
INSERT INTO dtes (id, cdc, type, number, timbrado, establishment, expedition_point, patient_name, patient_email, patient_phone, date, amount, iva_5, iva_10, environment, status, payment_gateway, payment_status, items) VALUES
('dte_1', '01800695631001001000000012026062800191234567', 'Fatura Eletrônica', '001-001-0000001', '12345678', '001', '001', 'Carlos Eduardo Almeida', 'carlos.almeida@gmail.com', '+595981234567', '2026-06-21', 750000, 0, 68182, 'producao', 'Aprovado', 'Bancard', 'conciliado', '[{"code":"10101012","description":"Consulta Médica Cardiológica","quantity":1,"unit_price":750000,"iva_rate":10,"total":750000}]'::JSONB),
('dte_2', '01800695631001001000000022026062800292345678', 'Fatura Eletrônica', '001-001-0000002', '12345678', '001', '001', 'Mariana Rosa Santos', 'mariana.santos@yahoo.com.br', '+595991234567', '2026-06-21', 1100000, 0, 100000, 'producao', 'Enviado', 'Tigo Money', 'pendente', '[{"code":"40201011","description":"Ultrassonografia Obstétrica","quantity":1,"unit_price":1100000,"iva_rate":10,"total":1100000}]'::JSONB),
('dte_3', '01800695631001001000000032026062200393456789', 'Nota de Crédito', '001-001-0000003', '12345678', '001', '001', 'Joaquim Bento Pereira', NULL, NULL, '2026-06-22', 200000, 0, 18182, 'producao', 'Aprovado', NULL, 'conciliado', '[{"code":"10101012","description":"Consulta Ortopédica - Estorno","quantity":1,"unit_price":200000,"iva_rate":10,"total":200000}]'::JSONB);

-- Profissionais de Saúde
INSERT INTO professionals (id, name, role, specialty, council, council_number, shift, email, phone, status, admission_date, color, permissions) VALUES
('prof_1', 'Dra. Amanda Silva', 'Médico(a)', 'Cardiologia', 'CRM', 'CRM-SP 112345', 'Manhã', 'amanda.silva@iamed.med.br', '+55 11 99876-5432', 'ativo', '2022-03-01', 'bg-teal-500', ARRAY['view_reception', 'view_agenda', 'view_hce', 'view_diagnostic', 'view_med_work', 'perform_prescribe']),
('prof_2', 'Dr. Adriano Lima', 'Médico(a)', 'Ortopedia', 'CRM', 'CRM-SP 234567', 'Tarde', 'adriano.lima@iamed.med.br', '+55 11 99765-4321', 'ativo', '2021-07-15', 'bg-indigo-500', ARRAY['view_reception', 'view_agenda', 'view_hce', 'view_diagnostic', 'view_finance', 'view_stock', 'view_med_work', 'view_crm', 'view_security', 'perform_admit', 'perform_prescribe', 'perform_sifen', 'perform_post_finance', 'perform_stock', 'perform_beds', 'perform_rbac']),
('prof_3', 'Dr. Bruno Castro', 'Médico(a)', 'Medicina do Trabalho', 'CRM', 'CRM-SP 345678', 'Integral', 'bruno.castro@iamed.med.br', '+55 11 98654-3210', 'ativo', '2020-01-10', 'bg-rose-500', ARRAY['view_agenda', 'view_hce', 'view_diagnostic', 'view_med_work', 'perform_prescribe']),
('prof_4', 'Enf. Marcela Ramos', 'Enfermeiro(a)', 'Enfermagem Clínica', 'COREN', 'COREN-SP 456789', 'Plantão 12h', 'marcela.ramos@iamed.med.br', '+55 11 97543-2109', 'ativo', '2023-02-20', 'bg-sky-500', ARRAY['view_reception', 'view_agenda', 'view_diagnostic', 'perform_admit', 'perform_beds']),
('prof_5', 'Fis. Camila Torres', 'Fisioterapeuta', 'Fisioterapia Ortopédica', 'CREFITO', 'CREFITO-3 567890', 'Manhã', 'camila.torres@iamed.med.br', '+55 11 96432-1098', 'férias', '2023-08-05', 'bg-violet-500', ARRAY['view_agenda', 'view_hce']);

-- ==========================================
-- ESTOQUE E FARMÁCIA
-- ==========================================

-- 12. Itens da Farmácia/Estoque
CREATE TABLE pharmacy_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active_principle TEXT,
  category TEXT NOT NULL CHECK (category IN ('venda_livre', 'sob_receita', 'controlado', 'entorpecente', 'psicotropico', 'uso_hospitalar', 'biologico', 'insumo', 'descartavel', 'material')),
  form TEXT CHECK (form IN ('comprimido', 'capsula', 'ampola', 'frasco', 'seringa', 'spray', 'creme', 'pomada', 'gel', 'solucao', 'po', 'outro')),
  presentation TEXT NOT NULL DEFAULT '',
  manufacturer TEXT NOT NULL DEFAULT '',
  dinavisa_registration TEXT NOT NULL,
  requires_prescription BOOLEAN DEFAULT FALSE,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  storage_location TEXT NOT NULL DEFAULT '',
  unit_cost NUMERIC(12,0) DEFAULT 0,
  unit_price NUMERIC(12,0) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Controle de Lotes
CREATE TABLE lot_controls (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES pharmacy_items(id) ON DELETE CASCADE NOT NULL,
  lot_number TEXT NOT NULL,
  serial_number TEXT,
  manufacture_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  initial_quantity INTEGER NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC(12,0) DEFAULT 0,
  dinavisa_registration TEXT NOT NULL,
  dte_entry_number TEXT,
  supplier_name TEXT,
  supplier_ruc TEXT,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('disponivel', 'bloqueado', 'vencido', 'recolhido')) DEFAULT 'disponivel',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. Movimentações de Estoque
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES pharmacy_items(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  lot_id TEXT REFERENCES lot_controls(id) ON DELETE CASCADE NOT NULL,
  lot_number TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste', 'inventario', 'devolucao', 'perda')),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(12,0) DEFAULT 0,
  total_cost NUMERIC(12,0) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  operator_name TEXT NOT NULL DEFAULT '',
  dte_number TEXT,
  supplier_name TEXT,
  patient_id TEXT,
  patient_name TEXT,
  procedure_name TEXT,
  room TEXT,
  sector TEXT,
  hospitalization_id TEXT,
  prescription_id TEXT,
  doctor_name TEXT,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 15. Inventário Físico
CREATE TABLE inventory_counts (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  operator_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('programado', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'programado',
  items JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 16. Farmacovigilância - Reações Adversas (RAM)
CREATE TABLE adverse_events (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_id TEXT,
  medication_name TEXT NOT NULL,
  item_id TEXT REFERENCES pharmacy_items(id) ON DELETE SET NULL,
  lot_id TEXT REFERENCES lot_controls(id) ON DELETE SET NULL,
  lot_number TEXT NOT NULL,
  adverse_reaction TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('leve', 'moderada', 'grave', 'fatal')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  outcome TEXT NOT NULL CHECK (outcome IN ('recuperado', 'recuperando', 'nao_recuperado', 'obito', 'desconhecido')),
  suspected_drug BOOLEAN DEFAULT TRUE,
  concomitant_drugs TEXT[] DEFAULT '{}',
  description TEXT NOT NULL,
  notifier_name TEXT NOT NULL,
  notifier_role TEXT NOT NULL,
  notification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('rascunho', 'notificado', 'em_analise', 'arquivado')) DEFAULT 'notificado',
  dinavisa_protocol TEXT,
  dinavisa_response TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 17. Farmacovigilância - Desvios de Qualidade
CREATE TABLE quality_deviations (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES pharmacy_items(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  lot_id TEXT REFERENCES lot_controls(id) ON DELETE CASCADE NOT NULL,
  lot_number TEXT NOT NULL,
  deviation_type TEXT NOT NULL CHECK (deviation_type IN ('quebra', 'contaminacao', 'rotulagem', 'embalagem', 'esterilidade', 'potencia', 'outro')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('leve', 'moderada', 'grave', 'fatal')),
  affected_quantity INTEGER NOT NULL DEFAULT 0,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reporter_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('aberto', 'investigacao', 'concluido', 'arquivado')) DEFAULT 'aberto',
  corrective_action TEXT,
  root_cause TEXT,
  closed_at DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 18. Farmacovigilância - Recolhimento de Lotes
CREATE TABLE batch_recalls (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES pharmacy_items(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  lot_id TEXT REFERENCES lot_controls(id) ON DELETE CASCADE NOT NULL,
  lot_number TEXT NOT NULL,
  recall_type TEXT NOT NULL CHECK (recall_type IN ('fabricante', 'dinavisa', 'interna')),
  reason TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('baixo', 'medio', 'alto', 'critico')),
  alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
  affected_quantity INTEGER NOT NULL DEFAULT 0,
  recollected_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'concluido', 'monitoramento')) DEFAULT 'ativo',
  dinavisa_notice TEXT,
  instructions TEXT,
  completed_at DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE pharmacy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE adverse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_recalls ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Allow public read access" ON pharmacy_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON pharmacy_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON lot_controls FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON lot_controls FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON inventory_counts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON inventory_counts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON adverse_events FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON adverse_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON quality_deviations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON quality_deviations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON batch_recalls FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON batch_recalls FOR ALL TO authenticated USING (true) WITH CHECK (true);
