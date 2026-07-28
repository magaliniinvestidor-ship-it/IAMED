'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Patient, AsoExam, Cid10Code, DrugCatalogItem, Prescription, ExamRequest, Procedure, Anamnese, SoapNote, Diagnosis, PhysicalExam, VitalSigns, AllergyEntry, MedicationEntry, FamilyHistoryEntry, SurgicalEntry, ElectronicSignature, AccessControl, PatientTimelineEvent, nationalProcedures, sensitiveFieldConfig, drugInteractions } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import {
  ClipboardList, Microscope, HeartPulse, ShieldAlert,
  Send, Plus, FileDown, Check, Eye, Trash2, Sliders, AlertCircle,
  Search, Filter, Pill, Stethoscope, FileText, Paperclip,
  Shield, Clock, User, Activity, AlertTriangle, QrCode, Hash,
  ChevronDown, ChevronRight, Lock, Unlock, Printer, Calendar,
  Baby, Calculator, BookOpen, Tag, FileSignature, Scan,
  Lock as LockIcon
} from 'lucide-react';
import { PermissionGate, WithPermissions } from '@/components/ui/PermissionGate';
import I18nDatePicker from '@/components/I18nDatePicker';

interface ClinicalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  asos: AsoExam[];
  setAsos: React.Dispatch<React.SetStateAction<AsoExam[]>>;
  userPermissions?: string[];
}

// HCE Tab type
type HCETab = 'anamnese' | 'exam' | 'soap' | 'diagnoses' | 'prescriptions' | 'exams' | 'procedures' | 'attachments' | 'signatures' | 'timeline' | 'security';

// CID-10 seed data inline for lookup
const cid10Data: Cid10Code[] = [
  { code: 'A00', description: 'Cólera', chapter: 'I', block: 'A00-A09' },
  { code: 'A09', description: 'Outras doenças infecciosas intestinais', chapter: 'I', block: 'A00-A09' },
  { code: 'B20', description: 'Doença pelo HIV', chapter: 'I', block: 'B20-B24' },
  { code: 'C34', description: 'Neoplasia maligna dos brônquios e pulmão', chapter: 'II', block: 'C30-C39' },
  { code: 'C50', description: 'Neoplasia maligna da mama', chapter: 'II', block: 'C50-C50' },
  { code: 'E11', description: 'Diabetes mellitus tipo 2', chapter: 'IV', block: 'E08-E13' },
  { code: 'E78', description: 'Transtornos do metabolismo lipídico', chapter: 'IV', block: 'E70-E90' },
  { code: 'F32', description: 'Episódios depressivos', chapter: 'V', block: 'F30-F39' },
  { code: 'F41', description: 'Outros transtornos de ansiedade', chapter: 'V', block: 'F40-F48' },
  { code: 'G40', description: 'Epilepsia', chapter: 'VI', block: 'G40-G47' },
  { code: 'G43', description: 'Enxaqueca', chapter: 'VI', block: 'G40-G47' },
  { code: 'I10', description: 'Hipertensão arterial primária', chapter: 'IX', block: 'I10-I15' },
  { code: 'I25', description: 'Doença arterial coronariana crônica', chapter: 'IX', block: 'I20-I25' },
  { code: 'I50', description: 'Insuficiência cardíaca', chapter: 'IX', block: 'I50-I50' },
  { code: 'J06', description: 'Infecções agudas vias aéreas superiores', chapter: 'X', block: 'J00-J06' },
  { code: 'J18', description: 'Pneumonia por fungos', chapter: 'X', block: 'J09-J18' },
  { code: 'K21', description: 'Doença de refluxo gastroesofágica', chapter: 'XI', block: 'K20-K31' },
  { code: 'K80', description: 'Colelitíase', chapter: 'XI', block: 'K80-K87' },
  { code: 'M17', description: 'Artrose do joelho', chapter: 'XIII', block: 'M15-M19' },
  { code: 'M47', description: 'Espondilose', chapter: 'XIII', block: 'M40-M54' },
  { code: 'M54', description: 'Dorsalgia', chapter: 'XIII', block: 'M40-M54' },
  { code: 'M76', description: 'Enfermidades dos tecidos moles peritendinosos', chapter: 'XIII', block: 'M70-M79' },
  { code: 'N18', description: 'Insuficiência renal crônica', chapter: 'XIV', block: 'N17-N19' },
  { code: 'N39', description: 'Outros transtornos do trato urinário', chapter: 'XIV', block: 'N30-N39' },
  { code: 'O80', description: 'Parto normal', chapter: 'XV', block: 'O80-O84' },
  { code: 'Q21', description: 'Defeitos cardíacos congênitos', chapter: 'XVII', block: 'Q20-Q24' },
  { code: 'R50', description: 'Febre, não especificada', chapter: 'XVIII', block: 'R50-R69' },
  { code: 'S72', description: 'Fratura do fêmur', chapter: 'XIX', block: 'S70-S79' },
  { code: 'T78', description: 'Efeitos adversos, não classificados', chapter: 'XX', block: 'T66-T78' },
  { code: 'Z00', description: 'Exame geral e investigação', chapter: 'XXI', block: 'Z00-Z13' },
  { code: 'Z23', description: 'Necessidade de imunização', chapter: 'XXI', block: 'Z20-Z29' },
  { code: 'Z34', description: 'Supervisão de gravidez normal', chapter: 'XXI', block: 'Z30-Z39' },
  { code: 'Z72', description: 'Problemas associados ao estilo de vida', chapter: 'XXI', block: 'Z70-Z76' },
];

