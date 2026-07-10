-- ========================================
-- MIGRATION: Tabela professional_roles
-- Execute no Supabase SQL Editor
-- ========================================

-- ========================================
-- BLOCO 1: Criar tabela
-- ========================================
CREATE TABLE IF NOT EXISTS public.professional_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- BLOCO 2: Habilitar RLS
-- ========================================
ALTER TABLE public.professional_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_access" ON public.professional_roles;
CREATE POLICY "public_access" ON public.professional_roles
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- BLOCO 3: Criar trigger para updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_professional_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_professional_roles_updated_at ON public.professional_roles;
CREATE TRIGGER trigger_update_professional_roles_updated_at
  BEFORE UPDATE ON public.professional_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_roles_updated_at();

-- ========================================
-- BLOCO 4: Inserir profissões iniciais
-- ========================================
INSERT INTO public.professional_roles (id, name, category, description) VALUES
  ('role_01', 'Médico(a)', 'Clínico', 'Profissional de Medicina'),
  ('role_02', 'Enfermeiro(a)', 'Enfermagem', 'Profissional de Enfermagem'),
  ('role_03', 'Fisioterapeuta', 'Reabilitação', 'Profissional de Fisioterapia'),
  ('role_04', 'Psicólogo(a)', 'Saúde Mental', 'Profissional de Psicologia'),
  ('role_05', 'Nutricionista', 'Nutrição', 'Profissional de Nutrição'),
  ('role_06', 'Técnico(a) de Enfermagem', 'Enfermagem', 'Técnico de Enfermagem'),
  ('role_07', 'Administrador(a)', 'Administração', 'Administrador do Sistema'),
  ('role_08', 'Recepcionista', 'Recepção', 'Atendimento ao Público'),
  ('role_09', 'Auxiliar de Enfermagem', 'Enfermagem', 'Auxiliar de Enfermagem'),
  ('role_10', 'Anestesiologista', 'Cirúrgico', 'Especialista em Anestesia'),
  ('role_11', 'Cirurgião(ã)', 'Cirúrgico', 'Especialista em Cirurgia'),
  ('role_12', 'Terapeuta Ocupacional', 'Reabilitação', 'Terapeuta Ocupacional'),
  ('role_13', 'Educador Físico', 'Reabilitação', 'Educação Física'),
  ('role_14', 'Assistente Social', 'Social', 'Assistente Social'),
  ('role_15', 'Fonoaudiólogo(a)', 'Reabilitação', 'Fonoaudiologia'),
  ('role_16', 'Farmacêutico(a)', 'Farmácia', 'Profissional de Farmácia'),
  ('role_17', 'Dentista', 'Odontologia', 'Profissional de Odontologia'),
  ('role_18', 'Biomédico(a)', 'Laboratório', 'Profissional de Biomedicina'),
  ('role_19', 'Técnico(a) em Radiologia', 'Diagnóstico', 'Técnico em Radiologia'),
  ('role_20', 'Técnico(a) em Farmácia', 'Farmácia', 'Técnico em Farmácia'),
  ('role_21', 'Técnico(a) de Laboratório', 'Laboratório', 'Técnico de Laboratório')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- BLOCO 5: Verificação
-- ========================================
SELECT COUNT(*) as total_roles FROM public.professional_roles;
SELECT * FROM public.professional_roles ORDER BY name;
