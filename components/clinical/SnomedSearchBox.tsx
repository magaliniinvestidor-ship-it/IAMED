'use client';

import * as React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useSnomedSearch, type SnomedResolvedItem } from '@/lib/snomed';

interface SnomedSearchBoxProps {
  onPick: (item: SnomedResolvedItem) => void;
  placeholder?: string;
  initialCode?: string;
  initialDescription?: string;
  semanticAxis?: 'disorder' | 'finding' | 'procedure' | 'body_structure' | 'substance';
  className?: string;
  cid10Context?: string;
  onMapFromCid10?: (items: SnomedResolvedItem[]) => void;
}

export function SnomedSearchBox({
  onPick,
  placeholder,
  initialCode = '',
  initialDescription = '',
  semanticAxis,
  className = '',
  cid10Context,
  onMapFromCid10,
}: SnomedSearchBoxProps) {
  const { t } = useI18n();
  const { items, loading, error, search, clear, mapCid10ToSnomed } = useSnomedSearch({ limit: 30, semanticAxis });
  const [value, setValue] = React.useState(initialCode);
  const [open, setOpen] = React.useState(false);
  const [mapResults, setMapResults] = React.useState<SnomedResolvedItem[] | null>(null);
  const [mapping, setMapping] = React.useState(false);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [inlineMsg, setInlineMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setValue(initialCode);
  }, [initialCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    setOpen(true);
    setMapResults(null);
    setMapError(null);
    setInlineMsg(null);
    search(next);
  };

  const handlePick = (item: SnomedResolvedItem) => {
    setValue(String(item.concept.concept_id));
    setOpen(false);
    setMapResults(null);
    setMapError(null);
    setInlineMsg(null);
    clear();
    onPick(item);
  };

  const handleMapFromCid10 = async () => {
    if (!cid10Context) return;
    setMapping(true);
    setOpen(true);
    setMapResults(null);
    setMapError(null);
    try {
      const results = await mapCid10ToSnomed(cid10Context);
      setMapResults(results);
      if (results.length === 0) {
        setOpen(false);
        setInlineMsg(t('hce_snomed_no_results', 'app'));
      } else {
        setOpen(true);
        setInlineMsg(null);
      }
      onMapFromCid10?.(results);
    } catch (err) {
      setMapResults([]);
      setOpen(false);
      setMapError(err instanceof Error ? err.message : String(err));
    } finally {
      setMapping(false);
    }
  };

  const showDropdown = open && (mapping || value || items.length > 0 || mapResults !== null);
  const list = mapResults ?? items;

  return (
    <div className={`relative ${className}`} onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => { if (value) { setOpen(true); search(value); } }}
          placeholder={placeholder ?? t('hce_snomed_placeholder', 'app')}
          className="flex-1 min-w-0 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
        />
        {cid10Context && (
          <button
            type="button"
            onClick={handleMapFromCid10}
            disabled={mapping}
            className="shrink-0 px-3 py-2 text-xs font-bold rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition"
            title={t('hce_snomed_resolve_cid10', 'app')}
          >
            {mapping ? '…' : t('hce_snomed_lookup', 'app')}
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {loading && (
            <p className="px-3 py-2 text-[10px] text-slate-500 italic">{t('hce_snomed_loading', 'app')}</p>
          )}
          {mapping && (
            <p className="px-3 py-2 text-[10px] text-teal-700 italic">
              {t('hce_snomed_lookup', 'app')} · {cid10Context}…
            </p>
          )}
          {error && (
            <p className="px-3 py-2 text-[10px] text-rose-600">{error}</p>
          )}
          {mapError && (
            <p className="px-3 py-2 text-[10px] text-rose-600">{mapError}</p>
          )}
          {!loading && !mapping && !mapError && !error && list.length === 0 && (
            <p className="px-3 py-2 text-[10px] text-slate-400 italic">
              {t('hce_snomed_no_results', 'app')}
            </p>
          )}
          {!loading && !error && mapResults && mapResults.length > 0 && (
            <p className="px-3 py-1 text-[9px] text-teal-700 font-bold uppercase border-b border-slate-100 bg-teal-50/40">
              {t('hce_snomed_resolve_cid10', 'app')} · {cid10Context}
            </p>
          )}
          {!loading && !error && list.map(item => (
            <button
              key={`${item.concept.concept_id}-${item.concept.semantic_axis}`}
              type="button"
              onClick={() => handlePick(item)}
              className="w-full text-left px-3 py-2 hover:bg-teal-50 transition border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-teal-700 font-bold shrink-0">{item.concept.concept_id}</span>
                <span className="text-xs text-slate-700 flex-1 min-w-0 truncate">{item.term || item.concept.preferred_term}</span>
                {item.concept.cid10_code && (
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                    CID {item.concept.cid10_code}
                  </span>
                )}
                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded shrink-0">
                  {item.concept.semantic_axis}
                </span>
              </div>
              {item.concept.inn && item.concept.inn !== item.term && (
                <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">{t('hce_snomed_inn', 'app')}: {item.concept.inn}</p>
              )}
            </button>
          ))}
        </div>
      )}
      {initialDescription && (
        <p className="text-[10px] text-slate-500 mt-1 italic">{initialDescription}</p>
      )}
      {inlineMsg && (
        <p className="text-[10px] text-amber-600 mt-1 italic">{inlineMsg}</p>
      )}
    </div>
  );
}
