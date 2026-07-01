-- ==========================================
-- IAMED - MÓDULO SAÚDE OCUPACIONAL (PARAGUAI)
-- Medicina do Trabalho / Certificado de Aptidão Laboral (CAL)
-- Conforme Código do Trabalho Paraguaio e normas do MTESS
-- ==========================================

DROP TABLE IF EXISTS relatorio_mtess CASCADE;
DROP TABLE IF EXISTS cal_certificados CASCADE;
DROP TABLE IF EXISTS exames_ocupacionais CASCADE;
DROP TABLE IF EXISTS matriz_exames CASCADE;
DROP TABLE IF EXISTS riscos_ocupacionais CASCADE;
DROP TABLE IF EXISTS postos_trabalho CASCADE;
DROP TABLE IF EXISTS trabalhadores CASCADE;
DROP TABLE IF EXISTS planos_exames CASCADE;
DROP TABLE IF EXISTS contratos_empresas CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

-- 1. Empresas Clientes
CREATE TABLE empresas (
  id TEXT PRIMARY KEY,
  ruc TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  endereco TEXT NOT NULL,
  cidade TEXT NOT NULL DEFAULT 'Asunción',
  departamento TEXT NOT NULL DEFAULT 'Capital',
  telefone TEXT,
  email TEXT,
  atividade_economica TEXT NOT NULL,
  setor TEXT NOT NULL CHECK (setor IN ('Industrial', 'Comercial', 'Serviços', 'Agropecuária', 'Construção', 'Transporte', 'Outro')),
  porte TEXT NOT NULL CHECK (porte IN ('Micro', 'Pequena', 'Média', 'Grande')) DEFAULT 'Pequena',
  nro_funcionarios INTEGER DEFAULT 0,
  representante_nome TEXT,
  representante_ci TEXT,
  status TEXT NOT NULL CHECK (status IN ('ativa', 'inativa', 'suspensa')) DEFAULT 'ativa',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Contratos com Empresas
CREATE TABLE contratos_empresas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  numero_contrato TEXT NOT NULL UNIQUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('PCMSO', 'PGR', 'PCMSO+PGR', 'Exames Complementares', 'Outro')),
  valor_mensal NUMERIC(12,0) DEFAULT 0,
  prazo_dias INTEGER DEFAULT 30,
  status TEXT NOT NULL CHECK (status IN ('vigente', 'expirado', 'rescindido')) DEFAULT 'vigente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Planos de Exames por Contrato
