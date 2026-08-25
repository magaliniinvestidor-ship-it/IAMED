const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Ler variáveis do .env.local (mesma lógica do export_backup.js)
const envPath = path.join(__dirname, '..', '.env.local');
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      envVars[key] = val;
    }
  });
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

// Modo URI ou modo discreto (senha crua, sem codificação)
const dbUrl = envVars['SUPABASE_DB_URL'];
const dbHost = envVars['SUPABASE_DB_HOST'];
const dbUser = envVars['SUPABASE_DB_USER'];
const dbPassword = envVars['SUPABASE_DB_PASSWORD'];
const dbName = envVars['SUPABASE_DB_NAME'] || 'postgres';
const dbPort = envVars['SUPABASE_DB_PORT'] || '5432';
const dbDiscrete = !!(dbHost && dbUser && dbPassword);

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env.local');
  process.exit(1);
}

const BACKUPS_DIR = path.join(__dirname, '..', 'backups');
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-').replace(/-(\d\d)$/, '$1');
const runDir = path.join(BACKUPS_DIR, `full_${stamp}`);

fs.mkdirSync(runDir, { recursive: true });

console.log('📦 Backup COMPLETO IAMED (banco + storage)');
console.log(`   Destino: ${runDir}\n`);

// ─────────────────────────────────────────────────────────────
// PARTE 1 — Banco de dados via pg_dump (tabelas, auth, RPCs, RLS)
// ─────────────────────────────────────────────────────────────
function findPgDump() {
  const candidates = [];
  if (dbUrl || dbDiscrete) {
    try {
      const probe = spawnSync('pg_dump', ['--version'], { shell: false });
      if (probe.status === 0) candidates.push('pg_dump');
    } catch {}
    const pgRoot = 'C:\\Program Files\\PostgreSQL';
    if (fs.existsSync(pgRoot)) {
      fs.readdirSync(pgRoot)
        .sort((a, b) => Number(b) - Number(a))
        .forEach(v => candidates.push(path.join(pgRoot, v, 'bin', 'pg_dump.exe')));
    }
  }
  return candidates.find(c => c === 'pg_dump' || fs.existsSync(c));
}

async function backupDatabase() {
  if (!dbUrl && !dbDiscrete) {
    console.log('⚠️  Credenciais do banco ausentes no .env.local — BANCO NÃO FOI COPIADO.');
    console.log('   Adicione (Dashboard → Settings → Database → Connection string → Session Pooler):');
    console.log('   SUPABASE_DB_HOST=aws-0-SEU-REGIAO.pooler.supabase.com');
    console.log('   SUPABASE_DB_USER=postgres.SEU-PROJECT-REF');
    console.log('   SUPABASE_DB_PASSWORD=suaSenhaCruaSemCodificacao\n');
    return false;
  }
  const pgDump = findPgDump();
  if (!pgDump) {
    console.log('⚠️  pg_dump não encontrado — BANCO NÃO FOI COPIADO.\n');
    return false;
  }

  const outFile = path.join(runDir, 'database.dump');
  console.log(`🗄️  Exportando banco com ${path.basename(pgDump)}...`);

  let args;
  let spawnEnv = process.env;
  if (dbDiscrete) {
    args = ['-h', dbHost, '-p', dbPort, '-U', dbUser, '-d', dbName, '--no-owner', '--no-privileges', '-Fc', '-f', outFile];
    spawnEnv = { ...process.env, PGPASSWORD: dbPassword };
  } else {
    args = ['--no-owner', '--no-privileges', '-Fc', '-d', dbUrl, '-f', outFile];
  }

  const res = spawnSync(pgDump, args, { shell: false, env: spawnEnv });

  if (res.status !== 0 || !fs.existsSync(outFile)) {
    const errOut = res.stderr ? res.stderr.toString().slice(0, 500) : 'erro desconhecido';
    console.error(`❌ Falhou o pg_dump: ${errOut}\n`);
    return false;
  }
  const mb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Banco salvo: database.dump (${mb} MB)\n`);
  return true;
}

// ─────────────────────────────────────────────────────────────
// PARTE 2 — Arquivos do Storage (todos os buckets)
// ─────────────────────────────────────────────────────────────
async function apiGet(urlPath) {
  const res = await fetch(`${supabaseUrl}${urlPath}`, {
    headers: { Authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function apiPost(urlPath, body) {
  const res = await fetch(`${supabaseUrl}${urlPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

function safeJoin(base, relPath) {
  const target = path.join(base, ...relPath.split('/'));
  if (!target.startsWith(base)) throw new Error(`Caminho inválido: ${relPath}`);
  return target;
}

async function downloadObject(bucket, objPath) {
  const encoded = objPath.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encoded}`, {
    headers: { Authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) throw new Error(`${res.status} ao baixar ${objPath}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = safeJoin(runDir, `storage/${bucket}/${objPath}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function walkBucket(bucket, prefix = '') {
  let files = 0, bytes = 0;
  const items = await apiPost(`/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
    prefix,
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });
  for (const item of items) {
    const childPath = `${prefix}${item.name}`;
    if (item.id === null) {
      const sub = await walkBucket(bucket, `${childPath}/`);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      bytes += await downloadObject(bucket, childPath);
      files++;
    }
  }
  return { files, bytes };
}

async function backupStorage() {
  let buckets;
  try {
    buckets = await apiGet('/storage/v1/bucket');
  } catch (e) {
    console.error(`❌ Não foi possível listar buckets: ${e.message}`);
    return false;
  }
  if (!buckets.length) {
    console.log('ℹ️  Nenhum bucket de storage para copiar.\n');
    return true;
  }
  let totalFiles = 0, totalBytes = 0;
  for (const b of buckets) {
    process.stdout.write(`📁 Bucket "${b.name}"... `);
    try {
      const r = await walkBucket(b.name);
      totalFiles += r.files;
      totalBytes += r.bytes;
      console.log(`${r.files} arquivo(s), ${(r.bytes / 1024 / 1024).toFixed(2)} MB`);
    } catch (e) {
      console.log(`❌ ${e.message.slice(0, 120)}`);
    }
  }
  console.log(`✅ Storage salvo em storage/ (${totalFiles} arquivo(s), ${(totalBytes / 1024 / 1024).toFixed(2)} MB)\n`);
  return true;
}

(async () => {
  const dbOk = await backupDatabase();
  const stOk = await backupStorage();

  if (dbOk && stOk) {
    console.log('🎉 Backup completo finalizado com sucesso.');
  } else {
    console.log('🏁 Backup finalizado com ressalvas — revise as mensagens acima.');
  }
})();
