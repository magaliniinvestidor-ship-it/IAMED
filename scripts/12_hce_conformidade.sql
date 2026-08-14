-- ============================================================
-- CONFORMIDADE HCE - MÓDULO 3 (rodar 1x no SQL Editor)
-- Assinatura, Receituário, Timeline, Confidencialidade
-- Idempotente: pode rodar várias vezes sem erro.
-- ============================================================

-- ─── SEQUENCES ───
create sequence if not exists public.seq_drug_interactions    start 1;
create sequence if not exists public.seq_patient_care_team    start 1;

-- ─── 1) SEGURANÇA MEDICAMENTOSA ───
create table if not exists public.drug_interactions (
  id text primary key,
  drug_a text not null,
  drug_b text not null,
  drug_a_ingredient text,
  drug_b_ingredient text,
  severity text not null default 'moderada'
    check (severity in ('leve', 'moderada', 'grave', 'contraindicado')),
  description text,
  recommendation text,
  source text default 'local'
    check (source in ('local', 'dinavisa', 'anvisa', 'fda', 'infarmed')),
  created_at timestamptz not null default now()
);

-- tabela pré-existente: garante as colunas novas
alter table public.drug_interactions add column if not exists drug_a_ingredient text;
alter table public.drug_interactions add column if not exists drug_b_ingredient text;
alter table public.drug_interactions add column if not exists source text default 'local';

create index if not exists idx_drug_interactions_a on public.drug_interactions(drug_a_ingredient);
create index if not exists idx_drug_interactions_b on public.drug_interactions(drug_b_ingredient);

-- colunas de segurança no drug_catalog
alter table public.drug_catalog add column if not exists common_dose_pediatric text default '';
alter table public.drug_catalog add column if not exists min_age_months int default 0;
alter table public.drug_catalog add column if not exists max_age_months int;
alter table public.drug_catalog add column if not exists pregnant_category text default '';
alter table public.drug_catalog add column if not exists breastfeeding_safe boolean default true;
alter table public.drug_catalog add column if not exists contraindications text[] default '{}';
alter table public.drug_catalog add column if not exists side_effects text[] default '{}';

-- RLS
alter table public.drug_interactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'drug_interactions' and policyname = 'drug_interactions_select_auth'
  ) then
    create policy drug_interactions_select_auth
      on public.drug_interactions for select to authenticated using (true);
  end if;
end $$;

-- ─── 2) EQUIPE ASSISTENCIAL (Confidencialidade) ───
create table if not exists public.patient_care_team (
  id text primary key,
  patient_id text not null,
  professional_name text not null,
  professional_id text,
  role text not null default 'assistencial',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patient_care_team_patient
  on public.patient_care_team(patient_id);
create index if not exists idx_patient_care_team_professional
  on public.patient_care_team(professional_name);

alter table public.patient_care_team enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'patient_care_team' and policyname = 'care_team_select_auth'
  ) then
    create policy care_team_select_auth on public.patient_care_team for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'patient_care_team' and policyname = 'care_team_insert_auth'
  ) then
    create policy care_team_insert_auth on public.patient_care_team for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'patient_care_team' and policyname = 'care_team_update_auth'
  ) then
    create policy care_team_update_auth on public.patient_care_team for update to authenticated using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'patient_care_team' and policyname = 'care_team_delete_auth'
  ) then
    create policy care_team_delete_auth on public.patient_care_team for delete to authenticated using (true);
  end if;
end $$;

-- ─── 3) RPC next_clinical_id (aceita int, ct e demais prefixos) ───
create or replace function public.next_clinical_id(p_prefix text)
returns text
language plpgsql
as $$
declare
  v_seq text;
  v_num int;
begin
  v_seq := case p_prefix
    when 'presc' then 'seq_prescriptions'
    when 'pitem' then 'seq_prescription_items'
    when 'anam'  then 'seq_anamnese'
    when 'soap'  then 'seq_soap_notes'
    when 'diag'  then 'seq_diagnoses'
    when 'exam'  then 'seq_exam_requests'
    when 'proc'  then 'seq_procedures'
    when 'att'   then 'seq_clinical_attachments'
    when 'sig'   then 'seq_electronic_signatures'
    when 'aso'   then 'seq_aso_exams'
    when 'ac'    then 'seq_access_control'
    when 'pexam' then 'seq_physical_exams'
    when 'int'   then 'seq_drug_interactions'
    when 'ct'    then 'seq_patient_care_team'
    else null
  end;
  if v_seq is null then
    raise exception 'Prefixo desconhecido: %', p_prefix;
  end if;
  v_num := nextval(v_seq);
  return p_prefix || '_' || lpad(v_num::text, 4, '0');
end$$;

grant execute on function public.next_clinical_id(text) to authenticated;

-- ─── TESTE (pode ignorar) ───
select public.next_clinical_id('int') as test_int,
       public.next_clinical_id('ct')  as test_ct;
