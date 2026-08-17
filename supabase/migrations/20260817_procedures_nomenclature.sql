-- ============================================================
-- NOMENCLATURA DE PROCEDIMENTOS (HCE - Módulo 3)
-- Adiciona o rastreio do nomenclador usado no procedimento:
--   - nomenclature_source: 'sigtap' (SUS) | 'cbhpm' (privado)
--   - financing_entity: nome da entidade financiadora quando o
--     código vem da tabela do convênio (fee_schedules).
-- ============================================================

alter table public.procedures
  add column if not exists nomenclature_source text,
  add column if not exists financing_entity text;

-- Valores de nomenclador aceitos
alter table public.procedures
  add constraint procedures_nomenclature_check
  check (
    nomenclature_source is null
    or nomenclature_source in ('sigtap', 'cbhpm')
  );

-- Index para faturamento por financiador
create index if not exists idx_procedures_nomenclature
  on public.procedures(nomenclature_source, financing_entity);
