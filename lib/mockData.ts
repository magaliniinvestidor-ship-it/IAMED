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
  triaged_at?: string;
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
  status: 'agendado' | 'aguardando' | 'triado' | 'atendimento' | 'atendido' | 'internado';
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
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Não Informado';
  allergies?: string;
  health_insurance_type?: 'IPS' | 'Sanidade Militar' | 'Sanidade Policial' | 'Pré-paga' | 'Seguro Privado' | 'Particular';
  health_insurance_number?: string;
  health_insurance_company?: string;
  employer?: string;
  guardian_name?: string;
  guardian_document_type?: 'CI' | 'Passaporte' | 'RG' | 'Outro';
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
  insurance_type?: string;
  duration_minutes?: number;
  booked_via?: 'recepcao' | 'portal' | 'whatsapp' | 'call_center';
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
  createdAt?: string;
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

export type ProfessionalRole = 'Médico(a)' | 'Enfermeiro(a)' | 'Fisioterapeuta' | 'Psicólogo(a)' | 'Nutricionista' | 'Técnico(a) de Enfermagem' | 'Administrador(a)' | 'Recepcionista' | 'Auxiliar de Enfermagem' | 'Anestesiologista' | 'Cirurgião(ã)' | 'Terapeuta Ocupacional' | 'Educador Físico' | 'Assistente Social' | 'Fonoaudiólogo(a)' | 'Farmacêutico(a)' | 'Dentista' | 'Biomédico(a)' | 'Técnico(a) em Radiologia' | 'Técnico(a) em Farmácia' | 'Técnico(a) de Laboratório';
export type ProfessionalCouncil = 'CRM' | 'COREN' | 'CREFITO' | 'CFP' | 'CFN' | 'CRO' | 'N/A' | 'CRESS' | 'CRFa' | 'CRF' | 'CRBM' | 'CREF' | 'CRA' | 'CREFONO' | 'CRTR';
export type ProfessionalShift = 'Manhã' | 'Tarde' | 'Noite' | 'Integral' | 'Plantão 12h' | 'Plantão 24h';

export interface Professional {
  id: string;
  name: string;
  role: string;
  specialty: string;
  council: ProfessionalCouncil;
  councilNumber: string;
  shift: ProfessionalShift;
  email: string;
  phone: string;
  status: 'ativo' | 'inativo' | 'férias';
  admissionDate: string;
  color?: string;
  permissions?: string[];
  locationId?: string;
  userId?: string;
  updatedAt?: string;
}

// ==========================================
// ADMINISTRAÇÃO DO SISTEMA E SEGURANÇA
// ==========================================

export type SystemRole = 'SuperAdmin' | 'Administrador' | 'Gestor' | 'Diretor Clínico' | 'Médico' | 'Enfermeiro' | 'Recepcionista' | 'Financeiro' | 'Farmacêutico' | 'Visualizador' | 'Auxiliar de Enfermagem' | 'Anestesiologista' | 'Cirurgião(ã)' | 'Terapeuta Ocupacional' | 'Educador Físico' | 'Assistente Social' | 'Fonoaudiólogo(a)' | 'Dentista' | 'Biomédico(a)' | 'Técnico(a) em Radiologia' | 'Técnico(a) em Farmácia' | 'Técnico(a) de Laboratório' | 'Nutricionista' | 'Psicólogo(a)' | 'Técnico(a) de Enfermagem';

export interface SystemUser {
  id: string;
  authUserId?: string;
  professionalId?: string;
  name: string;
  email?: string;
  ci?: string;
  systemRole: SystemRole;
  permissions: string[];
  location?: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'totp' | 'sms' | 'email' | 'none';
  lastLogin?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PasswordPolicy {
  enabled: boolean;
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number;
  historyCount: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
}

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  ipAddress: string;
  deviceInfo: string;
  loginAt: string;
  lastActivityAt: string;
  expiresAt: string;
  active: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  attemptedAt: string;
  failureReason?: string;
}

export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth2' | 'oidc';
  enabled: boolean;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  metadataUrl: string;
  certificateFingerprint: string;
  defaultRole: SystemRole;
  active: boolean;
}

export interface TwoFactorBackupCode {
  code: string;
  used: boolean;
  usedAt: string | null;
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  enabled: true,
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  expirationDays: 90,
  historyCount: 5,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  sessionTimeoutMinutes: 60,
};

export const initialSystemUsers: SystemUser[] = [];

export const initialPasswordPolicy: PasswordPolicy = { ...DEFAULT_PASSWORD_POLICY };

export const initialUserSessions: UserSession[] = [];

export const initialLoginAttempts: LoginAttempt[] = [
  { id: 'att_1', email: 'admin@iamed.med.br', success: true, ipAddress: '192.168.1.10', userAgent: 'Chrome 128', attemptedAt: '2026-07-02 08:30:00' },
  { id: 'att_2', email: 'amanda.silva@iamed.med.br', success: true, ipAddress: '10.0.0.12', userAgent: 'Firefox 127', attemptedAt: '2026-07-02 09:15:00' },
  { id: 'att_3', email: 'invasor@test.com', success: false, ipAddress: '203.0.113.5', userAgent: 'Unknown', attemptedAt: '2026-07-02 03:22:00', failureReason: 'Credenciais inválidas' },
  { id: 'att_4', email: 'invasor@test.com', success: false, ipAddress: '203.0.113.5', userAgent: 'Unknown', attemptedAt: '2026-07-02 03:23:00', failureReason: 'Credenciais inválidas' },
  { id: 'att_5', email: 'invasor@test.com', success: false, ipAddress: '203.0.113.5', userAgent: 'Unknown', attemptedAt: '2026-07-02 03:24:00', failureReason: 'Credenciais inválidas' },
  { id: 'att_6', email: 'financeiro@iamed.med.br', success: true, ipAddress: '192.168.1.20', userAgent: 'Chrome 128', attemptedAt: '2026-07-02 08:00:00' },
  { id: 'att_7', email: 'bruno.castro@iamed.med.br', success: false, ipAddress: '10.0.0.50', userAgent: 'Safari 18', attemptedAt: '2026-07-01 23:45:00', failureReason: 'Senha expirada' },
];

export const initialSSOProviders: SSOProvider[] = [
  { id: 'sso_1', name: 'Azure AD (Microsoft)', type: 'oidc', enabled: true, issuerUrl: 'https://login.microsoftonline.com/tenant-id/v2.0', clientId: 'az_iamed_webapp', clientSecret: '********', metadataUrl: 'https://login.microsoftonline.com/tenant-id/v2.0/.well-known/openid-configuration', certificateFingerprint: 'A1:B2:C3:D4:E5:F6:...', defaultRole: 'Visualizador', active: true },
  { id: 'sso_2', name: 'Google Workspace', type: 'oauth2', enabled: false, issuerUrl: 'https://accounts.google.com', clientId: 'google_iamed_client', clientSecret: '********', metadataUrl: 'https://accounts.google.com/.well-known/openid-configuration', certificateFingerprint: '', defaultRole: 'Visualizador', active: false },
];

export { DEFAULT_PASSWORD_POLICY };

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

// ==========================================
// FATURAMENTO - NOVAS INTERFACES (SIFEN/DNIT)
// ==========================================

export type InsuranceType = 'IPS' | 'Sanidade Militar' | 'Sanidade Policial' | 'EMP' | 'Seguro Privado' | 'Corporativo' | 'Particular' | 'Mercosul';

export interface FeeSchedule {
  id: string;
  insurance_type: InsuranceType;
  insurance_name: string;
  specialty: string;
  procedure_code: string;
  procedure_name: string;
  base_price: number;
  repasse_percent: number;
  copay_amount: number;
  copay_percent: number;
  coverage_limit: number;
  requires_authorization: boolean;
  active: boolean;
}

export interface InsuranceCompany {
  id: string;
  name: string;
  type: InsuranceType;
  ruc: string;
  contact: string;
  phone: string;
  email: string;
  has_webservice: boolean;
  webservice_url: string;
  requires_authorization: boolean;
  requires_pre_approval: boolean;
  copay_rules: string;
  coverage_ceiling: number;
  active: boolean;
}

export interface PreAuthorization {
  id: string;
  patient_id: string;
  patient_name: string;
  insurance_id: string;
  insurance_name: string;
  procedure_code: string;
  procedure_name: string;
  requested_amount: number;
  authorized_amount: number;
  status: 'solicitada' | 'autorizada' | 'negada' | 'parcial';
  authorization_number: string;
  request_date: string;
  response_date: string;
  notes: string;
}

export interface BatchInvoice {
  id: string;
  insurance_id: string;
  insurance_name: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  dte_count: number;
  status: 'gerado' | 'enviado' | 'aprovado' | 'rejeitado';
  dte_ids: string[];
  created_at: string;
}

export interface EligibilityCheck {
  id: string;
  patient_id: string;
  patient_name: string;
  insurance_id: string;
  insurance_name: string;
  procedure_code: string;
  procedure_name: string;
  status: 'pendente' | 'coberto' | 'negado' | 'erro';
  coverage_percent: number;
  copay_amount: number;
  network: string;
  authorization_required: boolean;
  checked_at: string;
  response: string;
}

export interface ProfessionalSettlement {
  id: string;
  professional_id: string;
  professional_name: string;
  period_start: string;
  period_end: string;
  gross_amount: number;
  deductions: number;
  net_amount: number;
  irp_withheld: number;
  iva_withheld: number;
  status: 'calculado' | 'liquidado' | 'pago';
  dte_ids: string[];
  settlement_date: string;
  payment_date: string;
}

export interface ForeignBilling {
  id: string;
  patient_id: string;
  patient_name: string;
  country: string;
  currency: 'USD' | 'ARS' | 'BRL' | 'EUR';
  exchange_rate: number;
  amount_local: number;
  amount_foreign: number;
  documents_generated: string[];
  status: 'gerado' | 'entregue' | 'reembolsado';
}

// Seed data - Insurance Companies
export const initialInsurances: InsuranceCompany[] = [
  { id: 'ins_1', name: 'IPS - Instituto de Previsión Social', type: 'IPS', ruc: '80005123-1', contact: 'Lic. María González', phone: '+59521234567', email: 'facturacion@ips.gov.py', has_webservice: true, webservice_url: 'https://ws.ips.gov.py/elegibilidad', requires_authorization: true, requires_pre_approval: true, copay_rules: 'Copago 5% sobre nomenclador IPS', coverage_ceiling: 50000000, active: true },
  { id: 'ins_2', name: 'Sanidad Militar - FF.AA.', type: 'Sanidade Militar', ruc: '80010001-2', contact: 'Gral. Rodríguez', phone: '+59521230000', email: 'sanidad@mdn.gov.py', has_webservice: true, webservice_url: 'https://ws.sanidad.mil.py/cobertura', requires_authorization: true, requires_pre_approval: true, copay_rules: 'Sin copago para personal activo', coverage_ceiling: 30000000, active: true },
  { id: 'ins_3', name: 'Sanidad Policial - P.N.', type: 'Sanidade Policial', ruc: '80020001-1', contact: 'Comisario Benítez', phone: '+59521240000', email: 'sanidad@policia.gov.py', has_webservice: false, webservice_url: '', requires_authorization: true, requires_pre_approval: false, copay_rules: 'Copago 10% sobre tabla', coverage_ceiling: 20000000, active: true },
  { id: 'ins_4', name: 'Plan Med Salud', type: 'EMP', ruc: '80069563-1', contact: 'Sr. López', phone: '+595981111111', email: 'facturacion@planmed.com.py', has_webservice: true, webservice_url: 'https://api.planmed.com.py/v2/elegibilidad', requires_authorization: true, requires_pre_approval: true, copay_rules: 'Copago fijo 50.000 Gs. consulta; 20% procedimientos', coverage_ceiling: 100000000, active: true },
  { id: 'ins_5', name: 'Seguros Yacyretá S.A.', type: 'Seguro Privado', ruc: '80045678-1', contact: 'Lic. Martínez', phone: '+59521222222', email: 'reembolso@yacyreta.com.py', has_webservice: true, webservice_url: 'https://ws.yacyreta.com.py/cobertura', requires_authorization: false, requires_pre_approval: false, copay_rules: 'Reembolso 80% tabla referencial', coverage_ceiling: 150000000, active: true },
  { id: 'ins_6', name: 'Grupo Industrial Norte S.A.', type: 'Corporativo', ruc: '80123456-1', contact: 'Sra. Duarte', phone: '+595985555555', email: 'rh@norte.com.py', has_webservice: false, webservice_url: '', requires_authorization: false, requires_pre_approval: false, copay_rules: 'Descuento 15% convenio corporativo', coverage_ceiling: 80000000, active: true },
];

// Seed data - Fee Schedule
export const initialFeeSchedules: FeeSchedule[] = [
  { id: 'fee_1', insurance_type: 'Particular', insurance_name: 'Particular', specialty: 'Clínica Geral', procedure_code: '10101012', procedure_name: 'Consulta Médica Geral', base_price: 150000, repasse_percent: 60, copay_amount: 0, copay_percent: 0, coverage_limit: 0, requires_authorization: false, active: true },
  { id: 'fee_2', insurance_type: 'IPS', insurance_name: 'IPS - Instituto de Previsión Social', specialty: 'Cardiologia', procedure_code: '10101025', procedure_name: 'Consulta Cardiológica', base_price: 120000, repasse_percent: 55, copay_amount: 6000, copay_percent: 5, coverage_limit: 5000000, requires_authorization: true, active: true },
  { id: 'fee_3', insurance_type: 'EMP', insurance_name: 'Plan Med Salud', specialty: 'Cardiologia', procedure_code: '10101025', procedure_name: 'Consulta Cardiológica', base_price: 200000, repasse_percent: 60, copay_amount: 50000, copay_percent: 0, coverage_limit: 10000000, requires_authorization: true, active: true },
  { id: 'fee_4', insurance_type: 'Sanidade Militar', insurance_name: 'Sanidad Militar - FF.AA.', specialty: 'Ortopedia', procedure_code: '10101012', procedure_name: 'Consulta Médica Geral', base_price: 90000, repasse_percent: 50, copay_amount: 0, copay_percent: 0, coverage_limit: 3000000, requires_authorization: true, active: true },
  { id: 'fee_5', insurance_type: 'Seguro Privado', insurance_name: 'Seguros Yacyretá S.A.', specialty: 'Cardiologia', procedure_code: '40201011', procedure_name: 'Ultrassonografia Obstétrica', base_price: 500000, repasse_percent: 65, copay_amount: 0, copay_percent: 0, coverage_limit: 0, requires_authorization: false, active: true },
  { id: 'fee_6', insurance_type: 'Corporativo', insurance_name: 'Grupo Industrial Norte S.A.', specialty: 'Clínica Geral', procedure_code: '10101012', procedure_name: 'Consulta Médica Geral', base_price: 127500, repasse_percent: 60, copay_amount: 0, copay_percent: 0, coverage_limit: 0, requires_authorization: false, active: true },
  { id: 'fee_7', insurance_type: 'Particular', insurance_name: 'Particular', specialty: 'Radiologia', procedure_code: '30101000', procedure_name: 'Raio-X Tórax (2 incidências)', base_price: 180000, repasse_percent: 50, copay_amount: 0, copay_percent: 0, coverage_limit: 0, requires_authorization: false, active: true },
  { id: 'fee_8', insurance_type: 'Sanidade Policial', insurance_name: 'Sanidad Policial - P.N.', specialty: 'Clínica Geral', procedure_code: '10101012', procedure_name: 'Consulta Médica Geral', base_price: 80000, repasse_percent: 50, copay_amount: 8000, copay_percent: 10, coverage_limit: 2000000, requires_authorization: false, active: true },
];

// Seed data - Pre-Authorizations
export const initialPreAuthorizations: PreAuthorization[] = [
  { id: 'pre_1', patient_id: 'pat_1', patient_name: 'Carlos Eduardo Almeida', insurance_id: 'ins_1', insurance_name: 'IPS - Instituto de Previsión Social', procedure_code: '40201011', procedure_name: 'Ultrassonografia Obstétrica', requested_amount: 500000, authorized_amount: 450000, status: 'autorizada', authorization_number: 'AUTH-2026-0042', request_date: '2026-06-15', response_date: '2026-06-17', notes: 'Autorizado parcial - 90% cobertura' },
  { id: 'pre_2', patient_id: 'pat_2', patient_name: 'Mariana Rosa Santos', insurance_id: 'ins_4', insurance_name: 'Plan Med Salud', procedure_code: '40201011', procedure_name: 'Ultrassonografia Obstétrica', requested_amount: 500000, authorized_amount: 500000, status: 'autorizada', authorization_number: 'AUTH-2026-0045', request_date: '2026-06-18', response_date: '2026-06-19', notes: 'Autorizado total conforme plano' },
];

