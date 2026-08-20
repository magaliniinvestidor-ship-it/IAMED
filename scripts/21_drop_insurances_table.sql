-- Remover tabela duplicada public.insurances (legado, nunca usada)
-- A tabela real de convenios e public.insurance_companies
-- NOTA: NÃO remover a sequence seq_insurances (usada por next_module_id('ins') -> insurance_companies)

DROP TABLE IF EXISTS public.insurances;