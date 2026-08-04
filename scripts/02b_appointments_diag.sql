-- Diagnóstico appointments: ver quais IDs fogem do padrão CLINNN
select id, created_at, status
from public.appointments
where id !~ '^CLI[0-9]+$'
order by created_at desc
limit 50;