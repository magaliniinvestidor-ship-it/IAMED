-- ============================================================================
-- IAMED - Migração Completa do Banco de Dados Supabase
-- Execute no Supabase SQL Editor (pode rodar múltiplas vezes - IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 2. TABELAS EXISTENTES - ADIÇÃO DE COLUNAS
-- ============================================================================

-- 2.1 professionals - Vinculo com usuário Auth e Sede
alter table public.professionals 
add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.professionals 
add column if not exists location_id uuid references public.locations(id) on delete set null;

-- Índices
create index if not exists idx_professionals_user_id on public.professionals(user_id);
create index if not exists idx_professionals_location_id on public.professionals(location_id);

-- 2.2 system_users (ou profiles) - Vinculo reverso com profissional
alter table public.system_users 
add column if not exists professional_id uuid references public.professionals(id) on delete set null;

create index if not exists idx_system_users_professional_id on public.system_users(professional_id);

-- 2.3 profiles - Adicionar permissions se não existir
alter table public.profiles 
add column if not exists permissions jsonb default '[]'::jsonb;

-- ============================================================================
-- 3. NOVAS TABELAS - AGENDA MODULE (COM TIPOS CORRETOS DESDE O INÍCIO)
-- ============================================================================

-- 3.1 Bloqueios de Agenda
create table if not exists public.blocked_slots (
  id text primary key,
  doctor_name text,
  branch text,
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  reason text check (reason in ('feriado', 'férias', 'capacitação', 'emergência')),
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3.2 Lembretes WhatsApp
create table if not exists public.whatsapp_reminders (
  id text primary key,
  appointment_id text,
  patient_id text,
  patient_name text,
  patient_phone text,
  message_template text,
  language text check (language in ('es', 'gn', 'pt')),
  status text check (status in ('scheduled', 'sent', 'delivered', 'read', 'confirmed', 'cancelled', 'rescheduled')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  response_received text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3.3 Lista de Espera
create table if not exists public.waitlist_entries (
  id text primary key,
  patient_id text,
  patient_name text,
  phone text,
  specialty text,
  doctor_name text,
  priority_criteria text check (priority_criteria in ('arrival', 'urgency', 'coverage', 'seniority')),
  priority_score numeric,
  preferred_days text[],
  preferred_hours text[],
  status text check (status in ('aguardando', 'notificado', 'alocado', 'cancelado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3.4 Logs de Ligação (Call Center)
create table if not exists public.call_logs (
  id text primary key,
  operator_name text,
  patient_id text,
  patient_name text,
  patient_phone text,
  type text check (type in ('inbound', 'outbound')),
  reason text check (reason in ('agendamento', 'cancelamento', 'remarcação', 'dúvida', 'reclamação', 'financeiro', 'outros')),
  notes text,
  duration_seconds integer default 0,
  recording_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ============================================================================
-- 4. FIXAR TIPOS DE COLUNAS EXISTENTES (RODAR DEPOIS DAS TABELAS CRIADAS)
-- ============================================================================

-- Fix blocked_slots.created_by: garantir que é uuid
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'blocked_slots' and column_name = 'created_by' and data_type <> 'uuid'
  ) then
    update public.blocked_slots 
    set created_by = null 
    where created_by is not null 
    and created_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    alter table public.blocked_slots 
    alter column created_by type uuid using created_by::uuid;
  elsif not exists (
    select 1 from information_schema.columns 
    where table_name = 'blocked_slots' and column_name = 'created_by'
  ) then
    alter table public.blocked_slots 
    add column created_by uuid references auth.users(id);
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'blocked_slots' and column_name = 'updated_at'
  ) then
    alter table public.blocked_slots 
    add column updated_at timestamptz default now();
  end if;
end $$;

-- Fix call_logs.created_by
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'call_logs' and column_name = 'created_by'
  ) then
    alter table public.call_logs 
    add column created_by uuid references auth.users(id);
  end if;
end $$;

-- Fix updated_at nas outras tabelas
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'whatsapp_reminders' and column_name = 'updated_at'
  ) then
    alter table public.whatsapp_reminders 
    add column updated_at timestamptz default now();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'waitlist_entries' and column_name = 'updated_at'
  ) then
    alter table public.waitlist_entries 
    add column updated_at timestamptz default now();
  end if;
end $$;

-- ============================================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================================================
create index if not exists idx_blocked_slots_date on public.blocked_slots(start_date);
create index if not exists idx_blocked_slots_doctor on public.blocked_slots(doctor_name);
create index if not exists idx_whatsapp_scheduled on public.whatsapp_reminders(scheduled_for);
create index if not exists idx_whatsapp_status on public.whatsapp_reminders(status);
create index if not exists idx_waitlist_status on public.waitlist_entries(status);
create index if not exists idx_waitlist_priority on public.waitlist_entries(priority_score desc);
create index if not exists idx_call_logs_created on public.call_logs(created_at);
create index if not exists idx_call_logs_operator on public.call_logs(operator_name);

-- ============================================================================
-- 4. TRIGGER PARA PROFILES (Auto-criar perfil ao registrar no Auth)
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role, permissions)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'Usuário'),
    '[]'::jsonb
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - HABILITAR E POLICIES
-- ============================================================================

-- Habilitar RLS nas tabelas novas
alter table public.blocked_slots enable row level security;
alter table public.whatsapp_reminders enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.call_logs enable row level security;

-- ============================================================================
-- 5.1 POLICIES PARA blocked_slots
-- ============================================================================
create policy "Doctors view own blocks" on public.blocked_slots
  for select using (
    auth.uid() = created_by::uuid 
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('Administrador', 'SuperAdmin', 'Gestor')
    )
  );

