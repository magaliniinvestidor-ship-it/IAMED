import { z } from 'zod';

const emailSchema = z
  .string()
  .min(1, 'E-mail obrigatório')
  .email('E-mail inválido');

const phoneSchema = z
  .string()
  .min(8, 'Telefone deve ter pelo menos 8 dígitos')
  .max(20, 'Telefone inválido')
  .regex(/^[\d+\-\s()]+$/, 'Telefone contém caracteres inválidos');

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')
  .refine((val) => !isNaN(Date.parse(val)), 'Data inválida');

const nonEmptyString = (fieldName: string, max = 200) =>
  z
    .string()
    .min(1, `${fieldName} é obrigatório`)
    .max(max, `${fieldName} deve ter no máximo ${max} caracteres`);

const optionalString = (max = 500) =>
  z
    .string()
    .max(max, `Texto deve ter no máximo ${max} caracteres`)
    .optional()
    .or(z.literal(''));

export const patientSchema = z.object({
  name: nonEmptyString('Nome', 200),
  email: emailSchema,
  phone: phoneSchema,
  birthdate: dateSchema,
  gender: z.enum(['M', 'F', 'Outro']),
  document_type: z.enum(['CI', 'RG', 'Passaporte', 'Outro']).optional(),
  document_number: optionalString(30),
  place_of_birth: optionalString(100),
  nationality: optionalString(60),
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
    .enum(['IPS', 'Sanidade Militar', 'Sanidade Policial', 'Pré-paga', 'Seguro Privado', 'Particular', ''])
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
    if (!data.birthdate || !data.guardian_name) return true;
    const birth = new Date(data.birthdate);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    if (age < 18 && !data.guardian_name.trim()) {
      return false;
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
  branch: optionalString(100),
  room: optionalString(50),
  resource: optionalString(50),
  type: optionalString(50),
  modality: z.enum(['Presencial', 'Virtual']).optional(),
  insurance: optionalString(120),
  insurance_type: optionalString(60),
  duration_minutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(5, 'Duração mínima: 5 minutos')
    .max(480, 'Duração máxima: 8 horas')
    .optional(),
  booked_via: z.enum(['recepcao', 'portal', 'whatsapp', 'call_center']).optional(),
}).refine(
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

export const passwordChangeSchema = z.object({
  password: nonEmptyString('Senha', 100).min(6, 'Mínimo 6 caracteres'),
  confirmPassword: nonEmptyString('Confirmação', 100),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Senhas não coincidem', path: ['confirmPassword'] }
);

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

export const triageSchema = z.object({
  triageColor: z.enum(['blue', 'green', 'yellow', 'orange', 'red']),
  symptoms: nonEmptyString('Sintomas', 1000),
  preliminaryDiagnosis: optionalString(500),
  vitalSigns: z.object({
    bp: optionalString(20),
    temp: optionalString(10),
    spo2: optionalString(10),
    hr: optionalString(10),
    rr: optionalString(10),
  }).optional(),
});

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

export const patientIdentificationSchema = z.object({
  name: nonEmptyString('Nome', 200),
  birthdate: dateSchema,
  gender: z.enum(['M', 'F', 'Outro'], {
    message: 'Selecione um gênero',
  }),
  document_type: z.enum(['CI', 'RG', 'Passaporte', 'Outro'], {
    message: 'Selecione um tipo de documento',
  }).optional(),
  document_number: optionalString(30),
  place_of_birth: optionalString(100),
  nationality: optionalString(60),
  civil_status: z
    .enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'], {
      message: 'Selecione um estado civil',
    })
    .optional(),
  photo_url: z
    .string()
    .refine((val) => Boolean(val) && val.length > 0 && val !== 'data:,', 'Foto do paciente é obrigatória')
    .optional(),
});

export type PatientIdentificationFormData = z.infer<typeof patientIdentificationSchema>;

export const patientContactAddressSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  address_department: nonEmptyString('Departamento', 60),
  address_city: nonEmptyString('Cidade', 60),
  address_neighborhood: optionalString(100),
  address_street: nonEmptyString('Rua', 150),
  address_number: nonEmptyString('Número', 20),
});

export type PatientContactAddressFormData = z.infer<typeof patientContactAddressSchema>;

export const patientComplementarySchema = z.object({
  blood_type: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não Informado', ''])
    .optional(),
  allergies: optionalString(1000),
  health_insurance_type: z
    .enum(['IPS', 'Sanidade Militar', 'Sanidade Policial', 'Pré-paga', 'Seguro Privado', 'Particular', ''])
    .optional(),
  health_insurance_number: optionalString(50),
  health_insurance_company: optionalString(120),
  employer: optionalString(120),
  preferred_language: z.enum(['es', 'es-AR', 'es-PY', 'gn', 'pt-BR', 'pt-PT', 'en', 'outros', '']).optional(),
});

export type PatientComplementaryFormData = z.infer<typeof patientComplementarySchema>;

export const patientGuardianSchema = z.object({
  guardian_name: optionalString(200),
  guardian_document: optionalString(30),
  guardian_relationship: optionalString(60),
  guardian_phone: phoneSchema.optional().or(z.literal('')),
});

export type PatientGuardianFormData = z.infer<typeof patientGuardianSchema>;

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
