-- ════════════════════════════════════════════
-- BLOCO 1: Criar sequences por tabela
-- Rode uma vez. Não altera dados existentes.
-- ════════════════════════════════════════════

-- Módulo 3 - HCE / ClinicalModule
create sequence if not exists seq_prescriptions         start 1;
create sequence if not exists seq_anamnese              start 1;
create sequence if not exists seq_soap_notes            start 1;
create sequence if not exists seq_diagnoses             start 1;
create sequence if not exists seq_exam_requests         start 1;
create sequence if not exists seq_procedures            start 1;
create sequence if not exists seq_clinical_attachments  start 1;
create sequence if not exists seq_electronic_signatures  start 1;
create sequence if not exists seq_aso_exams             start 1;

-- Módulo 1 - Recepção
create sequence if not exists seq_patients              start 1;

-- Módulo 1 - Agenda (CLI...)
create sequence if not exists seq_appointments          start 1;

-- Módulo 2 - Admin/Financeiro (loc_, SALA, PRF)
create sequence if not exists seq_locations             start 1;
create sequence if not exists seq_clinical_rooms        start 1;
create sequence if not exists seq_professionals         start 1;

-- Módulo 1 - Roles
create sequence if not exists seq_professional_roles    start 1;

-- Genérica para qualquer outra tabela com prefixo
create sequence if not exists seq_generic               start 1;