// Seed data - Batch Invoices
export const initialBatchInvoices: BatchInvoice[] = [
  { id: 'batch_1', insurance_id: 'ins_1', insurance_name: 'IPS - Instituto de Previsión Social', period_start: '2026-06-01', period_end: '2026-06-30', total_amount: 2350000, dte_count: 3, status: 'gerado', dte_ids: ['dte_1', 'dte_2'], created_at: '2026-06-28' },
  { id: 'batch_2', insurance_id: 'ins_4', insurance_name: 'Plan Med Salud', period_start: '2026-06-01', period_end: '2026-06-30', total_amount: 1100000, dte_count: 1, status: 'enviado', dte_ids: ['dte_3'], created_at: '2026-06-28' },
];

// Seed data - Eligibility Checks
export const initialEligibilityChecks: EligibilityCheck[] = [
  { id: 'elig_1', patient_id: 'pat_1', patient_name: 'Carlos Eduardo Almeida', insurance_id: 'ins_1', insurance_name: 'IPS - Instituto de Previsión Social', procedure_code: '10101025', procedure_name: 'Consulta Cardiológica', status: 'coberto', coverage_percent: 95, copay_amount: 6000, network: 'RED_IPS', authorization_required: true, checked_at: '2026-06-22T08:00:00', response: 'Contribuyente activo. Cobertura vigente. Autorización requerida: S01' },
  { id: 'elig_2', patient_id: 'pat_2', patient_name: 'Mariana Rosa Santos', insurance_id: 'ins_4', insurance_name: 'Plan Med Salud', procedure_code: '40201011', procedure_name: 'Ultrassonografia Obstétrica', status: 'coberto', coverage_percent: 100, copay_amount: 0, network: 'RED_PLANMED', authorization_required: true, checked_at: '2026-06-22T08:05:00', response: 'Plan Premium vigente. Sin copago para estudios obstétricos.' },
];

// Seed data - Professional Settlements
export const initialSettlements: ProfessionalSettlement[] = [
  { id: 'sett_1', professional_id: 'prof_1', professional_name: 'Dra. Amanda Silva', period_start: '2026-06-01', period_end: '2026-06-15', gross_amount: 3500000, deductions: 525000, net_amount: 2975000, irp_withheld: 105000, iva_withheld: 420000, status: 'liquidado', dte_ids: ['dte_1', 'dte_2'], settlement_date: '2026-06-20', payment_date: '2026-06-22' },
  { id: 'sett_2', professional_id: 'prof_2', professional_name: 'Dr. Adriano Lima', period_start: '2026-06-01', period_end: '2026-06-15', gross_amount: 2800000, deductions: 420000, net_amount: 2380000, irp_withheld: 84000, iva_withheld: 336000, status: 'pago', dte_ids: ['dte_3'], settlement_date: '2026-06-20', payment_date: '2026-06-21' },
];

// Seed data - Foreign Billings
export const initialForeignBillings: ForeignBilling[] = [
  { id: 'frn_1', patient_id: 'pat_5', patient_name: 'Roberto de Oliveira Cruz', country: 'BR', currency: 'USD', exchange_rate: 7500, amount_local: 450000, amount_foreign: 60, documents_generated: ['Invoice_INV-2026-001.pdf', 'Recibo_Rec-2026-001.pdf'], status: 'gerado' },
];

// ==========================================
// GESTÃO FINANCEIRA E CONTÁBIL
// ==========================================

export interface AccountPayable {
  id: string;
  description: string;
  supplier: string;
  ruc: string;
  category: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  status: 'a_vencer' | 'vencido' | 'pago' | 'cancelado';
  payment_date?: string;
  dte_number?: string;
  cost_center: string;
  notes: string;
}

export interface AccountReceivable {
  id: string;
  description: string;
  patient_name: string;
  insurance_name: string;
  category: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  status: 'a_vencer' | 'vencido' | 'recebido' | 'cancelado';
  receipt_date?: string;
  dte_number: string;
  cost_center: string;
  notes: string;
}

export interface CashFlowProjection {
  id: string;
  date: string;
  type: 'realizado' | 'projetado';
  income: number;
  expense: number;
  balance: number;
  accumulated: number;
  notes: string;
}

export interface BankReconciliation {
  id: string;
  bank_name: string;
  account_number: string;
  statement_date: string;
  bank_balance: number;
  book_balance: number;
  difference: number;
  status: 'pendente' | 'conciliado' | 'divergente';
  entries: { description: string; amount: number; type: 'credito' | 'debito'; reconciled: boolean }[];
  last_reconciled: string;
}

export interface CostCenter {
  id: string;
  name: string;
  type: 'unidade' | 'especialidade' | 'profissional';
  parent_id: string;
  budget: number;
  spent: number;
  revenue: number;
  active: boolean;
}

export interface IncomeStatement {
  id: string;
  period: string;
  revenue_consultas: number;
  revenue_exames: number;
  revenue_procedimentos: number;
  revenue_internacao: number;
  revenue_outros: number;
  revenue_total: number;
  cost_insumos: number;
  cost_pessoal: number;
  cost_operacional: number;
  cost_ocupacional: number;
  cost_total: number;
  gross_profit: number;
  expenses_admin: number;
  expenses_marketing: number;
  expenses_tax: number;
  expenses_financial: number;
  expenses_total: number;
  net_income: number;
  irp: number;
  iva: number;
  net_income_after_tax: number;
}

export interface TaxCalculation {
  id: string;
  period: string;
  tax_type: 'IVA' | 'IRE' | 'IRP' | 'IDU';
  taxable_base: number;
  tax_rate: number;
  tax_amount: number;
  status: 'calculado' | 'declarado' | 'pago';
  due_date: string;
  payment_date: string;
  notes: string;
}

export interface PurchaseBookEntry {
  id: string;
  dte_number: string;
  supplier: string;
  ruc: string;
  date: string;
  timbrado: string;
  invoice_type: string;
  taxable_5: number;
  taxable_10: number;
  iva_5: number;
  iva_10: number;
  total: number;
}

export interface SalesBookEntry {
  id: string;
  dte_number: string;
  patient_name: string;
  ruc: string;
  date: string;
  timbrado: string;
  invoice_type: string;
  taxable_5: number;
  taxable_10: number;
  iva_5: number;
  iva_10: number;
  total: number;
}

export interface ExchangeRate {
  id: string;
  currency: 'USD' | 'ARS' | 'BRL' | 'EUR';
  buy_rate: number;
  sell_rate: number;
  date: string;
  source: string;
}

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: 'ativo' | 'passivo' | 'patrimonio' | 'receita' | 'despesa' | 'custo';
  level: number;
  parent_code: string;
  balance: number;
  active: boolean;
}

export interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  account_debit: string;
  account_credit: string;
  amount: number;
  event_type: 'faturamento' | 'recebimento' | 'pagamento' | 'devolucao' | 'ajuste';
  document_number: string;
  cost_center: string;
  notes: string;
}

// Seed data - Accounts Payable
export const initialAccountsPayable: AccountPayable[] = [
  { id: 'ap_1', description: 'Compra de insumos médicos - Proveedora Médica S.A.', supplier: 'Proveedora Médica S.A.', ruc: '80123456-5', category: 'Insumos Médicos', amount: 2850000, due_date: '2026-07-15', days_overdue: 0, status: 'a_vencer', cost_center: 'Administrativo', notes: 'Lotes de seringas, gasas y guantes' },
  { id: 'ap_2', description: 'Aluguel mensal - Edificio Medical Center', supplier: 'Medical Center S.A.', ruc: '80543210-1', category: 'Operacional', amount: 5000000, due_date: '2026-07-05', days_overdue: 0, status: 'a_vencer', cost_center: 'Administrativo', notes: 'Aluguel julho/2026' },
  { id: 'ap_3', description: 'Servicios públicos - ANDE', supplier: 'ANDE', ruc: '80012345-9', category: 'Operacional', amount: 890000, due_date: '2026-06-20', days_overdue: 10, status: 'vencido', cost_center: 'Administrativo', notes: 'Energia elétrica' },
  { id: 'ap_4', description: 'Honorarios contables - Estudio Benítez', supplier: 'Estudio Benítez', ruc: '80456789-3', category: 'Serviços', amount: 1500000, due_date: '2026-06-10', days_overdue: 20, status: 'vencido', cost_center: 'Administrativo', notes: 'Servicios contables mayo/2026' },
];

// Seed data - Accounts Receivable
export const initialAccountsReceivable: AccountReceivable[] = [
  { id: 'ar_1', description: 'Consulta Cardiológica - Carlos Almeida', patient_name: 'Carlos Eduardo Almeida', insurance_name: 'IPS', category: 'Consultas', amount: 750000, due_date: '2026-07-10', days_overdue: 0, status: 'a_vencer', dte_number: '001-001-0000001', cost_center: 'Cardiologia', notes: 'IPS autorización S01' },
  { id: 'ar_2', description: 'Ultrassonografia Obstétrica - Mariana Santos', patient_name: 'Mariana Rosa Santos', insurance_name: 'Plan Med Salud', category: 'Exames de Imagem', amount: 1100000, due_date: '2026-07-05', days_overdue: 0, status: 'a_vencer', dte_number: '001-001-0000002', cost_center: 'Ultrassonografia', notes: '' },
  { id: 'ar_3', description: 'Rx Tórax - Roberto Oliveira', patient_name: 'Roberto de Oliveira Cruz', insurance_name: 'Particular', category: 'Exames de Imagem', amount: 180000, due_date: '2026-06-15', days_overdue: 15, status: 'vencido', dte_number: '001-001-0000004', cost_center: 'Radiologia', notes: '2a cobrança enviada' },
];

// Seed data - Cash Flow Projection
export const initialCashFlows: CashFlowProjection[] = [
  { id: 'cf_1', date: '2026-06-23', type: 'realizado', income: 3850000, expense: 1200000, balance: 2650000, accumulated: 2650000, notes: '' },
  { id: 'cf_2', date: '2026-06-24', type: 'realizado', income: 2100000, expense: 890000, balance: 1210000, accumulated: 3860000, notes: '' },
  { id: 'cf_3', date: '2026-06-25', type: 'realizado', income: 1500000, expense: 3000000, balance: -1500000, accumulated: 2360000, notes: 'Pago aluguel' },
  { id: 'cf_4', date: '2026-06-26', type: 'realizado', income: 0, expense: 450000, balance: -450000, accumulated: 1910000, notes: '' },
  { id: 'cf_5', date: '2026-06-27', type: 'realizado', income: 3200000, expense: 600000, balance: 2600000, accumulated: 4510000, notes: '' },
  { id: 'cf_6', date: '2026-06-28', type: 'projetado', income: 2000000, expense: 1500000, balance: 500000, accumulated: 5010000, notes: 'Projeção' },
  { id: 'cf_7', date: '2026-06-29', type: 'projetado', income: 1800000, expense: 900000, balance: 900000, accumulated: 5910000, notes: 'Projeção' },
  { id: 'cf_8', date: '2026-06-30', type: 'projetado', income: 2500000, expense: 2000000, balance: 500000, accumulated: 6410000, notes: 'Projeção fechamento mensal' },
];

// Seed data - Bank Reconciliation
export const initialBankReconciliations: BankReconciliation[] = [
  { id: 'br_1', bank_name: 'Banco Continental', account_number: '101-234567-8', statement_date: '2026-06-30', bank_balance: 18500000, book_balance: 18230000, difference: 270000, status: 'pendente', entries: [
    { description: 'Cheque pendente #1045', amount: 270000, type: 'debito', reconciled: false },
  ], last_reconciled: '2026-05-31' },
  { id: 'br_2', bank_name: 'Banco Itaú Paraguay', account_number: '333-987654-0', statement_date: '2026-06-30', bank_balance: 5200000, book_balance: 5200000, difference: 0, status: 'conciliado', entries: [], last_reconciled: '2026-06-30' },
];

// Seed data - Cost Centers
export const initialCostCenters: CostCenter[] = [
  { id: 'cc_1', name: 'Cardiologia', type: 'especialidade', parent_id: '', budget: 50000000, spent: 12400000, revenue: 18700000, active: true },
  { id: 'cc_2', name: 'Radiologia', type: 'especialidade', parent_id: '', budget: 30000000, spent: 8900000, revenue: 14200000, active: true },
  { id: 'cc_3', name: 'Ultrassonografia', type: 'especialidade', parent_id: '', budget: 25000000, spent: 6500000, revenue: 9800000, active: true },
  { id: 'cc_4', name: 'Medicina do Trabalho', type: 'especialidade', parent_id: '', budget: 20000000, spent: 4200000, revenue: 6100000, active: true },
  { id: 'cc_5', name: 'Administrativo', type: 'unidade', parent_id: '', budget: 40000000, spent: 18500000, revenue: 0, active: true },
  { id: 'cc_6', name: 'Dra. Amanda Silva', type: 'profissional', parent_id: 'cc_1', budget: 15000000, spent: 0, revenue: 7200000, active: true },
  { id: 'cc_7', name: 'Dr. Adriano Lima', type: 'profissional', parent_id: 'cc_2', budget: 12000000, spent: 0, revenue: 5400000, active: true },
];

// Seed data - Income Statement (DRE)
export const initialIncomeStatements: IncomeStatement[] = [
  { id: 'is_1', period: '2026-06', revenue_consultas: 12500000, revenue_exames: 9800000, revenue_procedimentos: 4200000, revenue_internacao: 3500000, revenue_outros: 800000, revenue_total: 30800000, cost_insumos: 5800000, cost_pessoal: 9200000, cost_operacional: 4100000, cost_ocupacional: 1500000, cost_total: 20600000, gross_profit: 10200000, expenses_admin: 3200000, expenses_marketing: 800000, expenses_tax: 2100000, expenses_financial: 450000, expenses_total: 6550000, net_income: 3650000, irp: 109500, iva: 438000, net_income_after_tax: 3102500 },
];

// Seed data - Tax Calculation
export const initialTaxCalculations: TaxCalculation[] = [
  { id: 'tax_1', period: '2026-06', tax_type: 'IVA', taxable_base: 28000000, tax_rate: 10, tax_amount: 2800000, status: 'calculado', due_date: '2026-07-15', payment_date: '', notes: 'IVA mensal - ventas generales' },
  { id: 'tax_2', period: '2026-06', tax_type: 'IRE', taxable_base: 3650000, tax_rate: 10, tax_amount: 365000, status: 'calculado', due_date: '2026-07-31', payment_date: '', notes: 'Impuesto a la Renta Empresarial' },
  { id: 'tax_3', period: '2026-06', tax_type: 'IRP', taxable_base: 3102500, tax_rate: 3, tax_amount: 93075, status: 'calculado', due_date: '2026-08-15', payment_date: '', notes: 'IRP personas físicas' },
  { id: 'tax_4', period: '2026-06', tax_type: 'IDU', taxable_base: 5000000, tax_rate: 1, tax_amount: 50000, status: 'calculado', due_date: '2026-07-20', payment_date: '', notes: 'Impuesto a la Documentación' },
];

// Seed data - Purchase Book (Livro de Compras)
export const initialPurchaseBook: PurchaseBookEntry[] = [
  { id: 'pb_1', dte_number: '001-002-0000101', supplier: 'Proveedora Médica S.A.', ruc: '80123456-5', date: '2026-06-05', timbrado: '87654321', invoice_type: 'Fatura Eletrônica', taxable_5: 1000000, taxable_10: 1850000, iva_5: 50000, iva_10: 185000, total: 2850000 },
  { id: 'pb_2', dte_number: '001-002-0000105', supplier: 'Oficina Farmacéutica S.A.', ruc: '80765432-1', date: '2026-06-12', timbrado: '87654322', invoice_type: 'Fatura Eletrônica', taxable_5: 0, taxable_10: 1200000, iva_5: 0, iva_10: 120000, total: 1200000 },
];

// Seed data - Sales Book (Livro de Vendas)
export const initialSalesBook: SalesBookEntry[] = [
  { id: 'sb_1', dte_number: '001-001-0000001', patient_name: 'Carlos Eduardo Almeida', ruc: '', date: '2026-06-21', timbrado: '12345678', invoice_type: 'Fatura Eletrônica', taxable_5: 0, taxable_10: 750000, iva_5: 0, iva_10: 68182, total: 750000 },
  { id: 'sb_2', dte_number: '001-001-0000002', patient_name: 'Mariana Rosa Santos', ruc: '', date: '2026-06-21', timbrado: '12345678', invoice_type: 'Fatura Eletrônica', taxable_5: 0, taxable_10: 1100000, iva_5: 0, iva_10: 100000, total: 1100000 },
  { id: 'sb_3', dte_number: '001-001-0000004', patient_name: 'Roberto de Oliveira Cruz', ruc: '80123456-1', date: '2026-06-23', timbrado: '12345678', invoice_type: 'Fatura Eletrônica', taxable_5: 0, taxable_10: 450000, iva_5: 0, iva_10: 40909, total: 450000 },
];

