-- ============================================================
-- RBAC: permissões por Função/Profissão (Módulo 14)
--
-- Tabela central que liga cada função de sistema OU profissão
-- (professional_roles) a um conjunto de permissões (view_*/perform_*).
-- Cadeia de resolução no login:
--   1. override individual (system_users.permissions ou professionals.permissions)
--   2. base por role_permissions[função|profissão]
--   3. fallback hardcoded legado
--
-- Aplicar no Supabase Dashboard > SQL Editor > New query > Run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_name   text PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer autenticado (o login precisa resolver as próprias permissões)
DROP POLICY IF EXISTS "Authenticated can read role_permissions" ON public.role_permissions;
CREATE POLICY "Authenticated can read role_permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (true);

REVOKE ALL ON public.role_permissions FROM anon;
REVOKE ALL ON public.role_permissions FROM authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;

-- Escrita: apenas SuperAdmin/Administrador ativo
CREATE OR REPLACE FUNCTION public.fn_is_system_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_users su
    WHERE su.auth_user_id = auth.uid()
      AND lower(su.system_role) IN ('superadmin', 'super admin', 'administrador')
      AND su.status = 'ativo'
  );
$$;

DROP POLICY IF EXISTS "Admins can write role_permissions" ON public.role_permissions;
CREATE POLICY "Admins can write role_permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.fn_is_system_admin())
  WITH CHECK (public.fn_is_system_admin());

-- ============================================================
-- Sincronização automática com a aba Cargos (professional_roles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.rbac_sync_role_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.role_permissions (role_name) VALUES (NEW.name)
  ON CONFLICT (role_name) DO NOTHING;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.rbac_sync_role_rename()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.role_permissions SET role_name = NEW.name WHERE role_name = OLD.name;
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.rbac_sync_role_delete()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.role_permissions WHERE role_name = OLD.name;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_rbac_sync_insert ON public.professional_roles;
CREATE TRIGGER trg_rbac_sync_insert AFTER INSERT ON public.professional_roles
  FOR EACH ROW EXECUTE FUNCTION public.rbac_sync_role_insert();

DROP TRIGGER IF EXISTS trg_rbac_sync_rename ON public.professional_roles;
CREATE TRIGGER trg_rbac_sync_rename AFTER UPDATE OF name ON public.professional_roles
  FOR EACH ROW EXECUTE FUNCTION public.rbac_sync_role_rename();

DROP TRIGGER IF EXISTS trg_rbac_sync_delete ON public.professional_roles;
CREATE TRIGGER trg_rbac_sync_delete AFTER DELETE ON public.professional_roles
  FOR EACH ROW EXECUTE FUNCTION public.rbac_sync_role_delete();

-- ============================================================
-- Proteção: profissões não podem usar nomes reservados de funções
-- do sistema (evita colisão na resolução de permissões)
-- ============================================================
CREATE OR REPLACE FUNCTION public.rbac_guard_reserved_name()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.name) IN (
    'superadmin', 'super admin', 'administrador', 'administrador(a)',
    'gestor', 'financeiro', 'visualizador'
  ) THEN
    RAISE EXCEPTION '"%" é uma função reservada do sistema e não pode ser usada como profissão', NEW.name;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_professional_roles_reserved ON public.professional_roles;
CREATE TRIGGER trg_professional_roles_reserved BEFORE INSERT OR UPDATE OF name
  ON public.professional_roles
  FOR EACH ROW EXECUTE FUNCTION public.rbac_guard_reserved_name();

-- ============================================================
-- Backfill: profissões existentes + seeds das funções especiais
-- ============================================================
INSERT INTO public.role_permissions (role_name)
SELECT name FROM public.professional_roles
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO public.role_permissions (role_name, permissions) VALUES
  ('SuperAdmin', '["admin:*"]'::jsonb),
  ('Administrador', '["admin:*"]'::jsonb),
  ('Visualizador', '["view_reception","view_agenda","view_hce","view_diagnostic","view_finance","view_stock","view_med_work","view_crm","view_security"]'::jsonb)
ON CONFLICT (role_name) DO NOTHING;
