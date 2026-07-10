-- ============================================================
-- FIX: Remover política RLS recursiva na tabela profiles
-- A política "Admins view all profiles" causava infinite recursion
-- porque fazia SELECT na mesma tabela que está sendo avaliada
-- ============================================================

DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
