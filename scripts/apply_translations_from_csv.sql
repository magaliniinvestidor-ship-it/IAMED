-- ════════════════════════════════════════════════════════════════
-- Aplicar traduções a partir do CSV (alternativa ao SQL gigante)
-- ════════════════════════════════════════════════════════════════
-- Como usar:
--   1) Rode este script UMA VEZ no SQL Editor (cria a staging table).
--   2) No painel: Table Editor → tabela exam_tr_import →
--      "Import data from CSV" → escolha
--      scripts/output/translations_2026-08-15.csv
--      (o CSV tem cabeçalho: src_locale,src_name,locale,name)
--   3) Rode o bloco "INSERT" abaixo (basta re-executar este mesmo
--      script — a parte do INSERT é idempotente e ignora duplicados).
--   4) Opcional: rode o DROP no final para limpar a staging.
-- ════════════════════════════════════════════════════════════════

-- _norm_text() é recriada aqui porque a migration 20260813 a droppa.
CREATE OR REPLACE FUNCTION public._norm_text(input text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT translate(lower(COALESCE(input, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
$$;

-- 1) Tabela de staging (para importação via CSV)
CREATE TABLE IF NOT EXISTS public.exam_tr_import (
  src_locale text,
  src_name text,
  locale text,
  name text
);

-- 2) INSERT das traduções (idempotente — rode após o import do CSV)
INSERT INTO public.exam_catalog_translations (catalog_id, locale, name)
SELECT DISTINCT t.catalog_id, i.locale, i.name
FROM public.exam_tr_import i
JOIN public.exam_catalog_translations t
  ON t.locale = i.src_locale
 AND public._norm_text(t.name) = public._norm_text(i.src_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exam_catalog_translations e
  WHERE e.catalog_id = t.catalog_id AND e.locale = i.locale
)
ON CONFLICT (catalog_id, locale) DO NOTHING;

-- 3) Relatório
SELECT (SELECT count(*) FROM public.exam_tr_import) AS linhas_csv,
       (SELECT count(DISTINCT catalog_id) FROM public.exam_catalog_translations) AS catalogs_com_traducao;

-- 4) Limpeza (opcional, após conferir)
-- DROP TABLE IF EXISTS public.exam_tr_import;