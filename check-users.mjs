import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

function loadEnv() {
  const envFile = readFileSync('.env.local', 'utf-8');
  const env = {};
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

console.log('=== system_users ===\n');
const { data: sysUsers, error: err1 } = await supabase.from('system_users').select('*');
if (err1) {
  console.log('Erro:', err1.message);
} else {
  console.table(sysUsers.map(u => ({ id: u.id, auth_user_id: u.auth_user_id, ci: u.ci, system_role: u.system_role, professional_id: u.professional_id })));
}

console.log('\n=== professionals (com email) ===\n');
const { data: profs, error: err3 } = await supabase.from('professionals').select('id, name, email, role, status');
if (err3) {
  console.log('Erro:', err3.message);
} else {
  console.table(profs);
}
