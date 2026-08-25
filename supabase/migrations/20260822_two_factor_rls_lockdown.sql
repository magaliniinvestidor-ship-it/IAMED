-- Lockdown de segurança das tabelas de 2FA (Módulo 14)
-- Fecha o acesso amplo que qualquer usuário autenticado tinha às chaves TOTP.
-- A API (/api/admin/2fa) usa SUPABASE_SERVICE_ROLE_KEY, que bypassa RLS —
-- os fluxos continuam funcionando normalmente.
--
-- Aplicar no Supabase Dashboard > SQL Editor > New query > Run.

-- ============================================================
-- two_factor_secrets
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated read two_factor_secrets" ON public.two_factor_secrets;
DROP POLICY IF EXISTS "Allow authenticated write two_factor_secrets" ON public.two_factor_secrets;
DROP POLICY IF EXISTS "Allow authenticated update two_factor_secrets" ON public.two_factor_secrets;

ALTER TABLE public.two_factor_secrets ENABLE ROW LEVEL SECURITY;

-- Usuário enxerga apenas a própria linha (necessário na checagem do login)
CREATE POLICY "Users can view own two_factor_secret"
  ON public.two_factor_secrets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.two_factor_secrets FROM anon;
REVOKE ALL ON public.two_factor_secrets FROM authenticated;
GRANT SELECT ON public.two_factor_secrets TO authenticated;
GRANT ALL ON public.two_factor_secrets TO service_role;

-- ============================================================
-- two_factor_backup_codes
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated read two_factor_backup_codes" ON public.two_factor_backup_codes;
DROP POLICY IF EXISTS "Allow authenticated write two_factor_backup_codes" ON public.two_factor_backup_codes;
DROP POLICY IF EXISTS "Allow authenticated update two_factor_backup_codes" ON public.two_factor_backup_codes;

ALTER TABLE public.two_factor_backup_codes ENABLE ROW LEVEL SECURITY;

-- Sem policies para authenticated: acesso exclusivo da service_role (via API)
REVOKE ALL ON public.two_factor_backup_codes FROM anon;
REVOKE ALL ON public.two_factor_backup_codes FROM authenticated;
GRANT ALL ON public.two_factor_backup_codes TO service_role;

-- ============================================================
-- two_factor_logs (tabela pode não existir em ambientes novos)
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  IF to_regclass('public.two_factor_logs') IS NOT NULL THEN
    ALTER TABLE public.two_factor_logs ENABLE ROW LEVEL SECURITY;

    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'two_factor_logs'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.two_factor_logs', pol.policyname);
    END LOOP;

    CREATE POLICY "Users can view own two_factor_logs"
      ON public.two_factor_logs FOR SELECT TO authenticated
      USING (auth.uid() = user_id);

    REVOKE ALL ON public.two_factor_logs FROM anon;
    GRANT SELECT ON public.two_factor_logs TO authenticated;
    GRANT ALL ON public.two_factor_logs TO service_role;
  END IF;
END $$;

-- two_factor_email_otps já é restrita à service_role por migração anterior.
