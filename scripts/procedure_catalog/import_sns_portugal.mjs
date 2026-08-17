// ============================================================
// Importador SNS Portugal → public.procedure_catalog
// ============================================================
// O SNS (Serviço Nacional de Saúde) publica duas tabelas principais:
//   - Tabela de Meios Complementares de Diagnóstico e Terapêutica (MCDT)
//   - Tabela de Atos Médicos
// Ambas têm layout CSV (separador ;) com colunas:
//   "codigo" / "designacao" (ou "descricao")
//
// As tabelas estão disponíveis em:
//   https://transparencia.sns.gov.pt/explore/dataset/tabela-de-meios-complementares-de-diagnostico-e-terapeutica/
//   https://transparencia.sns.gov.pt/explore/dataset/tabela-de-atos-medicos/
//
// Uso:
//   node scripts/procedure_catalog/import_sns_portugal.mjs \
//        --file caminho/mcdt.csv --nomenclature mcdt [--dry-run]
//   ou:
//   node scripts/procedure_catalog/import_sns_portugal.mjs \
//        --url <url-csv> --nomenclature mcdt
//
// --nomenclature aceita: mcdt | atos (default: mcdt)
//
// Credenciais: .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
// ============================================================

import path from 'path';
import { readDelimited, buildRows, upsertRows, getClient, parseArgs } from './_shared.mjs';

const args = parseArgs(process.argv.slice(2));
const file = args.file;
const url = args.url;
const dryRun = !!args['dry-run'];
const nomenclature = (args.nomenclature ?? 'mcdt').toLowerCase();
const limit = args.limit ? parseInt(args.limit, 10) : 0;

if (!['mcdt', 'atos', 'sns'].includes(nomenclature)) {
  console.error('Erro: --nomenclature deve ser mcdt | atos | sns');
  process.exit(1);
}

const map = {
  mcdt: { col: 'sns', display: 'SNS-MCDT' },
  atos: { col: 'sns', display: 'SNS-ATOS' },
  sns:  { col: 'sns', display: 'SNS' },
};

if (!file && !url) {
  console.error('Erro: informe --file <caminho.csv> ou --url <url-do-csv>');
  process.exit(1);
}

(async () => {
  console.log(`📥 Lendo ${map[nomenclature].display}...`);
  const source = url || file;
  const rows = await readDelimited(source, { delimiter: ';' });
  console.log(`  ${rows.length - 1} linhas detectadas`);

  const dataRows = buildRows(rows, {
    codeCol: 'codigo',
    nameCol: ['designacao', 'descricao'].find((c) =>
      (rows[0] ?? []).some((h) => String(h).toLowerCase() === c)
    ) ?? 'designacao',
    nomenclature: map[nomenclature].col,
    country: 'PT',
    source: url ? `${map[nomenclature].display}_url` : `${map[nomenclature].display}_file:${path.basename(file ?? '')}`,
  });

  const limited = limit > 0 ? dataRows.slice(0, limit) : dataRows;
  console.log(`� Preparado: ${limited.length} procedimentos SNS`);

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
