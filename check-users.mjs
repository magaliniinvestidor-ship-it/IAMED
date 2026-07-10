import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqfiwigggbdwwnzywhbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZml3aWdnZ2Jkd3duenl3aGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA2NTA5NiwiZXhwIjoyMDk3NjQxMDk2fQ.LmqPbkQwqwt35arqEi27euX7Kta1UHHpQLPqQ3HOHH0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== system_users ===\n');
const { data: sysUsers, error: err1 } = await supabase.from('system_users').select('*');
if (err1) {
  console.log('Erro:', err1.message);
} else {
  console.table(sysUsers.map(u => ({ id: u.id, auth_user_id: u.auth_user_id, ci: u.ci, system_role: u.system_role, professional_id: u.professional_id })));
}

console.log('\n=== profiles ===\n');
const { data: profiles, error: err2 } = await supabase.from('profiles').select('*');
if (err2) {
  console.log('Erro:', err2.message);
} else {
  console.table(profiles.map(p => ({ id: p.id, email: p.email, name: p.name, full_name: p.full_name, role: p.role })));
}

console.log('\n=== professionals (com email) ===\n');
const { data: profs, error: err3 } = await supabase.from('professionals').select('id, name, email, role, status');
if (err3) {
  console.log('Erro:', err3.message);
} else {
  console.table(profs);
}
