-- ════════════════════════════════════════════
-- BLOCO 2: Sincronizar sequences com maior ID existente
-- Lê o maior NNNN de cada tabela e alinha a sequence.
-- IDs fora do padrão (ex: texto sem número) são IGNORADOS.
-- ════════════════════════════════════════════

do $$
declare
  max_num int;
begin

  -- prescriptions: presc_NNNN
  select coalesce(max(
    case when id ~ '^presc_[0-9]+$' 
         then substring(id from 'presc_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.prescriptions;
  perform setval('seq_prescriptions', greatest(max_num, 1));

  -- anamnese: anam_NNNN
  select coalesce(max(
    case when id ~ '^anam_[0-9]+$' 
         then substring(id from 'anam_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.anamnese;
  perform setval('seq_anamnese', greatest(max_num, 1));

  -- soap_notes: soap_NNNN
  select coalesce(max(
    case when id ~ '^soap_[0-9]+$' 
         then substring(id from 'soap_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.soap_notes;
  perform setval('seq_soap_notes', greatest(max_num, 1));

  -- diagnoses: diag_NNNN
  select coalesce(max(
    case when id ~ '^diag_[0-9]+$' 
         then substring(id from 'diag_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.diagnoses;
  perform setval('seq_diagnoses', greatest(max_num, 1));

  -- exam_requests: exam_NNNN
  select coalesce(max(
    case when id ~ '^exam_[0-9]+$' 
         then substring(id from 'exam_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.exam_requests;
  perform setval('seq_exam_requests', greatest(max_num, 1));

  -- procedures: proc_NNNN
  select coalesce(max(
    case when id ~ '^proc_[0-9]+$' 
         then substring(id from 'proc_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.procedures;
  perform setval('seq_procedures', greatest(max_num, 1));

  -- clinical_attachments: att_NNNN
  select coalesce(max(
    case when id ~ '^att_[0-9]+$' 
         then substring(id from 'att_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.clinical_attachments;
  perform setval('seq_clinical_attachments', greatest(max_num, 1));

  -- electronic_signatures: sig_NNNN
  select coalesce(max(
    case when id ~ '^sig_[0-9]+$' 
         then substring(id from 'sig_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.electronic_signatures;
  perform setval('seq_electronic_signatures', greatest(max_num, 1));

  -- aso_exams: aso_NNNN
  select coalesce(max(
    case when id ~ '^aso_[0-9]+$' 
         then substring(id from 'aso_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.aso_exams;
  perform setval('seq_aso_exams', greatest(max_num, 1));

  -- patients: PACNNN
  select coalesce(max(
    case when id ~ '^PAC[0-9]+$' 
         then substring(id from '^PAC([0-9]+)$')::int 
         else 0 end), 0) into max_num 
  from public.patients;
  perform setval('seq_patients', greatest(max_num, 1));

  -- appointments: CLINNN
  select coalesce(max(
    case when id ~ '^CLI[0-9]+$' 
         then substring(id from '^CLI([0-9]+)$')::int 
         else 0 end), 0) into max_num 
  from public.appointments;
  perform setval('seq_appointments', greatest(max_num, 1));

  -- locations: loc_N
  select coalesce(max(
    case when id ~ '^loc_[0-9]+$' 
         then substring(id from 'loc_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.locations;
  perform setval('seq_locations', greatest(max_num, 1));

  -- clinical_rooms: SALANNN
  select coalesce(max(
    case when id ~ '^SALA[0-9]+$' 
         then substring(id from '^SALA([0-9]+)$')::int 
         else 0 end), 0) into max_num 
  from public.clinical_rooms;
  perform setval('seq_clinical_rooms', greatest(max_num, 1));

  -- professionals: PRFNNN
  select coalesce(max(
    case when id ~ '^PRF[0-9]+$' 
         then substring(id from '^PRF([0-9]+)$')::int 
         else 0 end), 0) into max_num 
  from public.professionals;
  perform setval('seq_professionals', greatest(max_num, 1));

  -- professional_roles: role_NN
  select coalesce(max(
    case when id ~ '^role_[0-9]+$' 
         then substring(id from 'role_([0-9]+)')::int 
         else 0 end), 0) into max_num 
  from public.professional_roles;
  perform setval('seq_professional_roles', greatest(max_num, 1));

end$$;

-- Conferir valores atuais
select 
  'seq_prescriptions'         as seq, last_value from seq_prescriptions
  union all select 'seq_anamnese',          last_value from seq_anamnese
  union all select 'seq_soap_notes',        last_value from seq_soap_notes
  union all select 'seq_diagnoses',         last_value from seq_diagnoses
  union all select 'seq_exam_requests',     last_value from seq_exam_requests
  union all select 'seq_procedures',        last_value from seq_procedures
  union all select 'seq_clinical_attachments', last_value from seq_clinical_attachments
  union all select 'seq_electronic_signatures', last_value from seq_electronic_signatures
  union all select 'seq_aso_exams',         last_value from seq_aso_exams
  union all select 'seq_patients',          last_value from seq_patients
  union all select 'seq_appointments',      last_value from seq_appointments
  union all select 'seq_locations',         last_value from seq_locations
  union all select 'seq_clinical_rooms',    last_value from seq_clinical_rooms
  union all select 'seq_professionals',     last_value from seq_professionals
  union all select 'seq_professional_roles', last_value from seq_professional_roles
  order by seq;