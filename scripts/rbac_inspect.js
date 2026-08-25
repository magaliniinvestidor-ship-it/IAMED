const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const parts = line.split('=');
      envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const sb = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY']);

(async () => {
  const { data: users } = await sb.from('system_users').select('id,name,email,system_role,professional_id,permissions').order('name');
  console.log('=== SYSTEM_USERS ===');
  for (const u of users || []) {
    const perms = Array.isArray(u.permissions) ? u.permissions : [];
    console.log(`- ${u.name} | role=${u.system_role} | prof=${u.professional_id} | perms(${perms.length})=${JSON.stringify(perms)}`);
  }

  const { data: roles } = await sb.from('role_permissions').select('role_name,permissions').order('role_name');
  console.log('\n=== ROLE_PERMISSIONS ===');
  for (const r of roles || []) {
    const perms = Array.isArray(r.permissions) ? r.permissions : [];
    const views = perms.filter(p => p.startsWith('view_'));
    console.log(`- ${r.role_name}: total=${perms.length} views=${views.length} [${perms.slice(0, 12).join(',')}${perms.length > 12 ? ' ...' : ''}]`);
  }

  const { data: profs } = await sb.from('professionals').select('id,name,email,role,permissions').order('name');
  console.log('\n=== PROFESSIONALS with permissions column non-null/non-empty ===');
  for (const p of profs || []) {
    const perms = Array.isArray(p.permissions) ? p.permissions : [];
    if (perms.length > 0) console.log(`- ${p.name} | role=${p.role} | perms(${perms.length})=${JSON.stringify(perms)}`);
  }
})();
