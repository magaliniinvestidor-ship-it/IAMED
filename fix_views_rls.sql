-- ============================================================
-- FIX: Habilitar security_invoker nas views para respeitar RLS
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Views de slots/blocked
ALTER VIEW public.v_blocked_slots_upcoming SET (security_invoker = true);

-- Views de whatsapp
ALTER VIEW public.v_whatsapp_pending SET (security_invoker = true);

-- Views de waitlist
ALTER VIEW public.v_waitlist_active SET (security_invoker = true);

-- Views de calls
ALTER VIEW public.v_calls_today SET (security_invoker = true);
