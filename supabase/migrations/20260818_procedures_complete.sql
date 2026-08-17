-- ============================================================
-- HCE - Módulo 3 (Procedimentos): consolidação idempotente
-- Combina as migrações 20260812_procedures_snomed.sql e
-- 20260817_procedures_nomenclature.sql.
--
-- Este arquivo é seguro para rodar em bancos que já tenham as
-- colunas aplicadas — todos os comandos usam IF NOT EXISTS.
--
-- Sem esta migração, o INSERT na tabela public.procedures falha
-- silenciosamente (sem try/catch no front), e o "Verificar
-- autenticidade" retorna 'tampered' porque os procedimentos
-- vinculados ao documento não existem no banco.
-- ============================================================

-- 1) Vínculo SNOMED-CT (procedure) ao procedimento
alter table public.procedures
  add column if not exists snomed_code text,
  add column if not exists snomed_description text;

-- 2) Rastreio do nomenclador usado
alter table public.procedures
  add column if not exists nomenclature_source text,
  add column if not exists financing_entity text;

-- 3) Restrição de valores aceitos no nomenclador
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'procedures_nomenclature_check'
      and conrelid = 'public.procedures'::regclass
  ) then
    alter table public.procedures
      add constraint procedures_nomenclature_check
      check (
        nomenclature_source is null
        or nomenclature_source in ('sigtap', 'cbhpm')
      );
  end if;
end
$$;

-- 4) Índice para faturamento por financiador
create index if not exists idx_procedures_nomenclature
  on public.procedures(nomenclature_source, financing_entity);

-- 5) (Opcional) Garante que a sequência seq_procedures existe,
--    usada pela RPC next_clinical_id('proc').
do $$
begin
  if not exists (select 1 from pg_class where relname = 'seq_procedures') then
    create sequence public.seq_procedures start 1;
  end if;
end
$$;
