export interface ClinicalHistoryEntry {
  id: string;
  date: string;
  type: string;
  diagnosis: string;
  cid10: string;
  prescriptions: string[];
  notes: string;
  doctor: string;
  vital_signs?: {
    weight?: string;
    height?: string;
    bp?: string;
    temp?: string;
    spo2?: string;
    hr?: string;
    rr?: string;
    imc?: string;
  };
  triage_priority?: 'normal' | 'preferencial' | 'emergência';
  triage_color?: 'blue' | 'green' | 'yellow' | 'orange' | 'red';
  preliminary_procedures?: string[];
  attached_files?: {
    name: string;
    size: string;
    type: string;
    url?: string;
  }[];
}

// ==========================================
// HCE - ANAMNESE ESTRUTURADA
// ==========================================
export interface Anamnese {
  id: string;
  patientId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  personalPathological: string[];
  smoking: string;
  alcohol: string;
  physicalActivity: string;
  diet: string;
  sleep: string;
  familyHistory: FamilyHistoryEntry[];
  allergies: AllergyEntry[];
  currentMedications: MedicationEntry[];
  surgicalHistory: SurgicalEntry[];
  gynecological?: GynecologicalHistory | null;
  obstetric?: ObstetricHistory | null;
  occupation: string;
  maritalStatus: string;
  notes: string;
}

export interface FamilyHistoryEntry {
  relation: string;
  condition: string;
  age?: number;
  deceased?: boolean;
}

export interface AllergyEntry {
  allergen: string;
  type: string;
  severity: 'leve' | 'moderada' | 'grave';
  reaction: string;
}

export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  since: string;
}

export interface SurgicalEntry {
  procedure: string;
  date: string;
  hospital: string;
  complications?: string;
}

export interface GynecologicalHistory {
  menarche: string;
  gestations: number;
  deliveries: number;
  abortions: number;
  cesareans: number;
  lastMenstruation: string;
  contraceptiveMethod: string;
}

export interface ObstetricHistory {
  gestationNumber: number;
  expectedDueDate: string;
  prenatalStart: string;
  riskClassification: string;
}

// ==========================================
// HCE - EXAME FÍSICO
// ==========================================
export interface PhysicalExam {
  id: string;
  patientId: string;
  clinicalHistoryId?: string;
  createdBy: string;
  createdAt: string;
  vitalSigns: VitalSigns;
  examHeadNeck: string;
  examCardiovascular: string;
  examRespiratory: string;
  examAbdomen: string;
  examGenitourinary: string;
  examMusculoskeletal: string;
  examNeurological: string;
  examSkin: string;
  examEyes: string;
  examEars: string;
  examMouth: string;
  examRectal: string;
  examPsychiatric: string;
  generalAspect: string;
  notes: string;
}

export interface VitalSigns {
  weight?: string;
  height?: string;
  bloodPressure?: string;
  temperature?: string;
  spo2?: string;
  heartRate?: string;
  respiratoryRate?: string;
  imc?: string;
}

// ==========================================
// HCE - MODELO SOAP
// ==========================================
export interface SoapNote {
  id: string;
  patientId: string;
  clinicalHistoryId?: string;
  createdBy: string;
  createdAt: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  notes: string;
}

// ==========================================
// HCE - DIAGNÓSTICOS
// ==========================================
export interface Diagnosis {
  id: string;
  patientId: string;
  clinicalHistoryId?: string;
  createdBy: string;
  createdAt: string;
  cid10Code: string;
  cid10Description: string;
  snomedCode?: string;
  snomedDescription?: string;
  diagnosisType: 'principal' | 'secundário' | 'diferencial' | 'presuntivo';
  status: 'ativo' | 'resolvido' | 'crônico' | 'em_tratamento';
  notes: string;
}

export interface Cid10Code {
  code: string;
  description: string;
  chapter: string;
  block: string;
}

// ==========================================
// HCE - CATÁLOGO DE MEDICAMENTOS
// ==========================================
export interface DrugCatalogItem {
  id: string;
  name: string;
  activeIngredient: string;
  presentation: string;
  manufacturer: string;
  category: string;
  controlledCategory: 'comum' | 'controlado' | 'entorpecente' | 'especial';
  requiresPrescription: boolean;
  minAgeMonths: number;
  maxAgeMonths?: number;
  pregnantCategory: string;
  breastfeedingSafe: boolean;
  commonDoseAdult: string;
  commonDosePediatric: string;
  route: string;
  contraindications: string[];
  sideEffects: string[];
  interactions: DrugInteraction[];
}

export interface DrugInteraction {
  drugB: string;
  severity: 'leve' | 'moderada' | 'grave' | 'contraindicado';
  description: string;
  recommendation: string;
}

// ==========================================
// HCE - PRESCRIPÇÕES
// ==========================================
export interface Prescription {
  id: string;
  patientId: string;
  clinicalHistoryId?: string;
  createdBy: string;
  createdAt: string;
  prescriptionType: 'comum' | 'controlado' | 'arquivado';
  drugName: string;
  activeIngredient: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  startDate: string;
  endDate?: string;
  quantity: number;
  unit: string;
  refillCount: number;
  notes: string;
  qrCodeData: string;
  signedAt?: string;
  signatureId?: string;
  status: 'rascunho' | 'assinado' | 'cancelado' | 'dispensado';
}

// ==========================================
// HCE - SOLICITAÇÃO DE EXAMES
// ==========================================
export interface ExamRequest {
  id: string;
  patientId: string;
  clinicalHistoryId?: string;
  createdBy: string;
  createdAt: string;
  examType: 'laboratorio' | 'imagem' | 'anatomia_patologica' | 'outro';
  examName: string;
  clinicalIndication: string;
  urgency: 'rotina' | 'urgente' | 'emergencia';
  status: 'solicitado' | 'em_execucao' | 'laudo_pendente' | 'concluido' | 'cancelado';
  resultNotes: string;
  resultDate?: string;
  resultFileUrl: string;
  resultFileName: string;
  signedBy?: string;
  signedAt?: string;
  signatureId?: string;
}

// ==========================================
// HCE - PROCEDIMENTOS
// ==========================================
export interface Procedure {
  id: string;
  patientId: string;
  clinicalHistoryId?: string;
  createdBy: string;
  createdAt: string;
  procedureCode: string;
  procedureName: string;
  procedureCategory: string;
  quantity: number;
  notes: string;
  complications: string;
  status: 'programado' | 'em_execucao' | 'concluido' | 'cancelado';
  performedAt?: string;
  signedBy?: string;
  signedAt?: string;
  signatureId?: string;
}

// ==========================================
// HCE - ANEXOS CLÍNICOS
// ==========================================
export interface ClinicalAttachment {
  id: string;
  patientId: string;
  clinicalHistoryId?: string;
  examRequestId?: string;
  createdBy: string;
  createdAt: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  category: 'exame_imagem' | 'exame_laboratorio' | 'documento' | 'receita' | 'laudo' | 'anexo_paciente' | 'outro';
  description: string;
  isSensitive: boolean;
  signedBy?: string;
  signedAt?: string;
  signatureId?: string;
}

// ==========================================
// HCE - ASSINATURA ELETRÔNICA
// ==========================================
export interface ElectronicSignature {
  id: string;
  signerId: string;
  signerName: string;
  signerCouncil: string;
  signerCouncilNumber: string;
  createdAt: string;
  documentType: 'prescricao' | 'receita' | 'laudo' | 'atestado' | 'alta' | 'procedimento' | 'exame' | 'outro';
  documentId: string;
  patientId: string;
  signatureHash: string;
  certificateSerial: string;
  certificateIssuer: string;
  certificateValidFrom?: string;
  certificateValidTo?: string;
  timestampToken: string;
  timestampAuthority: string;
  ipAddress: string;
  userAgent: string;
  signedAt: string;
  verificationCode: string;
  status: 'valida' | 'revogada' | 'expirada';
}

// ==========================================
// HCE - CONTROLE DE ACESSO
// ==========================================
export interface AccessControl {
  id: string;
  patientId: string;
  accessedBy: string;
  accessedAt: string;
  accessType: 'normal' | 'break_the_glass' | 'emergencia';
  justification: string;
  fieldsAccessed: string[];
  ipAddress: string;
  notifiedPrivacyOfficer: boolean;
  notificationSentAt?: string;
}

// ==========================================
// HCE - TIMELINE
// ==========================================
export interface PatientTimelineEvent {
  id: string;
  patientId: string;
  eventType: 'consulta' | 'internacao' | 'cirurgia' | 'exame' | 'prescricao' | 'vacina' | 'procedimento' | 'alta' | 'emergencia';
  eventDate: string;
  eventTitle: string;
  eventDescription: string;
  eventSource: string;
  eventSourceId: string;
  doctorName: string;
  specialty: string;
  cid10Code: string;
}

// ==========================================
// HCE - CAMPOS SENSÍVEIS
// ==========================================
export interface SensitiveFieldConfig {
  id: string;
  fieldName: string;
  fieldLabel: string;
  category: 'hiv' | 'saude_mental' | 'dependencia_quimica' | 'saude_reprodutiva' | 'outro';
  requiresElevatedPermission: boolean;
}

// ==========================================
// HCE - NACIONAL PROCEDURES
// ==========================================
export interface NationalProcedure {
  code: string;
  name: string;
  category: string;
  sinascCode?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: string;
  priority: 'normal' | 'preferencial' | 'emergência';
  status: 'agendado' | 'aguardando' | 'atendimento' | 'atendido';
  clinicalHistory: ClinicalHistoryEntry[];
  
