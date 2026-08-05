-- ════════════════════════════════════════════════════════════════════
-- BLOCO 12: Tabelas de dominio - Farmacia, CRM, MT, Financeiro, Internacao
-- Schema alinhado com o codigo real (usa item_id, nao pharmacy_item_id).
-- Idempotente. Pode ser executado multiplas vezes sem erro.
-- ════════════════════════════════════════════════════════════════════

-- ─── ESTOQUE / FARMACIA ───
create table if not exists public.pharmacy_items (
  id text primary key,
  name text not null,
  category text,
  form text,
  presentation text,
  manufacturer text,
  dinavisa_registration text,
  requires_prescription boolean default false,
  total_quantity integer default 0,
  min_quantity integer default 10,
  storage_location text,
  unit_cost numeric(15,2) default 0,
  unit_price numeric(15,2) default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.lot_controls (
  id text primary key,
  item_id text references public.pharmacy_items(id) on delete cascade,
  lot_number text not null,
  serial_number text,
  manufacture_date date,
  expiry_date date not null,
  quantity integer not null default 0,
  initial_quantity integer not null default 0,
  cost_per_unit numeric(15,2) default 0,
  dinavisa_registration text,
  dte_entry_number text,
  supplier_name text,
  supplier_ruc text,
  received_date date default current_date,
  status text default 'disponivel',
  created_at timestamptz default now()
);

create table if not exists public.stock_movements (
  id text primary key,
  item_id text references public.pharmacy_items(id),
  item_name text,
  lot_id text references public.lot_controls(id),
  lot_number text,
  movement_type text not null,
  quantity integer not null,
  unit_cost numeric(15,2),
  total_cost numeric(15,2),
  patient_name text,
  procedure_name text,
  sector text,
  room text,
  doctor_name text,
  operator_name text,
  dte_number text,
  supplier_name text,
  notes text,
  date date default current_date,
  created_at timestamptz default now()
);

create table if not exists public.inventory_counts (
  id text primary key,
  item_id text references public.pharmacy_items(id),
  lot_id text references public.lot_controls(id),
  system_quantity integer not null,
  counted_quantity integer not null,
  difference integer generated always as (counted_quantity - system_quantity) stored,
  operator_name text,
  date date default current_date,
  created_at timestamptz default now()
);

create table if not exists public.adverse_events (
  id text primary key,
  item_id text references public.pharmacy_items(id),
  patient_id text,
  patient_name text,
  event_type text not null,
  severity text,
  description text,
  notification_date timestamptz default now(),
  reported_by text,
  status text default 'em_analise',
  created_at timestamptz default now()
);

create table if not exists public.quality_deviations (
  id text primary key,
  item_id text references public.pharmacy_items(id),
  deviation_type text not null,
  description text,
  report_date timestamptz default now(),
  reported_by text,
  corrective_action text,
  status text default 'aberto',
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.batch_recalls (
  id text primary key,
  item_id text references public.pharmacy_items(id),
  lot_id text references public.lot_controls(id),
  recall_reason text,
  alert_date timestamptz default now(),
  status text default 'ativo',
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ─── CRM / BI ───
create table if not exists public.crm_campaigns (
  id text primary key,
  nome text not null,
  tipo text,
  template text,
  segmento_alvo text,
  mensagem text,
  data_disparo timestamptz,
  status text default 'rascunho',
  total_contatos integer default 0,
  total_enviados integer default 0,
  total_falhas integer default 0,
  total_optout integer default 0,
  consentimento_obrigatorio boolean default true,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.crm_leads (
  id text primary key,
  nome text not null,
  email text,
  telefone text,
  origem text,
  data_primeiro_contato timestamptz default now(),
  etapa_funil text default 'novo',
  ultimo_contato timestamptz,
  interesse text,
  observacoes text,
  convertido boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.crm_opportunities (
  id text primary key,
  paciente_nome text not null,
  paciente_telefone text,
  tipo text,
  descricao text,
  valor_estimado numeric(15,2),
  status text default 'aberta',
  probabilidade integer default 50,
  data_criacao timestamptz default now(),
  data_fechamento timestamptz,
  responsavel text,
  created_at timestamptz default now()
);

create table if not exists public.crm_optouts (
  id text primary key,
  paciente_nome text,
  paciente_contato text,
  canal text,
  data_optout timestamptz default now(),
  confirmado boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.crm_nps_surveys (
  id text primary key,
  paciente_nome text,
  data_atendimento date,
  data_resposta date,
  score integer,
  categoria text,
  origem text,
  respondido boolean default false,
  created_at timestamptz default now()
);

-- ─── MEDICINA DO TRABALHO ───
create table if not exists public.mt_empresas (
  id text primary key,
  razao_social text not null,
  cnpj text,
  endereco text,
  cidade text,
  setor text,
  numero_funcionarios integer,
  representante text,
  email text,
  telefone text,
  ativa boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.mt_trabalhadores (
  id text primary key,
  empresa_id text references public.mt_empresas(id) on delete cascade,
  nome text not null,
  ci text,
  data_nascimento date,
  genero text,
  funcao text,
  data_admissao date,
  telefone text,
  email text,
  status text default 'ativo',
  created_at timestamptz default now()
);

create table if not exists public.mt_exames_ocupacionais (
  id text primary key,
  trabalhador_id text references public.mt_trabalhadores(id) on delete cascade,
  tipo text,
  data date,
  medico_responsavel text,
  resultado text,
  apto boolean default true,
  restricoes text,
  created_at timestamptz default now()
);

create table if not exists public.mt_cal_certs (
  id text primary key,
  trabalhador_id text references public.mt_trabalhadores(id),
  empresa_id text references public.mt_empresas(id),
  numero_cal text,
  data_emissao date,
  data_validade date,
  medico text,
  apto boolean default true,
  status text default 'ativo',
  created_at timestamptz default now()
);

-- ─── FINANCEIRO / FATURAMENTO ───
create table if not exists public.dtes (
  id text primary key,
  cdc text unique,
  type text not null,
  number text,
  timbrado text,
  establishment text,
  expedition_point text,
  patient_name text,
  patient_email text,
  patient_phone text,
  ruc text,
  date date default current_date,
  amount numeric(15,2),
  iva_5 numeric(15,2),
  iva_10 numeric(15,2),
  environment text default 'homologacao',
  status text default 'Gerado',
  payment_gateway text,
  payment_status text default 'pendente',
  xml_content text,
  rejection_reason text,
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.financial_postings (
  id text primary key,
  description text,
  type text not null,
  amount numeric(15,2) not null,
  category text,
  date date default current_date,
  patient_id text,
  created_at timestamptz default now()
);

create table if not exists public.stock_items (
  id text primary key,
  name text not null,
  category text,
  quantity numeric default 0,
  min_quantity numeric default 0,
  unit text,
  created_at timestamptz default now()
);

create table if not exists public.insurances (
  id text primary key,
  name text not null,
  type text,
  ruc text,
  contact text,
  phone text,
  email text,
  has_webservice boolean default false,
  webservice_url text,
  requires_authorization boolean default false,
  requires_pre_approval boolean default false,
  copay_rules text,
  coverage_ceiling numeric(15,2),
  active boolean default true,
  created_at timestamptz default now()
);

-- ─── INTERNACAO ───
create table if not exists public.surgeries (
  id text primary key,
  patient_id text,
  patient_name text,
  surgeon text,
  anesthesia_type text,
  scheduled_date timestamptz,
  status text default 'agendada',
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.hospitalizations (
  id text primary key,
  patient_id text,
  patient_name text,
  bed_id text,
  admission_date timestamptz default now(),
  discharge_date timestamptz,
  diagnosis text,
  status text default 'internado',
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.beds (
  id text primary key,
  name text not null,
  wing text,
  status text default 'disponivel',
  patient_name text,
  entry_date date,
  created_at timestamptz default now()
);

-- ─── INDICES para performance ───
create index if not exists idx_patients_status on public.patients(status);
create index if not exists idx_appointments_date on public.appointments(date);
create index if not exists idx_pharmacy_items_active on public.pharmacy_items(active);
create index if not exists idx_lot_controls_item_id on public.lot_controls(item_id);
create index if not exists idx_lot_controls_expiry on public.lot_controls(expiry_date);
create index if not exists idx_stock_movements_item_id on public.stock_movements(item_id);
create index if not exists idx_dtes_status on public.dtes(status);
create index if not exists idx_dtes_date on public.dtes(date);

-- ─── RLS (Row Level Security) - Permitir leitura para usuarios autenticados ───
alter table public.pharmacy_items enable row level security;
alter table public.lot_controls enable row level security;
alter table public.stock_movements enable row level security;
alter table public.dtes enable row level security;
alter table public.crm_campaigns enable row level security;
alter table public.crm_leads enable row level security;
alter table public.mt_empresas enable row level security;
alter table public.mt_trabalhadores enable row level security;
alter table public.surgeries enable row level security;
alter table public.hospitalizations enable row level security;
alter table public.beds enable row level security;

drop policy if exists "auth_all_pharmacy_items" on public.pharmacy_items;
create policy "auth_all_pharmacy_items" on public.pharmacy_items for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_lot_controls" on public.lot_controls;
create policy "auth_all_lot_controls" on public.lot_controls for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_stock_movements" on public.stock_movements;
create policy "auth_all_stock_movements" on public.stock_movements for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_dtes" on public.dtes;
create policy "auth_all_dtes" on public.dtes for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_crm_campaigns" on public.crm_campaigns;
create policy "auth_all_crm_campaigns" on public.crm_campaigns for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_crm_leads" on public.crm_leads;
create policy "auth_all_crm_leads" on public.crm_leads for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_mt_empresas" on public.mt_empresas;
create policy "auth_all_mt_empresas" on public.mt_empresas for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_mt_trabalhadores" on public.mt_trabalhadores;
create policy "auth_all_mt_trabalhadores" on public.mt_trabalhadores for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_surgeries" on public.surgeries;
create policy "auth_all_surgeries" on public.surgeries for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_hospitalizations" on public.hospitalizations;
create policy "auth_all_hospitalizations" on public.hospitalizations for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_beds" on public.beds;
create policy "auth_all_beds" on public.beds for all to authenticated using (true) with check (true);
