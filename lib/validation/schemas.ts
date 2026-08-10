import { z } from 'zod';
import type { ValidationMessages } from './i18n-schemas';
import {
  getValidationMessages,
  createTriageSchema,
  createClinicPatientIdentificationSchema,
  createClinicPatientContactSchema,
  createClinicPatientComplementarySchema,
  createClinicPatientGuardianSchema,
  createBlockedSlotSchema,
  createEditAppointmentSchema,
  createWaitlistSchema,
  createAllocateWaitlistSchema,
  createNotifyWaitlistSchema,
  createCallLogSchema,
} from './i18n-schemas';

export const createEmailSchema = (m: ValidationMessages) =>
  z.string().min(1, m.email).email(m.emailInvalid);

export const createPhoneSchema = (m: ValidationMessages) =>
  z
    .string()
    .min(8, m.phoneMinLength)
    .max(20, m.phoneInvalid)
    .regex(/^[\d+\-\s()]+$/, m.phoneFormat);

export const createDateSchema = (m: ValidationMessages) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, m.dateFormat)
    .refine((val) => !isNaN(Date.parse(val)), m.dateInvalid);

export const createNonEmptyString = (m: ValidationMessages) =>
  (fieldName: string, max = 200) =>
    z.string().min(1, m.required(fieldName)).max(max, m.maxLength(fieldName, max));

export const createOptionalString = (m: ValidationMessages) =>
  (max = 500) =>
    z.string().max(max, m.maxLength('Texto', max)).optional().or(z.literal(''));

const ptBRMessages = getValidationMessages('pt-BR');

export const emailSchema = createEmailSchema(ptBRMessages);
export const phoneSchema = createPhoneSchema(ptBRMessages);
export const dateSchema = createDateSchema(ptBRMessages);
export const nonEmptyString = createNonEmptyString(ptBRMessages);
export const optionalString = createOptionalString(ptBRMessages);

export const patientSchema = z.object({
  name: nonEmptyString('Nome', 200),
  email: emailSchema,
  phone: phoneSchema,
  birthdate: dateSchema,
  gender: z.enum(['M', 'F', 'Outro']),
  document_type: z.enum(['CI', 'RG', 'Passaporte', 'Outro']).optional(),
  document_number: optionalString(30),
  place_of_birth: optionalString(100),
  nationality: nonEmptyString('Nacionalidade', 60),
  civil_status: z
    .enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'])
    .optional(),
  address_department: optionalString(60),
  address_city: optionalString(60),
  address_neighborhood: optionalString(100),
  address_street: optionalString(150),
  address_number: optionalString(20),
  blood_type: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não Informado', ''])
    .optional(),
  allergies: optionalString(1000),
  health_insurance_type: z
    .enum(['IPS', 'Sanidade Militar', 'Sanidade Policial', 'EMP', 'Seguro Privado', 'Corporativo', 'Particular', 'Mercosul', ''])
    .optional(),
  health_insurance_number: optionalString(50),
  health_insurance_company: optionalString(120),
  employer: optionalString(120),
  guardian_name: optionalString(200),
  guardian_document: optionalString(30),
  guardian_relationship: optionalString(60),
  guardian_phone: phoneSchema.optional().or(z.literal('')),
  preferred_language: z.enum(['es', 'es-AR', 'es-PY', 'gn', 'pt-BR', 'pt-PT', 'en', 'outros', '']).optional(),
  photo_url: z.string().min(1, 'Foto do paciente é obrigatória').optional(),
}).refine(
  (data) => {
    if (!data.birthdate) return true;
    const birth = new Date(data.birthdate);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    return age >= 0 && age <= 130;
  },
  { message: 'Data de nascimento inválida', path: ['birthdate'] }
).refine(
  (data) => {
    if (!data.birthdate) return true;
    const birth = new Date(data.birthdate);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    if (age < 18) {
      return !!data.guardian_name && data.guardian_name.trim().length > 0;
    }
    return true;
  },
  { message: 'Responsável é obrigatório para menores de 18 anos', path: ['guardian_name'] }
);

export type PatientFormData = z.infer<typeof patientSchema>;

