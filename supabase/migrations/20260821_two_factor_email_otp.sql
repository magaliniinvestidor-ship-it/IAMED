-- 2FA Email OTP: Tabela para códigos OTP enviados por email

CREATE TABLE IF NOT EXISTS public.two_factor_email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.two_factor_email_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service_role read two_factor_email_otps"
  ON public.two_factor_email_otps FOR SELECT TO service_role USING (true);

CREATE POLICY "Allow service_role insert two_factor_email_otps"
  ON public.two_factor_email_otps FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service_role update two_factor_email_otps"
  ON public.two_factor_email_otps FOR UPDATE TO service_role USING (true);

-- Grants
GRANT ALL ON TABLE public.two_factor_email_otps TO service_role;

-- Índices
CREATE INDEX IF NOT EXISTS idx_two_factor_email_otps_user_id ON public.two_factor_email_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_email_otps_code ON public.two_factor_email_otps(user_id, code, used);
