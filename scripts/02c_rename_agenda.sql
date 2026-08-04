-- ════════════════════════════════════════════
-- Renomear IDs antigos 'agenda_NN' → 'CLI_NNN'
-- Estratégia: renomeia primeiro a appointments, 
-- depois atualiza as referências nas FKs
-- ════════════════════════════════════════════

begin;

-- Desabilita triggers e constraints temporariamente para permitir a troca
set session_replication_role = 'replica';

do $$
declare
  ref_record record;
  max_existing_cli int;
  agenda_record record;
  next_num int := 0;
  new_id text;
  renames jsonb := '{}'::jsonb;
begin
  select coalesce(max(
    case when id ~ '^CLI[0-9]+$' 
         then substring(id from '^CLI([0-9]+)$')::int 
         else 0 end), 0) into max_existing_cli
  from public.appointments;

  next_num := max_existing_cli;

  -- Coleta todos os renames em memória primeiro
  for agenda_record in
    select id, created_at from public.appointments
    where id ~ '^agenda_[0-9]+$'
    order by created_at asc
  loop
    next_num := next_num + 1;
    new_id := 'CLI' || lpad(next_num::text, 3, '0');
    renames := renames || jsonb_build_object(agenda_record.id, new_id);
  end loop;

  -- Passo 1: renomeia appointments (FKs ficam pendentes mas não validam)
  for agenda_record in
    select id from jsonb_object_keys(renames) as id
  loop
    update public.appointments
    set id = renames ->> agenda_record.id
    where id = agenda_record.id;
  end loop;

  -- Passo 2: atualiza todas as referências nas tabelas com FK
  for ref_record in
    select tc.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
    where tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_name = 'appointments'
      and ccu.column_name = 'id'
      and tc.table_schema = 'public'
  loop
    for agenda_record in
      select id from jsonb_object_keys(renames) as id
    loop
      execute format(
        'update public.%I set %I = $1 where %I = $2',
        ref_record.table_name, ref_record.column_name, ref_record.column_name
      ) using renames ->> agenda_record.id, agenda_record.id;
    end loop;
  end loop;

  -- Log
  for agenda_record in
    select id from jsonb_object_keys(renames) as id
  loop
    raise notice 'Renomeado: % → %', agenda_record.id, renames ->> agenda_record.id;
  end loop;
end$$;

set session_replication_role = 'origin';

commit;

-- Conferir
select count(*) as agenda_restantes 
from public.appointments where id ~ '^agenda_[0-9]+$';

select count(*) as whatsapp_agenda_restantes
from public.whatsapp_reminders where appointment_id ~ '^agenda_[0-9]+$';

select id, created_at, status
from public.appointments
where id ~ '^CLI[0-9]+$'
order by created_at
limit 10;