'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useModuleId } from './useModuleId';
import type { InsuranceCompany } from '@/lib/mockData';

export interface Dte {
  id: string;
  cdc?: string;
  type?: string;
  number?: string;
  timbrado?: string;
  establishment?: string;
  expedition_point?: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  ruc?: string;
  date?: string;
  amount?: number;
  iva_5?: number;
  iva_10?: number;
  environment?: 'homologacao' | 'producao';
  status?: string;
  payment_gateway?: string;
  payment_status?: string;
  items?: unknown[];
  created_at?: string;
}

export interface FinancialPosting {
  id: string;
  description?: string;
  type: 'receita' | 'despesa';
  amount: number;
  category?: string;
  date?: string;
  patient_id?: string;
}

export type Insurance = InsuranceCompany;

export function useFinance(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const dtesQuery = useSupabaseQuery<Dte>('dtes', {
    select: '*',
    order: { column: 'created_at', ascending: false },
    limit: 200,
    enabled,
  });

  const postingsQuery = useSupabaseQuery<FinancialPosting>('financial_postings', {
    select: '*',
    order: { column: 'date', ascending: false },
    limit: 200,
    enabled,
  });

  const insurancesQuery = useSupabaseQuery<Insurance>('insurance_companies', {
    select: '*',
    order: { column: 'name', ascending: true },
    enabled,
  });

  const genModuleId = useModuleId();

  const createDte = useCallback(
    async (dte: Partial<Dte>) => {
      if (!supabase) return null;
      const id = dte.id || (await genModuleId('dte'));
      const { data, error } = await supabase
        .from('dtes')
        .insert({ ...dte, id, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useFinance.createDte]', error.message);
        return null;
      }
      await dtesQuery.refetch();
      return data as Dte;
    },
    [genModuleId, dtesQuery]
  );

  const updateDte = useCallback(
    async (id: string, updates: Partial<Dte>) => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('dtes')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useFinance.updateDte]', error.message);
        return null;
      }
      await dtesQuery.refetch();
      return data as Dte;
    },
    [dtesQuery]
  );

  const deleteDte = useCallback(
    async (id: string) => {
      if (!supabase) return false;
      const { error } = await supabase.from('dtes').delete().eq('id', id);
      if (error) {
        if (typeof window !== 'undefined') console.error('[useFinance.deleteDte]', error.message);
        return false;
      }
      await dtesQuery.refetch();
      return true;
    },
    [dtesQuery]
  );

  const createPosting = useCallback(
    async (posting: Partial<FinancialPosting>) => {
      if (!supabase) return null;
      const id = posting.id || (await genModuleId('fin'));
      const { data, error } = await supabase
        .from('financial_postings')
        .insert({ ...posting, id, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useFinance.createPosting]', error.message);
        return null;
      }
      await postingsQuery.refetch();
      return data as FinancialPosting;
    },
    [genModuleId, postingsQuery]
  );

  const createInsurance = useCallback(
    async (insurance: Partial<Insurance>) => {
      if (!supabase) return null;
      const id = insurance.id || (await genModuleId('ins'));
      const { data, error } = await supabase
        .from('insurance_companies')
        .insert({ ...insurance, id, active: insurance.active ?? true, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useFinance.createInsurance]', error.message);
        return null;
      }
      await insurancesQuery.refetch();
      return data as Insurance;
    },
    [genModuleId, insurancesQuery]
  );

  const updateInsurance = useCallback(
    async (id: string, updates: Partial<Insurance>) => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('insurance_companies')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[useFinance.updateInsurance]', error.message);
        return null;
      }
      await insurancesQuery.refetch();
      return data as Insurance;
    },
    [insurancesQuery]
  );

  return {
    dtes: (dtesQuery.data as Dte[]) || [],
    postings: (postingsQuery.data as FinancialPosting[]) || [],
    insurances: (insurancesQuery.data as Insurance[]) || [],
    loading: dtesQuery.loading || postingsQuery.loading || insurancesQuery.loading,
    error: dtesQuery.error || postingsQuery.error || insurancesQuery.error,
    refetch: dtesQuery.refetch,
    createDte,
    updateDte,
    deleteDte,
    createPosting,
    createInsurance,
    updateInsurance,
  };
}
