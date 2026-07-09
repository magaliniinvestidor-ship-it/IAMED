-- ========================================
-- ATUALIZAR CHECK CONSTRAINT DA COLUNA role
-- Execute ANTES do seed de profissionais
-- ========================================

-- Primeiro, remover a constraint antiga
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_role_check;

-- Criar nova constraint com todos os cargos permitidos
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
