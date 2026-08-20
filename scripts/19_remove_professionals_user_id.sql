-- Remover coluna user_id da tabela professionals (legado, nunca populada)
-- A relacao profissional <-> login e feita via system_users.professional_id

DROP INDEX IF EXISTS public.idx_professionals_user_id;

ALTER TABLE public.professionals
    DROP COLUMN IF EXISTS user_id;