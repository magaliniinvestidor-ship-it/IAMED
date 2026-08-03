const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'upsert_cid10_translations.sql');
const OUT_DIR = __dirname;
const CHUNK_SIZE = 300;

const content = fs.readFileSync(SRC, 'utf8');
const lines = content.split('\n');

const insertPrefix = lines.find(l => l.startsWith('INSERT INTO'));

// Find all ON CONFLICT blocks and extract them
const onConflictLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('ON CONFLICT')) {
    onConflictLines.push(lines.slice(i, i + 3).join('\n'));
    break;
  }
}
const onConflictSuffix = onConflictLines[0] || 'ON CONFLICT (code) DO UPDATE SET\n  description_es = EXCLUDED.description_es,\n  description_pt = EXCLUDED.description_pt;';

// Collect all row lines (lines that start with whitespace + opening paren)
const rowLines = [];
for (const line of lines) {
  if (/^\s+\('/.test(line)) {
    rowLines.push(line);
  }
}

const totalRows = rowLines.length;
const totalChunks = Math.ceil(totalRows / CHUNK_SIZE);

console.log(`Total rows: ${totalRows}, Chunk size: ${CHUNK_SIZE}, Chunks: ${totalChunks}`);

// Clean up old chunks
for (const f of fs.readdirSync(OUT_DIR)) {
  if (/^upsert_chunk_\d+\.sql$/.test(f)) {
    fs.unlinkSync(path.join(OUT_DIR, f));
  }
}

for (let i = 0; i < totalChunks; i++) {
  const start = i * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, totalRows);
  const chunkRows = rowLines.slice(start, end);
  const chunkNum = i + 1;

  const header = [
    '-- =====================================================',
    `-- UPSERT: Traduções CID-10 - Chunk ${chunkNum}/${totalChunks}`,
    `-- Linhas: ${chunkRows.length}`,
    `-- Data: ${new Date().toISOString().split('T')[0]}`,
    '-- =====================================================',
    '',
  ].join('\n');

  let body = insertPrefix + '\n';
  for (let j = 0; j < chunkRows.length; j++) {
    const row = j === chunkRows.length - 1 ? chunkRows[j].replace(/,$/, '') : chunkRows[j];
    body += row + '\n';
  }
  body += onConflictSuffix;

  const outPath = path.join(OUT_DIR, `upsert_chunk_${chunkNum}.sql`);
  fs.writeFileSync(outPath, header + body, 'utf8');
  const size = fs.statSync(outPath).size;
  console.log(`Chunk ${chunkNum}: ${chunkRows.length} rows, ${(size / 1024).toFixed(1)} KB`);
}

console.log(`\nTotal: ${totalChunks} chunks created`);