export const appointmentSchema = z.object({
  patientId: nonEmptyString('Paciente', 20),
  patientName: nonEmptyString('Nome do Paciente', 200),
  doctorName: nonEmptyString('Médico', 200),
  specialty: nonEmptyString('Especialidade', 100),
  date: dateSchema,
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Hora deve estar no formato HH:MM'),
  insurance_type: z
    .enum(['IPS', 'Sanidade Militar', 'Sanidade Policial', 'EMP', 'Seguro Privado', 'Corporativo', 'Particular', 'Mercosul', ''])
    .refine((val) => val !== '', { message: 'Convênio é obrigatório' }),
  insurance_number: z.string().max(50, 'Número da carteirinha deve ter no máximo 50 caracteres').optional().or(z.literal('')),
  status: z
    .enum([
      'agendado',
      'confirmado',
      'pendente',
      'cancelado',
      'atendido',
      'remarcado',
      'em sala de espera',
      'em atendimento',
      'finalizado',
      'ausente',
    ])
    .optional(),
  branch: nonEmptyString('Sede', 100),
  room: nonEmptyString('Sala', 50),
  resource: optionalString(50),
  type: optionalString(50),
  modality: z.enum(['Presencial', 'Virtual']).optional(),
  insurance: optionalString(120),
  duration_minutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(5, 'Duração mínima: 5 minutos')
    .max(480, 'Duração máxima: 8 horas')
    .optional(),
  booked_via: z.enum(['recepcao', 'portal', 'whatsapp', 'call_center']).optional(),
}).refine(
  (data) => {
    if (data.insurance_type && data.insurance_type !== 'Particular') {
      return !!(data.insurance_number && data.insurance_number.trim().length > 0);
    }
    return true;
  },
  { message: 'Número da carteirinha é obrigatório', path: ['insurance_number'] }
).refine(
  (data) => {
    if (!data.date || !data.time) return true;
    const apptDate = new Date(`${data.date}T${data.time}`);
    return apptDate > new Date();
  },
  { message: 'Não é possível agendar no passado', path: ['time'] }
);

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const professionalSchema = z.object({
  name: nonEmptyString('Nome', 200),
  role: nonEmptyString('Função', 100),
  specialty: nonEmptyString('Especialidade', 100),
  council: z.enum([
    'CRM', 'COREN', 'CREFITO', 'CFP', 'CFN', 'CRO', 'N/A', 'CRESS', 'CRFa', 'CRF',
    'CRBM', 'CREF', 'CRA', 'CREFONO', 'CRTR',
  ]),
  councilNumber: nonEmptyString('Número do Conselho', 30),
  shift: z.enum(['Manhã', 'Tarde', 'Noite', 'Integral', 'Plantão 12h', 'Plantão 24h']),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  admissionDate: dateSchema,
  status: z.enum(['ativo', 'inativo', 'férias']),
});

export type ProfessionalFormData = z.infer<typeof professionalSchema>;

export const insuranceSchema = z.object({
  name: nonEmptyString('Nome', 200),
  type: z.enum([
    'IPS', 'Sanidade Militar', 'Sanidade Policial', 'EMP', 'Seguro Privado',
    'Corporativo', 'Particular', 'Mercosul',
  ]),
  ruc: nonEmptyString('RUC', 20).regex(/^[\d\-]+$/, 'RUC deve conter apenas números e hífens'),
  contact: optionalString(200),
  phone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  copay_rules: optionalString(500),
  coverage_ceiling: z.number().min(0, 'Teto não pode ser negativo').optional(),
  has_webservice: z.boolean().optional(),
  webservice_url: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  requires_authorization: z.boolean().optional(),
  requires_pre_approval: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.has_webservice && !data.webservice_url) {
      return false;
    }
    return true;
  },
  { message: 'URL do Web Service é obrigatória quando habilitado', path: ['webservice_url'] }
);

export type InsuranceFormData = z.infer<typeof insuranceSchema>;

export const prescriptionSchema = z.object({
  patientId: nonEmptyString('Paciente', 20),
  drugName: nonEmptyString('Medicamento', 200),
  activeIngredient: optionalString(200),
  dosage: nonEmptyString('Dosagem', 100),
  frequency: nonEmptyString('Frequência', 100),
  route: nonEmptyString('Via', 50),
  duration: nonEmptyString('Duração', 50),
  quantity: z
    .number()
    .int('Quantidade deve ser inteira')
    .min(1, 'Quantidade mínima: 1')
    .max(999, 'Quantidade máxima: 999'),
  unit: nonEmptyString('Unidade', 20),
  notes: optionalString(1000),
});

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

