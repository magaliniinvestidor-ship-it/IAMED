-- ========================================
-- SEED COMPLETO: Dados de teste para IAMED
-- Execute no Supabase SQL Editor
-- ========================================
-- ATENÇÃO: Se as tabelas já existem com UUID, execute o BLOCO 0 primeiro
-- ========================================

-- ========================================
-- BLOCO 0: Recriar tabelas com ID TEXT (execute só se tabelas já existem com UUID)
-- ========================================
-- Se você já rodou supabase_migration.sql e as tabelas têm UUID, execute este bloco
-- Se as tabelas ainda não existem, pule este bloco

-- Foreign keys que dependem de professionals/patients
DROP TABLE IF EXISTS clinical_history CASCADE;
DROP TABLE IF EXISTS anamnese CASCADE;
DROP TABLE IF EXISTS soap_notes CASCADE;
DROP TABLE IF EXISTS physical_exams CASCADE;

-- Recriar professionals com ID TEXT
DROP TABLE IF EXISTS professionals CASCADE;
CREATE TABLE professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Médico(a)',
  specialty TEXT DEFAULT '',
  council TEXT DEFAULT 'N/A',
  council_number TEXT DEFAULT '',
  shift TEXT DEFAULT 'Manhã',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'ativo',
  admission_date TEXT DEFAULT '',
  color TEXT DEFAULT '#3b82f6',
  user_id TEXT,
  location_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recriar patients com ID TEXT
DROP TABLE IF EXISTS patients CASCADE;
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  birthdate TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'agendado',
  clinical_history JSONB DEFAULT '[]',
  document_type TEXT DEFAULT 'CI',
  document_number TEXT DEFAULT '',
  place_of_birth TEXT DEFAULT '',
  civil_status TEXT DEFAULT 'Solteiro(a)',
  nationality TEXT DEFAULT 'Paraguaia',
  address_department TEXT DEFAULT '',
  address_district TEXT DEFAULT '',
  address_city TEXT DEFAULT '',
  address_neighborhood TEXT DEFAULT '',
  address_street TEXT DEFAULT '',
  address_number TEXT DEFAULT '',
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  blood_type TEXT DEFAULT '',
  allergies TEXT DEFAULT '',
  health_insurance_type TEXT DEFAULT 'Particular',
  health_insurance_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- BLOCO 1: Criar tabela locations (se não existir)
-- ========================================
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- BLOCO 2: Habilitar RLS em todas as tabelas
-- ========================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for dev" ON locations;
CREATE POLICY "Public access for dev" ON locations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for dev" ON professionals;
CREATE POLICY "Public access for dev" ON professionals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for dev" ON patients;
CREATE POLICY "Public access for dev" ON patients FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- BLOCO 3: CHECK constraints para professionals
-- ========================================
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_role_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_role_check
CHECK (role IN (
  'Médico(a)','Enfermeiro(a)','Fisioterapeuta','Psicólogo(a)','Nutricionista',
  'Técnico(a) de Enfermagem','Administrador(a)','Recepcionista','Terapeuta Ocupacional',
  'Educador Físico','Assistente Social','Fonoaudiólogo(a)','Farmacêutico(a)','Dentista',
  'Biomédico(a)','Técnico(a) em Radiologia','Técnico(a) em Farmácia','Técnico(a) de Laboratório',
  'Auxiliar de Enfermagem','Anestesiologista','Cirurgião(ã)',
  'SuperAdmin','Gestor','Diretor Clínico','Financeiro','Visualizador'
));

ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_council_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_council_check
CHECK (council IN ('CRM','COREN','CREFITO','CFP','CFN','CRO','CRESS','CRFa','CRF','CRBM','CREF','N/A'));

ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_shift_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_shift_check
CHECK (shift IN ('Manhã','Tarde','Noite','Integral','Plantão 12h','Plantão 24h'));

ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_status_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_status_check
CHECK (status IN ('ativo','inativo','férias'));

