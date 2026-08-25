-- ============================================================
-- RBAC: policies para tabela sso_providers
--
-- A tabela sso_providers existia sem policies que permitissem
-- INSERT/UPDATE/DELETE para usuarios administradores. Apenas
-- SELECT estava liberado (qualquer autenticado).
--
-- Esta migration reaproveita a funcao fn_is_system_admin()
-- (criada em 20260824_rbac_role_permissions.sql) para liberar
-- SELECT/INSERT/UPDATE/DELETE para SuperAdmin/Administrador
-- ativos. Anonimos continuam apenas com SELECT.
--
-- Idempotente: usa DROP IF EXISTS antes de cada CREATE POLICY.
--
-- Aplicar no Supabase Dashboard > SQL Editor > New query > Run.
-- ============================================================

ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read sso_providers" ON public.sso_providers;
CREATE POLICY "Authenticated can read sso_providers"
  ON public.sso_providers FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can write sso_providers" ON public.sso_providers;
CREATE POLICY "Admins can write sso_providers"
  ON public.sso_providers FOR ALL TO authenticated
  USING (public.fn_is_system_admin())
  WITH CHECK (public.fn_is_system_admin());

DROP POLICY IF EXISTS "Anon can read sso_providers" ON public.sso_providers;
CREATE POLICY "Anon can read sso_providers"
  ON public.sso_providers FOR SELECT TO anon
  USING (true);

REVOKE ALL ON public.sso_providers FROM anon;
REVOKE ALL ON public.sso_providers FROM authenticated;
GRANT SELECT ON public.sso_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sso_providers TO authenticated;
GRANT ALL ON public.sso_providers TO service_role;