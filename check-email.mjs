import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqfiwigggbdwwnzywhbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZml3aWdnZ2Jkd3duenl3aGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjUwOTYsImV4cCI6MjA5NzY0MTA5Nn0.ySKgvmByHtRiTucxz8tzeXrIQQ_KIIU4oc5aMF-gzF8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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