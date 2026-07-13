-- ============================================================================
-- CORREÇÃO COMPLETA: IDs e RLS para todas as tabelas do iamed
-- Execute no Supabase SQL Editor (pode rodar múltiplas vezes - seguro)
-- ============================================================================

-- ============================================================================
-- 1. PROFESSIONALS: id UUID → TEXT
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'professionals' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS professionals_pkey;
    ALTER TABLE public.professionals ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.professionals ADD PRIMARY KEY (id);
  END IF;
END $$;

-- location_id em professionals: garantir TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'professionals' AND column_name = 'location_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS professionals_location_id_fkey;
    ALTER TABLE public.professionals ALTER COLUMN location_id TYPE TEXT;
  END IF;
END $$;

-- Recriar FK location_id → locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professionals_location_id_fkey'
  ) THEN
    ALTER TABLE public.professionals
      ADD CONSTRAINT professionals_location_id_fkey
      FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Recriar FK system_users → professionals
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'professional_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_users_professional_id_fkey'
  ) THEN
    ALTER TABLE public.system_users
      ADD CONSTRAINT system_users_professional_id_fkey
      FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 2. LOCATIONS: garantir id TEXT
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_pkey;
    ALTER TABLE public.locations ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.locations ADD PRIMARY KEY (id);
  END IF;
END $$;

-- ============================================================================
-- 3. CLINICAL_ROOMS: garantir id TEXT e location_id TEXT
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinical_rooms' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.clinical_rooms DROP CONSTRAINT IF EXISTS clinical_rooms_pkey;
    ALTER TABLE public.clinical_rooms ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.clinical_rooms ADD PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinical_rooms' AND column_name = 'location_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.clinical_rooms DROP CONSTRAINT IF EXISTS clinical_rooms_location_id_fkey;
    ALTER TABLE public.clinical_rooms ALTER COLUMN location_id TYPE TEXT;
    ALTER TABLE public.clinical_rooms
      ADD CONSTRAINT clinical_rooms_location_id_fkey
      FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 4. PROFESSIONAL_ROLES: garantir id TEXT
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'professional_roles' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.professional_roles DROP CONSTRAINT IF EXISTS professional_roles_pkey;
    ALTER TABLE public.professional_roles ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.professional_roles ADD PRIMARY KEY (id);
  END IF;
END $$;

-- ============================================================================
-- 5. SYSTEM_USERS: garantir id TEXT
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.system_users DROP CONSTRAINT IF EXISTS system_users_pkey;
    ALTER TABLE public.system_users ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.system_users ADD PRIMARY KEY (id);
  END IF;
END $$;

-- professional_id em system_users: garantir TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'professional_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.system_users DROP CONSTRAINT IF EXISTS system_users_professional_id_fkey;
    ALTER TABLE public.system_users ALTER COLUMN professional_id TYPE TEXT;
  END IF;
END $$;

-- ============================================================================
-- 6. PATIENTS: garantir id TEXT
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    -- Criar backup antes de alterar
    CREATE TABLE IF NOT EXISTS patients_backup AS SELECT * FROM patients;

    ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_pkey;
    ALTER TABLE public.patients ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.patients ADD PRIMARY KEY (id);
  END IF;
END $$;

-- ============================================================================
-- 7. RLS: Garantir política permissiva para dev em todas as tabelas
-- ============================================================================
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY['professionals', 'locations', 'clinical_rooms', 'professional_roles', 'system_users', 'patients'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public access for dev" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Public access for dev" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;
