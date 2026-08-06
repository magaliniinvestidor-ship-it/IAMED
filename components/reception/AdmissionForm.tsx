'use client';

import React, { useState } from 'react';
import {
  UserPlus, Check, Upload, Camera, Shield, Languages,
  ChevronRight, AlertCircle,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { Patient, ReceptionModuleProps, AdmissionFormTab, GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, DOCUMENT_TYPES, BLOOD_TYPES, HEALTH_INSURANCE_OPTIONS, LANGUAGES } from './ReceptionContext';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { patientSchema } from '@/lib/validation/schemas';
import PhoneInput from '@/components/PhoneInput';
import I18nDatePicker from '@/components/I18nDatePicker';
import { FormField, FormErrorSummary } from '@/components/forms';

interface AdmissionFormProps {
  addAuditLog: (action: string, target: string) => void;
  onSuccess: (patient: Patient) => void;
  initialPatient?: Patient | null;
  onClose: () => void;
}

const TABS: Array<{ key: AdmissionFormTab; label: string; icon: React.ElementType }> = [
  { key: 'identification', label: 'Identificação', icon: Shield },
  { key: 'contact_address', label: 'Contato / Endereço', icon: Languages },
  { key: 'complementary', label: 'Complementares', icon: Check },
  { key: 'guardian', label: 'Responsável', icon: UserPlus },
];

export function AdmissionForm({ addAuditLog, onSuccess, initialPatient, onClose }: AdmissionFormProps) {
  const { t } = useI18n();
  const genModuleId = useModuleId();
  const { errors, validate, getFieldError, clearErrors } = useFormValidation(patientSchema);

  const [activeTab, setActiveTab] = useState<AdmissionFormTab>('identification');

  const [name, setName] = useState(initialPatient?.name || '');
  const [birthdate, setBirthdate] = useState(initialPatient?.birthdate || '');
  const [gender, setGender] = useState(initialPatient?.gender || '');
  const [documentType, setDocumentType] = useState<Patient['document_type']>(initialPatient?.document_type || 'CI');
  const [documentNumber, setDocumentNumber] = useState(initialPatient?.document_number || '');

  const [email, setEmail] = useState(initialPatient?.email || '');
  const [phone, setPhone] = useState(initialPatient?.phone || '');
  const [placeOfBirth, setPlaceOfBirth] = useState(initialPatient?.place_of_birth || '');
  const [nationality, setNationality] = useState(initialPatient?.nationality || '');
  const [civilStatus, setCivilStatus] = useState<Patient['civil_status']>(initialPatient?.civil_status);
  const [addressDepartment, setAddressDepartment] = useState(initialPatient?.address_department || '');
  const [addressCity, setAddressCity] = useState(initialPatient?.address_city || '');
  const [addressNeighborhood, setAddressNeighborhood] = useState(initialPatient?.address_neighborhood || '');
  const [addressStreet, setAddressStreet] = useState(initialPatient?.address_street || '');
  const [addressNumber, setAddressNumber] = useState(initialPatient?.address_number || '');

  const [bloodType, setBloodType] = useState<Patient['blood_type']>(initialPatient?.blood_type || '');
  const [allergies, setAllergies] = useState(initialPatient?.allergies || '');
  const [healthInsurance, setHealthInsurance] = useState<Patient['health_insurance_type']>(initialPatient?.health_insurance_type || '');
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState(initialPatient?.health_insurance_number || '');
  const [healthInsuranceCompany, setHealthInsuranceCompany] = useState(initialPatient?.health_insurance_company || '');
  const [employer, setEmployer] = useState(initialPatient?.employer || '');
  const [preferredLanguage, setPreferredLanguage] = useState<Patient['preferred_language']>(initialPatient?.preferred_language || 'pt-BR');

  const [guardianName, setGuardianName] = useState(initialPatient?.guardian_name || '');
  const [guardianDocument, setGuardianDocument] = useState(initialPatient?.guardian_document || '');
  const [guardianRelationship, setGuardianRelationship] = useState(initialPatient?.guardian_relationship || '');
  const [guardianPhone, setGuardianPhone] = useState(initialPatient?.guardian_phone || '');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPatient?.photo_url || null);

  const isMinor = birthdate
    ? new Date().getFullYear() - new Date(birthdate).getFullYear() < 18
    : false;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const patientData = {
      name,
      email,
      phone,
      birthdate,
      gender: gender as 'M' | 'F' | 'Outro',
      document_type: documentType as 'CI' | 'RG' | 'Passaporte' | 'Outro' | undefined,
      document_number: documentNumber,
      place_of_birth: placeOfBirth,
      civil_status: civilStatus as 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável' | undefined,
      nationality,
      address_department: addressDepartment,
      address_city: addressCity,
      address_neighborhood: addressNeighborhood,
      address_street: addressStreet,
      address_number: addressNumber,
      blood_type: bloodType as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Não Informado' | '' | undefined,
      allergies,
      health_insurance_type: healthInsurance as 'IPS' | 'Sanidade Militar' | 'Sanidade Policial' | 'Pré-paga' | 'Seguro Privado' | 'Particular' | '' | undefined,
      health_insurance_number: healthInsuranceNumber,
      health_insurance_company: healthInsuranceCompany,
      employer,
      guardian_name: guardianName,
      guardian_document: guardianDocument,
      guardian_relationship: guardianRelationship,
      guardian_phone: guardianPhone,
      preferred_language: preferredLanguage as 'es' | 'es-AR' | 'es-PY' | 'gn' | 'pt-BR' | 'pt-PT' | 'en' | 'outros' | '' | undefined,
    };

    const result = validate(patientData);
    if (!result.success) {
      const grouped = groupErrorsByPath(result.errors);
      const firstError = result.errors[0];
      if (firstError) {
        if (['name', 'email', 'phone', 'birthdate', 'gender', 'document_type', 'document_number'].includes(firstError.path)) {
          setActiveTab('identification');
        } else if (['address_department', 'address_city', 'address_neighborhood', 'address_street', 'address_number'].includes(firstError.path)) {
          setActiveTab('contact_address');
        } else if (['blood_type', 'allergies', 'health_insurance_type', 'health_insurance_number', 'health_insurance_company', 'employer'].includes(firstError.path)) {
          setActiveTab('complementary');
        } else if (['guardian_name', 'guardian_document', 'guardian_relationship', 'guardian_phone'].includes(firstError.path)) {
          setActiveTab('guardian');
        }
      }
      return;
    }

    const id = initialPatient?.id || (await genModuleId('next_patient_id'));
    const newPatient: Patient = {
      ...patientData,
      id,
      priority: 'normal',
      status: 'aguardando',
      clinicalHistory: [],
      photo_url: photoPreview || undefined,
    };

    if (supabase) {
      const { error } = await supabase.from('patients').upsert({
        ...newPatient,
        clinical_history: '[]',
        created_at: new Date().toISOString(),
      } as unknown as Record<string, unknown>);
      if (error && typeof window !== 'undefined') {
        alert(t('rcpt_alert_save_error', 'app') + error.message);
        return;
      }
    }

    addAuditLog(initialPatient ? t('rcpt_audit_update_patient', 'app') : t('rcpt_audit_new_patient', 'app'), name);
    onSuccess(newPatient);
  };

  const fieldErrors = groupErrorsByPath(errors);

  const inputCls = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs';
  const labelCls = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50 flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-800 text-sm">
            {initialPatient ? t('rcpt_edit_admission', 'app') : t('rcpt_new_admission', 'app')}
          </h3>
          <p className="text-[10px] text-slate-500">{t('rcpt_required_fields_hint', 'app')}</p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold transition border-b-2 ${
                isActive
                  ? 'border-teal-600 text-teal-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {errors.length > 0 && (
          <FormErrorSummary errors={errors} title={t('rcpt_validation_errors', 'app') || 'Corrija os erros antes de salvar'} />
        )}

        {activeTab === 'identification' && (
          <div className="space-y-4">
            {/* Photo Upload */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Foto" className="w-24 h-24 rounded-xl object-cover border-2 border-teal-200" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
                <label className="block mt-2">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <span className="flex items-center justify-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer">
                    <Upload className="w-3 h-3" /> Foto
                  </span>
                </label>
              </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FormField label={t('rcpt_label_name', 'app')} required error={fieldErrors.name}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('rcpt_ph_full_name', 'app')}
                      className={`w-full p-2 bg-slate-50 border rounded-lg text-xs ${
                        fieldErrors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                  </FormField>
                </div>
                <FormField label={t('rcpt_label_birthdate', 'app')} required error={fieldErrors.birthdate}>
                  <I18nDatePicker
                    value={birthdate}
                    onChange={setBirthdate}
                    className={`w-full p-2 bg-slate-50 border rounded-lg text-xs ${
                      fieldErrors.birthdate ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </FormField>
                <FormField label={t('rcpt_label_gender', 'app')} error={fieldErrors.gender}>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`w-full p-2 bg-slate-50 border rounded-lg text-xs ${
                      fieldErrors.gender ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  >
                    <option value="">—</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label={t('rcpt_label_document_type', 'app')} error={fieldErrors.document_type}>
                <select
                  value={documentType || ''}
                  onChange={(e) => setDocumentType(e.target.value as Patient['document_type'])}
                  className={`w-full p-2 bg-slate-50 border rounded-lg text-xs ${
                    fieldErrors.document_type ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  <option value="">—</option>
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </FormField>
              <div className="col-span-2">
                <FormField label={t('rcpt_label_document_number', 'app')} error={fieldErrors.document_number}>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className={`w-full p-2 bg-slate-50 border rounded-lg text-xs ${
                      fieldErrors.document_number ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('rcpt_label_place_of_birth', 'app')}</label>
                <input
                  type="text"
                  value={placeOfBirth}
                  onChange={(e) => setPlaceOfBirth(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_nationality', 'app')}</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>{t('rcpt_label_civil_status', 'app')}</label>
              <select
                value={civilStatus || ''}
                onChange={(e) => setCivilStatus(e.target.value as Patient['civil_status'])}
                className={inputCls}
              >
                <option value="">—</option>
                {CIVIL_STATUS_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'contact_address' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('rcpt_label_email', 'app')} *</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_phone', 'app')} *</label>
                <PhoneInput value={phone} onChange={setPhone} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>{t('rcpt_label_address_department', 'app')}</label>
                <input
                  type="text"
                  value={addressDepartment}
                  onChange={(e) => setAddressDepartment(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_address_city', 'app')}</label>
                <input
                  type="text"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_address_neighborhood', 'app')}</label>
                <input
                  type="text"
                  value={addressNeighborhood}
                  onChange={(e) => setAddressNeighborhood(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>{t('rcpt_label_address_street', 'app')}</label>
                <input
                  type="text"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_address_number', 'app')}</label>
                <input
                  type="text"
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('rcpt_label_preferred_language', 'app')}</label>
              <select
                value={preferredLanguage || 'pt-BR'}
                onChange={(e) => setPreferredLanguage(e.target.value as Patient['preferred_language'])}
                className={inputCls}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'complementary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('rcpt_label_blood_type', 'app')}</label>
                <select
                  value={bloodType || ''}
                  onChange={(e) => setBloodType(e.target.value as Patient['blood_type'])}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {BLOOD_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_employer', 'app')}</label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('rcpt_label_allergies', 'app')}</label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
                className={inputCls}
                placeholder={t('rcpt_ph_allergies', 'app')}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>{t('rcpt_label_health_insurance', 'app')}</label>
                <select
                  value={healthInsurance || ''}
                  onChange={(e) => setHealthInsurance(e.target.value as Patient['health_insurance_type'])}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {HEALTH_INSURANCE_OPTIONS.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_insurance_number', 'app')}</label>
                <input
                  type="text"
                  value={healthInsuranceNumber}
                  onChange={(e) => setHealthInsuranceNumber(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_insurance_company', 'app')}</label>
                <input
                  type="text"
                  value={healthInsuranceCompany}
                  onChange={(e) => setHealthInsuranceCompany(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guardian' && (
          <div className="space-y-4">
            {isMinor ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t('rcpt_minor_guardian_required', 'app')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t('rcpt_guardian_optional', 'app')}</span>
              </div>
            )}
            <div>
              <label className={labelCls}>{t('rcpt_label_guardian_name', 'app')}</label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('rcpt_label_guardian_document', 'app')}</label>
                <input
                  type="text"
                  value={guardianDocument}
                  onChange={(e) => setGuardianDocument(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t('rcpt_label_guardian_relationship', 'app')}</label>
                <input
                  type="text"
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  className={inputCls}
                  placeholder={t('rcpt_ph_relationship', 'app')}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('rcpt_label_guardian_phone', 'app')}</label>
              <PhoneInput value={guardianPhone} onChange={setGuardianPhone} className={inputCls} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <button
          onClick={() => {
            const idx = TABS.findIndex((t) => t.key === activeTab);
            if (idx > 0) setActiveTab(TABS[idx - 1].key);
          }}
          disabled={activeTab === 'identification'}
          className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
        >
          ← Anterior
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded"
          >
            {t('app_cancel', 'app')}
          </button>
          {activeTab !== 'guardian' ? (
            <button
              onClick={() => {
                const idx = TABS.findIndex((t) => t.key === activeTab);
                if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].key);
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded flex items-center gap-1"
            >
              Próximo <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> {t('app_save_changes', 'app')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
