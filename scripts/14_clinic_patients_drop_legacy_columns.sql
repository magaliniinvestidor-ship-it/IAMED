-- ════════════════════════════════════════════════════════════════════
-- BLOCO 14: Limpeza de colunas legadas em clinic_patients
--
-- Remove as colunas "address" e "city" que eram usadas pelo formulario
-- antigo antes do endereco ter sido quebrado em 6 colunas granulares:
--   address_department, address_district, address_city,
--   address_neighborhood, address_street, address_number
--
-- O sistema atual (AgendaModule.tsx) nunca envia valores para "address"
-- e "city", entao elas sempre ficam NULL e nao tem funcionalidade.
-- ════════════════════════════════════════════════════════════════════

alter table public.clinic_patients drop column if exists address;
alter table public.clinic_patients drop column if exists city;