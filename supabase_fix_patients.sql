-- ============================================================
-- FIX: Garantir que tabela patients tenha schema correto
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Verificar tipo da coluna id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    -- Se id é UUID, precisamos converter para TEXT
    -- Criar tabela temporária com schema correto
    CREATE TABLE IF NOT EXISTS patients_backup AS SELECT * FROM patients;
    
    DROP TABLE IF EXISTS patients CASCADE;
    
    CREATE TABLE patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      birthdate TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'aguardando',
      clinical_history JSONB DEFAULT '[]',
      document_type TEXT DEFAULT 'CI',
      document_number TEXT DEFAULT '',
      place_of_birth TEXT DEFAULT '',
      civil_status TEXT DEFAULT 'Solteiro(a)',
      nationality TEXT DEFAULT 'Paraguaia',
      address_department TEXT DEFAULT '',
      address_district TEXT DEFAULT '',
      address_city TEXT DEFAULT '',
      address_neighborhood TEXT DEFAULT '',
      address_street TEXT DEFAULT '',
      address_number TEXT DEFAULT '',
      whatsapp_verified BOOLEAN DEFAULT FALSE,
      blood_type TEXT DEFAULT '',
      allergies TEXT DEFAULT '',
      health_insurance_type TEXT DEFAULT 'Particular',
      health_insurance_number TEXT DEFAULT '',
      health_insurance_company TEXT DEFAULT '',
      employer TEXT DEFAULT '',
      guardian_name TEXT DEFAULT '',
      guardian_document_type TEXT DEFAULT '',
      guardian_document TEXT DEFAULT '',
      guardian_relationship TEXT DEFAULT '',
      photo_url TEXT DEFAULT '',
      preferred_language TEXT DEFAULT 'es',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Restaurar dados se existirem
    INSERT INTO patients (id, name, email, phone, birthdate, gender, priority, status,
      document_type, document_number, place_of_birth, civil_status, nationality,
      address_department, address_district, address_city, address_neighborhood,
      address_street, address_number, whatsapp_verified, blood_type, allergies,
      health_insurance_type, health_insurance_number, created_at)
    SELECT 
      id::TEXT, name, COALESCE(email, ''), COALESCE(phone, ''), COALESCE(birthdate, ''),
      COALESCE(gender, ''), COALESCE(priority, 'normal'), COALESCE(status, 'aguardando'),
      COALESCE(document_type, 'CI'), COALESCE(document_number, ''), COALESCE(place_of_birth, ''),
      COALESCE(civil_status, 'Solteiro(a)'), COALESCE(nationality, 'Paraguaia'),
      COALESCE(address_department, ''), COALESCE(address_district, ''), COALESCE(address_city, ''),
      COALESCE(address_neighborhood, ''), COALESCE(address_street, ''), COALESCE(address_number, ''),
      COALESCE(whatsapp_verified, FALSE), COALESCE(blood_type, ''), COALESCE(allergies, ''),
      COALESCE(health_insurance_type, 'Particular'), COALESCE(health_insurance_number, ''),
      COALESCE(created_at, NOW())
    FROM patients_backup;
    
    DROP TABLE IF EXISTS patients_backup;
    
    RAISE NOTICE 'Tabela patients convertida de UUID para TEXT com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela patients já usa TEXT para id, nenhuma conversão necessária.';
  END IF;
END $$;

-- 2. Garantir que todas as colunas existem
ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_insurance_company TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS employer TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_name TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_document_type TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_document TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_relationship TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'es';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinical_history JSONB DEFAULT '[]';

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 4. Criar política de acesso (ajuste conforme sua necessidade)
DROP POLICY IF EXISTS "Allow all access" ON patients;
CREATE POLICY "Allow all access" ON patients FOR ALL USING (true) WITH CHECK (true);

-- 5. Verificar resultado
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;
