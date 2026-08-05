'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useModuleId } from './useModuleId';
import type { Appointment } from '@/lib/mockData';

export interface UseAppointmentsOptions {
  doctorName?: string;
  patientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  enabled?: boolean;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { doctorName, patientId, status, enabled = true } = options;

  const filters = [];
  if (doctorName) filters.push({ column: 'doctor_name', operator: 'eq' as const, value: doctorName });
  if (patientId) filters.push({ column: 'patient_id', operator: 'eq' as const, value: patientId });
  if (status) filters.push({ column: 'status', operator: 'eq' as const, value: status });

  const { data, loading, error, refetch } = useSupabaseQuery<Appointment>('appointments', {
    select: '*',
    order: { column: 'date', ascending: true },
    filters,
    enabled,
  });

  const genAppointmentId = useModuleId();

  const createAppointment = useCallback(
    async (appt: Partial<Appointment>) => {
      if (!supabase) return null;
      const id = appt.id || (await genAppointmentId('next_appointment_id'));
      const { data: result, error: insertError } = await supabase
        .from('appointments')
        .insert({ ...appt, id, created_at: new Date().toISOString() })
        .select()
        .single();
      if (insertError) {
        if (typeof window !== 'undefined') console.error('[useAppointments.create]', insertError.message);
        return null;
      }
      await refetch();
      return result as Appointment;
    },
    [genAppointmentId, refetch]
  );

  const updateAppointment = useCallback(
    async (id: string, updates: Partial<Appointment>) => {
      if (!supabase) return null;
      const { data: result, error: updateError } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (updateError) {
        if (typeof window !== 'undefined') console.error('[useAppointments.update]', updateError.message);
        return null;
      }
      await refetch();
      return result as Appointment;
    },
    [refetch]
  );

  const deleteAppointment = useCallback(
    async (id: string) => {
      if (!supabase) return false;
      const { error: deleteError } = await supabase.from('appointments').delete().eq('id', id);
      if (deleteError) {
        if (typeof window !== 'undefined') console.error('[useAppointments.delete]', deleteError.message);
        return false;
      }
      await refetch();
      return true;
    },
    [refetch]
  );

  return {
    appointments: (data as Appointment[]) || [],
    loading,
    error,
    refetch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
