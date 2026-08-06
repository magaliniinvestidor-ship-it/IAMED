'use client';

import React, { useState, useMemo } from 'react';
import { Pill, Plus, Search, Package, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { useFormValidation } from '@/lib/validation';
import { pharmacyItemSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';
import {
  PharmacyItem,
  EstoqueFarmaciaModuleProps,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  GS,
} from './StockContext';

interface StockItemsTabProps {
  pharmacyItems: PharmacyItem[];
  setPharmacyItems: EstoqueFarmaciaModuleProps['setPharmacyItems'];
  addAuditLog: (action: string, target: string) => void;
}

export function StockItemsTab({
  pharmacyItems,
  setPharmacyItems,
  addAuditLog,
}: StockItemsTabProps) {
  const { t } = useI18n();
  const genModuleId = useModuleId();
  const { errors, validate } = useFormValidation(pharmacyItemSchema);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<keyof typeof CATEGORY_LABELS>('venda_livre');
  const [presentation, setPresentation] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [minQuantity, setMinQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('venda_livre');
    setPresentation('');
    setManufacturer('');
    setMinQuantity(10);
    setUnitCost(0);
    setUnitPrice(0);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: PharmacyItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory((item.category as keyof typeof CATEGORY_LABELS) || 'venda_livre');
    setPresentation(item.presentation || '');
    setManufacturer(item.manufacturer || '');
    setMinQuantity(item.minQuantity || 10);
    setUnitCost(item.unitCost || 0);
    setUnitPrice(item.unitPrice || 0);
    setShowForm(true);
  };

  const filtered = useMemo(() => {
    return pharmacyItems.filter((item) => {
      if (filterCategory !== 'todas' && item.category !== filterCategory) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [pharmacyItems, search, filterCategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = validate({
      name,
      category,
      presentation,
      manufacturer,
      minQuantity,
      unitCost,
      unitPrice,
    });
    if (!result.success) return;

    if (editingId) {
      setPharmacyItems((prev) =>
        prev.map((i) =>
          i.id === editingId
            ? { ...i, name, category, presentation, manufacturer, minQuantity, unitCost, unitPrice }
            : i
        )
      );
      if (supabase) {
        await supabase
          .from('pharmacy_items')
          .update({
            name,
            category,
            presentation,
            manufacturer,
            min_quantity: minQuantity,
            unit_cost: unitCost,
            unit_price: unitPrice,
          } as Record<string, unknown>)
          .eq('id', editingId);
      }
      addAuditLog('Atualizou Item Farmácia', name);
    } else {
      const id = await genModuleId('pharm');
      const newItem: PharmacyItem = {
        id,
        name,
        category,
        presentation,
        manufacturer,
        dinavisaRegistration: '',
        requiresPrescription: category !== 'venda_livre',
        totalQuantity: 0,
        lots: [],
        storageLocation: '',
        minQuantity,
        unitCost,
        unitPrice,
        active: true,
      };
      setPharmacyItems((prev) => [...prev, newItem]);
      if (supabase) {
        await supabase
          .from('pharmacy_items')
          .insert({ ...newItem, created_at: new Date().toISOString() });
      }
      addAuditLog('Cadastrou Item Farmácia', name);
    }
    resetForm();
    setShowForm(false);
  };

  const handleToggleActive = async (item: PharmacyItem) => {
    const updated = { ...item, active: !item.active };
    setPharmacyItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    if (supabase) {
      await supabase.from('pharmacy_items').update({ active: updated.active } as Record<string, unknown>).eq('id', item.id);
    }
    addAuditLog(updated.active ? 'Ativou Item' : 'Desativou Item', item.name);
  };

  const handleDelete = (item: PharmacyItem) => {
    if (typeof window === 'undefined') return;
    if (!confirm(`Excluir item ${item.name}?`)) return;
    setPharmacyItems((prev) => prev.filter((i) => i.id !== item.id));
    if (supabase) {
      supabase.from('pharmacy_items').delete().eq('id', item.id);
    }
    addAuditLog('Removeu Item Farmácia', item.name);
  };

  const lowStock = pharmacyItems.filter((i) => (i.totalQuantity || 0) < (i.minQuantity || 10));

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-4 text-white shadow-md">
          <Package className="w-5 h-5 opacity-70 mb-1" />
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total de Itens</p>
          <p className="text-2xl font-black">{pharmacyItems.length}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-md">
          <AlertTriangle className="w-5 h-5 opacity-70 mb-1" />
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Estoque Baixo</p>
          <p className="text-2xl font-black">{lowStock.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
          <Pill className="w-5 h-5 opacity-70 mb-1" />
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Valor Total</p>
          <p className="text-2xl font-black">
            {GS(pharmacyItems.reduce((s, i) => s + (i.totalQuantity || 0) * (i.unitCost || 0), 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar item..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="todas">Todas Categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={openNew}
            className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Item
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const isLow = (item.totalQuantity || 0) < (item.minQuantity || 10);
          const catClass = CATEGORY_COLORS[(item.category as keyof typeof CATEGORY_LABELS) || 'venda_livre'] || '';

          return (
            <div
              key={item.id}
              className={`p-4 bg-white rounded-xl border shadow-xs hover:shadow-md transition ${
                isLow ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80'
              } ${!item.active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-black text-slate-800 text-sm">{item.name}</p>
                  <p className="text-[10px] text-slate-500">{item.presentation}</p>
                  <p className="text-[10px] text-slate-400">{item.manufacturer}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${catClass}`}>
                  {CATEGORY_LABELS[(item.category as keyof typeof CATEGORY_LABELS) || 'venda_livre']}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Estoque</p>
                  <p className={`font-mono font-bold ${isLow ? 'text-amber-600' : 'text-slate-700'}`}>
                    {item.totalQuantity || 0} / mín {item.minQuantity || 10}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Preço</p>
                  <p className="font-mono font-bold text-slate-700">{GS(item.unitPrice || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded ${
                    item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-teal-50">
              <h3 className="font-bold text-teal-800 text-sm">
                {editingId ? 'Editar Item' : 'Novo Item de Estoque'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              {errors.length > 0 && <FormErrorSummary errors={errors} />}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dipirona 500mg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as keyof typeof CATEGORY_LABELS)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Apresentação</label>
                  <input
                    type="text"
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    placeholder="Ex: Caixa 20 comprimidos"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Fabricante</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Custo (Gs.)</label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Preço (Gs.)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
                >
                  {editingId ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
