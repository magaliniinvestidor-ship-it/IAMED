'use client';

import React, { useState } from 'react';
import { Lock, CheckCheck, Shield, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { PasswordPolicy } from './AdminContext';

interface PasswordPolicyTabProps {
  passwordPolicy: PasswordPolicy;
  onPasswordPolicyChange: (policy: PasswordPolicy) => void;
  addAuditLog: (action: string, target: string) => void;
}

const COMPLEXITY_OPTIONS = [
  { key: 'requireUppercase' as const, label: 'Exigir letra maiúscula (A-Z)' },
  { key: 'requireLowercase' as const, label: 'Exigir letra minúscula (a-z)' },
  { key: 'requireNumbers' as const, label: 'Exigir número (0-9)' },
  { key: 'requireSpecialChars' as const, label: 'Exigir caractere especial (!@#$%)' },
];

export function PasswordPolicyTab({
  passwordPolicy,
  onPasswordPolicyChange,
  addAuditLog,
}: PasswordPolicyTabProps) {
  const { t } = useI18n();
  const [saved, setSaved] = useState(false);

  const updatePolicy = (patch: Partial<PasswordPolicy>) => {
    onPasswordPolicyChange({ ...passwordPolicy, ...patch });
    setSaved(false);
  };

  const handleSave = () => {
    addAuditLog('Alterou Política de Senhas', JSON.stringify(passwordPolicy));
    setSaved(true);
    if (typeof window !== 'undefined') {
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Policy */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800 text-base">Política de Senhas</h3>
        </div>
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">Política Ativa</span>
            <button
              onClick={() => updatePolicy({ enabled: !passwordPolicy.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                passwordPolicy.enabled ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                passwordPolicy.enabled ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Tamanho Mínimo: {passwordPolicy.minLength} caracteres
            </label>
            <input
              type="range"
              min={4}
              max={32}
              value={passwordPolicy.minLength}
              onChange={(e) => updatePolicy({ minLength: Number(e.target.value) })}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>4</span>
              <span>32</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Requisitos de Complexidade</p>
            {COMPLEXITY_OPTIONS.map((item) => (
              <label key={item.key} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passwordPolicy[item.key]}
                  onChange={(e) => updatePolicy({ [item.key]: e.target.checked } as Partial<PasswordPolicy>)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-medium text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Expiração (dias)</label>
              <input
                type="number"
                min={0}
                max={365}
                value={passwordPolicy.expirationDays}
                onChange={(e) => updatePolicy({ expirationDays: Number(e.target.value) })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              {passwordPolicy.expirationDays === 0 && (
                <p className="text-[9px] text-amber-600 font-medium mt-0.5">0 = sem expiração</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Histórico (senhas anteriores)</label>
              <input
                type="number"
                min={0}
                max={24}
                value={passwordPolicy.historyCount}
                onChange={(e) => updatePolicy({ historyCount: Number(e.target.value) })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <CheckCheck className="w-4 h-4" /> {t('fin_password_policy_saved', 'app')}
              </>
            ) : (
              t('fin_save_password_policy', 'app')
            )}
          </button>
        </div>
      </div>

      {/* Lockout */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800 text-base">Bloqueio Automático</h3>
        </div>
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Tentativas Máximas Antes do Bloqueio: {passwordPolicy.maxLoginAttempts}
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={passwordPolicy.maxLoginAttempts}
              onChange={(e) => updatePolicy({ maxLoginAttempts: Number(e.target.value) })}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Duração do Bloqueio: {passwordPolicy.lockoutDurationMinutes} minutos
            </label>
            <input
              type="range"
              min={1}
              max={1440}
              value={passwordPolicy.lockoutDurationMinutes}
              onChange={(e) => updatePolicy({ lockoutDurationMinutes: Number(e.target.value) })}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>1 min</span>
              <span>24 h</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Timeout de Sessão por Inatividade: {passwordPolicy.sessionTimeoutMinutes} minutos
            </label>
            <input
              type="range"
              min={5}
              max={480}
              value={passwordPolicy.sessionTimeoutMinutes}
              onChange={(e) => updatePolicy({ sessionTimeoutMinutes: Number(e.target.value) })}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>5 min</span>
              <span>8 h</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[10px] text-amber-800 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              As alterações entram em vigor imediatamente para novos logins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
