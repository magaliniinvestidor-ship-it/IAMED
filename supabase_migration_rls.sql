-- ============================================================
-- MIGRATION: RLS Policies para tabelas sem restrição
-- Execute no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Helper function: verifica se o usuário é admin/gestor
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('SuperAdmin', 'Administrador', 'Gestor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- Helper function: retorna o role do usuário atual
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'Visualizador');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. WAITING_LIST (Fila de Espera)
-- ============================================================
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waiting_list_select" ON public.waiting_list;
DROP POLICY IF EXISTS "waiting_list_insert" ON public.waiting_list;
DROP POLICY IF EXISTS "waiting_list_update" ON public.waiting_list;
DROP POLICY IF EXISTS "waiting_list_delete" ON public.waiting_list;

CREATE POLICY "waiting_list_select"
  ON public.waiting_list FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "waiting_list_insert"
  ON public.waiting_list FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "waiting_list_update"
  ON public.waiting_list FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "waiting_list_delete"
  ON public.waiting_list FOR DELETE
  USING (public.is_admin_or_gestor());

-- ============================================================
-- 2. WAITLIST_ENTRIES (Entradas da Fila)
-- ============================================================
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_entries_select" ON public.waitlist_entries;
DROP POLICY IF EXISTS "waitlist_entries_insert" ON public.waitlist_entries;
DROP POLICY IF EXISTS "waitlist_entries_update" ON public.waitlist_entries;
DROP POLICY IF EXISTS "waitlist_entries_delete" ON public.waitlist_entries;

CREATE POLICY "waitlist_entries_select"
  ON public.waitlist_entries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "waitlist_entries_insert"
  ON public.waitlist_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "waitlist_entries_update"
  ON public.waitlist_entries FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "waitlist_entries_delete"
  ON public.waitlist_entries FOR DELETE
  USING (public.is_admin_or_gestor());

-- ============================================================
-- 3. WHATSAPP_REMINDERS (Lembretes WhatsApp)
-- ============================================================
ALTER TABLE public.whatsapp_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_reminders_select" ON public.whatsapp_reminders;
DROP POLICY IF EXISTS "whatsapp_reminders_insert" ON public.whatsapp_reminders;
DROP POLICY IF EXISTS "whatsapp_reminders_update" ON public.whatsapp_reminders;
DROP POLICY IF EXISTS "whatsapp_reminders_delete" ON public.whatsapp_reminders;

CREATE POLICY "whatsapp_reminders_select"
  ON public.whatsapp_reminders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_reminders_insert"
  ON public.whatsapp_reminders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_reminders_update"
  ON public.whatsapp_reminders FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "whatsapp_reminders_delete"
  ON public.whatsapp_reminders FOR DELETE
  USING (public.is_admin_or_gestor());

