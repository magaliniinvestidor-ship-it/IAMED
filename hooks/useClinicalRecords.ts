'use client';

import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useModuleId } from './useModuleId';
import type { Anamnese, SoapNote, Prescription, ExamRequest, Procedure, Diagnosis } from '@/lib/mockData';

export type ClinicalRecordType = 'anamnese' | 'soap_notes' | 'prescriptions' | 'exam_requests' | 'procedures' | 'diagnoses' | 'physical_exams';

export interface UseClinicalRecordsOptions {
  patientId?: string;
  enabled?: boolean;
}

const TABLE_MAP: Record<ClinicalRecordType, string> = {
  anamnese: 'anamnese',
  soap_notes: 'soap_notes',
  prescriptions: 'prescriptions',
  exam_requests: 'exam_requests',
  procedures: 'procedures',
  diagnoses: 'diagnoses',
  physical_exams: 'physical_exams',
};

export function useClinicalRecords<T = Anamnese | SoapNote | Prescription | ExamRequest | Procedure | Diagnosis>(
  type: ClinicalRecordType,
  options: UseClinicalRecordsOptions = {}
) {
  const { patientId, enabled = true } = options;
  const table = TABLE_MAP[type];

  const filters = [];
  if (patientId) filters.push({ column: 'patient_id', operator: 'eq' as const, value: patientId });

  const { data, loading, error, refetch } = useSupabaseQuery<T>(table, {
    select: '*',
    order: { column: 'created_at', ascending: false },
    filters,
    enabled,
  });

  const genId = useModuleId('next_clinical_id');

  const prefixMap: Record<ClinicalRecordType, string> = useMemo(() => ({
    anamnese: 'anam',
    soap_notes: 'soap',
    prescriptions: 'presc',
    exam_requests: 'exam',
    procedures: 'proc',
    diagnoses: 'diag',
    physical_exams: 'pexam',
  }), []);

  const create = useCallback(
    async (record: Partial<T>) => {
      if (!supabase) return null;
      const prefix = prefixMap[type];
      const id = (record as { id?: string }).id || (await genId(prefix));
      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert({ ...record, id, patient_id: patientId, created_at: new Date().toISOString() })
        .select()
        .single();
      if (insertError) {
        if (typeof window !== 'undefined') console.error(`[useClinicalRecords.create:${type}]`, insertError.message);
        return null;
      }
      await refetch();
      return result as T;
    },
    [type, table, patientId, genId, refetch, prefixMap]
  );

  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      if (!supabase) return null;
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (updateError) {
        if (typeof window !== 'undefined') console.error(`[useClinicalRecords.update:${type}]`, updateError.message);
        return null;
      }
      await refetch();
      return result as T;
    },
    [type, table, refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!supabase) return false;
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
      if (deleteError) {
        if (typeof window !== 'undefined') console.error(`[useClinicalRecords.delete:${type}]`, deleteError.message);
        return false;
      }
      await refetch();
      return true;
    },
    [type, table, refetch]
  );

  return {
    records: (data as T[]) || [],
    loading,
    error,
    refetch,
    create,
    update,
    remove,
  };
}
