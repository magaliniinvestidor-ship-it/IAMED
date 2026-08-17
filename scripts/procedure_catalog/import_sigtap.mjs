// ============================================================
// Importador SIGTAP (SUS, Brasil) → public.procedure_catalog
// ============================================================
// O SIGTAP é publicado mensalmente em
//   http://sigtap.datasus.gov.br/tabela-unificada/app/sig/000/01/00/00-0000-00-0.html
// O arquivo é um ZIP contendo vários CSVs (layout tabular do
// DATASUS, codificado em Latin-1, separado por ponto e vírgula).
// O CSV relevante para procedimentos é "tb_procedimento.csv"
// (ou "PROCEDIMENTOS.csv" dependendo da versão do release), com
// as colunas:
//   CO_PROCEDIMENTO   — código de 10 dígitos
//   NO_PROCEDIMENTO   — descrição
//   CO_GRUPO / NO_GRUPO, CO_SUB_GRUPO / NO_SUB_GRUPO, etc.
//
// Uso:
//   1) Baixe manualmente o ZIP do SIGTAP do site do DATASUS
//      (ou passe uma URL direta para o CSV com --url).
//   2) Extraia o CSV desejado e rode:
//        node scripts/procedure_catalog/import_sigtap.mjs \
//             --file caminho/tb_procedimento.csv [--dry-run] [--limit 1000]
//   3) Ou, se preferir que o script baixe a versão pública:
//        node scripts/procedure_catalog/import_sigtap.mjs --url <url-csv>
//
// Credenciais: .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
// ============================================================

import path from 'path';
import { readDelimited, buildRows, upsertRows, getClient, parseArgs } from './_shared.mjs';

const args = parseArgs(process.argv.slice(2));
const file = args.file;
const url = args.url;
const dryRun = !!args['dry-run'];
const limit = args.limit ? parseInt(args.limit, 10) : 0;

if (!file && !url) {
  console.error('Erro: informe --file <caminho.csv> ou --url <url-do-csv>');
  process.exit(1);
}

(async () => {
  console.log('📥 Lendo SIGTAP...');
  const source = url || file;
  const rows = await readDelimited(source, { delimiter: ';' });
  console.log(`  ${rows.length - 1} linhas detectadas`);

  const dataRows = buildRows(rows, {
    codeCol: 'CO_PROCEDIMENTO',
    nameCol: 'NO_PROCEDIMENTO',
    categoryCol: 'NO_GRUPO',
    nomenclature: 'sigtap',
    country: 'BR',
    source: url ? 'datasus_url' : `datasus_file:${path.basename(file ?? '')}`,
  });

  const limited = limit > 0 ? dataRows.slice(0, limit) : dataRows;
  console.log(`🔄 Preparado: ${limited.length} procedimentos SIGTAP`);

  if (!dryRun) {
    const supabase = getClient();
    const inserted = await upsertRows(supabase, limited, { dryRun: false });
    console.log(`✅ ${inserted} registros atualizados em procedure_catalog`);
  } else {
    console.log(`🟡 dry-run: nenhum dado gravado.`);
    console.log(JSON.stringify(limited.slice(0, 3), null, 2));
  }
})().catch((err) => {
  console.error('❌ Falha:', err.message);
  process.exit(1);
});
