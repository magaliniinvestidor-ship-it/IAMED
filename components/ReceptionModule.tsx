'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Patient, Appointment, Professional } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import PhoneInput from '@/components/PhoneInput';
import { 
  Plus, Contact, CalendarDays, Check, Search, 
  Clock, AlertTriangle, UserPlus, Filter, Camera, 
  Upload, ShieldCheck, Mail, MapPin, Phone, User, 
  AlertCircle, ChevronRight, ChevronLeft, Languages, 
  HeartPulse, Shield, KeyRound, Sparkles,
  Sliders, Smartphone, Trash2, FileText, Scan, CheckCircle2, XCircle, X,
  Lock, AlertTriangle as AlertTriangleIcon, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AgendaModule from '@/components/AgendaModule';
import { PermissionGate, WithPermissions } from '@/components/ui/PermissionGate';

interface ReceptionModuleProps {
  patients: Patient[];
  appointments: Appointment[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  activeSubmodule: number; // 1 = Recepção, 2 = Agenda
  addAuditLog: (action: string, target: string) => void;
  professionals?: Professional[];
  activeRole?: string;
  activeOperator?: string;
  userPermissions?: string[];
}

export default function ReceptionModule({
  patients,
  appointments,
  setPatients,
  setAppointments,
  activeSubmodule,
  addAuditLog,
  professionals = [],
  activeRole = 'Recepcionista',
  activeOperator = 'Operador',
  userPermissions = [],
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
  const [bloodType, setBloodType] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Não Informado'>('Não Informado');
  const [allergies, setAllergies] = useState('');
  const [healthInsuranceType, setHealthInsuranceType] = useState<'IPS' | 'Sanidade Militar' | 'Sanidade Policial' | 'Pré-paga' | 'Seguro Privado' | 'Particular'>('Particular');
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState('');
  const [healthInsuranceCompany, setHealthInsuranceCompany] = useState('');
  const [employer, setEmployer] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianDocumentType, setGuardianDocumentType] = useState<'CI' | 'Passaporte' | 'RG' | 'Outro'>('CI');
  const [guardianDocument, setGuardianDocument] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'es' | 'gn' | 'pt' | 'en' | 'outros'>('es');
  const [photoUrl, setPhotoUrl] = useState('');

  // --- Photo states (webcam) ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [webcamPlaceholder, setWebcamPlaceholder] = useState<string | null>(null);
  const videoSimRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoCounterRef = useRef(0);
  const pendingCaptureRef = useRef<'real' | 'simulation' | null>(null);
  const simulationFileRef = useRef('');

  // --- Validation & Alerts (derived state) ---
  const calculatedDV = useMemo(() => {
    if (documentType !== 'CI' || !documentNumber) return null;
    const cleanDoc = documentNumber.replace(/\D/g, '');
    if (cleanDoc.length === 0) return null;
    let sum = 0;
    let factor = 2;
    for (let i = cleanDoc.length - 1; i >= 0; i--) {
      sum += parseInt(cleanDoc.charAt(i)) * factor;
      factor++;
      if (factor > 11) factor = 2;
    }
    const remainder = sum % 11;
    return remainder > 1 ? 11 - remainder : 0;
  }, [documentNumber, documentType]);

  const calculatedGuardianDV = useMemo(() => {
    if (guardianDocumentType !== 'CI' || !guardianDocument) return null;
    const cleanDoc = guardianDocument.replace(/\D/g, '');
    if (cleanDoc.length === 0) return null;
    let sum = 0;
    let factor = 2;
    for (let i = cleanDoc.length - 1; i >= 0; i--) {
      sum += parseInt(cleanDoc.charAt(i)) * factor;
      factor++;
      if (factor > 11) factor = 2;
    }
    const remainder = sum % 11;
    return remainder > 1 ? 11 - remainder : 0;
  }, [guardianDocument, guardianDocumentType]);

  const isPhoneValid = useMemo(() => {
    if (!newPhone) return false;
    try {
      const parsed = parsePhoneNumber(newPhone);
      return parsed ? parsed.isValid() : false;
    } catch {
      return false;
    }
  }, [newPhone]);

  const isEmailValid = useMemo(() => {
    if (!newEmail) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);
  }, [newEmail]);

  const { age, isMinor } = useMemo(() => {
    if (!newBirthdate) return { age: 0, isMinor: false };
    const today = new Date();
    const birthDate = new Date(newBirthdate);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return { age: calculatedAge, isMinor: calculatedAge < 18 };
  }, [newBirthdate]);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [pinError, setPinError] = useState('');

  // --- Merge Selection State ---
  const [mergeSelections, setMergeSelections] = useState<Partial<Patient>>({});

  const duplicatePatient = useMemo(() => {
    if (!documentNumber || !newBirthdate) return null;
    return patients.find(
      p => p.document_number === documentNumber && p.birthdate === newBirthdate && p.id !== selectedPatientId
    ) || null;
  }, [documentNumber, newBirthdate, patients, selectedPatientId]);

  // Appointments schedule forms state
  const [selectedDoctor, setSelectedDoctor] = useState('Dra. Amanda Silva');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Cardiologia');
  const [selectedDate, setSelectedDate] = useState('2026-06-22');
  const [selectedTime, setSelectedTime] = useState('14:00');
  
  const [selectedBranch, setSelectedBranch] = useState('Sede Central');
  const [selectedRoom, setSelectedRoom] = useState('Consultório 101');
  const [selectedResource, setSelectedResource] = useState('Nenhum');
  const [selectedConsultationType, setSelectedConsultationType] = useState('consulta de primeira vez');
  const [selectedModality, setSelectedModality] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [selectedInsurance, setSelectedInsurance] = useState('Particular');

  // Configurable rules parameters
  const [minMinutesBetween, setMinMinutesBetween] = useState<number>(30);
  const [telemedQuota, setTelemedQuota] = useState<number>(3);
  const [totalQuota, setTotalQuota] = useState<number>(10);
  const [enableOverlapBlocking, setEnableOverlapBlocking] = useState<boolean>(true);

  // Encaixe / Overbooking workflow states
  const [showOverturnModal, setShowOverturnModal] = useState(false);
  const [overturnReason, setOverturnReason] = useState('');
  const [overturnPin, setOverturnPin] = useState('');
  const [overturnPinError, setOverturnPinError] = useState('');
  const [pendingAppointmentData, setPendingAppointmentData] = useState<any>(null);

  // Online Reservation patient portal simulation
  const [onlinePatientId, setOnlinePatientId] = useState('');
  const [onlineSpecialty, setOnlineSpecialty] = useState('Cardiologia');
  const [onlineDoctor, setOnlineDoctor] = useState('Dra. Amanda Silva');
  const [onlineModality, setOnlineModality] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [onlineDate, setOnlineDate] = useState('2026-06-22');
  const [onlineTime, setOnlineTime] = useState('15:00');
  const [onlineType, setOnlineType] = useState('consulta de primeira vez');
  const [onlineSuccessMessage, setOnlineSuccessMessage] = useState('');
  const [onlineErrorMessage, setOnlineErrorMessage] = useState('');

  // Triage & Vital Signs Modal states
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [triagePatient, setTriagePatient] = useState<Patient | null>(null);
  const [triageReason, setTriageReason] = useState('');
  const [triageWeight, setTriageWeight] = useState('');
  const [triageHeight, setTriageHeight] = useState('');
  const [triageBP, setTriageBP] = useState('');
  const [triageTemp, setTriageTemp] = useState('');
  const [triageSpo2, setTriageSpo2] = useState('');
  const [triageHR, setTriageHR] = useState('');
  const [triageRR, setTriageRR] = useState('');
  const [triagePriorityLevel, setTriagePriorityLevel] = useState<'blue' | 'green' | 'yellow' | 'orange' | 'red'>('green');
  const [triageProcedures, setTriageProcedures] = useState<string[]>([]);
  const [triageNursingNotes, setTriageNursingNotes] = useState('');
  
  // Document attachments in Triage
  const [attachedFiles, setAttachedFiles] = useState<{name: string, size: string, type: string, url: string}[]>([]);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState<number>(10);
  const [isVirusScanning, setIsVirusScanning] = useState(false);
  const [virusScanStatus, setVirusScanStatus] = useState<'pending' | 'scanning' | 'passed' | 'failed'>('pending');
  const [fileToUploadName, setFileToUploadName] = useState('');
  const [fileToUploadSize, setFileToUploadSize] = useState('');
  const [fileToUploadType, setFileToUploadType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived modality based on consultation type
  const effectiveModality = useMemo(() =>
    selectedConsultationType === 'telemedicina' ? 'Virtual' as const : selectedModality,
    [selectedConsultationType, selectedModality]
  );

  const effectiveOnlineModality = useMemo(() =>
    onlineType === 'telemedicina' ? 'Virtual' as const : onlineModality,
    [onlineType, onlineModality]
  );

  // Derived insurance based on selected patient
  const effectiveInsurance = useMemo(() => {
    if (selectedPatientId) {
      const patient = patients.find(p => p.id === selectedPatientId);
      if (patient?.health_insurance_type) return patient.health_insurance_type;
    }
    return selectedInsurance;
  }, [selectedPatientId, patients, selectedInsurance]);


  // --- Handlers & Helpers ---

  const handleSimulateWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 320, height: 240 } 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraCountdown(3);
      
      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
      
      const interval = setInterval(() => {
        setCameraCountdown(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(interval);
            pendingCaptureRef.current = 'real';
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Camera access denied:', err);
      // Fallback to simulation
      handleSimulateWebcamFallback();
    }
  };

  const handleSimulateWebcamFallback = () => {
    setIsCameraActive(true);
    setCameraCountdown(3);
    simulationFileRef.current = `patient_${++photoCounterRef.current}.svg`;
    
    const interval = setInterval(() => {
      setCameraCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          pendingCaptureRef.current = 'simulation';
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const uploadPhotoToStorage = async (dataUrl: string, fileName: string): Promise<string | null> => {
    if (!supabase) return null;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const { data, error } = await supabase.storage
        .from('patient-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) {
        console.warn('Upload failed:', error.message);
        return null;
      }
      const { data: urlData } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (err) {
      console.warn('Upload error:', err);
      return null;
    }
  };

  const capturePhoto = async () => {
    const fileName = selectedPatientId ? `patient_${selectedPatientId}.jpg` : `patient_${++photoCounterRef.current}.jpg`;
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setWebcamPlaceholder(photoData);
        addAuditLog('Capturou foto do Paciente via Câmera', newName || 'Pendente');
        const uploadedUrl = await uploadPhotoToStorage(photoData, fileName);
        if (uploadedUrl) setPhotoUrl(uploadedUrl);
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraCountdown(null);
  };

  // Trigger capture when countdown finishes (outside setState updater)
  useEffect(() => {
    if (cameraCountdown !== null) return;
    if (pendingCaptureRef.current === 'real') {
      pendingCaptureRef.current = null;
      capturePhoto();
    } else if (pendingCaptureRef.current === 'simulation') {
      pendingCaptureRef.current = null;
      const initials = newName ? newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';
      const randomHue = Math.floor(Math.random() * 360);
      const svgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="hsl(${randomHue}, 45%, 90%)"/><circle cx="100" cy="80" r="40" fill="hsl(${randomHue}, 45%, 45%)"/><path d="M40 160 C 40 120, 160 120, 160 160" fill="hsl(${randomHue}, 45%, 45%)"/><text x="100" y="180" font-family="sans-serif" font-size="14" font-weight="bold" fill="hsl(${randomHue}, 45%, 25%)" text-anchor="middle">Foto Capturada (${initials})</text></svg>`;
      setWebcamPlaceholder(svgData);
      setIsCameraActive(false);
      addAuditLog('Capturou foto do Paciente via Webcam (Simulação)', newName || 'Pendente');
      uploadPhotoToStorage(svgData, simulationFileRef.current).then(url => {
        if (url) setPhotoUrl(url);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraCountdown]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
    const fileName = selectedPatientId ? `patient_${selectedPatientId}.jpg` : `patient_${++photoCounterRef.current}.jpg`;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setWebcamPlaceholder(result);
        addAuditLog('Carregou foto do Paciente', newName || 'Pendente');
        const uploadedUrl = await uploadPhotoToStorage(result, fileName);
        if (uploadedUrl) setPhotoUrl(uploadedUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Patient Submit
  const handleAddPatient = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();

    const isEditing = !!selectedPatientId;

    // Identifytab Identification fields
    if (!newName.trim()) {
      alert("Campo obrigatório não preenchido: Nome Completo");
      setActiveFormTab('identification');
      return;
    }
    if (!documentNumber.trim()) {
      alert("Campo obrigatório não preenchido: Número do Documento");
      setActiveFormTab('identification');
      return;
    }
    if (!newBirthdate) {
      alert("Campo obrigatório não preenchido: Data de Nascimento");
      setActiveFormTab('identification');
      return;
    }
    if (!isEditing && !placeOfBirth.trim()) {
      alert("Campo obrigatório não preenchido: Local de Nascimento");
      setActiveFormTab('identification');
      return;
    }
    if (!isEditing && !nationality.trim()) {
      alert("Campo obrigatório não preenchido: Nacionalidade");
      setActiveFormTab('identification');
      return;
    }

    // Contact/Address tab fields
    if (!newPhone.trim()) {
      alert("Campo obrigatório não preenchido: Celular");
      setActiveFormTab('contact_address');
      return;
    }
    if (!isPhoneValid) {
      alert("Formato de telefone inválido. Use o formato internacional (+595 981 123 456).");
      setActiveFormTab('contact_address');
      return;
    }
    if (!newEmail.trim()) {
      alert("Campo obrigatório não preenchido: E-mail");
      setActiveFormTab('contact_address');
      return;
    }
    if (!addressDepartment.trim()) {
      alert("Campo obrigatório não preenchido: Departamento");
      setActiveFormTab('contact_address');
      return;
    }
    if (!addressCity.trim()) {
      alert("Campo obrigatório não preenchido: Cidade");
      setActiveFormTab('contact_address');
      return;
    }

    // Complementary tab fields (only required for new patients)
    if (!isEditing && !allergies.trim()) {
      alert("Campo obrigatório não preenchido: Alergias / Antecedentes Clínicos");
      setActiveFormTab('complementary');
      return;
    }
    if (healthInsuranceType !== 'Particular' && !healthInsuranceNumber.trim()) {
      alert("Campo obrigatório não preenchido: Nº de Afiliação / Segurado");
      setActiveFormTab('complementary');
      return;
    }
    if (!isEditing && !employer.trim()) {
      alert("Campo obrigatório não preenchido: Empresa Empregadora");
      setActiveFormTab('complementary');
      return;
    }

    // Guardian fields are required only for minors
    if (isMinor) {
      if (!guardianName.trim()) {
        alert("Campo obrigatório não preenchido: Nome do Responsável");
        setActiveFormTab('guardian');
        return;
      }
      if (!guardianDocument.trim()) {
        alert("Campo obrigatório não preenchido: Nº Cédula / Doc do Responsável");
        setActiveFormTab('guardian');
        return;
      }
      if (!guardianRelationship.trim()) {
        alert("Campo obrigatório não preenchido: Vínculo Familiar");
        setActiveFormTab('guardian');
        return;
      }
    }

    // eslint-disable-next-line react-hooks/purity
    const patientId = isEditing ? selectedPatientId : `pat_${Date.now()}`;

    // Se tem preview mas photoUrl ainda vazio (upload assíncrono pendente), faz upload agora
    let finalPhotoUrl = photoUrl;
    if (!finalPhotoUrl && webcamPlaceholder && webcamPlaceholder.startsWith('data:')) {
      const uploadFileName = `patient_${patientId}.jpg`;
      const uploadedUrl = await uploadPhotoToStorage(webcamPlaceholder, uploadFileName);
      if (uploadedUrl) finalPhotoUrl = uploadedUrl;
    }

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
      guardian_document_type: isMinor ? guardianDocumentType : undefined,
      guardian_document: isMinor ? guardianDocument : undefined,
      guardian_relationship: isMinor ? guardianRelationship : undefined,
      photo_url: finalPhotoUrl,
      preferred_language: preferredLanguage
    };

    // Optimistic UI update
    if (isEditing) {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...newPatient } : p));
      addAuditLog('Editou Paciente', newPatient.name);
    } else {
      setPatients(prev => [newPatient, ...prev]);
      addAuditLog('Admitiu Paciente', newPatient.name);
    }

    // Save to Supabase (dynamic fields included)
    if (!supabase) return;
    const patientData = {
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
      guardian_document_type: newPatient.guardian_document_type,
      guardian_document: newPatient.guardian_document,
      guardian_relationship: newPatient.guardian_relationship,
      photo_url: newPatient.photo_url,
      preferred_language: newPatient.preferred_language
    };

    if (isEditing) {
      const { error: updateError } = await supabase.from('patients').update(patientData).eq('id', patientId);
      if (updateError) {
        console.error("[SUPABASE] UPDATE patients FAILED:", updateError.code, updateError.message, updateError.details);
        alert("Erro ao atualizar paciente no servidor: " + updateError.message);
        return;
      }
    } else {
      const { data: insertedData, error: insertError } = await supabase.from('patients').insert({ id: newPatient.id, ...patientData }).select();
      if (insertError) {
        console.error("[SUPABASE] INSERT patients FAILED:", insertError.code, insertError.message, insertError.details);
        setPatients(prev => prev.filter(p => p.id !== newPatient.id));
        alert("Erro ao salvar paciente no servidor: " + insertError.message);
        return;
      }
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
    setGuardianDocumentType('CI');
    setGuardianDocument('');
    setGuardianRelationship('');
    setWebcamPlaceholder(null);
    setPhotoUrl('');
    setSelectedPatientId('');
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
      guardian_document_type: mergeSelections.guardian_document_type || duplicatePatient.guardian_document_type,
      guardian_document: mergeSelections.guardian_document || duplicatePatient.guardian_document,
      guardian_relationship: mergeSelections.guardian_relationship || duplicatePatient.guardian_relationship,
      photo_url: mergeSelections.photo_url || photoUrl || duplicatePatient.photo_url,
      preferred_language: mergeSelections.preferred_language || duplicatePatient.preferred_language,
    };

    // Update frontend state
    setPatients(prev => prev.map(p => p.id === duplicatePatient.id ? mergedPatient : p));
    addAuditLog('Mesclou e Fusio Fichas de Paciente', duplicatePatient.name);

    // Save to Supabase
    if (!supabase) return;
    const { error: mergeError } = await supabase.from('patients').update({
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
      guardian_document_type: mergedPatient.guardian_document_type,
      guardian_document: mergedPatient.guardian_document,
      guardian_relationship: mergedPatient.guardian_relationship,
      photo_url: mergedPatient.photo_url,
      preferred_language: mergedPatient.preferred_language
    }).eq('id', duplicatePatient.id);
    
    if (mergeError) {
      console.error("[SUPABASE] UPDATE patients merge FAILED:", mergeError.message);
    }

    // Reset Form and close modal
    resetForm();
    setShowMergeModal(false);
  };

  // Helper function to validate appointment rules
  const validateAppointment = (appData: {
    doctorName: string;
    date: string;
    time: string;
    modality: 'Presencial' | 'Virtual';
    type: string;
    insurance: string;
  }) => {
    const conflicts: string[] = [];

    // Parse minutes from midnight for the new time
    const [h, m] = appData.time.split(':').map(Number);
    const newMinutes = h * 60 + m;

    // Filter appointments of the same doctor on the same date
    const doctorApps = appointments.filter(
      a => a.doctorName === appData.doctorName && a.date === appData.date && a.status !== 'cancelado'
    );

    // 1. Check strict overlap
    const exactOverlap = doctorApps.find(a => a.time === appData.time);
    if (exactOverlap && enableOverlapBlocking) {
      conflicts.push(`Conflito: Já existe consulta agendada exatamente às ${appData.time} para o(a) ${appData.doctorName}.`);
    }

    // 2. Check minimum time between appointments
    doctorApps.forEach(a => {
      const [ah, am] = a.time.split(':').map(Number);
      const appMinutes = ah * 60 + am;
      const diff = Math.abs(newMinutes - appMinutes);
      if (diff < minMinutesBetween) {
        conflicts.push(
          `Intervalo Insuficiente: Consulta das ${appData.time} viola o tempo mínimo configurado de ${minMinutesBetween} minutos em relação ao agendamento das ${a.time} (diferença de ${diff}m).`
        );
      }
    });

    // 3. Check modality quotas
    if (appData.modality === 'Virtual') {
      const virtualCount = doctorApps.filter(a => a.modality === 'Virtual').length;
      if (virtualCount >= telemedQuota) {
        conflicts.push(`Cota de Telemedicina Excedida: Limite diário de ${telemedQuota} consultas virtuais atingido para o(a) ${appData.doctorName}.`);
      }
    }

    const totalCount = doctorApps.length;
    if (totalCount >= totalQuota) {
      conflicts.push(`Cota Total Excedida: Limite de ${totalQuota} atendimentos diários atingido para o(a) ${appData.doctorName}.`);
    }

    // 4. Insurance rules (agenda diferenciada)
    // IPS Rule: IPS only allows consultations Mon-Fri, 07:00-12:00
    if (appData.insurance === 'IPS') {
      const dayOfWeek = new Date(appData.date).getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        conflicts.push("Restrição de Convênio: O convênio IPS não permite agendamentos aos finais de semana.");
      }
      if (h < 7 || h >= 12) {
        conflicts.push("Restrição de Horário: A agenda preferencial para o convênio IPS limita-se ao turno da manhã (07:00 às 12:00).");
      }
      if (appData.type === 'procedimento' || appData.type === 'exame diagnóstico') {
        conflicts.push(`Restrição de Procedimento: O convênio IPS exige autorização prévia por escrito para a modalidade "${appData.type}".`);
      }
    }

    return conflicts.length > 0 ? conflicts : null;
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const appData = {
      id: `app_${Date.now()}`,
      patientId: selectedPatientId,
      patientName: patient.name,
      doctorName: selectedDoctor,
      specialty: selectedSpecialty,
      date: selectedDate,
      time: selectedTime,
      status: 'confirmado' as const,
      branch: selectedBranch,
      room: selectedRoom,
      resource: selectedResource,
      type: selectedConsultationType,
      modality: effectiveModality,
      insurance: effectiveInsurance,
    };

    const conflicts = validateAppointment(appData);

    if (conflicts) {
      // If there are conflicts, open the Encaixe (Overbooking) dialog
      setPendingAppointmentData(appData);
      setOverturnReason('');
      setOverturnPin('');
      setOverturnPinError('');
      setShowOverturnModal(true);
      return;
    }

    // Direct booking (no conflicts)
    await saveAppointmentToStateAndDb(appData);
  };

  const saveAppointmentToStateAndDb = async (newApp: Appointment) => {
    // Add to UI State
    setAppointments(prev => [...prev, newApp]);
    addAuditLog(
      newApp.is_overturn ? 'Encaixe de Consulta Autorizado' : 'Agendou Consulta',
      `${newApp.patientName} com ${newApp.doctorName} às ${newApp.time} (${newApp.branch})`
    );

    // Persist to Supabase
    if (supabase) {
      const { error: appInsertError } = await supabase.from('appointments').insert({
        id: newApp.id,
        patient_id: newApp.patientId,
        patient_name: newApp.patientName,
        doctor_name: newApp.doctorName,
        specialty: newApp.specialty,
        date: newApp.date,
        time: newApp.time,
        status: newApp.status,
        branch: newApp.branch,
        room: newApp.room,
        resource: newApp.resource,
        type: newApp.type,
        modality: newApp.modality,
        is_overturn: newApp.is_overturn || false,
        overturn_reason: newApp.overturn_reason || null,
        insurance: newApp.insurance
      });
      if (appInsertError) {
        console.error("[SUPABASE] INSERT appointments FAILED:", appInsertError.message);
      }
    }

    // Reset patient select
    setSelectedPatientId('');
  };

  // Handler for authorizing Encaixe (Overbooking)
  const handleConfirmOverturn = async () => {
    if (overturnPin !== '1234') {
      setOverturnPinError('PIN de Autorização Inválido!');
      return;
    }

    if (!overturnReason.trim()) {
      setOverturnPinError('Descreva o motivo do encaixe!');
      return;
    }

    if (!pendingAppointmentData) return;

    const authorizedApp: Appointment = {
      ...pendingAppointmentData,
      is_overturn: true,
      overturn_reason: overturnReason,
    };

    await saveAppointmentToStateAndDb(authorizedApp);

    // Close Modal
    setShowOverturnModal(false);
    setPendingAppointmentData(null);
    setOverturnReason('');
    setOverturnPin('');
  };

  // Handler for Patient Online Booking Simulation
  const handleOnlineBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnlineSuccessMessage('');
    setOnlineErrorMessage('');

    if (!onlinePatientId) {
      setOnlineErrorMessage('Selecione um paciente para simular a reserva online.');
      return;
    }

    const patient = patients.find(p => p.id === onlinePatientId);
    if (!patient) return;

    const appData = {
      id: `app_online_${Date.now()}`,
      patientId: onlinePatientId,
      patientName: patient.name,
      doctorName: onlineDoctor,
      specialty: onlineSpecialty,
      date: onlineDate,
      time: onlineTime,
      status: 'confirmado' as const,
      branch: 'Sede Central', // Online bookings default to main branch
      room: 'Consultório Virtual / Telemedicina',
      resource: 'Nenhum',
      type: onlineType,
      modality: effectiveOnlineModality,
      insurance: patient.health_insurance_type || 'Particular',
    };

    // Check availability (patients have no bypass/overbooking options!)
    const conflicts = validateAppointment(appData);

    if (conflicts) {
      setOnlineErrorMessage(
        `Reserva Recusada por Indisponibilidade: ${conflicts.join(' | ')}`
      );
      addAuditLog('Reserva Online Recusada (Indisponível)', `${patient.name} - ${onlineDoctor} às ${onlineTime}`);
      return;
    }

    // Direct booking (success)
    await saveAppointmentToStateAndDb({
      ...appData,
      status: 'confirmado',
    });

    setOnlineSuccessMessage('Reserva realizada com sucesso via Portal do Paciente!');
    setOnlinePatientId('');
  };

  const handleDeletePatient = async (id: string, patientName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o paciente "${patientName}"? Esta ação não pode ser desfeita.`)) return;
    setPatients(prev => prev.filter(p => p.id !== id));
    addAuditLog('Exclusão Paciente', patientName);
    if (supabase) {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) {
        console.error("[SUPABASE] DELETE patients FAILED:", error.message);
      }
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setNewName(patient.name);
    setNewBirthdate(patient.birthdate || '');
    setNewPhone(patient.phone || '');
    setNewGender(patient.gender || 'Masculino');
    setNewPriority(patient.priority || 'normal');
    setDocumentType((patient.document_type as 'CI' | 'Passaporte' | 'RG' | 'Outro') || 'CI');
    setDocumentNumber(patient.document_number || '');
    setPlaceOfBirth(patient.place_of_birth || '');
    setCivilStatus((patient.civil_status as any) || 'Solteiro(a)');
    setNationality(patient.nationality || 'Paraguaia');
    setAddressDepartment(patient.address_department || '');
    setAddressDistrict(patient.address_district || '');
    setAddressCity(patient.address_city || '');
    setAddressNeighborhood(patient.address_neighborhood || '');
    setAddressStreet(patient.address_street || '');
    setAddressNumber(patient.address_number || '');
    setNewEmail(patient.email || '');
    setWhatsappVerified(patient.whatsapp_verified || false);
    setAllergies(patient.allergies || '');
    setHealthInsuranceType((patient.health_insurance_type as any) || 'Particular');
    setHealthInsuranceNumber(patient.health_insurance_number || '');
    setEmployer(patient.employer || '');
    setBloodType(patient.blood_type || 'Não Informado');
    setHealthInsuranceCompany(patient.health_insurance_company || '');
    setGuardianName(patient.guardian_name || '');
    setGuardianDocumentType((patient.guardian_document_type as 'CI' | 'Passaporte' | 'RG' | 'Outro') || 'CI');
    setGuardianDocument(patient.guardian_document || '');
    setGuardianRelationship(patient.guardian_relationship || '');
    setPhotoUrl(patient.photo_url || '');
    setWebcamPlaceholder(patient.photo_url || null);
    setPreferredLanguage((patient.preferred_language as any) || 'es');
    setSelectedPatientId(patient.id);
    setActiveFormTab('identification');
  };

  const handleUpdatePatientStatus = async (id: string, status: Patient['status']) => {
    setPatients(prev => prev.map(p => {
      if (p.id === id) {
        addAuditLog(`Status Paciente (${status})`, p.name);
        return { ...p, status };
      }
      return p;
    }));
    if (supabase) {
      const { error: statusError } = await supabase.from('patients').update({ status }).eq('id', id);
      if (statusError) {
        console.error("[SUPABASE] UPDATE patients status FAILED:", statusError.message);
      }
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
    if (supabase) {
      const { error: appStatusError } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (appStatusError) {
        console.error("[SUPABASE] UPDATE appointments status FAILED:", appStatusError.message);
      }
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
      <PermissionGate view="reception" userPermissions={userPermissions}>
        {activeSubmodule === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Admissão Form (Expanded & Organized) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600 animate-pulse" />
                  <h3 className="font-bold text-slate-800 text-base">{t('checkin_admission', 'app')}</h3>
                </div>
              </div>

              {/* Sub-Tabs of Form */}
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold mb-4 gap-1 overflow-x-auto">
                <button
                  type="button"
                  data-testid="reception-tab-identification"
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
                  data-testid="reception-tab-contact"
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
                  data-testid="reception-tab-complementary"
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
                  data-testid="reception-tab-guardian"
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

              <form noValidate onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} className="space-y-4 text-sm">
                
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
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Documento *</label>
                        <select 
                          value={documentType} 
                          onChange={e => setDocumentType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                          required
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
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Local Nascimento *</label>
                        <input 
                          type="text" 
                          value={placeOfBirth} 
                          onChange={e => setPlaceOfBirth(e.target.value)}
                          placeholder="Cidade/País de origem" 
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Sexo/Gênero *</label>
                        <select 
                          value={newGender} 
                          onChange={e => setNewGender(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
                        >
                          <option value="Masculino">Masc.</option>
                          <option value="Feminino">Fem.</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nacionalidade *</label>
                        <input 
                          type="text" 
                          value={nationality} 
                          onChange={e => setNationality(e.target.value)}
                          placeholder="Nacionalidade" 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Civil *</label>
                        <select 
                          value={civilStatus} 
                          onChange={e => setCivilStatus(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
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
                          {isCameraActive ? (
                            <video 
                              ref={videoRef} 
                              className="w-full h-full object-cover" 
                              autoPlay 
                              playsInline 
                              muted
                            />
                          ) : webcamPlaceholder ? (
                            <img src={webcamPlaceholder} className="w-full h-full object-cover" alt="Patient Capture" />
                          ) : (
                            <User className="w-8 h-8 text-slate-300" />
                          )}
                          {isCameraActive && cameraCountdown !== null && (
                            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs font-bold font-sans">
                              {cameraCountdown}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <button
                            type="button"
                            onClick={isCameraActive ? stopCamera : handleSimulateWebcam}
                            className={`w-full py-1.5 px-3 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition ${
                              isCameraActive 
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' 
                                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                            }`}
                          >
                            {isCameraActive ? (
                              <>
                                <X className="w-3.5 h-3.5" />
                                Cancelar
                              </>
                            ) : (
                              <>
                                <Camera className="w-3.5 h-3.5" />
                                Capturar via Câmera
                              </>
                            )}
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
                      <canvas ref={canvasRef} className="hidden" />
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
                      <PhoneInput
                        value={newPhone}
                        onChange={setNewPhone}
                        label="Celular"
                        required
                      />
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
                        E-mail *
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
                        required
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs pb-1 border-b border-slate-200">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span>Endereço Completo</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Departamento *</label>
                          <input 
                            type="text" 
                            value={addressDepartment} 
                            onChange={e => setAddressDepartment(e.target.value)}
                            placeholder="Ex: Itapúa" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Distrito *</label>
                          <input 
                            type="text" 
                            value={addressDistrict} 
                            onChange={e => setAddressDistrict(e.target.value)}
                            placeholder="Ex: Encarnación" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cidade *</label>
                          <input 
                            type="text" 
                            value={addressCity} 
                            onChange={e => setAddressCity(e.target.value)}
                            placeholder="Ex: Encarnación" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Bairro *</label>
                          <input 
                            type="text" 
                            value={addressNeighborhood} 
                            onChange={e => setAddressNeighborhood(e.target.value)}
                            placeholder="Ex: Loma Clavel" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Rua *</label>
                          <input 
                            type="text" 
                            value={addressStreet} 
                            onChange={e => setAddressStreet(e.target.value)}
                            placeholder="Ex: Calle Constitución" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Número *</label>
                          <input 
                            type="text" 
                            value={addressNumber} 
                            onChange={e => setAddressNumber(e.target.value)}
                            placeholder="Ex: 482" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
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
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Sanguíneo *</label>
                        <select 
                          value={bloodType} 
                          onChange={e => setBloodType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                          required
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="Não Informado">Não Informado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Idioma Pref. *</label>
                        <select 
                          value={preferredLanguage} 
                          onChange={e => setPreferredLanguage(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Alergias / Antecedentes Clínicos *</label>
                      <textarea 
                        value={allergies} 
                        onChange={e => setAllergies(e.target.value)}
                        placeholder="Ex: Alergia a Penicilina, Diabético..." 
                        rows={2}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                        required
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs pb-1 border-b border-slate-200">
                        <HeartPulse className="w-4 h-4 text-teal-600" />
                        <span>Cobertura de Saúde / Convênio</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Seguro / Convênio *</label>
                          <select 
                            value={healthInsuranceType} 
                            onChange={e => setHealthInsuranceType(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
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
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Nº de Afiliação / Segurado *</label>
                          <input 
                            type="text" 
                            value={healthInsuranceNumber} 
                            onChange={e => setHealthInsuranceNumber(e.target.value)}
                            placeholder="Nº da carteirinha" 
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            disabled={healthInsuranceType === 'Particular'}
                            required={healthInsuranceType !== 'Particular'}
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
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Empresa Empregadora (Med. do Trabalho) *</label>
                        <input 
                          type="text" 
                          value={employer} 
                          onChange={e => setEmployer(e.target.value)}
                          placeholder="Razão Social / CNPJ / RUC" 
                          className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          required
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
                          O preenchimento do responsável legal/financeiro é <span className="font-black">obrigatório</span> para concluir o cadastro.
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
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Documento {isMinor && '*'}</label>
                        <select 
                          value={guardianDocumentType} 
                          onChange={e => setGuardianDocumentType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required={isMinor}
                        >
                          <option value="CI">Cédula CI (Paraguai)</option>
                          <option value="Passaporte">Passaporte</option>
                          <option value="RG">RG (Brasil)</option>
                          <option value="Outro">DNI / Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Cédula / Doc {isMinor && '*'}</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={guardianDocument} 
                            onChange={e => setGuardianDocument(e.target.value)}
                            placeholder="Número do documento" 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                            required={isMinor}
                          />
                          {calculatedGuardianDV !== null && (
                            <span className="absolute right-2 top-2 px-1.5 py-0.5 bg-teal-50 border border-teal-100 text-teal-800 font-bold text-[10px] rounded">
                              DV: {calculatedGuardianDV}
                            </span>
                          )}
                        </div>
                      </div>
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
                      data-testid="reception-next-tab"
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
                      type="button" 
                      data-testid="reception-submit-admit"
                      onClick={handleAddPatient}
                      className={`py-2 px-4 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        isMinor && (!guardianName.trim() || !guardianDocument.trim() || !guardianRelationship.trim())
                          ? 'bg-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                      disabled={isMinor && (!guardianName.trim() || !guardianDocument.trim() || !guardianRelationship.trim())}
                    >
                      {selectedPatientId ? (
                        <><Check className="w-4 h-4" /> Salvar Edição</>
                      ) : (
                        <><Plus className="w-4 h-4" /> Admitir na Triagem</>
                      )}
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
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md lg:col-span-1 space-y-4">
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
                    <div key={p.id} data-testid={`patient-card-${p.id}`} className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition text-sm">
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
                              onClick={() => {
                                setTriagePatient(p);
                                setTriageReason('');
                                setTriageWeight('');
                                setTriageHeight('');
                                setTriageBP('');
                                setTriageTemp('');
                                setTriageSpo2('');
                                setTriageHR('');
                                setTriageRR('');
                                setTriagePriorityLevel(
                                  p.priority === 'emergência' ? 'red' : p.priority === 'preferencial' ? 'orange' : 'green'
                                );
                                setTriageProcedures([]);
                                setTriageNursingNotes('');
                                setAttachedFiles([]);
                                setFileToUploadName('');
                                setFileToUploadSize('');
                                setFileToUploadType('');
                                setVirusScanStatus('pending');
                                setShowTriageModal(true);
                              }}
                              data-testid="attend"
                              className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <HeartPulse className="w-3.5 h-3.5 text-white animate-pulse" />
                              Realizar Triagem
                            </button>
                            <button
                              onClick={() => handleEditPatient(p)}
                              data-testid="edit-patient"
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold shadow-xs transition cursor-pointer flex items-center gap-1"
                              title="Editar Paciente"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePatient(p.id, p.name)}
                              data-testid="delete-patient"
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold shadow-xs transition cursor-pointer flex items-center gap-1"
                              title="Excluir Paciente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {p.status === 'atendimento' && (
                          <>
                            <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full flex items-center gap-1 animate-pulse">
                              🩺 Em Atendimento
                            </span>
                            <button
                              onClick={() => handleUpdatePatientStatus(p.id, 'atendido')}
                              data-testid="complete"
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
                              data-testid="check-in"
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

      {/* --- ENCAIXE AUTHORIZATION MODAL --- */}
      <AnimatePresence>
        {showOverturnModal && pendingAppointmentData && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-amber-200 shadow-2xl max-w-lg w-full p-6 space-y-5 font-sans"
            >
              <div className="flex items-center gap-3 border-b border-amber-100 pb-3">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Conflito de Agenda — Encaixe Requerido</h3>
                  <p className="text-xs text-slate-500 mt-0.5">O agendamento violou uma ou mais regras clínicas configuradas.</p>
                </div>
              </div>

              {/* Conflict details */}
              {pendingAppointmentData && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
                  <p className="font-bold text-amber-800 mb-1">⚠️ Motivos da restrição:</p>
                  {validateAppointment({
                    doctorName: pendingAppointmentData.doctorName,
                    date: pendingAppointmentData.date,
                    time: pendingAppointmentData.time,
                    modality: pendingAppointmentData.modality,
                    type: pendingAppointmentData.type,
                    insurance: pendingAppointmentData.insurance,
                  })?.map((conflict: string, i: number) => (
                    <p key={i} className="text-amber-700 font-medium flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                      {conflict}
                    </p>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Encaixe *</label>
                  <textarea
                    value={overturnReason}
                    onChange={e => { setOverturnReason(e.target.value); setOverturnPinError(''); }}
                    placeholder="Descreva a justificativa clínica para o encaixe (ex.: urgência médica, retorno pós-cirúrgico urgente)..."
                    rows={3}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-amber-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN de Autorização do Supervisor *</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={overturnPin}
                    onChange={e => { setOverturnPin(e.target.value); setOverturnPinError(''); }}
                    placeholder="••••   (Tente: 1234)"
                    className="w-32 p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-center font-mono tracking-widest focus:outline-amber-500"
                  />
                </div>
                {overturnPinError && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> {overturnPinError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowOverturnModal(false); setPendingAppointmentData(null); }}
                  className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOverturn}
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                >
                  <KeyRound className="w-4 h-4" />
                  Autorizar Encaixe
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TRIAGE / VITAL SIGNS MODAL --- */}
      <AnimatePresence>
        {showTriageModal && triagePatient && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-5 font-sans my-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-100 rounded-xl">
                    <HeartPulse className="w-6 h-6 text-teal-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Triagem Inicial de Enfermagem</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Paciente: <b className="text-teal-700">{triagePatient.name}</b> — {triagePatient.health_insurance_type || 'Particular'} | {triagePatient.birthdate}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowTriageModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* LEFT COLUMN: Vital Signs */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Motivo da Consulta */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Motivo Principal da Consulta / Queixa *</label>
                    <textarea
                      value={triageReason}
                      onChange={e => setTriageReason(e.target.value)}
                      placeholder="Descreva brevemente o motivo do atendimento de hoje..."
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                    />
                  </div>

                  {/* Sinais Vitais */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      <span>Sinais Vitais</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* Weight */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Peso (kg)</label>
                        <input
                          type="number"
                          value={triageWeight}
                          onChange={e => setTriageWeight(e.target.value)}
                          placeholder="Ex: 72.5"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans font-bold"
                        />
                      </div>
                      {/* Height */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Altura (cm)</label>
                        <input
                          type="number"
                          value={triageHeight}
                          onChange={e => setTriageHeight(e.target.value)}
                          placeholder="Ex: 170"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans font-bold"
                        />
                      </div>
                      {/* BMI (auto-calculated) */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IMC (Calculado)</label>
                        <div className={`w-full p-2 rounded-lg text-xs font-black text-center border ${
                          triageWeight && triageHeight
                            ? (() => {
                                const bmi = parseFloat(triageWeight) / Math.pow(parseFloat(triageHeight) / 100, 2);
                                if (bmi < 18.5) return 'bg-blue-50 border-blue-200 text-blue-700';
                                if (bmi < 25) return 'bg-green-50 border-green-200 text-green-700';
                                if (bmi < 30) return 'bg-amber-50 border-amber-200 text-amber-700';
                                return 'bg-rose-50 border-rose-200 text-rose-700';
                              })()
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          {triageWeight && triageHeight
                            ? (() => {
                                const bmi = parseFloat(triageWeight) / Math.pow(parseFloat(triageHeight) / 100, 2);
                                const label = bmi < 18.5 ? 'Abaixo do Peso' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obeso';
                                return `${bmi.toFixed(1)} — ${label}`;
                              })()
                            : 'Informe peso/altura'
                          }
                        </div>
                      </div>
                      {/* Blood pressure */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pressão Arterial</label>
                        <input
                          type="text"
                          value={triageBP}
                          onChange={e => setTriageBP(e.target.value)}
                          placeholder="Ex: 120/80"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                      </div>
                      {/* Temperature */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Temperatura (°C)</label>
                        <input
                          type="number"
                          value={triageTemp}
                          onChange={e => setTriageTemp(e.target.value)}
                          placeholder="Ex: 36.8"
                          step="0.1"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                      </div>
                      {/* SpO2 */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Saturação O₂ (%)</label>
                        <input
                          type="number"
                          value={triageSpo2}
                          onChange={e => setTriageSpo2(e.target.value)}
                          placeholder="Ex: 98"
                          min={60}
                          max={100}
                          className={`w-full p-2 bg-white border rounded-lg text-xs focus:outline-teal-500 font-sans font-bold ${
                            triageSpo2 && Number(triageSpo2) < 95
                              ? 'border-rose-400 bg-rose-50 text-rose-700'
                              : 'border-slate-200'
                          }`}
                        />
                      </div>
                      {/* Heart rate */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Freq. Cardíaca (bpm)</label>
                        <input
                          type="number"
                          value={triageHR}
                          onChange={e => setTriageHR(e.target.value)}
                          placeholder="Ex: 78"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                      </div>
                      {/* Respiratory rate */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Freq. Respiratória (irpm)</label>
                        <input
                          type="number"
                          value={triageRR}
                          onChange={e => setTriageRR(e.target.value)}
                          placeholder="Ex: 16"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                      </div>
                    </div>

                    {/* SpO2 Alert */}
                    {triageSpo2 && Number(triageSpo2) < 95 && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-bold flex items-center gap-2 animate-pulse">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        ⚠️ Saturação crítica! ({triageSpo2}%) — Protocolo de oxigenoterapia pode ser necessário.
                      </div>
                    )}
                  </div>

                  {/* Procedimentos Preliminares */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">Procedimentos Preliminares de Enfermagem</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Glicemia Capilar (HGT)',
                        'Eletrocardiograma (ECG)',
                        'Coleta de Sangue (Hemograma)',
                        'Coleta de Urina (EAS)',
                        'Pesagem e Antropometria',
                        'Pré-medicação / Analgesia',
                        'Inalação / Nebulização',
                        'Curativo / Ferida',
                      ].map(proc => (
                        <label key={proc} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={triageProcedures.includes(proc)}
                            onChange={e => {
                              setTriageProcedures(prev =>
                                e.target.checked ? [...prev, proc] : prev.filter(p => p !== proc)
                              );
                            }}
                            className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="group-hover:text-teal-700 transition">{proc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Observações de Enfermagem */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Observações de Enfermagem</label>
                    <textarea
                      value={triageNursingNotes}
                      onChange={e => setTriageNursingNotes(e.target.value)}
                      placeholder="Registre aqui as observações clínicas iniciais, comportamento do paciente, informações adicionais relevantes..."
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Priority + File Upload */}
                <div className="space-y-5">

                  {/* Manchester Triage Priority */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">Classificação de Risco (Manchester)</p>
                    <div className="space-y-2">
                      {[
                        { color: 'red', label: '🔴 Vermelho — Emergência', desc: 'Atendimento imediato' },
                        { color: 'orange', label: '🟠 Laranja — Muito Urgente', desc: '≤ 10 min' },
                        { color: 'yellow', label: '🟡 Amarelo — Urgente', desc: '≤ 60 min' },
                        { color: 'green', label: '🟢 Verde — Pouco Urgente', desc: '≤ 120 min' },
                        { color: 'blue', label: '🔵 Azul — Não Urgente', desc: '≤ 240 min' },
                      ].map(item => (
                        <label
                          key={item.color}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                            triagePriorityLevel === item.color
                              ? item.color === 'red' ? 'bg-rose-100 border-rose-300' :
                                item.color === 'orange' ? 'bg-orange-100 border-orange-300' :
                                item.color === 'yellow' ? 'bg-amber-100 border-amber-300' :
                                item.color === 'green' ? 'bg-green-100 border-green-300' :
                                'bg-blue-100 border-blue-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="triage-priority"
                            value={item.color}
                            checked={triagePriorityLevel === item.color}
                            onChange={() => setTriagePriorityLevel(item.color as any)}
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 leading-tight">{item.label}</p>
                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Foto do Paciente */}
                  {triagePatient && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200 mb-3">Foto do Paciente</p>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-32 h-32 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                          {triagePatient.photo_url ? (
                            <img src={triagePatient.photo_url} className="w-full h-full object-cover" alt="Foto do Paciente" />
                          ) : (
                            <User className="w-16 h-16 text-slate-300" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 space-y-0.5 text-center">
                          <p className="font-bold text-slate-700 text-xs">{triagePatient.name}</p>
                          <p>{triagePatient.document_type || 'CI'}: {triagePatient.document_number || 'N/A'}</p>
                          <p>{triagePatient.birthdate} ({triagePatient.birthdate ? new Date().getFullYear() - new Date(triagePatient.birthdate).getFullYear() : '-'} anos)</p>
                          {triagePatient.blood_type && <p>Tipo: <span className="font-bold text-rose-600">{triagePatient.blood_type}</span></p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  data-testid="reception-cancel-triage"
                  onClick={() => setShowTriageModal(false)}
                  className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  data-testid="reception-save-triage"
                  onClick={async () => {
                    if (!triagePatient || !triageReason.trim()) return;
                    const bmi = triageWeight && triageHeight
                      ? (parseFloat(triageWeight) / Math.pow(parseFloat(triageHeight) / 100, 2)).toFixed(1)
                      : undefined;

                    const triageEntry = {
                      id: `his_triage_${Date.now()}`,
                      date: new Date().toISOString().split('T')[0],
                      type: 'Triagem Inicial de Enfermagem',
                      diagnosis: triageReason,
                      cid10: 'Z00.0',
                      prescriptions: triageProcedures.length > 0 ? triageProcedures : ['Nenhum procedimento preliminar'],
                      notes: triageNursingNotes || 'Triagem realizada sem observações adicionais.',
                      doctor: 'Enf. de Triagem',
                      vital_signs: {
                        weight: triageWeight,
                        height: triageHeight,
                        bp: triageBP,
                        temp: triageTemp,
                        spo2: triageSpo2,
                        hr: triageHR,
                        rr: triageRR,
                        imc: bmi,
                      },
                      triage_priority: triagePriorityLevel === 'red' || triagePriorityLevel === 'orange'
                        ? 'emergência' as const
                        : triagePriorityLevel === 'yellow'
                        ? 'preferencial' as const
                        : 'normal' as const,
                      triage_color: triagePriorityLevel,
                      preliminary_procedures: triageProcedures,
                      attached_files: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                    };

                    const newPriority: Patient['priority'] = triageEntry.triage_priority;

                    // Optimistic UI update
                    setPatients(prev => prev.map(p => {
                      if (p.id === triagePatient.id) {
                        return {
                          ...p,
                          status: 'atendimento' as const,
                          priority: newPriority,
                          clinicalHistory: [triageEntry, ...p.clinicalHistory],
                        };
                      }
                      return p;
                    }));

                    addAuditLog(
                      `Triagem Realizada (${triagePriorityLevel.toUpperCase()})`,
                      `${triagePatient.name} — ${triageReason.slice(0, 60)}`
                    );

                    // Persist to Supabase
                    if (supabase) {
                      try {
                        await supabase.from('clinical_history').insert({
                          id: triageEntry.id,
                          patient_id: triagePatient.id,
                          date: triageEntry.date,
                          type: triageEntry.type,
                          diagnosis: triageEntry.diagnosis,
                          cid10: triageEntry.cid10,
                          prescriptions: triageEntry.prescriptions,
                          notes: triageEntry.notes,
                          doctor: triageEntry.doctor,
                        });
                         await supabase.from('patients').update({
                           status: 'atendimento',
                           priority: newPriority,
                         }).eq('id', triagePatient.id);
                       } catch (err) {
                         console.error('[SUPABASE] UPDATE patients triage FAILED:', err);
                       }
                    }

                    setShowTriageModal(false);
                    setTriagePatient(null);
                  }}
                  disabled={!triageReason.trim()}
                  className={`py-2.5 px-5 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition ${
                    triageReason.trim() ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <HeartPulse className="w-4 h-4" />
                  Salvar Triagem & Encaminhar para Atendimento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </PermissionGate>

      {/* --- AGENDA SUBMODULE --- */}
      <PermissionGate view="agenda" userPermissions={userPermissions}>
        {activeSubmodule === 2 && (
          <AgendaModule
            patients={patients}
            appointments={appointments}
            setPatients={setPatients}
            setAppointments={setAppointments}
            addAuditLog={addAuditLog}
            professionals={professionals}
            activeRole={activeRole}
            activeOperator={activeOperator}
            userPermissions={userPermissions}
          />
        )}
      </PermissionGate>
    </div>
  );
}

