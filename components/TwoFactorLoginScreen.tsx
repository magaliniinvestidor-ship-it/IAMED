'use client';

import React from 'react';
import { Fingerprint, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/I18nContext';

interface TwoFactorLoginScreenProps {
  method: 'totp' | 'email' | 'sms';
  emailSent: boolean;
  code: string;
  error: string;
  loading: boolean;
  backupMode: boolean;
  onCodeChange: (v: string) => void;
  onVerify: () => void;
  onSendEmail: () => void;
  onToggleBackup: () => void;
  onBack: () => void;
}

export function TwoFactorLoginScreen({
  method, emailSent, code, error, loading, backupMode,
  onCodeChange, onVerify, onSendEmail, onToggleBackup, onBack,
}: TwoFactorLoginScreenProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-center">
        <Fingerprint className="w-6 h-6 text-teal-600" />
        <h3 className="font-bold text-slate-800 text-sm">
          {method === 'sms' ? t('admin_2fa_login_title_sms', 'app') :
           method === 'email' ? t('admin_2fa_login_title_email', 'app') :
           t('admin_2fa_login_title_totp', 'app')}
        </h3>
      </div>

      {/* SMS - Coming Soon */}
      {method === 'sms' && (
        <div className="text-center space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-700 text-xs font-semibold flex items-center gap-2 justify-center">
              <ShieldAlert className="w-4 h-4" /> {t('admin_2fa_login_sms_soon', 'app')}
            </p>
            <p className="text-amber-600 text-[10px] mt-1">
              {t('admin_2fa_login_sms_alt', 'app')}
            </p>
          </div>
          <button type="button" onClick={onBack} className="text-slate-400 font-bold text-[10px] hover:text-slate-600 cursor-pointer">
            {t('admin_2fa_login_back_to_login', 'app')}
          </button>
        </div>
      )}

      {/* Email OTP */}
      {method === 'email' && (
        <div className="space-y-3">
          {!emailSent ? (
            <>
              <p className="text-[10px] text-slate-500 text-center">
                {t('admin_2fa_login_email_hint', 'app')}
              </p>
              <Button type="button" onClick={onSendEmail} disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#008f70] text-white font-bold py-3 rounded-lg transition-all tracking-wide text-xs uppercase disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('admin_2fa_login_sending', 'app')}</span>
                ) : t('admin_2fa_login_send_email', 'app')}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 justify-center p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Mail className="w-4 h-4 text-emerald-600" />
                <p className="text-emerald-600 text-[10px] font-semibold">{t('admin_2fa_login_code_sent', 'app')}</p>
              </div>
              <input type="text" maxLength={6} value={code}
                onChange={e => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full p-3 bg-[#f1f5f9]/40 border border-slate-200/50 rounded-lg text-center text-lg font-mono tracking-[0.5em] text-slate-800 focus:border-teal-500"
                autoFocus />
              <Button type="button" onClick={onVerify} disabled={loading || code.length < 6}
                className="w-full bg-[#00a884] hover:bg-[#008f70] text-white font-bold py-3 rounded-lg transition-all tracking-wide text-xs uppercase disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('admin_2fa_login_verifying', 'app')}</span>
                ) : t('admin_2fa_verify', 'app')}
              </Button>
              <button type="button" onClick={onSendEmail} disabled={loading}
                className="text-teal-600 font-bold text-[10px] hover:text-teal-800 cursor-pointer w-full text-center">
                {t('admin_2fa_login_resend', 'app')}
              </button>
            </>
          )}
          <div className="text-center">
            <button type="button" onClick={onBack} className="text-slate-400 font-bold text-[10px] hover:text-slate-600 cursor-pointer">
              {t('admin_2fa_login_back', 'app')}
            </button>
          </div>
        </div>
      )}

      {/* TOTP */}
      {method === 'totp' && (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-500 text-center">
            {t('admin_2fa_login_totp_hint', 'app')}
          </p>

          <input type="text" maxLength={backupMode ? 9 : 6} value={code}
            onChange={e => {
              const val = backupMode
                ? e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9)
                : e.target.value.replace(/\D/g, '').slice(0, 6);
              onCodeChange(val);
            }}
            placeholder={backupMode ? 'XXXX-XXXX' : '000000'}
            className="w-full p-3 bg-[#f1f5f9]/40 border border-slate-200/50 rounded-lg text-center text-lg font-mono tracking-[0.5em] text-slate-800 focus:border-teal-500"
            autoFocus />

          {error && (
            <p className="text-rose-500 text-[10.5px] font-bold text-center animate-pulse">{error}</p>
          )}

          <Button type="button" onClick={onVerify} disabled={loading || code.length < (backupMode ? 9 : 6)}
            className="w-full bg-[#00a884] hover:bg-[#008f70] text-white font-bold py-3 rounded-lg transition-all tracking-wide text-xs uppercase disabled:opacity-50">
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('admin_2fa_login_verifying', 'app')}</span>
            ) : t('admin_2fa_verify', 'app')}
          </Button>

          <div className="flex justify-between text-[10px]">
            <button type="button" onClick={onToggleBackup} className="text-teal-600 font-bold hover:text-teal-800 cursor-pointer">
              {backupMode ? t('admin_2fa_login_use_app', 'app') : t('admin_2fa_login_use_backup', 'app')}
            </button>
            <button type="button" onClick={onBack} className="text-slate-400 font-bold hover:text-slate-600 cursor-pointer">
              {t('admin_2fa_login_back', 'app')}
            </button>
          </div>
        </div>
      )}

      {/* Error for email method */}
      {method === 'email' && error && (
        <p className="text-rose-500 text-[10.5px] font-bold text-center animate-pulse">{error}</p>
      )}
    </div>
  );
}
