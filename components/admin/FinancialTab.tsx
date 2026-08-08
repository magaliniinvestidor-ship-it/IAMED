'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AccountPayable,
  AccountReceivable,
  CashFlowProjection,
  BankReconciliation,
  AdminFinanceModuleProps,
} from './AdminContext';
import { GS } from './helpers';

interface FinancialTabProps {
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  cashFlows: CashFlowProjection[];
  bankReconciliations: BankReconciliation[];
  financePostings: AdminFinanceModuleProps['financePostings'];
  addAuditLog: (action: string, target: string) => void;
}

type FinSubTab =
  | 'ap_ar'
  | 'cashflow'
  | 'reconciliation'
  | 'dashboard';

const STATUS_BADGE_AP: Record<string, string> = {
  pago: 'bg-emerald-100 text-emerald-800',
  vencido: 'bg-rose-100 text-rose-800',
  a_vencer: 'bg-blue-100 text-blue-800',
  cancelado: 'bg-slate-100 text-slate-500',
};

const STATUS_BADGE_AR: Record<string, string> = {
  recebido: 'bg-emerald-100 text-emerald-800',
  vencido: 'bg-amber-100 text-amber-800',
  a_vencer: 'bg-blue-100 text-blue-800',
  cancelado: 'bg-slate-100 text-slate-500',
};