-- ========================================
-- BLOCO 4: Inserir 5 sedes
-- ========================================
INSERT INTO locations (id, name, address, phone, city, status)
VALUES
  ('loc_1', 'Sede Central',          'Av. Brasil, 1234',           '+595 21 555-1234', 'Encarnación',         'ativo'),
  ('loc_2', 'Filial Ciudad del Este','Av. Kennedy, 567',           '+595 61 555-5678', 'Ciudad del Este',     'ativo'),
  ('loc_3', 'Filial Asunción',       'Av. Mariscal López, 890',    '+595 21 555-9012', 'Asunción',            'ativo'),
  ('loc_4', 'Filial Encarnación',    'Calle Pte. Franco, 456',      '+595 67 555-3456', 'Encarnación',         'ativo'),
  ('loc_5', 'Filial Pedro Juan',     'Av. Mcal. Estigarribia, 321', '+595 491 555-7890', 'Pedro Juan Caballero','ativo')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- BLOCO 5: Inserir 10 profissionais
-- ========================================
INSERT INTO professionals (id, name, role, specialty, council, council_number, shift, email, phone, status, admission_date, color, location_id)
VALUES
  ('prof_10', 'Dr. Carlos Méndez',       'Médico(a)',             'Cardiologia',         'CRM',   '12345',  'Manhã',      'carlos.mendez@test.com',    '+595 981 111-001', 'ativo', '2020-03-15', '#3b82f6', 'loc_1'),
  ('prof_11', 'Dra. Laura Gómez',        'Médico(a)',             'Pediatria',           'CRM',   '23456',  'Tarde',      'laura.gomez@test.com',      '+595 982 222-002', 'ativo', '2019-07-20', '#10b981', 'loc_1'),
  ('prof_12', 'Enf. Roberto Benítez',    'Enfermeiro(a)',         'Enfermagem Geral',    'COREN', '34567',  'Plantão 12h','roberto.benitez@test.com',  '+595 983 333-003', 'ativo', '2021-01-10', '#f59e0b', 'loc_2'),
  ('prof_13', 'Dra. María Fernández',    'Dentista',              'Odontologia',         'CRO',   '45678',  'Manhã',      'maria.fernandez@test.com',  '+595 984 444-004', 'ativo', '2022-05-05', '#8b5cf6', 'loc_2'),
  ('prof_14', 'Lic. Ana Martínez',       'Nutricionista',         'Nutrição Clínica',    'CFN',   '56789',  'Tarde',      'ana.martinez@test.com',     '+595 985 555-005', 'ativo', '2023-02-28', '#ec4899', 'loc_3'),
  ('prof_15', 'Ft. Pedro Álvarez',       'Fisioterapeuta',        'Fisioterapia',        'CREFITO','67890', 'Manhã',      'pedro.alvarez@test.com',    '+595 986 666-006', 'ativo', '2021-09-12', '#06b6d4', 'loc_3'),
  ('prof_16', 'Dr. Fernando Torres',     'Cirurgião(ã)',          'Cirurgia Geral',      'CRM',   '78901',  'Plantão 24h','fernando.torres@test.com',  '+595 987 777-007', 'ativo', '2018-11-01', '#ef4444', 'loc_4'),
  ('prof_17', 'Téc. Isabel Ruiz',        'Técnico(a) de Enfermagem','Enfermagem',        'COREN', '89012',  'Noite',      'isabel.ruiz@test.com',      '+595 988 888-008', 'ativo', '2023-06-15', '#84cc16', 'loc_4'),
  ('prof_18', 'Dr. Andrés Rojas',        'Anestesiologista',      'Anestesiologia',      'CRM',   '90123',  'Plantão 12h','andres.rojas@test.com',     '+595 989 999-009', 'ativo', '2020-08-20', '#f97316', 'loc_5'),
  ('prof_19', 'Psic. Camila Vargas',     'Psicólogo(a)',          'Psicologia Clínica',  'CFP',   '01234',  'Tarde',      'camila.vargas@test.com',    '+595 991 000-010', 'ativo', '2022-12-01', '#a855f7', 'loc_5')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- BLOCO 6: Inserir 10 pacientes (testepaciente1 a testepaciente10)
