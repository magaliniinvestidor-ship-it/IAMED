export interface QrProcedureRequestPayload {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  signedAt?: string;
  verificationCode?: string;
  items: Array<{ id: string; code: string; name: string; category: string; quantity: number }>;
}

export interface ParsedProcedureRequestQr {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  signedAt: string;
  verificationCode: string;
  items: Array<{ id: string; code: string; name: string; category: string; quantity: number }>;
}

const PAYLOAD_HEADER = 'IAMED-PROCEDURES';

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export function buildProcedureQrPayload(p: QrProcedureRequestPayload): string {
  const items = p.items
    .map(i => [encodeURIComponent(i.id), encodeURIComponent(i.code), encodeURIComponent(i.name), encodeURIComponent(i.category), String(i.quantity)].join('|'))
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

export function parseProcedureQr(payload: string): ParsedProcedureRequestQr | null {
  if (!payload) return null;
  const parts = payload.split('&');
  if (parts[0] !== PAYLOAD_HEADER) return null;
  if (parts.length < 8) return null;
  const [, id, patientId, patientName, createdAt, signedAt, verificationCode, itemsStr] = parts;
  const items = (itemsStr || '')
    .split(';')
    .filter(Boolean)
    .map(raw => {
      const [itemId, code, name, category, quantity] = raw.split('|');
      return {
        id: safeDecode(itemId || ''),
        code: safeDecode(code || ''),
        name: safeDecode(name || ''),
        category: safeDecode(category || ''),
        quantity: parseInt(quantity || '1', 10) || 1,
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

export function buildProcedureVerifyUrl(payload: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base.replace(/\/$/, '')}/verify?d=${encodeURIComponent(payload)}`;
}