import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const APP_NAME = 'IAMED';
const ISSUER = 'IAMED';

export function generateTOTPSecret(userEmail: string) {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME}:${userEmail}`,
    issuer: ISSUER,
    length: 20,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url || '',
  };
}

export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { width: 200, margin: 1 });
}

export function verifyTOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}

export function generateBackupCodes(count = 8): string[] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 4; j++) code += chars[Math.floor(Math.random() * chars.length)];
    code += '-';
    for (let j = 0; j < 4; j++) code += chars[Math.floor(Math.random() * chars.length)];
    codes.push(code);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}
