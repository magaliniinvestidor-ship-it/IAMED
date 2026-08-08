-- ════════════════════════════════════════════════════════════════════
-- BLOCO 16: Altera coluna created_by de call_logs para text
--
-- Mesma justificativa do BLOCO 15 (blocked_slots): a coluna era uuid
-- mas o sistema em modo demo/fallback usa IDs legíveis
-- (ex.: "usr_gestor2") em vez de UUIDs Supabase Auth.
--
-- A FK call_logs_created_by_fkey aponta para auth.users(id) (uuid),
-- então precisa ser dropada. As 2 policies que dependem da coluna
-- são recriadas após o ALTER COLUMN.
-- ════════════════════════════════════════════════════════════════════

drop policy if exists "Operators insert own calls" on public.call_logs;
drop policy if exists "Operators view own calls" on public.call_logs;
alter table public.call_logs drop constraint if exists call_logs_created_by_fkey;

alter table public.call_logs
  alter column created_by type text using created_by::text;

create policy "Operators insert own calls"
  on public.call_logs
  for insert
  with check (((created_by)::text = (auth.uid())::text));

create policy "Operators view own calls"
  on public.call_logs
  for select
  using ((auth.role() = 'authenticated'::text));