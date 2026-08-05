'use client';

import React, { useState } from 'react';
import { Activity, Filter, Calendar, User, Hash } from 'lucide-react';
import { AuditLog } from './AdminContext';

interface AuditTabProps {
  logs: AuditLog[];
}

export function AuditTab({ logs }: AuditTabProps) {
  const [filterAction, setFilterAction] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const actions = Array.from(new Set(logs.map((l) => l.action))).sort();
  const operators = Array.from(new Set(logs.map((l) => l.operator))).sort();

  const filtered = logs.filter((log) => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterOperator && log.operator !== filterOperator) return false;
    if (filterDateFrom && log.timestamp < filterDateFrom) return false;
    if (filterDateTo && log.timestamp > filterDateTo + 'T23:59:59') return false;
    return true;
  });

  const actionColor = (action: string): string => {
    if (action.includes('Criou') || action.includes('Cadastrou') || action.includes('Novo')) return 'bg-emerald-100 text-emerald-800';
    if (action.includes('Excluiu') || action.includes('Removeu')) return 'bg-rose-100 text-rose-800';
    if (action.includes('Atualizou') || action.includes('Editou') || action.includes('Alterou')) return 'bg-blue-100 text-blue-800';
    if (action.includes('Login') || action.includes('Logout')) return 'bg-indigo-100 text-indigo-800';
    if (action.includes('Emitiu') || action.includes('Enviou')) return 'bg-teal-100 text-teal-800';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-teal-600" />
          <h3 className="font-bold text-slate-800 text-sm">Filtros de Auditoria</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Ação</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="">Todas as ações</option>
              {actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Operador</label>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="">Todos</option>
              {operators.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">De</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Até</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-slate-500">
            Mostrando <b>{filtered.length}</b> de {logs.length} registros
          </p>
          {(filterAction || filterOperator || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => {
                setFilterAction('');
                setFilterOperator('');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="text-[10px] text-teal-600 hover:text-teal-700 font-bold"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          <h3 className="font-black text-slate-800 text-sm">Log de Auditoria</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data/Hora
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" /> Operador
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left">Função</th>
                <th className="px-4 py-2.5 text-left">Ação</th>
                <th className="px-4 py-2.5 text-left">Alvo</th>
                <th className="px-4 py-2.5 text-left">
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> IP
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{log.operator}</td>
                  <td className="px-4 py-3 text-slate-500 text-[10px]">{log.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${actionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{log.target}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{log.ip}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold text-xs">
                    Nenhum log encontrado com os filtros aplicados.
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
