-- ════════════════════════════════════════════════════════════════════
-- BLOCO 15: Altera coluna created_by de blocked_slots para text
--
-- A coluna era uuid mas o sistema em modo demo/fallback usa IDs
-- legíveis (ex.: "usr_gestor2") em vez de UUIDs Supabase Auth.
-- Alterar para text permite armazenar tanto UUIDs reais quanto
-- identificadores legíveis, mantendo compatibilidade com o app.
--
-- A view v_blocked_slots_upcoming, 5 policies e a FK
-- blocked_slots_created_by_fkey dependem dessa coluna. Como
-- created_by agora aceita text, a FK para auth.users(id) (uuid)
-- não pode ser mantida, então precisa ser dropada permanentemente.
-- ════════════════════════════════════════════════════════════════════

drop policy if exists "Admins manage all blocks" on public.blocked_slots;
drop policy if exists "Doctors delete own blocks" on public.blocked_slots;
drop policy if exists "Doctors manage own blocks" on public.blocked_slots;
drop policy if exists "Doctors update own blocks" on public.blocked_slots;
drop policy if exists "Doctors view own blocks" on public.blocked_slots;
drop view if exists public.v_blocked_slots_upcoming;
alter table public.blocked_slots drop constraint if exists blocked_slots_created_by_fkey;

alter table public.blocked_slots
  alter column created_by type text using created_by::text;

create view public.v_blocked_slots_upcoming
  with (security_invoker='true') as
  select id,
         doctor_name,
         branch,
         start_date,
         end_date,
         start_time,
         end_time,
         reason,
         description,
         created_at,
         created_by,
         updated_at,
         case
           when (start_date > current_date) then 'futuro'::text
           when (end_date < current_date) then 'passado'::text
           else 'atual'::text
         end as status_temporal
  from public.blocked_slots bs
  where (end_date >= (current_date - '30 days'::interval))
  order by start_date;

create policy "Admins manage all blocks"
  on public.blocked_slots
  using ((auth.role() = 'authenticated'::text));

create policy "Doctors delete own blocks"
  on public.blocked_slots
  for delete
  using (((created_by)::text = (auth.uid())::text));

create policy "Doctors manage own blocks"
  on public.blocked_slots
  for insert
  with check (((created_by)::text = (auth.uid())::text));

create policy "Doctors update own blocks"
  on public.blocked_slots
  for update
  using (((created_by)::text = (auth.uid())::text));

create policy "Doctors view own blocks"
  on public.blocked_slots
  for select
  using ((auth.role() = 'authenticated'::text));

grant all on table public.v_blocked_slots_upcoming to anon;
grant all on table public.v_blocked_slots_upcoming to authenticated;
grant all on table public.v_blocked_slots_upcoming to service_role;