-- ════════════════════════════════════════════
-- BLOCO 3: Funções RPC para gerar IDs atomicamente
-- O front chama: supabase.rpc('next_clinical_id', { p_prefix: 'presc' })
-- ════════════════════════════════════════════

create or replace function public.next_clinical_id(p_prefix text)
returns text
language plpgsql
as $$
declare
  v_seq text;
  v_num int;
begin
  v_seq := case p_prefix
    when 'presc' then 'seq_prescriptions'
    when 'anam'  then 'seq_anamnese'
    when 'soap'  then 'seq_soap_notes'
    when 'diag'  then 'seq_diagnoses'
    when 'exam'  then 'seq_exam_requests'
    when 'proc'  then 'seq_procedures'
    when 'att'   then 'seq_clinical_attachments'
    when 'sig'   then 'seq_electronic_signatures'
    when 'aso'   then 'seq_aso_exams'
    else null
  end;
  if v_seq is null then
    raise exception 'Prefixo desconhecido: %', p_prefix;
  end if;
  v_num := nextval(v_seq);
  return p_prefix || '_' || lpad(v_num::text, 4, '0');
end$$;

create or replace function public.next_patient_id()
returns text
language plpgsql
as $$
declare v int;
begin
  v := nextval('seq_patients');
  return 'PAC' || lpad(v::text, 3, '0');
end$$;

create or replace function public.next_appointment_id()
returns text
language plpgsql
as $$
declare v int;
begin
  v := nextval('seq_appointments');
  return 'CLI' || lpad(v::text, 3, '0');
end$$;

create or replace function public.next_location_id()
returns text
language plpgsql
as $$
declare v int;
begin
  v := nextval('seq_locations');
  return 'loc_' || v::text;
end$$;

create or replace function public.next_room_id()
returns text
language plpgsql
as $$
declare v int;
begin
  v := nextval('seq_clinical_rooms');
  return 'SALA' || lpad(v::text, 3, '0');
end$$;

create or replace function public.next_professional_id()
returns text
language plpgsql
as $$
declare v int;
begin
  v := nextval('seq_professionals');
  return 'PRF' || lpad(v::text, 3, '0');
end$$;

create or replace function public.next_role_id()
returns text
language plpgsql
as $$
declare v int;
begin
  v := nextval('seq_professional_roles');
  return 'role_' || lpad(v::text, 2, '0');
end$$;

-- ════════════════════════════════════════════
-- Permissões para usuários autenticados
-- ════════════════════════════════════════════
grant usage on schema public to authenticated;
grant execute on function public.next_clinical_id(text)              to authenticated;
grant execute on function public.next_patient_id()                   to authenticated;
grant execute on function public.next_appointment_id()               to authenticated;
grant execute on function public.next_location_id()                  to authenticated;
grant execute on function public.next_room_id()                      to authenticated;
grant execute on function public.next_professional_id()              to authenticated;
grant execute on function public.next_role_id()                      to authenticated;

-- ════════════════════════════════════════════
-- Teste (rollback depois)
-- ════════════════════════════════════════════
select public.next_clinical_id('presc')   as test_presc,
       public.next_clinical_id('soap')    as test_soap,
       public.next_patient_id()           as test_pac,
       public.next_appointment_id()       as test_cli,
       public.next_location_id()          as test_loc,
       public.next_room_id()              as test_sala,
       public.next_professional_id()      as test_prf,
       public.next_role_id()              as test_role;