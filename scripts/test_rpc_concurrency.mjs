// Teste automatizado: concorrência na geração de IDs via RPC
// Executa N inserções simultâneas e verifica que não há colisão

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testRpc(label, fn) {
  const ids = new Set();
  const errors = [];
  const N = 8;

  const promises = Array.from({ length: N }, async () => {
    try {
      const id = await fn();
      if (!id) throw new Error('ID vazio');
      if (ids.has(id)) throw new Error(`DUPLICATA: ${id}`);
      ids.add(id);
    } catch (e) {
      errors.push(e.message || String(e));
    }
  });

  await Promise.all(promises);

  console.log(`\n=== ${label} ===`);
  console.log(`Sucesso: ${ids.size}/${N} IDs únicos`);
  if (errors.length > 0) {
    console.log(`Erros: ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  const sorted = Array.from(ids).sort();
  if (sorted.length > 0) {
    console.log(`Primeiro: ${sorted[0]}`);
    console.log(`Último:   ${sorted[sorted.length - 1]}`);
  }
  return { total: ids.size, errors: errors.length, ids: sorted };
}

async function main() {
  console.log('Testando RPCs de geração de IDs...');
  console.log(`URL: ${SUPABASE_URL}`);

  const results = {
    presc: await testRpc('next_clinical_id(presc)', async () => {
      const { data, error } = await supabase.rpc('next_clinical_id', { p_prefix: 'presc' });
      if (error) throw error;
      return data;
    }),
    soap: await testRpc('next_clinical_id(soap)', async () => {
      const { data, error } = await supabase.rpc('next_clinical_id', { p_prefix: 'soap' });
      if (error) throw error;
      return data;
    }),
    patient: await testRpc('next_patient_id()', async () => {
      const { data, error } = await supabase.rpc('next_patient_id');
      if (error) throw error;
      return data;
    }),
    appointment: await testRpc('next_appointment_id()', async () => {
      const { data, error } = await supabase.rpc('next_appointment_id');
      if (error) throw error;
      return data;
    }),
  };

  const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);
  const totalIds = Object.values(results).reduce((sum, r) => sum + r.total, 0);
  console.log(`\n========= RESUMO =========`);
  console.log(`Total IDs gerados: ${totalIds}`);
  console.log(`Total erros: ${totalErrors}`);
  console.log(`Status: ${totalErrors === 0 ? '✅ SUCESSO' : '❌ FALHA'}`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
