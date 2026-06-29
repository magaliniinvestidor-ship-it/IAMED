-- ============================================================
-- IAMED - SEED DATA COMPLETO (INSERT SEGURO)
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Pacientes
INSERT INTO patients (id, name, email, phone, birthdate, gender, priority, status)
SELECT * FROM (VALUES
  ('pat_1', 'Carlos Eduardo Almeida', 'carlos.almeida@gmail.com', '(11) 98765-4321', '1984-06-15'::DATE, 'Masculino', 'normal', 'aguardando'),
  ('pat_2', 'Mariana Rosa Santos', 'mariana.santos@yahoo.com.br', '(11) 91234-5678', '1998-11-28'::DATE, 'Feminino', 'preferencial', 'atendimento'),
  ('pat_3', 'Joaquim Bento Pereira', 'joaquim.pereira@outlook.com', '(21) 99888-7766', '1959-02-03'::DATE, 'Masculino', 'preferencial', 'agendado'),
  ('pat_4', 'Ana Júlia de Souza', 'anajulia.souza@gmail.com', '(11) 97777-8888', '2011-09-02'::DATE, 'Feminino', 'emergência', 'aguardando'),
  ('pat_5', 'Roberto de Oliveira Cruz', 'roberto.cruz@industria.com.br', '(19) 98122-3344', '1991-07-24'::DATE, 'Masculino', 'normal', 'atendido')
) AS v(id, name, email, phone, birthdate, gender, priority, status)
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id = v.id);

-- 2. Histórico Clínico
INSERT INTO clinical_history (id, patient_id, date, type, diagnosis, cid10, prescriptions, notes, doctor)
SELECT * FROM (VALUES
  ('his_1', 'pat_1', '2026-03-10'::DATE, 'Consulta Ortopédica', 'Tendinite de Aquiles', 'M76.6', ARRAY['Ibuprofeno 600mg', 'Fisioterapia 10 sessões'], 'Paciente relata dor ao correr. Iniciado tratamento conservador.', 'Dr. Adriano Lima'),
  ('his_2', 'pat_1', '2026-05-22'::DATE, 'Consulta Geral', 'Hipertensão arterial primária', 'I10', ARRAY['Losartana Potássica 50mg'], 'Pressão aferida: 140/90 mmHg. Recomendado acompanhamento.', 'Dra. Amanda Silva'),
  ('his_3', 'pat_2', '2026-04-15'::DATE, 'Acompanhamento Ginecológico', 'Gravidez de baixo risco (Pré-natal)', 'Z34.0', ARRAY['Ácido Fólico 5mg', 'Sulfato Ferroso 40mg'], 'Primeiro trimestre, ultrassom inicial confirma 8 semanas normais.', 'Dra. Amanda Silva'),
  ('his_4', 'pat_3', '2026-01-20'::DATE, 'Consulta Ortopédica', 'Lombocatalgia crônica', 'M54.5', ARRAY['Pregabalina 75mg', 'Alongamentos diários'], 'Dor lombar há mais de 3 anos, irradia para membro inferior esquerdo.', 'Dr. Adriano Lima'),
  ('his_5', 'pat_5', '2025-06-20'::DATE, 'Exame de Medicina do Trabalho', 'Aptidão no trabalho em altura (NR-35)', 'Z02.7', ARRAY[]::TEXT[], 'Exame de acuidade visual, ECG e EEG normais. Homologado.', 'Dr. Bruno Castro')
) AS v(id, patient_id, date, type, diagnosis, cid10, prescriptions, notes, doctor)
WHERE NOT EXISTS (SELECT 1 FROM clinical_history WHERE id = v.id);

-- 3. Consultas
INSERT INTO appointments (id, patient_id, patient_name, doctor_name, specialty, date, time, status)
SELECT * FROM (VALUES
  ('app_1', 'pat_3', 'Joaquim Bento Pereira', 'Dr. Adriano Lima', 'Ortopedia', '2026-06-22'::DATE, '09:00:00'::TIME, 'confirmado'),
  ('app_2', 'pat_1', 'Carlos Eduardo Almeida', 'Dra. Amanda Silva', 'Cardiologia', '2026-06-22'::DATE, '10:30:00'::TIME, 'confirmado'),
  ('app_3', 'pat_2', 'Mariana Rosa Santos', 'Dr. Bruno Castro', 'Clínico Geral', '2026-06-22'::DATE, '13:00:00'::TIME, 'atendido'),
  ('app_4', 'pat_5', 'Roberto de Oliveira Cruz', 'Dr. Bruno Castro', 'Medicina do Trabalho', '2026-06-23'::DATE, '14:15:00'::TIME, 'pendente')
) AS v(id, patient_id, patient_name, doctor_name, specialty, date, time, status)
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE id = v.id);

