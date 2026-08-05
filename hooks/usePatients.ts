'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { useModuleId } from './useModuleId';
import type { Patient } from '@/lib/mockData';

export interface UsePatientsOptions {
  status?: string;
  search?: string;
  enabled?: boolean;
}

export function usePatients(options: UsePatientsOptions = {}) {
  const { status, enabled = true } = options;

  const filters = [];
  if (status) filters.push({ column: 'status', operator: 'eq' as const, value: status });

  const { data, loading, error, refetch } = useSupabaseQuery<Patient>('patients', {
    select: '*',
    order: { column: 'name', ascending: true },
    filters,
    enabled,
  });

  const genPatientId = useModuleId();

  const createPatient = useCallback(
    async (patient: Partial<Patient>) => {
      if (!supabase) return null;
      const id = patient.id || (await genPatientId('next_patient_id').then((r: string | null) => r?.replace('PAC', 'PAC') ?? `PAC${Date.now()}`));
      const { data: result, error: insertError } = await supabase
        .from('patients')
        .insert({ ...patient, id, created_at: new Date().toISOString() })
        .select()
        .single();
      if (insertError) {
        if (typeof window !== 'undefined') console.error('[usePatients.create]', insertError.message);
        return null;
      }
      await refetch();
      return result as Patient;
    },
    [genPatientId, refetch]
  );

  const updatePatient = useCallback(
    async (id: string, updates: Partial<Patient>) => {
      if (!supabase) return null;
      const { data: result, error: updateError } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (updateError) {
        if (typeof window !== 'undefined') console.error('[usePatients.update]', updateError.message);
        return null;
      }
      await refetch();
      return result as Patient;
    },
    [refetch]
  );

  const deletePatient = useCallback(
    async (id: string) => {
      if (!supabase) return false;
      const { error: deleteError } = await supabase.from('patients').delete().eq('id', id);
      if (deleteError) {
        if (typeof window !== 'undefined') console.error('[usePatients.delete]', deleteError.message);
        return false;
      }
      await refetch();
      return true;
    },
    [refetch]
  );

  return {
    patients: (data as Patient[]) || [],
    loading,
    error,
    refetch,
    createPatient,
    updatePatient,
    deletePatient,
  };
}
