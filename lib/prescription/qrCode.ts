import QRCode from 'qrcode';

export async function generateQrDataUrl(payload: string, size = 160): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  } catch {
    return '';
  }
}

export interface QrPrescriptionPayload {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  signedAt?: string;
  verificationCode?: string;
  items: Array<{ name: string; dosage: string; frequency: string }>;
}

export interface ParsedPrescriptionQr {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  signedAt: string;
  verificationCode: string;
  items: Array<{ name: string; dosage: string; frequency: string }>;
}

const PAYLOAD_HEADER = 'IAMED-PRESC';

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export function buildPrescriptionQrPayload(p: QrPrescriptionPayload): string {
  const items = p.items
    .map(i => [encodeURIComponent(i.name), encodeURIComponent(i.dosage), encodeURIComponent(i.frequency)].join('|'))
    .join(';');
  return [
    PAYLOAD_HEADER,
    p.id,
    p.patientId,
    encodeURIComponent(p.patientName),
    p.createdAt,
    p.signedAt || '',
    p.verificationCode || '',
    items,
  ].join('&');
}

export function parsePrescriptionQr(payload: string): ParsedPrescriptionQr | null {
  if (!payload) return null;
  const parts = payload.split('&');
  if (parts[0] !== PAYLOAD_HEADER) return null;
  if (parts.length < 8) return null;
  const [, id, patientId, patientName, createdAt, signedAt, verificationCode, itemsStr] = parts;
  const items = (itemsStr || '')
    .split(';')
    .filter(Boolean)
    .map(raw => {
      const [name, dosage, frequency] = raw.split('|');
      return {
        name: safeDecode(name || ''),
        dosage: safeDecode(dosage || ''),
        frequency: safeDecode(frequency || ''),
      };
    });
  return {
    id,
    patientId,
    patientName: safeDecode(patientName || ''),
    createdAt,
    signedAt: signedAt || '',
    verificationCode: verificationCode || '',
    items,
  };
}

export function buildPrescriptionVerifyUrl(payload: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base.replace(/\/$/, '')}/verify?d=${encodeURIComponent(payload)}`;
}