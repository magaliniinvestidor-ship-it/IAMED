-- ========================================
-- CORRIGIR COLUNAS PREENCHIDAS EM professionals
-- Execute APÓS o script de verificação
-- ========================================

-- Preencher campos NULL ou vazios com valores padrão
UPDATE professionals SET 
  role = 'Médico(a)' WHERE role IS NULL OR role = ''
  , specialty = 'Geral' WHERE specialty IS NULL OR specialty = ''
  , council = 'CRM' WHERE council IS NULL OR council = ''
  , council_number = '00000' WHERE council_number IS NULL OR council_number = ''
  , shift = 'Manhã' WHERE shift IS NULL OR shift = ''
  , email = 'naoinformado@iamed.med.br' WHERE email IS NULL OR email = ''
  , phone = '+595 000 000000' WHERE phone IS NULL OR phone = ''
  , status = 'ativo' WHERE status IS NULL OR status = ''
  , admission_date = '2024-01-01' WHERE admission_date IS NULL
  , color = 'bg-teal-500' WHERE color IS NULL OR color = ''
  , permissions = '[]' WHERE permissions IS NULL;

-- Verificar resultado
SELECT 
  id, name, role, specialty, council, council_number, 
  shift, email, phone, status, admission_date
FROM professionals
ORDER BY name;
