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

export function buildPrescriptionQrPayload(p: QrPrescriptionPayload): string {
  const items = p.items.map(i => `${i.name}|${i.dosage}|${i.frequency}`).join(';');
  return [
    'IAMED-PRESC',
    p.id,
    p.patientId,
    encodeURIComponent(p.patientName),
    p.createdAt,
    p.signedAt || '',
    p.verificationCode || '',
    items,
  ].join('&');
}