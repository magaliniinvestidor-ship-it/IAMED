-- Diagnóstico: IDs fora do padrão em cada tabela
-- Estes IDs serão IGNORADOS pela sincronização.
-- Se houver muitos, considere uma migração de dados separada.

select 'prescriptions' as tabela, count(*) as fora_padrao
from public.prescriptions
where id !~ '^presc_[0-9]+$'
union all select 'anamnese', count(*)
from public.anamnese where id !~ '^anam_[0-9]+$'
union all select 'soap_notes', count(*)
from public.soap_notes where id !~ '^soap_[0-9]+$'
union all select 'diagnoses', count(*)
from public.diagnoses where id !~ '^diag_[0-9]+$'
union all select 'exam_requests', count(*)
from public.exam_requests where id !~ '^exam_[0-9]+$'
union all select 'procedures', count(*)
from public.procedures where id !~ '^proc_[0-9]+$'
union all select 'clinical_attachments', count(*)
from public.clinical_attachments where id !~ '^att_[0-9]+$'
union all select 'electronic_signatures', count(*)
from public.electronic_signatures where id !~ '^sig_[0-9]+$'
union all select 'aso_exams', count(*)
from public.aso_exams where id !~ '^aso_[0-9]+$'
union all select 'patients', count(*)
from public.patients where id !~ '^PAC[0-9]+$'
union all select 'appointments', count(*)
from public.appointments where id !~ '^CLI[0-9]+$'
union all select 'locations', count(*)
from public.locations where id !~ '^loc_[0-9]+$'
union all select 'clinical_rooms', count(*)
from public.clinical_rooms where id !~ '^SALA[0-9]+$'
union all select 'professionals', count(*)
from public.professionals where id !~ '^PRF[0-9]+$'
union all select 'professional_roles', count(*)
from public.professional_roles where id !~ '^role_[0-9]+$'
order by tabela;