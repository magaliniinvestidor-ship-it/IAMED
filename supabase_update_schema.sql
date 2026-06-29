-- ==========================================================
-- IAMED SCHEMA UPDATE - AGENDA E ATENDIMENTO
-- ==========================================================

-- 1. Atualizar a restrição de status na tabela de consultas (appointments)
-- Nota: no Postgres, o nome padrão do check é "appointments_status_check"
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('agendado', 'confirmado', 'em sala de espera', 'em atendimento', 'finalizado', 'ausente', 'cancelado', 'remarcado'));

-- 2. Tabela de Leitos (caso necessite ajuste no status, já existente no schema original)
-- 3. Tabela de Lista de Espera Inteligente
CREATE TABLE IF NOT EXISTS waiting_list (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  phone TEXT,
  specialty TEXT NOT NULL,
  doctor_name TEXT,
  priority_criteria TEXT NOT NULL CHECK (priority_criteria IN ('arrival', 'urgency', 'coverage', 'seniority')),
  priority_score INTEGER NOT NULL DEFAULT 0,
  preferred_days TEXT[] DEFAULT '{}',
  preferred_hours TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('aguardando', 'notificado', 'alocado', 'cancelado')) DEFAULT 'aguardando',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS e criar políticas de acesso
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read waiting_list" ON waiting_list FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes waiting_list" ON waiting_list FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Tabela de Bloqueios de Faixas Horárias (Feriados, férias, capacitações, etc.)
CREATE TABLE IF NOT EXISTS blocked_slots (
  id TEXT PRIMARY KEY,
  doctor_name TEXT, -- Se nulo, aplica-se a todos
  branch TEXT, -- Se nulo, aplica-se a todas as sedes
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- Se nulo, bloqueia o dia todo
  end_time TIME,
  reason TEXT NOT NULL CHECK (reason IN ('feriado', 'férias', 'capacitação', 'emergência')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read blocked_slots" ON blocked_slots FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes blocked_slots" ON blocked_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Tabela de Mensagens e Confirmações do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_reminders (
  id TEXT PRIMARY KEY,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  message_template TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('es', 'gn', 'pt')) DEFAULT 'es',
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'sent', 'delivered', 'read', 'confirmed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  response_received TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE whatsapp_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read whatsapp_reminders" ON whatsapp_reminders FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes whatsapp_reminders" ON whatsapp_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Tabela de Registros do Call Center (Interações)
CREATE TABLE IF NOT EXISTS call_center_logs (
  id TEXT PRIMARY KEY,
  operator_name TEXT NOT NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inbound', 'outbound')),
  reason TEXT NOT NULL CHECK (reason IN ('agendamento', 'cancelamento', 'remarcação', 'dúvida', 'reclamação', 'financeiro', 'outros')),
  notes TEXT,
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE call_center_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read call_center_logs" ON call_center_logs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes call_center_logs" ON call_center_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