// Seed data - Exchange Rates (BCP)
export const initialExchangeRates: ExchangeRate[] = [
  { id: 'fx_1', currency: 'USD', buy_rate: 7480, sell_rate: 7520, date: '2026-06-30', source: 'BCP' },
  { id: 'fx_2', currency: 'BRL', buy_rate: 1380, sell_rate: 1420, date: '2026-06-30', source: 'BCP' },
  { id: 'fx_3', currency: 'ARS', buy_rate: 7.5, sell_rate: 8.5, date: '2026-06-30', source: 'BCP' },
  { id: 'fx_4', currency: 'EUR', buy_rate: 8100, sell_rate: 8200, date: '2026-06-30', source: 'BCP' },
];

// Seed data - Chart of Accounts
export const initialChartOfAccounts: ChartOfAccount[] = [
  { id: 'coa_1', code: '1', name: 'ATIVO', type: 'ativo', level: 1, parent_code: '', balance: 45000000, active: true },
  { id: 'coa_2', code: '1.1', name: 'Ativo Circulante', type: 'ativo', level: 2, parent_code: '1', balance: 35000000, active: true },
  { id: 'coa_3', code: '1.1.1', name: 'Caixa e Bancos', type: 'ativo', level: 3, parent_code: '1.1', balance: 23700000, active: true },
  { id: 'coa_4', code: '1.1.2', name: 'Contas a Receber', type: 'ativo', level: 3, parent_code: '1.1', balance: 9800000, active: true },
  { id: 'coa_5', code: '2', name: 'PASSIVO', type: 'passivo', level: 1, parent_code: '', balance: 18500000, active: true },
  { id: 'coa_6', code: '2.1', name: 'Passivo Circulante', type: 'passivo', level: 2, parent_code: '2', balance: 12500000, active: true },
  { id: 'coa_7', code: '2.1.1', name: 'Fornecedores', type: 'passivo', level: 3, parent_code: '2.1', balance: 4850000, active: true },
  { id: 'coa_8', code: '2.1.2', name: 'Obrigações Fiscais', type: 'passivo', level: 3, parent_code: '2.1', balance: 3308075, active: true },
  { id: 'coa_9', code: '3', name: 'PATRIMÔNIO LÍQUIDO', type: 'patrimonio', level: 1, parent_code: '', balance: 26500000, active: true },
  { id: 'coa_10', code: '4', name: 'RECEITAS', type: 'receita', level: 1, parent_code: '', balance: 30800000, active: true },
  { id: 'coa_11', code: '4.1', name: 'Receitas de Serviços', type: 'receita', level: 2, parent_code: '4', balance: 30800000, active: true },
  { id: 'coa_12', code: '5', name: 'CUSTOS', type: 'custo', level: 1, parent_code: '', balance: 20600000, active: true },
  { id: 'coa_13', code: '6', name: 'DESPESAS', type: 'despesa', level: 1, parent_code: '', balance: 6550000, active: true },
];

// Seed data - Accounting Entries
export const initialAccountingEntries: AccountingEntry[] = [
  { id: 'ae_1', date: '2026-06-21', description: 'Faturamento Consulta - Carlos Almeida (DTE 001-001-0000001)', account_debit: '1.1.2', account_credit: '4.1', amount: 750000, event_type: 'faturamento', document_number: '001-001-0000001', cost_center: 'Cardiologia', notes: '' },
  { id: 'ae_2', date: '2026-06-21', description: 'Faturamento US Obstétrico - Mariana Santos (DTE 001-001-0000002)', account_debit: '1.1.2', account_credit: '4.1', amount: 1100000, event_type: 'faturamento', document_number: '001-001-0000002', cost_center: 'Ultrassonografia', notes: '' },
  { id: 'ae_3', date: '2026-06-21', description: 'Recebimento Bancard - Carlos Almeida', account_debit: '1.1.1', account_credit: '1.1.2', amount: 750000, event_type: 'recebimento', document_number: '001-001-0000001', cost_center: 'Cardiologia', notes: 'Pagamento via Bancard' },
  { id: 'ae_4', date: '2026-06-25', description: 'Pago Aluguel - Medical Center S.A.', account_debit: '5', account_credit: '1.1.1', amount: 5000000, event_type: 'pagamento', document_number: '', cost_center: 'Administrativo', notes: 'Transferência bancária' },
];

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
    document_type: "CI",
    document_number: "1234567",
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
    document_type: "CI",
    document_number: "9876543",
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
    document_type: "CI",
    document_number: "1122334",
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
    document_type: "CI",
    document_number: "5566778",
    clinicalHistory: [
      {
        id: "his_6",
        date: "2026-06-10",
        type: "Consulta Pediátrica",
        diagnosis: "Otite média aguda",
        cid10: "H65.1",
        prescriptions: ["Amoxicilina 500mg", "Ibuprofeno 200mg"],
        notes: "Febre alta, dor no ouvido direito. Antibioticoterapia por 10 dias.",
        doctor: "Dra. Amanda Silva"
      }
    ]
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
    document_type: "CI",
    document_number: "9988776",
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
  { drugB: 'Paracetamol', severity: 'leve', description: 'Efeito aditivo analgésico/antipirético com AINEs.', recommendation: 'Evitar uso concomitante prolongado. Monitorar função renal.' },
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

// ==========================================
// ESTOQUE E FARMÁCIA
// ==========================================
export type DrugCategory = 'venda_livre' | 'sob_receita' | 'controlado' | 'entorpecente' | 'psicotropico' | 'uso_hospitalar' | 'biologico' | 'insumo' | 'descartavel' | 'material';
export type DrugForm = 'comprimido' | 'capsula' | 'ampola' | 'frasco' | 'seringa' | 'spray' | 'creme' | 'pomada' | 'gel' | 'solucao' | 'po' | 'outro';
export type StockMovementType = 'entrada' | 'saida' | 'ajuste' | 'inventario' | 'devolucao' | 'perda';

export interface PharmacyItem {
  id: string;
  name: string;
  activePrinciple?: string;
  category: DrugCategory;
  form?: DrugForm;
  presentation: string;
  manufacturer: string;
  dinavisaRegistration: string;
  requiresPrescription: boolean;
  lots: LotControl[];
  totalQuantity: number;
  minQuantity: number;
  storageLocation: string;
  unitCost: number;
  unitPrice: number;
  active: boolean;
}

export interface LotControl {
  id: string;
  itemId: string;
  lotNumber: string;
  serialNumber?: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  initialQuantity: number;
  costPerUnit: number;
  dinavisaRegistration: string;
  dteEntryNumber?: string;
  supplierName?: string;
  supplierRuc?: string;
  receivedDate: string;
  status: 'disponivel' | 'bloqueado' | 'vencido' | 'recolhido';
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  lotId: string;
  lotNumber: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  operatorName: string;
  dteNumber?: string;
  supplierName?: string;
  patientId?: string;
  patientName?: string;
  procedureName?: string;
  room?: string;
  sector?: string;
  hospitalizationId?: string;
  prescriptionId?: string;
  doctorName?: string;
  reason?: string;
  notes?: string;
}

export interface InventoryCount {
  id: string;
  date: string;
  operatorName: string;
  status: 'programado' | 'em_andamento' | 'concluido' | 'cancelado';
  items: InventoryCountItem[];
  notes?: string;
}

export interface InventoryCountItem {
  itemId: string;
  itemName: string;
  lotId: string;
  lotNumber: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  barcodeScanned?: string;
}

