import type { Patient, Appointment, Professional } from '@/lib/mockData';

export type { Patient, Appointment, Professional };

export type ReceptionSubTab =
  | 'triagem'
  | 'lista'
  | 'admissao'
  | 'historico'
  | 'fila';

export type AdmissionFormTab =
  | 'identification'
  | 'contact_address'
  | 'complementary'
  | 'guardian';

export type Priority = 'normal' | 'preferencial' | 'emergência';
export type Status = 'agendado' | 'aguardando' | 'triado' | 'atendimento' | 'atendido' | 'internado';

export interface ReceptionModuleProps {
  patients: Patient[];
  appointments: Appointment[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  professionals?: Professional[];
  activeRole?: string;
  activeOperator?: string;
  userPermissions?: string[];
}

export const PRIORITY_BADGE: Record<string, string> = {
  normal: 'bg-slate-100 text-slate-700 border-slate-200',
  preferencial: 'bg-blue-100 text-blue-700 border-blue-200',
  emergência: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const STATUS_BADGE: Record<string, string> = {
  agendado: 'bg-slate-100 text-slate-700 border-slate-200',
  aguardando: 'bg-amber-100 text-amber-700 border-amber-200',
  triado: 'bg-blue-100 text-blue-700 border-blue-200',
  atendimento: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  atendido: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  internado: 'bg-purple-100 text-purple-700 border-purple-200',
};

export const PRIORITY_LABELS: Record<string, string> = {
  todos: 'Todos',
  normal: 'Normal',
  preferencial: 'Preferencial',
  emergência: 'Emergência',
};

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'Outro', label: 'Outro' },
];

export const CIVIL_STATUS_OPTIONS = [
  { value: 'Solteiro(a)', label: 'Solteiro(a)' },
  { value: 'Casado(a)', label: 'Casado(a)' },
  { value: 'Divorciado(a)', label: 'Divorciado(a)' },
  { value: 'Viúvo(a)', label: 'Viúvo(a)' },
  { value: 'União Estável', label: 'União Estável' },
];

export const DOCUMENT_TYPES = [
  { value: 'CI', label: 'CI' },
  { value: 'RG', label: 'RG' },
  { value: 'Passaporte', label: 'Passaporte' },
  { value: 'Outro', label: 'Outro' },
];

export const BLOOD_TYPES = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'Não Informado', label: 'Não Informado' },
];

export const HEALTH_INSURANCE_OPTIONS = [
  { value: 'IPS', label: 'IPS' },
  { value: 'Sanidade Militar', label: 'Sanidade Militar' },
  { value: 'Sanidade Policial', label: 'Sanidade Policial' },
  { value: 'Pré-paga', label: 'Pré-paga' },
  { value: 'Seguro Privado', label: 'Seguro Privado' },
  { value: 'Particular', label: 'Particular' },
];

export const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'pt-PT', label: 'Português (PT)' },
  { value: 'es', label: 'Español' },
  { value: 'es-AR', label: 'Español (AR)' },
  { value: 'es-PY', label: 'Español (PY)' },
  { value: 'en', label: 'English' },
  { value: 'gn', label: 'Guaraní' },
];