-- ========================================
INSERT INTO patients (id, name, email, phone, birthdate, gender, priority, status, document_type, document_number, place_of_birth, civil_status, address_city, address_street, address_number, blood_type, health_insurance_type)
VALUES
  ('pac_test_01', 'testepaciente1',  'testepaciente1@test.com',  '+595 991 000-001', '1990-01-15', 'Masculino', 'normal',      'agendado',  'CI', '1.234.567', 'Encarnación',      'Solteiro(a)',   'Encarnación',      'Calle Palma',        '123', 'O+',  'Particular'),
  ('pac_test_02', 'testepaciente2',  'testepaciente2@test.com',  '+595 992 000-002', '1985-03-22', 'Feminino',  'preferencial','aguardando','CI', '2.345.678', 'Asunción',         'Casado(a)',     'Asunción',         'Av. Brasil',         '456', 'A-',  'IPS'),
  ('pac_test_03', 'testepaciente3',  'testepaciente3@test.com',  '+595 993 000-003', '1978-07-10', 'Masculino', 'normal',      'atendimento','CI','3.456.789', 'Ciudad del Este',  'Divorciado(a)', 'Ciudad del Este',  'Av. Kennedy',        '789', 'B+',  'Sanidade Militar'),
  ('pac_test_04', 'testepaciente4',  'testepaciente4@test.com',  '+595 994 000-004', '2001-11-05', 'Feminino',  'normal',      'atendido',  'CI', '4.567.890', 'Encarnación',      'Solteiro(a)',   'Encarnación',      'Calle Pte. Franco',   '321', 'AB+', 'Pré-paga'),
  ('pac_test_05', 'testepaciente5',  'testepaciente5@test.com',  '+595 995 000-005', '1965-05-30', 'Masculino', 'emergência', 'agendado',  'CI', '5.678.901', 'Pedro Juan Caballero','Casado(a)',  'Pedro Juan Caballero','Av. Mcal. Estigarribia','654','O-',  'Sanidade Policial'),
  ('pac_test_06', 'testepaciente6',  'testepaciente6@test.com',  '+595 996 000-006', '1992-09-18', 'Feminino',  'normal',      'aguardando','CI', '6.789.012', 'Asunción',         'Solteiro(a)',   'Asunción',         'Calle Colón',        '987', 'A+',  'Seguro Privado'),
  ('pac_test_07', 'testepaciente7',  'testepaciente7@test.com',  '+595 997 000-007', '1980-12-25', 'Masculino', 'preferencial','agendado',  'CI', '7.890.123', 'Encarnación',      'Viúvo(a)',     'Encarnación',      'Av. San Martín',     '147', 'B-',  'Particular'),
  ('pac_test_08', 'testepaciente8',  'testepaciente8@test.com',  '+595 998 000-008', '1955-02-14', 'Feminino',  'emergência', 'atendimento','CI','8.901.234', 'Ciudad del Este',  'Casado(a)',     'Ciudad del Este',  'Calle Boggiani',     '258', 'AB-', 'IPS'),
  ('pac_test_09', 'testepaciente9',  'testepaciente9@test.com',  '+595 999 000-009', '2003-06-08', 'Masculino', 'normal',      'agendado',  'CI', '9.012.345', 'Asunción',         'Solteiro(a)',   'Asunción',         'Av. Eusebio Ayala',  '369', 'O+',  'Particular'),
  ('pac_test_10', 'testepaciente10', 'testepaciente10@test.com', '+595 990 000-010', '1973-08-21', 'Feminino',  'normal',      'atendido',  'CI', '0.123.456', 'Encarnación',      'União Estável','Encarnación',      'Calle Cerro Corá',   '741', 'A-',  'Sanidade Militar')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- BLOCO 7: Vincular system_users aos profissionais
-- ========================================
UPDATE system_users SET professional_id = 'prof_10' WHERE id = 'usr_1';
UPDATE system_users SET professional_id = 'prof_11' WHERE id = 'usr_2';
UPDATE system_users SET professional_id = 'prof_12' WHERE id = 'usr_3';
UPDATE system_users SET professional_id = 'prof_13' WHERE id = 'usr_4';
UPDATE system_users SET professional_id = 'prof_14' WHERE id = 'usr_5';

-- ========================================
-- FIM
-- ========================================
