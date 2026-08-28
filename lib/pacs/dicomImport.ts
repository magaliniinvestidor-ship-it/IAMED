'use client';

import dicomParser, { type DataSet } from 'dicom-parser';

// ── Utilidades de preenchimento (metadata) ──
function pn(s?: string): string {
  return (s || '').split('^').filter(Boolean).join(' ').trim() || '';
}

function firstNumber(s?: string): number | undefined {
  if (!s) return undefined;
  const parts = s
    .split('\\')
    .map((x) => parseFloat(x.trim()))
    .filter((n) => !Number.isNaN(n));
  return parts.length ? parts[0] : undefined;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// Transfer syntaxes suportadas (não comprimidas — pixel data legível no browser).
const UNCOMPRESSED_TRANSFER_SYNTAXES = new Set([
  '1.2.840.10008.1.2',   // Implicit VR Little Endian
  '1.2.840.10008.1.2.1', // Explicit VR Little Endian
]);

/** Traduz modalidades DICOM comuns para o conjunto aceito pelo `dicom_studies`. */
export function mapDicomModality(code?: string): 'RX' | 'TC' | 'RM' | 'US' | 'MG' | 'PET' | 'XA' {
  const c = (code || '').toUpperCase();
  const map: Record<string, 'RX' | 'TC' | 'RM' | 'US' | 'MG' | 'PET' | 'XA'> = {
    CR: 'RX', DX: 'RX', RF: 'RX', RX: 'RX',
    CT: 'TC', TC: 'TC',
    MR: 'RM', RM: 'RM',
    US: 'US',
    MG: 'MG',
    PT: 'PET', PET: 'PET',
    XA: 'XA',
  };
  return map[c] || 'US';
}

// ── Tipos ──

export interface ParsedDicomStudy {
  studyInstanceUid: string;
  seriesInstanceUid: string;
  sopInstanceUid: string;
  accessionNumber: string;
  patientId: string;
  patientName: string;
  modality: string;
  studyDescription: string;
  bodyPartExamined: string;
  referringPhysician: string;
  stationName: string;
  institutionName: string;
  manufacturer: string;
  studyDate?: string;
  studyTime?: string;
  seriesNumber?: number;
  instanceNumber?: number;
  numberOfFrames?: number;
  seriesCount?: number;
  instanceCount?: number;
  transferSyntaxUid: string;
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  highBit?: number;
  pixelRepresentation?: number;
  samplesPerPixel?: number;
  photometricInterpretation?: string;
  windowCenter?: number;
  windowWidth?: number;
  rescaleSlope?: number;
  rescaleIntercept?: number;
  dataSet: DataSet;
}

/**
 * Interpreta um arquivo DICOM (Part 10) e extrai os tags necessários
 * para gravar uma linha em `dicom_studies`.
 */
export function parseDicomFile(buffer: ArrayBuffer): ParsedDicomStudy {
  const dataSet = dicomParser.parseDicom(new Uint8Array(buffer));
  return {
    studyInstanceUid: dataSet.string('x0020000d') || '',
    seriesInstanceUid: dataSet.string('x0020000e') || '',
    sopInstanceUid: dataSet.string('x00080018') || '',
    accessionNumber: dataSet.string('x00080050') || '',
    patientId: dataSet.string('x00100020') || '',
    patientName: pn(dataSet.string('x00100010')),
    modality: dataSet.string('x00080060') || '',
    studyDescription: dataSet.string('x00081030') || '',
    bodyPartExamined: dataSet.string('x00180015') || '',
    referringPhysician: pn(dataSet.string('x00080090')),
    stationName: dataSet.string('x00081010') || '',
    institutionName: dataSet.string('x00080080') || '',
    manufacturer: dataSet.string('x00080070') || '',
    studyDate: dataSet.string('x00080020'),
    studyTime: dataSet.string('x00080030'),
    seriesNumber: dataSet.intString('x00200011'),
    instanceNumber: dataSet.intString('x00200013'),
    numberOfFrames: dataSet.intString('x00280008'),
    seriesCount: dataSet.intString('x00201206'),
    instanceCount: dataSet.intString('x00201208'),
    transferSyntaxUid: dataSet.string('x00020010') || '',
    rows: dataSet.uint16('x00280010'),
    columns: dataSet.uint16('x00280011'),
    bitsAllocated: dataSet.uint16('x00280100'),
    bitsStored: dataSet.uint16('x00280101'),
    highBit: dataSet.uint16('x00280102'),
    pixelRepresentation: dataSet.uint16('x00280103'),
    samplesPerPixel: dataSet.uint16('x00280002'),
    photometricInterpretation: dataSet.string('x00280004'),
    windowCenter: firstNumber(dataSet.string('x00281050')),
    windowWidth: firstNumber(dataSet.string('x00281051')),
    rescaleSlope: dataSet.floatString('x00281053'),
    rescaleIntercept: dataSet.floatString('x00281052'),
    dataSet,
  };
}

/** Converte as tags DA/TM do DICOM em ISO (ex.: 20260827T093000 → 2026-08-27T09:30:00). */
export function dicomDateTimeToIso(date?: string, time?: string): string {
  try {
    const d = date ? dicomParser.parseDA(date) : undefined;
    const t = time ? dicomParser.parseTM(time) : undefined;
    if (d) {
      const hh = t ? pad2(t.hours) : '00';
      const mm = t && t.minutes !== undefined ? pad2(t.minutes) : '00';
      const ss = t && t.seconds !== undefined ? pad2(t.seconds) : '00';
      return `${d.year}-${pad2(d.month)}-${pad2(d.day)}T${hh}:${mm}:${ss}`;
    }
  } catch {
    // tags DA/TM malformados → fallback para "agora"
  }
  return new Date().toISOString();
}

/**
 * Indica se o pixel data do arquivo pode ser decodificado no browser
 * (monocromático não comprimido). Exames comprimidos (J2K/JPEG-LS/etc.)
 * retornam `false` — o import segue funcionando, só sem thumbnail real.
 */
export function canDecodePixels(study: ParsedDicomStudy): boolean {
  const px = study.dataSet.elements.x7fe00010;
  if (!px || px.encapsulatedPixelData) return false;
  if (!UNCOMPRESSED_TRANSFER_SYNTAXES.has(study.transferSyntaxUid)) return false;
  if (!study.rows || !study.columns || !study.bitsAllocated) return false;
  if ((study.samplesPerPixel ?? 1) !== 1) return false;
  if (study.rows * study.columns > 16_000_000) return false;
  return true;
}

/**
 * Renderiza o primeiro frame do pixel data (MONOCHROME1/2, 8 ou 16 bits)
 * em um JPEG em escala de cinza. Retorna `null` se não for decodificável.
 */
export async function renderDicomThumbnail(study: ParsedDicomStudy): Promise<Blob | null> {
  if (!canDecodePixels(study)) return null;

  const rows = study.rows as number;
  const cols = study.columns as number;
  const bitsAllocated = study.bitsAllocated as number;
  const bitsStored = study.bitsStored ?? bitsAllocated;
  const pixelRep = study.pixelRepresentation ?? 0;
  const mono = study.photometricInterpretation ?? 'MONOCHROME2';
  const isSigned = pixelRep === 1;
  const is16 = bitsAllocated === 16;

  const px = study.dataSet.elements.x7fe00010;
  const byteArray = study.dataSet.byteArray as Uint8Array;
  const raw = byteArray.subarray(px.dataOffset, px.dataOffset + px.length);
  const bytesPerPixel = is16 ? 2 : 1;
  const framePixelBytes = rows * cols * bytesPerPixel;
  if (raw.length < framePixelBytes) return null;

  const view = new DataView(raw.buffer, raw.byteOffset, framePixelBytes);
  const mask = bitsStored >= 16 ? 0xffff : (1 << bitsStored) - 1;

  const slope = study.rescaleSlope ?? 1;
  const intercept = study.rescaleIntercept ?? 0;

  const values = new Float64Array(rows * cols);
  for (let i = 0; i < values.length; i++) {
    let v: number;
    if (is16) {
      v = isSigned ? view.getInt16(i * 2, true) : view.getUint16(i * 2, true);
      if (!isSigned && bitsStored < 16) v &= mask;
    } else {
      v = raw[i];
      if (bitsStored < 8) v &= mask;
    }
    values[i] = v * slope + intercept;
  }

  // Janela (W/L) preferencial; senão normaliza por min/max do frame.
  let lo: number;
  let hi: number;
  if (study.windowCenter !== undefined && study.windowWidth !== undefined && study.windowWidth > 0) {
    lo = study.windowCenter - study.windowWidth / 2;
    hi = study.windowCenter + study.windowWidth / 2;
  } else {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < values.length; i++) {
      if (values[i] < min) min = values[i];
      if (values[i] > max) max = values[i];
    }
    if (max <= min) return null;
    lo = min;
    hi = max;
  }
  const range = hi - lo;

  const out = new Uint8ClampedArray(rows * cols * 4);
  for (let i = 0; i < values.length; i++) {
    let g = (values[i] - lo) / range;
    if (g < 0) g = 0;
    else if (g > 1) g = 1;
    let gray = Math.round(g * 255);
    if (mono === 'MONOCHROME1') gray = 255 - gray;
    const o = i * 4;
    out[o] = gray;
    out[o + 1] = gray;
    out[o + 2] = gray;
    out[o + 3] = 255;
  }

  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.putImageData(new ImageData(out, cols, rows), 0, 0);

  const maxDim = Math.max(rows, cols);
  const target: HTMLCanvasElement = maxDim > 1024
    ? (() => {
        const scale = 1024 / maxDim;
        const o = document.createElement('canvas');
        o.width = Math.max(1, Math.round(cols * scale));
        o.height = Math.max(1, Math.round(rows * scale));
        o.getContext('2d')?.drawImage(canvas, 0, 0, o.width, o.height);
        return o;
      })()
    : canvas;

  const blob = await new Promise<Blob | null>((resolve) => {
    target.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
  });
  return blob;
}

export const dicomParserVersion = dicomParser.version;