  // Campos obrigatórios adicionais
  document_type?: 'CI' | 'Passaporte' | 'RG' | 'Outro';
  document_number?: string;
  place_of_birth?: string;
  civil_status?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
  nationality?: string;
  address_department?: string;
  address_district?: string;
  address_city?: string;
  address_neighborhood?: string;
  address_street?: string;
  address_number?: string;
  whatsapp_verified?: boolean;
  
  // Campos complementares
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string;
  health_insurance_type?: 'IPS' | 'Sanidade Militar' | 'Sanidade Policial' | 'Pré-paga' | 'Seguro Privado' | 'Particular';
  health_insurance_number?: string;
  health_insurance_company?: string;
  employer?: string;
  guardian_name?: string;
  guardian_document?: string;
  guardian_relationship?: string;
  photo_url?: string;
  preferred_language?: 'es' | 'gn' | 'pt' | 'en' | 'outros';
}


export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'agendado' | 'confirmado' | 'pendente' | 'cancelado' | 'atendido' | 'remarcado' | 'em sala de espera' | 'em atendimento' | 'finalizado' | 'ausente';
  branch?: string;
  room?: string;
  resource?: string;
  type?: string;
  modality?: 'Presencial' | 'Virtual';
  is_overturn?: boolean;
  overturn_reason?: string;
  insurance?: string;
}

export interface FinancialPosting {
  id: string;
  description: string;
  type: 'receita' | 'despesa';
  amount: number;
  category: string;
  date: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}

export interface Bed {
  id: string;
  name: string;
  wing: 'Alas Gerais' | 'UTI' | 'Centro Cirúrgico';
  status: 'disponível' | 'ocupado';
  patientName?: string;
  entryDate?: string;
}

