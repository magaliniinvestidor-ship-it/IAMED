-- ========================================
-- ATUALIZAR TODAS AS CHECK CONSTRAINTS
-- Execute ANTES do seed de profissionais
-- ========================================

-- 1. Constraint da coluna role
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_role_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_role_check 
CHECK (role IN (
  'Médico(a)',
  'Enfermeiro(a)',
  'Fisioterapeuta',
  'Psicólogo(a)',
  'Nutricionista',
  'Técnico(a) de Enfermagem',
  'Administrador(a)',
  'Recepcionista',
  'Terapeuta Ocupacional',
  'Educador Físico',
  'Assistente Social',
  'Fonoaudiólogo(a)',
  'Farmacêutico(a)',
  'Dentista',
  'Biomédico(a)',
  'Técnico(a) em Radiologia',
  'Técnico(a) em Farmácia',
  'Técnico(a) de Laboratório',
  'Auxiliar de Enfermagem',
  'Anestesiologista',
  'Cirurgião(ã)'
));

-- 2. Constraint da coluna council
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_council_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_council_check 
CHECK (council IN (
  'CRM',
  'COREN',
  'CREFITO',
  'CFP',
  'CFN',
  'CRO',
  'CRESS',
  'CRFa',
  'CRF',
  'CRBM',
  'CREF',
  'N/A'
));

-- 3. Constraint da coluna shift (se existir)
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_shift_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_shift_check 
CHECK (shift IN (
  'Manhã',
  'Tarde',
  'Noite',
  'Integral',
  'Plantão 12h',
  'Plantão 24h'
));

-- 4. Constraint da coluna status (se existir)
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_status_check;
ALTER TABLE professionals ADD CONSTRAINT professionals_status_check 
CHECK (status IN (
  'ativo',
  'inativo',
  'férias'
));