-- 4. Financeiro
INSERT INTO financial_postings (id, description, type, amount, category, date)
SELECT * FROM (VALUES
  ('fin_1', 'Faturamento Consulta - Plano Amil (Carlos)', 'receita', 150.00::NUMERIC, 'Consultas', '2026-06-21'::DATE),
  ('fin_2', 'Procedimento Raio-X - Particular', 'receita', 220.00::NUMERIC, 'Exames de Imagem', '2026-06-21'::DATE),
  ('fin_3', 'Compra de Insumos - Seringas e Gaze', 'despesa', 480.00::NUMERIC, 'Insumos Médicos', '2026-06-20'::DATE),
  ('fin_4', 'Faturamento Internação Particular', 'receita', 1250.00::NUMERIC, 'Internação', '2026-06-19'::DATE),
  ('fin_5', 'Energia Elétrica e Telefonia Clínica', 'despesa', 890.00::NUMERIC, 'Operacional', '2026-06-18'::DATE),
  ('fin_6', 'Assessoria Jurídica e Contábil', 'despesa', 1200.00::NUMERIC, 'Serviços', '2026-06-15'::DATE)
) AS v(id, description, type, amount, category, date)
WHERE NOT EXISTS (SELECT 1 FROM financial_postings WHERE id = v.id);

-- 5. Estoque
INSERT INTO stock_items (id, name, category, quantity, min_quantity, unit)
SELECT * FROM (VALUES
  ('stk_1', 'Amoxicilina 500mg (Cps)', 'Antibióticos', 240, 50, 'cápsulas'),
  ('stk_2', 'Insulina NPH 10ml', 'Insumo Diabéticos', 8, 10, 'frascos'),
  ('stk_3', 'Seringas Descartáveis Luer Lock 5ml', 'Consumíveis', 1500, 300, 'unidades'),
  ('stk_4', 'Dipirona Monoidratada Gotas', 'Analgésicos', 38, 15, 'frascos'),
  ('stk_5', 'Cateter Gelco calibre 20G', 'Cirúrgico', 12, 40, 'unidades')
) AS v(id, name, category, quantity, min_quantity, unit)
WHERE NOT EXISTS (SELECT 1 FROM stock_items WHERE id = v.id);

-- 6. Leitos
INSERT INTO beds (id, name, wing, status, patient_name, entry_date)
SELECT * FROM (VALUES
  ('bd_1', 'Leito 101-A (Enfermaria)', 'Alas Gerais', 'ocupado', 'Carlos Eduardo Almeida', '2026-06-21'::DATE),
  ('bd_2', 'Leito 101-B (Enfermaria)', 'Alas Gerais', 'disponível', NULL::TEXT, NULL::DATE),
  ('bd_3', 'UTI Cardiológica — Box 01', 'UTI', 'disponível', NULL::TEXT, NULL::DATE),
  ('bd_4', 'Sala Cirúrgica Alpha', 'Centro Cirúrgico', 'ocupado', 'Mariana Rosa Santos', '2026-06-21'::DATE)
) AS v(id, name, wing, status, patient_name, entry_date)
WHERE NOT EXISTS (SELECT 1 FROM beds WHERE id = v.id);

-- 7. Auditoria
INSERT INTO audit_logs (id, operator, role, action, target, timestamp, ip)
SELECT * FROM (VALUES
  ('log_1', 'Marcela Ramos', 'Recepcionista', 'Visualizou Prontuário', 'Carlos Eduardo Almeida', '2026-06-21 11:34:00'::TIMESTAMPTZ, '192.168.1.45'),
  ('log_2', 'Dra. Amanda Silva', 'Médico', 'Adicionou Diagnóstico', 'Mariana Rosa Santos', '2026-06-21 11:12:00'::TIMESTAMPTZ, '10.0.0.12'),
  ('log_3', 'Adriano Lima', 'Gestor', 'Baixou Lote SIFEN', 'SIFEN XML #302', '2026-06-21 10:20:00'::TIMESTAMPTZ, '192.168.1.10'),
  ('log_4', 'Sistema IAMED', 'Servidor', 'Backup Automático', 'Database_Cloud', '2026-06-21 04:00:00'::TIMESTAMPTZ, '127.0.0.1')
) AS v(id, operator, role, action, target, timestamp, ip)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE id = v.id);

-- 8. ASOs
INSERT INTO aso_exams (id, patient_name, type, risks, status, date, doctor)
SELECT * FROM (VALUES
  ('aso_1', 'Roberto de Oliveira Cruz', 'Periódico', ARRAY['Ruído Contínuo', 'Ergonômico', 'Trabalho em Altura'], 'apto', '2026-06-21'::DATE, 'Dr. Bruno Castro'),
  ('aso_2', 'Cláudio Siqueira', 'Admissional', ARRAY['Postura Física', 'Poeira Mineral'], 'apto', '2026-06-20'::DATE, 'Dr. Bruno Castro')
) AS v(id, patient_name, type, risks, status, date, doctor)
WHERE NOT EXISTS (SELECT 1 FROM aso_exams WHERE id = v.id);

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT t.table_name,
  (xpath('/row/cnt/text()', query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I', t.table_name), false, true, '')))[1]::TEXT::INT AS total_rows
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
