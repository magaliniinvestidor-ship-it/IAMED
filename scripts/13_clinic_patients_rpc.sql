-- ════════════════════════════════════════════════════════════════════
-- BLOCO 13: Sequence + RPC para pacientes do Módulo 2 (Agenda)
-- Gera IDs CLI001, CLI002... para a tabela clinic_patients
-- ════════════════════════════════════════════════════════════════════

create sequence if not exists seq_clinic_patients start 1;

create or replace function public.next_clinic_patient_id()
returns text
language plpgsql
as $$
declare v int;
begin
  v := nextval('seq_clinic_patients');
  return 'CLI' || lpad(v::text, 3, '0');
end$$;

grant execute on function public.next_clinic_patient_id() to authenticated;
