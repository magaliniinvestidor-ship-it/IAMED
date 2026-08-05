-- ============================================================
-- MIGRAÇÃO: Adaptar drug_catalog para múltiplas fontes
-- Fontes: DINAVISA (PY), ANVISA (BR), FDA (US), INFARMED (PT)
-- ============================================================

-- 1. Adicionar coluna source (identifica a fonte)
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'local'
  CHECK (source IN ('local', 'dinavisa', 'anvisa', 'fda', 'infarmed'));

-- 2. ID original na fonte (código de registro)
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS source_id text;

-- 3. País de registro
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'PY';

-- 4. Número de registro
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS registration_number text;

-- 5. Data da última sincronização
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS last_sync_at timestamp with time zone;

-- 6. Nome nas diferentes línguas
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS name_es text DEFAULT '';
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS name_pt text DEFAULT '';
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS name_en text DEFAULT '';

-- 7. Dosagem padrão (para autocomplete)
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS default_dosage text DEFAULT '';
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS default_frequency text DEFAULT '';
ALTER TABLE public.drug_catalog
  ADD COLUMN IF NOT EXISTS default_duration text DEFAULT '';

-- 8. Índices (B-tree, sem dependência de extensão)
CREATE INDEX IF NOT EXISTS idx_drug_catalog_source ON public.drug_catalog (source);
CREATE INDEX IF NOT EXISTS idx_drug_catalog_source_id ON public.drug_catalog (source_id);
CREATE INDEX IF NOT EXISTS idx_drug_catalog_country ON public.drug_catalog (country);

-- 9. Comentários
COMMENT ON COLUMN public.drug_catalog.source IS 'Fonte: local, dinavisa, anvisa, fda, infarmed';
COMMENT ON COLUMN public.drug_catalog.source_id IS 'ID do medicamento na fonte original';
COMMENT ON COLUMN public.drug_catalog.country IS 'País de registro: PY, BR, US, PT';
COMMENT ON COLUMN public.drug_catalog.registration_number IS 'Número de registro na agência reguladora';
