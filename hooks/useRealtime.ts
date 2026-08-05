/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface RealtimeOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: { column: string; value: unknown };
  enabled?: boolean;
}

export interface RealtimeEvent<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
}

export function useRealtime<T = unknown>(
  table: string,
  options: RealtimeOptions = {}
) {
  const { event = '*', filter, enabled = true } = options;
  const [events, setEvents] = useState<RealtimeEvent<T>[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const handleInsert = useCallback((payload: RealtimeEvent<T>) => {
    setEvents((prev) => [payload, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    if (!supabase || !enabled) return;

    const filterStr = filter ? `${filter.column}=eq.${filter.value}` : undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any)
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, filter: filterStr },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          handleInsert({
            eventType: payload.eventType,
            new: payload.new as T,
            old: payload.old as Partial<T>,
          });
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).removeChannel(channel);
      setIsConnected(false);
    };
  }, [table, event, filter?.column, filter?.value, enabled, handleInsert]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, isConnected, clearEvents };
}
