'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Patient, Appointment, Dte,
  initialPatients, initialAppointments,
  PortalNotification, OnlinePayment, TelemedicineRequest,
  initialPortalNotifications, initialOnlinePayments, initialTelemedicineRequests,
} from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import {
  Smartphone, CalendarDays, ClipboardList, FileText, Receipt,
  CreditCard, Video, Bell, User, ChevronRight, ChevronLeft,
  Check, X, AlertCircle, Download, Plus, Search, Filter,
  Clock, MapPin, Phone, Mail, Shield, Key, QrCode,
  ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, LogOut,
  Home, Pill, Microscope, Syringe, MessageSquare, Send,
  RefreshCw, CreditCard as CreditCardIcon, DollarSign,
  ExternalLink, Smartphone as SmartphoneIcon, Monitor,
  Star, Info, Calendar, UserCheck, ShieldCheck,
} from 'lucide-react';

interface PatientPortalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  dtes: Dte[];
  setDtes: React.Dispatch<React.SetStateAction<Dte[]>>;
  addAuditLog: (action: string, target: string) => void;
}

type PortalTab =
  | 'dashboard'
  | 'appointments'
  | 'history'
  | 'prescriptions'
  | 'exams'
  | 'dtes'
  | 'payments'
  | 'telemedicine'
  | 'notifications'
  | 'profile';

const SPECIALTIES = [
  'Cardiologia', 'Ortopedia', 'Ginecologia', 'Pediatria',
  'Clínico Geral', 'Dermatologia', 'Oftalmologia', 'Neurologia',
  'Psiquiatria', 'Medicina do Trabalho',
];

const DOCTORS: Record<string, { name: string; id: string }[]> = {
  'Cardiologia': [{ name: 'Dra. Amanda Silva', id: 'prof_1' }],
  'Ortopedia': [{ name: 'Dr. Adriano Lima', id: 'prof_2' }],
  'Ginecologia': [{ name: 'Dra. Amanda Silva', id: 'prof_1' }],
  'Pediatria': [{ name: 'Dra. Amanda Silva', id: 'prof_1' }],
  'Clínico Geral': [{ name: 'Dr. Bruno Castro', id: 'prof_3' }],
  'Dermatologia': [{ name: 'Dr. Adriano Lima', id: 'prof_2' }],
  'Oftalmologia': [{ name: 'Dr. Bruno Castro', id: 'prof_3' }],
  'Neurologia': [{ name: 'Dr. Adriano Lima', id: 'prof_2' }],
  'Psiquiatria': [{ name: 'Dra. Amanda Silva', id: 'prof_1' }],
  'Medicina do Trabalho': [{ name: 'Dr. Bruno Castro', id: 'prof_3' }],
};

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const normalizeTime = (t: string) => {
  if (!t) return '';
  const parts = t.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
};

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', icon: SmartphoneIcon },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: CreditCardIcon },
  { value: 'debit_card', label: 'Cartão de Débito', icon: CreditCardIcon },
  { value: 'boleto', label: 'Boleto Bancário', icon: FileText },
];

