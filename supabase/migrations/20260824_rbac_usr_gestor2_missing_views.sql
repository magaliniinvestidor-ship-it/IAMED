-- ============================================================
-- RBAC: data fix usr_gestor2 (SuperAdmin)
--
-- O override individual (system_users.permissions) da conta
-- usr_gestor2 foi salvo antes da criacao das chaves view_sifen
-- (modulo 5 - SIFEN/DNIT) e view_pcmso (modulo 8 - Med.Trab/PCMSO).
-- Como override individual e autoritativo na cadeia de resolucao
-- do login, os modulos 5 e 8 ficavam bloqueados para esta conta.
--
-- Idempotente: so executa se alguma das chaves estiver ausente.
-- Ja aplicado via API em 2026-08-24; manter para reproduzir o
-- estado do banco em novos ambientes.
--
-- Aplicar no Supabase Dashboard > SQL Editor > New query > Run.
-- ============================================================

UPDATE public.system_users
SET permissions = permissions || '["view_sifen", "view_pcmso"]'::jsonb
WHERE id = 'usr_gestor2'
  AND NOT permissions @> '["view_sifen", "view_pcmso"]'::jsonb;
