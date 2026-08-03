/**
 * Script para baixar códigos CID-10 e gerar SQL
 * 
 * Uso: node scripts/generate_cid10_sql.js
 * Fonte: https://github.com/k4m1113/ICD-10-CSV
 * Formato CSV: category,subcategory_num,full_code,"short_desc","long_desc","category_name"
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_SQL = path.join(__dirname, 'seed_cid10_codes.sql');
const OUTPUT_CSV = path.join(__dirname, 'seed_cid10_codes.csv');
const BATCH_SIZE = 500;

function getChapter(code) {
  const letter = code.charAt(0).toUpperCase();
  if (code.startsWith('D0') || code.startsWith('D1') || code.startsWith('D2') || code.startsWith('D3') || code.startsWith('D4')) return 'II';
  if (code.startsWith('D5') || code.startsWith('D6') || code.startsWith('D7') || code.startsWith('D8') || code.startsWith('D9')) return 'III';
  if (code.startsWith('H0') || code.startsWith('H1') || code.startsWith('H2') || code.startsWith('H3') || code.startsWith('H4') || code.startsWith('H5')) return 'VII';
  if (code.startsWith('H6') || code.startsWith('H7') || code.startsWith('H8') || code.startsWith('H9')) return 'VIII';
  const chapterMap = {
    'A': 'I', 'B': 'I', 'C': 'II',
    'E': 'IV', 'F': 'V', 'G': 'VI',
    'I': 'IX', 'J': 'X', 'K': 'XI', 'L': 'XII', 'M': 'XIII', 'N': 'XIV',
    'O': 'XV', 'P': 'XVI', 'Q': 'XVII', 'R': 'XVIII',
    'S': 'XIX', 'T': 'XIX', 'U': 'XIX',
    'V': 'XX', 'W': 'XX', 'X': 'XX', 'Y': 'XX', 'Z': 'XXI',
  };
  return chapterMap[letter] || '';
}

function getBlock(code) {
  const letter = code.charAt(0).toUpperCase();
  const numPart = code.substring(1).replace(/[^0-9]/g, '');
  const num = parseInt(numPart, 10);
  if (isNaN(num)) return `${letter}00-${letter}99`;
  const blockStart = Math.floor(num / 10) * 10;
  const blockEnd = blockStart + 9;
  return `${letter}${String(blockStart).padStart(2, '0')}-${letter}${String(blockEnd).padStart(2, '0')}`;
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

async function main() {
  console.log('=== Gerador de SQL para CID-10 ===\n');

  const csvUrl = 'https://raw.githubusercontent.com/k4m1113/ICD-10-CSV/master/codes.csv';

  console.log('Baixando CSV...');
  let csvText;
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    csvText = await res.text();
    console.log(`Baixado: ${(csvText.length / 1024 / 1024).toFixed(2)} MB`);
  } catch (e) {
    console.error(`Erro ao baixar: ${e.message}`);
    return;
  }

  const lines = csvText.split('\n').filter(l => l.trim());
  console.log(`Linhas: ${lines.length}`);

  const codeMap = new Map();
  for (const line of lines) {
    const fields = parseCsvLine(line);
    // Format: category,subcategory_num,full_code,"short_desc","long_desc","category_name"
    if (fields.length < 5) continue;

    const fullCode = fields[2].trim().replace(/\./g, '').toUpperCase();
    const description = (fields[4] || fields[3] || '').trim();

    if (!fullCode || fullCode.length < 3 || !description) continue;
    if (!/^[A-Z]\d{2,}/i.test(fullCode)) continue;

    if (!codeMap.has(fullCode)) {
      codeMap.set(fullCode, description);
    }
  }

  console.log(`Códigos únicos: ${codeMap.size}`);

  const entries = [];
  for (const [code, description] of codeMap) {
    const chapter = getChapter(code);
    const block = getBlock(code);
    entries.push(`  ('${escapeSql(code)}', '${escapeSql(description)}', '${chapter}', '${block}')`);
  }

  let sql = `-- =====================================================\n`;
  sql += `-- SEED: Códigos CID-10 (CIE-10) - Gerado automaticamente\n`;
  sql += `-- Total: ${entries.length} códigos\n`;
  sql += `-- Fonte: ICD-10-CSV (WHO/CDC)\n`;
  sql += `-- Data: ${new Date().toISOString().split('T')[0]}\n`;
  sql += `-- =====================================================\n\n`;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    sql += `INSERT INTO public.cid10_codes (code, description, chapter, block) VALUES\n`;
    sql += batch.join(',\n');
    sql += `\nON CONFLICT (code) DO NOTHING;\n\n`;
  }

  fs.writeFileSync(OUTPUT_SQL, sql, 'utf-8');
  console.log(`\nSQL gerado: ${OUTPUT_SQL}`);

  // Generate CSV for Supabase import
  let csv = 'code,description,chapter,block\n';
  for (const [code, description] of codeMap) {
    const chapter = getChapter(code);
    const block = getBlock(code);
    const desc = description.includes(',') || description.includes('"')
      ? `"${description.replace(/"/g, '""')}"`
      : description;
    csv += `${code},${desc},${chapter},${block}\n`;
  }
  fs.writeFileSync(OUTPUT_CSV, csv, 'utf-8');
  console.log(`CSV gerado: ${OUTPUT_CSV}`);
  console.log(`\nTotal: ${codeMap.size} códigos`);
  console.log('\nPara importar no Supabase:');
  console.log('1. Table Editor → cid10_codes → Import');
  console.log('2. Selecione o arquivo CSV');
  console.log('3. Mapeie as colunas: code, description, chapter, block');
}

main().catch(console.error);
