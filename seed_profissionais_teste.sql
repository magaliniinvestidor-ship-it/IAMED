-- ========================================
-- SEED: Profissionais de Teste (24 cargos)
-- Execute no Supabase SQL Editor
-- ========================================

INSERT INTO professionals (id, name, role, specialty, council, council_number, shift, email, phone, status, admission_date, color)
VALUES
  -- MÉDICOS
  ('prof_test_01', 'teste medico(a) 1', 'Médico(a)', 'Cardiologia', 'CRM', 'CRM-SP 111111', 'Manhã', 'testemedico1@iamed.com.br', '+55 11 99001-0001', 'ativo', '2024-01-15', 'bg-teal-500'),
  ('prof_test_02', 'teste medico(a) 2', 'Médico(a)', 'Ortopedia', 'CRM', 'CRM-SP 222222', 'Tarde', 'testemedico2@iamed.com.br', '+55 11 99002-0002', 'ativo', '2024-02-20', 'bg-blue-500'),
  ('prof_test_03', 'teste medico(a) 3', 'Médico(a)', 'Neurologia', 'CRM', 'CRM-SP 333333', 'Noite', 'testemedico3@iamed.com.br', '+55 11 99003-0003', 'ativo', '2024-03-10', 'bg-purple-500'),

  -- ENFERMEIROS
  ('prof_test_04', 'teste enfermeiro(a) 1', 'Enfermeiro(a)', 'Enfermagem Clínica', 'COREN', 'COREN-SP 444444', 'Manhã', 'testeenfermeiro1@iamed.com.br', '+55 11 99004-0004', 'ativo', '2024-01-20', 'bg-green-500'),
  ('prof_test_05', 'teste enfermeiro(a) 2', 'Enfermeiro(a)', 'Enfermagem UTI', 'COREN', 'COREN-SP 555555', 'Plantão 12h', 'testeenfermeiro2@iamed.com.br', '+55 11 99005-0005', 'ativo', '2024-02-25', 'bg-emerald-500'),

  -- AUXILIAR DE ENFERMAGEM
  ('prof_test_06', 'teste auxiliar de enfermagem', 'Auxiliar de Enfermagem', 'Enfermagem Geral', 'COREN', 'COREN-SP 666666', 'Tarde', 'testeauxenfermagem@iamed.com.br', '+55 11 99006-0006', 'ativo', '2024-04-05', 'bg-lime-500'),

  -- TÉCNICO DE ENFERMAGEM
  ('prof_test_07', 'teste tecnico(a) de enfermagem', 'Técnico(a) de Enfermagem', 'Enfermagem Geral', 'COREN', 'COREN-SP 777777', 'Noite', 'testetecenfermagem@iamed.com.br', '+55 11 99007-0007', 'ativo', '2024-07-15', 'bg-yellow-500'),

  -- ANESTESIOLOGISTA
  ('prof_test_08', 'teste anestesiologista', 'Anestesiologista', 'Anestesiologia', 'CRM', 'CRM-SP 888888', 'Integral', 'teceanestesiologista@iamed.com.br', '+55 11 99008-0008', 'ativo', '2024-08-20', 'bg-red-500'),

  -- CIRURGIÃO(Ã)
  ('prof_test_09', 'teste cirurgiao(a)', 'Cirurgião(ã)', 'Cirurgia Geral', 'CRM', 'CRM-SP 999999', 'Manhã', 'testecirurgiao@iamed.com.br', '+55 11 99009-0009', 'ativo', '2024-09-10', 'bg-pink-500'),

  -- FISIOTERAPEUTA
  ('prof_test_10', 'teste fisioterapeuta', 'Fisioterapeuta', 'Fisioterapia Ortopédica', 'CREFITO', 'CREFITO-SP 101010', 'Manhã', 'testefisioterapeuta@iamed.com.br', '+55 11 99010-0010', 'ativo', '2024-10-05', 'bg-orange-500'),

  -- PSICÓLOGO
  ('prof_test_11', 'teste psicologo(a)', 'Psicólogo(a)', 'Psicologia Clínica', 'CFP', 'CFP-SP 111111', 'Tarde', 'testepsicologo@iamed.com.br', '+55 11 99011-0011', 'ativo', '2024-11-15', 'bg-violet-500'),

  -- NUTRICIONISTA
  ('prof_test_12', 'teste nutricionista', 'Nutricionista', 'Nutrição Clínica', 'CFN', 'CFN-SP 121212', 'Manhã', 'testenutricionista@iamed.com.br', '+55 11 99012-0012', 'ativo', '2024-12-01', 'bg-amber-500'),

  -- TERAPEUTA OCUPACIONAL
  ('prof_test_13', 'teste terapeuta ocupacional', 'Terapeuta Ocupacional', 'Terapia Ocupacional Hospitalar', 'CRESS', 'CRESS-SP 131313', 'Manhã', 'testeterapeutaocupacional@iamed.com.br', '+55 11 99013-0013', 'ativo', '2025-01-10', 'bg-cyan-500'),

  -- EDUCADOR FÍSICO
  ('prof_test_14', 'teste educador fisico', 'Educador Físico', 'Reabilitação Física', 'CREF', 'CREF-SP 141414', 'Tarde', 'testeeducadorfisico@iamed.com.br', '+55 11 99014-0014', 'ativo', '2025-02-15', 'bg-indigo-500'),

  -- ASSISTENTE SOCIAL
  ('prof_test_15', 'teste assistente social', 'Assistente Social', 'Assistência Social Hospitalar', 'CRESS', 'CRESS-SP 151515', 'Manhã', 'testeassistente@iamed.com.br', '+55 11 99015-0015', 'ativo', '2025-03-20', 'bg-emerald-600'),

  -- FONOAUDIÓLOGO
  ('prof_test_16', 'teste fonoaudiologo(a)', 'Fonoaudiólogo(a)', 'Fonoaudiologia Clínica', 'CRFa', 'CRFa-SP 161616', 'Tarde', 'testefonoaudiologo@iamed.com.br', '+55 11 99016-0016', 'ativo', '2025-04-10', 'bg-fuchsia-500'),

  -- FARMACÊUTICO
  ('prof_test_17', 'teste farmaceutico(a)', 'Farmacêutico(a)', 'Farmácia Hospitalar', 'CRF', 'CRF-SP 171717', 'Integral', 'testefarmaceutico@iamed.com.br', '+55 11 99017-0017', 'ativo', '2025-05-05', 'bg-teal-600'),

  -- DENTISTA
  ('prof_test_18', 'teste dentista', 'Dentista', 'Odontologia Hospitalar', 'CRO', 'CRO-SP 181818', 'Manhã', 'testedentista@iamed.com.br', '+55 11 99018-0018', 'ativo', '2025-06-01', 'bg-sky-500'),

  -- BIOMÉDICO
  ('prof_test_19', 'teste biomedico(a)', 'Biomédico(a)', 'Bioquímica Clínica', 'CRBM', 'CRBM-SP 191919', 'Manhã', 'testebiomedico@iamed.com.br', '+55 11 99019-0019', 'ativo', '2025-07-01', 'bg-rose-500'),

  -- TÉCNICO EM RADIOLOGIA
  ('prof_test_20', 'teste tecnico(a) em radiologia', 'Técnico(a) em Radiologia', 'Radiologia e Diagnóstico por Imagem', 'COREN', 'COREN-SP 202020', 'Tarde', 'testetecradiologia@iamed.com.br', '+55 11 99020-0020', 'ativo', '2025-08-15', 'bg-slate-500'),

  -- TÉCNICO EM FARMÁCIA
  ('prof_test_21', 'teste tecnico(a) em farmacia', 'Técnico(a) em Farmácia', 'Farmácia Hospitalar', 'CRF', 'CRF-SP 212121', 'Noite', 'testetecfarmacia@iamed.com.br', '+55 11 99021-0021', 'ativo', '2025-09-10', 'bg-zinc-500'),

  -- TÉCNICO DE LABORATÓRIO
  ('prof_test_22', 'teste tecnico(a) de laboratorio', 'Técnico(a) de Laboratório', 'Análises Clínicas', 'CRBM', 'CRBM-SP 222222', 'Integral', 'testeteclaboratorio@iamed.com.br', '+55 11 99022-0022', 'ativo', '2025-10-05', 'bg-stone-500'),

  -- ADMINISTRADOR
  ('prof_test_23', 'teste administrador(a)', 'Administrador(a)', 'Gestão Hospitalar', 'N/A', 'N/A-000000', 'Integral', 'testeadministrador@iamed.com.br', '+55 11 99023-0023', 'ativo', '2025-11-01', 'bg-neutral-500'),

  -- RECEPCIONISTA
  ('prof_test_24', 'teste recepcionista', 'Recepcionista', 'Atendimento ao Paciente', 'N/A', 'N/A-000000', 'Manhã', 'testerecepcionista@iamed.com.br', '+55 11 99024-0024', 'ativo', '2025-12-01', 'bg-gray-500');
