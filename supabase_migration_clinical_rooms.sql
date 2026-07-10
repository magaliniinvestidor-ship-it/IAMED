-- ========================================
-- MIGRATION: Tabela clinical_rooms
-- Execute no Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS clinical_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'consultório',
  location_id TEXT REFERENCES locations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ativo',
  capacity INTEGER DEFAULT 1,
  equipment JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clinical_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for dev" ON clinical_rooms;
CREATE POLICY "Public access for dev" ON clinical_rooms FOR ALL USING (true) WITH CHECK (true);

-- CHECK constraints (flexível — aceita qualquer tipo de sala)
ALTER TABLE clinical_rooms DROP CONSTRAINT IF EXISTS clinical_rooms_type_check;

ALTER TABLE clinical_rooms DROP CONSTRAINT IF EXISTS clinical_rooms_status_check;
ALTER TABLE clinical_rooms ADD CONSTRAINT clinical_rooms_status_check
CHECK (status IN ('ativo','inativo','manutenção'));

-- Dados de teste vinculados às sedes
INSERT INTO clinical_rooms (id, name, type, location_id, status, capacity, equipment)
VALUES
  ('room_1', 'Consultório 101',   'consultório',          'loc_1', 'ativo', 1, '["Otoscópio","Oftalmoscópio","Balança"]'),
  ('room_2', 'Consultório 102',   'consultório',          'loc_1', 'ativo', 1, '["Otoscópio","Ecógrafo"]'),
  ('room_3', 'Sala de Exames 1',  'sala de exames',       'loc_1', 'ativo', 1, '["Ecógrafo","Raio-X"]'),
  ('room_4', 'Sala Procedimentos A','sala de procedimentos','loc_1', 'ativo', 2, '["Mesa cirúrgica","Autoclave"]'),
  ('room_5', 'Consultório 201',   'consultório',          'loc_2', 'ativo', 1, '["Otoscópio","Balança"]'),
  ('room_6', 'Consultório 202',   'consultório',          'loc_2', 'ativo', 1, '["Ecógrafo"]'),
  ('room_7', 'Consultório 301',   'consultório',          'loc_4', 'ativo', 1, '["Otoscópio"]')
ON CONFLICT (id) DO NOTHING;
