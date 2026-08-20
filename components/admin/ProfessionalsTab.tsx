'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, Edit2, Trash2, Plus, UserPlus } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import { Professional } from './AdminContext';
import type { ProfessionalCouncil, ProfessionalShift } from '@/lib/mockData';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { professionalSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import I18nDatePicker from '@/components/I18nDatePicker';

const ROLE_TO_COUNCIL: Record<string, ProfessionalCouncil> = {
  'Médico(a)': 'CRM',
  'Cirurgião(ã)': 'CRM',
  'Anestesiologista': 'CRM',
  'Enfermeiro(a)': 'COREN',
  'Técnico(a) de Enfermagem': 'COREN',
  'Auxiliar de Enfermagem': 'COREN',
  'Fisioterapeuta': 'CREFITO',
  'Terapeuta Ocupacional': 'CREFITO',
  'Psicólogo(a)': 'CFP',
  'Nutricionista': 'CFN',
  'Dentista': 'CRO',
  'Farmacêutico(a)': 'CRF',
  'Técnico(a) em Farmácia': 'CRF',
  'Técnico(a) de Laboratório': 'CRF',
  'Biomédico(a)': 'CRBM',
  'Educador Físico': 'CREF',
  'Assistente Social': 'CRESS',
  'Administrador(a)': 'CRA',
  'Fonoaudiólogo(a)': 'CREFONO',
  'Técnico(a) em Radiologia': 'CRTR',
};

const DEFAULT_ROLES: string[] = [
  'Médico(a)',
  'Enfermeiro(a)',
  'Fisioterapeuta',
  'Psicólogo(a)',
  'Nutricionista',
  'Técnico(a) de Enfermagem',
  'Auxiliar de Enfermagem',
  'Anestesiologista',
  'Cirurgião(ã)',
  'Terapeuta Ocupacional',
  'Educador Físico',
  'Assistente Social',
  'Fonoaudiólogo(a)',
  'Farmacêutico(a)',
  'Dentista',
  'Biomédico(a)',
  'Técnico(a) em Radiologia',
  'Técnico(a) em Farmácia',
  'Técnico(a) de Laboratório',
  'Administrador(a)',
  'Recepcionista',
];

const COUNCILS: ProfessionalCouncil[] = [
  'CRM', 'COREN', 'CREFITO', 'CFP', 'CFN', 'CRO', 'CRF', 'CRBM',
  'CREF', 'CRESS', 'CRA', 'CREFONO', 'CRTR', 'N/A',
];

const SHIFTS: ProfessionalShift[] = [
  'Manhã', 'Tarde', 'Noite', 'Integral', 'Plantão 12h', 'Plantão 24h',
];

interface ProfessionalsTabProps {
  professionals: Professional[];
  setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>>;
  professionalRoles: string[];
  locations?: Array<{ id: string; name: string; status?: string }>;
  addAuditLog: (action: string, target: string) => void;
  onCreateUser?: (prof: Professional) => void;
}

export function ProfessionalsTab({
  professionals,
  setProfessionals,
  professionalRoles,
  locations = [],
  addAuditLog,
  onCreateUser,
}: ProfessionalsTabProps) {
  const { t } = useI18n();
  const { errors, validate } = useFormValidation(professionalSchema);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profName, setProfName] = useState('');
  const [profRole, setProfRole] = useState('Médico(a)');
  const [profSpecialty, setProfSpecialty] = useState('');
  const [profCouncil, setProfCouncil] = useState<ProfessionalCouncil>('CRM');
  const [profCouncilNumber, setProfCouncilNumber] = useState('');
  const [profShift, setProfShift] = useState<ProfessionalShift>('Manhã');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profAdmission, setProfAdmission] = useState(new Date().toISOString().split('T')[0]);
  const [profLocationId, setProfLocationId] = useState('');
  const [linkedUserProfs, setLinkedUserProfs] = useState<Set<string>>(new Set());

  const loadLinkedUserProfs = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return;
      const data = await res.json();
      const users = Array.isArray(data?.users) ? data.users : [];
      const ids = users
        .filter((u: Record<string, unknown>) => u.professional_id)
        .map((u: Record<string, unknown>) => u.professional_id as string);
      setLinkedUserProfs(new Set(ids));
    } catch {}
  };

  useEffect(() => {
    void loadLinkedUserProfs();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setProfName('');
    setProfRole('Médico(a)');
    setProfSpecialty('');
    setProfCouncil('CRM');
    setProfCouncilNumber('');
    setProfShift('Manhã');
    setProfEmail('');
    setProfPhone('');
    setProfAdmission(new Date().toISOString().split('T')[0]);
    setProfLocationId('');
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (prof: Professional) => {
    setEditingId(prof.id);
    setProfName(prof.name);
    setProfRole(prof.role);
    setProfSpecialty(prof.specialty);
    setProfCouncil(prof.council);
    setProfCouncilNumber(prof.councilNumber);
    setProfShift(prof.shift);
    setProfEmail(prof.email);
    setProfPhone(prof.phone);
    setProfAdmission(prof.admissionDate);
    setProfLocationId(prof.locationId || '');
    setShowForm(true);
  };

  const generateProfessionalId = async (): Promise<string> => {
    if (supabase) {
      const { data, error } = await supabase.rpc('next_professional_id');
      if (!error && data) return data as string;
      console.error('Erro ao gerar ID de profissional via RPC:', error?.message);
    }
    return `PRF${String(professionals.length + 1).padStart(3, '0')}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = validate({
      name: profName,
      role: profRole,
      specialty: profSpecialty,
      council: profCouncil,
      councilNumber: profCouncilNumber,
      shift: profShift,
      email: profEmail,
      phone: profPhone,
      admissionDate: profAdmission,
      status: 'ativo' as const,
      locationId: profLocationId,
    });

    if (!result.success) {
      return;
    }

    const profData: Professional = {
      id: editingId || (await generateProfessionalId()),
      name: profName,
      role: profRole,
      specialty: profSpecialty,
      council: profCouncil,
      councilNumber: profCouncilNumber,
      shift: profShift,
      email: profEmail,
      phone: profPhone,
      status: 'ativo',
      admissionDate: profAdmission,
      locationId: profLocationId,
    };

    const profDbRow = {
      id: profData.id,
      name: profData.name,
      role: profData.role,
      specialty: profData.specialty,
      council: profData.council,
      council_number: profData.councilNumber,
      shift: profData.shift,
      email: profData.email,
      phone: profData.phone,
      status: profData.status,
      admission_date: profData.admissionDate,
      location_id: profData.locationId || null,
    };

    if (editingId) {
      setProfessionals((prev) => prev.map((p) => (p.id === editingId ? profData : p)));
      if (supabase) {
        await supabase.from('professionals').update(profDbRow).eq('id', editingId);
      }
      addAuditLog('Atualizou Profissional', profName);
    } else {
      setProfessionals((prev) => [...prev, profData]);
      if (supabase) {
        await supabase.from('professionals').insert({ ...profDbRow, created_at: new Date().toISOString() });
      }
      addAuditLog('Cadastrou Profissional', profName);
    }
    resetForm();
    setShowForm(false);
  };

  const fieldErrors = groupErrorsByPath(errors);

  const handleToggleStatus = async (prof: Professional) => {
    const newStatus = prof.status === 'ativo' ? 'inativo' : 'ativo';
    setProfessionals((prev) => prev.map((p) => (p.id === prof.id ? { ...p, status: newStatus as Professional['status'] } : p)));
    if (supabase) {
      await supabase.from('professionals').update({ status: newStatus } as Record<string, unknown>).eq('id', prof.id);
    }
    addAuditLog(newStatus === 'ativo' ? 'Ativou Profissional' : 'Desativou Profissional', prof.name);
  };

  const handleCreateUserClick = (prof: Professional) => {
    setLinkedUserProfs((prev) => new Set(prev).add(prof.id));
    onCreateUser?.(prof);
  };

  const handleDelete = async (prof: Professional) => {
    if (typeof window === 'undefined') return;

    let linkedUserIds: string[] = [];
    try {
      const res = await fetch(`/api/admin/users?professional_id=${encodeURIComponent(prof.id)}`);
      if (res.ok) {
        const data = await res.json();
        linkedUserIds = Array.isArray(data?.ids) ? data.ids : [];
      }
    } catch {}

    const baseMsg = t('fin_confirm_delete_professional', 'app').replace('{name}', prof.name);
    const msg = linkedUserIds.length > 0
      ? t('fin_confirm_delete_professional_with_user', 'app').replace('{name}', prof.name)
      : baseMsg;
    if (!confirm(msg)) return;

    for (const uid of linkedUserIds) {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uid }),
      });
      if (!response.ok) {
        let errMsg = t('fin_alert_error_delete_user', 'app');
        try {
          const errData = await response.json();
          if (errData?.error) errMsg += errData.error;
        } catch {}
        if (typeof window !== 'undefined') alert(errMsg);
        return;
      }
      addAuditLog('Excluiu Usuário Vinculado', prof.name);
    }

    setProfessionals((prev) => prev.filter((p) => p.id !== prof.id));
    if (supabase) {
      await supabase.from('professionals').delete().eq('id', prof.id);
    }
    addAuditLog('Removeu Profissional', prof.name);
  };

  const roleOptions = professionalRoles.length > 0
    ? professionalRoles
    : DEFAULT_ROLES;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-teal-600" /> {t('fin_registered_professionals', 'app')} ({professionals.length})
        </h3>
        <button
          onClick={openNew}
          className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> {t('fin_new_professional', 'app')}
        </button>
      </div>

      {showForm && (
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) { resetForm(); setShowForm(false); } }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-xl border-0">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                {editingId ? t('fin_edit_professional', 'app') : t('fin_new_professional', 'app')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} noValidate className="space-y-4 text-xs">
            {errors.length > 0 && <FormErrorSummary errors={errors} />}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_name', 'app')} *</label>
              <input
                type="text"
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                placeholder={t('fin_professional_name_placeholder', 'app')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_role', 'app')} *</label>
                <select
                  value={profRole}
                  onChange={(e) => {
                    const role = e.target.value;
                    setProfRole(role);
                    setProfCouncil(ROLE_TO_COUNCIL[role] || 'N/A');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_specialty', 'app')} *</label>
                <input
                  type="text"
                  value={profSpecialty}
                  onChange={(e) => setProfSpecialty(e.target.value)}
                  placeholder={t('fin_professional_specialty_placeholder', 'app')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_council', 'app')} *</label>
                <select
                  value={profCouncil}
                  onChange={(e) => setProfCouncil(e.target.value as ProfessionalCouncil)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {COUNCILS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_council_number', 'app')} *</label>
                <input
                  type="text"
                  value={profCouncilNumber}
                  onChange={(e) => setProfCouncilNumber(e.target.value)}
                  placeholder={t('fin_professional_council_number_placeholder', 'app')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_shift', 'app')} *</label>
                <select
                  value={profShift}
                  onChange={(e) => setProfShift(e.target.value as ProfessionalShift)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-sans"
                >
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_admission', 'app')} *</label>
                <I18nDatePicker
                  value={profAdmission}
                  onChange={setProfAdmission}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_professional_location_label', 'app')} *</label>
              <select
                value={profLocationId}
                onChange={(e) => setProfLocationId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="">{t('fin_select_location', 'app')}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_email_label', 'app')} *</label>
                <input
                  type="text"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  placeholder={t('fin_email_placeholder', 'app')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_label_phone', 'app')} *</label>
                <input
                  type="text"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  placeholder={t('fin_phone_placeholder', 'app')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition">
                {editingId ? t('app_save_changes', 'app') : t('app_register', 'app')}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
                {t('app_cancel', 'app')}
              </button>
            </div>
          </form>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {professionals.map((prof) => (
          <div
            key={prof.id}
            className={`p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2 ${prof.status === 'inativo' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: prof.color || '#0d9488' }}
                >
                  {prof.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm">{prof.name}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{prof.role}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(prof)}
                className={`px-2 py-1 text-[10px] font-bold rounded border ${
                  prof.status === 'ativo'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {prof.status === 'ativo' ? t('fin_active', 'app') : t('fin_inactive', 'app')}
              </button>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>🏥 <span className="font-semibold">{prof.specialty}</span></p>
              <p>📜 {prof.council} {prof.councilNumber}</p>
              <p>🕐 {prof.shift}</p>
              {locations.find((loc) => loc.id === prof.locationId)?.name && (
                <p>📍 {locations.find((loc) => loc.id === prof.locationId)?.name}</p>
              )}
              {prof.email && <p>✉️ {prof.email}</p>}
              {prof.phone && <p>📞 {prof.phone}</p>}
              <p className="text-slate-400">{t('fin_admission_label', 'app')}: {prof.admissionDate}</p>
            </div>
            <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
              <div className="flex-1" />
              {onCreateUser && !linkedUserProfs.has(prof.id) && (
                <button
                  onClick={() => handleCreateUserClick(prof)}
                  className="p-1.5 rounded hover:bg-teal-50 text-teal-600 hover:text-teal-800"
                  title={t('fin_create_user_for_professional', 'app')}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => openEdit(prof)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                title={t('fin_btn_edit', 'app')}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(prof)}
                className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                title={t('fin_btn_remove', 'app')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {professionals.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400 font-semibold text-xs">
            {t('no_professionals', 'app')}
          </div>
        )}
      </div>
    </div>
  );
}
