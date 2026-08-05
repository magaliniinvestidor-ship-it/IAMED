-- ============================================================
-- MIGRAÇÃO: Adicionar coluna "presentation" à tabela prescriptions
-- Campo: presentation (text) - Apresentação do medicamento
-- Ex: Comprimido, Cápsula, Jarabe, Suspensión, etc.
-- ============================================================

-- Adicionar coluna presentation (nullable, com valor padrão)
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS presentation text null default ''::text;

-- Comentário da coluna
COMMENT ON COLUMN public.prescriptions.presentation IS 'Apresentação do medicamento (Comprimido, Cápsula, Jarabe, etc.)';

-- Conceder permissões
GRANT ALL ON TABLE public.prescriptions TO anon;
GRANT ALL ON TABLE public.prescriptions TO authenticated;
GRANT ALL ON TABLE public.prescriptions TO service_role;
