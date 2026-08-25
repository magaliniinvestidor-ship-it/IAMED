-- 2FA Email OTP: códigos passam a ser gravados apenas como hash SHA-256
-- (igual aos backup codes). O texto puro nunca mais toca o banco.
--
-- ATENÇÃO: rodar quando ninguém estiver no meio de um login com 2FA e-mail,
-- pois os códigos existentes são descartados (são transitórios, < 10 min).

-- 1. Nova coluna de hash
ALTER TABLE public.two_factor_email_otps
  ADD COLUMN IF NOT EXISTS code_hash text;

-- 2. Descarta códigos legados em texto puro (não são hasheáveis de forma segura)
DELETE FROM public.two_factor_email_otps;

-- 3. Hash passa a ser obrigatório nos novos registros
ALTER TABLE public.two_factor_email_otps
  ALTER COLUMN code_hash SET NOT NULL;

-- 4. Remove a coluna legada (o índice antigo cai junto automaticamente)
ALTER TABLE public.two_factor_email_otps
  DROP COLUMN IF EXISTS code;

-- 5. Índice alinhado à nova verificação (busca por usuário + não usado)
CREATE INDEX IF NOT EXISTS idx_two_factor_email_otps_user_unused
  ON public.two_factor_email_otps(user_id, used);