export const anamneseSchema = z.object({
  patientId: nonEmptyString('Paciente', 20),
  notes: optionalString(2000),
  occupation: optionalString(200),
  smoking: optionalString(200),
  alcohol: optionalString(200),
  diet: optionalString(200),
  sleep: optionalString(200),
  physicalActivity: optionalString(200),
  maritalStatus: optionalString(50),
  allergiesCount: z.number().int('Alergias: deve ser inteiro').min(0).max(50),
  medicationsCount: z.number().int('Medicações: deve ser inteiro').min(0).max(50),
  familyHistoryCount: z.number().int('Histórico familiar: deve ser inteiro').min(0).max(50),
  surgicalHistoryCount: z.number().int('Cirurgias: deve ser inteiro').min(0).max(50),
});

export type AnamneseFormData = z.infer<typeof anamneseSchema>;

export const soapSchema = z.object({
  patientId: nonEmptyString('Paciente', 20),
  subjective: nonEmptyString('Subjetivo (S)', 4000),
  objective: nonEmptyString('Objetivo (O)', 4000),
  assessment: nonEmptyString('Avaliação (A)', 2000),
  plan: nonEmptyString('Plano (P)', 4000),
  notes: optionalString(4000),
});

export type SoapFormData = z.infer<typeof soapSchema>;

export const examRequestSchema = z.object({
  patientId: nonEmptyString('Paciente', 20),
  examName: nonEmptyString('Nome do exame', 200),
  examType: z.enum(['laboratorio', 'imagem', 'anatomia_patologica', 'outro'], {
    message: 'Tipo de exame inválido',
  }),
  urgency: z.enum(['rotina', 'urgente', 'emergencia'], {
    message: 'Urgência inválida',
  }),
  clinicalIndication: optionalString(1000),
});

export type ExamRequestFormData = z.infer<typeof examRequestSchema>;

export const procedureSchema = z.object({
  patientId: nonEmptyString('Paciente', 20),
  procedureCode: optionalString(50),
  procedureName: nonEmptyString('Nome do procedimento', 200),
  procedureCategory: optionalString(100),
  quantity: z
    .number()
    .int('Quantidade deve ser inteira')
    .min(1, 'Quantidade mínima: 1')
    .max(999, 'Quantidade máxima: 999'),
  notes: optionalString(1000),
});

export type ProcedureFormData = z.infer<typeof procedureSchema>;

export const attachmentSchema = z.object({
  patientId: nonEmptyString('Paciente', 20),
  fileName: nonEmptyString('Nome do arquivo', 500),
  fileSizeBytes: z
    .number()
    .int('Tamanho deve ser inteiro')
    .min(1, 'Arquivo vazio')
    .max(50 * 1024 * 1024, 'Arquivo excede 50MB'),
  mimeType: nonEmptyString('Tipo MIME', 100),
  description: optionalString(500),
});

export type AttachmentFormData = z.infer<typeof attachmentSchema>;

export const passwordChangeSchema = z.object({
  password: nonEmptyString('Senha', 100).min(6, 'Mínimo 6 caracteres'),
  confirmPassword: nonEmptyString('Confirmação', 100),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Senhas não coincidem', path: ['confirmPassword'] }
);

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

export const triageSchema = createTriageSchema(ptBRMessages);

export type TriageFormData = z.infer<typeof triageSchema>;

export const dteItemSchema = z.object({
  code: nonEmptyString('Código', 20),
  description: nonEmptyString('Descrição', 300),
  quantity: z.number().int().min(1, 'Qtd mínima: 1').max(9999, 'Qtd máxima: 9999'),
  unit_price: z.number().min(0, 'Preço não pode ser negativo'),
  iva_rate: z.union([z.literal(5), z.literal(10), z.literal(0)]),
});

export const dteSchema = z.object({
  type: z.enum(['Fatura Eletrônica', 'Nota de Crédito', 'Nota de Débito', 'Nota de Remessa', 'Autofatura']),
  patient_name: nonEmptyString('Paciente', 200),
  patient_email: emailSchema.optional().or(z.literal('')),
  patient_phone: phoneSchema.optional().or(z.literal('')),
  ruc: optionalString(20),
  items: z.array(dteItemSchema).min(1, 'Adicione pelo menos um item'),
}).refine(
  (data) => data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0) > 0,
  { message: 'Total deve ser maior que zero', path: ['items'] }
);

export type DteFormData = z.infer<typeof dteSchema>;

