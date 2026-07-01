-- ==========================================
-- IAMED - CRM & MARKETING DE PACIENTES
-- Captação, retenção e reativação
-- Conforme Lei 1682/2001 (Paraguai)
-- ==========================================

DROP TABLE IF EXISTS crm_webform_leads CASCADE;
DROP TABLE IF EXISTS crm_optouts CASCADE;
DROP TABLE IF EXISTS crm_nps_surveys CASCADE;
DROP TABLE IF EXISTS crm_opportunities CASCADE;
DROP TABLE IF EXISTS crm_leads CASCADE;
DROP TABLE IF EXISTS crm_campaigns CASCADE;

-- 1. Campanhas
CREATE TABLE crm_campaigns (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('whatsapp', 'sms', 'email')),
  template TEXT NOT NULL DEFAULT '',
  segmento_alvo TEXT NOT NULL DEFAULT '',
  mensagem TEXT NOT NULL,
  data_disparo DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('rascunho', 'agendada', 'enviada', 'cancelada')) DEFAULT 'rascunho',
  total_contatos INTEGER DEFAULT 0,
  total_enviados INTEGER DEFAULT 0,
  total_falhas INTEGER DEFAULT 0,
  total_optout INTEGER DEFAULT 0,
  consentimento_obrigatorio BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Leads
CREATE TABLE crm_leads (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  origem TEXT NOT NULL CHECK (origem IN ('site', 'whatsapp', 'facebook', 'instagram', 'google', 'indicacao', 'presencial', 'outro')),
  data_primeiro_contato DATE NOT NULL DEFAULT CURRENT_DATE,
  etapa_funil TEXT NOT NULL CHECK (etapa_funil IN ('lead', 'primeiro_contato', 'primeira_consulta', 'paciente_recorrente')) DEFAULT 'lead',
  interesse TEXT,
  observacoes TEXT,
  ultimo_contato DATE,
  responsavel TEXT,
  convertido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Oportunidades Comerciais
CREATE TABLE crm_opportunities (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES crm_leads(id) ON DELETE SET NULL,
  paciente_nome TEXT NOT NULL,
  paciente_telefone TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('cirurgia_estetica', 'cirurgia_geral', 'odontologia', 'tratamento_clinico', 'exame', 'internacao', 'outro')),
  descricao TEXT NOT NULL,
  valor_estimado NUMERIC(12,0) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('aberta', 'em_negociacao', 'fechada_ganha', 'fechada_perdida')) DEFAULT 'aberta',
  probabilidade INTEGER DEFAULT 50,
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fechamento DATE,
  responsavel TEXT NOT NULL DEFAULT '',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Pesquisas NPS
CREATE TABLE crm_nps_surveys (
  id TEXT PRIMARY KEY,
  paciente_nome TEXT NOT NULL,
  paciente_id TEXT,
  data_atendimento DATE NOT NULL,
  data_resposta DATE,
  score INTEGER CHECK (score >= 0 AND score <= 10),
  comentario TEXT,
  categoria TEXT CHECK (categoria IN ('promotor', 'neutro', 'detrator')),
  origem TEXT NOT NULL CHECK (origem IN ('whatsapp', 'sms', 'email', 'app', 'presencial')),
  respondido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Opt-Out (descadastro)
CREATE TABLE crm_optouts (
  id TEXT PRIMARY KEY,
  paciente_nome TEXT NOT NULL DEFAULT '',
  paciente_contato TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'sms', 'email', 'todos')),
  data_optout DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo TEXT,
  ip_registro TEXT,
  confirmado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Leads de Formulários Web
CREATE TABLE crm_webform_leads (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT '',
  mensagem TEXT NOT NULL DEFAULT '',
  data_recebimento DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('novo', 'contatado', 'convertido', 'descartado')) DEFAULT 'novo',
  interesse TEXT,
  responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed: Campanhas
INSERT INTO crm_campaigns (id, nome, tipo, template, segmento_alvo, mensagem, data_disparo, status, total_contatos, total_enviados, total_falhas, total_optout, created_by) VALUES
('camp_1', 'Lembrete de Consultas 22/06', 'whatsapp', 'Lembrete de Consulta', 'Todos os pacientes com consulta em 22/06', 'Olá {{nome}}, confirmamos sua consulta amanhã às {{horario}}. Sua saúde é nossa prioridade!', '2026-06-21', 'enviada', 45, 43, 1, 1, 'Marcela Ramos'),
('camp_2', 'Campanha Vacinação Gripe 2026', 'sms', 'Aviso de Vacinação', 'Pacientes 60+ anos', 'Campanha de vacinação contra gripe ativa. Agende seu horário gratuitamente.', '2026-06-18', 'enviada', 128, 125, 2, 1, 'Marcela Ramos');

