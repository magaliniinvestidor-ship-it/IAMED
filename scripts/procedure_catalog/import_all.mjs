// ============================================================
// Runner: importa os quatro catálogos em sequência.
// ============================================================
// Uso:
//   node scripts/procedure_catalog/import_all.mjs \
//        --sigtap ./dados/tb_procedimento.csv \
//        --tuss ./dados/tuss.csv \
//        --sns ./dados/sns_mcdt.csv \
//        --ips ./dados/ips.csv \
//        [--dry-run]
//
// Qualquer um dos argumentos é opcional — passe apenas o que tiver.
// ============================================================

import { spawnSync } from 'node:child_process';
import path from 'path';

const args = process.argv.slice(2);
const map = {
  '--sigtap': ['import_sigtap.mjs', '--file'],
  '--tuss':   ['import_tuss_cbhpm.mjs', '--file'],
  '--sns':    ['import_sns_portugal.mjs', '--file'],
  '--ips':    ['import_ips_paraguay.mjs', '--file'],
};

const dryRun = args.includes('--dry-run');
const filtered = args.filter((a) => !a.startsWith('--') || a === '--dry-run');

const targets = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a in map) {
    const file = args[i + 1];
    if (!file || file.startsWith('--')) {
      console.error(`Faltou arquivo para ${a}`);
      process.exit(1);
    }
    targets.push({ script: map[a][0], args: [map[a][1], file] });
    i++;
  }
}

if (targets.length === 0) {
  console.error('Nada para fazer. Passe ao menos --sigtap <arquivo>.');
  process.exit(1);
}

let failed = 0;
for (const t of targets) {
  const scriptPath = path.resolve(process.cwd(), 'scripts/procedure_catalog', t.script);
  console.log(`\n▶ ${scriptPath} ${t.args.join(' ')} ${dryRun ? '--dry-run' : ''}`);
  const res = spawnSync('node', [scriptPath, ...t.args, ...(dryRun ? ['--dry-run'] : [])], {
    stdio: 'inherit',
  });
  if (res.status !== 0) failed++;
}

if (failed > 0) {
  console.error(`\n❌ ${failed} script(s) falharam.`);
  process.exit(1);
}
console.log('\n✅ Todos os catálogos foram processados.');
