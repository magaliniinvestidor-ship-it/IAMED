export interface QrExamRequestPayload {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  signedAt?: string;
  verificationCode?: string;
  items: Array<{ id: string; name: string; examType: string; urgency: string }>;
}

export interface ParsedExamRequestQr {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  signedAt: string;
  verificationCode: string;
  items: Array<{ id: string; name: string; examType: string; urgency: string }>;
}

const PAYLOAD_HEADER = 'IAMED-EXAMS';

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export function buildExamQrPayload(p: QrExamRequestPayload): string {
  const items = p.items
    .map(i => [encodeURIComponent(i.id), encodeURIComponent(i.name), encodeURIComponent(i.examType), encodeURIComponent(i.urgency)].join('|'))
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

export function parseExamQr(payload: string): ParsedExamRequestQr | null {
  if (!payload) return null;
  const parts = payload.split('&');
  if (parts[0] !== PAYLOAD_HEADER) return null;
  if (parts.length < 8) return null;
  const [, id, patientId, patientName, createdAt, signedAt, verificationCode, itemsStr] = parts;
  const items = (itemsStr || '')
    .split(';')
    .filter(Boolean)
    .map(raw => {
      const [itemId, name, examType, urgency] = raw.split('|');
      return {
        id: safeDecode(itemId || ''),
        name: safeDecode(name || ''),
        examType: safeDecode(examType || ''),
        urgency: safeDecode(urgency || ''),
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

export function buildExamVerifyUrl(payload: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base.replace(/\/$/, '')}/verify?d=${encodeURIComponent(payload)}`;
}