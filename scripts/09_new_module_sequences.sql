-- ════════════════════════════════════════════
-- BLOCO 9: Criar sequences para módulos novos
-- Rode uma vez. Não altera dados existentes.
-- ════════════════════════════════════════════

-- Módulo 7 - Internação / Centro Cirúrgico
create sequence if not exists seq_surgeries          start 1;
create sequence if not exists seq_hospitalizations   start 1;
create sequence if not exists seq_bed_transfers      start 1;
create sequence if not exists seq_evolutions         start 1;
create sequence if not exists seq_nursing_records    start 1;
create sequence if not exists seq_checklists         start 1;

-- Módulo 8 - Estoque / Farmácia
create sequence if not exists seq_pharma_products    start 1;
create sequence if not exists seq_pharma_lots        start 1;
create sequence if not exists seq_pharma_movements   start 1;
create sequence if not exists seq_adverse_events     start 1;
create sequence if not exists seq_quality_deviations start 1;

-- Módulo 9 - Medicina do Trabalho
create sequence if not exists seq_empresas           start 1;
create sequence if not exists seq_trabalhadores      start 1;
create sequence if not exists seq_exames_ocup        start 1;
create sequence if not exists seq_cal_certs          start 1;
create sequence if not exists seq_relatorios_mtess   start 1;

-- Módulo 10 - Portal do Paciente
create sequence if not exists seq_portal_patients    start 1;
create sequence if not exists seq_teleconsultas      start 1;
create sequence if not exists seq_portal_apps        start 1;
create sequence if not exists seq_payments           start 1;

-- Módulo 5 - Diagnóstico (SADT)
create sequence if not exists seq_diag_reports       start 1;
create sequence if not exists seq_hl7_messages       start 1;
create sequence if not exists seq_diag_measures      start 1;

-- Módulo 12 - CRM / BI
create sequence if not exists seq_campaigns          start 1;
create sequence if not exists seq_leads              start 1;
create sequence if not exists seq_opportunities      start 1;
create sequence if not exists seq_optins             start 1;
create sequence if not exists seq_nps_surveys        start 1;

-- Módulo 14 - AdminFinance (extras que faltavam)
create sequence if not exists seq_dtes               start 1;
create sequence if not exists seq_finance_records    start 1;
create sequence if not exists seq_stock_items        start 1;
create sequence if not exists seq_insurances         start 1;
create sequence if not exists seq_sso_providers      start 1;
create sequence if not exists seq_eligibility        start 1;
create sequence if not exists seq_settlements        start 1;
create sequence if not exists seq_foreign_billing    start 1;
create sequence if not exists seq_batch_billing      start 1;

-- Módulo 3 - ClinicalModule (extra)
create sequence if not exists seq_access_control     start 1;