-- Seed: Leads
INSERT INTO crm_leads (id, nome, email, telefone, origem, data_primeiro_contato, etapa_funil, interesse, convertido) VALUES
('lead_1', 'Camila Benítez', 'camila@email.com', '+595 981 111 222', 'whatsapp', '2026-06-15', 'primeira_consulta', 'Cirurgia estética', false),
('lead_2', 'Roberto Martínez', 'roberto@email.com', '+595 982 333 444', 'site', '2026-06-10', 'primeiro_contato', 'Check-up geral', false),
('lead_3', 'Laura Villalba', NULL, '+595 983 555 666', 'instagram', '2026-06-05', 'lead', NULL, false),
('lead_4', 'Diego Ramírez', 'diego@email.com', NULL, 'indicacao', '2026-05-20', 'paciente_recorrente', 'Cardiologia', true);

-- Seed: Oportunidades
INSERT INTO crm_opportunities (id, lead_id, paciente_nome, paciente_telefone, tipo, descricao, valor_estimado, status, probabilidade, data_criacao, responsavel) VALUES
('opp_1', 'lead_1', 'Camila Benítez', '+595 981 111 222', 'cirurgia_estetica', 'Abdominoplastia pós-gestação', 8500000, 'em_negociacao', 60, '2026-06-15', 'Dra. Amanda Silva'),
('opp_2', NULL, 'Juan Pérez', '+595 984 777 888', 'odontologia', 'Implante dentário 3 elementos', 3200000, 'aberta', 30, '2026-06-12', 'Dr. Adriano Lima'),
('opp_3', NULL, 'Ana María López', '+595 985 999 000', 'cirurgia_geral', 'Colecistectomia laparoscópica', 12000000, 'fechada_ganha', 100, '2026-06-01', 'Dr. Bruno Castro');

-- Seed: NPS
INSERT INTO crm_nps_surveys (id, paciente_nome, paciente_id, data_atendimento, data_resposta, score, comentario, categoria, origem, respondido) VALUES
('nps_1', 'Alzira Maria', 'pat_1', '2026-06-20', '2026-06-20', 10, 'Excelente atendimento! O co-piloto IA ajudou muito.', 'promotor', 'whatsapp', true),
('nps_2', 'Filipe Antunes', 'pat_2', '2026-06-19', '2026-06-20', 9, 'Portal do paciente impressionante!', 'promotor', 'email', true),
('nps_3', 'Paula Gomes', 'pat_3', '2026-06-18', '2026-06-19', 8, 'Atendimento rápido e eficiente.', 'neutro', 'sms', true),
('nps_4', 'Roberto Oliveira', 'pat_5', '2026-06-15', '2026-06-16', 6, 'Demorou um pouco na espera.', 'neutro', 'whatsapp', true);

-- Seed: Opt-Outs
INSERT INTO crm_optouts (id, paciente_nome, paciente_contato, canal, data_optout, motivo, confirmado) VALUES
('opt_1', 'Marcos Pereira', '+595 986 111 222', 'whatsapp', '2026-06-10', 'Não deseja receber mensagens de marketing', true),
('opt_2', 'Lucía Fernández', 'lucia.f@email.com', 'email', '2026-06-08', 'Comunicações irrelevantes', true);

-- Seed: WebForm Leads
INSERT INTO crm_webform_leads (id, nome, email, telefone, origem, mensagem, data_recebimento, status, interesse) VALUES
('wfl_1', 'Sofia Mendoza', 'sofia@email.com', '+595 987 333 444', 'site - Formulário Contato', 'Gostaria de agendar uma consulta com cardiologista.', '2026-06-22', 'novo', 'Cardiologia'),
('wfl_2', 'Gustavo Rivas', 'gustavo@email.com', '+595 988 555 666', 'Facebook Ads', 'Tenho interesse em saber valores de implante dentário.', '2026-06-21', 'contatado', 'Odontologia');

-- RLS
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_optouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_webform_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON crm_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON crm_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON crm_leads FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON crm_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON crm_opportunities FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON crm_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON crm_nps_surveys FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON crm_nps_surveys FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON crm_optouts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON crm_optouts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON crm_webform_leads FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON crm_webform_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
