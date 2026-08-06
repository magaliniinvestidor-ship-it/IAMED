'use client';

import React, { useState } from 'react';
import { Building2, Edit2, Trash2, Plus, FileText, Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { InsuranceCompany, PreAuthorization, FeeSchedule, AdminFinanceModuleProps } from './AdminContext';
import type { InsuranceType } from '@/lib/mockData';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { insuranceSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';
import { GS } from './helpers';

interface InsuranceFormData {
  name: string;
  type: InsuranceType;
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
  { value: 'IPS', label: 'IPS' },
  { value: 'Sanidade Militar', label: 'Sanidade Militar' },
  { value: 'Sanidade Policial', label: 'Sanidade Policial' },
  { value: 'EMP', label: 'Empresa (EMP)' },
  { value: 'Seguro Privado', label: 'Seguro Privado' },
  { value: 'Corporativo', label: 'Corporativo' },
  { value: 'Particular', label: 'Particular' },
  { value: 'Mercosul', label: 'Mercosul' },
];

const EMPTY_INSURANCE_FORM: InsuranceFormData = {
  name: '',
  type: 'IPS',
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
  feeSchedules,
  addAuditLog,
}: Pick<AdminFinanceModuleProps, 'addAuditLog'> & {
  insurances: InsuranceCompany[];
  setInsurances: React.Dispatch<React.SetStateAction<InsuranceCompany[]>>;
  preAuthorizations: PreAuthorization[];
  feeSchedules: FeeSchedule[];
}) {
  const { t } = useI18n();
  const genModuleId = useModuleId();
  const { errors, validate } = useFormValidation(insuranceSchema);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InsuranceFormData>(EMPTY_INSURANCE_FORM);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_INSURANCE_FORM);
    setShowForm(true);
  };

  const openEdit = (ins: InsuranceCompany) => {
    setEditingId(ins.id);
    setForm({
      name: ins.name,
      type: ins.type,
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
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_INSURANCE_FORM);
  };

  const handleSave = async () => {
    const result = validate({
      name: form.name,
      type: form.type,
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

    if (editingId) {
      const updated: InsuranceCompany = { id: editingId, ...form, active: true };
      setInsurances((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
      if (supabase) {
        await supabase.from('insurances').update(updated as unknown as Record<string, unknown>).eq('id', editingId);
      }
      addAuditLog('Convênio atualizado', form.name);
    } else {
      const newIns: InsuranceCompany = { id: await genModuleId('ins'), ...form, active: true };
      setInsurances((prev) => [...prev, newIns]);
      if (supabase) {
        await supabase.from('insurances').insert({ ...newIns, created_at: new Date().toISOString() });
      }
      addAuditLog('Novo convênio cadastrado', form.name);
    }
    closeForm();
  };

  const handleDelete = (ins: InsuranceCompany) => {
    if (typeof window === 'undefined') return;
    const msg = t('fin_confirm_delete_insurance', 'app').replace('{name}', ins.name);
    if (!confirm(msg)) return;

    setInsurances((prev) => prev.filter((i) => i.id !== ins.id));
    if (supabase) {
      supabase.from('insurances').delete().eq('id', ins.id).then(({ error }) => {
        if (error) console.error('Erro ao excluir convênio:', error.message, error);
      });
    }
    addAuditLog('Removeu Convênio', ins.name);
  };

  const handleToggleActive = (ins: InsuranceCompany) => {
    const updated = { ...ins, active: !ins.active };
    setInsurances((prev) => prev.map((i) => (i.id === ins.id ? updated : i)));
    if (supabase) {
      supabase.from('insurances').update({ active: updated.active } as Record<string, unknown>).eq('id', ins.id);
    }
    addAuditLog(updated.active ? 'Ativou Convênio' : 'Desativou Convênio', ins.name);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" /> Convênios ({insurances.length})
        </h3>
        <button
          onClick={openNew}
          className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Convênio
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
                <p className="text-[11px] text-slate-600 mt-1 font-mono">RUC: {ins.ruc}</p>
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
                  {ins.active ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              {ins.contact && <p>👤 {ins.contact}</p>}
              {ins.phone && <p>📞 {ins.phone}</p>}
              {ins.email && <p>✉️ {ins.email}</p>}
              {ins.has_webservice && (
                <p className="text-blue-600 truncate">🔌 WS: {ins.webservice_url}</p>
              )}
              <p>💰 {ins.copay_rules || 'Sem regras de coparticipação'}</p>
              {ins.coverage_ceiling > 0 && (
                <p className="font-mono font-bold text-emerald-700">Teto: {GS(ins.coverage_ceiling)}</p>
              )}
            </div>
            <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
              {ins.requires_authorization && (
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">REQUER AUTH</span>
              )}
              {ins.requires_pre_approval && (
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">PRÉ-AUTH</span>
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
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder="Ex: IPS - Instituto de Previsión Social"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as InsuranceType }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {INSURANCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">RUC *</label>
                  <input
                    type="text"
                    value={form.ruc}
                    onChange={(e) => setForm((prev) => ({ ...prev, ruc: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Contato</label>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Regras de Coparticipação</label>
                <input
                  type="text"
                  value={form.copay_rules}
                  onChange={(e) => setForm((prev) => ({ ...prev, copay_rules: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder="Ex: Copago 5% sobre tabela"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Teto de Cobertura (Gs.)</label>
                <input
                  type="number"
                  value={form.coverage_ceiling || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, coverage_ceiling: Number(e.target.value) }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.has_webservice}
                    onChange={(e) => setForm((prev) => ({ ...prev, has_webservice: e.target.checked }))}
                    className="rounded"
                  />
                  Web Service
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.requires_authorization}
                    onChange={(e) => setForm((prev) => ({ ...prev, requires_authorization: e.target.checked }))}
                    className="rounded"
                  />
                  Requer Autorização
                </label>
              </div>
              {form.has_webservice && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">URL do Web Service</label>
                  <input
                    type="url"
                    value={form.webservice_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, webservice_url: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    placeholder="Ex: https://ws.ips.gov.py/elegibilidad"
                  />
                </div>
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

      {/* Pre-Authorizations Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Autorizações Prévias ({preAuthorizations.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">Paciente</th>
                <th className="px-4 py-2.5 text-left">Procedimento</th>
                <th className="px-4 py-2.5 text-left">Convênio</th>
                <th className="px-4 py-2.5 text-right">Solicitado</th>
                <th className="px-4 py-2.5 text-right">Autorizado</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-center">N° Auth</th>
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
                      {pa.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[10px] text-slate-500">{pa.authorization_number || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Schedules Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h4 className="font-black text-slate-800 text-sm">Tabela de Honorários ({feeSchedules.length})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-3 py-2.5 text-left">Convênio</th>
                <th className="px-3 py-2.5 text-left">Especialidade</th>
                <th className="px-3 py-2.5 text-left">Procedimento</th>
                <th className="px-3 py-2.5 text-right">Preço Base</th>
                <th className="px-3 py-2.5 text-center">Repasse %</th>
                <th className="px-3 py-2.5 text-center">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {feeSchedules.map((fs) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
