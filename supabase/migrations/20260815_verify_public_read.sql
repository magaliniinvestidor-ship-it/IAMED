-- ============================================================
-- Verificação pública de receitas via QR (/verify)
-- ============================================================
-- A página pública de verificação consulta `prescriptions`,
-- `electronic_signatures` e `professionals` com a role `anon`.
-- Essas tabelas só tinham políticas para `authenticated`, por isso
-- o QR funcionava logado (navegador com sessão) mas falhava no
-- celular (visitante sem login): "Receita não encontrada".
--
-- Aqui adicionamos políticas de LEITURA (SELECT) para `anon`,
-- mantendo as políticas de escrita apenas para `authenticated`.
-- ============================================================

-- 1) prescriptions — leitura pública do cabeçalho (QR de verificação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescriptions' AND policyname = 'prescriptions_select_anon'
  ) THEN
    CREATE POLICY prescriptions_select_anon
      ON public.prescriptions FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- 2) electronic_signatures — leitura pública (dados da assinatura do QR)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'electronic_signatures' AND policyname = 'electronic_signatures_select_anon'
  ) THEN
    CREATE POLICY electronic_signatures_select_anon
      ON public.electronic_signatures FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- 3) professionals — leitura pública (nome/conselho do assinante)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'professionals' AND policyname = 'professionals_select_anon'
  ) THEN
    CREATE POLICY professionals_select_anon
      ON public.professionals FOR SELECT TO anon USING (true);
  END IF;
END $$;