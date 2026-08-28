-- ============================================================
-- Módulo 4 — Importação DICOM (Fase 1)
-- 1) Sequence + prefixo 'study' no next_module_id (estudos DICOM)
-- 2) Bucket público de thumbnails DICOM (dicom-thumbnails)
-- Idempotente — seguro para rodar múltiplas vezes
-- ============================================================

-- ── 1) Sequence p/ IDs de estudos DICOM ──
create sequence if not exists public.seq_dicom_studies start 1 increment 1;

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
    when 'study'      then 'seq_dicom_studies'
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
    -- Agenda (bloqueios / lista de espera / WhatsApp / call center)
    when 'blk'        then 'seq_blocked_slots'
    when 'wl'         then 'seq_waiting_list'
    when 'whats'      then 'seq_whatsapp_reminders'
    when 'call'       then 'seq_call_center_logs'
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

grant execute on function public.next_module_id(text) to authenticated;

-- ── 2) Bucket público de thumbnails DICOM ──

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dicom-thumbnails',
  'dicom-thumbnails',
  true,
  5242880,
  array['image/jpeg','image/png']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública (bucket public = URLs públicas persistentes para thumbnail_url)
drop policy if exists "dicom_thumbnails_select_public" on storage.objects;
create policy "dicom_thumbnails_select_public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'dicom-thumbnails');

-- Inserção por usuário autenticado
drop policy if exists "dicom_thumbnails_insert_authenticated" on storage.objects;
create policy "dicom_thumbnails_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'dicom-thumbnails');

-- Delete
drop policy if exists "dicom_thumbnails_delete_authenticated" on storage.objects;
create policy "dicom_thumbnails_delete_authenticated"
on storage.objects for delete
to authenticated
using (bucket_id = 'dicom-thumbnails');