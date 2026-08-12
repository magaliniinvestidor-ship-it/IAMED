'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import { filterSnomedByQuery, resolveSnomedTerm } from './resolve';
import type { SnomedConcept, SnomedSearchOptions } from './types';

const SUPABASE_TABLE = 'snomed_concepts';
const COLUMNS = 'concept_id, preferred_term, term_pt, term_es, term_en, cid10_code, semantic_axis, is_active, rxnorm_code, inn, atc_code';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

interface ConceptCache {
  ts: number;
  data: SnomedConcept[];
}

const cache = new Map<string, ConceptCache>();

function readCache(key: string): SnomedConcept[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function writeCache(key: string, data: SnomedConcept[]) {
  cache.set(key, { ts: Date.now(), data });
}

export interface SnomedResolvedItem {
  concept: SnomedConcept;
  term: string;
  bundle: 'pt' | 'es' | 'en' | 'preferred';
}

export interface UseSnomedSearchResult {
  items: SnomedResolvedItem[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clear: () => void;
  resolveById: (conceptId: number) => Promise<SnomedResolvedItem | null>;
  resolveByCid10: (cid10Code: string) => Promise<SnomedResolvedItem | null>;
  mapCid10ToSnomed: (cid10Code: string) => Promise<SnomedResolvedItem[]>;
}

export function useSnomedSearch(options: SnomedSearchOptions = {}): UseSnomedSearchResult {
  const { locale } = useI18n();
  const { limit = 50, semanticAxis, activeOnly = true } = options;
  const [query, setQuery] = useState('');
  const [rawItems, setRawItems] = useState<SnomedConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runFetch = useCallback(
    async (currentQuery: string, signal: AbortSignal) => {
      if (!supabase) {
        setRawItems([]);
        setLoading(false);
        return;
      }
      const cacheKey = `q::${currentQuery.trim().toLowerCase()}::a=${semanticAxis ?? '*'}::o=${activeOnly ? '1' : '0'}`;
      const cached = readCache(cacheKey);
      if (cached) {
        setRawItems(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let builder = supabase
          .from(SUPABASE_TABLE)
          .select(COLUMNS)
          .order('concept_id', { ascending: true })
          .limit(500);
        if (activeOnly) builder = builder.eq('is_active', true);
        if (semanticAxis) builder = builder.eq('semantic_axis', semanticAxis);
        const q = currentQuery.trim();
        if (q) {
          const ilike = `%${q}%`;
          const numericId = /^\d+$/.test(q) ? q : '0';
          builder = builder.or(
            `preferred_term.ilike.${ilike},term_pt.ilike.${ilike},term_es.ilike.${ilike},term_en.ilike.${ilike},cid10_code.ilike.${ilike},concept_id.eq.${numericId}`,
          );
        }
        const { data, error: fetchError } = await builder;
        if (signal.aborted) return;
        if (fetchError) {
          setError(fetchError.message);
          setRawItems([]);
        } else {
          const rows = (data ?? []) as SnomedConcept[];
          setRawItems(rows);
          writeCache(cacheKey, rows);
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err.message : String(err));
          setRawItems([]);
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [activeOnly, semanticAxis],
  );

  useEffect(() => {
    if (!supabase) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void runFetch(query, controller.signal);
    return () => controller.abort();
  }, [query, runFetch]);

  const search = useCallback((next: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(next);
    }, 220);
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery('');
    setRawItems([]);
  }, []);

  const items = useMemo<SnomedResolvedItem[]>(() => {
    if (!supabase) return [];
    const filtered = filterSnomedByQuery(rawItems, query, { locale, limit, semanticAxis, activeOnly });
    return filtered.map(concept => {
      const resolved = resolveSnomedTerm(concept, locale);
      return { concept, term: resolved.term, bundle: resolved.source };
    });
  }, [rawItems, query, locale, limit, semanticAxis, activeOnly]);

  const resolveById = useCallback(
    async (conceptId: number): Promise<SnomedResolvedItem | null> => {
      if (!supabase) return null;
      const { data } = await supabase
        .from(SUPABASE_TABLE)
        .select(COLUMNS)
        .eq('concept_id', conceptId)
        .maybeSingle();
      if (!data) return null;
      const concept = data as SnomedConcept;
      const resolved = resolveSnomedTerm(concept, locale);
      return { concept, term: resolved.term, bundle: resolved.source };
    },
    [locale],
  );

  const resolveByCid10 = useCallback(
    async (cid10Code: string): Promise<SnomedResolvedItem | null> => {
      if (!supabase || !cid10Code.trim()) return null;
      const { data } = await supabase
        .from(SUPABASE_TABLE)
        .select(COLUMNS)
        .eq('cid10_code', cid10Code.trim().toUpperCase())
        .eq('is_active', true)
        .order('concept_id', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const concept = data as SnomedConcept;
      const resolved = resolveSnomedTerm(concept, locale);
      return { concept, term: resolved.term, bundle: resolved.source };
    },
    [locale],
  );

  const mapCid10ToSnomed = useCallback(
    async (cid10Code: string): Promise<SnomedResolvedItem[]> => {
      if (!supabase || !cid10Code.trim()) return [];
      const { data } = await supabase
        .from(SUPABASE_TABLE)
        .select(COLUMNS)
        .eq('cid10_code', cid10Code.trim().toUpperCase())
        .eq('is_active', true)
        .order('semantic_axis', { ascending: true })
        .order('concept_id', { ascending: true });
      if (!data) return [];
      return (data as SnomedConcept[]).map(concept => {
        const resolved = resolveSnomedTerm(concept, locale);
        return { concept, term: resolved.term, bundle: resolved.source };
      });
    },
    [locale],
  );

  if (!supabase) {
    return {
      items: [],
      loading: false,
      error: null,
      search,
      clear,
      resolveById,
      resolveByCid10,
      mapCid10ToSnomed,
    };
  }

  return { items, loading, error, search, clear, resolveById, resolveByCid10, mapCid10ToSnomed };
}
