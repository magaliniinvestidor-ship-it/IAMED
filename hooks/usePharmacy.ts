'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useModuleId } from './useModuleId';

export interface PharmacyItem {
  id: string;
  name: string;
  category?: string;
  presentation?: string;
  manufacturer?: string;
  controlled_category?: string;
  requires_prescription?: boolean;
  min_stock?: number;
  max_stock?: number;
  total_quantity?: number;
  unit?: string;
  unit_cost?: number;
  sale_price?: number;
  active?: boolean;
  created_at?: string;
}

export interface LotControl {
  id: string;
  pharmacy_item_id?: string;
  lot_number?: string;
  expiry_date?: string;
  quantity?: number;
  status?: string;
  manufacturer?: string;
  received_date?: string;
}

export interface StockMovement {
  id: string;
  pharmacy_item_id?: string;
  lot_id?: string;
  type: 'entrada' | 'saida' | 'ajuste' | 'transferencia';
  quantity: number;
  reason?: string;
  patient_id?: string;
  operator?: string;
  date?: string;
}

export function usePharmacy(options: { activeOnly?: boolean; enabled?: boolean } = {}) {
  const { activeOnly = false, enabled = true } = options;

  const filters = activeOnly ? [{ column: 'active', operator: 'eq' as const, value: true }] : [];

  const itemsQuery = useSupabaseQuery<PharmacyItem>('pharmacy_items', {
    select: '*',
    order: { column: 'name', ascending: true },
    filters,
    enabled,
  });

  const lotsQuery = useSupabaseQuery<LotControl>('lot_controls', {
    select: '*',
    order: { column: 'expiry_date', ascending: true },
    enabled,
  });

  const movementsQuery = useSupabaseQuery<StockMovement>('stock_movements', {
    select: '*',
    order: { column: 'date', ascending: false },
    limit: 100,
    enabled,
  });

  const genModuleId = useModuleId();

  const createItem = useCallback(
    async (item: Partial<PharmacyItem>) => {
      if (!supabase) return null;
      const id = item.id || (await genModuleId('pharm'));
      const { data, error } = await supabase
        .from('pharmacy_items')
        .insert({ ...item, id, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[usePharmacy.createItem]', error.message);
        return null;
      }
      await itemsQuery.refetch();
      return data as PharmacyItem;
    },
    [genModuleId, itemsQuery]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<PharmacyItem>) => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('pharmacy_items')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[usePharmacy.updateItem]', error.message);
        return null;
      }
      await itemsQuery.refetch();
      return data as PharmacyItem;
    },
    [itemsQuery]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!supabase) return false;
      const { error } = await supabase.from('pharmacy_items').delete().eq('id', id);
      if (error) {
        if (typeof window !== 'undefined') console.error('[usePharmacy.deleteItem]', error.message);
        return false;
      }
      await itemsQuery.refetch();
      return true;
    },
    [itemsQuery]
  );

  const recordMovement = useCallback(
    async (movement: Partial<StockMovement>) => {
      if (!supabase) return null;
      const id = movement.id || (await genModuleId('mov'));
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({ ...movement, id, date: movement.date || new Date().toISOString() })
        .select()
        .single();
      if (error) {
        if (typeof window !== 'undefined') console.error('[usePharmacy.recordMovement]', error.message);
        return null;
      }
      await movementsQuery.refetch();
      return data as StockMovement;
    },
    [genModuleId, movementsQuery]
  );

  return {
    items: (itemsQuery.data as PharmacyItem[]) || [],
    lots: (lotsQuery.data as LotControl[]) || [],
    movements: (movementsQuery.data as StockMovement[]) || [],
    loading: itemsQuery.loading || lotsQuery.loading || movementsQuery.loading,
    error: itemsQuery.error || lotsQuery.error || movementsQuery.error,
    refetch: itemsQuery.refetch,
    createItem,
    updateItem,
    deleteItem,
    recordMovement,
  };
}
