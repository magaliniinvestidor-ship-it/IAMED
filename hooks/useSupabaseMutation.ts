'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type MutationType = 'insert' | 'update' | 'delete' | 'upsert';

export interface MutationOptions<TData = unknown> {
  table: string;
  type: MutationType;
  data?: TData | TData[];
  match?: Record<string, unknown>;
}

export interface MutationResult<TData = unknown> {
  data: TData | null;
  loading: boolean;
  error: Error | null;
  execute: (opts?: Partial<MutationOptions<TData>>) => Promise<TData | null>;
  reset: () => void;
}

export function useSupabaseMutation<TData = unknown>(
  defaultOptions?: MutationOptions<TData>
): MutationResult<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (opts?: Partial<MutationOptions<TData>>): Promise<TData | null> => {
      const options = { ...defaultOptions, ...opts };
      if (!options.table || !options.type) {
        const err = new Error('useSupabaseMutation: table e type são obrigatórios');
        setError(err);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        if (!supabase) throw new Error('Supabase não inicializado');

        let query = supabase.from(options.table);
        let result;

        switch (options.type) {
          case 'insert': {
            const insertQuery = query.insert(options.data as never);
            result = await insertQuery.select();
            break;
          }
          case 'update': {
            if (!options.match) throw new Error('update requer match');
            let updateQuery: ReturnType<typeof supabase.from> = supabase.from(options.table);
            for (const [col, val] of Object.entries(options.match)) {
              updateQuery = (updateQuery as unknown as { eq: (c: string, v: unknown) => typeof updateQuery }).eq(col, val);
            }
            result = await (updateQuery as unknown as { update: (d: unknown) => { select: () => Promise<{ data: unknown; error: unknown }> } }).update(options.data).select();
            break;
          }
          case 'upsert': {
            const upsertQuery = query.upsert(options.data as never);
            result = await upsertQuery.select();
            break;
          }
          case 'delete': {
            if (!options.match) throw new Error('delete requer match');
            let deleteQuery: ReturnType<typeof supabase.from> = supabase.from(options.table);
            for (const [col, val] of Object.entries(options.match)) {
              deleteQuery = (deleteQuery as unknown as { eq: (c: string, v: unknown) => typeof deleteQuery }).eq(col, val);
            }
            result = await (deleteQuery as unknown as { delete: () => { select: () => Promise<{ data: unknown; error: unknown }> } }).delete().select();
            break;
          }
        }

        if (result?.error) throw result.error;

        const resultData = (result?.data as TData) ?? null;
        setData(resultData);
        return resultData;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        if (typeof window !== 'undefined') {
          console.error(`[useSupabaseMutation] ${options.table}.${options.type}:`, errorObj.message);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [defaultOptions]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
