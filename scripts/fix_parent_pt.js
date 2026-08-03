const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kqfiwigggbdwwnzywhbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZml3aWdnZ2Jkd3duenl3aGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA2NTA5NiwiZXhwIjoyMDk3NjQxMDk2fQ.LmqPbkQwqwt35arqEi27euX7Kta1UHHpQLPqQ3HOHH0';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIAS_URL = 'https://raw.githubusercontent.com/cleytonferrari/CidDataSus/master/CIDImport/Repositorio/Resources/CID-10-CATEGORIAS.CSV';

function parseCsvLine(line, sep) {
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
      else if (ch === sep) { fields.push(current); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current);
  return fields;
}

async function main() {
  console.log('1. Baixando CID-10-CATEGORIAS.CSV do DATASUS...');
  const res = await fetch(CATEGORIAS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();
  const csvText = Buffer.from(buffer).toString('latin1');
  console.log(`   Baixado: ${(csvText.length / 1024).toFixed(0)} KB`);

  // Parse CSV - separator is ;
  const lines = csvText.split('\n').filter(l => l.trim());
  const categories = new Map();

  for (const line of lines) {
    const fields = parseCsvLine(line, ';');
    if (fields.length < 3) continue;
    const code = fields[0].trim().toUpperCase();
    const desc = fields[2].trim();
    if (code && desc && /^[A-Z]\d{2}$/.test(code)) {
      categories.set(code, desc);
    }
  }
  console.log(`   Categorias encontradas: ${categories.size}`);

  // Show examples
  console.log('\n   Exemplos:');
  for (const [c, d] of [...categories.entries()].slice(0, 10)) {
    console.log(`   ${c}: ${d}`);
  }

  // 2. Get all parent codes that exist in DB
  console.log('\n2. Buscando códigos-pai no banco...');
  const parentCodes = [...categories.keys()];
  
  // Check which ones exist in DB
  const BATCH = 200;
  const toUpdate = [];
  
  for (let i = 0; i < parentCodes.length; i += BATCH) {
    const batch = parentCodes.slice(i, i + BATCH);
    const { data } = await supabase
      .from('cid10_codes')
      .select('code')
      .in('code', batch);
    if (data) {
      data.forEach(r => {
        if (categories.has(r.code)) {
          toUpdate.push(r);
        }
      });
    }
  }
  console.log(`   Para atualizar: ${toUpdate.length}`);

  // 3. Update
  console.log('\n3. Atualizando description_pt...');
  let updated = 0;

  const batches = [];
  for (let i = 0; i < toUpdate.length; i += BATCH) {
    batches.push(toUpdate.slice(i, i + BATCH));
  }

  for (const batch of batches) {
    const promises = batch.map(row => {
      const desc = categories.get(row.code);
      return supabase
        .from('cid10_codes')
        .update({ description_pt: desc })
        .eq('code', row.code);
    });
    const results = await Promise.all(promises);
    updated += results.filter(r => !r.error).length;
    results.filter(r => r.error).forEach(r => console.error(`   Erro: ${r.error.message}`));
  }

  console.log(`\nConcluído!`);
  console.log(`   Atualizados: ${updated}`);
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
