'use client';

import React, { useState } from 'react';
import { Key, Plus, Edit2, Trash2, X, Shield } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { SSOProvider, AdminFinanceModuleProps } from './AdminContext';
import type { SystemRole } from '@/lib/mockData';

interface SsoTabProps {
  providers: SSOProvider[];
  setProviders: React.Dispatch<React.SetStateAction<SSOProvider[]>>;
  addAuditLog: (action: string, target: string) => void;
}

const SSO_TYPES = [
  { value: 'saml', label: 'SAML 2.0' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'oidc', label: 'OpenID Connect' },
];

const DEFAULT_ROLES: SystemRole[] = [
  'Visualizador', 'Recepcionista', 'Médico', 'Enfermeiro',
  'Administrador', 'Gestor', 'Diretor Clínico',
];

const EMPTY_PROVIDER: Omit<SSOProvider, 'id'> = {
  name: '',
  type: 'oidc',
  enabled: true,
  issuerUrl: '',
  clientId: '',
  clientSecret: '',
  metadataUrl: '',
  certificateFingerprint: '',
  defaultRole: 'Visualizador',
  active: true,
};

export function SsoTab({ providers, setProviders, addAuditLog }: SsoTabProps) {
  const { t } = useI18n();
  const genModuleId = useModuleId();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SSOProvider, 'id'>>(EMPTY_PROVIDER);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_PROVIDER);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (provider: SSOProvider) => {
    setEditingId(provider.id);
    setForm({
      name: provider.name,
      type: provider.type,
      enabled: provider.enabled,
      issuerUrl: provider.issuerUrl,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      metadataUrl: provider.metadataUrl,
      certificateFingerprint: provider.certificateFingerprint,
      defaultRole: provider.defaultRole,
      active: provider.active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.issuerUrl.trim() || !form.clientId.trim()) {
      if (typeof window !== 'undefined') {
        alert(t('fin_alert_required_sso_fields', 'app'));
      }
      return;
    }

    if (editingId) {
      const updated: SSOProvider = { id: editingId, ...form };
      setProviders((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      if (supabase) {
        await supabase.from('sso_providers').update(updated as unknown as Record<string, unknown>).eq('id', editingId);
      }
      addAuditLog('Atualizou Provedor SSO', form.name);
    } else {
      const newProvider: SSOProvider = { id: await genModuleId('sso'), ...form };
      setProviders((prev) => [...prev, newProvider]);
      if (supabase) {
        await supabase.from('sso_providers').insert({ ...newProvider, created_at: new Date().toISOString() });
      }
      addAuditLog('Cadastrou Provedor SSO', form.name);
    }
    resetForm();
    setShowForm(false);
  };

  const handleToggle = async (provider: SSOProvider) => {
    const updated = { ...provider, enabled: !provider.enabled, active: !provider.active };
    setProviders((prev) => prev.map((p) => (p.id === provider.id ? updated : p)));
    if (supabase) {
      await supabase.from('sso_providers').update({ enabled: updated.enabled, active: updated.active } as Record<string, unknown>).eq('id', provider.id);
    }
    addAuditLog(updated.enabled ? 'Ativou SSO' : 'Desativou SSO', provider.name);
  };

  const handleDelete = (provider: SSOProvider) => {
    if (typeof window === 'undefined') return;
    if (!confirm(t('fin_confirm_delete_sso', 'app').replace('{name}', provider.name))) return;
    setProviders((prev) => prev.filter((p) => p.id !== provider.id));
    if (supabase) {
      supabase.from('sso_providers').delete().eq('id', provider.id);
    }
    addAuditLog('Removeu Provedor SSO', provider.name);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-600" /> Provedores SSO ({providers.length})
        </h3>
        <button
          onClick={openNew}
          className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Provedor SSO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3 ${!provider.enabled ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                  provider.type === 'saml' ? 'bg-blue-500' : provider.type === 'oauth2' ? 'bg-amber-500' : 'bg-teal-500'
                }`}>
                  {provider.type === 'saml' ? '🔐' : provider.type === 'oauth2' ? '🔑' : '🛡️'}
                </div>
                <div>
                  <p className="font-black text-slate-800">{provider.name}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{provider.type}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(provider)}
                className={`px-2 py-1 text-[10px] font-bold rounded border ${
                  provider.enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {provider.enabled ? 'Ativo' : 'Inativo'}
              </button>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>🌐 <span className="font-mono text-[10px] truncate">{provider.issuerUrl}</span></p>
              <p>🆔 <span className="font-mono text-[10px]">{provider.clientId}</span></p>
              <p>👥 Função padrão: <b>{provider.defaultRole}</b></p>
              {provider.metadataUrl && (
                <p>📋 Metadata: <span className="font-mono text-[10px] truncate">{provider.metadataUrl}</span></p>
              )}
            </div>
            <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
              <div className="flex-1" />
              <button
                onClick={() => openEdit(provider)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                title={t('fin_btn_edit', 'app')}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(provider)}
                className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                title={t('fin_btn_remove', 'app')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {providers.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400 font-semibold text-xs">
            Nenhum provedor SSO configurado.
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-teal-50 flex items-center justify-between">
              <h3 className="font-bold text-teal-800 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {editingId ? 'Editar Provedor SSO' : 'Novo Provedor SSO'}
              </h3>
              <button onClick={() => { resetForm(); setShowForm(false); }} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nome do Provedor *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Azure AD (Microsoft)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as 'saml' | 'oauth2' | 'oidc' }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {SSO_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Função Padrão</label>
                  <select
                    value={form.defaultRole}
                    onChange={(e) => setForm((prev) => ({ ...prev, defaultRole: e.target.value as SystemRole }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {DEFAULT_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Issuer URL *</label>
                <input
                  type="url"
                  value={form.issuerUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, issuerUrl: e.target.value }))}
                  placeholder="https://login.microsoftonline.com/tenant-id/v2.0"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Client ID *</label>
                  <input
                    type="text"
                    value={form.clientId}
                    onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={form.clientSecret}
                    onChange={(e) => setForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Metadata URL</label>
                <input
                  type="url"
                  value={form.metadataUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, metadataUrl: e.target.value }))}
                  placeholder="https://.../.well-known/openid-configuration"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Certificado (Fingerprint)</label>
                <input
                  type="text"
                  value={form.certificateFingerprint}
                  onChange={(e) => setForm((prev) => ({ ...prev, certificateFingerprint: e.target.value }))}
                  placeholder="A1:B2:C3:D4:..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition"
                >
                  {editingId ? t('app_save_changes', 'app') : t('app_register', 'app')}
                </button>
                <button
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                >
                  {t('app_cancel', 'app')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