CREATE TABLE planos_exames (
  id TEXT PRIMARY KEY,
  contrato_id TEXT REFERENCES contratos_empresas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo_exame TEXT NOT NULL CHECK (tipo_exame IN ('Pré-ocupacional', 'Periódico', 'Retorno ao Trabalho', 'Mudança de Função', 'Demissional', 'Monitoração Ambiental')),
  periodicidade_dias INTEGER,
  exames_previstos JSONB DEFAULT '[]'::JSONB,
  valor_por_trabalhador NUMERIC(12,0) DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Postos de Trabalho
CREATE TABLE postos_trabalho (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  setor TEXT NOT NULL,
  turno TEXT NOT NULL CHECK (turno IN ('Diurno', 'Noturno', 'Revezamento', 'Administrativo')),
  nro_trabalhadores INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Riscos Ocupacionais
CREATE TABLE riscos_ocupacionais (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Físico', 'Químico', 'Biológico', 'Ergonômico', 'Acidente', 'Mecânico')),
  descricao TEXT,
  cor_identificacao TEXT DEFAULT '#FF0000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Matriz Exames Complementares (Risco x Exame)
CREATE TABLE matriz_exames (
  id TEXT PRIMARY KEY,
  risco_id TEXT REFERENCES riscos_ocupacionais(id) ON DELETE CASCADE NOT NULL,
  exame_nome TEXT NOT NULL,
  exame_tipo TEXT NOT NULL CHECK (exame_tipo IN ('Laboratorial', 'Imagem', 'Clínico', 'Auditivo', 'Oftalmológico', 'Psicossocial', 'Cardiológico', 'Pneumológico', 'Toxicológico', 'Outro')),
  periodicidade_recomendada_dias INTEGER,
  obrigatorio BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Trabalhadores
CREATE TABLE trabalhadores (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  posto_id TEXT REFERENCES postos_trabalho(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  ci TEXT NOT NULL,
  ruc TEXT,
  data_nascimento DATE NOT NULL,
  genero TEXT NOT NULL,
  nacionalidade TEXT DEFAULT 'Paraguaya',
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  funcao TEXT NOT NULL,
  data_admissao DATE,
  data_demissao DATE,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'afastado', 'demitido')) DEFAULT 'ativo',
  tipo_sanguineo TEXT,
  contato_emergencia TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Exames Ocupacionais
CREATE TABLE exames_ocupacionais (
  id TEXT PRIMARY KEY,
  trabalhador_id TEXT REFERENCES trabalhadores(id) ON DELETE CASCADE NOT NULL,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  plano_id TEXT REFERENCES planos_exames(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Pré-ocupacional', 'Periódico', 'Retorno ao Trabalho', 'Mudança de Função', 'Demissional')),
  data_realizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_proximo DATE,
  medico_responsavel TEXT NOT NULL,
  exames_realizados JSONB DEFAULT '[]'::JSONB,
  resultados JSONB DEFAULT '[]'::JSONB,
  observacoes TEXT,
  status TEXT NOT NULL CHECK (status IN ('programado', 'realizado', 'cancelado')) DEFAULT 'programado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Certificados de Aptidão Laboral (CAL)
CREATE TABLE cal_certificados (
  id TEXT PRIMARY KEY,
  exame_id TEXT REFERENCES exames_ocupacionais(id) ON DELETE CASCADE NOT NULL,
  trabalhador_id TEXT REFERENCES trabalhadores(id) ON DELETE CASCADE NOT NULL,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  numero_cal TEXT NOT NULL UNIQUE,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE,
  parecido TEXT NOT NULL CHECK (parecido IN ('Apto', 'Apto com Restrições', 'Inapto Temporário', 'Inapto Permanente')),
  restricoes TEXT,
  observacoes TEXT,
  medico_emissor TEXT NOT NULL,
  registro_conselho TEXT NOT NULL,
  qr_code_hash TEXT,
  assinatura_digital TEXT,
  status TEXT NOT NULL CHECK (status IN ('válido', 'expirado', 'cancelado', 'substituído')) DEFAULT 'válido',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Relatórios MTESS
CREATE TABLE relatorio_mtess (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  tipo_relatorio TEXT NOT NULL CHECK (tipo_relatorio IN ('Mensal', 'Trimestral', 'Semestral', 'Anual')),
  dados JSONB DEFAULT '{}'::JSONB,
  pdf_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('rascunho', 'gerado', 'enviado', 'arquivado')) DEFAULT 'rascunho',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed de Riscos Ocupacionais (normativa paraguaia)
INSERT INTO riscos_ocupacionais (id, nome, tipo, descricao, cor_identificacao) VALUES
('risco_1', 'Ruído Contínuo', 'Físico', 'Exposição a ruído acima de 85 dB(A) por 8h', '#FFC107'),
('risco_2', 'Ruído de Impacto', 'Físico', 'Exposição a ruído de impacto acima de 130 dB(A)', '#FF9800'),
('risco_3', 'Vibração', 'Físico', 'Vibração em mãos e braços ou corpo inteiro', '#FF5722'),
('risco_4', 'Calor', 'Físico', 'Sobrecarga térmica - IBUTG acima do limite', '#F44336'),
('risco_5', 'Frio', 'Físico', 'Exposição ao frio intenso', '#2196F3'),
('risco_6', 'Radiação Ionizante', 'Físico', 'Raio-X, materiais radioativos', '#9C27B0'),
('risco_7', 'Radiação Não Ionizante', 'Físico', 'Solda, micro-ondas, laser', '#E91E63'),
('risco_8', 'Poeira Mineral', 'Químico', 'Sílica, asbesto, carvão mineral', '#795548'),
('risco_9', 'Gases e Vapores', 'Químico', 'Gases tóxicos, vapores orgânicos', '#607D8B'),
('risco_10', 'Produtos Químicos', 'Químico', 'Manipulação de produtos químicos em geral', '#FF5722'),
('risco_11', 'Agentes Biológicos', 'Biológico', 'Vírus, bactérias, fungos, parasitas', '#4CAF50'),
('risco_12', 'Postura Inadequada', 'Ergonômico', 'Postura estática ou forçada prolongada', '#FFC107'),
('risco_13', 'Movimentos Repetitivos', 'Ergonômico', 'LER/DORT - movimentos repetitivos', '#FF9800'),
('risco_14', 'Levantamento de Peso', 'Ergonômico', 'Transporte manual de cargas', '#FF5722'),
('risco_15', 'Trabalho em Altura', 'Acidente', 'Acima de 2 metros - NR-35', '#F44336'),
('risco_16', 'Espaço Confinado', 'Acidente', 'Ambientes com oxigênio reduzido', '#9C27B0'),
('risco_17', 'Eletricidade', 'Acidente', 'Risco de choque elétrico - NR-10', '#FFEB3B'),
('risco_18', 'Máquinas e Equipamentos', 'Mecânico', 'Operação de máquinas sem proteção', '#795548');

-- Seed: Matriz de Exames (relação risco x exame)
INSERT INTO matriz_exames (id, risco_id, exame_nome, exame_tipo, periodicidade_recomendada_dias, obrigatorio) VALUES
('mat_1', 'risco_1', 'Audiometria Tonal', 'Auditivo', 365, true),
('mat_2', 'risco_1', 'Audiometria Vocal', 'Auditivo', 365, true),
('mat_3', 'risco_2', 'Audiometria Tonal', 'Auditivo', 180, true),
('mat_4', 'risco_3', 'Exame Clínico Vibração', 'Clínico', 365, true),
('mat_5', 'risco_4', 'Eletrocardiograma', 'Cardiológico', 365, true),
('mat_6', 'risco_4', 'Hemograma', 'Laboratorial', 365, false),
('mat_7', 'risco_5', 'Eletrocardiograma', 'Cardiológico', 365, true),
('mat_8', 'risco_6', 'Hemograma Completo', 'Laboratorial', 180, true),
('mat_9', 'risco_7', 'Exame Oftalmológico', 'Oftalmológico', 365, true),
('mat_10', 'risco_8', 'Espirometria', 'Pneumológico', 365, true),
('mat_11', 'risco_8', 'Raio-X de Tórax', 'Imagem', 365, true),
('mat_12', 'risco_9', 'Eletrocardiograma', 'Cardiológico', 365, true),
('mat_13', 'risco_9', 'Hemograma', 'Laboratorial', 365, true),
('mat_14', 'risco_10', 'Hemograma', 'Laboratorial', 365, true),
('mat_15', 'risco_10', 'Exame Toxicológico', 'Toxicológico', 365, true),
('mat_16', 'risco_11', 'Hemograma', 'Laboratorial', 180, true),
('mat_17', 'risco_11', 'Exames Sorológicos', 'Laboratorial', 180, true),
('mat_18', 'risco_12', 'Exame Clínico Ergonômico', 'Clínico', 365, true),
('mat_19', 'risco_13', 'Exame Clínico Ergonômico', 'Clínico', 365, true),
('mat_20', 'risco_14', 'Exame Clínico Musculoesquelético', 'Clínico', 365, true),
('mat_21', 'risco_14', 'Raio-X de Coluna Lombar', 'Imagem', 365, true),
('mat_22', 'risco_15', 'Eletroencefalograma', 'Clínico', 365, true),
('mat_23', 'risco_15', 'Eletrocardiograma', 'Cardiológico', 365, true),
('mat_24', 'risco_15', 'Exame Psicológico', 'Psicossocial', 365, true),
('mat_25', 'risco_16', 'Espirometria', 'Pneumológico', 365, true),
('mat_26', 'risco_16', 'Eletrocardiograma', 'Cardiológico', 365, true),
('mat_27', 'risco_17', 'Eletrocardiograma', 'Cardiológico', 365, true),
('mat_28', 'risco_17', 'Exame Clínico Neurológico', 'Clínico', 365, true),
('mat_29', 'risco_18', 'Exame Clínico Ortopédico', 'Clínico', 365, true),
('mat_30', 'risco_18', 'Audiometria', 'Auditivo', 365, true);

-- Seed: Empresa Cliente (Paraguai)
INSERT INTO empresas (id, ruc, nome, nome_fantasia, endereco, cidade, departamento, telefone, email, atividade_economica, setor, porte, nro_funcionarios, representante_nome, representante_ci, status) VALUES
('emp_1', '80045678-1', 'Industrial del Sur S.A.', 'INSUR', 'Avda. Mariscal López 1456', 'Asunción', 'Capital', '+595 21 234 5678', 'contacto@insur.com.py', 'Fabricação de Produtos Metalúrgicos', 'Industrial', 'Grande', 350, 'Carlos Benítez', '1234567', 'ativa'),
('emp_2', '80123456-3', 'TechSolutions PY S.R.L.', 'TechPY', 'Calle San Martin 890', 'Asunción', 'Capital', '+595 21 345 6789', 'info@techpy.com.py', 'Serviços de TI', 'Serviços', 'Média', 85, 'María González', '2345678', 'ativa'),
('emp_3', '80234567-5', 'Agropecuária Doña Elena', 'AgroElena', 'Ruta 2 Km 25', 'San Lorenzo', 'Central', '+595 991 234 567', 'elena@agroelena.com.py', 'Atividade Agropecuária', 'Agropecuária', 'Média', 120, 'Elena Martínez', '3456789', 'ativa');

-- Seed: Contratos
INSERT INTO contratos_empresas (id, empresa_id, numero_contrato, data_inicio, data_fim, tipo, valor_mensal, prazo_dias, status) VALUES
('ctr_1', 'emp_1', 'CTR-2026-001', '2026-01-01', '2026-12-31', 'PCMSO+PGR', 5000000, 30, 'vigente'),
('ctr_2', 'emp_2', 'CTR-2026-002', '2026-03-01', '2027-02-28', 'PCMSO', 1500000, 30, 'vigente'),
('ctr_3', 'emp_3', 'CTR-2026-003', '2026-02-01', NULL, 'Exames Complementares', 2000000, 45, 'vigente');

-- Seed: Postos de Trabalho
INSERT INTO postos_trabalho (id, empresa_id, nome, descricao, setor, turno, nro_trabalhadores) VALUES
('posto_1', 'emp_1', 'Operador de Máquinas', 'Operação de prensas e tornos mecânicos', 'Produção', 'Revezamento', 45),
('posto_2', 'emp_1', 'Soldador', 'Solda elétrica e oxiacetilênica', 'Produção', 'Diurno', 30),
('posto_3', 'emp_1', 'Auxiliar Administrativo', 'Atividades administrativas de escritório', 'Administrativo', 'Administrativo', 15),
('posto_4', 'emp_2', 'Desenvolvedor de Software', 'Programação e suporte técnico', 'TI', 'Administrativo', 40),
('posto_5', 'emp_2', 'Analista de Suporte', 'Suporte técnico presencial e remoto', 'TI', 'Revezamento', 25),
('posto_6', 'emp_3', 'Operador Agrícola', 'Operação de maquinário agrícola', 'Campo', 'Diurno', 60),
('posto_7', 'emp_3', 'Veterinário', 'Acompanhamento veterinário do gado', 'Campo', 'Diurno', 5);

-- Seed: Trabalhadores
INSERT INTO trabalhadores (id, empresa_id, posto_id, nome, ci, data_nascimento, genero, nacionalidade, funcao, data_admissao, status, telefone) VALUES
('trab_1', 'emp_1', 'posto_1', 'Juan Pérez Martínez', '4567890', '1988-03-15', 'Masculino', 'Paraguaya', 'Operador de Prensa', '2022-06-01', 'ativo', '+595 981 234 567'),
('trab_2', 'emp_1', 'posto_2', 'Pedro Ramírez López', '5678901', '1992-07-22', 'Masculino', 'Paraguaya', 'Soldador', '2023-01-15', 'ativo', '+595 982 345 678'),
('trab_3', 'emp_1', 'posto_1', 'Ana Vera González', '6789012', '1995-11-08', 'Feminino', 'Paraguaya', 'Operadora de Torno', '2024-03-01', 'ativo', '+595 983 456 789'),
('trab_4', 'emp_2', 'posto_4', 'Luis Fernández Ayala', '7890123', '1990-05-30', 'Masculino', 'Paraguaya', 'Desenvolvedor Sênior', '2023-08-20', 'ativo', '+595 984 567 890'),
('trab_5', 'emp_3', 'posto_6', 'Marcos Villalba Duarte', '8901234', '1985-09-12', 'Masculino', 'Paraguaya', 'Tratorista', '2020-04-10', 'ativo', '+595 985 678 901');

-- Seed: Exames Ocupacionais
INSERT INTO exames_ocupacionais (id, trabalhador_id, empresa_id, tipo, data_realizacao, data_proximo, medico_responsavel, exames_realizados, resultados, status) VALUES
('ex_1', 'trab_1', 'emp_1', 'Periódico', '2026-06-15', '2027-06-15', 'Dr. Bruno Castro', '["Audiometria Tonal", "Hemograma", "Eletrocardiograma", "Raio-X de Tórax"]'::JSONB, '["Audiometria: Normal", "Hemograma: Normal", "ECG: Normal", "Raio-X: Normal"]'::JSONB, 'realizado'),
('ex_2', 'trab_2', 'emp_1', 'Pré-ocupacional', '2026-05-10', '2027-05-10', 'Dr. Bruno Castro', '["Audiometria", "Eletrocardiograma", "Hemograma"]'::JSONB, '["Audiometria: Perda leve 4kHz", "ECG: Normal", "Hemograma: Normal"]'::JSONB, 'realizado');

-- Seed: CAL Certificados
INSERT INTO cal_certificados (id, exame_id, trabalhador_id, empresa_id, numero_cal, data_emissao, data_validade, parecido, medico_emissor, registro_conselho, status) VALUES
('cal_1', 'ex_1', 'trab_1', 'emp_1', 'CAL-2026-001', '2026-06-15', '2027-06-15', 'Apto', 'Dr. Bruno Castro', 'CRM-PY 123456', 'válido'),
('cal_2', 'ex_2', 'trab_2', 'emp_1', 'CAL-2026-002', '2026-05-10', '2027-05-10', 'Apto com Restrições', 'Dr. Bruno Castro', 'CRM-PY 123456', 'válido');

-- Habilitar RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE postos_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE riscos_ocupacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriz_exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabalhadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_ocupacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE cal_certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_mtess ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Allow public read access" ON empresas FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON contratos_empresas FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON contratos_empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON planos_exames FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON planos_exames FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON postos_trabalho FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON postos_trabalho FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON riscos_ocupacionais FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON riscos_ocupacionais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON matriz_exames FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON matriz_exames FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON trabalhadores FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON trabalhadores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON exames_ocupacionais FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON exames_ocupacionais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON cal_certificados FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON cal_certificados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON relatorio_mtess FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON relatorio_mtess FOR ALL TO authenticated USING (true) WITH CHECK (true);