export const initialPharmacyItems: PharmacyItem[] = [
  {
    id: 'pharm_1', name: 'Amoxicilina 500mg', activePrinciple: 'Amoxicilina',
    category: 'sob_receita', form: 'capsula', presentation: 'Cápsula 500mg',
    manufacturer: 'Laboratório PY', dinavisaRegistration: 'DINAVISA-001-2023',
    requiresPrescription: true, totalQuantity: 480, minQuantity: 100,
    storageLocation: 'Farmácia - Gôndola A1', unitCost: 150, unitPrice: 350, active: true,
    lots: [
      { id: 'lot_1', itemId: 'pharm_1', lotNumber: 'LOT-AMX-001', serialNumber: 'SN-AMX-001', manufactureDate: '2025-12-01', expiryDate: '2027-12-01', quantity: 240, initialQuantity: 500, costPerUnit: 150, dinavisaRegistration: 'DINAVISA-001-2023', dteEntryNumber: '001-001-0000101', supplierName: 'Proveedora Médica S.A.', supplierRuc: '80123456-5', receivedDate: '2026-01-15', status: 'disponivel' },
      { id: 'lot_2', itemId: 'pharm_1', lotNumber: 'LOT-AMX-002', manufactureDate: '2026-03-01', expiryDate: '2028-03-01', quantity: 240, initialQuantity: 250, costPerUnit: 160, dinavisaRegistration: 'DINAVISA-001-2023', dteEntryNumber: '001-001-0000105', supplierName: 'Laboratorio Farma SA', supplierRuc: '80234567-1', receivedDate: '2026-04-10', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_2', name: 'Dipirona Sódica 500mg', activePrinciple: 'Dipirona Monoidratada',
    category: 'venda_livre', form: 'comprimido', presentation: 'Comprimido 500mg',
    manufacturer: 'Laboratório PY', dinavisaRegistration: 'DINAVISA-002-2023',
    requiresPrescription: false, totalQuantity: 1000, minQuantity: 200,
    storageLocation: 'Farmácia - Gôndola B2', unitCost: 80, unitPrice: 200, active: true,
    lots: [
      { id: 'lot_3', itemId: 'pharm_2', lotNumber: 'LOT-DIP-001', manufactureDate: '2026-01-01', expiryDate: '2028-01-01', quantity: 1000, initialQuantity: 1000, costPerUnit: 80, dinavisaRegistration: 'DINAVISA-002-2023', supplierName: 'Proveedora Médica S.A.', supplierRuc: '80123456-5', receivedDate: '2026-02-01', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_3', name: 'Clonazepam 2mg', activePrinciple: 'Clonazepam',
    category: 'controlado', form: 'comprimido', presentation: 'Comprimido 2mg',
    manufacturer: 'Laboratório PY', dinavisaRegistration: 'DINAVISA-003-2022',
    requiresPrescription: true, totalQuantity: 150, minQuantity: 50,
    storageLocation: 'Farmácia - Armário Controlado C1 (Chave)', unitCost: 250, unitPrice: 600, active: true,
    lots: [
      { id: 'lot_4', itemId: 'pharm_3', lotNumber: 'LOT-CLO-001', serialNumber: 'SN-CLO-001', manufactureDate: '2026-02-01', expiryDate: '2027-08-01', quantity: 150, initialQuantity: 200, costPerUnit: 250, dinavisaRegistration: 'DINAVISA-003-2022', dteEntryNumber: '001-001-0000102', supplierName: 'Oficina Farmacéutica S.A.', supplierRuc: '80765432-1', receivedDate: '2026-03-01', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_4', name: 'Insulina NPH 10ml', activePrinciple: 'Insulina Humana NPH',
    category: 'biologico', form: 'frasco', presentation: 'Frasco 10ml (100 UI/ml)',
    manufacturer: 'Novo Nordisk', dinavisaRegistration: 'DINAVISA-004-2021',
    requiresPrescription: true, totalQuantity: 8, minQuantity: 15,
    storageLocation: 'Farmácia - Refrigerador R1 (2-8°C)', unitCost: 4500, unitPrice: 8500, active: true,
    lots: [
      { id: 'lot_5', itemId: 'pharm_4', lotNumber: 'LOT-INS-001', serialNumber: 'SN-INS-001', manufactureDate: '2026-04-01', expiryDate: '2026-10-01', quantity: 5, initialQuantity: 20, costPerUnit: 4500, dinavisaRegistration: 'DINAVISA-004-2021', dteEntryNumber: '001-001-0000103', supplierName: 'Proveedora Médica S.A.', supplierRuc: '80123456-5', receivedDate: '2026-05-01', status: 'disponivel' },
      { id: 'lot_6', itemId: 'pharm_4', lotNumber: 'LOT-INS-002', serialNumber: 'SN-INS-002', manufactureDate: '2026-05-01', expiryDate: '2026-09-01', quantity: 3, initialQuantity: 10, costPerUnit: 4700, dinavisaRegistration: 'DINAVISA-004-2021', dteEntryNumber: '001-001-0000104', supplierName: 'Oficina Farmacéutica S.A.', supplierRuc: '80765432-1', receivedDate: '2026-06-01', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_5', name: 'Sulfato Ferroso 40mg', activePrinciple: 'Sulfato Ferroso',
    category: 'venda_livre', form: 'comprimido', presentation: 'Comprimido 40mg',
    manufacturer: 'Laboratório PY', dinavisaRegistration: 'DINAVISA-005-2023',
    requiresPrescription: false, totalQuantity: 600, minQuantity: 100,
    storageLocation: 'Farmácia - Gôndola A3', unitCost: 50, unitPrice: 120, active: true,
    lots: [
      { id: 'lot_7', itemId: 'pharm_5', lotNumber: 'LOT-FER-001', manufactureDate: '2026-03-01', expiryDate: '2028-03-01', quantity: 600, initialQuantity: 600, costPerUnit: 50, dinavisaRegistration: 'DINAVISA-005-2023', supplierName: 'Laboratorio Farma SA', supplierRuc: '80234567-1', receivedDate: '2026-04-01', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_6', name: 'Seringa Descartável 5ml', activePrinciple: '',
    category: 'descartavel', form: 'seringa', presentation: 'Seringa Luer Lock 5ml',
    manufacturer: 'BD Medical', dinavisaRegistration: 'DINAVISA-006-2023',
    requiresPrescription: false, totalQuantity: 1500, minQuantity: 300,
    storageLocation: 'Depósito - Caixa D3', unitCost: 120, unitPrice: 250, active: true,
    lots: [
      { id: 'lot_8', itemId: 'pharm_6', lotNumber: 'LOT-SER-001', manufactureDate: '2026-01-01', expiryDate: '2029-01-01', quantity: 1500, initialQuantity: 2000, costPerUnit: 120, dinavisaRegistration: 'DINAVISA-006-2023', dteEntryNumber: '001-001-0000101', supplierName: 'Proveedora Médica S.A.', supplierRuc: '80123456-5', receivedDate: '2026-02-15', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_7', name: 'Metilfenidato 10mg', activePrinciple: 'Metilfenidato',
    category: 'psicotropico', form: 'comprimido', presentation: 'Comprimido 10mg',
    manufacturer: 'Novartis', dinavisaRegistration: 'DINAVISA-007-2022',
    requiresPrescription: true, totalQuantity: 80, minQuantity: 30,
    storageLocation: 'Farmácia - Armário Controlado C2 (Chave)', unitCost: 800, unitPrice: 1800, active: true,
    lots: [
      { id: 'lot_9', itemId: 'pharm_7', lotNumber: 'LOT-MET-001', serialNumber: 'SN-MET-001', manufactureDate: '2026-01-01', expiryDate: '2027-07-01', quantity: 80, initialQuantity: 100, costPerUnit: 800, dinavisaRegistration: 'DINAVISA-007-2022', dteEntryNumber: '001-001-0000102', supplierName: 'Oficina Farmacéutica S.A.', supplierRuc: '80765432-1', receivedDate: '2026-02-01', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_8', name: 'Gaze Estéril 7,5x7,5', activePrinciple: '',
    category: 'material', form: 'outro', presentation: 'Pacote c/ 10 unidades',
    manufacturer: 'Cremer', dinavisaRegistration: 'DINAVISA-008-2023',
    requiresPrescription: false, totalQuantity: 300, minQuantity: 100,
    storageLocation: 'Depósito - Caixa D1', unitCost: 350, unitPrice: 700, active: true,
    lots: [
      { id: 'lot_10', itemId: 'pharm_8', lotNumber: 'LOT-GAZ-001', manufactureDate: '2026-02-01', expiryDate: '2028-02-01', quantity: 300, initialQuantity: 300, costPerUnit: 350, dinavisaRegistration: 'DINAVISA-008-2023', supplierName: 'Proveedora Médica S.A.', supplierRuc: '80123456-5', receivedDate: '2026-03-01', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_9', name: 'Morfina 10mg/ml', activePrinciple: 'Morfina',
    category: 'entorpecente', form: 'ampola', presentation: 'Ampola 1ml 10mg/ml',
    manufacturer: 'Cristália', dinavisaRegistration: 'DINAVISA-009-2021',
    requiresPrescription: true, totalQuantity: 20, minQuantity: 10,
    storageLocation: 'Farmácia - Cofre Entorpecentes (Dupla Chave)', unitCost: 3200, unitPrice: 6500, active: true,
    lots: [
      { id: 'lot_11', itemId: 'pharm_9', lotNumber: 'LOT-MOR-001', serialNumber: 'SN-MOR-001', manufactureDate: '2026-03-01', expiryDate: '2027-09-01', quantity: 12, initialQuantity: 20, costPerUnit: 3200, dinavisaRegistration: 'DINAVISA-009-2021', dteEntryNumber: '001-001-0000106', supplierName: 'Oficina Farmacéutica S.A.', supplierRuc: '80765432-1', receivedDate: '2026-04-01', status: 'disponivel' },
      { id: 'lot_12', itemId: 'pharm_9', lotNumber: 'LOT-MOR-002', serialNumber: 'SN-MOR-002', manufactureDate: '2026-05-01', expiryDate: '2027-10-15', quantity: 8, initialQuantity: 10, costPerUnit: 3300, dinavisaRegistration: 'DINAVISA-009-2021', dteEntryNumber: '001-001-0000107', supplierName: 'Oficina Farmacéutica S.A.', supplierRuc: '80765432-1', receivedDate: '2026-06-01', status: 'disponivel' },
    ]
  },
  {
    id: 'pharm_10', name: 'Cateter Gelco 20G', activePrinciple: '',
    category: 'insumo', form: 'outro', presentation: 'Cateter Intravenoso 20G',
    manufacturer: 'BD Medical', dinavisaRegistration: 'DINAVISA-010-2023',
    requiresPrescription: false, totalQuantity: 12, minQuantity: 40,
    storageLocation: 'Depósito - Caixa D2', unitCost: 450, unitPrice: 900, active: true,
    lots: [
      { id: 'lot_13', itemId: 'pharm_10', lotNumber: 'LOT-CAT-001', manufactureDate: '2025-06-01', expiryDate: '2027-06-01', quantity: 12, initialQuantity: 50, costPerUnit: 450, dinavisaRegistration: 'DINAVISA-010-2023', dteEntryNumber: '001-001-0000101', supplierName: 'Proveedora Médica S.A.', supplierRuc: '80123456-5', receivedDate: '2026-01-15', status: 'disponivel' },
    ]
  },
];

export const initialStockMovements: StockMovement[] = [
  { id: 'mov_1', itemId: 'pharm_1', itemName: 'Amoxicilina 500mg', lotId: 'lot_1', lotNumber: 'LOT-AMX-001', movementType: 'entrada', quantity: 500, unitCost: 150, totalCost: 75000, date: '2026-01-15', operatorName: 'Marcela Ramos', dteNumber: '001-001-0000101', supplierName: 'Proveedora Médica S.A.' },
  { id: 'mov_2', itemId: 'pharm_1', itemName: 'Amoxicilina 500mg', lotId: 'lot_1', lotNumber: 'LOT-AMX-001', movementType: 'saida', quantity: 260, unitCost: 150, totalCost: 39000, date: '2026-06-10', operatorName: 'Enf. Marcela Ramos', patientName: 'Carlos Eduardo Almeida', procedureName: 'Consulta Geral', notes: 'Prescrição de Amoxicilina 500mg 7 dias' },
  { id: 'mov_3', itemId: 'pharm_4', itemName: 'Insulina NPH 10ml', lotId: 'lot_5', lotNumber: 'LOT-INS-001', movementType: 'saida', quantity: 15, unitCost: 4500, totalCost: 67500, date: '2026-06-15', operatorName: 'Enf. Marcela Ramos', patientName: 'Joaquim Bento Pereira', room: 'Leito 101-A', sector: 'Alas Gerais', notes: 'Paciente diabético insulinodependente' },
  { id: 'mov_4', itemId: 'pharm_6', itemName: 'Seringa Descartável 5ml', lotId: 'lot_8', lotNumber: 'LOT-SER-001', movementType: 'saida', quantity: 500, unitCost: 120, totalCost: 60000, date: '2026-06-18', operatorName: 'Enf. Marcela Ramos', sector: 'Alas Gerais', notes: 'Uso geral nas enfermarias' },
  { id: 'mov_5', itemId: 'pharm_4', itemName: 'Insulina NPH 10ml', lotId: 'lot_5', lotNumber: 'LOT-INS-001', movementType: 'entrada', quantity: 20, unitCost: 4500, totalCost: 90000, date: '2026-05-01', operatorName: 'Marcela Ramos', dteNumber: '001-001-0000103', supplierName: 'Proveedora Médica S.A.' },
  { id: 'mov_6', itemId: 'pharm_9', itemName: 'Morfina 10mg/ml', lotId: 'lot_11', lotNumber: 'LOT-MOR-001', movementType: 'saida', quantity: 8, unitCost: 3200, totalCost: 25600, date: '2026-06-20', operatorName: 'Dra. Amanda Silva', patientName: 'Carlos Eduardo Almeida', procedureName: 'Procedimento Cirúrgico', notes: 'Uso intraoperatório sob prescrição médica controlada' },
  { id: 'mov_7', itemId: 'pharm_10', itemName: 'Cateter Gelco 20G', lotId: 'lot_13', lotNumber: 'LOT-CAT-001', movementType: 'saida', quantity: 38, unitCost: 450, totalCost: 17100, date: '2026-06-22', operatorName: 'Enf. Marcela Ramos', sector: 'Alas Gerais', notes: 'Reposição semanal enfermarias' },
];

export const initialInventoryCounts: InventoryCount[] = [
  { id: 'inv_1', date: '2026-06-15', operatorName: 'Marcela Ramos', status: 'concluido', items: [
    { itemId: 'pharm_1', itemName: 'Amoxicilina 500mg', lotId: 'lot_1', lotNumber: 'LOT-AMX-001', expectedQuantity: 240, countedQuantity: 240, difference: 0 },
    { itemId: 'pharm_1', itemName: 'Amoxicilina 500mg', lotId: 'lot_2', lotNumber: 'LOT-AMX-002', expectedQuantity: 240, countedQuantity: 238, difference: -2 },
    { itemId: 'pharm_2', itemName: 'Dipirona Sódica 500mg', lotId: 'lot_3', lotNumber: 'LOT-DIP-001', expectedQuantity: 1000, countedQuantity: 1000, difference: 0 },
    { itemId: 'pharm_4', itemName: 'Insulina NPH 10ml', lotId: 'lot_5', lotNumber: 'LOT-INS-001', expectedQuantity: 5, countedQuantity: 5, difference: 0 },
    { itemId: 'pharm_6', itemName: 'Seringa Descartável 5ml', lotId: 'lot_8', lotNumber: 'LOT-SER-001', expectedQuantity: 1500, countedQuantity: 1498, difference: -2 },
  ], notes: 'Inventário mensal - pequenas diferenças registradas e ajustadas' },
  { id: 'inv_2', date: '2026-07-01', operatorName: 'Marcela Ramos', status: 'programado', items: [], notes: 'Próximo inventário programado' },
];

// ==========================================
// FARMACOVIGILÂNCIA
// ==========================================
export type AdverseEventSeverity = 'leve' | 'moderada' | 'grave' | 'fatal';
export type AdverseEventOutcome = 'recuperado' | 'recuperando' | 'nao_recuperado' | 'obito' | 'desconhecido';
export type NotificationStatus = 'rascunho' | 'notificado' | 'em_analise' | 'arquivado';

export interface AdverseEvent {
  id: string;
  patientName: string;
  patientId?: string;
  medicationName: string;
  itemId: string;
  lotId: string;
  lotNumber: string;
  adverseReaction: string;
  severity: AdverseEventSeverity;
  startDate: string;
  endDate?: string;
  outcome: AdverseEventOutcome;
  suspectedDrug: boolean;
  concomitantDrugs: string[];
  description: string;
  notifierName: string;
  notifierRole: string;
  notificationDate: string;
  status: NotificationStatus;
  dinavisaProtocol?: string;
  dinavisaResponse?: string;
  notes?: string;
}

export interface QualityDeviation {
  id: string;
  itemId: string;
  itemName: string;
  lotId: string;
  lotNumber: string;
  deviationType: 'quebra' | 'contaminacao' | 'rotulagem' | 'embalagem' | 'esterilidade' | 'potencia' | 'outro';
  description: string;
  severity: AdverseEventSeverity;
  affectedQuantity: number;
  reportDate: string;
  reporterName: string;
  status: 'aberto' | 'investigacao' | 'concluido' | 'arquivado';
  correctiveAction?: string;
  rootCause?: string;
  closedAt?: string;
  notes?: string;
}

export interface BatchRecall {
  id: string;
  itemId: string;
  itemName: string;
  lotId: string;
  lotNumber: string;
  recallType: 'fabricante' | 'dinavisa' | 'interna';
  reason: string;
  riskLevel: 'baixo' | 'medio' | 'alto' | 'critico';
  alertDate: string;
  affectedQuantity: number;
  recollectedQuantity: number;
  status: 'ativo' | 'concluido' | 'monitoramento';
  dinavisaNotice?: string;
  instructions?: string;
  completedAt?: string;
  notes?: string;
}

export const initialAdverseEvents: AdverseEvent[] = [
  {
    id: 'ae_1', patientName: 'Carlos Eduardo Almeida', patientId: 'pat_1',
    medicationName: 'Amoxicilina 500mg', itemId: 'pharm_1', lotId: 'lot_1', lotNumber: 'LOT-AMX-001',
    adverseReaction: 'Urticária generalizada e prurido intenso',
    severity: 'moderada', startDate: '2026-06-20', endDate: '2026-06-22',
    outcome: 'recuperado', suspectedDrug: true, concomitantDrugs: ['Losartana 50mg'],
    description: 'Paciente iniciou amoxicilina para sinusite. Após 3 dias, apresentou urticária em tronco e membros, com prurido intenso. Medicamento suspenso e antihistamínico prescrito. Quadro resolvido em 48h.',
    notifierName: 'Dra. Amanda Silva', notifierRole: 'Médico',
    notificationDate: '2026-06-22', status: 'notificado',
    dinavisaProtocol: 'DINAVISA-RAM-2026-0042',
  },
  {
    id: 'ae_2', patientName: 'Mariana Rosa Santos', patientId: 'pat_2',
    medicationName: 'Sulfato Ferroso 40mg', itemId: 'pharm_5', lotId: 'lot_7', lotNumber: 'LOT-FER-001',
    adverseReaction: 'Náuseas intensas e epigastralgia',
    severity: 'leve', startDate: '2026-06-10', outcome: 'recuperado',
    suspectedDrug: true, concomitantDrugs: ['Ácido Fólico 5mg'],
    description: 'Paciente gestante em uso de sulfato ferroso apresentou náuseas matinais intensas e desconforto epigástrico. Orientado tomar com alimentos. Sintomas controlados.',
    notifierName: 'Enf. Marcela Ramos', notifierRole: 'Enfermeiro',
    notificationDate: '2026-06-15', status: 'notificado',
  },
];

export const initialQualityDeviations: QualityDeviation[] = [
  {
    id: 'qd_1', itemId: 'pharm_1', itemName: 'Amoxicilina 500mg', lotId: 'lot_2', lotNumber: 'LOT-AMX-002',
    deviationType: 'embalagem', severity: 'leve', affectedQuantity: 2,
    description: 'Blister com violação de selo - 2 comprimidos expostos',
    reportDate: '2026-05-10', reporterName: 'Marcela Ramos',
    status: 'concluido', correctiveAction: 'Lote segregado e devolvido ao fornecedor.',
    rootCause: 'Falha na selagem durante fabricação', closedAt: '2026-05-15',
  },
  {
    id: 'qd_2', itemId: 'pharm_10', itemName: 'Cateter Gelco 20G', lotId: 'lot_13', lotNumber: 'LOT-CAT-001',
    deviationType: 'esterilidade', severity: 'grave', affectedQuantity: 5,
    description: 'Embalagem individual com selo de esterilidade rompido',
    reportDate: '2026-06-18', reporterName: 'Enf. Marcela Ramos',
    status: 'investigacao',
  },
];

export const initialBatchRecalls: BatchRecall[] = [
  {
    id: 'br_1', itemId: 'pharm_1', itemName: 'Amoxicilina 500mg', lotId: 'lot_2', lotNumber: 'LOT-AMX-002',
    recallType: 'fabricante', riskLevel: 'medio', affectedQuantity: 250, recollectedQuantity: 238,
    reason: 'Possível contaminação cruzada com penicilina durante fabricação - comunicado do fabricante',
    alertDate: '2026-05-12', status: 'concluido',
    dinavisaNotice: 'DINAVISA-REC-2026-001',
    instructions: 'Suspender uso imediatamente. Recolher unidades restantes e segregar.',
    completedAt: '2026-05-20',
    notes: '238 unidades recolhidas de 250. Diferença de 12 unidades já dispensadas que estão sendo rastreadas.',
  },
];

// ─────────────────────────────────────────────
// PARAGUAI – SAÚDE OCUPACIONAL
// Medicina do Trabalho / Certificado de Aptidão Laboral (CAL)
// Conforme Código do Trabalho Paraguaio e MTESS
// ─────────────────────────────────────────────

export interface Empresa {
  id: string;
  ruc: string;
  nome: string;
  nomeFantasia?: string;
  endereco: string;
  cidade: string;
  departamento: string;
  telefone?: string;
  email?: string;
  atividadeEconomica: string;
  setor: 'Industrial' | 'Comercial' | 'Serviços' | 'Agropecuária' | 'Construção' | 'Transporte' | 'Outro';
  porte: 'Micro' | 'Pequena' | 'Média' | 'Grande';
  nroFuncionarios: number;
  representanteNome?: string;
  representanteCi?: string;
  status: 'ativa' | 'inativa' | 'suspensa';
  observacoes?: string;
}

export interface ContratoEmpresa {
  id: string;
  empresaId: string;
  numeroContrato: string;
  dataInicio: string;
  dataFim?: string;
  tipo: 'PCMSO' | 'PGR' | 'PCMSO+PGR' | 'Exames Complementares' | 'Outro';
  valorMensal: number;
  prazoDias: number;
  status: 'vigente' | 'expirado' | 'rescindido';
  observacoes?: string;
}

export interface PlanoExame {
  id: string;
  contratoId: string;
  nome: string;
  tipoExame: 'Pré-ocupacional' | 'Periódico' | 'Retorno ao Trabalho' | 'Mudança de Função' | 'Demissional' | 'Monitoração Ambiental';
  periodicidadeDias?: number;
  examesPrevistos: string[];
  valorPorTrabalhador: number;
  ativo: boolean;
}

export interface PostoTrabalho {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string;
  setor: string;
  turno: 'Diurno' | 'Noturno' | 'Revezamento' | 'Administrativo';
  nroTrabalhadores: number;
}

export interface RiscoOcupacional {
  id: string;
  nome: string;
  tipo: 'Físico' | 'Químico' | 'Biológico' | 'Ergonômico' | 'Acidente' | 'Mecânico';
  descricao?: string;
  corIdentificacao: string;
}

export interface MatrizExame {
  id: string;
  riscoId: string;
  exameNome: string;
  exameTipo: 'Laboratorial' | 'Imagem' | 'Clínico' | 'Auditivo' | 'Oftalmológico' | 'Psicossocial' | 'Cardiológico' | 'Pneumológico' | 'Toxicológico' | 'Outro';
  periodicidadeRecomendadaDias?: number;
  obrigatorio: boolean;
}

export interface Trabalhador {
  id: string;
  empresaId: string;
  postoId?: string;
  nome: string;
  ci: string;
  ruc?: string;
  dataNascimento: string;
  genero: string;
  nacionalidade: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  funcao: string;
  dataAdmissao?: string;
  dataDemissao?: string;
  status: 'ativo' | 'afastado' | 'demitido';
  tipoSanguineo?: string;
  contatoEmergencia?: string;
  observacoes?: string;
}

export interface ExameOcupacional {
  id: string;
  trabalhadorId: string;
  empresaId: string;
  planoId?: string;
  tipo: 'Pré-ocupacional' | 'Periódico' | 'Retorno ao Trabalho' | 'Mudança de Função' | 'Demissional';
  dataRealizacao: string;
  dataProximo?: string;
  medicoResponsavel: string;
  examesRealizados: string[];
  resultados: string[];
  observacoes?: string;
  status: 'programado' | 'realizado' | 'cancelado';
}

export interface CalCertificado {
  id: string;
  exameId: string;
  trabalhadorId: string;
  empresaId: string;
  numeroCal: string;
  dataEmissao: string;
  dataValidade?: string;
  parecido: 'Apto' | 'Apto com Restrições' | 'Inapto Temporário' | 'Inapto Permanente';
  restricoes?: string;
  observacoes?: string;
  medicoEmissor: string;
  registroConselho: string;
  qrCodeHash?: string;
  assinaturaDigital?: string;
  status: 'válido' | 'expirado' | 'cancelado' | 'substituído';
}

export interface RelatorioMtess {
  id: string;
  empresaId: string;
  periodoInicio: string;
  periodoFim: string;
  tipoRelatorio: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  dados: Record<string, any>;
  pdfUrl?: string;
  status: 'rascunho' | 'gerado' | 'enviado' | 'arquivado';
}

// Initial data
export const initialEmpresas: Empresa[] = [
  { id: 'emp_1', ruc: '80045678-1', nome: 'Industrial del Sur S.A.', nomeFantasia: 'INSUR', endereco: 'Avda. Mariscal López 1456', cidade: 'Asunción', departamento: 'Capital', telefone: '+595 21 234 5678', email: 'contacto@insur.com.py', atividadeEconomica: 'Fabricação de Produtos Metalúrgicos', setor: 'Industrial', porte: 'Grande', nroFuncionarios: 350, representanteNome: 'Carlos Benítez', representanteCi: '1234567', status: 'ativa' },
  { id: 'emp_2', ruc: '80123456-3', nome: 'TechSolutions PY S.R.L.', nomeFantasia: 'TechPY', endereco: 'Calle San Martin 890', cidade: 'Asunción', departamento: 'Capital', telefone: '+595 21 345 6789', email: 'info@techpy.com.py', atividadeEconomica: 'Serviços de TI', setor: 'Serviços', porte: 'Média', nroFuncionarios: 85, representanteNome: 'María González', representanteCi: '2345678', status: 'ativa' },
  { id: 'emp_3', ruc: '80234567-5', nome: 'Agropecuária Doña Elena', endereco: 'Ruta 2 Km 25', cidade: 'San Lorenzo', departamento: 'Central', telefone: '+595 991 234 567', email: 'elena@agroelena.com.py', atividadeEconomica: 'Atividade Agropecuária', setor: 'Agropecuária', porte: 'Média', nroFuncionarios: 120, representanteNome: 'Elena Martínez', representanteCi: '3456789', status: 'ativa' },
];

export const initialContratos: ContratoEmpresa[] = [
  { id: 'ctr_1', empresaId: 'emp_1', numeroContrato: 'CTR-2026-001', dataInicio: '2026-01-01', dataFim: '2026-12-31', tipo: 'PCMSO+PGR', valorMensal: 5000000, prazoDias: 30, status: 'vigente' },
  { id: 'ctr_2', empresaId: 'emp_2', numeroContrato: 'CTR-2026-002', dataInicio: '2026-03-01', dataFim: '2027-02-28', tipo: 'PCMSO', valorMensal: 1500000, prazoDias: 30, status: 'vigente' },
  { id: 'ctr_3', empresaId: 'emp_3', numeroContrato: 'CTR-2026-003', dataInicio: '2026-02-01', tipo: 'Exames Complementares', valorMensal: 2000000, prazoDias: 45, status: 'vigente' },
];

export const initialPostos: PostoTrabalho[] = [
  { id: 'posto_1', empresaId: 'emp_1', nome: 'Operador de Máquinas', setor: 'Produção', turno: 'Revezamento', nroTrabalhadores: 45 },
  { id: 'posto_2', empresaId: 'emp_1', nome: 'Soldador', setor: 'Produção', turno: 'Diurno', nroTrabalhadores: 30 },
  { id: 'posto_3', empresaId: 'emp_2', nome: 'Desenvolvedor de Software', setor: 'TI', turno: 'Administrativo', nroTrabalhadores: 40 },
  { id: 'posto_4', empresaId: 'emp_3', nome: 'Operador Agrícola', setor: 'Campo', turno: 'Diurno', nroTrabalhadores: 60 },
];

export const initialRiscos: RiscoOcupacional[] = [
  { id: 'risco_1', nome: 'Ruído Contínuo', tipo: 'Físico', corIdentificacao: '#FFC107' },
  { id: 'risco_2', nome: 'Vibração', tipo: 'Físico', corIdentificacao: '#FF5722' },
  { id: 'risco_3', nome: 'Calor', tipo: 'Físico', corIdentificacao: '#F44336' },
  { id: 'risco_4', nome: 'Produtos Químicos', tipo: 'Químico', corIdentificacao: '#FF5722' },
  { id: 'risco_5', nome: 'Agentes Biológicos', tipo: 'Biológico', corIdentificacao: '#4CAF50' },
  { id: 'risco_6', nome: 'Postura Inadequada', tipo: 'Ergonômico', corIdentificacao: '#FFC107' },
  { id: 'risco_7', nome: 'Movimentos Repetitivos', tipo: 'Ergonômico', corIdentificacao: '#FF9800' },
  { id: 'risco_8', nome: 'Trabalho em Altura', tipo: 'Acidente', corIdentificacao: '#F44336' },
  { id: 'risco_9', nome: 'Eletricidade', tipo: 'Acidente', corIdentificacao: '#FFEB3B' },
  { id: 'risco_10', nome: 'Máquinas e Equipamentos', tipo: 'Mecânico', corIdentificacao: '#795548' },
];

export const initialMatrizExames: MatrizExame[] = [
  { id: 'mat_1', riscoId: 'risco_1', exameNome: 'Audiometria Tonal', exameTipo: 'Auditivo', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_2', riscoId: 'risco_1', exameNome: 'Audiometria Vocal', exameTipo: 'Auditivo', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_3', riscoId: 'risco_3', exameNome: 'Eletrocardiograma', exameTipo: 'Cardiológico', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_4', riscoId: 'risco_3', exameNome: 'Hemograma', exameTipo: 'Laboratorial', periodicidadeRecomendadaDias: 365, obrigatorio: false },
  { id: 'mat_5', riscoId: 'risco_4', exameNome: 'Hemograma', exameTipo: 'Laboratorial', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_6', riscoId: 'risco_4', exameNome: 'Exame Toxicológico', exameTipo: 'Toxicológico', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_7', riscoId: 'risco_5', exameNome: 'Exames Sorológicos', exameTipo: 'Laboratorial', periodicidadeRecomendadaDias: 180, obrigatorio: true },
  { id: 'mat_8', riscoId: 'risco_6', exameNome: 'Exame Clínico Ergonômico', exameTipo: 'Clínico', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_9', riscoId: 'risco_8', exameNome: 'Eletroencefalograma', exameTipo: 'Clínico', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_10', riscoId: 'risco_8', exameNome: 'Eletrocardiograma', exameTipo: 'Cardiológico', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_11', riscoId: 'risco_8', exameNome: 'Exame Psicológico', exameTipo: 'Psicossocial', periodicidadeRecomendadaDias: 365, obrigatorio: true },
  { id: 'mat_12', riscoId: 'risco_10', exameNome: 'Exame Clínico Ortopédico', exameTipo: 'Clínico', periodicidadeRecomendadaDias: 365, obrigatorio: true },
];

export const initialTrabalhadores: Trabalhador[] = [
  { id: 'trab_1', empresaId: 'emp_1', postoId: 'posto_1', nome: 'Juan Pérez Martínez', ci: '4567890', dataNascimento: '1988-03-15', genero: 'Masculino', nacionalidade: 'Paraguaya', funcao: 'Operador de Prensa', dataAdmissao: '2022-06-01', status: 'ativo', telefone: '+595 981 234 567' },
  { id: 'trab_2', empresaId: 'emp_1', postoId: 'posto_2', nome: 'Pedro Ramírez López', ci: '5678901', dataNascimento: '1992-07-22', genero: 'Masculino', nacionalidade: 'Paraguaya', funcao: 'Soldador', dataAdmissao: '2023-01-15', status: 'ativo', telefone: '+595 982 345 678' },
  { id: 'trab_3', empresaId: 'emp_1', postoId: 'posto_1', nome: 'Ana Vera González', ci: '6789012', dataNascimento: '1995-11-08', genero: 'Feminino', nacionalidade: 'Paraguaya', funcao: 'Operadora de Torno', dataAdmissao: '2024-03-01', status: 'ativo', telefone: '+595 983 456 789' },
  { id: 'trab_4', empresaId: 'emp_2', postoId: 'posto_3', nome: 'Luis Fernández Ayala', ci: '7890123', dataNascimento: '1990-05-30', genero: 'Masculino', nacionalidade: 'Paraguaya', funcao: 'Desenvolvedor Sênior', dataAdmissao: '2023-08-20', status: 'ativo', telefone: '+595 984 567 890' },
  { id: 'trab_5', empresaId: 'emp_3', postoId: 'posto_4', nome: 'Marcos Villalba Duarte', ci: '8901234', dataNascimento: '1985-09-12', genero: 'Masculino', nacionalidade: 'Paraguaya', funcao: 'Tratorista', dataAdmissao: '2020-04-10', status: 'ativo', telefone: '+595 985 678 901' },
];

export const initialExamesOcupacionais: ExameOcupacional[] = [
  { id: 'ex_1', trabalhadorId: 'trab_1', empresaId: 'emp_1', tipo: 'Periódico', dataRealizacao: '2026-06-15', dataProximo: '2027-06-15', medicoResponsavel: 'Dr. Bruno Castro', examesRealizados: ['Audiometria Tonal', 'Hemograma', 'Eletrocardiograma', 'Raio-X de Tórax'], resultados: ['Audiometria: Normal', 'Hemograma: Normal', 'ECG: Normal', 'Raio-X: Normal'], status: 'realizado' },
  { id: 'ex_2', trabalhadorId: 'trab_2', empresaId: 'emp_1', tipo: 'Pré-ocupacional', dataRealizacao: '2026-05-10', dataProximo: '2027-05-10', medicoResponsavel: 'Dr. Bruno Castro', examesRealizados: ['Audiometria', 'Eletrocardiograma', 'Hemograma'], resultados: ['Audiometria: Perda leve 4kHz', 'ECG: Normal', 'Hemograma: Normal'], status: 'realizado' },
  { id: 'ex_3', trabalhadorId: 'trab_4', empresaId: 'emp_2', tipo: 'Periódico', dataRealizacao: '2026-06-01', medicoResponsavel: 'Dr. Bruno Castro', examesRealizados: ['Exame Clínico Ergonômico'], resultados: ['Clínico: Normal'], status: 'programado' },
];

export const initialCals: CalCertificado[] = [
  { id: 'cal_1', exameId: 'ex_1', trabalhadorId: 'trab_1', empresaId: 'emp_1', numeroCal: 'CAL-2026-001', dataEmissao: '2026-06-15', dataValidade: '2027-06-15', parecido: 'Apto', medicoEmissor: 'Dr. Bruno Castro', registroConselho: 'CRM-PY 123456', status: 'válido' },
  { id: 'cal_2', exameId: 'ex_2', trabalhadorId: 'trab_2', empresaId: 'emp_1', numeroCal: 'CAL-2026-002', dataEmissao: '2026-05-10', dataValidade: '2027-05-10', parecido: 'Apto com Restrições', restricoes: 'Uso obrigatório de EPI auditivo', medicoEmissor: 'Dr. Bruno Castro', registroConselho: 'CRM-PY 123456', status: 'válido' },
];

export const initialRelatoriosMtess: RelatorioMtess[] = [];

// ─────────────────────────────────────────────
// CRM & MARKETING DE PACIENTES
// Segmentação, campanhas, funil, oportunidades, NPS, opt-out
// Conforme Lei 1682/2001 (Paraguai)
// ─────────────────────────────────────────────

export interface Campaign {
  id: string;
  nome: string;
  tipo: 'whatsapp' | 'sms' | 'email';
  template: string;
  segmentoAlvo: string;
  mensagem: string;
  dataDisparo: string;
  status: 'rascunho' | 'agendada' | 'enviada' | 'cancelada';
  totalContatos: number;
  totalEnviados: number;
  totalFalhas: number;
  totalOptOut: number;
  consentimentoObrigatorio: boolean;
  createdBy: string;
}

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  origem: 'site' | 'whatsapp' | 'facebook' | 'instagram' | 'google' | 'indicacao' | 'presencial' | 'outro';
  dataPrimeiroContato: string;
  etapaFunil: 'lead' | 'primeiro_contato' | 'primeira_consulta' | 'paciente_recorrente';
  interesse?: string;
  observacoes?: string;
  ultimoContato?: string;
  responsavel?: string;
  convertido: boolean;
}

export interface CommercialOpportunity {
  id: string;
  leadId?: string;
  pacienteNome: string;
  pacienteTelefone?: string;
  tipo: 'cirurgia_estetica' | 'cirurgia_geral' | 'odontologia' | 'tratamento_clinico' | 'exame' | 'internacao' | 'outro';
  descricao: string;
  valorEstimado: number;
  status: 'aberta' | 'em_negociacao' | 'fechada_ganha' | 'fechada_perdida';
  probabilidade: number;
  dataCriacao: string;
  dataFechamento?: string;
  responsavel: string;
  observacoes?: string;
}

export interface NpsSurvey {
  id: string;
  pacienteNome: string;
  pacienteId?: string;
  dataAtendimento: string;
  dataResposta: string;
  score: number;
  comentario?: string;
  categoria: 'promotor' | 'neutro' | 'detrator';
  origem: 'whatsapp' | 'sms' | 'email' | 'app' | 'presencial';
  respondido: boolean;
}

export interface OptOutRecord {
  id: string;
  pacienteNome: string;
  pacienteContato: string;
  canal: 'whatsapp' | 'sms' | 'email' | 'todos';
  dataOptOut: string;
  motivo?: string;
  ipRegistro?: string;
  confirmado: boolean;
}

export interface WebFormLead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  origem: string;
  mensagem: string;
  dataRecebimento: string;
  status: 'novo' | 'contatado' | 'convertido' | 'descartado';
  interesse?: string;
  responsavel?: string;
}

export const initialCampaigns: Campaign[] = [
  { id: 'camp_1', nome: 'Lembrete de Consultas 22/06', tipo: 'whatsapp', template: 'Lembrete de Consulta', segmentoAlvo: 'Todos os pacientes com consulta em 22/06', mensagem: 'Olá {{nome}}, confirmamos sua consulta amanhã às {{horario}}. Sua saúde é nossa prioridade!', dataDisparo: '2026-06-21', status: 'enviada', totalContatos: 45, totalEnviados: 43, totalFalhas: 1, totalOptOut: 1, consentimentoObrigatorio: true, createdBy: 'Marcela Ramos' },
  { id: 'camp_2', nome: 'Campanha Vacinação Gripe 2026', tipo: 'sms', template: 'Aviso de Vacinação', segmentoAlvo: 'Pacientes 60+ anos', mensagem: 'Campanha de vacinação contra gripe ativa. Agende seu horário gratuitamente.', dataDisparo: '2026-06-18', status: 'enviada', totalContatos: 128, totalEnviados: 125, totalFalhas: 2, totalOptOut: 1, consentimentoObrigatorio: true, createdBy: 'Marcela Ramos' },
];

export const initialLeads: Lead[] = [
  { id: 'lead_1', nome: 'Camila Benítez', email: 'camila@email.com', telefone: '+595 981 111 222', origem: 'whatsapp', dataPrimeiroContato: '2026-06-15', etapaFunil: 'primeira_consulta', interesse: 'Cirurgia estética', convertido: false },
  { id: 'lead_2', nome: 'Roberto Martínez', email: 'roberto@email.com', telefone: '+595 982 333 444', origem: 'site', dataPrimeiroContato: '2026-06-10', etapaFunil: 'primeiro_contato', interesse: 'Check-up geral', convertido: false },
  { id: 'lead_3', nome: 'Laura Villalba', telefone: '+595 983 555 666', origem: 'instagram', dataPrimeiroContato: '2026-06-05', etapaFunil: 'lead', convertido: false },
  { id: 'lead_4', nome: 'Diego Ramírez', email: 'diego@email.com', origem: 'indicacao', dataPrimeiroContato: '2026-05-20', etapaFunil: 'paciente_recorrente', interesse: 'Cardiologia', observacoes: 'Paciente já realizou 3 consultas', ultimoContato: '2026-06-18', convertido: true },
];

export const initialOpportunities: CommercialOpportunity[] = [
  { id: 'opp_1', leadId: 'lead_1', pacienteNome: 'Camila Benítez', pacienteTelefone: '+595 981 111 222', tipo: 'cirurgia_estetica', descricao: 'Abdominoplastia pós-gestação', valorEstimado: 8500000, status: 'em_negociacao', probabilidade: 60, dataCriacao: '2026-06-15', responsavel: 'Dra. Amanda Silva' },
  { id: 'opp_2', pacienteNome: 'Juan Pérez', pacienteTelefone: '+595 984 777 888', tipo: 'odontologia', descricao: 'Implante dentário 3 elementos', valorEstimado: 3200000, status: 'aberta', probabilidade: 30, dataCriacao: '2026-06-12', responsavel: 'Dr. Adriano Lima' },
  { id: 'opp_3', pacienteNome: 'Ana María López', pacienteTelefone: '+595 985 999 000', tipo: 'cirurgia_geral', descricao: 'Colecistectomia laparoscópica', valorEstimado: 12000000, status: 'fechada_ganha', probabilidade: 100, dataCriacao: '2026-06-01', dataFechamento: '2026-06-20', responsavel: 'Dr. Bruno Castro' },
];

export const initialNpsSurveys: NpsSurvey[] = [
  { id: 'nps_1', pacienteNome: 'Alzira Maria', pacienteId: 'pat_1', dataAtendimento: '2026-06-20', dataResposta: '2026-06-20', score: 10, comentario: 'Excelente atendimento! O co-piloto IA ajudou muito.', categoria: 'promotor', origem: 'whatsapp', respondido: true },
  { id: 'nps_2', pacienteNome: 'Filipe Antunes', pacienteId: 'pat_2', dataAtendimento: '2026-06-19', dataResposta: '2026-06-20', score: 9, comentario: 'Portal do paciente impressionante!', categoria: 'promotor', origem: 'email', respondido: true },
  { id: 'nps_3', pacienteNome: 'Paula Gomes', pacienteId: 'pat_3', dataAtendimento: '2026-06-18', dataResposta: '2026-06-19', score: 8, comentario: 'Atendimento rápido e eficiente.', categoria: 'neutro', origem: 'sms', respondido: true },
  { id: 'nps_4', pacienteNome: 'Roberto Oliveira', pacienteId: 'pat_5', dataAtendimento: '2026-06-15', dataResposta: '2026-06-16', score: 6, comentario: 'Demorou um pouco na espera.', categoria: 'neutro', origem: 'whatsapp', respondido: true },
  { id: 'nps_5', pacienteNome: 'Cláudio Siqueira', dataAtendimento: '2026-06-22', dataResposta: '', score: 0, categoria: 'neutro', origem: 'email', respondido: false },
];

export const initialOptOuts: OptOutRecord[] = [
  { id: 'opt_1', pacienteNome: 'Marcos Pereira', pacienteContato: '+595 986 111 222', canal: 'whatsapp', dataOptOut: '2026-06-10', motivo: 'Não deseja receber mensagens de marketing', confirmado: true },
  { id: 'opt_2', pacienteNome: 'Lucía Fernández', pacienteContato: 'lucia.f@email.com', canal: 'email', dataOptOut: '2026-06-08', motivo: 'Comunicações irrelevantes', confirmado: true },
];

export const initialWebFormLeads: WebFormLead[] = [
  { id: 'wfl_1', nome: 'Sofia Mendoza', email: 'sofia@email.com', telefone: '+595 987 333 444', origem: 'site - Formulário Contato', mensagem: 'Gostaria de agendar uma consulta com cardiologista.', dataRecebimento: '2026-06-22', status: 'novo', interesse: 'Cardiologia' },
  { id: 'wfl_2', nome: 'Gustavo Rivas', email: 'gustavo@email.com', telefone: '+595 988 555 666', origem: 'Facebook Ads', mensagem: 'Tenho interesse em saber valores de implante dentário.', dataRecebimento: '2026-06-21', status: 'contatado', interesse: 'Odontologia', responsavel: 'Marcela Ramos' },
];

// ==========================================
// INTERNAÇÃO E CENTRO CIRÚRGICO
// ==========================================

// Tipos de leito
export type BedType = 'UCI' | 'UTI' | 'UCO' | 'enfermaria' | 'apartamento_individual' | 'duplo' | 'suite';
// Estados do leito
export type BedStatus = 'livre' | 'ocupado' | 'limpeza' | 'manutencao' | 'reservado' | 'bloqueado';
// Setores
export type BedSector = 'Alas Gerais' | 'UTI' | 'UCO' | 'Centro Cirúrgico' | 'Enfermaria' | 'Apartamentos' | 'Pediatria' | 'Maternidade';

// Leito estendido
export interface BedV2 {
  id: string;
  name: string;
  type: BedType;
  sector: BedSector;
  wing: string;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  entryDate?: string;
  specialty?: string;
  doctor?: string;
  specialFeatures: string[];
  isolation: boolean;
  negativePressure: boolean;
  lastCleaningAt?: string;
  maintenanceReason?: string;
  reservedUntil?: string;
  reservedForPatient?: string;
  createdAt: string;
  updatedAt: string;
}

// Transferência de leito
export interface BedTransfer {
  id: string;
  bedFromId: string;
  bedFromName: string;
  bedToId: string;
  bedToName: string;
  patientId: string;
  patientName: string;
  reason: string;
  transferredBy: string;
  transferredAt: string;
  notes?: string;
}

// Status da cirurgia
export type SurgeryStatus = 'programada' | 'confirmada' | 'paciente_em_sala' | 'em_intervencao' | 'em_recuperacao' | 'finalizada' | 'suspensa' | 'cancelada';
// Tipo de anestesia
export type AnesthesiaType = 'geral' | 'regional' | 'local' | 'sedacao' | 'bloqueio' | 'combinada';

// Equipe cirúrgica
export interface SurgicalTeam {
  surgeon: string;
  anesthesiologist: string;
  instrumentator: string;
  circulator: string;
  assistants: string[];
}

// Checklist pré-cirúrgico (OMS)
export interface SurgicalChecklist {
  id: string;
  surgeryId: string;
  patientIdentityVerified: boolean;
  lateralityVerified: boolean;
  fastingVerified: boolean;
  preOpExamsVerified: boolean;
  informedConsentSigned: boolean;
  antibioticProphylaxis: boolean;
  checklistCompletedBy: string;
  checklistCompletedAt: string;
  notes?: string;
}

// Registro intraoperatório
export interface IntraoperativeRecord {
  id: string;
  surgeryId: string;
  startTime: string;
  endTime?: string;
  intercurrences: string;
  materialsConsumed: { name: string; quantity: number; lotNumber?: string }[];
  anestheticNotes: string;
  vitalSigns: { time: string; bp: string; hr: number; spo2: number; }[];
  recordedBy: string;
  recordedAt: string;
}

// Agendamento cirúrgico
export interface SurgerySchedule {
  id: string;
  patientId: string;
  patientName: string;
  surgeon: string;
  team: SurgicalTeam;
  room: string;
  procedureType: string;
  procedureCode: string;
  estimatedDuration: number;
  anesthesiaType: AnesthesiaType;
  specialMaterials: string[];
  status: SurgeryStatus;
  scheduledDate: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  checklist?: SurgicalChecklist;
  intraoperative?: IntraoperativeRecord;
  preOpDiagnosis: string;
  postOpDiagnosis?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Status da internação
export type HospitalizationStatus = 'ativa' | 'alta_medica' | 'alta_voluntaria' | 'alta_administrativa' | 'transferencia' | 'obito';
// Tipo de cobertura
export type CoverageType = 'particular' | 'convênio' | 'ips' | 'sanidade_militar' | 'sanidade_policial' | 'seguro_privado' | 'corporativo' | 'mercosul';

// Episódio de internação
export interface HospitalizationEpisode {
  id: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  admissionTime: string;
  reason: string;
  initialDiagnosis: string;
  initialCid10: string;
  responsibleDoctor: string;
  coverageType: CoverageType;
  coverageAuthorization: string;
  bedId: string;
  bedName: string;
  status: HospitalizationStatus;
  dischargeDate?: string;
  dischargeSummary?: string;
  dischargeDoctor?: string;
  transferInstitution?: string;
  deathCause?: string;
  deathCertificate?: string;
  medicalEvolutions: MedicalEvolution[];
  nursingSheets: NursingSheet[];
  createdAt: string;
  updatedAt: string;
}

// Evolução médica diária
export interface MedicalEvolution {
  id: string;
  hospitalizationId: string;
  patientId: string;
  date: string;
  time: string;
  doctor: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitalSigns: { bp: string; hr: number; rr: number; temp: string; spo2: number; };
  signedAt?: string;
  signatureId?: string;
  createdAt: string;
}

// Folha de enfermagem
export interface NursingSheet {
  id: string;
  hospitalizationId: string;
  patientId: string;
  date: string;
  shift: 'manha' | 'tarde' | 'noite';
  nurse: string;
  vitalSigns: { time: string; bp: string; hr: number; rr: number; temp: string; spo2: number; }[];
  fluidBalance: { intake: number; output: number; balance: number; };
  medications: { name: string; dosage: string; route: string; time: string; administeredBy: string; }[];
  interventions: { description: string; time: string; }[];
  observations: string;
  createdAt: string;
}

// Tipos de alerta
export type AlertType = 'alta_prevista' | 'tempo_internacao_excedido' | 'limpeza_excedida' | 'conflito_sala' | 'checklist_pendente';

export interface HospitalAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  sourceId: string;
  sourceName: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Relatórios hospitalares
export interface BedOccupationReport {
  date: string;
  sector: string;
  bedType: string;
  totalBeds: number;
  occupiedBeds: number;
  freeBeds: number;
  occupancyRate: number;
}

export interface HospitalizationReport {
  period: string;
  specialty: string;
  doctor: string;
  diagnosis: string;
  coverage: string;
  admissions: number;
  discharges: number;
  averageStay: number;
  deaths: number;
}

export interface SurgeryReport {
  period: string;
  surgeon: string;
  procedureType: string;
  scheduled: number;
  performed: number;
  suspended: number;
  cancelled: number;
  averageDuration: number;
}

export interface FinancialHospitalReport {
  hospitalizationId: string;
  patientName: string;
  directCosts: number;
  indirectCosts: number;
  totalCosts: number;
  revenue: number;
  margin: number;
  coverageType: string;
}

export interface StayReport {
  patientId: string;
  patientName: string;
  diagnosis: string;
  actualStay: number;
  averageStayForDiagnosis: number;
  difference: number;
}

// ==========================================
// SEED DATA - LEITOS V2
// ==========================================
export const initialBedsV2: BedV2[] = [
  { id: 'bed_1', name: 'Enfermaria 101-A', type: 'enfermaria', sector: 'Alas Gerais', wing: 'Ala A', status: 'ocupado', patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida', entryDate: '2026-06-21', specialty: 'Cardiologia', doctor: 'Dra. Amanda Silva', specialFeatures: [], isolation: false, negativePressure: false, lastCleaningAt: '2026-06-20T08:00:00', createdAt: '2026-01-01', updatedAt: '2026-06-21' },
  { id: 'bed_2', name: 'Enfermaria 101-B', type: 'enfermaria', sector: 'Alas Gerais', wing: 'Ala A', status: 'livre', specialFeatures: [], isolation: false, negativePressure: false, lastCleaningAt: '2026-06-22T06:00:00', createdAt: '2026-01-01', updatedAt: '2026-06-22' },
  { id: 'bed_3', name: 'UTI Cardiológica Box 01', type: 'UTI', sector: 'UTI', wing: 'UTI', status: 'limpeza', specialFeatures: ['monitor_cardiaco', 'ventilador_mecanico'], isolation: false, negativePressure: false, lastCleaningAt: '2026-06-22T10:00:00', createdAt: '2026-01-01', updatedAt: '2026-06-22' },
  { id: 'bed_4', name: 'UTI Cardiológica Box 02', type: 'UTI', sector: 'UTI', wing: 'UTI', status: 'reservado', reservedUntil: '2026-06-25', reservedForPatient: 'Cirurgia Cardíaca Eletiva', specialFeatures: ['monitor_cardiaco', 'ventilador_mecanico', 'marca_passo'], isolation: false, negativePressure: false, createdAt: '2026-01-01', updatedAt: '2026-06-22' },
  { id: 'bed_5', name: 'UCO Box 01', type: 'UCO', sector: 'UCO', wing: 'UCO', status: 'livre', specialFeatures: ['telemetria'], isolation: false, negativePressure: false, lastCleaningAt: '2026-06-21T14:00:00', createdAt: '2026-01-01', updatedAt: '2026-06-21' },
  { id: 'bed_6', name: 'Apartamento 201 - Premium', type: 'apartamento_individual', sector: 'Apartamentos', wing: 'Ala B', status: 'ocupado', patientId: 'pat_2', patientName: 'Mariana Rosa Santos', entryDate: '2026-06-21', specialty: 'Obstetrícia', doctor: 'Dra. Amanda Silva', specialFeatures: ['tv', 'frigobar', 'wifi', 'banheiro_privativo'], isolation: false, negativePressure: false, createdAt: '2026-01-01', updatedAt: '2026-06-21' },
  { id: 'bed_7', name: 'Apartamento 202 - Premium', type: 'apartamento_individual', sector: 'Apartamentos', wing: 'Ala B', status: 'manutencao', maintenanceReason: 'Pintura e reparos', specialFeatures: ['tv', 'frigobar', 'wifi', 'banheiro_privativo'], isolation: false, negativePressure: false, createdAt: '2026-01-01', updatedAt: '2026-06-20' },
  { id: 'bed_8', name: 'Suíte Master 301', type: 'suite', sector: 'Apartamentos', wing: 'Ala C', status: 'bloqueado', specialFeatures: ['tv', 'frigobar', 'wifi', 'banheiro_privativo', 'sofá_cama', 'vista_panoramica'], isolation: false, negativePressure: false, createdAt: '2026-01-01', updatedAt: '2026-06-01' },
  { id: 'bed_9', name: 'Enfermaria 102-A', type: 'enfermaria', sector: 'Alas Gerais', wing: 'Ala A', status: 'livre', specialFeatures: [], isolation: false, negativePressure: false, lastCleaningAt: '2026-06-22T07:00:00', createdAt: '2026-01-01', updatedAt: '2026-06-22' },
  { id: 'bed_10', name: 'Quarto Duplo 203-A', type: 'duplo', sector: 'Alas Gerais', wing: 'Ala B', status: 'ocupado', patientId: 'pat_3', patientName: 'Joaquim Bento Pereira', entryDate: '2026-06-19', specialty: 'Ortopedia', doctor: 'Dr. Adriano Lima', specialFeatures: ['tv'], isolation: false, negativePressure: false, createdAt: '2026-01-01', updatedAt: '2026-06-19' },
  { id: 'bed_11', name: 'Quarto Duplo 203-B', type: 'duplo', sector: 'Alas Gerais', wing: 'Ala B', status: 'livre', specialFeatures: ['tv'], isolation: false, negativePressure: false, lastCleaningAt: '2026-06-22T08:00:00', createdAt: '2026-01-01', updatedAt: '2026-06-22' },
  { id: 'bed_12', name: 'UTI - Isolamento Box 03', type: 'UTI', sector: 'UTI', wing: 'UTI', status: 'livre', specialFeatures: ['monitor_cardiaco', 'ventilador_mecanico', 'pressao_negativa'], isolation: true, negativePressure: true, lastCleaningAt: '2026-06-21T16:00:00', createdAt: '2026-01-01', updatedAt: '2026-06-21' },
  { id: 'bed_13', name: 'Pediatria 301-A', type: 'enfermaria', sector: 'Pediatria', wing: 'Ala D', status: 'livre', specialFeatures: ['berco'], isolation: false, negativePressure: false, createdAt: '2026-01-01', updatedAt: '2026-06-01' },
  { id: 'bed_14', name: 'Maternidade 401', type: 'apartamento_individual', sector: 'Maternidade', wing: 'Ala E', status: 'reservado', reservedUntil: '2026-07-10', reservedForPatient: 'Parto programado', specialFeatures: ['tv', 'berco', 'poltrona_acompanhante'], isolation: false, negativePressure: false, createdAt: '2026-01-01', updatedAt: '2026-06-22' },
  { id: 'bed_15', name: 'Sala Cirúrgica 01', type: 'apartamento_individual', sector: 'Centro Cirúrgico', wing: 'Bloco Cirúrgico', status: 'ocupado', specialFeatures: ['mesa_cirurgica', 'foco', 'anestesia', 'monitor'], isolation: false, negativePressure: false, createdAt: '2026-01-01', updatedAt: '2026-06-22' },
];

// Transferências de leito
export const initialBedTransfers: BedTransfer[] = [
  { id: 'bt_1', bedFromId: 'bed_10', bedFromName: 'Quarto Duplo 203-A', bedToId: 'bed_10', bedToName: 'Quarto Duplo 203-A', patientId: 'pat_3', patientName: 'Joaquim Bento Pereira', reason: 'Troca de leito por necessidade de acompanhante', transferredBy: 'Enf. Marcela Ramos', transferredAt: '2026-06-20T14:30:00', notes: 'Paciente solicitou troca para leito com acompanhante' },
];

// ==========================================
// SEED DATA - AGENDA CIRÚRGICA
// ==========================================
export const initialSurgerySchedule: SurgerySchedule[] = [
  {
    id: 'surg_1',
    patientId: 'pat_1',
    patientName: 'Carlos Eduardo Almeida',
    surgeon: 'Dr. Adriano Lima',
    team: {
      surgeon: 'Dr. Adriano Lima',
      anesthesiologist: 'Dr. Carlos Mendes',
      instrumentator: 'Enf. Téc. Juliana',
      circulator: 'Enf. Marcos',
      assistants: ['Dr. Pedro Alves'],
    },
    room: 'Sala Cirúrgica 01',
    procedureType: 'Colecistectomia Laparoscópica',
    procedureCode: 'CIR-001',
    estimatedDuration: 120,
    anesthesiaType: 'geral',
    specialMaterials: ['Kit laparoscopia', 'Grampeador endoscópico', 'Solução fisiológica'],
    status: 'confirmada',
    scheduledDate: '2026-06-23',
    scheduledTime: '08:00',
    preOpDiagnosis: 'Colelitíase sintomática (K80)',
    notes: 'Jejum desde 22h do dia anterior. Antibioticoprofilaxia com Cefazolina 2g EV.',
    createdAt: '2026-06-10',
    updatedAt: '2026-06-22',
    checklist: {
      id: 'check_1',
      surgeryId: 'surg_1',
      patientIdentityVerified: true,
      lateralityVerified: true,
      fastingVerified: true,
      preOpExamsVerified: true,
      informedConsentSigned: true,
      antibioticProphylaxis: true,
      checklistCompletedBy: 'Enf. Marcela Ramos',
      checklistCompletedAt: '2026-06-22T20:00:00',
    },
  },
  {
    id: 'surg_2',
    patientId: 'pat_2',
    patientName: 'Mariana Rosa Santos',
    surgeon: 'Dra. Amanda Silva',
    team: {
      surgeon: 'Dra. Amanda Silva',
      anesthesiologist: 'Dr. Carlos Mendes',
      instrumentator: 'Enf. Téc. Juliana',
      circulator: 'Enf. Marcos',
      assistants: [],
    },
    room: 'Sala Cirúrgica 01',
    procedureType: 'Cesárea',
    procedureCode: 'CIR-002',
    estimatedDuration: 90,
    anesthesiaType: 'regional',
    specialMaterials: ['Kit cesárea', 'Solução fisiológica', 'Ocitocina'],
    status: 'programada',
    scheduledDate: '2026-06-24',
    scheduledTime: '10:00',
    preOpDiagnosis: 'Gestação 39 semanas - cesárea eletiva (O80)',
    createdAt: '2026-06-15',
    updatedAt: '2026-06-22',
  },
  {
    id: 'surg_3',
    patientId: 'pat_3',
    patientName: 'Joaquim Bento Pereira',
    surgeon: 'Dr. Adriano Lima',
    team: {
      surgeon: 'Dr. Adriano Lima',
      anesthesiologist: 'Dr. Ricardo Souza',
      instrumentator: 'Enf. Téc. Paula',
      circulator: 'Enf. Carla',
      assistants: [],
    },
    room: 'Sala Cirúrgica 02',
    procedureType: 'Artroplastia Total de Joelho',
    procedureCode: 'CIR-003',
    estimatedDuration: 180,
    anesthesiaType: 'combinada',
    specialMaterials: ['Prótese de joelho', 'Cimento ósseo', 'Dreno de sucção', 'Compressas'],
    status: 'programada',
    scheduledDate: '2026-06-25',
    scheduledTime: '07:30',
    preOpDiagnosis: 'Artrose do joelho (M17)',
    notes: 'Paciente em uso de anticoagulante - suspender 5 dias antes',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-20',
  },
  {
    id: 'surg_4',
    patientId: 'pat_5',
    patientName: 'Roberto de Oliveira Cruz',
    surgeon: 'Dr. Bruno Castro',
    team: {
      surgeon: 'Dr. Bruno Castro',
      anesthesiologist: 'Dr. Ricardo Souza',
      instrumentator: 'Enf. Téc. Juliana',
      circulator: 'Enf. Marcos',
      assistants: [],
    },
    room: 'Sala Cirúrgica 03',
    procedureType: 'Herniorrafia Inguinal',
    procedureCode: 'CIR-004',
    estimatedDuration: 60,
    anesthesiaType: 'local',
    specialMaterials: ['Tela de polipropileno', 'Solução anestésica'],
    status: 'suspensa',
    scheduledDate: '2026-06-20',
    scheduledTime: '14:00',
    preOpDiagnosis: 'Hérnia inguinal direita',
    notes: 'Suspensa por falta de autorização do convênio',
    createdAt: '2026-06-05',
    updatedAt: '2026-06-19',
  },
  {
    id: 'surg_5',
    patientId: 'pat_4',
    patientName: 'Ana Júlia de Souza',
    surgeon: 'Dr. Adriano Lima',
    team: {
      surgeon: 'Dr. Adriano Lima',
      anesthesiologist: 'Dr. Carlos Mendes',
      instrumentator: 'Enf. Téc. Paula',
      circulator: 'Enf. Carla',
      assistants: [],
    },
    room: 'Sala Cirúrgica 02',
    procedureType: 'Apendicectomia',
    procedureCode: 'CIR-005',
    estimatedDuration: 60,
    anesthesiaType: 'geral',
    specialMaterials: ['Kit apendicectomia'],
    status: 'em_intervencao',
    scheduledDate: '2026-06-22',
    scheduledTime: '11:00',
    actualStartTime: '2026-06-22T11:15:00',
    preOpDiagnosis: 'Apendicite aguda',
    createdAt: '2026-06-22',
    updatedAt: '2026-06-22',
    checklist: {
      id: 'check_5',
      surgeryId: 'surg_5',
      patientIdentityVerified: true,
      lateralityVerified: true,
      fastingVerified: true,
      preOpExamsVerified: true,
      informedConsentSigned: true,
      antibioticProphylaxis: true,
      checklistCompletedBy: 'Enf. Marcela Ramos',
      checklistCompletedAt: '2026-06-22T10:30:00',
    },
    intraoperative: {
      id: 'intra_5',
      surgeryId: 'surg_5',
      startTime: '2026-06-22T11:15:00',
      intercurrences: 'Nenhuma intercorrência até o momento',
      materialsConsumed: [{ name: 'Solução fisiológica 500ml', quantity: 2 }, { name: 'Fio de sutura vicryl 2.0', quantity: 3 }],
      anestheticNotes: 'Indução anestésica com Propofol 120mg + Fentanil 100mcg. Manutenção com Sevoflurano.',
      vitalSigns: [{ time: '11:15', bp: '120x80', hr: 78, spo2: 99 }, { time: '11:30', bp: '118x76', hr: 72, spo2: 100 }],
      recordedBy: 'Dr. Carlos Mendes',
      recordedAt: '2026-06-22T11:30:00',
    },
  },
];

// ==========================================
// SEED DATA - INTERNAÇÕES
// ==========================================
export const initialHospitalizations: HospitalizationEpisode[] = [
  {
    id: 'hosp_1',
    patientId: 'pat_1',
    patientName: 'Carlos Eduardo Almeida',
    admissionDate: '2026-06-21',
    admissionTime: '14:30',
    reason: 'Dor abdominal intensa em hipocôndrio direito há 3 dias, com náuseas e vômitos',
    initialDiagnosis: 'Colelitíase sintomática / Colecistite aguda',
    initialCid10: 'K80',
    responsibleDoctor: 'Dra. Amanda Silva',
    coverageType: 'convênio',
    coverageAuthorization: 'AUTH-2026-0100',
    bedId: 'bed_1',
    bedName: 'Enfermaria 101-A',
    status: 'ativa',
    medicalEvolutions: [
      {
        id: 'evol_1',
        hospitalizationId: 'hosp_1',
        patientId: 'pat_1',
        date: '2026-06-21',
        time: '16:00',
        doctor: 'Dra. Amanda Silva',
        subjective: 'Paciente relata dor moderada (5/10) em hipocôndrio direito. Náusea controlada com antieméticos.',
        objective: 'PA 130x85, FC 82 bpm, FR 16 rpm, Temp 37.2°C, SpO2 98%. Abdome doloroso à palpação profunda em HD. Sinal de Murphy positivo. Sem sinais de peritonite.',
        assessment: 'Colecistite aguda leve. Paciente estável hemodinamicamente.',
        plan: 'Manter hidratação EV, antibioticoterapia (Ceftriaxona + Metronidazol). Programar colecistectomia laparoscópica para 23/06. Solicitar exames pré-operatórios.',
        vitalSigns: { bp: '130x85', hr: 82, rr: 16, temp: '37.2', spo2: 98 },
        createdAt: '2026-06-21T16:00:00',
      },
      {
        id: 'evol_2',
        hospitalizationId: 'hosp_1',
        patientId: 'pat_1',
        date: '2026-06-22',
        time: '08:00',
        doctor: 'Dra. Amanda Silva',
        subjective: 'Paciente refere melhora da dor (2/10). Sem náuseas. Aceitando dieta líquida.',
        objective: 'PA 125x80, FC 76 bpm, FR 14 rpm, Temp 36.8°C, SpO2 99%. Abdome menos doloroso. Exames pré-op solicitados.',
        assessment: 'Melhora clínica com tratamento conservador. Paciente apto para cirurgia amanhã.',
        plan: 'Manter antibioticoterapia. Jejum a partir das 22h. Preparo pré-operatório conforme protocolo.',
        vitalSigns: { bp: '125x80', hr: 76, rr: 14, temp: '36.8', spo2: 99 },
        createdAt: '2026-06-22T08:00:00',
      },
    ],
    nursingSheets: [
      {
        id: 'nurs_1',
        hospitalizationId: 'hosp_1',
        patientId: 'pat_1',
        date: '2026-06-21',
        shift: 'tarde',
        nurse: 'Enf. Marcela Ramos',
        vitalSigns: [
          { time: '15:00', bp: '135x85', hr: 84, rr: 16, temp: '37.3', spo2: 97 },
          { time: '17:00', bp: '130x85', hr: 82, rr: 16, temp: '37.2', spo2: 98 },
          { time: '19:00', bp: '128x82', hr: 80, rr: 15, temp: '37.0', spo2: 98 },
        ],
        fluidBalance: { intake: 1500, output: 800, balance: 700 },
        medications: [
          { name: 'Ceftriaxona 1g', dosage: '1g EV 12/12h', route: 'EV', time: '15:30', administeredBy: 'Enf. Marcela Ramos' },
          { name: 'Metronidazol 500mg', dosage: '500mg EV 8/8h', route: 'EV', time: '15:30', administeredBy: 'Enf. Marcela Ramos' },
          { name: 'Dipirona 500mg', dosage: '500mg EV', route: 'EV', time: '15:00', administeredBy: 'Enf. Marcela Ramos' },
          { name: 'Ondansetrona 8mg', dosage: '8mg EV', route: 'EV', time: '15:00', administeredBy: 'Enf. Marcela Ramos' },
        ],
        interventions: [
          { description: 'Acesso venoso periférico calibre 20G MSE', time: '15:00' },
          { description: 'Coleta de exames laboratoriais', time: '15:15' },
          { description: 'Orientação sobre jejum pré-operatório', time: '18:00' },
        ],
        observations: 'Paciente lúcido, orientado, deambulando. Aceitou dieta líquida. Queixas de dor controladas.',
        createdAt: '2026-06-21T20:00:00',
      },
    ],
    createdAt: '2026-06-21T14:30:00',
    updatedAt: '2026-06-22T08:00:00',
  },
  {
    id: 'hosp_2',
    patientId: 'pat_2',
    patientName: 'Mariana Rosa Santos',
    admissionDate: '2026-06-21',
    admissionTime: '10:00',
    reason: 'Admissão para cesárea eletiva - gestação 39 semanas',
    initialDiagnosis: 'Gestação 39 semanas - cesárea eletiva',
    initialCid10: 'O80',
    responsibleDoctor: 'Dra. Amanda Silva',
    coverageType: 'particular',
    coverageAuthorization: 'N/A',
    bedId: 'bed_6',
    bedName: 'Apartamento 201 - Premium',
    status: 'ativa',
    medicalEvolutions: [
      {
        id: 'evol_3',
        hospitalizationId: 'hosp_2',
        patientId: 'pat_2',
        date: '2026-06-21',
        time: '11:00',
        doctor: 'Dra. Amanda Silva',
        subjective: 'Paciente assintomática, nega contrações ou perda de líquido. Ansiosa pela cesárea agendada para 24/06.',
        objective: 'PA 115x75, FC 72 bpm, FR 14 rpm, Temp 36.6°C, SpO2 100%. BCF 148 bpm. Altura uterina compatível. Toque: colo posterior, fechado.',
        assessment: 'Gestante de 39 semanas, sem sinais de trabalho de parto. Condições fetais adequadas.',
        plan: 'Aguardar cesárea eletiva dia 24/06. Realizar cardiotocografia diária. Orientar sinais de alerta.',
        vitalSigns: { bp: '115x75', hr: 72, rr: 14, temp: '36.6', spo2: 100 },
        createdAt: '2026-06-21T11:00:00',
      },
    ],
    nursingSheets: [
      {
        id: 'nurs_2',
        hospitalizationId: 'hosp_2',
        patientId: 'pat_2',
        date: '2026-06-21',
        shift: 'tarde',
        nurse: 'Enf. Marcela Ramos',
        vitalSigns: [
          { time: '12:00', bp: '115x75', hr: 74, rr: 14, temp: '36.5', spo2: 100 },
          { time: '16:00', bp: '118x78', hr: 76, rr: 15, temp: '36.6', spo2: 100 },
        ],
        fluidBalance: { intake: 800, output: 350, balance: 450 },
        medications: [
          { name: 'Sulfato Ferroso 40mg', dosage: '40mg VO 1x/dia', route: 'VO', time: '12:00', administeredBy: 'Enf. Marcela Ramos' },
          { name: 'Ácido Fólico 5mg', dosage: '5mg VO 1x/dia', route: 'VO', time: '12:00', administeredBy: 'Enf. Marcela Ramos' },
        ],
        interventions: [
          { description: 'Cardiotocografia - reativo, BCF 148, movimentos fetais presentes', time: '14:00' },
          { description: 'Orientação pré-operatória para cesárea', time: '15:00' },
        ],
        observations: 'Paciente tranquila, deambulando. Aceitando dieta geral. Movimentação fetal ativa.',
        createdAt: '2026-06-21T18:00:00',
      },
    ],
    createdAt: '2026-06-21T10:00:00',
    updatedAt: '2026-06-21T11:00:00',
  },
  {
    id: 'hosp_3',
    patientId: 'pat_3',
    patientName: 'Joaquim Bento Pereira',
    admissionDate: '2026-06-19',
    admissionTime: '09:00',
    reason: 'Dor lombar crônica com piora progressiva, aguardando artroplastia de joelho',
    initialDiagnosis: 'Artrose do joelho direito (M17)',
    initialCid10: 'M17',
    responsibleDoctor: 'Dr. Adriano Lima',
    coverageType: 'convênio',
    coverageAuthorization: 'AUTH-2026-0095',
    bedId: 'bed_10',
    bedName: 'Quarto Duplo 203-A',
    status: 'ativa',
    medicalEvolutions: [
      {
        id: 'evol_4',
        hospitalizationId: 'hosp_3',
        patientId: 'pat_3',
        date: '2026-06-19',
        time: '14:00',
        doctor: 'Dr. Adriano Lima',
        subjective: 'Paciente com dor articular (4/10) em joelho D. Dificuldade para deambular. Aguardando cirurgia.',
        objective: 'PA 140x90, FC 88 bpm, FR 16 rpm, Temp 36.8°C. Joelho D com crepitação e dor à movimentação. Edema leve.',
        assessment: 'Paciente pré-operatório de artroplastia de joelho. Hipertenso em tratamento.',
        plan: 'Suspender anticoagulante (Rivaroxabana) conforme protocolo. Solicitar ECG e Rx tórax. Manter anti-hipertensivos.',
        vitalSigns: { bp: '140x90', hr: 88, rr: 16, temp: '36.8', spo2: 97 },
        createdAt: '2026-06-19T14:00:00',
      },
    ],
    nursingSheets: [],
    createdAt: '2026-06-19T09:00:00',
    updatedAt: '2026-06-19T14:00:00',
  },
];

// ==========================================
// SEED DATA - ALERTAS HOSPITALARES
// ==========================================
export const initialHospitalAlerts: HospitalAlert[] = [
  { id: 'alert_h_1', type: 'alta_prevista', title: 'Alta Prevista - Joaquim Bento', description: 'Paciente internado desde 19/06. Alta prevista para 26/06.', severity: 'info', sourceId: 'hosp_3', sourceName: 'Joaquim Bento Pereira', createdAt: '2026-06-22T08:00:00', resolved: false },
  { id: 'alert_h_2', type: 'tempo_internacao_excedido', title: 'Tempo de Internação Excedido', description: 'Paciente Joaquim Bento (4 dias) excedeu média para artrose (3 dias).', severity: 'warning', sourceId: 'hosp_3', sourceName: 'Joaquim Bento Pereira', createdAt: '2026-06-22T08:00:00', resolved: false },
  { id: 'alert_h_3', type: 'limpeza_excedida', title: 'Higienização Excedida - UTI Box 01', description: 'Leito UTI Box 01 em limpeza há mais de 2 horas. Verificar atraso.', severity: 'warning', sourceId: 'bed_3', sourceName: 'UTI Cardiológica Box 01', createdAt: '2026-06-22T10:30:00', resolved: false },
  { id: 'alert_h_4', type: 'checklist_pendente', title: 'Checklist Pendente - Cesárea', description: 'Checklist pré-cirúrgico para cesárea de Mariana Santos ainda não foi preenchido.', severity: 'info', sourceId: 'surg_2', sourceName: 'Cesárea - Mariana Rosa Santos', createdAt: '2026-06-22T09:00:00', resolved: false },
];

// ==========================================
// PORTAL DO PACIENTE - Interfaces
// ==========================================
export interface PortalPatientUser {
  id: string;
  patientId: string;
  ci: string;
  email: string;
  phone: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'email';
  pushToken?: string;
  deviceOs?: string;
  lastLogin?: string;
  createdAt: string;
  active: boolean;
}

export interface PortalNotification {
  id: string;
  patientId: string;
  type: 'appointment_reminder' | 'exam_result' | 'prescription' | 'payment' | 'telemedicine' | 'vaccination' | 'general';
  channel: 'push' | 'email' | 'whatsapp' | 'sms';
  title: string;
  body?: string;
  referenceId?: string;
  referenceType?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  createdAt: string;
}

export interface OnlinePayment {
  id: string;
  patientId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'paypal' | 'mercadopago';
  status: 'pending' | 'confirmed' | 'refunded' | 'cancelled';
  transactionId?: string;
  referenceType?: string;
  referenceId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface TelemedicineRequest {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'solicitado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
  roomUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface PortalOtpToken {
  id: string;
  patientId: string;
  phone?: string;
  email?: string;
  code: string;
  method: 'sms' | 'email';
  expiresAt: string;
  used: boolean;
  attempts: number;
  createdAt: string;
}

export interface PortalSession {
  id: string;
  patientUserId: string;
  ipAddress: string;
  deviceInfo: string;
  loginAt: string;
  lastActivityAt: string;
  expiresAt: string;
  active: boolean;
}

export interface PortalDteDownload {
  id: string;
  patientId: string;
  dteType: string;
  dteNumber: string;
  dteSerie: string;
  amount: number;
  description: string;
  pdfUrl?: string;
  xmlUrl?: string;
  downloadedAt?: string;
  createdAt: string;
}

export interface PortalConsentLog {
  id: string;
  patientId: string;
  consentType: string;
  granted: boolean;
  version: string;
  ipAddress?: string;
  createdAt: string;
}

// ==========================================
// PORTAL DO PACIENTE - Mock Data
// ==========================================
export const initialPortalNotifications: PortalNotification[] = [
  { id: 'pn_1', patientId: 'pat_1', type: 'appointment_reminder', channel: 'push', title: 'Lembrete de Consulta', body: 'Sua consulta com Dra. Amanda Silva é amanhã às 10:30.', status: 'sent', sentAt: '2026-06-21T08:00:00', createdAt: '2026-06-21T08:00:00' },
  { id: 'pn_2', patientId: 'pat_1', type: 'prescription', channel: 'push', title: 'Nova Receita Digital', body: 'Dra. Amanda Silva emitiu uma nova receita para Losartana 50mg.', status: 'delivered', sentAt: '2026-06-20T14:30:00', createdAt: '2026-06-20T14:30:00' },
  { id: 'pn_3', patientId: 'pat_1', type: 'exam_result', channel: 'email', title: 'Resultado de Exame Disponível', body: 'Seu exame de sangue está disponível no portal.', status: 'sent', sentAt: '2026-06-19T10:00:00', createdAt: '2026-06-19T10:00:00' },
  { id: 'pn_4', patientId: 'pat_1', type: 'payment', channel: 'whatsapp', title: 'Fatura Disponível', body: 'Sua fatura DTE Nº 001-002-0000302 está disponível para download.', status: 'delivered', sentAt: '2026-06-18T09:00:00', createdAt: '2026-06-18T09:00:00' },
  { id: 'pn_5', patientId: 'pat_1', type: 'telemedicine', channel: 'push', title: 'Lembrete de Teleconsulta', body: 'Sua teleconsulta com Dr. Adriano Lima inicia em 30 minutos.', status: 'read', sentAt: '2026-06-22T10:00:00', createdAt: '2026-06-22T09:00:00' },
];

export const initialOnlinePayments: OnlinePayment[] = [
  { id: 'pay_1', patientId: 'pat_1', amount: 150.00, paymentMethod: 'pix', status: 'confirmed', transactionId: 'PIX-20260621-ABCD1234', referenceType: 'consulta', referenceId: 'app_2', paidAt: '2026-06-21T11:30:00', createdAt: '2026-06-21T11:30:00' },
  { id: 'pay_2', patientId: 'pat_3', amount: 320.00, paymentMethod: 'credit_card', status: 'confirmed', transactionId: 'CC-20260620-EFGH5678', referenceType: 'exame', referenceId: 'app_1', paidAt: '2026-06-20T15:00:00', createdAt: '2026-06-20T15:00:00' },
  { id: 'pay_3', patientId: 'pat_1', amount: 89.90, paymentMethod: 'boleto', status: 'pending', referenceType: 'consulta', createdAt: '2026-06-22T08:00:00' },
];

export const initialTelemedicineRequests: TelemedicineRequest[] = [
  { id: 'tel_1', patientId: 'pat_1', patientName: 'Carlos Eduardo Almeida', doctorName: 'Dr. Adriano Lima', specialty: 'Ortopedia', scheduledDate: '2026-07-05', scheduledTime: '14:00', status: 'confirmado', notes: 'Retorno sobre tendinite de Aquiles', createdAt: '2026-06-20T10:00:00' },
  { id: 'tel_2', patientId: 'pat_2', patientName: 'Mariana Rosa Santos', doctorName: 'Dra. Amanda Silva', specialty: 'Ginecologia', scheduledDate: '2026-06-28', scheduledTime: '09:30', status: 'solicitado', notes: 'Acompanhamento pré-natal', createdAt: '2026-06-21T09:00:00' },
];

export const initialPortalOtpTokens: PortalOtpToken[] = [
  { id: 'otp_1', patientId: 'pat_1', phone: '+595 981 234 567', code: '482916', method: 'sms', expiresAt: '2026-07-02T10:15:00', used: true, attempts: 1, createdAt: '2026-07-02T10:00:00' },
  { id: 'otp_2', patientId: 'pat_2', email: 'mariana@email.com', code: '735201', method: 'email', expiresAt: '2026-07-02T11:15:00', used: false, attempts: 0, createdAt: '2026-07-02T11:00:00' },
];

export const initialPortalSessions: PortalSession[] = [
  { id: 'psess_1', patientUserId: 'ptu_1', ipAddress: '192.168.1.100', deviceInfo: 'Chrome 128 / Android 14', loginAt: '2026-07-02 08:30:00', lastActivityAt: '2026-07-02 10:00:00', expiresAt: '2026-07-02 20:30:00', active: true },
];

export const initialPortalDteDownloads: PortalDteDownload[] = [
  { id: 'dtedl_1', patientId: 'pat_1', dteType: 'Factura Electrónica', dteNumber: '001-002-0000302', dteSerie: '001', amount: 350000, description: 'Consulta médica - Ortopedia', pdfUrl: '#', downloadedAt: '2026-06-21T12:00:00', createdAt: '2026-06-21T11:00:00' },
  { id: 'dtedl_2', patientId: 'pat_1', dteType: 'Factura Electrónica', dteNumber: '001-002-0000303', dteSerie: '001', amount: 280000, description: 'Exame laboratorial', pdfUrl: '#', createdAt: '2026-06-20T15:00:00' },
];

export const initialPortalConsentLogs: PortalConsentLog[] = [
  { id: 'cons_1', patientId: 'pat_1', consentType: 'dados_pessoais', granted: true, version: '2.0', ipAddress: '192.168.1.100', createdAt: '2026-07-01T10:00:00' },
  { id: 'cons_2', patientId: 'pat_1', consentType: 'comunicacao_marketing', granted: false, version: '2.0', ipAddress: '192.168.1.100', createdAt: '2026-07-01T10:00:00' },
];

// ==========================================
// LOCAIS (SEDES) E SALAS/CONSULTÓRIOS
// ==========================================

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  status: string;
}

export interface ClinicalRoom {
  id: string;
  name: string;
  type: string;
  location_id: string;
  status: string;
  capacity: number;
  equipment: string[];
}

export const initialLocations: Location[] = [
  { id: 'loc_1', name: 'Sede Central',          address: 'Av. Brasil, 1234',           phone: '+595 21 555-1234', city: 'Encarnación',         status: 'ativo' },
  { id: 'loc_2', name: 'Filial Ciudad del Este', address: 'Av. Kennedy, 567',           phone: '+595 61 555-5678', city: 'Ciudad del Este',     status: 'ativo' },
  { id: 'loc_3', name: 'Filial Asunción',       address: 'Av. Mariscal López, 890',    phone: '+595 21 555-9012', city: 'Asunción',            status: 'ativo' },
  { id: 'loc_4', name: 'Filial Encarnación',    address: 'Calle Pte. Franco, 456',      phone: '+595 67 555-3456', city: 'Encarnación',         status: 'ativo' },
  { id: 'loc_5', name: 'Filial Pedro Juan',     address: 'Av. Mcal. Estigarribia, 321', phone: '+595 491 555-7890', city: 'Pedro Juan Caballero', status: 'ativo' },
];

export const initialClinicalRooms: ClinicalRoom[] = [
  { id: 'room_1', name: 'Consultório 101',     type: 'consultório',          location_id: 'loc_1', status: 'ativo', capacity: 1, equipment: ['Otoscópio', 'Oftalmoscópio', 'Balança'] },
  { id: 'room_2', name: 'Consultório 102',     type: 'consultório',          location_id: 'loc_1', status: 'ativo', capacity: 1, equipment: ['Otoscópio', 'Ecógrafo'] },
  { id: 'room_3', name: 'Sala de Exames 1',    type: 'sala de exame',       location_id: 'loc_1', status: 'ativo', capacity: 1, equipment: ['Ecógrafo', 'Raio-X'] },
  { id: 'room_4', name: 'Sala Procedimentos A', type: 'sala de procedimento', location_id: 'loc_1', status: 'ativo', capacity: 2, equipment: ['Mesa cirúrgica', 'Autoclave'] },
  { id: 'room_5', name: 'Consultório 201',     type: 'consultório',          location_id: 'loc_2', status: 'ativo', capacity: 1, equipment: ['Otoscópio', 'Balança'] },
  { id: 'room_6', name: 'Consultório 202',     type: 'consultório',          location_id: 'loc_2', status: 'ativo', capacity: 1, equipment: ['Ecógrafo'] },
  { id: 'room_7', name: 'Consultório 301',     type: 'consultório',          location_id: 'loc_4', status: 'ativo', capacity: 1, equipment: ['Otoscópio'] },
];

// ==========================================
// BLOQUEIOS DE AGENDA
// ==========================================
export interface BlockedSlot {
  id: string;
  doctor_name: string;
  branch?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  description?: string;
}

export const initialBlockedSlots: BlockedSlot[] = [
  { id: 'bs_1', doctor_name: 'Dr. Adriano Lima', branch: 'Sede Central', start_date: '2026-07-01', end_date: '2026-07-05', start_time: '08:00', end_time: '12:00', reason: 'Férias', description: 'Férias programadas de verão' },
  { id: 'bs_2', doctor_name: 'Dra. Amanda Silva', branch: 'Filial Ciudad del Este', start_date: '2026-07-10', end_date: '2026-07-10', reason: 'Congresso', description: 'Congresso de Cardiologia em Asunción' },
];

// ==========================================
// LISTA DE ESPERA
// ==========================================
export interface WaitingListEntry {
  id: string;
  patient_id?: string;
  patient_name: string;
  phone?: string;
  specialty?: string;
  doctor_name?: string;
  priority_criteria?: string;
  priority_score: number;
  preferred_days: string[];
  preferred_hours: string[];
  status: string;
}

export const initialWaitingList: WaitingListEntry[] = [
  { id: 'wl_p_1', patient_id: 'pat_3', patient_name: 'Joaquim Bento Pereira', phone: '(21) 99888-7766', specialty: 'Ortopedia', doctor_name: 'Dr. Adriano Lima', priority_criteria: 'Idoso 65+', priority_score: 8, preferred_days: ['Segunda', 'Quarta'], preferred_hours: ['08:00', '09:00'], status: 'ativo' },
  { id: 'wl_p_2', patient_name: 'Roberto Oliveira', phone: '+595 986 111 222', specialty: 'Cardiologia', doctor_name: 'Dra. Amanda Silva', priority_criteria: 'Retorno urgente', priority_score: 7, preferred_days: ['Terça', 'Quinta'], preferred_hours: ['14:00'], status: 'ativo' },
];

// ==========================================
// LEMBRETES WHATSAPP
// ==========================================
export interface WhatsappReminder {
  id: string;
  appointment_id?: string;
  patient_name: string;
  patient_phone: string;
  message_template?: string;
  language: string;
  status: string;
  scheduled_for?: string;
  sent_at?: string;
  response_received?: string;
}

export const initialWhatsappReminders: WhatsappReminder[] = [
  { id: 'wa_1', appointment_id: 'app_1', patient_name: 'Joaquim Bento Pereira', patient_phone: '(21) 99888-7766', message_template: 'Lembrete de consulta', language: 'es', status: 'enviado', scheduled_for: '2026-06-21T20:00:00', sent_at: '2026-06-21T20:00:00' },
  { id: 'wa_2', appointment_id: 'app_2', patient_name: 'Carlos Eduardo Almeida', patient_phone: '(11) 98765-4321', message_template: 'Lembrete de consulta', language: 'es', status: 'enviado', scheduled_for: '2026-06-21T20:00:00', sent_at: '2026-06-21T20:00:00' },
  { id: 'wa_3', patient_name: 'Mariana Rosa Santos', patient_phone: '(11) 91234-5678', message_template: 'Confirmação de consulta', language: 'pt', status: 'pendente', scheduled_for: '2026-06-22T18:00:00' },
];

// ==========================================
// LOGS DE CALL CENTER
// ==========================================
export interface CallCenterLog {
  id: string;
  operator_name: string;
  patient_id?: string;
  patient_name: string;
  patient_phone: string;
  type: string;
  reason: string;
  notes?: string;
  duration_seconds?: number;
  recording_url?: string;
}

export const initialCallCenterLogs: CallCenterLog[] = [
  { id: 'cc_1', operator_name: 'Marcela Ramos', patient_id: 'pat_1', patient_name: 'Carlos Eduardo Almeida', patient_phone: '(11) 98765-4321', type: 'saída', reason: 'Confirmação de horário', notes: 'Paciente confirmou presença para 22/06 às 10:30', duration_seconds: 120 },
  { id: 'cc_2', operator_name: 'Marcela Ramos', patient_name: 'Roberto Oliveira', patient_phone: '+595 986 111 222', type: 'entrada', reason: 'Agendamento de retorno', notes: 'Paciente solicitou retorno com cardiologista', duration_seconds: 180 },
  { id: 'cc_3', operator_name: 'Recepcionista', patient_name: 'Sofia Mendoza', patient_phone: '+595 987 333 444', type: 'entrada', reason: 'Dúvidas sobre valores', notes: 'Informado valores de consulta e exames', duration_seconds: 240 },
];

