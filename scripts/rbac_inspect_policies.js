const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const t = l.trim();
  if (t && !t.startsWith('#')) {
    const p = l.split('=');
    env[p[0].trim()] = p.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const sb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);
(async () => {
  const { data, error } = await sb.rpc('exec_sql', {
    sql_query: "SELECT policyname, cmd, roles::text FROM pg_policies WHERE tablename = 'sso_providers'"
  });
  console.log('error:', JSON.stringify(error));
  console.log('data:', JSON.stringify(data, null, 2));
})();