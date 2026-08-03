/**
 * Script para baixar traduções CID-10 em PT e ES e gerar CSV para importação no Supabase.
 * 
 * Uso: node scripts/generate_cid10_translations.js
 * 
 * Fontes:
 * - PT-BR: DATASUS (http://www2.datasus.gov.br/cid10/V2008/)
 * - ES: verasativa/CIE-10 (https://github.com/verasativa/CIE-10)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_CSV = path.join(__dirname, 'seed_cid10_translations.csv');
  const TEMP_DIR = path.join(__dirname, '_temp_cid10');
  const PT_CSV = path.join(TEMP_DIR, 'package', 'data', 'CID-10-SUBCATEGORIAS.CSV');
  const ES_CSV = path.join(TEMP_DIR, 'cie-10.csv');

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
      } else if (ch === ';') {
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

function cleanCode(code) {
  return code.replace(/\./g, '').replace(/\s/g, '').toUpperCase().trim();
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  return buffer.length;
}

async function main() {
  console.log('=== Gerador de Traduções CID-10 (PT/ES) ===\n');

  // Create temp dir
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  // ─── 1. Portuguese (DATASUS via npm package) ───
  console.log('1. Processando traduções em Português (DATASUS)...');
  
  // Re-extract npm package if not present
  const ptPackageDir = path.join(TEMP_DIR, 'package', 'data', 'CID-10-SUBCATEGORIAS.CSV');
  if (!fs.existsSync(ptPackageDir)) {
    console.log('   Extraindo pacote DATASUS...');
    const tgzPath = path.join(TEMP_DIR, 'cid10-br-mcp-1.1.0.tgz');
    if (!fs.existsSync(tgzPath)) {
      execSync(`npm pack cid10-br-mcp --pack-destination "${TEMP_DIR}"`, { stdio: 'pipe' });
    }
    execSync(`tar -xzf "${tgzPath}" -C "${TEMP_DIR}"`, { stdio: 'pipe' });
  }
  
  const ptCsv = path.join(TEMP_DIR, 'package', 'data', 'CID-10-SUBCATEGORIAS.CSV');

  // ─── 2. Download Spanish (verasativa/CIE-10) ───
  console.log('\n2. Baixando traduções em Espanhol (CIE-10 Chile/OMS)...');
  const esCsv = path.join(TEMP_DIR, 'cie-10.csv');

  try {
    const size = await downloadFile('https://raw.githubusercontent.com/verasativa/CIE-10/master/cie-10.csv', esCsv);
    console.log(`   Baixado: ${(size / 1024).toFixed(0)} KB`);
  } catch (e) {
    console.log(`   Erro: ${e.message}`);
    return;
  }

  // ─── 3. Parse Portuguese ───
  console.log('\n3. Processando traduções em Português...');
  const ptMap = new Map();

  if (fs.existsSync(ptCsv)) {
    const ptContent = fs.readFileSync(ptCsv, 'latin1');
    const ptLines = ptContent.split('\n').filter(l => l.trim());

    for (const line of ptLines) {
      const fields = parseCsvLine(line);
      // DATASUS format: SUBCAT;CLASSIF;RESTRSEXO;CAUSAOBITO;DESCRICAO;DESCRABREV;REFER;EXCLUIDOS
      if (fields.length < 5) continue;

      const code = cleanCode(fields[0]);
      const description = fields[4].trim(); // DESCRICAO is column 5 (index 4)

      if (!code || code.length < 3 || !description) continue;
      if (!/^[A-Z]\d{2,}/i.test(code)) continue;

      // Only keep unique descriptions
      if (!ptMap.has(code)) {
        ptMap.set(code, description);
      }
    }
  }

  console.log(`   Códigos PT: ${ptMap.size}`);

  // ─── 4. Parse Spanish ───
  console.log('\n4. Processando traduções em Espanhol...');
  const esMap = new Map();

  if (fs.existsSync(esCsv)) {
    const esContent = fs.readFileSync(esCsv, 'utf-8');
    const esLines = esContent.split('\n').filter(l => l.trim());

    // Detect separator (comma or semicolon)
    const firstLine = esLines[0] || '';
    const separator = firstLine.includes(';') ? ';' : ',';

    console.log(`   Separador detectado: "${separator}"`);

    for (const line of esLines) {
      // Parse CSV with separator detection
      const fields = line.split(separator).map(f => f.replace(/^"|"$/g, '').trim());

      if (fields.length < 8) continue;

      // CIE-10 format: code,code_0,code_1,code_2,code_3,code_4,description,level,source
      const code = cleanCode(fields[0]);
      const description = fields[6].trim(); // description is column 7 (index 6)

      if (!code || !description) continue;
      if (!/^[A-Z]\d{2,}/i.test(code)) continue;

      if (!esMap.has(code)) {
        esMap.set(code, description);
      }
    }
  }

  console.log(`   Códigos ES: ${esMap.size}`);

  // ─── 5. Generate CSV ───
  console.log('\n5. Gerando CSV de traduções...');

  // Merge all codes
  const allCodes = new Set([...ptMap.keys(), ...esMap.keys()]);
  const entries = [];

  for (const code of allCodes) {
    const descriptionEs = (esMap.get(code) || '').replace(/"/g, '""');
    const descriptionPt = (ptMap.get(code) || '').replace(/"/g, '""');
    entries.push({ code, descriptionEs, descriptionPt });
  }

  // Sort by code
  entries.sort((a, b) => a.code.localeCompare(b.code));

  // Write CSV
  let csv = 'code,description_es,description_pt\n';
  for (const e of entries) {
    const esField = e.descriptionEs.includes(',') || e.descriptionEs.includes('"') || e.descriptionEs.includes('\n')
      ? `"${e.descriptionEs}"` : e.descriptionEs;
    const ptField = e.descriptionPt.includes(',') || e.descriptionPt.includes('"') || e.descriptionPt.includes('\n')
      ? `"${e.descriptionPt}"` : e.descriptionPt;
    csv += `${e.code},${esField},${ptField}\n`;
  }

  fs.writeFileSync(OUTPUT_CSV, csv, 'utf-8');
  console.log(`\nCSV gerado: ${OUTPUT_CSV}`);
  console.log(`Total de códigos: ${entries.length}`);
  console.log(`  Com tradução ES: ${entries.filter(e => e.descriptionEs).length}`);
  console.log(`  Com tradução PT: ${entries.filter(e => e.descriptionPt).length}`);

  // Cleanup
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log('\nArquivos temporários removidos.');
  } catch (e) {}

  console.log('\nPróximo passo: importar o CSV no Supabase Table Editor');
  console.log('Mapear: code → code, description_es → description_es, description_pt → description_pt');
}

main().catch(console.error);
