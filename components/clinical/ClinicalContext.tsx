import type { Patient, AsoExam, Cid10Code, Prescription, ExamRequest, Procedure, Anamnese, SoapNote, Diagnosis, PhysicalExam, VitalSigns, AllergyEntry, MedicationEntry, FamilyHistoryEntry, SurgicalEntry, ElectronicSignature, AccessControl, PatientTimelineEvent, DrugCatalogItem } from '@/lib/mockData';
import { nationalProcedures, sensitiveFieldConfig } from '@/lib/mockData';

export type { Patient, AsoExam, Cid10Code, Prescription, ExamRequest, Procedure, Anamnese, SoapNote, Diagnosis, PhysicalExam, VitalSigns, AllergyEntry, MedicationEntry, FamilyHistoryEntry, SurgicalEntry, ElectronicSignature, AccessControl, PatientTimelineEvent, DrugCatalogItem };

export type HCETab = 'anamnese' | 'exam' | 'soap' | 'diagnoses' | 'prescriptions' | 'exams' | 'procedures' | 'attachments' | 'signatures' | 'timeline' | 'security';

export interface ClinicalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  asos: AsoExam[];
  setAsos: React.Dispatch<React.SetStateAction<AsoExam[]>>;
  userPermissions?: string[];
  activeOperator?: string;
}

export const TIMELINE_EVENT_TYPES = ['consulta', 'internacao', 'cirurgia', 'exame', 'prescricao', 'vacina', 'procedimento', 'alta', 'emergencia'] as const;

export const EMPTY_ANAMNESE: Anamnese = {
  id: '', patientId: '', createdBy: '', createdAt: '', updatedAt: '',
  personalPathological: [], smoking: '', alcohol: '', physicalActivity: '',
  diet: '', sleep: '', familyHistory: [], allergies: [], currentMedications: [],
  surgicalHistory: [], gynecological: null, obstetric: null,
  occupation: '', maritalStatus: '', notes: '',
};

export const EMPTY_PHYSICAL_EXAM: PhysicalExam = {
  id: '', patientId: '', createdBy: '', createdAt: '',
  vitalSigns: {}, examHeadNeck: '', examCardiovascular: '', examRespiratory: '',
  examAbdomen: '', examGenitourinary: '', examMusculoskeletal: '', examNeurological: '',
  examSkin: '', examEyes: '', examEars: '', examMouth: '', examRectal: '', examPsychiatric: '',
  generalAspect: '', notes: '',
};

export const EMPTY_SOAP_NOTE: SoapNote = {
  id: '', patientId: '', createdBy: '', createdAt: '',
  subjective: '', objective: '', assessment: '', plan: '', notes: '',
};

export { nationalProcedures, sensitiveFieldConfig };
