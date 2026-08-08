import { z } from 'zod';

export type Locale = 'pt-BR' | 'pt-PT' | 'en' | 'es' | 'es-AR' | 'es-PY';

export interface ValidationMessages {
  required: (field: string) => string;
  email: string;
  emailInvalid: string;
  phoneMinLength: string;
  phoneInvalid: string;
  phoneFormat: string;
  dateFormat: string;
  dateInvalid: string;
  maxLength: (field: string, max: number) => string;
  gender: string;
  documentType: string;
  civilStatus: string;
  photoRequired: string;
  bloodType: string;
  preferredLanguage: string;
  allergiesRequired: string;
  rucFormat: string;
  urlInvalid: string;
}

export function getValidationMessages(locale: Locale): ValidationMessages {
  const messages: Record<Locale, Partial<ValidationMessages>> = {
    'pt-BR': {
      required: (f) => `${f} é obrigatório`,
      email: 'E-mail obrigatório',
      emailInvalid: 'E-mail inválido',
      phoneMinLength: 'Telefone deve ter pelo menos 8 dígitos',
      phoneInvalid: 'Telefone inválido',
      phoneFormat: 'Telefone contém caracteres inválidos',
      dateFormat: 'Data deve estar no formato AAAA-MM-DD',
      dateInvalid: 'Data inválida',
      maxLength: (f, max) => `${f} deve ter no máximo ${max} caracteres`,
      gender: 'Selecione um gênero',
      documentType: 'Selecione um tipo de documento',
      civilStatus: 'Selecione um estado civil',
      photoRequired: 'Foto do paciente é obrigatória',
      bloodType: 'Selecione o tipo sanguíneo',
      preferredLanguage: 'Selecione o idioma preferido',
      allergiesRequired: 'Informe alergias / histórico clínico',
      rucFormat: 'RUC deve conter apenas números e hífens',
      urlInvalid: 'URL inválida',
    },
    'en': {
      required: (f) => `${f} is required`,
      email: 'Email required',
      emailInvalid: 'Invalid email',
      phoneMinLength: 'Phone must have at least 8 digits',
      phoneInvalid: 'Invalid phone',
      phoneFormat: 'Phone contains invalid characters',
      dateFormat: 'Date must be in YYYY-MM-DD format',
      dateInvalid: 'Invalid date',
      maxLength: (f, max) => `${f} must have at most ${max} characters`,
      gender: 'Select a gender',
      documentType: 'Select a document type',
      civilStatus: 'Select a marital status',
      photoRequired: 'Patient photo is required',
      bloodType: 'Select blood type',
      preferredLanguage: 'Select preferred language',
      allergiesRequired: 'Provide allergies / clinical history',
      rucFormat: 'RUC must contain only numbers and hyphens',
      urlInvalid: 'Invalid URL',
    },
    'es': {
      required: (f) => `${f} es obligatorio`,
      email: 'Correo obligatorio',
      emailInvalid: 'Correo inválido',
      phoneMinLength: 'Teléfono debe tener al menos 8 dígitos',
      phoneInvalid: 'Teléfono inválido',
      phoneFormat: 'Teléfono contiene caracteres inválidos',
      dateFormat: 'Fecha debe estar en formato AAAA-MM-DD',
      dateInvalid: 'Fecha inválida',
      maxLength: (f, max) => `${f} debe tener máximo ${max} caracteres`,
      gender: 'Seleccione un género',
      documentType: 'Seleccione un tipo de documento',
      civilStatus: 'Seleccione un estado civil',
      photoRequired: 'Foto del paciente es obligatoria',
      bloodType: 'Seleccione el tipo de sangre',
      preferredLanguage: 'Seleccione el idioma preferido',
      allergiesRequired: 'Indique alergias / historial clínico',
      rucFormat: 'RUC debe contener solo números y guiones',
      urlInvalid: 'URL inválida',
    },
    'pt-PT': {
      required: (f) => `${f} é obrigatório`,
      email: 'E-mail obrigatório',
      emailInvalid: 'E-mail inválido',
      phoneMinLength: 'Telefone deve ter pelo menos 8 dígitos',
      phoneInvalid: 'Telefone inválido',
      phoneFormat: 'Telefone contém caracteres inválidos',
      dateFormat: 'Data deve estar no formato AAAA-MM-DD',
      dateInvalid: 'Data inválida',
      maxLength: (f, max) => `${f} deve ter no máximo ${max} caracteres`,
      gender: 'Selecione um género',
      documentType: 'Selecione um tipo de documento',
      civilStatus: 'Selecione um estado civil',
      photoRequired: 'Foto do paciente é obrigatória',
      bloodType: 'Selecione o tipo sanguíneo',
      preferredLanguage: 'Selecione o idioma preferido',
      allergiesRequired: 'Indique alergias / histórico clínico',
      rucFormat: 'RUC deve conter apenas números e hífens',
      urlInvalid: 'URL inválida',
    },
    'es-AR': {
      required: (f) => `${f} es obligatorio`,
      email: 'Correo obligatorio',
      emailInvalid: 'Correo inválido',
      phoneMinLength: 'Teléfono debe tener al menos 8 dígitos',
      phoneInvalid: 'Teléfono inválido',
      phoneFormat: 'Teléfono contiene caracteres inválidos',
      dateFormat: 'Fecha debe estar en formato AAAA-MM-DD',
      dateInvalid: 'Fecha inválida',
      maxLength: (f, max) => `${f} debe tener máximo ${max} caracteres`,
      gender: 'Seleccione un género',
      documentType: 'Seleccione un tipo de documento',
      civilStatus: 'Seleccione un estado civil',
      photoRequired: 'Foto del paciente es obligatoria',
      bloodType: 'Seleccione el grupo de sangre',
      preferredLanguage: 'Seleccione el idioma preferido',
      allergiesRequired: 'Indique alergias / historial clínico',
      rucFormat: 'RUC debe contener solo números y guiones',
      urlInvalid: 'URL inválida',
    },
    'es-PY': {
      required: (f) => `${f} es obligatorio`,
      email: 'Correo obligatorio',
      emailInvalid: 'Correo inválido',
      phoneMinLength: 'Teléfono debe tener al menos 8 dígitos',
      phoneInvalid: 'Teléfono inválido',
      phoneFormat: 'Teléfono contiene caracteres inválidos',
      dateFormat: 'Fecha debe estar en formato AAAA-MM-DD',
      dateInvalid: 'Fecha inválida',
      maxLength: (f, max) => `${f} debe tener máximo ${max} caracteres`,
      gender: 'Seleccione un género',
      documentType: 'Seleccione un tipo de documento',
      civilStatus: 'Seleccione un estado civil',
      photoRequired: 'Foto del paciente es obligatoria',
      bloodType: 'Seleccione el grupo de sangre',
      preferredLanguage: 'Seleccione el idioma preferido',
      allergiesRequired: 'Indique alergias / historial clínico',
      rucFormat: 'RUC debe contener solo números y guiones',
      urlInvalid: 'URL inválida',
    },
  };

  return messages[locale] as ValidationMessages;
}

