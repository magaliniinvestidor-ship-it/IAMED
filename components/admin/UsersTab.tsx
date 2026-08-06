/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Edit2, Trash2, Plus, X, Mail, IdCard, MapPin, Fingerprint, UserCheck, UserX, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { SystemUser, AdminFinanceModuleProps } from './AdminContext';
import type { SystemRole } from '@/lib/mockData';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { systemUserSchema, passwordChangeSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';

const ROLES: SystemRole[] = [
  'SuperAdmin', 'Administrador', 'Gestor', 'Diretor Clínico', 'Médico',
  'Enfermeiro', 'Recepcionista', 'Financeiro', 'Farmacêutico', 'Visualizador',
];

const TWO_FA_METHODS = [
  { value: 'none', label: 'Desativado' },
  { value: 'totp', label: 'TOTP (Authenticator)' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'E-mail' },
];

interface UsersTabProps {
  addAuditLog: (action: string, target: string) => void;
}

export function UsersTab({ addAuditLog }: UsersTabProps) {
  const { t } = useI18n();
  const genModuleId = useModuleId();
  const { errors, validate } = useFormValidation(systemUserSchema);

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userCi, setUserCi] = useState('');
  const [userRole, setUserRole] = useState<SystemRole>('Recepcionista');
  const [userLocation, setUserLocation] = useState('');
  const [userStatus, setUserStatus] = useState<'ativo' | 'inativo' | 'bloqueado'>('ativo');
  const [user2FA, setUser2FA] = useState(false);
  const [user2FAMethod, setUser2FAMethod] = useState<'totp' | 'sms' | 'email' | 'none'>('none');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('');

  const loadUsers = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .order('name');
    if (error) {
      if (typeof window !== 'undefined') console.error('[UsersTab.loadUsers]', error.message);
      return;
    }
    if (data) {
      setUsers(
        data.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: (u.name as string) || '',
          email: u.email as string | undefined,
          ci: u.ci as string | undefined,
          systemRole: (u.system_role as SystemRole) || 'Recepcionista',
          permissions: (u.permissions as string[]) || [],
          location: u.location as string | undefined,
          status: (u.status as SystemUser['status']) || 'ativo',
          twoFactorEnabled: u.two_factor_enabled as boolean | undefined,
          twoFactorMethod: u.two_factor_method as SystemUser['twoFactorMethod'],
          createdAt: (u.created_at as string) || new Date().toISOString(),
        }))
      );
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setUserName('');
    setUserEmail('');
    setUserCi('');
    setUserRole('Recepcionista');
    setUserLocation('');
    setUserStatus('ativo');
    setUser2FA(false);
    setUser2FAMethod('none');
    setUserPassword('');
    setUserPasswordConfirm('');
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (u: SystemUser) => {
    setEditingId(u.id);
    setUserName(u.name);
    setUserEmail(u.email || '');
    setUserCi(u.ci || '');
    setUserRole(u.systemRole);
    setUserLocation(u.location || '');
    setUserStatus(u.status);
    setUser2FA(u.twoFactorEnabled || false);
    setUser2FAMethod(u.twoFactorMethod || 'none');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = {
      name: userName,
      email: userEmail,
      ci: userCi,
      systemRole: userRole,
      location: userLocation,
      status: userStatus,
      twoFactorEnabled: user2FA,
      twoFactorMethod: user2FAMethod,
    };

    const result = validate(userData);
    if (!result.success) return;

    if (!editingId) {
      const passResult = passwordChangeSchema.safeParse({ password: userPassword, confirmPassword: userPasswordConfirm });
      if (!passResult.success) {
        if (typeof window !== 'undefined') {
          const firstError = passResult.error.issues[0];
          alert(firstError?.message || 'Erro de senha');
        }
        return;
      }
    }

    if (editingId) {
      if (!supabase) return;
      const { error } = await supabase
        .from('system_users')
        .update({
          name: userData.name,
          email: userData.email,
          ci: userData.ci,
          system_role: userData.systemRole,
          location: userData.location,
          status: userData.status,
          two_factor_enabled: userData.twoFactorEnabled,
          two_factor_method: userData.twoFactorMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
      if (error) {
        if (typeof window !== 'undefined') alert(t('admin_alert_update_user_error', 'app') + error.message);
        return;
      }
      addAuditLog('Atualizou Usuário', userName);
    } else {
      if (!supabase) return;
      const id = await genModuleId('usr');
      const { error } = await supabase
        .from('system_users')
        .insert({
          id,
          name: userData.name,
          email: userData.email,
          ci: userData.ci,
          system_role: userData.systemRole,
          location: userData.location,
          status: userData.status,
          two_factor_enabled: userData.twoFactorEnabled,
          two_factor_method: userData.twoFactorMethod,
          permissions: [],
          created_at: new Date().toISOString(),
        });
      if (error) {
        if (typeof window !== 'undefined') alert(t('admin_alert_create_user_error', 'app') + error.message);
        return;
      }
      addAuditLog('Criou Usuário', userName);
    }

    resetForm();
    setShowForm(false);
    await loadUsers();
  };

  const fieldErrors = groupErrorsByPath(errors);

  const handleToggleStatus = async (u: SystemUser) => {
    const nextStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    if (typeof window !== 'undefined') {
      const msg = (nextStatus === 'ativo'
        ? t('fin_confirm_activate_user', 'app')
        : t('fin_confirm_deactivate_user', 'app')
      ) + ` usuário ${u.name}?`;
      if (!confirm(msg)) return;
    }
    if (supabase) {
      await supabase.from('system_users').update({ status: nextStatus }).eq('id', u.id);
    }
    addAuditLog('Alterou Status Usuário', `${u.name} → ${nextStatus}`);
    await loadUsers();
  };

  const handleDelete = async (u: SystemUser) => {
    if (typeof window !== 'undefined') {
      if (!confirm(t('fin_confirm_delete_user', 'app').replace('{name}', u.name))) return;
    }
    if (supabase) {
      await supabase.from('system_users').delete().eq('id', u.id);
    }
    addAuditLog('Excluiu Usuário', u.name);
    await loadUsers();
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.ci || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleColors = (role: SystemRole): string => {
    if (role === 'SuperAdmin') return 'bg-rose-600';
    if (role === 'Administrador' || role === 'Gestor') return 'bg-teal-600';
    if (role === 'Médico' || role === 'Diretor Clínico') return 'bg-indigo-500';
    return 'bg-slate-500';
  };

  const roleBadge = (role: SystemRole): string => {
    if (role === 'SuperAdmin') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (role === 'Administrador' || role === 'Gestor') return 'bg-teal-50 text-teal-700 border-teal-200';
    if (role === 'Médico' || role === 'Diretor Clínico') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-base">Usuários do Sistema ({users.length})</h3>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Usuário
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou CI..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((u) => (
            <div
              key={u.id}
              className={`p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs transition ${
                u.status === 'inativo' ? 'opacity-60' : ''
              } ${u.status === 'bloqueado' ? 'opacity-50 border-rose-200 bg-rose-50/30' : ''}`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm ${roleColors(u.systemRole)}`}>
                  {u.name.split(' ').map((n) => n[0]).filter((_, i) => i < 2).join('').toUpperCase()}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-800 text-sm truncate">{u.name}</p>
                    <span className={`text-[9px] py-0.5 px-2 rounded-full border font-bold whitespace-nowrap ${roleBadge(u.systemRole)}`}>{u.systemRole}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium flex-wrap text-[10px]">
                    {u.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</span>}
                    {u.ci && <span className="flex items-center gap-1"><IdCard className="w-3.5 h-3.5" /> {u.ci}</span>}
                    {u.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {u.location}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {u.twoFactorEnabled && <Fingerprint className="w-3 h-3 text-teal-500" />}
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${
                  u.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : u.status === 'bloqueado' ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>{u.status}</span>
                <button
                  onClick={() => openEdit(u)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  title={t('fin_btn_edit', 'app')}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleStatus(u)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                  title={u.status === 'ativo' ? t('fin_btn_deactivate', 'app') : t('fin_btn_activate', 'app')}
                >
                  {u.status === 'ativo' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                  title={t('fin_btn_delete', 'app')}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-400 font-semibold text-xs">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-teal-50 flex items-center justify-between">
              <h3 className="font-bold text-teal-800 text-sm">
                {editingId ? t('fin_edit_user', 'app') : t('fin_create_user', 'app')}
              </h3>
              <button onClick={() => { resetForm(); setShowForm(false); }} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              {errors.length > 0 && <FormErrorSummary errors={errors} />}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">E-mail</label>
                  <input
                    type="text"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="usuario@hospital.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">CI</label>
                  <input
                    type="text"
                    value={userCi}
                    onChange={(e) => setUserCi(e.target.value)}
                    placeholder="Cédula de Identidad"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Função</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as SystemRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Localização</label>
                  <input
                    type="text"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    placeholder="Sede / Ala"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as 'ativo' | 'inativo' | 'bloqueado')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">2FA</label>
                  <select
                    value={user2FAMethod}
                    onChange={(e) => {
                      const method = e.target.value as 'totp' | 'sms' | 'email' | 'none';
                      setUser2FAMethod(method);
                      setUser2FA(method !== 'none');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {TWO_FA_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {!editingId && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Senha *</label>
                      <input
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Confirmar Senha *</label>
                      <input
                        type="password"
                        value={userPasswordConfirm}
                        onChange={(e) => setUserPasswordConfirm(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition"
                >
                  {editingId ? t('app_save_changes', 'app') : t('app_register', 'app')}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                >
                  {t('app_cancel', 'app')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
