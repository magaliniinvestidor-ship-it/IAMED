-- ════════════════════════════════════════════════════════════════════
-- BLOCO 17: Adiciona coluna insurance_number em appointments
--
-- A tabela appointments não possuía a coluna insurance_number,
-- mas o formulário Novo/Editar Agendamento da Agenda a preenche
-- (número da carteirinha do convênio). Sem esta coluna, o INSERT
-- falha no Supabase com "Could not find the 'insurance_number'
-- column of 'appointments' in the schema cache".
--
-- Colunas relacionadas já existentes: insurance_type, insurance.
-- ════════════════════════════════════════════════════════════════════

alter table public.appointments
  add column insurance_number text;