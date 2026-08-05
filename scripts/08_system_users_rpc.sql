-- ════════════════════════════════════════════════════════════════════
-- 08_system_users_rpc.sql
-- Gera IDs sequenciais para a tabela system_users atomicamente via RPC
-- Formato: usr_1, usr_2, usr_3, ...
-- ════════════════════════════════════════════════════════════════════

create sequence if not exists seq_system_users start 1;

-- Sincroniza a sequence com o maior ID existente (caso já existam usuários)
do $$
declare v_max int;
begin
  select coalesce(max(
    case when id ~ '^usr_[0-9]+$' then substring(id from '^usr_([0-9]+)$')::int else 0 end
  ), 0) into v_max from public.system_users;
  perform setval('seq_system_users', v_max + 1, false);
end$$;

create or replace function public.next_system_user_id()
returns text
language plpgsql
as $$
declare v int;
begin
  v := nextval('seq_system_users');
  return 'usr_' || v::text;
end$$;

grant execute on function public.next_system_user_id() to authenticated;
grant execute on function public.next_system_user_id() to service_role;
