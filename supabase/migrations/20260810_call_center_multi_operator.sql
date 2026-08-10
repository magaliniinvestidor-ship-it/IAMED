-- ============================================================
-- Call Center - Multioperador, status, FCR e encaminhamento
-- ============================================================

-- Status da chamada: ativa (em andamento), encerrada (atendida),
-- abandonada (cliente desligou antes/sem resolução)
ALTER TABLE public.call_center_logs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'encerrada';

-- Resolvida no primeiro contato (FCR)
ALTER TABLE public.call_center_logs
  ADD COLUMN IF NOT EXISTS resolved_first_contact boolean NOT NULL DEFAULT false;

-- Área interna de destino do encaminhamento
ALTER TABLE public.call_center_logs
  ADD COLUMN IF NOT EXISTS forwarded_to text;

-- Momento de início da chamada (p/ fila multioperador)
ALTER TABLE public.call_center_logs
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT timezone('utc'::text, now());

-- CHECK de status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'call_center_logs_status_check'
  ) THEN
    ALTER TABLE public.call_center_logs
      ADD CONSTRAINT call_center_logs_status_check
      CHECK (status = ANY (ARRAY['ativa', 'encerrada', 'abandonada']));
  END IF;
END $$;