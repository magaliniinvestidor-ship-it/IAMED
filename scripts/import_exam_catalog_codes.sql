-- ════════════════════════════════════════════════════════════════
-- Importação de códigos oficiais em exam_catalog_codes
-- ════════════════════════════════════════════════════════════════
-- Preenche exam_catalog_codes (código por país: BR=TUSS/AMB,
-- PY=IPS, AR/ES=nomenclador nacional, US=CPT, PT=tabela nacional)
-- casando o NOME do exame da fonte oficial com o catálogo traduzido.
--
-- Como usar:
--   1. Coloque os dados oficiais em um CSV (colunas na ordem abaixo)
--      e carregue com \copy OU preencha com INSERTs (veja o exemplo).
--   2. Rode o script.
--
-- Formato do CSV esperado (sem cabeçalho):
--   country | code | source | locale | name
--   BR       | 40201 | TUSS   | pt-BR  | HEMOGRAMA COMPLETO
--   PY       | 4521  | IPS    | es-PY  | HEMOGRAMA COMPLETO
--   US       | 85025 | CPT    | en     | Complete Blood Count
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._norm_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT translate(lower(COALESCE(input, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
$$;

-- 1) Tabela de staging (dados oficiais que você vai carregar)
DROP TABLE IF EXISTS _exam_codes_import;
CREATE TEMP TABLE _exam_codes_import (
  country text NOT NULL,   -- BR | PT | AR | PY | ES | US
  code text NOT NULL,
  source text,             -- ex.: 'TUSS', 'IPS', 'CPT', 'CBHPM'
  locale text NOT NULL,    -- locale do nome na fonte
  name text NOT NULL
);

-- 2) ⬇⬇⬇ COLE SEUS DADOS AQUI (exemplo) ⬇⬇⬇
-- INSERT INTO _exam_codes_import (country, code, source, locale, name) VALUES
-- ('BR', '40201', 'TUSS', 'pt-BR', 'HEMOGRAMA COMPLETO'),
-- ('PY', '4521',  'IPS',  'es-PY', 'HEMOGRAMA COMPLETO');
-- Ou carregue de CSV:
-- \copy _exam_codes_import (country, code, source, locale, name) FROM 'caminho/arquivo.csv' WITH (FORMAT csv)
-- ⬆⬆⬆ ⬆⬆⬆

-- 3) Preenche exam_catalog_codes casando nome normalizado com a tradução
INSERT INTO public.exam_catalog_codes (catalog_id, country, code, source)
SELECT DISTINCT t.catalog_id, i.country, i.code, i.source
FROM _exam_codes_import i
JOIN public.exam_catalog_translations t
  ON t.locale = i.locale
 AND public._norm_text(t.name) = public._norm_text(i.name)
ON CONFLICT (catalog_id, country) DO NOTHING;

-- 4) Relatório: o que casou e o que ficou sem correspondência
SELECT 'OK' AS status, i.country, i.code, i.source, t.catalog_id
FROM _exam_codes_import i
JOIN public.exam_catalog_translations t
  ON t.locale = i.locale
 AND public._norm_text(t.name) = public._norm_text(i.name)
UNION ALL
SELECT 'SEM_MATCH' AS status, i.country, i.code, i.source, NULL::text
FROM _exam_codes_import i
WHERE NOT EXISTS (
  SELECT 1 FROM public.exam_catalog_translations t
  WHERE t.locale = i.locale
    AND public._norm_text(t.name) = public._norm_text(i.name)
)
ORDER BY status DESC, country;

-- 5) Se houver 'SEM_MATCH', o nome oficial difere do catálogo.
--    Revise o nome e reenvie, ou adicione o exame no catálogo:
-- INSERT INTO public.exam_catalog (id, exam_type, category)
-- SELECT public.next_exam_catalog_id(), 'laboratorio', 'bioquimica';
-- (e depois as 6 traduções em exam_catalog_translations)