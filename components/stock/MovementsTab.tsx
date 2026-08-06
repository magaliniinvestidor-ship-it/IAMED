'use client';

import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Package, TrendingUp, TrendingDown, Filter, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { StockMovement, EstoqueFarmaciaModuleProps, MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS, GS } from './StockContext';

interface MovementsTabProps {
  stockMovements: StockMovement[];
  setStockMovements: EstoqueFarmaciaModuleProps['setStockMovements'];
  addAuditLog: (action: string, target: string) => void;
}

const MOVEMENT_TYPES = ['entrada', 'saida', 'perda', 'transferencia', 'ajuste'] as const;

export function MovementsTab({
  stockMovements,
  setStockMovements,
  addAuditLog,
}: MovementsTabProps) {
  const { t } = useI18n();
  const genModuleId = useModuleId();

  const [filterType, setFilterType] = useState<string>('todos');

  const filtered = useMemo(() => {
    const moves = filterType === 'todos'
      ? stockMovements
      : stockMovements.filter((m) => m.movementType === filterType);
    return [...moves].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  }, [stockMovements, filterType]);

  const stats = useMemo(() => {
    const totalEntradas = stockMovements
      .filter((m) => m.movementType === 'entrada')
      .reduce((s, m) => s + (m.totalCost || (m.quantity * (m.unitCost || 0))), 0);
    const totalSaidas = stockMovements
      .filter((m) => m.movementType === 'saida')
      .reduce((s, m) => s + (m.totalCost || (m.quantity * (m.unitCost || 0))), 0);
    const totalPerdas = stockMovements
      .filter((m) => m.movementType === 'perda')
      .reduce((s, m) => s + (m.totalCost || (m.quantity * (m.unitCost || 0))), 0);
    return { totalEntradas, totalSaidas, totalPerdas };
  }, [stockMovements]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
          <TrendingUp className="w-5 h-5 opacity-70 mb-1" />
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Entradas</p>
          <p className="text-xl font-black">{GS(stats.totalEntradas)}</p>
          <p className="text-[10px] opacity-80 mt-1">
            {stockMovements.filter((m) => m.movementType === 'entrada').length} movimentos
          </p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-4 text-white shadow-md">
          <TrendingDown className="w-5 h-5 opacity-70 mb-1" />
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Saídas</p>
          <p className="text-xl font-black">{GS(stats.totalSaidas)}</p>
          <p className="text-[10px] opacity-80 mt-1">
            {stockMovements.filter((m) => m.movementType === 'saida').length} movimentos
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-4 text-white shadow-md">
          <Package className="w-5 h-5 opacity-70 mb-1" />
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Perdas</p>
          <p className="text-xl font-black">{GS(stats.totalPerdas)}</p>
          <p className="text-[10px] opacity-80 mt-1">
            {stockMovements.filter((m) => m.movementType === 'perda').length} movimentos
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Tipo:</span>
          <button
            onClick={() => setFilterType('todos')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
              filterType === 'todos' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {MOVEMENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                filterType === type ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {MOVEMENT_TYPE_LABELS[type]}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-500">
            <b>{filtered.length}</b> movimentos
          </span>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-teal-600" />
          <h3 className="font-black text-slate-800 text-sm">Histórico de Movimentações</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">Data</th>
                <th className="px-4 py-2.5 text-left">Tipo</th>
                <th className="px-4 py-2.5 text-left">Item</th>
                <th className="px-4 py-2.5 text-center">Qtd</th>
                <th className="px-4 py-2.5 text-right">Custo Unit.</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-left">Paciente/Setor</th>
                <th className="px-4 py-2.5 text-left">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((m) => {
                const typeClass = MOVEMENT_TYPE_COLORS[m.movementType] || 'bg-slate-100 text-slate-800';
                const total = m.totalCost || (m.quantity * (m.unitCost || 0));
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                      {m.date}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${typeClass}`}>
                        {MOVEMENT_TYPE_LABELS[m.movementType] || m.movementType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">
                      {m.itemName}
                      {m.lotNumber && (
                        <span className="text-[10px] text-slate-400 ml-1">Lote: {m.lotNumber}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold">
                      {m.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                      {GS(m.unitCost)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                      {GS(total)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-[180px] truncate text-[10px]">
                      {m.patientName && <span className="font-semibold text-slate-700">{m.patientName}</span>}
                      {m.procedureName && <span> · {m.procedureName}</span>}
                      {m.sector && <span> · {m.sector}</span>}
                      {m.doctorName && <span> · {m.doctorName}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-[10px]">
                      {m.operatorName}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-semibold text-xs">
                    Nenhuma movimentação encontrada.
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
