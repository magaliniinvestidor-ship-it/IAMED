-- Remove apenas os ASOs de teste (mantém registros reais)
delete from public.aso_exams
where id ~ '^aso_1[0-9]{12}$'  -- IDs com 13 dígitos (formato Date.now legado)
   or patient_name ilike '%test%'
   or patient_name ilike '%explore%'
   or patient_name ilike '%autosubmit%'
   or patient_name ilike '%Demo Session%';

-- Reset sequence para 1 (já estava zerado, mas garante)
-- Se só sobrou o aso_2, a sequence vai para 3 (2+1)
select setval('seq_aso_exams',
  coalesce((select max(
    case when id ~ '^aso_[0-9]+$' 
         then substring(id from 'aso_([0-9]+)')::bigint 
         else 0 end) from public.aso_exams), 0) + 1,
  true);

-- Conferir
select * from public.aso_exams order by id;
select last_value from seq_aso_exams;