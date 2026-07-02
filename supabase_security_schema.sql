-- ==========================================
-- IAMED - ADMINISTRAÇÃO DO SISTEMA E SEGURANÇA
-- Tabelas para Gestão de Usuários, RBAC, 2FA, SSO, Política de Senhas
-- ==========================================

-- 1. SISTEMA DE USUÁRIOS (extends profiles)
CREATE TABLE IF NOT EXISTS system_users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  ci VARCHAR(20) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SuperAdmin', 'Administrador', 'Gestor', 'Diretor Clínico', 'Médico', 'Enfermeiro', 'Recepcionista', 'Financeiro', 'Farmacêutico', 'Visualizador')),
  profession TEXT NOT NULL DEFAULT '',
  professional_registry TEXT NOT NULL DEFAULT '',
  council_type TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  specialties TEXT[] DEFAULT '{}',
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo', 'bloqueado')) DEFAULT 'ativo',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_method TEXT CHECK (two_factor_method IN ('totp', 'sms', 'email', 'none')) DEFAULT 'none',
  two_factor_secret TEXT,
  two_factor_backup_codes JSONB DEFAULT '[]'::JSONB,
  last_login TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  must_change_password BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. POLÍTICA DE SENHAS
CREATE TABLE IF NOT EXISTS password_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT TRUE,
  min_length INTEGER DEFAULT 8,
  require_uppercase BOOLEAN DEFAULT TRUE,
  require_lowercase BOOLEAN DEFAULT TRUE,
  require_numbers BOOLEAN DEFAULT TRUE,
  require_special_chars BOOLEAN DEFAULT TRUE,
  expiration_days INTEGER DEFAULT 90,
  history_count INTEGER DEFAULT 5,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  session_timeout_minutes INTEGER DEFAULT 60,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. HISTÓRICO DE SENHAS (para evitar reuso)
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. SESSÕES DE USUÁRIO
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  ip_address INET,
  device_info TEXT,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  revoked BOOLEAN DEFAULT FALSE
);

-- 5. TENTATIVAS DE LOGIN
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. CONFIGURAÇÃO SSO
CREATE TABLE IF NOT EXISTS sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('saml', 'oauth2', 'oidc')),
  enabled BOOLEAN DEFAULT FALSE,
  issuer_url TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL DEFAULT '',
  metadata_url TEXT NOT NULL DEFAULT '',
  certificate_fingerprint TEXT NOT NULL DEFAULT '',
  default_role TEXT CHECK (default_role IN ('SuperAdmin', 'Administrador', 'Gestor', 'Diretor Clínico', 'Médico', 'Enfermeiro', 'Recepcionista', 'Financeiro', 'Farmacêutico', 'Visualizador')) DEFAULT 'Visualizador',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. LOGS DE AUTENTICAÇÃO 2FA
CREATE TABLE IF NOT EXISTS two_factor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('totp', 'sms', 'email', 'backup')),
  success BOOLEAN NOT NULL,
  ip_address INET,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow authenticated read system_users" ON system_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert system_users" ON system_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update system_users" ON system_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete system_users" ON system_users FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read password_policy" ON password_policy FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write password_policy" ON password_policy FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read password_history" ON password_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write password_history" ON password_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read user_sessions" ON user_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write user_sessions" ON user_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read login_attempts" ON login_attempts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write login_attempts" ON login_attempts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read sso_providers" ON sso_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write sso_providers" ON sso_providers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read two_factor_logs" ON two_factor_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write two_factor_logs" ON two_factor_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Inserir política de senhas padrão (se não existir)
INSERT INTO password_policy (enabled, min_length, require_uppercase, require_lowercase, require_numbers, require_special_chars, expiration_days, history_count, max_login_attempts, lockout_duration_minutes, session_timeout_minutes)
VALUES (TRUE, 8, TRUE, TRUE, TRUE, TRUE, 90, 5, 5, 30, 60)
ON CONFLICT DO NOTHING;