export const locationSchema = z.object({
  name: nonEmptyString('Nome da Sede', 200),
  address: nonEmptyString('Endereço', 300),
  city: nonEmptyString('Cidade', 100),
  phone: nonEmptyString('Telefone', 30),
  status: z.enum(['ativo', 'inativo']).optional(),
});

export type LocationFormData = z.infer<typeof locationSchema>;

export const clinicalRoomSchema = z.object({
  name: nonEmptyString('Nome da Sala', 100),
  location_id: nonEmptyString('Sede', 30),
  status: z.enum(['ativo', 'inativo']).optional(),
});

export type ClinicalRoomFormData = z.infer<typeof clinicalRoomSchema>;

export const systemUserSchema = z.object({
  name: nonEmptyString('Nome', 200),
  email: emailSchema.optional().or(z.literal('')),
  ci: optionalString(30),
  systemRole: z.enum([
    'SuperAdmin', 'Administrador', 'Gestor', 'Diretor Clínico', 'Médico',
    'Enfermeiro', 'Recepcionista', 'Financeiro', 'Farmacêutico', 'Visualizador',
    'Auxiliar de Enfermagem', 'Anestesiologista', 'Cirurgião(ã)', 'Terapeuta Ocupacional',
    'Educador Físico', 'Assistente Social', 'Fonoaudiólogo(a)', 'Dentista',
    'Biomédico(a)', 'Técnico(a) em Radiologia', 'Técnico(a) em Farmácia',
    'Técnico(a) de Laboratório', 'Nutricionista', 'Psicólogo(a)', 'Técnico(a) de Enfermagem',
  ]),
  location: optionalString(100),
  status: z.enum(['ativo', 'inativo', 'bloqueado']),
  twoFactorEnabled: z.boolean().optional(),
  twoFactorMethod: z.enum(['totp', 'sms', 'email', 'none']).optional(),
}).refine(
  (data) => {
    if (data.twoFactorEnabled && (data.twoFactorMethod === 'none' || !data.twoFactorMethod)) {
      return false;
    }
    return true;
  },
  { message: 'Selecione um método de 2FA quando ativado', path: ['twoFactorMethod'] }
);

export type SystemUserFormData = z.infer<typeof systemUserSchema>;

export const createPatientIdentificationSchema = (m: ValidationMessages) =>
  z.object({
    name: z.string().min(1, m.required('Nome')).max(200, m.maxLength('Nome', 200)),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, m.dateFormat)
      .refine((val) => !isNaN(Date.parse(val)), m.dateInvalid),
    gender: z.enum(['M', 'F', 'Outro'], { message: m.gender }),
    document_type: z
      .enum(['CI', 'RG', 'Passaporte', 'Outro'], { message: m.documentType })
      .optional(),
    document_number: z.string().min(1, m.required('Documento')).max(30, m.maxLength('Documento', 30)),
    place_of_birth: z.string().min(1, m.required('Local de nascimento')).max(100, m.maxLength('Local de nascimento', 100)),
    nationality: z.string().min(1, m.required('Nacionalidade')).max(60, m.maxLength('Nacionalidade', 60)),
    civil_status: z
      .enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'], {
        message: m.civilStatus,
      })
      .optional(),
    photo_url: z
      .string()
      .refine((val) => Boolean(val) && val.length > 0 && val !== 'data:,', m.photoRequired)
      .optional(),
  });

export const createPatientContactAddressSchema = (m: ValidationMessages) =>
  z.object({
    email: z.string().min(1, m.email).email(m.emailInvalid),
    phone: z
      .string()
      .min(8, m.phoneMinLength)
      .max(20, m.phoneInvalid)
      .regex(/^[\d+\-\s()]+$/, m.phoneFormat),
    address_department: z.string().min(1, m.required('Departamento')).max(60, m.maxLength('Departamento', 60)),
    address_district: z.string().min(1, m.required('Estado')).max(60, m.maxLength('Estado', 60)),
    address_city: z.string().min(1, m.required('Cidade')).max(60, m.maxLength('Cidade', 60)),
    address_neighborhood: z.string().min(1, m.required('Bairro')).max(100, m.maxLength('Bairro', 100)),
    address_street: z.string().min(1, m.required('Rua')).max(150, m.maxLength('Rua', 150)),
    address_number: z.string().min(1, m.required('Número')).max(20, m.maxLength('Número', 20)),
  });

