const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env.local manually
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

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'patients',
  'appointments',
  'clinical_history',
  'hospital_locations',
  'patient_location_assignments',
  'internal_notifications',
  'professional_roles',
  'pharmacy_items',
  'lot_controls',
  'whatsapp_reminders',
  'waiting_list',
  'cid10_codes'
];

async function backupDatabase() {
  console.log('📦 Iniciando Backup do Banco de Dados Supabase (IAMED)...');
  console.log(`URL: ${supabaseUrl}\n`);

  const backupData = {
    createdAt: new Date().toISOString(),
    projectUrl: supabaseUrl,
    tables: {}
  };

  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  let totalRecords = 0;

  for (const table of TABLES) {
    try {
      process.stdout.write(`Exportando tabela [${table}]... `);
      const { data, error } = await supabase.from(table).select('*');

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
        backupData.tables[table] = { error: error.message };
      } else {
        const count = data ? data.length : 0;
        totalRecords += count;
        console.log(`✅ ${count} registros exportados`);
        backupData.tables[table] = {
          count,
          rows: data
        };
      }
    } catch (err) {
      console.log(`❌ Erro inesperado: ${err.message}`);
      backupData.tables[table] = { error: err.message };
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_iamed_${timestamp}.json`;
  const filePath = path.join(backupsDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`\n🎉 Backup concluído com sucesso!`);
  console.log(`📊 Total de registros salvos: ${totalRecords}`);
  console.log(`📁 Arquivo de backup salvo em: ${filePath}`);
}

backupDatabase();