export function createPatientIdentificationSchema(m: ValidationMessages) {
  return z.object({
    name: z.string().min(1, m.required('Nome')).max(200, m.maxLength('Nome', 200)),
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, m.dateFormat).refine((val) => !isNaN(Date.parse(val)), m.dateInvalid),
    gender: z.enum(['M', 'F', 'Outro'], { message: m.gender }),
    document_type: z.enum(['CI', 'RG', 'Passaporte', 'Outro'], { message: m.documentType }).optional(),
    document_number: z.string().min(1, m.required('Documento')).max(30, m.maxLength('Documento', 30)),
    place_of_birth: z.string().min(1, m.required('Local de nascimento')).max(100, m.maxLength('Local de nascimento', 100)),
    nationality: z.string().min(1, m.required('Nacionalidade')).max(60, m.maxLength('Nacionalidade', 60)),
    civil_status: z
      .enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'], { message: m.civilStatus })
      .optional(),
    photo_url: z
      .string()
      .refine((val) => Boolean(val) && val.length > 0 && val !== 'data:,', m.photoRequired)
      .optional(),
  });
}

export function createClinicPatientIdentificationSchema(m: ValidationMessages) {
  return z.object({
    name: z.string().min(1, m.required('Nome')).max(200, m.maxLength('Nome', 200)),
    document_type: z
      .enum(['CI', 'RG', 'Passaporte', 'DNI / Outro'], { message: m.documentType })
      .optional(),
    document_number: z.string().min(1, m.required('Documento')).max(30, m.maxLength('Documento', 30)),
    birth_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, m.dateFormat)
      .refine((val) => !isNaN(Date.parse(val)), m.dateInvalid),
    gender: z.enum(['Masculino', 'Feminino', 'Outro'], { message: m.gender }),
    nationality: z.string().min(1, m.required('Nacionalidade')).max(60, m.maxLength('Nacionalidade', 60)),
    civil_status: z.enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'], { message: m.civilStatus }),
    photo_url: z
      .string()
      .refine((val) => Boolean(val) && val.length > 0 && val !== 'data:,', m.photoRequired),
  });
}

export function createClinicPatientContactSchema(m: ValidationMessages) {
  return z.object({
    phone: z
      .string()
      .min(8, m.phoneMinLength)
      .max(20, m.phoneInvalid)
      .regex(/^[\d+\-\s()]+$/, m.phoneFormat),
    email: z.string().min(1, m.email).email(m.emailInvalid),
    address_department: z.string().min(1, m.required('Departamento')).max(60, m.maxLength('Departamento', 60)),
    address_district: z.string().min(1, m.required('Estado')).max(60, m.maxLength('Estado', 60)),
    address_city: z.string().min(1, m.required('Cidade')).max(60, m.maxLength('Cidade', 60)),
    address_neighborhood: z.string().min(1, m.required('Bairro')).max(100, m.maxLength('Bairro', 100)),
    address_street: z.string().min(1, m.required('Rua')).max(150, m.maxLength('Rua', 150)),
    address_number: z.string().min(1, m.required('Número')).max(20, m.maxLength('Número', 20)),
  });
}

