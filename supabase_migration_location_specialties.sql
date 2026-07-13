-- ========================================
-- MIGRATION: Tabela location_specialties
-- Vincula especialidades às sedes (locations)
-- Execute no Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS location_specialties (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, specialty)
);

ALTER TABLE location_specialties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for dev" ON location_specialties;
CREATE POLICY "Public access for dev" ON location_specialties FOR ALL USING (true) WITH CHECK (true);

-- Dados iniciais: especialidades por sede
INSERT INTO location_specialties (id, location_id, specialty) VALUES
  -- Sede Central (loc_1)
  ('ls_1',  'loc_1', 'Cardiologia'),
  ('ls_2',  'loc_1', 'Pediatria'),
  ('ls_3',  'loc_1', 'Clínica Geral'),
  ('ls_4',  'loc_1', 'Ortopedia'),
  ('ls_5',  'loc_1', 'Dermatologia'),
  -- Filial Ciudad del Este (loc_2)
  ('ls_6',  'loc_2', 'Odontologia'),
  ('ls_7',  'loc_2', 'Pediatria'),
  ('ls_8',  'loc_2', 'Clínica Geral'),
  ('ls_9',  'loc_2', 'Oftalmologia'),
  -- Filial Asunción (loc_3)
  ('ls_10', 'loc_3', 'Nutrição Clínica'),
  ('ls_11', 'loc_3', 'Fisioterapia'),
  ('ls_12', 'loc_3', 'Psicologia Clínica'),
  ('ls_13', 'loc_3', 'Clínica Geral'),
  -- Filial Encarnación (loc_4)
  ('ls_14', 'loc_4', 'Cirurgia Geral'),
  ('ls_15', 'loc_4', 'Anestesiologia'),
  ('ls_16', 'loc_4', 'Clínica Geral'),
  -- Filial Pedro Juan (loc_5)
  ('ls_17', 'loc_5', 'Anestesiologia'),
  ('ls_18', 'loc_5', 'Psicologia Clínica'),
  ('ls_19', 'loc_5', 'Clínica Geral')
ON CONFLICT (id) DO NOTHING;
