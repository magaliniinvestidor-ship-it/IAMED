'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import {
  Patient, Appointment, Bed, AuditLog, FinancialPosting, StockItem, AsoExam, Dte, Professional,
  FeeSchedule, InsuranceCompany, PreAuthorization, BatchInvoice, EligibilityCheck,
  ProfessionalSettlement, ForeignBilling, AccountPayable, AccountReceivable, CashFlowProjection,
  BankReconciliation, CostCenter, IncomeStatement, TaxCalculation, PurchaseBookEntry,
  SalesBookEntry, ExchangeRate, ChartOfAccount, AccountingEntry,
  initialPatients, initialAppointments, initialBeds, initialLogs,
  initialFinance, initialStock, initialAsos, initialDtes, initialProfessionals,
  initialInsurances, initialFeeSchedules, initialPreAuthorizations, initialBatchInvoices,
  initialEligibilityChecks, initialSettlements, initialForeignBillings,
  initialAccountsPayable, initialAccountsReceivable, initialCashFlows,
  initialBankReconciliations, initialCostCenters, initialIncomeStatements,
  initialTaxCalculations, initialPurchaseBook, initialSalesBook,
  initialExchangeRates, initialChartOfAccounts, initialAccountingEntries
} from '@/lib/mockData';

// Modular Component Screens
import ReceptionModule from '@/components/ReceptionModule';
import ClinicalModule from '@/components/ClinicalModule';
import DiagnosticModule from '@/components/DiagnosticModule';
import AdminFinanceModule from '@/components/AdminFinanceModule';
import CrmBiModule from '@/components/CrmBiModule';

// i18n Context
import { I18nProvider, useI18n } from '@/lib/i18n/I18nContext';

// ShadCN Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons
import {
  Users2, CalendarDays, ClipboardList, Microscope, Receipt,
  TrendingUp, Pill, HeartPulse, ShieldAlert, Megaphone,
  BedDouble, BarChart3, Smartphone, Settings, ArrowLeft,
  Bell, HelpCircle, Info, ShieldCheck,
  Eye, EyeOff, Loader2, LogOut, Globe, ChevronDown,
  Building2, Hash, AlertCircle, Send, Wifi, Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type UserProfile = {
  id: string;
  name: string;
  role: string;
};

export default function Home() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}

