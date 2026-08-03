/**
 * Gera SQL de UPSERT para traduções CID-10 a partir do CSV
 *
 * Uso: node scripts/generate_upsert_sql.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_CSV = path.join(__dirname, 'seed_cid10_translations.csv');
const OUTPUT_SQL = path.join(__dirname, 'upsert_cid10_translations.sql');
const BATCH_SIZE = 500;

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

function main() {
  console.log('=== Gerador de SQL UPSERT - Traduções CID-10 ===\n');

  const csvText = fs.readFileSync(INPUT_CSV, 'utf-8');
  const lines = csvText.split('\n').filter(l => l.trim());

  // Pular cabeçalho
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length < 3) continue;

    const code = fields[0].trim();
    const descriptionEs = (fields[1] || '').trim();
    const descriptionPt = (fields[2] || '').trim();

    if (!code) continue;
    rows.push({ code, descriptionEs, descriptionPt });
  }

  console.log(`Linhas lidas: ${rows.length}`);

  let sql = `-- =====================================================\n`;
  sql += `-- UPSERT: Traduções CID-10 (es/pt) - Gerado automaticamente\n`;
  sql += `-- Total: ${rows.length} registros\n`;
  sql += `-- Data: ${new Date().toISOString().split('T')[0]}\n`;
  sql += `-- =====================================================\n\n`;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    sql += `INSERT INTO public.cid10_codes (code, description_es, description_pt) VALUES\n`;

    const valueLines = batch.map(
      (r) => `  ('${escapeSql(r.code)}', '${escapeSql(r.descriptionEs)}', '${escapeSql(r.descriptionPt)}')`
    );
    sql += valueLines.join(',\n');
    sql += `\nON CONFLICT (code) DO UPDATE SET\n`;
    sql += `  description_es = EXCLUDED.description_es,\n`;
    sql += `  description_pt = EXCLUDED.description_pt;\n\n`;
  }

  fs.writeFileSync(OUTPUT_SQL, sql, 'utf-8');

  const stats = fs.statSync(OUTPUT_SQL);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log(`SQL gerado: ${OUTPUT_SQL}`);
  console.log(`Total de linhas: ${rows.length}`);
  console.log(`Tamanho do arquivo: ${sizeKB} KB`);
}

main();
