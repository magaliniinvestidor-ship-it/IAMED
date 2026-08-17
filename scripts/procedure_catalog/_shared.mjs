// ============================================================
// Utilitários compartilhados pelos scripts de importação
// de catálogos de procedimento (SIGTAP / TUSS-CBHPM / SNS / IPS).
// ============================================================

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const TABLE = 'procedure_catalog';
const BATCH_SIZE = 500;

export function readEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '..', '.env.local'),
  ];
  const vars = {};
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in vars)) vars[key] = val;
    });
  }
  return vars;
}

export function getClient() {
  const env = readEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

// Lê CSV/TSV a partir de arquivo local ou URL.
export async function readDelimited(source, { delimiter = ';' } = {}) {
  let text;
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Falha ao baixar ${source}: HTTP ${res.status}`);
    text = await res.text();
  } else {
    if (!fs.existsSync(source)) throw new Error(`Arquivo não encontrado: ${source}`);
    text = fs.readFileSync(source, 'utf8');
  }
  return parseDelimited(text, delimiter);
}

export function parseDelimited(text, delimiter = ';') {
  // Parser simples: suporta aspas duplas escapadas ("" → ").
  const rows = [];
  let cur = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        cur.push(field);
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        cur.push(field);
        field = '';
        if (cur.some((c) => c.length > 0)) rows.push(cur);
        cur = [];
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    if (cur.some((c) => c.length > 0)) rows.push(cur);
  }
  return rows;
}

export function buildRows(rows, { codeCol, nameCol, categoryCol, financingCol, nomenclature, country, financingEntity, source }) {
  // Detecta o índice do cabeçalho (assume primeira linha não vazia como header).
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const findIdx = (col) => {
    if (typeof col === 'number') return col;
    const target = String(col).toLowerCase();
    return header.findIndex((h) => h.toLowerCase() === target);
  };
  const codeIdx = findIdx(codeCol);
  const nameIdx = findIdx(nameCol);
  const catIdx = categoryCol ? findIdx(categoryCol) : -1;
  const finIdx = financingCol ? findIdx(financingCol) : -1;
  if (codeIdx === -1 || nameIdx === -1) {
    throw new Error(`Cabeçalho não contém colunas esperadas (code=${codeCol}, name=${nameCol}). Header: ${header.join('|')}`);
  }
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const code = (r[codeIdx] ?? '').trim();
    const name = (r[nameIdx] ?? '').trim();
    if (!code || !name) continue;
    out.push({
      code,
      name,
      nomenclature,
      category: catIdx >= 0 ? (r[catIdx] ?? '').trim() || null : null,
      country,
      financing_entity: finIdx >= 0 ? (r[finIdx] ?? '').trim() || financingEntity || null : (financingEntity || null),
      is_active: true,
      source,
      source_updated_at: new Date().toISOString().slice(0, 10),
    });
  }
  return out;
}

export async function upsertRows(supabase, rows, { dryRun = false, batchSize = BATCH_SIZE } = {}) {
  if (rows.length === 0) return 0;
  if (dryRun) {
    console.log(`[dry-run] ${rows.length} registros prontos para upsert em ${TABLE}.`);
    console.log(JSON.stringify(rows.slice(0, 3), null, 2));
    return rows.length;
  }
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(TABLE)
      .upsert(batch, { onConflict: 'nomenclature,code', ignoreDuplicates: false });
    if (error) throw new Error(`Upsert falhou no lote ${i}-${i + batch.length}: ${error.message}`);
    inserted += batch.length;
    console.log(`  ✓ Lote ${i + batch.length}/${rows.length}`);
  }
  return inserted;
}

export function nowIso() {
  return new Date().toISOString();
}
