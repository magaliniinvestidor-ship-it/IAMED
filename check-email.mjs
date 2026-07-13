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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: profs, error: err2 } = await supabase
    .from('professionals')
    .select('*')
    .eq('email', 'magaliniinvestidor@gmail.com');
  console.log('Professionals:', err2, profs);
  
  const { data: sysUsers, error: err3 } = await supabase
    .from('system_users')
    .select('*');
  console.log('System users:', err3, sysUsers);
}
check();
