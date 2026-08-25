-- ============================================================
-- Coluna faltante: professionals.permissions (RBAC individual)
--
-- A aba RBAC (modo Profissional) e o fallback do login sempre
-- gravaram/leram professionals.permissions, mas a coluna nunca
-- foi criada na tabela — os updates falhavam silenciosamente.
--
-- Aplicar no Supabase Dashboard > SQL Editor > New query > Run.
-- ============================================================

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb;
