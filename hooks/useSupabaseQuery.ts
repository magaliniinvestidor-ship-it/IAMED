/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface QueryOptions {
  select?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  filters?: QueryFilter[];
  single?: boolean;
  enabled?: boolean;
}

export interface QueryFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: unknown;
}

export interface QueryResult<T> {
  data: T[] | T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T = unknown>(
  table: string,
  options: QueryOptions = {}
): QueryResult<T> {
  const { select = '*', order, limit, filters = [], single = false, enabled = true } = options;

  const [data, setData] = useState<T[] | T | null>(single ? null : []);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const filtersKey = JSON.stringify(filters);
  const orderKey = JSON.stringify(order);

  const fetchData = useCallback(async (): Promise<void> => {
    if (!supabase || !enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select);      for (const filter of filters) {
        const op = filter.operator;
        if (op === 'is') query = query.is(filter.column, filter.value);
        else if (op === 'eq') query = query.eq(filter.column, filter.value);
        else if (op === 'neq') query = query.neq(filter.column, filter.value);
        else if (op === 'gt') query = query.gt(filter.column, filter.value);
        else if (op === 'gte') query = query.gte(filter.column, filter.value);
        else if (op === 'lt') query = query.lt(filter.column, filter.value);
        else if (op === 'lte') query = query.lte(filter.column, filter.value);
        else if (op === 'like') query = query.like(filter.column, String(filter.value));
        else if (op === 'ilike') query = query.ilike(filter.column, String(filter.value));
        else if (op === 'in') query = query.in(filter.column, filter.value as string[]);
      }

      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const result = single ? await query.single() : await query;
      if (result.error) throw result.error;
      setData(single ? (result.data as T) : (result.data as T[]));
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      if (typeof window !== 'undefined') {
        console.error(`[useSupabaseQuery] ${table}:`, errorObj.message);
      }
    } finally {
      setLoading(false);
    }
  }, [table, select, limit, single, enabled, filtersKey, orderKey]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