export function createClinicPatientComplementarySchema(m: ValidationMessages) {
  return z
    .object({
      insurance_type: z
        .enum(['IPS', 'Sanidade Militar', 'Sanidade Policial', 'Pré-paga', 'Seguro Privado', 'Particular', ''], {
          message: m.required('Convênio'),
        })
        .refine((val) => val !== '', { message: m.required('Convênio') }),
      insurance_number: z.string().max(50, m.maxLength('Número', 50)).optional().or(z.literal('')),
      preferred_language: z
        .enum(['pt-BR', 'pt-PT', 'es-AR', 'es-PY', 'es', 'en', 'outros', ''], {
          message: m.preferredLanguage,
        })
        .refine((val) => val !== '', { message: m.preferredLanguage }),
      allergies: z.string().min(1, m.allergiesRequired).max(1000, m.maxLength('Alergias', 1000)),
    })
    .refine(
      (data) => {
        if (data.insurance_type && data.insurance_type !== 'Particular') {
          return !!(data.insurance_number && data.insurance_number.trim().length > 0);
        }
        return true;
      },
      { message: m.required('Número da Apólice'), path: ['insurance_number'] }
    );
}

export function createClinicPatientGuardianSchema(m: ValidationMessages) {
  return z.object({
    responsible_name: z.string().max(200, m.maxLength('Nome', 200)).optional().or(z.literal('')),
    responsible_document_type: z.string().optional().or(z.literal('')),
    responsible_document_number: z.string().max(30, m.maxLength('Documento', 30)).optional().or(z.literal('')),
    responsible_phone: z
      .string()
      .max(20, m.phoneInvalid)
      .regex(/^[\d+\-\s()]+$/, m.phoneFormat)
      .optional()
      .or(z.literal('')),
    responsible_relationship: z.string().max(60, m.maxLength('Parentesco', 60)).optional().or(z.literal('')),
  });
}

export function createPatientContactAddressSchema(m: ValidationMessages) {
  return z.object({
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
}

export function createPatientComplementarySchema(m: ValidationMessages) {
  return z
    .object({
      blood_type: z
        .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não Informado', ''], {
          message: m.bloodType,
        })
        .refine((val) => val !== '', { message: m.bloodType }),
      allergies: z.string().min(1, m.allergiesRequired).max(1000, m.maxLength('Alergias', 1000)),
      health_insurance_type: z
        .enum(['IPS', 'Sanidade Militar', 'Sanidade Policial', 'Pré-paga', 'Seguro Privado', 'Particular', ''], {
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
}

export function createTriageSchema(m: ValidationMessages) {
  return z.object({
    reason: z.string().min(1, m.required('Motivo da consulta')).max(2000, m.maxLength('Motivo da consulta', 2000)),
    weight: z.string().min(1, m.required('Peso')).max(10, m.maxLength('Peso', 10)),
    height: z.string().min(1, m.required('Altura')).max(10, m.maxLength('Altura', 10)),
    bp: z.string().min(1, m.required('PA')).max(20, m.maxLength('PA', 20)),
    temp: z.string().min(1, m.required('Temperatura')).max(10, m.maxLength('Temperatura', 10)),
    spo2: z.string().min(1, m.required('SpO2')).max(10, m.maxLength('SpO2', 10)),
    hr: z.string().min(1, m.required('FC')).max(10, m.maxLength('FC', 10)),
    rr: z.string().min(1, m.required('FR')).max(10, m.maxLength('FR', 10)),
  });
}

export function createMedicalConsultationSchema(m: ValidationMessages) {
  return z.object({
    diagnosis: z.string().min(1, m.required('Diagnóstico')).max(2000, m.maxLength('Diagnóstico', 2000)),
    cid10: z.string().max(20, m.maxLength('CID-10', 20)).optional().or(z.literal('')),
    prescriptions: z.string().min(1, m.required('Prescrição/Receita')).max(5000, m.maxLength('Prescrição/Receita', 5000)),
    notes: z.string().max(2000, m.maxLength('Observações', 2000)).optional().or(z.literal('')),
  });
}

export function createMedicalConsultationFinalizeSchema(m: ValidationMessages) {
  return z.object({
    diagnosis: z.string().min(1, m.required('Diagnóstico')).max(2000, m.maxLength('Diagnóstico', 2000)),
    cid10: z.string().min(1, m.required('CID-10')).max(20, m.maxLength('CID-10', 20)),
    prescriptions: z.string().min(1, m.required('Prescrição/Receita')).max(5000, m.maxLength('Prescrição/Receita', 5000)),
    notes: z.string().min(1, m.required('Observações')).max(2000, m.maxLength('Observações', 2000)),
  });
}

export function createPatientGuardianSchema(m: ValidationMessages) {
  return z.object({
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
}