create policy "Doctors manage own blocks" on public.blocked_slots
  for insert with check (auth.uid() = created_by::uuid);

create policy "Doctors update own blocks" on public.blocked_slots
  for update using (auth.uid() = created_by::uuid);

create policy "Doctors delete own blocks" on public.blocked_slots
  for delete using (auth.uid() = created_by::uuid);

-- Admins gerenciam todos
create policy "Admins manage all blocks" on public.blocked_slots
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('Administrador', 'SuperAdmin', 'Gestor')
    )
  );

-- ============================================================================
-- 5.2 POLICIES PARA whatsapp_reminders
-- ============================================================================
create policy "Users view reminders" on public.whatsapp_reminders
  for select using (true);

create policy "Operators insert reminders" on public.whatsapp_reminders
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid())
  );

create policy "Operators update reminders" on public.whatsapp_reminders
  for update using (
    exists (select 1 from public.profiles where id = auth.uid())
  );

-- ============================================================================
-- 5.3 POLICIES PARA waitlist_entries
-- ============================================================================
create policy "Users view waitlist" on public.waitlist_entries
  for select using (true);

create policy "Receptionists manage waitlist" on public.waitlist_entries
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('Administrador', 'SuperAdmin', 'Gestor', 'Recepcionista')
    )
  );

-- ============================================================================
-- 5.4 POLICIES PARA call_logs
-- ============================================================================
create policy "Operators view own calls" on public.call_logs
  for select using (
    created_by::uuid = auth.uid()
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('Administrador', 'SuperAdmin', 'Gestor')
    )
  );

create policy "Operators insert own calls" on public.call_logs
  for insert with check (created_by::uuid = auth.uid());

-- ============================================================================
-- 5.5 POLICIES PARA professionals (existente - reforçar)
-- ============================================================================
drop policy if exists "Professionals view own" on public.professionals;
create policy "Professionals view own" on public.professionals
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('Administrador', 'SuperAdmin', 'Gestor', 'Diretor Clínico')
    )
  );

drop policy if exists "Admins manage professionals" on public.professionals;
create policy "Admins manage professionals" on public.professionals
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('Administrador', 'SuperAdmin', 'Gestor')
    )
  );

-- ============================================================================
-- 5.6 POLICIES PARA profiles (existente - reforçar)
-- ============================================================================
drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "Admins view all profiles" on public.profiles;
create policy "Admins view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('Administrador', 'SuperAdmin', 'Gestor')
    )
  );

-- ============================================================================
-- 6. TABELAS EXISTENTES - GARANTIR RLS HABILITADO
-- ============================================================================
alter table if exists public.professionals enable row level security;
alter table if exists public.system_users enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.locations enable row level security;
alter table if exists public.clinical_rooms enable row level security;

-- ============================================================================
-- 7. FUNÇÕES AUXILIARES PARA TRIGGERS DE UPDATED_AT
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists set_updated_at_blocked_slots on public.blocked_slots;
create trigger set_updated_at_blocked_slots
  before update on public.blocked_slots
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_whatsapp on public.whatsapp_reminders;
create trigger set_updated_at_whatsapp
  before update on public.whatsapp_reminders
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_waitlist on public.waitlist_entries;
create trigger set_updated_at_waitlist
  before update on public.waitlist_entries
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 8. VIEWS ÚTEIS PARA DASHBOARDS
-- ============================================================================

create or replace view public.v_blocked_slots_upcoming as
select 
  bs.*,
  case 
    when bs.start_date > current_date then 'futuro'
    when bs.end_date < current_date then 'passado'
    else 'atual'
  end as status_temporal
from public.blocked_slots bs
where bs.end_date >= current_date - interval '30 days'
order by bs.start_date;

create or replace view public.v_whatsapp_pending as
select * from public.whatsapp_reminders
where status = 'scheduled' and scheduled_for > now()
order by scheduled_for;

create or replace view public.v_waitlist_active as
select * from public.waitlist_entries
where status in ('aguardando', 'notificado')
order by priority_score desc, created_at;

create or replace view public.v_calls_today as
select * from public.call_logs
where created_at::date = current_date
order by created_at desc;

-- ============================================================================
-- 9. DADOS INICIAIS (SEED) - OPCIONAL
-- ============================================================================

insert into public.locations (id, name, address, city, phone, status)
values (
  gen_random_uuid(),
  'Sede Central',
  'Av. Principal 1234',
  'Asunción',
  '+595 21 123456',
  'ativo'
)
on conflict do nothing;

-- ============================================================================
-- 10. VERIFICAÇÃO FINAL
-- ============================================================================
-- Execute para confirmar estrutura:
-- \d public.blocked_slots
-- \d public.whatsapp_reminders
-- \d public.waitlist_entries
-- \d public.call_logs
-- \d public.professionals
-- \d public.profiles
-- \dp public.blocked_slots  -- ver policies
-- \dp public.professionals
-- \dp public.profiles