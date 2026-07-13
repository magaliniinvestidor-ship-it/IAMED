'use client';

import React, { useState } from 'react';
import { Briefcase, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';

interface ProfessionalRole {
  id: string;
  name: string;
  description?: string;
  category?: string;
  active: boolean;
}

interface RolesTabProps {
  professionalRoles: {id: string; name: string; description?: string; category?: string; active?: boolean}[];
  setProfessionalRoles: React.Dispatch<React.SetStateAction<{id: string; name: string; description?: string; category?: string; active?: boolean}[]>>;
  supabase: SupabaseClient | null;
  addAuditLog: (action: string, target: string) => void;
}

export default function RolesTab({ professionalRoles, setProfessionalRoles, supabase, addAuditLog }: RolesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setCategory('');
    setActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    if (editingId) {
      if (supabase) {
        const { error } = await supabase.from('professional_roles').update({
          name: name.trim(),
          description: description.trim(),
          category: category.trim() || null,
          active: true,
        }).eq('id', editingId);
        if (error) console.error('Erro ao atualizar profissão:', error.message, error);
      }
      setProfessionalRoles(prev => prev.map(r => r.id === editingId ? { ...r, name: name.trim(), description: description.trim(), category: category.trim() || undefined, active: true } : r));
      addAuditLog('Editou Profissão', name);
    } else {
      const numericIds = professionalRoles.map(r => {
        const match = r.id.match(/^role_(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const nextIdNum = Math.max(...numericIds, 0) + 1;
      const newId = `role_${String(nextIdNum).padStart(2, '0')}`;
      if (supabase) {
        const { error } = await supabase.from('professional_roles').insert({
          id: newId,
          name: name.trim(),
          description: description.trim(),
          category: category.trim() || null,
          active: true,
        });
        if (error) console.error('Erro ao salvar profissão no Supabase:', error.message, error);
      }
      setProfessionalRoles(prev => [...prev, { id: newId, name: name.trim(), description: description.trim(), category: category.trim() || undefined, active: true }]);
      addAuditLog('Cadastrou Profissão', name);
    }
    resetForm();
  };

  const handleEdit = (role: ProfessionalRole) => {
    setEditingId(role.id);
    setName(role.name);
    setDescription(role.description || '');
    setCategory(role.category || '');
    setActive(role.active);
  };

  const handleDelete = async (id: string, roleName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a profissão "${roleName}"?`)) return;
    if (supabase) {
      const { error } = await supabase.from('professional_roles').delete().eq('id', id);
      if (error) console.error('Erro ao excluir profissão:', error.message, error);
    }
    setProfessionalRoles(prev => prev.filter(r => r.id !== id));
    addAuditLog('Removeu Profissão', roleName);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const newActive = !currentActive;
    if (supabase) {
      const { error } = await supabase.from('professional_roles').update({ active: newActive }).eq('id', id);
      if (error) console.error('Erro ao atualizar profissão:', error.message, error);
    }
    setProfessionalRoles(prev => prev.map(r => r.id === id ? { ...r, active: newActive } : r));
  };

  const categories = [...new Set(professionalRoles.filter(r => r.category).map(r => r.category))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Briefcase className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800 text-base">{editingId ? 'Editar Profissão' : 'Nova Profissão'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-sans">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nome da Profissão *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Fonoaudiólogo(a)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Ex: Reabilitação"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              list="categories"
            />
            <datalist id="categories">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Responsável por realizar exames de imagem e diagnósticos..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition">
              {editingId ? 'Salvar' : 'Cadastrar'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Profissões Cadastradas ({professionalRoles.length})
          </h3>
        </div>
        <div className="space-y-2">
          {professionalRoles.map(role => (
            <div key={role.id} className={`p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs transition ${!role.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm">{role.name}</p>
                  {role.category && <p className="text-slate-500 font-medium">{role.category}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle pill ativo/inativo */}
                <button
                  onClick={() => handleToggleActive(role.id, role.active ?? true)}
                  title={role.active ? 'Clique para desativar' : 'Clique para ativar'}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer select-none ${
                    (role.active ?? true)
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 ring-1 ring-emerald-300'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 ring-1 ring-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    (role.active ?? true) ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                  {(role.active ?? true) ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  onClick={() => handleEdit({ id: role.id, name: role.name, description: role.description || '', category: role.category || '', active: role.active ?? true })}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(role.id, role.name)}
                  className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {professionalRoles.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-semibold">Nenhuma profissão cadastrada</div>
          )}
        </div>
      </div>
    </div>
  );
}
