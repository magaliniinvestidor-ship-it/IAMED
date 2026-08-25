 
'use client';

import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Edit2, Trash2, Plus, X, Mail, IdCard, MapPin, Fingerprint, UserCheck, UserX, Search, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import { authFetch } from '@/lib/auth/authFetch';
import { SystemUser } from './AdminContext';
import type { SystemRole, Professional } from '@/lib/mockData';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { systemUserCreateSchema, systemUserEditSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';

const ROLES: SystemRole[] = [
  'SuperAdmin', 'Administrador', 'Gestor', 'Diretor Clínico', 'Médico',
  'Enfermeiro', 'Recepcionista', 'Financeiro', 'Farmacêutico', 'Visualizador',
  'Auxiliar de Enfermagem', 'Anestesiologista', 'Cirurgião(ã)', 'Terapeuta Ocupacional',
  'Educador Físico', 'Assistente Social', 'Fonoaudiólogo(a)', 'Dentista',
  'Biomédico(a)', 'Técnico(a) em Radiologia', 'Técnico(a) em Farmácia',
  'Técnico(a) de Laboratório', 'Nutricionista', 'Psicólogo(a)', 'Técnico(a) de Enfermagem',
];

function generateDefaultPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%&*';
  const all = upper + lower + digits + specials;
  const parts = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];
  for (let i = 0; i < 8; i++) {
    parts.push(all[Math.floor(Math.random() * all.length)]);
  }
  return parts.sort(() => Math.random() - 0.5).join('');
}

interface UsersTabProps {
  addAuditLog: (action: string, target: string) => void;
  pendingProfessional?: Professional | null;
  onPendingProfessionalConsumed?: () => void;
  professionals?: Professional[];
  professionalRoles?: string[];
  locations?: Array<{ id: string; name: string; status?: string }>;
  onUsersChanged?: () => void;
}

