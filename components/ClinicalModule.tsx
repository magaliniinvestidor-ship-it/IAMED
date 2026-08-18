'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Patient, AsoExam, Cid10Code, ExamRequest, Procedure, Anamnese, SoapNote, Diagnosis, PhysicalExam, VitalSigns, AllergyEntry, MedicationEntry, FamilyHistoryEntry, SurgicalEntry, ElectronicSignature, AccessControl, PatientTimelineEvent, DrugCatalogItem, Professional, sensitiveFieldConfig } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { getVitalsBands, classifyBmiForAge } from '@/lib/vitals/vitalsLimits';
import { useModuleId } from '@/hooks/useModuleId';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import {
  prescriptionSchema,
  anamneseSchema,
  physicalExamSchema,
  soapSchema,
  examRequestSchema,
  procedureSchema,
  attachmentSchema,
  diagnosisSchema,
  ATTACHMENT_CATEGORIES,
  type AttachmentCategory,
} from '@/lib/validation/schemas';
import { FormField, FormErrorSummary } from '@/components/forms';
import { SnomedSearchBox } from '@/components/clinical/SnomedSearchBox';
import {
  PROCEDURE_CATEGORIES,
  PROCEDURE_NOMENCLATURES,
  sigtapCatalog,
  cbhpmCatalog,
  type ProcedureCatalogItem,
  type ProcedureCategory,
  type ProcedureFinanciador,
  type ProcedureNomenclature,
} from '@/lib/procedures/catalog';
import { getSignatureProvider, SignableDocument } from '@/lib/signature/provider';
import { checkInteractions, checkAllergies, SafetyAlert } from '@/lib/prescription/safetyChecks';
import { generateQrDataUrl, buildPrescriptionQrPayload, buildPrescriptionVerifyUrl } from '@/lib/prescription/qrCode';
import { buildExamQrPayload, buildExamVerifyUrl } from '@/lib/exam/examQr';
import { buildProcedureQrPayload, buildProcedureVerifyUrl } from '@/lib/exam/procedureQr';
import { calculatePediatricDoseByWeight, calculateBodySurfaceArea } from '@/lib/prescription/pediatricDose';
import { compressImageFile } from '@/lib/imageUtils';

import {
  ClipboardList, Microscope, HeartPulse, ShieldAlert,
  Send, Plus, FileDown, Check, Eye, Trash2, Sliders, AlertCircle, Pencil,
  Search, Filter, Pill, Stethoscope, FileText, Paperclip,
  Shield, Clock, User, Activity, AlertTriangle, QrCode, Hash,
  ChevronDown, ChevronRight, Lock, Unlock, Printer, Calendar,
  BookOpen, Tag, FileSignature, Scan, Users, X,
  Lock as LockIcon
} from 'lucide-react';
import { PermissionGate, WithPermissions, useUserPermissions } from '@/components/ui/PermissionGate';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { hasPermission } from '@/lib/usePermissions';
import I18nDatePicker from '@/components/I18nDatePicker';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface ClinicalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  asos: AsoExam[];
  setAsos: React.Dispatch<React.SetStateAction<AsoExam[]>>;
  professionals?: Professional[];
  userPermissions?: string[];
  activeOperator?: string;
  activeOperatorEmail?: string;
}

// HCE Tab type
type HCETab = 'anamnese' | 'exam' | 'soap' | 'diagnoses' | 'prescriptions' | 'exams' | 'procedures' | 'attachments' | 'signatures' | 'timeline' | 'security';

// Modelo de receita com múltiplos medicamentos: cabeçalho + itens
interface PrescriptionHeader {
  id: string;
  patientId: string;
  createdBy: string;
  createdAt: string;
  status: 'rascunho' | 'assinado' | 'cancelado' | 'dispensado';
  signedAt?: string;
  signatureId?: string;
  qrCodeData: string;
}

interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  position: number;
  prescriptionType: 'comum' | 'controlado' | 'arquivado';
  drugName: string;
  activeIngredient: string;
  presentation: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  startDate: string;
  quantity: number;
  unit: string;
  notes: string;
  snomedCode?: string;
  snomedDescription?: string;
}

// CID-10 seed data inline for lookup


const timelineEventTypes = ['consulta', 'internacao', 'cirurgia', 'exame', 'prescricao', 'vacina', 'procedimento', 'alta', 'emergencia'] as const;

const PROCEDURE_CATEGORY_I18N_KEY: Record<ProcedureCategory, string> = {
  Consulta: 'hce_category_consulta',
  Procedimento: 'hce_category_procedimento',
  'Laboratório': 'hce_category_laboratorio',
  Imagem: 'hce_category_imagem',
  Fisioterapia: 'hce_category_fisioterapia',
  Enfermagem: 'hce_category_enfermagem',
  Psicologia: 'hce_category_psicologia',
  'Nutrição': 'hce_category_nutricao',
  Odontologia: 'hce_category_odontologia',
  'Educação Física': 'hce_category_educacao_fisica',
  Fonoaudiologia: 'hce_category_fonoaudiologia',
  'Terapia Ocupacional': 'hce_category_terapia_ocupacional',
};

export default function ClinicalModule(props: ClinicalModuleProps) {
  const { userPermissions = [], ...rest } = props;
  
  return (
    <WithPermissions userPermissions={userPermissions}>
      <PermissionGate view="hce" userPermissions={userPermissions}>
        <ClinicalModuleContent {...rest} />
      </PermissionGate>
    </WithPermissions>
  );
}

