import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function getServiceClient() {
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Valida o JWT enviado no header Authorization e retorna o id do usuário
export async function getAuthenticatedUser(req: NextRequest): Promise<{ id: string } | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !supabaseUrl || !anonKey) return null;

  const verifier = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await verifier.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id };
}

const ADMIN_ROLES = ['superadmin', 'super admin', 'administrador'];

export async function hasAdminRole(userId: string): Promise<boolean> {
  const svc = getServiceClient();
  const { data } = await svc
    .from('system_users')
    .select('system_role')
    .eq('auth_user_id', userId)
    .single();

  return ADMIN_ROLES.includes(String(data?.system_role || '').toLowerCase());
}
