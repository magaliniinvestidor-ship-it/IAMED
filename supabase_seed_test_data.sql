-- ============================================================
-- SEED DE DADOS DE TESTE
-- 10 Pacientes, 21 Profissionais (1 por profissão), 55 Salas
-- Executar APÓS as migrations de profiles e professional_roles
-- ============================================================

-- Remover CHECK constraint de tipo (aceitar qualquer tipo de sala)
ALTER TABLE clinical_rooms DROP CONSTRAINT IF EXISTS clinical_rooms_type_check;

-- Atualizar CHECK constraint de council (adicionar CREFONO, CRTR, CRA)
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_council_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_council_check
CHECK (council IN ('CRM','COREN','CREFITO','CFP','CFN','CRO','CRESS','CRFa','CRF','CRBM','CREF','N/A','CREFONO','CRTR','CRA'));

-- ── SYSTEM USERS (contas existentes no Auth) ───────────────
INSERT INTO system_users (id, auth_user_id, system_role, ci, status, created_at) VALUES
('usr_gestor1', 'ad7378ed-67d2-48ba-83d7-c46f44411f84', 'Visualizador', '111111111', 'ativo', NOW()),
('usr_gestor2', '3f9989e3-5099-435c-a621-c57a18967b90', 'SuperAdmin', '222222222', 'ativo', NOW())
ON CONFLICT (id) DO NOTHING;

-- ── PACIENTES ──────────────────────────────────────────────
INSERT INTO patients (id, name, email, phone, birthdate, gender, priority, status, document_type, document_number, place_of_birth, civil_status, nationality, address_department, address_district, address_city, address_neighborhood, address_street, address_number, blood_type, allergies, health_insurance_type, health_insurance_number, created_at) VALUES
('PAC001', 'Paciente 1 - María García', 'paciente1@test.com', '+595981000001', '1985-03-15', 'Feminino', 'normal', 'agendado', 'CI', '1234567', 'Asunción', 'Casado(a)', 'Paraguai', 'Central', 'Asunción', 'Asunción', 'San Roque', 'Av. Brasil', '1234', 'O+', 'Nenhuma', 'IPS', 'IPS-001', NOW()),
('PAC002', 'Paciente 2 - Juan López', 'paciente2@test.com', '+595981000002', '1990-07-22', 'Masculino', 'normal', 'aguardando', 'CI', '2345678', 'Luque', 'Solteiro(a)', 'Paraguai', 'Central', 'Central', 'Luque', 'San Blas', 'Calle 5', '567', 'A-', 'Penicilina', 'Particular', 'N/A', NOW()),
('PAC003', 'Paciente 3 - Ana Martínez', 'paciente3@test.com', '+595981000003', '1978-11-08', 'Feminino', 'preferencial', 'atendimento', 'CI', '3456789', 'Fernando de la Mora', 'Casado(a)', 'Paraguai', 'Central', 'Fernando de la Mora', 'Fernando de la Mora', 'Jardín', 'Calle 10', '890', 'B+', 'Aspirina', 'Sanidade Militar', 'SM-002', NOW()),
('PAC004', 'Paciente 4 - Carlos Rodríguez', 'paciente4@test.com', '+595981000004', '1965-01-30', 'Masculino', 'emergência', 'internado', 'CI', '4567890', 'Capiatá', 'Divorciado(a)', 'Paraguai', 'Central', 'Capiatá', 'Capiatá', 'Centro', 'Av. Principal', '1500', 'AB+', 'Sulfa', 'Sanidade Policial', 'SP-003', NOW()),
('PAC005', 'Paciente 5 - Laura Fernández', 'paciente5@test.com', '+595981000005', '1992-05-18', 'Feminino', 'normal', 'agendado', 'Passaporte', 'AB12345', 'Ciudad del Este', 'União Estável', 'Brasil', 'Alto Paraná', 'Ciudad del Este', 'Ciudad del Este', 'Microcentro', 'Calle Brasil', '2200', 'O-', 'Nenhuma', 'Pré-paga', 'PP-004', NOW()),
('PAC006', 'Paciente 6 - Roberto Sánchez', 'paciente6@test.com', '+595981000006', '1958-09-25', 'Masculino', 'preferencial', 'aguardando', 'CI', '5678901', 'Encarnación', 'Viúvo(a)', 'Paraguai', 'Itapúa', 'Encarnación', 'Encarnación', 'San Miguel', 'Calle Sur', '780', 'A+', 'Ibuprofeno', 'IPS', 'IPS-005', NOW()),
('PAC007', 'Paciente 7 - Patricia Díaz', 'paciente7@test.com', '+595981000007', '1983-12-03', 'Feminino', 'normal', 'atendimento', 'CI', '6789012', 'Pilar', 'Casado(a)', 'Paraguai', 'Ñeembucú', 'Pilar', 'Pilar', 'Centro', 'Av. Costanera', '333', 'B-', 'Nenhuma', 'Seguro Privado', 'SP-006', NOW()),
('PAC008', 'Paciente 8 - Fernando Torres', 'paciente8@test.com', '+595981000008', '1970-06-14', 'Masculino', 'normal', 'atendido', 'CI', '7890123', 'Concepción', 'Casado(a)', 'Paraguai', 'Concepción', 'Concepción', 'Concepción', 'Quinta', 'Calle Norte', '445', 'AB-', 'Látex', 'Particular', 'N/A', NOW()),
('PAC009', 'Paciente 9 - Gabriela Ramírez', 'paciente9@test.com', '+595981000009', '1995-02-28', 'Feminino', 'normal', 'agendado', 'CI', '8901234', 'Villarrica', 'Solteiro(a)', 'Paraguai', 'Guairá', 'Villarrica', 'Villarrica', 'Centro', 'Calle 9 de Julio', '112', 'O+', 'Nenhuma', 'IPS', 'IPS-007', NOW()),
('PAC010', 'Paciente 10 - Miguel Ángel Benítez', 'paciente10@test.com', '+595981000010', '1988-10-07', 'Masculino', 'preferencial', 'aguardando', 'CI', '9012345', 'Pedro Juan Caballero', 'Casado(a)', 'Paraguai', 'Amambay', 'Pedro Juan Caballero', 'Pedro Juan Caballero', 'San Francisco', 'Av. Cerro', '678', 'B+', 'Dipirona', 'Sanidade Militar', 'SM-008', NOW())
ON CONFLICT (id) DO NOTHING;

