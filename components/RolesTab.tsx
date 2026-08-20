'use client';

import React, { useState } from 'react';
import { Briefcase, Plus, Edit2, Trash2 } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useFormValidation } from '@/lib/validation';
import { professionalRoleSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const { t } = useI18n();
  const { errors, validate, clearErrors } = useFormValidation(professionalRoleSchema);
  const [showForm, setShowForm] = useState(false);
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
    clearErrors();
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate({ name, description, category });
    if (!result.success) return;

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
      let newId: string;
      if (supabase) {
        const { data, error: rpcErr } = await supabase.rpc('next_role_id');
        if (rpcErr || !data) {
          console.error('Erro ao gerar ID de profissão via RPC:', rpcErr?.message);
          return;
        }
        newId = data as string;
      } else {
        newId = `role_${String(professionalRoles.length + 1).padStart(2, '0')}`;
      }
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
    setShowForm(false);
  };

  const handleEdit = (role: ProfessionalRole) => {
    setEditingId(role.id);
    setName(role.name);
    setDescription(role.description || '');
    setCategory(role.category || '');
    setActive(role.active);
    clearErrors();
    setShowForm(true);
  };

  const handleDelete = async (id: string, roleName: string) => {
    if (!confirm(t('fin_confirm_delete_role', 'app').replace('{name}', roleName))) return;
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-violet-600" /> {t('fin_registered_roles', 'app')} ({professionalRoles.length})
        </h3>
        <button
          onClick={openNew}
          className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> {t('fin_new_role', 'app')}
        </button>
      </div>

      {showForm && (
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) { resetForm(); setShowForm(false); } }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-xl border-0">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                {editingId ? t('fin_edit_role', 'app') : t('fin_new_role', 'app')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} noValidate className="space-y-3 text-xs font-sans">
          {errors.length > 0 && <FormErrorSummary errors={errors} />}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_role_name_label', 'app')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('fin_role_name_placeholder', 'app')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_role_category_label', 'app')}</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder={t('fin_role_category_placeholder', 'app')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              list="categories"
            />
            <datalist id="categories">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_role_description_label', 'app')}</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('fin_role_description_placeholder', 'app')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition">
              {editingId ? t('app_save', 'app') : t('app_register', 'app')}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
              {t('app_cancel', 'app')}
            </button>
          </div>
          </form>
          </DialogContent>
        </Dialog>
      )}

      {/* List */}
      <div className="space-y-3">
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
                  title={role.active ? t('fin_role_title_deactivate', 'app') : t('fin_role_title_activate', 'app')}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer select-none ${
                    (role.active ?? true)
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 ring-1 ring-emerald-300'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 ring-1 ring-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    (role.active ?? true) ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                  {(role.active ?? true) ? t('fin_active', 'app') : t('fin_inactive', 'app')}
                </button>
                <button
                  onClick={() => handleEdit({ id: role.id, name: role.name, description: role.description || '', category: role.category || '', active: role.active ?? true })}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  title={t('fin_btn_edit', 'app')}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(role.id, role.name)}
                  className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                  title={t('fin_btn_remove', 'app')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {professionalRoles.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-semibold">{t('fin_empty_roles', 'app')}</div>
          )}
        </div>
      </div>
    </div>
  );
}