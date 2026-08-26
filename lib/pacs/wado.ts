export interface PacsConfig {
  baseUrl: string;
  auth?: { username: string; password: string };
}

const defaultConfig: PacsConfig = {
  baseUrl: process.env.NEXT_PUBLIC_PACS_URL || 'http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs',
};

export const getPacsConfig = (): PacsConfig => defaultConfig;

/**
 * Gera URL WADO-RS para thumbnail de um estudo.
 * Busca a primeira instância da primeira série e retorna como JPEG.
 */
export function buildStudyThumbnailUrl(studyUid: string): string {
  const { baseUrl } = defaultConfig;
  return `${baseUrl}/studies/${studyUid}/series/instances/1/rendered?accept=image/jpeg`;
}

/**
 * Gera URL WADO-RS para renderizar uma instância específica.
 * studyUid + seriesUid + instanceUid → imagem renderizada.
 */
export function buildInstanceRenderUrl(
  studyUid: string,
  seriesUid?: string,
  instanceUid?: string,
): string {
  const { baseUrl } = defaultConfig;
  if (seriesUid && instanceUid) {
    return `${baseUrl}/studies/${studyUid}/series/${seriesUid}/instances/${instanceUid}/rendered?accept=image/jpeg`;
  }
  if (seriesUid) {
    return `${baseUrl}/studies/${studyUid}/series/${seriesUid}/instances/1/rendered?accept=image/jpeg`;
  }
  return `${baseUrl}/studies/${studyUid}/series/instances/1/rendered?accept=image/jpeg`;
}

/**
 * Gera URL WADO-RS para listar as séries de um estudo.
 */
export function buildStudySeriesUrl(studyUid: string): string {
  const { baseUrl } = defaultConfig;
  return `${baseUrl}/studies/${studyUid}/series`;
}

/**
 * Gera URL WADO-RS para listar as instâncias de uma série.
 */
export function buildSeriesInstancesUrl(studyUid: string, seriesUid: string): string {
  const { baseUrl } = defaultConfig;
  return `${baseUrl}/studies/${studyUid}/series/${seriesUid}/instances`;
}

/**
 * Gera URL WADO-URI (legado) para uma instância específica.
 * Compatível com servidores PACS mais antigos.
 */
export function buildWadoUri(
  studyUid: string,
  seriesUid: string,
  instanceUid: string,
): string {
  const { baseUrl } = defaultConfig;
  const wadoBase = baseUrl.replace('/rs', '/wado');
  return `${wadoBase}?requestType=WADO&studyUID=${studyUid}&seriesUID=${seriesUid}&objectUID=${instanceUid}&contentType=image/jpeg`;
}

/**
 * Resolve a melhor URL de imagem para um estudo.
 * Prioridade: thumbnailUrl existente → WADO-RS via studyInstanceUID → placeholder.
 */
export function resolveStudyImageUrl(
  studyInstanceUID: string,
  thumbnailUrl?: string | null,
): string {
  if (thumbnailUrl && thumbnailUrl.trim()) return thumbnailUrl;
  if (studyInstanceUID) return buildStudyThumbnailUrl(studyInstanceUID);
  return 'https://picsum.photos/seed/xray/600/400';
}
