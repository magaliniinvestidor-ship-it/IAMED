import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { generateTOTPSecret, generateQRCode, verifyTOTP, generateBackupCodes, hashBackupCode } from '@/lib/twofa/totp';
import { sendEmail, buildOtpEmailHtml } from '@/lib/email';
import { getAuthenticatedUser, hasAdminRole } from '@/lib/auth/apiAuth';

// Ações do fluxo de login: o chamador precisa ser o próprio usuário (JWT emitido
// logo após a senha correta, ou nonce de desafio). Ações administrativas exigem papel de admin.
const LOGIN_FLOW_ACTIONS = ['verify', 'verify_backup', 'verify_email_otp', 'send_email_otp'];
const ADMIN_ACTIONS = ['generate', 'disable', 'enable_email', 'enable_sms', 'regenerate_backup'];

// Desafios 2FA em memória: registrados enquanto a sessão pós-senha ainda é
// válida; permitem concluir o login após o sign-out sem depender do JWT
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const twoFactorChallenges = new Map<string, { userId: string; expiresAt: number }>();

function pruneChallenges() {
  const now = Date.now();
  for (const [key, entry] of twoFactorChallenges) {
    if (entry.expiresAt < now) twoFactorChallenges.delete(key);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function extractError(err: unknown): string {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    const msg = obj.message ?? obj.msg ?? obj.error;
    if (typeof msg === 'string') return msg;
  }
  return String(err);
}

// Rate limit: bloqueia força bruta nos códigos (janela deslizante por usuário)
const MAX_VERIFY_FAILURES = 5;
const VERIFY_FAILURE_WINDOW_MIN = 15;

async function countRecentVerifyFailures(admin: ReturnType<typeof getAdmin>, userId: string): Promise<number> {
  try {
    const since = new Date(Date.now() - VERIFY_FAILURE_WINDOW_MIN * 60 * 1000).toISOString();
    const { count, error } = await admin
      .from('two_factor_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('success', false)
      .gte('created_at', since);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function logVerifyFailure(admin: ReturnType<typeof getAdmin>, userId: string, method: string, req: NextRequest) {
  try {
    await admin.from('two_factor_logs').insert({
      user_id: userId,
      method,
      success: false,
      ip_address: req.headers.get('x-forwarded-for') || '192.168.1.1',
    });
  } catch {}
}

// POST /api/admin/2fa — Gerar secret + QR code para um usuário
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, user_id, token, code } = body;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
    }

    const caller = await getAuthenticatedUser(req);

    const challengeHeader = req.headers.get('x-2fa-challenge') || '';
    const challengeEntry = twoFactorChallenges.get(challengeHeader);
    const challengeValid = !!challengeEntry && challengeEntry.expiresAt > Date.now();

    // Identidade efetiva: JWT tem precedência; sem JWT, aceita nonce válido
    // apenas nas ações do fluxo de login
    let callerId: string | null = caller?.id ?? null;
    if (!callerId && challengeValid && LOGIN_FLOW_ACTIONS.includes(action) && challengeEntry) {
      callerId = challengeEntry.userId;
    }

    if (!callerId) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 });
    }

    if (LOGIN_FLOW_ACTIONS.includes(action)) {
      // No fluxo de login o chamador é o próprio usuário; no painel admin,
      // um administrador pode verificar em nome de outro usuário (matrícula)
      if (callerId !== user_id && !(await hasAdminRole(callerId))) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    } else if (ADMIN_ACTIONS.includes(action)) {
      if (!caller || !(await hasAdminRole(caller.id))) {
        return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
      }
    }

    const admin = getAdmin();

    if (action === 'start_challenge') {
      if (!caller || caller.id !== user_id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
      pruneChallenges();
      const nonce = crypto.randomBytes(32).toString('hex');
      twoFactorChallenges.set(nonce, { userId: user_id, expiresAt: Date.now() + CHALLENGE_TTL_MS });
      return NextResponse.json({ challenge: nonce });
    }

    const verifyMethods: Record<string, string> = { verify: 'totp', verify_backup: 'backup', verify_email_otp: 'email' };
    if (user_id && verifyMethods[action]) {
      const failures = await countRecentVerifyFailures(admin, user_id);
      if (failures >= MAX_VERIFY_FAILURES) {
        return NextResponse.json(
          { valid: false, error: 'Muitas tentativas inválidas. Aguarde alguns minutos antes de tentar novamente.' },
          { status: 429 }
        );
      }
    }

    if (action === 'generate') {
      const { data: userData } = await admin.auth.admin.getUserById(user_id);
      const email = userData?.user?.email || 'user@iamed.local';

      const { secret, otpauthUrl } = generateTOTPSecret(email);
      const qrCodeDataUrl = await generateQRCode(otpauthUrl);

      // Substitui qualquer configuração anterior do usuário (TOTP antigo ou
      // artefato 'email-otp'), permitindo reemitir a chave sem bloqueio
      const { error: upsertError } = await admin
        .from('two_factor_secrets')
        .upsert({ user_id, secret, enabled: false }, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      await admin
        .from('system_users')
        .update({ two_factor_method: 'totp' })
        .eq('auth_user_id', user_id);

      const backupCodes = generateBackupCodes(8);

      // Códigos usados há mais de 90 dias saem daqui; o evento de uso
      // permanece auditado em two_factor_logs
      const usedCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      await admin.from('two_factor_backup_codes').delete().lt('used_at', usedCutoff);

      await admin
        .from('two_factor_backup_codes')
        .delete()
        .eq('user_id', user_id)
        .eq('used', false);
      const codeRows = backupCodes.map((c) => ({
        user_id,
        code_hash: hashBackupCode(c),
        used: false,
      }));

      await admin.from('two_factor_backup_codes').insert(codeRows);

      return NextResponse.json({ secret, qrCode: qrCodeDataUrl, backupCodes });
    }

    if (action === 'verify') {
      const { data: secretRow } = await admin
        .from('two_factor_secrets')
        .select('secret')
        .eq('user_id', user_id)
        .single();

      if (!secretRow) {
        return NextResponse.json({ error: '2FA não configurado' }, { status: 400 });
      }

      const isValid = verifyTOTP(secretRow.secret, token);

      if (isValid) {
        await admin
          .from('two_factor_secrets')
          .update({ enabled: true, updated_at: new Date().toISOString() })
          .eq('user_id', user_id);

        await admin
          .from('system_users')
          .update({ two_factor_enabled: true, two_factor_method: 'totp' })
          .eq('auth_user_id', user_id);

        await admin.from('two_factor_logs').insert({
          user_id,
          method: 'totp',
          success: true,
          ip_address: req.headers.get('x-forwarded-for') || '192.168.1.1',
        });
      } else {
        await logVerifyFailure(admin, user_id, 'totp', req);
      }

      return NextResponse.json({ valid: isValid });
    }

    if (action === 'verify_backup') {
      const { data: codes } = await admin
        .from('two_factor_backup_codes')
        .select('id, code_hash')
        .eq('user_id', user_id)
        .eq('used', false);

      if (!codes || codes.length === 0) {
        return NextResponse.json({ error: 'Nenhum código de backup disponível' }, { status: 400 });
      }

      const inputHash = hashBackupCode(code);
      const match = codes.find((c) => c.code_hash === inputHash);

      if (match) {
        await admin
          .from('two_factor_backup_codes')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('id', match.id);

        await admin.from('two_factor_logs').insert({
          user_id,
          method: 'backup',
          success: true,
          ip_address: req.headers.get('x-forwarded-for') || '192.168.1.1',
        });

        return NextResponse.json({ valid: true });
      }

      await logVerifyFailure(admin, user_id, 'backup', req);
      return NextResponse.json({ valid: false });
    }

    if (action === 'disable') {
      await admin
        .from('two_factor_secrets')
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', user_id);

      await admin
        .from('system_users')
        .update({ two_factor_enabled: false, two_factor_method: 'none' })
        .eq('auth_user_id', user_id);

      return NextResponse.json({ success: true });
    }

    if (action === 'enable_email') {
      await admin
        .from('system_users')
        .update({ two_factor_enabled: true, two_factor_method: 'email' })
        .eq('auth_user_id', user_id);

      const { data: existing } = await admin
        .from('two_factor_secrets')
        .select('id')
        .eq('user_id', user_id)
        .single();

      if (existing) {
        await admin
          .from('two_factor_secrets')
          .update({ enabled: true, updated_at: new Date().toISOString() })
          .eq('user_id', user_id);
      } else {
        await admin.from('two_factor_secrets').insert({
          user_id,
          secret: 'email-otp',
          enabled: true,
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'enable_sms') {
      return NextResponse.json({ error: 'SMS disponível em breve (requer Twilio)' }, { status: 501 });
    }

    if (action === 'regenerate_backup') {
      await admin
        .from('two_factor_backup_codes')
        .delete()
        .eq('user_id', user_id)
        .eq('used', false);

      const backupCodes = generateBackupCodes(8);
      const codeRows = backupCodes.map((c) => ({
        user_id,
        code_hash: hashBackupCode(c),
        used: false,
      }));

      await admin.from('two_factor_backup_codes').insert(codeRows);

      return NextResponse.json({ backupCodes });
    }

    if (action === 'send_email_otp') {
      const { data: userRow } = await admin
        .from('system_users')
        .select('auth_user_id')
        .eq('auth_user_id', user_id)
        .single();

      if (!userRow) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 });
      }

      const { data: profData } = await admin
        .from('professionals')
        .select('email')
        .eq('id', (await admin.from('system_users').select('professional_id').eq('auth_user_id', user_id).single()).data?.professional_id)
        .single();

      const email = profData?.email;
      if (!email) {
        return NextResponse.json({ error: 'E-mail do profissional não encontrado' }, { status: 400 });
      }

      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Só o código mais recente vale: remove os anteriores do usuário e
      // limpa globalmente os que já expiraram
      await admin.from('two_factor_email_otps').delete().eq('user_id', user_id);
      await admin.from('two_factor_email_otps').delete().lt('expires_at', new Date().toISOString());

      await admin.from('two_factor_email_otps').insert({
        user_id,
        code_hash: hashBackupCode(otpCode),
        expires_at: expiresAt,
        used: false,
      });

      const sendResult = await sendEmail({
        to: email,
        subject: 'Seu código de verificação IAMED',
        html: buildOtpEmailHtml(otpCode),
      });

      if (!sendResult.ok && sendResult.error !== 'not_configured') {
        console.error('[POST /api/admin/2fa] Falha ao enviar e-mail OTP:', sendResult.error);
        return NextResponse.json(
          { error: `Falha ao enviar e-mail: ${sendResult.error}` },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        simulated: sendResult.error === 'not_configured',
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      });
    }

    if (action === 'verify_email_otp') {
      // Compara hash: o código em texto puro nunca toca o banco
      const inputHash = hashBackupCode(code || token || '');
      const { data: otpRows } = await admin
        .from('two_factor_email_otps')
        .select('id, code_hash, expires_at')
        .eq('user_id', user_id)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1);

      const otpRow = otpRows?.[0];

      if (!otpRow || otpRow.code_hash !== inputHash) {
        await logVerifyFailure(admin, user_id, 'email', req);
        return NextResponse.json({ valid: false, error: 'Código inválido' });
      }

      if (new Date(otpRow.expires_at) < new Date()) {
        await logVerifyFailure(admin, user_id, 'email', req);
        return NextResponse.json({ valid: false, error: 'Código expirado' });
      }

      await admin
        .from('two_factor_email_otps')
        .update({ used: true })
        .eq('id', otpRow.id);

      await admin.from('two_factor_logs').insert({
        user_id,
        method: 'email',
        success: true,
        ip_address: req.headers.get('x-forwarded-for') || '192.168.1.1',
      });

      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/admin/2fa]', extractError(err));
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}

// GET /api/admin/2fa?user_id=xxx — Buscar status 2FA de um usuário
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
    }

    const caller = await getAuthenticatedUser(req);
    if (!caller) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    const admin = getAdmin();

    if (userId) {
      const { data } = await admin
        .from('two_factor_secrets')
        .select('enabled, created_at')
        .eq('user_id', userId)
        .single();

      return NextResponse.json({ enabled: data?.enabled || false, configured: !!data });
    }

    return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 });
  } catch (err) {
    console.error('[GET /api/admin/2fa]', extractError(err));
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}
