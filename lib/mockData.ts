export interface ClinicalHistoryEntry {
  id: string;
  date: string;
  type: string;
  diagnosis: string;
  cid10: string;
  prescriptions: string[];
  notes: string;
  doctor: string;
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
  status: 'confirmado' | 'pendente' | 'cancelado' | 'atendido';
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
    color: "bg-teal-500"
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
    color: "bg-indigo-500"
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
    color: "bg-rose-500"
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
    color: "bg-sky-500"
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
    color: "bg-violet-500"
  }
];