const drugCatalogData: DrugCatalogItem[] = [
  { id: 'drug_1', name: 'Paracetamol 500mg', activeIngredient: 'Paracetamol', presentation: 'Comprimido 500mg', manufacturer: 'Lab PY', category: 'Analgésico', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 1, pregnantCategory: 'B', breastfeedingSafe: true, commonDoseAdult: '500mg-1g a cada 6-8h', commonDosePediatric: '10-15mg/kg/dose a cada 6-8h', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_2', name: 'Ibuprofeno 600mg', activeIngredient: 'Ibuprofeno', presentation: 'Comprimido 600mg', manufacturer: 'Lab PY', category: 'AINE', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 6, pregnantCategory: 'C', breastfeedingSafe: false, commonDoseAdult: '200-600mg a cada 6-8h', commonDosePediatric: '5-10mg/kg/dose a cada 6-8h', route: 'oral', contraindications: ['úlcera péptica ativa', 'insuficiência renal grave'], sideEffects: [], interactions: [{ drugB: 'Losartana', severity: 'moderada', description: 'AINEs reduzem efeito anti-hipertensivo', recommendation: 'Monitorar PA' }] },
  { id: 'drug_3', name: 'Amoxicilina 500mg', activeIngredient: 'Amoxicilina', presentation: 'Cápsula 500mg', manufacturer: 'Lab PY', category: 'Antibiótico', controlledCategory: 'comum', requiresPrescription: true, minAgeMonths: 1, pregnantCategory: 'B', breastfeedingSafe: true, commonDoseAdult: '500mg a cada 8h', commonDosePediatric: '25-50mg/kg/dia fracionado', route: 'oral', contraindications: ['alergia a penicilinas'], sideEffects: [], interactions: [] },
  { id: 'drug_4', name: 'Losartana 50mg', activeIngredient: 'Losartana Potássica', presentation: 'Comprimido 50mg', manufacturer: 'Lab PY', category: 'Anti-hipertensivo', controlledCategory: 'comum', requiresPrescription: true, minAgeMonths: 144, pregnantCategory: 'D', breastfeedingSafe: false, commonDoseAdult: '50-100mg 1x/dia', commonDosePediatric: '', route: 'oral', contraindications: ['gravidez'], sideEffects: [], interactions: [] },
  { id: 'drug_5', name: 'Omeprazol 20mg', activeIngredient: 'Omeprazol', presentation: 'Cápsula 20mg', manufacturer: 'Lab PY', category: 'IBP', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 1, pregnantCategory: 'C', breastfeedingSafe: true, commonDoseAdult: '20mg 1x/dia', commonDosePediatric: '0.7-3.5mg/kg/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_6', name: 'Dipirona 500mg', activeIngredient: 'Dipirona Sódica', presentation: 'Comprimido 500mg', manufacturer: 'Lab PY', category: 'Analgésico', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 3, pregnantCategory: 'C', breastfeedingSafe: true, commonDoseAdult: '500mg-1g a cada 6h', commonDosePediatric: '10-15mg/kg/dose', route: 'oral', contraindications: ['asma induzida por AAS'], sideEffects: [], interactions: [] },
  { id: 'drug_7', name: 'Rivotril 2mg', activeIngredient: 'Clonazepam', presentation: 'Comprimido 2mg', manufacturer: 'Lab PY', category: 'Benzodiazepínico', controlledCategory: 'controlado', requiresPrescription: true, minAgeMonths: 0, pregnantCategory: 'D', breastfeedingSafe: false, commonDoseAdult: '0.5-4mg/dia', commonDosePediatric: '0.01-0.03mg/kg/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_8', name: 'Ritalina 10mg', activeIngredient: 'Metilfenidato', presentation: 'Comprimido 10mg', manufacturer: 'Lab PY', category: 'Psicoestimulante', controlledCategory: 'controlado', requiresPrescription: true, minAgeMonths: 36, pregnantCategory: 'C', breastfeedingSafe: false, commonDoseAdult: '10-20mg 2-3x/dia', commonDosePediatric: '5mg 2x/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_9', name: 'Sulfato Ferroso 40mg', activeIngredient: 'Sulfato Ferroso', presentation: 'Comprimido 40mg', manufacturer: 'Lab PY', category: 'Suplemento', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 0, pregnantCategory: 'A', breastfeedingSafe: true, commonDoseAdult: '40mg 1x/dia', commonDosePediatric: '3-6mg/kg/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_10', name: 'Ácido Fólico 5mg', activeIngredient: 'Ácido Fólico', presentation: 'Comprimido 5mg', manufacturer: 'Lab PY', category: 'Vitamina', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 0, pregnantCategory: 'A', breastfeedingSafe: true, commonDoseAdult: '5mg 1x/dia', commonDosePediatric: '0.1-0.4mg/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_11', name: 'Metformina 850mg', activeIngredient: 'Cloridrato de Metformina', presentation: 'Comprimido 850mg', manufacturer: 'Lab PY', category: 'Antidiabético', controlledCategory: 'comum', requiresPrescription: true, minAgeMonths: 144, pregnantCategory: 'B', breastfeedingSafe: true, commonDoseAdult: '850mg 2-3x/dia', commonDosePediatric: '', route: 'oral', contraindications: ['insuficiência renal grave'], sideEffects: [], interactions: [] },
  { id: 'drug_12', name: 'Azitromicina 500mg', activeIngredient: 'Azitromicina', presentation: 'Comprimido 500mg', manufacturer: 'Lab PY', category: 'Macrólido', controlledCategory: 'comum', requiresPrescription: true, minAgeMonths: 6, pregnantCategory: 'B', breastfeedingSafe: true, commonDoseAdult: '500mg 1x/dia por 3 dias', commonDosePediatric: '10mg/kg 1x/dia por 3 dias', route: 'oral', contraindications: ['alergia a macrólidos'], sideEffects: [], interactions: [] },
];

const timelineEventTypes = ['consulta', 'internacao', 'cirurgia', 'exame', 'prescricao', 'vacina', 'procedimento', 'alta', 'emergencia'] as const;

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
}: ClinicalModuleProps) => {
  const { t } = useI18n();

  // Patient selection
  const [selectedPatId, setSelectedPatId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientDropdownRef = React.useRef<HTMLDivElement>(null);

  // HCE Tabs
  const [hceTab, setHceTab] = useState<HCETab>('anamnese');

  // ─── ANAMNESE STATE ───
  const [anamnese, setAnamnese] = useState<Anamnese>({
    id: '', patientId: '', createdBy: '', createdAt: '', updatedAt: '',
    personalPathological: [], smoking: '', alcohol: '', physicalActivity: '',
    diet: '', sleep: '', familyHistory: [], allergies: [], currentMedications: [],
    surgicalHistory: [], gynecological: null, obstetric: null,
    occupation: '', maritalStatus: '', notes: '',
  });
  const [newAllergy, setNewAllergy] = useState<AllergyEntry>({ allergen: '', type: '', severity: '' as any, reaction: '' });
  const [newMedication, setNewMedication] = useState<MedicationEntry>({ name: '', dosage: '', frequency: '', route: 'oral', since: '' });
  const [newFamily, setNewFamily] = useState<FamilyHistoryEntry>({ relation: '', condition: '', age: undefined, deceased: false });
  const [newSurgery, setNewSurgery] = useState<SurgicalEntry>({ procedure: '', date: '', hospital: '', complications: '' });

  // ─── EXAME FÍSICO STATE ───
  const [physicalExam, setPhysicalExam] = useState<PhysicalExam>({
    id: '', patientId: '', createdBy: '', createdAt: '',
    vitalSigns: {}, examHeadNeck: '', examCardiovascular: '', examRespiratory: '',
    examAbdomen: '', examGenitourinary: '', examMusculoskeletal: '', examNeurological: '',
    examSkin: '', examEyes: '', examEars: '', examMouth: '', examRectal: '', examPsychiatric: '',
    generalAspect: '', notes: '',
  });

  // ─── SOAP STATE ───
  const [soapNote, setSoapNote] = useState<SoapNote>({
    id: '', patientId: '', createdBy: '', createdAt: '',
    subjective: '', objective: '', assessment: '', plan: '', notes: '',
  });

  // ─── CID-10 STATE ───
  const [cidSearch, setCidSearch] = useState('');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [newDiagnosis, setNewDiagnosis] = useState<Partial<Diagnosis>>({
    cid10Code: '', cid10Description: '', diagnosisType: 'principal', status: 'ativo', notes: '',
  });
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [editingExamRequest, setEditingExamRequest] = useState<ExamRequest | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

  // ─── PRESCRIPTION STATE ───
  const [drugSearch, setDrugSearch] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugCatalogItem | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    dosage: '', frequency: '', route: 'oral', duration: '', quantity: 1, unit: 'unidade', notes: '',
    prescriptionType: 'comum' as 'comum' | 'controlado' | 'arquivado',
  });
  const [pediatricWeight, setPediatricWeight] = useState('');
  const [pediatricDoseResult, setPediatricDoseResult] = useState('');

  // ─── EXAM REQUEST STATE ───
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [examRequestForm, setExamRequestForm] = useState({
    examType: 'laboratorio' as 'laboratorio' | 'imagem' | 'anatomia_patologica' | 'outro',
    examName: '', clinicalIndication: '', urgency: 'rotina' as 'rotina' | 'urgente' | 'emergencia',
  });

  // ─── PROCEDURE STATE ───
  const [procedureList, setProcedureList] = useState<Procedure[]>([]);
  const [procedureForm, setProcedureForm] = useState({
    procedureCode: '', procedureName: '', procedureCategory: '', quantity: 1, notes: '',
    status: 'programado' as 'programado' | 'em_execucao' | 'concluido' | 'cancelado',
  });

  // ─── ATTACHMENT STATE ───
  const [attachments, setAttachments] = useState<any[]>([]);

  // ─── SIGNATURE STATE ───
  const [signatures, setSignatures] = useState<ElectronicSignature[]>([]);

  // ─── TIMELINE STATE ───
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineFilterType, setTimelineFilterType] = useState<string>('all');
  const [timelineFilterDoctor, setTimelineFilterDoctor] = useState('');
  const [timelineAssignments, setTimelineAssignments] = useState<{ locationName: string; assignedAt: string; completedAt: string | null }[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // ─── SECURITY STATE ───
  const [breakGlassActive, setBreakGlassActive] = useState(false);
  const [breakGlassJustification, setBreakGlassJustification] = useState('');
  const [accessLogs, setAccessLogs] = useState<AccessControl[]>([]);

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

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  // ─── SEQUENTIAL ID COUNTERS ───
  const idCounters = React.useRef({
    anam: 0, pexam: 0, soap: 0, diag: 0, presc: 0, exam: 0, proc: 0, att: 0, sig: 0, aso: 0,
  });

  const nextId = useCallback((prefix: string) => {
    const key = prefix as keyof typeof idCounters.current;
    if (key in idCounters.current) {
      idCounters.current[key]++;
      return `${prefix}_${String(idCounters.current[key]).padStart(4, '0')}`;
    }
    return `${prefix}_${Date.now()}`;
  }, []);

  // Initialize counters from existing data
  useEffect(() => {
    if (!supabase || !selectedPatId) return;
    const initCounters = async () => {
      const tables = [
        { prefix: 'anam', table: 'anamnese' },
        { prefix: 'pexam', table: 'physical_exams' },
        { prefix: 'soap', table: 'soap_notes' },
        { prefix: 'diag', table: 'diagnoses' },
        { prefix: 'presc', table: 'prescriptions' },
        { prefix: 'exam', table: 'exam_requests' },
        { prefix: 'proc', table: 'procedures' },
        { prefix: 'att', table: 'clinical_attachments' },
        { prefix: 'sig', table: 'electronic_signatures' },
        { prefix: 'aso', table: 'aso_exams' },
      ];
      for (const { prefix, table } of tables) {
        const { data } = await supabase.from(table).select('id').order('created_at', { ascending: false }).limit(1);
        if (data && data.length > 0) {
          const match = data[0].id.match(/_(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            const key = prefix as keyof typeof idCounters.current;
            if (num > idCounters.current[key]) {
              idCounters.current[key] = num;
            }
          }
        }
      }
    };
    initCounters();
  }, [selectedPatId, supabase]);

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

    const patient = patients.find(p => p.id === patientId);
    const patientCivilStatus = patient?.civil_status || '';

    try {
      // Load anamnese
      const { data: anamneseData } = await supabase
        .from('anamnese')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anamneseData) {
        setAnamnese({
          id: anamneseData.id,
          patientId: anamneseData.patient_id,
          createdBy: anamneseData.created_by,
          createdAt: anamneseData.created_at,
          updatedAt: anamneseData.updated_at,
          personalPathological: anamneseData.personal_pathological || [],
          smoking: anamneseData.smoking || '',
          alcohol: anamneseData.alcohol || '',
          physicalActivity: anamneseData.physical_activity || '',
          diet: anamneseData.diet || '',
          sleep: anamneseData.sleep || '',
          familyHistory: anamneseData.family_history || [],
          allergies: anamneseData.allergies || [],
          currentMedications: anamneseData.current_medications || [],
          surgicalHistory: anamneseData.surgical_history || [],
          gynecological: anamneseData.gynecological || null,
          obstetric: anamneseData.obstetric || null,
          occupation: anamneseData.occupation || '',
          maritalStatus: patientCivilStatus || anamneseData.marital_status || '',
          notes: anamneseData.notes || '',
        });
      } else {
        const fresh = makeAnamnese(patientId);
        setAnamnese({ ...fresh, maritalStatus: patientCivilStatus });
      }

      // Load physical exam
      const { data: examData } = await supabase
        .from('physical_exams')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (examData) {
        setPhysicalExam({
          id: examData.id,
          patientId: examData.patient_id,
          clinicalHistoryId: examData.clinical_history_id,
          createdBy: examData.created_by,
          createdAt: examData.created_at,
          vitalSigns: examData.vital_signs || {},
          examHeadNeck: examData.exam_head_neck || '',
          examCardiovascular: examData.exam_cardiovascular || '',
          examRespiratory: examData.exam_respiratory || '',
          examAbdomen: examData.exam_abdomen || '',
          examGenitourinary: examData.exam_genitourinary || '',
          examMusculoskeletal: examData.exam_musculoskeletal || '',
          examNeurological: examData.exam_neurological || '',
          examSkin: examData.exam_skin || '',
          examEyes: examData.exam_eyes || '',
          examEars: examData.exam_ears || '',
          examMouth: examData.exam_mouth || '',
          examRectal: examData.exam_rectal || '',
          examPsychiatric: examData.exam_psychiatric || '',
          generalAspect: examData.general_aspect || '',
          notes: examData.notes || '',
        });
      } else {
        setPhysicalExam(makePhysicalExam(patientId));
      }

      // Load SOAP note
      const { data: soapData } = await supabase
        .from('soap_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (soapData) {
        setSoapNote({
          id: soapData.id,
          patientId: soapData.patient_id,
          clinicalHistoryId: soapData.clinical_history_id,
          createdBy: soapData.created_by,
          createdAt: soapData.created_at,
          subjective: soapData.subjective || '',
          objective: soapData.objective || '',
          assessment: soapData.assessment || '',
          plan: soapData.plan || '',
          notes: soapData.notes || '',
        });
      } else {
        setSoapNote(makeSoapNote(patientId));
      }

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
          clinicalHistoryId: d.clinical_history_id,
          createdBy: d.created_by,
          createdAt: d.created_at,
          cid10Code: d.cid10_code,
          cid10Description: d.cid10_description,
          snomedCode: d.snomed_code,
          snomedDescription: d.snomed_description,
          diagnosisType: d.diagnosis_type,
          status: d.status,
          notes: d.notes || '',
        })));
      }

      // Load prescriptions
      const { data: prescData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (prescData) {
        setPrescriptions(prescData.map(p => ({
          id: p.id,
          patientId: p.patient_id,
          clinicalHistoryId: p.clinical_history_id,
          createdBy: p.created_by,
          createdAt: p.created_at,
          prescriptionType: p.prescription_type,
          drugName: p.drug_name,
          activeIngredient: p.active_ingredient || '',
          dosage: p.dosage,
          frequency: p.frequency,
          route: p.route || 'oral',
          duration: p.duration || '',
          startDate: p.start_date,
          endDate: p.end_date,
          quantity: p.quantity || 1,
          unit: p.unit || 'unidade',
          refillCount: p.refill_count || 0,
          notes: p.notes || '',
          qrCodeData: p.qr_code_data || '',
          signedAt: p.signed_at,
          signatureId: p.signature_id,
          status: p.status,
        })));
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
          clinicalHistoryId: e.clinical_history_id,
          createdBy: e.created_by,
          createdAt: e.created_at,
          examType: e.exam_type,
          examName: e.exam_name,
          clinicalIndication: e.clinical_indication || '',
          urgency: e.urgency || 'rotina',
          status: e.status,
          resultNotes: e.result_notes || '',
          resultDate: e.result_date,
          resultFileUrl: e.result_file_url || '',
          resultFileName: e.result_file_name || '',
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
          clinicalHistoryId: p.clinical_history_id,
          createdBy: p.created_by,
          createdAt: p.created_at,
          procedureCode: p.procedure_code,
          procedureName: p.procedure_name,
          procedureCategory: p.procedure_category || '',
          quantity: p.quantity || 1,
          notes: p.notes || '',
          complications: p.complications || '',
          status: p.status,
          performedAt: p.performed_at,
          signedBy: p.signed_by,
          signedAt: p.signed_at,
          signatureId: p.signature_id,
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
          clinicalHistoryId: a.clinical_history_id,
          examRequestId: a.exam_request_id,
          createdBy: a.created_by,
          createdAt: a.created_at,
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
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error);
    }
  }, [makeAnamnese, makePhysicalExam, makeSoapNote, patients]);

  const loadTimelineData = useCallback(async (patientId: string) => {
    if (!supabase || !patientId) return;
    setTimelineLoading(true);
    try {
      const { data: allAssignments } = await supabase
        .from('patient_location_assignments')
        .select('*, hospital_locations!inner(name)')
        .eq('patient_id', patientId)
        .order('assigned_at', { ascending: true });
      if (allAssignments && allAssignments.length > 0) {
        setTimelineAssignments(allAssignments.map((a: any) => ({
          locationName: a.hospital_locations?.name || 'Local',
          assignedAt: a.assigned_at,
          completedAt: a.completed_at || null,
        })));
      } else {
        const { data: freshHistory } = await supabase
          .from('clinical_history')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: true });
        if (freshHistory && freshHistory.length > 0) {
          const meds = freshHistory.filter((h: any) => h.type === 'Consulta Médica' && h.location_name);
          if (meds.length > 0) {
            setTimelineAssignments(meds.map((m: any, i: number) => ({
              locationName: m.location_name,
              assignedAt: m.created_at || m.date,
              completedAt: meds[i + 1]?.created_at || null,
            })));
          } else {
            setTimelineAssignments([]);
          }
        } else {
          setTimelineAssignments([]);
        }
      }
    } catch (err) {
      console.error('[SUPABASE] Load timeline assignments FAILED:', err);
      setTimelineAssignments([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  // Load data when patient changes
  useEffect(() => {
    if (selectedPatId) {
      loadPatientData(selectedPatId);
      loadTimelineData(selectedPatId);
    }
  }, [selectedPatId, loadPatientData, loadTimelineData]);

  // Reset form when patient changes (moved from useEffect to event handler)
  const handlePatientChange = useCallback((newPatientId: string) => {
    setSelectedPatId(newPatientId);
  }, []);

  // ─── CID-10 LOOKUP ───
  const filteredCid10 = useMemo(() => {
    if (!cidSearch.trim()) return cid10Data;
    const q = cidSearch.toLowerCase();
    return cid10Data.filter(c => c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [cidSearch]);

  // ─── DRUG SEARCH ───
  const filteredDrugs = useMemo(() => {
    if (!drugSearch.trim()) return drugCatalogData;
    const q = drugSearch.toLowerCase();
    return drugCatalogData.filter(d =>
      d.name.toLowerCase().includes(q) || d.activeIngredient.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    );
  }, [drugSearch]);

  // ─── DRUG INTERACTIONS CHECK ───
  const checkDrugInteractions = useCallback((drugName: string) => {
    const activeDrugNames = prescriptions.map(p => p.drugName.split(' ')[0].toLowerCase());
    const searchDrug = drugName.split(' ')[0].toLowerCase();
    return drugInteractions.filter(i =>
      (i.drugB.toLowerCase().includes(searchDrug) && activeDrugNames.some(ad => ad.includes(i.drugB.toLowerCase()))) ||
      (activeDrugNames.some(ad => searchDrug.includes(ad)) && i.drugB.toLowerCase().includes(searchDrug))
    );
  }, [prescriptions]);

  // ─── PEDIATRIC DOSE CALCULATOR ───
  const calculatePediatricDose = useCallback(() => {
    if (!selectedDrug || !pediatricWeight) return;
    const weight = parseFloat(pediatricWeight);
    if (isNaN(weight) || weight <= 0) return;
    const doseStr = selectedDrug.commonDosePediatric;
    if (!doseStr) {
      setPediatricDoseResult('Dose pediátrica não disponível. Consulte bula.');
      return;
    }
    const match = doseStr.match(/(\d+\.?\d*)-(\d+\.?\d*)mg\/kg/);
    if (match) {
      const minDose = (parseFloat(match[1]) * weight).toFixed(1);
      const maxDose = (parseFloat(match[2]) * weight).toFixed(1);
      setPediatricDoseResult(`${minDose}mg - ${maxDose}mg por dose (${selectedDrug.route})`);
    } else {
      setPediatricDoseResult(doseStr);
    }
  }, [selectedDrug, pediatricWeight]);

  // ─── QR CODE GENERATION (simple hash) ───
  const generateQRData = useCallback((prescription: Prescription) => {
    const data = `${prescription.id}|${prescription.patientId}|${prescription.drugName}|${prescription.dosage}|${prescription.createdBy}|${prescription.createdAt}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `IAMED-PRESC-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  }, []);

  // ─── SAVE SIGNATURE (INSERT to Supabase) ───
  const handleSaveSignature = async (sig: ElectronicSignature) => {
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
  };

  // ─── SAVE ACCESS CONTROL (INSERT to Supabase) ───
  const handleSaveAccessControl = async (log: AccessControl) => {
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
      });
    }
  };

  // ─── SIGNATURE SIMULATION ───
  const handleSignDocument = useCallback((docType: string, docId: string) => {
    const sig: ElectronicSignature = {
      id: nextId('sig'),
      signerId: 'current_user',
      signerName: 'Dr. Atual',
      signerCouncil: 'CRM',
      signerCouncilNumber: 'CRM-PY 000000',
      createdAt: new Date().toISOString(),
      documentType: docType as any,
      documentId: docId,
      patientId: selectedPatient?.id || '',
      signatureHash: `SHA256:${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      certificateSerial: `CERT-${Date.now()}`,
      certificateIssuer: 'AC IAMED - Prestador Qualificado (PCSC)',
      signedAt: new Date().toISOString(),
      verificationCode: `VER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'valida',
      ipAddress: '192.168.1.1',
      userAgent: navigator.userAgent,
      timestampAuthority: 'IAMED-TSA',
      timestampToken: `TSA-${Date.now()}`,
    };
    handleSaveSignature(sig);
    return sig;
  }, [selectedPatient, handleSaveSignature]);

  // ─── BREAK THE GLASS ───
  const handleBreakGlass = useCallback(() => {
    if (!breakGlassJustification.trim()) return;
    const log: AccessControl = {
      id: `ac_${Date.now()}`,
      patientId: selectedPatient?.id || '',
      accessedBy: 'Operador Atual',
      accessedAt: new Date().toISOString(),
      accessType: 'break_the_glass',
      justification: breakGlassJustification,
      fieldsAccessed: ['hce_completo'],
      ipAddress: '192.168.1.1',
      notifiedPrivacyOfficer: false,
    };
    handleSaveAccessControl(log);
    setBreakGlassActive(false);
    setBreakGlassJustification('');
    addAuditLog('Quebra de Vidro (Emergência)', `Paciente: ${selectedPatient?.name}`);
  }, [breakGlassJustification, selectedPatient, addAuditLog, handleSaveAccessControl]);

  // ─── SAVE ANAMNESE ───
  const handleSaveAnamnese = async () => {
    const isEdit = !!anamnese.id;
    const entry: Anamnese = {
      ...anamnese,
      id: anamnese.id || nextId('anam'),
      patientId: selectedPatient?.id || '',
      createdBy: anamnese.createdBy || 'Dr. Atual',
      createdAt: anamnese.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAnamnese(entry);
    if (selectedPatient) {
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? {
        ...p,
        clinicalHistory: [
          { id: entry.id, date: entry.createdAt, type: 'Anamnese', diagnosis: entry.notes || 'Anamnese registrada', cid10: '', prescriptions: [], notes: entry.notes, doctor: entry.createdBy },
          ...p.clinicalHistory,
        ],
      } : p));
    }
    addAuditLog('Salvou Anamnese', selectedPatient?.name || '');
    if (supabase) {
      const dbRow = {
        id: entry.id,
        patient_id: entry.patientId,
        created_by: entry.createdBy,
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
  };

  // ─── DELETE ANAMNESE ───
  const handleDeleteAnamnese = async () => {
    if (!anamnese.id || !supabase) return;
    await supabase.from('anamnese').delete().eq('id', anamnese.id);
    setAnamnese(makeAnamnese(selectedPatient?.id || ''));
    addAuditLog('Excluiu Anamnese', selectedPatient?.name || '');
  };

  // ─── SAVE SOAP NOTE ───
  const handleSaveSoap = async () => {
    const isEdit = !!soapNote.id;
    const entry: SoapNote = {
      ...soapNote,
      id: soapNote.id || nextId('soap'),
      patientId: selectedPatient?.id || '',
      createdBy: soapNote.createdBy || 'Dr. Atual',
      createdAt: soapNote.createdAt || new Date().toISOString(),
    };
    setSoapNote(entry);
    if (selectedPatient) {
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? {
        ...p,
        clinicalHistory: [
          { id: entry.id, date: entry.createdAt, type: 'Evolução SOAP', diagnosis: entry.assessment || 'Evolução registrada', cid10: '', prescriptions: [], notes: `${entry.subjective} ${entry.objective} ${entry.plan}`, doctor: entry.createdBy },
          ...p.clinicalHistory,
        ],
      } : p));
    }
    addAuditLog('Salvou Evolução SOAP', selectedPatient?.name || '');
    if (supabase) {
      const dbRow = {
        id: entry.id,
        patient_id: entry.patientId,
        clinical_history_id: entry.clinicalHistoryId || null,
        created_by: entry.createdBy,
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
  };

  // ─── DELETE SOAP NOTE ───
  const handleDeleteSoap = async () => {
    if (!soapNote.id || !supabase) return;
    await supabase.from('soap_notes').delete().eq('id', soapNote.id);
    setSoapNote(makeSoapNote(selectedPatient?.id || ''));
    addAuditLog('Excluiu Evolução SOAP', selectedPatient?.name || '');
  };

  // ─── SAVE PRESCRIPTION ───
  const handleSavePrescription = async () => {
    if (!selectedDrug) return;
    const presc: Prescription = {
      id: nextId('presc'),
      patientId: selectedPatient?.id || '',
      createdBy: 'Dr. Atual',
      createdAt: new Date().toISOString(),
      prescriptionType: prescriptionForm.prescriptionType,
      drugName: selectedDrug.name,
      activeIngredient: selectedDrug.activeIngredient,
      dosage: prescriptionForm.dosage,
      frequency: prescriptionForm.frequency,
      route: prescriptionForm.route,
      duration: prescriptionForm.duration,
      startDate: new Date().toISOString().split('T')[0],
      quantity: prescriptionForm.quantity,
      unit: prescriptionForm.unit,
      refillCount: 0,
      notes: prescriptionForm.notes,
      qrCodeData: '',
      status: 'rascunho',
    };
    presc.qrCodeData = generateQRData(presc);
    setPrescriptions(prev => [presc, ...prescriptions]);
    setSelectedDrug(null);
    setDrugSearch('');
    addAuditLog('Prescrição Criada', `${presc.drugName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('prescriptions').insert({
        id: presc.id, patient_id: presc.patientId, created_by: presc.createdBy,
        prescription_type: presc.prescriptionType, drug_name: presc.drugName,
        active_ingredient: presc.activeIngredient, dosage: presc.dosage,
        frequency: presc.frequency, route: presc.route, duration: presc.duration,
        start_date: presc.startDate, quantity: presc.quantity, unit: presc.unit,
        refill_count: presc.refillCount, notes: presc.notes, qr_code_data: presc.qrCodeData,
        status: presc.status,
      });
    }
  };

  // ─── SIGN PRESCRIPTION ───
  const handleSignPrescription = async (prescId: string) => {
    setPrescriptions(prev => prev.map(p =>
      p.id === prescId ? { ...p, status: 'assinado', signedAt: new Date().toISOString() } : p
    ));
    handleSignDocument('prescricao', prescId);
    if (supabase) {
      await supabase.from('prescriptions').update({ status: 'assinado', signed_at: new Date().toISOString() }).eq('id', prescId);
    }
  };

  // ─── DELETE PRESCRIPTION ───
  const handleDeletePrescription = async (prescId: string) => {
    setPrescriptions(prev => prev.filter(p => p.id !== prescId));
    if (supabase) {
      await supabase.from('prescriptions').delete().eq('id', prescId);
    }
    addAuditLog('Excluiu Prescrição', prescId);
  };

  // ─── SAVE EXAM REQUEST ───
  const handleSaveExamRequest = async () => {
    const req: ExamRequest = {
      id: nextId('exam'),
      patientId: selectedPatient?.id || '',
      createdBy: 'Dr. Atual',
      createdAt: new Date().toISOString(),
      ...examRequestForm,
      status: 'solicitado',
      resultNotes: '',
      resultFileUrl: '',
      resultFileName: '',
    };
    setExamRequests(prev => [req, ...examRequests]);
    setExamRequestForm({ examType: 'laboratorio', examName: '', clinicalIndication: '', urgency: 'rotina' });
    addAuditLog('Solicitação de Exame', `${req.examName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('exam_requests').insert({
        id: req.id, patient_id: req.patientId, created_by: req.createdBy,
        exam_type: req.examType, exam_name: req.examName,
        clinical_indication: req.clinicalIndication, urgency: req.urgency,
        status: req.status,
      });
    }
  };

  // ─── DELETE EXAM REQUEST ───
  const handleDeleteExamRequest = async (examId: string) => {
    setExamRequests(prev => prev.filter(e => e.id !== examId));
    if (supabase) {
      await supabase.from('exam_requests').delete().eq('id', examId);
    }
    addAuditLog('Excluiu Solicitação de Exame', examId);
  };

  // ─── SAVE PROCEDURE ───
  const handleSaveProcedure = async () => {
    const proc: Procedure = {
      id: nextId('proc'),
      patientId: selectedPatient?.id || '',
      createdBy: 'Dr. Atual',
      createdAt: new Date().toISOString(),
      ...procedureForm,
      procedureCode: procedureForm.procedureCode,
      complications: '',
    };
    setProcedureList(prev => [proc, ...procedureList]);
    setProcedureForm({ procedureCode: '', procedureName: '', procedureCategory: '', quantity: 1, notes: '', status: 'programado' });
    addAuditLog('Procedimento Registrado', `${proc.procedureName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('procedures').insert({
        id: proc.id, patient_id: proc.patientId, created_by: proc.createdBy,
        procedure_code: proc.procedureCode, procedure_name: proc.procedureName,
        procedure_category: proc.procedureCategory, quantity: proc.quantity,
        notes: proc.notes, complications: proc.complications, status: proc.status,
      });
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
    addAuditLog('Atualizou Diagnóstico', `${diag.cid10Code} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('diagnoses').update({
        diagnosis_type: diag.diagnosisType,
        status: diag.status,
        notes: diag.notes,
        snomed_code: diag.snomedCode || null,
        snomed_description: diag.snomedDescription || null,
      }).eq('id', diag.id);
    }
  };

  // ─── UPDATE PRESCRIPTION ───
  const handleUpdatePrescription = async (presc: Prescription) => {
    setPrescriptions(prev => prev.map(p => p.id === presc.id ? presc : p));
    addAuditLog('Atualizou Prescrição', `${presc.drugName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('prescriptions').update({
        dosage: presc.dosage,
        frequency: presc.frequency,
        route: presc.route,
        duration: presc.duration,
        quantity: presc.quantity,
        unit: presc.unit,
        notes: presc.notes,
      }).eq('id', presc.id);
    }
  };

  // ─── UPDATE EXAM REQUEST ───
  const handleUpdateExamRequest = async (exam: ExamRequest) => {
    setExamRequests(prev => prev.map(e => e.id === exam.id ? exam : e));
    addAuditLog('Atualizou Solicitação de Exame', `${exam.examName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('exam_requests').update({
        status: exam.status,
        result_notes: exam.resultNotes,
        result_date: exam.resultDate || null,
      }).eq('id', exam.id);
    }
  };

  // ─── UPDATE PROCEDURE ───
  const handleUpdateProcedure = async (proc: Procedure) => {
    setProcedureList(prev => prev.map(p => p.id === proc.id ? proc : p));
    addAuditLog('Atualizou Procedimento', `${proc.procedureName} - ${selectedPatient?.name}`);
    if (supabase) {
      await supabase.from('procedures').update({
        status: proc.status,
        complications: proc.complications,
        performed_at: proc.performedAt || null,
      }).eq('id', proc.id);
    }
  };

  // ─── SAVE ATTACHMENT (INSERT to Supabase) ───
  const handleSaveAttachment = async (file: File) => {
    const att = {
      id: nextId('att'),
      patient_id: selectedPatient?.id || '',
      created_by: 'Operador Atual',
      file_name: file.name,
      file_path: `attachments/${selectedPatient?.id}/${file.name}`,
      file_size_bytes: file.size,
      mime_type: file.type || 'application/octet-stream',
      category: 'outro',
      description: '',
      is_sensitive: false,
    };
    setAttachments(prev => [{ ...att, createdAt: new Date().toISOString(), createdBy: att.created_by }, ...prev]);
    if (supabase) {
      await supabase.from('clinical_attachments').insert(att);
    }
    addAuditLog('Anexo Clínico Adicionado', `${file.name} - ${selectedPatient?.name}`);
  };

  // ─── DELETE ATTACHMENT (DELETE from Supabase) ───
  const handleDeleteAttachment = async (attId: string) => {
    setAttachments(prev => prev.filter((a: any) => a.id !== attId));
    if (supabase) {
      await supabase.from('clinical_attachments').delete().eq('id', attId);
    }
    addAuditLog('Excluiu Anexo Clínico', attId);
  };

  // ─── FILTERED TIMELINE ───
  const filteredTimeline = useMemo(() => {
    const events: PatientTimelineEvent[] = [];

    // Add existing clinical history as timeline events
    if (selectedPatient?.clinicalHistory) {
      selectedPatient.clinicalHistory.forEach(h => {
        events.push({
          id: h.id,
          patientId: selectedPatient.id,
          eventType: 'consulta',
          eventDate: h.date,
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

    // Add prescriptions as timeline events
    prescriptions.forEach(p => {
      events.push({
        id: p.id,
        patientId: p.patientId,
        eventType: 'prescricao',
        eventDate: p.createdAt,
        eventTitle: `Prescrição: ${p.drugName}`,
        eventDescription: `${p.dosage} - ${p.frequency} - ${p.route}`,
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
        eventTitle: `Exame: ${e.examName}`,
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
        eventTitle: `Procedimento: ${p.procedureName}`,
        eventDescription: p.notes,
        eventSource: 'procedure',
        eventSourceId: p.id,
        doctorName: p.createdBy,
        specialty: '',
        cid10Code: '',
      });
    });

    // Add anamnesis entries
    if (anamnese && anamnese.id && anamnese.patientId) {
      events.push({
        id: anamnese.id,
        patientId: anamnese.patientId,
        eventType: 'consulta',
        eventDate: anamnese.createdAt,
        eventTitle: 'Anamnese',
        eventDescription: anamnese.notes || `Alergias: ${anamnese.allergies.map(a => a.allergen).join(', ') || 'Nenhuma'}. Medicações: ${anamnese.currentMedications.map(m => m.name).join(', ') || 'Nenhuma'}.`,
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
        eventTitle: 'Evolução SOAP',
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
      if (timelineSearch) {
        const q = timelineSearch.toLowerCase();
        return e.eventTitle.toLowerCase().includes(q) || e.eventDescription.toLowerCase().includes(q) || e.cid10Code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedPatient, prescriptions, examRequests, procedureList, anamnese, soapNote, timelineSearch, timelineFilterType, timelineFilterDoctor]);

  // ─── ASO & CAT HANDLERS ───
  const handleCreateAso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asoPatient.trim()) return;
    const newAso: AsoExam = {
      id: nextId('aso'), patientName: asoPatient, type: asoType,
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
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
  const sectionCls = 'bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4';

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const statusMap: Record<string, string> = {
    agendado: 'Agendado', aguardando: 'Aguardando', triado: 'Triado',
    atendimento: 'Atendimento', atendido: 'Atendido', internado: 'Internado',
    scheduled: 'Agendado', waiting: 'Aguardando', triaged: 'Triado',
    'in progress': 'Atendimento', active: 'Atendimento', attended: 'Atendido',
    hospitalized: 'Internado', admitted: 'Internado',
  };
  const translateStatus = (s: string) => statusMap[s.toLowerCase()] || s;

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
                      onClick={() => { setSelectedPatId(''); setPatientSearch(''); setPatientDropdownOpen(false); }}
                      className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer font-semibold border-b border-slate-100"
                    >
                      {t('agenda_select', 'app')}
                    </div>
                    {filteredPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPatId(p.id); setPatientSearch(''); setPatientDropdownOpen(false); }}
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
                    <p className="text-teal-700">📅 {formatDateBR(selectedPatient.birthdate)}</p>
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
                  const triageEntry = selectedPatient?.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                  const nonTriageEntries = (selectedPatient?.clinicalHistory || []).filter((h: any) => !h.type?.includes('Triagem'));
                  if (timelineAssignments.length === 0 && !triageEntry && nonTriageEntries.length === 0) {
                    return <p className="text-xs text-slate-400">{t('no_records', 'app')}</p>;
                  }
                  return (
                    <>
                      {triageEntry && (
                        <div className="relative text-xs">
                          <span className="absolute -left-[17px] top-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
                          <p className="font-bold text-slate-800">{t('hce_timeline_triage', 'app')}</p>
                          <p className="text-[10px] text-slate-400">{triageEntry.date ? formatDateBR(triageEntry.date) : '—'}</p>
                        </div>
                      )}
                      {timelineAssignments.length > 0 ? (
                        <>
                          {timelineAssignments.map((a, idx) => {
                            const isLast = idx === timelineAssignments.length - 1;
                            const isFinished = selectedPatient?.status === 'atendido';
                            return (
                            <div key={idx} className="relative text-xs">
                              <div className="flex flex-col items-center absolute -left-[17px] top-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
                                <span className="w-0.5 flex-1 bg-slate-200"></span>
                              </div>
                              <p className="font-bold text-slate-800">🏥 {a.locationName}</p>
                              <p className="text-[10px] text-slate-400">{t('rcpt_timeline_entry', 'app')} {new Date(a.assignedAt).toLocaleString()}</p>
                              {a.completedAt ? (
                                <p className="text-[10px] text-slate-400">{t('rcpt_timeline_exit', 'app')} {new Date(a.completedAt).toLocaleString()}</p>
                              ) : isLast && isFinished ? (
                                <p className="text-[10px] text-slate-400">{t('rcpt_timeline_exit', 'app')} —</p>
                              ) : (
                                <p className="text-[10px] text-amber-500 font-semibold">{t('rcpt_timeline_ongoing', 'app')}</p>
                              )}
                            </div>
                            );
                          })}
                          {(timelineAssignments[timelineAssignments.length - 1]?.completedAt || selectedPatient?.status === 'atendido') && (
                            <div className="relative text-xs">
                              <span className="absolute -left-[17px] top-1 w-2 h-2 bg-green-600 rounded-full border border-white" />
                              <p className="font-bold text-green-700">{t('rcpt_timeline_visit_completed', 'app')}</p>
                              <p className="text-[10px] text-slate-400">
                                {(() => {
                                  const last = timelineAssignments[timelineAssignments.length - 1];
                                  const completedTime = last?.completedAt || last?.assignedAt;
                                  return completedTime ? new Date(completedTime).toLocaleString() : '—';
                                })()}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        nonTriageEntries.slice(0, 5).map(entry => (
                          <div key={entry.id} className="relative text-xs">
                            <span className="absolute -left-[17px] top-1 w-2 h-2 bg-teal-500 rounded-full border border-white" />
                            <p className="font-black text-slate-800">{formatDateBR(entry.date)}</p>
                            <p className="text-[10px] text-teal-700 font-bold">{entry.type}</p>
                            <p className="text-slate-600 mt-0.5 line-clamp-2">{entry.notes}</p>
                          </div>
                        ))
                      )}
                    </>
                  );
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
                      <button key={tab.key} onClick={() => setHceTab(tab.key)}
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
                      <button key={tab.key} onClick={() => setHceTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition whitespace-nowrap cursor-pointer
                          ${hceTab === tab.key ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Icon className="w-3.5 h-3.5" /> {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ TAB: ANAMNESE ═══ */}
              {hceTab === 'anamnese' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" /> {t('hce_anamnese_title', 'app')}
                  </h3>

                  {!selectedPatId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">{t('agenda_alert_select_patient', 'app') || 'Selecione um paciente para preencher a anamnese.'}</p>
                    </div>
                  ) : (<>


                  {/* Smoking / Alcohol / Exercise */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>{t('hce_smoking', 'app')}</label>
                      <select value={anamnese.smoking} onChange={e => setAnamnese(p => ({ ...p, smoking: e.target.value }))} className={inputCls}>
                        <option value="">{t('agenda_select', 'app')}</option>
                        <option value="sim">Sim</option>
                        <option value="não">Não</option>
                        <option value="ex-fumante">Ex-fumante</option>
                        <option value="nunca-fumou">Nunca fumou</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_alcohol', 'app')}</label>
                      <select value={anamnese.alcohol} onChange={e => setAnamnese(p => ({ ...p, alcohol: e.target.value }))} className={inputCls}>
                        <option value="">{t('agenda_select', 'app')}</option>
                        <option value="não">Não</option>
                        <option value="ocasional">Ocasional</option>
                        <option value="frequente">Frequente</option>
                        <option value="ex-etilista">Ex-etilista</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_physical_activity', 'app')}</label>
                      <select value={anamnese.physicalActivity} onChange={e => setAnamnese(p => ({ ...p, physicalActivity: e.target.value }))} className={inputCls}>
                        <option value="">{t('agenda_select', 'app')}</option>
                        <option value="não">Não</option>
                        <option value="leve">Leve</option>
                        <option value="moderada">Moderada</option>
                        <option value="intensa">Intensa</option>
                      </select>
                    </div>
                  </div>

                  {/* Social */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t('hce_profession', 'app')}</label>
                      <input type="text" value={anamnese.occupation} onChange={e => setAnamnese(p => ({ ...p, occupation: e.target.value }))} className={inputCls} placeholder={t('hce_profession_placeholder', 'app') || 'Ex: Engenheiro'} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_marital_status', 'app')}</label>
                      <select value={anamnese.maritalStatus} disabled className={`${inputCls} bg-slate-100 text-slate-500 cursor-not-allowed appearance-none`}>
                        <option value="">Selecione...</option>
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                        <option value="União Estável">União Estável</option>
                      </select>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    <h5 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {t('hce_allergies', 'app')}
                    </h5>
                    <div className="grid grid-cols-4 gap-2">
                      <input type="text" placeholder={t('hce_allergen', 'app')} value={newAllergy.allergen} onChange={e => setNewAllergy(p => ({ ...p, allergen: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_allergy_type', 'app')} value={newAllergy.type} onChange={e => setNewAllergy(p => ({ ...p, type: e.target.value }))} className={inputCls} />
                      <select value={newAllergy.severity} onChange={e => setNewAllergy(p => ({ ...p, severity: e.target.value as any }))} className={inputCls}>
                        <option value="">{t('agenda_select', 'app')}</option>
                        <option value="leve">Leve</option>
                        <option value="moderada">Moderada</option>
                        <option value="grave">Grave</option>
                      </select>
                      <div className="flex gap-1">
                        <input type="text" placeholder={t('hce_reaction', 'app')} value={newAllergy.reaction} onChange={e => setNewAllergy(p => ({ ...p, reaction: e.target.value }))} className={inputCls} />
                      </div>
                    </div>
                    <button type="button" onClick={() => {
                      const missing = [];
                      if (!newAllergy.allergen.trim()) missing.push('Alérgeno');
                      if (!newAllergy.severity) missing.push('Severidade');
                      if (missing.length > 0) {
                        alert(`Preencha: ${missing.join(', ')}`);
                        return;
                      }
                      setAnamnese(p => ({ ...p, allergies: [...p.allergies, newAllergy] }));
                      setNewAllergy({ allergen: '', type: '', severity: '' as any, reaction: '' });
                    }} className="text-xs text-teal-600 font-bold flex items-center gap-1 cursor-pointer hover:text-teal-800">
                      <Plus className="w-3 h-3" /> {t('hce_add_allergy', 'app')}
                    </button>
                    {anamnese.allergies.length > 0 && (
                      <div className="space-y-1">
                        {anamnese.allergies.map((a, i) => (
                          <div key={i} className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-rose-800">{a.allergen}</span>
                            <span className="text-rose-600">{a.type} - {a.severity} - {a.reaction}</span>
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
                    <div className="grid grid-cols-5 gap-2">
                      <input type="text" placeholder={t('hce_medication', 'app') || 'Medicamento'} value={newMedication.name} onChange={e => setNewMedication(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_dosage', 'app') || 'Dosagem'} value={newMedication.dosage} onChange={e => setNewMedication(p => ({ ...p, dosage: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_frequency', 'app') || 'Frequência'} value={newMedication.frequency} onChange={e => setNewMedication(p => ({ ...p, frequency: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_since', 'app') || 'Desde'} value={newMedication.since} onChange={e => setNewMedication(p => ({ ...p, since: e.target.value }))} className={inputCls} />
                      <button type="button" onClick={() => {
                        const missing = [];
                        if (!newMedication.name.trim()) missing.push('Medicamento');
                        if (!newMedication.frequency.trim()) missing.push('Frequência');
                        if (missing.length > 0) {
                          alert(`Preencha: ${missing.join(', ')}`);
                          return;
                        }
                        setAnamnese(p => ({ ...p, currentMedications: [...p.currentMedications, newMedication] }));
                        setNewMedication({ name: '', dosage: '', frequency: '', route: 'oral', since: '' });
                      }} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 rounded-lg font-bold flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
                    </div>
                    {anamnese.currentMedications.length > 0 && (
                      <div className="space-y-1">
                        {anamnese.currentMedications.map((m, i) => (
                          <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-blue-800">{m.name}</span>
                            <span className="text-blue-600">{m.dosage} - {m.frequency}</span>
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
                      <input type="number" placeholder={t('hce_age', 'app')} value={newFamily.age || ''} onChange={e => setNewFamily(p => ({ ...p, age: parseInt(e.target.value) || undefined }))} className={inputCls} />
                      <button type="button" onClick={() => {
                        const missing = [];
                        if (!newFamily.relation.trim()) missing.push('Parentesco');
                        if (!newFamily.condition.trim()) missing.push('Condição');
                        if (missing.length > 0) {
                          alert(`Preencha: ${missing.join(', ')}`);
                          return;
                        }
                        setAnamnese(p => ({ ...p, familyHistory: [...p.familyHistory, newFamily] }));
                        setNewFamily({ relation: '', condition: '', age: undefined, deceased: false });
                      }} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 rounded-lg font-bold flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
                    </div>
                    {anamnese.familyHistory.length > 0 && (
                      <div className="space-y-1">
                        {anamnese.familyHistory.map((f, i) => (
                          <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-amber-800">{f.relation}</span>
                            <span className="text-amber-600">{f.condition}{f.age ? ` - ${f.age} anos` : ''}</span>
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
                      <input type="text" placeholder={t('hce_procedure', 'app') || 'Procedimento'} value={newSurgery.procedure} onChange={e => setNewSurgery(p => ({ ...p, procedure: e.target.value }))} className={inputCls} />
                      <I18nDatePicker value={newSurgery.date} onChange={v => setNewSurgery(p => ({ ...p, date: v }))} className={inputCls} />
                      <input type="text" placeholder={t('hce_hospital', 'app')} value={newSurgery.hospital} onChange={e => setNewSurgery(p => ({ ...p, hospital: e.target.value }))} className={inputCls} />
                      <button type="button" onClick={() => {
                        if (!newSurgery.procedure.trim()) {
                          alert('Preencha: Procedimento');
                          return;
                        }
                        setAnamnese(p => ({ ...p, surgicalHistory: [...p.surgicalHistory, newSurgery] }));
                        setNewSurgery({ procedure: '', date: '', hospital: '', complications: '' });
                      }} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 rounded-lg font-bold flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
                    </div>
                    {anamnese.surgicalHistory.length > 0 && (
                      <div className="space-y-1">
                        {anamnese.surgicalHistory.map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-purple-800">{s.procedure}</span>
                            <span className="text-purple-600">{formatDateBR(s.date)} - {s.hospital}</span>
                            <button onClick={() => setAnamnese(p => ({ ...p, surgicalHistory: p.surgicalHistory.filter((_, j) => j !== i) }))} className="text-purple-500 hover:text-purple-700"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={labelCls}>{t('hce_notes', 'app') || 'Observações'}</label>
                    <textarea value={anamnese.notes} onChange={e => setAnamnese(p => ({ ...p, notes: e.target.value }))} rows={3} className={textareaCls} placeholder={t('hce_notes_placeholder', 'app') || 'Observações adicionais da anamnese...'} />
                  </div>

                  <div className="flex justify-end gap-2">
                    {anamnese.id && (
                      <button onClick={handleDeleteAnamnese} className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs transition">
                        {t('hce_delete', 'app') || 'Excluir'}
                      </button>
                    )}
                    <button onClick={handleSaveAnamnese} className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                      {t('hce_save_anamnese', 'app') || 'Salvar Anamnese'}
                    </button>
                  </div>
                  </>)}
                </div>
              )}

              {/* ═══ TAB: EXAME FÍSICO ═══ */}
              {hceTab === 'exam' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" /> {t('hce_physical_exam_title', 'app')}
                  </h3>

                  {/* Vital Signs */}
                  <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                    <h5 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-red-500" /> {t('hce_vital_signs', 'app')}
                    </h5>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className={labelCls}>{t('hce_weight', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.weight || ''} onChange={e => setPhysicalExam(p => ({ ...p, vitalSigns: { ...p.vitalSigns, weight: e.target.value } }))} className={inputCls} placeholder="kg" />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_height', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.height || ''} onChange={e => setPhysicalExam(p => ({ ...p, vitalSigns: { ...p.vitalSigns, height: e.target.value } }))} className={inputCls} placeholder="cm" />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_blood_pressure', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.bloodPressure || ''} onChange={e => setPhysicalExam(p => ({ ...p, vitalSigns: { ...p.vitalSigns, bloodPressure: e.target.value } }))} className={inputCls} placeholder="120/80" />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_temperature', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.temperature || ''} onChange={e => setPhysicalExam(p => ({ ...p, vitalSigns: { ...p.vitalSigns, temperature: e.target.value } }))} className={inputCls} placeholder="36.5" />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_spo2', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.spo2 || ''} onChange={e => setPhysicalExam(p => ({ ...p, vitalSigns: { ...p.vitalSigns, spo2: e.target.value } }))} className={inputCls} placeholder="98" />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_heart_rate', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.heartRate || ''} onChange={e => setPhysicalExam(p => ({ ...p, vitalSigns: { ...p.vitalSigns, heartRate: e.target.value } }))} className={inputCls} placeholder="bpm" />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_respiratory_rate', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.respiratoryRate || ''} onChange={e => setPhysicalExam(p => ({ ...p, vitalSigns: { ...p.vitalSigns, respiratoryRate: e.target.value } }))} className={inputCls} placeholder="irpm" />
                      </div>
                      <div>
                        <label className={labelCls}>{t('hce_bmi', 'app')}</label>
                        <input type="text" value={physicalExam.vitalSigns.imc || ''} onChange={e => setPhysicalExam(p => ({ ...p, vitalSigns: { ...p.vitalSigns, imc: e.target.value } }))} className={inputCls} placeholder="kg/m²" />
                      </div>
                    </div>
                  </div>

                  {/* General Aspect */}
                  <div>
                    <label className={labelCls}>{t('hce_general_aspect', 'app')}</label>
                    <input type="text" value={physicalExam.generalAspect} onChange={e => setPhysicalExam(p => ({ ...p, generalAspect: e.target.value }))} className={inputCls} placeholder="Ex: Bom estado geral, consciente, orientado" />
                  </div>

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
                      { key: 'examPsychiatric', label: t('hce_psychiatric', 'app') },
                    ].map(field => (
                      <div key={field.key}>
                        <label className={labelCls}>{field.label}</label>
                        <textarea
                          value={(physicalExam as any)[field.key] || ''}
                          onChange={e => setPhysicalExam(p => ({ ...p, [field.key]: e.target.value }))}
                          rows={2}
                          className={textareaCls}
                          placeholder={`Descreva o exame de ${field.label.toLowerCase()}...`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    {physicalExam.id && (
                      <button onClick={async () => {
                        if (supabase && physicalExam.id) {
                          await supabase.from('physical_exams').delete().eq('id', physicalExam.id);
                        }
                        setPhysicalExam(makePhysicalExam(selectedPatient?.id || ''));
                        addAuditLog('Excluiu Exame Físico', selectedPatient?.name || '');
                      }}
                        className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs transition">
                        Excluir
                      </button>
                    )}
                    <button onClick={async () => {
                      const isEdit = !!physicalExam.id;
                      const entry: PhysicalExam = {
                        ...physicalExam,
                        id: physicalExam.id || nextId('pexam'),
                        patientId: selectedPatient?.id || '',
                        createdBy: physicalExam.createdBy || 'Dr. Atual',
                        createdAt: physicalExam.createdAt || new Date().toISOString(),
                      };
                      setPhysicalExam(entry);
                      if (selectedPatient) {
                        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? {
                          ...p,
                          clinicalHistory: [
                            { id: entry.id, date: entry.createdAt, type: 'Exame Físico', diagnosis: 'Exame físico registrado', cid10: '', prescriptions: [], notes: entry.notes, doctor: entry.createdBy },
                            ...p.clinicalHistory,
                          ],
                        } : p));
                      }
                      addAuditLog('Salvou Exame Físico', selectedPatient?.name || '');
                      if (supabase) {
                        const dbRow = {
                          id: entry.id, patient_id: entry.patientId, created_by: entry.createdBy,
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
                    }}
                      className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                      Salvar Exame Físico
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ TAB: SOAP ═══ */}
              {hceTab === 'soap' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-teal-600" /> {t('hce_soap_title', 'app')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`${labelCls} text-blue-700`}>{t('hce_subjective', 'app')}</label>
                      <textarea value={soapNote.subjective} onChange={e => setSoapNote(p => ({ ...p, subjective: e.target.value }))} rows={5} className={textareaCls} placeholder="Queixa principal do paciente, em suas próprias palavras..." />
                    </div>
                    <div>
                      <label className={`${labelCls} text-green-700`}>{t('hce_objective', 'app')}</label>
                      <textarea value={soapNote.objective} onChange={e => setSoapNote(p => ({ ...p, objective: e.target.value }))} rows={5} className={textareaCls} placeholder="Dados objetivos: sinais vitais, exame físico, achados clínicos..." />
                    </div>
                    <div>
                      <label className={`${labelCls} text-amber-700`}>{t('hce_assessment', 'app')}</label>
                      <textarea value={soapNote.assessment} onChange={e => setSoapNote(p => ({ ...p, assessment: e.target.value }))} rows={5} className={textareaCls} placeholder="Hipótese diagnóstica, CID-10, raciocínio clínico..." />
                    </div>
                    <div>
                      <label className={`${labelCls} text-purple-700`}>{t('hce_plan', 'app')}</label>
                      <textarea value={soapNote.plan} onChange={e => setSoapNote(p => ({ ...p, plan: e.target.value }))} rows={5} className={textareaCls} placeholder="Conduta terapêutica, prescrições, exames solicitados, retorno..." />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Observações Adicionais</label>
                    <textarea value={soapNote.notes} onChange={e => setSoapNote(p => ({ ...p, notes: e.target.value }))} rows={2} className={textareaCls} />
                  </div>
                  <div className="flex justify-end gap-2">
                    {soapNote.id && (
                      <button onClick={handleDeleteSoap} className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs transition">
                        Excluir
                      </button>
                    )}
                    <button onClick={handleSaveSoap} className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                      Salvar Evolução SOAP
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ TAB: DIAGNOSTICOS CID-10 ═══ */}
              {hceTab === 'diagnoses' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4 text-teal-600" /> Diagnósticos CID-10 / CIE-10
                  </h3>
                  {/* CID-10 Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" value={cidSearch} onChange={e => setCidSearch(e.target.value)} placeholder={t('hce_cid10_lookup', 'app')}
                      className={`${inputCls} pl-9`} />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                    {filteredCid10.slice(0, 20).map(c => (
                      <div key={c.code} onClick={() => setNewDiagnosis(p => ({ ...p, cid10Code: c.code, cid10Description: c.description }))}
                        className="px-3 py-2 hover:bg-teal-50 cursor-pointer flex items-center justify-between text-xs transition">
                        <span className="font-bold text-teal-700">{c.code}</span>
                        <span className="text-slate-600 flex-1 ml-2">{c.description}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Cap. {c.chapter}</span>
                      </div>
                    ))}
                  </div>
                  {/* Add Diagnosis Form */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className={labelCls}>{t('hce_cid10_code', 'app')}</label>
                      <input type="text" value={newDiagnosis.cid10Code} onChange={e => setNewDiagnosis(p => ({ ...p, cid10Code: e.target.value }))} className={inputCls} readOnly />
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_cid10_description', 'app')}</label>
                      <input type="text" value={newDiagnosis.cid10Description || ''} onChange={e => setNewDiagnosis(p => ({ ...p, cid10Description: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_diagnosis_type', 'app')}</label>
                      <select value={newDiagnosis.diagnosisType} onChange={e => setNewDiagnosis(p => ({ ...p, diagnosisType: e.target.value as any }))} className={inputCls}>
                        <option value="principal">{t('hce_diagnosis_principal', 'app')}</option>
                        <option value="secundário">{t('hce_diagnosis_secundario', 'app')}</option>
                        <option value="diferencial">{t('hce_diagnosis_diferencial', 'app')}</option>
                        <option value="presuntivo">{t('hce_diagnosis_presuntivo', 'app')}</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_snomed_code', 'app')}</label>
                      <input type="text" value={newDiagnosis.snomedCode || ''} onChange={e => setNewDiagnosis(p => ({ ...p, snomedCode: e.target.value }))} className={inputCls} placeholder="SNOMED-CT" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={async () => {
                      if (newDiagnosis.cid10Code) {
                        const diagId = nextId('diag');
                        const newDiag = { ...newDiagnosis, id: diagId, patientId: selectedPatient?.id || '', createdBy: 'Dr. Atual', createdAt: new Date().toISOString(), status: newDiagnosis.status || 'ativo', notes: newDiagnosis.notes || '' } as Diagnosis;
                        setDiagnoses(prev => [...prev, newDiag]);
                        setNewDiagnosis({ cid10Code: '', cid10Description: '', diagnosisType: 'principal', status: 'ativo', notes: '' });
                        if (supabase) {
                          await supabase.from('diagnoses').insert({
                            id: diagId, patient_id: selectedPatient?.id || '', created_by: 'Dr. Atual',
                            cid10_code: newDiag.cid10Code, cid10_description: newDiag.cid10Description,
                            snomed_code: newDiag.snomedCode || null, snomed_description: newDiag.snomedDescription || null,
                            diagnosis_type: newDiag.diagnosisType, status: newDiag.status, notes: newDiag.notes,
                          });
                        }
                      }
                    }} className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-4 py-2 rounded-lg font-bold">
                      Adicionar Diagnóstico
                    </button>
                  </div>
                  {/* Diagnoses List */}
                  <div className="space-y-2">
                    {diagnoses.map(d => (
                      editingDiagnosis?.id === d.id ? (
                        <div key={d.id} className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className={labelCls}>{t('hce_diagnosis_type', 'app')}</label>
                              <select value={editingDiagnosis.diagnosisType} onChange={e => setEditingDiagnosis(p => p ? { ...p, diagnosisType: e.target.value as any } : null)} className={inputCls}>
                                <option value="principal">{t('hce_diagnosis_principal', 'app')}</option>
                                <option value="secundário">{t('hce_diagnosis_secundario', 'app')}</option>
                                <option value="diferencial">{t('hce_diagnosis_diferencial', 'app')}</option>
                                <option value="presuntivo">{t('hce_diagnosis_presuntivo', 'app')}</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Status</label>
                              <select value={editingDiagnosis.status} onChange={e => setEditingDiagnosis(p => p ? { ...p, status: e.target.value as any } : null)} className={inputCls}>
                                <option value="ativo">Ativo</option>
                                <option value="em_tratamento">Em Tratamento</option>
                                <option value="crônico">Crônico</option>
                                <option value="resolvido">Resolvido</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>SNOMED-CT</label>
                              <input type="text" value={editingDiagnosis.snomedCode || ''} onChange={e => setEditingDiagnosis(p => p ? { ...p, snomedCode: e.target.value } : null)} className={inputCls} placeholder="SNOMED-CT" />
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Observações</label>
                            <input type="text" value={editingDiagnosis.notes} onChange={e => setEditingDiagnosis(p => p ? { ...p, notes: e.target.value } : null)} className={inputCls} />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingDiagnosis(null)} className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg">Cancelar</button>
                            <button onClick={() => editingDiagnosis && handleUpdateDiagnosis(editingDiagnosis)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg">Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-teal-700">{d.cid10Code}</span>
                            <span className="text-slate-600 ml-2">{d.cid10Description}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.diagnosisType === 'principal' ? 'bg-teal-100 text-teal-700' :
                              d.diagnosisType === 'secundário' ? 'bg-blue-100 text-blue-700' :
                              d.diagnosisType === 'diferencial' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>{d.diagnosisType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.status === 'ativo' ? 'bg-rose-100 text-rose-700' :
                              d.status === 'em_tratamento' ? 'bg-amber-100 text-amber-700' :
                              d.status === 'crônico' ? 'bg-purple-100 text-purple-700' :
                              'bg-green-100 text-green-700'
                            }`}>{d.status}</span>
                            <button onClick={() => setEditingDiagnosis(d)} className="text-teal-500 hover:text-teal-700"><Sliders className="w-3 h-3" /></button>
                            <button onClick={async () => {
                              setDiagnoses(prev => prev.filter(x => x.id !== d.id));
                              if (supabase) {
                                await supabase.from('diagnoses').delete().eq('id', d.id);
                              }
                            }} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TAB: PRESCRIPTIONS ═══ */}
              {hceTab === 'prescriptions' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" /> Receituário Eletrônico
                  </h3>

                  {/* Drug Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" value={drugSearch} onChange={e => setDrugSearch(e.target.value)} placeholder={t('hce_drug_search', 'app')}
                      className={`${inputCls} pl-9`} />
                  </div>
                  <div className="max-h-[180px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                    {filteredDrugs.slice(0, 10).map(d => (
                      <div key={d.id} onClick={() => setSelectedDrug(d)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition ${selectedDrug?.id === d.id ? 'bg-teal-100 border-l-3 border-teal-600' : 'hover:bg-slate-50'}`}>
                        <div>
                          <span className="font-bold text-slate-800">{d.name}</span>
                          <span className="text-slate-500 ml-2">{d.activeIngredient}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${d.controlledCategory === 'controlado' ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                            {d.controlledCategory === 'controlado' ? 'CONTROLADO' : 'COMUM'}
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{d.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedDrug && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-teal-800">{selectedDrug.name}</p>
                          <p className="text-xs text-teal-600">{selectedDrug.activeIngredient} | {selectedDrug.presentation}</p>
                        </div>
                        <button onClick={() => setSelectedDrug(null)} className="text-teal-500 hover:text-teal-700"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>

                      {/* Drug Info */}
                      {selectedDrug.contraindications.length > 0 && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                          <p className="font-bold text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Contraindicações:</p>
                          <p className="text-amber-700">{selectedDrug.contraindications.join(', ')}</p>
                        </div>
                      )}

                      {/* Prescription Form */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className={labelCls}>{t('hce_dosage', 'app')}</label>
                          <input type="text" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm(p => ({ ...p, dosage: e.target.value }))} className={inputCls} placeholder="Ex: 500mg" />
                        </div>
                        <div>
                          <label className={labelCls}>{t('hce_frequency', 'app')}</label>
                          <input type="text" value={prescriptionForm.frequency} onChange={e => setPrescriptionForm(p => ({ ...p, frequency: e.target.value }))} className={inputCls} placeholder="Ex: 8/8h" />
                        </div>
                        <div>
                          <label className={labelCls}>{t('hce_route', 'app')}</label>
                          <select value={prescriptionForm.route} onChange={e => setPrescriptionForm(p => ({ ...p, route: e.target.value }))} className={inputCls}>
                            <option value="oral">Oral</option>
                            <option value="venoso">Intravenoso</option>
                            <option value="intramuscular">Intramuscular</option>
                            <option value="topico">Tópico</option>
                            <option value="sublingual">Sublingual</option>
                            <option value="retal">Retal</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>{t('hce_duration', 'app')}</label>
                          <input type="text" value={prescriptionForm.duration} onChange={e => setPrescriptionForm(p => ({ ...p, duration: e.target.value }))} className={inputCls} placeholder="Ex: 7 dias" />
                        </div>
                        <div>
                          <label className={labelCls}>Quantidade</label>
                          <input type="number" value={prescriptionForm.quantity} onChange={e => setPrescriptionForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className={inputCls} min={1} />
                        </div>
                        <div>
                          <label className={labelCls}>{t('hce_prescription_type', 'app')}</label>
                          <select value={prescriptionForm.prescriptionType} onChange={e => setPrescriptionForm(p => ({ ...p, prescriptionType: e.target.value as any }))} className={inputCls}>
                            <option value="comum">{t('hce_prescription_comum', 'app')}</option>
                            <option value="controlado">{t('hce_prescription_controlado', 'app')}</option>
                            <option value="arquivado">{t('hce_prescription_arquivado', 'app')}</option>
                          </select>
                        </div>
                      </div>

                      {/* Pediatric Dose Calculator */}
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                        <p className="text-xs font-bold text-blue-800 flex items-center gap-1"><Baby className="w-3 h-3" /> {t('hce_calculate_dose', 'app')}</p>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className={labelCls}>{t('hce_patient_weight', 'app')}</label>
                            <input type="number" value={pediatricWeight} onChange={e => setPediatricWeight(e.target.value)} className={inputCls} placeholder="kg" step="0.1" />
                          </div>
                          <button type="button" onClick={calculatePediatricDose} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1">
                            <Calculator className="w-3 h-3" /> Calcular
                          </button>
                        </div>
                        {pediatricDoseResult && (
                          <p className="text-xs font-bold text-blue-700 bg-blue-100 p-2 rounded-lg">{pediatricDoseResult}</p>
                        )}
                      </div>

                      {/* Drug Interactions Warning */}
                      {(() => {
                        const interactions = checkDrugInteractions(selectedDrug.name);
                        if (interactions.length === 0) return null;
                        return (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                            {interactions.map((int, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                  int.severity === 'grave' ? 'text-red-600' :
                                  int.severity === 'moderada' ? 'text-amber-600' : 'text-yellow-600'
                                }`} />
                                <div>
                                  <p className="font-bold text-rose-800">Interação {int.severity}: {int.description}</p>
                                  <p className="text-rose-600">{int.recommendation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      <button onClick={handleSavePrescription} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                        Adicionar ao Receituário
                      </button>
                    </div>
                  )}

                  {/* Prescriptions List */}
                  <div className="space-y-2">
                    {prescriptions.map(p => (
                      editingPrescription?.id === p.id ? (
                        <div key={p.id} className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className={labelCls}>{t('hce_dosage', 'app')}</label>
                              <input type="text" value={editingPrescription.dosage} onChange={e => setEditingPrescription(prev => prev ? { ...prev, dosage: e.target.value } : null)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>{t('hce_frequency', 'app')}</label>
                              <input type="text" value={editingPrescription.frequency} onChange={e => setEditingPrescription(prev => prev ? { ...prev, frequency: e.target.value } : null)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>{t('hce_route', 'app')}</label>
                              <select value={editingPrescription.route} onChange={e => setEditingPrescription(prev => prev ? { ...prev, route: e.target.value } : null)} className={inputCls}>
                                <option value="oral">Oral</option>
                                <option value="venoso">Intravenoso</option>
                                <option value="intramuscular">Intramuscular</option>
                                <option value="topico">Tópico</option>
                                <option value="sublingual">Sublingual</option>
                                <option value="retal">Retal</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>{t('hce_duration', 'app')}</label>
                              <input type="text" value={editingPrescription.duration} onChange={e => setEditingPrescription(prev => prev ? { ...prev, duration: e.target.value } : null)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Quantidade</label>
                              <input type="number" value={editingPrescription.quantity} onChange={e => setEditingPrescription(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 1 } : null)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Unidade</label>
                              <input type="text" value={editingPrescription.unit} onChange={e => setEditingPrescription(prev => prev ? { ...prev, unit: e.target.value } : null)} className={inputCls} />
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Observações</label>
                            <input type="text" value={editingPrescription.notes} onChange={e => setEditingPrescription(prev => prev ? { ...prev, notes: e.target.value } : null)} className={inputCls} />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingPrescription(null)} className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg">Cancelar</button>
                            <button onClick={() => editingPrescription && handleUpdatePrescription(editingPrescription)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg">Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <div key={p.id} className={`p-3 border rounded-xl flex items-center justify-between text-xs ${
                          p.status === 'assinado' ? 'bg-green-50 border-green-200' :
                          p.status === 'rascunho' ? 'bg-slate-50 border-slate-200' :
                          p.status === 'cancelado' ? 'bg-rose-50 border-rose-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800">💊 {p.drugName} — {p.dosage} | {p.frequency} | {p.route}</p>
                            <p className="text-slate-500">Duração: {p.duration} | Qtd: {p.quantity} {p.unit} | {p.prescriptionType.toUpperCase()}</p>
                            {p.qrCodeData && <p className="text-[9px] text-slate-400 font-mono">QR: {p.qrCodeData}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'assinado' ? 'bg-green-100 text-green-700' :
                              p.status === 'rascunho' ? 'bg-slate-100 text-slate-700' :
                              p.status === 'cancelado' ? 'bg-rose-100 text-rose-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>{t(`hce_prescription_${p.status}`, 'app')}</span>
                            {p.status === 'rascunho' && (
                              <>
                                <button onClick={() => setEditingPrescription(p)} className="text-teal-500 hover:text-teal-700"><Sliders className="w-3 h-3" /></button>
                                <button onClick={() => handleSignPrescription(p.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                                  <FileSignature className="w-3 h-3" /> Assinar
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDeletePrescription(p.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TAB: EXAM REQUESTS ═══ */}
              {hceTab === 'exams' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Scan className="w-4 h-4 text-teal-600" /> {t('hce_exam_request_title', 'app')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t('hce_exam_type', 'app')}</label>
                      <select value={examRequestForm.examType} onChange={e => setExamRequestForm(p => ({ ...p, examType: e.target.value as any }))} className={inputCls}>
                        <option value="laboratorio">{t('hce_exam_laboratorio', 'app')}</option>
                        <option value="imagem">{t('hce_exam_imagem', 'app')}</option>
                        <option value="anatomia_patologica">{t('hce_exam_anatomia', 'app')}</option>
                        <option value="outro">{t('hce_exam_outro', 'app')}</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_exam_name', 'app')}</label>
                      <input type="text" value={examRequestForm.examName} onChange={e => setExamRequestForm(p => ({ ...p, examName: e.target.value }))} className={inputCls} placeholder="Ex: Hemograma Completo" />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>{t('hce_clinical_indication', 'app')}</label>
                      <textarea value={examRequestForm.clinicalIndication} onChange={e => setExamRequestForm(p => ({ ...p, clinicalIndication: e.target.value }))} rows={2} className={textareaCls} placeholder="Indicação clínica para o exame..." />
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_urgency', 'app')}</label>
                      <select value={examRequestForm.urgency} onChange={e => setExamRequestForm(p => ({ ...p, urgency: e.target.value as any }))} className={inputCls}>
                        <option value="rotina">{t('hce_urgency_rotina', 'app')}</option>
                        <option value="urgente">{t('hce_urgency_urgente', 'app')}</option>
                        <option value="emergencia">{t('hce_urgency_emergencia', 'app')}</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleSaveExamRequest} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                        Solicitar Exame
                      </button>
                    </div>
                  </div>

                  {/* Exam Requests List */}
                  <div className="space-y-2">
                    {examRequests.map(e => (
                      editingExamRequest?.id === e.id ? (
                        <div key={e.id} className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className={labelCls}>Status</label>
                              <select value={editingExamRequest.status} onChange={ev => setEditingExamRequest(prev => prev ? { ...prev, status: ev.target.value as any } : null)} className={inputCls}>
                                <option value="solicitado">Solicitado</option>
                                <option value="em_andamento">Em Andamento</option>
                                <option value="concluido">Concluído</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className={labelCls}>Resultado / Observações</label>
                              <textarea value={editingExamRequest.resultNotes} onChange={ev => setEditingExamRequest(prev => prev ? { ...prev, resultNotes: ev.target.value } : null)} rows={3} className={textareaCls} placeholder="Descreva os resultados do exame..." />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingExamRequest(null)} className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg">Cancelar</button>
                            <button onClick={() => editingExamRequest && handleUpdateExamRequest({ ...editingExamRequest, resultDate: editingExamRequest.status === 'concluido' ? new Date().toISOString() : editingExamRequest.resultDate })} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg">Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <div key={e.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{e.examName}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                e.status === 'concluido' ? 'bg-green-100 text-green-700' :
                                e.status === 'solicitado' ? 'bg-amber-100 text-amber-700' :
                                e.status === 'cancelado' ? 'bg-rose-100 text-rose-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>{e.status}</span>
                              <button onClick={() => setEditingExamRequest(e)} className="text-teal-500 hover:text-teal-700"><Sliders className="w-3 h-3" /></button>
                              <button onClick={() => handleDeleteExamRequest(e.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <p className="text-slate-500">Tipo: {e.examType} | Urgência: {e.urgency}</p>
                          <p className="text-slate-500">Indicação: {e.clinicalIndication}</p>
                          {e.resultNotes && <p className="text-green-600 font-bold">Resultado: {e.resultNotes}</p>}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TAB: PROCEDURES ═══ */}
              {hceTab === 'procedures' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" /> {t('hce_procedure_title', 'app')}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>{t('hce_procedure_code', 'app')}</label>
                      <input type="text" value={procedureForm.procedureCode} onChange={e => setProcedureForm(p => ({ ...p, procedureCode: e.target.value }))} className={inputCls} placeholder="Ex: 10101012" />
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_procedure_name', 'app')}</label>
                      <input type="text" value={procedureForm.procedureName} onChange={e => setProcedureForm(p => ({ ...p, procedureName: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_procedure_category', 'app')}</label>
                      <select value={procedureForm.procedureCategory} onChange={e => setProcedureForm(p => ({ ...p, procedureCategory: e.target.value }))} className={inputCls}>
                        <option value="">Selecione...</option>
                        <option value="Consulta">Consulta</option>
                        <option value="Procedimento">Procedimento</option>
                        <option value="Laboratório">Laboratório</option>
                        <option value="Imagem">Imagem</option>
                        <option value="Fisioterapia">Fisioterapia</option>
                        <option value="Enfermagem">Enfermagem</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>{t('hce_procedure_quantity', 'app')}</label>
                      <input type="number" value={procedureForm.quantity} onChange={e => setProcedureForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className={inputCls} min={1} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('hce_procedure_status', 'app')}</label>
                      <select value={procedureForm.status} onChange={e => setProcedureForm(p => ({ ...p, status: e.target.value as any }))} className={inputCls}>
                        <option value="programado">{t('hce_procedure_programado', 'app')}</option>
                        <option value="em_execucao">{t('hce_procedure_em_execucao', 'app')}</option>
                        <option value="concluido">{t('hce_procedure_concluido', 'app')}</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleSaveProcedure} className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition">
                        Registrar Procedimento
                      </button>
                    </div>
                  </div>
                  {/* Procedures List */}
                  <div className="space-y-2">
                    {procedureList.map(p => (
                      editingProcedure?.id === p.id ? (
                        <div key={p.id} className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className={labelCls}>Status</label>
                              <select value={editingProcedure.status} onChange={ev => setEditingProcedure(prev => prev ? { ...prev, status: ev.target.value as any } : null)} className={inputCls}>
                                <option value="programado">Programado</option>
                                <option value="em_execucao">Em Execução</option>
                                <option value="concluido">Concluído</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className={labelCls}>Complicações</label>
                              <input type="text" value={editingProcedure.complications} onChange={ev => setEditingProcedure(prev => prev ? { ...prev, complications: ev.target.value } : null)} className={inputCls} placeholder="Descreva complicações, se houver..." />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingProcedure(null)} className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg">Cancelar</button>
                            <button onClick={() => editingProcedure && handleUpdateProcedure({ ...editingProcedure, performedAt: editingProcedure.status === 'concluido' ? new Date().toISOString() : editingProcedure.performedAt })} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg">Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{p.procedureCode} — {p.procedureName}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.status === 'concluido' ? 'bg-green-100 text-green-700' :
                                p.status === 'em_execucao' ? 'bg-blue-100 text-blue-700' :
                                p.status === 'cancelado' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>{p.status}</span>
                              <button onClick={() => setEditingProcedure(p)} className="text-teal-500 hover:text-teal-700"><Sliders className="w-3 h-3" /></button>
                              <button onClick={() => handleDeleteProcedure(p.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TAB: ATTACHMENTS ═══ */}
              {hceTab === 'attachments' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-teal-600" /> {t('hce_attachment_title', 'app')}
                  </h3>
                  <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-teal-400 transition cursor-pointer">
                    <Paperclip className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Arraste arquivos aqui ou clique para selecionar</p>
                    <p className="text-[10px] text-slate-400 mt-1">Suporta: PDF, DICOM, JPEG, PNG, MP4, WAV (máx. 50MB)</p>
                    <input type="file" className="hidden" accept=".pdf,.dcm,.jpg,.jpeg,.png,.mp4,.wav" multiple onChange={e => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(f => {
                        handleSaveAttachment(f);
                      });
                    }} />
                  </div>
                  <div className="space-y-2">
                    {attachments.map((a: any) => (
                      <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <div>
                            <p className="font-bold text-slate-800">{a.fileName}</p>
                            <p className="text-[10px] text-slate-400">{a.mimeType} | {(a.fileSizeBytes / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteAttachment(a.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TAB: SIGNATURES ═══ */}
              {hceTab === 'signatures' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-teal-600" /> {t('hce_signature_title', 'app')}
                  </h3>
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-700">
                    <p className="font-bold">{t('hce_signature_info', 'app')}</p>
                    <p className="mt-1">Compatível com dispositivos criptográficos (token USB) e assinatura em nuvem (HSM).</p>
                    <p>Equivalência jurídica com assinatura manuscrita conforme art. 6º da Lei 6822/2021.</p>
                  </div>
                  <div className="space-y-2">
                    {signatures.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Nenhuma assinatura registrada. Assine prescrições, laudos ou documentos clínicos.</p>
                    ) : (
                      signatures.map(s => (
                        <div key={s.id} className={`p-3 border rounded-xl text-xs space-y-1 ${
                          s.status === 'valida' ? 'bg-green-50 border-green-200' :
                          s.status === 'revogada' ? 'bg-rose-50 border-rose-200' :
                          'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{s.documentType}: {s.documentId}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'valida' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                            }`}>{s.status === 'valida' ? t('hce_signature_valid', 'app') : s.status === 'revogada' ? t('hce_signature_revoked', 'app') : t('hce_signature_expired', 'app')}</span>
                          </div>
                          <p className="text-slate-500">Assinante: {s.signerName} | {s.signerCouncil} {s.signerCouncilNumber}</p>
                          <p className="text-slate-500">Emitido por: {s.certificateIssuer}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Hash: {s.signatureHash.substring(0, 40)}...</p>
                          <p className="text-[9px] text-slate-400 font-mono">Verificação: {s.verificationCode} | TSA: {s.timestampAuthority}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ═══ TAB: TIMELINE ═══ */}
              {hceTab === 'timeline' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" /> {t('hce_timeline_title', 'app')}
                  </h3>

                  {/* Filters */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
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
                    <button className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1">
                      <Printer className="w-3 h-3" /> {t('hce_timeline_export_pdf', 'app')}
                    </button>
                  </div>

                  {timelineLoading ? (
                    <p className="text-xs text-slate-400 text-center py-8">{t('loading', 'app')}</p>
                  ) : (
                    <div className="space-y-0">
                      {/* Triage Event */}
                      {(() => {
                        const triageEntry = selectedPatient?.clinicalHistory?.find((h: any) => h.type?.includes('Triagem'));
                        const filteredByDoctor = timelineFilterDoctor && !triageEntry?.doctor?.toLowerCase().includes(timelineFilterDoctor.toLowerCase());
                        const filteredByType = timelineFilterType !== 'all';
                        if (!triageEntry || filteredByDoctor || filteredByType) return null;
                        return (
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                              <div className="w-0.5 flex-1 bg-slate-200"></div>
                            </div>
                            <div className="pb-4 flex-1">
                              <p className="text-xs font-bold text-slate-800">{t('hce_timeline_triage', 'app')}</p>
                              <p className="text-[10px] text-slate-400">
                                {triageEntry.triaged_at ? new Date(triageEntry.triaged_at).toLocaleString() : triageEntry.date ? formatDateBR(triageEntry.date.split('T')[0]) : '—'}
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
                        );
                      })()}

                      {/* Location Assignments with Medical Data */}
                      {(() => {
                        const usedEventIds = new Set<string>();
                        const allMeds = (selectedPatient?.clinicalHistory || [])
                          .filter((h: any) => h.type === 'Consulta Médica')
                          .sort((a: any, b: any) => new Date(a.created_at || a.date || 0).getTime() - new Date(b.created_at || b.date || 0).getTime());

                        if (timelineAssignments.length === 0) return null;

                        return timelineAssignments.map((assignment, idx) => {
                          let filteredByDoctor = false;
                          let filteredByType = false;
                          if (timelineFilterDoctor) {
                            const medsHere = allMeds.filter((h: any) => h.location_name === assignment.locationName);
                            filteredByDoctor = medsHere.length > 0 && !medsHere.some((h: any) => (h.doctor || '').toLowerCase().includes(timelineFilterDoctor.toLowerCase()));
                          }
                          if (timelineFilterType !== 'all') {
                            filteredByType = true;
                          }
                          if (filteredByDoctor && !filteredByType) return null;

                          const isLast = idx === timelineAssignments.length - 1;
                          const isFinished = selectedPatient?.status === 'atendido';
                          const locationMeds = allMeds.filter((h: any) => h.location_name === assignment.locationName && !usedEventIds.has(h.id));
                          const med = locationMeds[0] || null;
                          if (med) usedEventIds.add(med.id);
                          return (
                            <div key={idx} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                                <div className="w-0.5 flex-1 bg-slate-200"></div>
                              </div>
                              <div className="pb-4 flex-1">
                                <p className="text-xs font-bold text-slate-800">🏥 {assignment.locationName}</p>
                                <p className="text-[10px] text-slate-400">
                                  {t('rcpt_timeline_entry', 'app')} {new Date(assignment.assignedAt).toLocaleString()}
                                </p>
                                {assignment.completedAt ? (
                                  <p className="text-[10px] text-slate-400">
                                    {t('rcpt_timeline_exit', 'app')} {new Date(assignment.completedAt).toLocaleString()}
                                  </p>
                                ) : isLast && isFinished ? (
                                  <p className="text-[10px] text-slate-400">{t('rcpt_timeline_exit', 'app')} —</p>
                                ) : (
                                  <p className="text-[10px] text-amber-500 font-semibold">{t('rcpt_timeline_ongoing', 'app')}</p>
                                )}
                                {med && (
                                  <div className="mt-1.5 text-[10px] text-slate-500 space-y-0.5 border-l-2 border-blue-200 pl-2">
                                    {med.diagnosis && (
                                      <p>• <span className="font-semibold">{t('rcpt_timeline_diagnosis', 'app')}</span> {med.diagnosis}</p>
                                    )}
                                    {med.cid10 && med.cid10 !== 'Z00.0' && (
                                      <p>• <span className="font-semibold">{t('rcpt_timeline_cid10', 'app')}</span> {med.cid10}</p>
                                    )}
                                    {med.prescriptions && med.prescriptions.length > 0 && med.prescriptions[0] !== 'Nenhum procedimento' && (
                                      <p>• <span className="font-semibold">{t('rcpt_timeline_prescription', 'app')}</span> {med.prescriptions.join(', ')}</p>
                                    )}
                                    {med.notes && med.notes !== 'Paciente atendido e orientado.' && (
                                      <p>• <span className="font-semibold">{t('rcpt_timeline_medical_notes', 'app')}</span> {med.notes}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}

                      {/* Remaining consultations without location */}
                      {(() => {
                        if (timelineAssignments.length > 0) return null;
                        return filteredTimeline.map(evt => (
                          <div key={evt.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                evt.eventType === 'emergencia' ? 'bg-red-500' :
                                evt.eventType === 'prescricao' ? 'bg-blue-500' :
                                evt.eventType === 'exame' ? 'bg-purple-500' :
                                evt.eventType === 'procedimento' ? 'bg-amber-500' :
                                'bg-teal-500'
                              }`}></div>
                              <div className="w-0.5 flex-1 bg-slate-200"></div>
                            </div>
                            <div className="pb-4 flex-1">
                              <p className="text-xs font-bold text-slate-800">{evt.eventTitle}</p>
                              <p className="text-[10px] text-slate-400">{formatDateBR(evt.eventDate.split('T')[0])} | {evt.doctorName}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{evt.eventDescription}</p>
                              {evt.cid10Code && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold mt-1 inline-block">CID: {evt.cid10Code}</span>
                              )}
                            </div>
                          </div>
                        ));
                      })()}

                      {/* Visit Completed */}
                      {timelineAssignments.length > 0 && (timelineAssignments[timelineAssignments.length - 1]?.completedAt || selectedPatient?.status === 'atendido') && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-green-600 flex-shrink-0"></div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-green-700">{t('rcpt_timeline_visit_completed', 'app')}</p>
                            <p className="text-[10px] text-slate-400">
                              {(() => {
                                const last = timelineAssignments[timelineAssignments.length - 1];
                                const completedTime = last?.completedAt || last?.assignedAt;
                                return completedTime ? new Date(completedTime).toLocaleString() : '—';
                              })()}
                            </p>
                          </div>
                        </div>
                      )}

                      {timelineAssignments.length === 0 && filteredTimeline.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">{t('hce_timeline_no_history', 'app')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: SECURITY ═══ */}
              {hceTab === 'security' && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-600" /> {t('hce_tab_security', 'app')}
                  </h3>

                  {/* Break the Glass */}
                  <div className={`p-4 rounded-xl border ${breakGlassActive ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-800 flex items-center gap-2">
                        {breakGlassActive ? <Unlock className="w-4 h-4 text-rose-600" /> : <Lock className="w-4 h-4 text-slate-600" />}
                        {t('hce_break_glass', 'app')}
                      </h5>
                      <button onClick={() => setBreakGlassActive(!breakGlassActive)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${breakGlassActive ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                        {breakGlassActive ? 'ATIVADO' : 'ATIVAR'}
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
                            <span className="text-[10px] text-slate-500">{log.accessedAt.split('T')[0]}</span>
                          </div>
                          <p className="text-rose-600">{t('hce_justification', 'app')}: {log.justification}</p>
                          <p className="text-slate-500">{t('hce_accessed_by', 'app')}: {log.accessedBy}</p>
                        </div>
                      ))
                    )}
                  </div>
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
                <h3 className="font-semibold text-slate-800 text-base">Laudar Novo Exame</h3>
              </div>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className={labelCls}>Paciente</label>
                <select value={selectedPatId} onChange={e => handlePatientChange(e.target.value)} className={inputCls}>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tipo de Exame</label>
                  <select value={selectedExamType} onChange={e => {
                    setSelectedExamType(e.target.value);
                    if (e.target.value === 'Raio-X Tórax') setSelectedImageUrl('https://picsum.photos/seed/xray/600/400');
                    else if (e.target.value === 'Ressonância') setSelectedImageUrl('https://picsum.photos/seed/mri/600/400');
                    else setSelectedImageUrl('https://picsum.photos/seed/ct/600/400');
                  }} className={inputCls}>
                    <option value="Raio-X Tórax">Raio-X Tórax</option>
                    <option value="Ressonância">Ressonância Magnética</option>
                    <option value="Tomografia">Tomografia Computadorizada</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <div className="p-2.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg font-bold text-center text-xs">
                    {t('hce_awaiting_report', 'app')}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Observações</label>
                <textarea value={laboratoryNotes} onChange={e => setLaboratoryNotes(e.target.value)} rows={4} className={textareaCls}
                  placeholder="Ex: Área cardiopulmonar preservada..." />
              </div>
              <button onClick={() => { addAuditLog('Emissão Laudo', `${selectedExamType} de ${selectedPatient?.name}`); alert('Laudo salvo!'); setLaboratoryNotes(''); }}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs">
                Salvar Laudo
              </button>
            </div>
          </div>
          <div className={sectionCls + ' lg:col-span-2 space-y-4'}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-base">IAMED PACS Radiológico</h4>
                <p className="text-xs text-slate-500">Visualizador de imagens diagnósticas</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs font-bold bg-slate-100 py-1 px-2.5 rounded text-slate-600">ID: PACS_8390</span>
                <span className="text-xs font-bold bg-teal-50 text-teal-700 py-1 px-2.5 rounded border border-teal-100">ONLINE</span>
              </div>
            </div>
            <div className="relative bg-black rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 h-[320px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImageUrl} alt="PACS" referrerPolicy="no-referrer"
                style={{ filter: `contrast(${imageContrast}%) brightness(${imageBrightness}%) grayscale(100%)` }}
                className="object-cover max-h-full max-w-full transition duration-150" />
              <div className="absolute top-3 left-3 bg-black/70 p-2 rounded-md font-mono text-[9px] text-teal-400 space-y-0.5 pointer-events-none">
                <p>NOME: {selectedPatient?.name.toUpperCase()}</p>
                <p>EXAME: {selectedExamType.toUpperCase()}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-600 w-16">Contraste:</span>
                <input type="range" min="50" max="180" value={imageContrast} onChange={e => setImageContrast(Number(e.target.value))} className="flex-1 accent-teal-600" />
                <span className="w-10 text-right font-bold">{imageContrast}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-600 w-16">Brilho:</span>
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
            <form onSubmit={handleCreateAso} className="space-y-4 text-xs">
              <div>
                <label className={labelCls}>{t('hce_employee', 'app')} *</label>
                <input type="text" value={asoPatient} onChange={e => setAsoPatient(e.target.value)} placeholder={t('hce_full_name', 'app')} className={inputCls} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('hce_aso_type', 'app')}</label>
                  <select value={asoType} onChange={e => setAsoType(e.target.value as any)} className={inputCls}>
                    <option value="Admissional">Admissional</option>
                    <option value="Periódico">Periódico</option>
                    <option value="Demissional">Demissional</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('hce_opinion', 'app')}</label>
                  <select value={asoStatus} onChange={e => setAsoStatus(e.target.value as any)} className={inputCls}>
                    <option value="apto">APTO</option>
                    <option value="inapto">INAPTO</option>
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
              <h3 className="font-semibold text-slate-800 text-base">Emitir CAT</h3>
            </div>
            <form onSubmit={handleRegisterCat} className="space-y-4 text-xs">
              <div>
                <label className={labelCls}>Trabalhador Acidentado *</label>
                <input type="text" value={catEmployee} onChange={e => setCatEmployee(e.target.value)} placeholder="Nome" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Data do Ocorrido</label>
                <I18nDatePicker value={catDate} onChange={setCatDate} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Natureza da Lesão</label>
                <textarea value={catNotes} onChange={e => setCatNotes(e.target.value)} rows={4} className={textareaCls} placeholder="Descreva..." required />
              </div>
              <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg">
                Registrar CAT
              </button>
              {catRegistered && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg font-bold flex items-center gap-2 animate-pulse">
                  <Check className="w-4 h-4 text-green-600" /> CAT registrada com sucesso!
                </div>
              )}
            </form>
          </div>
          <div className={sectionCls}>
            <h4 className="font-bold text-slate-800 text-sm">Controle de EPI</h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Protetores Auriculares</p>
                  <p className="text-[10px] text-slate-500">CA: 12.389</p>
                </div>
                <span className="py-1 px-2.5 bg-green-50 text-green-700 border border-green-200 font-semibold rounded">Estoque OK</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Cinturões NR-35</p>
                  <p className="text-[10px] text-slate-500">CA: 44.910</p>
                </div>
                <span className="py-1 px-2.5 bg-red-50 text-red-700 border border-red-200 font-semibold rounded animate-pulse">Revisão Pendente</span>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex gap-3 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">NR-35 & PCMSO</p>
                  <p className="mt-1 font-medium text-amber-800">
                    Todo trabalhador em altura superior a 2m deve possuir ASO válido.
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
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">Editar ASO</h3>
            </div>
            <div className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Paciente</label>
                <p className="font-bold text-slate-800">{editingAso.patientName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de ASO</label>
                  <select
                    value={editingAso.type}
                    onChange={e => setEditingAso(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Admissional">Admissional</option>
                    <option value="Periódico">Periódico</option>
                    <option value="Demissional">Demissional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Parecer</label>
                  <select
                    value={editingAso.status}
                    onChange={e => setEditingAso(prev => prev ? { ...prev, status: e.target.value as 'apto' | 'inapto' } : null)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="apto">APTO</option>
                    <option value="inapto">INAPTO</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Riscos Ocupacionais</label>
                <input
                  type="text"
                  value={editingAso.risks.join(', ')}
                  onChange={e => setEditingAso(prev => prev ? { ...prev, risks: e.target.value.split(',').map(r => r.trim()) } : null)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder="Separar por vírgula"
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
                  Salvar Alterações
                </button>
                <button onClick={() => setEditingAso(null)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
