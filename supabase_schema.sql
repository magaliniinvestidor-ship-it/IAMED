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

-- 10. Profissionais de Saúde
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

-- Profissionais de Saúde
INSERT INTO professionals (id, name, role, specialty, council, council_number, shift, email, phone, status, admission_date, color) VALUES
('prof_1', 'Dra. Amanda Silva', 'Médico(a)', 'Cardiologia', 'CRM', 'CRM-SP 112345', 'Manhã', 'amanda.silva@iamed.med.br', '+55 11 99876-5432', 'ativo', '2022-03-01', 'bg-teal-500'),
('prof_2', 'Dr. Adriano Lima', 'Médico(a)', 'Ortopedia', 'CRM', 'CRM-SP 234567', 'Tarde', 'adriano.lima@iamed.med.br', '+55 11 99765-4321', 'ativo', '2021-07-15', 'bg-indigo-500'),
('prof_3', 'Dr. Bruno Castro', 'Médico(a)', 'Medicina do Trabalho', 'CRM', 'CRM-SP 345678', 'Integral', 'bruno.castro@iamed.med.br', '+55 11 98654-3210', 'ativo', '2020-01-10', 'bg-rose-500'),
('prof_4', 'Enf. Marcela Ramos', 'Enfermeiro(a)', 'Enfermagem Clínica', 'COREN', 'COREN-SP 456789', 'Plantão 12h', 'marcela.ramos@iamed.med.br', '+55 11 97543-2109', 'ativo', '2023-02-20', 'bg-sky-500'),
('prof_5', 'Fis. Camila Torres', 'Fisioterapeuta', 'Fisioterapia Ortopédica', 'CREFITO', 'CREFITO-3 567890', 'Manhã', 'camila.torres@iamed.med.br', '+55 11 96432-1098', 'férias', '2023-08-05', 'bg-violet-500');
