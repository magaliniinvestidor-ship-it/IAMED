'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Patient, Appointment, Professional } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import PhoneInput from '@/components/PhoneInput';
import I18nDatePicker from '@/components/I18nDatePicker';
import { 
  Plus, Contact, CalendarDays, Check, Search, 
  Clock, AlertTriangle, UserPlus, Filter, Camera, 
  Upload, ShieldCheck, Mail, MapPin, Phone, User, 
  AlertCircle, ChevronRight, ChevronLeft, Languages, 
  HeartPulse, Shield, KeyRound, Sparkles,
  Sliders, Smartphone, Trash2, FileText, Scan, CheckCircle2, XCircle, X,
  Lock, AlertTriangle as AlertTriangleIcon, Pencil, Bell, ArrowRight
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
  const { t, locale } = useI18n();
  const getMaxNumericId = async (table: string, idPattern: string, idColumn: string = 'id'): Promise<number> => {
    const { data } = await supabase.from(table).select(idColumn).like(idColumn, `${idPattern}%`);
    let max = 0;
    if (data) {
      for (const row of data) {
        const m = String(row[idColumn]).match(new RegExp(`${idPattern}(\\d+)`));
        if (m) {
          const num = parseInt(m[1], 10);
          if (!isNaN(num) && num > max) max = num;
        }
      }
    }
    return max;
  };
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
  const [newGender, setNewGender] = useState('');
  const [newPriority, setNewPriority] = useState<'normal' | 'preferencial' | 'emergência'>('normal');
  const [documentType, setDocumentType] = useState<'CI' | 'Passaporte' | 'RG' | 'Outro' | ''>('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [civilStatus, setCivilStatus] = useState<'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável' | ''>('');
  const [nationality, setNationality] = useState('');
  const [addressDepartment, setAddressDepartment] = useState('');
  const [addressDistrict, setAddressDistrict] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  
  // Complementary fields
  const [bloodType, setBloodType] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Não Informado' | ''>('');
  const [allergies, setAllergies] = useState('');
  const [healthInsuranceType, setHealthInsuranceType] = useState<'IPS' | 'Sanidade Militar' | 'Sanidade Policial' | 'Pré-paga' | 'Seguro Privado' | 'Particular' | ''>('');
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState('');
  const [healthInsuranceCompany, setHealthInsuranceCompany] = useState('');
  const [employer, setEmployer] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianDocumentType, setGuardianDocumentType] = useState<'CI' | 'Passaporte' | 'RG' | 'Outro' | ''>('');
  const [guardianDocument, setGuardianDocument] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'es' | 'es-AR' | 'es-PY' | 'gn' | 'pt-BR' | 'pt-PT' | 'en' | 'outros' | ''>('');
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
  const notifCounterRef = useRef(0);
  const plaCounterRef = useRef(0);
  const locCounterRef = useRef(0);
  const hisCounterRef = useRef(0);
  const hisMedCounterRef = useRef(0);
  const patientsRef = useRef(patients);
  const pendingMedDataRef = useRef<any>(null);

  // Keep patientsRef in sync with latest patients prop
  useEffect(() => { patientsRef.current = patients; });

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
  const [triageAssignedLocation, setTriageAssignedLocation] = useState('');
  
  // --- Hospital Location / Distribution Panel ---
  type HospitalLocation = {
    id: string;
    name: string;
    type: 'consultorio' | 'enfermaria' | 'uti' | 'raio_x' | 'laboratorio' | 'cirurgia' | 'sala_espera' | 'outro';
    capacity: number;
    currentPatients: string[];
    status: 'livre' | 'ocupado' | 'manutencao';
  };
  type InternalNotification = {
    id: string;
    patientName: string;
    fromLocation: string;
    toLocation: string;
    message: string;
    read: boolean;
    createdAt: string;
  };
  const [activeReceptionTab, setActiveReceptionTab] = useState<'recepcao' | 'distribuicao' | 'locais' | 'notificacoes'>('recepcao');
  const [hospitalLocations, setHospitalLocations] = useState<HospitalLocation[]>([
    { id: 'loc_1', name: 'Consultório 1', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_2', name: 'Consultório 2', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_3', name: 'Consultório 3', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_4', name: 'Consultório 4', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_5', name: 'Consultório 5', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_6', name: 'Consultório 6', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_7', name: 'Consultório 7', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_8', name: 'Consultório 8', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_9', name: 'Consultório 9', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_10', name: 'Consultório 10', type: 'consultorio', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_11', name: 'Enfermaria', type: 'enfermaria', capacity: 10, currentPatients: [], status: 'livre' },
    { id: 'loc_12', name: 'UTI', type: 'uti', capacity: 5, currentPatients: [], status: 'livre' },
    { id: 'loc_13', name: 'Sala de Raio-X', type: 'raio_x', capacity: 1, currentPatients: [], status: 'livre' },
    { id: 'loc_14', name: 'Laboratório', type: 'laboratorio', capacity: 3, currentPatients: [], status: 'livre' },
    { id: 'loc_15', name: 'Sala de Cirurgia', type: 'cirurgia', capacity: 1, currentPatients: [], status: 'livre' },
  ]);
  const [showNewLocationModal, setShowNewLocationModal] = useState(false);
  const [newLocationForm, setNewLocationForm] = useState({ name: '', type: 'consultorio' as HospitalLocation['type'], capacity: 1 });
  const [editingLocation, setEditingLocation] = useState<HospitalLocation | null>(null);
  const [internalNotifications, setInternalNotifications] = useState<InternalNotification[]>([]);
  const [distributePatient, setDistributePatient] = useState<Patient | null>(null);
  const [distributeTargetLocation, setDistributeTargetLocation] = useState('');
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [redirectPatient, setRedirectPatient] = useState<Patient | null>(null);
  const [redirectTargetLocation, setRedirectTargetLocation] = useState('');
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [triageTab, setTriageTab] = useState<'aguardando' | 'em_atendimento' | 'atendidos'>('aguardando');
  const [attendedPatients, setAttendedPatients] = useState<{ patient: Patient; locationName: string; completedAt: string }[]>([]);
  const [patientNameMap, setPatientNameMap] = useState<Record<string, string>>({});
  const [selectedLocation, setSelectedLocation] = useState<HospitalLocation | null>(null);
  const [selectedDetailPatientId, setSelectedDetailPatientId] = useState<string | null>(null);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  
  // Patient Timeline Modal states
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelinePatient, setTimelinePatient] = useState<Patient | null>(null);
  const [timelineAssignments, setTimelineAssignments] = useState<{ locationName: string; assignedAt: string; completedAt: string | null }[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  
  // Medical consultation fields (for consultório modal)
  const [medDiagnosis, setMedDiagnosis] = useState('');
  const [medCid10, setMedCid10] = useState('');
  const [medPrescription, setMedPrescription] = useState('');
  const [medNotes, setMedNotes] = useState('');
  const [prevMedDiagnosis, setPrevMedDiagnosis] = useState('');
  const [prevMedCid10, setPrevMedCid10] = useState('');
  const [prevMedPrescription, setPrevMedPrescription] = useState('');
  const [prevMedNotes, setPrevMedNotes] = useState('');
  const [isEditingTriage, setIsEditingTriage] = useState(false);
  const [hasTriageEdits, setHasTriageEdits] = useState(false);
  const [editTriageReason, setEditTriageReason] = useState('');
  const [editTriageBP, setEditTriageBP] = useState('');
  const [editTriageTemp, setEditTriageTemp] = useState('');
  const [editTriageSpo2, setEditTriageSpo2] = useState('');
  const [editTriageHR, setEditTriageHR] = useState('');
  const [editTriageRR, setEditTriageRR] = useState('');
  
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

  // Vitals limits based on patient age
  const patientAgeMonths = useMemo(() => {
    if (!triagePatient?.birthdate) return 999;
    const b = new Date(triagePatient.birthdate);
    const now = new Date();
    return (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  }, [triagePatient?.birthdate]);

  const vitalsLimits = useMemo(() => {
    const isBaby = patientAgeMonths < 12;
    const isChild = patientAgeMonths >= 12 && patientAgeMonths < 216;
    if (isBaby) {
      return {
        label: t('rcpt_vitals_baby', 'app'),
        spo2: { red: (v: number) => v < 90, orange: (v: number) => v >= 90 && v <= 94 },
        pa: { red: (s: number) => s < 60, orange: (s: number) => s >= 60 && s <= 70, yellow: () => false },
        fc: { red: (v: number) => v > 180 || v < 60, orange: (v: number) => (v >= 161 && v <= 180) || (v >= 60 && v <= 79), yellow: (v: number) => v >= 140 && v <= 160 },
        fr: { red: (v: number) => v < 15, orange: (v: number) => v > 55, yellow: (v: number) => v >= 45 && v <= 55 },
        temp: { orange: (v: number) => v >= 41.0 || v <= 35.0 || (v >= 38.5 && patientAgeMonths < 3), yellow: (v: number) => v >= 38.5 && v <= 40.9 && patientAgeMonths >= 3 },
      };
    }
    if (isChild) {
      return {
        label: t('rcpt_vitals_child', 'app'),
        spo2: { red: (v: number) => v < 90, orange: (v: number) => v >= 90 && v <= 94 },
        pa: { red: (s: number) => s < 70, orange: (s: number) => s >= 70 && s <= 85, yellow: () => false },
        fc: { red: (v: number) => v > 140 || v < 50, orange: (v: number) => (v >= 121 && v <= 140) || (v >= 50 && v <= 59), yellow: (v: number) => v >= 100 && v <= 120 },
        fr: { red: (v: number) => v < 10, orange: (v: number) => v > 40, yellow: (v: number) => v >= 30 && v <= 40 },
        temp: { orange: (v: number) => v >= 41.0 || v <= 35.0, yellow: (v: number) => v >= 38.5 && v <= 40.9 },
      };
    }
    return {
      label: t('rcpt_vitals_adult', 'app'),
      spo2: { red: (v: number) => v < 85, orange: (v: number) => v >= 85 && v <= 94 },
      pa: { red: (s: number) => s <= 70, orange: (s: number) => (s >= 71 && s <= 89) || s > 200, yellow: (s: number) => s >= 140 && s <= 199 },
      fc: { red: (v: number) => v > 150 || v < 30, orange: (v: number) => (v >= 131 && v <= 150) || (v >= 30 && v <= 39), yellow: (v: number) => v >= 100 && v <= 130 },
      fr: { red: (v: number) => v < 8, orange: (v: number) => v > 30, yellow: (v: number) => v >= 21 && v <= 30 },
      temp: { orange: (v: number) => v >= 41.0 || v <= 35.0, yellow: (v: number) => v >= 38.5 && v <= 40.9 },
    };
  }, [patientAgeMonths]);


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
        addAuditLog(t('rcpt_audit_camera_photo', 'app'), newName || 'Pendente');
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
      addAuditLog(t('rcpt_audit_webcam_photo', 'app'), newName || 'Pendente');
      uploadPhotoToStorage(svgData, simulationFileRef.current).then(url => {
        if (url) setPhotoUrl(url);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraCountdown]);

  // --- Load existing medical consultation data when patient detail is opened ---
  useEffect(() => {
    const activePatientId = selectedLocation?.capacity === 1 && selectedLocation.currentPatients.length === 1
      ? selectedLocation.currentPatients[0]
      : selectedDetailPatientId;
    if (!activePatientId || !showLocationDetail) return;

    const pat = patientsRef.current.find(p => p.id === activePatientId);
    if (pat) {
      setInternalNotifications(prev => prev.map(n => n.patientName === pat.name && !n.read ? { ...n, read: true } : n));
      if (supabase) {
        supabase.from('internal_notifications').update({ read: true }).eq('patient_name', pat.name).eq('read', false).then(() => {}, () => {});
      }
    }

    let cancelled = false;

    const loadData = async () => {
      // Always fetch fresh clinical history from Supabase
      let clinicalHistory: any[] = [];
      if (supabase) {
        const { data } = await supabase
          .from('clinical_history')
          .select('*')
          .eq('patient_id', activePatientId)
          .order('created_at', { ascending: true });
        if (data) clinicalHistory = data;
      }
      if (cancelled) return;

      const history = clinicalHistory.length > 0 ? clinicalHistory : (pat?.clinicalHistory || []);

      // Find the MOST RECENT med entry from any location
      const allMeds = history.filter((h: any) => h.type === 'Consulta Médica');
      const sortedMeds = [...allMeds].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.date || 0).getTime();
        const dateB = new Date(b.created_at || b.date || 0).getTime();
        return dateB - dateA;
      });
      const mostRecentMed = sortedMeds.length > 0 ? sortedMeds[0] : null;

      if (mostRecentMed) {
        const rx = mostRecentMed.prescriptions?.join?.('\n') || (Array.isArray(mostRecentMed.prescriptions) ? mostRecentMed.prescriptions.join('\n') : '');
        setPrevMedDiagnosis(mostRecentMed.diagnosis || '');
        setPrevMedCid10(mostRecentMed.cid10 || '');
        setPrevMedPrescription(rx);
        setPrevMedNotes(mostRecentMed.notes || '');
      } else {
        setPrevMedDiagnosis('');
        setPrevMedCid10('');
        setPrevMedPrescription('');
        setPrevMedNotes('');
      }

      // Always open with empty fields for new data
      setMedDiagnosis('');
      setMedCid10('');
      setMedPrescription('');
      setMedNotes('');

      // Load triage edits
      if (mostRecentMed?.triage_edits) {
        const te = mostRecentMed.triage_edits;
        setEditTriageReason(te.diagnosis || '');
        setEditTriageBP(te.vital_signs?.bp || '');
        setEditTriageTemp(te.vital_signs?.temp || '');
        setEditTriageSpo2(te.vital_signs?.spo2 || '');
        setEditTriageHR(te.vital_signs?.hr || '');
        setEditTriageRR(te.vital_signs?.rr || '');
      } else {
        const triage = history.find((h: any) => h.type?.includes('Triagem'));
        setEditTriageReason(triage?.diagnosis || '');
        setEditTriageBP(triage?.vital_signs?.bp || '');
        setEditTriageTemp(triage?.vital_signs?.temp || '');
        setEditTriageSpo2(triage?.vital_signs?.spo2 || '');
        setEditTriageHR(triage?.vital_signs?.hr || '');
        setEditTriageRR(triage?.vital_signs?.rr || '');
      }
      setIsEditingTriage(false);
      setHasTriageEdits(!!mostRecentMed?.triage_edits);
    };

    loadData();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLocationDetail, selectedDetailPatientId, selectedLocation?.currentPatients, selectedLocation?.name]);

  // --- Load Hospital Data from Supabase on Mount ---
  useEffect(() => {
    const loadHospitalData = async () => {
      if (!supabase) return;
      try {
        const { data: locations, error: locError } = await supabase.from('hospital_locations').select('*').order('name');
        if (!locError && locations && locations.length > 0) {
          setHospitalLocations(locations.map((l: any) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            capacity: l.capacity,
            status: l.status || 'livre',
            currentPatients: [],
          })));
          // Set loc counter from last ID
          let maxLoc = 0;
          locations.forEach((l: any) => {
            const num = parseInt(String(l.id).replace('loc_', ''));
            if (!isNaN(num) && num > maxLoc) maxLoc = num;
          });
          locCounterRef.current = maxLoc;
          // Load patient assignments
          const { data: assignments, error: assignError } = await supabase.from('patient_location_assignments').select('*, patients(name)').eq('active', true);
          if (!assignError && assignments && assignments.length > 0) {
            const nameMap: Record<string, string> = {};
            assignments.forEach((a: any) => {
              if (a.patient_id && a.patients?.name) {
                nameMap[a.patient_id] = a.patients.name;
              }
            });
            setPatientNameMap(nameMap);
            setHospitalLocations(prev => prev.map(loc => ({
              ...loc,
              currentPatients: assignments.filter((a: any) => a.location_id === loc.id).map((a: any) => a.patient_id),
            })));
          }
          plaCounterRef.current = await getMaxNumericId('patient_location_assignments', 'pla_');
        }
        const { data: notifications, error: notifError } = await supabase.from('internal_notifications').select('*').order('created_at', { ascending: false }).limit(50);
        if (!notifError && notifications) {
          setInternalNotifications(notifications.map((n: any) => ({
            id: n.id,
            patientName: n.patient_name,
            fromLocation: n.from_location,
            toLocation: n.to_location,
            message: n.message,
            read: n.read,
            createdAt: n.created_at,
          })));
          notifCounterRef.current = await getMaxNumericId('internal_notifications', 'notif_');
        }
        hisCounterRef.current = await getMaxNumericId('clinical_history', 'his_triage_');
        hisMedCounterRef.current = await getMaxNumericId('clinical_history', 'his_med_');
        const { data: completedAssignments, error: completedError } = await supabase
          .from('patient_location_assignments')
          .select('*, patients!inner(name, phone, status), hospital_locations!inner(name)')
          .eq('active', false)
          .eq('patients.status', 'atendido')
          .order('assigned_at', { ascending: false })
          .limit(50);
        const attendedMap = new Map<string, any>();
        if (!completedError && completedAssignments && completedAssignments.length > 0) {
          for (const a of completedAssignments) {
            const existing = attendedMap.get(a.patient_id);
            if (!existing || new Date(a.assigned_at) > new Date(existing.assigned_at)) {
              const foundPatient = patients.find(p => p.id === a.patient_id);
              attendedMap.set(a.patient_id, {
                patient: foundPatient || { id: a.patient_id, name: a.patients?.name || t('rcpt_patient_fallback', 'app'), phone: a.patients?.phone || '', email: '', birthdate: '', gender: '', priority: 'normal' as const, status: 'atendido' as const, clinicalHistory: [] } as Patient,
                locationName: a.hospital_locations?.name || 'Local',
                completedAt: a.assigned_at,
              });
            }
          }
        }
        // Also include patients with status 'atendido' that have no assignment records
        const { data: atendidoPatients } = await supabase
          .from('patients')
          .select('id, name, phone')
          .eq('status', 'atendido');
        if (atendidoPatients && atendidoPatients.length > 0) {
          for (const p of atendidoPatients) {
            if (!attendedMap.has(p.id)) {
              const foundPatient = patients.find(pt => pt.id === p.id);
              const hist = foundPatient?.clinicalHistory || [];
              const lastMed = hist.filter((h: any) => h.type === 'Consulta Médica').sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
              attendedMap.set(p.id, {
                patient: foundPatient || { id: p.id, name: p.name || t('rcpt_patient_fallback', 'app'), phone: p.phone || '', email: '', birthdate: '', gender: '', priority: 'normal' as const, status: 'atendido' as const, clinicalHistory: [] } as Patient,
                locationName: lastMed?.location_name || '—',
                completedAt: (lastMed as any)?.created_at || new Date().toISOString(),
              });
            }
          }
        }
        if (attendedMap.size > 0) {
          setAttendedPatients(Array.from(attendedMap.values()));
        }
      } catch (err) {
        console.error('[SUPABASE] Load hospital data FAILED:', err);
      }
    };
    loadHospitalData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
    const fileName = selectedPatientId ? `patient_${selectedPatientId}.jpg` : `patient_${++photoCounterRef.current}.jpg`;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setWebcamPlaceholder(result);
        addAuditLog(t('rcpt_audit_loaded_photo', 'app'), newName || 'Pendente');
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
      alert(t('rcpt_alert_required_full_name', 'app'));
      setActiveFormTab('identification');
      return;
    }
    if (!documentNumber.trim()) {
      alert(t('rcpt_alert_required_doc_number', 'app'));
      setActiveFormTab('identification');
      return;
    }
    if (!newBirthdate) {
      alert(t('rcpt_alert_required_birthdate', 'app'));
      setActiveFormTab('identification');
      return;
    }
    if (!isEditing && !placeOfBirth.trim()) {
      alert(t('rcpt_alert_required_place_of_birth', 'app'));
      setActiveFormTab('identification');
      return;
    }
    if (!isEditing && !nationality.trim()) {
      alert(t('rcpt_alert_required_nationality', 'app'));
      setActiveFormTab('identification');
      return;
    }

    // Contact/Address tab fields
    if (!newPhone.trim()) {
      alert(t('rcpt_alert_required_phone', 'app'));
      setActiveFormTab('contact_address');
      return;
    }
    if (!isPhoneValid) {
      alert(t('rcpt_alert_invalid_phone', 'app'));
      setActiveFormTab('contact_address');
      return;
    }
    if (!newEmail.trim()) {
      alert(t('rcpt_alert_required_email', 'app'));
      setActiveFormTab('contact_address');
      return;
    }
    if (!addressDepartment.trim()) {
      alert(t('rcpt_alert_required_department', 'app'));
      setActiveFormTab('contact_address');
      return;
    }
    if (!addressCity.trim()) {
      alert(t('rcpt_alert_required_city', 'app'));
      setActiveFormTab('contact_address');
      return;
    }

    // Complementary tab fields (only required for new patients)
    if (!isEditing && !allergies.trim()) {
      alert(t('rcpt_alert_required_allergies', 'app'));
      setActiveFormTab('complementary');
      return;
    }
    if (healthInsuranceType !== 'Particular' && !healthInsuranceNumber.trim()) {
      alert(t('rcpt_alert_required_insurance_number', 'app'));
      setActiveFormTab('complementary');
      return;
    }
    if (!isEditing && !employer.trim()) {
      alert(t('rcpt_alert_required_employer', 'app'));
      setActiveFormTab('complementary');
      return;
    }

    // Guardian fields are required only for minors
    if (isMinor) {
      if (!guardianName.trim()) {
        alert(t('rcpt_alert_required_guardian_name', 'app'));
        setActiveFormTab('guardian');
        return;
      }
      if (!guardianDocument.trim()) {
        alert(t('rcpt_alert_required_guardian_doc', 'app'));
        setActiveFormTab('guardian');
        return;
      }
      if (!guardianRelationship.trim()) {
        alert(t('rcpt_alert_required_guardian_relationship', 'app'));
        setActiveFormTab('guardian');
        return;
      }
    }

    // eslint-disable-next-line react-hooks/purity
    let patientId: string;
    if (isEditing) {
      patientId = selectedPatientId;
    } else {
      const numericIds = patients.map(p => {
        const match = p.id.match(/^PAC(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const nextIdNum = Math.max(...numericIds, 0) + 1;
      patientId = `PAC${String(nextIdNum).padStart(3, '0')}`;
    }

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
      gender: newGender || 'Masculino',
      priority: newPriority,
      status: 'aguardando',
      clinicalHistory: [],
      
      document_type: documentType || undefined as any,
      document_number: documentNumber,
      place_of_birth: placeOfBirth,
      civil_status: civilStatus || undefined as any,
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
      guardian_phone: isMinor ? guardianPhone : undefined,
      photo_url: finalPhotoUrl,
      preferred_language: preferredLanguage
    };

    // Optimistic UI update
    if (isEditing) {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...newPatient } : p));
      addAuditLog(t('rcpt_audit_edited_patient', 'app'), newPatient.name);
    } else {
      setPatients(prev => [newPatient, ...prev]);
      addAuditLog(t('rcpt_audit_admitted_patient', 'app'), newPatient.name);
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
        alert(t('rcpt_alert_error_update', 'app') + updateError.message);
        return;
      }
    } else {
      const { data: insertedData, error: insertError } = await supabase.from('patients').insert({ id: newPatient.id, ...patientData }).select();
      if (insertError) {
        console.error("[SUPABASE] INSERT patients FAILED:", insertError.code, insertError.message, insertError.details);
        setPatients(prev => prev.filter(p => p.id !== newPatient.id));
        alert(t('rcpt_alert_error_insert', 'app') + insertError.message);
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
    setBloodType('');
    setHealthInsuranceNumber('');
    setHealthInsuranceCompany('');
    setEmployer('');
    setGuardianName('');
    setGuardianDocumentType('');
    setGuardianDocument('');
    setGuardianRelationship('');
    setGuardianPhone('');
    setHealthInsuranceType('');
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
      setPinError(t('rcpt_pin_invalid', 'app'));
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
    addAuditLog(t('rcpt_audit_merged_records', 'app'), duplicatePatient.name);

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
      conflicts.push(t('rcpt_conflict_overlap', 'app').replace('{time}', appData.time).replace('{doctor}', appData.doctorName));
    }

    // 2. Check minimum time between appointments
    doctorApps.forEach(a => {
      const [ah, am] = a.time.split(':').map(Number);
      const appMinutes = ah * 60 + am;
      const diff = Math.abs(newMinutes - appMinutes);
      if (diff < minMinutesBetween) {
        conflicts.push(
          t('rcpt_conflict_interval', 'app').replace('{time}', appData.time).replace('{minutes}', String(minMinutesBetween)).replace('{otherTime}', a.time).replace('{diff}', String(diff))
        );
      }
    });

    // 3. Check modality quotas
    if (appData.modality === 'Virtual') {
      const virtualCount = doctorApps.filter(a => a.modality === 'Virtual').length;
      if (virtualCount >= telemedQuota) {
        conflicts.push(t('rcpt_conflict_telequota', 'app').replace('{quota}', String(telemedQuota)).replace('{doctor}', appData.doctorName));
      }
    }

    const totalCount = doctorApps.length;
    if (totalCount >= totalQuota) {
      conflicts.push(t('rcpt_conflict_total_quota', 'app').replace('{quota}', String(totalQuota)).replace('{doctor}', appData.doctorName));
    }

    // 4. Insurance rules (agenda diferenciada)
    // IPS Rule: IPS only allows consultations Mon-Fri, 07:00-12:00
    if (appData.insurance === 'IPS') {
      const dayOfWeek = new Date(appData.date).getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        conflicts.push(t('rcpt_conflict_weekend', 'app'));
      }
      if (h < 7 || h >= 12) {
        conflicts.push(t('rcpt_conflict_time_restr', 'app'));
      }
      if (appData.type === 'procedimento' || appData.type === 'exame diagnóstico') {
        conflicts.push(t('rcpt_conflict_procedure', 'app').replace('{type}', appData.type));
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
      newApp.is_overturn ? t('rcpt_audit_overturn_authorized', 'app') : t('rcpt_audit_scheduled_appointment', 'app'),
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
      setOverturnPinError(t('rcpt_pin_invalid', 'app'));
      return;
    }

    if (!overturnReason.trim()) {
      setOverturnPinError(t('rcpt_describe_reason', 'app'));
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
      setOnlineErrorMessage(t('rcpt_alert_select_patient_simulation', 'app'));
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
        t('rcpt_booking_refused', 'app') + conflicts.join(' | ')
      );
      addAuditLog(t('rcpt_audit_booking_refused', 'app'), `${patient.name} - ${onlineDoctor} às ${onlineTime}`);
      return;
    }

    // Direct booking (success)
    await saveAppointmentToStateAndDb({
      ...appData,
      status: 'confirmado',
    });

    setOnlineSuccessMessage(t('rcpt_booking_success', 'app'));
    setOnlinePatientId('');
  };

  const handleDeletePatient = async (id: string, patientName: string) => {
    if (!confirm(t('rcpt_confirm_delete_patient', 'app').replace('{name}', patientName))) return;

    setPatients(prev => prev.filter(p => p.id !== id));

    // Excluir agendamentos vinculados
    const linkedAppointments = appointments.filter(a => a.patientId === id || a.patientName === patientName);
    linkedAppointments.forEach(a => {
      setAppointments(prev => prev.filter(ap => ap.id !== a.id));
    });

    // Excluir registros no Supabase
    if (supabase) {
      // Excluir lembretes do WhatsApp vinculados ao paciente
      const { error: reminderError } = await supabase.from('whatsapp_reminders').delete().eq('patient_name', patientName);
      if (reminderError) console.error("[SUPABASE] DELETE whatsapp_reminders FAILED:", reminderError.message);

      // Excluir agendamentos vinculados
      for (const app of linkedAppointments) {
        const { error: appError } = await supabase.from('appointments').delete().eq('id', app.id);
        if (appError) console.error("[SUPABASE] DELETE appointments FAILED:", appError.message);
      }

      // Excluir da lista de espera
      const { error: waitlistError } = await supabase.from('waiting_list').delete().eq('patient_id', id);
      if (waitlistError) console.error("[SUPABASE] DELETE waiting_list FAILED:", waitlistError.message);

      // Excluir o paciente
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) console.error("[SUPABASE] DELETE patients FAILED:", error.message);
    }

    addAuditLog(t('rcpt_audit_deleted_patient', 'app'), `${patientName} (+ ${linkedAppointments.length} agendamento(s) e lembretes do WhatsApp)`);
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
        addAuditLog(t('rcpt_audit_patient_status', 'app').replace('{status}', status), p.name);
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
        addAuditLog(t('rcpt_audit_appointment_status', 'app').replace('{status}', status), a.patientName);
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

  // --- Hospital Distribution Handlers ---
  const locationTypeLabel: Record<HospitalLocation['type'], string> = {
    consultorio: t('rcpt_loc_type_consultorio', 'app'),
    enfermaria: t('rcpt_loc_type_enfermaria', 'app'),
    uti: t('rcpt_loc_type_uti', 'app'),
    raio_x: t('rcpt_loc_type_raio_x', 'app'),
    laboratorio: t('rcpt_loc_type_laboratorio', 'app'),
    cirurgia: t('rcpt_loc_type_cirurgia', 'app'),
    sala_espera: t('rcpt_loc_type_sala_espera', 'app'),
    outro: t('rcpt_loc_type_outro', 'app'),
  };
  const locationTypeIcon: Record<HospitalLocation['type'], string> = {
    consultorio: '📍',
    enfermaria: '🏥',
    uti: '🚨',
    raio_x: '📷',
    laboratorio: '🧪',
    cirurgia: '🔪',
    sala_espera: '⏳',
    outro: '🏠',
  };

  const handleAddLocation = async () => {
    if (!newLocationForm.name.trim()) return;
    const newLoc: HospitalLocation = {
      id: `loc_${++locCounterRef.current}`,
      name: newLocationForm.name.trim(),
      type: newLocationForm.type,
      capacity: newLocationForm.capacity,
      currentPatients: [],
      status: 'livre',
    };
    setHospitalLocations(prev => [...prev, newLoc]);
    setNewLocationForm({ name: '', type: 'consultorio', capacity: 1 });
    setShowNewLocationModal(false);
    addAuditLog(t('rcpt_audit_created_location', 'app'), newLoc.name);
    if (supabase) {
      try {
        await supabase.from('hospital_locations').insert({
          id: newLoc.id,
          name: newLoc.name,
          type: newLoc.type,
          capacity: newLoc.capacity,
          status: newLoc.status,
        });
      } catch (err) {
        console.error('[SUPABASE] INSERT hospital_locations FAILED:', err);
      }
    }
  };

  const handleDeleteLocation = async (locId: string) => {
    const loc = hospitalLocations.find(l => l.id === locId);
    if (!loc) return;
    if (loc.currentPatients.length > 0) {
      alert(t('rcpt_alert_cannot_delete_location', 'app'));
      return;
    }
    if (!confirm(t('rcpt_confirm_delete_location', 'app').replace('{name}', loc.name))) return;
    setHospitalLocations(prev => prev.filter(l => l.id !== locId));
    addAuditLog(t('rcpt_audit_deleted_location', 'app'), loc.name);
    if (supabase) {
      try {
        await supabase.from('hospital_locations').delete().eq('id', locId);
      } catch (err) {
        console.error('[SUPABASE] DELETE hospital_locations FAILED:', err);
      }
    }
  };

  const handleDistributePatient = async () => {
    if (!distributePatient || !distributeTargetLocation) return;
    const targetLoc = hospitalLocations.find(l => l.id === distributeTargetLocation);
    if (!targetLoc) return;
    if (targetLoc.currentPatients.length >= targetLoc.capacity) {
      alert(t('rcpt_alert_capacity_full', 'app'));
      return;
    }
    setHospitalLocations(prev => prev.map(l => {
      if (l.id === distributeTargetLocation) {
        return { ...l, currentPatients: [...l.currentPatients, distributePatient.id], status: l.type === 'consultorio' ? 'ocupado' as const : l.status };
      }
      return l;
    }));
    const patient = patients.find(p => p.id === distributePatient.id);
    if (patient) {
      addAuditLog(t('rcpt_audit_patient_directed', 'app').replace('{location}', targetLoc.name), patient.name);
      const newNotif: InternalNotification = {
        id: `notif_${++notifCounterRef.current}`,
        patientName: patient.name,
        fromLocation: 'Triagem',
        toLocation: targetLoc.name,
        message: `${t('rcpt_notif_patient', 'app')} ${patient.name} ${t('rcpt_notif_forwarded_to', 'app')} ${targetLoc.name}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setInternalNotifications(prev => [newNotif, ...prev]);
      if (supabase) {
        try {
          await supabase.from('patient_location_assignments').insert({
            id: `pla_${++plaCounterRef.current}`,
            patient_id: distributePatient.id,
            location_id: distributeTargetLocation,
            active: true,
            assigned_at: new Date().toISOString(),
          });
          await supabase.from('internal_notifications').insert({
            id: newNotif.id,
            patient_name: newNotif.patientName,
            from_location: newNotif.fromLocation,
            to_location: newNotif.toLocation,
            message: newNotif.message,
            read: false,
          });
          await supabase.from('hospital_locations').update({ status: 'ocupado' }).eq('id', distributeTargetLocation);
        } catch (err) {
          console.error('[SUPABASE] INSERT distribute patient FAILED:', err);
        }
      }
    }
    setShowDistributeModal(false);
    setDistributePatient(null);
    setDistributeTargetLocation('');
  };

  const handleCallNextPatient = async (locId: string) => {
    const loc = hospitalLocations.find(l => l.id === locId);
    if (!loc) return;
    if (loc.status === 'manutencao') return;
    if (loc.currentPatients.length >= loc.capacity) return;

    if (triagedPatients.length === 0) return;
    const nextPatient = triagedPatients[0];
    const updatedPatients = [...loc.currentPatients, nextPatient.id];
    setHospitalLocations(prev => prev.map(l => {
      if (l.id === locId) {
        return { ...l, currentPatients: updatedPatients, status: 'ocupado' as const };
      }
      return l;
    }));
    setSelectedLocation(prev => {
      if (prev && prev.id === locId) {
        return { ...prev, currentPatients: updatedPatients, status: 'ocupado' };
      }
      return prev;
    });
    await handleUpdatePatientStatus(nextPatient.id, 'atendimento');
    addAuditLog(t('rcpt_audit_patient_called', 'app').replace('{location}', loc.name), nextPatient.name);
    setPatientNameMap(prev => ({ ...prev, [nextPatient.id]: nextPatient.name }));
    if (supabase) {
      const { error: assignErr } = await supabase.from('patient_location_assignments').insert({
        id: `pla_${++plaCounterRef.current}`,
        patient_id: nextPatient.id,
        location_id: locId,
        active: true,
        assigned_at: new Date().toISOString(),
      });
      if (assignErr) console.error('[SUPABASE] INSERT call next patient FAILED:', assignErr.message);
      const { error: locErr } = await supabase.from('hospital_locations').update({ status: 'ocupado' }).eq('id', locId);
      if (locErr) console.error('[SUPABASE] UPDATE hospital_location FAILED:', locErr.message);
    }
  };

  const handleCompleteSpecificPatient = async (locId: string, patientId: string) => {
    const loc = hospitalLocations.find(l => l.id === locId);
    if (!loc) return;
    const remaining = loc.currentPatients.filter(pid => pid !== patientId);
    setHospitalLocations(prev => prev.map(l => {
      if (l.id === locId) {
        return { ...l, currentPatients: remaining, status: remaining.length > 0 ? 'ocupado' as const : 'livre' as const };
      }
      return l;
    }));
    setSelectedLocation(prev => {
      if (prev && prev.id === locId) {
        return { ...prev, currentPatients: remaining, status: remaining.length > 0 ? 'ocupado' : 'livre' };
      }
      return prev;
    });
    handleUpdatePatientStatus(patientId, 'atendido');
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      addAuditLog(t('rcpt_audit_visit_completed', 'app').replace('{location}', loc.name), patient.name);
      setAttendedPatients(prev => [...prev, { patient, locationName: loc.name, completedAt: new Date().toISOString() }]);
    }
    if (supabase) {
      try {
        await supabase.from('patient_location_assignments').update({ active: false, completed_at: new Date().toISOString() }).eq('patient_id', patientId).eq('location_id', locId).eq('active', true);
        const newStatus = remaining.length > 0 ? 'ocupado' : 'livre';
        await supabase.from('hospital_locations').update({ status: newStatus }).eq('id', locId);
      } catch (err) {
        console.error('[SUPABASE] UPDATE complete specific patient FAILED:', err);
      }
    }
  };

  const handleRedirectPatient = async () => {
    if (!redirectPatient || !redirectTargetLocation) return;
    const targetLoc = hospitalLocations.find(l => l.id === redirectTargetLocation);
    if (!targetLoc) return;
    if (targetLoc.currentPatients.length >= targetLoc.capacity) {
      alert(t('rcpt_alert_capacity_full', 'app'));
      return;
    }
    if (pendingMedDataRef.current && supabase) {
      const { pid, medData } = pendingMedDataRef.current;
      const hasAnyField =
        (medData.diagnosis && String(medData.diagnosis).trim() !== '') ||
        (medData.cid10 && String(medData.cid10).trim() !== '' && medData.cid10 !== 'Z00.0') ||
        (medData.prescriptions && (Array.isArray(medData.prescriptions) ? medData.prescriptions.length > 0 : String(medData.prescriptions).trim() !== '')) ||
        (medData.notes && String(medData.notes).trim() !== '');
if (hasAnyField) {
        try {
const medEntry = { id: `his_med_${++hisMedCounterRef.current}`, date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString(), type: 'Consulta Médica', ...medData };
          const { error } = await supabase.from('clinical_history').insert({ ...medEntry, patient_id: pid });
          if (!error) {
            setPatients(prev => prev.map(p => p.id === pid ? { ...p, clinicalHistory: [{ ...medEntry, patient_id: pid } as any, ...(p.clinicalHistory || [])] } : p));
          } else {
            console.error('[SUPABASE] SAVE med before redirect FAILED:', error.message);
          }
        } catch (err) {
          console.error('[SUPABASE] SAVE med before redirect FAILED:', err);
        }
      }
      pendingMedDataRef.current = null;
    }
    const fromLoc = hospitalLocations.find(l => l.currentPatients.includes(redirectPatient.id));
    setHospitalLocations(prev => prev.map(l => {
      const newCurrent = l.currentPatients.filter(pid => pid !== redirectPatient.id);
      if (l.id === redirectTargetLocation) {
        return { ...l, currentPatients: [...l.currentPatients, redirectPatient.id], status: l.type === 'consultorio' ? 'ocupado' as const : l.status };
      }
      return { ...l, currentPatients: newCurrent, status: newCurrent.length > 0 ? l.status : l.type === 'consultorio' ? 'livre' as const : l.status };
    }));
    addAuditLog(t('rcpt_audit_patient_redirected', 'app').replace('{location}', targetLoc.name), redirectPatient.name);
    const newNotif: InternalNotification = {
      id: `notif_${++notifCounterRef.current}`,
      patientName: redirectPatient.name,
      fromLocation: fromLoc?.name || 'Origem',
      toLocation: targetLoc.name,
      message: `${t('rcpt_notif_patient', 'app')} ${redirectPatient.name} ${t('rcpt_notif_redirected_to', 'app')} ${targetLoc.name}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setInternalNotifications(prev => [newNotif, ...prev]);
    if (supabase) {
      try {
        if (fromLoc) {
          await supabase.from('patient_location_assignments').update({ active: false, completed_at: new Date().toISOString() }).eq('patient_id', redirectPatient.id).eq('location_id', fromLoc.id).eq('active', true);
          const fromRemaining = fromLoc.currentPatients.filter(pid => pid !== redirectPatient.id);
          await supabase.from('hospital_locations').update({ status: fromRemaining.length > 0 ? 'ocupado' : 'livre' }).eq('id', fromLoc.id);
        }
        await supabase.from('patient_location_assignments').insert({
          id: `pla_${++plaCounterRef.current}`,
          patient_id: redirectPatient.id,
          location_id: redirectTargetLocation,
          active: true,
          assigned_at: new Date().toISOString(),
        });
        await supabase.from('hospital_locations').update({ status: 'ocupado' }).eq('id', redirectTargetLocation);
        await supabase.from('internal_notifications').insert({
          id: newNotif.id,
          patient_name: newNotif.patientName,
          from_location: newNotif.fromLocation,
          to_location: newNotif.toLocation,
          message: newNotif.message,
          read: false,
        });
      } catch (err) {
        console.error('[SUPABASE] UPDATE redirect patient FAILED:', err);
      }
    }
    setShowRedirectModal(false);
    setRedirectPatient(null);
    setRedirectTargetLocation('');
  };

  const triagedPatients = patients.filter(p => 
    (p.status === 'atendimento' || (p.status === 'atendido' && !attendedPatients.some(a => a.patient.id === p.id))) && 
    !hospitalLocations.some(l => l.currentPatients.includes(p.id))
  ).sort((a, b) => {
    const aTime = a.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'))?.triaged_at || '';
    const bTime = b.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'))?.triaged_at || '';
    return aTime.localeCompare(bTime);
  });
  const patientsInLocations = hospitalLocations.filter(l => l.currentPatients.length > 0);
  const patientsInTreatment = useMemo(() => {
    const result: { patient: Patient; locationName: string; locationId: string }[] = [];
    for (const loc of hospitalLocations) {
      for (const patientId of loc.currentPatients) {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          result.push({ patient, locationName: loc.name, locationId: loc.id });
        }
      }
    }
    return result;
  }, [hospitalLocations, patients]);

  const handleOpenTimeline = async (patient: Patient) => {
    const freshPatient = patientsRef.current.find(p => p.id === patient.id) || patient;
    setTimelinePatient(freshPatient);
    setShowTimelineModal(true);
    setTimelineLoading(true);
    setTimelineAssignments([]);
    try {
      if (supabase) {
        const { data: allAssignments } = await supabase
          .from('patient_location_assignments')
          .select('*, hospital_locations!inner(name)')
          .eq('patient_id', patient.id)
          .order('assigned_at', { ascending: true });
        if (allAssignments && allAssignments.length > 0) {
          setTimelineAssignments(allAssignments.map((a: any) => ({
            locationName: a.hospital_locations?.name || 'Local',
            assignedAt: a.assigned_at,
            completedAt: a.completed_at || null,
          })));
        }
        const { data: freshHistory } = await supabase
          .from('clinical_history')
          .select('*')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: true });
        if (freshHistory && freshHistory.length > 0) {
          setTimelinePatient(prev => prev ? { ...prev, clinicalHistory: freshHistory as any } : prev);
          // Fallback: build assignments from clinical_history if no assignments exist
          if ((!allAssignments || allAssignments.length === 0)) {
            const meds = freshHistory.filter((h: any) => h.type === 'Consulta Médica' && h.location_name);
            if (meds.length > 0) {
              setTimelineAssignments(meds.map((m: any, i: number) => ({
                locationName: m.location_name,
                assignedAt: m.created_at || m.date,
                completedAt: meds[i + 1]?.created_at || null,
              })));
            }
          }
        }
      }
    } catch (err) {
      console.error('[SUPABASE] Load timeline FAILED:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const unreadNotifications = internalNotifications.filter(n => !n.read);

  const filteredPatients = patients.filter(p => {
    const searchVal = patientSearch.toLowerCase();
    const docNum = p.document_number || '';
    const matchesSearch = p.name.toLowerCase().includes(searchVal) || 
                          p.phone.includes(searchVal) ||
                          docNum.includes(searchVal);
    const matchesPriority = filterPriority === 'todos' || p.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const activeWaitingList = patients.filter(p => p.status === 'aguardando');

  return (
    <div className="space-y-6">
      <PermissionGate view="reception" userPermissions={userPermissions}>
        {activeSubmodule === 1 && (
        <div>
          {/* Main Tabs for Module 1 */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold mb-6 gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveReceptionTab('recepcao')}
              className={`flex-1 min-w-[80px] py-2 px-3 rounded-md transition text-center cursor-pointer ${
                activeReceptionTab === 'recepcao' 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Contact className="w-4 h-4 inline mr-1" />
              {t('rcpt_tab_reception', 'app')}
            </button>
            <button
              type="button"
              onClick={() => setActiveReceptionTab('distribuicao')}
              className={`flex-1 min-w-[80px] py-2 px-3 rounded-md transition text-center cursor-pointer ${
                activeReceptionTab === 'distribuicao' 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-1" />
              {t('rcpt_tab_attendances', 'app')}
            </button>
            <button
              type="button"
              onClick={() => setActiveReceptionTab('locais')}
              className={`flex-1 min-w-[80px] py-2 px-3 rounded-md transition text-center cursor-pointer ${
                activeReceptionTab === 'locais' 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 inline mr-1" />
              {t('rcpt_tab_locations', 'app')}
            </button>
            <button
              type="button"
              onClick={() => setActiveReceptionTab('notificacoes')}
              className={`flex-1 min-w-[80px] py-2 px-3 rounded-md transition text-center cursor-pointer relative ${
                activeReceptionTab === 'notificacoes' 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-1" />
              {t('rcpt_tab_notifications', 'app')}
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeReceptionTab === 'recepcao' && (
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
                  {t('rcpt_tab_identification', 'app')}
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
                  {t('rcpt_tab_contact', 'app')}
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
                  {t('rcpt_tab_insurance', 'app')}
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
                  {t('rcpt_tab_guardian', 'app')}
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
                      <p className="font-bold">{t('rcpt_duplicate_title', 'app')}</p>
                      <p className="text-[11px] leading-relaxed">{t('rcpt_duplicate_message', 'app').replace('{doc}', documentNumber).replace('{birthdate}', newBirthdate)}</p>
                      <button
                        type="button"
                        onClick={handleOpenMerge}
                        className="mt-2 text-xs font-bold text-teal-700 bg-white border border-teal-200 rounded px-2.5 py-1 hover:bg-teal-50 cursor-pointer shadow-xs transition"
                      >
                        {t('rcpt_duplicate_merge_button', 'app')}
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_full_name', 'app')}</label>
                      <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        placeholder=""
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_doc_type', 'app')}</label>
                        <select 
                          value={documentType} 
                          onChange={e => setDocumentType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                          required
                        >
                          <option value="">{t('rcpt_select', 'app')}</option>
                          <option value="CI">{t('rcpt_doc_ci', 'app')}</option>
                          <option value="Passaporte">{t('rcpt_doc_passport', 'app')}</option>
                          <option value="RG">{t('rcpt_doc_rg', 'app')}</option>
                          <option value="Outro">{t('rcpt_doc_other', 'app')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_doc_number', 'app')}</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={documentNumber} 
                            onChange={e => setDocumentNumber(e.target.value)}
                            placeholder=""
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
                         <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_birth_date', 'app')}</label>
                        <I18nDatePicker 
                          value={newBirthdate} 
                          onChange={setNewBirthdate}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
                        />
                        {age > 0 && (
                          <span className={`text-[10px] font-bold ${isMinor ? 'text-amber-600' : 'text-slate-500'}`}>
                            {age} {t('rcpt_list_years', 'app')} {isMinor && t('rcpt_list_minor_badge', 'app')}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_birth_location', 'app')}</label>
                        <input 
                          type="text" 
                          value={placeOfBirth} 
                          onChange={e => setPlaceOfBirth(e.target.value)}
                          placeholder=""
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_gender', 'app')}</label>
                        <select 
                          value={newGender} 
                          onChange={e => setNewGender(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
                        >
                          <option value="">{t('rcpt_select', 'app')}</option>
                          <option value="Masculino">{t('rcpt_gender_male', 'app')}</option>
                          <option value="Feminino">{t('rcpt_gender_female', 'app')}</option>
                          <option value="Outro">{t('rcpt_gender_other', 'app')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_nationality', 'app')}</label>
                        <input 
                          type="text" 
                          value={nationality} 
                          onChange={e => setNationality(e.target.value)}
                          placeholder=""
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_civil_status', 'app')}</label>
                        <select 
                          value={civilStatus} 
                          onChange={e => setCivilStatus(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
                        >
                          <option value="">{t('rcpt_select', 'app')}</option>
                          <option value="Solteiro(a)">{t('rcpt_civil_single', 'app')}</option>
                          <option value="Casado(a)">{t('rcpt_civil_married', 'app')}</option>
                          <option value="Divorciado(a)">{t('rcpt_civil_divorced', 'app')}</option>
                          <option value="Viúvo(a)">{t('rcpt_civil_widowed', 'app')}</option>
                          <option value="União Estável">{t('rcpt_civil_union', 'app')}</option>
                        </select>
                      </div>
                    </div>

                    {/* Camera Capture Panel */}
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">{t('rcpt_patient_photo', 'app')}</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-200 overflow-hidden flex items-center justify-center relative">
                          {webcamPlaceholder ? (
                            <img src={webcamPlaceholder} className="w-full h-full object-cover" alt={t('rcpt_alt_patient_capture', 'app')} />
                          ) : (
                            <User className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          {isCameraActive ? (
                            <div className="relative w-full max-w-xs">
                              <video 
                                ref={videoRef} 
                                className="w-full rounded-lg" 
                                autoPlay 
                                playsInline 
                                muted
                              />
                              {cameraCountdown !== null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                  <span className="text-4xl font-bold text-white">{cameraCountdown}</span>
                                </div>
                              )}
                              <button type="button" onClick={stopCamera} className="mt-1 text-xs text-red-500 hover:text-red-700 font-semibold">{t('rcpt_cancel', 'app')}</button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={handleSimulateWebcam}
                                className="w-full py-2 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-lg flex items-center justify-center gap-2 border border-teal-200 transition">
                                <Camera className="w-4 h-4" /> {t('rcpt_capture_camera', 'app')}
                              </button>
                              <label className="w-full py-2 px-4 bg-slate-200 hover:bg-slate-300 border border-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer text-slate-700 transition text-center">
                                <Upload className="w-4 h-4" />
                                {t('rcpt_upload_file', 'app')}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handlePhotoUpload} 
                                />
                              </label>
                            </>
                          )}
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
                        label={t('rcpt_phone', 'app')}
                        required
                        allowEmpty
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
                          {whatsappVerified ? t('rcpt_whatsapp_verified', 'app') : t('rcpt_whatsapp_validate', 'app')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        E-mail *
                        {!isEmailValid && (
                          <span className="text-rose-500 font-semibold text-[10px]">{t('rcpt_label_invalid', 'app')}</span>
                        )}
                      </label>
                      <input 
                        type="email" 
                        value={newEmail} 
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder=""
                        className={`w-full p-2.5 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans ${
                          !isEmailValid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                        required
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs pb-1 border-b border-slate-200">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span>{t('rcpt_address', 'app')}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_department', 'app')}</label>
                          <input 
                            type="text" 
                            value={addressDepartment} 
                            onChange={e => setAddressDepartment(e.target.value)}
                            placeholder=""
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_district', 'app')}</label>
                          <input 
                            type="text" 
                            value={addressDistrict} 
                            onChange={e => setAddressDistrict(e.target.value)}
                            placeholder=""
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_city', 'app')}</label>
                          <input 
                            type="text" 
                            value={addressCity} 
                            onChange={e => setAddressCity(e.target.value)}
                            placeholder=""
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_neighborhood', 'app')}</label>
                          <input 
                            type="text" 
                            value={addressNeighborhood} 
                            onChange={e => setAddressNeighborhood(e.target.value)}
                            placeholder=""
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_street', 'app')}</label>
                          <input 
                            type="text" 
                            value={addressStreet} 
                            onChange={e => setAddressStreet(e.target.value)}
                            placeholder=""
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_label_number', 'app')}</label>
                          <input 
                            type="text" 
                            value={addressNumber} 
                            onChange={e => setAddressNumber(e.target.value)}
                            placeholder=""
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
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_label_blood_type', 'app')}</label>
                        <select 
                          value={bloodType} 
                          onChange={e => setBloodType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                          required
                        >
                          <option value="">{t('rcpt_select', 'app')}</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="Não Informado">{t('rcpt_blood_not_informed', 'app')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_label_preferred_language', 'app')}</label>
                        <select 
                          value={preferredLanguage} 
                          onChange={e => setPreferredLanguage(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required
                        >
                          <option value="">{t('rcpt_select', 'app')}</option>
                          <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                          <option value="pt-PT">🇵🇹 Português (Portugal)</option>
                          <option value="es-AR">🇦🇷 Español (Argentina)</option>
                          <option value="es-PY">🇵🇾 Español (Paraguay)</option>
                          <option value="es">🇪🇸 Español (Geral)</option>
                          <option value="gn">🇵🇾 {t('rcpt_lang_gn', 'app')}</option>
                          <option value="en">🇺🇸 English (US/UK)</option>
                          <option value="outros">{t('rcpt_lang_other', 'app')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_allergies', 'app')} *</label>
                      <textarea 
                        value={allergies} 
                        onChange={e => setAllergies(e.target.value)}
                        placeholder=""
                        rows={2}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                        required
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs pb-1 border-b border-slate-200">
                        <HeartPulse className="w-4 h-4 text-teal-600" />
                        <span>{t('rcpt_insurance_type', 'app')}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_insurance_type', 'app')} *</label>
                          <select 
                            value={healthInsuranceType} 
                            onChange={e => setHealthInsuranceType(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            required
                          >
                            <option value="">{t('rcpt_select', 'app')}</option>
                            <option value="Particular">{t('rcpt_insurance_particular', 'app')}</option>
                            <option value="IPS">{t('rcpt_insurance_ips', 'app')}</option>
                            <option value="Sanidade Militar">{t('rcpt_insurance_military', 'app')}</option>
                            <option value="Sanidade Policial">{t('rcpt_insurance_police', 'app')}</option>
                            <option value="Pré-paga">{t('rcpt_insurance_prepaid', 'app')}</option>
                            <option value="Seguro Privado">{t('rcpt_insurance_international', 'app')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_insurance_number', 'app')} *</label>
                          <input 
                            type="text" 
                            value={healthInsuranceNumber} 
                            onChange={e => setHealthInsuranceNumber(e.target.value)}
                            placeholder=""
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                            disabled={healthInsuranceType === 'Particular'}
                            required={healthInsuranceType !== 'Particular'}
                          />
                        </div>
                      </div>

                      {healthInsuranceType === 'Pré-paga' && (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_label_insurance_company', 'app')}</label>
                          <input 
                            type="text" 
                            value={healthInsuranceCompany} 
                            onChange={e => setHealthInsuranceCompany(e.target.value)}
                            placeholder=""
                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs font-sans focus:outline-teal-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">{t('rcpt_label_employer', 'app')}</label>
                        <input 
                          type="text" 
                          value={employer} 
                          onChange={e => setEmployer(e.target.value)}
                          placeholder=""
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
                          {t('rcpt_label_minor_warning', 'app').replace('{age}', String(age))}
                          <br />
                          {t('rcpt_form_minor_text', 'app').split('obrigatório')[0]} <span className="font-black">obrigatório</span> {t('rcpt_form_minor_text', 'app').split('obrigatório para')[1] || ''}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mb-2">
                        {t('rcpt_form_adult_optional', 'app')}
                      </p>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_guardian_name', 'app')} {isMinor && '*'}</label>
                      <input 
                        type="text" 
                        value={guardianName} 
                        onChange={e => setGuardianName(e.target.value)}
                        placeholder=""
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                        required={isMinor}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_guardian_doc_type', 'app')} {isMinor && '*'}</label>
                        <select 
                          value={guardianDocumentType} 
                          onChange={e => setGuardianDocumentType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                          required={isMinor}
                        >
                          <option value="">{t('rcpt_select', 'app')}</option>
                          <option value="CI">{t('rcpt_doc_ci', 'app')}</option>
                          <option value="Passaporte">{t('rcpt_doc_passport', 'app')}</option>
                          <option value="RG">{t('rcpt_doc_rg', 'app')}</option>
                          <option value="Outro">{t('rcpt_doc_other', 'app')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_guardian_doc_number', 'app')} {isMinor && '*'}</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={guardianDocument} 
                            onChange={e => setGuardianDocument(e.target.value)}
                            placeholder={t('rcpt_label_number', 'app').replace(' *', '')} 
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_phone', 'app')}</label>
                      <input 
                        type="tel" 
                        value={guardianPhone} 
                        onChange={e => setGuardianPhone(e.target.value)}
                        placeholder="" 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('rcpt_guardian_relationship', 'app')} {isMinor && '*'}</label>
                      <select 
                        value={guardianRelationship} 
                        onChange={e => setGuardianRelationship(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans text-xs"
                        required={isMinor}
                      >
                        <option value="">{t('rcpt_guardian_select_vinculo', 'app')}</option>
                        <option value="Pai">{t('rcpt_guardian_father', 'app')}</option>
                        <option value="Mãe">{t('rcpt_guardian_mother', 'app')}</option>
                        <option value="Tutor Legal">{t('rcpt_guardian_legal', 'app')}</option>
                        <option value="Cônjuge">{t('rcpt_guardian_spouse', 'app')}</option>
                        <option value="Filho(a)">{t('rcpt_guardian_child', 'app')}</option>
                        <option value="Outros">{t('rcpt_guardian_other', 'app')}</option>
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
                      <ChevronLeft className="w-4 h-4" /> {t('rcpt_previous', 'app')}
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
                      {t('rcpt_next', 'app')} <ChevronRight className="w-4 h-4" />
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
                        <><Check className="w-4 h-4" /> {t('rcpt_label_save_edit', 'app')}</>
                      ) : (
                        <><Plus className="w-4 h-4" /> {t('rcpt_admit_triage', 'app')}</>
                      )}
                    </button>
                  )}
                </div>

              </form>
            </div>

            {/* Compliance Footer */}
            <div className="mt-6 pt-3 border-t border-slate-100/70 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{t('rcpt_label_encrypted', 'app')}</span>
            </div>

          </div>
 
          {/* Fila de Triagem / Recepção Geral */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md lg:col-span-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Contact className="w-5 h-5 text-teal-600 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-base">{t('rcpt_triage_queue', 'app')}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {t('rcpt_queue_total', 'app')}: {patients.length}
                </span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 animate-pulse">
                  {t('rcpt_triage_queue', 'app')}: {activeWaitingList.length} {t('rcpt_queue_waiting', 'app')}
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
                  placeholder={t('rcpt_search_patient', 'app')}
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
                  <option value="todos">{t('rcpt_all_priorities', 'app')}</option>
                  <option value="normal">{t('rcpt_priority_normal', 'app')}</option>
                  <option value="preferencial">{t('rcpt_priority_preferential', 'app')}</option>
                  <option value="emergência">{t('rcpt_priority_emergency', 'app')}</option>
                </select>
              </div>
            </div>

            {/* Lista dos Pacientes Cadastrados */}
            <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {t('rcpt_list_empty', 'app')}
                </div>
              ) : (
                filteredPatients.map(p => {
                  const pAge = p.birthdate ? new Date().getFullYear() - new Date(p.birthdate).getFullYear() : 30;
                  const pIsMinor = pAge < 18;
                  
                  return (
                    <div key={p.id} data-testid={`patient-card-${p.id}`} className="p-4 bg-white hover:shadow-md border border-slate-200/80 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all duration-200 text-sm shadow-sm">
                      <div className="flex-1 flex flex-col gap-2.5">
                        {p.priority === 'emergência' && (
                          <span className="self-start px-3 py-1 bg-rose-100 text-rose-800 text-[11px] font-black uppercase rounded-lg border border-rose-200 animate-pulse flex items-center gap-1">
                            {t('rcpt_priority_emergency', 'app')}
                          </span>
                        )}
                        {p.priority === 'preferencial' && (
                          <span className="self-start px-3 py-1 bg-amber-50 text-amber-700 text-[11px] font-black uppercase rounded-lg border border-amber-200 flex items-center gap-1.5 shadow-sm">
                            <span className="text-amber-500">⭐</span> {t('rcpt_priority_preferential', 'app')}
                          </span>
                        )}
                        {p.priority === 'normal' && (
                          <span className="self-start px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase rounded-lg border border-slate-200">
                            {t('rcpt_priority_normal', 'app')}
                          </span>
                        )}
                        {pIsMinor && (
                          <span className="self-start px-3 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase rounded-lg border border-indigo-200">
                            {t('rcpt_list_minor_badge', 'app')}
                          </span>
                        )}
                        
                        <div className="text-[12px] text-slate-700 space-y-0.5 leading-relaxed">
                          <p><span className="text-slate-500 font-medium">{t('rcpt_list_full_name', 'app')}</span> <span className="font-bold text-slate-800">{p.name}</span></p>
                          <p><span className="text-slate-500 font-medium">{t('rcpt_list_birth_date', 'app')}</span> <span className="font-semibold">{p.birthdate ? new Date(p.birthdate).toLocaleDateString(locale) : '—'} {pAge ? `(${pAge} ${t('rcpt_list_years', 'app')})` : ''}</span></p>
                          <p><span className="text-slate-500 font-medium">{t('rcpt_list_gender', 'app')}</span> <span className="font-semibold">{p.gender === 'Masculino' ? t('rcpt_gender_male', 'app') : p.gender === 'Feminino' ? t('rcpt_gender_female', 'app') : p.gender === 'Outro' ? t('rcpt_gender_other', 'app') : p.gender || '—'}</span></p>
                          <p><span className="text-slate-500 font-medium">{t('rcpt_merge_phone_label', 'app')}</span> <span className="font-semibold">{p.phone}</span> {p.whatsapp_verified && <span className="text-green-600 font-bold text-[10px]">{t('rcpt_whatsapp_badge', 'app')}</span>}</p>
                          {p.blood_type && p.blood_type !== 'Não Informado' && (
                            <p><span className="text-slate-500 font-medium">{t('rcpt_list_blood_type', 'app')}</span> <span className="font-bold text-rose-600">{p.blood_type}</span></p>
                          )}
                          {p.preferred_language && (
                            <p><span className="text-slate-500 font-medium">{t('rcpt_list_pref_language', 'app')}</span> <span className="font-semibold">{p.preferred_language === 'es' ? 'Español' : p.preferred_language === 'es-AR' ? 'Español (Argentina)' : p.preferred_language === 'es-PY' ? 'Español (Paraguay)' : p.preferred_language === 'gn' ? 'Guaraní' : p.preferred_language === 'pt-BR' ? 'Português (Brasil)' : p.preferred_language === 'pt-PT' ? 'Português (Portugal)' : p.preferred_language === 'en' ? 'English' : p.preferred_language === 'outros' ? 'Outros' : p.preferred_language}</span></p>
                          )}
                          {p.allergies && (
                            <p><span className="text-slate-500 font-medium">{t('rcpt_list_allergies', 'app')}</span> <span className="font-semibold">{p.allergies}</span></p>
                          )}
                          {p.health_insurance_type && (
                            <p><span className="text-slate-500 font-medium">{t('rcpt_list_insurance', 'app')}</span> <span className="font-semibold">{p.health_insurance_type === 'Particular' ? t('rcpt_insurance_particular', 'app') : p.health_insurance_type === 'IPS' ? t('rcpt_insurance_ips', 'app') : p.health_insurance_type === 'Sanidade Militar' ? t('rcpt_insurance_military', 'app') : p.health_insurance_type === 'Sanidade Policial' ? t('rcpt_insurance_police', 'app') : p.health_insurance_type === 'Pré-paga' ? t('rcpt_insurance_prepaid', 'app') : p.health_insurance_type === 'Seguro Privado' ? t('rcpt_insurance_international', 'app') : p.health_insurance_type}</span></p>
                          )}
                          {pIsMinor && p.guardian_name && (
                            <p><span className="text-slate-500 font-medium">{t('rcpt_list_guardian', 'app')}</span> <span className="font-semibold">{p.guardian_name} ({p.guardian_relationship})</span></p>
                          )}
                        </div>

                        {p.status === 'aguardando' && (
                          <div className="flex items-center gap-2 mt-1 pt-1">
                            <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center gap-1">
                              <Clock className="w-3" /> {t('rcpt_list_waiting_triage', 'app')}
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
                                setTriagePriorityLevel('green');
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
                              className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold shadow-sm transition cursor-pointer flex items-center gap-1"
                            >
                              <HeartPulse className="w-3.5 h-3.5 text-white animate-pulse" />
                              {t('rcpt_list_perform_triage', 'app')}
                            </button>
                          </div>
                        )}

                        {p.status === 'triado' && (
                          <div className="flex items-center gap-2 mt-1 pt-1">
                            <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                              <Clock className="w-3" /> {t('rcpt_list_triaged', 'app')}
                            </span>
                            <button
                              onClick={() => handleUpdatePatientStatus(p.id, 'atendimento')}
                              data-testid="liberar"
                              className="bg-slate-700 hover:bg-slate-800 text-white text-[11px] px-3 py-1.5 rounded-lg font-semibold shadow-xs transition cursor-pointer"
                            >
                              {t('rcpt_list_released', 'app')}
                            </button>
                          </div>
                        )}

                        {p.status === 'atendimento' && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] font-bold px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3" /> {t('rcpt_attendance_completed', 'app')}
                            </span>
                            {p.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'))?.triaged_at && (
                              <span className="text-[11px] font-bold text-teal-600">
                                {t('rcpt_triage_label', 'app')} {new Date(p.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'))?.triaged_at || '').toLocaleString(locale)}
                              </span>
                            )}
                          </div>
                        )}

                        {p.status === 'atendido' && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] font-bold px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3" /> {t('rcpt_attendance_completed', 'app')}
                            </span>
                            {p.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'))?.triaged_at && (
                              <span className="text-[11px] font-bold text-teal-600">
                                {t('rcpt_triage_label', 'app')} {new Date(p.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'))?.triaged_at || '').toLocaleString(locale)}
                              </span>
                            )}
                          </div>
                        )}

                        {p.status === 'agendado' && (
                          <div className="flex items-center gap-2 mt-1 pt-1">
                            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
                              <CalendarDays className="w-3" /> {t('rcpt_list_scheduled', 'app')}
                            </span>
                            <button
                              onClick={() => handleUpdatePatientStatus(p.id, 'aguardando')}
                              data-testid="check-in"
                              className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] px-3 py-1.5 rounded-lg font-semibold shadow-xs transition cursor-pointer"
                            >
                              {t('rcpt_list_check_in', 'app')}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="w-20 h-20 rounded-xl border-2 border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-md">
                          {p.photo_url ? (
                            <img src={p.photo_url} className="w-full h-full object-cover" alt={t('rcpt_alt_profile', 'app')} />
                          ) : (
                            <User className="w-10 h-10 text-slate-300" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditPatient(p)}
                            data-testid="edit-patient"
                            className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-lg font-semibold shadow-sm transition cursor-pointer flex items-center justify-center"
                            title={t('rcpt_list_edit_patient', 'app')}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(p.id, p.name)}
                            data-testid="delete-patient"
                            className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-lg font-semibold shadow-sm transition cursor-pointer flex items-center justify-center"
                            title={t('rcpt_list_delete_patient', 'app')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
                    </div>
                  </div>
                </div>
          )}

          {/* --- DISTRIBUIÇÃO TAB --- */}
          {activeReceptionTab === 'distribuicao' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1: Fila de Triagem + Atendidos */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md">
              {/* Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold mb-4 gap-1">
                <button
                  onClick={() => setTriageTab('aguardando')}
                  className={`flex-1 py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
                    triageTab === 'aguardando' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('rcpt_attendance_waiting', 'app')} ({triagedPatients.length})
                </button>
                <button
                  onClick={() => setTriageTab('em_atendimento')}
                  className={`flex-1 py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
                    triageTab === 'em_atendimento' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('rcpt_attendance_consultation', 'app')} ({patientsInTreatment.length})
                </button>
                <button
                  onClick={() => setTriageTab('atendidos')}
                  className={`flex-1 py-1.5 px-2 rounded-md transition text-center cursor-pointer ${
                    triageTab === 'atendidos' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('rcpt_attendance_attended', 'app')} ({attendedPatients.length})
                </button>
              </div>

              {/* Aba: Aguardando Direcionamento */}
              {triageTab === 'aguardando' && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {triagedPatients.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_no_patients_waiting', 'app')}</p>
                ) : triagedPatients.map(p => {
                  const triage = p.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                  const triagedAt = triage?.triaged_at;
                  const age = p.birthdate ? Math.floor((Date.now() - new Date(p.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
                  return (
                  <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-2">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                          {p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-slate-800 truncate">{p.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-1 ${
                            p.priority === 'emergência' ? 'bg-red-100 text-red-700' :
                            p.priority === 'preferencial' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {p.priority === 'emergência' ? t('rcpt_priority_emergency', 'app') : p.priority === 'preferencial' ? t('rcpt_priority_preferential', 'app') : t('rcpt_priority_normal', 'app')}
                          </span>
                        </div>
                        {p.birthdate && (
                          <p className="text-[11px] text-slate-500">
                            {new Date(p.birthdate).toLocaleDateString(locale)} {age !== null && `| ${age} ${t('rcpt_list_years', 'app')}`}
                          </p>
                        )}
                        {p.document_number && (
                          <p className="text-[11px] text-slate-500">
                            {p.document_type || t('rcpt_doc_ci', 'app')}: {p.document_number}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          {p.phone}
                          {p.whatsapp_verified && <span className="text-green-500 font-bold">{t('rcpt_whatsapp_badge', 'app')}</span>}
                        </p>
                        {p.blood_type && p.blood_type !== 'Não Informado' && (
                          <p className="text-[11px] text-slate-500">
                            {t('rcpt_list_blood_type', 'app')}: <span className="font-semibold">{p.blood_type}</span>
                          </p>
                        )}
                        {triagedAt && (
                          <p className="text-[10px] text-teal-600 font-semibold mt-1">
                            {t('rcpt_triage_label', 'app')} {new Date(triagedAt).toLocaleString(locale)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { setDistributePatient(p); setShowDistributeModal(true); }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ChevronRight className="w-3 h-3" /> {t('rcpt_distribute', 'app')}
                    </button>
                  </div>
                  );
                })}
              </div>
              )}

              {/* Aba: Consulta / Intervenção (em atendimento nos locais) */}
              {triageTab === 'em_atendimento' && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {patientsInTreatment.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_dist_no_in_treatment', 'app')}</p>
                ) : patientsInTreatment.map((item, idx) => {
                  const triage = item.patient.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                  const triagedAt = triage?.triaged_at;
                  return (
                  <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-800">{item.patient.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {t('rcpt_dist_in_treatment', 'app')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{item.patient.phone}</p>
                    {triagedAt && (
                      <p className="text-[10px] text-amber-600 font-semibold mb-1">
                        {t('rcpt_triage_label', 'app')} {new Date(triagedAt).toLocaleString(locale)}
                      </p>
                    )}
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">{item.locationName}</span>
                    </p>
                    <button
                      onClick={() => { setSelectedLocation(hospitalLocations.find(l => l.id === item.locationId) || null); setShowLocationDetail(true); }}
                      className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ChevronRight className="w-3 h-3" /> {t('rcpt_dist_view_details', 'app')}
                    </button>
                  </div>
                  );
                })}
              </div>
              )}

              {/* Aba: Atendidos */}
              {triageTab === 'atendidos' && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {attendedPatients.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_dist_no_visits', 'app')}</p>
                ) : [...attendedPatients].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).map((item, idx) => {
                  const triage = item.patient.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                  const triagedAt = triage?.triaged_at;
                  return (
                  <div 
                    key={idx} 
                    onClick={() => handleOpenTimeline(item.patient)}
                    className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-800">{item.patient.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        {t('rcpt_dist_attended', 'app')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{item.patient.phone}</p>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">{item.locationName}</span>
                    </p>
                    {triagedAt && (
                      <p className="text-[10px] text-green-600 font-semibold mt-1">
                        {t('rcpt_triage_label', 'app')} {new Date(triagedAt).toLocaleString(locale)}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(item.completedAt).toLocaleString(locale)}
                    </p>
                  </div>
                  );
                })}
              </div>
              )}
            </div>

            {/* Coluna 2: Locais Hospitalares */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md lg:col-span-2">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-base">{t('rcpt_locations_title', 'app')}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...hospitalLocations].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })).map(loc => (
                  <div 
                    key={loc.id} 
                    onClick={() => { if (loc.capacity > 1 || loc.currentPatients.length > 0) { setSelectedLocation(loc); setShowLocationDetail(true); } }}
                    className={`border rounded-xl p-4 transition ${
                      loc.status === 'manutencao' ? 'bg-slate-100 border-slate-300 opacity-60' :
                      loc.currentPatients.length >= loc.capacity ? 'bg-red-50 border-red-200' :
                      loc.currentPatients.length > 0 ? 'bg-amber-50 border-amber-200' :
                      'bg-green-50 border-green-200'
                    } ${loc.capacity > 1 ? 'cursor-pointer hover:shadow-md' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{locationTypeIcon[loc.type]}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        loc.status === 'manutencao' ? 'bg-slate-200 text-slate-600' :
                        loc.currentPatients.length >= loc.capacity ? 'bg-red-100 text-red-700' :
                        loc.currentPatients.length > 0 ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                         {loc.status === 'manutencao' ? t('rcpt_loc_maintenance', 'app') :
                         loc.currentPatients.length >= loc.capacity ? t('rcpt_loc_occupied', 'app') :
                         loc.currentPatients.length > 0 ? t('rcpt_loc_attending', 'app') : t('rcpt_loc_free', 'app')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">{loc.name}</h4>
                    <p className="text-[10px] text-slate-500 mb-2">{locationTypeLabel[loc.type]}</p>
                    <p className="text-xs text-slate-600 mb-3">
                      {t('rcpt_loc_queue', 'app')}: <span className="font-bold">{loc.currentPatients.length}</span> / {loc.capacity}
                    </p>

                    {/* Capacidade 1: indicador de paciente */}
                    {loc.capacity === 1 && loc.currentPatients.length > 0 && (
                      <div className="mb-3 bg-white/60 rounded-lg px-3 py-2 border border-white/50">
                        <p className="text-[10px] text-slate-500">
                          1 paciente — <span className="text-teal-600 font-semibold">{t('rcpt_locations_n_patients', 'app').split('{count}')[1] ? t('rcpt_dist_view_details', 'app') : ''}</span>
                        </p>
                      </div>
                    )}

                    {/* Capacidade > 1: indicador de pacientes */}
                    {loc.capacity > 1 && loc.currentPatients.length > 0 && (
                      <div className="mb-3 bg-white/60 rounded-lg px-3 py-2 border border-white/50">
                        <p className="text-[10px] text-slate-500">
                          {loc.currentPatients.length} paciente{loc.currentPatients.length > 1 ? 's' : ''} — <span className="text-teal-600 font-semibold">{t('rcpt_locations_n_patients', 'app').split('{count}')[1] ? t('rcpt_dist_view_details', 'app') : ''}</span>
                        </p>
                      </div>
                    )}

                    {loc.capacity === 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCallNextPatient(loc.id); }}
                      disabled={loc.status === 'manutencao' || triagedPatients.length === 0 || loc.currentPatients.length >= loc.capacity}
                      className={`w-full text-xs font-bold py-1.5 rounded-lg transition cursor-pointer ${
                        loc.status === 'manutencao' || triagedPatients.length === 0 || loc.currentPatients.length >= loc.capacity
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      {t('rcpt_locations_call_next', 'app')}
                    </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* --- LOCAIS TAB (CRUD) --- */}
          {activeReceptionTab === 'locais' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-base">{t('rcpt_location_registration', 'app')}</h3>
              </div>
              <button
                onClick={() => { setEditingLocation(null); setNewLocationForm({ name: '', type: 'consultorio', capacity: 1 }); setShowNewLocationModal(true); }}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> {t('rcpt_modal_new', 'app')} Local
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...hospitalLocations].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })).map(loc => (
                <div key={loc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{locationTypeIcon[loc.type]}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingLocation(loc); setNewLocationForm({ name: loc.name, type: loc.type, capacity: loc.capacity }); setShowNewLocationModal(true); }}
                        className="text-blue-500 hover:text-blue-700 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{loc.name}</h4>
                  <p className="text-[10px] text-slate-500">{locationTypeLabel[loc.type]}</p>
                  <p className="text-xs text-slate-600 mt-1">{t('rcpt_location_capacity_label', 'app')} {loc.capacity}</p>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* --- NOTIFICAÇÕES TAB --- */}
          {activeReceptionTab === 'notificacoes' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-base">{t('rcpt_internal_notifications', 'app')}</h3>
                {unreadNotifications.length > 0 && (
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{unreadNotifications.length} {t('rcpt_notif_unread', 'app')}</span>
                )}
              </div>
              {internalNotifications.length > 0 && (
                <button
                  onClick={async () => {
                    setInternalNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    if (supabase) {
                      try {
                        await supabase.from('internal_notifications').update({ read: true }).eq('read', false);
                      } catch (err) {
                        console.error('[SUPABASE] UPDATE notifications read FAILED:', err);
                      }
                    }
                  }}
                  className="text-xs text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
                >
                  {t('rcpt_notif_mark_all_read', 'app')}
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {internalNotifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_notif_none', 'app')}</p>
              ) : internalNotifications.map(n => (
                <div key={n.id} className={`border rounded-lg p-3 transition ${
                  n.read ? 'bg-blue-50/40 border-blue-100' : 'bg-blue-100 border-blue-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-800">{n.patientName}</span>
                    <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString(locale)}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">{n.fromLocation}</span> → <span className="font-semibold">{n.toLocation}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{t('rcpt_notif_patient', 'app')} {n.patientName} {t('rcpt_notif_redirected_to', 'app')} {n.toLocation}</p>
                </div>
              ))}
            </div>
          </div>
          )}

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
                  <h3 className="font-bold text-slate-800 text-lg">{t('rcpt_merge_title', 'app')}</h3>
                  <p className="text-xs text-slate-500">
                    {t('rcpt_modal_merge_desc', 'app')}
                  </p>
                </div>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* 1. Ficha {t('rcpt_modal_existing', 'app')} */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-black text-slate-700 uppercase">{t('rcpt_modal_record1', 'app')}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">ID: {duplicatePatient.id}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('rcpt_merge_name', 'app')}</span>
                      <span className="font-bold">{duplicatePatient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Doc ({duplicatePatient.document_type}):</span>
                      <span className="font-bold">{duplicatePatient.document_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('rcpt_merge_phone_label', 'app')}</span>
                      <span className="font-bold">{duplicatePatient.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('rcpt_merge_email_label', 'app')}</span>
                      <span className="font-bold">{duplicatePatient.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('rcpt_merge_address', 'app')}</span>
                      <span className="font-bold text-right max-w-[200px]">
                        {duplicatePatient.address_street || 'N/A'}, {duplicatePatient.address_number || ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('rcpt_merge_insurance', 'app')}</span>
                      <span className="font-bold">{duplicatePatient.health_insurance_type || 'Particular'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('rcpt_merge_allergies_label', 'app')}</span>
                      <span className="font-semibold text-rose-600">{duplicatePatient.allergies || 'Nenhuma'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Nova Ficha / Mesclar Opções */}
                <div className="p-4 bg-teal-50/30 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-teal-200 pb-2">
                    <span className="font-black text-teal-800 uppercase">{t('rcpt_modal_values_to_save', 'app')}</span>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded">{t('rcpt_modal_select_to_keep', 'app')}</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Select Nome */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">{t('rcpt_list_full_name', 'app')}</span>
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
                      <span className="text-[10px] text-slate-500 font-bold">{t('rcpt_merge_phone_label', 'app')}</span>
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
                      <span className="text-[10px] text-slate-500 font-bold">{t('rcpt_merge_address', 'app')}</span>
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
                          <span>{t('rcpt_modal_existing', 'app')} ({duplicatePatient.address_city || 'N/A'})</span>
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
                            <span className="text-teal-700 font-semibold">{t('rcpt_modal_new', 'app')} ({addressCity})</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Select Convênio */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">{t('rcpt_merge_insurance_label', 'app')}</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                          <input type="radio" checked={mergeSelections.health_insurance_type === duplicatePatient.health_insurance_type} onChange={() => setMergeSelections(prev => ({
                            ...prev, 
                            health_insurance_type: duplicatePatient.health_insurance_type,
                            health_insurance_number: duplicatePatient.health_insurance_number,
                            health_insurance_company: duplicatePatient.health_insurance_company,
                          }))} />
                          <span>{t('rcpt_modal_existing', 'app')} ({duplicatePatient.health_insurance_type})</span>
                        </label>
                        {healthInsuranceType !== duplicatePatient.health_insurance_type && (
                          <label className="flex items-center gap-1 bg-white border px-2 py-1 rounded flex-1">
                            <input type="radio" checked={mergeSelections.health_insurance_type === healthInsuranceType} onChange={() => setMergeSelections(prev => ({
                              ...prev, 
                              health_insurance_type: healthInsuranceType,
                              health_insurance_number: healthInsuranceNumber,
                              health_insurance_company: healthInsuranceCompany,
                            }))} />
                            <span className="text-teal-700 font-semibold">{t('rcpt_modal_new', 'app')} ({healthInsuranceType})</span>
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
                  <span>{t('rcpt_merge_supervisor_auth', 'app')}</span>
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
                    placeholder={t('rcpt_overbook_pin_placeholder', 'app')}
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
                  {t('rcpt_cancel', 'app')} Fusão
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMerge}
                  className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('rcpt_merge_authorize_button', 'app')}
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
                  <h3 className="font-extrabold text-slate-800 text-base">{t('rcpt_overbook_title', 'app')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('rcpt_overbook_description', 'app')}</p>
                </div>
              </div>

              {/* Conflict details */}
              {pendingAppointmentData && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
                  <p className="font-bold text-amber-800 mb-1">{t('rcpt_overbook_reasons', 'app')}</p>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('rcpt_overbook_reason_label', 'app')}</label>
                  <textarea
                    value={overturnReason}
                    onChange={e => { setOverturnReason(e.target.value); setOverturnPinError(''); }}
                    placeholder={t('rcpt_triage_chief_complaint_placeholder', 'app')}
                    rows={3}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-amber-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('rcpt_overbook_pin_label', 'app')}</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={overturnPin}
                    onChange={e => { setOverturnPin(e.target.value); setOverturnPinError(''); }}
                    placeholder={t('rcpt_ph_pin', 'app')}
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
                  {t('rcpt_cancel', 'app')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOverturn}
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                >
                  <KeyRound className="w-4 h-4" />
                  {t('rcpt_overbook_authorize_button', 'app')}
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
                    <h3 className="font-extrabold text-slate-800 text-base">{t('rcpt_triage_title', 'app')}</h3>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('rcpt_main_complaint', 'app')} *</label>
                    <textarea
                      value={triageReason}
                      onChange={e => setTriageReason(e.target.value)}
                      placeholder={t('rcpt_triage_chief_complaint_placeholder', 'app')}
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                    />
                  </div>

                  {/* Sinais Vitais */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-rose-500" />
                        <span>{t('rcpt_vital_signs', 'app')}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{vitalsLimits.label}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* Weight */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_weight', 'app')}</label>
                        <input
                          type="text"
                          value={triageWeight}
                          onChange={e => {
                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                            const dotCount = (raw.match(/\./g) || []).length;
                            if (dotCount > 1) return;
                            setTriageWeight(raw);
                          }}
                          placeholder={t('rcpt_ph_weight', 'app')}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans font-bold"
                        />
                      </div>
                      {/* Height */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_height', 'app')}</label>
                        <input
                          type="number"
                          value={triageHeight}
                          onChange={e => setTriageHeight(e.target.value)}
                          placeholder={t('rcpt_ph_height', 'app')}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans font-bold"
                        />
                      </div>
                      {/* BMI (auto-calculated) */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_bmi', 'app')}</label>
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
                                const label = bmi < 18.5 ? t('rcpt_triage_bmi_underweight', 'app') : bmi < 25 ? t('rcpt_triage_bmi_normal', 'app') : bmi < 30 ? t('rcpt_triage_bmi_overweight', 'app') : t('rcpt_triage_bmi_obese', 'app');
                                return `${bmi.toFixed(1)} — ${label}`;
                              })()
                            : t('rcpt_triage_bmi_info', 'app')
                          }
                        </div>
                      </div>
                      {/* Blood pressure */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_blood_pressure', 'app')}</label>
                        <input
                          type="text"
                          value={triageBP}
                          onChange={e => {
                            const raw = e.target.value.replace(/[^0-9/]/g, '');
                            const slashCount = (raw.match(/\//g) || []).length;
                            if (slashCount > 1) return;
                            setTriageBP(raw);
                          }}
                          placeholder={t('rcpt_ph_bp', 'app')}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                        {triageBP && (() => {
                          const parts = triageBP.split('/');
                          const systolic = parseInt(parts[0]);
                          const diastolic = parseInt(parts[1]);
                          if (!isNaN(systolic)) {
                            if (vitalsLimits.pa.red(systolic) || (!isNaN(diastolic) && diastolic > 120)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {t('rcpt_triage_bp_critical_low', 'app')}</p>;
                            }
                            if (vitalsLimits.pa.orange(systolic)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> {t('rcpt_triage_bp_abnormal', 'app')}</p>;
                            }
                            if (vitalsLimits.pa.yellow(systolic) || (!isNaN(diastolic) && diastolic >= 90 && diastolic <= 119)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {t('rcpt_triage_bp_elevated', 'app')}</p>;
                            }
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {t('rcpt_triage_status_normal', 'app')}</p>;
                          }
                          return null;
                        })()}
                      </div>
                      {/* Temperature */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_temperature', 'app')}</label>
                        <input
                          type="text"
                          value={triageTemp}
                          onChange={e => {
                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                            const dotCount = (raw.match(/\./g) || []).length;
                            if (dotCount > 1) return;
                            setTriageTemp(raw);
                          }}
                          placeholder={t('rcpt_ph_temp', 'app')}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                        {triageTemp && (() => {
                          const temp = parseFloat(triageTemp);
                          if (!isNaN(temp)) {
                            if (vitalsLimits.temp.orange(temp)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> {t('rcpt_triage_temp_orange', 'app')}</p>;
                            }
                            if (vitalsLimits.temp.yellow(temp)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {t('rcpt_triage_temp_yellow', 'app')}</p>;
                            }
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {t('rcpt_triage_status_normal', 'app')}</p>;
                          }
                          return null;
                        })()}
                      </div>
                      {/* SpO2 */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_spo2', 'app')}</label>
                        <input
                          type="number"
                          value={triageSpo2}
                          onChange={e => setTriageSpo2(e.target.value)}
                          placeholder={t('rcpt_ph_spo2', 'app')}
                          min={60}
                          max={100}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                        {triageSpo2 && (() => {
                          const spo2 = Number(triageSpo2);
                          if (vitalsLimits.spo2.red(spo2)) {
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {t('rcpt_triage_spo2_critical', 'app')}</p>;
                          }
                          if (vitalsLimits.spo2.orange(spo2)) {
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> {t('rcpt_triage_spo2_low', 'app')}</p>;
                          }
                          return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {t('rcpt_triage_spo2_normal', 'app')}</p>;
                        })()}
                      </div>
                      {/* Heart rate */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_heart_rate', 'app')}</label>
                        <input
                          type="number"
                          value={triageHR}
                          onChange={e => setTriageHR(e.target.value)}
                          placeholder={t('rcpt_ph_hr', 'app')}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                        {triageHR && (() => {
                          const hr = parseInt(triageHR);
                          if (!isNaN(hr)) {
                            if (vitalsLimits.fc.red(hr)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {t('rcpt_triage_hr_critical', 'app')}</p>;
                            }
                            if (vitalsLimits.fc.orange(hr)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> {t('rcpt_triage_hr_abnormal', 'app')}</p>;
                            }
                            if (vitalsLimits.fc.yellow(hr)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {t('rcpt_triage_hr_elevated', 'app')}</p>;
                            }
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {t('rcpt_triage_status_normal', 'app')}</p>;
                          }
                          return null;
                        })()}
                      </div>
                      {/* Respiratory rate */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_resp_rate', 'app')}</label>
                        <input
                          type="number"
                          value={triageRR}
                          onChange={e => setTriageRR(e.target.value)}
                          placeholder={t('rcpt_ph_rr', 'app')}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                        />
                        {triageRR && (() => {
                          const rr = parseInt(triageRR);
                          if (!isNaN(rr)) {
                            if (vitalsLimits.fr.red(rr)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {t('rcpt_triage_rr_critical', 'app')}</p>;
                            }
                            if (vitalsLimits.fr.orange(rr)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> {t('rcpt_triage_rr_elevated', 'app')}</p>;
                            }
                            if (vitalsLimits.fr.yellow(rr)) {
                              return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {t('rcpt_triage_rr_slightly', 'app')}</p>;
                            }
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {t('rcpt_triage_status_normal', 'app')}</p>;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    </div>

                    {/* Procedimentos Preliminares */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">{t('rcpt_nursing_procedures', 'app')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        t('rcpt_triage_proc_hgt', 'app'),
                        t('rcpt_triage_proc_ecg', 'app'),
                        t('rcpt_triage_proc_blood', 'app'),
                        t('rcpt_triage_proc_urine', 'app'),
                        t('rcpt_triage_proc_anthropometry', 'app'),
                        t('rcpt_triage_proc_pre_med', 'app'),
                        t('rcpt_triage_proc_inhalation', 'app'),
                        t('rcpt_triage_proc_dressing', 'app'),
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('rcpt_nursing_observations', 'app')}</label>
                    <textarea
                      value={triageNursingNotes}
                      onChange={e => setTriageNursingNotes(e.target.value)}
                      placeholder={t('rcpt_triage_notes_placeholder', 'app')}
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Priority + File Upload */}
                <div className="space-y-5">

                  {/* Manchester Triage Priority */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">{t('rcpt_risk_classification', 'app')}</p>
                    <div className="space-y-2">
                      {[
                        { color: 'red', label: t('rcpt_triage_risk_red', 'app'), desc: t('rcpt_triage_risk_red_time', 'app') },
                        { color: 'orange', label: t('rcpt_triage_risk_orange', 'app'), desc: '≤ 10 min' },
                        { color: 'yellow', label: t('rcpt_triage_risk_yellow', 'app'), desc: '≤ 60 min' },
                        { color: 'green', label: t('rcpt_triage_risk_green', 'app'), desc: '≤ 120 min' },
                        { color: 'blue', label: t('rcpt_triage_risk_blue', 'app'), desc: '≤ 240 min' },
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
                      <p className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-200 mb-3">{t('rcpt_patient_photo', 'app')}</p>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-32 h-32 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                          {triagePatient.photo_url ? (
                            <img src={triagePatient.photo_url} className="w-full h-full object-cover" alt={t('rcpt_alt_patient_photo', 'app')} />
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
                  {t('rcpt_cancel', 'app')}
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
                      id: `his_triage_${++hisCounterRef.current}`,
                      date: new Date().toISOString().split('T')[0],
                      type: t('rcpt_triage_type', 'app'),
                      diagnosis: triageReason,
                      cid10: 'Z00.0',
                      prescriptions: triageProcedures.length > 0 ? triageProcedures : [t('rcpt_triage_no_procedure', 'app')],
                      notes: triageNursingNotes || t('rcpt_triage_default_note', 'app'),
                      doctor: t('rcpt_triage_nurse', 'app'),
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
                      triaged_at: new Date().toISOString(),
                    };

                    const newPriority: Patient['priority'] = triageEntry.triage_priority;

                    // Optimistic UI update
                    setPatients(prev => prev.map(p => {
                      if (p.id === triagePatient.id) {
                        return {
                          ...p,
                          status: 'triado' as const,
                          priority: newPriority,
                          clinicalHistory: [triageEntry, ...p.clinicalHistory],
                        };
                      }
                      return p;
                    }));

                    addAuditLog(
                      t('rcpt_audit_triage_performed', 'app').replace('{level}', triagePriorityLevel.toUpperCase()),
                      `${triagePatient.name} — ${triageReason.slice(0, 60)}`
                    );

                    // Persist to Supabase
                    if (supabase) {
                      try {
                        const triageData = {
                          patient_id: triagePatient.id,
                          date: triageEntry.date,
                          type: triageEntry.type,
                          diagnosis: triageEntry.diagnosis,
                          cid10: triageEntry.cid10,
                          prescriptions: triageEntry.prescriptions,
                          notes: triageEntry.notes,
                          doctor: triageEntry.doctor,
                          vital_signs: triageEntry.vital_signs || null,
                          triage_priority: triageEntry.triage_priority || null,
                          triage_color: triageEntry.triage_color || null,
                          preliminary_procedures: triageEntry.preliminary_procedures || [],
                          attached_files: triageEntry.attached_files || [],
                          triaged_at: triageEntry.triaged_at || null,
                        };

                        const { data: existingTriage } = await supabase
                          .from('clinical_history')
                          .select('id')
                          .eq('patient_id', triagePatient.id)
                          .eq('type', t('rcpt_triage_type', 'app'))
                          .order('date', { ascending: false })
                          .limit(1);

                        if (existingTriage && existingTriage.length > 0) {
                          await supabase.from('clinical_history').update(triageData).eq('id', existingTriage[0].id);
                        } else {
                          await supabase.from('clinical_history').insert({ id: triageEntry.id, ...triageData });
                        }

                        await supabase.from('patients').update({
                          status: 'triado',
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
                  {t('rcpt_save_triage', 'app')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </PermissionGate>

      {/* --- MODAL: DISTRIBUIR PACIENTE --- */}
      <AnimatePresence>
        {showDistributeModal && distributePatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <MapPin className="w-6 h-6 text-teal-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{t('app_distribute_patient', 'app')}</h3>
                  <p className="text-xs text-slate-500">{distributePatient.name}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('app_select_location', 'app')}</label>
                <select
                  value={distributeTargetLocation}
                  onChange={e => setDistributeTargetLocation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">{t('app_select_location_option', 'app')}</option>
                  {hospitalLocations.filter(l => l.status !== 'manutencao' && l.currentPatients.length < l.capacity).map(l => (
                    <option key={l.id} value={l.id}>
                      {locationTypeIcon[l.type]} {l.name} ({l.currentPatients.length}/{l.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={handleDistributePatient} disabled={!distributeTargetLocation} className={`py-2 px-4 font-bold text-xs rounded-lg transition ${
                  distributeTargetLocation ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}>
                  {t('app_direct', 'app')}
                </button>
                <button onClick={() => { setShowDistributeModal(false); setDistributePatient(null); setDistributeTargetLocation(''); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition">
                  {t('rcpt_cancel', 'app')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: REDIRECIONAR PACIENTE --- */}
      <AnimatePresence>
        {showRedirectModal && redirectPatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <ChevronRight className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{t('app_redirect_patient', 'app')}</h3>
                  <p className="text-xs text-slate-500">{redirectPatient.name}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('app_new_location', 'app')}</label>
                <select
                  value={redirectTargetLocation}
                  onChange={e => setRedirectTargetLocation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">{t('app_select_location_option', 'app')}</option>
                  {hospitalLocations.filter(l => l.status !== 'manutencao' && l.currentPatients.length < l.capacity && !l.currentPatients.includes(redirectPatient.id)).map(l => (
                    <option key={l.id} value={l.id}>
                      {locationTypeIcon[l.type]} {l.name} ({l.currentPatients.length}/{l.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={handleRedirectPatient} disabled={!redirectTargetLocation} className={`py-2 px-4 font-bold text-xs rounded-lg transition ${
                  redirectTargetLocation ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}>
                  {t('rcpt_detail_redirect', 'app')}
                </button>
                <button onClick={() => { setShowRedirectModal(false); setRedirectPatient(null); setRedirectTargetLocation(''); pendingMedDataRef.current = null; }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition">
                  {t('rcpt_cancel', 'app')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: TIMELINE DO PACIENTE ATENDIDO --- */}
      <AnimatePresence>
        {showTimelineModal && timelinePatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {timelinePatient.photo_url ? (
                      <img src={timelinePatient.photo_url} alt={timelinePatient.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                        {timelinePatient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{timelinePatient.name}</h3>
                      <p className="text-xs text-slate-500">
                        {timelinePatient.document_type || t('rcpt_doc_ci', 'app')}: {timelinePatient.document_number || '—'}
                        {timelinePatient.blood_type && timelinePatient.blood_type !== 'Não Informado' && ` | ${t('rcpt_list_blood_type', 'app')}: ${timelinePatient.blood_type}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={async () => {
                      const { jsPDF } = await import('jspdf');
                      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
                      const pat = timelinePatient;
                      const triageEntry = pat.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                      let y = 20;
                      const checkPage = (inc: number) => { if (y + inc > 270) { doc.addPage(); y = 20; } };
                      doc.setFontSize(18);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`${t('rcpt_pdf_record', 'app')}: ${pat.name}`, 15, y); y += 8;
                      doc.setFontSize(10);
                      doc.setFont('helvetica', 'normal');
                      doc.setTextColor(100, 116, 139);
                      doc.text(`${pat.document_type || 'CI'}: ${pat.document_number || '-'}${pat.blood_type ? ` | ${t('rcpt_pdf_type', 'app')}: ${pat.blood_type}` : ''}`, 15, y); y += 10;
                      doc.setDrawColor(13, 148, 136); doc.setLineWidth(0.5); doc.line(15, y, 195, y); y += 8;
                      if (triageEntry) {
                        doc.setTextColor(13, 148, 136); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
                        doc.text(t('rcpt_pdf_triage', 'app'), 15, y); y += 6;
                        doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
                        if (triageEntry.triaged_at) { doc.text(`${t('rcpt_pdf_date', 'app')}: ${new Date(triageEntry.triaged_at).toLocaleString(locale)}`, 15, y); y += 5; }
                        if (triageEntry.vital_signs) {
                          const vs = triageEntry.vital_signs;
                          let vitals = '';
                          if (vs.bp) vitals += `${t('rcpt_triage_bp_label', 'app')}: ${vs.bp}  `;
                          if (vs.temp) vitals += `${t('rcpt_triage_temp_label', 'app')}: ${vs.temp}C  `;
                          if (vs.spo2) vitals += `${t('rcpt_triage_spo2_label', 'app')}: ${vs.spo2}%  `;
                          if (vs.hr) vitals += `${t('rcpt_triage_hr_label', 'app')}: ${vs.hr} BPM  `;
                          if (vs.rr) vitals += `${t('rcpt_triage_rr_label', 'app')}: ${vs.rr} IRPM`;
                          doc.text(vitals, 15, y); y += 5;
                        }
                        y += 4;
                      }
                      const usedMedIdsPdf = new Set<string>();
                      const allMedsPdf = (pat.clinicalHistory || [])
                        .filter((h: any) => h.type === 'Consulta Médica')
                        .sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
                      timelineAssignments.forEach(a => {
                        const locationMeds = allMedsPdf.filter((h: any) => h.location_name === a.locationName && !usedMedIdsPdf.has(h.id));
                        const med = locationMeds[0] || null;
                        if (med) usedMedIdsPdf.add(med.id);
                        checkPage(30);
                        doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252);
                        doc.roundedRect(15, y - 4, 180, med ? 38 : 14, 2, 2, 'FD');
                        doc.setTextColor(13, 148, 136); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
                        doc.text(a.locationName, 19, y + 2); y += 8;
                        doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
                        doc.text(`${t('rcpt_pdf_entry', 'app')}: ${new Date(a.assignedAt).toLocaleString(locale)}`, 19, y); y += 4;
                        doc.text(`${t('rcpt_pdf_exit', 'app')}: ${a.completedAt ? new Date(a.completedAt).toLocaleString(locale) : new Date(a.assignedAt).toLocaleString(locale)}`, 19, y); y += 5;
                        if (med) {
                          doc.setFontSize(8); doc.setTextColor(51, 65, 85);
                          if (med.diagnosis) { doc.setFont('helvetica', 'bold'); doc.text(t('rcpt_pdf_diagnosis', 'app') + ': ', 19, y); doc.setFont('helvetica', 'normal'); doc.text(med.diagnosis, 52, y); y += 4; }
                          if (med.cid10 && med.cid10 !== 'Z00.0') { doc.setFont('helvetica', 'bold'); doc.text(t('rcpt_timeline_cid10', 'app') + ': ', 19, y); doc.setFont('helvetica', 'normal'); doc.text(med.cid10, 40, y); y += 4; }
                          if (med.prescriptions && med.prescriptions.length > 0) { doc.setFont('helvetica', 'bold'); doc.text(t('rcpt_pdf_prescription', 'app') + ': ', 19, y); doc.setFont('helvetica', 'normal'); doc.text(med.prescriptions.join(', '), 52, y); y += 4; }
                          if (med.notes) { doc.setFont('helvetica', 'bold'); doc.text(t('rcpt_pdf_observations', 'app') + ': ', 19, y); doc.setFont('helvetica', 'normal'); doc.text(med.notes, 54, y); y += 4; }
                        }
                        y += 4;
                      });
                      const lastAssignmentPdf = timelineAssignments[timelineAssignments.length - 1];
                      const completedTimePdf = lastAssignmentPdf?.completedAt || lastAssignmentPdf?.assignedAt || new Date().toISOString();
                      y += 4; checkPage(10);
                      doc.setTextColor(148, 163, 184); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
                      doc.text(`${t('rcpt_pdf_visit_completed', 'app')} - ${new Date(completedTimePdf).toLocaleString(locale)}`, 105, y, { align: 'center' });
                      doc.save(`${t('rcpt_pdf_filename_prefix', 'app')}_${pat.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
                    }} className="text-slate-400 hover:text-teal-600 cursor-pointer" title={t('rcpt_pdf_export_title', 'app')}>
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" stroke="#ef4444" />
                        <text x="12" y="18" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#ef4444" stroke="none">PDF</text>
                      </svg>
                    </button>
                    <button onClick={() => { setShowTimelineModal(false); setTimelinePatient(null); setTimelineAssignments([]); }} className="w-8 h-8 flex items-center justify-center border-2 border-blue-500 rounded-lg text-blue-500 hover:bg-blue-50 cursor-pointer ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {timelineLoading ? (
                  <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_timeline_loading', 'app')}</p>
                ) : (
                  <div className="space-y-0">
                    {/* Triage Event */}
                    {timelinePatient.clinicalHistory?.find((h: any) => h.type?.includes('Triagem')) && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                          <div className="w-0.5 flex-1 bg-slate-200"></div>
                        </div>
                        <div className="pb-4 flex-1">
                          <p className="text-xs font-bold text-slate-800">{t('rcpt_timeline_triage', 'app')}</p>
                          {(() => {
                            const triageEntry = timelinePatient.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                            return triageEntry ? (
                              <>
                                <p className="text-[10px] text-slate-400">
                                  {triageEntry.triaged_at 
                                    ? new Date(triageEntry.triaged_at).toLocaleString(locale)
                                    : '—'}
                                </p>
                                {triageEntry.vital_signs && (
                                  <div className="mt-1 text-[10px] text-slate-500 space-y-0.5">
                                    {triageEntry.vital_signs.bp && <p>{t('rcpt_triage_bp_label', 'app')}: {triageEntry.vital_signs.bp}</p>}
                                    {triageEntry.vital_signs.spo2 && <p>{t('rcpt_triage_spo2_label', 'app')}: {triageEntry.vital_signs.spo2}</p>}
                                    {triageEntry.vital_signs.temp && <p>{t('rcpt_triage_temp_label', 'app')}: {triageEntry.vital_signs.temp}</p>}
                                    {triageEntry.vital_signs.hr && <p>{t('rcpt_triage_hr_label', 'app')}: {triageEntry.vital_signs.hr}</p>}
                                    {triageEntry.vital_signs.rr && <p>{t('rcpt_triage_rr_label', 'app')}: {triageEntry.vital_signs.rr}</p>}
                                  </div>
                                )}
                              </>
                            ) : <p className="text-[10px] text-slate-400">—</p>;
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Location Assignments with Medical Data */}
                    {(() => {
                      const usedMedIds = new Set<string>();
                      const allMeds = (timelinePatient.clinicalHistory || [])
                        .filter((h: any) => h.type === 'Consulta Médica')
                        .sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
                      return timelineAssignments.map((assignment, idx) => {
                        const locationMeds = allMeds.filter((h: any) => h.location_name === assignment.locationName && !usedMedIds.has(h.id));
                        const med = locationMeds[0] || null;
                        if (med) usedMedIds.add(med.id);
                        return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <div className="w-0.5 flex-1 bg-slate-200"></div>
                        </div>
                        <div className="pb-4 flex-1">
                          <p className="text-xs font-bold text-slate-800">🏥 {assignment.locationName}</p>
                          <p className="text-[10px] text-slate-400">
                            {t('rcpt_timeline_entry', 'app')} {new Date(assignment.assignedAt).toLocaleString(locale)}
                          </p>
                          {assignment.completedAt ? (
                            <p className="text-[10px] text-slate-400">
                              {t('rcpt_timeline_exit', 'app')} {new Date(assignment.completedAt).toLocaleString(locale)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-amber-500 font-semibold">{t('rcpt_timeline_ongoing', 'app')}</p>
                          )}
                          {med && (
                            <div className="mt-1.5 text-[10px] text-slate-500 space-y-0.5 border-l-2 border-blue-200 pl-2">
                              {med.triage_edits && (
                                <div className="mb-1">
                                  {med.triage_edits.diagnosis && (
                                    <p>• <span className="font-semibold text-amber-600">{t('rcpt_timeline_triage_edited', 'app')}</span> {med.triage_edits.diagnosis}</p>
                                  )}
                                  {med.triage_edits.vital_signs && (
                                    <div className="ml-2 space-y-0.5">
                                      {med.triage_edits.vital_signs.bp && <p className="text-amber-600">{t('rcpt_triage_bp_label', 'app')}: {med.triage_edits.vital_signs.bp}</p>}
                                      {med.triage_edits.vital_signs.temp && <p className="text-amber-600">{t('rcpt_triage_temp_label', 'app')}: {med.triage_edits.vital_signs.temp}°C</p>}
                                      {med.triage_edits.vital_signs.spo2 && <p className="text-amber-600">{t('rcpt_triage_spo2_label', 'app')}: {med.triage_edits.vital_signs.spo2}%</p>}
                                      {med.triage_edits.vital_signs.hr && <p className="text-amber-600">{t('rcpt_triage_hr_label', 'app')}: {med.triage_edits.vital_signs.hr} BPM</p>}
                                      {med.triage_edits.vital_signs.rr && <p className="text-amber-600">{t('rcpt_triage_rr_label', 'app')}: {med.triage_edits.vital_signs.rr} IRPM</p>}
                                    </div>
                                  )}
                                </div>
                              )}
                              {med.diagnosis && (
                                <p>• <span className="font-semibold">{t('rcpt_timeline_diagnosis', 'app')}</span> {med.diagnosis}</p>
                              )}
                              {med.cid10 && med.cid10 !== 'Z00.0' && (
                                <p>• <span className="font-semibold">{t('rcpt_timeline_cid10', 'app')}</span> {med.cid10}</p>
                              )}
                              {med.prescriptions && med.prescriptions.length > 0 && med.prescriptions[0] !== t('rcpt_triage_no_procedure', 'app') && (
                                <p>• <span className="font-semibold">{t('rcpt_timeline_prescription', 'app')}</span> {med.prescriptions.join(', ')}</p>
                              )}
                              {med.notes && med.notes !== t('rcpt_triage_default_note', 'app') && (
                                <p>• <span className="font-semibold">{t('rcpt_timeline_medical_notes', 'app')}</span> {med.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      );
                      });
                    })()}

                    {/* Remaining medical consultations without location (hide if all have location_name) */}
                    {(() => {
                      const orphans = timelinePatient.clinicalHistory?.filter((h: any) => h.type === 'Consulta Médica' && !h.location_name) || [];
                      const assignedNames = new Set(timelineAssignments.map(a => a.locationName));
                      const unassigned = orphans.filter((h: any) => !assignedNames.has(h.location_name || ''));
                      if (unassigned.length === 0) return null;
                      return unassigned.map((entry, idx) => (
                      <div key={`med-${idx}`} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"></div>
                          <div className="w-0.5 flex-1 bg-slate-200"></div>
                        </div>
                        <div className="pb-4 flex-1">
                          <p className="text-xs font-bold text-slate-800">💊 {entry.type}</p>
                          <p className="text-[10px] text-slate-400">{entry.date}</p>
                          {entry.diagnosis && (
                            <p className="text-[10px] text-slate-500">{t('rcpt_timeline_diagnosis_label', 'app')} {entry.diagnosis}</p>
                          )}
                          {entry.cid10 && entry.cid10 !== 'Z00.0' && (
                            <p className="text-[10px] text-slate-500">{t('rcpt_timeline_cid10', 'app')} {entry.cid10}</p>
                          )}
                          {entry.prescriptions && entry.prescriptions.length > 0 && (
                            <p className="text-[10px] text-slate-500">{t('rcpt_timeline_prescription_label', 'app')} {entry.prescriptions.join(', ')}</p>
                          )}
                          {entry.notes && (
                            <p className="text-[10px] text-slate-500">{t('rcpt_timeline_notes_label', 'app')} {entry.notes}</p>
                          )}
                        </div>
                      </div>
                      ));
                    })()}

                    {/* Conclusion */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-green-600 flex-shrink-0"></div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-700">{t('rcpt_timeline_visit_completed', 'app')}</p>
                        <p className="text-[10px] text-slate-400">
                          {(() => {
                            const lastAssignment = timelineAssignments[timelineAssignments.length - 1];
                            const completedTime = lastAssignment?.completedAt || lastAssignment?.assignedAt;
                            return completedTime ? new Date(completedTime).toLocaleString(locale) : '—';
                          })()}
                        </p>
                      </div>
                    </div>

                    {timelineAssignments.length === 0 && (!timelinePatient.clinicalHistory || timelinePatient.clinicalHistory.length === 0) && (
                      <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_timeline_no_history', 'app')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100">
                <button onClick={() => { setShowTimelineModal(false); setTimelinePatient(null); setTimelineAssignments([]); }} className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer">
                  {t('rcpt_timeline_close', 'app')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: CADASTRAR/EDITAR LOCAL --- */}
      <AnimatePresence>
        {showNewLocationModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <Sliders className="w-6 h-6 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-lg">{editingLocation ? t('rcpt_location_edit', 'app') : t('rcpt_location_new', 'app')}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('rcpt_location_name', 'app')}</label>
                  <input
                    type="text"
                    value={newLocationForm.name}
                    onChange={e => setNewLocationForm({ ...newLocationForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    placeholder={t('rcpt_location_name_placeholder', 'app')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('rcpt_location_type', 'app')}</label>
                  <select
                    value={newLocationForm.type}
                    onChange={e => setNewLocationForm({ ...newLocationForm, type: e.target.value as HospitalLocation['type'] })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="consultorio">{t('rcpt_loc_type_consultorio', 'app')}</option>
                    <option value="enfermaria">{t('rcpt_loc_type_enfermaria', 'app')}</option>
                    <option value="uti">{t('rcpt_loc_type_uti', 'app')}</option>
                    <option value="raio_x">{t('rcpt_loc_type_raio_x', 'app')}</option>
                    <option value="laboratorio">{t('rcpt_loc_type_laboratorio', 'app')}</option>
                    <option value="cirurgia">{t('rcpt_loc_type_cirurgia', 'app')}</option>
                    <option value="sala_espera">{t('rcpt_loc_type_sala_espera', 'app')}</option>
                    <option value="outro">{t('rcpt_loc_type_outro', 'app')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('rcpt_location_capacity_label', 'app')}</label>
                  <input
                    type="number"
                    min="1"
                    value={newLocationForm.capacity}
                    onChange={e => setNewLocationForm({ ...newLocationForm, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={async () => {
                  if (editingLocation) {
                    setHospitalLocations(prev => prev.map(l => l.id === editingLocation.id ? { ...l, name: newLocationForm.name, type: newLocationForm.type, capacity: newLocationForm.capacity } : l));
                    addAuditLog(t('rcpt_audit_edited_location', 'app'), newLocationForm.name);
                    if (supabase) {
                      try {
                        await supabase.from('hospital_locations').update({ name: newLocationForm.name, type: newLocationForm.type, capacity: newLocationForm.capacity }).eq('id', editingLocation.id);
                      } catch (err) {
                        console.error('[SUPABASE] UPDATE hospital_locations FAILED:', err);
                      }
                    }
                  } else {
                    await handleAddLocation();
                  }
                  setShowNewLocationModal(false);
                  setEditingLocation(null);
                }} disabled={!newLocationForm.name.trim()} className={`py-2 px-4 font-bold text-xs rounded-lg transition ${
                  newLocationForm.name.trim() ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}>
                  {editingLocation ? t('app_save', 'app') : t('app_register', 'app')}
                </button>
                <button onClick={() => { setShowNewLocationModal(false); setEditingLocation(null); setNewLocationForm({ name: '', type: 'consultorio', capacity: 1 }); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition">
                  {t('rcpt_cancel', 'app')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: DETALHE DO LOCAL (capacidade > 1) --- */}
      <AnimatePresence>
        {showLocationDetail && selectedLocation && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{locationTypeIcon[selectedLocation.type]}</span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{selectedLocation.name}</h3>
                      <p className="text-xs text-slate-500">{locationTypeLabel[selectedLocation.type]}</p>
                    </div>
                  </div>
                   <button onClick={() => { setShowLocationDetail(false); setSelectedLocation(null); setSelectedDetailPatientId(null); setMedDiagnosis(''); setMedCid10(''); setMedPrescription(''); setMedNotes(''); setPrevMedDiagnosis(''); setPrevMedCid10(''); setPrevMedPrescription(''); setPrevMedNotes(''); setIsEditingTriage(false); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    selectedLocation.status === 'manutencao' ? 'bg-slate-200 text-slate-600' :
                    selectedLocation.currentPatients.length >= selectedLocation.capacity ? 'bg-red-100 text-red-700' :
                    selectedLocation.currentPatients.length > 0 ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                     {selectedLocation.status === 'manutencao' ? t('rcpt_loc_maintenance', 'app') :
                     selectedLocation.currentPatients.length >= selectedLocation.capacity ? t('rcpt_loc_occupied', 'app') :
                     selectedLocation.currentPatients.length > 0 ? t('rcpt_loc_attending', 'app') : t('rcpt_loc_free', 'app')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t('rcpt_loc_queue', 'app')}: <span className="font-bold text-slate-700">{selectedLocation.currentPatients.length}</span> / {selectedLocation.capacity}
                  </span>
                </div>
              </div>

              {/* Patient List / Consultório Detail / Non-consultório Detail */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {selectedLocation.currentPatients.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_detail_no_patient', 'app')}</p>
                ) : selectedLocation.capacity === 1 && selectedLocation.currentPatients.length === 1 ? (
                  // Consultório: visualização com dados da triagem + campos médicos
                  (() => {
                    const pid = selectedLocation.currentPatients[0];
                    const pat = patients.find(p => p.id === pid);
                    if (!pat) return <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_detail_patient_not_found', 'app')}</p>;
                    const triage = pat.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                    const vitals = triage?.vital_signs;
                    const colorDot: Record<string, string> = {
                      red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-amber-400', green: 'bg-green-500', blue: 'bg-blue-500',
                    };
                    return (
                      <div className="space-y-4">
                        {/* Patient Info */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{pat.name}</p>
                              <p className="text-xs text-slate-500">{pat.birthdate ? `${new Date().getFullYear() - new Date(pat.birthdate).getFullYear()} ${t('rcpt_list_years', 'app')}` : ''} | {pat.document_type || t('rcpt_doc_ci', 'app')}: {pat.document_number || t('rcpt_not_applicable', 'app')} | {t('rcpt_list_blood_type', 'app')} <span className="font-bold text-rose-600">{pat.blood_type || '-'}</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Triage Data */}
                        {triage && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-700">{t('rcpt_detail_triage_data', 'app')}</p>
                              <div className="flex items-center gap-2">
                                {triage.triage_color && (
                                  <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5" style={{ backgroundColor: triage.triage_color === 'red' ? '#fee2e2' : triage.triage_color === 'orange' ? '#ffedd5' : triage.triage_color === 'yellow' ? '#fef3c7' : triage.triage_color === 'green' ? '#dcfce7' : '#dbeafe', color: triage.triage_color === 'red' ? '#991b1b' : triage.triage_color === 'orange' ? '#9a3412' : triage.triage_color === 'yellow' ? '#92400e' : triage.triage_color === 'green' ? '#166534' : '#1e40af' }}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${colorDot[triage.triage_color] || ''}`} />
                                    {triage.triage_color === 'red' ? t('rcpt_triage_color_red', 'app') : triage.triage_color === 'orange' ? t('rcpt_triage_color_orange', 'app') : triage.triage_color === 'yellow' ? t('rcpt_triage_color_yellow', 'app') : triage.triage_color === 'green' ? t('rcpt_triage_color_green', 'app') : t('rcpt_triage_color_blue', 'app')}
                                  </span>
                                )}
                                {!isEditingTriage ? (
                                  <button onClick={() => {
                                    setEditTriageReason(triage.diagnosis || '');
                                    setEditTriageBP(vitals?.bp || '');
                                    setEditTriageTemp(vitals?.temp || '');
                                    setEditTriageSpo2(vitals?.spo2 || '');
                                    setEditTriageHR(vitals?.hr || '');
                                    setEditTriageRR(vitals?.rr || '');
                                    setIsEditingTriage(true);
                                  }} className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer px-2 py-1 rounded hover:bg-blue-50 transition">
                                    {t('rcpt_detail_edit', 'app')}
                                  </button>
                                ) : (
                                  <button onClick={() => {
                                    setHasTriageEdits(true);
                                    setIsEditingTriage(false);
                                  }} className="text-xs text-green-600 hover:text-green-800 font-bold cursor-pointer px-2 py-1 rounded hover:bg-green-50 transition">
                                    {t('rcpt_detail_save', 'app')}
                                  </button>
                                )}
                              </div>
                            </div>
                            {isEditingTriage ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_motivo', 'app')}</label>
                                  <input type="text" value={editTriageReason} onChange={e => setEditTriageReason(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_bp_label', 'app')}</label><input type="text" value={editTriageBP} onChange={e => { const raw = e.target.value.replace(/[^0-9/]/g, ''); if ((raw.match(/\//g) || []).length > 1) return; setEditTriageBP(raw); }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_temp_label', 'app')}</label><input type="text" value={editTriageTemp} onChange={e => { const raw = e.target.value.replace(/[^0-9.]/g, ''); if ((raw.match(/\./g) || []).length > 1) return; setEditTriageTemp(raw); }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_spo2_label', 'app')}</label><input type="text" value={editTriageSpo2} onChange={e => setEditTriageSpo2(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_hr_label', 'app')}</label><input type="text" value={editTriageHR} onChange={e => setEditTriageHR(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_rr_label', 'app')}</label><input type="text" value={editTriageRR} onChange={e => setEditTriageRR(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-slate-600"><span className="font-bold">{t('rcpt_detail_reason_label', 'app')}</span> {hasTriageEdits ? editTriageReason : triage.diagnosis}</p>
                                {(hasTriageEdits || vitals) && (
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    {(hasTriageEdits ? editTriageBP : vitals?.bp) && <p className="text-slate-600">{t('rcpt_triage_bp_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageBP : vitals?.bp}</span></p>}
                                    {(hasTriageEdits ? editTriageTemp : vitals?.temp) && <p className="text-slate-600">{t('rcpt_triage_temp_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageTemp : vitals?.temp}°C</span></p>}
                                    {(hasTriageEdits ? editTriageSpo2 : vitals?.spo2) && <p className="text-slate-600">{t('rcpt_triage_spo2_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageSpo2 : vitals?.spo2}%</span></p>}
                                    {(hasTriageEdits ? editTriageHR : vitals?.hr) && <p className="text-slate-600">{t('rcpt_triage_hr_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageHR : vitals?.hr} BPM</span></p>}
                                    {(hasTriageEdits ? editTriageRR : vitals?.rr) && <p className="text-slate-600">{t('rcpt_triage_rr_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageRR : vitals?.rr} IRPM</span></p>}
                                  </div>
                                )}
                                {triage.preliminary_procedures && triage.preliminary_procedures.length > 0 && (
                                  <p className="text-[11px] text-slate-600"><span className="font-bold">{t('rcpt_detail_procedures', 'app')}</span> {triage.preliminary_procedures.join(', ')}</p>
                                )}
                                {triage.notes && <p className="text-[11px] text-slate-500 italic">{triage.notes}</p>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Medical Consultation */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-bold text-blue-800">{t('rcpt_detail_medical_consultation', 'app')}</p>
                          {prevMedDiagnosis && (
                            <p className="text-[10px] text-slate-400 italic">{t('rcpt_detail_previous_data_gray', 'app')}</p>
                          )}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_detail_diagnosis', 'app')}</label>
                            {prevMedDiagnosis ? (
                              <div className="flex">
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-2 rounded-l-lg border border-r-0 border-slate-200 whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">{prevMedDiagnosis} -</span>
                                <input type="text" value={medDiagnosis} onChange={e => setMedDiagnosis(e.target.value)} placeholder={t('rcpt_ph_add', 'app')} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg text-xs focus:outline-blue-500" />
                              </div>
                            ) : (
                              <input type="text" value={medDiagnosis} onChange={e => setMedDiagnosis(e.target.value)} placeholder={t('rcpt_ph_describe_diagnosis', 'app')} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_detail_cid10', 'app')}</label>
                            {prevMedCid10 ? (
                              <div className="flex">
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-2 rounded-l-lg border border-r-0 border-slate-200 whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">{prevMedCid10} -</span>
                                <input type="text" value={medCid10} onChange={e => setMedCid10(e.target.value)} placeholder={t('rcpt_ph_add', 'app')} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg text-xs focus:outline-blue-500" />
                              </div>
                            ) : (
                              <input type="text" value={medCid10} onChange={e => setMedCid10(e.target.value)} placeholder={t('rcpt_ph_cid10', 'app')} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_detail_prescription', 'app')}</label>
                            {prevMedPrescription ? (
                              <div className="flex">
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-2 rounded-l-lg border border-r-0 border-slate-200 whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">{prevMedPrescription} -</span>
                                <textarea value={medPrescription} onChange={e => setMedPrescription(e.target.value)} placeholder={t('rcpt_ph_add', 'app')} rows={3} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg text-xs focus:outline-blue-500" />
                              </div>
                            ) : (
                              <textarea value={medPrescription} onChange={e => setMedPrescription(e.target.value)} placeholder={t('rcpt_ph_prescription', 'app')} rows={3} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_detail_medical_notes', 'app')}</label>
                            {prevMedNotes ? (
                              <div className="flex">
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-2 rounded-l-lg border border-r-0 border-slate-200 whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">{prevMedNotes} -</span>
                                <textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder={t('rcpt_ph_add', 'app')} rows={2} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg text-xs focus:outline-blue-500" />
                              </div>
                            ) : (
                              <textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder={t('rcpt_ph_notes', 'app')} rows={2} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : selectedDetailPatientId && selectedLocation.currentPatients.includes(selectedDetailPatientId) ? (
                  // Non-consultório: detalhe do paciente selecionado (mesmo layout do consultório)
                  (() => {
                    const pid = selectedDetailPatientId;
                    const pat = patients.find(p => p.id === pid);
                    if (!pat) return <p className="text-sm text-slate-400 text-center py-8">{t('rcpt_detail_patient_not_found', 'app')}</p>;
                    const triage = pat.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                    const vitals = triage?.vital_signs;
                    const colorDot: Record<string, string> = {
                      red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-amber-400', green: 'bg-green-500', blue: 'bg-blue-500',
                    };
                    return (
                      <div className="space-y-4">
                        <button onClick={() => setSelectedDetailPatientId(null)} className="text-xs text-teal-600 hover:text-teal-800 font-bold cursor-pointer flex items-center gap-1">
                          {t('rcpt_detail_back_to_list', 'app')}
                        </button>
                        {/* Patient Info */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{pat.name}</p>
                              <p className="text-xs text-slate-500">{pat.birthdate ? `${new Date().getFullYear() - new Date(pat.birthdate).getFullYear()} ${t('rcpt_list_years', 'app')}` : ''} | {pat.document_type || t('rcpt_doc_ci', 'app')}: {pat.document_number || t('rcpt_not_applicable', 'app')} | {t('rcpt_list_blood_type', 'app')} <span className="font-bold text-rose-600">{pat.blood_type || '-'}</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Triage Data */}
                        {triage && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-700">{t('rcpt_detail_triage_data', 'app')}</p>
                              <div className="flex items-center gap-2">
                                {triage.triage_color && (
                                  <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5" style={{ backgroundColor: triage.triage_color === 'red' ? '#fee2e2' : triage.triage_color === 'orange' ? '#ffedd5' : triage.triage_color === 'yellow' ? '#fef3c7' : triage.triage_color === 'green' ? '#dcfce7' : '#dbeafe', color: triage.triage_color === 'red' ? '#991b1b' : triage.triage_color === 'orange' ? '#9a3412' : triage.triage_color === 'yellow' ? '#92400e' : triage.triage_color === 'green' ? '#166534' : '#1e40af' }}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${colorDot[triage.triage_color] || ''}`} />
                                    {triage.triage_color === 'red' ? t('rcpt_triage_color_red', 'app') : triage.triage_color === 'orange' ? t('rcpt_triage_color_orange', 'app') : triage.triage_color === 'yellow' ? t('rcpt_triage_color_yellow', 'app') : triage.triage_color === 'green' ? t('rcpt_triage_color_green', 'app') : t('rcpt_triage_color_blue', 'app')}
                                  </span>
                                )}
                                {!isEditingTriage ? (
                                  <button onClick={() => {
                                    setEditTriageReason(triage.diagnosis || '');
                                    setEditTriageBP(vitals?.bp || '');
                                    setEditTriageTemp(vitals?.temp || '');
                                    setEditTriageSpo2(vitals?.spo2 || '');
                                    setEditTriageHR(vitals?.hr || '');
                                    setEditTriageRR(vitals?.rr || '');
                                    setIsEditingTriage(true);
                                  }} className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer px-2 py-1 rounded hover:bg-blue-50 transition">
                                    {t('rcpt_detail_edit', 'app')}
                                  </button>
                                ) : (
                                  <button onClick={() => {
                                    setHasTriageEdits(true);
                                    setIsEditingTriage(false);
                                  }} className="text-xs text-green-600 hover:text-green-800 font-bold cursor-pointer px-2 py-1 rounded hover:bg-green-50 transition">
                                    {t('rcpt_detail_save', 'app')}
                                  </button>
                                )}
                              </div>
                            </div>
                            {isEditingTriage ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_motivo', 'app')}</label>
                                  <input type="text" value={editTriageReason} onChange={e => setEditTriageReason(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_bp_label', 'app')}</label><input type="text" value={editTriageBP} onChange={e => { const raw = e.target.value.replace(/[^0-9/]/g, ''); if ((raw.match(/\//g) || []).length > 1) return; setEditTriageBP(raw); }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_temp_label', 'app')}</label><input type="text" value={editTriageTemp} onChange={e => { const raw = e.target.value.replace(/[^0-9.]/g, ''); if ((raw.match(/\./g) || []).length > 1) return; setEditTriageTemp(raw); }} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_spo2_label', 'app')}</label><input type="text" value={editTriageSpo2} onChange={e => setEditTriageSpo2(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_hr_label', 'app')}</label><input type="text" value={editTriageHR} onChange={e => setEditTriageHR(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_triage_rr_label', 'app')}</label><input type="text" value={editTriageRR} onChange={e => setEditTriageRR(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" /></div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-slate-600"><span className="font-bold">{t('rcpt_detail_reason_label', 'app')}</span> {hasTriageEdits ? editTriageReason : triage.diagnosis}</p>
                                {(hasTriageEdits || vitals) && (
                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    {(hasTriageEdits ? editTriageBP : vitals?.bp) && <p className="text-slate-600">{t('rcpt_triage_bp_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageBP : vitals?.bp}</span></p>}
                                    {(hasTriageEdits ? editTriageTemp : vitals?.temp) && <p className="text-slate-600">{t('rcpt_triage_temp_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageTemp : vitals?.temp}°C</span></p>}
                                    {(hasTriageEdits ? editTriageSpo2 : vitals?.spo2) && <p className="text-slate-600">{t('rcpt_triage_spo2_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageSpo2 : vitals?.spo2}%</span></p>}
                                    {(hasTriageEdits ? editTriageHR : vitals?.hr) && <p className="text-slate-600">{t('rcpt_triage_hr_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageHR : vitals?.hr} BPM</span></p>}
                                    {(hasTriageEdits ? editTriageRR : vitals?.rr) && <p className="text-slate-600">{t('rcpt_triage_rr_label', 'app')}: <span className="font-bold">{hasTriageEdits ? editTriageRR : vitals?.rr} IRPM</span></p>}
                                  </div>
                                )}
                                {triage.preliminary_procedures && triage.preliminary_procedures.length > 0 && (
                                  <p className="text-[11px] text-slate-600"><span className="font-bold">{t('rcpt_detail_procedures', 'app')}</span> {triage.preliminary_procedures.join(', ')}</p>
                                )}
                                {triage.notes && <p className="text-[11px] text-slate-500 italic">{triage.notes}</p>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Medical Consultation */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-bold text-blue-800">{t('rcpt_detail_medical_consultation', 'app')}</p>
                          {prevMedDiagnosis && (
                            <p className="text-[10px] text-slate-400 italic">{t('rcpt_detail_previous_data_gray', 'app')}</p>
                          )}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_detail_diagnosis', 'app')}</label>
                            {prevMedDiagnosis ? (
                              <div className="flex">
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-2 rounded-l-lg border border-r-0 border-slate-200 whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">{prevMedDiagnosis} -</span>
                                <input type="text" value={medDiagnosis} onChange={e => setMedDiagnosis(e.target.value)} placeholder={t('rcpt_ph_add', 'app')} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg text-xs focus:outline-blue-500" />
                              </div>
                            ) : (
                              <input type="text" value={medDiagnosis} onChange={e => setMedDiagnosis(e.target.value)} placeholder={t('rcpt_ph_describe_diagnosis', 'app')} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_detail_cid10', 'app')}</label>
                            {prevMedCid10 ? (
                              <div className="flex">
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-2 rounded-l-lg border border-r-0 border-slate-200 whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">{prevMedCid10} -</span>
                                <input type="text" value={medCid10} onChange={e => setMedCid10(e.target.value)} placeholder={t('rcpt_ph_add', 'app')} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg text-xs focus:outline-blue-500" />
                              </div>
                            ) : (
                              <input type="text" value={medCid10} onChange={e => setMedCid10(e.target.value)} placeholder={t('rcpt_ph_cid10', 'app')} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_detail_prescription', 'app')}</label>
                            {prevMedPrescription ? (
                              <div className="flex">
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-2 rounded-l-lg border border-r-0 border-slate-200 whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">{prevMedPrescription} -</span>
                                <textarea value={medPrescription} onChange={e => setMedPrescription(e.target.value)} placeholder={t('rcpt_ph_add', 'app')} rows={3} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg text-xs focus:outline-blue-500" />
                              </div>
                            ) : (
                              <textarea value={medPrescription} onChange={e => setMedPrescription(e.target.value)} placeholder={t('rcpt_ph_prescription', 'app')} rows={3} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('rcpt_detail_medical_notes', 'app')}</label>
                            {prevMedNotes ? (
                              <div className="flex">
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-2 rounded-l-lg border border-r-0 border-slate-200 whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">{prevMedNotes} -</span>
                                <textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder={t('rcpt_ph_add', 'app')} rows={2} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg text-xs focus:outline-blue-500" />
                              </div>
                            ) : (
                              <textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder={t('rcpt_ph_notes', 'app')} rows={2} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // Outros locais: visualização com lista de pacientes clicáveis
                  selectedLocation.currentPatients.map(pid => {
                    const pat = patients.find(p => p.id === pid);
                    const patName = pat?.name || patientNameMap[pid] || t('rcpt_patient_fallback', 'app');
                    const patPhone = pat?.phone || '';
                    const triage = pat?.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                    const triageColor = triage?.triage_color;
                    const colorDot: Record<string, string> = {
                      red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-amber-400', green: 'bg-green-500', blue: 'bg-blue-500',
                    };
                    return (
                      <div key={pid} onClick={() => setSelectedDetailPatientId(pid)} className="bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-teal-300 hover:bg-teal-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{patName}</p>
                              {patPhone && <p className="text-xs text-slate-500">{patPhone}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {triageColor && (
                              <span className={`w-2.5 h-2.5 rounded-full ${colorDot[triageColor] || ''}`} />
                            )}
                            <span className="text-xs text-slate-400">→</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-right">{selectedLocation.currentPatients.length > 1 ? `${selectedLocation.currentPatients.indexOf(pid) + 1}{t('rcpt_queue_position', 'app')}` : ''}{t('rcpt_locations_n_patients', 'app').split('{count}')[1] ? t('rcpt_dist_view_details', 'app') : ''}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100">
                {(selectedLocation.capacity === 1 && selectedLocation.currentPatients.length === 1) || selectedDetailPatientId ? (
                  // Consultório OU detalhe de paciente em local não-consultório: botões {t('rcpt_detail_redirect', 'app')} + {t('rcpt_detail_finalize', 'app')}
                  (() => {
                    const pid = selectedLocation.capacity === 1 ? selectedLocation.currentPatients[0] : selectedDetailPatientId!;
                    return (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const pat = patientsRef.current.find(p => p.id === pid);
                            const triage = pat?.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                            const vitals = triage?.vital_signs;
                            const triageEdits = hasTriageEdits ? {
                              diagnosis: editTriageReason || null,
                              vital_signs: { bp: editTriageBP || null, temp: editTriageTemp || null, spo2: editTriageSpo2 || null, hr: editTriageHR || null, rr: editTriageRR || null },
                            } : null;
                            pendingMedDataRef.current = {
                              pid,
                              medData: {
                                diagnosis: prevMedDiagnosis ? (medDiagnosis ? `${prevMedDiagnosis} - ${medDiagnosis}` : prevMedDiagnosis) : medDiagnosis || '',
                                cid10: prevMedCid10 ? (medCid10 ? `${prevMedCid10} - ${medCid10}` : prevMedCid10) : (medCid10 || 'Z00.0'),
                                prescriptions: prevMedPrescription ? (medPrescription ? [`${prevMedPrescription} - ${medPrescription}`] : [prevMedPrescription]) : (medPrescription ? medPrescription.split('\n').filter(Boolean) : []),
                                notes: prevMedNotes ? (medNotes ? `${prevMedNotes} - ${medNotes}` : prevMedNotes) : (medNotes || ''),
                                doctor: t('rcpt_doctor', 'app'),
                                location_name: selectedLocation?.name || null,
                                triage_edits: triageEdits,
                                vital_signs: hasTriageEdits ? {
                                  bp: editTriageBP || vitals?.bp || '', temp: editTriageTemp || vitals?.temp || '',
                                  spo2: editTriageSpo2 || vitals?.spo2 || '', hr: editTriageHR || vitals?.hr || '',
                                  rr: editTriageRR || vitals?.rr || '', weight: vitals?.weight || '', height: vitals?.height || '', imc: vitals?.imc || '',
                                } : vitals || null,
                                triage_priority: triage?.triage_priority || null,
                                triage_color: triage?.triage_color || null,
                                preliminary_procedures: triage?.preliminary_procedures || [],
                                attached_files: triage?.attached_files || [],
                                triaged_at: triage?.triaged_at || null,
                              },
                            };
                            const patFinal = patientsRef.current.find(p => p.id === pid);
                            if (patFinal) { setRedirectPatient(patFinal); setShowRedirectModal(true); setShowLocationDetail(false); setSelectedDetailPatientId(null); setMedDiagnosis(''); setMedCid10(''); setMedPrescription(''); setMedNotes(''); setPrevMedDiagnosis(''); setPrevMedCid10(''); setPrevMedPrescription(''); setPrevMedNotes(''); setIsEditingTriage(false); setHasTriageEdits(false); }
                          }}
                          className="flex-1 py-2.5 text-sm font-bold rounded-lg transition cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center gap-1"
                        >
                          <ChevronRight className="w-4 h-4" /> {t('rcpt_detail_redirect', 'app')}
                        </button>
                        <button
                          onClick={async () => {
                            if (!medDiagnosis.trim()) { alert(t('rcpt_alert_fill_diagnosis', 'app')); return; }
                            if (!confirm(t('rcpt_confirm_finalize', 'app'))) return;
                            const pat = patientsRef.current.find(p => p.id === pid);
                            const triage = pat?.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                            const vitals = triage?.vital_signs;
                            const triageEdits = hasTriageEdits ? {
                              diagnosis: editTriageReason || null,
                              vital_signs: {
                                bp: editTriageBP || null,
                                temp: editTriageTemp || null,
                                spo2: editTriageSpo2 || null,
                                hr: editTriageHR || null,
                                rr: editTriageRR || null,
                              },
                            } : null;
                            if (supabase && pat) {
                              try {
                                const medData = {
                                  diagnosis: prevMedDiagnosis ? (medDiagnosis ? `${prevMedDiagnosis} - ${medDiagnosis}` : prevMedDiagnosis) : medDiagnosis || '',
                                  cid10: prevMedCid10 ? (medCid10 ? `${prevMedCid10} - ${medCid10}` : prevMedCid10) : (medCid10 || 'Z00.0'),
                                  prescriptions: prevMedPrescription ? (medPrescription ? [`${prevMedPrescription} - ${medPrescription}`] : [prevMedPrescription]) : (medPrescription ? medPrescription.split('\n').filter(Boolean) : []),
                                  notes: prevMedNotes ? (medNotes ? `${prevMedNotes} - ${medNotes}` : prevMedNotes) : (medNotes || ''),
                                  doctor: t('rcpt_doctor', 'app'),
                                  location_name: selectedLocation?.name || null,
                                  triage_edits: triageEdits,
                                  vital_signs: isEditingTriage ? {
                                    bp: editTriageBP || vitals?.bp || '',
                                    temp: editTriageTemp || vitals?.temp || '',
                                    spo2: editTriageSpo2 || vitals?.spo2 || '',
                                    hr: editTriageHR || vitals?.hr || '',
                                    rr: editTriageRR || vitals?.rr || '',
                                    weight: vitals?.weight || '',
                                    height: vitals?.height || '',
                                    imc: vitals?.imc || '',
                                  } : vitals || null,
                                  triage_priority: triage?.triage_priority || null,
                                  triage_color: triage?.triage_color || null,
                                  preliminary_procedures: triage?.preliminary_procedures || [],
                                  attached_files: triage?.attached_files || [],
                                  triaged_at: triage?.triaged_at || null,
                                };
const medEntry = { id: `his_med_${++hisMedCounterRef.current}`, date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString(), type: 'Consulta Médica', ...medData };
                                const { error } = await supabase.from('clinical_history').insert({ ...medEntry, patient_id: pid });
                                if (error) {
                                  console.error('[SUPABASE] INSERT medical consultation FAILED:', error.message);
                                } else {
                                  console.log('[SUPABASE] INSERT medical consultation OK:', medEntry.id);
                                  setPatients(prev => prev.map(p => p.id === pid ? { ...p, clinicalHistory: [{ ...medEntry, patient_id: pid } as any, ...(p.clinicalHistory || [])] } : p));
                                }
                              } catch (err) {
                                console.error('[SUPABASE] SAVE medical consultation FAILED:', err);
                              }
                            }
                            handleCompleteSpecificPatient(selectedLocation.id, pid);
                            setShowLocationDetail(false);
                            setSelectedLocation(null);
                            setSelectedDetailPatientId(null);
                            setMedDiagnosis(''); setMedCid10(''); setMedPrescription(''); setMedNotes(''); setPrevMedDiagnosis(''); setPrevMedCid10(''); setPrevMedPrescription(''); setPrevMedNotes(''); setIsEditingTriage(false);
                          }}
                          className="flex-1 py-2.5 text-sm font-bold rounded-lg transition cursor-pointer bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" /> {t('rcpt_detail_finalize', 'app')}
                        </button>
                      </div>
                    );
                  })()
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

