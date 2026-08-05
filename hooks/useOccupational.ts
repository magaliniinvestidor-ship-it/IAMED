'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useModuleId } from './useModuleId';

export interface Empresa {
  id: string;
  razao_social: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  setor?: string;
  numero_funcionarios?: number;
  representante?: string;
  email?: string;
  telefone?: string;
  ativa?: boolean;
}

export interface Trabalhador {
  id: string;
  empresa_id?: string;
  nome: string;
  ci?: string;
  data_nascimento?: string;
  genero?: string;
  funcao?: string;
  data_admissao?: string;
  telefone?: string;
  email?: string;
  status?: string;
}

export interface ExameOcupacional {
  id: string;
  trabalhador_id?: string;
  tipo?: string;
  data?: string;
  medico_responsavel?: string;
  resultado?: string;
  apto?: boolean;
  restricoes?: string;
}

export interface CalCertificado {
  id: string;
  trabalhador_id?: string;
  empresa_id?: string;
  numero_cal?: string;
  data_emissao?: string;
  data_validade?: string;
  medico?: string;
  apto?: boolean;
  status?: string;
}

export function useOccupational(options: { empresaId?: string; enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const empresasQuery = useSupabaseQuery<Empresa>('mt_empresas', {
    select: '*',
    order: { column: 'razao_social', ascending: true },
    enabled,
  });

  const filters = options.empresaId
    ? [{ column: 'empresa_id', operator: 'eq' as const, value: options.empresaId }]
    : [];

  const trabalhadoresQuery = useSupabaseQuery<Trabalhador>('mt_trabalhadores', {
    select: '*',
    order: { column: 'nome', ascending: true },
    filters,
    enabled,
  });

  const examesQuery = useSupabaseQuery<ExameOcupacional>('mt_exames_ocupacionais', {
    select: '*',
    order: { column: 'data', ascending: false },
    limit: 200,
    enabled,
  });

  const calsQuery = useSupabaseQuery<CalCertificado>('mt_cal_certs', {
    select: '*',
    order: { column: 'data_emissao', ascending: false },
    limit: 200,
    enabled,
  });

  const genModuleId = useModuleId();

  const createEmpresa = useCallback(
    async (empresa: Partial<Empresa>) => {
      if (!supabase) return null;
      const id = empresa.id || (await genModuleId('emp'));
      const { data, error } = await supabase
        .from('mt_empresas')
        .insert({ ...empresa, id, ativa: empresa.ativa ?? true, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useOccupational.createEmpresa]', error.message);
        return null;
      }
      await empresasQuery.refetch();
      return data as Empresa;
    },
    [genModuleId, empresasQuery]
  );

  const createTrabalhador = useCallback(
    async (trab: Partial<Trabalhador>) => {
      if (!supabase) return null;
      const id = trab.id || (await genModuleId('trab'));
      const { data, error } = await supabase
        .from('mt_trabalhadores')
        .insert({ ...trab, id, status: trab.status ?? 'ativo', created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useOccupational.createTrabalhador]', error.message);
        return null;
      }
      await trabalhadoresQuery.refetch();
      return data as Trabalhador;
    },
    [genModuleId, trabalhadoresQuery]
  );

  const createExame = useCallback(
    async (exame: Partial<ExameOcupacional>) => {
      if (!supabase) return null;
      const id = exame.id || (await genModuleId('ex'));
      const { data, error } = await supabase
        .from('mt_exames_ocupacionais')
        .insert({ ...exame, id, apto: exame.apto ?? true, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useOccupational.createExame]', error.message);
        return null;
      }
      await examesQuery.refetch();
      return data as ExameOcupacional;
    },
    [genModuleId, examesQuery]
  );

  const createCal = useCallback(
    async (cal: Partial<CalCertificado>) => {
      if (!supabase) return null;
      const id = cal.id || (await genModuleId('cal'));
      const { data, error } = await supabase
        .from('mt_cal_certs')
        .insert({ ...cal, id, apto: cal.apto ?? true, status: cal.status ?? 'ativo', created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useOccupational.createCal]', error.message);
        return null;
      }
      await calsQuery.refetch();
      return data as CalCertificado;
    },
    [genModuleId, calsQuery]
  );

  return {
    empresas: (empresasQuery.data as Empresa[]) || [],
    trabalhadores: (trabalhadoresQuery.data as Trabalhador[]) || [],
    exames: (examesQuery.data as ExameOcupacional[]) || [],
    cals: (calsQuery.data as CalCertificado[]) || [],
    loading:
      empresasQuery.loading ||
      trabalhadoresQuery.loading ||
      examesQuery.loading ||
      calsQuery.loading,
    error:
      empresasQuery.error ||
      trabalhadoresQuery.error ||
      examesQuery.error ||
      calsQuery.error,
    refetch: empresasQuery.refetch,
    createEmpresa,
    createTrabalhador,
    createExame,
    createCal,
  };
}
