'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Fingerprint, ShieldCheck, Smartphone as SmartphoneIcon, Mail, ScanLine, Copy, CheckCircle2, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import { SystemUser } from '@/lib/mockData';

interface TwoFactorTabProps {
  systemUsers: SystemUser[];
  addAuditLog: (action: string, target: string) => void;
  onUpdateSystemUser?: (userId: string, patch: Partial<SystemUser>) => void;
}

export function TwoFactorTab({ systemUsers, addAuditLog, onUpdateSystemUser }: TwoFactorTabProps) {
  const { t } = useI18n();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'email' | 'sms'>('totp');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  const call2FaApi = async (payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    return fetch('/api/admin/2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  };

  const handleEnableMethod = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      if (selectedMethod === 'totp') {
        const res = await call2FaApi({ action: 'generate', user_id: selectedUserId });
        const data = await res.json();
        if (data.error) {
          alert(data.error);
          setLoading(false);
          return;
        }
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes || []);
        setVerified(false);
        addAuditLog('Gerou Chave 2FA TOTP', selectedUserId);
      } else if (selectedMethod === 'email') {
        const res = await call2FaApi({ action: 'enable_email', user_id: selectedUserId });
        const data = await res.json();
        if (data.error) {
          alert(data.error);
        } else {
          addAuditLog('Ativou 2FA por E-mail', selectedUserId);
          onUpdateSystemUser?.(selectedUserId, { twoFactorEnabled: true, twoFactorMethod: 'email' });
        }
      } else if (selectedMethod === 'sms') {
        alert('SMS disponível em breve (requer Twilio)');
      }
    } catch {
      alert('Erro ao gerar chave 2FA');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (twoFactorCode.length !== 6 || !selectedUserId) return;
    setLoading(true);
    try {
      const res = await call2FaApi({ action: 'verify', user_id: selectedUserId, token: twoFactorCode });
      const data = await res.json();
      if (data.valid) {
        setVerified(true);
        onUpdateSystemUser?.(selectedUserId, { twoFactorEnabled: true, twoFactorMethod: 'totp' });
        addAuditLog('Ativou 2FA TOTP', selectedUserId);
      } else {
        alert(t('fin_alert_invalid_code', 'app') || 'Código inválido. Tente novamente.');
      }
    } catch {
      alert('Erro ao verificar código');
    }
    setLoading(false);
  };

  const handleDisable = async (userId: string) => {
    if (!confirm(t('admin_2fa_confirm_disable', 'app') || 'Desativar 2FA para este usuário?')) return;
    setLoading(true);
    try {
      await call2FaApi({ action: 'disable', user_id: userId });
      addAuditLog('Desativou 2FA', userId);
      onUpdateSystemUser?.(userId, { twoFactorEnabled: false, twoFactorMethod: 'none' });
      setQrCode('');
      setSecret('');
      setVerified(false);
      setBackupCodes([]);
    } catch {
      alert('Erro ao desativar 2FA');
    }
    setLoading(false);
  };

  const handleRegenerateBackup = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await call2FaApi({ action: 'regenerate_backup', user_id: selectedUserId });
      const data = await res.json();
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
        addAuditLog('Regenerou Códigos Backup 2FA', selectedUserId);
      }
    } catch {
      alert('Erro ao regenerar códigos');
    }
    setLoading(false);
  };

  const activeCount = systemUsers.filter(u => u.twoFactorEnabled).length;
  const totalCount = systemUsers.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuração 2FA */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Fingerprint className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800 text-base">{t('admin_2fa_title', 'app')}</h3>
        </div>

        <div className="space-y-4 text-xs font-sans">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
            <p className="text-xs text-teal-800 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              {t('admin_2fa_active_count', 'app').replace('{active}', String(activeCount)).replace('{total}', String(totalCount))}
            </p>
            <div className="mt-2 w-full bg-teal-200 rounded-full h-2">
              <div className="bg-teal-600 h-2 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <SmartphoneIcon className="w-6 h-6 text-teal-600 mx-auto mb-1" />
              <p className="font-bold text-slate-700 text-xs">{t('admin_2fa_totp', 'app')}</p>
              <p className="text-[9px] text-slate-400">{t('admin_2fa_totp_desc', 'app')}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <SmartphoneIcon className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
              <p className="font-bold text-slate-700 text-xs">{t('admin_2fa_sms', 'app')}</p>
              <p className="text-[9px] text-slate-400">{t('admin_2fa_sms_desc', 'app')}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <Mail className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <p className="font-bold text-slate-700 text-xs">{t('admin_2fa_email', 'app')}</p>
              <p className="text-[9px] text-slate-400">{t('admin_2fa_email_desc', 'app')}</p>
            </div>
          </div>

          {/* Selecionar usuário e método */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
              <ScanLine className="w-4 h-4 text-teal-600" /> {t('admin_2fa_simulate_title', 'app')}
            </h4>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">{t('admin_2fa_select_user', 'app') || 'Selecionar Usuário'}</label>
              <select value={selectedUserId} onChange={e => { setSelectedUserId(e.target.value); setQrCode(''); setSecret(''); setVerified(false); setBackupCodes([]); }} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <option value="">{t('admin_rbac_no_professionals', 'app')}</option>
                {systemUsers.map(u => (
                  <option key={u.id} value={u.authUserId || u.id}>{u.name} ({u.systemRole})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Método 2FA</label>
              <div className="flex gap-2">
                {(['totp', 'email', 'sms'] as const).map(m => (
                  <button key={m} onClick={() => { setSelectedMethod(m); setQrCode(''); setSecret(''); setVerified(false); setBackupCodes([]); }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition border ${
                      selectedMethod === m
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    } ${m === 'sms' ? 'opacity-50' : ''}`}
                  >
                    {m === 'totp' ? 'TOTP' : m === 'email' ? 'E-mail' : 'SMS'}
                  </button>
                ))}
              </div>
              {selectedMethod === 'sms' && (
                <p className="text-[9px] text-amber-600 font-semibold mt-1">SMS requer integração com Twilio (futuro)</p>
              )}
            </div>

            <button onClick={handleEnableMethod} disabled={!selectedUserId || loading || selectedMethod === 'sms'}
              className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs cursor-pointer transition">
              {loading ? '...' : selectedMethod === 'totp' ? (t('admin_2fa_generate_secret', 'app') || 'Gerar Chave 2FA') : `Ativar 2FA por ${selectedMethod === 'email' ? 'E-mail' : 'SMS'}`}
            </button>

            {qrCode && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-48 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                    <Image src={qrCode} alt="QR Code 2FA" width={176} height={176} unoptimized className="w-44 h-44" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-[10px] text-slate-500 font-medium">{t('admin_2fa_scan_qr', 'app')}</p>
                    <button onClick={() => setShowSecret(!showSecret)} className="text-[10px] text-teal-600 font-bold hover:text-teal-800 cursor-pointer">
                      {showSecret ? t('admin_2fa_hide', 'app') : t('admin_2fa_show', 'app')} {t('admin_2fa_secret_key', 'app')}
                    </button>
                    {showSecret && (
                      <p className="font-mono text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 break-all">
                        {t('admin_2fa_key_label', 'app')} {secret}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">{t('admin_2fa_code_label', 'app')}</label>
                    <input type="text" maxLength={6} value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center tracking-widest" />
                  </div>
                  <button onClick={handleVerify} disabled={loading || twoFactorCode.length !== 6} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs cursor-pointer transition">
                    {t('admin_2fa_verify', 'app')}
                  </button>
                </div>

                {verified && (
                  <p className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {t('admin_2fa_verified_success', 'app')}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Códigos de Backup */}
          {backupCodes.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-amber-600" /> {t('fin_backup_codes', 'app')}
              </h4>
              <p className="text-[10px] text-slate-500">{t('admin_2fa_backup_notice', 'app')}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {backupCodes.map((code, i) => (
                  <div key={i} className="font-mono text-xs bg-slate-100 p-2 rounded border border-slate-200 text-center text-slate-700 font-bold tracking-wider">
                    {code}
                  </div>
                ))}
              </div>
              <button onClick={handleRegenerateBackup} disabled={loading} className="text-[10px] text-amber-600 font-bold hover:text-amber-800 cursor-pointer">
                {t('fin_regenerate_backup_codes', 'app')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status 2FA por Usuário */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800 text-base">{t('admin_2fa_status_title', 'app')}</h3>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {systemUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[9px] ${u.twoFactorEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}>
                  {u.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-700 text-[10px] truncate">{u.name}</p>
                  <p className="text-[9px] text-slate-400 truncate">{u.systemRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {u.twoFactorEnabled ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span className="text-[9px] text-teal-700 font-bold">{u.twoFactorMethod === 'totp' ? 'TOTP' : u.twoFactorMethod === 'sms' ? 'SMS' : 'E-mail'}</span>
                    <button onClick={() => handleDisable(u.authUserId || u.id)} className="ml-1 text-[8px] text-rose-500 font-bold hover:text-rose-700 cursor-pointer" title="Desativar 2FA">X</button>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-[9px] text-slate-400">{t('admin_2fa_inactive', 'app')}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
