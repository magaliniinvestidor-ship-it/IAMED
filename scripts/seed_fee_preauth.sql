-- ============================================================
-- Seed: fee_schedules + pre_authorizations
-- Popula as tabelas vazias usando dados REAIS de:
--   insurance_companies (não é modificada) e patients (não é modificada)
-- Executar UMA única vez no Supabase SQL Editor.
-- ============================================================

create sequence if not exists seq_fee_schedules start 1;
create sequence if not exists seq_pre_authorizations start 1;

do $$
declare
  v_fee_count integer;
  v_pre_count integer;
begin
  -- Guarda: só popula se as tabelas estiverem vazias
  select count(*) into v_fee_count from public.fee_schedules;
  select count(*) into v_pre_count from public.pre_authorizations;

  -- ----------------------------------------------------------
  -- 1) fee_schedules: 3 procedimentos por cada convênio REAL ativo
  -- ----------------------------------------------------------
  if v_fee_count = 0 then
    insert into public.fee_schedules (
      id, insurance_type, insurance_name, specialty, procedure_code,
      procedure_name, base_price, repasse_percent, copay_amount, copay_percent,
      coverage_limit, requires_authorization, active, created_at
    )
    select
      'fee_' || lpad(nextval('seq_fee_schedules')::text, 4, '0'),
      ic.type,
      ic.name,
      p.specialty,
      p.procedure_code,
      p.procedure_name,
      p.base_price,
      p.repasse_percent,
      p.copay_amount,
      p.copay_percent,
      ic.coverage_ceiling,
      ic.requires_authorization,
      true,
      now()
    from public.insurance_companies ic
    cross join (
      values
        ('Clínica Geral', '10101012', 'Consulta Médica Geral', 150000, 60, 0, 0),
        ('Cardiologia',   '10101025', 'Consulta Cardiológica',  120000, 55, 6000, 5),
        ('Radiologia',    '30101000', 'Raio-X Tórax (2 incidências)', 180000, 50, 0, 0)
    ) as p(specialty, procedure_code, procedure_name, base_price, repasse_percent, copay_amount, copay_percent)
    where ic.active = true
    order by ic.name;

    raise notice 'fee_schedules: % registros inseridos', (select count(*) from public.fee_schedules);
  else
    raise notice 'fee_schedules já possui dados (% registros) — pulando', v_fee_count;
  end if;

  -- ----------------------------------------------------------
  -- 2) pre_authorizations: autorizações a partir dos pacientes REAIS
  --    vinculadas aos convênios reais que requerem autorização
  -- ----------------------------------------------------------
  if v_pre_count = 0 then
    insert into public.pre_authorizations (
      id, patient_id, patient_name, insurance_id, insurance_name,
      procedure_code, procedure_name, requested_amount, authorized_amount,
      status, authorization_number, request_date, response_date, notes, created_at
    )
    select
      'pre_' || lpad(nextval('seq_pre_authorizations')::text, 4, '0'),
      p.id,
      p.name,
      ic.id,
      ic.name,
      '10101012',
      'Consulta Médica Geral',
      150000,
      case when p.priority = 'alta' then 150000 else 135000 end,
      'autorizada',
      'AUTH-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('seq_pre_authorizations')::text, 4, '0'),
      now() - interval '2 days',
      now() - interval '1 day',
      'Autorizado conforme cobertura do convênio',
      now()
    from public.patients p
    cross join lateral (
      select ic2.id, ic2.name
      from public.insurance_companies ic2
      where ic2.active = true
        and (ic2.requires_authorization = true or ic2.requires_pre_approval = true)
      order by ic2.name
      limit 1
    ) ic
    where p.status <> 'cancelado'
    order by p.id;

    raise notice 'pre_authorizations: % registros inseridos', (select count(*) from public.pre_authorizations);
  else
    raise notice 'pre_authorizations já possui dados (% registros) — pulando', v_pre_count;
  end if;
end $$;