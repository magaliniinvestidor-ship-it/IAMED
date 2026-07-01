-- ==========================================
-- PORTAL DO PACIENTE E APLICATIVO MÓVEL
-- Schema para autoatendimento digital
-- ==========================================

-- Pacientes cadastrados no portal (autocadastro)
CREATE TABLE portal_patient_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  ci VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT TRUE,
  two_factor_method VARCHAR(10) CHECK (two_factor_method IN ('sms', 'email')) DEFAULT 'sms',
  push_token TEXT,
  device_os VARCHAR(20),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Tokens OTP para autenticação de dois fatores
CREATE TABLE portal_otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES portal_patient_users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  channel VARCHAR(10) CHECK (channel IN ('sms', 'email')) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sessões ativas do portal
CREATE TABLE portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES portal_patient_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  refresh_token TEXT UNIQUE,
  device_info TEXT,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  revoked BOOLEAN DEFAULT FALSE
);

-- Agendamentos feitos via portal
CREATE TABLE portal_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  professional_id TEXT REFERENCES professionals(id),
  specialty VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  modality VARCHAR(20) CHECK (modality IN ('Presencial', 'Virtual')) DEFAULT 'Presencial',
  status VARCHAR(20) CHECK (status IN ('reservado', 'confirmado', 'remarcado', 'cancelado', 'realizado')) DEFAULT 'reservado',
  source VARCHAR(20) CHECK (source IN ('portal', 'app_mobile')) DEFAULT 'portal',
  cancellation_reason TEXT,
  reschedule_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notificações enviadas ao paciente
CREATE TABLE portal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  type VARCHAR(30) CHECK (type IN ('appointment_reminder', 'exam_result', 'prescription', 'payment', 'telemedicine', 'vaccination', 'general')) NOT NULL,
  channel VARCHAR(20) CHECK (channel IN ('push', 'email', 'whatsapp', 'sms')) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  reference_id VARCHAR(100),
  reference_type VARCHAR(30),
  status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Solicitações de telemedicina/videoconsulta
CREATE TABLE portal_telemedicine_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  professional_id TEXT REFERENCES professionals(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status VARCHAR(20) CHECK (status IN ('solicitado', 'confirmado', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'solicitado',
  room_url TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Downloads de DTE/faturas pelo paciente
CREATE TABLE portal_dte_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  dte_id TEXT REFERENCES dtes(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ip_address INET,
  user_agent TEXT
);

-- Pagamentos on-line realizados
CREATE TABLE portal_online_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('credit_card', 'debit_card', 'pix', 'boleto', 'paypal', 'mercadopago')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'refunded', 'cancelled')) DEFAULT 'pending',
  transaction_id VARCHAR(100),
  reference_type VARCHAR(30),
  reference_id VARCHAR(100),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Consentimento LGPD / termos de uso do portal
CREATE TABLE portal_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  consent_type VARCHAR(30) CHECK (consent_type IN ('terms_of_use', 'privacy_policy', 'data_sharing', 'marketing', 'telemedicine')) NOT NULL,
  version VARCHAR(20) NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX idx_portal_users_ci ON portal_patient_users(ci);
CREATE INDEX idx_portal_sessions_token ON portal_sessions(token);
CREATE INDEX idx_portal_sessions_user ON portal_sessions(user_id);
CREATE INDEX idx_portal_appointments_patient ON portal_appointments(patient_id);
CREATE INDEX idx_portal_appointments_date ON portal_appointments(date);
CREATE INDEX idx_portal_notifications_patient ON portal_notifications(patient_id);
CREATE INDEX idx_portal_telemedicine_patient ON portal_telemedicine_requests(patient_id);
CREATE INDEX idx_portal_telemedicine_date ON portal_telemedicine_requests(scheduled_date);
CREATE INDEX idx_portal_otp_user ON portal_otp_tokens(user_id);
CREATE INDEX idx_portal_payments_patient ON portal_online_payments(patient_id);
CREATE INDEX idx_portal_consent_patient ON portal_consent_logs(patient_id);

-- RLS (Row Level Security)
ALTER TABLE portal_patient_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_otp_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_telemedicine_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_dte_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_online_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_consent_logs ENABLE ROW LEVEL SECURITY;

-- Policies: pacientes autenticados via Supabase Auth podem ver apenas seus próprios dados
CREATE POLICY portal_users_self ON portal_patient_users FOR ALL USING (patient_id = auth.uid()::text);
CREATE POLICY portal_otp_self ON portal_otp_tokens FOR ALL USING (user_id IN (SELECT id FROM portal_patient_users WHERE patient_id = auth.uid()::text));
CREATE POLICY portal_sessions_self ON portal_sessions FOR ALL USING (user_id IN (SELECT id FROM portal_patient_users WHERE patient_id = auth.uid()::text));
CREATE POLICY portal_appointments_self ON portal_appointments FOR ALL USING (patient_id = auth.uid()::text);
CREATE POLICY portal_notifications_self ON portal_notifications FOR ALL USING (patient_id = auth.uid()::text);
CREATE POLICY portal_telemedicine_self ON portal_telemedicine_requests FOR ALL USING (patient_id = auth.uid()::text);
CREATE POLICY portal_dte_downloads_self ON portal_dte_downloads FOR ALL USING (patient_id = auth.uid()::text);
CREATE POLICY portal_payments_self ON portal_online_payments FOR ALL USING (patient_id = auth.uid()::text);
CREATE POLICY portal_consent_self ON portal_consent_logs FOR ALL USING (patient_id = auth.uid()::text);