export const createPatientComplementarySchema = (m: ValidationMessages) =>
  z
    .object({
      blood_type: z
        .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não Informado', ''], {
          message: m.bloodType,
        })
        .refine((val) => val !== '', { message: m.bloodType }),
      allergies: z.string().min(1, m.allergiesRequired).max(1000, m.maxLength('Alergias', 1000)),
      health_insurance_type: z
.enum(['IPS', 'Sanidade Militar', 'Sanidade Policial', 'EMP', 'Seguro Privado', 'Corporativo', 'Particular', 'Mercosul', ''], {
      message: m.required('Plano de Saúde'),
    })
        .refine((val) => val !== '', { message: m.required('Plano de Saúde') }),
      health_insurance_number: z.string().max(50, m.maxLength('Número', 50)).optional().or(z.literal('')),
      health_insurance_company: z.string().max(120, m.maxLength('Convênio', 120)).optional().or(z.literal('')),
      employer: z.string().min(1, m.required('Empregador')).max(120, m.maxLength('Empregador', 120)),
      preferred_language: z
        .enum(['es', 'pt-BR', 'pt-PT', 'en', 'es-AR', 'es-PY', 'gn', 'outros', ''], {
          message: m.preferredLanguage,
        })
        .refine((val) => val !== '', { message: m.preferredLanguage }),
    })
    .refine(
      (data) => {
        if (data.health_insurance_type && data.health_insurance_type !== 'Particular') {
          return !!(data.health_insurance_number && data.health_insurance_number.trim().length > 0);
        }
        return true;
      },
      { message: m.required('Número da Apólice'), path: ['health_insurance_number'] }
    );

export const createPatientGuardianSchema = (m: ValidationMessages) =>
  z.object({
    guardian_name: z.string().max(200, m.maxLength('Nome', 200)).optional().or(z.literal('')),
    guardian_document: z.string().max(30, m.maxLength('Documento', 30)).optional().or(z.literal('')),
    guardian_relationship: z.string().max(60, m.maxLength('Parentesco', 60)).optional().or(z.literal('')),
    guardian_phone: z
      .string()
      .max(20, m.phoneInvalid)
      .regex(/^[\d+\-\s()]+$/, m.phoneFormat)
      .optional()
      .or(z.literal('')),
  });

export const createAllPatientSchemas = (m: ValidationMessages) => ({
  identification: createPatientIdentificationSchema(m),
  contactAddress: createPatientContactAddressSchema(m),
  complementary: createPatientComplementarySchema(m),
  guardian: createPatientGuardianSchema(m),
});

export const createAllClinicPatientSchemas = (m: ValidationMessages) => ({
  identification: createClinicPatientIdentificationSchema(m),
  contact: createClinicPatientContactSchema(m),
  complementary: createClinicPatientComplementarySchema(m),
  guardian: createClinicPatientGuardianSchema(m),
});

export type ClinicPatientIdentificationFormData = z.infer<ReturnType<typeof createClinicPatientIdentificationSchema>>;
export type ClinicPatientContactFormData = z.infer<ReturnType<typeof createClinicPatientContactSchema>>;
export type ClinicPatientComplementaryFormData = z.infer<ReturnType<typeof createClinicPatientComplementarySchema>>;
export type ClinicPatientGuardianFormData = z.infer<ReturnType<typeof createClinicPatientGuardianSchema>>;

export const blockedSlotSchema = createBlockedSlotSchema(ptBRMessages);
export type BlockedSlotFormData = z.infer<typeof blockedSlotSchema>;

export const editAppointmentSchema = createEditAppointmentSchema(ptBRMessages);
export type EditAppointmentFormData = z.infer<typeof editAppointmentSchema>;

const defaultMessages = ptBRMessages;
export const patientIdentificationSchema = createPatientIdentificationSchema(defaultMessages);
export const patientContactAddressSchema = createPatientContactAddressSchema(defaultMessages);
export const patientComplementarySchema = createPatientComplementarySchema(defaultMessages);
export const patientGuardianSchema = createPatientGuardianSchema(defaultMessages);

export type PatientIdentificationFormData = z.infer<typeof patientIdentificationSchema>;
export type PatientContactAddressFormData = z.infer<typeof patientContactAddressSchema>;
export type PatientComplementaryFormData = z.infer<typeof patientComplementarySchema>;
export type PatientGuardianFormData = z.infer<typeof patientGuardianSchema>;

