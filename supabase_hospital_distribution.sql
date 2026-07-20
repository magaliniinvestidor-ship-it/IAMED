-- ============================================================
-- SCRIPT: Tabelas para Distribuição de Pacientes Hospitalares
-- Módulo 1 - Recepção e Admissão
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Tabela de locais hospitalares
CREATE TABLE IF NOT EXISTS hospital_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultorio','enfermaria','uti','raio_x','laboratorio','cirurgia','sala_espera','outro')),
  capacity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'livre' CHECK (status IN ('livre','ocupado','manutencao')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de alocação de pacientes em locais
CREATE TABLE IF NOT EXISTS patient_location_assignments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES hospital_locations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true
);

-- 3. Tabela de notificações internas
CREATE TABLE IF NOT EXISTS internal_notifications (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_pla_patient ON patient_location_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_pla_location ON patient_location_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_pla_active ON patient_location_assignments(active);
CREATE INDEX IF NOT EXISTS idx_in_read ON internal_notifications(read);

-- 5. RLS (Row Level Security) - opcional mas recomendado
ALTER TABLE hospital_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (ajuste conforme sua necessidade de segurança)
CREATE POLICY "Allow all operations on hospital_locations" ON hospital_locations FOR ALL USING (true);
CREATE POLICY "Allow all operations on patient_location_assignments" ON patient_location_assignments FOR ALL USING (true);
CREATE POLICY "Allow all operations on internal_notifications" ON internal_notifications FOR ALL USING (true);

-- 6. Dados iniciais (10 consultórios + 5 áreas hospitalares)
INSERT INTO hospital_locations (id, name, type, capacity, status) VALUES
('loc_1', 'Consultório 1', 'consultorio', 1, 'livre'),
('loc_2', 'Consultório 2', 'consultorio', 1, 'livre'),
('loc_3', 'Consultório 3', 'consultorio', 1, 'livre'),
('loc_4', 'Consultório 4', 'consultorio', 1, 'livre'),
('loc_5', 'Consultório 5', 'consultorio', 1, 'livre'),
('loc_6', 'Consultório 6', 'consultorio', 1, 'livre'),
('loc_7', 'Consultório 7', 'consultorio', 1, 'livre'),
('loc_8', 'Consultório 8', 'consultorio', 1, 'livre'),
('loc_9', 'Consultório 9', 'consultorio', 1, 'livre'),
('loc_10', 'Consultório 10', 'consultorio', 1, 'livre'),
('loc_11', 'Enfermaria', 'enfermaria', 10, 'livre'),
('loc_12', 'UTI', 'uti', 5, 'livre'),
('loc_13', 'Sala de Raio-X', 'raio_x', 1, 'livre'),
('loc_14', 'Laboratório', 'laboratorio', 3, 'livre'),
('loc_15', 'Sala de Cirurgia', 'cirurgia', 1, 'livre')
ON CONFLICT (id) DO NOTHING;

-- 7. Migration: Adicionar coluna triaged_at na tabela clinical_history
ALTER TABLE clinical_history ADD COLUMN IF NOT EXISTS triaged_at TIMESTAMPTZ;

-- 8. Migration: Adicionar coluna completed_at na tabela patient_location_assignments
ALTER TABLE patient_location_assignments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