function HomeContent() {
  const { locale, setLocale, t } = useI18n();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const LANGUAGES = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷', term: 'Celular / Tela' },
    { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹', term: 'Telemóvel / Ecrã' },
    { code: 'es-AR', name: 'Español (Argentina)', flag: '🇦🇷', term: 'Celular / Pantalla' },
    { code: 'es-PY', name: 'Español (Paraguay)', flag: '🇵🇾', term: 'Celular / Cédula' },
    { code: 'es', name: 'Español (Geral)', flag: '🇪🇸', term: 'Móvil / Pantalla' },
    { code: 'en', name: 'English (US/UK)', flag: '🇺🇸', term: 'Mobile / Screen' }
  ] as const;

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  // Session / Auth States
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core Global States (populated from Supabase)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [finance, setFinance] = useState<FinancialPosting[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [asos, setAsos] = useState<AsoExam[]>([]);
  const [dtes, setDtes] = useState<Dte[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [insurances, setInsurances] = useState<InsuranceCompany[]>([]);
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>([]);
  const [preAuthorizations, setPreAuthorizations] = useState<PreAuthorization[]>([]);
  const [batchInvoices, setBatchInvoices] = useState<BatchInvoice[]>([]);
  const [eligibilityChecks, setEligibilityChecks] = useState<EligibilityCheck[]>([]);
  const [settlements, setSettlements] = useState<ProfessionalSettlement[]>([]);
  const [foreignBillings, setForeignBillings] = useState<ForeignBilling[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlowProjection[]>([]);
  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<IncomeStatement[]>([]);
  const [taxCalculations, setTaxCalculations] = useState<TaxCalculation[]>([]);
  const [purchaseBook, setPurchaseBook] = useState<PurchaseBookEntry[]>([]);
  const [salesBook, setSalesBook] = useState<SalesBookEntry[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Router States
  const [activeSubmodule, setActiveSubmodule] = useState<number | null>(null);

  // Security Role — fallback if no profile table yet
  const [activeOperator, setActiveOperator] = useState('Operador');
  const [activeRole, setActiveRole] = useState('Usuário');

  // Panel states
  const [showLogDropdown, setShowLogDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // ──────────────────────────────────────────────
  // 1. Auth listener
  // ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ──────────────────────────────────────────────
  // 2. Load profile once session is available
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data as UserProfile);
        setActiveOperator(data.name);
        setActiveRole(data.role);
      } else {
        // Fallback: use email prefix as operator name
        const emailName = session.user.email?.split('@')[0] || 'Operador';
        setActiveOperator(emailName);
        setActiveRole('Usuário');
      }
    };

    loadProfile();
  }, [session]);

  // ──────────────────────────────────────────────
  // 3. Load all data once logged in
  // ──────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [patientsRes, appointmentsRes, bedsRes, logsRes, financeRes, stockRes, asosRes, dtesRes, professionalsRes] = await Promise.all([
        supabase.from('patients').select('*, clinical_history(*)').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').order('date', { ascending: true }),
        supabase.from('beds').select('*').order('name'),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('financial_postings').select('*').order('date', { ascending: false }),
        supabase.from('stock_items').select('*').order('name', { ascending: true }),
        supabase.from('aso_exams').select('*').order('date', { ascending: false }),
        supabase.from('dtes').select('*').order('created_at', { ascending: false }),
        supabase.from('professionals').select('*').order('name', { ascending: true }),
      ]);

      const hasError = !!(
        patientsRes.error || appointmentsRes.error || bedsRes.error ||
        logsRes.error || financeRes.error || stockRes.error || asosRes.error ||
        dtesRes.error || professionalsRes.error
      );

      if (patientsRes.data && !patientsRes.error) {
        const mapped = patientsRes.data.map((p: any) => ({
          ...p,
          clinicalHistory: (p.clinical_history || []).map((h: any) => ({
            id: h.id,
            date: h.date,
            type: h.type,
            diagnosis: h.diagnosis || '',
            cid10: h.cid10 || '',
            prescriptions: h.prescriptions || [],
            notes: h.notes,
            doctor: h.doctor,
          })),
        }));
        setPatients(mapped);
      } else {
        setPatients(initialPatients);
      }

      if (appointmentsRes.data && !appointmentsRes.error) {
        const mapped = appointmentsRes.data.map((a: any) => ({
          ...a,
          patientId: a.patient_id,
          patientName: a.patient_name,
          doctorName: a.doctor_name,
        }));
        setAppointments(mapped);
      } else {
        setAppointments(initialAppointments);
      }

      if (bedsRes.data && !bedsRes.error) {
        const mapped = bedsRes.data.map((b: any) => ({
          ...b,
          patientName: b.patient_name,
          entryDate: b.entry_date,
        }));
        setBeds(mapped);
      } else {
        setBeds(initialBeds);
      }

      if (logsRes.data && !logsRes.error) {
        const mapped = logsRes.data.map((l: any) => ({
          ...l,
          timestamp: typeof l.timestamp === 'string'
            ? l.timestamp.replace('T', ' ').substring(0, 16)
            : l.timestamp,
        }));
        setLogs(mapped);
      } else {
        setLogs(initialLogs);
      }

      if (financeRes.data && !financeRes.error) {
        const mapped = financeRes.data.map((p: any) => ({
          id: p.id,
          description: p.description,
          type: p.type as 'receita' | 'despesa',
          amount: Number(p.amount),
          category: p.category,
          date: p.date,
        }));
        setFinance(mapped);
      } else {
        setFinance(initialFinance);
      }

      if (stockRes.data && !stockRes.error) {
        const mapped = stockRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          quantity: Number(s.quantity),
          minQuantity: Number(s.min_quantity),
          unit: s.unit,
        }));
        setStock(mapped);
      } else {
        setStock(initialStock);
      }

      if (asosRes.data && !asosRes.error) {
        const mapped = asosRes.data.map((aso: any) => ({
          id: aso.id,
          patientName: aso.patient_name,
          type: aso.type as 'Admissional' | 'Periódico' | 'Demissional',
          risks: aso.risks || [],
          status: aso.status as 'apto' | 'inapto',
          date: aso.date,
          doctor: aso.doctor,
        }));
        setAsos(mapped);
      } else {
        setAsos(initialAsos);
      }

      // Load DTEs
      if (dtesRes.data && !dtesRes.error) {
        const mapped = dtesRes.data.map((d: any) => ({
          ...d,
          items: d.items || [],
        }));
        setDtes(mapped);
      } else {
        setDtes(initialDtes);
      }

      // Load professionals from Supabase
      if (professionalsRes.data && !professionalsRes.error) {
        const mapped = professionalsRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          specialty: p.specialty,
          council: p.council,
          councilNumber: p.council_number,
          shift: p.shift,
          email: p.email,
          phone: p.phone,
          status: p.status,
          admissionDate: p.admission_date,
          color: p.color,
          permissions: p.permissions || [],
        }));
        setProfessionals(mapped);
      } else {
        setProfessionals(initialProfessionals);
      }

      setIsDbConnected(!hasError);
    } catch (err) {
      console.warn("Failing to load from Supabase database. Falling back to mock data.", err);
      setIsDbConnected(false);
      setPatients(initialPatients);
      setAppointments(initialAppointments);
      setBeds(initialBeds);
      setLogs(initialLogs);
      setFinance(initialFinance);
      setStock(initialStock);
      setAsos(initialAsos);
      setDtes(initialDtes);
      setProfessionals(initialProfessionals);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      loadAllData();
    }
  }, [session, loadAllData]);

  // ──────────────────────────────────────────────
  // 4. Audit log writer — persists to Supabase
  // ──────────────────────────────────────────────
  const addAuditLog = useCallback(async (action: string, target: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      operator: activeOperator,
      role: activeRole,
      action,
      target,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ip: '192.168.1.1',
    };

    // Optimistic update in UI
    setLogs(prev => [newLog, ...prev]);

    // Persist to Supabase
    await supabase.from('audit_logs').insert({
      id: newLog.id,
      operator: newLog.operator,
      role: newLog.role,
      action: newLog.action,
      target: newLog.target,
      ip: newLog.ip,
    });
  }, [activeOperator, activeRole]);

  // ──────────────────────────────────────────────
  // 5. Auth actions
  // ──────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setLoginError(t('error_email_required'));
      return;
    }
    if (!loginPassword || loginPassword.length < 4) {
      setLoginError(t('error_password_short'));
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const isPlaceholder = supabaseUrl.includes('your-supabase-url') || supabaseUrl === '';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setLoginLoading(false);
    if (error) {
      if (isPlaceholder) {
        // Fallback for placeholder configs: allow bypass login
        const mockSession = {
          user: {
            id: 'mock_user_id',
            email: loginEmail,
          }
        } as any;
        setSession(mockSession);
        setProfile({
          id: 'mock_user_id',
          name: loginEmail.split('@')[0],
          role: 'Gestor'
        });
        setIsDbConnected(false);
      } else {
        setLoginError('Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    }
  };

  const handleLogout = async () => {
    await addAuditLog('Logout do Sistema', activeOperator);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const isPlaceholder = supabaseUrl.includes('your-supabase-url') || supabaseUrl === '';
    if (!isPlaceholder) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setPatients([]);
    setAppointments([]);
    setBeds([]);
    setLogs([]);
    setFinance([]);
    setStock([]);
    setAsos([]);
    setProfile(null);
    setActiveSubmodule(null);
  };

  // ──────────────────────────────────────────────
  // Submodule config
  // ──────────────────────────────────────────────
  const getSubmoduleTitle = () => {
    if (activeSubmodule === null) return t('portal_title', 'app');
    return t(`submodule_${activeSubmodule}`, 'app');
  };

  const cards = [
    { id: 1, title: "1. Recepção e Admissão", icon: Users2, color: "border-teal-500 text-teal-600 bg-teal-50/50" },
    { id: 2, title: "2. Agenda e Atendimento", icon: CalendarDays, color: "border-teal-500 text-teal-600 bg-teal-50/50" },
    { id: 3, title: "3. Histórico Clínico Eletrônico (HCE)", icon: ClipboardList, color: "border-sky-500 text-sky-600 bg-sky-50/50" },
    { id: 4, title: "4. Diagnóstico por Imagens e Laboratório", icon: Microscope, color: "border-sky-500 text-sky-600 bg-sky-50/50" },
    { id: 5, title: "5. Faturamento Eletrônico (SIFEN/DNIT)", icon: Receipt, color: "border-emerald-500 text-emerald-600 bg-emerald-50/50" },
    { id: 6, title: "6. Gestão Financeira e Contábil", icon: TrendingUp, color: "border-emerald-500 text-emerald-600 bg-emerald-50/50" },
    { id: 7, title: "7. Estoque e Farmácia", icon: Pill, color: "border-indigo-500 text-indigo-600 bg-indigo-50/50" },
    { id: 8, title: "8. Medicina do Trabalho", icon: HeartPulse, color: "border-rose-500 text-rose-600 bg-rose-50/50" },
    { id: 9, title: "9. Medicina do Trabalho / Opcional", icon: ShieldAlert, color: "border-rose-500 text-rose-600 bg-rose-50/50" },
    { id: 10, title: "10. Marketing e CRM de Pacientes", icon: Megaphone, color: "border-teal-500 text-teal-600 bg-teal-50/50" },
    { id: 11, title: "11. Internação e Centro Cirúrgico", icon: BedDouble, color: "border-violet-500 text-violet-600 bg-violet-50/50" },
    { id: 12, title: "12. Inteligência de Negócio (BI)", icon: BarChart3, color: "border-slate-500 text-slate-600 bg-slate-50/50" },
    { id: 13, title: "13. Portal do Paciente e App Móvel", icon: Smartphone, color: "border-indigo-500 text-indigo-600 bg-indigo-50/50" },
    { id: 14, title: "14. Administração do Sistema e Segurança", icon: Settings, color: "border-slate-500 text-slate-600 bg-slate-50/50" },
    { id: 15, title: "15. Convênios e Cobertura", icon: Building2, color: "border-emerald-500 text-emerald-600 bg-emerald-50/50" },
    { id: 16, title: "16. Tabela de Honorários", icon: Hash, color: "border-teal-500 text-teal-600 bg-teal-50/50" },
    { id: 17, title: "17. Coparticipação e Tetos", icon: AlertCircle, color: "border-amber-500 text-amber-600 bg-amber-50/50" },
    { id: 18, title: "18. Lotes Massivos", icon: Send, color: "border-indigo-500 text-indigo-600 bg-indigo-50/50" },
    { id: 19, title: "19. Elegibilidade On-line", icon: Wifi, color: "border-cyan-500 text-cyan-600 bg-cyan-50/50" },
    { id: 20, title: "20. Honorários e Repasse", icon: Banknote, color: "border-violet-500 text-violet-600 bg-violet-50/50" },
    { id: 21, title: "21. Pacientes Estrangeiros", icon: Globe, color: "border-blue-500 text-blue-600 bg-blue-50/50" },
  ];

  // ──────────────────────────────────────────────
  // RENDER: Loading spinner while checking auth
  // ──────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14 bg-[#00a884] rounded-2xl flex items-center justify-center shadow-lg">
            <div className="absolute w-8 h-2.5 bg-white rounded-full" />
            <div className="absolute w-2.5 h-8 bg-white rounded-full" />
            <span className="absolute z-10 text-white font-extrabold text-base">⚕️</span>
          </div>
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">{t('checking_session')}</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // RENDER: Login Screen
  // ──────────────────────────────────────────────
  if (!session) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200 to-teal-50/50 font-sans" suppressHydrationWarning>
        {/* Hospital backdrop hidden */}

        {/* Floating Language Selector Dropdown */}
        <div className="absolute top-4 right-4 z-20">
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-xl shadow-md border border-slate-200/60 backdrop-blur-xs text-xs cursor-pointer select-none transition"
            >
              <Globe className="w-4 h-4 text-teal-600 animate-pulse" />
              <span>{currentLang.flag} {currentLang.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {langDropdownOpen && (
              <>
                <div className="fixed inset-0 z-29" onClick={() => setLangDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden font-sans z-30">
                  <div className="p-3 bg-gradient-to-r from-teal-50 to-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-teal-600" />
                    {t('language_label')}
                  </div>
                  <div className="py-1.5">
                    {LANGUAGES.map(lang => {
                      const isSelected = locale === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLocale(lang.code as any);
                            setLangDropdownOpen(false);
                            addAuditLog('Alterou Idioma', lang.code);
                          }}
                          className={`w-full px-4 py-2.5 text-left transition text-xs font-semibold flex items-center justify-between group
                            ${isSelected
                              ? 'bg-teal-50 text-teal-800 border-l-3 border-teal-600'
                              : 'hover:bg-slate-50 text-slate-700 border-l-3 border-transparent'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{lang.flag}</span>
                            <span className={isSelected ? 'font-bold' : 'font-medium'}>{lang.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Wall text decoration */}
        <div className="absolute left-[8%] top-[25%] hidden lg:block z-10 pointer-events-none select-none max-w-sm">
          <h1 className="text-[40px] font-black text-[#0f5370]/15 tracking-tight uppercase leading-none font-sans">
            {t('tagline')}
          </h1>
          <p className="text-[13px] font-bold text-[#00a884]/20 tracking-wider uppercase mt-2.5 font-sans">
            {t('subtitle')}
          </p>
        </div>

        {/* Login card */}
        <div className="relative z-10 bg-white rounded-2xl p-9 max-w-[370px] w-full mx-4 shadow-[0_15px_35px_rgba(15,83,112,0.18)] border border-white/60 backdrop-blur-xs flex flex-col justify-between">
          <div className="space-y-6">

            {/* Brand */}
            <div className="flex items-center justify-center gap-3">
              <div className="relative shrink-0 w-12 h-12 bg-[#00a884] rounded-2xl flex items-center justify-center shadow-xs">
                <div className="absolute w-8 h-2.5 bg-white rounded-full" />
                <div className="absolute w-2.5 h-8 bg-white rounded-full" />
                <div className="absolute z-10 text-white font-extrabold text-[15px] select-none">⚕️</div>
              </div>
              <div className="flex flex-col items-start select-none">
                <h2 className="font-sans font-black text-[#0f5370] text-3xl tracking-tight leading-none">IAMED</h2>
                <span className="font-sans font-bold text-[10px] text-[#0f5370] tracking-tight leading-none mt-1">(AZER GROUP S.A.)</span>
                <span className="font-sans font-bold text-[10.5px] text-[#00a884] tracking-wide mt-1">{t('tagline')}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="login-email" className="text-[11px] text-slate-800 font-bold tracking-tight">
                  {t('operator_email')}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-[#f1f5f9] border-slate-200/50 text-slate-800 text-[13.5px] font-semibold focus:border-teal-500"
                  placeholder={t('email_placeholder')}
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="login-password" className="text-[11px] text-slate-800 font-bold tracking-tight">
                  {t('password')}
                </Label>
                <div className="relative">
                  <Input
                     id="login-password"
                     type={showPassword ? "text" : "password"}
                     value={loginPassword}
                     onChange={(e) => setLoginPassword(e.target.value)}
                     className="bg-[#f1f5f9]/40 border-slate-200/50 text-slate-800 text-[13.5px] font-semibold pr-11 focus:border-teal-500"
                     placeholder={t('password_placeholder')}
                     required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-rose-500 text-[10.5px] font-bold text-center mt-1 animate-pulse">
                  {loginError}
                </p>
              )}

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#00a884] hover:bg-[#008f70] text-white font-bold py-3 rounded-lg transition-all tracking-wide text-xs uppercase mt-3"
              >
                {loginLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('authenticating')}
                  </span>
                ) : t('submit')}
              </Button>
            </form>

            <div className="text-center pt-1">
              <p className="text-[10px] text-slate-400 font-medium">
                {t('restricted_access')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // RENDER: Main App (authenticated)
  // ──────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 shrink-0 flex justify-between items-center z-20 shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSubmodule(null)}>
          <span className="p-2.5 bg-teal-600 text-white rounded-xl font-black text-lg shadow-sm flex items-center justify-center border border-teal-700">
            +
          </span>
          <div>
            <h1 className="font-extrabold text-teal-800 tracking-tight text-xl">IAMED</h1>
            <p className="text-[10px] text-teal-600 font-extrabold uppercase tracking-wide">{t('smart_clinic', 'app')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          {/* Operator info */}
          <div className="hidden md:flex items-center gap-2 border border-slate-200/80 p-1.5 px-3 rounded-xl bg-slate-50 text-xs">
            <span className="text-slate-500">{t('operator', 'app')}:</span>
            <span className="font-bold text-slate-800">{activeOperator}</span>
            <Badge variant="secondary" className="text-[9px] font-bold uppercase ml-1">{activeRole}</Badge>
          </div>

          {/* Header Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition select-none cursor-pointer"
            >
              <span>{currentLang.flag}</span>
              <span className="hidden sm:inline text-[11px] text-slate-600 font-semibold">{currentLang.name.split(' ')[0]}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {langDropdownOpen && (
              <>
                <div className="fixed inset-0 z-29" onClick={() => setLangDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden font-sans z-30">
                  <div className="p-3 bg-gradient-to-r from-teal-50 to-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-teal-600" />
                    {t('language_label')}
                  </div>
                  <div className="py-1.5">
                    {LANGUAGES.map(lang => {
                      const isSelected = locale === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLocale(lang.code as any);
                            setLangDropdownOpen(false);
                            addAuditLog('Alterou Idioma', lang.code);
                          }}
                          className={`w-full px-4 py-2.5 text-left transition text-xs font-semibold flex items-center justify-between group
                            ${isSelected
                              ? 'bg-teal-50 text-teal-800 border-l-3 border-teal-600'
                              : 'hover:bg-slate-50 text-slate-700 border-l-3 border-transparent'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{lang.flag}</span>
                            <span className={isSelected ? 'font-bold' : 'font-medium'}>{lang.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Supabase Status Badge */}
          {isDbConnected === true ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 flex items-center text-[10px] font-bold uppercase py-1 px-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('supabase_connected', 'app')}
            </Badge>
          ) : isDbConnected === false ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 flex items-center text-[10px] font-bold uppercase py-1 px-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {t('demo_mode', 'app')}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 gap-1 flex items-center text-[10px] font-bold uppercase py-1 px-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-spin" />
              {locale === 'en' ? 'Connecting...' : 'Conectando...'}
            </Badge>
          )}

          {/* Audit logs bell */}
          <div className="relative">
            <button
              onClick={() => { setShowLogDropdown(!showLogDropdown); setShowHelpModal(false); }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg shrink-0 transition relative cursor-pointer"
              title="Audit Logs"
            >
              <Bell className="w-5 h-5" />
              {logs.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
            </button>

            {showLogDropdown && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-4 space-y-3 font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" /> Registro de Atividade Clínico (LGPD)
                  </h4>
                  <span className="text-[9px] bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-bold">Ao Vivo</span>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {logs.slice(0, 5).map(log => (
                    <div key={log.id} className="text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{log.operator}</span>
                        <span className="text-slate-400">{String(log.timestamp).split(' ')[1]}</span>
                      </div>
                      <p className="text-slate-500"><b className="text-teal-700">{log.action}:</b> {log.target}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { setShowHelpModal(true); setShowLogDropdown(false); }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg shrink-0 transition cursor-pointer"
            title="Manual Operacional"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Logout */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> {t('logout', 'app')}
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-slate-50 p-6">
        <AnimatePresence mode="wait">
          {activeSubmodule === null ? (
            <motion.div
              key="main-hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="text-center md:text-left space-y-1.5 pb-2">
                <h2 className="text-slate-800 font-extrabold text-2xl tracking-tight">{t('dashboard_title', 'app')}</h2>
                <p className="text-slate-500 text-xs font-medium">
                  {t('dashboard_subtitle', 'app')}
                </p>
                {dataLoading && (
                  <p className="text-teal-600 text-xs font-semibold flex items-center gap-1.5 mt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('syncing', 'app')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cards.map(card => {
                  const CardIcon = card.icon;
                  const currentTitle = t(`submodule_${card.id}`, 'app');
                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        setActiveSubmodule(card.id);
                        addAuditLog('Abriu Módulo', currentTitle);
                      }}
                      className="relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md cursor-pointer flex flex-col items-center justify-center text-center gap-4 transition duration-150 transform hover:-translate-y-1 group"
                    >
                      <span className={`p-4 rounded-full border ${card.color} group-hover:scale-110 transition shrink-0`}>
                        <CardIcon className="w-7 h-7" />
                      </span>
                      <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide leading-relaxed min-h-[36px] flex items-center justify-center">
                        {currentTitle}
                      </h3>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`workspace-${activeSubmodule}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              {/* Breadcrumb back bar */}
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs font-sans">
                <button
                  onClick={() => { addAuditLog('Voltou ao Início', getSubmoduleTitle()); setActiveSubmodule(null); }}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer transition uppercase"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  {t('back_to_portal', 'app')}
                </button>
                <h3 className="font-extrabold text-slate-800 text-sm">{getSubmoduleTitle()}</h3>
              </div>

              {/* Module router */}
              <div className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/65">
                {(activeSubmodule === 1 || activeSubmodule === 2) && (
                  <ReceptionModule
                    patients={patients}
                    appointments={appointments}
                    setPatients={setPatients}
                    setAppointments={setAppointments}
                    activeSubmodule={activeSubmodule}
                    addAuditLog={addAuditLog}
                    professionals={professionals}
                    activeRole={activeRole}
                    activeOperator={activeOperator}
                  />
                )}
                {(activeSubmodule === 3 || activeSubmodule === 8 || activeSubmodule === 9) && (
                  <ClinicalModule
                    patients={patients}
                    setPatients={setPatients}
                    activeSubmodule={activeSubmodule}
                    addAuditLog={addAuditLog}
                    asos={asos}
                    setAsos={setAsos}
                  />
                )}
                {activeSubmodule === 4 && (
                  <DiagnosticModule
                    patients={patients}
                    activeSubmodule={activeSubmodule}
                    addAuditLog={addAuditLog}
                  />
                )}
                {(activeSubmodule === 5 || activeSubmodule === 6 || activeSubmodule === 7 || activeSubmodule === 14 ||
                  activeSubmodule === 15 || activeSubmodule === 16 || activeSubmodule === 17 ||
                  activeSubmodule === 18 || activeSubmodule === 19 || activeSubmodule === 20 || activeSubmodule === 21) && (
                  <AdminFinanceModule
                    activeSubmodule={activeSubmodule}
                    addAuditLog={addAuditLog}
                    logs={logs}
                    financePostings={finance}
                    setFinancePostings={setFinance}
                    stockItems={stock}
                    setStockItems={setStock}
                    dtes={dtes}
                    setDtes={setDtes}
                    patients={patients}
                    professionals={professionals}
                    setProfessionals={setProfessionals}
                    insurances={insurances}
                    setInsurances={setInsurances}
                    feeSchedules={feeSchedules}
                    setFeeSchedules={setFeeSchedules}
                    preAuthorizations={preAuthorizations}
                    setPreAuthorizations={setPreAuthorizations}
                    batchInvoices={batchInvoices}
                    setBatchInvoices={setBatchInvoices}
                    eligibilityChecks={eligibilityChecks}
                    setEligibilityChecks={setEligibilityChecks}
                    settlements={settlements}
                    setSettlements={setSettlements}
                    foreignBillings={foreignBillings}
                    setForeignBillings={setForeignBillings}
                    accountsPayable={accountsPayable}
                    setAccountsPayable={setAccountsPayable}
                    accountsReceivable={accountsReceivable}
                    setAccountsReceivable={setAccountsReceivable}
                    cashFlows={cashFlows}
                    setCashFlows={setCashFlows}
                    bankReconciliations={bankReconciliations}
                    setBankReconciliations={setBankReconciliations}
                    costCenters={costCenters}
                    setCostCenters={setCostCenters}
                    incomeStatements={incomeStatements}
                    setIncomeStatements={setIncomeStatements}
                    taxCalculations={taxCalculations}
                    setTaxCalculations={setTaxCalculations}
                    purchaseBook={purchaseBook}
                    setPurchaseBook={setPurchaseBook}
                    salesBook={salesBook}
                    setSalesBook={setSalesBook}
                    exchangeRates={exchangeRates}
                    setExchangeRates={setExchangeRates}
                    chartOfAccounts={chartOfAccounts}
                    setChartOfAccounts={setChartOfAccounts}
                    accountingEntries={accountingEntries}
                    setAccountingEntries={setAccountingEntries}
                  />
                )}
                {(activeSubmodule === 10 || activeSubmodule === 11 || activeSubmodule === 12 || activeSubmodule === 13) && (
                  <CrmBiModule
                    activeSubmodule={activeSubmodule}
                    addAuditLog={addAuditLog}
                    beds={beds}
                    setBeds={setBeds}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Info className="w-5 h-5 text-teal-600" /> MANUAL OPERACIONAL — IAMED CRM
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-800">Aplicações e Simulações disponíveis:</p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium text-slate-600">
              <li><b>Admissão e Triagem (1)</b>: Registre e priorize pacientes na fila de triagem.</li>
              <li><b>Agenda Médica (2)</b>: Agende consultas e controle horários dos profissionais.</li>
              <li><b>HCE (3)</b>: Evolua anamneses clínicas e solicite ao <b>Co-Piloto AI Gemini (Dr. IA)</b> resumos do prontuário.</li>
              <li><b>Visualizador PACS (4)</b>: Modifique contraste e brilho e laude exames radiológicos.</li>
              <li><b>SIFEN Tributário (5)</b>: Gere faturamentos e notas fiscais XML automatizadas.</li>
              <li><b>Financeiro Contábil (6)</b>: Adicione receitas e despesas e monitore o fluxo de caixa.</li>
              <li><b>Farmácia / Estoque (7)</b>: Monitore medicamentos e realize dispensações.</li>
              <li><b>Telemedicina (13)</b>: Ative vídeo-consultas integradas usando a webcam do navegador.</li>
            </ul>
          </div>
          <p className="text-[10px] text-slate-400 pt-2">Desenvolvido sob normas da LGPD, CFM e SIFEN.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