export function UsersTab({
  addAuditLog,
  pendingProfessional,
  onPendingProfessionalConsumed,
  professionals = [],
  professionalRoles = [],
  locations = [],
  onUsersChanged,
}: UsersTabProps) {
  const { t } = useI18n();
  const { errors, validate, clearErrors } = useFormValidation(systemUserEditSchema);
  const { errors: createErrors, validate: validateCreate, clearErrors: clearCreateErrors } = useFormValidation(systemUserCreateSchema);
  const clearAllErrors = () => { clearErrors(); clearCreateErrors(); };

  const initialPendingPassword = pendingProfessional ? generateDefaultPassword() : '';

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!!pendingProfessional);

  const [userName, setUserName] = useState(pendingProfessional?.name ?? '');
  const [userEmail, setUserEmail] = useState(pendingProfessional?.email ?? '');
  const [userCi, setUserCi] = useState('');
  const [userRole, setUserRole] = useState<string>(pendingProfessional?.role ?? '');
  const [userLocation, setUserLocation] = useState(
    () => (pendingProfessional?.locationId ? locations.find((l) => l.id === pendingProfessional.locationId)?.name || '' : '')
  );
  const [userStatus, setUserStatus] = useState<'ativo' | 'inativo' | 'bloqueado' | ''>(pendingProfessional ? 'ativo' : '');
  const [userPassword, setUserPassword] = useState(initialPendingPassword);
  const [userPasswordConfirm, setUserPasswordConfirm] = useState(initialPendingPassword);
  const [userProfessionalId, setUserProfessionalId] = useState<string | null>(pendingProfessional?.id ?? null);
  const [copied, setCopied] = useState(false);

  const activeErrors = editingId ? errors : createErrors;

  const roleOptions = Array.from(new Set([...professionalRoles, ...ROLES]));

  const loadUsers = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      if (typeof window !== 'undefined') console.error('[UsersTab.loadUsers]', error.message);
      return;
    }
    if (data) {
      const profIds = data.filter((u: Record<string, unknown>) => u.professional_id).map((u: Record<string, unknown>) => u.professional_id as string);
      let profMap: Record<string, string> = {};
      let profEmailMap: Record<string, string> = {};
      if (profIds.length > 0) {
        const { data: profs } = await supabase.from('professionals').select('id, name, email').in('id', profIds);
        if (profs) {
          profMap = Object.fromEntries(profs.map((p: Record<string, unknown>) => [p.id as string, (p.name as string) || '']));
          profEmailMap = Object.fromEntries(profs.filter((p: Record<string, unknown>) => p.email).map((p: Record<string, unknown>) => [p.id as string, p.email as string]));
        }
      }
      setUsers(
        data.map((u: Record<string, unknown>) => {
          const profName = u.professional_id ? profMap[u.professional_id as string] : null;
          const profEmail = u.professional_id ? profEmailMap[u.professional_id as string] : null;
          return {
            id: u.id as string,
            authUserId: u.auth_user_id as string | undefined,
            professionalId: u.professional_id as string | undefined,
            name: profName || (u.ci as string) || (u.id as string),
            email: profEmail || undefined,
            ci: u.ci as string | undefined,
            systemRole: (u.system_role as SystemRole) || 'Recepcionista',
            permissions: (u.permissions as string[]) || [],
            location: u.location as string | undefined,
            status: (u.status as SystemUser['status']) || 'ativo',
            twoFactorEnabled: u.two_factor_enabled as boolean | undefined,
            twoFactorMethod: u.two_factor_method as SystemUser['twoFactorMethod'],
            lastLogin: u.last_login as string | null | undefined,
            passwordChangedAt: u.password_changed_at as string | null | undefined,
            mustChangePassword: u.must_change_password as boolean | undefined,
            createdAt: (u.created_at as string) || new Date().toISOString(),
          };
        })
      );
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!pendingProfessional) return;
    setEditingId(null);
    setUserProfessionalId(pendingProfessional.id);
    setUserName(pendingProfessional.name);
    setUserEmail(pendingProfessional.email || '');
    setUserRole(pendingProfessional.role);
    const loc = locations.find((l) => l.id === pendingProfessional.locationId);
    setUserLocation(loc?.name || '');
    setUserCi('');
    setUserStatus('ativo');
    const generatedPassword = generateDefaultPassword();
    setUserPassword(generatedPassword);
    setUserPasswordConfirm(generatedPassword);
    setSearch('');
    setShowForm(true);
  }, [pendingProfessional, locations, professionalRoles]);

  const resetForm = () => {
    setEditingId(null);
    setUserName('');
    setUserEmail('');
    setUserCi('');
    setUserRole('');
    setUserLocation('');
    setUserStatus('');
    setUserPassword('');
    setUserPasswordConfirm('');
    setUserProfessionalId(null);
  };

  const openNew = () => {
    resetForm();
    clearAllErrors();
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
    setUserProfessionalId(u.professionalId || null);
    clearAllErrors();
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const systemRole = userRole;

    const userData = {
      name: userName,
      email: userEmail,
      ci: userCi,
      systemRole,
      location: userLocation,
      status: userStatus,
      password: userPassword,
      confirmPassword: userPasswordConfirm,
    };

    const result = editingId ? validate(userData) : validateCreate(userData);
    if (!result.success) return;

    if (editingId) {
      const response = await authFetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          email: userEmail,
          name: userName,
          role: systemRole,
          location: userLocation,
          ci: userCi,
          status: userStatus,
          professionalId: userProfessionalId || undefined,
          password: userPassword || undefined,
        }),
      });
      if (!response.ok) {
        let msg = t('fin_alert_error_update_user', 'app');
        try {
          const errData = await response.json();
          if (errData?.error) msg += errData.error;
        } catch {}
        if (typeof window !== 'undefined') alert(msg);
        return;
      }
      addAuditLog('Atualizou Usuário', userName);
    } else {
      const response = await authFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          name: userName,
          role: systemRole,
          location: userLocation,
          ci: userCi,
          professionalId: userProfessionalId || undefined,
        }),
      });
      if (!response.ok) {
        let msg = t('fin_alert_error_create_user', 'app');
        try {
          const errData = await response.json();
          if (errData?.error) msg += errData.error;
        } catch {}
        if (typeof window !== 'undefined') alert(msg);
        return;
      }
      addAuditLog('Criou Usuário', userName);
    }

    resetForm();
    setShowForm(false);
    onPendingProfessionalConsumed?.();
    await loadUsers();
    onUsersChanged?.();
  };

  const fieldErrors = groupErrorsByPath(errors);

  const handleToggleStatus = async (u: SystemUser) => {
    const nextStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    if (typeof window !== 'undefined') {
      const msg = t('fin_confirm_toggle_user', 'app')
        .replace('{action}', nextStatus === 'ativo' ? t('fin_confirm_activate_user', 'app') : t('fin_confirm_deactivate_user', 'app'))
        .replace('{name}', u.name);
      if (!confirm(msg)) return;
    }
    if (supabase) {
      const response = await authFetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.systemRole,
          location: u.location,
          ci: u.ci,
          professionalId: u.professionalId,
          status: nextStatus,
        }),
      });
      if (!response.ok) {
        let msg = t('fin_alert_error_update_user', 'app');
        try {
          const errData = await response.json();
          if (errData?.error) msg += errData.error;
        } catch {}
        if (typeof window !== 'undefined') alert(msg);
        return;
      }
    }
    addAuditLog('Alterou Status Usuário', `${u.name} → ${nextStatus}`);
    await loadUsers();
    onUsersChanged?.();
  };

  const handleDelete = async (u: SystemUser) => {
    if (typeof window !== 'undefined') {
      if (!confirm(t('fin_confirm_delete_user', 'app').replace('{name}', u.name))) return;
    }
    if (supabase) {
      const response = await authFetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id }),
      });
      if (!response.ok) {
        let msg = t('fin_alert_error_delete_user', 'app');
        try {
          const errData = await response.json();
          if (errData?.error) msg += errData.error;
        } catch {}
        if (typeof window !== 'undefined') alert(msg);
        return;
      }
    }
    addAuditLog('Excluiu Usuário', u.name);
    await loadUsers();
    onUsersChanged?.();
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
            <h3 className="font-semibold text-slate-800 text-base">{t('fin_users_title', 'app').replace('{count}', String(users.length))}</h3>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" /> {t('fin_new_user', 'app')}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('fin_users_search_placeholder', 'app')}
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
              {t('fin_users_empty', 'app')}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-teal-50 flex items-center justify-between">
              <h3 className="font-bold text-teal-800 text-sm">
                {editingId ? t('fin_edit_user', 'app') : userProfessionalId ? t('fin_create_user_from_professional', 'app') : t('fin_create_user', 'app')}
              </h3>
              <button onClick={() => { resetForm(); setShowForm(false); onPendingProfessionalConsumed?.(); }} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} noValidate className="p-5 space-y-3 text-xs">
              {activeErrors.length > 0 && <FormErrorSummary errors={activeErrors} />}
              {userProfessionalId && (
                <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded-lg">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span className="text-[10px] font-semibold text-teal-800">
                    {t('fin_user_linked_professional', 'app').replace('{name}', professionals.find((p) => p.id === userProfessionalId)?.name || '')}
                  </span>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('fin_user_name_label', 'app')} *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t('fin_user_name_placeholder', 'app')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('fin_user_email_label', 'app')} *</label>
                  <input
                    type="text"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder={t('fin_user_email_placeholder', 'app')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('fin_user_ci_label', 'app')} *</label>
                  <input
                    type="text"
                    value={userCi}
                    onChange={(e) => setUserCi(e.target.value)}
                    placeholder={t('fin_user_ci_placeholder', 'app')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('fin_user_role_label', 'app')} *</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">{t('fin_select_option', 'app')}</option>
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('fin_user_location_label', 'app')} *</label>
                  <select
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">{t('fin_select_location', 'app')}</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('fin_status_label', 'app')} *</label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value as 'ativo' | 'inativo' | 'bloqueado' | '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">{t('fin_select_option', 'app')}</option>
                  <option value="ativo">{t('fin_active', 'app')}</option>
                  <option value="inativo">{t('fin_inactive', 'app')}</option>
                  <option value="bloqueado">{t('fin_user_status_blocked', 'app')}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('fin_user_password_label', 'app')}{!editingId ? ' *' : ''}</label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder={t('fin_user_password_placeholder', 'app')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t('fin_confirm_password_label', 'app')}{!editingId ? ' *' : ''}</label>
                  <input
                    type="password"
                    value={userPasswordConfirm}
                    onChange={(e) => setUserPasswordConfirm(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              {editingId && (
                <p className="text-[10px] text-amber-600 font-semibold">{t('fin_user_password_keep_hint', 'app')}</p>
              )}
              {!editingId && userProfessionalId && (
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {t('fin_generated_password_label', 'app')} <code className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-teal-700">{userPassword}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator === 'undefined' || !userPassword) return;
                      navigator.clipboard.writeText(userPassword).then(() => {
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                    className="flex items-center gap-1 py-1 px-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-md transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> {copied ? t('fin_copied', 'app') : t('fin_copy', 'app')}
                  </button>
                </div>
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
                  onClick={() => { resetForm(); setShowForm(false); onPendingProfessionalConsumed?.(); }}
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
