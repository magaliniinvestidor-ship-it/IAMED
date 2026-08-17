'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { parsePrescriptionQr } from '@/lib/prescription/qrCode';
import { parseExamQr } from '@/lib/exam/examQr';
import { parseProcedureQr } from '@/lib/exam/procedureQr';
import { I18nProvider, useI18n } from '@/lib/i18n/I18nContext';
import { ShieldCheck, XCircle, Loader2, Search } from 'lucide-react';

type VerifyState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'valid';
      documentType: 'prescricao' | 'exame' | 'procedimento';
      id: string;
      patientName: string;
      patientPhone: string;
      patientEmail: string;
      patientBirthdate: string;
      professionalName: string;
      professionalSpecialty: string;
      professionalCouncil: string;
      professionalCouncilNumber: string;
      signedAt: string;
      verificationCode: string;
      itemsCount: number;
      examItems?: Array<{ name: string; examType: string; urgency: string }>;
      procItems?: Array<{ name: string; code: string; category: string; quantity: number }>;
    }
  | { status: 'tampered'; id: string }
  | { status: 'notfound'; id: string }
  | { status: 'invalid' };

export default function VerifyClient({ payload }: { payload: string }) {
  return (
    <I18nProvider>
      <VerifyInner initialPayload={payload} />
    </I18nProvider>
  );
}

