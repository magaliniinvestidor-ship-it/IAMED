-- ============================================================
-- IAMED - Adicionar colunas faltantes nas tabelas
-- ============================================================

-- 1. PATIENTS
ALTER TABLE patients ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS place_of_birth TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS civil_status TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_department TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_district TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_insurance_type TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_insurance_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_insurance_company TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS employer TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_document TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'es';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. APPOINTMENTS
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS resource TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS modality TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_overturn BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS overturn_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS insurance TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. PROFESSIONALS
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. BEDS
ALTER TABLE beds ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 5. STOCK ITEMS
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
