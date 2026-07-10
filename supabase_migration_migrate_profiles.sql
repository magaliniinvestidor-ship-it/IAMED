-- ========================================
-- MIGRATION: Atualizar RLS policies para system_users
-- profiles já foi dropado, execute este script
-- ========================================

-- ========================================
-- BLOCO 1: Atualizar função is_admin_or_gestor
-- ========================================
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.system_users
    WHERE auth_user_id = auth.uid()
    AND system_role IN ('SuperAdmin', 'Administrador', 'Gestor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================
-- BLOCO 2: Atualizar função get_user_role
-- ========================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT system_role INTO user_role 
  FROM public.system_users 
  WHERE auth_user_id = auth.uid();
  RETURN COALESCE(user_role, 'Visualizador');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================
-- BLOCO 3: Atualizar RLS policies em blocked_slots
-- ========================================
DROP POLICY IF EXISTS "Doctors view own blocks" ON public.blocked_slots;
CREATE POLICY "Doctors view own blocks" ON public.blocked_slots
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage all blocks" ON public.blocked_slots;
CREATE POLICY "Admins manage all blocks" ON public.blocked_slots
  FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- BLOCO 4: Atualizar RLS policies em whatsapp_reminders
-- ========================================
DROP POLICY IF EXISTS "Operators insert reminders" ON public.whatsapp_reminders;
CREATE POLICY "Operators insert reminders" ON public.whatsapp_reminders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Operators update reminders" ON public.whatsapp_reminders;
CREATE POLICY "Operators update reminders" ON public.whatsapp_reminders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================
-- BLOCO 5: Atualizar RLS policies em waitlist_entries
-- ========================================
DROP POLICY IF EXISTS "Receptionists manage waitlist" ON public.waitlist_entries;
CREATE POLICY "Receptionists manage waitlist" ON public.waitlist_entries
  FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- BLOCO 6: Atualizar RLS policies em call_logs
-- ========================================
DROP POLICY IF EXISTS "Operators view own calls" ON public.call_logs;
CREATE POLICY "Operators view own calls" ON public.call_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- BLOCO 7: Atualizar RLS policies em professionals
-- ========================================
DROP POLICY IF EXISTS "Professionals view own" ON public.professionals;
CREATE POLICY "Professionals view own" ON public.professionals
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage professionals" ON public.professionals;
CREATE POLICY "Admins manage professionals" ON public.professionals
  FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- BLOCO 8: Atualizar RLS policies em waiting_list
-- ========================================
DROP POLICY IF EXISTS "waiting_list_delete" ON public.waiting_list;
CREATE POLICY "waiting_list_delete" ON public.waiting_list
  FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- BLOCO 9: Atualizar RLS policies em waitlist_entries (delete)
-- ========================================
DROP POLICY IF EXISTS "waitlist_entries_delete" ON public.waitlist_entries;
CREATE POLICY "waitlist_entries_delete" ON public.waitlist_entries
  FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- BLOCO 10: Atualizar RLS policies em whatsapp_reminders (delete)
-- ========================================
DROP POLICY IF EXISTS "whatsapp_reminders_delete" ON public.whatsapp_reminders;
CREATE POLICY "whatsapp_reminders_delete" ON public.whatsapp_reminders
  FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- BLOCO 11: Habilitar RLS em system_users
-- ========================================
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for dev" ON public.system_users;
CREATE POLICY "Public access for dev" ON public.system_users
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- BLOCO 12: Verificação final
-- ========================================
SELECT 'Migração concluída!' as status;
SELECT COUNT(*) as total_system_users FROM system_users;
