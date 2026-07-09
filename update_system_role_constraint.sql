-- ========================================
-- ATUALIZAR CHECK CONSTRAINT de system_role
-- Execute no Supabase SQL Editor
-- ========================================

-- Passo 1: Remover constraint antiga
ALTER TABLE system_users DROP CONSTRAINT IF EXISTS system_users_system_role_check;

-- Passo 2: Adicionar nova constraint com todos os 26 cargos
ALTER TABLE system_users ADD CONSTRAINT system_users_system_role_check 
  CHECK (system_role IN (
    'SuperAdmin', 'Administrador', 'Gestor', 'Diretor Clínico', 'Financeiro', 'Visualizador',
    'Médico', 'Enfermeiro', 'Recepcionista', 'Farmacêutico',
    'Fisioterapeuta', 'Psicólogo(a)', 'Nutricionista',
    'Técnico(a) de Enfermagem', 'Auxiliar de Enfermagem',
    'Terapeuta Ocupacional', 'Educador Físico',
    'Assistente Social', 'Fonoaudiólogo(a)',
    'Dentista', 'Biomédico(a)',
    'Técnico(a) em Radiologia', 'Técnico(a) em Farmácia', 'Técnico(a) de Laboratório',
    'Anestesiologista', 'Cirurgião(ã)'
  ));
