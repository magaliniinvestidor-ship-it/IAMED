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

const adminEmail = 'gestor@iamed.local';
const adminPassword = 'iamed2026';

(async () => {
  const anonSb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);
  const { data: authData, error: authErr } = await anonSb.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) { console.log('auth err:', authErr.message); process.exit(1); }
  console.log('signed in uid:', authData.user.id);

  const { data: sysUser } = await anonSb.from('system_users').select('id, system_role, status').eq('auth_user_id', authData.user.id).maybeSingle();
  console.log('system_user:', JSON.stringify(sysUser));

  const { data: isAdmin } = await anonSb.rpc('fn_is_system_admin');
  console.log('fn_is_system_admin (user ctx):', JSON.stringify(isAdmin));

  const { data: ins, error: insErr } = await anonSb.from('sso_providers').insert({
    name: '__probe_auth__', provider_type: 'oidc', issuer_url: 'x', client_id: 'x',
    client_secret: '', metadata_url: '', certificate_fingerprint: '',
    default_role: 'Visualizador', enabled: true, active: true,
  }).select().single();
  console.log('insert:', insErr ? JSON.stringify(insErr) : `id=${ins?.id}`);

  if (ins?.id) {
    const { error: updErr } = await anonSb.from('sso_providers').update({ enabled: false }).eq('id', ins.id);
    console.log('update:', updErr ? JSON.stringify(updErr) : 'OK');
    const { error: delErr } = await anonSb.from('sso_providers').delete().eq('id', ins.id);
    console.log('delete:', delErr ? JSON.stringify(delErr) : 'OK');
  }

  await anonSb.auth.signOut();
})();