export interface AuditLog {
  id: string;
  operator: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

export interface AsoExam {
  id: string;
  patientName: string;
  type: 'Admissional' | 'Periódico' | 'Demissional';
  risks: string[];
  status: 'apto' | 'inapto';
  date: string;
  doctor: string;
}

export type ProfessionalRole = 'Médico(a)' | 'Enfermeiro(a)' | 'Fisioterapeuta' | 'Psicólogo(a)' | 'Nutricionista' | 'Técnico(a) de Enfermagem' | 'Administrador(a)' | 'Recepcionista';
export type ProfessionalCouncil = 'CRM' | 'COREN' | 'CREFITO' | 'CFP' | 'CFN' | 'CRO' | 'N/A';
export type ProfessionalShift = 'Manhã' | 'Tarde' | 'Noite' | 'Integral' | 'Plantão 12h' | 'Plantão 24h';

export interface Professional {
  id: string;
  name: string;
  role: ProfessionalRole;
  specialty: string;
  council: ProfessionalCouncil;
  councilNumber: string;
  shift: ProfessionalShift;
  email: string;
  phone: string;
  status: 'ativo' | 'inativo' | 'férias';
  admissionDate: string;
  color?: string; // for UI avatar
  permissions?: string[];
}

export interface Dte {
  id: string;
  cdc: string;               // Código de Control (44 dígitos) - código único SIFEN
  type: 'Fatura Eletrônica' | 'Nota de Crédito' | 'Nota de Débito' | 'Nota de Remessa' | 'Autofatura';
  number: string;            // Número do documento (ej: 001-002-0000001)
  timbrado: string;          // Número do timbrado (8 dígitos)
  establishment: string;     // Código estabelecimento (3 dígitos)
  expedition_point: string;  // Ponto de expedição (3 dígitos)
  patient_name: string;
  patient_email?: string;
  patient_phone?: string;
  ruc?: string;              // RUC del cliente (si aplica)
  date: string;
  amount: number;            // Total em Guaraníes (Gs.)
  iva_5: number;             // IVA 5%
  iva_10: number;            // IVA 10%
  environment: 'homologacao' | 'producao';
  status: 'Gerado' | 'Pendente de Envio' | 'Enviado' | 'Aprovado' | 'Rejeitado' | 'Cancelado' | 'Inutilizado';
  payment_gateway?: 'Bancard' | 'Pagopar' | 'Tigo Money' | 'Personal Pay' | 'Eko Network' | 'Transferência' | null;
  payment_status: 'pendente' | 'pago' | 'conciliado' | 'cancelado';
  xml_content?: string;
  rejection_reason?: string;
  items: DteItem[];
}

export interface DteItem {
  code: string;
  description: string;
  quantity: number;
  unit_price: number;        // em Guaraníes
  iva_rate: 5 | 10 | 0;
  total: number;
}

export const initialDtes: Dte[] = [
  {
    id: 'dte_1',
    cdc: '01800695631001001000000012026062800191234567',
    type: 'Fatura Eletrônica',
    number: '001-001-0000001',
    timbrado: '12345678',
    establishment: '001',
    expedition_point: '001',
    patient_name: 'Carlos Eduardo Almeida',
    patient_email: 'carlos.almeida@gmail.com',
    patient_phone: '+595981234567',
    date: '2026-06-21',
    amount: 750000,
    iva_5: 0,
    iva_10: 68182,
    environment: 'producao',
    status: 'Aprovado',
    payment_gateway: 'Bancard',
    payment_status: 'conciliado',
    items: [
      { code: '10101012', description: 'Consulta Médica Cardiológica', quantity: 1, unit_price: 750000, iva_rate: 10, total: 750000 }
    ]
  },
  {
    id: 'dte_2',
    cdc: '01800695631001001000000022026062800292345678',
    type: 'Fatura Eletrônica',
    number: '001-001-0000002',
    timbrado: '12345678',
    establishment: '001',
    expedition_point: '001',
    patient_name: 'Mariana Rosa Santos',
    patient_email: 'mariana.santos@yahoo.com.br',
    patient_phone: '+595991234567',
    date: '2026-06-21',
    amount: 1100000,
    iva_5: 0,
    iva_10: 100000,
    environment: 'producao',
    status: 'Enviado',
    payment_gateway: 'Tigo Money',
    payment_status: 'pendente',
    items: [
      { code: '40201011', description: 'Ultrassonografia Obstétrica', quantity: 1, unit_price: 1100000, iva_rate: 10, total: 1100000 }
    ]
  },
  {
    id: 'dte_3',
    cdc: '01800695631001001000000032026062200393456789',
    type: 'Nota de Crédito',
    number: '001-001-0000003',
    timbrado: '12345678',
    establishment: '001',
    expedition_point: '001',
    patient_name: 'Joaquim Bento Pereira',
    date: '2026-06-22',
    amount: 200000,
    iva_5: 0,
    iva_10: 18182,
    environment: 'producao',
    status: 'Aprovado',
    payment_gateway: null,
    payment_status: 'conciliado',
    items: [
      { code: 'NC001', description: 'Estorno parcial - Consulta Ortopédica', quantity: 1, unit_price: 200000, iva_rate: 10, total: 200000 }
    ]
  },
  {
    id: 'dte_4',
    cdc: '01800695631001001000000042026062300494567890',
    type: 'Fatura Eletrônica',
    number: '001-001-0000004',
    timbrado: '12345678',
    establishment: '001',
    expedition_point: '001',
    patient_name: 'Roberto de Oliveira Cruz',
    patient_email: 'roberto.cruz@industria.com.br',
    date: '2026-06-23',
    amount: 450000,
    iva_5: 0,
    iva_10: 40909,
    environment: 'homologacao',
    status: 'Rejeitado',
    payment_gateway: null,
    payment_status: 'cancelado',
    rejection_reason: 'RUC do emitente inválido no ambiente de homologação. Verificar configuração.',
    items: [
      { code: '99001', description: 'Exame Admissional - Medicina do Trabalho', quantity: 1, unit_price: 450000, iva_rate: 10, total: 450000 }
    ]
  }
];

export const initialPatients: Patient[] = [
  {
    id: "pat_1",
    name: "Carlos Eduardo Almeida",
    email: "carlos.almeida@gmail.com",
    phone: "(11) 98765-4321",
    birthdate: "1984-06-15",
    gender: "Masculino",
    priority: "normal",
    status: "aguardando",
    clinicalHistory: [
      {
        id: "his_1",
        date: "2026-03-10",
        type: "Consulta Ortopédica",
        diagnosis: "Tendinite de Aquiles",
        cid10: "M76.6",
        prescriptions: ["Ibuprofeno 600mg", "Fisioterapia 10 sessões"],
        notes: "Paciente relata dor ao correr. Iniciado tratamento conservador.",
        doctor: "Dr. Adriano Lima"
      },
      {
        id: "his_2",
        date: "2026-05-22",
        type: "Consulta Geral",
        diagnosis: "Hipertensão arterial primária",
        cid10: "I10",
        prescriptions: ["Losartana Potássica 50mg"],
        notes: "Pressão aferida: 140/90 mmHg. Recomendado acompanhamento.",
        doctor: "Dra. Amanda Silva"
      }
    ]
  },
  {
    id: "pat_2",
    name: "Mariana Rosa Santos",
    email: "mariana.santos@yahoo.com.br",
    phone: "(11) 91234-5678",
    birthdate: "1998-11-28",
    gender: "Feminino",
    priority: "preferencial",
    status: "atendimento",
    clinicalHistory: [
      {
        id: "his_3",
        date: "2026-04-15",
        type: "Acompanhamento Ginecológico",
        diagnosis: "Gravidez de baixo risco (Pré-natal)",
        cid10: "Z34.0",
        prescriptions: ["Ácido Fólico 5mg", "Sulfato Ferroso 40mg"],
        notes: "Primeiro trimestre, ultrassom inicial confirma 8 semanas normais.",
        doctor: "Dra. Amanda Silva"
      }
    ]
  },
  {
    id: "pat_3",
    name: "Joaquim Bento Pereira",
    email: "joaquim.pereira@outlook.com",
    phone: "(21) 99888-7766",
    birthdate: "1959-02-03",
    gender: "Masculino",
    priority: "preferencial",
    status: "agendado",
    clinicalHistory: [
      {
        id: "his_4",
        date: "2026-01-20",
        type: "Consulta Ortopédica",
        diagnosis: "Lombocatalgia crônica",
        cid10: "M54.5",
        prescriptions: ["Pregabalina 75mg", "Alongamentos diários"],
        notes: "Dor lombar há mais de 3 anos, irradia para membro inferior esquerdo.",
        doctor: "Dr. Adriano Lima"
      }
    ]
  },
  {
    id: "pat_4",
    name: "Ana Júlia de Souza",
    email: "anajulia.souza@gmail.com",
    phone: "(11) 97777-8888",
    birthdate: "2011-09-02",
    gender: "Feminino",
    priority: "emergência",
    status: "aguardando",
    clinicalHistory: []
  },
  {
    id: "pat_5",
    name: "Roberto de Oliveira Cruz",
    email: "roberto.cruz@industria.com.br",
    phone: "(19) 98122-3344",
    birthdate: "1991-07-24",
    gender: "Masculino",
    priority: "normal",
    status: "atendido",
    clinicalHistory: [
      {
        id: "his_5",
        date: "2025-06-20",
        type: "Exame de Medicina do Trabalho",
        diagnosis: "Aptidão no trabalho em altura (NR-35)",
        cid10: "Z02.7",
        prescriptions: [],
        notes: "Exame de acuidade visual, ECG e EEG normais. Homologado.",
        doctor: "Dr. Bruno Castro"
      }
    ]
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: "app_1",
    patientId: "pat_3",
    patientName: "Joaquim Bento Pereira",
    doctorName: "Dr. Adriano Lima",
    specialty: "Ortopedia",
    date: "2026-06-22",
    time: "09:00",
    status: "confirmado"
  },
  {
    id: "app_2",
    patientId: "pat_1",
    patientName: "Carlos Eduardo Almeida",
    doctorName: "Dra. Amanda Silva",
    specialty: "Cardiologia",
    date: "2026-06-22",
    time: "10:30",
    status: "confirmado"
  },
  {
    id: "app_3",
    patientId: "pat_2",
    patientName: "Mariana Rosa Santos",
    doctorName: "Dr. Bruno Castro",
    specialty: "Clínico Geral",
    date: "2026-06-22",
    time: "13:00",
    status: "atendido"
  },
  {
    id: "app_4",
    patientId: "pat_5",
    patientName: "Roberto de Oliveira Cruz",
    doctorName: "Dr. Bruno Castro",
    specialty: "Medicina do Trabalho",
    date: "2026-06-23",
    time: "14:15",
    status: "pendente"
  }
];

export const initialFinance: FinancialPosting[] = [
  { id: "fin_1", description: "Faturamento Consulta - Plano Amil (Carlos)", type: "receita", amount: 150, category: "Consultas", date: "2026-06-21" },
  { id: "fin_2", description: "Procedimento Raio-X - Particular", type: "receita", amount: 220, category: "Exames de Imagem", date: "2026-06-21" },
  { id: "fin_3", description: "Compra de Insumos - Seringas e Gaze", type: "despesa", amount: 480, category: "Insumos Médicos", date: "2026-06-20" },
  { id: "fin_4", description: "Faturamento Internação Particular", type: "receita", amount: 1250, category: "Internação", date: "2026-06-19" },
  { id: "fin_5", description: "Energia Elétrica e Telefonia Clínica", type: "despesa", amount: 890, category: "Operacional", date: "2026-06-18" },
  { id: "fin_6", description: "Assessoria Jurídica e Contábil", type: "despesa", amount: 1200, category: "Serviços", date: "2026-06-15" }
];

export const initialStock: StockItem[] = [
  { id: "stk_1", name: "Amoxicilina 500mg (Cps)", category: "Antibióticos", quantity: 240, minQuantity: 50, unit: "cápsulas" },
  { id: "stk_2", name: "Insulina NPH 10ml", category: "Insumo Diabéticos", quantity: 8, minQuantity: 10, unit: "frascos" }, // Alerta!
  { id: "stk_3", name: "Seringas Descartáveis Luer Lock 5ml", category: "Consumíveis", quantity: 1500, minQuantity: 300, unit: "unidades" },
  { id: "stk_4", name: "Dipirona Monoidratada Gotas", category: "Analgésicos", quantity: 38, minQuantity: 15, unit: "frascos" },
  { id: "stk_5", name: "Cateter Gelco calibre 20G", category: "Cirúrgico", quantity: 12, minQuantity: 40, unit: "unidades" } // Alerta!
];

export const initialBeds: Bed[] = [
  { id: "bd_1", name: "Leito 101-A (Enfermaria)", wing: "Alas Gerais", status: "ocupado", patientName: "Carlos Eduardo Almeida", entryDate: "2026-06-21" },
  { id: "bd_2", name: "Leito 101-B (Enfermaria)", wing: "Alas Gerais", status: "disponível" },
  { id: "bd_3", name: "UTI Cardiológica — Box 01", wing: "UTI", status: "disponível" },
  { id: "bd_4", name: "Sala Cirúrgica Alpha", wing: "Centro Cirúrgico", status: "ocupado", patientName: "Mariana Rosa Santos", entryDate: "2026-06-21" }
];

export const initialLogs: AuditLog[] = [
  { id: "log_1", operator: "Marcela Ramos", role: "Recepcionista", action: "Visualizou Prontuário", target: "Carlos Eduardo Almeida", timestamp: "2026-06-21 11:34", ip: "192.168.1.45" },
  { id: "log_2", operator: "Dra. Amanda Silva", role: "Médico", action: "Adicionou Diagnóstico", target: "Mariana Rosa Santos", timestamp: "2026-06-21 11:12", ip: "10.0.0.12" },
  { id: "log_3", operator: "Adriano Lima", role: "Gestor", action: "Baixou Lote SIFEN", target: "SIFEN XML #302", timestamp: "2026-06-21 10:20", ip: "192.168.1.10" },
  { id: "log_4", operator: "Sistema IAMED", role: "Servidor", action: "Backup Automático", target: "Database_Cloud", timestamp: "2026-06-21 04:00", ip: "127.0.0.1" }
];

export const initialAsos: AsoExam[] = [
  { id: "aso_1", patientName: "Roberto de Oliveira Cruz", type: "Periódico", risks: ["Ruído Contínuo", "Ergonômico", "Trabalho em Altura"], status: "apto", date: "2026-06-21", doctor: "Dr. Bruno Castro" },
  { id: "aso_2", patientName: "Cláudio Siqueira", type: "Admissional", risks: ["Postura Física", "Poeira Mineral"], status: "apto", date: "2026-06-20", doctor: "Dr. Bruno Castro" }
];

export const mockNps = [
  { patientName: "Alzira Maria", score: 10, comment: "Excelente atendimento! O co-piloto IA ajudou muito a médica a acelerar meu histórico clínico e tirar minhas dúvidas." },
  { patientName: "Filipe Antunes", score: 9, comment: "Fiquei impressionado com o portal do paciente, pude acessar minhas imagens direto pelo aplicativo!" },
  { patientName: "Paula Gomes", score: 8, comment: "Muito prático. A recepção foi rápida e a triagem funcionou muito bem." }
];

export const initialProfessionals: Professional[] = [
  {
    id: "prof_1",
    name: "Dra. Amanda Silva",
    role: "Médico(a)",
    specialty: "Cardiologia",
    council: "CRM",
    councilNumber: "CRM-SP 112345",
    shift: "Manhã",
    email: "amanda.silva@iamed.med.br",
    phone: "+55 11 99876-5432",
    status: "ativo",
    admissionDate: "2022-03-01",
    color: "bg-teal-500",
    permissions: ["view_reception", "view_agenda", "view_hce", "view_diagnostic", "view_med_work", "perform_prescribe"]
  },
  {
    id: "prof_2",
    name: "Dr. Adriano Lima",
    role: "Médico(a)",
    specialty: "Ortopedia",
    council: "CRM",
    councilNumber: "CRM-SP 234567",
    shift: "Tarde",
    email: "adriano.lima@iamed.med.br",
    phone: "+55 11 99765-4321",
    status: "ativo",
    admissionDate: "2021-07-15",
    color: "bg-indigo-500",
    permissions: ["view_reception", "view_agenda", "view_hce", "view_diagnostic", "view_finance", "view_stock", "view_med_work", "view_crm", "view_security", "perform_admit", "perform_prescribe", "perform_sifen", "perform_post_finance", "perform_stock", "perform_beds", "perform_rbac"]
  },
  {
    id: "prof_3",
    name: "Dr. Bruno Castro",
    role: "Médico(a)",
    specialty: "Medicina do Trabalho",
    council: "CRM",
    councilNumber: "CRM-SP 345678",
    shift: "Integral",
    email: "bruno.castro@iamed.med.br",
    phone: "+55 11 98654-3210",
    status: "ativo",
    admissionDate: "2020-01-10",
    color: "bg-rose-500",
    permissions: ["view_agenda", "view_hce", "view_diagnostic", "view_med_work", "perform_prescribe"]
  },
  {
    id: "prof_4",
    name: "Enf. Marcela Ramos",
    role: "Enfermeiro(a)",
    specialty: "Enfermagem Clínica",
    council: "COREN",
    councilNumber: "COREN-SP 456789",
    shift: "Plantão 12h",
    email: "marcela.ramos@iamed.med.br",
    phone: "+55 11 97543-2109",
    status: "ativo",
    admissionDate: "2023-02-20",
    color: "bg-sky-500",
    permissions: ["view_reception", "view_agenda", "view_diagnostic", "perform_admit", "perform_beds"]
  },
  {
    id: "prof_5",
    name: "Fis. Camila Torres",
    role: "Fisioterapeuta",
    specialty: "Fisioterapia Ortopédica",
    council: "CREFITO",
    councilNumber: "CREFITO-3 567890",
    shift: "Manhã",
    email: "camila.torres@iamed.med.br",
    phone: "+55 11 96432-1098",
    status: "férias",
    admissionDate: "2023-08-05",
    color: "bg-violet-500",
    permissions: ["view_agenda", "view_hce"]
  }
];

// ==========================================
// HCE SEED DATA - CID-10 Codes
// ==========================================
export const cid10Codes: Cid10Code[] = [
  { code: 'A00', description: 'Cólera', chapter: 'I', block: 'A00-A09' },
  { code: 'A09', description: 'Outras doenças infecciosas e parasitárias intestinais', chapter: 'I', block: 'A00-A09' },
  { code: 'B20', description: 'Doença pelo HIV', chapter: 'I', block: 'B20-B24' },
  { code: 'C34', description: 'Neoplasia maligna dos brônquios e do pulmão', chapter: 'II', block: 'C30-C39' },
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
  { code: 'J06', description: 'Infecções agudas das vias aéreas superiores', chapter: 'X', block: 'J00-J06' },
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
  { code: 'T78', description: 'Efeitos adversos, não classificados em outra parte', chapter: 'XX', block: 'T66-T78' },
  { code: 'Z00', description: 'Exame geral e investigação de pessoas sem queixa', chapter: 'XXI', block: 'Z00-Z13' },
  { code: 'Z23', description: 'Necessidade de imunização contra doença bacteriana', chapter: 'XXI', block: 'Z20-Z29' },
  { code: 'Z34', description: 'Supervisão de gravidez normal', chapter: 'XXI', block: 'Z30-Z39' },
  { code: 'Z72', description: 'Problemas associados ao estilo de vida', chapter: 'XXI', block: 'Z70-Z76' },
];

// ==========================================
// HCE SEED DATA - Drug Catalog
// ==========================================
export const drugCatalog: DrugCatalogItem[] = [
  { id: 'drug_1', name: 'Paracetamol 500mg', activeIngredient: 'Paracetamol', presentation: 'Comprimido 500mg', manufacturer: 'Laboratório PY', category: 'Analgésico', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 1, pregnantCategory: 'B', breastfeedingSafe: true, commonDoseAdult: '500mg-1g a cada 6-8h', commonDosePediatric: '10-15mg/kg/dose a cada 6-8h', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_2', name: 'Ibuprofeno 600mg', activeIngredient: 'Ibuprofeno', presentation: 'Comprimido 600mg', manufacturer: 'Laboratório PY', category: 'AINE', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 6, pregnantCategory: 'C', breastfeedingSafe: false, commonDoseAdult: '200-600mg a cada 6-8h', commonDosePediatric: '5-10mg/kg/dose a cada 6-8h', route: 'oral', contraindications: ['úlcera péptica ativa', 'insuficiência renal grave'], sideEffects: [], interactions: [{ drugB: 'Losartana', severity: 'moderada', description: 'AINEs podem reduzir o efeito anti-hipertensivo', recommendation: 'Monitorar PA' }] },
  { id: 'drug_3', name: 'Amoxicilina 500mg', activeIngredient: 'Amoxicilina', presentation: 'Cápsula 500mg', manufacturer: 'Laboratório PY', category: 'Antibiótico', controlledCategory: 'comum', requiresPrescription: true, minAgeMonths: 1, pregnantCategory: 'B', breastfeedingSafe: true, commonDoseAdult: '500mg a cada 8h', commonDosePediatric: '25-50mg/kg/dia fracionado', route: 'oral', contraindications: ['alergia a penicilinas'], sideEffects: [], interactions: [] },
  { id: 'drug_4', name: 'Losartana 50mg', activeIngredient: 'Losartana Potássica', presentation: 'Comprimido 50mg', manufacturer: 'Laboratório PY', category: 'Anti-hipertensivo', controlledCategory: 'comum', requiresPrescription: true, minAgeMonths: 144, pregnantCategory: 'D', breastfeedingSafe: false, commonDoseAdult: '50-100mg 1x/dia', commonDosePediatric: '', route: 'oral', contraindications: ['gravidez', 'estenose bilateral da artéria renal'], sideEffects: [], interactions: [] },
  { id: 'drug_5', name: 'Omeprazol 20mg', activeIngredient: 'Omeprazol', presentation: 'Cápsula 20mg', manufacturer: 'Laboratório PY', category: 'Inibidor Bomba Prótons', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 1, pregnantCategory: 'C', breastfeedingSafe: true, commonDoseAdult: '20mg 1x/dia', commonDosePediatric: '0.7-3.5mg/kg/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_6', name: 'Dipirona 500mg', activeIngredient: 'Dipirona Sódica', presentation: 'Comprimido 500mg', manufacturer: 'Laboratório PY', category: 'Analgésico/Antipirético', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 3, pregnantCategory: 'C', breastfeedingSafe: true, commonDoseAdult: '500mg-1g a cada 6h', commonDosePediatric: '10-15mg/kg/dose', route: 'oral', contraindications: ['asma induzida por AAS', 'grávidas no 1º trimestre'], sideEffects: [], interactions: [] },
  { id: 'drug_7', name: 'Rivotril 2mg', activeIngredient: 'Clonazepam', presentation: 'Comprimido 2mg', manufacturer: 'Laboratório PY', category: 'Benzodiazepínico', controlledCategory: 'controlado', requiresPrescription: true, minAgeMonths: 0, pregnantCategory: 'D', breastfeedingSafe: false, commonDoseAdult: '0.5-4mg/dia', commonDosePediatric: '0.01-0.03mg/kg/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_8', name: 'Ritalina 10mg', activeIngredient: 'Metilfenidato', presentation: 'Comprimido 10mg', manufacturer: 'Laboratório PY', category: 'Psicoestimulante', controlledCategory: 'controlado', requiresPrescription: true, minAgeMonths: 36, pregnantCategory: 'C', breastfeedingSafe: false, commonDoseAdult: '10-20mg 2-3x/dia', commonDosePediatric: '5mg 2x/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_9', name: 'Sulfato Ferroso 40mg', activeIngredient: 'Sulfato Ferroso', presentation: 'Comprimido 40mg', manufacturer: 'Laboratório PY', category: 'Suplemento de Ferro', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 0, pregnantCategory: 'A', breastfeedingSafe: true, commonDoseAdult: '40mg 1x/dia', commonDosePediatric: '3-6mg/kg/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
  { id: 'drug_10', name: 'Ácido Fólico 5mg', activeIngredient: 'Ácido Fólico', presentation: 'Comprimido 5mg', manufacturer: 'Laboratório PY', category: 'Vitamina', controlledCategory: 'comum', requiresPrescription: false, minAgeMonths: 0, pregnantCategory: 'A', breastfeedingSafe: true, commonDoseAdult: '5mg 1x/dia', commonDosePediatric: '0.1-0.4mg/dia', route: 'oral', contraindications: [], sideEffects: [], interactions: [] },
];

// ==========================================
// HCE SEED DATA - Drug Interactions
// ==========================================
export const drugInteractions: DrugInteraction[] = [
  { drugB: 'Losartana', severity: 'moderada', description: 'AINEs podem reduzir o efeito anti-hipertensivo dos BNRAs.', recommendation: 'Monitorar pressão arterial. Considerar alternativa analgésica.' },
  { drugB: 'Omeprazol', severity: 'leve', description: 'Omeprazol pode reduzir ligeiramente a absorção de amoxicilina.', recommendation: 'Tomar com 2h de intervalo.' },
  { drugB: 'Metilfenidato', severity: 'moderada', description: 'Psicoestimulantes podem reduzir o efeito sedativo das benzodiazepinas.', recommendation: 'Ajustar doses conforme resposta clínica.' },
  { drugB: 'Ibuprofeno', severity: 'leve', description: 'Efeito aditivo analgésico/antipirético.', recommendation: 'Evitar uso concomitante prolongado.' },
  { drugB: 'Potássio', severity: 'grave', description: 'BNRAs podem causar hipercalemia quando associados a suplementos de potássio.', recommendation: 'Monitorar K+ séricos regularmente.' },
];

// ==========================================
// HCE SEED DATA - National Procedures
// ==========================================
export const nationalProcedures: NationalProcedure[] = [
  { code: '10101012', name: 'Consulta Médica Geral', category: 'Consulta' },
  { code: '10101013', name: 'Consulta Médica Especializada', category: 'Consulta' },
  { code: '20101010', name: 'Procedimento de Pequena Cirurgia', category: 'Procedimento' },
  { code: '30101010', name: 'Coleta de Material Biológico', category: 'Laboratório' },
  { code: '40101010', name: 'Eletrocardiograma', category: 'Exame' },
  { code: '40101011', name: 'Raio-X Simples', category: 'Imagem' },
  { code: '40101012', name: 'Ressonância Magnética', category: 'Imagem' },
  { code: '40101013', name: 'Tomografia Computadorizada', category: 'Imagem' },
  { code: '40101014', name: 'Ultrassonografia', category: 'Imagem' },
  { code: '40101015', name: 'Mamografia', category: 'Imagem' },
  { code: '40201011', name: 'Ultrassonografia Obstétrica', category: 'Imagem' },
  { code: '50101010', name: 'Fisioterapia - Sessão', category: 'Fisioterapia' },
  { code: '60101010', name: 'Atendimento de Enfermagem', category: 'Enfermagem' },
  { code: '70101010', name: 'Avaliação Psicológica', category: 'Psicologia' },
  { code: '80101010', name: 'Avaliação Nutricional', category: 'Nutrição' },
];

// ==========================================
// HCE SEED DATA - Sensitive Field Config
// ==========================================
export const sensitiveFieldConfig: SensitiveFieldConfig[] = [
  { id: 'sf_1', fieldName: 'hiv_status', fieldLabel: 'Estado HIV', category: 'hiv', requiresElevatedPermission: true },
  { id: 'sf_2', fieldName: 'mental_health', fieldLabel: 'Saúde Mental', category: 'saude_mental', requiresElevatedPermission: true },
  { id: 'sf_3', fieldName: 'substance_use', fieldLabel: 'Uso de Substâncias', category: 'dependencia_quimica', requiresElevatedPermission: true },
  { id: 'sf_4', fieldName: 'reproductive_health', fieldLabel: 'Saúde Reprodutiva', category: 'saude_reprodutiva', requiresElevatedPermission: true },
  { id: 'sf_5', fieldName: 'sexual_history', fieldLabel: 'Histórico Sexual', category: 'saude_reprodutiva', requiresElevatedPermission: true },
];

// ==========================================
// DIAGNÓSTICO POR IMAGENS - DICOM/PACS
// ==========================================
export type DicomModality = 'RX' | 'TC' | 'RM' | 'US' | 'MG' | 'PET' | 'XA';
export type DicomStudyStatus = 'agendado' | 'em_execucao' | 'laudo_pendente' | 'laudado' | 'cancelado';

export interface DicomStudy {
  id: string;
  studyInstanceUID: string;
  accessionNumber: string;
  patientId: string;
  patientName: string;
  modality: DicomModality;
  modalityName: string;
  bodyPart: string;
  studyDescription: string;
  clinicalHistory: string;
  referringPhysician: string;
  performingPhysician?: string;
  institutionName: string;
  stationName: string;
  scheduledAt: string;
  performedAt?: string;
  status: DicomStudyStatus;
  seriesCount: number;
  instanceCount: number;
  thumbnailUrl: string;
  dicomFileRef: string;
  pacsServerId: string;
  vendor: string;
  mwlEntryId?: string;
  reportId?: string;
  createdAt: string;
}

export interface DicomImageAnnotation {
  id: string;
  studyId: string;
  seriesNumber: number;
  instanceNumber: number;
  type: 'arrow' | 'circle' | 'ruler' | 'angle' | 'text' | 'roi';
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  value?: string;
  unit?: string;
  createdBy: string;
  createdAt: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  modality: DicomModality | 'ALL';
  specialistName?: string;
  sections: ReportTemplateSection[];
  vocabularyHints: string[];
  language: 'es' | 'pt' | 'en';
  active: boolean;
}

export interface ReportTemplateSection {
  key: string;
  title: string;
  content: string;
  required: boolean;
  order: number;
}

export interface ImagingReport {
  id: string;
  studyId: string;
  patientId: string;
  patientName: string;
  modality: DicomModality;
  templateId?: string;
  technique: string;
  findings: string;
  impression: string;
  recommendations: string;
  keyImages: string[];
  bodyPart: string;
  status: 'rascunho' | 'pre_laudo' | 'laudado' | 'corrigido' | 'cancelado';
  reportedBy: string;
  reportedAt?: string;
  signedBy?: string;
  signedAt?: string;
  signatureId?: string;
  distributionChannels: DistributionChannel[];
  voiceTranscriptionUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DistributionChannel = 'portal_paciente' | 'email_solicitante' | 'email_paciente' | 'whatsapp' | 'hl7_fhir' | 'impressao';

export interface ReportDistribution {
  id: string;
  reportId: string;
  channel: DistributionChannel;
  recipient: string;
  recipientType: 'paciente' | 'medico_solicitante' | 'medico_laudo' | 'outro';
  sentAt: string;
  status: 'enviado' | 'entregue' | 'lido' | 'falhou';
  errorMessage?: string;
}

// ==========================================
// DIAGNÓSTICO - WORKLIST DICOM / HL7 / FHIR
// ==========================================
export type WorklistStatus = 'pendente' | 'em_execucao' | 'concluido' | 'cancelado' | 'nao_compareceu';

export interface WorklistEntry {
  id: string;
  stepId: string;
  patientId: string;
  patientName: string;
  patientBirthdate: string;
  patientSex: 'M' | 'F' | 'O';
  patientDocument: string;
  accessionNumber: string;
  scheduledAt: string;
  modality: DicomModality;
  modalityAet: string;
  stationAet: string;
  requestedProcedureId: string;
  requestedProcedureDescription: string;
  scheduledStationAet: string;
  scheduledProcedureStepId: string;
  referringPhysician: string;
  clinicalIndication: string;
  status: WorklistStatus;
  startedAt?: string;
  completedAt?: string;
  performedBy?: string;
  notes?: string;
  hl7MessageId?: string;
  studyId?: string;
}

export interface Hl7Message {
  id: string;
  messageType: 'ORM' | 'ORU' | 'ADT' | 'SIU' | 'MDM' | 'ACK';
  triggerEvent: string;
  controlId: string;
  sendingApp: string;
  sendingFacility: string;
  receivingApp: string;
  receivingFacility: string;
  patientId: string;
  patientName: string;
  rawMessage: string;
  parsedSegments: Hl7Segment[];
  status: 'recebido' | 'processado' | 'erro' | 'pendente';
  errorMessage?: string;
  receivedAt: string;
  processedAt?: string;
  protocol: 'HL7_v2.x' | 'ASTM' | 'FHIR_R4' | 'DICOM';
  direction: 'inbound' | 'outbound';
  sourceSystem: string;
  relatedOrderId?: string;
  relatedResultId?: string;
}

export interface Hl7Segment {
  name: string;
  fields: string[];
}

export interface FhirResource {
  id: string;
  resourceType: 'Patient' | 'Observation' | 'DiagnosticReport' | 'ImagingStudy' | 'ServiceRequest' | 'Practitioner' | 'Organization';
  fhirVersion: 'R4';
  jsonContent: string;
  patientId?: string;
  sourceMessageId?: string;
  sentAt?: string;
  receivedAt?: string;
  status: 'rascunho' | 'enviado' | 'recebido' | 'processado' | 'erro';
  endpoint: string;
  direction: 'inbound' | 'outbound';
}

// ==========================================
// LABORATÓRIO CLÍNICO
// ==========================================
export type LabOrderStatus = 'solicitado' | 'em_coleta' | 'em_processamento' | 'parcial' | 'concluido' | 'cancelado';

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientBirthdate: string;
  patientSex: 'M' | 'F';
  requestingPhysician: string;
  insuranceType: 'IPS' | 'Sanidade Militar' | 'Sanidade Policial' | 'Pré-paga' | 'Seguro Privado' | 'Particular';
  insuranceNumber?: string;
  priority: 'rotina' | 'urgente' | 'emergencia';
  observations: string;
  status: LabOrderStatus;
  collectedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  items: LabOrderItem[];
  lisMessageId?: string;
  createdAt: string;
}

export interface LabOrderItem {
  id: string;
  code: string;
  nomenclatorCode?: string;
  name: string;
  sampleType: 'sangue' | 'urina' | 'fezes' | 'saliva' | 'liquor' | 'secrecao' | 'tecido' | 'outro';
  container: string;
  status: LabOrderStatus;
  resultId?: string;
}

export interface LabTest {
  id: string;
  code: string;
  nomenclatorCode?: string;
  name: string;
  category: 'hematologia' | 'bioquimica' | 'urinalise' | 'microbiologia' | 'imunologia' | 'hormonios' | 'coagulacao' | 'gasometria' | 'outro';
  sampleType: LabOrderItem['sampleType'];
  unit: string;
  referenceRanges: LabReferenceRange[];
  criticalLow?: number;
  criticalHigh?: number;
  method?: string;
  active: boolean;
}

export interface LabReferenceRange {
  sex: 'M' | 'F' | 'A';
  ageMinMonths?: number;
  ageMaxMonths?: number;
  low: number;
  high: number;
  unit: string;
  description?: string;
}

export interface LabResult {
  id: string;
  orderId: string;
  orderItemId: string;
  testId: string;
  testCode: string;
  testName: string;
  patientId: string;
  value: number | string;
  unit: string;
  referenceLow?: number;
  referenceHigh?: number;
  referenceDescription?: string;
  flag: 'normal' | 'baixo' | 'alto' | 'critico_baixo' | 'critico_alto' | 'indeterminado';
  performedAt: string;
  performedBy: string;
  releasedAt?: string;
  releasedBy?: string;
  observations?: string;
  method?: string;
  equipment?: string;
  lisMessageId?: string;
  alertNotified: boolean;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface LabAlert {
  id: string;
  resultId: string;
  orderId: string;
  patientId: string;
  patientName: string;
  testName: string;
  value: number | string;
  flag: LabResult['flag'];
  severity: AlertSeverity;
  message: string;
  notifiedTo: string[];
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// ==========================================
// SEED - Modalidades e Worklist
// ==========================================
export const modalityList: { code: DicomModality; name: string; icon: string }[] = [
  { code: 'RX', name: 'Radiografia (RX)', icon: 'bone' },
  { code: 'TC', name: 'Tomografia (TC)', icon: 'layers' },
  { code: 'RM', name: 'Ressonância (RM)', icon: 'magnet' },
  { code: 'US', name: 'Ultrassonografia', icon: 'waves' },
  { code: 'MG', name: 'Mamografia', icon: 'heart' },
  { code: 'PET', name: 'PET-CT', icon: 'atom' },
  { code: 'XA', name: 'Angiografia (XA)', icon: 'git-branch' },
];

export const initialDicomStudies: DicomStudy[] = [
  {
    id: 'study_1', studyInstanceUID: '1.2.840.113619.2.55.3.604688119.971.1734567890.001',
    accessionNumber: 'ACC-2026-0001', patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida',
    modality: 'RX', modalityName: 'Radiografía', bodyPart: 'Tórax PA',
    studyDescription: 'Radiografía de tórax PA y lateral', clinicalHistory: 'Tos productiva hace 10 días. Fiebre 38.5°C. Sin mejoría con tratamiento ambulatorio.',
    referringPhysician: 'Dra. Amanda Silva', performingPhysician: 'Dr. Adriano Lima',
    institutionName: 'IAMED Centro Médico', stationName: 'RX-01 Siemens',
    scheduledAt: '2026-06-22T08:30:00', performedAt: '2026-06-22T08:45:00',
    status: 'laudo_pendente', seriesCount: 2, instanceCount: 4,
    thumbnailUrl: 'https://picsum.photos/seed/xray1/600/400',
    dicomFileRef: 'pacs://archive/2026/06/22/study_1.dcm', pacsServerId: 'PACS-MAIN', vendor: 'Siemens Healthineers',
    mwlEntryId: 'wl_1', reportId: undefined, createdAt: '2026-06-22T08:00:00',
  },
  {
    id: 'study_2', studyInstanceUID: '1.2.840.113619.2.55.3.604688119.971.1734567890.002',
    accessionNumber: 'ACC-2026-0002', patientId: 'pat_2', patientName: 'Mariana Rosa Santos',
    modality: 'US', modalityName: 'Ultrasonografía', bodyPart: 'Obstétrico',
    studyDescription: 'Ultrasonografía obstétrica - control prenatal', clinicalHistory: 'Gestante de 22 semanas. Control rutinario.',
    referringPhysician: 'Dra. Amanda Silva', performingPhysician: 'Dra. Amanda Silva',
    institutionName: 'IAMED Centro Médico', stationName: 'US-01 GE',
    scheduledAt: '2026-06-22T10:00:00', performedAt: '2026-06-22T10:25:00',
    status: 'laudado', seriesCount: 3, instanceCount: 12,
    thumbnailUrl: 'https://picsum.photos/seed/us2/600/400',
    dicomFileRef: 'pacs://archive/2026/06/22/study_2.dcm', pacsServerId: 'PACS-MAIN', vendor: 'GE Healthcare',
    mwlEntryId: 'wl_2', reportId: 'rep_2', createdAt: '2026-06-22T09:30:00',
  },
  {
    id: 'study_3', studyInstanceUID: '1.2.840.113619.2.55.3.604688119.971.1734567890.003',
    accessionNumber: 'ACC-2026-0003', patientId: 'pat_3', patientName: 'Joaquim Bento Pereira',
    modality: 'RM', modalityName: 'Resonancia', bodyPart: 'Columna Lumbar',
    studyDescription: 'RM de columna lumbar con contraste', clinicalHistory: 'Lumbalgia crónica con irradiación a MII. Fallo de tratamiento conservador.',
    referringPhysician: 'Dr. Adriano Lima', institutionName: 'IAMED Centro Médico',
    stationName: 'RM-01 Philips', scheduledAt: '2026-06-23T14:00:00',
    status: 'agendado', seriesCount: 0, instanceCount: 0,
    thumbnailUrl: 'https://picsum.photos/seed/rm3/600/400',
    dicomFileRef: '', pacsServerId: 'PACS-MAIN', vendor: 'Philips Medical',
    mwlEntryId: 'wl_3', createdAt: '2026-06-22T11:00:00',
  },
];

export const initialWorklist: WorklistEntry[] = [
  {
    id: 'wl_1', stepId: 'STEP-001', patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida',
    patientBirthdate: '1984-06-15', patientSex: 'M', patientDocument: '4.567.890',
    accessionNumber: 'ACC-2026-0001', scheduledAt: '2026-06-22T08:30:00',
    modality: 'RX', modalityAet: 'RX01_SIEMENS', stationAet: 'RX01_SIEMENS',
    requestedProcedureId: 'RX-TORAX-PA-LAT', requestedProcedureDescription: 'Rx Tórax PA y Lateral',
    scheduledStationAet: 'RX01_SIEMENS', scheduledProcedureStepId: 'STEP-001',
    referringPhysician: 'Dra. Amanda Silva',
    clinicalIndication: 'Tos productiva 10 días, fiebre 38.5°C',
    status: 'em_execucao', startedAt: '2026-06-22T08:30:00', studyId: 'study_1',
  },
  {
    id: 'wl_2', stepId: 'STEP-002', patientId: 'pat_2', patientName: 'Mariana Rosa Santos',
    patientBirthdate: '1998-11-28', patientSex: 'F', patientDocument: '5.678.901',
    accessionNumber: 'ACC-2026-0002', scheduledAt: '2026-06-22T10:00:00',
    modality: 'US', modalityAet: 'US01_GE', stationAet: 'US01_GE',
    requestedProcedureId: 'US-OBST-22W', requestedProcedureDescription: 'Ecografía obstétrica control 22 sem',
    scheduledStationAet: 'US01_GE', scheduledProcedureStepId: 'STEP-002',
    referringPhysician: 'Dra. Amanda Silva',
    clinicalIndication: 'Control prenatal rutinario - 22 semanas',
    status: 'concluido', startedAt: '2026-06-22T10:00:00', completedAt: '2026-06-22T10:25:00',
    performedBy: 'Dra. Amanda Silva', studyId: 'study_2',
  },
  {
    id: 'wl_3', stepId: 'STEP-003', patientId: 'pat_3', patientName: 'Joaquim Bento Pereira',
    patientBirthdate: '1959-02-03', patientSex: 'M', patientDocument: '1.234.567',
    accessionNumber: 'ACC-2026-0003', scheduledAt: '2026-06-23T14:00:00',
    modality: 'RM', modalityAet: 'RM01_PHILIPS', stationAet: 'RM01_PHILIPS',
    requestedProcedureId: 'RM-LUMBAR-CONTRASTE', requestedProcedureDescription: 'RM columna lumbar con contraste',
    scheduledStationAet: 'RM01_PHILIPS', scheduledProcedureStepId: 'STEP-003',
    referringPhysician: 'Dr. Adriano Lima',
    clinicalIndication: 'Lumbalgia crónica MII',
    status: 'pendente',
  },
];

export const initialHl7Messages: Hl7Message[] = [
  {
    id: 'hl7_1', messageType: 'ORM', triggerEvent: 'O01', controlId: 'ORM-20260622001',
    sendingApp: 'IAMED-HIS', sendingFacility: 'IAMED', receivingApp: 'MODALITY-RX01', receivingFacility: 'RX01',
    patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida',
    rawMessage: 'MSH|^~\\&|IAMED-HIS|IAMED|MODALITY-RX01|RX01|20260622083000||ORM^O01|ORM-20260622001|P|2.5\rPID|1||pat_1||ALMEIDA^CARLOS^EDUARDO||19840615|M\rORC|NW|ACC-2026-0001||||||1^once\rOBR|1|ACC-2026-0001||RX-TORAX-PA-LAT^Rx Torax PA y Lateral^CPT|20260622083000',
    parsedSegments: [
      { name: 'MSH', fields: ['IAMED-HIS', 'IAMED', 'MODALITY-RX01', 'RX01', '20260622083000', '', 'ORM^O01', 'ORM-20260622001', 'P', '2.5'] },
      { name: 'PID', fields: ['1', '', 'pat_1', '', 'ALMEIDA^CARLOS^EDUARDO', '', '19840615', 'M'] },
      { name: 'ORC', fields: ['NW', 'ACC-2026-0001', '', '', '', '', '', '1^once'] },
      { name: 'OBR', fields: ['1', 'ACC-2026-0001', '', 'RX-TORAX-PA-LAT^Rx Torax PA y Lateral^CPT', '20260622083000'] },
    ],
    status: 'processado', receivedAt: '2026-06-22T08:30:00', processedAt: '2026-06-22T08:30:01',
    protocol: 'HL7_v2.x', direction: 'outbound', sourceSystem: 'IAMED-HIS', relatedOrderId: 'wl_1',
  },
  {
    id: 'hl7_2', messageType: 'ORU', triggerEvent: 'R01', controlId: 'ORU-20260622045',
    sendingApp: 'LIS-ROCHE', sendingFacility: 'LAB-CENTRAL', receivingApp: 'IAMED', receivingFacility: 'IAMED',
    patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida',
    rawMessage: 'MSH|^~\\&|LIS-ROCHE|LAB-CENTRAL|IAMED|IAMED|20260622120000||ORU^R01|ORU-20260622045|P|2.5\rPID|1||pat_1||ALMEIDA^CARLOS^EDUARDO||19840615|M\rOBR|1|ORD-2026-0042||HEMOGRAMA^Hemograma Completo^L|20260622100000|20260622120000\rOBX|1|NM|HEMO-LEUC^Leucocitos^L||14200|mm3|4500-11000|H|||F\rOBX|2|NM|HEMO-HGB^Hemoglobina^L||13.8|g/dL|13.0-17.0|N|||F\rOBX|3|NM|HEMO-HCT^Hematocrito^L||41.2|%|40.0-52.0|N|||F',
    parsedSegments: [
      { name: 'MSH', fields: ['LIS-ROCHE', 'LAB-CENTRAL', 'IAMED', 'IAMED', '20260622120000', '', 'ORU^R01', 'ORU-20260622045', 'P', '2.5'] },
      { name: 'PID', fields: ['1', '', 'pat_1', '', 'ALMEIDA^CARLOS^EDUARDO', '', '19840615', 'M'] },
      { name: 'OBR', fields: ['1', 'ORD-2026-0042', '', 'HEMOGRAMA^Hemograma Completo^L', '20260622100000', '20260622120000'] },
      { name: 'OBX', fields: ['1', 'NM', 'HEMO-LEUC^Leucocitos^L', '', '14200', 'mm3', '4500-11000', 'H', '', '', 'F'] },
      { name: 'OBX', fields: ['2', 'NM', 'HEMO-HGB^Hemoglobina^L', '', '13.8', 'g/dL', '13.0-17.0', 'N', '', '', 'F'] },
      { name: 'OBX', fields: ['3', 'NM', 'HEMO-HCT^Hematocrito^L', '', '41.2', '%', '40.0-52.0', 'N', '', '', 'F'] },
    ],
    status: 'processado', receivedAt: '2026-06-22T12:00:00', processedAt: '2026-06-22T12:00:02',
    protocol: 'HL7_v2.x', direction: 'inbound', sourceSystem: 'LIS-ROCHE',
  },
];

export const initialLabTests: LabTest[] = [
  { id: 'lab_1', code: 'HEMO-LEUC', nomenclatorCode: '90.01.03', name: 'Leucocitos', category: 'hematologia', sampleType: 'sangue', unit: 'mm3', referenceRanges: [{ sex: 'A', low: 4500, high: 11000, unit: 'mm3' }], criticalLow: 2000, criticalHigh: 30000, method: 'Impedancia', active: true },
  { id: 'lab_2', code: 'HEMO-HGB', nomenclatorCode: '90.01.05', name: 'Hemoglobina', category: 'hematologia', sampleType: 'sangue', unit: 'g/dL', referenceRanges: [{ sex: 'M', low: 13.0, high: 17.0, unit: 'g/dL' }, { sex: 'F', low: 12.0, high: 15.5, unit: 'g/dL' }], criticalLow: 7.0, criticalHigh: 20.0, method: 'Cianometahemoglobina', active: true },
  { id: 'lab_3', code: 'HEMO-HCT', nomenclatorCode: '90.01.06', name: 'Hematocrito', category: 'hematologia', sampleType: 'sangue', unit: '%', referenceRanges: [{ sex: 'M', low: 40.0, high: 52.0, unit: '%' }, { sex: 'F', low: 36.0, high: 48.0, unit: '%' }], criticalLow: 20.0, criticalHigh: 60.0, method: 'Calculado', active: true },
  { id: 'lab_4', code: 'BIO-GLU', nomenclatorCode: '90.02.10', name: 'Glucosa en ayunas', category: 'bioquimica', sampleType: 'sangue', unit: 'mg/dL', referenceRanges: [{ sex: 'A', ageMinMonths: 216, low: 70, high: 100, unit: 'mg/dL', description: 'Ayunas' }], criticalLow: 40, criticalHigh: 500, method: 'Hexoquinasa', active: true },
  { id: 'lab_5', code: 'BIO-COL', nomenclatorCode: '90.02.20', name: 'Colesterol total', category: 'bioquimica', sampleType: 'sangue', unit: 'mg/dL', referenceRanges: [{ sex: 'A', low: 0, high: 200, unit: 'mg/dL', description: 'Deseable' }, { sex: 'A', low: 200, high: 240, unit: 'mg/dL', description: 'Límite alto' }], method: 'Enzimático', active: true },
  { id: 'lab_6', code: 'BIO-HDL', nomenclatorCode: '90.02.25', name: 'HDL Colesterol', category: 'bioquimica', sampleType: 'sangue', unit: 'mg/dL', referenceRanges: [{ sex: 'M', low: 40, high: 100, unit: 'mg/dL' }, { sex: 'F', low: 50, high: 100, unit: 'mg/dL' }], method: 'Enzimático directo', active: true },
  { id: 'lab_7', code: 'BIO-CREA', nomenclatorCode: '90.02.45', name: 'Creatinina', category: 'bioquimica', sampleType: 'sangue', unit: 'mg/dL', referenceRanges: [{ sex: 'M', low: 0.7, high: 1.3, unit: 'mg/dL' }, { sex: 'F', low: 0.6, high: 1.1, unit: 'mg/dL' }], criticalHigh: 7.0, method: 'Jaffé', active: true },
  { id: 'lab_8', code: 'URI-EG', nomenclatorCode: '90.30.10', name: 'Examen general de orina', category: 'urinalise', sampleType: 'urina', unit: '', referenceRanges: [{ sex: 'A', low: 0, high: 0, unit: '', description: 'Ver parámetros individuales' }], method: 'Tira reactiva + Sedimento', active: true },
  { id: 'lab_9', code: 'COA-PT', nomenclatorCode: '90.05.10', name: 'Tiempo de protrombina', category: 'coagulacao', sampleType: 'sangue', unit: 'seg', referenceRanges: [{ sex: 'A', low: 11.0, high: 13.5, unit: 'seg' }], criticalHigh: 40.0, method: 'Coagulométrico', active: true },
  { id: 'lab_10', code: 'HOR-TSH', nomenclatorCode: '90.10.10', name: 'TSH', category: 'hormonios', sampleType: 'sangue', unit: 'uUI/mL', referenceRanges: [{ sex: 'A', low: 0.4, high: 4.0, unit: 'uUI/mL' }], criticalLow: 0.1, criticalHigh: 100.0, method: 'Quimioluminiscencia', active: true },
];

export const initialLabOrders: LabOrder[] = [
  {
    id: 'labord_1', orderNumber: 'ORD-2026-0042', patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida',
    patientBirthdate: '1984-06-15', patientSex: 'M',
    requestingPhysician: 'Dra. Amanda Silva', insuranceType: 'Particular', insuranceNumber: 'N/A',
    priority: 'rotina', observations: 'Control de rutina - paciente hipertenso en tratamiento',
    status: 'concluido', collectedAt: '2026-06-22T10:00:00', receivedAt: '2026-06-22T10:15:00', completedAt: '2026-06-22T12:00:00',
    items: [
      { id: 'loi_1', code: 'HEMO-LEUC', name: 'Hemograma completo', sampleType: 'sangue', container: 'Tubo EDTA lila', status: 'concluido', resultId: 'labr_1' },
      { id: 'loi_2', code: 'BIO-GLU', name: 'Glucosa en ayunas', sampleType: 'sangue', container: 'Tubo fluoruro gris', status: 'concluido', resultId: 'labr_2' },
      { id: 'loi_3', code: 'BIO-COL', name: 'Colesterol total', sampleType: 'sangue', container: 'Tubo seco rojo', status: 'concluido', resultId: 'labr_3' },
      { id: 'loi_4', code: 'BIO-CREA', name: 'Creatinina', sampleType: 'sangue', container: 'Tubo seco rojo', status: 'concluido', resultId: 'labr_4' },
    ],
    lisMessageId: 'hl7_2', createdAt: '2026-06-22T09:30:00',
  },
  {
    id: 'labord_2', orderNumber: 'ORD-2026-0043', patientId: 'pat_2', patientName: 'Mariana Rosa Santos',
    patientBirthdate: '1998-11-28', patientSex: 'F',
    requestingPhysician: 'Dra. Amanda Silva', insuranceType: 'IPS', insuranceNumber: 'IPS-998877',
    priority: 'rotina', observations: 'Control prenatal - 22 semanas',
    status: 'em_processamento', collectedAt: '2026-06-22T11:00:00', receivedAt: '2026-06-22T11:15:00',
    items: [
      { id: 'loi_5', code: 'HEMO-LEUC', name: 'Hemograma completo', sampleType: 'sangue', container: 'Tubo EDTA lila', status: 'em_processamento' },
      { id: 'loi_6', code: 'URI-EG', name: 'Examen general de orina', sampleType: 'urina', container: 'Frasco estéril', status: 'em_processamento' },
    ],
    createdAt: '2026-06-22T10:30:00',
  },
];

export const initialLabResults: LabResult[] = [
  { id: 'labr_1', orderId: 'labord_1', orderItemId: 'loi_1', testId: 'lab_1', testCode: 'HEMO-LEUC', testName: 'Leucocitos', patientId: 'pat_1', value: 14200, unit: 'mm3', referenceLow: 4500, referenceHigh: 11000, flag: 'alto', performedAt: '2026-06-22T11:00:00', performedBy: 'Autoanalizador Roche Cobas 6000', releasedAt: '2026-06-22T12:00:00', releasedBy: 'Bioq. María González', equipment: 'Roche Cobas 6000', lisMessageId: 'hl7_2', alertNotified: true },
  { id: 'labr_2', orderId: 'labord_1', orderItemId: 'loi_2', testId: 'lab_4', testCode: 'BIO-GLU', testName: 'Glucosa en ayunas', patientId: 'pat_1', value: 108, unit: 'mg/dL', referenceLow: 70, referenceHigh: 100, flag: 'alto', performedAt: '2026-06-22T11:05:00', performedBy: 'Autoanalizador Roche Cobas 6000', releasedAt: '2026-06-22T12:00:00', releasedBy: 'Bioq. María González', equipment: 'Roche Cobas 6000', lisMessageId: 'hl7_2', alertNotified: false },
  { id: 'labr_3', orderId: 'labord_1', orderItemId: 'loi_3', testId: 'lab_5', testCode: 'BIO-COL', testName: 'Colesterol total', patientId: 'pat_1', value: 224, unit: 'mg/dL', referenceLow: 0, referenceHigh: 200, referenceDescription: 'Deseable < 200', flag: 'alto', performedAt: '2026-06-22T11:10:00', performedBy: 'Autoanalizador Roche Cobas 6000', releasedAt: '2026-06-22T12:00:00', releasedBy: 'Bioq. María González', equipment: 'Roche Cobas 6000', lisMessageId: 'hl7_2', alertNotified: false },
  { id: 'labr_4', orderId: 'labord_1', orderItemId: 'loi_4', testId: 'lab_7', testCode: 'BIO-CREA', testName: 'Creatinina', patientId: 'pat_1', value: 1.0, unit: 'mg/dL', referenceLow: 0.7, referenceHigh: 1.3, flag: 'normal', performedAt: '2026-06-22T11:15:00', performedBy: 'Autoanalizador Roche Cobas 6000', releasedAt: '2026-06-22T12:00:00', releasedBy: 'Bioq. María González', equipment: 'Roche Cobas 6000', lisMessageId: 'hl7_2', alertNotified: false },
  { id: 'labr_5', orderId: 'labord_1', orderItemId: 'loi_1', testId: 'lab_2', testCode: 'HEMO-HGB', testName: 'Hemoglobina', patientId: 'pat_1', value: 13.8, unit: 'g/dL', referenceLow: 13.0, referenceHigh: 17.0, flag: 'normal', performedAt: '2026-06-22T11:00:00', performedBy: 'Autoanalizador Roche Cobas 6000', releasedAt: '2026-06-22T12:00:00', releasedBy: 'Bioq. María González', equipment: 'Roche Cobas 6000', lisMessageId: 'hl7_2', alertNotified: false },
  { id: 'labr_6', orderId: 'labord_1', orderItemId: 'loi_1', testId: 'lab_3', testCode: 'HEMO-HCT', testName: 'Hematocrito', patientId: 'pat_1', value: 41.2, unit: '%', referenceLow: 40.0, referenceHigh: 52.0, flag: 'normal', performedAt: '2026-06-22T11:00:00', performedBy: 'Autoanalizador Roche Cobas 6000', releasedAt: '2026-06-22T12:00:00', releasedBy: 'Bioq. María González', equipment: 'Roche Cobas 6000', lisMessageId: 'hl7_2', alertNotified: false },
];

export const initialReportTemplates: ReportTemplate[] = [
  {
    id: 'tpl_rx_torax', name: 'Rx Tórax - Estándar', modality: 'RX', specialistName: 'Dr. Adriano Lima',
    sections: [
      { key: 'tecnica', title: 'Técnica', content: 'Se realizó radiografía de tórax en proyecciones PA y lateral, con equipo digital directo Siemens.', required: true, order: 1 },
      { key: 'hallazgos', title: 'Hallazgos', content: 'Campos pulmonares: {...}. Silueta cardíaca: {...}. Mediastino: {...}. Diafragma y ángulos costofrénicos: {...}.', required: true, order: 2 },
      { key: 'impresion', title: 'Impresión diagnóstica', content: '', required: true, order: 3 },
      { key: 'recomendaciones', title: 'Recomendaciones', content: 'Correlación clínica. Control en {...}.', required: false, order: 4 },
    ],
    vocabularyHints: ['cardiomegalia', 'atelectasia', 'derrame pleural', 'consolidación', 'nódulo pulmonar', 'neumotórax', 'infiltrado', 'broncograma aéreo'],
    language: 'es', active: true,
  },
  {
    id: 'tpl_us_obst', name: 'US Obstétrica - 2do Trimestre', modality: 'US', specialistName: 'Dra. Amanda Silva',
    sections: [
      { key: 'tecnica', title: 'Técnica', content: 'Ecografía obstétrica transabdominal con equipo GE Voluson.', required: true, order: 1 },
      { key: 'biometria', title: 'Biometría fetal', content: 'DBP: {...} mm. LF: {...} mm. CA: {...} mm. Peso estimado: {...} g.', required: true, order: 2 },
      { key: 'anatomia', title: 'Anatomía fetal', content: 'Cráneo: {...}. Columna: {...}. Tórax: {...}. Abdomen: {...}. Extremidades: {...}.', required: true, order: 3 },
      { key: 'placenta_liq', title: 'Placenta y líquido', content: 'Placenta: {...}. Líquido amniótico: {...}. Cordón: {...}.', required: true, order: 4 },
      { key: 'impresion', title: 'Impresión', content: 'Gestación única viva, {...} semanas por biometría. Sin alteraciones morfológicas detectables.', required: true, order: 5 },
    ],
    vocabularyHints: ['gestación', 'biometría', 'placenta', 'líquido amniótico', 'cardiotocografía', 'translucencia nucal'],
    language: 'es', active: true,
  },
  {
    id: 'tpl_lab_hemo', name: 'Laboratorio - Hemograma', modality: 'ALL', specialistName: 'Bioq. María González',
    sections: [
      { key: 'muestra', title: 'Muestra', content: 'Sangre venosa EDTA, recibida en condiciones adecuadas.', required: true, order: 1 },
      { key: 'serie_roja', title: 'Serie Roja', content: 'Ver resultados por parámetro.', required: true, order: 2 },
      { key: 'serie_blanca', title: 'Serie Blanca', content: 'Ver resultados por parámetro.', required: true, order: 3 },
      { key: 'plaquetas', title: 'Plaquetas', content: 'Ver resultados por parámetro.', required: true, order: 4 },
      { key: 'observaciones', title: 'Observaciones', content: '', required: false, order: 5 },
    ],
    vocabularyHints: ['anemia', 'leucocitosis', 'leucopenia', 'trombocitosis', 'trombocitopenia', 'macrovalocitosis', 'microcitosis'],
    language: 'es', active: true,
  },
];

export const initialImagingReports: ImagingReport[] = [
  {
    id: 'rep_2', studyId: 'study_2', patientId: 'pat_2', patientName: 'Mariana Rosa Santos',
    modality: 'US', templateId: 'tpl_us_obst',
    technique: 'Ecografía obstétrica transabdominal con equipo GE Voluson E8. Gestación de 22 semanas 4 días.',
    findings: 'DBP: 54mm (22s4d). LF: 41mm (22s3d). CA: 174mm (22s2d). Peso estimado: 480g. Placenta fúndica posterior, grado I. Líquido amniótico en cantidad normal (ILA 12cm). Cordón umbilical con 3 vasos. Movimientos fetales activos. Frecuencia cardíaca fetal 148 lpm.',
    impression: 'Gestación única viva de 22 semanas 4 días por biometría. Crecimiento fetal armónico percentil 50. Sin alteraciones morfológicas detectables en la evaluación. Líquido amniótico y placenta dentro de parámetros normales.',
    recommendations: 'Control ecográfico en 4 semanas (28 semanas). Continuar controles prenatales. Suplementación con ácido fólico y sulfato ferroso.',
    keyImages: ['https://picsum.photos/seed/us2/600/400', 'https://picsum.photos/seed/us2b/600/400'],
    bodyPart: 'Obstétrico', status: 'laudado',
    reportedBy: 'Dra. Amanda Silva', reportedAt: '2026-06-22T11:00:00',
    signedBy: 'Dra. Amanda Silva', signedAt: '2026-06-22T11:05:00', signatureId: 'sig_rep_2',
    distributionChannels: ['portal_paciente', 'email_solicitante'],
    voiceTranscriptionUsed: true, createdAt: '2026-06-22T10:30:00', updatedAt: '2026-06-22T11:05:00',
  },
];

export const initialLabAlerts: LabAlert[] = [
  { id: 'alert_1', resultId: 'labr_1', orderId: 'labord_1', patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida', testName: 'Leucocitos', value: 14200, flag: 'alto', severity: 'warning', message: 'Leucocitosis (14.200/mm³). Valores de referencia: 4.500-11.000/mm³. Correlacionar con clínica.', notifiedTo: ['Dra. Amanda Silva'], createdAt: '2026-06-22T12:00:05' },
  { id: 'alert_2', resultId: 'labr_2', orderId: 'labord_1', patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida', testName: 'Glucosa en ayunas', value: 108, flag: 'alto', severity: 'info', message: 'Glucosa 108 mg/dL. Ligeramente elevada. Considerar intolerancia a la glucosa.', notifiedTo: ['Dra. Amanda Silva'], createdAt: '2026-06-22T12:00:06' },
];

