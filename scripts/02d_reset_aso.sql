-- Reset seq_aso_exams para 1 (a tabela está vazia de IDs padrão)
select setval('seq_aso_exams', 1, false);

-- Conferir
select 'seq_aso_exams' as seq, last_value, is_called 
from seq_aso_exams;