-- ── PROFISSIONAIS (1 por profissão) ─────────────────────────
INSERT INTO professionals (id, name, role, specialty, council, council_number, shift, email, phone, status, admission_date, color) VALUES
('PRF001',  'testeMédico',              'Médico(a)',                'Clínica Geral',            'CRM',   'CRM-12345', 'Manhã',  'testemedico@test.com',         '+595991000001', 'ativo', '2020-01-15', '#3B82F6'),
('PRF002',  'testeEnfermeiro',           'Enfermeiro(a)',            'Enfermagem Geral',          'COREN', 'COREN-1234','Tarde',  'testeenfermeiro@test.com',     '+595991000002', 'ativo', '2019-06-01', '#10B981'),
('PRF003',  'testeFisioterapeuta',       'Fisioterapeuta',           'Reabilitação Física',       'CREFITO','CREFITO-11','Manhã', 'testefisioterapeuta@test.com', '+595991000003', 'ativo', '2021-03-10', '#F59E0B'),
('PRF004',  'testePsicólogo',            'Psicólogo(a)',             'Psicologia Clínica',        'CFP',   'CFP-22334', 'Noite',  'testepsicologo@test.com',      '+595991000004', 'ativo', '2020-09-20', '#8B5CF6'),
('PRF005',  'testeNutricionista',        'Nutricionista',            'Nutrição Clínica',          'CFN',   'CFN-33445', 'Manhã',  'testenutricionista@test.com',  '+595991000005', 'ativo', '2021-07-05', '#EC4899'),
('PRF006',  'testeTécEnfermagem',        'Técnico(a) de Enfermagem', 'Enfermagem',                'COREN', 'COREN-5566','Plantão 12h','testetecenfermagem@test.com',  '+595991000006', 'ativo', '2022-01-20', '#06B6D4'),
('PRF007',  'testeAuxEnfermagem',        'Auxiliar de Enfermagem',   'Enfermagem',                'COREN', 'COREN-7788','Plantão 24h','testeauxenfermagem@test.com',  '+595991000007', 'ativo', '2022-04-10', '#14B8A6'),
('PRF008',  'testeAnestesiologista',     'Anestesiologista',         'Anestesiologia',            'CRM',   'CRM-66778', 'Integral', 'testeanestesiologista@test.com','+595991000008', 'ativo', '2018-11-01', '#F97316'),
('PRF009',  'testeCirurgião',            'Cirurgião(ã)',             'Cirurgia Geral',            'CRM',   'CRM-99001', 'Plantão 24h','testecirurgiao@test.com',      '+595991000009', 'ativo', '2017-05-15', '#EF4444'),
('PRF010',  'testeTerapeutaOcupacional', 'Terapeuta Ocupacional',    'Terapia Ocupacional',       'CREFITO','CREFITO-44','Tarde',  'testeterapeutaocu@test.com',   '+595991000010', 'ativo', '2021-08-12', '#84CC16'),
('PRF011',  'testeEducadorFísico',       'Educador Físico',          'Educação Física',           'CREF',  'CREF-55667', 'Manhã',  'testeeducadorfisico@test.com', '+595991000011', 'ativo', '2022-02-28', '#22C55E'),
('PRF012',  'testeAssistenteSocial',     'Assistente Social',        'Serviço Social',            'CRESS', 'CRESS-6678','Tarde',  'testeassistente@test.com',     '+595991000012', 'ativo', '2020-12-05', '#A855F7'),
('PRF013',  'testeFonoaudiólogo',        'Fonoaudiólogo(a)',         'Fonoaudiologia',            'CREFONO','CREFONO-89','Manhã',  'testefonoaudiologo@test.com',  '+595991000013', 'ativo', '2021-04-18', '#F472B6'),
('PRF014',  'testeFarmacêutico',         'Farmacêutico(a)',          'Farmácia Hospitalar',       'CRF',   'CRF-77889', 'Noite',  'testefarmaceutico@test.com',   '+595991000014', 'ativo', '2019-09-22', '#6366F1'),
('PRF015',  'testeDentista',             'Dentista',                 'Odontologia',               'CRO',   'CRO-99012', 'Manhã',  'testedentista@test.com',       '+595991000015', 'ativo', '2020-07-30', '#0EA5E9'),
('PRF016',  'testeBiomédico',            'Biomédico(a)',             'Biomedicina',               'CRBM',  'CRBM-11223','Plantão 12h','testebiomedico@test.com',      '+595991000016', 'ativo', '2022-06-15', '#D946EF'),
('PRF017',  'testeTécRadiologia',        'Técnico(a) em Radiologia', 'Radiologia',                'CRTR',  'CRTR-33445','Plantão 12h','testetecradiologia@test.com',  '+595991000017', 'ativo', '2021-11-08', '#78716C'),
('PRF018',  'testeTécFarmácia',          'Técnico(a) em Farmácia',   'Farmácia',                   'CRF',   'CRF-55667', 'Tarde',  'testetecfarmacia@test.com',    '+595991000018', 'ativo', '2022-08-01', '#737373'),
('PRF019',  'testeTécLaboratório',       'Técnico(a) de Laboratório','Laboratório Clínico',        'CRF',   'CRF-88990', 'Manhã',  'testeteclaboratorio@test.com', '+595991000019', 'ativo', '2021-02-14', '#57534E'),
('PRF020',  'testeAdministrador',        'Administrador(a)',         'Administração Hospitalar',   'CRA',   'CRA-12345', 'Integral','testeadministrador@test.com', '+595991000020', 'ativo', '2018-03-01', '#E11D48'),
('PRF021',  'testeRecepcionista',        'Recepcionista',            'Recepção',                   'N/A',   'N/A',       'Manhã',  'testerecepcionista@test.com',  '+595991000021', 'ativo', '2023-01-10', '#FACC15')
ON CONFLICT (id) DO NOTHING;

