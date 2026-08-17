// ============================================================
// CATÁLOGO DE PROCEDIMENTOS - Nomencladores nacionais e por
// entidade financiadora.
//
// Os procedimentos registrados no HCE (aba Procedimentos) DEVEM
// ser codificados conforme:
//   - Nomenclador nacional (SIGTAP/SUS ou CBHPM/AMB), ou
//   - a tabela da entidade financiadora correspondente (fee_schedules).
//
// Fonte dos códigos:
//   - SIGTAP: tabela oficial do SUS (10 dígitos, formato GGSSFFPPPP).
//   - CBHPM: Classificação Brasileira Hierarquizada de Procedimentos
//     Médicos (AMB), 8 dígitos.
// ============================================================

export const PROCEDURE_NOMENCLATURES = ['sigtap', 'cbhpm'] as const;
export type ProcedureNomenclature = (typeof PROCEDURE_NOMENCLATURES)[number];

export const PROCEDURE_CATEGORIES = [
  'Consulta',
  'Procedimento',
  'Laboratório',
  'Imagem',
  'Fisioterapia',
  'Enfermagem',
  'Psicologia',
  'Nutrição',
  'Odontologia',
  'Educação Física',
  'Fonoaudiologia',
  'Terapia Ocupacional',
] as const;
export type ProcedureCategory = (typeof PROCEDURE_CATEGORIES)[number];

export type ProcedureFinanciador =
  | 'IPS'
  | 'Sanidade Militar'
  | 'Sanidade Policial'
  | 'EMP'
  | 'Seguro Privado'
  | 'Corporativo'
  | 'Particular'
  | 'Mercosul'
  | '';

export interface ProcedureCatalogItem {
  code: string;
  name: string;
  category: ProcedureCategory;
  nomenclature: ProcedureNomenclature;
  financingEntity?: string;
}

