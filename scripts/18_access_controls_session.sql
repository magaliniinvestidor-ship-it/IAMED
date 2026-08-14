-- ============================================================
-- Log de Acesso por Sessão (Confidencialidade HCE)
-- Adiciona session_end_at em access_controls para agregar
-- as abas visitadas em 1 registro por sessão de prontuário.
-- Idempotente: pode rodar várias vezes.
-- ============================================================

ALTER TABLE public.access_controls
  ADD COLUMN IF NOT EXISTS session_end_at TIMESTAMPTZ;

-- Índice para consultas por sessão (performance)
CREATE INDEX IF NOT EXISTS idx_access_controls_session_end
  ON public.access_controls (session_end_at);

-- Teste: exibe coluna e registro de exemplo
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'access_controls'
  AND column_name = 'session_end_at';

SELECT id, patient_id, accessed_by, access_type, fields_accessed, session_end_at
FROM public.access_controls
ORDER BY accessed_at DESC
LIMIT 5;
