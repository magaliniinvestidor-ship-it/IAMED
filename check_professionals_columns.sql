-- ========================================
-- VERIFICAR COLUNAS PREENCHIDAS EM professionals
-- Execute no Supabase SQL Editor
-- ========================================

-- 1. Verificar profissionais com colunas obrigatórias NULL ou vazias
SELECT 
  id,
  CASE WHEN name IS NULL OR name = '' THEN '❌' ELSE '✅' END as name,
  CASE WHEN role IS NULL OR role = '' THEN '❌' ELSE '✅' END as role,
  CASE WHEN specialty IS NULL OR specialty = '' THEN '❌' ELSE '✅' END as specialty,
  CASE WHEN council IS NULL OR council = '' THEN '❌' ELSE '✅' END as council,
  CASE WHEN council_number IS NULL OR council_number = '' THEN '❌' ELSE '✅' END as council_number,
  CASE WHEN shift IS NULL OR shift = '' THEN '❌' ELSE '✅' END as shift,
  CASE WHEN email IS NULL OR email = '' THEN '❌' ELSE '✅' END as email,
  CASE WHEN phone IS NULL OR phone = '' THEN '❌' ELSE '✅' END as phone,
  CASE WHEN status IS NULL OR status = '' THEN '❌' ELSE '✅' END as status,
  CASE WHEN admission_date IS NULL THEN '❌' ELSE '✅' END as admission_date
FROM professionals
ORDER BY name;

-- 2. Contar profissionais com problemas
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE name IS NULL OR name = '') as sem_nome,
  COUNT(*) FILTER (WHERE role IS NULL OR role = '') as sem_role,
  COUNT(*) FILTER (WHERE specialty IS NULL OR specialty = '') as sem_especialidade,
  COUNT(*) FILTER (WHERE council IS NULL OR council = '') as sem_conselho,
  COUNT(*) FILTER (WHERE council_number IS NULL OR council_number = '') as sem_numero_conselho,
  COUNT(*) FILTER (WHERE shift IS NULL OR shift = '') as sem_turno,
  COUNT(*) FILTER (WHERE email IS NULL OR email = '') as sem_email,
  COUNT(*) FILTER (WHERE phone IS NULL OR phone = '') as sem_telefone,
  COUNT(*) FILTER (WHERE status IS NULL OR status = '') as sem_status,
  COUNT(*) FILTER (WHERE admission_date IS NULL) as sem_data_admissao
FROM professionals;

-- 3. Listar profissionais com problemas específicos
SELECT id, name, 'Falta email' as problema FROM professionals WHERE email IS NULL OR email = ''
UNION ALL
SELECT id, name, 'Falta telefone' as problema FROM professionals WHERE phone IS NULL OR phone = ''
UNION ALL
SELECT id, name, 'Falta data admissão' as problema FROM professionals WHERE admission_date IS NULL
UNION ALL
SELECT id, name, 'Falta especialidade' as problema FROM professionals WHERE specialty IS NULL OR specialty = '';