function VerifyInner({ initialPayload }: { initialPayload: string }) {
  const { t, locale } = useI18n();
  const [input, setInput] = useState(initialPayload);
  const [state, setState] = useState<VerifyState>({ status: 'idle' });

  const formatBirthdate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value.includes('T') ? value : value + 'T12:00:00');
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString(locale);
  };

  const runVerify = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setState({ status: 'idle' });
      return;
    }
    setState({ status: 'loading' });

    let payload = trimmed;
    if (payload.startsWith('http')) {
      try {
        const url = new URL(payload);
        payload = url.searchParams.get('d') || payload;
      } catch {
        // mantém o texto cru
      }
    }

    const isExam = payload.startsWith('IAMED-EXAMS');
    const isProcedure = payload.startsWith('IAMED-PROCEDURES');
    const parsedExam = isExam ? parseExamQr(payload) : null;
    const parsedProc = isProcedure ? parseProcedureQr(payload) : null;
    const parsedPresc = isExam || isProcedure ? null : parsePrescriptionQr(payload);
    if ((isExam && !parsedExam) || (isProcedure && !parsedProc) || (!isExam && !isProcedure && !parsedPresc)) {
      setState({ status: 'invalid' });
      return;
    }

    if (isExam && parsedExam) {
      const { data: sig } = await supabase
        .from('electronic_signatures')
        .select('id, signer_name, signer_council, signer_council_number, verification_code, signed_at')
        .eq('document_id', parsedExam.id)
        .eq('document_type', 'exame')
        .maybeSingle();

      if (!sig) {
        setState({ status: 'notfound', id: parsedExam.id });
        return;
      }

      const { data: exams } = await supabase
        .from('exam_requests')
        .select('id, exam_name, patient_id, signed_at')
        .eq('signature_id', sig.id);

      const examList = exams || [];
      const idSet = new Set(examList.map(e => e.id));
      const allMatch = parsedExam.items.length === examList.length && parsedExam.items.every(it => idSet.has(it.id));
      if (!allMatch || !examList.every(e => e.patient_id === parsedExam.patientId)) {
        setState({ status: 'tampered', id: parsedExam.id });
        return;
      }

      const [{ data: patient }, { data: prof }] = await Promise.all([
        supabase
          .from('patients')
          .select('name, phone, email, birthdate')
          .eq('id', parsedExam.patientId)
          .maybeSingle(),
        supabase
          .from('professionals')
          .select('name, specialty, council, council_number')
          .eq('name', sig.signer_name)
          .maybeSingle(),
      ]);

      setState({
        status: 'valid',
        documentType: 'exame',
        id: parsedExam.id,
        patientName: patient?.name || parsedExam.patientName || '—',
        patientPhone: patient?.phone || '—',
        patientEmail: patient?.email || '—',
        patientBirthdate: formatBirthdate(patient?.birthdate),
        professionalName: sig.signer_name || prof?.name || '—',
        professionalSpecialty: prof?.specialty || '—',
        professionalCouncil: sig.signer_council || prof?.council || '—',
        professionalCouncilNumber: sig.signer_council_number || prof?.council_number || '—',
        signedAt: sig.signed_at || parsedExam.signedAt || '',
        verificationCode: sig.verification_code || parsedExam.verificationCode || '—',
        itemsCount: parsedExam.items.length,
        examItems: parsedExam.items.map(it => ({ name: it.name, examType: it.examType, urgency: it.urgency })),
      });
      return;
    }

    if (isProcedure && parsedProc) {
      const { data: sig } = await supabase
        .from('electronic_signatures')
        .select('id, signer_name, signer_council, signer_council_number, verification_code, signed_at')
        .eq('document_id', parsedProc.id)
        .eq('document_type', 'procedimento')
        .maybeSingle();

      if (!sig) {
        setState({ status: 'notfound', id: parsedProc.id });
        return;
      }

      const { data: procedures } = await supabase
        .from('procedures')
        .select('id, patient_id, signed_at')
        .eq('signature_id', sig.id);

      const procList = procedures || [];
      const idSet = new Set(procList.map(p => p.id));
      const allMatch = parsedProc.items.length === procList.length && parsedProc.items.every(it => idSet.has(it.id));
      if (!allMatch || !procList.every(p => p.patient_id === parsedProc.patientId)) {
        setState({ status: 'tampered', id: parsedProc.id });
        return;
      }

      const [{ data: patient }, { data: prof }] = await Promise.all([
        supabase
          .from('patients')
          .select('name, phone, email, birthdate')
          .eq('id', parsedProc.patientId)
          .maybeSingle(),
        supabase
          .from('professionals')
          .select('name, specialty, council, council_number')
          .eq('name', sig.signer_name)
          .maybeSingle(),
      ]);

      setState({
        status: 'valid',
        documentType: 'procedimento',
        id: parsedProc.id,
        patientName: patient?.name || parsedProc.patientName || '—',
        patientPhone: patient?.phone || '—',
        patientEmail: patient?.email || '—',
        patientBirthdate: formatBirthdate(patient?.birthdate),
        professionalName: sig.signer_name || prof?.name || '—',
        professionalSpecialty: prof?.specialty || '—',
        professionalCouncil: sig.signer_council || prof?.council || '—',
        professionalCouncilNumber: sig.signer_council_number || prof?.council_number || '—',
        signedAt: sig.signed_at || parsedProc.signedAt || '',
        verificationCode: sig.verification_code || parsedProc.verificationCode || '—',
        itemsCount: parsedProc.items.length,
        procItems: parsedProc.items.map(it => ({ name: it.name, code: it.code, category: it.category, quantity: it.quantity })),
      });
      return;
    }

    const parsed = parsedPresc!;

    const { data: presc } = await supabase
      .from('prescriptions')
      .select('id, patient_id, created_by, qr_code_data, status')
      .eq('id', parsed.id)
      .maybeSingle();

    if (!presc) {
      setState({ status: 'notfound', id: parsed.id });
      return;
    }
    if (presc.qr_code_data !== payload || presc.status !== 'assinado') {
      setState({ status: 'tampered', id: parsed.id });
      return;
    }

    const [{ data: patient }, { data: sig }, { data: prof }] = await Promise.all([
      supabase
        .from('patients')
        .select('name, phone, email, birthdate')
        .eq('id', presc.patient_id)
        .maybeSingle(),
      supabase
        .from('electronic_signatures')
        .select('signer_name, signer_council, signer_council_number, verification_code, signed_at')
        .eq('document_id', parsed.id)
        .eq('document_type', 'prescricao')
        .maybeSingle(),
      supabase
        .from('professionals')
        .select('name, specialty, council, council_number')
        .eq('name', presc.created_by)
        .maybeSingle(),
    ]);

    setState({
      status: 'valid',
      documentType: 'prescricao',
      id: parsed.id,
      patientName: patient?.name || parsed.patientName || '—',
      patientPhone: patient?.phone || '—',
      patientEmail: patient?.email || '—',
      patientBirthdate: formatBirthdate(patient?.birthdate),
      professionalName: sig?.signer_name || prof?.name || presc.created_by || '—',
      professionalSpecialty: prof?.specialty || '—',
      professionalCouncil: sig?.signer_council || prof?.council || '—',
      professionalCouncilNumber: sig?.signer_council_number || prof?.council_number || '—',
      signedAt: sig?.signed_at || parsed.signedAt || '',
      verificationCode: sig?.verification_code || parsed.verificationCode || '—',
      itemsCount: parsed.items.length,
    });
  };

  useEffect(() => {
    if (initialPayload) {
      runVerify(initialPayload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-100 mb-2">
            <ShieldCheck className="w-7 h-7 text-teal-600" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">
            {state.status === 'valid' && state.documentType === 'exame'
              ? t('presc_verify_exam_title', 'app')
              : state.status === 'valid' && state.documentType === 'procedimento'
                ? t('presc_verify_proc_title', 'app')
                : t('presc_verify_title', 'app')}
          </h1>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('presc_qr_verify_placeholder', 'app')}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <button
            onClick={() => runVerify(input)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" /> {t('presc_qr_verify_btn', 'app')}
          </button>
        </div>

        {state.status === 'loading' && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('presc_qr_verify', 'app')}...
          </div>
        )}

        {state.status === 'valid' && (
          <div className="p-4 rounded-xl border border-green-300 bg-green-50 text-green-900 space-y-2.5">
            <p className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4" />
              {state.documentType === 'exame'
                ? t('presc_verify_exam_success', 'app')
                : state.documentType === 'procedimento'
                  ? t('presc_verify_proc_success', 'app')
                  : t('presc_qr_verify_success', 'app')}
            </p>

            <div>
              <p className="text-[10px] font-bold uppercase text-green-600 tracking-wider">{t('presc_verify_patient', 'app')}</p>
              <p className="text-sm font-bold">{state.patientName}</p>
              <p className="text-sm"><span className="font-semibold">{t('presc_verify_phone', 'app')}:</span> {state.patientPhone}</p>
              <p className="text-sm"><span className="font-semibold">{t('presc_verify_email', 'app')}:</span> {state.patientEmail}</p>
              <p className="text-sm"><span className="font-semibold">{t('presc_verify_birthdate', 'app')}:</span> {state.patientBirthdate}</p>
            </div>

            {state.documentType === 'exame' && state.examItems && (
              <div>
                <p className="text-[10px] font-bold uppercase text-green-600 tracking-wider">{t('presc_verify_exam_items', 'app')}</p>
                <ul className="text-sm space-y-0.5">
                  {state.examItems.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-[10px] text-green-700 uppercase">{item.examType}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state.documentType === 'procedimento' && state.procItems && (
              <div>
                <p className="text-[10px] font-bold uppercase text-green-600 tracking-wider">{t('presc_verify_proc_items', 'app')}</p>
                <ul className="text-sm space-y-0.5">
                  {state.procItems.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-[10px] text-green-700 font-mono">{item.code} × {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase text-green-600 tracking-wider">{t('presc_verify_professional', 'app')}</p>
              <p className="text-sm font-bold">{state.professionalName}</p>
              <p className="text-sm"><span className="font-semibold">{t('presc_verify_specialty', 'app')}:</span> {state.professionalSpecialty}</p>
              <p className="text-sm"><span className="font-semibold">{t('presc_verify_council', 'app')}:</span> {state.professionalCouncil}</p>
              <p className="text-sm"><span className="font-semibold">{t('presc_verify_council_number', 'app')}:</span> {state.professionalCouncilNumber}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-green-600 tracking-wider">{t('presc_verify_receipt_id', 'app')}</p>
              <p className="text-sm">{state.id}</p>
              <p className="text-sm"><span className="font-semibold">{t('presc_verify_signed_at', 'app')}:</span>{' '}
                {state.signedAt ? new Date(state.signedAt).toLocaleString() : '—'}
              </p>
              <p className="text-sm"><span className="font-semibold">{t('presc_verify_verification_code', 'app')}:</span> {state.verificationCode}</p>
              <p className="text-sm"><span className="font-semibold">{state.documentType === 'exame'
                ? t('presc_verify_exam_items', 'app')
                : state.documentType === 'procedimento'
                  ? t('presc_verify_proc_items', 'app')
                  : t('presc_verify_items_count', 'app')}:</span> {state.itemsCount}</p>
            </div>
          </div>
        )}

        {state.status === 'tampered' && (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 space-y-1">
            <p className="flex items-center gap-2 font-bold">
              <XCircle className="w-4 h-4" /> {t('presc_verify_tampered', 'app')}
            </p>
            <p className="text-sm">{state.id}</p>
          </div>
        )}

        {state.status === 'notfound' && (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 space-y-1">
            <p className="flex items-center gap-2 font-bold">
              <XCircle className="w-4 h-4" /> {t('presc_verify_not_found', 'app')}
            </p>
            <p className="text-sm">{state.id}</p>
          </div>
        )}

        {state.status === 'invalid' && (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 font-bold flex items-center gap-2">
            <XCircle className="w-4 h-4" /> {t('presc_verify_invalid', 'app')}
          </div>
        )}
      </div>
    </div>
  );
}