-- ── SALAS CLÍNICAS ──────────────────────────────────────────
INSERT INTO clinical_rooms (id, name, type, location_id, status, capacity, equipment) VALUES
('SALA001',  'Sala de Triagem',                                    'Sala de Procedimento', 'loc_1', 'ativo', 4,  '["Balança","Termômetro","Esfigmomanômetro","Otoscópio"]'::jsonb),
('SALA002',  'Sala de Gesso e Sutura',                             'Sala de Procedimento', 'loc_1', 'ativo', 2,  '["Mesa cirúrgica","Lâmpada de exame","Material de sutura"]'::jsonb),
('SALA003',  'Sala de Medicação e Inalação',                       'Sala de Procedimento', 'loc_1', 'ativo', 3,  '["Nebulizador","Máscara de O₂","Bomba de infusão"]'::jsonb),
('SALA004',  'Sala de Recuperação Pós-Anestésica',                 'Sala de Recuperação',  'loc_1', 'ativo', 6,  '["Monitor multiparamétrico","Oxímetro","Bomba de infusão"]'::jsonb),
('SALA005',  'Sala de Pré-Parto',                                  'Sala de Parto',        'loc_1', 'ativo', 3,  '["Monitor fetal","Leito articulado","Ultrassom portátil"]'::jsonb),
('SALA006',  'Sala de Parto',                                      'Sala de Parto',        'loc_1', 'ativo', 2,  '["Mesa de parto","Resuscitador neonatal","Lâmpada cirúrgica"]'::jsonb),
('SALA007',  'Quarto 1',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA008',  'Quarto 2',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA009',  'Quarto 3',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA010',  'Quarto 4',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA011',  'Quarto 5',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA012',  'Quarto 6',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA013',  'Quarto 7',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA014',  'Quarto 8',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA015',  'Quarto 9',                                           'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA016',  'Quarto 10',                                          'Quarto',               'loc_1', 'ativo', 2,  '["Leito articulado","Monkey Box","Televisão"]'::jsonb),
('SALA017',  'Enfermaria 1',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA018',  'Enfermaria 2',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA019',  'Enfermaria 3',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA020',  'Enfermaria 4',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA021',  'Enfermaria 5',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA022',  'Enfermaria 6',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA023',  'Enfermaria 7',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA024',  'Enfermaria 8',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA025',  'Enfermaria 9',                                       'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA026',  'Enfermaria 10',                                      'Enfermaria',           'loc_1', 'ativo', 8,  '["Leitos articulados","Monkey Box","Mesa de cabeceira"]'::jsonb),
('SALA027',  'Sala de UTI',                                        'UTI',                  'loc_1', 'ativo', 6,  '["Leito UTI","Monitor multiparamétrico","Ventilador mecânico","Bomba de infusão"]'::jsonb),
('SALA028',  'Berçário',                                           'Berçário',             'loc_1', 'ativo', 10, '["Berço","Resuscitador neonatal","Incubadora"]'::jsonb),
('SALA029',  'Sala de Coleta',                                     'Sala de Exame',        'loc_1', 'ativo', 3,  '["Mesa de coleta","Tubos","Centrífuga"]'::jsonb),
('SALA030',  'Central de Material e Esterilização',                'CME',                  'loc_1', 'ativo', 4,  '["Autoclave","Lavadora ultrasônica","Seladora"]'::jsonb),
('SALA031',  'Posto de Enfermagem',                               'Posto de Enfermagem',  'loc_1', 'ativo', 3,  '["Computador","Prontuário eletrônico","Estação de medicação"]'::jsonb),
('SALA032',  'Consultório Médico 1',                               'Consultório',          'loc_1', 'ativo', 2,  '["Mesa de exame","Lâmpada de exame","Balança"]'::jsonb),
('SALA033',  'Consultório Médico 2',                               'Consultório',          'loc_1', 'ativo', 2,  '["Mesa de exame","Lâmpada de exame","Balança"]'::jsonb),
('SALA034',  'Consultório Médico 3',                               'Consultório',          'loc_1', 'ativo', 2,  '["Mesa de exame","Lâmpada de exame","Balança"]'::jsonb),
('SALA035',  'Consultório Médico 4',                               'Consultório',          'loc_1', 'ativo', 2,  '["Mesa de exame","Lâmpada de exame","Balança"]'::jsonb),
('SALA036',  'Consultório Médico 5',                               'Consultório',          'loc_1', 'ativo', 2,  '["Mesa de exame","Lâmpada de exame","Balança"]'::jsonb),
('SALA037',  'Sala de Cirurgia / Bloco Cirúrgico',                 'Sala de Cirurgia',     'loc_1', 'ativo', 8,  '["Mesa cirúrgica","Lâmpada cirúrgica","Aspirador","Monitor cardíaco"]'::jsonb),
('SALA038',  'Sala de Fisioterapia e Reabilitação',                'Sala de Reabilitação', 'loc_1', 'ativo', 5,  '["Mesa de Bobath","Bolas suíças","Esteira","Bicicleta ergométrica"]'::jsonb),
('SALA039',  'Consultório de Psicologia',                          'Consultório',          'loc_1', 'ativo', 2,  '["Poltrona","Mesa","Armário"]'::jsonb),
('SALA040',  'Consultório de Nutrição',                            'Consultório',          'loc_1', 'ativo', 2,  '["Balança antropométrica","Támetro","Mesa"]'::jsonb),
('SALA041',  'Sala da Diretoria / Administração',                  'Escritório',           'loc_1', 'ativo', 3,  '["Computador","Impressora","Mesa de reunião"]'::jsonb),
('SALA042',  'Recepção',                                           'Recepção',             'loc_1', 'ativo', 5,  '["Computador","Impressora","Scanner","Monitor"]'::jsonb),
('SALA043',  'Secretaria',                                         'Escritório',           'loc_1', 'ativo', 3,  '["Computador","Impressora","Telefones"]'::jsonb),
('SALA044',  'Sala de Terapia Ocupacional',                        'Sala de Reabilitação', 'loc_1', 'ativo', 4,  '["Mesa de atividades","Ferramentas manuais","Material de artesanato"]'::jsonb),
('SALA045',  'Sala de Atividade Física',                           'Sala de Reabilitação', 'loc_1', 'ativo', 6,  '["Esteira","Bicicleta","Halteres","Bolas"]'::jsonb),
('SALA046',  'Sala do Serviço Social',                             'Escritório',           'loc_1', 'ativo', 2,  '["Computador","Mesa","Armário"]'::jsonb),
('SALA047',  'Consultório de Fonoaudiologia',                      'Consultório',          'loc_1', 'ativo', 2,  '["Mesa de exame","Espelhos","Gravador"]'::jsonb),
('SALA048',  'Farmácia Hospitalar',                                'Farmácia',             'loc_1', 'ativo', 4,  '["Armário climatizado","Balança","Computador","Refrigerador"]'::jsonb),
('SALA049',  'Consultório Odontológico',                           'Consultório',          'loc_1', 'ativo', 2,  '["Cadeira odontológica","Lâmpada","Compressor","Aspirador"]'::jsonb),
('SALA050',  'Laboratório de Análises Clínicas',                   'Laboratório',          'loc_1', 'ativo', 6,  '["Centrífuga","Microscópio","Autoclave","Laminar"]'::jsonb),
('SALA051',  'Sala de Raio-X',                                     'Sala de Exame',        'loc_1', 'ativo', 3,  '["Equipamento de raio-x","Processador digital","Chapa"]'::jsonb),
('SALA052',  'Sala de Tomografia',                                 'Sala de Exame',        'loc_1', 'ativo', 3,  '["Tomógrafo","Injetor automático","Console"]'::jsonb),
('SALA053',  'Sala de Ressonância',                                'Sala de Exame',        'loc_1', 'ativo', 3,  '["Ressonador magnético","Console","Coil"]'::jsonb),
('SALA054',  'Sala de Descanso / Plantão',                         'Área de Descanso',     'loc_1', 'ativo', 6,  '["Leitos de descanso","Armário","Mesa"]'::jsonb),
('SALA055',  'Necrotério',                                         'Necrotério',           'loc_1', 'ativo', 4,  '["Geladeira mortuária","Mesa de necropsia","Balança"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RESUMO:
-- • 10 pacientes com dados completos
-- • 21 profissionais (1 de cada profissão)
-- • 55 salas clínicas
-- ============================================================
