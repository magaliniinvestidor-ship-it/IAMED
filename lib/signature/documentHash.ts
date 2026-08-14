export type SignatureDocumentType =
  | 'prescricao'
  | 'receita'
  | 'laudo'
  | 'atestado'
  | 'alta'
  | 'procedimento'
  | 'exame'
  | 'outro';

export interface SignableDocument {
  documentType: SignatureDocumentType;
  documentId: string;
  patientId: string;
  signerName: string;
  signerCouncil?: string;
  signerCouncilNumber?: string;
  content: Record<string, unknown>;
}

export async function canonicalJsonHash(content: Record<string, unknown>): Promise<string> {
  const canonical = canonicalStringify(content);
  const buffer = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `SHA256:${hex}`;
}

function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => canonicalStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`).join(',')}}`;
}