export const clinicPatientSchema = z.object({
  name: nonEmptyString('Nome', 200),
  document_type: z.enum(['CI', 'RG', 'Passaporte', 'DNI / Outro']).optional(),
  document_number: nonEmptyString('Documento', 30),
  birth_date: dateSchema,
  gender: z.enum(['Masculino', 'Feminino', 'Outro']),
  nationality: nonEmptyString('Nacionalidade', 60),
  civil_status: z
    .enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'])
    .optional(),
  phone: createPhoneSchema(ptBRMessages),
  email: emailSchema,
  address_department: optionalString(60),
  address_district: optionalString(60),
  address_city: optionalString(60),
  address_neighborhood: optionalString(100),
  address_street: optionalString(150),
  address_number: optionalString(20),
  country: optionalString(60),
  insurance_type: optionalString(60),
  preferred_language: optionalString(30),
  allergies: optionalString(1000),
  responsible_name: optionalString(200),
  responsible_document_number: optionalString(30),
  responsible_phone: optionalString(20),
  responsible_relationship: optionalString(60),
});
export type ClinicPatientFormData = z.infer<typeof clinicPatientSchema>;

export const pharmacyItemSchema = z.object({
  name: nonEmptyString('Nome', 200),
  category: z.enum([
    'venda_livre', 'sob_receita', 'controlado', 'entorpecente',
    'psicotropico', 'uso_hospitalar', 'biologico', 'insumo',
    'descartavel', 'material',
  ]),
  presentation: optionalString(200),
  manufacturer: optionalString(200),
  minQuantity: z.number().int('Mínimo deve ser inteiro').min(0, 'Mínimo não pode ser negativo'),
  unitCost: z.number().min(0, 'Custo não pode ser negativo'),
  unitPrice: z.number().min(0, 'Preço não pode ser negativo'),
}).refine(
  (data) => data.unitPrice >= data.unitCost,
  { message: 'Preço de venda deve ser maior ou igual ao custo', path: ['unitPrice'] }
);

export type PharmacyItemFormData = z.infer<typeof pharmacyItemSchema>;

