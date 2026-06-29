'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Patient, Appointment, Professional } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { 
  Plus, Contact, CalendarDays, Check, Search, 
  Clock, AlertTriangle, UserPlus, Filter, Camera, 
  Upload, ShieldCheck, Mail, MapPin, Phone, User, 
  AlertCircle, ChevronRight, ChevronLeft, Languages, 
  HeartPulse, Shield, KeyRound, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReceptionModuleProps {
  patients: Patient[];
  appointments: Appointment[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  activeSubmodule: number; // 1 = Recepção, 2 = Agenda
  addAuditLog: (action: string, target: string) => void;
  professionals?: Professional[];
}

export default function ReceptionModule({
  patients,
  appointments,
  setPatients,
  setAppointments,
  activeSubmodule,
  addAuditLog,
  professionals = [],
}: ReceptionModuleProps) {
  const { t } = useI18n();
  // Tab control inside Admission Form
  const [activeFormTab, setActiveFormTab] = useState<'identification' | 'contact_address' | 'complementary' | 'guardian'>('identification');

  // Search & List states
  const [patientSearch, setPatientSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('todos');
  
  // --- Form States ---
  // Mandatory fields
  const [newName, setNewName] = useState('');
  const [newBirthdate, setNewBirthdate] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('Masculino');
  const [newPriority, setNewPriority] = useState<'normal' | 'preferencial' | 'emergência'>('normal');
  const [documentType, setDocumentType] = useState<'CI' | 'Passaporte' | 'RG' | 'Outro'>('CI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [civilStatus, setCivilStatus] = useState<'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável'>('Solteiro(a)');
  const [nationality, setNationality] = useState('Paraguaia');
  const [addressDepartment, setAddressDepartment] = useState('');
  const [addressDistrict, setAddressDistrict] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  
  // Complementary fields
  const [bloodType, setBloodType] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O+');
  const [allergies, setAllergies] = useState('');
  const [healthInsuranceType, setHealthInsuranceType] = useState<'IPS' | 'Sanidade Militar' | 'Sanidade Policial' | 'Pré-paga' | 'Seguro Privado' | 'Particular'>('Particular');
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState('');
  const [healthInsuranceCompany, setHealthInsuranceCompany] = useState('');
  const [employer, setEmployer] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianDocument, setGuardianDocument] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'es' | 'gn' | 'pt' | 'en' | 'outros'>('es');
  const [photoUrl, setPhotoUrl] = useState('');

  // --- Photo states (webcam simulation) ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [webcamPlaceholder, setWebcamPlaceholder] = useState<string | null>(null);
  const videoSimRef = useRef<HTMLDivElement>(null);

  // --- Validation & Alerts States ---
  const [calculatedDV, setCalculatedDV] = useState<number | null>(null);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [age, setAge] = useState<number>(0);
  const [isMinor, setIsMinor] = useState(false);
  const [duplicatePatient, setDuplicatePatient] = useState<Patient | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [pinError, setPinError] = useState('');

  // --- Merge Selection State ---
  const [mergeSelections, setMergeSelections] = useState<Partial<Patient>>({});

  // Appointments schedule forms state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('Dra. Amanda Silva');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Cardiologia');
  const [selectedDate, setSelectedDate] = useState('2026-06-22');
  const [selectedTime, setSelectedTime] = useState('14:00');

  // --- Real-time Calculators & Validations ---
  
  // Paraguay CI Modulo 11 check digit calculation
  useEffect(() => {
    if (documentType === 'CI' && documentNumber) {
      const cleanDoc = documentNumber.replace(/\D/g, '');
      if (cleanDoc.length > 0) {
        let sum = 0;
        let factor = 2;
        for (let i = cleanDoc.length - 1; i >= 0; i--) {
          sum += parseInt(cleanDoc.charAt(i)) * factor;
          factor++;
          if (factor > 11) factor = 2;
        }
        const remainder = sum % 11;
        const dv = remainder > 1 ? 11 - remainder : 0;
        setCalculatedDV(dv);
      } else {
        setCalculatedDV(null);
      }
    } else {
      setCalculatedDV(null);
    }
  }, [documentNumber, documentType]);

  // Phone Validation (+595 9xx xxx xxx)
  useEffect(() => {
    const cleanPhone = newPhone.replace(/\s+/g, '');
    const paraguayRegex = /^\+5959[6-9]\d{7}$/;
    setIsPhoneValid(paraguayRegex.test(cleanPhone));
  }, [newPhone]);

  // Email Validation
  useEffect(() => {
    if (!newEmail) {
      setIsEmailValid(true);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(newEmail));
  }, [newEmail]);

  // Age & Minor logic
  useEffect(() => {
    if (!newBirthdate) {
      setAge(0);
      setIsMinor(false);
      return;
    }
    const today = new Date();
    const birthDate = new Date(newBirthdate);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge);
    setIsMinor(calculatedAge < 18);
    
    // Automatically switch to guardian tab if minor to alert user
    if (calculatedAge < 18 && activeFormTab === 'guardian') {
      // stay here
    }
  }, [newBirthdate]);

  // Duplicate Check (CI + Birthdate)
  useEffect(() => {
    if (documentNumber && newBirthdate) {
      const match = patients.find(
        p => p.document_number === documentNumber && p.birthdate === newBirthdate
      );
      setDuplicatePatient(match || null);
    } else {
      setDuplicatePatient(null);
    }
  }, [documentNumber, newBirthdate, patients]);

  // --- Handlers & Helpers ---

  const handlePhoneFormat = (val: string) => {
    // Automatically apply +595 format helper
    if (!val.startsWith('+595')) {
      if (val.startsWith('09')) {
        setNewPhone('+595' + val.substring(1));
      } else if (val.startsWith('9')) {
        setNewPhone('+595' + val);
      } else {
        setNewPhone('+595' + val.replace(/\D/g, ''));
      }
    } else {
      setNewPhone(val);
    }
  };

  const handleSimulateWebcam = () => {
    setIsCameraActive(true);
    setCameraCountdown(3);
    
    const interval = setInterval(() => {
      setCameraCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          // Generate a custom SVG avatar representing captured photo
          const initials = newName ? newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';
          const randomHue = Math.floor(Math.random() * 360);
          const svgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="hsl(${randomHue}, 45%, 90%)"/><circle cx="100" cy="80" r="40" fill="hsl(${randomHue}, 45%, 45%)"/><path d="M40 160 C 40 120, 160 120, 160 160" fill="hsl(${randomHue}, 45%, 45%)"/><text x="100" y="180" font-family="sans-serif" font-size="14" font-weight="bold" fill="hsl(${randomHue}, 45%, 25%)" text-anchor="middle">Foto Capturada (${initials})</text></svg>`;
          setWebcamPlaceholder(svgData);
          setPhotoUrl(svgData);
          setIsCameraActive(false);
          addAuditLog('Capturou foto do Paciente via Webcam', newName || 'Pendente');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setWebcamPlaceholder(result);
        setPhotoUrl(result);
        addAuditLog('Carregou foto do Paciente', newName || 'Pendente');
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Patient Submit
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify fields
    if (!newName.trim() || !newPhone.trim() || !newBirthdate) {
      alert("Por favor preencha todos os campos obrigatórios.");
      return;
    }

    if (!isPhoneValid) {
      alert("Formato de celular paraguaio inválido (+595 9xx xxx xxx).");
      return;
    }

    if (isMinor && (!guardianName.trim() || !guardianDocument.trim() || !guardianRelationship.trim())) {
      alert("Paciente menor de idade. Os dados do responsável legal são obrigatórios!");
      setActiveFormTab('guardian');
      return;
    }

    const patientId = `pat_${Date.now()}`;
    const newPatient: Patient = {
      id: patientId,
      name: newName,
      email: newEmail || 'sem-email@iamed.com',
      phone: newPhone,
      birthdate: newBirthdate,
      gender: newGender,
      priority: newPriority,
      status: 'aguardando',
      clinicalHistory: [],
      
      document_type: documentType,
      document_number: documentNumber,
      place_of_birth: placeOfBirth,
      civil_status: civilStatus,
      nationality: nationality,
      address_department: addressDepartment,
      address_district: addressDistrict,
      address_city: addressCity,
      address_neighborhood: addressNeighborhood,
      address_street: addressStreet,
      address_number: addressNumber,
      whatsapp_verified: whatsappVerified,
      
      blood_type: bloodType,
      allergies: allergies,
      health_insurance_type: healthInsuranceType,
      health_insurance_number: healthInsuranceNumber,
      health_insurance_company: healthInsuranceCompany,
      employer: employer,
      guardian_name: isMinor ? guardianName : undefined,
      guardian_document: isMinor ? guardianDocument : undefined,
      guardian_relationship: isMinor ? guardianRelationship : undefined,
      photo_url: photoUrl,
      preferred_language: preferredLanguage
    };

    // Optimistic UI update
    setPatients(prev => [newPatient, ...prev]);
    addAuditLog('Admitiu Paciente', newPatient.name);

    // Save to Supabase (dynamic fields included)
    try {
      await supabase.from('patients').insert({
        id: newPatient.id,
        name: newPatient.name,
        email: newPatient.email,
        phone: newPatient.phone,
        birthdate: newPatient.birthdate,
        gender: newPatient.gender,
        priority: newPatient.priority,
        status: newPatient.status,
        
        document_type: newPatient.document_type,
        document_number: newPatient.document_number,
        place_of_birth: newPatient.place_of_birth,
        civil_status: newPatient.civil_status,
        nationality: newPatient.nationality,
        address_department: newPatient.address_department,
        address_district: newPatient.address_district,
        address_city: newPatient.address_city,
        address_neighborhood: newPatient.address_neighborhood,
        address_street: newPatient.address_street,
        address_number: newPatient.address_number,
        whatsapp_verified: newPatient.whatsapp_verified,
        
        blood_type: newPatient.blood_type,
        allergies: newPatient.allergies,
        health_insurance_type: newPatient.health_insurance_type,
        health_insurance_number: newPatient.health_insurance_number,
        health_insurance_company: newPatient.health_insurance_company,
        employer: newPatient.employer,
        guardian_name: newPatient.guardian_name,
        guardian_document: newPatient.guardian_document,
        guardian_relationship: newPatient.guardian_relationship,
        photo_url: newPatient.photo_url,
        preferred_language: newPatient.preferred_language
      });
    } catch (err) {
      console.warn("Failed to persist new patient to Supabase, offline/fallback active:", err);
    }

    // Reset Form
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewBirthdate('');
    setNewEmail('');
    setNewPhone('');
    setNewPriority('normal');
    setDocumentNumber('');
    setPlaceOfBirth('');
    setAddressDepartment('');
    setAddressDistrict('');
    setAddressCity('');
    setAddressNeighborhood('');
    setAddressStreet('');
    setAddressNumber('');
    setWhatsappVerified(false);
    setAllergies('');
    setHealthInsuranceNumber('');
    setHealthInsuranceCompany('');
    setEmployer('');
    setGuardianName('');
    setGuardianDocument('');
    setGuardianRelationship('');
    setWebcamPlaceholder(null);
    setPhotoUrl('');
    setActiveFormTab('identification');
  };

  // Trigger Merge
  const handleOpenMerge = () => {
    if (!duplicatePatient) return;
    
    // Set default selections to existing values
    setMergeSelections({
      ...duplicatePatient
    });
    
    setSupervisorPin('');
    setPinError('');
    setShowMergeModal(true);
  };

  // Perform Merge Action
  const handleConfirmMerge = async () => {
    if (supervisorPin !== '1234') {
      setPinError('PIN de Autorização Inválido!');
      return;
    }

    if (!duplicatePatient) return;

    // Build the merged patient record
    const mergedPatient: Patient = {
      ...duplicatePatient,
      // Apply selected options
      name: mergeSelections.name || duplicatePatient.name,
      email: mergeSelections.email || duplicatePatient.email,
      phone: mergeSelections.phone || duplicatePatient.phone,
      birthdate: mergeSelections.birthdate || duplicatePatient.birthdate,
      gender: mergeSelections.gender || duplicatePatient.gender,
      priority: mergeSelections.priority || duplicatePatient.priority,
      status: mergeSelections.status || duplicatePatient.status,
      
      document_type: mergeSelections.document_type || duplicatePatient.document_type,
      document_number: mergeSelections.document_number || duplicatePatient.document_number,
      place_of_birth: mergeSelections.place_of_birth || duplicatePatient.place_of_birth,
      civil_status: mergeSelections.civil_status || duplicatePatient.civil_status,
      nationality: mergeSelections.nationality || duplicatePatient.nationality,
      address_department: mergeSelections.address_department || duplicatePatient.address_department,
      address_district: mergeSelections.address_district || duplicatePatient.address_district,
      address_city: mergeSelections.address_city || duplicatePatient.address_city,
      address_neighborhood: mergeSelections.address_neighborhood || duplicatePatient.address_neighborhood,
      address_street: mergeSelections.address_street || duplicatePatient.address_street,
      address_number: mergeSelections.address_number || duplicatePatient.address_number,
      whatsapp_verified: mergeSelections.whatsapp_verified ?? duplicatePatient.whatsapp_verified,
      
      blood_type: mergeSelections.blood_type || duplicatePatient.blood_type,
      allergies: (mergeSelections.allergies || '') + 
                 (allergies && allergies !== duplicatePatient.allergies ? `, Nova Alergia: ${allergies}` : ''),
      health_insurance_type: mergeSelections.health_insurance_type || duplicatePatient.health_insurance_type,
      health_insurance_number: mergeSelections.health_insurance_number || duplicatePatient.health_insurance_number,
      health_insurance_company: mergeSelections.health_insurance_company || duplicatePatient.health_insurance_company,
      employer: mergeSelections.employer || duplicatePatient.employer,
      guardian_name: mergeSelections.guardian_name || duplicatePatient.guardian_name,
      guardian_document: mergeSelections.guardian_document || duplicatePatient.guardian_document,
      guardian_relationship: mergeSelections.guardian_relationship || duplicatePatient.guardian_relationship,
      photo_url: mergeSelections.photo_url || photoUrl || duplicatePatient.photo_url,
      preferred_language: mergeSelections.preferred_language || duplicatePatient.preferred_language,
    };

    // Update frontend state
    setPatients(prev => prev.map(p => p.id === duplicatePatient.id ? mergedPatient : p));
    addAuditLog('Mesclou e Fusio Fichas de Paciente', duplicatePatient.name);

    // Save to Supabase
    try {
      await supabase.from('patients').update({
        name: mergedPatient.name,
        email: mergedPatient.email,
        phone: mergedPatient.phone,
        birthdate: mergedPatient.birthdate,
        gender: mergedPatient.gender,
        priority: mergedPatient.priority,
        status: mergedPatient.status,
        
        document_type: mergedPatient.document_type,
        document_number: mergedPatient.document_number,
        place_of_birth: mergedPatient.place_of_birth,
        civil_status: mergedPatient.civil_status,
        nationality: mergedPatient.nationality,
        address_department: mergedPatient.address_department,
        address_district: mergedPatient.address_district,
        address_city: mergedPatient.address_city,
        address_neighborhood: mergedPatient.address_neighborhood,
        address_street: mergedPatient.address_street,
        address_number: mergedPatient.address_number,
        whatsapp_verified: mergedPatient.whatsapp_verified,
        
        blood_type: mergedPatient.blood_type,
        allergies: mergedPatient.allergies,
        health_insurance_type: mergedPatient.health_insurance_type,
        health_insurance_number: mergedPatient.health_insurance_number,
        health_insurance_company: mergedPatient.health_insurance_company,
        employer: mergedPatient.employer,
        guardian_name: mergedPatient.guardian_name,
        guardian_document: mergedPatient.guardian_document,
        guardian_relationship: mergedPatient.guardian_relationship,
        photo_url: mergedPatient.photo_url,
        preferred_language: mergedPatient.preferred_language
      }).eq('id', duplicatePatient.id);
    } catch (err) {
      console.warn("Failed to persist merged patient to Supabase:", err);
    }

    // Reset Form and close modal
    resetForm();
    setShowMergeModal(false);
    setDuplicatePatient(null);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const newApp: Appointment = {
      id: `app_${Date.now()}`,
      patientId: selectedPatientId,
      patientName: patient.name,
      doctorName: selectedDoctor,
      specialty: selectedSpecialty,
      date: selectedDate,
      time: selectedTime,
      status: 'confirmado'
    };

    // Optimistic UI update
    setAppointments(prev => [...prev, newApp]);
    addAuditLog('Agendou Consulta', `${patient.name} com ${selectedDoctor}`);

    // Persist to Supabase
    try {
      await supabase.from('appointments').insert({
        id: newApp.id,
        patient_id: newApp.patientId,
        patient_name: newApp.patientName,
        doctor_name: newApp.doctorName,
        specialty: newApp.specialty,
        date: newApp.date,
        time: newApp.time,
        status: newApp.status,
      });
    } catch (err) {
      console.warn("Failed to persist appointment:", err);
    }
  };

  const handleUpdatePatientStatus = async (id: string, status: Patient['status']) => {
    setPatients(prev => prev.map(p => {
      if (p.id === id) {
        addAuditLog(`Status Paciente (${status})`, p.name);
        return { ...p, status };
      }
      return p;
    }));
    try {
      await supabase.from('patients').update({ status }).eq('id', id);
    } catch (err) {
      console.warn("Failed to update status on Supabase:", err);
    }
  };

  const handleUpdateAppStatus = async (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        addAuditLog(`Status Consulta (${status})`, a.patientName);
        return { ...a, status };
      }
      return a;
    }));
    try {
      await supabase.from('appointments').update({ status }).eq('id', id);
    } catch (err) {
      console.warn("Failed to update status on Supabase:", err);
    }
  };

  const filteredPatients = patients.filter(p => {
    const searchVal = patientSearch.toLowerCase();
    const docNum = p.document_number || '';
    const matchesSearch = p.name.toLowerCase().includes(searchVal) || 
                          p.phone.includes(searchVal) ||
                          docNum.includes(searchVal);
    const matchesPriority = filterPriority === 'todos' || p.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const activeWaitingList = patients.filter(p => p.status === 'aguardando' || p.status === 'atendimento');

  return (
    <div className="space-y-6">
      {activeSubmodule === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Admissão Form (Expanded & Organized) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600 animate-pulse" />
                  <h3 className="font-bold text-slate-800 text-base">{t('checkin_admission', 'app')}</h3>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3" /> {t('secure_lei', 'app')}
                </span>
              </div>

              {/* Sub-Tabs of Form */}
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold mb-4 gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('identification')}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
                    activeFormTab === 'identification' 
                      ? 'bg-white text-teal-700 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Identificação
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('contact_address')}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
                    activeFormTab === 'contact_address' 
                      ? 'bg-white text-teal-700 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Contato/End.
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('complementary')}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
                    activeFormTab === 'complementary' 
                      ? 'bg-white text-teal-700 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Convênio/Comp.
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('guardian')}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-md transition text-center cursor-pointer flex items-center justify-center gap-1 ${
                    isMinor ? 'border border-amber-300 text-amber-800 bg-amber-50/50' : ''
                  } ${
                    activeFormTab === 'guardian' 
                      ? 'bg-white text-teal-700 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isMinor && <AlertCircle className="w-3 h-3 text-amber-500" />}
                  Responsável
                </button>
              </div>

              {/* Duplicate Warning */}
              <AnimatePresence>
                {duplicatePatient && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5 mb-4"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Possível Duplicidade Detectada!</p>
                      <p className="text-[11px] leading-relaxed">Já existe um paciente cadastrado com este documento ({documentNumber}) e data de nascimento ({newBirthdate}).</p>
                      <button
                        type="button"
                        onClick={handleOpenMerge}
                        className="mt-2 text-xs font-bold text-teal-700 bg-white border border-teal-200 rounded px-2.5 py-1 hover:bg-teal-50 cursor-pointer shadow-xs transition"
                      >
                        Iniciar Fusão de Fichas (Merge)
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleAddPatient} className="space-y-4 text-sm">
                
                {/* 1. IDENTIFICAÇÃO TAB */}
                {activeFormTab === 'identification' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo *</label>
                      <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Ex: Carlos Alberto Duarte Gómez" 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Documento</label>
                        <select 
                          value={documentType} 
                          onChange={e => setDocumentType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                        >
                          <option value="CI">Cédula CI (Paraguai)</option>
                          <option value="Passaporte">Passaporte</option>
                          <option value="RG">RG (Brasil)</option>
                          <option value="Outro">DNI / Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Número Doc *</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={documentNumber} 
                            onChange={e => setDocumentNumber(e.target.value)}
                            placeholder="Número do Documento" 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                            required
                          />
                          {calculatedDV !== null && (
                            <span className="absolute right-2 top-2 px-1.5 py-0.5 bg-teal-50 border border-teal-100 text-teal-800 font-bold text-[10px] rounded">
                              DV: {calculatedDV}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Data Nascimento *</label>
                        <input 
                          type="date" 
                          value={newBirthdate} 
                          onChange={e => setNewBirthdate(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
                        />
                        {age > 0 && (
                          <span className={`text-[10px] font-bold ${isMinor ? 'text-amber-600' : 'text-slate-500'}`}>
                            {age} anos {isMinor && '(Menor)'}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Local Nascimento</label>
                        <input 
                          type="text" 
                          value={placeOfBirth} 
                          onChange={e => setPlaceOfBirth(e.target.value)}
                          placeholder="Cidade/País de origem" 
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Sexo/Gênero</label>
                        <select 
                          value={newGender} 
                          onChange={e => setNewGender(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                        >
                          <option value="Masculino">Masc.</option>
                          <option value="Feminino">Fem.</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nacionalidade</label>
                        <input 
                          type="text" 
                          value={nationality} 
                          onChange={e => setNationality(e.target.value)}
                          placeholder="Nacionalidade" 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Civil</label>
                        <select 
                          value={civilStatus} 
                          onChange={e => setCivilStatus(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                        >
                          <option value="Solteiro(a)">Solt.</option>
                          <option value="Casado(a)">Cas.</option>
                          <option value="Divorciado(a)">Div.</option>
                          <option value="Viúvo(a)">Viúvo</option>
                          <option value="União Estável">União</option>
                        </select>
                      </div>
                    </div>

                    {/* Camera Capture Panel */}
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Foto do Paciente</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center relative">
                          {webcamPlaceholder ? (
                            <img src={webcamPlaceholder} className="w-full h-full object-cover" alt="Patient Capture" />
                          ) : (
                            <User className="w-8 h-8 text-slate-300" />
                          )}
                          {isCameraActive && (
                            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs font-bold font-sans">
                              {cameraCountdown !== null ? cameraCountdown : '...'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <button
                            type="button"
                            onClick={handleSimulateWebcam}
                            disabled={isCameraActive}
                            className="w-full py-1.5 px-3 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {isCameraActive ? 'Posicione rosto...' : 'Capturar via Câmera'}
                          </button>
                          
                          <label className="w-full py-1.5 px-3 bg-slate-200 hover:bg-slate-300 border border-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 transition text-center">
                            <Upload className="w-3.5 h-3.5" />
                            Upload de Arquivo
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handlePhotoUpload} 
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 2. CONTATO E ENDEREÇO TAB */}
                {activeFormTab === 'contact_address' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          Celular (+595) * 
                          {isPhoneValid ? (
                            <span className="text-green-600 font-bold">✔</span>
                          ) : (
                            <span className="text-amber-500 animate-pulse text-[10px]">Pendente</span>
                          )}
                        </label>
                        <input 
                          type="text" 
                          value={newPhone} 
                          onChange={e => handlePhoneFormat(e.target.value)}
                          placeholder="+595 981 123 456" 
                          className={`w-full p-2.5 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans ${
                            newPhone && !isPhoneValid ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                        <button
                          type="button"
                          onClick={() => setWhatsappVerified(!whatsappVerified)}
                          className={`w-full py-2.5 px-2.5 rounded-lg border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            whatsappVerified 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 ${whatsappVerified ? 'text-emerald-700' : 'text-slate-400'}`} />
                          {whatsappVerified ? 'Verificado & Integrado' : 'Validar WhatsApp'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        E-mail 
                        {!isEmailValid && (
                          <span className="text-rose-500 font-semibold text-[10px]">Inválido</span>
                        )}
                      </label>
                      <input 
                        type="email" 
                        value={newEmail} 
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="paciente@exemplo.com" 
                        className={`w-full p-2.5 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans ${
                          !isEmailValid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs pb-1 border-b border-slate-200">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span>Endereço Completo</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Departamento</label>
                          <input 
                            type="text" 
                            value={addressDepartment} 
                            onChange={e => setAddressDepartment(e.target.value)}
                            placeholder="Ex: Itapúa" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Distrito</label>
                          <input 
                            type="text" 
                            value={addressDistrict} 
                            onChange={e => setAddressDistrict(e.target.value)}
                            placeholder="Ex: Encarnación" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cidade</label>
                          <input 
                            type="text" 
                            value={addressCity} 
                            onChange={e => setAddressCity(e.target.value)}
                            placeholder="Ex: Encarnación" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Bairro</label>
                          <input 
                            type="text" 
                            value={addressNeighborhood} 
                            onChange={e => setAddressNeighborhood(e.target.value)}
                            placeholder="Ex: Loma Clavel" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Rua</label>
                          <input 
                            type="text" 
                            value={addressStreet} 
                            onChange={e => setAddressStreet(e.target.value)}
                            placeholder="Ex: Calle Constitución" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Número</label>
                          <input 
                            type="text" 
                            value={addressNumber} 
                            onChange={e => setAddressNumber(e.target.value)}
                            placeholder="Ex: 482" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          />
                        </div>
                      </div>

                    </div>

                  </motion.div>
                )}

                {/* 3. COMPLEMENTARES TAB */}
                {activeFormTab === 'complementary' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Sanguíneo</label>
                        <select 
                          value={bloodType} 
                          onChange={e => setBloodType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Idioma Pref.</label>
                        <select 
                          value={preferredLanguage} 
                          onChange={e => setPreferredLanguage(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                        >
                          <option value="es">Español 🇪🇸</option>
                          <option value="gn">Guaraní 🇵🇾</option>
                          <option value="pt">Português 🇧🇷</option>
                          <option value="en">English 🇺🇸</option>
                          <option value="outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Alergias / Antecedentes Clínicos</label>
                      <textarea 
                        value={allergies} 
                        onChange={e => setAllergies(e.target.value)}
                        placeholder="Ex: Alergia a Penicilina, Diabético..." 
                        rows={2}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs pb-1 border-b border-slate-200">
                        <HeartPulse className="w-4 h-4 text-teal-600" />
                        <span>Cobertura de Saúde / Convênio</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Seguro / Convênio</label>
                          <select 
                            value={healthInsuranceType} 
                            onChange={e => setHealthInsuranceType(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          >
                            <option value="Particular">Particular</option>
                            <option value="IPS">IPS (Segurado)</option>
                            <option value="Sanidade Militar">Sanidade Militar</option>
                            <option value="Sanidade Policial">Sanidade Policial</option>
                            <option value="Pré-paga">Pré-paga / Privado</option>
                            <option value="Seguro Privado">Seguro Internacional</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Nº de Afiliação / Segurado</label>
                          <input 
                            type="text" 
                            value={healthInsuranceNumber} 
                            onChange={e => setHealthInsuranceNumber(e.target.value)}
                            placeholder="Nº da carteirinha" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            disabled={healthInsuranceType === 'Particular'}
                          />
                        </div>
                      </div>

                      {healthInsuranceType === 'Pré-paga' && (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Razão Social do Convênio</label>
                          <input 
                            type="text" 
                            value={healthInsuranceCompany} 
                            onChange={e => setHealthInsuranceCompany(e.target.value)}
                            placeholder="Ex: Asismed S.A. / Santa Clara" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Empresa Empregadora (Med. do Trabalho)</label>
                        <input 
                          type="text" 
                          value={employer} 
                          onChange={e => setEmployer(e.target.value)}
                          placeholder="Razão Social / CNPJ / RUC" 
                          className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                        />
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 4. RESPONSÁVEL LEGAL TAB */}
                {activeFormTab === 'guardian' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="space-y-3"
                  >
                    {isMinor ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5 mb-2 font-semibold">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          O paciente é menor de idade ({age} anos).
                          <br />
                          O preenchimento do responsável legal/financeiro é **obrigatório** para concluir o cadastro.
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mb-2">
                        Opcional para pacientes maiores de idade (útil em casos de acompanhantes de idosos ou incapazes).
                      </p>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Responsável {isMinor && '*'}</label>
                      <input 
                        type="text" 
                        value={guardianName} 
                        onChange={e => setGuardianName(e.target.value)}
                        placeholder="Nome Completo do Responsável" 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                        required={isMinor}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Cédula / Doc {isMinor && '*'}</label>
                        <input 
                          type="text" 
                          value={guardianDocument} 
                          onChange={e => setGuardianDocument(e.target.value)}
                          placeholder="CI ou outro documento" 
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                          required={isMinor}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Vínculo Familiar {isMinor && '*'}</label>
                        <select 
                          value={guardianRelationship} 
                          onChange={e => setGuardianRelationship(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required={isMinor}
                        >
                          <option value="">Selecione o vínculo...</option>
                          <option value="Pai">Pai</option>
                          <option value="Mãe">Mãe</option>
                          <option value="Tutor Legal">Tutor Legal</option>
                          <option value="Cônjuge">Cônjuge</option>
                          <option value="Filho(a)">Filho(a)</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form Navigation Controls */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 gap-3">
                  {activeFormTab !== 'identification' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'guardian') setActiveFormTab('complementary');
                        else if (activeFormTab === 'complementary') setActiveFormTab('contact_address');
                        else if (activeFormTab === 'contact_address') setActiveFormTab('identification');
                      }}
                      className="py-2 px-3 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                  ) : <div />}

                  {activeFormTab !== 'guardian' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'identification') setActiveFormTab('contact_address');
                        else if (activeFormTab === 'contact_address') setActiveFormTab('complementary');
                        else if (activeFormTab === 'complementary') setActiveFormTab('guardian');
                      }}
                      className="py-2 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition ml-auto"
                    >
                      Próximo <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className={`py-2 px-4 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        isMinor && (!guardianName.trim() || !guardianDocument.trim() || !guardianRelationship.trim())
                          ? 'bg-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                      disabled={isMinor && (!guardianName.trim() || !guardianDocument.trim() || !guardianRelationship.trim())}
                    >
                      <Plus className="w-4 h-4" />
                      Admitir na Triagem
                    </button>
                  )}
                </div>

              </form>
            </div>

            {/* Compliance Footer */}
            <div className="mt-6 pt-3 border-t border-slate-100/70 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>🔐 Dados Criptografados em Trânsito/Repouso (Lei Paraguai nº 1682/2001)</span>
            </div>

          </div>
 
          {/* Fila de Triagem / Recepção Geral */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Contact className="w-5 h-5 text-teal-600 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-base">Fila de Triagem & Admissão</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  Total Geral: {patients.length}
                </span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 animate-pulse">
                  Fila: {activeWaitingList.length} aguardando
                </span>
              </div>
            </div>

            {/* Filtros de busca avançados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input 
                  type="text" 
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Buscar paciente por nome, tel ou Cédula..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-teal-500 font-sans"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                >
                  <option value="todos">Todas Prioridades</option>
                  <option value="normal">Normal</option>
                  <option value="preferencial">Preferencial (60+)</option>
                  <option value="emergência">Emergência</option>
                </select>
              </div>
            </div>

            {/* Lista dos Pacientes Cadastrados */}
            <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Nenhum paciente localizado nesta lista. Adicione novos na aba esquerda!
                </div>
              ) : (
                filteredPatients.map(p => {
                  // Approximate age from birthdate
                  const pAge = p.birthdate ? new Date().getFullYear() - new Date(p.birthdate).getFullYear() : 30;
                  const pIsMinor = pAge < 18;
                  
                  return (
                    <div key={p.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                          {p.photo_url ? (
                            <img src={p.photo_url} className="w-full h-full object-cover" alt="Profile" />
                          ) : (
                            <User className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold text-slate-800 text-sm leading-tight">{p.name}</span>
                            {p.priority === 'emergência' && (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-black uppercase rounded border border-rose-200 animate-pulse">
                                🚨 Emergência
                              </span>
                            )}
                            {p.priority === 'preferencial' && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded border border-amber-200">
                                ⭐ Preferencial
                              </span>
                            )}
                            {p.priority === 'normal' && (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-semibold rounded">
                                Normal
                              </span>
                            )}
                            {pIsMinor && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded border border-indigo-100">
                                Menor
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                            <span>🎂 {p.birthdate} ({pAge} anos)</span>
                            {p.document_number && (
                              <span>🪪 {p.document_type || 'CI'}: {p.document_number}</span>
                            )}
                            <span>📞 {p.phone} {p.whatsapp_verified && '🟢 WA'}</span>
                            {p.blood_type && (
                              <span>🩸 Tipo: <span className="font-bold text-rose-600">{p.blood_type}</span></span>
                            )}
                          </div>

                          {p.address_city && (
                            <div className="text-[10px] text-slate-400">
                              📍 {p.address_street}, {p.address_number} - {p.address_neighborhood}, {p.address_city} ({p.address_department})
                            </div>
                          )}

                          {pIsMinor && p.guardian_name && (
                            <div className="text-[10px] bg-indigo-50/50 text-indigo-900 px-2 py-0.5 rounded border border-indigo-100/30 w-fit">
                              👤 Responsável: <span className="font-semibold">{p.guardian_name} ({p.guardian_relationship})</span> - Doc: {p.guardian_document}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {p.status === 'aguardando' && (
                          <>
                            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                              <Clock className="w-3" /> Aguardando Triagem
                            </span>
                            <button
                              onClick={() => handleUpdatePatientStatus(p.id, 'atendimento')}
                              className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-xs transition cursor-pointer"
                            >
                              Iniciar Atendimento
                            </button>
                          </>
                        )}

                        {p.status === 'atendimento' && (
                          <>
                            <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full flex items-center gap-1 animate-pulse">
                              🩺 Triagem / Médico
                            </span>
                            <button
                              onClick={() => handleUpdatePatientStatus(p.id, 'atendido')}
                              className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-xs transition cursor-pointer"
                            >
                              Liberado
                            </button>
                          </>
                        )}

                        {p.status === 'atendido' && (
                          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full flex items-center gap-1">
                            🟢 Atendimento Concluído
                          </span>
                        )}

                        {p.status === 'agendado' && (
                          <>
                            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
                              📅 Agendado
                            </span>
                            <button
                              onClick={() => handleUpdatePatientStatus(p.id, 'aguardando')}
                              className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-xs transition cursor-pointer"
                            >
                              Dar Entrada
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- FUSÃO DE FICHAS (MERGE MODAL) --- */}
      <AnimatePresence>
        {showMergeModal && duplicatePatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Fusão de Fichas Duplicadas</h3>
                  <p className="text-xs text-slate-500">
                    Selecione quais dados manter para consolidar os cadastros em um perfil único.
                  </p>
                </div>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* 1. Ficha Existente */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-black text-slate-700 uppercase">Ficha 1 (Existente no Banco)</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">ID: {duplicatePatient.id}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nome:</span>
                      <span className="font-bold">{duplicatePatient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Doc ({duplicatePatient.document_type}):</span>
                      <span className="font-bold">{duplicatePatient.document_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Celular:</span>
                      <span className="font-bold">{duplicatePatient.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">E-mail:</span>
                      <span className="font-bold">{duplicatePatient.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Endereço:</span>
                      <span className="font-bold text-right max-w-[200px]">
                        {duplicatePatient.address_street || 'N/A'}, {duplicatePatient.address_number || ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Convênio:</span>
                      <span className="font-bold">{duplicatePatient.health_insurance_type || 'Particular'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Alergias:</span>
                      <span className="font-semibold text-rose-600">{duplicatePatient.allergies || 'Nenhuma'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Nova Ficha / Mesclar Opções */}
                <div className="p-4 bg-teal-50/30 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-teal-200 pb-2">
                    <span className="font-black text-teal-800 uppercase">Valores a Salvar (Mesclado)</span>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded">Selecione para manter</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Select Nome */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">Nome Completo:</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                          <input type="radio" checked={mergeSelections.name === duplicatePatient.name} onChange={() => setMergeSelections(prev => ({...prev, name: duplicatePatient.name}))} />
                          <span>{duplicatePatient.name}</span>
                        </label>
                        {newName !== duplicatePatient.name && (
                          <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                            <input type="radio" checked={mergeSelections.name === newName} onChange={() => setMergeSelections(prev => ({...prev, name: newName}))} />
                            <span className="text-teal-700 font-semibold">{newName}</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Select Telefone */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">Celular:</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                          <input type="radio" checked={mergeSelections.phone === duplicatePatient.phone} onChange={() => setMergeSelections(prev => ({...prev, phone: duplicatePatient.phone}))} />
                          <span>{duplicatePatient.phone}</span>
                        </label>
                        {newPhone !== duplicatePatient.phone && (
                          <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                            <input type="radio" checked={mergeSelections.phone === newPhone} onChange={() => setMergeSelections(prev => ({...prev, phone: newPhone}))} />
                            <span className="text-teal-700 font-semibold">{newPhone}</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Select Endereço */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">Endereço:</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                          <input type="radio" checked={mergeSelections.address_city === duplicatePatient.address_city} onChange={() => setMergeSelections(prev => ({
                            ...prev, 
                            address_department: duplicatePatient.address_department,
                            address_district: duplicatePatient.address_district,
                            address_city: duplicatePatient.address_city,
                            address_neighborhood: duplicatePatient.address_neighborhood,
                            address_street: duplicatePatient.address_street,
                            address_number: duplicatePatient.address_number,
                          }))} />
                          <span>Existente ({duplicatePatient.address_city || 'N/A'})</span>
                        </label>
                        {addressCity && addressCity !== duplicatePatient.address_city && (
                          <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                            <input type="radio" checked={mergeSelections.address_city === addressCity} onChange={() => setMergeSelections(prev => ({
                              ...prev, 
                              address_department: addressDepartment,
                              address_district: addressDistrict,
                              address_city: addressCity,
                              address_neighborhood: addressNeighborhood,
                              address_street: addressStreet,
                              address_number: addressNumber,
                            }))} />
                            <span className="text-teal-700 font-semibold">Novo ({addressCity})</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Select Convênio */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">Convênio / Seguro:</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                          <input type="radio" checked={mergeSelections.health_insurance_type === duplicatePatient.health_insurance_type} onChange={() => setMergeSelections(prev => ({
                            ...prev, 
                            health_insurance_type: duplicatePatient.health_insurance_type,
                            health_insurance_number: duplicatePatient.health_insurance_number,
                            health_insurance_company: duplicatePatient.health_insurance_company,
                          }))} />
                          <span>Existente ({duplicatePatient.health_insurance_type})</span>
                        </label>
                        {healthInsuranceType !== duplicatePatient.health_insurance_type && (
                          <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                            <input type="radio" checked={mergeSelections.health_insurance_type === healthInsuranceType} onChange={() => setMergeSelections(prev => ({
                              ...prev, 
                              health_insurance_type: healthInsuranceType,
                              health_insurance_number: healthInsuranceNumber,
                              health_insurance_company: healthInsuranceCompany,
                            }))} />
                            <span className="text-teal-700 font-semibold">Novo ({healthInsuranceType})</span>
                          </label>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Supervisor Authorization Section */}
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <KeyRound className="w-4 h-4 text-teal-600" />
                  <span>Autorização do Supervisor Requerida</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="password"
                    maxLength={4}
                    value={supervisorPin}
                    onChange={e => {
                      setSupervisorPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="Digite o PIN de Supervisor (Tente: 1234)"
                    className="p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-center font-sans focus:outline-teal-500 max-w-[240px] tracking-widest"
                  />
                  
                  {pinError && (
                    <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {pinError}
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Cancelar Fusão
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMerge}
                  className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Autorizar & Mesclar Fichas
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- AGENDA SUBMODULE --- */}
      {activeSubmodule === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agendar Consulta */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md lg:col-span-1">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <CalendarDays className="w-5 h-5 text-teal-600 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-base">{t('agenda_new', 'app')}</h3>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('select_patient', 'app')} *</label>
                <select 
                  value={selectedPatientId} 
                  onChange={e => {
                    setSelectedPatientId(e.target.value);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                  required
                >
                  <option value="">{t('select_patient_placeholder', 'app')}</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('responsible_doctor', 'app')}</label>
                <select 
                  value={selectedDoctor} 
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedDoctor(val);
                    // Try to auto-fill specialty from professionals list
                    const prof = professionals.find(p => p.name === val);
                    if (prof) {
                      setSelectedSpecialty(prof.specialty);
                    } else if (val === 'Dr. Adriano Lima') {
                      setSelectedSpecialty('Ortopedia');
                    } else if (val === 'Dra. Amanda Silva') {
                      setSelectedSpecialty('Cardiologia');
                    } else {
                      setSelectedSpecialty('Clínico Geral');
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                >
                  {professionals.filter(p => p.role === 'Médico(a)' && p.status === 'ativo').map(prof => (
                    <option key={prof.id} value={prof.name}>{prof.name} ({prof.specialty})</option>
                  ))}
                  {/* Fallback if no professionals loaded */}
                  {professionals.filter(p => p.role === 'Médico(a)' && p.status === 'ativo').length === 0 && (
                    <>
                      <option value="Dra. Amanda Silva">Dra. Amanda Silva (Cardiologista)</option>
                      <option value="Dr. Adriano Lima">Dr. Adriano Lima (Ortopedista)</option>
                      <option value="Dr. Bruno Castro">Dr. Bruno Castro (Médico do Trabalho)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('clinical_specialty', 'app')}</label>
                <input 
                  type="text" 
                  value={selectedSpecialty} 
                  readOnly 
                  className="w-full p-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-sans font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('date', 'app')}</label>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('time', 'app')}</label>
                  <input 
                    type="time" 
                    value={selectedTime} 
                    onChange={e => setSelectedTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                {t('create_appointment', 'app')}
              </button>
            </form>
          </div>

          {/* Agenda de Atendimentos */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-600 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-base">{t('agenda_medical', 'app')}</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                {t('appointments_today', 'app')}: {appointments.length}
              </span>
            </div>

            {/* List */}
            <div className="space-y-3">
              {appointments.map(app => (
                <div key={app.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition text-sm">
                  <div className="flex items-start gap-3">
                    <span className="p-2.5 bg-teal-50 text-teal-600 rounded-lg font-bold text-center block min-w-[55px] border border-teal-100">
                      <p className="text-xs uppercase font-semibold">Hora</p>
                      <p className="text-sm font-black">{app.time}</p>
                    </span>

                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 text-base">{app.patientName}</div>
                      <div className="text-xs text-slate-500">
                        🩺 Médicos: <span className="font-semibold text-slate-700">{app.doctorName} ({app.specialty})</span> | 📅 {app.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {app.status === 'confirmado' && (
                      <>
                        <span className="text-xs font-bold px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1">
                          🟢 {t('status_confirmed', 'app')}
                        </span>
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, 'atendido')}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                        >
                          {t('btn_complete_visit', 'app')}
                        </button>
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, 'cancelado')}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                        >
                          {t('btn_cancel', 'app')}
                        </button>
                      </>
                    )}

                    {app.status === 'pendente' && (
                      <>
                        <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                          🟡 {t('status_pending', 'app')}
                        </span>
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, 'confirmado')}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                        >
                          {t('btn_confirm', 'app')}
                        </button>
                      </>
                    )}

                    {app.status === 'cancelado' && (
                      <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                        🔴 {t('status_cancelled', 'app')}
                      </span>
                    )}

                    {app.status === 'atendido' && (
                      <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
                        🔵 {t('status_done', 'app')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

