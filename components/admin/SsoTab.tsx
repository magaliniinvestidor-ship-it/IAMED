'use client';

import React, { useState } from 'react';
import { Key, Plus, Edit2, Trash2, X, Shield } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import { SSOProvider, AdminFinanceModuleProps } from './AdminContext';
import type { SystemRole } from '@/lib/mockData';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { ssoProviderSchema } from '@/lib/validation/schemas';
import { FormField, FormErrorSummary } from '@/components/forms';

interface SsoTabProps {
  providers: SSOProvider[];
  setProviders: React.Dispatch<React.SetStateAction<SSOProvider[]>>;
  addAuditLog: (action: string, target: string) => void;
}

const SSO_TYPES = [
  { value: 'saml', labelKey: 'sso_type_saml' },
  { value: 'oauth2', labelKey: 'sso_type_oauth2' },
  { value: 'oidc', labelKey: 'sso_type_oidc' },
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

// Mapeia o objeto em memória (camelCase) para as colunas reais da tabela
// sso_providers (snake_case). Necessário porque o Supabase não converte.
function toDbRow(s: Omit<SSOProvider, 'id'> & { id?: string; created_at?: string }) {
  return {
    id: s.id,
    name: s.name,
    provider_type: s.type,
    issuer_url: s.issuerUrl,
    client_id: s.clientId,
    client_secret: s.clientSecret,
    metadata_url: s.metadataUrl,
    certificate_fingerprint: s.certificateFingerprint,
    default_role: s.defaultRole,
    enabled: s.enabled,
    active: s.active,
    ...(s.created_at ? { created_at: s.created_at } : {}),
  };
}

function isUuid(s: string | null): boolean {
  return !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function SsoTab({ providers, setProviders, addAuditLog }: SsoTabProps) {
  const { t } = useI18n();
  const { errors, validate, clearErrors } = useFormValidation(ssoProviderSchema);
  const fieldErrors = groupErrorsByPath(errors);

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
    const result = validate({
      name: form.name,
      type: form.type,
      issuerUrl: form.issuerUrl,
      clientId: form.clientId,
      clientSecret: form.clientSecret,
      metadataUrl: form.metadataUrl,
      certificateFingerprint: form.certificateFingerprint,
      defaultRole: form.defaultRole,
      enabled: form.enabled,
      active: form.active,
    });
    if (!result.success) return;

    if (editingId && isUuid(editingId)) {
      const updated: SSOProvider = { id: editingId, ...form };
      setProviders((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      if (supabase) {
        const { error } = await supabase
          .from('sso_providers')
          .update(toDbRow(updated))
          .eq('id', editingId);
        if (error) {
          console.error('SSO update failed', { code: error.code, message: error.message, details: error.details });
        }
      }
      addAuditLog('Atualizou Provedor SSO', form.name);
    } else {
      const newProvider: SSOProvider = { id: '', ...form };
      setProviders((prev) => [...prev, newProvider]);
      if (supabase) {
        const { data, error } = await supabase
          .from('sso_providers')
          .insert(toDbRow({ ...form, created_at: new Date().toISOString() }))
          .select()
          .single();
        if (error) {
          console.error('SSO insert failed', { code: error.code, message: error.message, details: error.details });
        } else if (data?.id) {
          newProvider.id = data.id;
          setProviders((prev) => prev.map((p) => (p === newProvider ? { ...newProvider, id: data.id } : p)));
        }
      }
      addAuditLog('Cadastrou Provedor SSO', form.name);
    }
    resetForm();
    clearErrors();
    setShowForm(false);
  };

  const handleToggle = async (provider: SSOProvider) => {
    const updated = { ...provider, enabled: !provider.enabled, active: !provider.active };
    setProviders((prev) => prev.map((p) => (p.id === provider.id ? updated : p)));
    if (supabase) {
      const { error } = await supabase
        .from('sso_providers')
        .update({ enabled: updated.enabled, active: updated.active })
        .eq('id', provider.id);
if (error) {
          console.error('SSO toggle failed', { code: error.code, message: error.message, details: error.details });
        }
    }
    addAuditLog(updated.enabled ? 'Ativou SSO' : 'Desativou SSO', provider.name);
  };

const handleDelete = async (provider: SSOProvider) => {
    if (typeof window === 'undefined') return;
    const msg = t('fin_confirm_delete_sso', 'app').replace('{name}', provider.name);
    if (!confirm(msg)) return;
    setProviders((prev) => prev.filter((p) => p.id !== provider.id));
    if (supabase && isUuid(provider.id)) {
      const { error } = await supabase.from('sso_providers').delete().eq('id', provider.id);
      if (error) {
        console.error('SSO delete failed', { code: error.code, message: error.message, details: error.details });
      }
    }
    addAuditLog('Removeu Provedor SSO', provider.name);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-600" /> {t('sso_title', 'app')} ({providers.length})
        </h3>
        <button
          onClick={openNew}
          className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> {t('sso_btn_new', 'app')}
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
                {provider.enabled ? t('sso_status_active', 'app') : t('sso_status_inactive', 'app')}
              </button>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>🌐 <span className="font-mono text-[10px] truncate">{provider.issuerUrl}</span></p>
              <p>🆔 <span className="font-mono text-[10px]">{provider.clientId}</span></p>
              <p>👥 {t('sso_label_default_role', 'app')} <b>{provider.defaultRole}</b></p>
              {provider.metadataUrl && (
                <p>📋 {t('sso_label_metadata', 'app')} <span className="font-mono text-[10px] truncate">{provider.metadataUrl}</span></p>
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
            {t('sso_empty', 'app')}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-teal-50 flex items-center justify-between">
              <h3 className="font-bold text-teal-800 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {editingId ? t('sso_edit_title', 'app') : t('sso_btn_new', 'app')}
              </h3>
              <button onClick={() => { resetForm(); setShowForm(false); }} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              {errors.length > 0 && <FormErrorSummary errors={errors} />}
              <FormField label={t('sso_field_name', 'app')} required error={fieldErrors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Azure AD (Microsoft)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={t('sso_field_type', 'app')} error={fieldErrors.type}>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as 'saml' | 'oauth2' | 'oidc' }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {SSO_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{t(opt.labelKey, 'app')}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label={t('sso_field_default_role', 'app')} error={fieldErrors.defaultRole}>
                  <select
                    value={form.defaultRole}
                    onChange={(e) => setForm((prev) => ({ ...prev, defaultRole: e.target.value as SystemRole }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {DEFAULT_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label={`${t('sso_field_issuer', 'app')} (${t('sso_required', 'app')})`} required error={fieldErrors.issuerUrl}>
                <input
                  type="text"
                  inputMode="url"
                  value={form.issuerUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, issuerUrl: e.target.value }))}
                  placeholder="https://login.microsoftonline.com/tenant-id/v2.0"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={`${t('sso_field_client_id', 'app')} (${t('sso_required', 'app')})`} required error={fieldErrors.clientId}>
                  <input
                    type="text"
                    value={form.clientId}
                    onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
                <FormField label={t('sso_field_client_secret', 'app')} error={fieldErrors.clientSecret}>
                  <input
                    type="text"
                    value={form.clientSecret}
                    onChange={(e) => setForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FormField>
              </div>
              <FormField label={t('sso_field_metadata', 'app')} error={fieldErrors.metadataUrl}>
                <input
                  type="text"
                  inputMode="url"
                  value={form.metadataUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, metadataUrl: e.target.value }))}
                  placeholder="https://.../.well-known/openid-configuration"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </FormField>
              <FormField label={t('sso_field_cert', 'app')} error={fieldErrors.certificateFingerprint}>
                <input
                  type="text"
                  value={form.certificateFingerprint}
                  onChange={(e) => setForm((prev) => ({ ...prev, certificateFingerprint: e.target.value }))}
                  placeholder="A1:B2:C3:D4:..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </FormField>
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