// ─── NOMENCLADOR NACIONAL: SIGTAP (SUS) ───
// Códigos de 10 dígitos (GGSSFFPPPP) - fonte: Tabela SIGTAP oficial.
export const sigtapCatalog: ProcedureCatalogItem[] = [
  { code: '0101010010', name: 'Atividade educativa / orientação em grupo na atenção primária', category: 'Enfermagem', nomenclature: 'sigtap' },
  { code: '0205010032', name: 'Ecocardiografia transtorácica', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205010040', name: 'Ultrassonografia doppler colorido de vasos (até 3 vasos)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205010059', name: 'Ultrassonografia doppler de fluxo obstétrico', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020038', name: 'Ultrassonografia de abdômen superior (fígado, vesícula, vias biliares)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020046', name: 'Ultrassonografia de abdômen total', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020054', name: 'Ultrassonografia de aparelho urinário', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020089', name: 'Ultrassonografia de globo ocular / órbita (monocular)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020097', name: 'Ultrassonografia mamária bilateral', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020100', name: 'Ultrassonografia de próstata (via abdominal)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020119', name: 'Ultrassonografia de próstata (via transretal)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020127', name: 'Ultrassonografia de tireóide', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020135', name: 'Ultrassonografia de tórax (extracardíaca)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020143', name: 'Ultrassonografia obstétrica', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020151', name: 'Ultrassonografia obstétrica com doppler colorido e pulsado', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020160', name: 'Ultrassonografia pélvica (ginecológica)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0205020186', name: 'Ultrassonografia transvaginal', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0206010044', name: 'Tomografia computadorizada de crânio', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0206010052', name: 'Tomografia computadorizada de pescoço', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0206020031', name: 'Tomografia computadorizada de tórax', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0206030010', name: 'Tomografia computadorizada de pelve / abdômen inferior', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0209010029', name: 'Colonoscopia', category: 'Procedimento', nomenclature: 'sigtap' },
  { code: '0209010037', name: 'Esofagogastroduodenoscopia', category: 'Procedimento', nomenclature: 'sigtap' },
  { code: '0209040017', name: 'Broncoscopia (broncofibroscopia)', category: 'Procedimento', nomenclature: 'sigtap' },
  { code: '0211020010', name: 'Cateterismo cardíaco', category: 'Procedimento', nomenclature: 'sigtap' },
  { code: '0211020036', name: 'Eletrocardiograma', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0211020044', name: 'Monitoramento pelo sistema Holter 24 horas (3 canais)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0211020052', name: 'Monitorização ambulatorial de pressão arterial (M.A.P.A.)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0211020060', name: 'Teste de esforço / teste ergométrico', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0211020079', name: 'Oximetria de pulso (teste do coraçãozinho)', category: 'Imagem', nomenclature: 'sigtap' },
  { code: '0301010021', name: 'Consulta com identificação de casos novos de tuberculose', category: 'Consulta', nomenclature: 'sigtap' },
  { code: '0301010030', name: 'Consulta de profissionais de nível superior na atenção primária (exceto médico)', category: 'Consulta', nomenclature: 'sigtap' },
  { code: '0301010048', name: 'Consulta de profissionais de nível superior na atenção especializada (exceto médico)', category: 'Consulta', nomenclature: 'sigtap' },
  { code: '0301010056', name: 'Consulta médica em saúde do trabalhador', category: 'Consulta', nomenclature: 'sigtap' },
  { code: '0301010064', name: 'Consulta médica em atenção primária', category: 'Consulta', nomenclature: 'sigtap' },
  { code: '0301010072', name: 'Consulta médica em atenção especializada', category: 'Consulta', nomenclature: 'sigtap' },
  { code: '0301010153', name: 'Primeira consulta odontológica programática', category: 'Consulta', nomenclature: 'sigtap' },
  { code: '0301040044', name: 'Terapia individual', category: 'Psicologia', nomenclature: 'sigtap' },
  { code: '0301080178', name: 'Atendimento individual em psicoterapia', category: 'Psicologia', nomenclature: 'sigtap' },
  { code: '0303090014', name: 'Artrocentese de grandes articulações', category: 'Procedimento', nomenclature: 'sigtap' },
  { code: '0401010066', name: 'Excisão e/ou sutura simples de pequenas lesões de pele e anexos', category: 'Procedimento', nomenclature: 'sigtap' },
  { code: '0401010074', name: 'Exérese de tumor de pele e anexos', category: 'Procedimento', nomenclature: 'sigtap' },
];

// ─── NOMENCLADOR NACIONAL: CBHPM (AMB / setor privado) ───
// Códigos de 8 dígitos - fonte: CBHPM (Classificação Brasileira
// Hierarquizada de Procedimentos Médicos).
export const cbhpmCatalog: ProcedureCatalogItem[] = [
  { code: '10101012', name: 'Consulta em consultório (no horário normal ou preestabelecido)', category: 'Consulta', nomenclature: 'cbhpm' },
  { code: '10101020', name: 'Consulta em domicílio', category: 'Consulta', nomenclature: 'cbhpm' },
  { code: '10101039', name: 'Consulta em pronto socorro', category: 'Consulta', nomenclature: 'cbhpm' },
  { code: '10102019', name: 'Visita hospitalar (paciente internado)', category: 'Consulta', nomenclature: 'cbhpm' },
  { code: '10103015', name: 'Atendimento ao recém-nascido em berçário', category: 'Procedimento', nomenclature: 'cbhpm' },
  { code: '10103023', name: 'Atendimento ao recém-nascido em sala de parto (parto normal ou operatório de baixo risco)', category: 'Procedimento', nomenclature: 'cbhpm' },
  { code: '10104011', name: 'Atendimento do intensivista diarista (por dia e por paciente)', category: 'Procedimento', nomenclature: 'cbhpm' },
  { code: '20101015', name: 'Acompanhamento clínico ambulatorial pós-transplante renal', category: 'Consulta', nomenclature: 'cbhpm' },
  { code: '20101074', name: 'Avaliação nutricional (contempla a consulta médica)', category: 'Nutrição', nomenclature: 'cbhpm' },
  { code: '20101104', name: 'Avaliação da composição corporal por bioimpedanciometria', category: 'Nutrição', nomenclature: 'cbhpm' },
  { code: '20102011', name: 'Holter de 24 horas - 2 ou mais canais - analógico', category: 'Imagem', nomenclature: 'cbhpm' },
  { code: '20102020', name: 'Holter de 24 horas - 3 canais - digital', category: 'Imagem', nomenclature: 'cbhpm' },
  { code: '20102038', name: 'Monitorização ambulatorial da pressão arterial - MAPA (24 horas)', category: 'Imagem', nomenclature: 'cbhpm' },
  { code: '20103140', name: 'Bloqueio fenólico, alcoólico ou com toxina botulínica (de pontos motores)', category: 'Procedimento', nomenclature: 'cbhpm' },
  { code: '30201012', name: 'Biópsia de pele', category: 'Procedimento', nomenclature: 'cbhpm' },
  { code: '40901181', name: 'Ultrassonografia de abdome inferior feminino (bexiga, útero, ovário e anexos)', category: 'Imagem', nomenclature: 'cbhpm' },
  { code: '40901246', name: 'Ultrassonografia obstétrica com doppler colorido', category: 'Imagem', nomenclature: 'cbhpm' },
  { code: '40901530', name: 'Ultrassonografia diagnóstica monocular', category: 'Imagem', nomenclature: 'cbhpm' },
  { code: '40901750', name: 'Ultrassonografia de próstata (via abdominal)', category: 'Imagem', nomenclature: 'cbhpm' },
];

export const nationalProcedureCatalog: ProcedureCatalogItem[] = [
  ...sigtapCatalog,
  ...cbhpmCatalog,
];

// ─── VALIDAÇÃO DE FORMATO ───
export function isValidNomenclatureFormat(code: string, nomenclature: ProcedureNomenclature): boolean {
  const normalized = code.replace(/\D/g, '');
  if (nomenclature === 'sigtap') return /^\d{10}$/.test(normalized);
  return /^\d{8}$/.test(normalized);
}

// ─── RESOLUÇÃO POR FINANCIADOR ───
// Todos os financiadores atuais faturam sobre a tabela nacional privada
// (CBHPM) como referência; o nomenclador SIGTAP fica disponível para o
// contexto SUS/nacional público.
export function resolveDefaultNomenclature(financiador: ProcedureFinanciador): ProcedureNomenclature {
  return 'cbhpm';
}

// ─── BUSCAS ───
export function searchProcedureCatalog(
  query: string,
  nomenclature: ProcedureNomenclature
): ProcedureCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = nomenclature === 'sigtap' ? sigtapCatalog : cbhpmCatalog;
  return pool
    .filter((item) => {
      if (item.code.toLowerCase().startsWith(q)) return true;
      return item.name.toLowerCase().includes(q);
    })
    .slice(0, 30);
}

export function findProcedureCatalogItem(
  code: string,
  nomenclature: ProcedureNomenclature
): ProcedureCatalogItem | undefined {
  const normalized = code.replace(/\D/g, '');
  const pool = nomenclature === 'sigtap' ? sigtapCatalog : cbhpmCatalog;
  return pool.find((item) => item.code === normalized);
}

export function findNationalProcedureCode(code: string): ProcedureCatalogItem | undefined {
  const normalized = code.replace(/\D/g, '');
  return nationalProcedureCatalog.find((item) => item.code === normalized);
}