-- ============================================================
-- Painel Admin SNOMED-CT
-- ============================================================
-- 1. RPC atômica para gerar IDs placeholder (sequência).
--    Placeholders usados pelo seed: 1019000001..1019000064.
--    Novos conceitos criados no painel admin começam em 1019000065.
-- 2. Políticas RLS de escrita (INSERT/UPDATE/DELETE) para que o
--    painel admin (usuário autenticado) possa gerenciar a terminologia.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.snomed_placeholder_seq
  START WITH 1019000065
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE OR REPLACE FUNCTION public.next_snomed_concept_id()
RETURNS bigint
LANGUAGE sql
VOLATILE
AS $$
  SELECT nextval('public.snomed_placeholder_seq');
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'snomed_concepts' AND policyname = 'snomed_insert_authenticated'
  ) THEN
    CREATE POLICY snomed_insert_authenticated
      ON public.snomed_concepts FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'snomed_concepts' AND policyname = 'snomed_update_authenticated'
  ) THEN
    CREATE POLICY snomed_update_authenticated
      ON public.snomed_concepts FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'snomed_concepts' AND policyname = 'snomed_delete_authenticated'
  ) THEN
    CREATE POLICY snomed_delete_authenticated
      ON public.snomed_concepts FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;