const ClinicalModuleContent = ({
  patients,
  setPatients,
  activeSubmodule,
  addAuditLog,
  asos,
  setAsos,
  professionals = [],
  activeOperator = 'Operador',
  activeOperatorEmail = '',
}: ClinicalModuleProps) => {
  const { t, locale } = useI18n();
  const userPermissions = useUserPermissions();
  const hasSensitiveAccess = hasPermission(userPermissions, 'view_sensitive');
  const activeProfessional = useMemo(() => {
    const norm = (s: string) => s?.toLowerCase().trim();
    if (activeOperatorEmail) {
      const byEmail = professionals.find(p => norm(p.email) === norm(activeOperatorEmail));
      if (byEmail) return byEmail;
    }
    const byName = professionals.find(p => norm(p.name) === norm(activeOperator));
    if (byName) return byName;
    return professionals.find(p => p.council && p.council !== 'N/A' && p.councilNumber) || professionals[0] || null;
  }, [professionals, activeOperator, activeOperatorEmail]);

  // Patient selection
  const [selectedPatId, setSelectedPatId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientDropdownRef = React.useRef<HTMLDivElement>(null);

  // HCE Tabs
  const [hceTab, setHceTab] = useState<HCETab>('anamnese');

  // ─── ANAMNESE STATE ───
  const [anamneseList, setAnamneseList] = useState<Anamnese[]>([]);
  const [anamnese, setAnamnese] = useState<Anamnese>({
    id: '', patientId: '', createdBy: '', createdAt: '', updatedAt: '',
    personalPathological: [], smoking: '', alcohol: '', physicalActivity: '',
    diet: '', sleep: '', familyHistory: [], allergies: [], currentMedications: [],
    surgicalHistory: [], gynecological: null, obstetric: null,
    occupation: '', maritalStatus: '', notes: '',
  });
  const [newAllergy, setNewAllergy] = useState<AllergyEntry>({ allergen: '', type: '', severity: '' as any, reaction: '', snomedCode: '', snomedDescription: '' });
  const [newMedication, setNewMedication] = useState<MedicationEntry>({ name: '', dosage: '', frequency: '', route: '', since: '' });
  const [newFamily, setNewFamily] = useState<FamilyHistoryEntry>({ relation: '', condition: '', age: undefined, deceased: false });
  const [newSurgery, setNewSurgery] = useState<SurgicalEntry>({ procedure: '', date: '', hospital: '', complications: '' });

  // ─── EXAME FÍSICO STATE ───
  const [physicalExamList, setPhysicalExamList] = useState<PhysicalExam[]>([]);
  const [physicalExam, setPhysicalExam] = useState<PhysicalExam>({
    id: '', patientId: '', createdBy: '', createdAt: '',
    vitalSigns: {}, examHeadNeck: '', examCardiovascular: '', examRespiratory: '',
    examAbdomen: '', examGenitourinary: '', examMusculoskeletal: '', examNeurological: '',
    examSkin: '', examEyes: '', examEars: '', examMouth: '', examRectal: '', examPsychiatric: '',
    generalAspect: '', notes: '',
  });

  // ─── SOAP STATE ───
  const [soapList, setSoapList] = useState<SoapNote[]>([]);
  const [soapNote, setSoapNote] = useState<SoapNote>({
    id: '', patientId: '', createdBy: '', createdAt: '',
    subjective: '', objective: '', assessment: '', plan: '', notes: '',
  });

  // ─── CID-10 STATE ───
  const [cid10Data, setCid10Data] = useState<Cid10Code[]>([]);
  const [cidSearch, setCidSearch] = useState('');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [newDiagnosis, setNewDiagnosis] = useState<Partial<Diagnosis>>({
    cid10Code: '', cid10Description: '', diagnosisType: 'principal', status: 'ativo', notes: '', snomedCode: '', snomedDescription: '',
  });
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null);
  const [editingItem, setEditingItem] = useState<PrescriptionItem | null>(null);
  const [editingExamRequest, setEditingExamRequest] = useState<ExamRequest | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

  // ─── PRESCRIPTION STATE (cabeçalho + itens) ───
  const [prescriptions, setPrescriptions] = useState<PrescriptionHeader[]>([]);
  const [allItems, setAllItems] = useState<PrescriptionItem[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    drugName: '', activeIngredient: '', presentation: '',
    dosage: '', frequency: '', route: 'oral', duration: '', quantity: 1, unit: 'comprimidos', notes: '',
    snomedCode: '', snomedDescription: '',
    prescriptionType: '' as '' | 'comum' | 'controlado' | 'arquivado',
  });
  const [drugCatalogItems, setDrugCatalogItems] = useState<DrugCatalogItem[]>([]);
  const [drugSearch, setDrugSearch] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);

  // Alertas de segurança medicamentosa (interações + alergias)
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [prescQrDataUrl, setPrescQrDataUrl] = useState('');
  const [pediatricDoseModal, setPediatricDoseModal] = useState<{ weight: string; height: string; dosePerKgPerDay: string; dosesPerDay: string; result: string } | null>(null);
  const [sendModal, setSendModal] = useState(false);
  const [sentChannels, setSentChannels] = useState<{ whatsapp: boolean; email: boolean }>({ whatsapp: false, email: false });

  // Rastreia receitas já persistidas no banco
  const persistedPrescIdsRef = useRef<Set<string>>(new Set());

  // Itens e cabeçalho da receita selecionada
  const selectedItems = useMemo(
    () => (selectedPrescriptionId
      ? allItems.filter(i => i.prescriptionId === selectedPrescriptionId).sort((a, b) => a.position - b.position)
      : []),
    [allItems, selectedPrescriptionId]
  );
  const selectedHeader = useMemo(
    () => prescriptions.find(p => p.id === selectedPrescriptionId) || null,
    [prescriptions, selectedPrescriptionId]
  );

  // Número da receita pela ordem de criação (1 = primeira receita criada)
  const prescChronoRank = useMemo(() => {
    const sorted = [...prescriptions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const rank: Record<string, number> = {};
    sorted.forEach((p, i) => { rank[p.id] = i + 1; });
    return rank;
  }, [prescriptions]);

  const searchDrugCatalog = useCallback(async (query: string) => {
    if (!supabase) return;
    if (!query.trim()) {
      const { data } = await supabase
        .from('drug_catalog')
        .select('id, name, active_ingredient, presentation, manufacturer, category, controlled_category, requires_prescription, source, source_id, country, default_dosage, default_frequency, default_duration, common_dose_adult, route, snomed_code, snomed_description')
        .order('name')
        .limit(100);
      if (data) setDrugCatalogItems(data as any);
      return;
    }
    const { data } = await supabase
      .from('drug_catalog')
      .select('id, name, active_ingredient, presentation, manufacturer, category, controlled_category, requires_prescription, source, source_id, country, default_dosage, default_frequency, default_duration, common_dose_adult, route, snomed_code, snomed_description')
      .or(`name.ilike.%${query}%,active_ingredient.ilike.%${query}%,name_es.ilike.%${query}%,name_pt.ilike.%${query}%,name_en.ilike.%${query}%`)
      .order('name')
      .limit(100);
    if (data) setDrugCatalogItems(data as any);
  }, []);

  // ─── EXAM REQUEST STATE ───
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [examRequestForm, setExamRequestForm] = useState({
    examType: '' as '' | 'laboratorio' | 'imagem' | 'anatomia_patologica' | 'outro',
    examName: '', clinicalIndication: '', urgency: '' as '' | 'rotina' | 'urgente' | 'emergencia',
    examCatalogId: '',
  });
  const [examCatalog, setExamCatalog] = useState<{ id: string; examType: string; category: string; name: string }[]>([]);
  const [examQrDataUrl, setExamQrDataUrl] = useState('');
  const [examQrPayload, setExamQrPayload] = useState('');
  const [examGroupSelection, setExamGroupSelection] = useState<'open' | string | null>(null);
  const [procGroupSelection, setProcGroupSelection] = useState<'open' | string | null>(null);
  const [procQrDataUrl, setProcQrDataUrl] = useState('');
  const [procQrPayload, setProcQrPayload] = useState('');

  const unsignedExams = useMemo(
    () => examRequests.filter(e => e.status !== 'cancelado' && !e.signedAt),
    [examRequests]
  );

  // Solicitação em aberto = exames ainda não assinados (inclui cancelados p/ visualização)
  const openGroupExams = useMemo(
    () => examRequests.filter(e => !e.signedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [examRequests]
  );

  // Agrupa exames assinados pelo documento de assinatura (mesma assinatura = mesmo grupo)
  const examSignedGroups = useMemo(() => {
    const map = new Map<string, { signatureId: string; signedAt: string; signedBy: string; exams: ExamRequest[] }>();
    examRequests.forEach(e => {
      if (!e.signedAt || !e.signatureId) return;
      const key = e.signatureId;
      if (!map.has(key)) map.set(key, { signatureId: key, signedAt: e.signedAt || '', signedBy: e.signedBy || '', exams: [] });
      map.get(key)!.exams.push(e);
    });
    return [...map.values()]
      .map(g => ({ ...g, exams: [...g.exams].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }))
      .sort((a, b) => b.signedAt.localeCompare(a.signedAt));
  }, [examRequests]);

  const activeExamGroupId = examGroupSelection ?? 'open';
  const activeGroupExams = useMemo(() => {
    if (activeExamGroupId === 'open') return openGroupExams;
    return examSignedGroups.find(g => g.signatureId === activeExamGroupId)?.exams ?? [];
  }, [activeExamGroupId, openGroupExams, examSignedGroups]);

  // ─── LOAD EXAM CATALOG (mundial, traduzido pelo locale ativo) ───
  const loadExamCatalog = useCallback(async () => {
    if (!supabase) return;
    try {
      const [catRes, trRes] = await Promise.all([
        supabase.from('exam_catalog').select('id, exam_type, category, active').eq('active', true),
        supabase.from('exam_catalog_translations').select('catalog_id, locale, name'),
      ]);
      if (catRes.error || trRes.error) return;
      const trans = (trRes.data || []) as { catalog_id: string; locale: string; name: string }[];
      const lang = locale.startsWith('pt') ? (locale === 'pt-BR' ? 'pt-BR' : 'pt-PT') : locale.startsWith('es') ? locale : 'en';
      const byCat: Record<string, Record<string, string>> = {};
      trans.forEach(tr => { (byCat[tr.catalog_id] = byCat[tr.catalog_id] || {})[tr.locale] = tr.name; });
      setExamCatalog((catRes.data || []).map((c: any) => ({
        id: c.id,
        examType: c.exam_type,
        category: c.category || '',
        name: (byCat[c.id] && (byCat[c.id][lang] || byCat[c.id].en || byCat[c.id]['pt-BR'] || Object.values(byCat[c.id])[0])) || c.id,
      })));
    } catch (err) {
      console.error('[SUPABASE] Load exam catalog FAILED:', err);
    }
  }, [locale]);

  useEffect(() => { loadExamCatalog(); }, [loadExamCatalog]);

  // ─── PROCEDURE STATE ───
  const [procedureList, setProcedureList] = useState<Procedure[]>([]);
  const [procedureForm, setProcedureForm] = useState({
    procedureCode: '', procedureName: '', procedureCategory: '', quantity: 1, notes: '',
    snomedCode: '', snomedDescription: '',
    status: '' as '' | 'programado' | 'em_execucao' | 'concluido' | 'cancelado',
    nomenclature: '' as '' | ProcedureNomenclature,
    financingEntity: '',
  });
  const [procedureNomenclature, setProcedureNomenclature] = useState<'' | ProcedureNomenclature>('');
  const [procCodeQuery, setProcCodeQuery] = useState('');
  const [procCodeOpen, setProcCodeOpen] = useState(false);
  const [financiadorCatalog, setFinanciadorCatalog] = useState<ProcedureCatalogItem[]>([]);
  const [procedureCatalog, setProcedureCatalog] = useState<ProcedureCatalogItem[]>([]);

  // ─── ATTACHMENT STATE ───
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentForm, setAttachmentForm] = useState<{
    category: '' | AttachmentCategory;
    description: string;
    isSensitive: boolean;
  }>({
    category: '',
    description: '',
    isSensitive: false,
  });
  const [pendingDeleteAttachmentId, setPendingDeleteAttachmentId] = useState<string | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    attachment: any;
    signedUrl: string;
    loading: boolean;
  } | null>(null);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedAttachment = useMemo(
    () => attachments.find(a => a.id === selectedAttachmentId) || null,
    [attachments, selectedAttachmentId]
  );

  // ─── SIGNATURE STATE ───
  const [signatures, setSignatures] = useState<ElectronicSignature[]>([]);
  const [signFilterType, setSignFilterType] = useState('all');
  const [signFilterProfessional, setSignFilterProfessional] = useState('all');
  const [signDateFrom, setSignDateFrom] = useState('');
  const [signDateTo, setSignDateTo] = useState('');

  // ─── PROCEDURES: agrupamento por solicitação (assinada ou em aberto) ───
  const unsignedProcedures = useMemo(
    () => procedureList.filter(p => p.status !== 'cancelado' && !p.signedAt),
    [procedureList]
  );

  // Solicitação em aberto = procedimentos ainda não assinados (inclui cancelados p/ visualização)
  const openGroupProcedures = useMemo(
    () => procedureList.filter(p => !p.signedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [procedureList]
  );

  // Agrupa procedimentos assinados pelo documento de assinatura (mesma assinatura = mesmo grupo)
  const procSignedGroups = useMemo(() => {
    const map = new Map<string, { signatureId: string; signedAt: string; signedBy: string; procedures: Procedure[] }>();
    procedureList.forEach(p => {
      if (!p.signedAt || !p.signatureId) return;
      const key = p.signatureId;
      if (!map.has(key)) map.set(key, { signatureId: key, signedAt: p.signedAt || '', signedBy: p.signedBy || '', procedures: [] });
      map.get(key)!.procedures.push(p);
    });
    return [...map.values()]
      .map(g => ({ ...g, procedures: [...g.procedures].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }))
      .sort((a, b) => b.signedAt.localeCompare(a.signedAt));
  }, [procedureList]);

  const activeProcGroupId = procGroupSelection ?? 'open';
  const activeGroupProcedures = useMemo(() => {
    if (activeProcGroupId === 'open') return openGroupProcedures;
    return procSignedGroups.find(g => g.signatureId === activeProcGroupId)?.procedures ?? [];
  }, [activeProcGroupId, openGroupProcedures, procSignedGroups]);

  const activeProcSignature = useMemo(() => {
    if (activeProcGroupId === 'open') return null;
    return signatures.find(s => s.id === activeProcGroupId && s.documentType === 'procedimento') ?? null;
  }, [activeProcGroupId, signatures]);

  // Regenera o QR da assinatura a partir de dados persistidos (após refresh da página)
  const activeExamSignature = useMemo(() => {
    if (activeExamGroupId === 'open') return null;
    return signatures.find(s => s.id === activeExamGroupId && s.documentType === 'exame') ?? null;
  }, [activeExamGroupId, signatures]);

  // ─── TIMELINE STATE ───
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineFilterType, setTimelineFilterType] = useState<string>('all');
  const [timelineFilterDoctor, setTimelineFilterDoctor] = useState('');
  const [timelineDateFrom, setTimelineDateFrom] = useState('');
  const [timelineDateTo, setTimelineDateTo] = useState('');
  const [timelineInternments, setTimelineInternments] = useState<PatientTimelineEvent[]>([]);
  const [timelineSurgeries, setTimelineSurgeries] = useState<PatientTimelineEvent[]>([]);

  // ─── SECURITY STATE ───
  const [breakGlassActive, setBreakGlassActive] = useState(false);
  const [breakGlassJustification, setBreakGlassJustification] = useState('');
  const breakGlassTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessControl[]>([]);
  const activeSessionRef = useRef<{ id: string; patientId: string; fields: string[] } | null>(null);
  const accessLogQueueRef = useRef<Promise<void>>(Promise.resolve());
  const hceTabRef = useRef<HCETab>(hceTab);
  const [careTeam, setCareTeam] = useState<{ id: string; professionalName: string; role: string }[]>([]);
  const [careTeamLoaded, setCareTeamLoaded] = useState(false);
  const [careTeamProfId, setCareTeamProfId] = useState('');
  const [careTeamRole, setCareTeamRole] = useState('assistencial');

  // Diagnostic/Laboratory states (submodule 4)
  const [imageContrast, setImageContrast] = useState(100);
  const [imageBrightness, setImageBrightness] = useState(100);
  const [laboratoryNotes, setLaboratoryNotes] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('Raio-X Tórax');
  const [selectedImageUrl, setSelectedImageUrl] = useState('https://picsum.photos/seed/xray/600/400');

  // Occupational Medicine states
  const [asoPatient, setAsoPatient] = useState('');
  const [asoType, setAsoType] = useState<'Admissional' | 'Periódico' | 'Demissional'>('Periódico');
  const [asoRisks, setAsoRisks] = useState('Ruídos, Ergonomia');
  const [asoStatus, setAsoStatus] = useState<'apto' | 'inapto'>('apto');
  const [editingAso, setEditingAso] = useState<AsoExam | null>(null);
  const [catEmployee, setCatEmployee] = useState('');
  const [catDate, setCatDate] = useState('2026-06-21');
  const [catNotes, setCatNotes] = useState('');
  const [catRegistered, setCatRegistered] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatId);

  // Carrega o catálogo da entidade financiadora (fee_schedules) do paciente.
  // Quando o paciente tem convênio, o código do procedimento também pode vir
  // da tabela do financiador (além do nomenclador nacional).
  const financiadorType = (selectedPatient?.health_insurance_type ?? '') as ProcedureFinanciador;

  useEffect(() => {
    setFinanciadorCatalog([]);
    const isEntity = !!financiadorType && !['Particular', 'Mercosul'].includes(financiadorType);
    if (!supabase || !isEntity) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('fee_schedules')
        .select('procedure_code, procedure_name, insurance_name')
        .eq('insurance_type', financiadorType)
        .eq('active', true);
      if (cancelled || !data) return;
      const localFallback = [...sigtapCatalog, ...cbhpmCatalog];
      const lookupPool = procedureCatalog.length ? procedureCatalog : localFallback;
      const findCategory = (code: string) =>
        lookupPool.find(p => p.code === code.replace(/\D/g, '') && p.nomenclature === 'cbhpm')?.category;
      setFinanciadorCatalog(data.map(row => ({
        code: row.procedure_code,
        name: row.procedure_name,
        category: findCategory(row.procedure_code) ?? 'Procedimento',
        nomenclature: 'cbhpm' as ProcedureNomenclature,
        financingEntity: row.insurance_name,
      })));
    })();
    return () => { cancelled = true; };
  }, [financiadorType, procedureCatalog]);

  // Carrega o catálogo unificado de procedimentos (SIGTAP/CBHPM/SNS/IPS)
  // da tabela public.procedure_catalog. Quando o Supabase não está
  // disponível, mantém o fallback em memória (sigtapCatalog/cbhpmCatalog).
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from('procedure_catalog')
      .select('code, name, nomenclature, category, financing_entity, is_active')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Erro ao carregar procedure_catalog:', error.message);
          return;
        }
        setProcedureCatalog((data ?? []).map((d: any) => ({
          code: String(d.code),
          name: String(d.name),
          category: d.category ?? '',
          nomenclature: d.nomenclature as ProcedureNomenclature,
          financingEntity: d.financing_entity ?? undefined,
        })));
      });
    return () => { cancelled = true; };
  }, []);

  // Resultados do autocomplete do código do procedimento: catálogo da
  // entidade financiadora + nomenclador nacional (SIGTAP/CBHPM).
  const procCatalogResults = useMemo(() => {
    const q = procCodeQuery.trim().toLowerCase();
    if (!q) return [] as ProcedureCatalogItem[];
    const nomenclatures: ('' | ProcedureNomenclature)[] = procedureNomenclature
      ? [procedureNomenclature]
      : ['sigtap', 'cbhpm'];
    const pool = procedureCatalog.length
      ? procedureCatalog
      : [...sigtapCatalog, ...cbhpmCatalog];
    const national = pool.filter(it =>
      nomenclatures.includes(it.nomenclature as '' | ProcedureNomenclature) &&
      (it.code.toLowerCase().startsWith(q) || it.name.toLowerCase().includes(q))
    );
    const financiador = procedureNomenclature !== 'sigtap'
      ? financiadorCatalog.filter(f => f.code.toLowerCase().startsWith(q) || f.name.toLowerCase().includes(q))
      : [];
    const seen = new Set<string>();
    return [...financiador, ...national]
      .filter(item => {
        if (seen.has(item.code)) return false;
        seen.add(item.code);
        return true;
      })
      .slice(0, 30);
  }, [procCodeQuery, procedureNomenclature, financiadorCatalog, procedureCatalog]);

  const pickProcedureCatalogItem = (item: ProcedureCatalogItem) => {
    setProcedureForm(p => ({
      ...p,
      procedureCode: item.code,
      procedureName: item.name,
      procedureCategory: item.category,
      nomenclature: item.nomenclature,
      financingEntity: item.financingEntity ?? '',
    }));
    setProcedureNomenclature(item.nomenclature);
    setProcCodeQuery(item.code);
    setProcCodeOpen(false);
    clearProcErrors();
  };

  // Regenera o QR da assinatura a partir de dados persistidos (após refresh da página)
  useEffect(() => {
    if (!activeExamSignature || activeGroupExams.length === 0) return;
    if (examQrDataUrl && examQrPayload) return;
    const payload = buildExamQrPayload({
      id: activeExamSignature.documentId || activeExamSignature.id,
      patientId: selectedPatient?.id || activeExamSignature.patientId || '',
      patientName: selectedPatient?.name || '',
      createdAt: activeGroupExams.map(e => e.createdAt).sort()[0] || activeExamSignature.signedAt,
      signedAt: activeExamSignature.signedAt,
      verificationCode: activeExamSignature.verificationCode,
      items: activeGroupExams.map(e => ({
        id: e.id,
        name: e.examName,
        examType: e.examType,
        urgency: e.urgency,
      })),
    });
    generateQrDataUrl(buildExamVerifyUrl(payload)).then(url => {
      setExamQrPayload(payload);
      setExamQrDataUrl(url);
    });
  }, [activeExamSignature, activeGroupExams, examQrDataUrl, examQrPayload, selectedPatient]);

  // Regenera o QR da assinatura de procedimentos a partir de dados persistidos
  useEffect(() => {
    if (!activeProcSignature || activeGroupProcedures.length === 0) return;
    if (procQrDataUrl && procQrPayload) return;
    const payload = buildProcedureQrPayload({
      id: activeProcSignature.documentId || activeProcSignature.id,
      patientId: selectedPatient?.id || activeProcSignature.patientId || '',
      patientName: selectedPatient?.name || '',
      createdAt: activeGroupProcedures.map(p => p.createdAt).sort()[0] || activeProcSignature.signedAt,
      signedAt: activeProcSignature.signedAt,
      verificationCode: activeProcSignature.verificationCode,
      items: activeGroupProcedures.map(p => ({
        id: p.id,
        code: p.procedureCode,
        name: p.procedureName,
        category: p.procedureCategory,
        quantity: p.quantity,
      })),
    });
    generateQrDataUrl(buildProcedureVerifyUrl(payload)).then(url => {
      setProcQrPayload(payload);
      setProcQrDataUrl(url);
    });
  }, [activeProcSignature, activeGroupProcedures, procQrDataUrl, procQrPayload, selectedPatient]);

  const patientBirthdate = selectedPatient?.birthdate;

  const patientAgeMonths = useMemo(() => {
    const b = patientBirthdate ? new Date(patientBirthdate) : null;
    if (!b || isNaN(b.getTime())) return 999;
    const now = new Date();
    return (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  }, [patientBirthdate]);

  const vitalsLimits = useMemo(() => {
    const bands = getVitalsBands(patientAgeMonths);
    return { ...bands, label: t(bands.labelKey, 'app') };
  }, [patientAgeMonths, t]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  // ─── SEQUENTIAL ID GENERATION (Postgres RPC) ───
  const patientsRef = React.useRef(patients);
  patientsRef.current = patients;

  const notifCounterRef = React.useRef(0);

  const genId = useModuleId('next_clinical_id');
  const { errors: prescErrors, validate: validatePresc, setErrors: setPrescErrors, clearErrors: clearPrescErrors } = useFormValidation(prescriptionSchema);
  const { errors: anamneseErrors, validate: validateAnamnese, clearErrors: clearAnamneseErrors } = useFormValidation(anamneseSchema);
  const { errors: physicalExamErrors, validate: validatePhysicalExam, clearErrors: clearPhysicalExamErrors } = useFormValidation(physicalExamSchema);
  const { errors: soapErrors, validate: validateSoap, clearErrors: clearSoapErrors } = useFormValidation(soapSchema);
  const { errors: examErrors, validate: validateExam, clearErrors: clearExamErrors } = useFormValidation(examRequestSchema);
  const { errors: procErrors, validate: validateProc, clearErrors: clearProcErrors, setFieldError: setProcFieldError } = useFormValidation(procedureSchema);
  const { errors: attErrors, validate: validateAtt, clearErrors: clearAttErrors } = useFormValidation(attachmentSchema);
  const { errors: diagnosisErrors, validate: validateDiagnosis, clearErrors: clearDiagnosisErrors } = useFormValidation(diagnosisSchema);

  const anamneseFieldErrors = groupErrorsByPath(anamneseErrors);
  const physicalExamFieldErrors = groupErrorsByPath(physicalExamErrors);
  const soapFieldErrors = groupErrorsByPath(soapErrors);
  const prescFieldErrors = groupErrorsByPath(prescErrors);
  const examFieldErrors = groupErrorsByPath(examErrors);
  const procFieldErrors = groupErrorsByPath(procErrors);
  const attFieldErrors = groupErrorsByPath(attErrors);
  const diagnosisFieldErrors = groupErrorsByPath(diagnosisErrors);

  const switchHceTab = useCallback((tab: HCETab) => {
    clearAnamneseErrors();
    clearPhysicalExamErrors();
    clearSoapErrors();
    clearExamErrors();
    clearProcErrors();
    clearAttErrors();
    setPrescErrors([]);
    if (tab === 'exams') {
      setExamGroupSelection('open');
      setEditingExamRequest(null);
    }
    setHceTab(tab);
  }, [clearAnamneseErrors, clearPhysicalExamErrors, clearSoapErrors, clearExamErrors, clearProcErrors, clearAttErrors, setPrescErrors]);

  // Load CID-10 codes from Supabase (server-side search)
  useEffect(() => {
    if (!supabase) return;
    const loadCid10 = async () => {
      const { data } = await supabase.from('cid10_codes').select('code, description, description_es, description_pt, chapter, block').order('code').limit(100);
      if (data) setCid10Data(data);
    };
    loadCid10();
  }, []);

  // Load drug catalog from Supabase (carrega top-100 ordenado por nome)
  useEffect(() => {
    searchDrugCatalog('');
  }, [searchDrugCatalog]);

  const searchCid10 = useCallback(async (query: string) => {
    if (!supabase) return;
    if (!query.trim()) {
      const { data } = await supabase.from('cid10_codes').select('code, description, description_es, description_pt, chapter, block').order('code').limit(100);
      if (data) setCid10Data(data);
      return;
    }
    const { data } = await supabase.from('cid10_codes').select('code, description, description_es, description_pt, chapter, block')
      .or(`code.ilike.%${query}%,description.ilike.%${query}%,description_es.ilike.%${query}%,description_pt.ilike.%${query}%`)
      .order('code').limit(100);
    if (data) setCid10Data(data);
  }, []);

  // Initial state factories for form reset on patient change
  const makeAnamnese = useCallback((patientId: string): Anamnese => ({
    id: '', patientId, createdBy: '', createdAt: '', updatedAt: '',
    personalPathological: [], smoking: '', alcohol: '', physicalActivity: '',
    diet: '', sleep: '', familyHistory: [], allergies: [], currentMedications: [],
    surgicalHistory: [], gynecological: null, obstetric: null,
    occupation: '', maritalStatus: '', notes: '',
  }), []);

  const makePhysicalExam = useCallback((patientId: string): PhysicalExam => ({
    id: '', patientId, createdBy: '', createdAt: '',
    vitalSigns: {}, examHeadNeck: '', examCardiovascular: '', examRespiratory: '',
    examAbdomen: '', examGenitourinary: '', examMusculoskeletal: '', examNeurological: '',
    examSkin: '', examEyes: '', examEars: '', examMouth: '', examRectal: '', examPsychiatric: '',
    generalAspect: '', notes: '',
  }), []);

  const makeSoapNote = useCallback((patientId: string): SoapNote => ({
    id: '', patientId, createdBy: '', createdAt: '',
    subjective: '', objective: '', assessment: '', plan: '', notes: '',
  }), []);

  // ─── LOAD DATA FROM SUPABASE ───
  const loadPatientData = useCallback(async (patientId: string) => {
    if (!supabase || !patientId) return;

    const patient = patientsRef.current.find(p => p.id === patientId);
    const patientCivilStatus = patient?.civil_status || '';

    try {
      // Load anamnese collection (uma por atendimento)
      const { data: anamneseRows } = await supabase
        .from('anamnese')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });

      const anamneseList: Anamnese[] = (anamneseRows || []).map((r: any) => ({
        id: r.id,
        patientId: r.patient_id,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        updatedBy: r.updated_by || '',
        personalPathological: r.personal_pathological || [],
        smoking: r.smoking || '',
        alcohol: r.alcohol || '',
        physicalActivity: r.physical_activity || '',
        diet: r.diet || '',
        sleep: r.sleep || '',
        familyHistory: r.family_history || [],
        allergies: r.allergies || [],
        currentMedications: r.current_medications || [],
        surgicalHistory: r.surgical_history || [],
        gynecological: r.gynecological || null,
        obstetric: r.obstetric || null,
        occupation: r.occupation || '',
        maritalStatus: r.marital_status || '',
        notes: r.notes || '',
      }));
      setAnamneseList(anamneseList);

      const fresh = makeAnamnese(patientId);
      setAnamnese({ ...fresh, maritalStatus: patientCivilStatus });

      // Load physical exam
      const { data: examRows } = await supabase
        .from('physical_exams')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });

      const physicalExamList: PhysicalExam[] = (examRows || []).map((r: any) => ({
        id: r.id,
        patientId: r.patient_id,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedBy: r.updated_by || '',
        vitalSigns: r.vital_signs || {},
        examHeadNeck: r.exam_head_neck || '',
        examCardiovascular: r.exam_cardiovascular || '',
        examRespiratory: r.exam_respiratory || '',
        examAbdomen: r.exam_abdomen || '',
        examGenitourinary: r.exam_genitourinary || '',
        examMusculoskeletal: r.exam_musculoskeletal || '',
        examNeurological: r.exam_neurological || '',
        examSkin: r.exam_skin || '',
        examEyes: r.exam_eyes || '',
        examEars: r.exam_ears || '',
        examMouth: r.exam_mouth || '',
        examRectal: r.exam_rectal || '',
        examPsychiatric: r.exam_psychiatric || '',
        generalAspect: r.general_aspect || '',
        notes: r.notes || '',
      }));
      setPhysicalExamList(physicalExamList);

      const triageEntry = patient?.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
      const ts = triageEntry?.vital_signs;
      const triageVitalSigns = ts ? {
        weight: ts.weight || '',
        height: ts.height || '',
        bloodPressure: ts.bp || '',
        temperature: ts.temp || '',
        spo2: ts.spo2 || '',
        heartRate: ts.hr || '',
        respiratoryRate: ts.rr || '',
        imc: ts.imc || '',
      } : {};
      setPhysicalExam({ ...makePhysicalExam(patientId), vitalSigns: triageVitalSigns });

      // Load SOAP notes
      const { data: soapRows } = await supabase
        .from('soap_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });

      const soapList: SoapNote[] = (soapRows || []).map((r: any) => ({
        id: r.id,
        patientId: r.patient_id,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedBy: r.updated_by || '',
        subjective: r.subjective || '',
        objective: r.objective || '',
        assessment: r.assessment || '',
        plan: r.plan || '',
        notes: r.notes || '',
      }));
      setSoapList(soapList);
      setSoapNote(makeSoapNote(patientId));

      // Load diagnoses
      const { data: diagData } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (diagData) {
        setDiagnoses(diagData.map(d => ({
          id: d.id,
          patientId: d.patient_id,
          createdBy: d.created_by,
          createdAt: d.created_at,
          updatedBy: d.updated_by || '',
          cid10Code: d.cid10_code,
          cid10Description: d.cid10_description,
          snomedCode: d.snomed_code,
          snomedDescription: d.snomed_description,
          diagnosisType: d.diagnosis_type,
          status: d.status,
          notes: d.notes || '',
        })));
      }

      // Load prescriptions (headers)
      const { data: prescData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (prescData) {
        const headers: PrescriptionHeader[] = prescData.map(p => ({
          id: p.id,
          patientId: p.patient_id,
          createdBy: p.created_by,
          createdAt: p.created_at,
          status: p.status,
          signedAt: p.signed_at,
          signatureId: p.signature_id,
          qrCodeData: p.qr_code_data || '',
        })) as PrescriptionHeader[];
        setPrescriptions(headers);
        persistedPrescIdsRef.current = new Set(headers.map(h => h.id));

        // Load items of all headers (para exibição + timeline)
        let itemData: any[] = [];
        if (headers.length > 0) {
          const { data } = await supabase
            .from('prescription_items')
            .select('*')
            .in('prescription_id', headers.map(h => h.id))
            .order('position', { ascending: true });
          itemData = data || [];
        }
        setAllItems(itemData.map(i => ({
          id: i.id,
          prescriptionId: i.prescription_id,
          position: i.position,
          prescriptionType: i.prescription_type,
          drugName: i.drug_name,
          activeIngredient: i.active_ingredient || '',
          presentation: i.presentation || '',
          dosage: i.dosage || '',
          frequency: i.frequency || '',
          route: i.route || 'oral',
          duration: i.duration || '',
          startDate: i.start_date || '',
          quantity: i.quantity || 1,
          unit: i.unit || 'unidade',
          notes: i.notes || '',
          snomedCode: i.snomed_code || '',
          snomedDescription: i.snomed_description || '',
        })) as PrescriptionItem[]);
      } else {
        setPrescriptions([]);
        setAllItems([]);
        setSelectedPrescriptionId(null);
      }

      // Load exam requests
      const { data: examReqData } = await supabase
        .from('exam_requests')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (examReqData) {
        setExamRequests(examReqData.map(e => ({
          id: e.id,
          patientId: e.patient_id,
          createdBy: e.created_by,
          createdAt: e.created_at,
          updatedBy: e.updated_by || '',
          examType: e.exam_type,
          examName: e.exam_name,
          examCatalogId: e.exam_catalog_id || '',
          clinicalIndication: e.clinical_indication || '',
          urgency: e.urgency || 'rotina',
          status: e.status,
          resultNotes: e.result_notes || '',
          resultDate: e.result_date,
          signedBy: e.signed_by,
          signedAt: e.signed_at,
          signatureId: e.signature_id,
        })));
      }

      // Load procedures
      const { data: procData } = await supabase
        .from('procedures')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (procData) {
        setProcedureList(procData.map(p => ({
          id: p.id,
          patientId: p.patient_id,
          createdBy: p.created_by,
          createdAt: p.created_at,
          updatedBy: p.updated_by || '',
          procedureCode: p.procedure_code,
          procedureName: p.procedure_name,
          procedureCategory: p.procedure_category || '',
          quantity: p.quantity || 1,
          notes: p.notes || '',
          complications: p.complications || '',
          status: p.status,
          snomedCode: p.snomed_code || '',
          snomedDescription: p.snomed_description || '',
          performedAt: p.performed_at,
          signedBy: p.signed_by,
          signedAt: p.signed_at,
          signatureId: p.signature_id,
          nomenclature: p.nomenclature_source as ProcedureNomenclature | undefined,
          financingEntity: p.financing_entity || '',
        })));
      }

      // Load attachments
      const { data: attachData } = await supabase
        .from('clinical_attachments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (attachData) {
        setAttachments(attachData.map(a => ({
          id: a.id,
          patientId: a.patient_id,
          examRequestId: a.exam_request_id,
          createdBy: a.created_by,
          createdAt: a.created_at,
          updatedBy: a.updated_by || '',
          fileName: a.file_name,
          filePath: a.file_path,
          fileSizeBytes: a.file_size_bytes || 0,
          mimeType: a.mime_type || 'application/octet-stream',
          category: a.category,
          description: a.description || '',
          isSensitive: a.is_sensitive || false,
          signedBy: a.signed_by,
          signedAt: a.signed_at,
          signatureId: a.signature_id,
        })));
      }

      // Load signatures
      const { data: sigData } = await supabase
        .from('electronic_signatures')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (sigData) {
        setSignatures(sigData.map(s => ({
          id: s.id,
          signerId: s.signer_id,
          signerName: s.signer_name,
          signerCouncil: s.signer_council,
          signerCouncilNumber: s.signer_council_number,
          createdAt: s.created_at,
          documentType: s.document_type,
          documentId: s.document_id,
          patientId: s.patient_id,
          signatureHash: s.signature_hash,
          certificateSerial: s.certificate_serial || '',
          certificateIssuer: s.certificate_issuer || '',
          certificateValidFrom: s.certificate_valid_from,
          certificateValidTo: s.certificate_valid_to,
          timestampToken: s.timestamp_token || '',
          timestampAuthority: s.timestamp_authority || 'IAMED-TSA',
           ipAddress: s.ip_address || '',
          userAgent: s.user_agent || '',
          signedAt: s.signed_at,
          verificationCode: s.verification_code || '',
          status: s.status,
        })));
      }

      // Load access controls
      const { data: accessData } = await supabase
        .from('access_controls')
        .select('*')
        .eq('patient_id', patientId)
        .order('accessed_at', { ascending: false });

      if (accessData) {
        setAccessLogs(accessData.map(a => ({
          id: a.id,
          patientId: a.patient_id,
          accessedBy: a.accessed_by,
          accessedAt: a.accessed_at,
          accessType: a.access_type,
          justification: a.justification,
          fieldsAccessed: a.fields_accessed || [],
          ipAddress: a.ip_address || '',
          notifiedPrivacyOfficer: a.notified_privacy_officer || false,
          notificationSentAt: a.notification_sent_at,
          sessionEndAt: a.session_end_at || undefined,
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error);
    }
  }, [makeAnamnese, makePhysicalExam, makeSoapNote]);

  const loadClinicalEvents = useCallback(async (patientId: string) => {
    if (!supabase || !patientId) return;
    const internments: PatientTimelineEvent[] = [];
    const surgeries: PatientTimelineEvent[] = [];
    try {
      const { data: hospData } = await supabase
        .from('hospitalizations')
        .select('*')
        .eq('patient_id', patientId);
      if (hospData) {
        (hospData as any[]).forEach((h: any) => {
          internments.push({
            id: h.id,
            patientId,
            eventType: 'internacao',
            eventDate: h.admission_date || h.created_at || '',
            eventTitle: t('hce_event_internacao', 'app'),
            eventDescription: h.diagnosis || h.notes || '',
            eventSource: 'hospitalization',
            eventSourceId: h.id,
            doctorName: '',
            specialty: '',
            cid10Code: '',
          });
        });
      }
      const { data: surgData } = await supabase
        .from('surgeries')
        .select('*')
        .eq('patient_id', patientId);
      if (surgData) {
        (surgData as any[]).forEach((s: any) => {
          surgeries.push({
            id: s.id,
            patientId,
            eventType: 'cirurgia',
            eventDate: s.scheduled_date || s.created_at || '',
            eventTitle: t('hce_event_cirurgia', 'app'),
            eventDescription: s.notes || '',
            eventSource: 'surgery',
            eventSourceId: s.id,
            doctorName: s.surgeon || '',
            specialty: '',
            cid10Code: '',
          });
        });
      }
    } catch (err) {
      console.error('[SUPABASE] Load clinical events FAILED:', err);
    }
    setTimelineInternments(internments);
    setTimelineSurgeries(surgeries);
  }, [t]);

  // ─── LOAD CARE TEAM (equipe assistencial designada) ───
  const loadCareTeam = useCallback(async (patientId: string) => {
    setCareTeamLoaded(false);
    setCareTeam([]);
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('patient_care_team')
        .select('id, professional_name, role')
        .eq('patient_id', patientId)
        .eq('active', true);
      if (data) {
        setCareTeam(data.map((r: any) => ({ id: r.id, professionalName: r.professional_name, role: r.role })));
      }
    } catch (err) {
      console.error('[SUPABASE] Load care team FAILED:', err);
    } finally {
      setCareTeamLoaded(true);
    }
  }, []);

  // ─── ADD CARE TEAM MEMBER ───
  const handleAddCareTeamMember = useCallback(async () => {
    if (!selectedPatient || !careTeamProfId) return;
    const prof = professionals.find(p => p.id === careTeamProfId);
    if (!prof) return;
    if (careTeam.some(m => m.professionalName === prof.name)) {
      alert(t('hce_care_team_already', 'app'));
      return;
    }
    const newMember = {
      id: await genId('ct'),
      patientId: selectedPatient.id,
      professionalName: prof.name,
      role: careTeamRole,
    };
    setCareTeam(prev => [...prev, { id: newMember.id, professionalName: newMember.professionalName, role: newMember.role }]);
    if (supabase) {
      await supabase.from('patient_care_team').insert({
        id: newMember.id,
        patient_id: newMember.patientId,
        professional_name: newMember.professionalName,
        role: newMember.role,
        active: true,
      });
    }
    addAuditLog('Designou profissional na equipe assistencial', `Paciente: ${selectedPatient.name} | Prof: ${prof.name}`);
    setCareTeamProfId('');
  }, [selectedPatient, careTeamProfId, careTeam, careTeamRole, professionals, genId, addAuditLog, t]);

  // ─── REMOVE CARE TEAM MEMBER (soft delete) ───
  const handleRemoveCareTeamMember = useCallback(async (memberId: string) => {
    if (!selectedPatient) return;
    setCareTeam(prev => prev.filter(m => m.id !== memberId));
    if (supabase) {
      await supabase.from('patient_care_team').update({ active: false, updated_at: new Date().toISOString() }).eq('id', memberId);
    }
    addAuditLog('Removeu profissional da equipe assistencial', `Paciente: ${selectedPatient.name}`);
  }, [selectedPatient, addAuditLog]);

  // ─── SAVE ACCESS CONTROL (INSERT to Supabase) ───
  const handleSaveAccessControl = useCallback(async (log: AccessControl) => {
    setAccessLogs(prev => [log, ...prev]);
    if (supabase) {
      await supabase.from('access_controls').insert({
        id: log.id,
        patient_id: log.patientId,
        accessed_by: log.accessedBy,
        accessed_at: log.accessedAt,
        access_type: log.accessType,
        justification: log.justification,
        fields_accessed: log.fieldsAccessed,
        ip_address: log.ipAddress,
        notified_privacy_officer: log.notifiedPrivacyOfficer,
        notification_sent_at: log.notificationSentAt || null,
        session_end_at: log.sessionEndAt || null,
      });
    }
  }, []);

  // ─── CLOSE ACTIVE SESSION (atualiza session_end_at e fecha ref) ───
  const closeAccessSession = useCallback(async () => {
    const session = activeSessionRef.current;
    if (!session) return;
    if (supabase) {
      await supabase.from('access_controls')
        .update({ session_end_at: new Date().toISOString() })
        .eq('id', session.id);
    }
    setAccessLogs(prev => prev.map(l => l.id === session.id ? { ...l, sessionEndAt: new Date().toISOString() } : l));
    activeSessionRef.current = null;
  }, []);

  // ─── LOG NORMAL VIEW (1 registro por sessão de prontuário; acumula abas) ───
  const logHceView = useCallback(async (patientId: string) => {
    if (!supabase) return;
    const tab = 'hce_' + hceTabRef.current;

    const enqueue = async () => {
      const session = activeSessionRef.current;
      // Se já há sessão ativa para este paciente, apenas acumula a aba acessada
      if (session && session.patientId === patientId) {
        if (!session.fields.includes(tab)) {
          session.fields.push(tab);
          await supabase.from('access_controls')
            .update({ fields_accessed: session.fields })
            .eq('id', session.id);
          setAccessLogs(prev => prev.map(l => l.id === session.id ? { ...l, fieldsAccessed: [...session.fields] } : l));
        }
        return;
      }
      // Nova sessão: fecha a anterior (outro paciente) e cria novo registro
      if (session) {
        await closeAccessSession();
      }
      const logId = await genId('ac');
      const log: AccessControl = {
        id: logId,
        patientId,
        accessedBy: activeOperator,
        accessedAt: new Date().toISOString(),
        accessType: 'normal',
        justification: 'Visualização de rotina do HCE',
        fieldsAccessed: [tab],
        ipAddress: '192.168.1.1',
        notifiedPrivacyOfficer: false,
      };
      await handleSaveAccessControl(log);
      activeSessionRef.current = { id: logId, patientId, fields: [tab] };
    };

    // Serializa chamadas concorrentes para não duplicar registros (StrictMode, troca rápida de paciente)
    accessLogQueueRef.current = accessLogQueueRef.current.then(enqueue, enqueue);
    await accessLogQueueRef.current;
  }, [activeOperator, handleSaveAccessControl, closeAccessSession, genId]);

  // Regenera o QR code (data URL) a partir do payload armazenado, ao trocar de receita ou recarregar
  const prescQrDataUrlRef = useRef('');
  useEffect(() => { prescQrDataUrlRef.current = prescQrDataUrl; }, [prescQrDataUrl]);
  useEffect(() => {
    let cancelled = false;
    const regen = async () => {
      const payload = selectedHeader?.qrCodeData;
      if (payload && !prescQrDataUrlRef.current) {
        try {
          const url = await generateQrDataUrl(buildPrescriptionVerifyUrl(payload));
          if (!cancelled) setPrescQrDataUrl(url);
        } catch (err) {
          console.error('[QR] regenerate failed:', err);
        }
      } else if (!payload && prescQrDataUrlRef.current) {
        setPrescQrDataUrl('');
      }
    };
    regen();
    return () => { cancelled = true; };
  }, [selectedHeader?.id, selectedHeader?.qrCodeData]);

  useEffect(() => {
    setSentChannels({ whatsapp: false, email: false });
  }, [selectedPrescriptionId]);
  useEffect(() => {
    setSentChannels({ whatsapp: false, email: false });
  }, [selectedPrescriptionId]);

  // Mantém hceTabRef sincronizado e acumula a aba na sessão ativa (sem criar sessão nova)
  useEffect(() => {
    hceTabRef.current = hceTab;
    const session = activeSessionRef.current;
    if (session && session.patientId === selectedPatId && supabase) {
      const tab = 'hce_' + hceTab;
      if (!session.fields.includes(tab)) {
        session.fields.push(tab);
        supabase.from('access_controls')
          .update({ fields_accessed: session.fields })
          .eq('id', session.id);
        setAccessLogs(prev => prev.map(l => l.id === session.id ? { ...l, fieldsAccessed: [...session.fields] } : l));
      }
    }
  }, [hceTab, selectedPatId]);

  // Load data when patient changes
  useEffect(() => {
    if (selectedPatId) {
      loadPatientData(selectedPatId);
      loadClinicalEvents(selectedPatId);
      loadCareTeam(selectedPatId);
      logHceView(selectedPatId);
    }
  }, [selectedPatId, loadPatientData, loadClinicalEvents, loadCareTeam, logHceView]);

  useEffect(() => {
    return () => {
      if (breakGlassTimeoutRef.current) clearTimeout(breakGlassTimeoutRef.current);
      closeAccessSession();
    };
  }, [closeAccessSession]);

  // Reset form when patient changes (moved from useEffect to event handler)
  const handlePatientChange = useCallback((newPatientId: string) => {
    setSelectedPatId(newPatientId);
    setNewDiagnosis({ cid10Code: '', cid10Description: '', diagnosisType: 'principal', status: 'ativo', notes: '', snomedCode: '', snomedDescription: '' });
    setCidSearch('');
    setEditingDiagnosis(null);
    setEditingExamRequest(null);
    setExamGroupSelection(null);
    setEditingProcedure(null);
    setEditingItem(null);
    setSelectedPrescriptionId(null);
    setSafetyAlerts([]);
    setPrescQrDataUrl('');
    setSelectedAttachmentId(null);
    setAttachmentForm({ category: '', description: '', isSensitive: false });
    clearAttErrors();
    clearDiagnosisErrors();
    clearExamErrors();
    clearProcErrors();
    clearPrescErrors();
  }, [clearDiagnosisErrors, clearExamErrors, clearProcErrors, clearPrescErrors, clearAttErrors]);

  // ─── CID-10 LOOKUP ───
  const getCid10Description = useCallback((code: string, dbDescription: string, descriptionEs?: string, descriptionPt?: string) => {
    if (locale.startsWith('pt') && descriptionPt) return descriptionPt;
    if (locale.startsWith('es') && descriptionEs) return descriptionEs;
    return dbDescription;
  }, [locale]);

  const lookupCid10Translation = useCallback((code: string, fallbackDesc?: string): string => {
    const entry = cid10Data.find(c => c.code === code);
    if (entry) {
      return getCid10Description(entry.code, entry.description, entry.description_es, entry.description_pt) ?? '';
    }
    return fallbackDesc ?? '';
  }, [cid10Data, getCid10Description]);

  const filteredCid10 = useMemo(() => cid10Data, [cid10Data]);

  // ─── QR CODE GENERATION (simple hash) ───
  const generateQRData = useCallback((header: PrescriptionHeader, items: PrescriptionItem[]) => {
    const drugs = items.map(i => i.drugName).join('+');
    const data = `${header.id}|${header.patientId}|${drugs}|${header.createdBy}|${header.createdAt}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `IAMED-PRESC-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  }, []);

  // ─── SAVE SIGNATURE (INSERT to Supabase) ───
  const handleSaveSignature = useCallback(async (sig: ElectronicSignature) => {
    setSignatures(prev => [sig, ...prev]);
    addAuditLog('Assinatura Eletrônica Qualificada', `${sig.documentType}: ${sig.documentId}`);
    if (supabase) {
      await supabase.from('electronic_signatures').insert({
        id: sig.id,
        signer_id: sig.signerId,
        signer_name: sig.signerName,
        signer_council: sig.signerCouncil,
        signer_council_number: sig.signerCouncilNumber,
        document_type: sig.documentType,
        document_id: sig.documentId,
        patient_id: sig.patientId,
        signature_hash: sig.signatureHash,
        certificate_serial: sig.certificateSerial,
        certificate_issuer: sig.certificateIssuer,
        certificate_valid_from: sig.certificateValidFrom || null,
        certificate_valid_to: sig.certificateValidTo || null,
        timestamp_token: sig.timestampToken,
        timestamp_authority: sig.timestampAuthority,
        ip_address: sig.ipAddress,
        user_agent: sig.userAgent,
        signed_at: sig.signedAt,
        verification_code: sig.verificationCode,
        status: sig.status,
      });
    }
  }, [addAuditLog]);

  // ─── SIGNATURE (provider de Firma Electrónica Cualificada) ───
  const handleSignDocument = useCallback(async (docType: string, docId: string, content?: Record<string, unknown>) => {
    const doc: SignableDocument = {
      documentType: docType as any,
      documentId: docId,
      patientId: selectedPatient?.id || '',
      signerName: activeOperator,
      signerCouncil: 'CRM',
      signerCouncilNumber: 'CRM-PY 000000',
      content: content || {
        patientId: selectedPatient?.id || '',
        patientName: selectedPatient?.name || '',
        operator: activeOperator,
      },
    };
    const result = await getSignatureProvider().sign(doc);
    const sig: ElectronicSignature = {
      id: await genId('sig'),
      signerId: 'current_user',
      signerName: activeOperator,
      signerCouncil: 'CRM',
      signerCouncilNumber: 'CRM-PY 000000',
      createdAt: new Date().toISOString(),
      documentType: docType as any,
      documentId: docId,
      patientId: selectedPatient?.id || '',
      signatureHash: result.signatureHash,
      certificateSerial: result.certificateSerial,
      certificateIssuer: result.certificateIssuer,
      certificateValidFrom: result.certificateValidFrom,
      certificateValidTo: result.certificateValidTo,
      signedAt: result.signedAt,
      verificationCode: result.verificationCode,
      status: result.status,
      ipAddress: '192.168.1.1',
      userAgent: navigator.userAgent,
      timestampAuthority: result.timestampAuthority,
      timestampToken: result.timestampToken,
    };
    handleSaveSignature(sig);
    return sig;
  }, [selectedPatient, handleSaveSignature, activeOperator, genId]);

  // ─── BREAK THE GLASS ───
  const handleBreakGlass = useCallback(async () => {
    if (!breakGlassJustification.trim()) return;
    const accessedAt = new Date().toISOString();
    const log: AccessControl = {
      id: await genId('ac'),
      patientId: selectedPatient?.id || '',
      accessedBy: activeOperator,
      accessedAt,
      accessType: 'break_the_glass',
      justification: breakGlassJustification,
      fieldsAccessed: ['hce_completo'],
      ipAddress: '192.168.1.1',
      notifiedPrivacyOfficer: true,
      notificationSentAt: accessedAt,
    };
    handleSaveAccessControl(log);
    if (supabase) {
      await supabase.from('internal_notifications').insert({
        id: `notif_${++notifCounterRef.current}`,
        patient_name: selectedPatient?.name || '',
        from_location: activeOperator,
        to_location: 'Privacy Officer',
        message: `Quebra de vidro: ${activeOperator} acessou HCE de ${selectedPatient?.name || ''}. Justificativa: ${breakGlassJustification}`,
        read: false,
      });
    }
    setBreakGlassJustification('');
    addAuditLog('Quebra de Vidro (Emergência)', `Paciente: ${selectedPatient?.name}`);
    if (breakGlassTimeoutRef.current) clearTimeout(breakGlassTimeoutRef.current);
    breakGlassTimeoutRef.current = setTimeout(() => setBreakGlassActive(false), 10 * 60 * 1000);
  }, [breakGlassJustification, selectedPatient, activeOperator, addAuditLog, handleSaveAccessControl, genId]);

  // ─── SAVE ANAMNESE ───
  const handleSaveAnamnese = async () => {
    if (!confirm(t('hce_confirm_save_anamnese', 'app'))) return;
    const isEdit = !!anamnese.id;
    const result = validateAnamnese({
      patientId: selectedPatient?.id || '',
      notes: anamnese.notes || '',
      occupation: anamnese.occupation || '',
      smoking: anamnese.smoking || '',
      alcohol: anamnese.alcohol || '',
      diet: anamnese.diet || '',
      sleep: anamnese.sleep || '',
      physicalActivity: anamnese.physicalActivity || '',
      maritalStatus: anamnese.maritalStatus || '',
      personalPathological: anamnese.personalPathological.join(', '),
      menarche: anamnese.gynecological?.menarche || '',
      gestations: anamnese.gynecological?.gestations ?? 0,
      deliveries: anamnese.gynecological?.deliveries ?? 0,
      abortions: anamnese.gynecological?.abortions ?? 0,
      cesareans: anamnese.gynecological?.cesareans ?? 0,
      lastMenstruation: anamnese.gynecological?.lastMenstruation || '',
      contraceptiveMethod: anamnese.gynecological?.contraceptiveMethod || '',
      gestationNumber: anamnese.obstetric?.gestationNumber ?? 0,
      expectedDueDate: anamnese.obstetric?.expectedDueDate || '',
      prenatalStart: anamnese.obstetric?.prenatalStart || '',
      riskClassification: anamnese.obstetric?.riskClassification || '',
      allergiesCount: anamnese.allergies?.length || 0,
      medicationsCount: anamnese.currentMedications?.length || 0,
      familyHistoryCount: anamnese.familyHistory?.length || 0,
      surgicalHistoryCount: anamnese.surgicalHistory?.length || 0,
    });
    if (!result.success) return;
    const entry: Anamnese = {
      ...anamnese,
      id: anamnese.id || await genId('anam'),
      patientId: selectedPatient?.id || '',
      createdBy: anamnese.createdBy || activeOperator,
      createdAt: anamnese.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAnamnese(entry);
    if (isEdit) {
      setAnamneseList(prev => prev.map(item => item.id === entry.id ? entry : item));
    } else {
      setAnamneseList(prev => [...prev, entry]);
      if (selectedPatient) {
        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? {
          ...p,
          clinicalHistory: [
            { id: entry.id, date: entry.createdAt, type: 'Anamnese', diagnosis: entry.notes || 'Anamnese registrada', cid10: '', prescriptions: [], notes: entry.notes, doctor: entry.createdBy },
            ...p.clinicalHistory,
          ],
        } : p));
      }
    }
    addAuditLog('Salvou Anamnese', selectedPatient?.name || '');
    if (supabase) {
      const dbRow = {
        id: entry.id,
        patient_id: entry.patientId,
        created_by: entry.createdBy,
        updated_by: isEdit ? activeOperator : null,
        updated_at: entry.updatedAt,
        personal_pathological: entry.personalPathological,
        smoking: entry.smoking,
        alcohol: entry.alcohol,
        physical_activity: entry.physicalActivity,
        diet: entry.diet,
        sleep: entry.sleep,
        family_history: entry.familyHistory,
        allergies: entry.allergies,
        current_medications: entry.currentMedications,
        surgical_history: entry.surgicalHistory,
        gynecological: entry.gynecological,
        obstetric: entry.obstetric,
        occupation: entry.occupation,
        marital_status: entry.maritalStatus,
        notes: entry.notes,
      };
      if (isEdit) {
        await supabase.from('anamnese').update(dbRow).eq('id', entry.id);
      } else {
        await supabase.from('anamnese').insert(dbRow);
      }
    }
    if (!isEdit) {
      setAnamnese({ ...makeAnamnese(selectedPatient?.id || ''), maritalStatus: selectedPatient?.civil_status || '' });
    }
  };

  // ─── NEW ANAMNESE (limpa o formulário) ───
  const handleNewAnamnese = useCallback(() => {
    setAnamnese({ ...makeAnamnese(selectedPatient?.id || ''), maritalStatus: selectedPatient?.civil_status || '' });
    clearAnamneseErrors();
  }, [selectedPatient, makeAnamnese, clearAnamneseErrors]);

  // ─── OPEN ANAMNESE (seleciona um registro da lista) ───
  const handleSelectAnamnese = useCallback((record: Anamnese) => {
    setAnamnese(record);
    clearAnamneseErrors();
  }, [clearAnamneseErrors]);

  // ─── DELETE ANAMNESE ───
  const handleDeleteAnamnese = async () => {
    if (!anamnese.id || !supabase) return;
    if (!confirm(t('hce_confirm_delete_anamnese', 'app').replace('{id}', anamnese.id))) return;
    await supabase.from('anamnese').delete().eq('id', anamnese.id);
    setAnamneseList(prev => prev.filter(item => item.id !== anamnese.id));
    setAnamnese({ ...makeAnamnese(selectedPatient?.id || ''), maritalStatus: selectedPatient?.civil_status || '' });
    clearAnamneseErrors();
    addAuditLog('Excluiu Anamnese', selectedPatient?.name || '');
  };

  // ─── SAVE PHYSICAL EXAM ───
  const handleSavePhysicalExam = async () => {
    if (!confirm(t('hce_confirm_save_physical_exam', 'app'))) return;
    const isEdit = !!physicalExam.id;
    const result = validatePhysicalExam({
      patientId: selectedPatient?.id || '',
      generalAspect: physicalExam.generalAspect || '',
      examHeadNeck: physicalExam.examHeadNeck || '',
      examCardiovascular: physicalExam.examCardiovascular || '',
      examRespiratory: physicalExam.examRespiratory || '',
      examAbdomen: physicalExam.examAbdomen || '',
      examGenitourinary: physicalExam.examGenitourinary || '',
      examMusculoskeletal: physicalExam.examMusculoskeletal || '',
      examNeurological: physicalExam.examNeurological || '',
      examSkin: physicalExam.examSkin || '',
      examEyes: physicalExam.examEyes || '',
      examEars: physicalExam.examEars || '',
      examMouth: physicalExam.examMouth || '',
      examRectal: physicalExam.examRectal || '',
      examPsychiatric: physicalExam.examPsychiatric || '',
      notes: physicalExam.notes || '',
    });
    if (!result.success) return;
    const entry: PhysicalExam = {
      ...physicalExam,
      id: physicalExam.id || await genId('pexam'),
      patientId: selectedPatient?.id || '',
      createdBy: physicalExam.createdBy || activeOperator,
      createdAt: physicalExam.createdAt || new Date().toISOString(),
    };
    setPhysicalExam(entry);
    if (isEdit) {
      setPhysicalExamList(prev => prev.map(item => item.id === entry.id ? entry : item));
    } else {
      setPhysicalExamList(prev => [...prev, entry]);
      if (selectedPatient) {
        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? {
          ...p,
          clinicalHistory: [
            { id: entry.id, date: entry.createdAt, type: 'Exame Físico', diagnosis: 'Exame físico registrado', cid10: '', prescriptions: [], notes: entry.notes, doctor: entry.createdBy },
            ...p.clinicalHistory,
          ],
        } : p));
      }
    }
    addAuditLog('Salvou Exame Físico', selectedPatient?.name || '');
    if (supabase) {
      const dbRow = {
        id: entry.id, patient_id: entry.patientId, created_by: entry.createdBy,
        updated_by: isEdit ? activeOperator : null,
        vital_signs: entry.vitalSigns,
        exam_head_neck: entry.examHeadNeck, exam_cardiovascular: entry.examCardiovascular,
        exam_respiratory: entry.examRespiratory, exam_abdomen: entry.examAbdomen,
        exam_genitourinary: entry.examGenitourinary, exam_musculoskeletal: entry.examMusculoskeletal,
        exam_neurological: entry.examNeurological, exam_skin: entry.examSkin,
        exam_eyes: entry.examEyes, exam_ears: entry.examEars, exam_mouth: entry.examMouth,
        exam_rectal: entry.examRectal, exam_psychiatric: entry.examPsychiatric,
        general_aspect: entry.generalAspect, notes: entry.notes,
      };
      if (isEdit) {
        await supabase.from('physical_exams').update(dbRow).eq('id', entry.id);
      } else {
        await supabase.from('physical_exams').insert(dbRow);
      }
    }
    if (!isEdit) {
      setPhysicalExam({ ...makePhysicalExam(selectedPatient?.id || ''), vitalSigns: entry.vitalSigns });
    }
  };

  // ─── NEW PHYSICAL EXAM (limpa o formulário) ───
  const handleNewPhysicalExam = useCallback(() => {
    setPhysicalExam({ ...makePhysicalExam(selectedPatient?.id || ''), vitalSigns: physicalExam.vitalSigns });
    clearPhysicalExamErrors();
  }, [selectedPatient, makePhysicalExam, physicalExam.vitalSigns, clearPhysicalExamErrors]);

  // ─── OPEN PHYSICAL EXAM (seleciona um registro da lista) ───
  const handleSelectPhysicalExam = useCallback((record: PhysicalExam) => {
    setPhysicalExam(record);
    clearPhysicalExamErrors();
  }, [clearPhysicalExamErrors]);

  // ─── DELETE PHYSICAL EXAM ───
  const handleDeletePhysicalExam = async () => {
    if (!physicalExam.id || !supabase) return;
    if (!confirm(t('hce_confirm_delete_physical_exam', 'app').replace('{id}', physicalExam.id))) return;
    await supabase.from('physical_exams').delete().eq('id', physicalExam.id);
    setPhysicalExamList(prev => prev.filter(item => item.id !== physicalExam.id));
    setPhysicalExam({ ...makePhysicalExam(selectedPatient?.id || ''), vitalSigns: physicalExam.vitalSigns });
    clearPhysicalExamErrors();
    addAuditLog('Excluiu Exame Físico', selectedPatient?.name || '');
  };

  // ─── SAVE SOAP NOTE ───
  const handleSaveSoap = async () => {
    if (!confirm(t('hce_confirm_save_soap', 'app'))) return;
    const isEdit = !!soapNote.id;
    const result = validateSoap({
      patientId: selectedPatient?.id || '',
      subjective: soapNote.subjective || '',
      objective: soapNote.objective || '',
      assessment: soapNote.assessment || '',
      plan: soapNote.plan || '',
      notes: soapNote.notes || '',
    });
    if (!result.success) return;
    const entry: SoapNote = {
      ...soapNote,
      id: soapNote.id || await genId('soap'),
      patientId: selectedPatient?.id || '',
      createdBy: soapNote.createdBy || activeOperator,
      createdAt: soapNote.createdAt || new Date().toISOString(),
    };
    setSoapNote(entry);
    if (isEdit) {
      setSoapList(prev => prev.map(item => item.id === entry.id ? entry : item));
    } else {
      setSoapList(prev => [...prev, entry]);
      if (selectedPatient) {
        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? {
          ...p,
          clinicalHistory: [
            { id: entry.id, date: entry.createdAt, type: 'Evolução SOAP', diagnosis: entry.assessment || 'Evolução registrada', cid10: '', prescriptions: [], notes: `${entry.subjective} ${entry.objective} ${entry.plan}`, doctor: entry.createdBy },
            ...p.clinicalHistory,
          ],
        } : p));
      }
    }
    addAuditLog('Salvou Evolução SOAP', selectedPatient?.name || '');
    if (supabase) {
      const dbRow = {
        id: entry.id,
        patient_id: entry.patientId,
        created_by: entry.createdBy,
        updated_by: isEdit ? activeOperator : null,
        subjective: entry.subjective,
        objective: entry.objective,
        assessment: entry.assessment,
        plan: entry.plan,
        notes: entry.notes,
      };
      if (isEdit) {
        await supabase.from('soap_notes').update(dbRow).eq('id', entry.id);
      } else {
        await supabase.from('soap_notes').insert(dbRow);
      }
    }
    if (!isEdit) {
      setSoapNote(makeSoapNote(selectedPatient?.id || ''));
    }
  };

  // ─── NEW SOAP NOTE (limpa o formulário) ───
  const handleNewSoap = useCallback(() => {
    setSoapNote(makeSoapNote(selectedPatient?.id || ''));
    clearSoapErrors();
  }, [selectedPatient, makeSoapNote, clearSoapErrors]);

  // ─── OPEN SOAP NOTE (seleciona um registro da lista) ───
  const handleSelectSoap = useCallback((record: SoapNote) => {
    setSoapNote(record);
    clearSoapErrors();
  }, [clearSoapErrors]);

  // ─── DELETE SOAP NOTE ───
  const handleDeleteSoap = async () => {
    if (!soapNote.id || !supabase) return;
    if (!confirm(t('hce_confirm_delete_soap', 'app').replace('{id}', soapNote.id))) return;
    await supabase.from('soap_notes').delete().eq('id', soapNote.id);
    setSoapList(prev => prev.filter(item => item.id !== soapNote.id));
    setSoapNote(makeSoapNote(selectedPatient?.id || ''));
    clearSoapErrors();
    addAuditLog('Excluiu Evolução SOAP', selectedPatient?.name || '');
  };

  // ─── NEW PRESCRIPTION (cria cabeçalho vazio em memória; só persiste ao salvar item) ───
  const ensurePrescriptionPersisted = useCallback(async (header: PrescriptionHeader) => {
    if (!supabase || persistedPrescIdsRef.current.has(header.id)) return;
    await supabase.from('prescriptions').upsert({
      id: header.id, patient_id: header.patientId, created_by: header.createdBy,
      qr_code_data: '', status: header.status,
    }, { onConflict: 'id' });
    persistedPrescIdsRef.current.add(header.id);
  }, []);

  const handleNewPrescription = async () => {
    if (!selectedPatient) return;
    const header: PrescriptionHeader = {
      id: await genId('presc'),
      patientId: selectedPatient.id,
      createdBy: activeOperator,
      createdAt: new Date().toISOString(),
      status: 'rascunho',
      qrCodeData: '',
    };
    setPrescriptions(prev => [...prev, header].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setSelectedPrescriptionId(header.id);
    setEditingItem(null);
    clearPrescErrors();
    setPrescriptionForm({ drugName: '', activeIngredient: '', presentation: '', dosage: '', frequency: '', route: 'oral', duration: '', quantity: 1, unit: 'comprimidos', notes: '', snomedCode: '', snomedDescription: '', prescriptionType: '' });
    addAuditLog('Receita Criada', `${selectedPatient.name}`);
  };

  // ─── SAVE ITEM (adiciona medicamento à receita selecionada) ───
  const runPrescriptionSafetyChecks = useCallback(async (items: PrescriptionItem[]) => {
    if (!items.length) {
      setSafetyAlerts([]);
      return;
    }
    const safetyItems = items.map(i => ({
      drugName: i.drugName,
      activeIngredient: i.activeIngredient,
      snomedCode: i.snomedCode || null,
      prescriptionType: i.prescriptionType,
    }));
    const patientAllergies: string[] = [
      ...(selectedPatient?.allergies ? selectedPatient.allergies.split(',').map(a => a.trim()).filter(Boolean) : []),
      ...(anamnese?.allergies ? anamnese.allergies.map(a => a.allergen).filter(Boolean) : []),
    ];
    const [interactionAlerts, allergyAlerts] = await Promise.all([
      checkInteractions(safetyItems),
      Promise.resolve(checkAllergies(patientAllergies, safetyItems)),
    ]);
    setSafetyAlerts([...interactionAlerts, ...allergyAlerts]);
  }, [selectedPatient, anamnese]);

  const runSafetyChecksAfterChange = useCallback(async () => {
    if (!selectedPrescriptionId) return;
    const items = allItems.filter(i => i.prescriptionId === selectedPrescriptionId);
    await runPrescriptionSafetyChecks(items);
  }, [selectedPrescriptionId, allItems, runPrescriptionSafetyChecks]);

  const handleSavePrescriptionItem = async () => {
    // Zod validation
    const prescResult = validatePresc({
      patientId: selectedPatient?.id || '',
      drugName: prescriptionForm.drugName,
      activeIngredient: prescriptionForm.activeIngredient || '',
      dosage: prescriptionForm.dosage || '',
      frequency: prescriptionForm.frequency || '',
      route: prescriptionForm.route || '',
      duration: prescriptionForm.duration || '',
      quantity: Number(prescriptionForm.quantity) || 0,
      unit: prescriptionForm.unit || '',
      notes: prescriptionForm.notes || '',
      snomedCode: prescriptionForm.snomedCode || '',
      snomedDescription: prescriptionForm.snomedDescription || '',
      prescriptionType: prescriptionForm.prescriptionType,
    });
    if (!prescResult.success) return;
    if (!selectedPrescriptionId) return;
    if (!prescriptionForm.drugName.trim()) return;

    const position = allItems.filter(i => i.prescriptionId === selectedPrescriptionId).length + 1;
    const item: PrescriptionItem = {
      id: await genId('pitem'),
      prescriptionId: selectedPrescriptionId,
      position,
      prescriptionType: prescriptionForm.prescriptionType as 'comum' | 'controlado' | 'arquivado',
      drugName: prescriptionForm.drugName,
      activeIngredient: prescriptionForm.activeIngredient,
      presentation: prescriptionForm.presentation,
      dosage: prescriptionForm.dosage,
      frequency: prescriptionForm.frequency,
      route: prescriptionForm.route,
      duration: prescriptionForm.duration,
      startDate: new Date().toISOString().split('T')[0],
      quantity: prescriptionForm.quantity,
      unit: prescriptionForm.unit,
      notes: prescriptionForm.notes,
      snomedCode: prescriptionForm.snomedCode,
      snomedDescription: prescriptionForm.snomedDescription,
    };
    setAllItems(prev => [...prev, item]);
    setPrescriptionForm({ drugName: '', activeIngredient: '', presentation: '', dosage: '', frequency: '', route: 'oral', duration: '', quantity: 1, unit: 'comprimidos', notes: '', snomedCode: '', snomedDescription: '', prescriptionType: '' });
    clearPrescErrors();
    addAuditLog('Medicamento Adicionado à Receita', `${item.drugName} - ${selectedPatient?.name}`);
    if (supabase) {
      const header = prescriptions.find(p => p.id === selectedPrescriptionId);
      if (header) await ensurePrescriptionPersisted(header);
      await supabase.from('prescription_items').insert({
        id: item.id, prescription_id: item.prescriptionId, position: item.position,
        prescription_type: item.prescriptionType, drug_name: item.drugName,
        active_ingredient: item.activeIngredient, presentation: item.presentation,
        dosage: item.dosage, frequency: item.frequency, route: item.route,
        duration: item.duration, start_date: item.startDate, quantity: item.quantity,
        unit: item.unit, notes: item.notes,
        snomed_code: item.snomedCode || null, snomed_description: item.snomedDescription || null,
      });
    }
    await runSafetyChecksAfterChange();
  };

  // ─── UPDATE ITEM ───
  const handleUpdatePrescriptionItem = async (item: PrescriptionItem) => {
    const prescResult = validatePresc({
      patientId: selectedPatient?.id || '',
      drugName: item.drugName,
      activeIngredient: item.activeIngredient || '',
      dosage: item.dosage || '',
      frequency: item.frequency || '',
      route: item.route || '',
      duration: item.duration || '',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || '',
      notes: item.notes || '',
      snomedCode: item.snomedCode || '',
      snomedDescription: item.snomedDescription || '',
    });
    if (!prescResult.success) return;
    setAllItems(prev => prev.map(i => i.id === item.id ? item : i));
    setEditingItem(null);
    clearPrescErrors();
    addAuditLog('Atualizou Medicamento da Receita', `${item.drugName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('prescription_items').update({
        drug_name: item.drugName,
        active_ingredient: item.activeIngredient,
        presentation: item.presentation,
        dosage: item.dosage,
        frequency: item.frequency,
        route: item.route,
        duration: item.duration,
        quantity: item.quantity,
        unit: item.unit,
        prescription_type: item.prescriptionType,
        snomed_code: item.snomedCode || null,
        snomed_description: item.snomedDescription || null,
        notes: item.notes,
      }).eq('id', item.id);
    }
    await runSafetyChecksAfterChange();
  };

  // ─── DELETE ITEM ───
  const handleDeletePrescriptionItem = async (itemId: string) => {
    if (!confirm(t('presc_confirm_delete_item', 'app'))) return;
    setAllItems(prev => prev.filter(i => i.id !== itemId));
    if (editingItem?.id === itemId) setEditingItem(null);
    if (supabase) {
      await supabase.from('prescription_items').delete().eq('id', itemId);
    }
    await runSafetyChecksAfterChange();
  };

  // ─── SIGN PRESCRIPTION (assina o cabeçalho com todos os itens) ───
  const handleSignPrescription = async (prescId: string) => {
    const graveAlerts = safetyAlerts.filter(a => a.severity === 'contraindicado' || a.severity === 'grave');
    if (graveAlerts.length > 0) {
      if (!confirm(t('presc_confirm_sign_grave', 'app'))) return;
    }
    const signedAt = new Date().toISOString();
    setPrescriptions(prev => prev.map(p =>
      p.id === prescId ? { ...p, status: 'assinado', signedAt } : p
    ));
    const items = allItems.filter(i => i.prescriptionId === prescId);
    const header = prescriptions.find(p => p.id === prescId);
    const sig = await handleSignDocument('prescricao', prescId, {
      prescriptionId: prescId,
      patientId: header?.patientId || selectedPatient?.id || '',
      patientName: selectedPatient?.name || '',
      items: items.map(i => ({
        drugName: i.drugName,
        activeIngredient: i.activeIngredient,
        presentation: i.presentation,
        dosage: i.dosage,
        frequency: i.frequency,
        route: i.route,
        duration: i.duration,
        quantity: i.quantity,
        unit: i.unit,
        prescriptionType: i.prescriptionType,
        snomedCode: i.snomedCode || null,
      })),
    });
    const payload = buildPrescriptionQrPayload({
        id: prescId,
        patientId: header?.patientId || selectedPatient?.id || '',
        patientName: selectedPatient?.name || '',
        createdAt: header?.createdAt || new Date().toISOString(),
        signedAt,
        verificationCode: sig.verificationCode,
        items: items.map(i => ({ name: i.drugName, dosage: i.dosage, frequency: i.frequency })),
      });
      const qrUrl = await generateQrDataUrl(buildPrescriptionVerifyUrl(payload));
      setPrescQrDataUrl(qrUrl);
      if (header) {
        const updated: PrescriptionHeader = { ...header, status: 'assinado', signedAt, qrCodeData: payload };
        setPrescriptions(prev => prev.map(p => p.id === prescId ? updated : p));
      }
      if (supabase) {
        if (header) await ensurePrescriptionPersisted(header);
        await supabase.from('prescriptions').update({ status: 'assinado', signed_at: signedAt, qr_code_data: payload, signature_id: sig.id }).eq('id', prescId);
      }
    };

  // ─── DELETE PRESCRIPTION (cabeçalho; itens excluem em cascata) ───
  const handleDeletePrescription = async (prescId: string) => {
    if (!confirm(t('presc_confirm_delete_receipt', 'app'))) return;
    setPrescriptions(prev => prev.filter(p => p.id !== prescId));
    setAllItems(prev => prev.filter(i => i.prescriptionId !== prescId));
    if (selectedPrescriptionId === prescId) {
      setSelectedPrescriptionId(null);
      setPrescQrDataUrl('');
    }
    if (supabase) {
      await supabase.from('prescriptions').delete().eq('id', prescId);
    }
    addAuditLog('Excluiu Receita', prescId);
  };

  // ─── PRINT PRESCRIPTION (só a receita médica, via CSS @media print) ───
  const handlePrintPrescription = () => {
    window.print();
  };

  // ─── SEND PRESCRIPTION (envio digital simulado) ───
  const handleSendPrescription = async (channel: 'whatsapp' | 'email') => {
    const phone = selectedPatient?.phone || t('presc_send_no_phone', 'app');
    const email = selectedPatient?.email || t('presc_send_no_email', 'app');
    if (channel === 'whatsapp') {
      if (!confirm(`${t('presc_send_confirm_whatsapp', 'app')}\n\n${t('presc_send_phone_label', 'app')}: ${phone}`)) return;
    } else {
      if (!confirm(`${t('presc_send_confirm_email', 'app')}\n\n${t('presc_send_email_label', 'app')}: ${email}`)) return;
    }
    await new Promise(r => setTimeout(r, 800));
    setSentChannels(prev => ({ ...prev, [channel]: true }));
    addAuditLog('Enviou Receita', `${channel.toUpperCase()} - ${selectedPatient?.name} - ${channel === 'whatsapp' ? phone : email}`);
  };

  // ─── SAVE EXAM REQUEST ───
  const handleSaveExamRequest = async () => {
    const result = validateExam({
      patientId: selectedPatient?.id || '',
      examName: examRequestForm.examName || '',
      examType: examRequestForm.examType,
      urgency: examRequestForm.urgency,
      clinicalIndication: examRequestForm.clinicalIndication || '',
    });
    if (!result.success) return;
    const req: ExamRequest = {
      id: await genId('exam'),
      patientId: selectedPatient?.id || '',
      createdBy: activeOperator,
      createdAt: new Date().toISOString(),
      examType: examRequestForm.examType as 'laboratorio' | 'imagem' | 'anatomia_patologica' | 'outro',
      examName: examRequestForm.examName,
      clinicalIndication: examRequestForm.clinicalIndication,
      urgency: examRequestForm.urgency as 'rotina' | 'urgente' | 'emergencia',
      examCatalogId: examRequestForm.examCatalogId,
      status: 'solicitado',
      resultNotes: '',
    };
    setExamRequests(prev => [req, ...prev]);
    setExamRequestForm({ examType: '', examName: '', clinicalIndication: '', urgency: '', examCatalogId: '' });
    setExamQrDataUrl('');
    setExamQrPayload('');
    addAuditLog('Solicitação de Exame', `${req.examName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('exam_requests').insert({
        id: req.id, patient_id: req.patientId, created_by: req.createdBy,
        updated_by: null,
        exam_type: req.examType, exam_name: req.examName,
        exam_catalog_id: req.examCatalogId || null,
        clinical_indication: req.clinicalIndication, urgency: req.urgency,
        status: req.status,
      });
    }
  };

  // ─── DELETE EXAM REQUEST ───
  const handleDeleteExamRequest = async (examId: string) => {
    setExamRequests(prev => prev.filter(e => e.id !== examId));
    setExamQrDataUrl('');
    setExamQrPayload('');
    if (supabase) {
      await supabase.from('exam_requests').delete().eq('id', examId);
    }
    addAuditLog('Excluiu Solicitação de Exame', examId);
  };

  // ─── DELETE EXAM GROUP (solicitação inteira, aberta ou assinada) ───
  const handleDeleteExamGroup = async (groupId: string) => {
    const groupExams = groupId === 'open' ? openGroupExams : (examSignedGroups.find(g => g.signatureId === groupId)?.exams ?? []);
    if (groupExams.length === 0) return;
    if (!confirm(t('hce_exam_confirm_delete_group', 'app').replace('{count}', String(groupExams.length)))) return;
    const ids = groupExams.map(e => e.id);
    setExamRequests(prev => prev.filter(e => !ids.includes(e.id)));
    setExamQrDataUrl('');
    setExamQrPayload('');
    if (supabase) {
      await supabase.from('exam_requests').delete().in('id', ids);
      if (groupId !== 'open') {
        await supabase.from('electronic_signatures').delete().eq('id', groupId);
      }
    }
    setExamGroupSelection('open');
    setEditingExamRequest(null);
    addAuditLog('Excluiu Solicitação de Exames', `${groupExams.length} exames - ${selectedPatient?.name}`);
  };

  // ─── SAVE PROCEDURE ───
  const handleSaveProcedure = async () => {
    const result = validateProc({
      patientId: selectedPatient?.id || '',
      procedureCode: procedureForm.procedureCode || '',
      procedureName: procedureForm.procedureName || '',
      procedureCategory: procedureForm.procedureCategory || '',
      quantity: Number(procedureForm.quantity) || 0,
      notes: procedureForm.notes || '',
      snomedCode: procedureForm.snomedCode || '',
      snomedDescription: procedureForm.snomedDescription || '',
      nomenclature: procedureForm.nomenclature,
      status: procedureForm.status,
    });
    if (!result.success) return;

    // O catálogo (SIGTAP/CBHPM/financiador) e a base SNOMED-CT são
    // apenas fontes de sugestão/autocomplete. Como ainda não temos
    // todos os códigos, não bloqueamos o salvamento quando o código
    // digitado não está nas bases — aceitamos qualquer código
    // informado pelo profissional (modo "catálogo aberto").
    const nomenclature = procedureForm.nomenclature as ProcedureNomenclature;
    const matchedFinanciador = financiadorCatalog.find(f => f.code === procedureForm.procedureCode.replace(/\D/g, ''));
    const proc: Procedure = {
      id: await genId('proc'),
      patientId: selectedPatient?.id || '',
      createdBy: activeOperator,
      createdAt: new Date().toISOString(),
      ...procedureForm,
      procedureCode: procedureForm.procedureCode,
      nomenclature,
      status: procedureForm.status as Procedure['status'],
      financingEntity: matchedFinanciador?.financingEntity ?? (selectedPatient?.health_insurance_company || ''),
      complications: '',
    };
    setProcedureList(prev => [proc, ...procedureList]);
    setProcedureForm({ procedureCode: '', procedureName: '', procedureCategory: '', quantity: 1, notes: '', snomedCode: '', snomedDescription: '', status: '', nomenclature: '', financingEntity: '' });
    setProcedureNomenclature('');
    setProcCodeQuery('');
    setProcCodeOpen(false);
    addAuditLog('Procedimento Registrado', `${proc.procedureName} - ${selectedPatient?.name}`);
    if (supabase) {
      const { error: insertErr } = await supabase.from('procedures').insert({
        id: proc.id, patient_id: proc.patientId, created_by: proc.createdBy,
        updated_by: null,
        procedure_code: proc.procedureCode, procedure_name: proc.procedureName,
        procedure_category: proc.procedureCategory, quantity: proc.quantity,
        notes: proc.notes, complications: proc.complications, status: proc.status,
        snomed_code: proc.snomedCode || null, snomed_description: proc.snomedDescription || null,
        nomenclature_source: proc.nomenclature || null,
        financing_entity: proc.financingEntity || null,
      });
      if (insertErr) {
        console.error('Erro ao salvar procedimento no Supabase:', insertErr.message, insertErr.details, insertErr.hint);
        alert(t('hce_proc_save_db_error', 'app') + '\n' + insertErr.message);
      }
    }
  };

  // ─── DELETE PROCEDURE ───
  const handleDeleteProcedure = async (procId: string) => {
    setProcedureList(prev => prev.filter(p => p.id !== procId));
    if (supabase) {
      await supabase.from('procedures').delete().eq('id', procId);
    }
    addAuditLog('Excluiu Procedimento', procId);
  };

  // ─── UPDATE DIAGNOSIS ───
  const handleUpdateDiagnosis = async (diag: Diagnosis) => {
    setDiagnoses(prev => prev.map(d => d.id === diag.id ? diag : d));
    setEditingDiagnosis(null);
    clearDiagnosisErrors();
    addAuditLog('Atualizou Diagnóstico', `${diag.cid10Code} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('diagnoses').update({
        cid10_code: diag.cid10Code,
        cid10_description: diag.cid10Description,
        diagnosis_type: diag.diagnosisType,
        status: diag.status,
        notes: diag.notes,
        snomed_code: diag.snomedCode || null,
        snomed_description: diag.snomedDescription || null,
        updated_by: activeOperator,
      }).eq('id', diag.id);
    }
  };

  // ─── UPDATE EXAM REQUEST ───
  const handleUpdateExamRequest = async (exam: ExamRequest) => {
    setExamRequests(prev => prev.map(e => e.id === exam.id ? exam : e));
    setExamQrDataUrl('');
    setExamQrPayload('');
    addAuditLog('Atualizou Solicitação de Exame', `${exam.examName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('exam_requests').update({
        exam_type: exam.examType,
        exam_name: exam.examName,
        exam_catalog_id: exam.examCatalogId || null,
        status: exam.status,
        result_notes: exam.resultNotes,
        result_date: exam.resultDate || null,
        updated_by: activeOperator,
      }).eq('id', exam.id);
    }
  };

  // ─── SIGN ALL EXAM REQUESTS (um único documento assinado) ───
  const handleSignExamRequests = async () => {
    if (!selectedPatient || unsignedExams.length === 0) return;
    const signedAt = new Date().toISOString();
    const sigDocId = await genId('sig');
    const sig = await handleSignDocument('exame', sigDocId, {
      examRequestIds: unsignedExams.map(e => e.id),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name || '',
      operator: activeOperator,
      exams: unsignedExams.map(e => ({
        id: e.id,
        examType: e.examType,
        examName: e.examName,
        clinicalIndication: e.clinicalIndication,
        urgency: e.urgency,
      })),
    });
    const signedIds = new Set(unsignedExams.map(e => e.id));
    setExamRequests(prev => prev.map(e =>
      signedIds.has(e.id) ? { ...e, signedBy: activeOperator, signedAt, signatureId: sig.id } : e
    ));
    if (supabase) {
      await Promise.all(unsignedExams.map(e =>
        supabase.from('exam_requests').update({
          signed_by: activeOperator,
          signed_at: signedAt,
          signature_id: sig.id,
          updated_by: activeOperator,
        }).eq('id', e.id)
      ));
    }
    const payload = buildExamQrPayload({
      id: sigDocId,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name || '',
      createdAt: unsignedExams.map(e => e.createdAt).sort()[0] || signedAt,
      signedAt,
      verificationCode: sig.verificationCode,
      items: unsignedExams.map(e => ({
        id: e.id,
        name: e.examName,
        examType: e.examType,
        urgency: e.urgency,
      })),
    });
    const qrUrl = await generateQrDataUrl(buildExamVerifyUrl(payload));
    setExamQrPayload(payload);
    setExamQrDataUrl(qrUrl);
    addAuditLog('Assinou Solicitação de Exames', `${unsignedExams.length} exames - ${selectedPatient?.name}`);
  };

  // ─── PRINT EXAM REQUESTS (só a solicitação, via CSS @media print) ───
  const handlePrintExams = () => {
    window.print();
  };

  // ─── SIGN ALL PROCEDURES (um único documento assinado) ───
  const handleSignProcedures = async () => {
    if (!selectedPatient || unsignedProcedures.length === 0) return;
    const signedAt = new Date().toISOString();
    const sigDocId = await genId('sig');
    const sig = await handleSignDocument('procedimento', sigDocId, {
      procedureIds: unsignedProcedures.map(p => p.id),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name || '',
      operator: activeOperator,
      procedures: unsignedProcedures.map(p => ({
        id: p.id,
        code: p.procedureCode,
        name: p.procedureName,
        category: p.procedureCategory,
        quantity: p.quantity,
      })),
    });
    const signedIds = new Set(unsignedProcedures.map(p => p.id));
    setProcedureList(prev => prev.map(p =>
      signedIds.has(p.id) ? { ...p, signedBy: activeOperator, signedAt, signatureId: sig.id } : p
    ));
    if (supabase) {
      const results = await Promise.all(unsignedProcedures.map(p =>
        supabase.from('procedures').update({
          signed_by: activeOperator,
          signed_at: signedAt,
          signature_id: sig.id,
          updated_by: activeOperator,
        }).eq('id', p.id)
      ));
      const failed = results.find(r => r.error);
      if (failed && failed.error) {
        console.error('Erro ao vincular assinatura aos procedimentos:', failed.error.message);
      }
    }
    const payload = buildProcedureQrPayload({
      id: sigDocId,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name || '',
      createdAt: unsignedProcedures.map(p => p.createdAt).sort()[0] || signedAt,
      signedAt,
      verificationCode: sig.verificationCode,
      items: unsignedProcedures.map(p => ({
        id: p.id,
        code: p.procedureCode,
        name: p.procedureName,
        category: p.procedureCategory,
        quantity: p.quantity,
      })),
    });
    const qrUrl = await generateQrDataUrl(buildProcedureVerifyUrl(payload));
    setProcQrPayload(payload);
    setProcQrDataUrl(qrUrl);
    setProcGroupSelection(sig.id);
    setEditingProcedure(null);
    addAuditLog('Assinou Solicitação de Procedimentos', `${unsignedProcedures.length} procedimentos - ${selectedPatient?.name}`);
  };

  // ─── DELETE PROCEDURE GROUP (solicitação inteira, aberta ou assinada) ───
  const handleDeleteProcedureGroup = async (groupId: string) => {
    const groupProcedures = groupId === 'open' ? openGroupProcedures : (procSignedGroups.find(g => g.signatureId === groupId)?.procedures ?? []);
    if (groupProcedures.length === 0) return;
    if (!confirm(t('hce_proc_confirm_delete_group', 'app').replace('{count}', String(groupProcedures.length)))) return;
    const ids = groupProcedures.map(p => p.id);
    setProcedureList(prev => prev.filter(p => !ids.includes(p.id)));
    setProcQrDataUrl('');
    setProcQrPayload('');
    if (supabase) {
      await supabase.from('procedures').delete().in('id', ids);
      if (groupId !== 'open') {
        await supabase.from('electronic_signatures').delete().eq('id', groupId);
      }
    }
    setProcGroupSelection('open');
    setEditingProcedure(null);
    addAuditLog('Excluiu Solicitação de Procedimentos', `${groupProcedures.length} procedimentos - ${selectedPatient?.name}`);
  };

  // ─── PRINT PROCEDURE REQUESTS (só a solicitação, via CSS @media print) ───
  const handlePrintProcedures = () => {
    window.print();
  };

  // ─── NEW PROCEDURE GROUP (solicitação em aberto) ───
  const handleNewProcGroup = () => {
    setProcGroupSelection('open');
    setEditingProcedure(null);
    setProcedureForm({ procedureCode: '', procedureName: '', procedureCategory: '', quantity: 1, notes: '', snomedCode: '', snomedDescription: '', status: '', nomenclature: '', financingEntity: '' });
    setProcedureNomenclature('');
    setProcCodeQuery('');
    setProcCodeOpen(false);
    clearProcErrors();
  };

  // ─── UPDATE PROCEDURE ───
  const handleUpdateProcedure = async (proc: Procedure) => {
    setProcedureList(prev => prev.map(p => p.id === proc.id ? proc : p));
    addAuditLog('Atualizou Procedimento', `${proc.procedureName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('procedures').update({
        status: proc.status,
        complications: proc.complications,
        notes: proc.notes,
        performed_at: proc.performedAt || null,
        snomed_code: proc.snomedCode || null,
        snomed_description: proc.snomedDescription || null,
        updated_by: activeOperator,
      }).eq('id', proc.id);
    }
  };

  // ─── SAVE ATTACHMENT (compress + upload to Supabase Storage + INSERT row) ───
  const handleSaveAttachment = async (file: File) => {
    const { file: fileToUpload, originalSize, compressedSize, wasCompressed } = await compressImageFile(file);
    if (wasCompressed) {
      console.info(`[Attachment] Compressed ${file.name}: ${(originalSize / 1024).toFixed(1)} KB → ${(compressedSize / 1024).toFixed(1)} KB`);
    }

    const result = validateAtt({
      patientId: selectedPatient?.id || '',
      fileName: fileToUpload.name,
      fileSizeBytes: fileToUpload.size,
      mimeType: fileToUpload.type || 'application/octet-stream',
      category: attachmentForm.category || 'outro',
      description: attachmentForm.description,
      isSensitive: attachmentForm.isSensitive,
    });
    if (!result.success) return;

    const newId = await genId('att');
    const patientId = selectedPatient?.id || '';
    const storagePath = `attachments/${patientId}/${newId}-${fileToUpload.name}`;
    let uploadedPath = storagePath;

    if (supabase) {
      setAttachmentUploading(true);
      try {
        const { error: uploadError } = await supabase.storage
          .from('clinical-attachments')
          .upload(storagePath, fileToUpload, { contentType: fileToUpload.type || 'application/octet-stream', upsert: false });
        if (uploadError) {
          console.error('Upload failed:', uploadError.message);
          alert(t('hce_attachment_upload_failed', 'app'));
          setAttachmentUploading(false);
          return;
        }
        uploadedPath = storagePath;
      } catch (err) {
        console.error('Upload error:', err);
        alert(t('hce_attachment_upload_failed', 'app'));
        setAttachmentUploading(false);
        return;
      }
      setAttachmentUploading(false);
    }

    const att = {
      id: newId,
      patient_id: patientId,
      created_by: activeOperator,
      updated_by: null,
      file_name: fileToUpload.name,
      file_path: uploadedPath,
      file_size_bytes: fileToUpload.size,
      mime_type: fileToUpload.type || 'application/octet-stream',
      category: attachmentForm.category,
      description: attachmentForm.description,
      is_sensitive: attachmentForm.isSensitive,
    };
    const attMapped = {
      id: att.id,
      patientId: att.patient_id,
      createdBy: att.created_by,
      createdAt: new Date().toISOString(),
      updatedBy: '',
      fileName: att.file_name,
      filePath: att.file_path,
      fileSizeBytes: att.file_size_bytes,
      mimeType: att.mime_type,
      category: att.category,
      description: att.description,
      isSensitive: att.is_sensitive,
    };
    setAttachments(prev => [attMapped, ...prev]);
    setSelectedAttachmentId(attMapped.id);
    if (supabase) {
      const { error: insertError } = await supabase.from('clinical_attachments').insert(att);
      if (insertError) {
        console.error('Insert failed, rolling back storage upload:', insertError.message);
        try {
          await supabase.storage.from('clinical-attachments').remove([uploadedPath]);
        } catch (rollbackErr) {
          console.warn('Storage rollback failed (orphan file):', rollbackErr);
        }
        setAttachments(prev => prev.filter((a: any) => a.id !== newId));
        setSelectedAttachmentId(prev => prev === newId ? null : prev);
        alert(t('hce_attachment_upload_failed', 'app'));
        return;
      }
    }
    setAttachmentForm({ category: '', description: '', isSensitive: false });
    addAuditLog('Anexo Clínico Adicionado', `${fileToUpload.name} - ${selectedPatient?.name}`);
  };

  // ─── CONFIRMED DELETE ATTACHMENT (after ConfirmDialog) ───
  const handleDeleteAttachment = async (attId: string) => {
    const target = attachments.find((a: any) => a.id === attId);
    setAttachments(prev => prev.filter((a: any) => a.id !== attId));
    if (supabase) {
      if (target?.filePath) {
        try {
          await supabase.storage.from('clinical-attachments').remove([target.filePath]);
        } catch (err) {
          console.warn('Storage remove failed (continuing):', err);
        }
      }
      await supabase.from('clinical_attachments').delete().eq('id', attId);
    }
    addAuditLog('Excluiu Anexo Clínico', attId);
  };

  // ─── VIEW ATTACHMENT (abre preview — signedUrl carregado via useEffect) ───
  const handleViewAttachment = (att: any) => {
    if (!att.filePath) {
      console.warn('Attachment sem filePath:', att.id);
      return;
    }
    setAttachmentPreview({ attachment: att, signedUrl: '', loading: true });
  };

  // ─── DOWNLOAD ATTACHMENT (fetch blob + anchor para permitir escolha de local) ───
  const handleDownloadAttachment = async () => {
    if (!attachmentPreview?.signedUrl) return;
    try {
      const response = await fetch(attachmentPreview.signedUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachmentPreview.attachment.fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(attachmentPreview.signedUrl, '_blank');
    }
  };

  // ─── EFFECT: gera signed URL quando o modal abre ───
  useEffect(() => {
    if (!attachmentPreview || !attachmentPreview.loading) return;
    if (!supabase) {
      setAttachmentPreview(prev => prev ? { ...prev, loading: false } : null);
      return;
    }
    const filePath = attachmentPreview.attachment.filePath;
    if (!filePath) {
      setAttachmentPreview(prev => prev ? { ...prev, loading: false } : null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.storage
          .from('clinical-attachments')
          .createSignedUrl(filePath, 3600);
        if (cancelled) return;
        if (error || !data) {
          console.error('Signed URL failed:', error?.message);
          setAttachmentPreview(prev => prev ? { ...prev, loading: false } : null);
          return;
        }
        setAttachmentPreview(prev => prev ? { ...prev, signedUrl: data.signedUrl, loading: false } : null);
      } catch (err) {
        if (cancelled) return;
        console.error('View attachment error:', err);
        setAttachmentPreview(prev => prev ? { ...prev, loading: false } : null);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentPreview?.attachment?.id, attachmentPreview?.loading]);


  const filteredTimeline = useMemo(() => {
    const events: PatientTimelineEvent[] = [];

    // Add existing clinical history as timeline events
    if (selectedPatient?.clinicalHistory) {
      selectedPatient.clinicalHistory.forEach(h => {
        if (h.type?.toLowerCase().includes('vacina')) return;
        events.push({
          id: h.id,
          patientId: selectedPatient.id,
          eventType: 'consulta',
          eventDate: h.created_at || h.date,
          eventTitle: h.type,
          eventDescription: h.notes,
          eventSource: 'clinical_history',
          eventSourceId: h.id,
          doctorName: h.doctor,
          specialty: '',
          cid10Code: h.cid10,
        });
      });
    }

    // Add prescriptions as timeline events (uma receita = um evento com seus itens)
    prescriptions.forEach(p => {
      const pItems = allItems.filter(i => i.prescriptionId === p.id);
      const drugNames = pItems.map(i => i.drugName).filter(Boolean).join(', ');
      events.push({
        id: p.id,
        patientId: p.patientId,
        eventType: 'prescricao',
        eventDate: p.createdAt,
        eventTitle: `${t('hce_event_prescription', 'app')}${drugNames || p.id}`,
        eventDescription: pItems.map(i => `${i.drugName} ${i.dosage} - ${i.frequency} - ${i.route}`).join('; '),
        eventSource: 'prescription',
        eventSourceId: p.id,
        doctorName: p.createdBy,
        specialty: '',
        cid10Code: '',
      });
    });

    // Add exam requests
    examRequests.forEach(e => {
      events.push({
        id: e.id,
        patientId: e.patientId,
        eventType: 'exame',
        eventDate: e.createdAt,
        eventTitle: `${t('hce_event_exam', 'app')}${e.examName}`,
        eventDescription: e.clinicalIndication,
        eventSource: 'exam_request',
        eventSourceId: e.id,
        doctorName: e.createdBy,
        specialty: '',
        cid10Code: '',
      });
    });

    // Add procedures
    procedureList.forEach(p => {
      events.push({
        id: p.id,
        patientId: p.patientId,
        eventType: 'procedimento',
        eventDate: p.createdAt,
        eventTitle: `${t('hce_event_procedure', 'app')}${p.procedureName}`,
        eventDescription: p.notes,
        eventSource: 'procedure',
        eventSourceId: p.id,
        doctorName: p.createdBy,
        specialty: '',
        cid10Code: '',
      });
    });

    // Add hospitalization events (internação)
    timelineInternments.forEach(h => events.push(h));
    // Add surgery events (cirurgia)
    timelineSurgeries.forEach(s => events.push(s));
    // Add vaccination events from clinical history
    if (selectedPatient?.clinicalHistory) {
      selectedPatient.clinicalHistory
        .filter((h: any) => h.type?.toLowerCase().includes('vacina'))
        .forEach((h: any) => {
          events.push({
            id: h.id,
            patientId: selectedPatient.id,
            eventType: 'vacina',
            eventDate: h.created_at || h.date,
            eventTitle: t('hce_event_vacina', 'app'),
            eventDescription: h.notes || h.diagnosis || '',
            eventSource: 'clinical_history',
            eventSourceId: h.id,
            doctorName: h.doctor || '',
            specialty: '',
            cid10Code: h.cid10 || '',
          });
        });
    }

    // Add anamnesis entries
    if (anamnese && anamnese.id && anamnese.patientId) {      events.push({
        id: anamnese.id,
        patientId: anamnese.patientId,
        eventType: 'consulta',
        eventDate: anamnese.createdAt,
        eventTitle: t('hce_event_anamnese', 'app'),
        eventDescription: anamnese.notes || `${t('hce_allergies', 'app')}: ${anamnese.allergies.map(a => a.allergen).join(', ') || t('hce_none', 'app')}. ${t('hce_current_medications', 'app')}: ${anamnese.currentMedications.map(m => m.name).join(', ') || t('hce_none', 'app')}.`,
        eventSource: 'anamnese',
        eventSourceId: anamnese.id,
        doctorName: anamnese.createdBy,
        specialty: '',
        cid10Code: '',
      });
    }

    // Add SOAP notes
    if (soapNote && soapNote.id && soapNote.patientId) {
      events.push({
        id: soapNote.id,
        patientId: soapNote.patientId,
        eventType: 'consulta',
        eventDate: soapNote.createdAt,
        eventTitle: t('hce_event_soap', 'app'),
        eventDescription: `S: ${soapNote.subjective || '-'} | O: ${soapNote.objective || '-'} | A: ${soapNote.assessment || '-'} | P: ${soapNote.plan || '-'}`,
        eventSource: 'soap_note',
        eventSourceId: soapNote.id,
        doctorName: soapNote.createdBy,
        specialty: '',
        cid10Code: '',
      });
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    // Apply filters
    return events.filter(e => {
      if (timelineFilterType !== 'all' && e.eventType !== timelineFilterType) return false;
      if (timelineFilterDoctor && !e.doctorName.toLowerCase().includes(timelineFilterDoctor.toLowerCase())) return false;
      if (timelineDateFrom && e.eventDate < timelineDateFrom) return false;
      if (timelineDateTo && e.eventDate > timelineDateTo + 'T23:59:59') return false;
      if (timelineSearch) {
        const q = timelineSearch.toLowerCase();
        return e.eventTitle.toLowerCase().includes(q) || e.eventDescription.toLowerCase().includes(q) || e.cid10Code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedPatient, prescriptions, allItems, examRequests, procedureList, anamnese, soapNote, timelineSearch, timelineFilterType, timelineFilterDoctor, timelineDateFrom, timelineDateTo, timelineInternments, timelineSurgeries, t]);

  const groupedTimeline = useMemo(() => {
    type Section =
      | { kind: 'consultation'; group: { key: string; isLegacy: boolean; number: number; dateLabel: string; repDate: string; triage: any[]; meds: any[]; completedAt: string } }
      | { kind: 'event'; evt: (typeof filteredTimeline)[number] };
    const sections: Section[] = [];
    const history = selectedPatient?.clinicalHistory || [];
    const grouped: Record<string, any[]> = {};
    history.forEach((entry: any) => {
      const key = entry.consultation_id || '__legacy__';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === '__legacy__') return -1;
      if (b === '__legacy__') return 1;
      const dateA = new Date(grouped[a][0].triaged_at || grouped[a][0].created_at || 0).getTime();
      const dateB = new Date(grouped[b][0].triaged_at || grouped[b][0].created_at || 0).getTime();
      return dateA - dateB;
    });
    let consultationNumber = 0;
    sortedKeys.forEach(key => {
      const entries = grouped[key];
      const isLegacy = key === '__legacy__';
      if (!isLegacy) consultationNumber++;
      const triageEntries = entries.filter((e: any) => e.type?.includes('Triagem'));
      const medEntries = entries.filter((e: any) => !e.type?.includes('Triagem') && e.type !== 'Vacina');
      triageEntries.sort((a: any, b: any) => new Date(a.triaged_at || a.created_at || 0).getTime() - new Date(b.triaged_at || b.created_at || 0).getTime());
      medEntries.sort((a: any, b: any) => new Date(a.created_at || a.date || 0).getTime() - new Date(b.created_at || b.date || 0).getTime());
      const firstEntry = entries[0];
      const repDate = firstEntry?.triaged_at || firstEntry?.created_at || firstEntry?.date || '';
      const dateLabel = firstEntry?.triaged_at
        ? new Date(firstEntry.triaged_at).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
        : firstEntry?.date || '—';
      const lastEntry = entries[entries.length - 1];
      sections.push({
        kind: 'consultation',
        group: {
          key,
          isLegacy,
          number: consultationNumber,
          dateLabel,
          repDate,
          triage: triageEntries,
          meds: medEntries,
          completedAt: lastEntry?.created_at || lastEntry?.triaged_at || '',
        },
      });
    });
    filteredTimeline.forEach(evt => {
      if (evt.eventSource === 'clinical_history' && evt.eventType === 'consulta') return;
      sections.push({ kind: 'event', evt });
    });
    const getDate = (section: Section): number | null => {
      const raw = section.kind === 'consultation' ? section.group.repDate : section.evt.eventDate;
      if (!raw) return null;
      const d = new Date(raw.includes('T') ? raw : raw + 'T12:00:00');
      return isNaN(d.getTime()) ? null : d.getTime();
    };
    sections.sort((a, b) => {
      const da = getDate(a);
      const db = getDate(b);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return db - da;
    });
    return sections.filter(section => {
      if (section.kind === 'event') return true;
      const g = section.group;
      if (timelineFilterType !== 'all' && timelineFilterType !== 'consulta') return false;
      if (timelineFilterDoctor) {
        const doctorMatch = [...g.triage, ...g.meds].some((e: any) => (e.doctor || '').toLowerCase().includes(timelineFilterDoctor.toLowerCase()));
        if (!doctorMatch) return false;
      }
      if (timelineDateFrom && g.repDate && g.repDate < timelineDateFrom) return false;
      if (timelineDateTo && g.repDate && g.repDate > timelineDateTo + 'T23:59:59') return false;
      if (timelineSearch) {
        const q = timelineSearch.toLowerCase();
        const haystack = [...g.triage, ...g.meds]
          .map((e: any) => `${e.diagnosis || ''} ${e.notes || ''} ${e.cid10 || ''} ${e.doctor || ''} ${e.location_name || ''} ${e.type || ''} ${JSON.stringify(e.vital_signs || {})}`)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [selectedPatient, filteredTimeline, timelineSearch, timelineFilterType, timelineFilterDoctor, timelineDateFrom, timelineDateTo, locale]);

  // ─── ASO & CAT HANDLERS ───
  const handleCreateAso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asoPatient.trim()) return;
    const newAso: AsoExam = {
      id: await genId('aso'), patientName: asoPatient, type: asoType,
      risks: asoRisks.split(',').map(r => r.trim()), status: asoStatus,
      date: new Date().toISOString().split('T')[0], doctor: 'Dr. Bruno Castro',
    };
    setAsos(prev => [newAso, ...prev]);
    addAuditLog('Emissão ASO', `${asoPatient} (${asoStatus.toUpperCase()})`);
    if (supabase) {
      await supabase.from('aso_exams').insert({ id: newAso.id, patient_name: newAso.patientName, type: newAso.type, risks: newAso.risks, status: newAso.status, date: newAso.date, doctor: newAso.doctor });
    }
    setAsoPatient('');
  };

  const handleRegisterCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catEmployee.trim()) return;
    addAuditLog('Emissão de CAT', catEmployee);
    setCatRegistered(true);
    setTimeout(() => { setCatRegistered(false); setCatEmployee(''); setCatNotes(''); }, 3000);
  };

  // ─── HCE TAB NAVIGATION ───
  const hceTabs: { key: HCETab; label: string; icon: React.ElementType }[] = [
    { key: 'anamnese', label: t('hce_tab_anamnese', 'app'), icon: BookOpen },
    { key: 'exam', label: t('hce_tab_exam', 'app'), icon: Stethoscope },
    { key: 'soap', label: t('hce_tab_soap', 'app'), icon: ClipboardList },
    { key: 'diagnoses', label: t('hce_tab_diagnoses', 'app'), icon: Tag },
    { key: 'prescriptions', label: t('hce_tab_prescriptions', 'app'), icon: Pill },
    { key: 'exams', label: t('hce_tab_exams', 'app'), icon: Scan },
    { key: 'procedures', label: t('hce_tab_procedures', 'app'), icon: Activity },
    { key: 'attachments', label: t('hce_tab_attachments', 'app'), icon: Paperclip },
    { key: 'signatures', label: t('hce_tab_signatures', 'app'), icon: FileSignature },
    { key: 'timeline', label: t('hce_tab_timeline', 'app'), icon: Clock },
    { key: 'security', label: t('hce_tab_security', 'app'), icon: Shield },
  ];

  const inputCls = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans';
  const textareaCls = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans leading-relaxed resize-none';
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1 whitespace-nowrap overflow-hidden text-ellipsis';
  const sectionCls = 'bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4';

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
  }, [locale]);
  const formatDateTime = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
    return isNaN(date.getTime()) ? '' : `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  }, [locale]);
  // ─── FILTERED TIMELINE ───
  const handleExportTimelinePdf = useCallback(async () => {
    if (!groupedTimeline.length || !selectedPatient) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pat = selectedPatient;
    let y = 20;
    const checkPage = (inc: number) => { if (y + inc > 270) { doc.addPage(); y = 20; } };
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(t('hce_timeline_export_title', 'app').replace('{name}', pat.name), 15, y); y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${t('hce_patient', 'app')}: ${pat.name} | ${t('hce_timeline_doc_number', 'app')} ${pat.document_number || '—'}`, 15, y); y += 5;
    doc.text(`${t('hce_timeline_export_date', 'app')}: ${new Date().toLocaleDateString(locale)}`, 15, y); y += 8;
    doc.setDrawColor(13, 148, 136); doc.setLineWidth(0.5); doc.line(15, y, 195, y); y += 8;

    groupedTimeline.slice(0, 60).forEach(section => {
      if (section.kind === 'consultation') {
        const g = section.group;
        checkPage(20);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(15, y - 3, 180, 10, 2, 2, 'FD');
        doc.setTextColor(51, 65, 85); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text(g.isLegacy ? t('rcpt_timeline_legacy_records', 'app') : `${t('rcpt_timeline_consultation', 'app')} #${g.number} — ${g.dateLabel}`, 19, y + 3);
        y += 14;

        g.triage.forEach((triageEntry: any) => {
          doc.setTextColor(13, 148, 136); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
          doc.text(t('rcpt_pdf_triage', 'app'), 15, y); y += 5;
          doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
          if (triageEntry.triaged_at) { doc.text(`${t('rcpt_pdf_date', 'app')}: ${new Date(triageEntry.triaged_at).toLocaleString(locale)}`, 19, y); y += 4; }
          if (triageEntry.vital_signs) {
            const vs = triageEntry.vital_signs;
            let vitals = '';
            if (vs.bp) vitals += `${t('rcpt_triage_bp_label', 'app')}: ${vs.bp}  `;
            if (vs.temp) vitals += `${t('rcpt_triage_temp_label', 'app')}: ${vs.temp}C  `;
            if (vs.spo2) vitals += `${t('rcpt_triage_spo2_label', 'app')}: ${vs.spo2}%  `;
            if (vs.hr) vitals += `${t('rcpt_triage_hr_label', 'app')}: ${vs.hr} BPM  `;
            if (vs.rr) vitals += `${t('rcpt_triage_rr_label', 'app')}: ${vs.rr} IRPM`;
            doc.text(vitals, 19, y); y += 4;
          }
          y += 2;
        });

        g.meds.forEach((med: any) => {
          checkPage(30);
          doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252);
          doc.roundedRect(15, y - 4, 180, 38, 2, 2, 'FD');
          doc.setTextColor(13, 148, 136); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
          doc.text(med.location_name || t('rcpt_timeline_medical_consultation', 'app'), 19, y + 2); y += 7;
          doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
          if (med.created_at) { doc.text(`${t('rcpt_pdf_date', 'app')}: ${new Date(med.created_at).toLocaleString(locale)}`, 19, y); y += 4; }
          if (med.diagnosis) { doc.setFont('helvetica', 'bold'); doc.text(t('rcpt_timeline_diagnosis', 'app') + ': ', 19, y); doc.setFont('helvetica', 'normal'); doc.text(med.diagnosis, 52, y); y += 4; }
          if (med.cid10 && med.cid10 !== 'Z00.0') { doc.setFont('helvetica', 'bold'); doc.text(t('rcpt_timeline_cid10', 'app') + ': ', 19, y); doc.setFont('helvetica', 'normal'); doc.text(med.cid10, 40, y); y += 4; }
          if (med.prescriptions && med.prescriptions.length > 0 && med.prescriptions[0] !== t('rcpt_triage_no_procedure', 'app')) { doc.setFont('helvetica', 'bold'); doc.text(t('rcpt_timeline_prescription', 'app') + ': ', 19, y); doc.setFont('helvetica', 'normal'); doc.text(med.prescriptions.join(', '), 52, y); y += 4; }
          if (med.notes && med.notes !== t('rcpt_triage_default_note', 'app')) { doc.setFont('helvetica', 'bold'); doc.text(t('rcpt_timeline_medical_notes', 'app') + ': ', 19, y); doc.setFont('helvetica', 'normal'); doc.text(med.notes, 54, y); y += 4; }
          y += 4;
        });

        y += 2; checkPage(8);
        doc.setTextColor(148, 163, 184); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(`${t('rcpt_pdf_visit_completed', 'app')} - ${g.completedAt ? new Date(g.completedAt).toLocaleString(locale) : '—'}`, 105, y, { align: 'center' });
        y += 8;
      } else {
        const evt = section.evt;
        checkPage(12);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(20);
        doc.text(evt.eventTitle, 19, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        const dateLabel = evt.eventDate ? (evt.eventDate.includes('T') ? new Date(evt.eventDate).toLocaleString(locale) : formatDate(evt.eventDate.split('T')[0])) : '—';
        doc.text(`${dateLabel}${evt.doctorName ? ' | ' + evt.doctorName : ''}`, 19, y); y += 5;
        if (evt.eventDescription) {
          const lines = doc.splitTextToSize(evt.eventDescription, 176);
          lines.slice(0, 3).forEach((line: string) => { doc.text(line, 19, y); y += 4; });
        }
        if (evt.cid10Code) { doc.text(`${t('hce_timeline_cid10', 'app')} ${evt.cid10Code}`, 19, y); y += 4; }
        y += 3;
      }
    });
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const docId = `timeline_${selectedPatient.id}_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : selectedPatient.id}`;
    const sig = await getSignatureProvider().sign({
      documentType: 'outro',
      documentId: docId,
      patientId: selectedPatient.id,
      signerName: activeOperator,
      content: { pdfSha: pdfBase64.slice(0, 64), patientId: selectedPatient.id, events: groupedTimeline.length },
    });
    y += 6; checkPage(10);
    doc.setDrawColor(13, 148, 136); doc.setLineWidth(0.5); doc.line(15, y, 195, y);
    y += 6;
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`${t('hce_signature_title', 'app')}: ${activeOperator} | ${t('hce_verification_label', 'app')} ${sig.verificationCode}`, 15, y);
    doc.text(`${t('hce_signature_hash', 'app')} ${sig.signatureHash.slice(0, 48)}...`, 15, y + 4);
    await handleSaveSignature({
      id: await genId('sig'),
      signerId: 'current_user',
      signerName: activeOperator,
      signerCouncil: 'CRM',
      signerCouncilNumber: 'CRM-PY 000000',
      createdAt: new Date().toISOString(),
      documentType: 'outro',
      documentId: docId,
      patientId: selectedPatient.id,
      signatureHash: sig.signatureHash,
      certificateSerial: sig.certificateSerial,
      certificateIssuer: sig.certificateIssuer,
      certificateValidFrom: sig.certificateValidFrom,
      certificateValidTo: sig.certificateValidTo,
      signedAt: sig.signedAt,
      verificationCode: sig.verificationCode,
      status: sig.status,
      ipAddress: '192.168.1.1',
      userAgent: navigator.userAgent,
      timestampAuthority: sig.timestampAuthority,
      timestampToken: sig.timestampToken,
    });
    doc.save(`${selectedPatient.id}_timeline.pdf`);
  }, [groupedTimeline, selectedPatient, activeOperator, handleSaveSignature, genId, t, locale, formatDate]);

  const translateStatus = (s: string) => {
    const key = `hce_status_${s.toLowerCase().replace(/\s+/g, '_')}`;
    const translated = t(key, 'app');
    return translated !== key ? translated : s;
  };

  const translateProcStatus = (s: string) => {
    const map: Record<string, string> = {
      programado: 'hce_procedure_programado',
      em_execucao: 'hce_procedure_em_execucao',
      concluido: 'hce_procedure_concluido',
      cancelado: 'hce_status_cancelado',
    };
    const key = map[s] || `hce_status_${s}`;
    const translated = t(key, 'app');
    return translated !== key ? translated : s;
  };

  const translateProcCategory = (cat: string) => {
    const key = PROCEDURE_CATEGORY_I18N_KEY[cat as ProcedureCategory];
    return key ? t(key, 'app') : cat;
  };

  const SIGN_DOC_I18N_KEY: Record<string, string> = {
    prescricao: 'hce_sign_doc_prescricao',
    receita: 'hce_sign_doc_receita',
    laudo: 'hce_sign_doc_laudo',
    atestado: 'hce_sign_doc_atestado',
    alta: 'hce_sign_doc_alta',
    procedimento: 'hce_sign_doc_procedimento',
    exame: 'hce_sign_doc_exame',
    outro: 'hce_sign_doc_outro',
  };

  const translateDocType = (docType: string) => {
    const key = SIGN_DOC_I18N_KEY[docType];
    return key ? t(key, 'app') : docType;
  };

  const signatureProfessionals = useMemo(
    () => Array.from(new Set(signatures.map(s => s.signerName).filter(Boolean))).sort(),
    [signatures]
  );

  const signatureDocTypes = useMemo(
    () => Array.from(new Set(signatures.map(s => s.documentType))).sort(),
    [signatures]
  );

  const filteredSignatures = useMemo(() => {
    return signatures.filter(s => {
      if (signFilterType !== 'all' && s.documentType !== signFilterType) return false;
      if (signFilterProfessional !== 'all' && s.signerName !== signFilterProfessional) return false;
      const signedDate = new Date(s.signedAt);
      if (signDateFrom && signedDate < new Date(signDateFrom + 'T00:00:00')) return false;
      if (signDateTo && signedDate > new Date(signDateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [signatures, signFilterType, signFilterProfessional, signDateFrom, signDateTo]);

  return (
    <div className="space-y-6">
      {/* ════════════════════════════════════════════ */}
      {/* 3. PRONTUÁRIO HCE                          */}
      {/* ════════════════════════════════════════════ */}
      {activeSubmodule === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Patient + Timeline */}
          <div className="lg:col-span-1 space-y-4">
            <div className={sectionCls}>
              <div ref={patientDropdownRef} className="border-b border-slate-100 pb-3 relative">
                <label className={labelCls}>{t('access_record', 'app')}</label>
                <input
                  type="text"
                  value={patientDropdownOpen ? patientSearch : (selectedPatient ? `${selectedPatient.name} (${selectedPatient.priority.toUpperCase()})` : '')}
                  onChange={e => { setPatientSearch(e.target.value); setPatientDropdownOpen(true); }}
                  onFocus={() => { setPatientSearch(''); setPatientDropdownOpen(true); }}
                  onBlur={() => setTimeout(() => setPatientDropdownOpen(false), 200)}
                  placeholder={t('agenda_select', 'app')}
                  className={inputCls}
                />
                {patientDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      onClick={() => { handlePatientChange(''); setPatientSearch(''); setPatientDropdownOpen(false); }}
                      className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer font-semibold border-b border-slate-100"
                    >
                      {t('agenda_select', 'app')}
                    </div>
                    {filteredPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { handlePatientChange(p.id); setPatientSearch(''); setPatientDropdownOpen(false); }}
                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-teal-50 flex justify-between items-center ${selectedPatId === p.id ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700'}`}
                      >
                        <span>{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">{p.priority.toUpperCase()}</span>
                      </div>
                    ))}
                    {filteredPatients.length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-400">{t('crm_nenhum_paciente', 'app')}</div>
                    )}
                  </div>
                )}
              </div>
              {selectedPatient && (
                <div className="space-y-3">
                  <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-xs space-y-1">
                    <h4 className="font-bold text-teal-800 text-sm">{selectedPatient.name}</h4>
                    <p className="text-teal-700">📅 {formatDate(selectedPatient.birthdate)}</p>
                    <p className="text-teal-700">🩺 <b className="uppercase">{translateStatus(selectedPatient.status)}</b></p>
                    <p className="text-teal-700">✉️ {selectedPatient.email}</p>
                    {selectedPatient.allergies && (
                      <p className="text-rose-700 font-bold">⚠️ {t('hce_allergies', 'app')}: {selectedPatient.allergies}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mini Timeline */}
            <div className={sectionCls}>
              <h5 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {t('clinical_timeline', 'app')}
              </h5>
              <div className="border-l-2 border-slate-200 pl-3 space-y-3 max-h-[300px] overflow-y-auto">
                {(() => {
                  const history = selectedPatient?.clinicalHistory || [];
                  const grouped: Record<string, any[]> = {};
                  history.forEach((entry: any) => {
                    const key = entry.consultation_id || '__legacy__';
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(entry);
                  });
                  const sortedKeys = Object.keys(grouped).sort((a, b) => {
                    if (a === '__legacy__') return -1;
                    if (b === '__legacy__') return 1;
                    const dateA = new Date(grouped[a][0].triaged_at || grouped[a][0].created_at || 0).getTime();
                    const dateB = new Date(grouped[b][0].triaged_at || grouped[b][0].created_at || 0).getTime();
                    return dateA - dateB;
                  });
                  if (sortedKeys.length === 0) {
                    return <p className="text-xs text-slate-400">{t('no_records', 'app')}</p>;
                  }
                  let consultationNumber = 0;
                  return sortedKeys.map(key => {
                    const entries = grouped[key];
                    const isLegacy = key === '__legacy__';
                    if (!isLegacy) consultationNumber++;
                    const triageEntries = entries.filter((e: any) => e.type?.includes('Triagem'));
                    const medEntries = entries.filter((e: any) => !e.type?.includes('Triagem') && e.type !== 'Vacina');
                    triageEntries.sort((a: any, b: any) => new Date(a.triaged_at || a.created_at || 0).getTime() - new Date(b.triaged_at || b.created_at || 0).getTime());
                    medEntries.sort((a: any, b: any) => new Date(a.created_at || a.date || 0).getTime() - new Date(b.created_at || b.date || 0).getTime());
                    const firstEntry = entries[0];
                    const dateLabel = firstEntry.triaged_at
                      ? new Date(firstEntry.triaged_at).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : firstEntry.date || '—';
                    return (
                      <div key={key} className="mb-4">
                        {!isLegacy && (
                          <div className="bg-slate-50 rounded-lg p-2 mb-3 border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-700">
                              📋 {t('rcpt_timeline_consultation', 'app')} #{consultationNumber} — {dateLabel}
                            </p>
                          </div>
                        )}
                        {triageEntries.map((triageEntry: any, tIdx: number) => (
                          <div key={`triage-${key}-${tIdx}`} className="flex gap-2.5 mb-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></div>
                              <div className="w-0.5 flex-1 bg-slate-200"></div>
                            </div>
                            <div className="flex-1 text-xs">
                              <p className="font-bold text-slate-800">{t('rcpt_timeline_triage', 'app')}</p>
                              <p className="text-[10px] text-slate-400">
                                {triageEntry.triaged_at ? new Date(triageEntry.triaged_at).toLocaleString(locale) : '—'}
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
                            </div>
                          </div>
                        ))}
                        {medEntries.map((med: any, mIdx: number) => (
                          <div key={`med-${key}-${mIdx}`} className="flex gap-2.5 mb-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                              <div className="w-0.5 flex-1 bg-slate-200"></div>
                            </div>
                            <div className="flex-1 text-xs">
                              <p className="font-bold text-slate-800">🏥 {med.location_name || t('rcpt_timeline_medical_consultation', 'app')}</p>
                              <p className="text-[10px] text-slate-400">
                                {med.created_at ? new Date(med.created_at).toLocaleString(locale) : med.date || '—'}
                              </p>
                              <div className="mt-1 text-[10px] text-slate-500 space-y-0.5 border-l-2 border-blue-200 pl-2">
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
                            </div>
                          </div>
                        ))}
                        {(() => {
                          const lastEntry = entries[entries.length - 1];
                          const completedTime = lastEntry.created_at || lastEntry.triaged_at;
                          return (
                            <div className="flex gap-2.5">
                              <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-600 flex-shrink-0"></div>
                              </div>
                              <div className="text-xs">
                                <p className="font-bold text-green-700">{t('rcpt_timeline_visit_completed', 'app')}</p>
                                <p className="text-[10px] text-slate-400">
                                  {completedTime ? new Date(completedTime).toLocaleString(locale) : '—'}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Main: HCE Tabs */}
          <div className="lg:col-span-3">
            <div className={sectionCls}>
              {/* Tab Navigation - 2 rows */}
              <div className="space-y-1 border-b border-slate-100 pb-1">
                <div className="flex gap-1">
                  {hceTabs.slice(0, 6).map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button key={tab.key} onClick={() => switchHceTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition whitespace-nowrap cursor-pointer
                          ${hceTab === tab.key ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Icon className="w-3.5 h-3.5" /> {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {hceTabs.slice(6).map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button key={tab.key} onClick={() => switchHceTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition whitespace-nowrap cursor-pointer
                          ${hceTab === tab.key ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Icon className="w-3.5 h-3.5" /> {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Access gate: operador não designado na equipe assistencial */}
              {selectedPatId && careTeamLoaded && !breakGlassActive && (
                (() => {
                  const isMember = careTeam.some(m => m.professionalName === activeOperator) || hasSensitiveAccess;
                  if (isMember) return null;
                  return (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-start gap-2">
                      <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">{t('hce_access_restricted_title', 'app')}</p>
                        <p className="mt-0.5">{t('hce_access_restricted_desc', 'app')}</p>
                        <button onClick={() => { setHceTab('security'); }} className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition">
                          {t('hce_break_glass_activate', 'app')}
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* ═══ TAB: ANAMNESE ═══ */}
              {hceTab === 'anamnese' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" /> {t('hce_anamnese_title', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (
                  <div className="flex gap-4">

                    {/* Vertical list of past anamneses */}
                    <div className="w-52 shrink-0 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('hce_anamnese_history', 'app')}</p>
                      <button onClick={handleNewAnamnese} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {t('hce_new_anamnese', 'app')}
                      </button>
                      {anamneseList.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">{t('hce_no_anamnese_records', 'app')}</p>
                      )}
                      {anamneseList.map((record, idx) => {
                        const active = anamnese.id === record.id;
                        return (
                          <button key={record.id} onClick={() => handleSelectAnamnese(record)} className={`w-full text-left px-3 py-2 rounded-lg border transition ${active ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <span className={`block text-xs font-bold ${active ? 'text-teal-700' : 'text-slate-700'}`}>
                              {t('hce_anamnese_item', 'app')} {idx + 1}
                            </span>
                            <span className="block text-[10px] text-slate-500">{formatDate(record.createdAt)}</span>
                            {record.createdBy && <span className="block text-[10px] text-slate-400 truncate">{record.createdBy}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active anamnese form */}
                    <div className="flex-1 min-w-0 space-y-4">
                  {anamneseErrors.length > 0 && <FormErrorSummary errors={anamneseErrors} />}

                  {/* Smoking / Alcohol / Exercise */}
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label={t('hce_smoking', 'app')} error={anamneseFieldErrors.smoking}>
                      <select value={anamnese.smoking} onChange={e => setAnamnese(p => ({ ...p, smoking: e.target.value }))} className={inputCls}>
                        <option value="">{t('agenda_select', 'app')}</option>
                        <option value="sim">{t('hce_smoking_yes', 'app')}</option>
                        <option value="não">{t('hce_smoking_no', 'app')}</option>
                        <option value="ex-fumante">{t('hce_smoking_ex', 'app')}</option>
                        <option value="nunca-fumou">{t('hce_smoking_never', 'app')}</option>
                      </select>
                    </FormField>
                    <FormField label={t('hce_alcohol', 'app')} error={anamneseFieldErrors.alcohol}>
                      <select value={anamnese.alcohol} onChange={e => setAnamnese(p => ({ ...p, alcohol: e.target.value }))} className={inputCls}>
                        <option value="">{t('agenda_select', 'app')}</option>
                        <option value="não">{t('hce_alcohol_no', 'app')}</option>
                        <option value="ocasional">{t('hce_alcohol_occasional', 'app')}</option>
                        <option value="frequente">{t('hce_alcohol_frequent', 'app')}</option>
                        <option value="ex-etilista">{t('hce_alcohol_ex', 'app')}</option>
                      </select>
                    </FormField>
                    <FormField label={t('hce_physical_activity', 'app')} error={anamneseFieldErrors.physicalActivity}>
                      <select value={anamnese.physicalActivity} onChange={e => setAnamnese(p => ({ ...p, physicalActivity: e.target.value }))} className={inputCls}>
                        <option value="">{t('agenda_select', 'app')}</option>
                        <option value="não">{t('hce_activity_none', 'app')}</option>
                        <option value="leve">{t('hce_activity_light', 'app')}</option>
                        <option value="moderada">{t('hce_activity_moderate', 'app')}</option>
                        <option value="intensa">{t('hce_activity_intense', 'app')}</option>
                      </select>
                    </FormField>
                  </div>

                  {/* Personal Pathological History */}
                  <FormField label={t('hce_personal_pathological', 'app')} error={anamneseFieldErrors.personalPathological}>
                    <textarea value={anamnese.personalPathological.join(', ')} onChange={e => setAnamnese(p => ({ ...p, personalPathological: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} rows={2} className={textareaCls} placeholder={t('hce_personal_pathological_placeholder', 'app')} />
                  </FormField>

                  {/* Diet / Sleep */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t('hce_diet', 'app')} error={anamneseFieldErrors.diet}>
                      <input type="text" value={anamnese.diet} onChange={e => setAnamnese(p => ({ ...p, diet: e.target.value }))} className={inputCls} placeholder={t('hce_diet_placeholder', 'app')} />
                    </FormField>
                    <FormField label={t('hce_sleep', 'app')} error={anamneseFieldErrors.sleep}>
                      <input type="text" value={anamnese.sleep} onChange={e => setAnamnese(p => ({ ...p, sleep: e.target.value }))} className={inputCls} placeholder={t('hce_sleep_placeholder', 'app')} />
                    </FormField>
                  </div>

                  {/* Social */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t('hce_profession', 'app')} error={anamneseFieldErrors.occupation}>
                      <input type="text" value={anamnese.occupation} onChange={e => setAnamnese(p => ({ ...p, occupation: e.target.value }))} className={inputCls} placeholder={t('hce_profession_placeholder', 'app')} />
                    </FormField>
                    <FormField label={t('hce_marital_status', 'app')} error={anamneseFieldErrors.maritalStatus}>
                      <select value={anamnese.maritalStatus} disabled className={`${inputCls} bg-slate-100 text-slate-500 cursor-not-allowed appearance-none`}>
                        <option value="">{t('agenda_select', 'app')}</option>
                        <option value="Solteiro(a)">{t('hce_marital_single', 'app')}</option>
                        <option value="Casado(a)">{t('hce_marital_married', 'app')}</option>
                        <option value="Divorciado(a)">{t('hce_marital_divorced', 'app')}</option>
                        <option value="Viúvo(a)">{t('hce_marital_widowed', 'app')}</option>
                        <option value="União Estável">{t('hce_marital_stable', 'app')}</option>
                      </select>
                    </FormField>
                  </div>

                  {/* Allergies */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    <h5 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {t('hce_allergies', 'app')}
                    </h5>
                    <div className="space-y-2">
                      <SnomedSearchBox
                        placeholder={t('hce_allergen', 'app')}
                        initialCode={newAllergy.snomedCode ?? ''}
                        initialDescription={newAllergy.allergen}
                        onPick={(item) => setNewAllergy(p => ({
                          ...p,
                          allergen: item.term || item.concept.preferred_term,
                          snomedCode: String(item.concept.concept_id),
                          snomedDescription: item.term || item.concept.preferred_term,
                        }))}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder={t('hce_allergy_type', 'app')} value={newAllergy.type} onChange={e => setNewAllergy(p => ({ ...p, type: e.target.value }))} className={inputCls} />
                        <select value={newAllergy.severity} onChange={e => setNewAllergy(p => ({ ...p, severity: e.target.value as any }))} className={inputCls}>
                          <option value="">{t('agenda_select', 'app')}</option>
                          <option value="leve">{t('hce_severity_mild', 'app')}</option>
                          <option value="moderada">{t('hce_severity_moderate', 'app')}</option>
                          <option value="grave">{t('hce_severity_severe', 'app')}</option>
                        </select>
                        <input type="text" placeholder={t('hce_reaction', 'app')} value={newAllergy.reaction} onChange={e => setNewAllergy(p => ({ ...p, reaction: e.target.value }))} className={inputCls} />
                      </div>
                    </div>
                    <button type="button" onClick={() => {
                      if (!newAllergy.allergen.trim()) return;
                      if (!newAllergy.severity) return;
                      setAnamnese(p => ({ ...p, allergies: [...p.allergies, newAllergy] }));
                      setNewAllergy({ allergen: '', type: '', severity: '' as any, reaction: '', snomedCode: '', snomedDescription: '' });
                    }} disabled={!newAllergy.allergen.trim() || !newAllergy.severity} className="text-xs text-teal-600 font-bold flex items-center gap-1 cursor-pointer hover:text-teal-800 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Plus className="w-3 h-3" /> {t('hce_add_allergy', 'app')}
                    </button>
                    {anamnese.allergies.length > 0 && (
                      <div className="space-y-1">
                        {anamnese.allergies.map((a, i) => (
                          <div key={i} className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-rose-800">{a.allergen}</span>
                            <span className="text-rose-600">{a.type} - {a.severity} - {a.reaction}</span>
                            {a.snomedCode && <span className="text-[10px] text-rose-500 font-mono">{t('hce_snomed_code', 'app')}: {a.snomedCode}</span>}
                            <button onClick={() => setAnamnese(p => ({ ...p, allergies: p.allergies.filter((_, j) => j !== i) }))} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Current Medications */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    <h5 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-blue-500" /> {t('hce_current_medications', 'app')}
                    </h5>
                    <div className="grid grid-cols-6 gap-2">
                      <input type="text" placeholder={t('hce_medication', 'app')} value={newMedication.name} onChange={e => setNewMedication(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_dosage', 'app')} value={newMedication.dosage} onChange={e => setNewMedication(p => ({ ...p, dosage: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_frequency', 'app')} value={newMedication.frequency} onChange={e => setNewMedication(p => ({ ...p, frequency: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_route', 'app')} value={newMedication.route} onChange={e => setNewMedication(p => ({ ...p, route: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_since', 'app')} value={newMedication.since} onChange={e => setNewMedication(p => ({ ...p, since: e.target.value }))} className={inputCls} />
                      <button type="button" onClick={() => {
                        if (!newMedication.name.trim()) return;
                        if (!newMedication.frequency.trim()) return;
                        setAnamnese(p => ({ ...p, currentMedications: [...p.currentMedications, newMedication] }));
                        setNewMedication({ name: '', dosage: '', frequency: '', route: '', since: '' });
                      }} disabled={!newMedication.name.trim() || !newMedication.frequency.trim()} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 rounded-lg font-bold flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="w-3 h-3" /> {t('hce_add', 'app')}</button>
                    </div>
                    {anamnese.currentMedications.length > 0 && (
                      <div className="space-y-1">
                        {anamnese.currentMedications.map((m, i) => (
                          <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-blue-800">{m.name}</span>
                            <span className="text-blue-600">{m.dosage} - {m.frequency}{m.route ? ` (${m.route})` : ''}{m.since ? ` (${t('hce_since', 'app')}: ${m.since})` : ''}</span>
                            <button onClick={() => setAnamnese(p => ({ ...p, currentMedications: p.currentMedications.filter((_, j) => j !== i) }))} className="text-blue-500 hover:text-blue-700"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Family History */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    <h5 className="text-xs font-bold text-slate-600 uppercase">{t('hce_family_history', 'app')}</h5>
                    <div className="grid grid-cols-4 gap-2">
                      <input type="text" placeholder={t('hce_relation', 'app')} value={newFamily.relation} onChange={e => setNewFamily(p => ({ ...p, relation: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_condition', 'app')} value={newFamily.condition} onChange={e => setNewFamily(p => ({ ...p, condition: e.target.value }))} className={inputCls} />
                      <input type="text" inputMode="numeric" placeholder={t('hce_age', 'app')} value={newFamily.age || ''} onChange={e => setNewFamily(p => ({ ...p, age: parseInt(e.target.value) || undefined }))} className={inputCls} />
                      <button type="button" onClick={() => {
                        if (!newFamily.relation.trim()) return;
                        if (!newFamily.condition.trim()) return;
                        setAnamnese(p => ({ ...p, familyHistory: [...p.familyHistory, newFamily] }));
                        setNewFamily({ relation: '', condition: '', age: undefined, deceased: false });
                      }} disabled={!newFamily.relation.trim() || !newFamily.condition.trim()} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 rounded-lg font-bold flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="w-3 h-3" /> {t('hce_add', 'app')}</button>
                    </div>
                    {anamnese.familyHistory.length > 0 && (
                      <div className="space-y-1">
                        {anamnese.familyHistory.map((f, i) => (
                          <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-amber-800">{f.relation}</span>
                            <span className="text-amber-600">{f.condition}{f.age ? ` - ${f.age} ${t('hce_years_short', 'app')}` : ''}</span>
                            <button onClick={() => setAnamnese(p => ({ ...p, familyHistory: p.familyHistory.filter((_, j) => j !== i) }))} className="text-amber-500 hover:text-amber-700"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Surgical History */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    <h5 className="text-xs font-bold text-slate-600 uppercase">{t('hce_surgical_history', 'app')}</h5>
                    <div className="grid grid-cols-4 gap-2">
                      <input type="text" placeholder={t('hce_procedure', 'app')} value={newSurgery.procedure} onChange={e => setNewSurgery(p => ({ ...p, procedure: e.target.value }))} className={inputCls} />
                      <I18nDatePicker value={newSurgery.date} onChange={v => setNewSurgery(p => ({ ...p, date: v }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_hospital', 'app')} value={newSurgery.hospital} onChange={e => setNewSurgery(p => ({ ...p, hospital: e.target.value }))} className={inputCls} />
                      <button type="button" onClick={() => {
                        if (!newSurgery.procedure.trim()) return;
                        setAnamnese(p => ({ ...p, surgicalHistory: [...p.surgicalHistory, newSurgery] }));
                        setNewSurgery({ procedure: '', date: '', hospital: '', complications: '' });
                      }} disabled={!newSurgery.procedure.trim()} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 rounded-lg font-bold flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="w-3 h-3" /> {t('hce_add', 'app')}</button>
                    </div>
                    {anamnese.surgicalHistory.length > 0 && (
                      <div className="space-y-1">
                        {anamnese.surgicalHistory.map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-purple-800">{s.procedure}</span>
                            <span className="text-purple-600">{formatDate(s.date)} - {s.hospital}</span>
                            <button onClick={() => setAnamnese(p => ({ ...p, surgicalHistory: p.surgicalHistory.filter((_, j) => j !== i) }))} className="text-purple-500 hover:text-purple-700"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gynecological (campo sensível - Lei 1682/2001) */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    <h5 className="text-xs font-bold text-slate-600 uppercase">{t('hce_gynecological', 'app')}</h5>
                    {!hasSensitiveAccess && !breakGlassActive ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-400 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" /> {t('hce_sensitive_locked', 'app')}
                      </div>
                    ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <FormField label={t('hce_gynecological_menarche', 'app')} error={anamneseFieldErrors.menarche}>
                        <input type="text" value={anamnese.gynecological?.menarche || ''} onChange={e => setAnamnese(p => ({ ...p, gynecological: { menarche: e.target.value, gestations: p.gynecological?.gestations || 0, deliveries: p.gynecological?.deliveries || 0, abortions: p.gynecological?.abortions || 0, cesareans: p.gynecological?.cesareans || 0, lastMenstruation: p.gynecological?.lastMenstruation || '', contraceptiveMethod: p.gynecological?.contraceptiveMethod || '' } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_gynecological_gestations', 'app')} error={anamneseFieldErrors.gestations}>
                        <input type="text" inputMode="numeric" value={anamnese.gynecological?.gestations ?? ''} onChange={e => setAnamnese(p => ({ ...p, gynecological: { ...p.gynecological!, gestations: parseInt(e.target.value) || 0 } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_gynecological_deliveries', 'app')} error={anamneseFieldErrors.deliveries}>
                        <input type="text" inputMode="numeric" value={anamnese.gynecological?.deliveries ?? ''} onChange={e => setAnamnese(p => ({ ...p, gynecological: { ...p.gynecological!, deliveries: parseInt(e.target.value) || 0 } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_gynecological_abortions', 'app')} error={anamneseFieldErrors.abortions}>
                        <input type="text" inputMode="numeric" value={anamnese.gynecological?.abortions ?? ''} onChange={e => setAnamnese(p => ({ ...p, gynecological: { ...p.gynecological!, abortions: parseInt(e.target.value) || 0 } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_gynecological_cesareans', 'app')} error={anamneseFieldErrors.cesareans}>
                        <input type="text" inputMode="numeric" value={anamnese.gynecological?.cesareans ?? ''} onChange={e => setAnamnese(p => ({ ...p, gynecological: { ...p.gynecological!, cesareans: parseInt(e.target.value) || 0 } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_gynecological_last_menstruation', 'app')} error={anamneseFieldErrors.lastMenstruation}>
                        <input type="text" value={anamnese.gynecological?.lastMenstruation || ''} onChange={e => setAnamnese(p => ({ ...p, gynecological: { ...p.gynecological!, lastMenstruation: e.target.value } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_gynecological_contraceptive', 'app')} className="col-span-2" error={anamneseFieldErrors.contraceptiveMethod}>
                        <input type="text" value={anamnese.gynecological?.contraceptiveMethod || ''} onChange={e => setAnamnese(p => ({ ...p, gynecological: { ...p.gynecological!, contraceptiveMethod: e.target.value } }))} className={inputCls} />
                      </FormField>
                    </div>
                    )}
                  </div>

                  {/* Obstetric (campo sensível - Lei 1682/2001) */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    <h5 className="text-xs font-bold text-slate-600 uppercase">{t('hce_obstetric', 'app')}</h5>
                    {!hasSensitiveAccess && !breakGlassActive ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-400 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" /> {t('hce_sensitive_locked', 'app')}
                      </div>
                    ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <FormField label={t('hce_obstetric_gestation_number', 'app')} error={anamneseFieldErrors.gestationNumber}>
                        <input type="text" inputMode="numeric" value={anamnese.obstetric?.gestationNumber ?? ''} onChange={e => setAnamnese(p => ({ ...p, obstetric: { gestationNumber: parseInt(e.target.value) || 0, expectedDueDate: p.obstetric?.expectedDueDate || '', prenatalStart: p.obstetric?.prenatalStart || '', riskClassification: p.obstetric?.riskClassification || '' } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_obstetric_due_date', 'app')} error={anamneseFieldErrors.expectedDueDate}>
                        <input type="text" value={anamnese.obstetric?.expectedDueDate || ''} onChange={e => setAnamnese(p => ({ ...p, obstetric: { ...p.obstetric!, expectedDueDate: e.target.value } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_obstetric_prenatal_start', 'app')} error={anamneseFieldErrors.prenatalStart}>
                        <input type="text" value={anamnese.obstetric?.prenatalStart || ''} onChange={e => setAnamnese(p => ({ ...p, obstetric: { ...p.obstetric!, prenatalStart: e.target.value } }))} className={inputCls} />
                      </FormField>
                      <FormField label={t('hce_obstetric_risk_classification', 'app')} error={anamneseFieldErrors.riskClassification}>
                        <input type="text" value={anamnese.obstetric?.riskClassification || ''} onChange={e => setAnamnese(p => ({ ...p, obstetric: { ...p.obstetric!, riskClassification: e.target.value } }))} className={inputCls} />
                      </FormField>
                    </div>
                    )}
                  </div>

                  {/* Notes */}
                  <FormField label={t('hce_notes', 'app')} error={anamneseFieldErrors.notes}>
                    <textarea value={anamnese.notes} onChange={e => setAnamnese(p => ({ ...p, notes: e.target.value }))} rows={3} className={textareaCls} placeholder={t('hce_notes_placeholder', 'app')} />
                  </FormField>

                  <div className="flex justify-end gap-2">
                    {anamnese.id && (
                      <button onClick={handleDeleteAnamnese} className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs transition">
                        {t('hce_delete', 'app')}
                      </button>
                    )}
                    <button onClick={handleSaveAnamnese} className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                      {t('hce_save_anamnese', 'app')}
                    </button>
                  </div>

                    </div>
                  </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: EXAME FÍSICO ═══ */}
              {hceTab === 'exam' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" /> {t('hce_physical_exam_title', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (
                  <div className="flex gap-4">

                    {/* Vertical list of past physical exams */}
                    <div className="w-52 shrink-0 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('hce_physical_exam_history', 'app')}</p>
                      <button onClick={handleNewPhysicalExam} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {t('hce_new_physical_exam', 'app')}
                      </button>
                      {physicalExamList.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">{t('hce_no_physical_exam_records', 'app')}</p>
                      )}
                      {physicalExamList.map((record, idx) => {
                        const active = physicalExam.id === record.id;
                        return (
                          <button key={record.id} onClick={() => handleSelectPhysicalExam(record)} className={`w-full text-left px-3 py-2 rounded-lg border transition ${active ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <span className={`block text-xs font-bold ${active ? 'text-teal-700' : 'text-slate-700'}`}>
                              {t('hce_physical_exam_item', 'app')} {idx + 1}
                            </span>
                            <span className="block text-[10px] text-slate-500">{formatDate(record.createdAt)}</span>
                            {record.createdBy && <span className="block text-[10px] text-slate-400 truncate">{record.createdBy}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active physical exam form */}
                    <div className="flex-1 min-w-0 space-y-4">
                  {physicalExamErrors.length > 0 && <FormErrorSummary errors={physicalExamErrors} />}

                  {/* Vital Signs */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      <span>{t('hce_vital_signs', 'app')}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className={labelCls}>{t('hce_weight', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.weight || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed`} placeholder="kg" readOnly />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_height', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.height || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed`} placeholder="cm" readOnly />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_blood_pressure', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.bloodPressure || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed`} placeholder="120/80" readOnly />
                        {physicalExam.vitalSigns.bloodPressure && (() => {
                          const parts = physicalExam.vitalSigns.bloodPressure.split('/');
                          const sys = parseInt(parts[0]);
                          const dia = parseInt(parts[1]);
                          const d = isNaN(dia) ? NaN : dia;
                          if (!isNaN(sys)) {
                            if (vitalsLimits.pa.red(sys, d)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0" /> <span className="text-red-600 font-medium leading-tight">{t('rcpt_triage_bp_critical_low', 'app')}</span></p>;
                            if (vitalsLimits.pa.orange(sys, d)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block shrink-0" /> <span className="text-orange-600 font-medium leading-tight">{t('rcpt_triage_bp_abnormal', 'app')}</span></p>;
                            if (vitalsLimits.pa.yellow(sys, d)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" /> <span className="text-amber-600 font-medium leading-tight">{t('rcpt_triage_bp_elevated', 'app')}</span></p>;
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" /> <span className="text-green-600 font-medium leading-tight">{t('rcpt_triage_status_normal', 'app')}</span></p>;
                          }
                          return null;
                        })()}
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_temperature', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.temperature || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed`} placeholder="36.5" readOnly />
                        {physicalExam.vitalSigns.temperature && (() => {
                          const temp = parseFloat(physicalExam.vitalSigns.temperature);
                          if (!isNaN(temp)) {
                            if (vitalsLimits.temp.red(temp, patientAgeMonths)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0" /> <span className="text-red-600 font-medium leading-tight">{t('rcpt_triage_temp_red', 'app')}</span></p>;
                            if (vitalsLimits.temp.orange(temp, patientAgeMonths)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block shrink-0" /> <span className="text-orange-600 font-medium leading-tight">{t('rcpt_triage_temp_orange', 'app')}</span></p>;
                            if (vitalsLimits.temp.yellow(temp, patientAgeMonths)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" /> <span className="text-amber-600 font-medium leading-tight">{t('rcpt_triage_temp_yellow', 'app')}</span></p>;
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" /> <span className="text-green-600 font-medium leading-tight">{t('rcpt_triage_status_normal', 'app')}</span></p>;
                          }
                          return null;
                        })()}
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_spo2', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.spo2 || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed`} placeholder="98" readOnly />
                        {physicalExam.vitalSigns.spo2 && (() => {
                          const spo2 = Number(physicalExam.vitalSigns.spo2);
                          if (!isNaN(spo2)) {
                            if (vitalsLimits.spo2.red(spo2)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0" /> <span className="text-red-600 font-medium leading-tight">{t('rcpt_triage_spo2_critical', 'app')}</span></p>;
                            if (vitalsLimits.spo2.orange(spo2)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block shrink-0" /> <span className="text-orange-600 font-medium leading-tight">{t('rcpt_triage_spo2_low', 'app')}</span></p>;
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" /> <span className="text-green-600 font-medium leading-tight">{t('rcpt_triage_spo2_normal', 'app')}</span></p>;
                          }
                          return null;
                        })()}
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_heart_rate', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.heartRate || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed`} placeholder="bpm" readOnly />
                        {physicalExam.vitalSigns.heartRate && (() => {
                          const hr = parseInt(physicalExam.vitalSigns.heartRate);
                          if (!isNaN(hr)) {
                            if (vitalsLimits.fc.red(hr)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0" /> <span className="text-red-600 font-medium leading-tight">{t('rcpt_triage_hr_critical', 'app')}</span></p>;
                            if (vitalsLimits.fc.orange(hr)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block shrink-0" /> <span className="text-orange-600 font-medium leading-tight">{t('rcpt_triage_hr_abnormal', 'app')}</span></p>;
                            if (vitalsLimits.fc.yellow(hr)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" /> <span className="text-amber-600 font-medium leading-tight">{t('rcpt_triage_hr_elevated', 'app')}</span></p>;
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" /> <span className="text-green-600 font-medium leading-tight">{t('rcpt_triage_status_normal', 'app')}</span></p>;
                          }
                          return null;
                        })()}
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_respiratory_rate', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.respiratoryRate || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed`} placeholder="irpm" readOnly />
                        {physicalExam.vitalSigns.respiratoryRate && (() => {
                          const rr = parseInt(physicalExam.vitalSigns.respiratoryRate);
                          if (!isNaN(rr)) {
                            if (vitalsLimits.fr.red(rr, patientAgeMonths)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0" /> <span className="text-red-600 font-medium leading-tight">{t('rcpt_triage_rr_critical', 'app')}</span></p>;
                            if (vitalsLimits.fr.orange(rr, patientAgeMonths)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block shrink-0" /> <span className="text-orange-600 font-medium leading-tight">{t('rcpt_triage_rr_elevated', 'app')}</span></p>;
                            if (vitalsLimits.fr.yellow(rr, patientAgeMonths)) return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" /> <span className="text-amber-600 font-medium leading-tight">{t('rcpt_triage_rr_slightly', 'app')}</span></p>;
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" /> <span className="text-green-600 font-medium leading-tight">{t('rcpt_triage_status_normal', 'app')}</span></p>;
                          }
                          return null;
                        })()}
                      </div>
                      {patientAgeMonths >= 12 && (
                      <div>
                        <label className={labelCls}>{t('hce_bmi', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.imc || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed`} placeholder="kg/m²" readOnly />
                        {physicalExam.vitalSigns.imc && (() => {
                          const imc = parseFloat(physicalExam.vitalSigns.imc);
                          if (!isNaN(imc)) {
                            const cls = classifyBmiForAge(imc, patientAgeMonths, selectedPatient?.gender);
                            if (!cls) return null;
                            const dot = cls.color === 'red' ? 'bg-red-500' : cls.color === 'orange' ? 'bg-orange-500' : cls.color === 'yellow' ? 'bg-amber-400' : 'bg-green-500';
                            const label = cls.kind === 'underweight' ? t('rcpt_triage_bmi_underweight', 'app') : cls.kind === 'overweight' ? t('rcpt_triage_bmi_overweight', 'app') : cls.kind === 'obese' ? t('rcpt_triage_bmi_obese', 'app') : t('rcpt_triage_status_normal', 'app');
                            return <p className="text-[10px] mt-1 flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${dot} inline-block shrink-0`} /> <span className={`font-medium leading-tight ${cls.color === 'red' ? 'text-red-600' : cls.color === 'orange' ? 'text-orange-600' : cls.color === 'yellow' ? 'text-amber-600' : 'text-green-600'}`}>{imc.toFixed(1)} — {label}</span></p>;
                          }
                          return null;
                        })()}
                      </div>
                      )}
                    </div>
                  </div>

                  {/* General Aspect */}
                  <FormField label={t('hce_general_aspect', 'app')} error={physicalExamFieldErrors.generalAspect}>
                    <input type="text" value={physicalExam.generalAspect} onChange={e => setPhysicalExam(p => ({ ...p, generalAspect: e.target.value }))} className={inputCls} placeholder={t('hce_general_aspect_placeholder', 'app')} />
                  </FormField>

                  {/* Body Systems */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'examHeadNeck', label: t('hce_head_neck', 'app') },
                      { key: 'examCardiovascular', label: t('hce_cardiovascular', 'app') },
                      { key: 'examRespiratory', label: t('hce_respiratory', 'app') },
                      { key: 'examAbdomen', label: t('hce_abdomen', 'app') },
                      { key: 'examGenitourinary', label: t('hce_genitourinary', 'app') },
                      { key: 'examMusculoskeletal', label: t('hce_musculoskeletal', 'app') },
                      { key: 'examNeurological', label: t('hce_neurological', 'app') },
                      { key: 'examSkin', label: t('hce_skin', 'app') },
                      { key: 'examEyes', label: t('hce_eyes', 'app') },
                      { key: 'examEars', label: t('hce_ears', 'app') },
                      { key: 'examMouth', label: t('hce_mouth', 'app') },
                      { key: 'examRectal', label: t('hce_rectal', 'app') },
                      { key: 'examPsychiatric', label: t('hce_psychiatric', 'app') },
                    ].map(field => (
                      <FormField key={field.key} label={field.label} error={physicalExamFieldErrors[field.key]}>
                        <textarea
                          value={(physicalExam as any)[field.key] || ''}
                          onChange={e => setPhysicalExam(p => ({ ...p, [field.key]: e.target.value }))}
                          rows={2}
                          className={textareaCls}
                          placeholder={`${t('hce_exam_placeholder', 'app')} ${field.label.toLowerCase()}...`}
                        />
                      </FormField>
                    ))}
                  </div>

                  <FormField label={t('hce_notes', 'app')} error={physicalExamFieldErrors.notes}>
                    <textarea
                      value={physicalExam.notes || ''}
                      onChange={e => setPhysicalExam(p => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      className={textareaCls}
                      placeholder={t('hce_notes_placeholder', 'app')}
                    />
                  </FormField>

                  <div className="flex justify-end gap-2">
                    {physicalExam.id && (
                      <button onClick={handleDeletePhysicalExam} className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs transition">
                        {t('hce_delete', 'app')}
                      </button>
                    )}
                    <button onClick={handleSavePhysicalExam}
                      className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                      {t('hce_save_physical_exam', 'app')}
                    </button>
                  </div>

                    </div>
                  </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: SOAP ═══ */}
              {hceTab === 'soap' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-teal-600" /> {t('hce_soap_title', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (
                  <div className="flex gap-4">

                    {/* Vertical list of past SOAP notes */}
                    <div className="w-52 shrink-0 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('hce_soap_history', 'app')}</p>
                      <button onClick={handleNewSoap} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {t('hce_new_soap', 'app')}
                      </button>
                      {soapList.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">{t('hce_no_soap_records', 'app')}</p>
                      )}
                      {soapList.map((record, idx) => {
                        const active = soapNote.id === record.id;
                        return (
                          <button key={record.id} onClick={() => handleSelectSoap(record)} className={`w-full text-left px-3 py-2 rounded-lg border transition ${active ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <span className={`block text-xs font-bold ${active ? 'text-teal-700' : 'text-slate-700'}`}>
                              {t('hce_soap_item', 'app')} {idx + 1}
                            </span>
                            <span className="block text-[10px] text-slate-500">{formatDate(record.createdAt)}</span>
                            {record.createdBy && <span className="block text-[10px] text-slate-400 truncate">{record.createdBy}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active SOAP form */}
                    <div className="flex-1 min-w-0 space-y-4">
                  {soapErrors.length > 0 && <FormErrorSummary errors={soapErrors} />}

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t('hce_subjective', 'app')} error={soapFieldErrors.subjective}>
                      <textarea value={soapNote.subjective} onChange={e => setSoapNote(p => ({ ...p, subjective: e.target.value }))} rows={5} className={textareaCls} placeholder={t('hce_subjective_placeholder', 'app')} />
                    </FormField>
                    <FormField label={t('hce_objective', 'app')} error={soapFieldErrors.objective}>
                      <textarea value={soapNote.objective} onChange={e => setSoapNote(p => ({ ...p, objective: e.target.value }))} rows={5} className={textareaCls} placeholder={t('hce_objective_placeholder', 'app')} />
                    </FormField>
                    <FormField label={t('hce_assessment', 'app')} error={soapFieldErrors.assessment}>
                      <textarea value={soapNote.assessment} onChange={e => setSoapNote(p => ({ ...p, assessment: e.target.value }))} rows={5} className={textareaCls} placeholder={t('hce_assessment_placeholder', 'app')} />
                    </FormField>
                    <FormField label={t('hce_plan', 'app')} error={soapFieldErrors.plan}>
                      <textarea value={soapNote.plan} onChange={e => setSoapNote(p => ({ ...p, plan: e.target.value }))} rows={5} className={textareaCls} placeholder={t('hce_plan_placeholder', 'app')} />
                    </FormField>
                  </div>
                  <FormField label={t('hce_notes', 'app')} error={soapFieldErrors.notes}>
                    <textarea value={soapNote.notes} onChange={e => setSoapNote(p => ({ ...p, notes: e.target.value }))} rows={2} className={textareaCls} />
                  </FormField>
                  <div className="flex justify-end gap-2">
                    {soapNote.id && (
                      <button onClick={handleDeleteSoap} className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs transition">
                        {t('hce_delete', 'app')}
                      </button>
                    )}
                    <button onClick={handleSaveSoap} className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                      {t('hce_save_soap', 'app')}
                    </button>
                  </div>

                    </div>
                  </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: DIAGNOSTICOS CID-10 ═══ */}
              {hceTab === 'diagnoses' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4 text-teal-600" /> {t('hce_tab_diagnoses', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (
                  <div className="flex gap-4">
                    <div className="w-52 shrink-0 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('hce_diagnosis_history', 'app')}</p>
                      <button onClick={() => { setEditingDiagnosis(null); setNewDiagnosis({ cid10Code: '', cid10Description: '', diagnosisType: 'principal', status: 'ativo', notes: '', snomedCode: '', snomedDescription: '' }); clearDiagnosisErrors(); }} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {t('hce_diagnosis_new', 'app')}
                      </button>
                      {diagnoses.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">{t('hce_no_diagnosis_records', 'app')}</p>
                      )}
                      {diagnoses.map((d, idx) => {
                        const active = editingDiagnosis?.id === d.id;
                        return (
                          <button key={d.id} onClick={() => { setEditingDiagnosis(d); clearDiagnosisErrors(); }} className={`w-full text-left px-3 py-2 rounded-lg border transition ${active ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <span className={`block text-xs font-bold ${active ? 'text-teal-700' : 'text-slate-700'}`}>
                              {d.cid10Code}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate">{lookupCid10Translation(d.cid10Code, d.cid10Description)}</span>
                            <span className="block text-[10px] text-slate-400">{formatDate(d.createdAt)}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                  {editingDiagnosis ? (
                    <>
                      {diagnosisErrors.length > 0 && <FormErrorSummary errors={diagnosisErrors} onClose={clearDiagnosisErrors} />}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input type="text" value={cidSearch} onChange={e => { setCidSearch(e.target.value); searchCid10(e.target.value); }} placeholder={t('hce_cid10_lookup', 'app')}
                          className={`${inputCls} pl-9`} />
                      </div>
                      <div className="max-h-[120px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                        {filteredCid10.length === 0 ? (
                          <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
                            {t('hce_cid10_no_results', 'app')}
                          </div>
                        ) : (
                          filteredCid10.map(c => (
                            <div key={c.code} onClick={() => { const translated = getCid10Description(c.code, c.description, c.description_es, c.description_pt); setEditingDiagnosis(p => p ? { ...p, cid10Code: c.code, cid10Description: translated, snomedCode: '', snomedDescription: '' } : null); clearDiagnosisErrors(); }}
                              className="px-3 py-2.5 hover:bg-teal-50 cursor-pointer flex items-center gap-2 text-sm transition">
                              <span className="font-bold text-teal-700 whitespace-nowrap">{c.code}</span>
                              <span className="text-slate-600 flex-1 min-w-0 truncate">{getCid10Description(c.code, c.description, c.description_es, c.description_pt)}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">{t('hce_cid10_chapter', 'app')} {c.chapter}</span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label={t('hce_cid10_code', 'app')} required error={diagnosisFieldErrors.cid10Code}>
                          <input type="text" value={editingDiagnosis.cid10Code} onChange={e => setEditingDiagnosis(p => p ? { ...p, cid10Code: e.target.value.toUpperCase(), snomedCode: '', snomedDescription: '' } : null)} className={inputCls} />
                        </FormField>
                        <FormField label={t('hce_cid10_description', 'app')} required error={diagnosisFieldErrors.cid10Description}>
                          <input type="text" value={lookupCid10Translation(editingDiagnosis.cid10Code, editingDiagnosis.cid10Description)} onChange={e => setEditingDiagnosis(p => p ? { ...p, cid10Description: e.target.value } : null)} className={inputCls} />
                        </FormField>
                      </div>
                      <div className="border border-teal-200 rounded-xl p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label={t('hce_diagnosis_type', 'app')} required error={diagnosisFieldErrors.diagnosisType}>
                            <select value={editingDiagnosis.diagnosisType} onChange={e => setEditingDiagnosis(p => p ? { ...p, diagnosisType: e.target.value as any } : null)} className={inputCls}>
                              <option value="principal">{t('hce_diagnosis_principal', 'app')}</option>
                              <option value="secundário">{t('hce_diagnosis_secundario', 'app')}</option>
                              <option value="diferencial">{t('hce_diagnosis_diferencial', 'app')}</option>
                              <option value="presuntivo">{t('hce_diagnosis_presuntivo', 'app')}</option>
                            </select>
                          </FormField>
                          <FormField label={t('hce_diagnosis_status', 'app')} required error={diagnosisFieldErrors.status}>
                            <select value={editingDiagnosis.status} onChange={e => setEditingDiagnosis(p => p ? { ...p, status: e.target.value as any } : null)} className={inputCls}>
                              <option value="ativo">{t('hce_diagnosis_status_ativo', 'app')}</option>
                              <option value="em_tratamento">{t('hce_diagnosis_status_em_tratamento', 'app')}</option>
                              <option value="crônico">{t('hce_diagnosis_status_cronico', 'app')}</option>
                              <option value="resolvido">{t('hce_diagnosis_status_resolvido', 'app')}</option>
                            </select>
                          </FormField>
                        </div>
                        <FormField label={t('hce_snomed_code', 'app')} error={diagnosisFieldErrors.snomedCode}>
                          <SnomedSearchBox
                            semanticAxis="disorder"
                            initialCode={editingDiagnosis.snomedCode ?? ''}
                            initialDescription={editingDiagnosis.snomedDescription ?? ''}
                            cid10Context={editingDiagnosis.cid10Code}
                            onPick={(item) => setEditingDiagnosis(p => p ? {
                              ...p,
                              snomedCode: String(item.concept.concept_id),
                              snomedDescription: item.term || item.concept.preferred_term,
                              ...(item.concept.cid10_code && !p.cid10Code ? { cid10Code: item.concept.cid10_code, cid10Description: item.term } : {}),
                            } : null)}
                          />
                        </FormField>
                        <FormField label={t('hce_snomed_description', 'app')} error={diagnosisFieldErrors.snomedDescription}>
                          <input type="text" value={editingDiagnosis.snomedDescription ?? ''} onChange={e => setEditingDiagnosis(p => p ? { ...p, snomedDescription: e.target.value } : null)} className={inputCls} />
                        </FormField>
                        <FormField label={t('hce_notes', 'app')} error={diagnosisFieldErrors.notes}>
                          <input type="text" value={editingDiagnosis.notes} onChange={e => setEditingDiagnosis(p => p ? { ...p, notes: e.target.value } : null)} className={inputCls} />
                        </FormField>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={async () => {
                          if (!editingDiagnosis) return;
                          if (!window.confirm(t('hce_confirm_delete_diagnosis', 'app'))) return;
                          setDiagnoses(prev => prev.filter(x => x.id !== editingDiagnosis.id));
                          if (supabase) {
                            await supabase.from('diagnoses').delete().eq('id', editingDiagnosis.id);
                          }
                          setEditingDiagnosis(null);
                        }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg">{t('hce_delete', 'app')}</button>
                        <button onClick={() => { setEditingDiagnosis(null); clearDiagnosisErrors(); }} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg">{t('hce_cancel', 'app')}</button>
                        <button onClick={async () => {
                          if (!editingDiagnosis) return;
                          const payload = {
                            cid10Code: editingDiagnosis.cid10Code ?? '',
                            cid10Description: editingDiagnosis.cid10Description ?? '',
                            diagnosisType: editingDiagnosis.diagnosisType,
                            status: editingDiagnosis.status,
                            snomedCode: editingDiagnosis.snomedCode ?? '',
                            snomedDescription: editingDiagnosis.snomedDescription ?? '',
                            notes: editingDiagnosis.notes ?? '',
                          };
                          const result = validateDiagnosis(payload);
                          if (!result.success) return;
                          await handleUpdateDiagnosis(editingDiagnosis);
                          setEditingDiagnosis(null);
                        }} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg">{t('save', 'app')}</button>
                      </div>
                    </>
                  ) : (
                    <>
                  {diagnosisErrors.length > 0 && <FormErrorSummary errors={diagnosisErrors} onClose={clearDiagnosisErrors} />}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" value={cidSearch} onChange={e => { setCidSearch(e.target.value); searchCid10(e.target.value); }} placeholder={t('hce_cid10_lookup', 'app')}
                      className={`${inputCls} pl-9`} />
                  </div>
                  <div className="max-h-[120px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                    {filteredCid10.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
                        {t('hce_cid10_no_results', 'app')}
                      </div>
                    ) : (
                      filteredCid10.map(c => (
                        <div key={c.code} onClick={() => { const translated = getCid10Description(c.code, c.description, c.description_es, c.description_pt); setNewDiagnosis(p => ({ ...p, cid10Code: c.code, cid10Description: translated, snomedCode: '', snomedDescription: '' })); clearDiagnosisErrors(); }}
                          className="px-3 py-2.5 hover:bg-teal-50 cursor-pointer flex items-center gap-2 text-sm transition">
                          <span className="font-bold text-teal-700 whitespace-nowrap">{c.code}</span>
                          <span className="text-slate-600 flex-1 min-w-0 truncate">{getCid10Description(c.code, c.description, c.description_es, c.description_pt)}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">{t('hce_cid10_chapter', 'app')} {c.chapter}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label={t('hce_cid10_code', 'app')} required error={diagnosisFieldErrors.cid10Code}>
                      <input type="text" value={newDiagnosis.cid10Code ?? ''} onChange={e => setNewDiagnosis(p => ({ ...p, cid10Code: e.target.value.toUpperCase() }))} className={inputCls} readOnly />
                    </FormField>
                    <FormField label={t('hce_cid10_description', 'app')} required error={diagnosisFieldErrors.cid10Description}>
                      <input type="text" value={lookupCid10Translation(newDiagnosis.cid10Code || '', newDiagnosis.cid10Description)} onChange={e => setNewDiagnosis(p => ({ ...p, cid10Description: e.target.value }))} className={inputCls} />
                    </FormField>
                  </div>
                  <div className="border border-teal-200 rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label={t('hce_diagnosis_type', 'app')} required error={diagnosisFieldErrors.diagnosisType}>
                        <select value={newDiagnosis.diagnosisType ?? 'principal'} onChange={e => setNewDiagnosis(p => ({ ...p, diagnosisType: e.target.value as any }))} className={inputCls}>
                          <option value="principal">{t('hce_diagnosis_principal', 'app')}</option>
                          <option value="secundário">{t('hce_diagnosis_secundario', 'app')}</option>
                          <option value="diferencial">{t('hce_diagnosis_diferencial', 'app')}</option>
                          <option value="presuntivo">{t('hce_diagnosis_presuntivo', 'app')}</option>
                        </select>
                      </FormField>
                      <FormField label={t('hce_diagnosis_status', 'app')} required error={diagnosisFieldErrors.status}>
                        <select value={newDiagnosis.status ?? 'ativo'} onChange={e => setNewDiagnosis(p => ({ ...p, status: e.target.value as any }))} className={inputCls}>
                          <option value="ativo">{t('hce_diagnosis_status_ativo', 'app')}</option>
                          <option value="em_tratamento">{t('hce_diagnosis_status_em_tratamento', 'app')}</option>
                          <option value="crônico">{t('hce_diagnosis_status_cronico', 'app')}</option>
                          <option value="resolvido">{t('hce_diagnosis_status_resolvido', 'app')}</option>
                        </select>
                      </FormField>
                    </div>
                    <FormField label={t('hce_snomed_code', 'app')} error={diagnosisFieldErrors.snomedCode}>
                      <SnomedSearchBox
                        semanticAxis="disorder"
                        initialCode={newDiagnosis.snomedCode ?? ''}
                        initialDescription={newDiagnosis.snomedDescription ?? ''}
                        cid10Context={newDiagnosis.cid10Code}
                        onPick={(item) => setNewDiagnosis(p => ({
                          ...p,
                          snomedCode: String(item.concept.concept_id),
                          snomedDescription: item.term || item.concept.preferred_term,
                          ...(item.concept.cid10_code && !p.cid10Code ? { cid10Code: item.concept.cid10_code, cid10Description: item.term } : {}),
                        }))}
                      />
                    </FormField>
                    <FormField label={t('hce_snomed_description', 'app')} error={diagnosisFieldErrors.snomedDescription}>
                      <input type="text" value={newDiagnosis.snomedDescription ?? ''} onChange={e => setNewDiagnosis(p => ({ ...p, snomedDescription: e.target.value }))} className={inputCls} />
                    </FormField>
                    <FormField label={t('hce_notes', 'app')} error={diagnosisFieldErrors.notes}>
                      <input type="text" value={newDiagnosis.notes ?? ''} onChange={e => setNewDiagnosis(p => ({ ...p, notes: e.target.value }))} className={inputCls} />
                    </FormField>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={async () => {
                      const payload = {
                        cid10Code: newDiagnosis.cid10Code ?? '',
                        cid10Description: newDiagnosis.cid10Description ?? '',
                        diagnosisType: (newDiagnosis.diagnosisType ?? 'principal') as 'principal' | 'secundário' | 'diferencial' | 'presuntivo',
                        status: (newDiagnosis.status ?? 'ativo') as 'ativo' | 'resolvido' | 'crônico' | 'em_tratamento',
                        snomedCode: newDiagnosis.snomedCode ?? '',
                        snomedDescription: newDiagnosis.snomedDescription ?? '',
                        notes: newDiagnosis.notes ?? '',
                      };
                      const result = validateDiagnosis(payload);
                      if (!result.success) return;
                      const diagId = await genId('diag');
                      const newDiag = { ...payload, id: diagId, patientId: selectedPatient?.id || '', createdBy: activeOperator, createdAt: new Date().toISOString() } as Diagnosis;
                      setDiagnoses(prev => [...prev, newDiag]);
                      setNewDiagnosis({ cid10Code: '', cid10Description: '', diagnosisType: 'principal', status: 'ativo', notes: '', snomedCode: '', snomedDescription: '' });
                      clearDiagnosisErrors();
                      if (supabase) {
                        await supabase.from('diagnoses').insert({
                          id: diagId, patient_id: selectedPatient?.id || '', created_by: activeOperator,
                          updated_by: null,
                          cid10_code: newDiag.cid10Code, cid10_description: newDiag.cid10Description,
                          snomed_code: newDiag.snomedCode || null, snomed_description: newDiag.snomedDescription || null,
                          diagnosis_type: newDiag.diagnosisType, status: newDiag.status, notes: newDiag.notes,
                        });
                      }
                    }} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-4 py-2 rounded-lg font-bold">
                      {t('hce_diagnosis_add', 'app')}
                    </button>
                  </div>
                    </>
                  )}
                    </div>
                  </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: PRESCRIPTIONS ═══ */}
              {hceTab === 'prescriptions' && (
                <div className="space-y-4 pt-4">
                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (<>

                  {/* ═══ RECETA MÉDICA - HEADER (timbrado mantido) ═══ */}
                  <div id="prescription-print-area" className="border-2 border-teal-600 rounded-xl overflow-hidden">
                    {/* Doctor Header */}
                    <div className="bg-teal-600 text-white p-4 flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-7 h-7 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg truncate">{activeProfessional?.name || activeOperator}</p>
                        <p className="text-teal-100 text-xs">{t('presc_header_rne_crm', 'app')} {activeProfessional?.council || '—'} {activeProfessional?.councilNumber ? `— ${activeProfessional.councilNumber}` : '— —'}</p>
                        <p className="text-teal-100 text-xs">{t('presc_header_specialty', 'app')} {activeProfessional?.specialty || '— —'}</p>
                      </div>
                      <div className="text-right text-[10px] text-teal-100 flex-shrink-0">
                        <p>{t('presc_header_address', 'app')} {activeProfessional?.locationId ? `Sede ${activeProfessional.locationId.replace('loc_', '')}` : '— —'}</p>
                        <p>{t('presc_header_phone', 'app')} {activeProfessional?.phone || '— —'}</p>
                      </div>
                    </div>

                    {/* Patient + Date */}
                    <div className="bg-teal-50 px-4 py-2.5 border-t border-teal-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-bold text-teal-800">{t('presc_patient_name', 'app')} <span className="font-normal text-slate-700">{selectedPatient?.name}</span></span>
                          {selectedPatient?.birthdate && (
                            <span className="text-slate-500">{t('presc_patient_birthdate', 'app')} {new Date(selectedPatient.birthdate).toLocaleDateString(locale)}</span>
                          )}
                          {selectedPatient?.document_type && (
                            <span className="text-slate-500">{t('presc_patient_doc_type', 'app')}: {selectedPatient.document_type}</span>
                          )}
                          {selectedPatient?.document_number && (
                            <span className="text-slate-500">{t('presc_patient_doc_number', 'app')}: {selectedPatient.document_number}</span>
                          )}
                        </div>
                        <span className="text-slate-500">{new Date().toLocaleDateString(locale)}</span>
                      </div>
                      {(selectedPatient?.phone || selectedPatient?.email || selectedPatient?.address_city) && (
                        <div className="flex items-center gap-4 flex-wrap text-[10px] text-slate-500">
                          {selectedPatient?.phone && <span>{t('presc_send_phone_label', 'app')}: {selectedPatient.phone}</span>}
                          {selectedPatient?.email && <span>{t('presc_send_email_label', 'app')}: {selectedPatient.email}</span>}
                          {selectedPatient?.address_city && <span>{t('presc_header_city', 'app')}: {selectedPatient.address_city}{selectedPatient.address_neighborhood ? ` - ${selectedPatient.address_neighborhood}` : ''}</span>}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="text-center py-2 border-b border-teal-200">
                      <h3 className="font-bold text-teal-800 text-sm tracking-wider uppercase">{t('presc_title', 'app')}</h3>
                    </div>

                    {/* Alerta de receita controlada */}
                    {selectedItems.some(i => i.prescriptionType === 'controlado') && (
                      <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-[11px] text-rose-800 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{t('presc_controlled_alert', 'app')}</p>
                        </div>
                      </div>
                    )}

                    {/* Itens da receita (tabela) */}
                    <div className="p-4">
                      {!selectedPrescriptionId ? (
                        <p className="text-center text-slate-400 text-xs py-4">{t('presc_select_receipt', 'app')}</p>
                      ) : selectedItems.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-4">{t('presc_empty', 'app')}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <th className="py-1.5 pr-2">#</th>
                                <th className="py-1.5 pr-2">{t('presc_medication', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('presc_add_posology', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('presc_type', 'app')}</th>
                                {selectedHeader?.status !== 'assinado' && (
                                  <th className="py-1.5 pr-2">{t('presc_col_actions', 'app')}</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedItems.map((item, idx) => (
                                <tr key={item.id} className={editingItem?.id === item.id ? 'bg-teal-50' : ''}>
                                  <td className="py-2 pr-2 font-bold text-teal-600">{idx + 1}.</td>
                                  <td className="py-2 pr-2 align-top">
                                    <p className="font-bold text-slate-800">{item.drugName}</p>
                                    {item.activeIngredient && <p className="text-slate-500">{item.activeIngredient}</p>}
                                    {item.snomedCode && <p className="text-slate-400 text-[10px]">{t('hce_snomed_code', 'app')}: {item.snomedCode}{item.snomedDescription ? ` — ${item.snomedDescription}` : ''}</p>}
                                    {item.notes && <p className="text-slate-400 italic mt-0.5">{item.notes}</p>}
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    <p className="text-slate-600">{item.dosage} — {item.frequency} — {t(`presc_route_${item.route}`, 'app')}</p>
                                    <p className="text-slate-400">{t('presc_duration_label', 'app')} {item.duration} | {t('presc_quantity_label', 'app')} {item.quantity} {item.unit}</p>
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.prescriptionType === 'controlado' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {item.prescriptionType === 'controlado' ? t('presc_prescription_type_controlado', 'app') : t('presc_prescription_type_comum', 'app')}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    {selectedHeader?.status !== 'assinado' && (
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingItem(item); clearPrescErrors(); }} className="p-1 text-slate-500 hover:text-teal-600" title={t('hce_edit', 'app')}>
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDeletePrescriptionItem(item.id)} className="p-1 text-slate-500 hover:text-rose-600" title={t('hce_delete', 'app')}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                    {selectedHeader?.status === 'assinado' && (
                                      <span className="text-[10px] text-slate-400 italic">{t('presc_signed_locked', 'app')}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Alertas de segurança medicamentosa */}
                    {safetyAlerts.length > 0 && (
                      <div className="px-4 pb-2 space-y-1.5">
                        {safetyAlerts.map((alert, i) => (
                          <div key={`${alert.id}_${i}`} className={`p-2.5 rounded-lg border text-[10px] font-semibold flex items-start gap-2 ${
                            alert.severity === 'contraindicado' ? 'bg-rose-50 border-rose-300 text-rose-700' :
                            alert.severity === 'grave' ? 'bg-orange-50 border-orange-300 text-orange-700' :
                            'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p>
                                {alert.type === 'interaction'
                                  ? t('presc_alert_interaction', 'app').replace('{a}', alert.drugName).replace('{b}', alert.otherName)
                                  : t('presc_alert_allergy', 'app').replace('{a}', alert.drugName).replace('{b}', alert.otherName)}
                              </p>
                              {alert.recommendation && <p className="mt-0.5 text-[9px] opacity-80">{alert.recommendation}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* QR Code de verificação */}
                    {prescQrDataUrl && selectedHeader?.status === 'assinado' && (
                      <div className="px-4 pb-2 flex items-center gap-3">
                        <Image src={prescQrDataUrl} alt={t('presc_qr_alt', 'app')} width={96} height={96} className="rounded border border-slate-200" />
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <p className="font-bold text-slate-700">{t('presc_qr_title', 'app')}</p>
                          <p>{t('presc_qr_hint', 'app')}</p>
                          <a
                            href={buildPrescriptionVerifyUrl(selectedHeader?.qrCodeData || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-teal-600 hover:text-teal-700 font-semibold underline"
                          >
                            {t('presc_qr_verify', 'app')}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Ações da receita */}
                    {selectedPrescriptionId && selectedHeader && (
                      <div className="no-print px-4 pb-4 flex flex-wrap items-center gap-2">
                        {selectedHeader.status === 'rascunho' && (
                          <button onClick={() => handleSignPrescription(selectedPrescriptionId)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                            <FileSignature className="w-3.5 h-3.5" /> {t('presc_sign_receipt', 'app')}
                          </button>
                        )}
                        {selectedHeader.status === 'assinado' && (
                          <button onClick={() => setSendModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                            <Send className="w-3.5 h-3.5" /> {t('presc_send_whatsapp', 'app')}
                          </button>
                        )}
                        {selectedHeader.status === 'assinado' && (
                          <button onClick={handlePrintPrescription} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                            <Printer className="w-3.5 h-3.5" /> {t('presc_print', 'app')}
                          </button>
                        )}
                        <button onClick={() => handleDeletePrescription(selectedPrescriptionId)} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> {t('presc_delete_receipt', 'app')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ═══ MODAL: ENVIAR RECEITA ═══ */}
                  {sendModal && (
                    <div className="no-print fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl p-5 max-w-md w-full space-y-3">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Send className="w-3.5 h-3.5" /> {t('presc_send_title', 'app')}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-700 flex-1 min-w-0">
                              <span className="font-bold text-slate-800">{t('presc_header_patient', 'app')}: </span>
                              <span className="truncate">{selectedPatient?.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-700 flex-1 min-w-0">
                              <span className="font-bold text-slate-800">{t('presc_send_phone_label', 'app')}: </span>
                              <span>{selectedPatient?.phone || '—'}</span>
                            </div>
                            {sentChannels.whatsapp ? (
                              <button disabled className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 opacity-90 cursor-default">
                                <Send className="w-3 h-3" /> {t('presc_send_done', 'app')}
                              </button>
                            ) : (
                              <button onClick={() => handleSendPrescription('whatsapp')} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                                <Send className="w-3 h-3" /> {t('presc_send_whatsapp', 'app')}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-700 flex-1 min-w-0">
                              <span className="font-bold text-slate-800">{t('presc_send_email_label', 'app')}: </span>
                              <span className="truncate">{selectedPatient?.email || '—'}</span>
                            </div>
                            {sentChannels.email ? (
                              <button disabled className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 opacity-90 cursor-default">
                                <Send className="w-3 h-3" /> {t('presc_send_done', 'app')}
                              </button>
                            ) : (
                              <button onClick={() => handleSendPrescription('email')} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                                <Send className="w-3 h-3" /> {t('presc_send_email', 'app')}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] text-slate-400 italic">{t('presc_send_close_hint', 'app')}</span>
                          <button onClick={() => setSendModal(false)} className="px-3 py-1.5 text-slate-600 text-xs font-bold rounded-lg">{t('hce_cancel', 'app')}</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══ PAINEL LISTA + FORM (padrão lista à esquerda, form à direita) ═══ */}
                  <div className="flex gap-4">
                    <div className="w-52 shrink-0 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('hce_presc_history', 'app')}</p>
                      <button onClick={handleNewPrescription} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {t('presc_new_button', 'app')}
                      </button>
                      {prescriptions.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">{t('hce_no_presc_records', 'app')}</p>
                      )}
                      {prescriptions.map((p, idx) => {
                        const itemCount = allItems.filter(i => i.prescriptionId === p.id).length;
                        const active = selectedPrescriptionId === p.id;
                        return (
                          <button key={p.id} onClick={() => { setSelectedPrescriptionId(p.id); setPrescQrDataUrl(''); setEditingItem(null); clearPrescErrors(); }} className={`w-full text-left px-3 py-2 rounded-lg border transition ${active ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <span className={`block text-xs font-bold truncate ${active ? 'text-teal-700' : 'text-slate-700'}`}>
                              {t('presc_receipt_label', 'app')} #{prescChronoRank[p.id] ?? idx + 1}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate">
                              {itemCount > 0 ? t('presc_item_count', 'app').replace('{count}', String(itemCount)) : t('presc_no_items_label', 'app')}
                            </span>
                            <span className="block text-[10px] text-slate-400">{formatDateTime(p.createdAt)}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                p.status === 'assinado' ? 'bg-green-100 text-green-700' :
                                p.status === 'rascunho' ? 'bg-slate-100 text-slate-600' :
                                'bg-rose-100 text-rose-700'
                              }`}>{t(`hce_prescription_${p.status}`, 'app')}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                  {!selectedPrescriptionId ? (
                    <p className="text-xs text-slate-400 italic">{t('presc_select_to_add', 'app')}</p>
                  ) : editingItem ? (
                    <>
                      {prescErrors.length > 0 && <FormErrorSummary errors={prescErrors} onClose={clearPrescErrors} />}
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('presc_edit_title', 'app')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label={t('presc_medication', 'app')} required error={prescFieldErrors.drugName}>
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input type="text" value={editingItem.drugName} onChange={e => { const v = e.target.value; setEditingItem(prev => prev ? { ...prev, drugName: v } : null); setDrugSearch(v); searchDrugCatalog(v); }} placeholder={t('presc_placeholder_drug', 'app')} className={`${inputCls} pl-9`} />
                          </div>
                          <div className="max-h-[120px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 mt-2 bg-white">
                            {drugCatalogItems.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-slate-400 italic">{t('drug_search_no_results', 'app')}</p>
                            ) : drugCatalogItems.slice(0, 10).map((d: any) => (
                              <div key={d.id} onClick={() => setEditingItem(prev => prev ? { ...prev, drugName: d.name || prev.drugName, activeIngredient: d.active_ingredient || prev.activeIngredient, presentation: d.presentation || prev.presentation, dosage: d.default_dosage || d.common_dose_adult || prev.dosage, frequency: d.default_frequency || prev.frequency, route: d.route || prev.route, duration: d.default_duration || prev.duration, snomedCode: d.snomed_code || prev.snomedCode, snomedDescription: d.snomed_description || prev.snomedDescription } : null)}
                                className="px-3 py-2.5 hover:bg-teal-50 cursor-pointer flex items-center gap-2 text-sm transition">
                                <span className="font-bold text-teal-700 whitespace-nowrap text-xs">{d.name}</span>
                                <span className="text-slate-600 flex-1 min-w-0 truncate text-xs">{d.active_ingredient}{d.presentation ? ` — ${d.presentation}` : ''}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 font-bold uppercase ${
                                  d.source === 'dinavisa' ? 'bg-blue-100 text-blue-700' :
                                  d.source === 'anvisa' ? 'bg-green-100 text-green-700' :
                                  d.source === 'fda' ? 'bg-purple-100 text-purple-700' :
                                  d.source === 'infarmed' ? 'bg-orange-100 text-orange-100' :
                                  'bg-slate-100 text-slate-600'
                                }`}>{d.source?.toUpperCase() || ''}</span>
                              </div>
                            ))}
                          </div>
                        </FormField>
                        <FormField label={t('presc_active_ingredient', 'app')} error={prescFieldErrors.activeIngredient}>
                          <input type="text" value={editingItem.activeIngredient} onChange={e => setEditingItem(prev => prev ? { ...prev, activeIngredient: e.target.value } : null)} className={inputCls} />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label={t('hce_snomed_code', 'app')} error={prescFieldErrors.snomedCode}>
                          <SnomedSearchBox
                            semanticAxis="substance"
                            initialCode={editingItem.snomedCode ?? ''}
                            initialDescription={editingItem.snomedDescription ?? ''}
                            onPick={(item) => setEditingItem(prev => prev ? {
                              ...prev,
                              snomedCode: String(item.concept.concept_id),
                              snomedDescription: item.term || item.concept.preferred_term,
                            } : null)}
                          />
                        </FormField>
                        <FormField label={t('hce_snomed_description', 'app')} error={prescFieldErrors.snomedDescription}>
                          <input type="text" value={editingItem.snomedDescription ?? ''} onChange={e => setEditingItem(prev => prev ? { ...prev, snomedDescription: e.target.value } : null)} className={inputCls} />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <FormField label={t('hce_dosage', 'app')} required error={prescFieldErrors.dosage}>
                          <input type="text" value={editingItem.dosage} onChange={e => setEditingItem(prev => prev ? { ...prev, dosage: e.target.value } : null)} className={inputCls} placeholder="500mg" />
                        </FormField>
                        <FormField label={t('hce_frequency', 'app')} required error={prescFieldErrors.frequency}>
                          <input type="text" value={editingItem.frequency} onChange={e => setEditingItem(prev => prev ? { ...prev, frequency: e.target.value } : null)} className={inputCls} placeholder="8/8h" />
                        </FormField>
                        <FormField label={t('presc_route', 'app')} error={prescFieldErrors.route}>
                          <select value={editingItem.route} onChange={e => setEditingItem(prev => prev ? { ...prev, route: e.target.value } : null)} className={inputCls}>
                            <option value="oral">{t('presc_route_oral', 'app')}</option>
                            <option value="sublingual">{t('presc_route_sublingual', 'app')}</option>
                            <option value="venoso">{t('presc_route_venoso', 'app')}</option>
                            <option value="intramuscular">{t('presc_route_intramuscular', 'app')}</option>
                            <option value="topico">{t('presc_route_topico', 'app')}</option>
                            <option value="retal">{t('presc_route_retal', 'app')}</option>
                            <option value="inhalacion">{t('presc_route_inhalacion', 'app')}</option>
                            <option value="vaginal">{t('presc_route_vaginal', 'app')}</option>
                          </select>
                        </FormField>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <FormField label={t('hce_duration', 'app')} error={prescFieldErrors.duration}>
                          <input type="text" value={editingItem.duration} onChange={e => setEditingItem(prev => prev ? { ...prev, duration: e.target.value } : null)} className={inputCls} placeholder={t('presc_placeholder_duration', 'app')} />
                        </FormField>
                        <FormField label={t('presc_quantity', 'app')} error={prescFieldErrors.quantity}>
                          <input type="text" inputMode="numeric" value={editingItem.quantity} onChange={e => setEditingItem(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 1 } : null)} className={inputCls} />
                        </FormField>
                        <FormField label={t('presc_unit', 'app')} error={prescFieldErrors.unit}>
                          <input type="text" value={editingItem.unit} onChange={e => setEditingItem(prev => prev ? { ...prev, unit: e.target.value } : null)} className={inputCls} />
                        </FormField>
                        <FormField label={t('presc_type', 'app')} error={prescFieldErrors.prescriptionType}>
                          <select value={editingItem.prescriptionType} onChange={e => setEditingItem(prev => prev ? { ...prev, prescriptionType: e.target.value as any } : null)} className={inputCls}>
                            <option value="">{t('hce_select_option', 'app')}</option>
                            <option value="comum">{t('hce_prescription_comum', 'app')}</option>
                            <option value="controlado">{t('hce_prescription_controlado', 'app')}</option>
                            <option value="arquivado">{t('hce_prescription_arquivado', 'app')}</option>
                          </select>
                        </FormField>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPediatricDoseModal({ weight: '', height: '', dosePerKgPerDay: '', dosesPerDay: '', result: '' })} className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg border border-teal-200 transition flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" /> {t('presc_pediatric_dose_btn', 'app')}
                        </button>
                      </div>
                      <FormField label={t('presc_instructions', 'app')} error={prescFieldErrors.notes}>
                        <input type="text" value={editingItem.notes} onChange={e => setEditingItem(prev => prev ? { ...prev, notes: e.target.value } : null)} className={inputCls} placeholder={t('hce_prescription_notes_placeholder', 'app')} />
                      </FormField>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingItem(null); clearPrescErrors(); }} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg">{t('hce_cancel', 'app')}</button>
                        <button onClick={() => editingItem && handleUpdatePrescriptionItem(editingItem)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg">{t('presc_save', 'app')}</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {prescErrors.length > 0 && <FormErrorSummary errors={prescErrors} onClose={clearPrescErrors} />}
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('presc_add_title', 'app')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label={t('presc_add_name', 'app')} required error={prescFieldErrors.drugName}>
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input type="text" value={prescriptionForm.drugName} onChange={e => { const v = e.target.value; setPrescriptionForm(p => ({ ...p, drugName: v })); setDrugSearch(v); searchDrugCatalog(v); }} placeholder={t('presc_placeholder_drug', 'app')} className={`${inputCls} pl-9`} />
                          </div>
                          <div className="max-h-[120px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 mt-2 bg-white">
                            {drugCatalogItems.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-slate-400 italic">{t('drug_search_no_results', 'app')}</p>
                            ) : drugCatalogItems.slice(0, 10).map((d: any) => (
                              <div key={d.id} onClick={() => setPrescriptionForm(p => ({ ...p, drugName: d.name || p.drugName, activeIngredient: d.active_ingredient || p.activeIngredient, presentation: d.presentation || p.presentation, dosage: d.default_dosage || d.common_dose_adult || p.dosage, frequency: d.default_frequency || p.frequency, route: d.route || p.route, duration: d.default_duration || p.duration, snomedCode: d.snomed_code || p.snomedCode, snomedDescription: d.snomed_description || p.snomedDescription }))}
                                className="px-3 py-2.5 hover:bg-teal-50 cursor-pointer flex items-center gap-2 text-sm transition">
                                <span className="font-bold text-teal-700 whitespace-nowrap text-xs">{d.name}</span>
                                <span className="text-slate-600 flex-1 min-w-0 truncate text-xs">{d.active_ingredient}{d.presentation ? ` — ${d.presentation}` : ''}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 font-bold uppercase ${
                                  d.source === 'dinavisa' ? 'bg-blue-100 text-blue-700' :
                                  d.source === 'anvisa' ? 'bg-green-100 text-green-700' :
                                  d.source === 'fda' ? 'bg-purple-100 text-purple-700' :
                                  d.source === 'infarmed' ? 'bg-orange-100 text-orange-100' :
                                  'bg-slate-100 text-slate-600'
                                }`}>{d.source?.toUpperCase() || ''}</span>
                              </div>
                            ))}
                          </div>
                        </FormField>
                        <FormField label={t('presc_active_ingredient', 'app')} error={prescFieldErrors.activeIngredient}>
                          <input type="text" value={prescriptionForm.activeIngredient} onChange={e => setPrescriptionForm(p => ({ ...p, activeIngredient: e.target.value }))} className={inputCls} placeholder={t('presc_placeholder_ingredient', 'app')} />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label={t('hce_snomed_code', 'app')} error={prescFieldErrors.snomedCode}>
                          <SnomedSearchBox
                            semanticAxis="substance"
                            initialCode={prescriptionForm.snomedCode}
                            initialDescription={prescriptionForm.snomedDescription}
                            onPick={(item) => setPrescriptionForm(p => ({
                              ...p,
                              snomedCode: String(item.concept.concept_id),
                              snomedDescription: item.term || item.concept.preferred_term,
                              ...(item.concept.inn && !p.activeIngredient ? { activeIngredient: item.concept.inn } : {}),
                              ...(!p.drugName ? { drugName: item.term || item.concept.preferred_term } : {}),
                            }))}
                          />
                        </FormField>
                        <FormField label={t('hce_snomed_description', 'app')} error={prescFieldErrors.snomedDescription}>
                          <input type="text" value={prescriptionForm.snomedDescription} onChange={e => setPrescriptionForm(p => ({ ...p, snomedDescription: e.target.value }))} className={inputCls} />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className={labelCls}>{t('presc_add_presentation', 'app')}</label>
                          <select value={prescriptionForm.presentation} onChange={e => setPrescriptionForm(p => ({ ...p, presentation: e.target.value }))} className={inputCls}>
                            <option value="">{t('presc_presentation_select', 'app')}</option>
                            <option value="Comprimido">{t('presc_presentation_comprimido', 'app')}</option>
                            <option value="Cápsula">{t('presc_presentation_capsula', 'app')}</option>
                            <option value="Jarabe">{t('presc_presentation_jarabe', 'app')}</option>
                            <option value="Suspensión">{t('presc_presentation_suspension', 'app')}</option>
                            <option value="Solución Inyectable">{t('presc_presentation_inyectable', 'app')}</option>
                            <option value="Gotas">{t('presc_presentation_gotas', 'app')}</option>
                            <option value="Pomada">{t('presc_presentation_pomada', 'app')}</option>
                            <option value="Crema">{t('presc_presentation_crema', 'app')}</option>
                            <option value="Óvulo">{t('presc_presentation_ovulo', 'app')}</option>
                            <option value="Supositorio">{t('presc_presentation_supositorio', 'app')}</option>
                            <option value="Inhalador">{t('presc_presentation_inhalador', 'app')}</option>
                            <option value="Parche">{t('presc_presentation_parche', 'app')}</option>
                            <option value="Otro">{t('presc_presentation_otro', 'app')}</option>
                          </select>
                        </div>
                        <FormField label={t('presc_add_dosage', 'app')} required error={prescFieldErrors.dosage}>
                          <input type="text" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm(p => ({ ...p, dosage: e.target.value }))} className={inputCls} placeholder={t('presc_placeholder_dosage', 'app')} />
                        </FormField>
                        <FormField label={t('presc_add_frequency', 'app')} required error={prescFieldErrors.frequency}>
                          <input type="text" value={prescriptionForm.frequency} onChange={e => setPrescriptionForm(p => ({ ...p, frequency: e.target.value }))} className={inputCls} placeholder={t('presc_placeholder_frequency', 'app')} />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <FormField label={t('presc_route', 'app')} error={prescFieldErrors.route}>
                          <select value={prescriptionForm.route} onChange={e => setPrescriptionForm(p => ({ ...p, route: e.target.value }))} className={inputCls}>
                            <option value="oral">{t('presc_route_oral', 'app')}</option>
                            <option value="sublingual">{t('presc_route_sublingual', 'app')}</option>
                            <option value="venoso">{t('presc_route_venoso', 'app')}</option>
                            <option value="intramuscular">{t('presc_route_intramuscular', 'app')}</option>
                            <option value="topico">{t('presc_route_topico', 'app')}</option>
                            <option value="retal">{t('presc_route_retal', 'app')}</option>
                            <option value="inhalacion">{t('presc_route_inhalacion', 'app')}</option>
                            <option value="vaginal">{t('presc_route_vaginal', 'app')}</option>
                          </select>
                        </FormField>
                        <FormField label={t('presc_add_duration', 'app')} error={prescFieldErrors.duration}>
                          <input type="text" value={prescriptionForm.duration} onChange={e => setPrescriptionForm(p => ({ ...p, duration: e.target.value }))} className={inputCls} placeholder={t('presc_placeholder_duration', 'app')} />
                        </FormField>
                        <FormField label={t('presc_quantity', 'app')} error={prescFieldErrors.quantity}>
                          <input type="text" inputMode="numeric" value={prescriptionForm.quantity} onChange={e => setPrescriptionForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className={inputCls} />
                        </FormField>
                        <FormField label={t('presc_unit', 'app')} error={prescFieldErrors.unit}>
                          <input type="text" value={prescriptionForm.unit} onChange={e => setPrescriptionForm(p => ({ ...p, unit: e.target.value }))} className={inputCls} placeholder={t('presc_placeholder_unit', 'app')} />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label={t('presc_add_type', 'app')} error={prescFieldErrors.prescriptionType}>
                          <select value={prescriptionForm.prescriptionType} onChange={e => setPrescriptionForm(p => ({ ...p, prescriptionType: e.target.value as any }))} className={inputCls}>
                            <option value="">{t('hce_select_option', 'app')}</option>
                            <option value="comum">{t('hce_prescription_comum', 'app')}</option>
                            <option value="controlado">{t('hce_prescription_controlado', 'app')}</option>
                            <option value="arquivado">{t('hce_prescription_arquivado', 'app')}</option>
                          </select>
                        </FormField>
                        <FormField label={t('presc_add_instructions', 'app')} error={prescFieldErrors.notes}>
                          <input type="text" value={prescriptionForm.notes} onChange={e => setPrescriptionForm(p => ({ ...p, notes: e.target.value }))} className={inputCls} placeholder={t('presc_placeholder_notes', 'app')} />
                        </FormField>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPediatricDoseModal({ weight: '', height: '', dosePerKgPerDay: '', dosesPerDay: '', result: '' })} className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg border border-teal-200 transition flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" /> {t('presc_pediatric_dose_btn', 'app')}
                        </button>
                      </div>
                      <button onClick={handleSavePrescriptionItem} disabled={!prescriptionForm.drugName.trim()} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> {t('presc_add_button', 'app')}
                      </button>
</>
                  )}
                    </div>
                  </div>
                  </>)}
                </div>
              )}

              {/* ═══ TAB: EXAM REQUESTS ═══ */}
              {hceTab === 'exams' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Scan className="w-4 h-4 text-teal-600" /> {t('hce_exam_request_title', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (<>
                  {/* ═══ SOLICITAÇÃO DE EXAMES - DOCUMENTO TIMBRADO (igual receituário) ═══ */}
                  <div id="exam-request-print-area" className="border-2 border-teal-600 rounded-xl overflow-hidden">
                    <div className="bg-teal-600 text-white p-4 flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <Scan className="w-7 h-7 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg truncate">{activeProfessional?.name || activeOperator}</p>
                        <p className="text-teal-100 text-xs">{t('presc_header_rne_crm', 'app')} {activeProfessional?.council || '—'} {activeProfessional?.councilNumber ? `— ${activeProfessional.councilNumber}` : '— —'}</p>
                        <p className="text-teal-100 text-xs">{t('presc_header_specialty', 'app')} {activeProfessional?.specialty || '— —'}</p>
                      </div>
                      <div className="text-right text-[10px] text-teal-100 flex-shrink-0">
                        <p>{t('presc_header_address', 'app')} {activeProfessional?.locationId ? `Sede ${activeProfessional.locationId.replace('loc_', '')}` : '— —'}</p>
                        <p>{t('presc_header_phone', 'app')} {activeProfessional?.phone || '— —'}</p>
                      </div>
                    </div>

                    <div className="bg-teal-50 px-4 py-2.5 border-t border-teal-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-bold text-teal-800">{t('presc_patient_name', 'app')} <span className="font-normal text-slate-700">{selectedPatient?.name}</span></span>
                          {selectedPatient?.birthdate && (
                            <span className="text-slate-500">{t('presc_patient_birthdate', 'app')} {new Date(selectedPatient.birthdate).toLocaleDateString(locale)}</span>
                          )}
                          {selectedPatient?.document_type && (
                            <span className="text-slate-500">{t('presc_patient_doc_type', 'app')}: {selectedPatient.document_type}</span>
                          )}
                          {selectedPatient?.document_number && (
                            <span className="text-slate-500">{t('presc_patient_doc_number', 'app')}: {selectedPatient.document_number}</span>
                          )}
                        </div>
                        <span className="text-slate-500">{new Date().toLocaleDateString(locale)}</span>
                      </div>
                      {(selectedPatient?.phone || selectedPatient?.email || selectedPatient?.address_city) && (
                        <div className="flex items-center gap-4 flex-wrap text-[10px] text-slate-500">
                          {selectedPatient?.phone && <span>{t('presc_send_phone_label', 'app')}: {selectedPatient.phone}</span>}
                          {selectedPatient?.email && <span>{t('presc_send_email_label', 'app')}: {selectedPatient.email}</span>}
                          {selectedPatient?.address_city && <span>{t('presc_header_city', 'app')}: {selectedPatient.address_city}{selectedPatient.address_neighborhood ? ` - ${selectedPatient.address_neighborhood}` : ''}</span>}
                        </div>
                      )}
                    </div>

                    <div className="text-center py-2 border-b border-teal-200">
                      <h3 className="font-bold text-teal-800 text-sm tracking-wider uppercase">{t('hce_exam_request_title', 'app')}</h3>
                    </div>

                    <div className="p-4">
                      {activeGroupExams.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-4">{examRequests.length === 0 ? t('hce_no_exam_records', 'app') : t('hce_exam_select_group', 'app')}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <th className="py-1.5 pr-2">#</th>
                                <th className="py-1.5 pr-2">{t('hce_exam_name', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('hce_exam_type', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('hce_clinical_indication', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('hce_urgency', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('hce_diagnosis_status', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('presc_col_actions', 'app')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeGroupExams.map((e, idx) => (
                                <tr key={e.id}>
                                  <td className="py-2 pr-2 font-bold text-teal-600">{idx + 1}.</td>
                                  <td className="py-2 pr-2 align-top">
                                    <p className="font-bold text-slate-800">{e.examName}</p>
                                    {e.signedAt && <p className="text-[10px] text-green-600 font-semibold">{t('hce_exam_signed', 'app')} — {t('hce_exam_signed_by', 'app')} {e.signedBy || '—'} · {formatDate(e.signedAt)}</p>}
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                      {e.examType === 'laboratorio' ? t('hce_exam_laboratorio', 'app') : e.examType === 'imagem' ? t('hce_exam_imagem', 'app') : e.examType === 'anatomia_patologica' ? t('hce_exam_anatomia', 'app') : t('hce_exam_outro', 'app')}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-2 align-top text-slate-500">{e.clinicalIndication || '—'}</td>
                                  <td className="py-2 pr-2 align-top">
                                    <span className="text-slate-600">{e.urgency === 'rotina' ? t('hce_urgency_rotina', 'app') : e.urgency === 'urgente' ? t('hce_urgency_urgente', 'app') : t('hce_urgency_emergencia', 'app')}</span>
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${e.status === 'concluido' ? 'bg-green-100 text-green-700' : e.status === 'cancelado' ? 'bg-rose-100 text-rose-700' : e.status === 'em_execucao' ? 'bg-blue-100 text-blue-700' : e.status === 'laudo_pendente' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{translateStatus(e.status)}</span>
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    {activeExamGroupId === 'open' ? (
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingExamRequest(e); clearExamErrors(); }} className="p-1 text-slate-500 hover:text-teal-600" title={t('hce_edit', 'app')}>
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => { if (window.confirm(t('hce_exam_confirm_delete', 'app'))) handleDeleteExamRequest(e.id); }} className="p-1 text-slate-500 hover:text-rose-600" title={t('hce_delete', 'app')}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <button onClick={() => { setEditingExamRequest(e); clearExamErrors(); }} className="p-1 text-slate-500 hover:text-teal-600" title={t('hce_edit', 'app')}>
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-[10px] text-slate-400 italic">{t('hce_exam_signed_locked', 'app')}</span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {activeExamGroupId !== 'open' && activeGroupExams.length > 0 && (
                      <div className="px-4 pb-2 flex items-center gap-3">
                        {examQrDataUrl ? (
                          <Image src={examQrDataUrl} alt={t('hce_exam_qr_alt', 'app')} width={96} height={96} className="rounded border border-slate-200" />
                        ) : (
                          <div className="w-24 h-24 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                            <QrCode className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <p className="font-bold text-slate-700">{t('hce_exam_qr_title', 'app')}</p>
                          <p>{t('hce_exam_qr_hint', 'app')}</p>
                          {examQrPayload && (
                            <a
                              href={buildExamVerifyUrl(examQrPayload)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-teal-600 hover:text-teal-700 font-semibold underline"
                            >
                              {t('hce_exam_qr_verify', 'app')}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="no-print px-4 pb-4 flex flex-wrap items-center gap-2">
                      {activeExamGroupId === 'open' && unsignedExams.length > 0 && (
                        <button onClick={handleSignExamRequests} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                          <FileSignature className="w-3.5 h-3.5" /> {t('hce_exam_sign_all', 'app')} ({unsignedExams.length})
                        </button>
                      )}
                      {activeExamGroupId === 'open' && openGroupExams.length > 0 && unsignedExams.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">{t('hce_exam_no_pending_sign', 'app')}</span>
                      )}
                      {activeGroupExams.length > 0 && (
                        <button onClick={handlePrintExams} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5" /> {t('hce_exam_print', 'app')}
                        </button>
                      )}
                      {activeGroupExams.length > 0 && (
                        <button onClick={() => handleDeleteExamGroup(activeExamGroupId)} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> {t('hce_exam_delete_group', 'app')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-52 shrink-0 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('hce_exam_history', 'app')}</p>
                      <button onClick={() => { setExamGroupSelection('open'); setEditingExamRequest(null); clearExamErrors(); }} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {t('hce_exam_new_group', 'app')}
                      </button>
                      {examRequests.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">{t('hce_no_exam_records', 'app')}</p>
                      )}
                      {openGroupExams.length > 0 && (
                        <button onClick={() => { setExamGroupSelection('open'); setEditingExamRequest(null); clearExamErrors(); }} className={`w-full text-left px-3 py-2 rounded-lg border transition ${activeExamGroupId === 'open' ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                          <span className={`block text-xs font-bold truncate ${activeExamGroupId === 'open' ? 'text-teal-700' : 'text-slate-700'}`}>
                            {t('hce_exam_open_label', 'app')}
                          </span>
                          <span className="block text-[10px] text-slate-500">{t('hce_exam_open_count', 'app').replace('{count}', String(openGroupExams.length))}</span>
                          <span className="block text-[10px] text-slate-400">{formatDateTime(openGroupExams[0].createdAt)}</span>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{t('hce_exam_status_open', 'app')}</span>
                        </button>
                      )}
                      {examSignedGroups.map(g => {
                        const active = activeExamGroupId === g.signatureId;
                        return (
                          <button key={g.signatureId} onClick={() => { setExamGroupSelection(g.signatureId); setEditingExamRequest(null); clearExamErrors(); }} className={`w-full text-left px-3 py-2 rounded-lg border transition ${active ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <span className={`block text-xs font-bold truncate ${active ? 'text-teal-700' : 'text-slate-700'}`}>
                              {t('hce_exam_group_signed', 'app').replace('{count}', String(g.exams.length))}
                            </span>
                            <span className="block text-[10px] text-slate-400">{formatDateTime(g.signedAt)}</span>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">{t('hce_exam_signed', 'app')}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                  {editingExamRequest ? (
                    <>
                      {examErrors.length > 0 && <FormErrorSummary errors={examErrors} onClose={clearExamErrors} />}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelCls}>{t('hce_exam_type', 'app')}</label>
                          {editingExamRequest.signedAt ? (
                            <input type="text" value={editingExamRequest.examType} className={inputCls} readOnly />
                          ) : (
                            <select value={editingExamRequest.examType} onChange={ev => setEditingExamRequest(prev => prev ? { ...prev, examType: ev.target.value as any, examCatalogId: ev.target.value !== prev.examType ? '' : prev.examCatalogId } : null)} className={inputCls}>
                              <option value="laboratorio">{t('hce_exam_laboratorio', 'app')}</option>
                              <option value="imagem">{t('hce_exam_imagem', 'app')}</option>
                              <option value="anatomia_patologica">{t('hce_exam_anatomia', 'app')}</option>
                              <option value="outro">{t('hce_exam_outro', 'app')}</option>
                            </select>
                          )}
                        </div>
                        <div>
                          <label className={labelCls}>{t('hce_exam_name', 'app')}</label>
                          {editingExamRequest.signedAt ? (
                            <input type="text" value={editingExamRequest.examName} className={inputCls} readOnly />
                          ) : (
                            <input type="text" value={editingExamRequest.examName} list="exam-catalog-options-edit" onChange={ev => {
                              const v = ev.target.value;
                              const match = examCatalog.find(c => c.name === v && c.examType === editingExamRequest.examType);
                              setEditingExamRequest(prev => prev ? { ...prev, examName: v, examCatalogId: match ? match.id : prev.examCatalogId } : null);
                            }} className={inputCls} placeholder={t('hce_exam_name_placeholder', 'app')} />
                          )}
                          {!editingExamRequest.signedAt && (
                            <datalist id="exam-catalog-options-edit">
                              {examCatalog.filter(c => c.examType === editingExamRequest.examType).map(c => (
                                <option key={c.id} value={c.name}>{c.category}</option>
                              ))}
                            </datalist>
                          )}
                        </div>
                      </div>
                      {editingExamRequest.signedAt && (
                        <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-semibold">
                          <Check className="w-3.5 h-3.5" /> {t('hce_exam_signed', 'app')} — {t('hce_exam_signed_by', 'app')} {editingExamRequest.signedBy || '—'} · {formatDate(editingExamRequest.signedAt)}
                        </div>
                      )}
                      <div className="border border-teal-200 rounded-xl p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className={labelCls}>{t('hce_diagnosis_status', 'app')}</label>
                            <select value={editingExamRequest.status} onChange={ev => setEditingExamRequest(prev => prev ? { ...prev, status: ev.target.value as any } : null)} className={inputCls}>
                              <option value="solicitado">{t('hce_status_solicitado', 'app')}</option>
                              <option value="em_execucao">{t('hce_status_em_execucao', 'app')}</option>
                              <option value="laudo_pendente">{t('hce_status_laudo_pendente', 'app')}</option>
                              <option value="concluido">{t('hce_status_concluido', 'app')}</option>
                              <option value="cancelado">{t('hce_status_cancelado', 'app')}</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>{t('hce_result_observations', 'app')}</label>
                            <textarea value={editingExamRequest.resultNotes ?? ''} onChange={ev => setEditingExamRequest(prev => prev ? { ...prev, resultNotes: ev.target.value } : null)} rows={3} className={textareaCls} placeholder={t('hce_describe_exam_results_placeholder', 'app')} />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        {!editingExamRequest.signedAt && (
                          <button onClick={() => { if (window.confirm(t('hce_exam_confirm_delete', 'app'))) { handleDeleteExamRequest(editingExamRequest.id); setEditingExamRequest(null); } }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg">{t('hce_delete', 'app')}</button>
                        )}
                        <button onClick={() => { setEditingExamRequest(null); clearExamErrors(); }} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg">{t('hce_cancel', 'app')}</button>
                        <button onClick={() => { if (!editingExamRequest) return; handleUpdateExamRequest({ ...editingExamRequest, resultDate: editingExamRequest.status === 'concluido' ? new Date().toISOString() : editingExamRequest.resultDate }); setEditingExamRequest(null); }} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg">{t('app_save', 'app')}</button>
                      </div>
                    </>
                  ) : activeExamGroupId === 'open' ? (
                    <>
                      {examErrors.length > 0 && <FormErrorSummary errors={examErrors} onClose={clearExamErrors} />}
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('hce_exam_new', 'app')}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label={t('hce_exam_type', 'app')} error={examFieldErrors.examType}>
                          <select value={examRequestForm.examType} onChange={e => setExamRequestForm(p => ({ ...p, examType: e.target.value as any, examCatalogId: '', examName: '' }))} className={inputCls}>
                            <option value="">{t('hce_select_option', 'app')}</option>
                            <option value="laboratorio">{t('hce_exam_laboratorio', 'app')}</option>
                            <option value="imagem">{t('hce_exam_imagem', 'app')}</option>
                            <option value="anatomia_patologica">{t('hce_exam_anatomia', 'app')}</option>
                            <option value="outro">{t('hce_exam_outro', 'app')}</option>
                          </select>
                        </FormField>
<FormField label={t('hce_exam_name', 'app')} error={examFieldErrors.examName}>
  <input type="text" value={examRequestForm.examName} list="exam-catalog-options"
    onChange={e => {
      const v = e.target.value;
      const match = examCatalog.find(c => c.name === v && c.examType === examRequestForm.examType);
      setExamRequestForm(p => ({
        ...p,
        examName: v,
        examCatalogId: match ? match.id : '',
        examType: match ? match.examType as any : p.examType,
      }));
    }}
    className={inputCls} placeholder={t('hce_exam_name_placeholder', 'app')} />
  <datalist id="exam-catalog-options">
    {examCatalog.filter(c => c.examType === examRequestForm.examType).map(c => (
      <option key={c.id} value={c.name}>{c.category}</option>
    ))}
  </datalist>
  {examRequestForm.examCatalogId && (
    <p className="text-[10px] text-teal-600">{t('hce_exam_catalog_hint', 'app')}</p>
  )}
</FormField>
                        <FormField label={t('hce_clinical_indication', 'app')} className="col-span-2" error={examFieldErrors.clinicalIndication}>
                          <textarea value={examRequestForm.clinicalIndication} onChange={e => setExamRequestForm(p => ({ ...p, clinicalIndication: e.target.value }))} rows={2} className={textareaCls} placeholder={t('hce_clinical_indication_placeholder', 'app')} />
                        </FormField>
                        <FormField label={t('hce_urgency', 'app')} error={examFieldErrors.urgency}>
                          <select value={examRequestForm.urgency} onChange={e => setExamRequestForm(p => ({ ...p, urgency: e.target.value as any }))} className={inputCls}>
                            <option value="">{t('hce_select_option', 'app')}</option>
                            <option value="rotina">{t('hce_urgency_rotina', 'app')}</option>
                            <option value="urgente">{t('hce_urgency_urgente', 'app')}</option>
                            <option value="emergencia">{t('hce_urgency_emergencia', 'app')}</option>
                          </select>
                        </FormField>
                        <div className="flex items-end">
                          <button onClick={handleSaveExamRequest} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                            {t('hce_request_exam', 'app')}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : activeExamGroupId ? (
                    <p className="text-xs text-slate-400 italic">{t('hce_exam_signed_locked', 'app')}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">{t('hce_exam_select_to_add', 'app')}</p>
                  )}
                    </div>
                  </div>
                  </>)}
                </div>
              )}

              {/* ═══ TAB: PROCEDURES ═══ */}
              {hceTab === 'procedures' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" /> {t('hce_procedure_title', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (<>
                  {/* ═══ SOLICITAÇÃO DE PROCEDIMENTOS - DOCUMENTO TIMBRADO (igual solicitação de exames) ═══ */}
                  <div id="procedure-request-print-area" className="border-2 border-teal-600 rounded-xl overflow-hidden">
                    <div className="bg-teal-600 text-white p-4 flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-7 h-7 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg truncate">{activeProfessional?.name || activeOperator}</p>
                        <p className="text-teal-100 text-xs">{t('presc_header_rne_crm', 'app')} {activeProfessional?.council || '—'} {activeProfessional?.councilNumber ? `— ${activeProfessional.councilNumber}` : '— —'}</p>
                        <p className="text-teal-100 text-xs">{t('presc_header_specialty', 'app')} {activeProfessional?.specialty || '— —'}</p>
                      </div>
                      <div className="text-right text-[10px] text-teal-100 flex-shrink-0">
                        <p>{t('presc_header_address', 'app')} {activeProfessional?.locationId ? `Sede ${activeProfessional.locationId.replace('loc_', '')}` : '— —'}</p>
                        <p>{t('presc_header_phone', 'app')} {activeProfessional?.phone || '— —'}</p>
                      </div>
                    </div>

                    <div className="bg-teal-50 px-4 py-2.5 border-t border-teal-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-bold text-teal-800">{t('presc_patient_name', 'app')} <span className="font-normal text-slate-700">{selectedPatient?.name}</span></span>
                          {selectedPatient?.birthdate && (
                            <span className="text-slate-500">{t('presc_patient_birthdate', 'app')} {new Date(selectedPatient.birthdate).toLocaleDateString(locale)}</span>
                          )}
                          {selectedPatient?.document_type && (
                            <span className="text-slate-500">{t('presc_patient_doc_type', 'app')}: {selectedPatient.document_type}</span>
                          )}
                          {selectedPatient?.document_number && (
                            <span className="text-slate-500">{t('presc_patient_doc_number', 'app')}: {selectedPatient.document_number}</span>
                          )}
                        </div>
                        <span className="text-slate-500">{new Date().toLocaleDateString(locale)}</span>
                      </div>
                      {(selectedPatient?.phone || selectedPatient?.email || selectedPatient?.address_city) && (
                        <div className="flex items-center gap-4 flex-wrap text-[10px] text-slate-500">
                          {selectedPatient?.phone && <span>{t('presc_send_phone_label', 'app')}: {selectedPatient.phone}</span>}
                          {selectedPatient?.email && <span>{t('presc_send_email_label', 'app')}: {selectedPatient.email}</span>}
                          {selectedPatient?.address_city && <span>{t('presc_header_city', 'app')}: {selectedPatient.address_city}{selectedPatient.address_neighborhood ? ` - ${selectedPatient.address_neighborhood}` : ''}</span>}
                        </div>
                      )}
                    </div>

                    <div className="text-center py-2 border-b border-teal-200">
                      <h3 className="font-bold text-teal-800 text-sm tracking-wider uppercase">{t('hce_proc_request_title', 'app')}</h3>
                    </div>

                    <div className="p-4">
                      {activeGroupProcedures.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-4">{procedureList.length === 0 ? t('hce_no_procedure_records', 'app') : t('hce_proc_select_group', 'app')}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <th className="py-1.5 pr-2">#</th>
                                <th className="py-1.5 pr-2">{t('hce_procedure_code', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('hce_procedure_name', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('hce_procedure_category', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('hce_procedure_quantity', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('hce_procedure_status', 'app')}</th>
                                <th className="py-1.5 pr-2">{t('presc_col_actions', 'app')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeGroupProcedures.map((p, idx) => (
                                <tr key={p.id}>
                                  <td className="py-2 pr-2 font-bold text-teal-600">{idx + 1}.</td>
                                  <td className="py-2 pr-2 align-top">
                                    <span className="font-mono text-[10px] font-bold text-teal-700">{p.procedureCode}</span>
                                    {p.signedAt && <p className="text-[10px] text-green-600 font-semibold">{t('hce_proc_signed', 'app')} — {t('hce_proc_signed_by', 'app')} {p.signedBy || '—'} · {formatDate(p.signedAt)}</p>}
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    <p className="font-bold text-slate-800">{p.procedureName}</p>
                                    {(p.nomenclature || p.financingEntity) && (
                                      <p className="text-[10px] text-slate-400">
                                        {p.nomenclature && <span className="font-bold uppercase text-indigo-500">{p.nomenclature === 'sigtap' ? t('hce_procedure_nomenclature_sigtap', 'app') : t('hce_procedure_nomenclature_cbhpm', 'app')}</span>}
                                        {p.financingEntity && <span> · {p.financingEntity}</span>}
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{translateProcCategory(p.procedureCategory)}</span>
                                  </td>
                                  <td className="py-2 pr-2 align-top text-slate-600">×{p.quantity}</td>
                                  <td className="py-2 pr-2 align-top">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.status === 'concluido' ? 'bg-green-100 text-green-700' : p.status === 'cancelado' ? 'bg-rose-100 text-rose-700' : p.status === 'em_execucao' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{translateProcStatus(p.status)}</span>
                                  </td>
                                  <td className="py-2 pr-2 align-top">
                                    {activeProcGroupId === 'open' ? (
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingProcedure(p); clearProcErrors(); }} className="p-1 text-slate-500 hover:text-teal-600" title={t('hce_edit', 'app')}>
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => { if (window.confirm(t('hce_proc_confirm_delete', 'app'))) handleDeleteProcedure(p.id); }} className="p-1 text-slate-500 hover:text-rose-600" title={t('hce_delete', 'app')}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <button onClick={() => { setEditingProcedure(p); clearProcErrors(); }} className="p-1 text-slate-500 hover:text-teal-600" title={t('hce_edit', 'app')}>
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-[10px] text-slate-400 italic">{t('hce_proc_signed_locked', 'app')}</span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {activeProcGroupId !== 'open' && activeGroupProcedures.length > 0 && (
                      <div className="px-4 pb-2 flex items-center gap-3">
                        {procQrDataUrl ? (
                          <Image src={procQrDataUrl} alt={t('hce_proc_qr_alt', 'app')} width={96} height={96} className="rounded border border-slate-200" />
                        ) : (
                          <div className="w-24 h-24 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                            <QrCode className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <p className="font-bold text-slate-700">{t('hce_proc_qr_title', 'app')}</p>
                          <p>{t('hce_proc_qr_hint', 'app')}</p>
                          {procQrPayload && (
                            <a
                              href={buildProcedureVerifyUrl(procQrPayload)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-teal-600 hover:text-teal-700 font-semibold underline"
                            >
                              {t('hce_proc_qr_verify', 'app')}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="no-print px-4 pb-4 flex flex-wrap items-center gap-2">
                      {activeProcGroupId === 'open' && unsignedProcedures.length > 0 && (
                        <button onClick={handleSignProcedures} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                          <FileSignature className="w-3.5 h-3.5" /> {t('hce_proc_sign_all', 'app')} ({unsignedProcedures.length})
                        </button>
                      )}
                      {activeProcGroupId === 'open' && openGroupProcedures.length > 0 && unsignedProcedures.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">{t('hce_proc_no_pending_sign', 'app')}</span>
                      )}
                      {activeGroupProcedures.length > 0 && (
                        <button onClick={handlePrintProcedures} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5" /> {t('hce_proc_print', 'app')}
                        </button>
                      )}
                      {activeGroupProcedures.length > 0 && (
                        <button onClick={() => handleDeleteProcedureGroup(activeProcGroupId)} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> {t('hce_proc_delete_group', 'app')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-52 shrink-0 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('hce_procedure_history', 'app')}</p>
                      <button onClick={handleNewProcGroup} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {t('hce_proc_new_group', 'app')}
                      </button>
                      {procedureList.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">{t('hce_no_procedure_records', 'app')}</p>
                      )}
                      {openGroupProcedures.length > 0 && (
                        <button onClick={() => { setProcGroupSelection('open'); setEditingProcedure(null); clearProcErrors(); }} className={`w-full text-left px-3 py-2 rounded-lg border transition ${activeProcGroupId === 'open' ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                          <span className={`block text-xs font-bold truncate ${activeProcGroupId === 'open' ? 'text-teal-700' : 'text-slate-700'}`}>
                            {t('hce_proc_open_label', 'app')}
                          </span>
                          <span className="block text-[10px] text-slate-500">{t('hce_proc_open_count', 'app').replace('{count}', String(openGroupProcedures.length))}</span>
                          <span className="block text-[10px] text-slate-400">{formatDateTime(openGroupProcedures[0].createdAt)}</span>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{t('hce_proc_status_open', 'app')}</span>
                        </button>
                      )}
                      {procSignedGroups.map(g => {
                        const active = activeProcGroupId === g.signatureId;
                        return (
                          <button key={g.signatureId} onClick={() => { setProcGroupSelection(g.signatureId); setEditingProcedure(null); clearProcErrors(); }} className={`w-full text-left px-3 py-2 rounded-lg border transition ${active ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <span className={`block text-xs font-bold truncate ${active ? 'text-teal-700' : 'text-slate-700'}`}>
                              {t('hce_proc_group_signed', 'app').replace('{count}', String(g.procedures.length))}
                            </span>
                            <span className="block text-[10px] text-slate-400">{formatDateTime(g.signedAt)}</span>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">{t('hce_proc_signed', 'app')}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                  {editingProcedure ? (
                    <>
                      {procErrors.length > 0 && <FormErrorSummary errors={procErrors} onClose={clearProcErrors} />}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className={labelCls}>{t('hce_procedure_code', 'app')}</label>
                          <input type="text" value={editingProcedure.procedureCode} className={inputCls} readOnly />
                        </div>
                        <div>
                          <label className={labelCls}>{t('hce_procedure_name', 'app')}</label>
                          <input type="text" value={editingProcedure.procedureName} className={inputCls} readOnly />
                        </div>
                        <div>
                          <label className={labelCls}>{t('hce_procedure_category', 'app')}</label>
                          <input type="text" value={editingProcedure.procedureCategory} className={inputCls} readOnly />
                        </div>
                      </div>
                      {(editingProcedure.nomenclature || editingProcedure.financingEntity) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600">
                            <Hash className="w-3 h-3" />
                            {t('hce_procedure_nomenclature', 'app')}: {editingProcedure.nomenclature === 'sigtap' ? t('hce_procedure_nomenclature_sigtap', 'app') : t('hce_procedure_nomenclature_cbhpm', 'app')}
                          </span>
                          {editingProcedure.financingEntity && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-600">
                              <Shield className="w-3 h-3" />
                              {t('hce_procedure_financiador', 'app')}: {editingProcedure.financingEntity}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelCls}>{t('hce_snomed_code', 'app')}</label>
                          <SnomedSearchBox
                            semanticAxis="procedure"
                            initialCode={editingProcedure.snomedCode ?? ''}
                            initialDescription={editingProcedure.snomedDescription ?? ''}
                            onPick={(item) => setEditingProcedure(prev => prev ? {
                              ...prev,
                              snomedCode: String(item.concept.concept_id),
                              snomedDescription: item.term || item.concept.preferred_term,
                            } : null)}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>{t('hce_snomed_description', 'app')}</label>
                          <input type="text" value={editingProcedure.snomedDescription ?? ''} onChange={ev => setEditingProcedure(prev => prev ? { ...prev, snomedDescription: ev.target.value } : null)} className={inputCls} />
                        </div>
                      </div>
                      <div className="border border-teal-200 rounded-xl p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className={labelCls}>{t('hce_diagnosis_status', 'app')}</label>
                            <select value={editingProcedure.status} onChange={ev => setEditingProcedure(prev => prev ? { ...prev, status: ev.target.value as any } : null)} className={inputCls}>
                              <option value="programado">{t('hce_procedure_programado', 'app')}</option>
                              <option value="em_execucao">{t('hce_procedure_em_execucao', 'app')}</option>
                              <option value="concluido">{t('hce_procedure_concluido', 'app')}</option>
                              <option value="cancelado">{t('hce_status_cancelado', 'app')}</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>{t('hce_complications', 'app')}</label>
                            <input type="text" value={editingProcedure.complications ?? ''} onChange={ev => setEditingProcedure(prev => prev ? { ...prev, complications: ev.target.value } : null)} className={inputCls} placeholder={t('hce_describe_complications_placeholder', 'app')} />
                          </div>
                        </div>
                        <FormField label={t('hce_notes', 'app')}>
                          <textarea
                            value={editingProcedure.notes ?? ''}
                            onChange={ev => setEditingProcedure(prev => prev ? { ...prev, notes: ev.target.value } : null)}
                            rows={2}
                            className={textareaCls}
                            placeholder={t('hce_notes_placeholder', 'app')}
                          />
                        </FormField>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { if (window.confirm(t('hce_proc_confirm_delete', 'app'))) { handleDeleteProcedure(editingProcedure.id); setEditingProcedure(null); } }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg">{t('hce_delete', 'app')}</button>
                        <button onClick={() => { setEditingProcedure(null); clearProcErrors(); }} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg">{t('hce_cancel', 'app')}</button>
                        <button onClick={() => { if (!editingProcedure) return; handleUpdateProcedure({ ...editingProcedure, performedAt: editingProcedure.status === 'concluido' ? new Date().toISOString() : editingProcedure.performedAt }); setEditingProcedure(null); }} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg">{t('app_save', 'app')}</button>
                      </div>
                    </>
                  ) : activeProcGroupId === 'open' ? (
                    <>
                      {procErrors.length > 0 && <FormErrorSummary errors={procErrors} onClose={clearProcErrors} />}
                      <div className="grid grid-cols-3 gap-2">
                        <FormField label={t('hce_procedure_code', 'app')} error={procFieldErrors.procedureCode} className="col-span-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={procCodeQuery}
                              onChange={e => { const v = e.target.value; setProcCodeQuery(v); setProcedureForm(p => ({ ...p, procedureCode: v })); setProcCodeOpen(true); }}
                              onFocus={() => setProcCodeOpen(true)}
                              onBlur={() => setTimeout(() => setProcCodeOpen(false), 150)}
                              className={inputCls}
                              placeholder={t('hce_procedure_code_placeholder', 'app')}
                            />
                            {procCodeOpen && procCodeQuery.trim() && (
                              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                {procCatalogResults.length === 0 && (
                                  <p className="px-3 py-2 text-[10px] text-slate-400 italic">{t('hce_procedure_catalog_empty', 'app')}</p>
                                )}
                                {procCatalogResults.map(item => (
                                  <button key={`${item.nomenclature}-${item.code}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickProcedureCatalogItem(item)} className="w-full text-left px-3 py-2 hover:bg-teal-50 transition border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] text-teal-700 font-bold shrink-0">{item.code}</span>
                                      <span className="text-xs text-slate-700 flex-1 min-w-0 truncate">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{item.nomenclature.toUpperCase()}</span>
                                      {item.financingEntity && (
                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.financingEntity}</span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormField>
                        <FormField label={t('hce_procedure_nomenclature', 'app')} error={procFieldErrors.nomenclature}>
                          <select
                            value={procedureNomenclature}
                            onChange={e => {
                              const next = e.target.value as '' | ProcedureNomenclature;
                              setProcedureNomenclature(next);
                              setProcedureForm(p => ({ ...p, nomenclature: next, procedureCode: '', procedureName: '', procedureCategory: '', snomedCode: '', snomedDescription: '', financingEntity: '' }));
                              setProcCodeQuery('');
                            }}
                            className={inputCls}
                          >
                            <option value="">{t('hce_select_option', 'app')}</option>
                            {PROCEDURE_NOMENCLATURES.map(n => (
                              <option key={n} value={n}>{n === 'sigtap' ? t('hce_procedure_nomenclature_sigtap', 'app') : t('hce_procedure_nomenclature_cbhpm', 'app')}</option>
                            ))}
                          </select>
                        </FormField>
                      </div>

                      {financiadorType && !['Particular', 'Mercosul'].includes(financiadorType) && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-teal-600" />
                          <span className="font-bold uppercase">{t('hce_procedure_financiador', 'app')}:</span>{' '}
                          {selectedPatient?.health_insurance_company || financiadorType}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <FormField label={t('hce_procedure_name', 'app')} error={procFieldErrors.procedureName}>
                          <input type="text" value={procedureForm.procedureName} onChange={e => setProcedureForm(p => ({ ...p, procedureName: e.target.value }))} className={inputCls} />
                        </FormField>
                        <FormField label={t('hce_procedure_category', 'app')} error={procFieldErrors.procedureCategory}>
                          <select value={procedureForm.procedureCategory} onChange={e => setProcedureForm(p => ({ ...p, procedureCategory: e.target.value }))} className={inputCls}>
                            <option value="">{t('hce_select_option', 'app')}</option>
                            {PROCEDURE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{t(PROCEDURE_CATEGORY_I18N_KEY[cat], 'app')}</option>
                            ))}
                          </select>
                        </FormField>
                        <FormField label={t('hce_procedure_quantity', 'app')} error={procFieldErrors.quantity}>
                          <input type="text" inputMode="numeric" value={procedureForm.quantity} onChange={e => setProcedureForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className={inputCls} />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField label={t('hce_snomed_code', 'app')} error={procFieldErrors.snomedCode}>
                          <SnomedSearchBox
                            semanticAxis="procedure"
                            initialCode={procedureForm.snomedCode}
                            initialDescription={procedureForm.snomedDescription}
                            onPick={(item) => setProcedureForm(p => ({
                              ...p,
                              snomedCode: String(item.concept.concept_id),
                              snomedDescription: item.term || item.concept.preferred_term,
                              ...(!p.procedureName ? { procedureName: item.term || item.concept.preferred_term } : {}),
                            }))}
                          />
                        </FormField>
                        <FormField label={t('hce_snomed_description', 'app')} error={procFieldErrors.snomedDescription}>
                          <input type="text" value={procedureForm.snomedDescription} onChange={e => setProcedureForm(p => ({ ...p, snomedDescription: e.target.value }))} className={inputCls} />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <FormField label={t('hce_procedure_status', 'app')} error={procFieldErrors.status}>
                          <select value={procedureForm.status} onChange={e => setProcedureForm(p => ({ ...p, status: e.target.value as any }))} className={inputCls}>
                            <option value="">{t('hce_select_option', 'app')}</option>
                            <option value="programado">{t('hce_procedure_programado', 'app')}</option>
                            <option value="em_execucao">{t('hce_procedure_em_execucao', 'app')}</option>
                            <option value="concluido">{t('hce_procedure_concluido', 'app')}</option>
                          </select>
                        </FormField>
                        <div className="col-span-2 flex items-end">
                          <button onClick={handleSaveProcedure} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                            {t('hce_register_procedure', 'app')}
                          </button>
                        </div>
                      </div>
                      <FormField label={t('hce_notes', 'app')} error={procFieldErrors.notes}>
                        <textarea
                          value={procedureForm.notes}
                          onChange={e => setProcedureForm(p => ({ ...p, notes: e.target.value }))}
                          rows={2}
                          className={textareaCls}
                          placeholder={t('hce_notes_placeholder', 'app')}
                        />
                      </FormField>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic">{t('hce_proc_signed_locked', 'app')}</p>
                  )}
                    </div>
                  </div>
                  </>)}
                </div>
              )}

              {/* ═══ TAB: ATTACHMENTS ═══ */}
              {hceTab === 'attachments' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-teal-600" /> {t('hce_attachment_title', 'app')}
                  </h3>

                  {attErrors.length > 0 && <FormErrorSummary errors={attErrors} />}

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (
                    <div className="flex gap-3 min-h-[420px]">
                      {/* ─── SIDEBAR: HISTÓRICO ─── */}
                      <div className="w-56 shrink-0 space-y-2 border-r border-slate-200 pr-3">
                        <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                          {t('hce_attachment_history_title', 'app')}
                        </h4>
                        {attachments.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-3">{t('hce_attachment_history_empty', 'app')}</p>
                        ) : (
                          attachments.map((a: any) => {
                            const active = selectedAttachmentId === a.id;
                            const catLabel =
                              a.category === 'exame_imagem' ? t('hce_attachment_exame_imagem', 'app') :
                              a.category === 'exame_laboratorio' ? t('hce_attachment_exame_laboratorio', 'app') :
                              a.category === 'documento' ? t('hce_attachment_documento', 'app') :
                              a.category === 'receita' ? t('hce_attachment_receita', 'app') :
                              a.category === 'laudo' ? t('hce_attachment_laudo', 'app') :
                              a.category === 'anexo_paciente' ? t('hce_attachment_paciente', 'app') :
                              t('hce_attachment_outro', 'app');
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => { setSelectedAttachmentId(a.id); setAttachmentPreview(null); }}
                                className={`w-full text-left px-2.5 py-2 rounded-lg border transition ${active ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                              >
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  {a.isSensitive && <Shield className="w-3 h-3 text-amber-600 shrink-0" />}
                                  <FileText className="w-3 h-3 text-teal-600 shrink-0" />
                                  <span className={`text-[11px] font-bold truncate ${active ? 'text-teal-700' : 'text-slate-700'}`}>
                                    {catLabel}
                                  </span>
                                </div>
                                <span className="block text-[9px] text-slate-400">{formatDateTime(a.createdAt)}</span>
                                {a.description && (
                                  <span className="block text-[9px] text-slate-500 truncate italic mt-0.5">&ldquo;{a.description}&rdquo;</span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* ─── MAIN: CARD (selecionado) OU FORM (sem seleção) ─── */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {selectedAttachment ? (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  {selectedAttachment.isSensitive && <Shield className="w-4 h-4 text-amber-600 shrink-0" />}
                                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                    {t('hce_attachment_category', 'app')}
                                  </h4>
                                </div>
                                <p className="text-sm font-bold text-slate-800 mt-1">
                                  {selectedAttachment.category === 'exame_imagem' ? t('hce_attachment_exame_imagem', 'app') :
                                   selectedAttachment.category === 'exame_laboratorio' ? t('hce_attachment_exame_laboratorio', 'app') :
                                   selectedAttachment.category === 'documento' ? t('hce_attachment_documento', 'app') :
                                   selectedAttachment.category === 'receita' ? t('hce_attachment_receita', 'app') :
                                   selectedAttachment.category === 'laudo' ? t('hce_attachment_laudo', 'app') :
                                   selectedAttachment.category === 'anexo_paciente' ? t('hce_attachment_paciente', 'app') :
                                   t('hce_attachment_outro', 'app')}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleViewAttachment(selectedAttachment)}
                                  className="text-teal-600 hover:text-teal-800 p-1.5 rounded-md hover:bg-teal-50"
                                  title={t('hce_attachment_view', 'app')}
                                  aria-label={t('hce_attachment_view', 'app')}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteAttachmentId(selectedAttachment.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50"
                                  title={t('hce_attachment_confirm_delete_title', 'app')}
                                  aria-label={t('hce_attachment_confirm_delete_title', 'app')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAttachmentId(null)}
                                  className="text-slate-500 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200"
                                  title={t('hce_attachment_close', 'app')}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('hce_attachment_description', 'app')}</span>
                                <p className="text-sm text-slate-800 break-words">{selectedAttachment.description || '-'}</p>
                              </div>
                              <p className="text-[10px] text-slate-400">{formatDateTime(selectedAttachment.createdAt)}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <FormField label={t('hce_attachment_category', 'app')} required error={attFieldErrors.category}>
                              <select
                                value={attachmentForm.category}
                                onChange={e => setAttachmentForm(p => ({ ...p, category: e.target.value as '' | AttachmentCategory }))}
                                className={inputCls}
                              >
                                <option value="">{t('hce_attachment_select_category', 'app')}</option>
                                {ATTACHMENT_CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>
                                    {cat === 'exame_imagem' && t('hce_attachment_exame_imagem', 'app')}
                                    {cat === 'exame_laboratorio' && t('hce_attachment_exame_laboratorio', 'app')}
                                    {cat === 'documento' && t('hce_attachment_documento', 'app')}
                                    {cat === 'receita' && t('hce_attachment_receita', 'app')}
                                    {cat === 'laudo' && t('hce_attachment_laudo', 'app')}
                                    {cat === 'anexo_paciente' && t('hce_attachment_paciente', 'app')}
                                    {cat === 'outro' && t('hce_attachment_outro', 'app')}
                                  </option>
                                ))}
                              </select>
                            </FormField>

                            <FormField label={t('hce_attachment_description', 'app')} required error={attFieldErrors.description}>
                              <input
                                type="text"
                                value={attachmentForm.description}
                                onChange={e => setAttachmentForm(p => ({ ...p, description: e.target.value }))}
                                className={inputCls}
                                maxLength={500}
                              />
                            </FormField>

                            <FormField error={attFieldErrors.isSensitive}>
                              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={attachmentForm.isSensitive}
                                  onChange={e => setAttachmentForm(p => ({ ...p, isSensitive: e.target.checked }))}
                                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <Shield className="w-3.5 h-3.5 text-amber-600" />
                                <span className="font-semibold">{t('hce_attachment_sensitive', 'app')}</span>
                              </label>
                            </FormField>

                            <FormField error={attFieldErrors.fileName || attFieldErrors.fileSizeBytes || attFieldErrors.mimeType}>
                              <div
                                role="button"
                                tabIndex={0}
                                className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-teal-400 transition cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                                onDragOver={e => { e.preventDefault(); }}
                                onDrop={e => {
                                  e.preventDefault();
                                  const files = Array.from(e.dataTransfer.files || []);
                                  files.forEach(f => handleSaveAttachment(f));
                                }}
                              >
                                <Paperclip className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-xs text-slate-500 font-medium">{t('hce_drag_files_or_click', 'app')}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{t('hce_supported_formats', 'app')}</p>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.dcm,.jpg,.jpeg,.png,.mp4,.wav,application/pdf,application/dicom,image/jpeg,image/png,video/mp4,audio/wav"
                                  multiple
                                  disabled={attachmentUploading}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => {
                                    const files = Array.from(e.target.files || []);
                                    files.forEach(f => {
                                      handleSaveAttachment(f);
                                    });
                                    e.target.value = '';
                                  }}
                                />
                              </div>
                            </FormField>

                            {attachmentUploading && (
                              <p className="text-xs text-teal-600 font-semibold text-center">{t('hce_attachment_uploading', 'app')}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <ConfirmDialog
                    open={pendingDeleteAttachmentId !== null}
                    onOpenChange={open => { if (!open) setPendingDeleteAttachmentId(null); }}
                    title={t('hce_attachment_confirm_delete_title', 'app')}
                    message={t('hce_attachment_confirm_delete_msg', 'app')}
                    variant="danger"
                    onConfirm={() => {
                      if (pendingDeleteAttachmentId) {
                        handleDeleteAttachment(pendingDeleteAttachmentId);
                        setPendingDeleteAttachmentId(null);
                        if (selectedAttachmentId === pendingDeleteAttachmentId) setSelectedAttachmentId(null);
                      }
                    }}
                  />

                  <Dialog open={attachmentPreview !== null} onOpenChange={open => { if (!open) setAttachmentPreview(null); }}>
                    <DialogContent showCloseButton={false} className="sm:max-w-3xl p-0 bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
                      {attachmentPreview && (
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-slate-800 truncate">
                                {attachmentPreview.attachment.fileName}
                              </h3>
                              <p className="text-[10px] text-slate-500 truncate">
                                {attachmentPreview.attachment.mimeType} | {((attachmentPreview.attachment.fileSizeBytes || 0) / 1024).toFixed(1)} KB
                                {attachmentPreview.attachment.description && ` | ${attachmentPreview.attachment.description}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAttachmentPreview(null)}
                              className="ml-3 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-rose-500 transition cursor-pointer"
                              aria-label={t('hce_attachment_close', 'app')}
                              title={t('hce_attachment_close', 'app')}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="bg-slate-900 min-h-[400px] max-h-[70vh] flex items-center justify-center overflow-auto">
                            {attachmentPreview.loading ? (
                              <p className="text-sm text-slate-300 p-6">{t('hce_attachment_preview_loading', 'app')}</p>
                            ) : !attachmentPreview.signedUrl ? (
                              <p className="text-sm text-rose-300 p-6">{t('hce_attachment_preview_error', 'app')}</p>
                            ) : attachmentPreview.attachment.mimeType?.startsWith('image/') ? (
                              <Image
                                src={attachmentPreview.signedUrl}
                                alt={attachmentPreview.attachment.fileName}
                                width={800}
                                height={600}
                                unoptimized
                                className="max-w-full max-h-[70vh] object-contain"
                              />
                            ) : attachmentPreview.attachment.mimeType === 'application/pdf' ? (
                              <iframe
                                src={attachmentPreview.signedUrl}
                                title={attachmentPreview.attachment.fileName}
                                className="w-full h-[70vh] bg-white"
                              />
                            ) : (
                              <div className="text-center p-8 text-slate-300">
                                <FileText className="w-16 h-16 mx-auto mb-3 text-slate-400" />
                                <p className="text-sm font-semibold mb-1">{attachmentPreview.attachment.fileName}</p>
                                <p className="text-xs text-slate-400 mb-4">{t('hce_attachment_preview_error', 'app')}</p>
                                <button
                                  type="button"
                                  onClick={handleDownloadAttachment}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 cursor-pointer"
                                >
                                  <FileDown className="w-4 h-4" />
                                  {t('hce_attachment_download', 'app')}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2 p-3 border-t border-slate-200 bg-slate-50">
                            {attachmentPreview.signedUrl && (
                              <button
                                type="button"
                                onClick={handleDownloadAttachment}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 cursor-pointer"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                                {t('hce_attachment_download', 'app')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setAttachmentPreview(null)}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 cursor-pointer"
                            >
                              {t('hce_attachment_close', 'app')}
                            </button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* ═══ TAB: SIGNATURES ═══ */}
              {hceTab === 'signatures' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-teal-600" /> {t('hce_signature_title', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (<>

                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-700">
                    <p className="font-bold">{t('hce_signature_info', 'app')}</p>
                    <p className="mt-1">{t('hce_signature_crypto_info', 'app')}</p>
                    <p>{t('hce_signature_legal_info', 'app')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select value={signFilterType} onChange={e => setSignFilterType(e.target.value)} className={inputCls + ' w-44'}>
                      <option value="all">{t('hce_sign_filter_all', 'app')}</option>
                      {signatureDocTypes.map(type => (
                        <option key={type} value={type}>{translateDocType(type)}</option>
                      ))}
                    </select>
                    <select value={signFilterProfessional} onChange={e => setSignFilterProfessional(e.target.value)} className={inputCls + ' w-48'}>
                      <option value="all">{t('hce_sign_filter_all_professionals', 'app')}</option>
                      {signatureProfessionals.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <I18nDatePicker value={signDateFrom} onChange={setSignDateFrom} className={inputCls + ' w-32'} placeholder={t('hce_sign_filter_date_from', 'app')} />
                    <I18nDatePicker value={signDateTo} onChange={setSignDateTo} className={inputCls + ' w-32'} placeholder={t('hce_sign_filter_date_to', 'app')} />
                    <span className="text-xs text-slate-500 self-center">{filteredSignatures.length} / {signatures.length}</span>
                  </div>
                  <div className="space-y-2">
                    {signatures.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">{t('hce_no_signatures', 'app')}</p>
                    ) : filteredSignatures.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">{t('hce_no_results', 'app')}</p>
                    ) : (
                      filteredSignatures.map(s => (
                        <div key={s.id} className={`p-3 border rounded-xl text-xs space-y-1 ${
                          s.status === 'valida' ? 'bg-green-50 border-green-200' :
                          s.status === 'revogada' ? 'bg-rose-50 border-rose-200' :
                          'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{translateDocType(s.documentType)}: {s.documentId}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'valida' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                            }`}>{s.status === 'valida' ? t('hce_signature_valid', 'app') : s.status === 'revogada' ? t('hce_signature_revoked', 'app') : t('hce_signature_expired', 'app')}</span>
                          </div>
                          <p className="text-slate-500">{t('hce_signer_label', 'app')} {s.signerName} | {s.signerCouncil} {s.signerCouncilNumber}</p>
                          <p className="text-slate-500">{t('hce_signature_signed_at', 'app')} {formatDateTime(s.signedAt)}</p>
                          <p className="text-slate-500">{t('hce_issued_by_label', 'app')} {s.certificateIssuer}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{t('hce_signature_hash', 'app')} {s.signatureHash.substring(0, 40)}...</p>
                          <p className="text-[9px] text-slate-400 font-mono">{t('hce_verification_label', 'app')} {s.verificationCode} | {t('hce_signature_tsa', 'app')} {s.timestampAuthority}</p>
                        </div>
                      ))
                    )}
                  </div>

                  </>)}
                </div>
              )}

              {/* ═══ TAB: TIMELINE ═══ */}
              {hceTab === 'timeline' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" /> {t('hce_timeline_title', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (<>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input type="text" value={timelineSearch} onChange={e => setTimelineSearch(e.target.value)} placeholder={t('hce_timeline_search', 'app')} className={`${inputCls} pl-9`} />
                    </div>
                    <select value={timelineFilterType} onChange={e => setTimelineFilterType(e.target.value)} className={inputCls + ' w-40'}>
                      <option value="all">{t('hce_timeline_all', 'app')}</option>
                      {timelineEventTypes.map(type => (
                        <option key={type} value={type}>{t(`hce_timeline_${type}`, 'app')}</option>
                      ))}
                    </select>
                    <input type="text" value={timelineFilterDoctor} onChange={e => setTimelineFilterDoctor(e.target.value)} placeholder={t('hce_timeline_filter_doctor', 'app')} className={inputCls + ' w-40'} />
                    <I18nDatePicker value={timelineDateFrom} onChange={setTimelineDateFrom} className={inputCls + ' w-36'} placeholder={t('hce_timeline_date_from', 'app')} />
                    <I18nDatePicker value={timelineDateTo} onChange={setTimelineDateTo} className={inputCls + ' w-36'} placeholder={t('hce_timeline_date_to', 'app')} />
                    <button onClick={handleExportTimelinePdf} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1">
                      <Printer className="w-3 h-3" /> {t('hce_timeline_export_pdf', 'app')}
                    </button>
                  </div>

                  <div className="space-y-0">
                    {groupedTimeline.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">{t('hce_timeline_no_history', 'app')}</p>
                    ) : (
                      groupedTimeline.map(section => section.kind === 'consultation' ? (
                        <div key={section.group.key} className="mb-5">
                          {!section.group.isLegacy && (
                            <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-200">
                              <p className="text-xs font-bold text-slate-700">
                                📋 {t('rcpt_timeline_consultation', 'app')} #{section.group.number} — {section.group.dateLabel}
                              </p>
                            </div>
                          )}
                          {section.group.triage.map((triageEntry: any, tIdx: number) => (
                            <div key={`triage-${section.group.key}-${tIdx}`} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                                <div className="w-0.5 flex-1 bg-slate-200"></div>
                              </div>
                              <div className="pb-4 flex-1">
                                <p className="text-xs font-bold text-slate-800">{t('rcpt_timeline_triage', 'app')}</p>
                                <p className="text-[10px] text-slate-400">
                                  {triageEntry.triaged_at ? new Date(triageEntry.triaged_at).toLocaleString(locale) : '—'}
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
                              </div>
                            </div>
                          ))}
                          {section.group.meds.map((med: any, mIdx: number) => (
                            <div key={`med-${section.group.key}-${mIdx}`} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                                <div className="w-0.5 flex-1 bg-slate-200"></div>
                              </div>
                              <div className="pb-4 flex-1">
                                <p className="text-xs font-bold text-slate-800">🏥 {med.location_name || t('rcpt_timeline_medical_consultation', 'app')}</p>
                                <p className="text-[10px] text-slate-400">
                                  {med.created_at ? new Date(med.created_at).toLocaleString(locale) : med.date || '—'}
                                </p>
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
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-green-600 flex-shrink-0"></div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-green-700">{t('rcpt_timeline_visit_completed', 'app')}</p>
                              <p className="text-[10px] text-slate-400">
                                {section.group.completedAt ? new Date(section.group.completedAt).toLocaleString(locale) : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={section.evt.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              section.evt.eventType === 'emergencia' ? 'bg-red-500' :
                              section.evt.eventType === 'prescricao' ? 'bg-blue-500' :
                              section.evt.eventType === 'exame' ? 'bg-purple-500' :
                              section.evt.eventType === 'procedimento' ? 'bg-amber-500' :
                              'bg-teal-500'
                            }`}></div>
                            <div className="w-0.5 flex-1 bg-slate-200"></div>
                          </div>
                          <div className="pb-4 flex-1">
                            <p className="text-xs font-bold text-slate-800">{section.evt.eventTitle}</p>
                            <p className="text-[10px] text-slate-400">{section.evt.eventDate ? (section.evt.eventDate.includes('T') ? new Date(section.evt.eventDate).toLocaleString(locale) : formatDate(section.evt.eventDate.split('T')[0])) : '—'} | {section.evt.doctorName}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{section.evt.eventDescription}</p>
                            {section.evt.cid10Code && (
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold mt-1 inline-block">{t('hce_timeline_cid10', 'app')} {section.evt.cid10Code}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  </>)}
                </div>
              )}

              {/* ═══ TAB: SECURITY ═══ */}
              {hceTab === 'security' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-600" /> {t('hce_tab_security', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app')}</p>
                    </div>
                  ) : (<> 

                  {/* Break the Glass */}
                  <div className={`p-4 rounded-xl border ${breakGlassActive ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-800 flex items-center gap-2">
                        {breakGlassActive ? <Unlock className="w-4 h-4 text-rose-600" /> : <Lock className="w-4 h-4 text-slate-600" />}
                        {t('hce_break_glass', 'app')}
                      </h5>
                      <button onClick={() => { if (breakGlassTimeoutRef.current) clearTimeout(breakGlassTimeoutRef.current); setBreakGlassActive(!breakGlassActive); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${breakGlassActive ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                        {breakGlassActive ? t('hce_break_glass_activated', 'app') : t('hce_break_glass_activate', 'app')}
                      </button>
                    </div>
                    {breakGlassActive && (
                      <div className="space-y-2">
                        <textarea value={breakGlassJustification} onChange={e => setBreakGlassJustification(e.target.value)} rows={2} className={textareaCls}
                          placeholder={t('hce_break_glass_justification', 'app')} />
                        <button onClick={handleBreakGlass} className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 rounded-lg font-bold">
                          {t('hce_confirm_emergency_access', 'app')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sensitive Fields */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <h5 className="font-bold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {t('hce_sensitive_field', 'app')} — Lei 1682/2001
                    </h5>
                    <div className="space-y-1">
                      {sensitiveFieldConfig.map(sf => (
                        <div key={sf.id} className="flex items-center justify-between text-xs p-2 bg-white border border-amber-100 rounded-lg">
                          <span className="font-bold text-slate-700">{sf.fieldLabel}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">{t('hce_category', 'app')}: {sf.category}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sf.requiresElevatedPermission ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                              {sf.requiresElevatedPermission ? t('hce_elevated_permission', 'app') : t('hce_access_normal', 'app')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Care Team (equipe assistencial designada) */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" /> {t('hce_care_team_title', 'app')}
                    </h5>
                    <p className="text-[11px] text-slate-500">{t('hce_care_team_desc', 'app')}</p>

                    {careTeam.length === 0 ? (
                      <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-2">
                        {t('hce_care_team_empty', 'app')}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {careTeam.map(member => (
                          <div key={member.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-slate-700 truncate">{member.professionalName}</span>
                              <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 text-[10px] font-bold uppercase">{member.role}</span>
                              {member.professionalName === activeOperator && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">{t('hce_care_team_you', 'app')}</span>
                              )}
                            </div>
                            <button onClick={() => handleRemoveCareTeamMember(member.id)} className="text-rose-500 hover:text-rose-700 font-bold text-[10px] shrink-0">
                              {t('hce_remove', 'app')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className={labelCls}>{t('hce_care_team_professional', 'app')}</label>
                        <select value={careTeamProfId} onChange={e => setCareTeamProfId(e.target.value)} className={inputCls}>
                          <option value="">{t('agenda_select', 'app')}</option>
                          {professionals.map(p => (
                            <option key={p.id} value={p.id}>{p.name}{p.specialty ? ` - ${p.specialty}` : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-36">
                        <label className={labelCls}>{t('hce_care_team_role', 'app')}</label>
                        <select value={careTeamRole} onChange={e => setCareTeamRole(e.target.value)} className={inputCls}>
                          <option value="assistencial">{t('hce_care_team_role_assistencial', 'app')}</option>
                          <option value="responsavel">{t('hce_care_team_role_responsavel', 'app')}</option>
                          <option value="consultor">{t('hce_care_team_role_consultor', 'app')}</option>
                          <option value="enfermagem">{t('hce_care_team_role_enfermagem', 'app')}</option>
                        </select>
                      </div>
                      <button onClick={handleAddCareTeamMember} className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded-lg font-bold h-[38px]">
                        {t('hce_add', 'app')}
                      </button>
                    </div>
                  </div>

                  {/* Access Logs */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-teal-600" /> {t('hce_access_log', 'app')}
                    </h5>
                    {accessLogs.length === 0 ? (
                      <p className="text-xs text-slate-400">{t('hce_no_emergency_access', 'app')}</p>
                    ) : (
                      accessLogs.map(log => (
                        <div key={log.id} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-800">⚠️ {log.accessType.toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500">{new Date(log.accessedAt).toLocaleString(locale)}</span>
                          </div>
                          <p className="text-rose-600">{t('hce_justification', 'app')}: {log.justification}</p>
                          <p className="text-slate-500">{t('hce_accessed_by', 'app')}: {log.accessedBy}</p>
                        </div>
                      ))
                    )}
                  </div>

                  </>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* 4. DIAGNÓSTICO POR IMAGENS E LABORATÓRIO    */}
      {/* ════════════════════════════════════════════ */}
      {activeSubmodule === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={sectionCls + ' lg:col-span-1'}>
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Microscope className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800 text-base">{t('hce_report_new_exam', 'app')}</h3>
              </div>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className={labelCls}>{t('hce_patient', 'app')}</label>
                <select value={selectedPatId} onChange={e => handlePatientChange(e.target.value)} className={inputCls}>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('hce_exam_type', 'app')}</label>
                  <select value={selectedExamType} onChange={e => {
                    setSelectedExamType(e.target.value);
                    if (e.target.value === 'Raio-X Tórax') setSelectedImageUrl('https://picsum.photos/seed/xray/600/400');
                    else if (e.target.value === 'Ressonância') setSelectedImageUrl('https://picsum.photos/seed/mri/600/400');
                    else setSelectedImageUrl('https://picsum.photos/seed/ct/600/400');
                  }} className={inputCls}>
                    <option value="Raio-X Tórax">{t('hce_exam_type_raiox', 'app')}</option>
                    <option value="Ressonância">{t('hce_exam_type_ressonancia', 'app')}</option>
                    <option value="Tomografia">{t('hce_exam_type_tomografia', 'app')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('hce_diagnosis_status', 'app')}</label>
                  <div className="p-2.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg font-bold text-center text-xs">
                    {t('hce_awaiting_report', 'app')}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('hce_observations', 'app')}</label>
                <textarea value={laboratoryNotes} onChange={e => setLaboratoryNotes(e.target.value)} rows={4} className={textareaCls}
                  placeholder={t('hce_observations_placeholder', 'app')} />
              </div>
              <button onClick={() => { addAuditLog('Emissão Laudo', `${selectedExamType} de ${selectedPatient?.name}`); alert(t('clinical_alert_report_saved', 'app')); setLaboratoryNotes(''); }}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs">
                {t('hce_save_report', 'app')}
              </button>
            </div>
          </div>
          <div className={sectionCls + ' lg:col-span-2 space-y-4'}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-base">{t('hce_pacs_title', 'app')}</h4>
                <p className="text-xs text-slate-500">{t('hce_pacs_subtitle', 'app')}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs font-bold bg-slate-100 py-1 px-2.5 rounded text-slate-600">{t('hce_id', 'app')}: PACS_8390</span>
                <span className="text-xs font-bold bg-teal-50 text-teal-700 py-1 px-2.5 rounded border border-teal-100">{t('hce_pacs_online', 'app')}</span>
              </div>
            </div>
            <div className="relative bg-black rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 h-[320px]">
              <Image src={selectedImageUrl} alt="PACS" referrerPolicy="no-referrer"
                style={{ filter: `contrast(${imageContrast}%) brightness(${imageBrightness}%) grayscale(100%)` }}
                className="object-cover max-h-full max-w-full transition duration-150" fill />
              <div className="absolute top-3 left-3 bg-black/70 p-2 rounded-md font-mono text-[9px] text-teal-400 space-y-0.5 pointer-events-none">
                <p>{t('hce_name_label', 'app')}: {selectedPatient?.name.toUpperCase()}</p>
                <p>{t('hce_exam_label', 'app')}: {selectedExamType.toUpperCase()}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-600 w-16">{t('hce_contrast_label', 'app')}</span>
                <input type="range" min="50" max="180" value={imageContrast} onChange={e => setImageContrast(Number(e.target.value))} className="flex-1 accent-teal-600" />
                <span className="w-10 text-right font-bold">{imageContrast}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-600 w-16">{t('hce_brightness_label', 'app')}</span>
                <input type="range" min="50" max="180" value={imageBrightness} onChange={e => setImageBrightness(Number(e.target.value))} className="flex-1 accent-teal-600" />
                <span className="w-10 text-right font-bold">{imageBrightness}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* 8. MEDICINA DO TRABALHO PCMSO               */}
      {/* ════════════════════════════════════════════ */}
      {activeSubmodule === 8 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={sectionCls + ' lg:col-span-1'}>
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800 text-base">{t('hce_register_aso', 'app')}</h3>
              </div>
            </div>
            <form onSubmit={handleCreateAso} className="space-y-4 text-xs" noValidate>
              <div>
                <label className={labelCls}>{t('hce_employee', 'app')} *</label>
                <input type="text" value={asoPatient} onChange={e => setAsoPatient(e.target.value)} placeholder={t('hce_full_name', 'app')} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('hce_aso_type', 'app')}</label>
                   <select value={asoType} onChange={e => setAsoType(e.target.value as any)} className={inputCls}>
                     <option value="Admissional">{t('hce_aso_admissional', 'app')}</option>
                     <option value="Periódico">{t('hce_aso_periodico', 'app')}</option>
                     <option value="Demissional">{t('hce_aso_demissional', 'app')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('hce_opinion', 'app')}</label>
                  <select value={asoStatus} onChange={e => setAsoStatus(e.target.value as any)} className={inputCls}>
                    <option value="apto">{t('hce_aso_apto', 'app')}</option>
                    <option value="inapto">{t('hce_aso_inapto', 'app')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('hce_occupational_risks', 'app')}</label>
                <input type="text" value={asoRisks} onChange={e => setAsoRisks(e.target.value)} placeholder={t('hce_separate_comma', 'app')} className={inputCls} />
              </div>
              <button type="submit" className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs">
                {t('hce_generate_aso', 'app')}
              </button>
            </form>
          </div>
          <div className={sectionCls + ' lg:col-span-2'}>
            <h4 className="font-bold text-slate-800 text-sm">{t('hce_aso_history', 'app')}</h4>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {asos.map(aso => (
                <div key={aso.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs group">
                  <div className="space-y-1 flex-1">
                    <p className="font-black text-slate-800 text-sm">{aso.patientName}</p>
                    <p className="text-slate-500">{t('hce_exam', 'app')}: <b className="text-slate-700">{aso.type}</b> | {aso.doctor}</p>
                    <div className="flex gap-1.5 flex-wrap">{aso.risks.map((r, i) => <span key={i} className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{r}</span>)}</div>
                  </div>
                  <div className="text-right space-y-1 shrink-0 ml-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${aso.status === 'apto' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {aso.status === 'apto' ? `✅ ${t('hce_apt', 'app')}` : `❌ ${t('hce_unfit', 'app')}`}
                      </span>
                      <button onClick={() => setEditingAso(aso)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer transition text-slate-500 hover:text-teal-600" title={t('hce_edit_aso', 'app')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">{aso.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* 9. MEDICINA DO TRABALHO / CAT & EPI         */}
      {/* ════════════════════════════════════════════ */}
      {activeSubmodule === 9 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={sectionCls}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800 text-base">{t('hce_issue_cat', 'app')}</h3>
            </div>
            <form onSubmit={handleRegisterCat} className="space-y-4 text-xs" noValidate>
              <div>
                <label className={labelCls}>{t('hce_injured_worker', 'app')} *</label>
                <input type="text" value={catEmployee} onChange={e => setCatEmployee(e.target.value)} placeholder={t('hce_full_name', 'app')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('hce_incident_date', 'app')}</label>
                <I18nDatePicker value={catDate} onChange={setCatDate} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('hce_injury_nature', 'app')}</label>
                <textarea value={catNotes} onChange={e => setCatNotes(e.target.value)} rows={4} className={textareaCls} placeholder={t('hce_describe_placeholder', 'app')} />
              </div>
              <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg">
                {t('hce_register_cat', 'app')}
              </button>
              {catRegistered && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg font-bold flex items-center gap-2 animate-pulse">
                  <Check className="w-4 h-4 text-green-600" /> {t('hce_cat_registered_success', 'app')}
                </div>
              )}
            </form>
          </div>
          <div className={sectionCls}>
            <h4 className="font-bold text-slate-800 text-sm">{t('hce_ppe_control', 'app')}</h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{t('hce_ear_protectors', 'app')}</p>
                  <p className="text-[10px] text-slate-500">CA: 12.389</p>
                </div>
                <span className="py-1 px-2.5 bg-green-50 text-green-700 border border-green-200 font-semibold rounded">{t('hce_stock_ok', 'app')}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{t('hce_safety_harnesses', 'app')}</p>
                  <p className="text-[10px] text-slate-500">CA: 44.910</p>
                </div>
                <span className="py-1 px-2.5 bg-red-50 text-red-700 border border-red-200 font-semibold rounded animate-pulse">{t('hce_review_pending', 'app')}</span>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex gap-3 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">NR-35 & PCMSO</p>
                  <p className="mt-1 font-medium text-amber-800">
                    {t('hce_nr35_asm_info', 'app')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASO EDITING MODAL */}
      {editingAso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditingAso(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 font-sans border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">{t('hce_edit_aso', 'app')}</h3>
            </div>
            <div className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('hce_patient', 'app')}</label>
                <p className="font-bold text-slate-800">{editingAso.patientName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('hce_aso_type', 'app')}</label>
                   <select
                     value={editingAso.type}
                     onChange={e => setEditingAso(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                     className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                   >
                     <option value="Admissional">{t('hce_aso_admissional', 'app')}</option>
                     <option value="Periódico">{t('hce_aso_periodico', 'app')}</option>
                     <option value="Demissional">{t('hce_aso_demissional', 'app')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('hce_opinion', 'app')}</label>
                  <select
                    value={editingAso.status}
                    onChange={e => setEditingAso(prev => prev ? { ...prev, status: e.target.value as 'apto' | 'inapto' } : null)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="apto">{t('hce_aso_apto', 'app')}</option>
                    <option value="inapto">{t('hce_aso_inapto', 'app')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('hce_occupational_risks', 'app')}</label>
                <input
                  type="text"
                  value={editingAso.risks.join(', ')}
                  onChange={e => setEditingAso(prev => prev ? { ...prev, risks: e.target.value.split(',').map(r => r.trim()) } : null)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder={t('hce_separate_comma', 'app')}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setAsos(prev => prev.map(a => a.id === editingAso.id ? { ...editingAso, date: a.date, doctor: a.doctor } : a));
                    addAuditLog('Edição ASO', `${editingAso.patientName} - status: ${editingAso.status.toUpperCase()}`);
                    setEditingAso(null);
                  }}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer transition"
                >
                  {t('app_save_changes', 'app')}
                </button>
                <button onClick={() => setEditingAso(null)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition">
                  {t('hce_cancel', 'app')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PEDIATRIC DOSE CALCULATOR MODAL */}
      {pediatricDoseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setPediatricDoseModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 font-sans border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Activity className="w-4 h-4 text-teal-600" />
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">{t('presc_pediatric_dose_title', 'app')}</h3>
            </div>
            <div className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('presc_pediatric_weight', 'app')} (kg)</label>
                  <input type="text" inputMode="decimal" value={pediatricDoseModal.weight} onChange={e => setPediatricDoseModal(p => p ? { ...p, weight: e.target.value, result: '' } : p)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('presc_pediatric_height', 'app')} (cm)</label>
                  <input type="text" inputMode="decimal" value={pediatricDoseModal.height} onChange={e => setPediatricDoseModal(p => p ? { ...p, height: e.target.value, result: '' } : p)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('presc_pediatric_dose_kg', 'app')} (mg/kg/dia)</label>
                  <input type="text" inputMode="decimal" value={pediatricDoseModal.dosePerKgPerDay} onChange={e => setPediatricDoseModal(p => p ? { ...p, dosePerKgPerDay: e.target.value, result: '' } : p)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t('presc_pediatric_doses_per_day', 'app')}</label>
                  <input type="text" inputMode="decimal" value={pediatricDoseModal.dosesPerDay} onChange={e => setPediatricDoseModal(p => p ? { ...p, dosesPerDay: e.target.value, result: '' } : p)} className={inputCls} />
                </div>
              </div>
              {pediatricDoseModal.result && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 font-bold whitespace-pre-line">
                  {pediatricDoseModal.result}
                </div>
              )}
              <button
                onClick={() => {
                  const weight = parseFloat(pediatricDoseModal.weight);
                  const dosePerKg = parseFloat(pediatricDoseModal.dosePerKgPerDay);
                  const dosesPerDay = parseFloat(pediatricDoseModal.dosesPerDay);
                  if (!weight || !dosePerKg || !dosesPerDay) return;
                  const result = calculatePediatricDoseByWeight({ weightKg: weight, dosePerKgPerDay: dosePerKg, dosesPerDay });
                  const height = parseFloat(pediatricDoseModal.height);
                  let bsaLine = '';
                  if (height) {
                    const bsa = calculateBodySurfaceArea(weight, height);
                    bsaLine = `${t('presc_pediatric_bsa', 'app')}: ${bsa.toFixed(2)} m²`;
                  }
                  setPediatricDoseModal(p => p ? { ...p, result: `${t('presc_pediatric_result_dose', 'app')}: ${result.dosePerDoseMg} mg\n${t('presc_pediatric_result_total', 'app')}: ${result.totalPerDayMg} mg/dia\n${bsaLine}` } : p);
                }}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer transition"
              >
                {t('presc_pediatric_calculate', 'app')}
              </button>
              <button onClick={() => setPediatricDoseModal(null)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition">
                {t('hce_cancel', 'app')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
