-- ============================================================
-- HCE - Catálogo unificado de procedimentos
-- Substitui os arrays hardcoded em lib/procedures/catalog.ts
-- por uma tabela no Supabase que consolida SIGTAP (BR/SUS),
-- TUSS-CBHPM (BR/privado), SNS (PT) e IPS (PY).
--
-- Cada catálogo oficial traz uma fração dos códigos; aceitar
-- códigos fora deste catálogo continua sendo permitido
-- ("catálogo aberto") — esta tabela é fonte de autocomplete.
-- ============================================================

create table if not exists public.procedure_catalog (
  id text primary key,
  code text not null,
  name text not null,
  nomenclature text not null
    check (nomenclature in ('sigtap','cbhpm','sns','ips')),
  category text,
  country text
    check (country in ('BR','PY','PT')),
  financing_entity text,
  is_active boolean not null default true,
  source text,
  source_updated_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nomenclature, code)
);

create index if not exists idx_procedure_catalog_nomenclature
  on public.procedure_catalog(nomenclature, is_active);

-- Índice de busca textual em "name" — opcional, requer pg_trgm.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    if not exists (
      select 1 from pg_indexes
      where schemaname = 'public' and indexname = 'idx_procedure_catalog_name_trgm'
    ) then
      execute 'create index idx_procedure_catalog_name_trgm
        on public.procedure_catalog using gin (name gin_trgm_ops)';
    end if;
  end if;
end
$$;

-- Habilita RLS e libera leitura para usuários autenticados.
alter table public.procedure_catalog enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'procedure_catalog'
      and policyname = 'proc_catalog_select_authenticated'
  ) then
    create policy proc_catalog_select_authenticated
      on public.procedure_catalog
      for select
      to authenticated
      using (true);
  end if;
end
$$;
