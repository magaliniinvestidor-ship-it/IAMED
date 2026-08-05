-- ════════════════════════════════════════════
-- BLOCO 10: RPC genérica para módulos novos
-- Cobre todos os prefixos das sequences criadas em 09.
-- O front chama: supabase.rpc('next_module_id', { p_prefix: 'surg' })
-- ════════════════════════════════════════════

create or replace function public.next_module_id(p_prefix text)
returns text
language plpgsql
as $$
declare
  v_seq text;
  v_num int;
begin
  v_seq := case p_prefix
    -- Internação / Centro Cirúrgico
    when 'surg'       then 'seq_surgeries'
    when 'hosp'       then 'seq_hospitalizations'
    when 'bt'         then 'seq_bed_transfers'
    when 'evol'       then 'seq_evolutions'
    when 'nurs'       then 'seq_nursing_records'
    when 'check'      then 'seq_checklists'
    -- Estoque / Farmácia
    when 'pharm'      then 'seq_pharma_products'
    when 'lot'        then 'seq_pharma_lots'
    when 'mov'        then 'seq_pharma_movements'
    when 'ae'         then 'seq_adverse_events'
    when 'qd'         then 'seq_quality_deviations'
    -- Medicina do Trabalho
    when 'emp'        then 'seq_empresas'
    when 'trab'       then 'seq_trabalhadores'
    when 'ex'         then 'seq_exames_ocup'
    when 'cal'        then 'seq_cal_certs'
    when 'rel'        then 'seq_relatorios_mtess'
    when 'aso'        then 'seq_aso_ocupacionais'
    -- Portal do Paciente
    when 'pat_portal' then 'seq_portal_patients'
    when 'tel'        then 'seq_teleconsultas'
    when 'app_portal' then 'seq_portal_apps'
    when 'pay'        then 'seq_payments'
    -- Diagnóstico (SADT)
    when 'rep'        then 'seq_diag_reports'
    when 'hl7'        then 'seq_hl7_messages'
    when 'm'          then 'seq_diag_measures'
    when 'sig'        then 'seq_diag_signatures'
    -- CRM / BI
    when 'camp'       then 'seq_campaigns'
    when 'lead'       then 'seq_leads'
    when 'opp'        then 'seq_opportunities'
    when 'opt'        then 'seq_optins'
    when 'nps'        then 'seq_nps_surveys'
    -- AdminFinance (extras)
    when 'dte'        then 'seq_dtes'
    when 'fin_dte'    then 'seq_dtes'
    when 'fin'        then 'seq_finance_records'
    when 'stk'        then 'seq_stock_items'
    when 'ins'        then 'seq_insurances'
    when 'sso'        then 'seq_sso_providers'
    when 'elig'       then 'seq_eligibility'
    when 'sett'       then 'seq_settlements'
    when 'frn'        then 'seq_foreign_billing'
    when 'batch'      then 'seq_batch_billing'
    -- Agenda (bloqueios)
    when 'blk'        then 'seq_blocked_slots'
    -- ClinicalModule (extra)
    when 'ac'         then 'seq_access_control'
    else null
  end;

  if v_seq is null then
    raise exception 'Prefixo desconhecido para next_module_id: %', p_prefix;
  end if;

  v_num := nextval(v_seq);
  return p_prefix || '_' || lpad(v_num::text, 4, '0');
end$$;

-- ════════════════════════════════════════════
-- Permissões
-- ════════════════════════════════════════════
grant execute on function public.next_module_id(text) to authenticated;

-- ════════════════════════════════════════════
-- Teste (rode para validar)
-- ════════════════════════════════════════════
select public.next_module_id('surg')       as test_surg,
       public.next_module_id('hosp')       as test_hosp,
       public.next_module_id('pharm')      as test_pharm,
       public.next_module_id('emp')        as test_emp,
       public.next_module_id('trab')       as test_trab,
       public.next_module_id('rep')        as test_rep,
       public.next_module_id('camp')       as test_camp,
       public.next_module_id('dte')        as test_dte,
       public.next_module_id('ac')         as test_ac;
