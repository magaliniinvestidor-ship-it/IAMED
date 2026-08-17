// ============================================================
// Importador IPS Paraguay (template) → public.procedure_catalog
// ============================================================
// O IPS (Instituto de Previsión Social) do Paraguai mantém o seu
// próprio nomenclador de procedimentos, mas não há URL pública
// estável para download automatizado. Por isso este script aceita
// um CSV local gerado a partir da tabela oficial (fornecida pelo
// usuário).
//
// Formato esperado do CSV (cabeçalho obrigatório, separador ;):
//   codigo;descricao;categoria;financiador
//   010101;Consulta clínica ambulatoria;Consulta;IPS
//   ...
//
// Uso:
//   1) Salve a tabela do IPS em CSV com as colunas acima.
//   2) Rode:
//        node scripts/procedure_catalog/import_ips_paraguay.mjs \
//             --file caminho/ips.csv [--dry-run] [--limit 1000]
//      Para outras entidades financiadoras (Sanidade Militar,
//      Sanidade Policial, EMP), use --financiador "<nome>".
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
const financiador = args.financiador ?? 'IPS';

if (!file && !url) {
  console.error('Erro: informe --file <caminho.csv> ou --url <url-do-csv>');
  process.exit(1);
}

(async () => {
  console.log(`� Lendo tabela do financiador "${financiador}"...`);
  const source = url || file;
  const rows = await readDelimited(source, { delimiter: ';' });
  console.log(`  ${rows.length - 1} linhas detectadas`);

  const dataRows = buildRows(rows, {
    codeCol: 'codigo',
    nameCol: 'descricao',
    categoryCol: 'categoria',
    financingCol: 'financiador',
    nomenclature: 'ips',
    country: 'PY',
    financingEntity: financiador,
    source: url ? `${financiador}_url` : `${financiador}_file:${path.basename(file ?? '')}`,
  });

  const limited = limit > 0 ? dataRows.slice(0, limit) : dataRows;
  console.log(`🔄 Preparado: ${limited.length} procedimentos do ${financiador}`);

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
