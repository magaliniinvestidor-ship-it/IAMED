-- 2FA: coluna professional_id nas 4 tabelas para identificação direta
-- do profissional no dashboard (sem join com system_users).
--
-- Preenchimento AUTOMÁTICO via trigger: busca em system_users pelo
-- auth_user_id. Nenhuma mudança no código da aplicação é necessária.

-- 1. Colunas novas (nullable — admins sem vínculo ficam NULL)
ALTER TABLE public.two_factor_secrets      ADD COLUMN IF NOT EXISTS professional_id text;
ALTER TABLE public.two_factor_backup_codes ADD COLUMN IF NOT EXISTS professional_id text;
ALTER TABLE public.two_factor_email_otps   ADD COLUMN IF NOT EXISTS professional_id text;
ALTER TABLE public.two_factor_logs         ADD COLUMN IF NOT EXISTS professional_id text;

-- 2. Backfill das linhas já existentes
UPDATE public.two_factor_secrets t
SET professional_id = su.professional_id
FROM public.system_users su
WHERE su.auth_user_id = t.user_id;

UPDATE public.two_factor_backup_codes t
SET professional_id = su.professional_id
FROM public.system_users su
WHERE su.auth_user_id = t.user_id;

UPDATE public.two_factor_email_otps t
SET professional_id = su.professional_id
FROM public.system_users su
WHERE su.auth_user_id = t.user_id;

UPDATE public.two_factor_logs t
SET professional_id = su.professional_id
FROM public.system_users su
WHERE su.auth_user_id = t.user_id;

-- 3. Função do gatilho: resolve o profissional no momento do INSERT
CREATE OR REPLACE FUNCTION public.set_two_factor_professional_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT su.professional_id INTO NEW.professional_id
    FROM public.system_users su
    WHERE su.auth_user_id = NEW.user_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Gatilhos (INSERT e mudança de user_id)
DROP TRIGGER IF EXISTS trg_2fa_professional_secrets      ON public.two_factor_secrets;
DROP TRIGGER IF EXISTS trg_2fa_professional_backup_codes ON public.two_factor_backup_codes;
DROP TRIGGER IF EXISTS trg_2fa_professional_email_otps   ON public.two_factor_email_otps;
DROP TRIGGER IF EXISTS trg_2fa_professional_logs         ON public.two_factor_logs;

CREATE TRIGGER trg_2fa_professional_secrets      BEFORE INSERT OR UPDATE OF user_id ON public.two_factor_secrets      FOR EACH ROW EXECUTE FUNCTION public.set_two_factor_professional_id();
CREATE TRIGGER trg_2fa_professional_backup_codes BEFORE INSERT OR UPDATE OF user_id ON public.two_factor_backup_codes FOR EACH ROW EXECUTE FUNCTION public.set_two_factor_professional_id();
CREATE TRIGGER trg_2fa_professional_email_otps   BEFORE INSERT OR UPDATE OF user_id ON public.two_factor_email_otps   FOR EACH ROW EXECUTE FUNCTION public.set_two_factor_professional_id();
CREATE TRIGGER trg_2fa_professional_logs         BEFORE INSERT OR UPDATE OF user_id ON public.two_factor_logs         FOR EACH ROW EXECUTE FUNCTION public.set_two_factor_professional_id();