export function FinancialTab({
  accountsPayable,
  accountsReceivable,
  cashFlows,
  bankReconciliations,
  financePostings,
}: FinancialTabProps) {
  const { t } = useI18n();
  const [subTab, setSubTab] = useState<FinSubTab>('dashboard');

  const totalAP = accountsPayable.reduce((s, ap) => s + ap.amount, 0);
  const totalAPVencido = accountsPayable
    .filter((ap) => ap.status === 'vencido')
    .reduce((s, ap) => s + ap.amount, 0);
  const totalAR = accountsReceivable.reduce((s, ar) => s + ar.amount, 0);
  const totalARVencido = accountsReceivable
    .filter((ar) => ar.status === 'vencido')
    .reduce((s, ar) => s + ar.amount, 0);
  const totalReceitas = financePostings
    .filter((p) => p.type === 'receita')
    .reduce((s, p) => s + p.amount, 0);
  const totalDespesas = financePostings
    .filter((p) => p.type === 'despesa')
    .reduce((s, p) => s + p.amount, 0);
  const lucroLiquido = totalReceitas - totalDespesas;

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'ap_ar', label: '💸 Contas a Pagar/Receber' },
          { key: 'cashflow', label: '📈 Fluxo de Caixa' },
          { key: 'reconciliation', label: '🏦 Conciliação' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key as FinSubTab)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              subTab === t.key
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {subTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between mb-2">
              <ArrowUpRight className="w-5 h-5 opacity-70" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">A Pagar</span>
            </div>
            <p className="text-2xl font-black">{GS(totalAP)}</p>
            {totalAPVencido > 0 && (
              <p className="text-[10px] mt-1 opacity-80">Vencido: {GS(totalAPVencido)}</p>
            )}
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between mb-2">
              <ArrowDownRight className="w-5 h-5 opacity-70" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">A Receber</span>
            </div>
            <p className="text-2xl font-black">{GS(totalAR)}</p>
            {totalARVencido > 0 && (
              <p className="text-[10px] mt-1 opacity-80">Vencido: {GS(totalARVencido)}</p>
            )}
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-5 h-5 opacity-70" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Receitas</span>
            </div>
            <p className="text-2xl font-black">{GS(totalReceitas)}</p>
          </div>
          <div
            className={`rounded-xl p-4 text-white shadow-md ${
              lucroLiquido >= 0
                ? 'bg-gradient-to-br from-teal-500 to-teal-600'
                : 'bg-gradient-to-br from-amber-500 to-amber-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 opacity-70" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Lucro Líquido</span>
            </div>
            <p className="text-2xl font-black">{GS(lucroLiquido)}</p>
          </div>
        </div>
      )}

      {/* AP/AR */}
      {subTab === 'ap_ar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Contas a Pagar ({accountsPayable.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-3 py-2.5 text-left">Descrição</th>
                    <th className="px-3 py-2.5 text-left">Fornecedor</th>
                    <th className="px-3 py-2.5 text-right">{t('fin_th_valor', 'app')}</th>
                    <th className="px-3 py-2.5 text-center">Vencimento</th>
                    <th className="px-3 py-2.5 text-center">Dias</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {accountsPayable.map((ap) => (
                    <tr key={ap.id} className={`hover:bg-slate-50/70 ${ap.status === 'vencido' ? 'bg-rose-50/50' : ''}`}>
                      <td className="px-3 py-2.5 font-semibold text-slate-700 max-w-[160px] truncate">{ap.description}</td>
                      <td className="px-3 py-2.5 text-slate-600">{ap.supplier}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{GS(ap.amount)}</td>
                      <td className="px-3 py-2.5 text-center text-slate-500">{ap.due_date}</td>
                      <td className="px-3 py-2.5 text-center">
                        {ap.days_overdue > 0 ? (
                          <span className="text-rose-600 font-bold">{ap.days_overdue}d</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${STATUS_BADGE_AP[ap.status] || 'bg-slate-100 text-slate-500'}`}>
                          {ap.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Contas a Receber ({accountsReceivable.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-3 py-2.5 text-left">Descrição</th>
                    <th className="px-3 py-2.5 text-left">Paciente</th>
                    <th className="px-3 py-2.5 text-right">{t('fin_th_valor', 'app')}</th>
                    <th className="px-3 py-2.5 text-center">Vencimento</th>
                    <th className="px-3 py-2.5 text-center">Dias</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {accountsReceivable.map((ar) => (
                    <tr key={ar.id} className={`hover:bg-slate-50/70 ${ar.status === 'vencido' ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-3 py-2.5 font-semibold text-slate-700 max-w-[160px] truncate">{ar.description}</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {ar.patient_name}
                        <br />
                        <span className="text-[9px] text-slate-400">{ar.insurance_name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{GS(ar.amount)}</td>
                      <td className="px-3 py-2.5 text-center text-slate-500">{ar.due_date}</td>
                      <td className="px-3 py-2.5 text-center">
                        {ar.days_overdue > 0 ? (
                          <span className="text-amber-600 font-bold">{ar.days_overdue}d</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${STATUS_BADGE_AR[ar.status] || 'bg-slate-100 text-slate-500'}`}>
                          {ar.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cashflow */}
      {subTab === 'cashflow' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" /> Fluxo de Caixa Diário
            </h4>
            <div className="flex gap-2 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Realizado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" /> Projetado
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left">{t('fin_th_data', 'app')}</th>
                  <th className="px-4 py-2.5 text-center">Tipo</th>
                  <th className="px-4 py-2.5 text-right">Receitas</th>
                  <th className="px-4 py-2.5 text-right">Despesas</th>
                  <th className="px-4 py-2.5 text-right">Saldo Dia</th>
                  <th className="px-4 py-2.5 text-right font-bold">Acumulado</th>
                  <th className="px-4 py-2.5 text-left">Obs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cashFlows.map((cf) => (
                  <tr key={cf.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-700">{cf.date}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cf.type === 'realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {cf.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">{GS(cf.income)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600 font-bold">{GS(cf.expense)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${cf.balance >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
                      {cf.balance >= 0 ? '+' : ''}
                      {GS(cf.balance)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{GS(cf.accumulated)}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[120px] truncate">{cf.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reconciliation */}
      {subTab === 'reconciliation' && (
        <div className="space-y-4">
          {bankReconciliations.map((br) => (
            <div key={br.id} className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-black text-slate-800 text-sm">{br.bank_name}</h4>
                  <p className="text-[10px] text-slate-500">
                    Conta {br.account_number} · Data: {br.statement_date}
                  </p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                  br.status === 'conciliado' ? 'bg-emerald-100 text-emerald-700'
                    : br.status === 'pendente' ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {br.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Saldo Bancário</p>
                  <p className="font-mono font-bold text-slate-800">{GS(br.bank_balance)}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Saldo Contábil</p>
                  <p className="font-mono font-bold text-slate-800">{GS(br.book_balance)}</p>
                </div>
                <div className={`p-2 rounded-lg ${
                  br.difference === 0 ? 'bg-emerald-50' : 'bg-amber-50'
                }`}>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Diferença</p>
                  <p className={`font-mono font-bold ${
                    br.difference === 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}>{GS(br.difference)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
