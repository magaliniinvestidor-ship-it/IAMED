'use client';

import React, { useState } from 'react';
import { Stamp, Shield, Plus, X, FileCheck, Printer } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { Dte, DteItem, Patient, AdminFinanceModuleProps, PROCEDURES } from './AdminContext';
import { STATUS_BADGE } from './AdminContext';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { dteSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';
import { GS, generateCdc, generateXml } from './helpers';

const DTE_TYPES = [
  'Fatura Eletrônica',
  'Nota de Crédito',
  'Nota de Débito',
  'Nota de Remessa',
  'Autofatura',
] as const;

interface DteTabProps {
  dtes: Dte[];
  setDtes: React.Dispatch<React.SetStateAction<Dte[]>>;
  patients: Patient[];
  addAuditLog: (action: string, target: string) => void;
  onShowKude: (dte: Dte) => void;
}

export function DteTab({ dtes, setDtes, patients, addAuditLog, onShowKude }: DteTabProps) {
  const { t } = useI18n();
  const genModuleId = useModuleId();
  const { errors, validate } = useFormValidation(dteSchema);

  const [dteEnv, setDteEnv] = useState<'homologacao' | 'producao'>('homologacao');
  const [timbrado, setTimbrado] = useState('12568942');
  const [establishment, setEstablishment] = useState('001');
  const [expPoint, setExpPoint] = useState('001');
  const [certName] = useState('CN=IAMED SA / O=DNIT / C=PY');
  const [dteFormOpen, setDteFormOpen] = useState(false);
  const [dteType, setDteType] = useState<typeof DTE_TYPES[number]>('Fatura Eletrônica');
  const [dtePatient, setDtePatient] = useState('');
  const [dtePatientEmail, setDtePatientEmail] = useState('');
  const [dtePatientPhone, setDtePatientPhone] = useState('');
  const [dteItems, setDteItems] = useState<DteItem[]>([
    { code: '10101012', description: 'Consulta Médica Geral', quantity: 1, unit_price: 150000, iva_rate: 10, total: 150000 },
  ]);

  const calcTotals = (items: DteItem[]) => {
    const iva5 = items.filter((i) => i.iva_rate === 5).reduce((s, i) => s + i.total, 0) * 5 / 105;
    const iva10 = items.filter((i) => i.iva_rate === 10).reduce((s, i) => s + i.total, 0) * 10 / 110;
    const amount = items.reduce((s, i) => s + i.total, 0);
    return { iva_5: Math.round(iva5), iva_10: Math.round(iva10), amount };
  };

  const handleAddProcedure = () => {
    const proc = PROCEDURES[Math.floor(Math.random() * PROCEDURES.length)];
    setDteItems((prev) => [
      ...prev,
      { code: proc.code, description: proc.desc, quantity: 1, unit_price: proc.price, iva_rate: proc.iva as 5 | 10, total: proc.price },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setDteItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEmitirDte = async () => {
    const result = validate({
      type: dteType,
      patient_name: dtePatient,
      patient_email: dtePatientEmail,
      patient_phone: dtePatientPhone,
      ruc: '',
      items: dteItems,
    });
    if (!result.success) return;

    const totals = calcTotals(dteItems);
    const seq = dtes.length + 1;
    const numberStr = `${establishment}-${expPoint}-${String(seq).padStart(7, '0')}`;

    const newDte: Dte = {
      id: await genModuleId('dte'),
      cdc: generateCdc(timbrado, establishment, expPoint, seq),
      type: dteType,
      number: numberStr,
      timbrado,
      establishment,
      expedition_point: expPoint,
      patient_name: dtePatient,
      patient_email: dtePatientEmail || undefined,
      patient_phone: dtePatientPhone || undefined,
      date: new Date().toISOString().split('T')[0],
      amount: totals.amount,
      iva_5: totals.iva_5,
      iva_10: totals.iva_10,
      environment: dteEnv,
      status: 'Gerado',
      payment_status: 'pendente',
      items: dteItems,
    };

    newDte.xml_content = generateXml(newDte, certName, dteEnv);

    setDtes((prev) => [newDte, ...prev]);
    if (supabase) {
      await supabase.from('dtes').insert({ ...newDte, items: JSON.stringify(dteItems), created_at: new Date().toISOString() });
    }
    addAuditLog('Emitiu DTE', `${dteType} ${numberStr} — ${dtePatient}`);
    setDteFormOpen(false);
    setDtePatient('');
    setDtePatientEmail('');
    setDtePatientPhone('');
    onShowKude(newDte);
  };

  return (
    <div className="space-y-5">
      {/* Config bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Stamp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">{t('sifen_billing', 'app')}</h3>
              <p className="text-[10px] text-slate-500">Sistema Integrado de Faturação Eletrônica Nacional · Paraguay</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-bold">
              <Shield className="w-3 h-3" /> PCSC Ativo — Lei 6822/2021
            </div>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
              <button
                onClick={() => setDteEnv('homologacao')}
                className={`px-3 py-1.5 rounded text-[10px] font-bold transition ${
                  dteEnv === 'homologacao' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🧪 Homologação
              </button>
              <button
                onClick={() => setDteEnv('producao')}
                className={`px-3 py-1.5 rounded text-[10px] font-bold transition ${
                  dteEnv === 'producao' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🚀 Produção
              </button>
            </div>
          </div>
        </div>

        {/* Timbrado config row */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div>
            <label className="block text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Timbrado (8 dígitos)</label>
            <input
              value={timbrado}
              onChange={(e) => setTimbrado(e.target.value.slice(0, 8))}
              maxLength={8}
              className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
              placeholder="12345678"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Estabelecimento</label>
            <input
              value={establishment}
              onChange={(e) => setEstablishment(e.target.value.slice(0, 3))}
              maxLength={3}
              className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
              placeholder="001"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Ponto Expedição</label>
            <input
              value={expPoint}
              onChange={(e) => setExpPoint(e.target.value.slice(0, 3))}
              maxLength={3}
              className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
              placeholder="001"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Certificado Digital (PCSC)</label>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 truncate">
              {certName}
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDteFormOpen((v) => !v)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> {t('fin_emit_new_dte', 'app')}
            </button>
          </div>
        </div>
      </div>

      {/* Emission Form */}
      {dteFormOpen && (
        <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600" /> {t('fin_new_electronic_tax_doc', 'app')}
            </h4>
            <button onClick={() => setDteFormOpen(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Tipo de DTE</label>
              <select
                value={dteType}
                onChange={(e) => setDteType(e.target.value as typeof DTE_TYPES[number])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                {DTE_TYPES.map((tp) => (
                  <option key={tp}>{tp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Paciente / Receptor</label>
              <input
                list="dte-patients-list"
                value={dtePatient}
                onChange={(e) => {
                  setDtePatient(e.target.value);
                  const found = patients.find((p) => p.name === e.target.value);
                  if (found) {
                    setDtePatientEmail(found.email || '');
                    setDtePatientPhone(found.phone || '');
                  }
                }}
                placeholder="Nome do paciente"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <datalist id="dte-patients-list">
                {patients.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">E-mail</label>
              <input
                type="text"
                value={dtePatientEmail}
                onChange={(e) => setDtePatientEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-700 text-xs">Procedimentos</h5>
              <button
                onClick={handleAddProcedure}
                className="text-[10px] py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            <div className="space-y-1">
              {dteItems.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1 text-[11px] items-center bg-white p-2 rounded">
                  <input
                    className="col-span-2 p-1 bg-slate-50 border border-slate-200 rounded font-mono"
                    value={it.code}
                    onChange={(e) => {
                      const newItems = [...dteItems];
                      newItems[idx] = { ...it, code: e.target.value };
                      setDteItems(newItems);
                    }}
                  />
                  <input
                    className="col-span-5 p-1 bg-slate-50 border border-slate-200 rounded"
                    value={it.description}
                    onChange={(e) => {
                      const newItems = [...dteItems];
                      newItems[idx] = { ...it, description: e.target.value };
                      setDteItems(newItems);
                    }}
                  />
                  <input
                    type="number"
                    className="col-span-1 p-1 bg-slate-50 border border-slate-200 rounded text-center"
                    value={it.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value) || 1;
                      const newItems = [...dteItems];
                      newItems[idx] = { ...it, quantity: qty, total: qty * it.unit_price };
                      setDteItems(newItems);
                    }}
                  />
                  <input
                    type="number"
                    className="col-span-2 p-1 bg-slate-50 border border-slate-200 rounded text-right"
                    value={it.unit_price}
                    onChange={(e) => {
                      const price = Number(e.target.value) || 0;
                      const newItems = [...dteItems];
                      newItems[idx] = { ...it, unit_price: price, total: price * it.quantity };
                      setDteItems(newItems);
                    }}
                  />
                  <select
                    className="col-span-1 p-1 bg-slate-50 border border-slate-200 rounded"
                    value={it.iva_rate}
                    onChange={(e) => {
                      const newItems = [...dteItems];
                      newItems[idx] = { ...it, iva_rate: Number(e.target.value) as 5 | 10 | 0 };
                      setDteItems(newItems);
                    }}
                  >
                    <option value={10}>10%</option>
                    <option value={5}>5%</option>
                    <option value={0}>0%</option>
                  </select>
                  <span className="col-span-1 text-right font-mono font-bold text-slate-700">{GS(it.total)}</span>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="col-span-0 p-1 hover:bg-rose-50 rounded"
                  >
                    <X className="w-3 h-3 text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="text-right pt-2 border-t border-slate-200 text-xs space-y-0.5">
              <p className="text-slate-500">IVA 5%: <span className="font-mono font-bold">{GS(calcTotals(dteItems).iva_5)}</span></p>
              <p className="text-slate-500">IVA 10%: <span className="font-mono font-bold">{GS(calcTotals(dteItems).iva_10)}</span></p>
              <p className="font-black text-slate-900">TOTAL: <span className="font-mono">{GS(calcTotals(dteItems).amount)}</span></p>
            </div>
          </div>

          <button
            onClick={handleEmitirDte}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black rounded-xl shadow-md text-sm transition"
          >
            🚀 Emitir DTE — {dteEnv === 'producao' ? 'PRODUÇÃO' : 'TEST'}
          </button>
        </div>
      )}

      {/* DTEs List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-800 text-sm">Documentos Emitidos ({dtes.length})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">Número</th>
                <th className="px-4 py-2.5 text-left">Tipo</th>
                <th className="px-4 py-2.5 text-left">{t('fin_th_paciente', 'app')}</th>
                <th className="px-4 py-2.5 text-right">{t('fin_th_total', 'app')}</th>
                <th className="px-4 py-2.5 text-center">{t('fin_th_status', 'app')}</th>
                <th className="px-4 py-2.5 text-center">{t('fin_th_pagamento', 'app')}</th>
                <th className="px-4 py-2.5 text-center">{t('fin_th_acoes', 'app')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dtes.map((dte) => (
                <tr key={dte.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 text-[10px]">{dte.number}</td>
                  <td className="px-4 py-3 text-slate-600">{dte.type}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{dte.patient_name}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{GS(dte.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={STATUS_BADGE(dte.status)}>{dte.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                        dte.payment_status === 'pago'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : dte.payment_status === 'conciliado'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {dte.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onShowKude(dte)}
                      className="p-1.5 hover:bg-teal-100 text-teal-600 rounded inline-flex items-center gap-1 text-[10px] font-bold"
                      title="Ver KuDE"
                    >
                      <Printer className="w-3 h-3" /> KuDE
                    </button>
                  </td>
                </tr>
              ))}
              {dtes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold text-xs">
                    Nenhum DTE emitido.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
