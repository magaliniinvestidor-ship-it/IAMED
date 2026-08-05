'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook centralizado para geração de IDs sequenciais via Postgres RPC.
 *
 * Usa `next_module_id(p_prefix)` para módulos gerais (4–21) e
 * `next_clinical_id(p_prefix)` para o módulo clínico (HCE).
 *
 * Nunca gera IDs no front-end com Date.now(), Math.max() etc.
 * Em caso de falha de conexão, retorna fallback estático `${prefix}_0001`.
 */

type RpcFunction = 'next_module_id' | 'next_clinical_id';

export function useModuleId(rpcFunction: RpcFunction = 'next_module_id') {
  const genId = useCallback(async (prefix: string): Promise<string> => {
    if (!supabase) {
      console.error(`[useModuleId] Supabase não inicializado para gerar ID (${prefix})`);
      return `${prefix}_0001`;
    }
    const { data, error } = await supabase.rpc(rpcFunction, { p_prefix: prefix });
    if (error || !data) {
      console.error(`[useModuleId] Falha ao gerar ID via RPC (${prefix}):`, error?.message);
      return `${prefix}_0001`;
    }
    return data as string;
  }, [rpcFunction]);

  return genId;
}
