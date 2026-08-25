-- ============================================================
-- RBAC: atualiza seed do Visualizador para as 21 views (1 por módulo)
--
-- Cada módulo do painel tem agora uma chave view_* própria:
-- 5 = view_sifen, 6 = view_finance, 8 = view_pcmso (separados).
-- Este UPDATE alinha a lista canônica com a grade completa (21 linhas).
--
-- Idempotente: sempre grava a lista canônica completa.
-- ============================================================

UPDATE public.role_permissions
SET permissions = '[
  "view_reception",
  "view_agenda",
  "view_hce",
  "view_diagnostic",
  "view_sifen",
  "view_finance",
  "view_stock",
  "view_pcmso",
  "view_med_work",
  "view_crm",
  "view_hospitalization",
  "view_bi",
  "view_patient_portal",
  "view_security",
  "view_insurance",
  "view_fee_schedule",
  "view_copay",
  "view_batches",
  "view_eligibility",
  "view_settlements",
  "view_foreign_billing"
]'::jsonb,
updated_at = now()
WHERE role_name = 'Visualizador';
