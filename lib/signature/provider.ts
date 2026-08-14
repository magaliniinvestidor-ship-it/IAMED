import { SignableDocument, SignatureDocumentType, canonicalJsonHash } from './documentHash';

export type SignatureStatus = 'valida' | 'revogada' | 'expirada';

export interface SignatureResult {
  signatureHash: string;
  certificateSerial: string;
  certificateIssuer: string;
  certificateValidFrom: string;
  certificateValidTo: string;
  timestampToken: string;
  timestampAuthority: string;
  verificationCode: string;
  status: SignatureStatus;
  signedAt: string;
}

export interface SignatureVerifyInput {
  document: SignableDocument;
  signature: SignatureResult;
}

export interface SignatureProvider {
  readonly id: string;
  readonly name: string;
  sign(doc: SignableDocument): Promise<SignatureResult>;
  verify(input: SignatureVerifyInput): Promise<boolean>;
}

export class SimulatorSignatureProvider implements SignatureProvider {
  readonly id = 'simulator';
  readonly name = 'Simulação (sem PCSC real)';

  async sign(doc: SignableDocument): Promise<SignatureResult> {
    const signatureHash = await canonicalJsonHash(doc.content);
    const signedAt = new Date().toISOString();
    const certificateValidFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const certificateValidTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    return {
      signatureHash,
      certificateSerial: `CERT-${crypto.randomUUID()}`,
      certificateIssuer: 'AC IAMED - Prestador Qualificado (PCSC)',
      certificateValidFrom,
      certificateValidTo,
      timestampToken: `TSA-${crypto.randomUUID()}`,
      timestampAuthority: 'IAMED-TSA',
      verificationCode: `VER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'valida',
      signedAt,
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }
}

let activeProvider: SignatureProvider | null = null;

export const getSignatureProvider = (): SignatureProvider => {
  if (!activeProvider) activeProvider = new SimulatorSignatureProvider();
  return activeProvider;
};

export const setSignatureProvider = (provider: SignatureProvider): void => {
  activeProvider = provider;
};

export type { SignableDocument, SignatureDocumentType };