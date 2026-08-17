// ============================================================
// Importador TUSS-CBHPM (setor suplementar, Brasil) → procedure_catalog
// ============================================================
// A TUSS (Terminologia Unificada da Saúde Suplementar) é mantida
// pela ANS e reflete os códigos da CBHPM/AMB para procedimentos
// médicos. É publicada em CSV com as colunas principais:
//   "Código TUSS"  — código de 8 dígitos
//   "Procedimento" — descrição
//   (opcionalmente coluna de "Grupo" para a categoria)
//
// URL pública de referência (atualizar quando a ANS republicar):
//   https://www.gov.br/ans/pt-br/arquivos/assuntos/prestadores/tuss
//
// Uso:
//   node scripts/procedure_catalog/import_tuss_cbhpm.mjs \
//        --file caminho/tuss.csv [--dry-run] [--limit 1000]
//   ou:
//   node scripts/procedure_catalog/import_tuss_cbhpm.mjs --url <url-csv>
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
  console.log('📥 Lendo TUSS-CBHPM...');
  const source = url || file;
  const rows = await readDelimited(source, { delimiter: ';' });
  console.log(`  ${rows.length - 1} linhas detectadas`);

  const dataRows = buildRows(rows, {
    codeCol: 'Código TUSS',
    nameCol: 'Procedimento',
    categoryCol: 'Grupo',
    nomenclature: 'cbhpm',
    country: 'BR',
    source: url ? 'ans_url' : `ans_file:${path.basename(file ?? '')}`,
  });

  const limited = limit > 0 ? dataRows.slice(0, limit) : dataRows;
  console.log(`🔄 Preparado: ${limited.length} procedimentos TUSS-CBHPM`);

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
