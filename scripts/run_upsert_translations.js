const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://kqfiwigggbdwwnzywhbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZml3aWdnZ2Jkd3duenl3aGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA2NTA5NiwiZXhwIjoyMDk3NjQxMDk2fQ.LmqPbkQwqwt35arqEi27euX7Kta1UHHpQLPqQ3HOHH0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 500;

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const header = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    if (values[0]) {
      rows.push({
        code: values[0],
        description_es: values[1] || '',
        description_pt: values[2] || '',
      });
    }
  }
  return rows;
}

async function upsertBatch(rows, batchNum, totalBatches) {
  const { data, error } = await supabase
    .from('cid10_codes')
    .upsert(rows, { onConflict: 'code' });

  if (error) {
    console.error(`  Erro no batch ${batchNum}: ${error.message}`);
    return false;
  }
  console.log(`  Batch ${batchNum}/${totalBatches} OK (${rows.length} registros)`);
  return true;
}

async function main() {
  const csvPath = path.join(__dirname, 'seed_cid10_translations.csv');
  console.log('Lendo CSV...');
  const rows = parseCSV(csvPath);
  console.log(`Total de registros: ${rows.length}`);

  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  console.log(`Batches: ${batches.length} (${BATCH_SIZE} registros cada)\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const ok = await upsertBatch(batches[i], i + 1, batches.length);
    if (ok) successCount++;
    else failCount++;

    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\nConcluído!`);
  console.log(`  Sucesso: ${successCount} batches`);
  console.log(`  Falha: ${failCount} batches`);
  console.log(`  Registros processados: ${rows.length}`);
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