-- ============================================================
-- 4. PORTAL_APPOINTMENTS (Agendamentos do Portal)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_appointments') THEN
    ALTER TABLE public.portal_appointments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_appt_select" ON public.portal_appointments;
    DROP POLICY IF EXISTS "portal_appt_insert" ON public.portal_appointments;
    DROP POLICY IF EXISTS "portal_appt_update" ON public.portal_appointments;

    CREATE POLICY "portal_appt_select"
      ON public.portal_appointments FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_appt_insert"
      ON public.portal_appointments FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "portal_appt_update"
      ON public.portal_appointments FOR UPDATE
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 5. PORTAL_CONSENT_LOGS (Logs de Consentimento)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_consent_logs') THEN
    ALTER TABLE public.portal_consent_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_consent_select" ON public.portal_consent_logs;
    DROP POLICY IF EXISTS "portal_consent_insert" ON public.portal_consent_logs;

    CREATE POLICY "portal_consent_select"
      ON public.portal_consent_logs FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_consent_insert"
      ON public.portal_consent_logs FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 6. PORTAL_DTE_DOWNLOADS (Downloads de DTEs)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_dte_downloads') THEN
    ALTER TABLE public.portal_dte_downloads ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_dte_dl_select" ON public.portal_dte_downloads;
    DROP POLICY IF EXISTS "portal_dte_dl_insert" ON public.portal_dte_downloads;

    CREATE POLICY "portal_dte_dl_select"
      ON public.portal_dte_downloads FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_dte_dl_insert"
      ON public.portal_dte_downloads FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 7. PORTAL_NOTIFICATIONS (Notificações do Portal)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_notifications') THEN
    ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_notif_select" ON public.portal_notifications;
    DROP POLICY IF EXISTS "portal_notif_insert" ON public.portal_notifications;
    DROP POLICY IF EXISTS "portal_notif_update" ON public.portal_notifications;

    CREATE POLICY "portal_notif_select"
      ON public.portal_notifications FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_notif_insert"
      ON public.portal_notifications FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "portal_notif_update"
      ON public.portal_notifications FOR UPDATE
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 8. PORTAL_ONLINE_PAYMENTS (Pagamentos Online)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_online_payments') THEN
    ALTER TABLE public.portal_online_payments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_pay_select" ON public.portal_online_payments;
    DROP POLICY IF EXISTS "portal_pay_insert" ON public.portal_online_payments;

    CREATE POLICY "portal_pay_select"
      ON public.portal_online_payments FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_pay_insert"
      ON public.portal_online_payments FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 9. PORTAL_OTP_TOKENS (Tokens OTP)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_otp_tokens') THEN
    ALTER TABLE public.portal_otp_tokens ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_otp_select" ON public.portal_otp_tokens;
    DROP POLICY IF EXISTS "portal_otp_insert" ON public.portal_otp_tokens;

    -- OTP tokens: only the owner can read, system can insert
    CREATE POLICY "portal_otp_select"
      ON public.portal_otp_tokens FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_otp_insert"
      ON public.portal_otp_tokens FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 10. PORTAL_PATIENT_USERS (Usuários do Portal)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_patient_users') THEN
    ALTER TABLE public.portal_patient_users ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_patient_user_select" ON public.portal_patient_users;
    DROP POLICY IF EXISTS "portal_patient_user_insert" ON public.portal_patient_users;
    DROP POLICY IF EXISTS "portal_patient_user_update" ON public.portal_patient_users;

    CREATE POLICY "portal_patient_user_select"
      ON public.portal_patient_users FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_patient_user_insert"
      ON public.portal_patient_users FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "portal_patient_user_update"
      ON public.portal_patient_users FOR UPDATE
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 11. PORTAL_SESSIONS (Sessões do Portal)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_sessions') THEN
    ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_session_select" ON public.portal_sessions;
    DROP POLICY IF EXISTS "portal_session_insert" ON public.portal_sessions;
    DROP POLICY IF EXISTS "portal_session_delete" ON public.portal_sessions;

    CREATE POLICY "portal_session_select"
      ON public.portal_sessions FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_session_insert"
      ON public.portal_sessions FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "portal_session_delete"
      ON public.portal_sessions FOR DELETE
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 12. PORTAL_TELEMEDICINE_REQ... (Telemedicina)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_telemedicine_requests') THEN
    ALTER TABLE public.portal_telemedicine_requests ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "portal_tele_select" ON public.portal_telemedicine_requests;
    DROP POLICY IF EXISTS "portal_tele_insert" ON public.portal_telemedicine_requests;
    DROP POLICY IF EXISTS "portal_tele_update" ON public.portal_telemedicine_requests;

    CREATE POLICY "portal_tele_select"
      ON public.portal_telemedicine_requests FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "portal_tele_insert"
      ON public.portal_telemedicine_requests FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "portal_tele_update"
      ON public.portal_telemedicine_requests FOR UPDATE
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- NOTA: Views (v_*) herdam RLS das tabelas base
-- Se as views continuarem UNRESTRICTED, execute:
-- ALTER VIEW public.v_blocked_slots_* SET (security_invoker = true);
-- ALTER VIEW public.v_calls_today SET (security_invoker = true);
-- ALTER VIEW public.v_waitlist_active SET (security_invoker = true);
-- ALTER VIEW public.v_whatsapp_pending SET (security_invoker = true);
-- ============================================================