export const ssoProviderSchema = z.object({
  name: nonEmptyString('Nome do Provedor', 200),
  type: z.enum(['saml', 'oauth2', 'oidc']),
  issuerUrl: nonEmptyString('Issuer URL', 500).url('Issuer URL inválida'),
  clientId: nonEmptyString('Client ID', 200),
  clientSecret: optionalString(500),
  metadataUrl: optionalString(500),
  certificateFingerprint: optionalString(500),
  defaultRole: z.string().min(1, 'Função padrão obrigatória'),
  enabled: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type SsoProviderFormData = z.infer<typeof ssoProviderSchema>;

export const stockEntrySchema = z.object({
  itemId: nonEmptyString('Item', 200),
  lotNumber: nonEmptyString('Nº do Lote', 200),
  quantity: z.number().int('Quantidade deve ser inteira').min(1, 'Quantidade deve ser maior que zero'),
  costPerUnit: z.number().min(0, 'Custo não pode ser negativo').optional(),
  serialNumber: optionalString(200),
  dteEntryNumber: optionalString(100),
  expiryDate: createDateSchema(ptBRMessages).optional().or(z.literal('')),
  manufactureDate: createDateSchema(ptBRMessages).optional().or(z.literal('')),
});

export type StockEntryFormData = z.infer<typeof stockEntrySchema>;

export const stockExitSchema = z.object({
  itemId: nonEmptyString('Item', 200),
  lotId: nonEmptyString('Lote', 200),
  quantity: z.number().int('Quantidade deve ser um inteiro').min(1, 'Quantidade deve ser maior que zero'),
  patientName: optionalString(200),
  procedureName: optionalString(200),
  sector: optionalString(200),
  room: optionalString(200),
  doctorName: optionalString(200),
  notes: optionalString(500),
});

export type StockExitFormData = z.infer<typeof stockExitSchema>;

export const adverseEventSchema = z.object({
  patientName: nonEmptyString('Paciente', 200),
  medicationName: nonEmptyString('Medicamento', 200),
  adverseReaction: nonEmptyString('Reação', 200),
  itemId: optionalString(200),
  lotId: optionalString(200),
  severity: z.string().min(1, 'Severidade obrigatória'),
  outcome: optionalString(100),
  startDate: createDateSchema(ptBRMessages).optional().or(z.literal('')),
  description: optionalString(2000),
  notifier: optionalString(200),
});

export type AdverseEventFormData = z.infer<typeof adverseEventSchema>;

export const qualityDeviationSchema = z.object({
  itemId: nonEmptyString('Item', 200),
  lotId: nonEmptyString('Lote', 200),
  deviationType: z.string().min(1, 'Tipo de desvio obrigatório'),
  severity: z.string().min(1, 'Severidade obrigatória'),
  affectedQuantity: z.number().int('Quantidade deve ser inteiro').min(0, 'Quantidade não pode ser negativa').optional(),
  description: nonEmptyString('Descrição', 2000),
  reporter: optionalString(200),
});

export type QualityDeviationFormData = z.infer<typeof qualityDeviationSchema>;

export const empresaSchema = z.object({
  nome: nonEmptyString('Nome', 200),
  ruc: nonEmptyString('RUC', 50),
  nomeFantasia: optionalString(200),
  endereco: optionalString(300),
  cidade: optionalString(100),
  departamento: optionalString(100),
  telefone: optionalString(30),
  email: optionalString(200),
  atividadeEconomica: optionalString(200),
  setor: z.string().min(1, 'Setor obrigatório'),
  porte: z.string().min(1, 'Porte obrigatório'),
  nroFuncionarios: z.number().int('Funcionários deve ser inteiro').min(0, 'Funcionários não pode ser negativo'),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;

export const trabalhadorSchema = z.object({
  nome: nonEmptyString('Nome', 200),
  ci: nonEmptyString('CI', 20),
  dataNascimento: createDateSchema(ptBRMessages).optional().or(z.literal('')),
  genero: z.string().min(1, 'Gênero obrigatório'),
  nacionalidade: optionalString(100),
  funcao: optionalString(200),
  empresaId: nonEmptyString('Empresa', 200),
  telefone: optionalString(30),
  email: optionalString(200),
  dataAdmissao: createDateSchema(ptBRMessages).optional().or(z.literal('')),
});

export type TrabalhadorFormData = z.infer<typeof trabalhadorSchema>;

export const exameOcupacionalSchema = z.object({
  trabalhadorId: nonEmptyString('Trabalhador', 200),
  empresaId: nonEmptyString('Empresa', 200),
  examesSelecionados: z.array(z.string()).min(1, 'Selecione ao menos um exame'),
});

export type ExameOcupacionalFormData = z.infer<typeof exameOcupacionalSchema>;

export const campaignSchema = z.object({
  nome: nonEmptyString('Nome', 200),
  tipo: z.string().min(1, 'Tipo obrigatório'),
  template: optionalString(200),
  segmentoAlvo: optionalString(200),
  mensagem: nonEmptyString('Mensagem', 2000),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;

export const leadSchema = z.object({
  nome: nonEmptyString('Nome', 200),
  email: optionalString(200),
  telefone: optionalString(30),
  origem: z.string().min(1, 'Origem obrigatória'),
  interesse: optionalString(200),
  observacoes: optionalString(500),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export const opportunitySchema = z.object({
  pacienteNome: nonEmptyString('Paciente', 200),
  pacienteTelefone: optionalString(30),
  tipo: z.string().min(1, 'Tipo obrigatório'),
  descricao: nonEmptyString('Descrição', 500),
  valorEstimado: z.number().min(0, 'Valor estimado não pode ser negativo'),
  probabilidade: z.number().int('Probabilidade deve ser inteiro').min(0).max(100, 'Probabilidade entre 0 e 100'),
  responsavel: optionalString(200),
});

export type OpportunityFormData = z.infer<typeof opportunitySchema>;

export const surgerySchema = z.object({
  patientName: nonEmptyString('Paciente', 200),
  surgeon: nonEmptyString('Cirurgião', 200),
  room: optionalString(100),
  procedureType: nonEmptyString('Tipo de Procedimento', 200),
  estimatedDuration: z.number().int('Duração deve ser inteiro').min(1, 'Duração deve ser maior que zero'),
  scheduledDate: createDateSchema(ptBRMessages).min(1, 'Data obrigatória'),
  scheduledTime: optionalString(10),
  preOpDiagnosis: optionalString(500),
  notes: optionalString(1000),
  anesthesiologist: optionalString(200),
  instrumentator: optionalString(200),
  circulator: optionalString(200),
  assistants: optionalString(500),
});

export type SurgeryFormData = z.infer<typeof surgerySchema>;

export const admissionSchema = z.object({
  patientName: nonEmptyString('Paciente', 200),
  responsibleDoctor: nonEmptyString('Médico Responsável', 200),
  bedId: nonEmptyString('Leito', 200),
  reason: optionalString(500),
  initialDiagnosis: optionalString(500),
  initialCid10: optionalString(20),
  coverageType: z.string().min(1, 'Cobertura obrigatória'),
  coverageAuthorization: optionalString(100),
});

export type AdmissionFormData = z.infer<typeof admissionSchema>;

export const transferBedSchema = z.object({
  bedToId: nonEmptyString('Leito de Destino', 200),
  reason: nonEmptyString('Motivo', 500),
  notes: optionalString(500),
});

export type TransferBedFormData = z.infer<typeof transferBedSchema>;

export const evolutionSchema = z.object({
  subjective: optionalString(2000),
  objective: optionalString(2000),
  assessment: optionalString(2000),
  plan: optionalString(2000),
});

export type EvolutionFormData = z.infer<typeof evolutionSchema>;

export const nursingSheetSchema = z.object({
  intake: z.number().min(0, 'Ingesta não pode ser negativa'),
  output: z.number().min(0, 'Perda não pode ser negativa'),
  observations: optionalString(2000),
});

export type NursingSheetFormData = z.infer<typeof nursingSheetSchema>;

export const portalRegisterSchema = z.object({
  name: nonEmptyString('Nome', 200),
  ci: nonEmptyString('Documento', 30),
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(4, 'A senha deve ter pelo menos 4 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a senha'),
  birthdate: dateSchema,
  gender: z.string().min(1, 'Gênero obrigatório').optional().or(z.literal('')),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export type PortalRegisterFormData = z.infer<typeof portalRegisterSchema>;

export const portalBookingSchema = z.object({
  specialty: nonEmptyString('Especialidade', 100),
  doctorId: optionalString(100),
  doctorName: optionalString(200),
  date: createDateSchema(ptBRMessages).min(1, 'Data obrigatória'),
  time: nonEmptyString('Horário', 10),
  modality: z.string().min(1, 'Modalidade obrigatória'),
});

export type PortalBookingFormData = z.infer<typeof portalBookingSchema>;

export const portalTelemedicineSchema = z.object({
  specialty: nonEmptyString('Especialidade', 100),
  date: createDateSchema(ptBRMessages).min(1, 'Data obrigatória'),
  time: nonEmptyString('Horário', 10),
  notes: optionalString(500),
});

export type PortalTelemedicineFormData = z.infer<typeof portalTelemedicineSchema>;

export const portalPaymentSchema = z.object({
  amount: z.number().min(1, 'Valor deve ser maior que zero'),
  method: z.string().min(1, 'Método de pagamento obrigatório'),
});

export type PortalPaymentFormData = z.infer<typeof portalPaymentSchema>;

export const financialPostingSchema = z.object({
  description: nonEmptyString('Descrição', 200),
  type: z.enum(['receita', 'despesa']),
  category: nonEmptyString('Categoria', 100),
  amount: z.number().min(1, 'Valor deve ser maior que zero'),
});

export type FinancialPostingFormData = z.infer<typeof financialPostingSchema>;

export const financeStockItemSchema = z.object({
  name: nonEmptyString('Nome', 200),
  category: nonEmptyString('Categoria', 100),
  quantity: z.number().int('Quantidade deve ser inteiro').min(0, 'Quantidade não pode ser negativa'),
  unit: nonEmptyString('Unidade', 30),
});

export type FinanceStockItemFormData = z.infer<typeof financeStockItemSchema>;

export const waitlistSchema = createWaitlistSchema(ptBRMessages);
export const allocateWaitlistSchema = createAllocateWaitlistSchema(ptBRMessages);
export const notifyWaitlistSchema = createNotifyWaitlistSchema(ptBRMessages);

export type WaitlistFormData = z.infer<typeof waitlistSchema>;
export type AllocateWaitlistFormData = z.infer<typeof allocateWaitlistSchema>;
export type NotifyWaitlistFormData = z.infer<typeof notifyWaitlistSchema>;

export const callLogSchema = createCallLogSchema(ptBRMessages);
export type CallLogFormData = z.infer<typeof callLogSchema>;
