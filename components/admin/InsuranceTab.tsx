'use client';

import React, { useState } from 'react';
import { Building2, Edit2, Trash2, Plus, FileText, Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { InsuranceCompany, PreAuthorization, FeeSchedule, Professional, AdminFinanceModuleProps } from './AdminContext';
import type { InsuranceType } from '@/lib/mockData';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { insuranceSchema, feeScheduleSchema } from '@/lib/validation/schemas';
import { FormField, FormErrorSummary } from '@/components/forms';
import { GS } from './helpers';

interface InsuranceFormData {
  name: string;
  type: InsuranceType | '';
  ruc: string;
  contact: string;
  phone: string;
  email: string;
  copay_rules: string;
  coverage_ceiling: number;
  has_webservice: boolean;
  webservice_url: string;
  requires_authorization: boolean;
  requires_pre_approval: boolean;
}

const INSURANCE_TYPES: Array<{ value: InsuranceType; label: string }> = [
  { value: 'Particular', label: 'Particular' },
  { value: 'IPS', label: 'IPS' },
  { value: 'Sanidade Militar', label: 'Sanidade Militar' },
  { value: 'Sanidade Policial', label: 'Sanidade Policial' },
  { value: 'EMP', label: 'Empresa (EMP)' },
  { value: 'Seguro Privado', label: 'Seguro Privado' },
  { value: 'Corporativo', label: 'Corporativo' },
  { value: 'Mercosul', label: 'Mercosul' },
];

function buildSpecialtyOptions(professionals: Professional[], currentValue: string): string[] {
  const set = new Set<string>();
  professionals.forEach((p) => {
    if (p.specialty && p.specialty.trim()) set.add(p.specialty.trim());
  });
  if (currentValue && currentValue !== '__outra__') set.add(currentValue);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

const EMPTY_INSURANCE_FORM: InsuranceFormData = {
  name: '',
  type: '',
  ruc: '',
  contact: '',
  phone: '',
  email: '',
  copay_rules: '',
  coverage_ceiling: 0,
  has_webservice: false,
  webservice_url: '',
  requires_authorization: true,
  requires_pre_approval: false,
};

export function InsuranceTab({
  insurances,
  setInsurances,
  preAuthorizations,
  setPreAuthorizations,
  feeSchedules,
  setFeeSchedules,
  professionals = [],
  procedureCatalog = [],
  addAuditLog,
}: Pick<AdminFinanceModuleProps, 'addAuditLog'> & {
  insurances: InsuranceCompany[];
  setInsurances: React.Dispatch<React.SetStateAction<InsuranceCompany[]>>;
  preAuthorizations: PreAuthorization[];
  setPreAuthorizations: React.Dispatch<React.SetStateAction<PreAuthorization[]>>;
  feeSchedules: FeeSchedule[];
  setFeeSchedules: React.Dispatch<React.SetStateAction<FeeSchedule[]>>;
  professionals?: Professional[];
  procedureCatalog?: { code: string; name: string; nomenclature?: string; financing_entity?: string }[];
}) {
  const { t } = useI18n();
  const genModuleId = useModuleId();
  const { errors, validate, clearErrors } = useFormValidation(insuranceSchema);
  const fieldErrors = groupErrorsByPath(errors);

  const [subTab, setSubTab] = useState<'companies' | 'fee' | 'preauth'>('companies');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InsuranceFormData>(EMPTY_INSURANCE_FORM);
  const [showTypeCustom, setShowTypeCustom] = useState(false);
  const [typeCustom, setTypeCustom] = useState('');

  const [showFeeForm, setShowFeeForm] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [feeFilter, setFeeFilter] = useState('all');
  const [feeForm, setFeeForm] = useState({
    insurance_id: '',
    specialty: '',
    specialty_custom: '',
    procedure_code: '',
    procedure_name: '',
    base_price: '',
    repasse_percent: '',
    copay_amount: '0',
    copay_percent: '0',
    coverage_limit: '0',
    requires_authorization: false,
    active: true,
  });
  const feeValidation = useFormValidation(feeScheduleSchema);
  const feeFieldErrors = groupErrorsByPath(feeValidation.errors);
  const [authAmount, setAuthAmount] = useState<Record<string, string>>({});
  const [procCatalogQuery, setProcCatalogQuery] = useState('');
  const [procCatalogOpen, setProcCatalogOpen] = useState(false);

  const insuranceTypeOptions = Array.from(
    new Set([...INSURANCE_TYPES.map((t) => t.value), ...insurances.map((i) => i.type).filter(Boolean)])
  );

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_INSURANCE_FORM);
    setShowTypeCustom(false);
    setTypeCustom('');
    clearErrors();
    setShowForm(true);
  };

  const openEdit = (ins: InsuranceCompany) => {
    const isCustom = !INSURANCE_TYPES.some((t) => t.value === ins.type);
    setEditingId(ins.id);
    setShowTypeCustom(isCustom);
    setTypeCustom(isCustom ? ins.type : '');
    setForm({
      name: ins.name,
      type: isCustom ? '' : ins.type,
      ruc: ins.ruc,
      contact: ins.contact,
      phone: ins.phone,
      email: ins.email,
      copay_rules: ins.copay_rules,
      coverage_ceiling: ins.coverage_ceiling,
      has_webservice: ins.has_webservice,
      webservice_url: ins.webservice_url,
      requires_authorization: ins.requires_authorization,
      requires_pre_approval: ins.requires_pre_approval,
    });
    clearErrors();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setShowTypeCustom(false);
    setTypeCustom('');
    setForm(EMPTY_INSURANCE_FORM);
    clearErrors();
  };

  const handleSave = async () => {
    const effectiveType = showTypeCustom ? typeCustom.trim() : form.type;
    const result = validate({
      name: form.name,
      type: effectiveType,
      ruc: form.ruc,
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      copay_rules: form.copay_rules,
      coverage_ceiling: form.coverage_ceiling,
      has_webservice: form.has_webservice,
      webservice_url: form.webservice_url,
      requires_authorization: form.requires_authorization,
      requires_pre_approval: form.requires_pre_approval,
    });

    if (!result.success) {
      return;
    }

    const safeForm = { ...form, type: (effectiveType || 'Particular') as InsuranceType };

    try {
      if (editingId) {
        const updated: InsuranceCompany = { id: editingId, ...safeForm, active: true };
        setInsurances((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        if (supabase) {
          await supabase.from('insurance_companies').update(updated as unknown as Record<string, unknown>).eq('id', editingId);
        }
        addAuditLog('Convênio atualizado', form.name);
      } else {
        const newIns: InsuranceCompany = { id: await genModuleId('ins'), ...safeForm, active: true };
        setInsurances((prev) => [...prev, newIns]);
        if (supabase) {
          await supabase.from('insurance_companies').insert({ ...newIns, created_at: new Date().toISOString() });
        }
        addAuditLog('Novo convênio cadastrado', form.name);
      }
      closeForm();
    } catch (err) {
      console.error('[INSURANCE] Falha ao salvar convênio:', err);
    }
  };

  const handleDelete = (ins: InsuranceCompany) => {
    if (typeof window === 'undefined') return;
    const msg = t('fin_confirm_delete_insurance', 'app').replace('{name}', ins.name);
    if (!confirm(msg)) return;

    setInsurances((prev) => prev.filter((i) => i.id !== ins.id));
    if (supabase) {
      supabase.from('insurance_companies').delete().eq('id', ins.id).then(({ error }) => {
        if (error) console.error('Erro ao excluir convênio:', error.message, error);
      });
    }
    addAuditLog('Removeu Convênio', ins.name);
  };

  const handleToggleActive = (ins: InsuranceCompany) => {
    const updated = { ...ins, active: !ins.active };
    setInsurances((prev) => prev.map((i) => (i.id === ins.id ? updated : i)));
    if (supabase) {
      supabase.from('insurance_companies').update({ active: updated.active } as Record<string, unknown>).eq('id', ins.id);
    }
    addAuditLog(updated.active ? 'Ativou Convênio' : 'Desativou Convênio', ins.name);
  };

  const openFeeNew = () => {
    setEditingFeeId(null);
    setFeeForm({
      insurance_id: insurances.length > 0 ? insurances[0].id : '',
      specialty: '',
      specialty_custom: '',
      procedure_code: '',
      procedure_name: '',
      base_price: '',
      repasse_percent: '',
      copay_amount: '0',
      copay_percent: '0',
      coverage_limit: '0',
      requires_authorization: false,
      active: true,
    });
    feeValidation.clearErrors();
    setProcCatalogQuery('');
    setProcCatalogOpen(false);
    setShowFeeForm(true);
  };

  const openFeeEdit = (fs: FeeSchedule) => {
    setEditingFeeId(fs.id);
    const knownSpecialties = buildSpecialtyOptions(professionals, '');
    const isKnownSpecialty = knownSpecialties.includes(fs.specialty);
    setFeeForm({
      insurance_id: fs.insurance_id || insurances.find((i) => i.name === fs.insurance_name)?.id || '',
      specialty: isKnownSpecialty ? fs.specialty : '__outra__',
      specialty_custom: isKnownSpecialty ? '' : fs.specialty,
      procedure_code: fs.procedure_code,
      procedure_name: fs.procedure_name,
      base_price: String(fs.base_price),
      repasse_percent: String(fs.repasse_percent),
      copay_amount: String(fs.copay_amount),
      copay_percent: String(fs.copay_percent),
      coverage_limit: String(fs.coverage_limit),
      requires_authorization: fs.requires_authorization,
      active: fs.active,
    });
    feeValidation.clearErrors();
    setProcCatalogQuery(fs.procedure_code);
    setProcCatalogOpen(false);
    setShowFeeForm(true);
  };

  const closeFeeForm = () => {
    setShowFeeForm(false);
    setEditingFeeId(null);
    feeValidation.clearErrors();
  };

  const handleFeeSave = async () => {
    const insurance = insurances.find((i) => i.id === feeForm.insurance_id);
    const finalSpecialty = feeForm.specialty === '__outra__' ? feeForm.specialty_custom.trim() : feeForm.specialty;
    const result = feeValidation.validate({
      insurance_id: feeForm.insurance_id,
      specialty: finalSpecialty,
      procedure_code: feeForm.procedure_code.trim(),
      procedure_name: feeForm.procedure_name.trim(),
      base_price: Number(feeForm.base_price.replace(/[^\d]/g, '')) || 0,
      repasse_percent: Number(feeForm.repasse_percent) || 0,
      copay_amount: Number(feeForm.copay_amount) || 0,
      copay_percent: Number(feeForm.copay_percent) || 0,
      coverage_limit: Number(feeForm.coverage_limit) || 0,
      requires_authorization: feeForm.requires_authorization,
      active: feeForm.active,
    });
    if (!result.success) return;

    const safe = {
      insurance_type: insurance?.type || 'Particular',
      insurance_name: insurance?.name || '',
      specialty: finalSpecialty,
      procedure_code: feeForm.procedure_code.trim(),
      procedure_name: feeForm.procedure_name.trim(),
      base_price: Number(feeForm.base_price.replace(/[^\d]/g, '')) || 0,
      repasse_percent: Number(feeForm.repasse_percent) || 0,
      copay_amount: Number(feeForm.copay_amount) || 0,
      copay_percent: Number(feeForm.copay_percent) || 0,
      coverage_limit: Number(feeForm.coverage_limit) || 0,
      requires_authorization: feeForm.requires_authorization,
      active: feeForm.active,
    };

    try {
      if (editingFeeId) {
        const updated: FeeSchedule = { id: editingFeeId, ...safe };
        setFeeSchedules((prev) => prev.map((f) => (f.id === editingFeeId ? updated : f)));
        if (supabase) {
          await supabase.from('fee_schedules').update(safe).eq('id', editingFeeId);
        }
        addAuditLog('Honorário atualizado', safe.procedure_name);
      } else {
        const newId = supabase ? await genModuleId('ins') : 'fee_0001';
        const newFee: FeeSchedule = { id: newId, ...safe };
        setFeeSchedules((prev) => [...prev, newFee]);
        if (supabase) {
          await supabase.from('fee_schedules').insert({ ...safe, id: newId, created_at: new Date().toISOString() });
        }
        addAuditLog('Novo honorário cadastrado', safe.procedure_name);
      }
      closeFeeForm();
    } catch (err) {
      console.error('[INSURANCE] Falha ao salvar honorário:', err);
    }
  };

  const handleFeeDelete = (fs: FeeSchedule) => {
    if (typeof window === 'undefined') return;
    const msg = t('fin_confirm_delete_fee', 'app').replace('{name}', fs.procedure_name);
    if (!confirm(msg)) return;

    setFeeSchedules((prev) => prev.filter((f) => f.id !== fs.id));
    if (supabase) {
      supabase.from('fee_schedules').delete().eq('id', fs.id).then(({ error }) => {
        if (error) console.error('Erro ao excluir honorário:', error.message, error);
      });
    }
    addAuditLog('Removeu Honorário', fs.procedure_name);
  };

  const handlePreAuthStatus = async (pa: PreAuthorization, status: 'autorizada' | 'negada') => {
    const isAuthorize = status === 'autorizada';
    const msg = isAuthorize
      ? t('fin_confirm_authorize_preauth', 'app').replace('{patient}', pa.patient_name)
      : t('fin_confirm_deny_preauth', 'app').replace('{patient}', pa.patient_name);
    if (!confirm(msg)) return;

    const authorizedAmount = status === 'autorizada' ? Number(authAmount[pa.id] || 0) || pa.requested_amount : 0;
    const updated: PreAuthorization = {
      ...pa,
      status,
      authorized_amount: authorizedAmount,
      response_date: new Date().toISOString().slice(0, 10),
    };

    setPreAuthorizations((prev) => prev.map((p) => (p.id === pa.id ? updated : p)));
    if (supabase) {
      try {
        await supabase.from('pre_authorizations').update({
          status,
          authorized_amount: authorizedAmount,
          response_date: updated.response_date,
        }).eq('id', pa.id);
      } catch (err) {
        console.error('[INSURANCE] Falha ao atualizar autorização:', err);
      }
    }
    addAuditLog(isAuthorize ? 'Autorizou autorização prévia' : 'Negou autorização prévia', pa.patient_name);
  };

  const feeList = feeFilter === 'all' ? feeSchedules : feeSchedules.filter((f) => f.insurance_name === feeFilter);

  const procCatalogResults = procCatalogQuery.trim().length >= 1
    ? procedureCatalog.filter((it) => {
        const q = procCatalogQuery.trim().toLowerCase();
        return it.code.toLowerCase().includes(q) || it.name.toLowerCase().includes(q);
      }).slice(0, 20)
    : [];

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          ['companies', 'fin_tab_companies'],
          ['fee', 'fin_tab_fee'],
          ['preauth', 'fin_tab_preauth'],
        ] as const).map(([tabKey, labelKey]) => (
          <button
            key={tabKey}
            onClick={() => setSubTab(tabKey)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              subTab === tabKey
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t(labelKey, 'app')}
          </button>
        ))}
      </div>

      {subTab === 'companies' && (
        <>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" /> {t('fin_insurance_count', 'app').replace('{count}', String(insurances.length))}
        </h3>
        <button
          onClick={openNew}
          className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> {t('fin_insurance_new_btn', 'app')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insurances.map((ins) => (
          <div
            key={ins.id}
            className={`p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2 ${!ins.active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-black text-slate-800">{ins.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{ins.type}</p>
                <p className="text-[11px] text-slate-600 mt-1 font-mono">{t('fin_insurance_ruc_value', 'app').replace('{ruc}', ins.ruc)}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggleActive(ins)}
                  className={`px-2 py-1 text-[10px] font-bold rounded border ${
                    ins.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {ins.active ? t('fin_active', 'app') : t('fin_inactive', 'app')}
                </button>
              </div>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              {ins.contact && <p>👤 {ins.contact}</p>}
              {ins.phone && <p>📞 {ins.phone}</p>}
              {ins.email && <p>✉️ {ins.email}</p>}
              {ins.has_webservice && (
                <p className="text-blue-600 truncate">{t('fin_insurance_ws_value', 'app').replace('{url}', ins.webservice_url)}</p>
              )}
              <p>{t('fin_insurance_copay_value', 'app').replace('{value}', ins.copay_rules || t('fin_insurance_no_copay', 'app'))}</p>
              {ins.coverage_ceiling > 0 && (
                <p className="font-mono font-bold text-emerald-700">{t('fin_insurance_ceiling_value', 'app').replace('{value}', GS(ins.coverage_ceiling))}</p>
              )}
            </div>
            <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
              {ins.requires_authorization && (
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">{t('fin_insurance_requires_auth_badge', 'app')}</span>
              )}
              {ins.requires_pre_approval && (
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">{t('fin_insurance_pre_auth_badge', 'app')}</span>
              )}
              <div className="flex-1" />
              <button
                onClick={() => openEdit(ins)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                title={t('fin_btn_edit', 'app')}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(ins)}
                className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                title={t('fin_btn_remove', 'app')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      {subTab === 'fee' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> {t('fin_fee_schedule_title', 'app').replace('{count}', String(feeSchedules.length))}
              </h4>
              <div className="flex items-center gap-2">
                <select
                  value={feeFilter}
                  onChange={(e) => setFeeFilter(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="all">{t('fin_fee_filter_all', 'app')}</option>
                  {insurances.filter((i) => i.active).map((i) => (
                    <option key={i.id} value={i.name}>{i.name}</option>
                  ))}
                </select>
                <button
                  onClick={openFeeNew}
                  className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('fin_fee_new_btn', 'app')}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {feeList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  {t('fin_fee_empty', 'app')}
                </div>
              ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-3 py-2.5 text-left">{t('fin_table_insurance', 'app')}</th>
                    <th className="px-3 py-2.5 text-left">{t('fin_table_specialty', 'app')}</th>
                    <th className="px-3 py-2.5 text-left">{t('fin_table_procedure', 'app')}</th>
                    <th className="px-3 py-2.5 text-right">{t('fin_table_base_price', 'app')}</th>
                    <th className="px-3 py-2.5 text-center">{t('fin_table_repasse', 'app')}</th>
                    <th className="px-3 py-2.5 text-center">{t('fin_table_active', 'app')}</th>
                    <th className="px-3 py-2.5 text-right">{t('fin_preauth_actions', 'app')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {feeList.map((fs) => (
                    <tr key={fs.id} className={`hover:bg-slate-50/70 transition ${!fs.active ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">{fs.insurance_name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{fs.specialty}</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        <span className="font-mono text-slate-400">{fs.procedure_code}</span> {fs.procedure_name}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{GS(fs.base_price)}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-teal-700">{fs.repasse_percent}%</td>
                      <td className="px-3 py-2.5 text-center">
                        {fs.active ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openFeeEdit(fs)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                            title={t('fin_btn_edit', 'app')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeeDelete(fs)}
                            className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                            title={t('fin_btn_remove', 'app')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'preauth' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> {t('fin_pre_auth_title', 'app').replace('{count}', String(preAuthorizations.length))}
              </h4>
            </div>
            <div className="overflow-x-auto">
              {preAuthorizations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  {t('fin_fee_empty', 'app')}
                </div>
              ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">{t('fin_table_patient', 'app')}</th>
                    <th className="px-4 py-2.5 text-left">{t('fin_table_procedure', 'app')}</th>
                    <th className="px-4 py-2.5 text-left">{t('fin_table_insurance', 'app')}</th>
                    <th className="px-4 py-2.5 text-right">{t('fin_table_requested', 'app')}</th>
                    <th className="px-4 py-2.5 text-right">{t('fin_table_authorized', 'app')}</th>
                    <th className="px-4 py-2.5 text-center">{t('fin_table_status', 'app')}</th>
                    <th className="px-4 py-2.5 text-center">{t('fin_table_auth_number', 'app')}</th>
                    <th className="px-4 py-2.5 text-right">{t('fin_preauth_actions', 'app')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {preAuthorizations.map((pa) => (
                    <tr key={pa.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800">{pa.patient_name}</td>
                      <td className="px-4 py-3 text-slate-600">{pa.procedure_name}</td>
                      <td className="px-4 py-3 text-slate-600">{pa.insurance_name}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{GS(pa.requested_amount)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                        {pa.authorized_amount > 0 ? GS(pa.authorized_amount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pa.status === 'autorizada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pa.status === 'negada'
                              ? 'bg-rose-100 text-rose-800'
                              : pa.status === 'parcial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t(`fin_preauth_status_${pa.status}`, 'app')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[10px] text-slate-500">{pa.authorization_number || '-'}</td>
                      <td className="px-4 py-3">
                        {pa.status === 'solicitada' && (
                          <div className="flex items-center justify-end gap-2">
                            {pa.requested_amount > 0 && (
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={GS(pa.requested_amount)}
                                value={authAmount[pa.id] || ''}
                                onChange={(e) => setAuthAmount((prev) => ({ ...prev, [pa.id]: e.target.value.replace(/[^\d]/g, '') }))}
                                className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-right"
                              />
                            )}
                            <button
                              onClick={() => handlePreAuthStatus(pa, 'autorizada')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition"
                            >
                              {t('fin_preauth_authorize', 'app')}
                            </button>
                            <button
                              onClick={() => handlePreAuthStatus(pa, 'negada')}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition"
                            >
                              {t('fin_preauth_deny', 'app')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-emerald-50 flex items-center justify-between">
              <h3 className="font-bold text-emerald-800 text-sm">
                {editingId ? t('fin_edit_insurance', 'app') : t('fin_new_insurance', 'app')}
              </h3>
              <button onClick={closeForm} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              {errors.length > 0 && <FormErrorSummary errors={errors} />}
              <FormField label={t('fin_insurance_name_label', 'app')} required error={fieldErrors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder={t('fin_insurance_name_placeholder', 'app')}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={t('fin_insurance_type_label', 'app')} required error={fieldErrors.type}>
                  <select
                    value={showTypeCustom ? '__new_type__' : form.type}
                    onChange={(e) => {
                      if (e.target.value === '__new_type__') {
                        setShowTypeCustom(true);
                        setForm((prev) => ({ ...prev, type: '' }));
                        setTypeCustom('');
                      } else {
                        setShowTypeCustom(false);
                        setForm((prev) => ({ ...prev, type: e.target.value as InsuranceType }));
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">{t('rcpt_select', 'app')}</option>
                    {insuranceTypeOptions.map((tv) => (
                      <option key={tv} value={tv}>{tv}</option>
                    ))}
                    <option value="__new_type__">{t('fin_insurance_type_new', 'app')}</option>
                  </select>
                  {showTypeCustom && (
                    <input
                      type="text"
                      value={typeCustom}
                      onChange={(e) => setTypeCustom(e.target.value)}
                      placeholder={t('fin_insurance_type_custom_placeholder', 'app')}
                      className="mt-2 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  )}
                </FormField>
                <FormField label={t('fin_insurance_ruc_label', 'app')} required error={fieldErrors.ruc}>
                  <input
                    type="text"
                    value={form.ruc}
                    onChange={(e) => setForm((prev) => ({ ...prev, ruc: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={t('fin_insurance_contact_label', 'app')} error={fieldErrors.contact}>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
                <FormField label={t('rcpt_label_phone', 'app')} error={fieldErrors.phone}>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
              </div>
              <FormField label={t('fin_insurance_email_label', 'app')} error={fieldErrors.email}>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </FormField>
              <FormField label={t('fin_insurance_copay_label', 'app')} error={fieldErrors.copay_rules}>
                <input
                  type="text"
                  value={form.copay_rules}
                  onChange={(e) => setForm((prev) => ({ ...prev, copay_rules: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder={t('fin_insurance_copay_placeholder', 'app')}
                />
              </FormField>
              <FormField label={t('fin_insurance_ceiling_label', 'app')} error={fieldErrors.coverage_ceiling}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.coverage_ceiling || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, coverage_ceiling: Number(e.target.value.replace(/[^\d]/g, '')) }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.has_webservice}
                    onChange={(e) => setForm((prev) => ({ ...prev, has_webservice: e.target.checked }))}
                    className="rounded"
                  />
                  {t('fin_insurance_ws_label', 'app')}
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.requires_authorization}
                    onChange={(e) => setForm((prev) => ({ ...prev, requires_authorization: e.target.checked }))}
                    className="rounded"
                  />
                  {t('fin_insurance_requires_auth_label', 'app')}
                </label>
              </div>
              {form.has_webservice && (
                <FormField label={t('fin_insurance_ws_url_label', 'app')} error={fieldErrors.webservice_url}>
                  <input
                    type="text"
                    value={form.webservice_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, webservice_url: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    placeholder={t('fin_insurance_ws_url_placeholder', 'app')}
                  />
                </FormField>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition"
                >
                  {editingId ? t('app_save_changes', 'app') : t('app_register_insurance', 'app')}
                </button>
                <button
                  onClick={closeForm}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition"
                >
                  {t('app_cancel', 'app')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee Schedule Form Modal */}
      {showFeeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-emerald-50 flex items-center justify-between">
              <h3 className="font-bold text-emerald-800 text-sm">
                {editingFeeId ? t('fin_fee_edit_title', 'app') : t('fin_fee_new_title', 'app')}
              </h3>
              <button onClick={closeFeeForm} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              {feeValidation.errors.length > 0 && <FormErrorSummary errors={feeValidation.errors} />}
              <FormField label={t('fin_fee_insurance_label', 'app')} required error={feeFieldErrors.insurance_id}>
                <select
                  value={feeForm.insurance_id}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, insurance_id: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">{t('fin_fee_specialty_placeholder', 'app')}</option>
                  {insurances.filter((i) => i.active).map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label={t('fin_fee_specialty_label', 'app')} required error={feeFieldErrors.specialty}>
                <select
                  value={feeForm.specialty}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, specialty: e.target.value, specialty_custom: '' }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">{t('fin_fee_specialty_placeholder', 'app')}</option>
                  {buildSpecialtyOptions(professionals, feeForm.specialty === '__outra__' ? '' : feeForm.specialty).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="__outra__">{t('fin_fee_specialty_other', 'app')}</option>
                </select>
                {feeForm.specialty === '__outra__' && (
                  <input
                    type="text"
                    value={feeForm.specialty_custom}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, specialty_custom: e.target.value }))}
                    placeholder={t('fin_fee_specialty_custom_placeholder', 'app')}
                    className="mt-2 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                )}
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={t('fin_fee_proc_code_label', 'app')} required error={feeFieldErrors.procedure_code}>
                  <div className="relative">
                    <input
                      type="text"
                      value={procCatalogQuery}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProcCatalogQuery(v);
                        setFeeForm((prev) => ({ ...prev, procedure_code: v }));
                        setProcCatalogOpen(true);
                      }}
                      onFocus={() => setProcCatalogOpen(true)}
                      onBlur={() => setTimeout(() => setProcCatalogOpen(false), 150)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder={t('fin_fee_proc_search_placeholder', 'app')}
                    />
                    {procCatalogOpen && procedureCatalog.length > 0 && procCatalogQuery.trim() && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                        {procCatalogResults.length === 0 && (
                          <p className="px-3 py-2 text-[10px] text-slate-400 italic">{t('fin_fee_proc_no_results', 'app')}</p>
                        )}
                        {procCatalogResults.map((it) => (
                          <button
                            key={`${it.nomenclature || 'x'}-${it.code}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setFeeForm((prev) => ({ ...prev, procedure_code: it.code, procedure_name: it.name }));
                              setProcCatalogQuery(it.code);
                              setProcCatalogOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition border-b border-slate-50 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-emerald-700 font-bold shrink-0">{it.code}</span>
                              <span className="text-xs text-slate-700 flex-1 min-w-0 truncate">{it.name}</span>
                            </div>
                            {it.nomenclature && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{it.nomenclature.toUpperCase()}</span>
                                {it.financing_entity && (
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{it.financing_entity}</span>
                                )}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>
                <FormField label={t('fin_fee_proc_name_label', 'app')} required error={feeFieldErrors.procedure_name}>
                  <input
                    type="text"
                    value={feeForm.procedure_name}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, procedure_name: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={t('fin_fee_base_price_label', 'app')} required error={feeFieldErrors.base_price}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={feeForm.base_price}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, base_price: e.target.value.replace(/[^\d]/g, '') }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
                <FormField label={t('fin_fee_repasse_label', 'app')} error={feeFieldErrors.repasse_percent}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={feeForm.repasse_percent}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, repasse_percent: e.target.value.replace(/[^\d]/g, '') }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={t('fin_fee_copay_amount_label', 'app')} error={feeFieldErrors.copay_amount}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={feeForm.copay_amount}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, copay_amount: e.target.value.replace(/[^\d]/g, '') }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
                <FormField label={t('fin_fee_copay_percent_label', 'app')} error={feeFieldErrors.copay_percent}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={feeForm.copay_percent}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, copay_percent: e.target.value.replace(/[^\d]/g, '') }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
              </div>
              <FormField label={t('fin_fee_coverage_limit_label', 'app')} error={feeFieldErrors.coverage_limit}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={feeForm.coverage_limit}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, coverage_limit: e.target.value.replace(/[^\d]/g, '') }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={feeForm.requires_authorization}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, requires_authorization: e.target.checked }))}
                    className="rounded"
                  />
                  {t('fin_fee_requires_auth_label', 'app')}
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={feeForm.active}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, active: e.target.checked }))}
                    className="rounded"
                  />
                  {t('fin_fee_active_label', 'app')}
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleFeeSave}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition"
                >
                  {editingFeeId ? t('app_save_changes', 'app') : t('fin_fee_new_btn', 'app')}
                </button>
                <button
                  onClick={closeFeeForm}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition"
                >
                  {t('app_cancel', 'app')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
