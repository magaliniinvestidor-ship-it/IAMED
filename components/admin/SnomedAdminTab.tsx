'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Plus, Search, Edit2, Check, X, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { snomedConceptSchema } from '@/lib/validation/schemas';
import { FormField, FormErrorSummary } from '@/components/forms';
import type { SnomedConcept } from '@/lib/snomed';

interface SnomedAdminTabProps {
  addAuditLog: (action: string, target: string) => void;
}

const AXES = [
  'disorder',
  'finding',
  'body_structure',
  'procedure',
  'substance',
  'observable',
  'situation',
  'specimen',
  'other',
];

const AXIS_COLORS: Record<string, string> = {
  disorder: 'bg-rose-50 text-rose-700 border-rose-200',
  finding: 'bg-amber-50 text-amber-700 border-amber-200',
  body_structure: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  procedure: 'bg-teal-50 text-teal-700 border-teal-200',
  substance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  observable: 'bg-sky-50 text-sky-700 border-sky-200',
  situation: 'bg-violet-50 text-violet-700 border-violet-200',
  specimen: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function SnomedAdminTab({ addAuditLog }: SnomedAdminTabProps) {
  const { t } = useI18n();
  const { errors, validate, clearErrors } = useFormValidation(snomedConceptSchema);

  const [concepts, setConcepts] = useState<SnomedConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [axisFilter, setAxisFilter] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [form, setForm] = useState({
    conceptId: '',
    preferredTerm: '',
    termPt: '',
    termEs: '',
    termEn: '',
    cid10Code: '',
    semanticAxis: 'disorder',
    inn: '',
    rxnormCode: '',
    atcCode: '',
  });

  const loadConcepts = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('snomed_concepts')
      .select('*')
      .order('concept_id', { ascending: true });
    if (error) {
      if (typeof window !== 'undefined') console.error('[SnomedAdminTab.loadConcepts]', error.message);
    } else if (data) {
      setConcepts(data as SnomedConcept[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadConcepts();
  }, []);

  const stats = {
    total: concepts.length,
    active: concepts.filter((c) => c.is_active).length,
    placeholders: concepts.filter((c) => c.concept_id >= 1019000000).length,
    byAxis: AXES.map((axis) => ({ axis, count: concepts.filter((c) => c.semantic_axis === axis).length })).filter((x) => x.count > 0),
  };

  const resetForm = () => {
    setForm({
      conceptId: '',
      preferredTerm: '',
      termPt: '',
      termEs: '',
      termEn: '',
      cid10Code: '',
      semanticAxis: 'disorder',
      inn: '',
      rxnormCode: '',
      atcCode: '',
    });
    setEditingId(null);
    setIsNew(true);
    clearErrors();
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: SnomedConcept) => {
    setEditingId(c.concept_id);
    setIsNew(false);
    setForm({
      conceptId: String(c.concept_id),
      preferredTerm: c.preferred_term,
      termPt: c.term_pt || '',
      termEs: c.term_es || '',
      termEn: c.term_en || '',
      cid10Code: c.cid10_code || '',
      semanticAxis: c.semantic_axis,
      inn: c.inn || '',
      rxnormCode: c.rxnorm_code || '',
      atcCode: c.atc_code || '',
    });
    setShowForm(true);
    clearErrors();
  };

  const handleSave = async () => {
    const result = validate({
      conceptId: form.conceptId,
      preferredTerm: form.preferredTerm,
      termPt: form.termPt,
      termEs: form.termEs,
      termEn: form.termEn,
      cid10Code: form.cid10Code,
      semanticAxis: form.semanticAxis,
      inn: form.inn,
      rxnormCode: form.rxnormCode,
      atcCode: form.atcCode,
    });
    if (!result.success) return;

    setSaving(true);
    let conceptId = parseInt(form.conceptId, 10);

    if (!editingId) {
      if (!conceptId || isNaN(conceptId)) {
        const { data: newId } = supabase ? await supabase.rpc('next_snomed_concept_id') : { data: null };
        conceptId = (newId as number) || 1019000065;
      }
      if (supabase) {
        await supabase.from('snomed_concepts').insert({
          concept_id: conceptId,
          preferred_term: form.preferredTerm,
          term_pt: form.termPt || null,
          term_es: form.termEs || null,
          term_en: form.termEn || null,
          cid10_code: form.cid10Code || null,
          semantic_axis: form.semanticAxis,
          is_active: true,
          inn: form.inn || null,
          rxnorm_code: form.rxnormCode || null,
          atc_code: form.atcCode || null,
        });
        addAuditLog('Adicionou Conceito SNOMED-CT', `${conceptId} - ${form.preferredTerm}`);
      }
    } else {
      if (supabase) {
        await supabase.from('snomed_concepts').update({
          preferred_term: form.preferredTerm,
          term_pt: form.termPt || null,
          term_es: form.termEs || null,
          term_en: form.termEn || null,
          cid10_code: form.cid10Code || null,
          semantic_axis: form.semanticAxis,
          inn: form.inn || null,
          rxnorm_code: form.rxnormCode || null,
          atc_code: form.atcCode || null,
          updated_at: new Date().toISOString(),
        }).eq('concept_id', editingId);
        addAuditLog('Atualizou Conceito SNOMED-CT', `${editingId} - ${form.preferredTerm}`);
      }
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
    await loadConcepts();
  };

  const handleToggleActive = async (c: SnomedConcept) => {
    const next = !c.is_active;
    if (typeof window !== 'undefined') {
      const msg = next
        ? t('admin_snomed_confirm_activate', 'app')
        : t('admin_snomed_confirm_deactivate', 'app');
      if (!confirm(msg.replace('{term}', c.preferred_term))) return;
    }
    if (supabase) {
      await supabase.from('snomed_concepts').update({
        is_active: next,
        updated_at: new Date().toISOString(),
      }).eq('concept_id', c.concept_id);
      addAuditLog(next ? 'Ativou Conceito SNOMED-CT' : 'Desativou Conceito SNOMED-CT', `${c.concept_id} - ${c.preferred_term}`);
    }
    await loadConcepts();
  };

  const fieldErrors = groupErrorsByPath(errors);

  const filtered = concepts.filter((c) => {
    if (axisFilter !== 'all' && c.semantic_axis !== axisFilter) return false;
    if (activeOnly && !c.is_active) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(c.concept_id).includes(q) ||
      c.preferred_term.toLowerCase().includes(q) ||
      (c.term_pt || '').toLowerCase().includes(q) ||
      (c.term_es || '').toLowerCase().includes(q) ||
      (c.cid10_code || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-base">{t('admin_snomed_title', 'app')}</h3>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" /> {t('admin_snomed_new', 'app')}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> {t('admin_snomed_loading', 'app')}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl text-center">
                <p className="text-2xl font-black text-teal-700">{stats.total}</p>
                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">{t('admin_snomed_total', 'app')}</p>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
                <p className="text-2xl font-black text-emerald-700">{stats.active}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('admin_snomed_active', 'app')}</p>
              </div>
              <div className="p-3 bg-violet-50/60 border border-violet-100 rounded-xl text-center">
                <p className="text-2xl font-black text-violet-700">{stats.placeholders}</p>
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">{t('admin_snomed_placeholders', 'app')}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="flex flex-wrap justify-center gap-1">
                  {stats.byAxis.map((x) => (
                    <span key={x.axis} className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${AXIS_COLORS[x.axis] || AXIS_COLORS.other}`}>
                      {x.axis} {x.count}
                    </span>
                  ))}
                  {stats.byAxis.length === 0 && <span className="text-[10px] text-slate-400">—</span>}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{t('admin_snomed_axes', 'app')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('admin_snomed_search', 'app')}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <select
                value={axisFilter}
                onChange={(e) => setAxisFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="all">{t('admin_snomed_axis_all', 'app')}</option>
                {AXES.map((axis) => (
                  <option key={axis} value={axis}>{axis}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="accent-teal-600 w-3.5 h-3.5"
                />
                {t('admin_snomed_only_active', 'app')}
              </label>
            </div>

            {showForm && (
              <div className="border border-teal-200 rounded-xl p-4 space-y-3 bg-teal-50/30">
                {errors.length > 0 && <FormErrorSummary errors={errors} onClose={clearErrors} />}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <FormField label={t('admin_snomed_code', 'app')} error={fieldErrors.conceptId}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.conceptId}
                      onChange={(e) => setForm((p) => ({ ...p, conceptId: e.target.value }))}
                      placeholder={isNew ? t('admin_snomed_code_hint', 'app') : ''}
                      disabled={!isNew}
                      className={`w-full px-3 py-2 bg-white border rounded-lg text-xs ${!isNew ? 'border-slate-200 text-slate-400' : 'border-slate-200'}`}
                    />
                  </FormField>
                  <FormField label={t('admin_snomed_preferred_term', 'app')} error={fieldErrors.preferredTerm}>
                    <input
                      type="text"
                      value={form.preferredTerm}
                      onChange={(e) => setForm((p) => ({ ...p, preferredTerm: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </FormField>
                  <FormField label={t('admin_snomed_axis', 'app')} error={fieldErrors.semanticAxis}>
                    <select
                      value={form.semanticAxis}
                      onChange={(e) => setForm((p) => ({ ...p, semanticAxis: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {AXES.map((axis) => (
                        <option key={axis} value={axis}>{axis}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label={t('admin_snomed_term_pt', 'app')} error={fieldErrors.termPt}>
                    <input
                      type="text"
                      value={form.termPt}
                      onChange={(e) => setForm((p) => ({ ...p, termPt: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </FormField>
                  <FormField label={t('admin_snomed_term_es', 'app')} error={fieldErrors.termEs}>
                    <input
                      type="text"
                      value={form.termEs}
                      onChange={(e) => setForm((p) => ({ ...p, termEs: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </FormField>
                  <FormField label={t('admin_snomed_term_en', 'app')} error={fieldErrors.termEn}>
                    <input
                      type="text"
                      value={form.termEn}
                      onChange={(e) => setForm((p) => ({ ...p, termEn: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </FormField>
                  <FormField label={t('admin_snomed_cid10', 'app')} error={fieldErrors.cid10Code}>
                    <input
                      type="text"
                      value={form.cid10Code}
                      onChange={(e) => setForm((p) => ({ ...p, cid10Code: e.target.value.toUpperCase() }))}
                      placeholder="A15.0"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </FormField>
                  <FormField label="INN" error={fieldErrors.inn}>
                    <input
                      type="text"
                      value={form.inn}
                      onChange={(e) => setForm((p) => ({ ...p, inn: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </FormField>
                  <FormField label="RxNorm" error={fieldErrors.rxnormCode}>
                    <input
                      type="text"
                      value={form.rxnormCode}
                      onChange={(e) => setForm((p) => ({ ...p, rxnormCode: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </FormField>
                  <FormField label="ATC" error={fieldErrors.atcCode}>
                    <input
                      type="text"
                      value={form.atcCode}
                      onChange={(e) => setForm((p) => ({ ...p, atcCode: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </FormField>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="flex items-center gap-1.5 py-2 px-4 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" /> {t('admin_snomed_cancel', 'app')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {t('admin_snomed_save', 'app')}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">{t('admin_snomed_no_results', 'app')}</p>
              )}
              {filtered.map((c) => (
                <div
                  key={c.concept_id}
                  className={`p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs transition ${!c.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-sm ${c.concept_id >= 1019000000 ? 'bg-violet-600' : 'bg-teal-600'}`}>
                      {c.semantic_axis.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-800 text-sm truncate">{c.preferred_term}</p>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border whitespace-nowrap ${AXIS_COLORS[c.semantic_axis] || AXIS_COLORS.other}`}>
                          {c.semantic_axis}
                        </span>
                        {c.concept_id >= 1019000000 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded border bg-violet-50 text-violet-700 border-violet-200 whitespace-nowrap">
                            {t('admin_snomed_placeholder', 'app')}
                          </span>
                        )}
                        {!c.is_active && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded border bg-rose-50 text-rose-700 border-rose-200 whitespace-nowrap">
                            {t('admin_snomed_inactive', 'app')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 font-medium flex-wrap text-[10px]">
                        <span className="font-mono">{c.concept_id}</span>
                        {c.cid10_code && <span>CID-10: <b>{c.cid10_code}</b></span>}
                        {c.term_pt && <span>pt: {c.term_pt}</span>}
                        {c.term_es && <span>es: {c.term_es}</span>}
                        {c.inn && <span>INN: {c.inn}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer ${c.is_active ? 'text-slate-500 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-800'}`}
                      title={c.is_active ? t('admin_snomed_deactivate', 'app') : t('admin_snomed_activate', 'app')}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      title={t('admin_snomed_edit', 'app')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}