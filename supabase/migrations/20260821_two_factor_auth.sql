-- 2FA / MFA: Tabelas para chaves TOTP e códigos de backup

-- Tabela de segredos TOTP por usuário
CREATE TABLE IF NOT EXISTS public.two_factor_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT two_factor_secrets_user_id_key UNIQUE (user_id)
);

-- Tabela de códigos de backup
CREATE TABLE IF NOT EXISTS public.two_factor_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.two_factor_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_backup_codes ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated
CREATE POLICY "Allow authenticated read two_factor_secrets"
  ON public.two_factor_secrets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write two_factor_secrets"
  ON public.two_factor_secrets FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update two_factor_secrets"
  ON public.two_factor_secrets FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read two_factor_backup_codes"
  ON public.two_factor_backup_codes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write two_factor_backup_codes"
  ON public.two_factor_backup_codes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update two_factor_backup_codes"
  ON public.two_factor_backup_codes FOR UPDATE TO authenticated USING (true);

-- Grants
GRANT ALL ON TABLE public.two_factor_secrets TO anon;
GRANT ALL ON TABLE public.two_factor_secrets TO authenticated;
GRANT ALL ON TABLE public.two_factor_secrets TO service_role;

GRANT ALL ON TABLE public.two_factor_backup_codes TO anon;
GRANT ALL ON TABLE public.two_factor_backup_codes TO authenticated;
GRANT ALL ON TABLE public.two_factor_backup_codes TO service_role;

-- Índices
CREATE INDEX IF NOT EXISTS idx_two_factor_secrets_user_id ON public.two_factor_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_backup_codes_user_id ON public.two_factor_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_backup_codes_used ON public.two_factor_backup_codes(user_id, used);