export default function PatientPortalModule({
  patients,
  setPatients,
  appointments,
  setAppointments,
  dtes,
  setDtes,
  addAuditLog,
}: PatientPortalModuleProps) {
  const { t } = useI18n();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [loggedPatientId, setLoggedPatientId] = useState<string | null>(null);

  // Login form
  const [loginCi, setLoginCi] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form
  const [regForm, setRegForm] = useState({
    name: '', ci: '', email: '', phone: '', password: '', confirmPassword: '',
    birthdate: '', gender: '',
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // OTP
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpChannel, setOtpChannel] = useState<'sms' | 'email'>('sms');
  const [otpVerified, setOtpVerified] = useState(false);

  // Tabs
  const [tab, setTab] = useState<PortalTab>('dashboard');

  // Appointments
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    specialty: '', doctorId: '', doctorName: '', date: '', time: '', modality: 'Presencial' as 'Presencial' | 'Virtual',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Payments
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ method: 'pix', amount: 0 });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Telemedicine
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [telemedicineTab, setTelemedicineTab] = useState<'scheduled' | 'request'>('scheduled');
  const [telForm, setTelForm] = useState({ specialty: '', doctorId: '', doctorName: '', date: '', time: '', notes: '' });
  const [telLoading, setTelLoading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<PortalNotification[]>(initialPortalNotifications);

  // Data
  const [customerPayments, setCustomerPayments] = useState<OnlinePayment[]>(initialOnlinePayments);
  const [telemedicineRequests, setTelemedicineRequests] = useState<TelemedicineRequest[]>(initialTelemedicineRequests);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  const loggedPatient = patients.find(p => p.id === loggedPatientId);
  const loginAttempts = useRef(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginCi || !loginPassword) {
      setLoginError('Preencha o documento e a senha.');
      return;
    }
    setLoginLoading(true);
    loginAttempts.current += 1;

    // Simulate auth: find patient by CI (document_number)
    const patient = patients.find(p => p.document_number === loginCi);
    if (!patient || loginCi.length < 4) {
      setLoginError('Credenciais inválidas. Verifique seu documento e senha.');
      setLoginLoading(false);
      return;
    }
    setLoggedPatientId(patient.id);
    setLoginLoading(false);
    setShowOtp(true);
    setOtpChannel('sms');
    addAuditLog('Portal: Iniciou autenticação OTP', patient.name);
  };

  const handleVerifyOtp = () => {
    if (otpCode.length < 4) {
      setOtpError('Código inválido.');
      return;
    }
    setOtpVerified(true);
    setIsLoggedIn(true);
    setShowOtp(false);
    addAuditLog('Portal: Login autenticado 2FA', loggedPatient?.name || '');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Senhas não conferem.');
      return;
    }
    if (regForm.password.length < 4) {
      setRegError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    setRegLoading(true);

    const newPatient: Patient = {
      id: `pat_portal_${Date.now()}`,
      name: regForm.name,
      email: regForm.email,
      phone: regForm.phone,
      birthdate: regForm.birthdate,
      gender: regForm.gender,
      priority: 'normal',
      status: 'agendado',
      clinicalHistory: [],
      document_type: 'CI',
      document_number: regForm.ci,
    };

    setPatients(prev => [...prev, newPatient]);
    setLoggedPatientId(newPatient.id);
    setRegLoading(false);
    setShowRegister(false);
    setShowOtp(true);
    setOtpChannel('email');
    addAuditLog('Portal: Autocadastro realizado', newPatient.name);
  };

  const handleLogout = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setIsLoggedIn(false);
    setShowOtp(false);
    setOtpVerified(false);
    setLoggedPatientId(null);
    setTab('dashboard');
    addAuditLog('Portal: Logout', loggedPatient?.name || '');
  };

  // ─── Telemedicine ───
  const handleToggleTeleconsultation = useCallback(async () => {
    if (isCallActive) {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
      setIsCallActive(false);
      addAuditLog('Portal: Teleconsulta encerrada', loggedPatient?.name || '');
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsCallActive(true);
      addAuditLog('Portal: Teleconsulta iniciada', loggedPatient?.name || '');
    } catch {
      setIsCallActive(true);
    }
  }, [isCallActive, stream, loggedPatient, addAuditLog]);

  const handleRequestTelemedicine = () => {
    if (!telForm.specialty || !telForm.date || !telForm.time) return;
    setTelLoading(true);
    const doctor = DOCTORS[telForm.specialty]?.[0];
    const newReq: TelemedicineRequest = {
      id: `tel_${Date.now()}`,
      patientId: loggedPatientId || '',
      patientName: loggedPatient?.name || '',
      doctorName: doctor?.name || '',
      specialty: telForm.specialty,
      scheduledDate: telForm.date,
      scheduledTime: telForm.time,
      status: 'solicitado',
      notes: telForm.notes,
      createdAt: new Date().toISOString(),
    };
    setTelemedicineRequests(prev => [newReq, ...prev]);
    setTelLoading(false);
    setTelForm({ specialty: '', doctorId: '', doctorName: '', date: '', time: '', notes: '' });
    setTelemedicineTab('scheduled');
    addAuditLog('Portal: Teleconsulta solicitada', loggedPatient?.name || '');
  };

  // ─── Booking ───
  const handleBookAppointment = () => {
    if (!bookingForm.specialty || !bookingForm.doctorId || !bookingForm.date || !bookingForm.time) return;
    setBookingLoading(true);
    const newApp: Appointment = {
      id: `app_portal_${Date.now()}`,
      patientId: loggedPatientId || '',
      patientName: loggedPatient?.name || '',
      doctorName: bookingForm.doctorName,
      specialty: bookingForm.specialty,
      date: bookingForm.date,
      time: bookingForm.time,
      status: 'agendado',
      modality: bookingForm.modality,
    };
    setAppointments(prev => [...prev, newApp]);
    setBookingLoading(false);
    setBookingSuccess(true);
    setTimeout(() => { setBookingSuccess(false); setShowBookingModal(false); }, 2000);
    addAuditLog('Portal: Consulta agendada', `${loggedPatient?.name} - ${bookingForm.specialty}`);
  };

  const handleCancelAppointment = (appId: string) => {
    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: 'cancelado' } : a));
    setCancelModal(null);
    setCancelReason('');
    addAuditLog('Portal: Consulta cancelada', `${appId} - ${cancelReason}`);
  };

  const handleRescheduleAppointment = (appId: string, newDate: string, newTime: string) => {
    setAppointments(prev => prev.map(a =>
      a.id === appId ? { ...a, date: newDate, time: newTime, status: 'remarcado' } : a
    ));
    addAuditLog('Portal: Consulta remarcada', appId);
  };

  // ─── Payment ───
  const handleMakePayment = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      const txId = `PIX-${Date.now().toString(36).toUpperCase()}`;
      const newPay: OnlinePayment = {
        id: `pay_${Date.now()}`,
        patientId: loggedPatientId || '',
        amount: paymentForm.amount,
        paymentMethod: paymentForm.method as any,
        status: 'confirmed',
        transactionId: txId,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setCustomerPayments(prev => [...prev, newPay]);
      setPaymentProcessing(false);
      setPaymentSuccess(t('portal_payment_success', 'app').replace('{id}', txId));
      setTimeout(() => { setPaymentSuccess(null); setShowPaymentModal(false); }, 3000);
      addAuditLog('Portal: Pagamento on-line', `${paymentForm.amount} - ${txId}`);
    }, 1500);
  };

  // ─── DTE Download ───
  const handleDteDownload = (dte: Dte, format: 'xml' | 'pdf') => {
    addAuditLog('Portal: Download DTE', `${dte.number} (${format})`);
    const content = format === 'xml'
      ? `<?xml version="1.0"?><DTE><number>${dte.number}</number><cdc>${dte.cdc}</cdc><amount>${dte.amount}</amount></DTE>`
      : `DTE: ${dte.number}\nCDC: ${dte.cdc}\nValor: ${dte.amount}`;
    const blob = new Blob([content], { type: format === 'xml' ? 'text/xml' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dte.number}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter/reschedule state for appointments tab
  const [apptFilterStatus, setApptFilterStatus] = useState<string>('all');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const pendingAmount = customerPayments
    .filter(p => p.patientId === loggedPatientId && p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const patientAppointments = appointments.filter(a => a.patientId === loggedPatientId);
  const nextAppointment = patientAppointments
    .filter(a => a.status === 'agendado' || a.status === 'confirmado')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];

  const patientDtes = dtes;
  const unreadNotifications = notifications.filter(n => n.patientId === loggedPatientId && n.status !== 'read');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': case 'reservado': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'confirmado': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'atendido': case 'realizado': case 'concluido': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'cancelado': return 'text-red-600 bg-red-50 border-red-200';
      case 'pendente': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'remarcado': return 'text-violet-600 bg-violet-50 border-violet-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // ─── Login/Register screen ───
  if (!isLoggedIn) {
    return (
      <div className="flex items-start justify-center p-4 md:p-8 min-h-[600px]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-800">{t('portal_welcome', 'app')}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('portal_welcome_desc', 'app')}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {!showRegister ? (
              <>
                <h3 className="text-sm font-bold text-slate-800 mb-4">{t('portal_login_title', 'app')}</h3>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_ci', 'app')}</label>
                    <input type="text" value={loginCi} onChange={e => setLoginCi(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="Ex: 1234567" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t('password', 'login')}</label>
                    <div className="relative mt-1">
                      <input type={showPassword ? 'text' : 'password'} value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs pr-8 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {loginError && (
                    <div className="flex items-center gap-1.5 text-red-600 text-[10px] bg-red-50 p-2 rounded-lg">
                      <AlertCircle className="w-3 h-3" /> {loginError}
                    </div>
                  )}
                  <button type="submit" disabled={loginLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                    {loginLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    {loginLoading ? t('authenticating', 'login') : t('system_admin', 'app')}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => setShowRegister(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold cursor-pointer">
                    {t('portal_register', 'app')}
                  </button>
                </div>
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-medium">{t('demo_mode', 'app')}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Use CI do paciente (ex: 1234567, 9876543) para simular. Qualquer senha com 4+ caracteres.</p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-800 mb-4">{t('portal_register_title', 'app')}</h3>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('patient', 'app')}</label>
                      <input type="text" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_ci', 'app')}</label>
                      <input type="text" value={regForm.ci} onChange={e => setRegForm(p => ({ ...p, ci: e.target.value }))} required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('date_of_birth', 'terms')}</label>
                      <input type="date" value={regForm.birthdate} onChange={e => setRegForm(p => ({ ...p, birthdate: e.target.value }))} required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('address', 'app')}</label>
                      <input type="email" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('phone', 'app')}</label>
                      <input type="tel" value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('password', 'login')}</label>
                      <input type="password" value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_confirm_password', 'app')}</label>
                      <input type="password" value={regForm.confirmPassword} onChange={e => setRegForm(p => ({ ...p, confirmPassword: e.target.value }))} required
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  {regError && (
                    <div className="flex items-center gap-1.5 text-red-600 text-[10px] bg-red-50 p-2 rounded-lg">
                      <AlertCircle className="w-3 h-3" /> {regError}
                    </div>
                  )}
                  <button type="submit" disabled={regLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                    {regLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {regLoading ? 'Registrando...' : t('portal_register', 'app')}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => setShowRegister(false)}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold cursor-pointer">
                    Já tenho conta — Entrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* OTP Modal */}
        {showOtp && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <div className="text-center mb-4">
                <ShieldCheck className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">{t('portal_otp_title', 'app')}</h3>
                <p className="text-[10px] text-slate-500 mt-1">{t('portal_otp_desc', 'app').replace('{channel}', otpChannel === 'sms' ? 'SMS' : 'e-mail')}</p>
              </div>
              <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full p-3 text-center text-lg font-bold tracking-widest border border-slate-200 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="000000" maxLength={6} />
              {otpError && <p className="text-[10px] text-red-600 mb-2">{otpError}</p>}
              <button onClick={handleVerifyOtp}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer">
                {t('portal_otp_verify', 'app')}
              </button>
              <div className="flex justify-between mt-3">
                <button onClick={() => setOtpChannel(otpChannel === 'sms' ? 'email' : 'sms')}
                  className="text-[10px] text-indigo-600 font-medium cursor-pointer">
                  {t('portal_otp_resend', 'app')} via {otpChannel === 'sms' ? 'E-mail' : 'SMS'}
                </button>
                <button onClick={() => { setShowOtp(false); setIsLoggedIn(true); setOtpVerified(true); }}
                  className="text-[10px] text-slate-400 font-medium cursor-pointer">
                  Pular (Demo)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Portal Dashboard ───
  const navTabs: { id: PortalTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: t('portal_tab_dashboard', 'app'), icon: Home },
    { id: 'appointments', label: t('portal_tab_appointments', 'app'), icon: CalendarDays },
    { id: 'history', label: t('portal_tab_history', 'app'), icon: ClipboardList },
    { id: 'prescriptions', label: t('portal_tab_prescriptions', 'app'), icon: Pill },
    { id: 'exams', label: t('portal_tab_exams', 'app'), icon: Microscope },
    { id: 'dtes', label: t('portal_tab_dtes', 'app'), icon: Receipt },
    { id: 'payments', label: t('portal_tab_payments', 'app'), icon: CreditCard },
    { id: 'telemedicine', label: t('portal_tab_telemedicine', 'app'), icon: Video },
    { id: 'notifications', label: t('portal_tab_notifications', 'app'), icon: Bell },
    { id: 'profile', label: t('portal_tab_profile', 'app'), icon: User },
  ];

  const renderTabContent = () => {
    switch (tab) {
      case 'dashboard': return renderDashboard();
      case 'appointments': return renderAppointments();
      case 'history': return renderHistory();
      case 'prescriptions': return renderPrescriptions();
      case 'exams': return renderExams();
      case 'dtes': return renderDtes();
      case 'payments': return renderPayments();
      case 'telemedicine': return renderTelemedicine();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  // ═══════════════ DASHBOARD ═══════════════
  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-800">{t('portal_welcome', 'app')}, {loggedPatient?.name?.split(' ')[0]}!</h2>
        <p className="text-xs text-slate-500">{t('portal_welcome_desc', 'app')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-indigo-200" />
            <span className="text-[10px] font-bold uppercase text-indigo-200">{t('portal_next_appointment', 'app')}</span>
          </div>
          {nextAppointment ? (
            <div>
              <p className="font-bold text-sm">{nextAppointment.specialty}</p>
              <p className="text-indigo-100 text-xs">{nextAppointment.doctorName}</p>
               <p className="text-white font-black text-lg mt-1">{nextAppointment.date} às {normalizeTime(nextAppointment.time)}</p>
              {nextAppointment.modality === 'Virtual' && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-400/30 text-indigo-100 px-2 py-0.5 rounded-full mt-1">
                  <Video className="w-2.5 h-2.5" /> Telemedicina
                </span>
              )}
            </div>
          ) : (
            <p className="text-indigo-200 text-xs">{t('portal_no_appointments', 'app')}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase text-slate-500">{t('portal_balance_due', 'app')}</span>
          </div>
          <p className="text-2xl font-black text-slate-800">R$ {pendingAmount.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{customerPayments.filter(p => p.patientId === loggedPatientId && p.status === 'pending').length} {t('portal_pending_payments', 'app')}</p>
          {pendingAmount > 0 && (
            <button onClick={() => { setPaymentForm({ method: 'pix', amount: pendingAmount }); setShowPaymentModal(true); }}
              className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer">
              {t('portal_make_payment', 'app')}
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] font-bold uppercase text-slate-500">{t('portal_unread_notifications', 'app')}</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{unreadNotifications.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">{t('portal_tab_notifications', 'app')}</p>
          {unreadNotifications.length > 0 && (
            <button onClick={() => setTab('notifications')}
              className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer">
              {t('portal_tab_notifications', 'app')}
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-700 mb-3">{t('portal_quick_actions', 'app')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: CalendarDays, label: t('portal_schedule', 'app'), action: () => setShowBookingModal(true), color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
            { icon: Video, label: t('portal_teleconsult', 'app'), action: () => setTab('telemedicine'), color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
            { icon: ClipboardList, label: t('portal_view_history', 'app'), action: () => setTab('history'), color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
            { icon: Download, label: t('portal_download_dte', 'app'), action: () => setTab('dtes'), color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
          ].map((item, idx) => (
            <button key={idx} onClick={item.action}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-100 ${item.color} transition cursor-pointer text-left`}>
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-[11px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">{t('portal_app_download', 'app')}</h3>
            <p className="text-xs text-slate-300 mt-1">{t('portal_app_download_desc', 'app')}</p>
            <div className="flex gap-2 mt-3">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-[10px] font-medium">
                <SmartphoneIcon className="w-3.5 h-3.5" /> Google Play
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-[10px] font-medium">
                <SmartphoneIcon className="w-3.5 h-3.5" /> App Store
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-[10px] font-medium">
                <Monitor className="w-3.5 h-3.5" /> PWA
              </span>
            </div>
          </div>
          <QrCode className="w-20 h-20 text-white/30" />
        </div>
      </div>
    </div>
  );

  // ═══════════════ APPOINTMENTS ═══════════════
  const renderAppointments = () => {
    const filtered = patientAppointments.filter(a => {
      if (apptFilterStatus === 'all') return true;
      if (apptFilterStatus === 'scheduled') return a.status === 'agendado' || a.status === 'confirmado';
      if (apptFilterStatus === 'completed') return a.status === 'atendido';
      if (apptFilterStatus === 'cancelled') return a.status === 'cancelado';
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800">{t('portal_my_appointments', 'app')}</h2>
            <p className="text-xs text-slate-500">{patientAppointments.length} consulta(s)</p>
          </div>
          <button onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> {t('portal_new_appointment', 'app')}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: t('portal_filter_all', 'app') },
            { id: 'scheduled', label: t('portal_filter_scheduled', 'app') },
            { id: 'completed', label: t('portal_filter_completed', 'app') },
            { id: 'cancelled', label: t('portal_filter_cancelled', 'app') },
          ].map(f => (
            <button key={f.id} onClick={() => setApptFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition ${apptFilterStatus === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">{t('portal_no_appointments', 'app')}</p>
            </div>
          ) : filtered.map(app => (
            <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{app.specialty}</p>
                    <p className="text-xs text-slate-500">{app.doctorName}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Calendar className="w-3 h-3" /> {app.date}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" /> {normalizeTime(app.time)}
                      </span>
                      {app.modality === 'Virtual' && (
                        <span className="flex items-center gap-1 text-[10px] text-purple-600">
                          <Video className="w-3 h-3" /> {t('portal_modality_virtual', 'app')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(app.status)}`}>
                  {app.status}
                </span>
              </div>
              {(app.status === 'agendado' || app.status === 'confirmado') && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => setCancelModal(app.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-100 cursor-pointer">
                    <X className="w-3 h-3" /> {t('portal_cancel_appointment', 'app')}
                  </button>
                  <button onClick={() => { setRescheduleId(app.id); setRescheduleDate(app.date); setRescheduleTime(app.time); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[10px] font-bold hover:bg-amber-100 cursor-pointer">
                    <RefreshCw className="w-3 h-3" /> {t('portal_reschedule', 'app')}
                  </button>
                </div>
              )}
              {rescheduleId === app.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <input type="date" value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    className="flex-1 p-1.5 border border-slate-200 rounded-lg text-[10px]" />
                  <select value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                    className="flex-1 p-1.5 border border-slate-200 rounded-lg text-[10px]">
                    <option value="">Horário</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => { handleRescheduleAppointment(app.id, rescheduleDate, rescheduleTime); setRescheduleId(null); }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold cursor-pointer">
                    {t('portal_reschedule', 'app')}
                  </button>
                  <button onClick={() => setRescheduleId(null)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Cancel Modal */}
        {cancelModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-sm font-bold text-slate-800 mb-2">{t('portal_cancel_confirm', 'app')}</h3>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-2 focus:ring-2 focus:ring-red-500 outline-none"
                placeholder={t('portal_cancel_reason', 'app')} rows={3} />
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleCancelAppointment(cancelModal)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer">
                  {t('portal_cancel_appointment', 'app')}
                </button>
                <button onClick={() => setCancelModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg cursor-pointer">
                  {t('cancel', 'app')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════ CLINICAL HISTORY ═══════════════
  const renderHistory = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-800">{t('portal_clinical_history', 'app')}</h2>
        <p className="text-xs text-slate-500">{t('portal_clinical_history_desc', 'app')}</p>
      </div>
      {loggedPatient && loggedPatient.clinicalHistory && loggedPatient.clinicalHistory.length > 0 ? (
        <div className="space-y-2">
          {loggedPatient.clinicalHistory.map((entry, idx) => (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-slate-800">{entry.type}</p>
                    <span className="text-[10px] text-slate-400">{entry.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{entry.doctor}</p>
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-600">Diagnóstico: <span className="font-normal text-slate-500">{entry.diagnosis}</span></p>
                    {entry.cid10 && <p className="text-[10px] text-slate-400 mt-0.5">CID-10: {entry.cid10}</p>}
                    {entry.notes && <p className="text-[10px] text-slate-500 mt-1 italic">{entry.notes}</p>}
                    {entry.prescriptions.length > 0 && (
                      <div className="mt-1.5">
                        <p className="text-[10px] font-bold text-slate-600">Prescrições:</p>
                        <ul className="list-disc pl-4 text-[10px] text-slate-500">
                          {entry.prescriptions.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium">{t('hce_tab_timeline')}</p>
        </div>
      )}
    </div>
  );

  // ═══════════════ PRESCRIPTIONS ═══════════════
  const renderPrescriptions = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-800">{t('portal_prescriptions', 'app')}</h2>
        <p className="text-xs text-slate-500">{t('portal_prescriptions_desc', 'app')}</p>
      </div>
      {loggedPatient && loggedPatient.clinicalHistory && loggedPatient.clinicalHistory.some(c => c.prescriptions.length > 0) ? (
        <div className="space-y-2">
          {loggedPatient.clinicalHistory.filter(c => c.prescriptions.length > 0).map(entry => (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800">{entry.date} — {entry.type}</p>
                  <p className="text-xs text-slate-500">{entry.doctor}</p>
                  <div className="mt-2 space-y-1.5">
                    {entry.prescriptions.map((rx, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2">
                          <Pill className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span className="text-[11px] font-medium text-slate-700">{rx}</span>
                        </div>
                        <button className="flex items-center gap-1 text-[9px] text-green-600 font-bold hover:text-green-700 cursor-pointer">
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <Pill className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium">Nenhuma receita disponível.</p>
        </div>
      )}
    </div>
  );

  // ═══════════════ EXAMS ═══════════════
  const renderExams = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-800">{t('portal_exam_results', 'app')}</h2>
        <p className="text-xs text-slate-500">{t('portal_exam_results_desc', 'app')}</p>
      </div>
      <div className="text-center py-12 text-slate-400">
        <Microscope className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-xs font-medium">{t('hce_exam_solicitado')}</p>
      </div>
    </div>
  );

  // ═══════════════ DTES ═══════════════
  const renderDtes = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-800">{t('portal_dte_title', 'app')}</h2>
        <p className="text-xs text-slate-500">{t('portal_dte_desc', 'app')}</p>
      </div>
      {patientDtes.length > 0 ? (
        <div className="space-y-2">
          {patientDtes.map(dte => (
            <div key={dte.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">DTE Nº {dte.number}</p>
                    <p className="text-[10px] text-slate-500">CDC: {dte.cdc} | Valor: R$ {dte.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">{dte.type || 'Fatura'}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleDteDownload(dte, 'xml')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-[9px] font-bold hover:bg-indigo-100 cursor-pointer">
                    <Download className="w-3 h-3" /> XML
                  </button>
                  <button onClick={() => handleDteDownload(dte, 'pdf')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[9px] font-bold hover:bg-amber-100 cursor-pointer">
                    <FileText className="w-3 h-3" /> PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium">{t('portal_no_dtes', 'app')}</p>
        </div>
      )}
    </div>
  );

  // ═══════════════ PAYMENTS ═══════════════
  const renderPayments = () => {
    const history = customerPayments.filter(p => p.patientId === loggedPatientId);
    const pending = history.filter(p => p.status === 'pending');
    const confirmed = history.filter(p => p.status === 'confirmed');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800">{t('portal_payment_title', 'app')}</h2>
            <p className="text-xs text-slate-500">{t('portal_payment_desc', 'app')}</p>
          </div>
          {pending.length > 0 && (
            <button onClick={() => { setPaymentForm({ method: 'pix', amount: pending.reduce((s, p) => s + p.amount, 0) }); setShowPaymentModal(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer">
              <DollarSign className="w-3.5 h-3.5" /> {t('portal_make_payment', 'app')}
            </button>
          )}
        </div>

        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-amber-800 mb-2">{t('portal_pending_payments', 'app')}</h3>
            {pending.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5">
                <span className="text-[11px] text-amber-700">{p.referenceType}: R$ {p.amount.toFixed(2)}</span>
                <span className="text-[10px] text-amber-600 font-medium">{p.paymentMethod}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-amber-200">
              <span className="text-xs font-bold text-amber-800">{t('portal_balance_due', 'app')}:</span>
              <span className="text-sm font-black text-amber-800">R$ {pending.reduce((s, p) => s + p.amount, 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {confirmed.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-2">Histórico de Pagamentos</h3>
            <div className="space-y-1.5">
              {confirmed.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-700">R$ {p.amount.toFixed(2)} — {p.paymentMethod}</p>
                      <p className="text-[9px] text-slate-400">Tx: {p.transactionId} | {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{t('portal_status_completed', 'app')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && confirmed.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">{t('portal_no_payments', 'app')}</p>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-sm font-bold text-slate-800 mb-4">{t('portal_payment_title', 'app')}</h3>
              {paymentSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-xs text-emerald-700 font-medium">{paymentSuccess}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_payment_method', 'app')}</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {PAYMENT_METHODS.map(m => (
                          <button key={m.value} onClick={() => setPaymentForm(p => ({ ...p, method: m.value }))}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-[10px] font-bold cursor-pointer transition ${paymentForm.method === m.value ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <m.icon className="w-3.5 h-3.5" /> {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_payment_amount', 'app')}</label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                        <input type="number" step="0.01" value={paymentForm.amount}
                          onChange={e => setPaymentForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-2.5 pl-9 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                    </div>
                  </div>
                  <button onClick={handleMakePayment} disabled={paymentProcessing || paymentForm.amount <= 0}
                    className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                    {paymentProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    {paymentProcessing ? t('portal_payment_processing', 'app') : t('portal_pay', 'app')}
                  </button>
                  <button onClick={() => { setShowPaymentModal(false); setPaymentSuccess(null); }}
                    className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg cursor-pointer">
                    {t('cancel', 'app')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════ TELEMEDICINE ═══════════════
  const renderTelemedicine = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800">{t('portal_telemedicine_title', 'app')}</h2>
          <p className="text-xs text-slate-500">{t('portal_telemedicine_desc', 'app')}</p>
        </div>
        <button onClick={() => setTelemedicineTab(tab => tab === 'scheduled' ? 'request' : 'scheduled')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg cursor-pointer">
          {telemedicineTab === 'scheduled' ? <Plus className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          {telemedicineTab === 'scheduled' ? t('portal_telemedicine_request', 'app') : t('portal_telemedicine_title', 'app')}
        </button>
      </div>

      {telemedicineTab === 'scheduled' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-700">Teleconsultas Agendadas</h3>
              {telemedicineRequests.filter(r => r.patientId === loggedPatientId).length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-200">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">{t('portal_telemedicine_no_requests', 'app')}</p>
                </div>
              ) : (
                telemedicineRequests.filter(r => r.patientId === loggedPatientId).map(req => (
                  <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-xs text-slate-800">{req.doctorName}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{req.specialty}</p>
                     <p className="text-[10px] text-slate-400">{req.scheduledDate} às {normalizeTime(req.scheduledTime)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${req.status === 'confirmado' ? 'bg-green-50 text-green-700' : req.status === 'solicitado' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
                        {req.status}
                      </span>
                      {(req.status === 'confirmado') && (
                        <button onClick={() => handleToggleTeleconsultation()}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-lg text-[9px] font-bold cursor-pointer">
                          <Video className="w-3 h-3" /> {t('portal_telemedicine_enter', 'app')}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="lg:col-span-2">
              {isCallActive ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-bold text-teal-400">TELEMEDICINA — CONSULTA ATIVA</span>
                    </div>
                    <button onClick={handleToggleTeleconsultation}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer">
                      <X className="w-3 h-3" /> Encerrar
                    </button>
                  </div>
                  <div className="relative bg-slate-950 min-h-[320px] flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1] max-h-[320px]" />
                    {!stream && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <Video className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-xs font-medium">Sala Virtual Ativa</p>
                        <p className="text-[10px] text-slate-600">Comunicação segura ponto-a-ponto</p>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 w-20 h-28 bg-slate-900 border-2 border-white rounded-lg overflow-hidden shadow-md">
                      <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200" alt="Médico" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-[8px] text-white text-center">Médico(a)</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[320px]">
                  <Video className="w-14 h-14 text-slate-300 mb-3" />
                  <h4 className="font-bold text-sm text-slate-700">Sala de Telemedicina</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Suas videochamadas são criptografadas de ponta a ponta. Clique em &ldquo;Entrar na Sala&rdquo; para iniciar.
                  </p>
                  <button onClick={handleToggleTeleconsultation}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer">
                    <Video className="w-4 h-4" /> Simular Chamada
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-lg">
          <h3 className="text-sm font-bold text-slate-800 mb-4">{t('portal_telemedicine_request', 'app')}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_select_specialty', 'app')}</label>
              <select value={telForm.specialty} onChange={e => {
                const doctors = DOCTORS[e.target.value] || [];
                setTelForm(p => ({ ...p, specialty: e.target.value, doctorId: doctors[0]?.id || '', doctorName: doctors[0]?.name || '' }));
              }}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-purple-500 outline-none">
                <option value="">Selecionar...</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {telForm.doctorName && (
              <div className="flex items-center gap-2 p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                <User className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">{telForm.doctorName}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_select_date', 'app')}</label>
                <input type="date" value={telForm.date} onChange={e => setTelForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_select_time', 'app')}</label>
                <select value={telForm.time} onChange={e => setTelForm(p => ({ ...p, time: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">Horário</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">{t('crm_descricao')}</label>
              <textarea value={telForm.notes} onChange={e => setTelForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-purple-500 outline-none" rows={2} />
            </div>
            <button onClick={handleRequestTelemedicine} disabled={telLoading || !telForm.specialty || !telForm.date || !telForm.time}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg disabled:opacity-50 cursor-pointer">
              {telLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : t('portal_telemedicine_request', 'app')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ═══════════════ NOTIFICATIONS ═══════════════
  const renderNotifications = () => {
    const patientNotifs = notifications.filter(n => n.patientId === loggedPatientId);

    const markAsRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n));
    };

    const getNotifIcon = (type: string) => {
      switch (type) {
        case 'appointment_reminder': return CalendarDays;
        case 'exam_result': return Microscope;
        case 'prescription': return Pill;
        case 'payment': return DollarSign;
        case 'telemedicine': return Video;
        case 'vaccination': return Syringe;
        default: return Bell;
      }
    };

    const getNotifColor = (type: string) => {
      switch (type) {
        case 'appointment_reminder': return 'bg-blue-50 text-blue-600 border-blue-200';
        case 'exam_result': return 'bg-teal-50 text-teal-600 border-teal-200';
        case 'prescription': return 'bg-green-50 text-green-600 border-green-200';
        case 'payment': return 'bg-amber-50 text-amber-600 border-amber-200';
        case 'telemedicine': return 'bg-purple-50 text-purple-600 border-purple-200';
        case 'vaccination': return 'bg-rose-50 text-rose-600 border-rose-200';
        default: return 'bg-slate-50 text-slate-600 border-slate-200';
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-800">{t('portal_notifications_title', 'app')}</h2>
          <p className="text-xs text-slate-500">{t('portal_notifications_desc', 'app')}</p>
        </div>
        {patientNotifs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">{t('portal_notifications_empty', 'app')}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {patientNotifs.map(n => {
              const Icon = getNotifIcon(n.type);
              return (
                <div key={n.id} className={`bg-white border rounded-xl p-3.5 flex items-start gap-3 transition ${n.status !== 'read' ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${getNotifColor(n.type)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`text-xs ${n.status !== 'read' ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{n.title}</p>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[9px] text-slate-400">{n.sentAt ? new Date(n.sentAt).toLocaleDateString() : ''}</span>
                        {n.status !== 'read' && (
                          <button onClick={() => markAsRead(n.id)}
                            className="text-[9px] text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer" title={t('portal_mark_read', 'app')}>
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {n.body && <p className="text-[10px] text-slate-500 mt-0.5">{n.body}</p>}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[8px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{n.channel}</span>
                      <span className="text-[8px] text-slate-400">{n.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════ PROFILE ═══════════════
  const renderProfile = () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-black text-slate-800">{t('portal_profile_title', 'app')}</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" /> {t('portal_profile_personal', 'app')}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {[
            { label: t('patient', 'app'), value: loggedPatient?.name },
            { label: t('address', 'app'), value: loggedPatient?.email },
            { label: t('phone', 'app'), value: loggedPatient?.phone },
            { label: t('date_of_birth', 'terms'), value: loggedPatient?.birthdate },
            { label: 'Gênero', value: loggedPatient?.gender },
            { label: t('id_document', 'terms'), value: loggedPatient?.document_number ? `${loggedPatient?.document_type || 'CI'}: ${loggedPatient?.document_number}` : '-' },
          ].map((item, idx) => (
            <div key={idx}>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">{item.value || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" /> {t('portal_profile_security', 'app')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-700">{t('portal_two_factor', 'app')}</p>
              <p className="text-[10px] text-slate-500">{t('portal_two_factor_desc', 'app')}</p>
            </div>
            <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[9px] font-bold">{t('portal_connected', 'app')}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-700">{t('password', 'login')}</p>
              <p className="text-[10px] text-slate-500">••••••••</p>
            </div>
            <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-[9px] font-bold hover:bg-indigo-100 cursor-pointer">
              {t('portal_change_password', 'app')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" /> {t('portal_profile_consents', 'app')}
        </h3>
        <div className="space-y-2">
          {[
            { title: t('portal_terms', 'app'), granted: true, date: '01/01/2026' },
            { title: t('portal_privacy', 'app'), granted: true, date: '01/01/2026' },
            { title: 'Compartilhamento de Dados', granted: false, date: '-' },
            { title: 'Comunicações de Marketing', granted: true, date: '01/01/2026' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-600">{item.title}</span>
              <span className={`text-[9px] font-bold flex items-center gap-1 ${item.granted ? 'text-green-600' : 'text-red-400'}`}>
                {item.granted ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {item.granted ? 'Aceito' : 'Recusado'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleLogout}
        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 cursor-pointer">
        <LogOut className="w-4 h-4" /> {t('portal_logout', 'app')}
      </button>
    </div>
  );

  // ═══════════════ BOOKING MODAL ═══════════════
  const renderBookingModal = () => {
    if (!showBookingModal) return null;
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">{t('portal_appointment_modal', 'app')}</h3>
            <button onClick={() => { setShowBookingModal(false); setBookingSuccess(false); }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {bookingSuccess ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-emerald-700">{t('portal_booking_success', 'app')}</p>
              <button onClick={() => { setShowBookingModal(false); setBookingSuccess(false); }}
                className="mt-4 px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold cursor-pointer">
                {t('back_to_portal', 'app')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_select_specialty', 'app')}</label>
                <select value={bookingForm.specialty} onChange={e => {
                  const doctors = DOCTORS[e.target.value] || [];
                  setBookingForm(p => ({ ...p, specialty: e.target.value, doctorId: doctors[0]?.id || '', doctorName: doctors[0]?.name || '' }));
                }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Selecionar...</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {bookingForm.specialty && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_select_doctor', 'app')}</label>
                  <div className="mt-1 space-y-1">
                    {(DOCTORS[bookingForm.specialty] || []).map(d => (
                      <div key={d.id}
                        className={`p-2.5 border rounded-lg text-xs cursor-pointer transition ${bookingForm.doctorId === d.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => setBookingForm(p => ({ ...p, doctorId: d.id, doctorName: d.name }))}>
                        <User className="w-3.5 h-3.5 inline mr-1.5" /> {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_select_date', 'app')}</label>
                  <input type="date" value={bookingForm.date}
                    onChange={e => setBookingForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_select_time', 'app')}</label>
                  <select value={bookingForm.time}
                    onChange={e => setBookingForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">{t('portal_select_time', 'app')}</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">{t('portal_select_modality', 'app')}</label>
                <div className="flex gap-2 mt-1">
                  {[
                    { id: 'Presencial', label: t('portal_modality_presential', 'app'), icon: MapPin },
                    { id: 'Virtual', label: t('portal_modality_virtual', 'app'), icon: Video },
                  ].map(m => (
                    <button key={m.id} onClick={() => setBookingForm(p => ({ ...p, modality: m.id as 'Presencial' | 'Virtual' }))}
                      className={`flex items-center gap-1.5 flex-1 p-2.5 border rounded-lg text-[10px] font-bold cursor-pointer transition ${bookingForm.modality === m.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <m.icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleBookAppointment} disabled={bookingLoading || !bookingForm.specialty || !bookingForm.doctorId || !bookingForm.date || !bookingForm.time}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                {bookingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                {bookingLoading ? t('syncing', 'app') : t('create_appointment', 'app')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 md:p-5">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-sm text-slate-800">IAMED Paciente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-medium">{loggedPatient?.name?.split(' ')[0]}</span>
          <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
            {loggedPatient?.name?.charAt(0) || 'P'}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Sidebar Nav */}
        <div className="w-56 shrink-0 hidden md:block">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sticky top-4 shadow-sm">
            <div className="flex items-center gap-2.5 p-2.5 mb-3 border-b border-slate-100">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-800">IAMED Paciente</p>
                <p className="text-[9px] text-slate-400">{loggedPatient?.name}</p>
              </div>
            </div>
            <nav className="space-y-0.5">
              {navTabs.map(nav => {
                const NavIcon = nav.icon;
                const isActive = tab === nav.id;
                const hasUnread = nav.id === 'notifications' && unreadNotifications.length > 0;
                return (
                  <button key={nav.id} onClick={() => setTab(nav.id)}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <NavIcon className="w-4 h-4 shrink-0" />
                    <span>{nav.label}</span>
                    {hasUnread && (
                      <span className="ml-auto w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-[10px] font-bold text-red-600 hover:bg-red-50 transition cursor-pointer">
                <LogOut className="w-3.5 h-3.5" /> {t('portal_logout', 'app')}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden">
          <div className="flex overflow-x-auto">
            {navTabs.slice(0, 5).map(nav => {
              const NavIcon = nav.icon;
              const isActive = tab === nav.id;
              const hasUnread = nav.id === 'notifications' && unreadNotifications.length > 0;
              return (
                <button key={nav.id} onClick={() => setTab(nav.id)}
                  className={`flex flex-col items-center gap-0.5 flex-1 py-2 text-[8px] font-medium transition cursor-pointer ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <div className="relative">
                    <NavIcon className="w-4 h-4" />
                    {hasUnread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 text-white rounded-full text-[6px] flex items-center justify-center font-bold">{unreadNotifications.length}</span>}
                  </div>
                  <span className="truncate max-w-[60px]">{nav.label}</span>
                </button>
              );
            })}
            <button onClick={() => setTab('profile')}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 text-[8px] font-medium cursor-pointer ${tab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pb-20 md:pb-0">
          {renderTabContent()}
        </div>
      </div>

      {renderBookingModal()}
    </div>
  );
}
