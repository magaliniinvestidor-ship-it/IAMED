const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kqfiwigggbdwwnzywhbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZml3aWdnZ2Jkd3duenl3aGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA2NTA5NiwiZXhwIjoyMDk3NjQxMDk2fQ.LmqPbkQwqwt35arqEi27euX7Kta1UHHpQLPqQ3HOHH0';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_URL = 'https://raw.githubusercontent.com/Bobrovskiy/ICD-10-CSV/master/2020/diagnosis.csv';

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(current); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current);
  return fields;
}

async function main() {
  console.log('1. Baixando CSV ICD-10-CM...');
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csvText = await res.text();
  console.log(`   Baixado: ${(csvText.length / 1024 / 1024).toFixed(2)} MB`);

  const lines = csvText.split('\n').filter(l => l.trim());
  console.log(`   Linhas: ${lines.length}`);

  const descriptions = new Map();
  for (const line of lines) {
    const fields = parseCsvLine(line);
    if (fields.length < 5) continue;
    const code = fields[1].trim().replace(/\./g, '').toUpperCase();
    const desc = (fields[4] || fields[3] || '').trim();
    if (code && desc && !descriptions.has(code)) {
      descriptions.set(code, desc);
    }
  }
  console.log(`   Códigos únicos: ${descriptions.size}`);

  // 2. Get ALL codes with NULL description from DB
  console.log('\n2. Buscando códigos com NULL no banco...');
  let allNull = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('cid10_codes')
      .select('code')
      .is('description', null)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allNull = allNull.concat(data);
    offset += 1000;
  }
  console.log(`   NULL total: ${allNull.length}`);

  // 3. Batch update using RPC or individual updates with batching
  console.log('\n3. Atualizando em batches...');
  const BATCH_SIZE = 200;
  let updated = 0;
  let skipped = 0;
  const toUpdate = allNull.filter(r => descriptions.has(r.code));
  const toSkip = allNull.filter(r => !descriptions.has(r.code));
  skipped = toSkip.length;

  console.log(`   Para atualizar: ${toUpdate.length}`);
  console.log(`   Sem descrição: ${skipped}`);

  // Use individual updates but with Promise.all for parallelism
  const batches = [];
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    batches.push(toUpdate.slice(i, i + BATCH_SIZE));
  }

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const promises = batch.map(row => {
      const desc = descriptions.get(row.code);
      return supabase
        .from('cid10_codes')
        .update({ description: desc })
        .eq('code', row.code);
    });

    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    updated += batch.length - errors.length;
    
    if (errors.length > 0) {
      errors.forEach(e => console.error(`   Erro: ${e.error.message}`));
    }
    
    if ((b + 1) % 10 === 0 || b === batches.length - 1) {
      console.log(`   Batch ${b + 1}/${batches.length} (${updated} OK)`);
    }
  }

  console.log(`\nConcluído!`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Sem descrição na fonte: ${skipped}`);
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
