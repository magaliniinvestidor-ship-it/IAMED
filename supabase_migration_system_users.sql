-- ========================================
-- MIGRATION: Tabela system_users
-- Execute no Supabase SQL Editor
-- ========================================

-- ATENÇÃO: Execute cada bloco SEPARADAMENTE se houver erro

-- ========================================
-- BLOCO 1: Criar tabela system_users
-- ========================================
DROP TABLE IF EXISTS system_users CASCADE;

CREATE TABLE system_users (
  id TEXT PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  professional_id TEXT REFERENCES professionals(id) ON DELETE SET NULL,
  ci TEXT,
  system_role TEXT NOT NULL DEFAULT 'Visualizador',
  location TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_method TEXT DEFAULT 'none',
  last_login TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  must_change_password BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- BLOCO 2: Adicionar CHECK constraints
-- ========================================
ALTER TABLE system_users ADD CONSTRAINT system_users_system_role_check 
  CHECK (system_role IN ('SuperAdmin', 'Administrador', 'Gestor', 'Diretor Clínico', 'Financeiro', 'Visualizador', 'Médico', 'Enfermeiro', 'Recepcionista', 'Farmacêutico', 'Fisioterapeuta', 'Psicólogo(a)', 'Nutricionista', 'Técnico(a) de Enfermagem', 'Auxiliar de Enfermagem', 'Terapeuta Ocupacional', 'Educador Físico', 'Assistente Social', 'Fonoaudiólogo(a)', 'Dentista', 'Biomédico(a)', 'Técnico(a) em Radiologia', 'Técnico(a) em Farmácia', 'Técnico(a) de Laboratório', 'Anestesiologista', 'Cirurgião(ã)'));

ALTER TABLE system_users ADD CONSTRAINT system_users_two_factor_method_check 
  CHECK (two_factor_method IN ('totp', 'sms', 'email', 'none'));

ALTER TABLE system_users ADD CONSTRAINT system_users_status_check 
  CHECK (status IN ('ativo', 'inativo', 'bloqueado'));

-- ========================================
-- BLOCO 3: Criar índices
-- ========================================
CREATE INDEX idx_system_users_auth_id ON system_users(auth_user_id);
CREATE INDEX idx_system_users_professional_id ON system_users(professional_id);
CREATE INDEX idx_system_users_status ON system_users(status);

-- ========================================
-- BLOCO 4: Adicionar coluna user_id em professionals
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'professionals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE professionals ADD COLUMN user_id TEXT;
    CREATE INDEX idx_professionals_user_id ON professionals(user_id);
  END IF;
END $$;

-- ========================================
-- BLOCO 5: Habilitar RLS
-- ========================================
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access for dev" ON system_users
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- BLOCO 6: Criar trigger para updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_system_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_users_updated_at ON system_users;
CREATE TRIGGER trigger_update_system_users_updated_at
  BEFORE UPDATE ON system_users
  FOR EACH ROW
  EXECUTE FUNCTION update_system_users_updated_at();

-- ========================================
-- BLOCO 7: Inserir dados de teste (opcional)
-- ========================================
-- Execute apenas se tiver os profissionais prof_1 a prof_5 cadastrados

INSERT INTO system_users (id, professional_id, ci, system_role, location, two_factor_enabled, two_factor_method, permissions, status)
VALUES
  ('usr_1', NULL, '1234567', 'SuperAdmin', 'Matriz', true, 'totp', '["view_reception","view_agenda","view_hce","view_diagnostic","view_sifen","view_finance","view_stock","view_med_work","view_crm","view_beds","view_bi","view_patient_portal","view_security","view_admin","view_insurance","view_fee_schedule","view_batch_invoices","view_eligibility","view_settlements","view_foreign_billings","perform_admit","perform_prescribe","perform_sifen","perform_post_finance","perform_stock","perform_beds","perform_rbac","perform_admin","perform_insurance","perform_fee_schedule","perform_batch_invoices","perform_eligibility","perform_settlements"]', 'ativo'),
  ('usr_2', NULL, '2345678', 'Diretor Clínico', 'Filial', true, 'totp', '["view_reception","view_agenda","view_hce","view_diagnostic","view_sifen","view_finance","view_stock","view_med_work","view_crm","view_beds","view_bi","view_patient_portal","view_security","view_insurance","view_fee_schedule","view_batch_invoices","view_eligibility","view_settlements","view_foreign_billings"]', 'ativo'),
  ('usr_3', NULL, '3456789', 'Recepcionista', 'Matriz', false, 'none', '["view_reception","view_agenda","view_patient_portal","view_beds","perform_admit"]', 'ativo'),
  ('usr_4', NULL, '4567890', 'Médico', 'Filial', true, 'sms', '["view_reception","view_agenda","view_hce","view_diagnostic","view_sifen","view_med_work","view_beds","view_stock","perform_admit","perform_prescribe","perform_beds"]', 'ativo'),
  ('usr_5', NULL, '5678901', 'Financeiro', 'Matriz', true, 'email', '["view_sifen","view_finance","view_stock","view_insurance","view_fee_schedule","view_batch_invoices","view_settlements","perform_sifen","perform_post_finance","perform_stock","perform_insurance","perform_fee_schedule","perform_batch_invoices","perform_settlements"]', 'ativo')
ON CONFLICT (id) DO NOTHING;
