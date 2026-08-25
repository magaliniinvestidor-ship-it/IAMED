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
  const tries = [
    `CREATE OR REPLACE FUNCTION public.diag_sso() RETURNS TABLE(policyname text, cmd text, roles text, qual text, with_check text) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT policyname::text, cmd::text, roles::text, substring(qual::text,1,200), substring(with_check::text,1,200) FROM pg_policies WHERE tablename = 'sso_providers' AND schemaname = 'public'; $$;`,
    `GRANT EXECUTE ON FUNCTION public.diag_sso() TO anon, authenticated;`,
  ];
  for (const sql of tries) {
    const { error } = await sb.rpc('exec_sql', { sql_query: sql });
    console.log('exec_sql:', error ? JSON.stringify(error).slice(0, 200) : 'OK');
  }
})();