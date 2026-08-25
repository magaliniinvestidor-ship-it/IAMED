'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  initialExchangeRates, initialChartOfAccounts, initialAccountingEntries,
  PharmacyItem, StockMovement, InventoryCount, AdverseEvent, QualityDeviation, BatchRecall,
  initialPharmacyItems, initialStockMovements, initialInventoryCounts,
  initialAdverseEvents, initialQualityDeviations, initialBatchRecalls,
  Location, ClinicalRoom, initialLocations, initialClinicalRooms,
  PasswordPolicy, initialPasswordPolicy,
} from '@/lib/mockData';

// Modular Component Screens
import ReceptionModule from '@/components/ReceptionModule';
import ClinicalModule from '@/components/ClinicalModule';
import DiagnosticModule from '@/components/DiagnosticModule';
import AdminFinanceModule from '@/components/AdminFinanceModule';
import CrmBiModule from '@/components/CrmBiModule';
import EstoqueFarmaciaModule from '@/components/EstoqueFarmaciaModule';
import MedicinaTrabalhoModule from '@/components/MedicinaTrabalhoModule';
import InternacaoCentroCirurgicoModule from '@/components/InternacaoCentroCirurgicoModule';
import PatientPortalModule from '@/components/PatientPortalModule';
import AgendaModule from '@/components/AgendaModule';
import ErrorBoundary from '@/components/ErrorBoundary';
import { TwoFactorLoginScreen } from '@/components/TwoFactorLoginScreen';

// Permission Gate
import { PermissionGate } from '@/components/ui/PermissionGate';

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
  Building2, Hash, AlertCircle, Send, Wifi, Banknote,
  Clock, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type UserProfile = {
  id: string;
  name: string;
  role: string;
  permissions?: string[];
};

export default function Home() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}

// Gate RBAC fino por submódulo do painel Administração/Financeiro (Módulos 5, 6 e 14–21)
const ADMIN_FINANCE_VIEW_BY_SUBMODULE: Partial<Record<number, 'sifen' | 'finance' | 'security' | 'insurance' | 'fee_schedule' | 'copay' | 'batches' | 'eligibility' | 'settlements' | 'foreign_billing'>> = {
  5: 'sifen',
  6: 'finance',
  14: 'security',
  15: 'insurance',
  16: 'fee_schedule',
  17: 'copay',
  18: 'batches',
  19: 'eligibility',
  20: 'settlements',
  21: 'foreign_billing',
};

function HomeContent() {
  const { locale, setLocale, t } = useI18n();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const LANGUAGES = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
    { code: 'es-AR', name: 'Español (Argentina)', flag: '🇦🇷' },
    { code: 'es-PY', name: 'Español (Paraguay)', flag: '🇵🇾' },
    { code: 'es', name: 'Español (Geral)', flag: '🇪🇸' },
    { code: 'en', name: 'English (US/UK)', flag: '🇺🇸' }
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
  const [professionalRoles, setProfessionalRoles] = useState<{id: string; name: string; description?: string; category?: string; active?: boolean}[]>([]);
  const [insurances, setInsurances] = useState<InsuranceCompany[]>(initialInsurances);
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>(initialFeeSchedules);
  const [preAuthorizations, setPreAuthorizations] = useState<PreAuthorization[]>(initialPreAuthorizations);
  const [procedureCatalog, setProcedureCatalog] = useState<{ code: string; name: string; nomenclature?: string; financing_entity?: string }[]>([]);
  const [batchInvoices, setBatchInvoices] = useState<BatchInvoice[]>(initialBatchInvoices);
  const [eligibilityChecks, setEligibilityChecks] = useState<EligibilityCheck[]>(initialEligibilityChecks);
  const [settlements, setSettlements] = useState<ProfessionalSettlement[]>(initialSettlements);
  const [foreignBillings, setForeignBillings] = useState<ForeignBilling[]>(initialForeignBillings);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>(initialAccountsPayable);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>(initialAccountsReceivable);
  const [cashFlows, setCashFlows] = useState<CashFlowProjection[]>(initialCashFlows);
  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>(initialBankReconciliations);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(initialCostCenters);
  const [incomeStatements, setIncomeStatements] = useState<IncomeStatement[]>(initialIncomeStatements);
  const [taxCalculations, setTaxCalculations] = useState<TaxCalculation[]>(initialTaxCalculations);
  const [purchaseBook, setPurchaseBook] = useState<PurchaseBookEntry[]>(initialPurchaseBook);
  const [salesBook, setSalesBook] = useState<SalesBookEntry[]>(initialSalesBook);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(initialExchangeRates);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
  // Pharmacy / Estoque state
  const [pharmacyItems, setPharmacyItems] = useState<PharmacyItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>([]);
  const [adverseEvents, setAdverseEvents] = useState<AdverseEvent[]>([]);
  const [qualityDeviations, setQualityDeviations] = useState<QualityDeviation[]>([]);
  const [batchRecalls, setBatchRecalls] = useState<BatchRecall[]>([]);
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [clinicalRooms, setClinicalRooms] = useState<ClinicalRoom[]>(initialClinicalRooms);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>(initialPasswordPolicy);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginAttemptCount, setLoginAttemptCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  // 2FA Login State
  const [pending2FAUserId, setPending2FAUserId] = useState<string | null>(null);
  const [pending2FAEmail, setPending2FAEmail] = useState('');
  const [twoFactorLoginCode, setTwoFactorLoginCode] = useState('');
  const [twoFactorLoginError, setTwoFactorLoginError] = useState('');
  const [twoFactorLoginLoading, setTwoFactorLoginLoading] = useState(false);
  const [pending2FABackupMode, setPending2FABackupMode] = useState(false);
  const [pending2FAMethod, setPending2FAMethod] = useState<'totp' | 'email' | 'sms' | null>(null);
  const [pending2FAQRCode, setPending2FAQRCode] = useState('');
  const [pending2FATotpSecret, setPending2FATotpSecret] = useState('');
  const [pending2FAEmailSent, setPending2FAEmailSent] = useState(false);
  const [pending2FATotpVerified, setPending2FATotpVerified] = useState(false);

  // Bloqueia o dashboard enquanto o desafio 2FA não termina; guarda credenciais
  // apenas em memória para reautenticar após a verificação do código
  const twoFALoginCheckRef = useRef(false);
  const pending2FACredentialsRef = useRef<{ email: string; password: string } | null>(null);
  const pending2FAChallengeRef = useRef('');

  // Session Timeout / Inactivity
   
  const lastActivityRef = useRef(typeof window !== 'undefined' ? parseInt(localStorage.getItem('iamed_last_activity') || '0', 10) || Date.now() : Date.now());
  const showInactivityWarningRef = useRef(false);
  const lastWarningDismissedAtRef = useRef(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  const getLastActivityTime = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('iamed_last_activity');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return lastActivityRef.current;
  };

  const updateLastActivityTime = (time: number = Date.now()) => {
    lastActivityRef.current = time;
    if (typeof window !== 'undefined') {
      localStorage.setItem('iamed_last_activity', time.toString());
    }
  };

  // Suporta override via URL param ?timeout_ms=180000 para testes
  const getTimeoutMs = () => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('timeout_ms');
      if (p) return Math.max(30000, parseInt(p, 10));
    }
    return passwordPolicy.sessionTimeoutMinutes * 60 * 1000;
  };
  const SESSION_TIMEOUT_MS = getTimeoutMs();
  const INACTIVITY_WARNING_MS = SESSION_TIMEOUT_MS - 60000; // warning 1 min antes

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
    if (!supabase) {
      const t = setTimeout(() => setAuthLoading(false), 0);
      return () => clearTimeout(t);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    let pendingSignOut: ReturnType<typeof setTimeout> | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH]', event, session ? 'session_ok' : 'session_null');

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Cancel any pending sign-out if we just got a sign-in or refresh
        if (pendingSignOut) {
          clearTimeout(pendingSignOut);
          pendingSignOut = null;
        }
        setSession(session);
        setAuthLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        // Debounce: verify session is truly gone after a short delay
        // A new SIGNED_IN event will cancel this
        pendingSignOut = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: freshSession } }) => {
            console.log('[AUTH] SIGNED_OUT verify:', freshSession ? 'still_valid' : 'confirmed_out');
            if (freshSession) return;
            setSession(null);
            setAuthLoading(false);
          });
        }, 3000);
        return;
      }

      if (event === 'INITIAL_SESSION' && !session) {
        // Don't kill session on initial check if we already have one
        console.log('[AUTH] INITIAL_SESSION null - ignoring if already logged in');
        return;
      }
      setSession(session);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (pendingSignOut) clearTimeout(pendingSignOut);
    };
  }, []);

  // ──────────────────────────────────────────────
  // 2. Load profile once session is available
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user || !supabase) return;

    const loadProfile = async () => {
      if (!supabase) return;

      // Try system_users first (main user table), then profiles as fallback
      let data: any = null;

      const { data: sysUser, error: sysUserErr } = await supabase
        .from('system_users')
        .select('id, ci, system_role, professional_id, permissions')
        .eq('auth_user_id', session.user.id)
        .single();

      if (sysUser && !sysUserErr) {
        let userName = session.user.email?.split('@')[0] || 'Operador';
        let linkedProfRole: string | null = null;
        if (sysUser.professional_id) {
          const { data: prof } = await supabase
            .from('professionals')
            .select('name, role')
            .eq('id', sysUser.professional_id)
            .single();
          if (prof?.name) userName = prof.name;
          linkedProfRole = prof?.role || null;
        }
        data = { id: sysUser.id, name: userName, role: sysUser.system_role, permissions: sysUser.permissions };
      }

      if (data) {
        // 1) Override individual do usuário (system_users.permissions)
        let finalPermissions = data.permissions || [];

        // 2) Permissões individuais configuradas na aba RBAC (professionals)
        if (finalPermissions.length === 0 && sysUser) {
          if (sysUser.professional_id) {
            const { data: profById } = await supabase
              .from('professionals')
              .select('permissions')
              .eq('id', sysUser.professional_id)
              .maybeSingle();
            finalPermissions = profById?.permissions || [];
          }
          if (finalPermissions.length === 0 && session.user.email) {
            try {
              const { data: profByEmail } = await supabase
                .from('professionals')
                .select('permissions')
                .eq('email', session.user.email)
                .maybeSingle();
              finalPermissions = profByEmail?.permissions || [];
            } catch {
              // professionals query failed, keep empty
            }
          }
        }

        // 3) Base por Função/Profissão (tabela role_permissions)
        //    Se o system_role diverge da profissão vinculada, é um override
        //    deliberado (ex.: Visualizador/Admin) e prevalece como chave.
        //    Linha EXISTENTE na tabela é autoritativa — mesmo vazia (fail-safe).
        let roleBaseResolved = false;
        if (finalPermissions.length === 0 && sysUser) {
          let baseRoleName: string | null = sysUser.system_role || null;
          const { data: profRoleRow } = await supabase
            .from('professionals')
            .select('role')
            .eq('id', sysUser.professional_id)
            .maybeSingle();
          if (profRoleRow?.role) {
            baseRoleName = sysUser.system_role === profRoleRow.role ? profRoleRow.role : sysUser.system_role;
          }
          if (!baseRoleName) baseRoleName = 'Visualizador';
          const { data: rolePermRow } = await supabase
            .from('role_permissions')
            .select('permissions')
            .eq('role_name', baseRoleName)
            .maybeSingle();
          if (rolePermRow) {
            finalPermissions = Array.isArray(rolePermRow.permissions) ? rolePermRow.permissions : [];
            roleBaseResolved = true;
          }
        }

        // 4) Fallback standard mapping based on user role — apenas quando NÃO
        //    existe linha configurada para a função/profissão na tabela.
        if (!roleBaseResolved && finalPermissions.length === 0) {
          const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
            SuperAdmin: ['admin:*'],
            Administrador: ['admin:*'],
            'Administrador(a)': ['admin:*'],
            Gestor: ['admin:*'],
            'Diretor Clínico': ['admin:*'],
            Médico: ['clinical:*', 'view_reception', 'view_agenda', 'perform_admit', 'perform_prescribe'],
            'Médico(a)': ['clinical:*', 'view_reception', 'view_agenda', 'perform_admit', 'perform_prescribe'],
            Enfermeiro: ['clinical:*', 'view_reception', 'view_agenda', 'perform_admit'],
            'Enfermeiro(a)': ['clinical:*', 'view_reception', 'view_agenda', 'perform_admit'],
            Recepcionista: ['view_reception', 'view_agenda', 'view_patient_portal', 'perform_admit'],
            Financeiro: ['billing:*'],
            Farmacêutico: ['pharmacy:*'],
            'Farmacêutico(a)': ['pharmacy:*'],
            'Técnico(a) em Farmácia': ['pharmacy:*'],
            'Terapeuta Ocupacional': ['clinical:*'],
            Fisioterapeuta: ['clinical:*'],
            'Psicólogo(a)': ['clinical:*'],
            Nutricionista: ['clinical:*'],
            'Técnico(a) de Enfermagem': ['clinical:*'],
            'Auxiliar de Enfermagem': ['clinical:*'],
            Anestesiologista: ['clinical:*'],
            'Cirurgião(ã)': ['clinical:*'],
            'Educador Físico': ['clinical:*'],
            'Assistente Social': ['clinical:*'],
            'Fonoaudiólogo(a)': ['clinical:*'],
            Dentista: ['clinical:*'],
            'Biomédico(a)': ['clinical:*'],
            'Técnico(a) em Radiologia': ['clinical:*'],
            'Técnico(a) de Laboratório': ['clinical:*'],
            Visualizador: ['view_reception', 'view_agenda', 'view_hce', 'view_diagnostic', 'view_sifen', 'view_finance', 'view_stock', 'view_pcmso', 'view_med_work', 'view_crm', 'view_hospitalization', 'view_bi', 'view_patient_portal', 'view_security', 'view_insurance', 'view_fee_schedule', 'view_copay', 'view_batches', 'view_eligibility', 'view_settlements', 'view_foreign_billing'],
          };
          finalPermissions = ROLE_DEFAULT_PERMISSIONS[data.role] || [];
        }

        setProfile({ ...data, permissions: finalPermissions } as UserProfile);
        setActiveOperator(data.name);
        // Allow role override via URL param for testing
        const roleOverride = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('role')
          : null;
        setActiveRole(roleOverride || data.role);
      } else {
        // Fallback: no profile in DB (demo mode / tables not created yet)
        // Give full access so the system is usable
        const emailName = session.user.email?.split('@')[0] || 'Operador';
        const roleOverride = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('role')
          : null;
        const role = roleOverride || 'Gestor';

        const defaultFullPermissions = [
          'view_reception', 'view_agenda', 'view_hce', 'view_diagnostic',
          'view_sifen', 'view_finance', 'view_stock', 'view_med_work', 'view_pcmso', 'view_crm', 'view_security',
          'view_insurance', 'view_fee_schedule', 'view_copay', 'view_batches',
          'view_eligibility', 'view_settlements', 'view_foreign_billing',
          'view_bi', 'view_patient_portal', 'view_hospitalization',
          'perform_admit', 'perform_prescribe', 'perform_sifen', 'perform_post_finance',
          'perform_stock', 'perform_beds', 'perform_rbac', 'perform_insurance',
          'perform_fee_schedule', 'perform_copay', 'perform_batches',
          'perform_eligibility', 'perform_settlements', 'perform_foreign_billing',
          'perform_surgery', 'perform_aso',
        ];

        setProfile({ id: session.user.id, name: emailName, role, permissions: defaultFullPermissions } as UserProfile);
        setActiveOperator(emailName);
        setActiveRole(role);
      }
    };

    loadProfile();
  }, [session]);

  // ──────────────────────────────────────────────
  // 3. Load all data once logged in
  // ──────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!supabase) {
      setIsDbConnected(false);
      return;
    }

    setDataLoading(true);
    try {
      const [patientsRes, appointmentsRes, bedsRes, logsRes, financeRes, stockRes, asosRes, dtesRes, professionalsRes, professionalRolesRes, pharmacyItemsRes, stockMovementsRes, inventoryCountsRes, adverseEventsRes, qualityDeviationsRes, batchRecallsRes, locationsRes, clinicalRoomsRes, clinicalHistoryRes, insurancesRes, feeSchedulesRes, preAuthorizationsRes, procedureCatalogRes] = await Promise.all([
        supabase.from('patients').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').order('date', { ascending: true }),
        supabase.from('beds').select('*').order('name'),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('financial_postings').select('*').order('date', { ascending: false }),
        supabase.from('stock_items').select('*').order('name', { ascending: true }),
        supabase.from('aso_exams').select('*').order('date', { ascending: false }),
        supabase.from('dtes').select('*').order('created_at', { ascending: false }),
        supabase.from('professionals').select('*').order('name', { ascending: true }),
        supabase.from('professional_roles').select('*').order('name', { ascending: true }),
        supabase.from('pharmacy_items').select('*').order('name', { ascending: true }),
        supabase.from('stock_movements').select('*').order('date', { ascending: false }),
        supabase.from('inventory_counts').select('*').order('date', { ascending: false }),
        supabase.from('adverse_events').select('*').order('notification_date', { ascending: false }),
        supabase.from('quality_deviations').select('*').order('report_date', { ascending: false }),
        supabase.from('batch_recalls').select('*').order('alert_date', { ascending: false }),
        supabase.from('locations').select('*').order('name', { ascending: true }),
        supabase.from('clinical_rooms').select('*').order('name', { ascending: true }),
        supabase.from('clinical_history').select('*').order('date', { ascending: false }),
        supabase.from('insurance_companies').select('*').order('name', { ascending: true }),
        supabase.from('fee_schedules').select('*').order('insurance_name', { ascending: true }),
        supabase.from('pre_authorizations').select('*').order('request_date', { ascending: false }),
        supabase.from('procedure_catalog').select('code, name, nomenclature, category, financing_entity, is_active').eq('is_active', true),
      ]);

      const pharmacyHasError = !!(
        pharmacyItemsRes.error || stockMovementsRes.error || inventoryCountsRes.error ||
        adverseEventsRes.error || qualityDeviationsRes.error || batchRecallsRes.error
      );

      const hasError = !!(
        patientsRes.error || appointmentsRes.error || bedsRes.error ||
        logsRes.error || financeRes.error || stockRes.error || asosRes.error ||
        dtesRes.error || professionalsRes.error || pharmacyHasError ||
        locationsRes.error || clinicalRoomsRes.error
      );

      if (patientsRes.data && !patientsRes.error) {
        // Build clinical history map from separate table
        const clinicalHistoryMap: Record<string, any[]> = {};
        if (clinicalHistoryRes.data && !clinicalHistoryRes.error) {
          clinicalHistoryRes.data.forEach((h: any) => {
            if (!clinicalHistoryMap[h.patient_id]) clinicalHistoryMap[h.patient_id] = [];
            clinicalHistoryMap[h.patient_id].push({
              id: h.id,
              consultation_id: h.consultation_id || undefined,
              date: h.date,
              type: h.type,
              diagnosis: h.diagnosis || '',
              cid10: h.cid10 || '',
              prescriptions: h.prescriptions || [],
              notes: h.notes,
              doctor: h.doctor,
              location_name: h.location_name || undefined,
              triage_edits: h.triage_edits || undefined,
              vital_signs: h.vital_signs || undefined,
              triage_priority: h.triage_priority || undefined,
              triage_color: h.triage_color || undefined,
              preliminary_procedures: h.preliminary_procedures || undefined,
              attached_files: h.attached_files || undefined,
              triaged_at: h.triaged_at || undefined,
              created_at: h.created_at || undefined,
            });
          });
        }
        if (patientsRes.data.length > 0) {
          const mapped = patientsRes.data.map((p: any) => {
            const mock = initialPatients.find(m => m.id === p.id);
            return {
              ...p,
              ...(mock || {}),
              ...p,
              document_type: p.document_type || mock?.document_type,
              document_number: p.document_number || mock?.document_number,
              clinicalHistory: clinicalHistoryMap[p.id] || (p.clinical_history || mock?.clinicalHistory || []).map((h: any) => ({
                id: h.id,
                date: h.date,
                type: h.type,
                diagnosis: h.diagnosis || '',
                cid10: h.cid10 || '',
                prescriptions: h.prescriptions || [],
                notes: h.notes,
                doctor: h.doctor,
                consultation_id: h.consultation_id || undefined,
                location_name: h.location_name || undefined,
                triaged_at: h.triaged_at || undefined,
                created_at: h.created_at || undefined,
                triage_edits: h.triage_edits || undefined,
                vital_signs: h.vital_signs || undefined,
                triage_priority: h.triage_priority || undefined,
                triage_color: h.triage_color || undefined,
                preliminary_procedures: h.preliminary_procedures || undefined,
                attached_files: h.attached_files || undefined,
              })),
            };
          });
          setPatients(mapped);
        }
      } else if (patientsRes.error) {
        console.error("[loadAllData] Supabase patients query error:", patientsRes.error);
      }

      if (appointmentsRes.data && !appointmentsRes.error) {
        const mapped = appointmentsRes.data.map((a: any) => ({
          ...a,
          patientId: a.patient_id,
          patientName: a.patient_name,
          doctorName: a.doctor_name,
        }));
        setAppointments(mapped);

        // Merge patients from appointments that don't exist in the patients table
        setPatients(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newFromAppts = mapped
            .filter((a: any) => a.patient_id && !existingIds.has(a.patient_id))
            .reduce((acc: Patient[], a: any) => {
              if (!acc.find(p => p.id === a.patient_id)) {
                acc.push({
                  id: a.patient_id,
                  name: a.patient_name,
                  email: '',
                  phone: '',
                  birthdate: '',
                  gender: '',
                  priority: 'normal',
                  status: 'agendado',
                  clinicalHistory: [],
                });
              }
              return acc;
            }, []);
          return newFromAppts.length > 0 ? [...prev, ...newFromAppts] : prev;
        });
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
          locationId: p.location_id || '',
        }));
        setProfessionals(mapped);
      } else {
        setProfessionals(initialProfessionals);
      }

      // Load professional roles from Supabase
      if (professionalRolesRes.data && !professionalRolesRes.error) {
        setProfessionalRoles(professionalRolesRes.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || undefined,
          category: r.category || undefined,
          active: r.active ?? true,
        })));
      }

      // Pharmacy items with lots
      if (pharmacyItemsRes.data && !pharmacyItemsRes.error && pharmacyItemsRes.data.length > 0) {
        const mapped = pharmacyItemsRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          activePrinciple: p.active_principle || undefined,
          category: p.category,
          form: p.form || undefined,
          presentation: p.presentation || '',
          manufacturer: p.manufacturer || '',
          dinavisaRegistration: p.dinavisa_registration || '',
          requiresPrescription: p.requires_prescription || false,
          lots: (p.lot_controls || []).map((l: any) => ({
            id: l.id,
            itemId: l.item_id,
            lotNumber: l.lot_number,
            serialNumber: l.serial_number || undefined,
            manufactureDate: l.manufacture_date,
            expiryDate: l.expiry_date,
            quantity: Number(l.quantity),
            initialQuantity: Number(l.initial_quantity),
            costPerUnit: Number(l.cost_per_unit),
            dinavisaRegistration: l.dinavisa_registration || '',
            dteEntryNumber: l.dte_entry_number || undefined,
            supplierName: l.supplier_name || undefined,
            supplierRuc: l.supplier_ruc || undefined,
            receivedDate: l.received_date,
            status: l.status,
          })),
          totalQuantity: Number(p.total_quantity),
          minQuantity: Number(p.min_quantity),
          storageLocation: p.storage_location || '',
          unitCost: Number(p.unit_cost),
          unitPrice: Number(p.unit_price),
          active: p.active ?? true,
        }));
        setPharmacyItems(mapped);
      } else {
        setPharmacyItems(initialPharmacyItems);
      }

      // Stock movements
      if (stockMovementsRes.data && !stockMovementsRes.error && stockMovementsRes.data.length > 0) {
        const mapped = stockMovementsRes.data.map((m: any) => ({
          id: m.id,
          itemId: m.item_id,
          itemName: m.item_name,
          lotId: m.lot_id,
          lotNumber: m.lot_number,
          movementType: m.movement_type,
          quantity: Number(m.quantity),
          unitCost: Number(m.unit_cost),
          totalCost: Number(m.total_cost),
          date: m.date,
          operatorName: m.operator_name,
          dteNumber: m.dte_number || undefined,
          supplierName: m.supplier_name || undefined,
          patientName: m.patient_name || undefined,
          procedureName: m.procedure_name || undefined,
          room: m.room || undefined,
          sector: m.sector || undefined,
          hospitalizationId: m.hospitalization_id || undefined,
          prescriptionId: m.prescription_id || undefined,
          doctorName: m.doctor_name || undefined,
          reason: m.reason || undefined,
          notes: m.notes || undefined,
        }));
        setStockMovements(mapped);
      } else {
        setStockMovements(initialStockMovements);
      }

      // Inventory counts
      if (inventoryCountsRes.data && !inventoryCountsRes.error && inventoryCountsRes.data.length > 0) {
        const mapped = inventoryCountsRes.data.map((c: any) => ({
          id: c.id,
          date: c.date,
          operatorName: c.operator_name,
          status: c.status,
          items: c.items || [],
          notes: c.notes || undefined,
        }));
        setInventoryCounts(mapped);
      } else {
        setInventoryCounts(initialInventoryCounts);
      }

      // Adverse events
      if (adverseEventsRes.data && !adverseEventsRes.error && adverseEventsRes.data.length > 0) {
        const mapped = adverseEventsRes.data.map((e: any) => ({
          id: e.id,
          patientName: e.patient_name,
          patientId: e.patient_id || undefined,
          medicationName: e.medication_name,
          itemId: e.item_id || undefined,
          lotId: e.lot_id || undefined,
          lotNumber: e.lot_number || '',
          adverseReaction: e.adverse_reaction,
          severity: e.severity,
          startDate: e.start_date,
          endDate: e.end_date || undefined,
          outcome: e.outcome,
          suspectedDrug: e.suspected_drug ?? true,
          concomitantDrugs: e.concomitant_drugs || [],
          description: e.description,
          notifierName: e.notifier_name,
          notifierRole: e.notifier_role,
          notificationDate: e.notification_date,
          status: e.status,
          dinavisaProtocol: e.dinavisa_protocol || undefined,
          dinavisaResponse: e.dinavisa_response || undefined,
          notes: e.notes || undefined,
        }));
        setAdverseEvents(mapped);
      } else {
        setAdverseEvents(initialAdverseEvents);
      }

      // Quality deviations
      if (qualityDeviationsRes.data && !qualityDeviationsRes.error && qualityDeviationsRes.data.length > 0) {
        const mapped = qualityDeviationsRes.data.map((d: any) => ({
          id: d.id,
          itemId: d.item_id,
          itemName: d.item_name,
          lotId: d.lot_id,
          lotNumber: d.lot_number,
          deviationType: d.deviation_type,
          severity: d.severity,
          affectedQuantity: Number(d.affected_quantity),
          description: d.description,
          reportDate: d.report_date,
          reporterName: d.reporter_name,
          status: d.status,
          correctiveAction: d.corrective_action || undefined,
          rootCause: d.root_cause || undefined,
          closedAt: d.closed_at || undefined,
          notes: d.notes || undefined,
        }));
        setQualityDeviations(mapped);
      } else {
        setQualityDeviations(initialQualityDeviations);
      }

      // Batch recalls
      if (batchRecallsRes.data && !batchRecallsRes.error && batchRecallsRes.data.length > 0) {
        const mapped = batchRecallsRes.data.map((r: any) => ({
          id: r.id,
          itemId: r.item_id,
          itemName: r.item_name,
          lotId: r.lot_id,
          lotNumber: r.lot_number,
          recallType: r.recall_type,
          reason: r.reason,
          riskLevel: r.risk_level,
          alertDate: r.alert_date,
          affectedQuantity: Number(r.affected_quantity),
          recollectedQuantity: Number(r.recollected_quantity),
          status: r.status,
          dinavisaNotice: r.dinavisa_notice || undefined,
          instructions: r.instructions || undefined,
          completedAt: r.completed_at || undefined,
          notes: r.notes || undefined,
        }));
        setBatchRecalls(mapped);
      } else {
        setBatchRecalls(initialBatchRecalls);
      }

      // Locations
      if (locationsRes.data && !locationsRes.error && locationsRes.data.length > 0) {
        const mapped = locationsRes.data.map((l: any) => ({
          id: l.id,
          name: l.name,
          address: l.address || '',
          phone: l.phone || '',
          city: l.city || '',
          status: l.status || 'ativo',
        }));
        setLocations(mapped);
      } else {
        setLocations(initialLocations);
      }

      // Clinical Rooms
      if (clinicalRoomsRes.data && !clinicalRoomsRes.error && clinicalRoomsRes.data.length > 0) {
        const mapped = clinicalRoomsRes.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          location_id: r.location_id,
          status: r.status || 'ativo',
          capacity: Number(r.capacity) || 1,
          equipment: r.equipment || [],
        }));
        setClinicalRooms(mapped);
      } else {
        setClinicalRooms(initialClinicalRooms);
      }

      // Insurance companies (convênios)
      if (insurancesRes.data && !insurancesRes.error && insurancesRes.data.length > 0) {
        const mapped = insurancesRes.data.map((i: any) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          ruc: i.ruc || '',
          contact: i.contact || '',
          phone: i.phone || '',
          email: i.email || '',
          has_webservice: !!i.has_webservice,
          webservice_url: i.webservice_url || '',
          requires_authorization: !!i.requires_authorization,
          requires_pre_approval: !!i.requires_pre_approval,
          copay_rules: i.copay_rules || '',
          coverage_ceiling: Number(i.coverage_ceiling) || 0,
          active: i.active === undefined ? true : !!i.active,
        }));
        setInsurances(mapped);
      } else {
        setInsurances(initialInsurances);
      }

      // Fee schedules (tabela de honorários)
      if (feeSchedulesRes.data && !feeSchedulesRes.error && feeSchedulesRes.data.length > 0) {
        const mappedFee = feeSchedulesRes.data.map((f: any) => ({
          id: f.id,
          insurance_type: f.insurance_type,
          insurance_name: f.insurance_name,
          specialty: f.specialty || '',
          procedure_code: f.procedure_code,
          procedure_name: f.procedure_name,
          base_price: Number(f.base_price) || 0,
          repasse_percent: Number(f.repasse_percent) || 0,
          copay_amount: Number(f.copay_amount) || 0,
          copay_percent: Number(f.copay_percent) || 0,
          coverage_limit: Number(f.coverage_limit) || 0,
          requires_authorization: !!f.requires_authorization,
          active: f.active === undefined ? true : !!f.active,
        }));
        setFeeSchedules(mappedFee);
      } else {
        setFeeSchedules(initialFeeSchedules);
      }

      // Pre-authorizations (autorizações prévias)
      if (preAuthorizationsRes.data && !preAuthorizationsRes.error && preAuthorizationsRes.data.length > 0) {
        const mappedPre = preAuthorizationsRes.data.map((p: any) => ({
          id: p.id,
          patient_id: p.patient_id,
          patient_name: p.patient_name,
          insurance_id: p.insurance_id || '',
          insurance_name: p.insurance_name,
          procedure_code: p.procedure_code,
          procedure_name: p.procedure_name,
          requested_amount: Number(p.requested_amount) || 0,
          authorized_amount: Number(p.authorized_amount) || 0,
          status: p.status || 'solicitada',
          authorization_number: p.authorization_number || '',
          request_date: p.request_date || '',
          response_date: p.response_date || '',
          notes: p.notes || '',
        }));
        setPreAuthorizations(mappedPre);
      } else {
        setPreAuthorizations(initialPreAuthorizations);
      }

      if (procedureCatalogRes.data && !procedureCatalogRes.error) {
        setProcedureCatalog(procedureCatalogRes.data.map((p: any) => ({
          code: String(p.code),
          name: String(p.name),
          nomenclature: p.nomenclature || undefined,
          financing_entity: p.financing_entity || undefined,
        })));
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
      setPharmacyItems(initialPharmacyItems);
      setStockMovements(initialStockMovements);
      setInventoryCounts(initialInventoryCounts);
      setAdverseEvents(initialAdverseEvents);
      setQualityDeviations(initialQualityDeviations);
      setBatchRecalls(initialBatchRecalls);
      setLocations(initialLocations);
      setClinicalRooms(initialClinicalRooms);
      setInsurances(initialInsurances);
      setFeeSchedules(initialFeeSchedules);
      setPreAuthorizations(initialPreAuthorizations);
      setBatchInvoices(initialBatchInvoices);
      setEligibilityChecks(initialEligibilityChecks);
      setSettlements(initialSettlements);
      setForeignBillings(initialForeignBillings);
      setAccountsPayable(initialAccountsPayable);
      setAccountsReceivable(initialAccountsReceivable);
      setCashFlows(initialCashFlows);
      setBankReconciliations(initialBankReconciliations);
      setCostCenters(initialCostCenters);
      setIncomeStatements(initialIncomeStatements);
      setTaxCalculations(initialTaxCalculations);
      setPurchaseBook(initialPurchaseBook);
      setSalesBook(initialSalesBook);
      setExchangeRates(initialExchangeRates);
      setChartOfAccounts(initialChartOfAccounts);
      setAccountingEntries(initialAccountingEntries);
    } finally {
      setDataLoading(false);
    }
  }, [
    setDataLoading, setPatients, setAppointments, setBeds, setLogs, setFinance, setStock,
    setAsos, setDtes, setProfessionals, setPharmacyItems, setStockMovements, setInventoryCounts,
    setAdverseEvents, setQualityDeviations, setBatchRecalls, setIsDbConnected, setInsurances,
    setLocations, setClinicalRooms,
    setFeeSchedules, setPreAuthorizations, setBatchInvoices, setEligibilityChecks, setSettlements,
    setForeignBillings, setAccountsPayable, setAccountsReceivable, setCashFlows,
    setBankReconciliations, setCostCenters, setIncomeStatements, setTaxCalculations,
    setPurchaseBook, setSalesBook, setExchangeRates, setChartOfAccounts, setAccountingEntries,
  ]);

  useEffect(() => {
    if (session) {
       
      loadAllData();
    }
  }, [session, loadAllData]);

  // ──────────────────────────────────────────────
  // 4. Audit log writer — persists to Supabase
  // ──────────────────────────────────────────────
   
  const addAuditLog = useCallback(async (action: string, target: string) => {
    let clientIp = '192.168.1.1';
    try {
      const ipRes = await fetch('/api/client-ip');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData?.ip) clientIp = ipData.ip;
      }
    } catch {}
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      operator: activeOperator,
      role: activeRole,
      action,
      target,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ip: clientIp,
    };

    // Optimistic update in UI
    setLogs(prev => [newLog, ...prev]);

    // Persist to Supabase
    if (supabase) {
      const { error: logError } = await supabase.from('audit_logs').insert({
        id: newLog.id,
        operator: newLog.operator,
        role: newLog.role,
        action: newLog.action,
        target: newLog.target,
        ip: newLog.ip,
      });
      if (logError) {
        console.error("[SUPABASE] INSERT audit_logs FAILED:", logError.message);
      }
    }
  }, [activeOperator, activeRole]);

  // ──────────────────────────────────────────────
  // 5. Auth actions
  // ──────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if account is locked
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      const remaining = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000);
      setLoginError(`Conta temporariamente bloqueada. Tente novamente em ${remaining} minuto(s).`);
      return;
    }

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
    twoFALoginCheckRef.current = true;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setLoginLoading(false);
    if (error) {
      twoFALoginCheckRef.current = false;
      // Track failed login attempt
      const newCount = loginAttemptCount + 1;
      setLoginAttemptCount(newCount);

      // Persiste tentativa falha no banco
      if (supabase) {
        try {
          await supabase.from('login_attempts').insert({
            email: loginEmail,
            success: false,
            ip_address: '192.168.1.1',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent || 'Unknown' : 'Unknown',
            failure_reason: 'Credenciais inválidas',
          });
        } catch {}
      }

      if (newCount >= 5) {
        const lockDuration = 30; // minutes
        const lockTime = new Date(Date.now() + lockDuration * 60000).toISOString();
        setLockedUntil(lockTime);
        setLoginError(`Conta bloqueada por ${lockDuration} minutos devido a múltiplas tentativas de login inválidas.`);
        addAuditLog('Conta Bloqueada por Tentativas', loginEmail);
        setLoginAttemptCount(0);
      } else {
        const remaining = 5 - newCount;
        setLoginError(`Credenciais inválidas. Tentativa ${newCount}/5. Restam ${remaining} tentativa(s).`);
      }
    } else {
      // Successful login - reset counters
      setLoginAttemptCount(0);
      setLockedUntil(null);

      const { user } = data;
      if (user) {
        // Check if user has 2FA enabled
        const { data: tfaData } = await supabase
          .from('two_factor_secrets')
          .select('enabled, secret')
          .eq('user_id', user.id)
          .eq('enabled', true)
          .single();

        if (tfaData) {
          pending2FACredentialsRef.current = { email: loginEmail, password: loginPassword };
          setLoginPassword('');

          // Get the 2FA method from system_users
          const { data: userRow } = await supabase
            .from('system_users')
            .select('two_factor_method')
            .eq('auth_user_id', user.id)
            .single();

          const method = userRow?.two_factor_method || 'totp';
          const routedMethod: 'totp' | 'email' | 'sms' =
            method === 'sms'
              ? 'sms'
              : method === 'email' || tfaData.secret === 'email-otp'
                ? 'email'
                : 'totp';

          // Registra o desafio 2FA no servidor enquanto a sessão pós-senha
          // ainda é válida; depois o sign-out invalida o JWT prematuro
          try {
            const challengeRes = await fetch('/api/admin/2fa', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
              body: JSON.stringify({ action: 'start_challenge', user_id: user.id }),
            });
            const challengeData = await challengeRes.json();
            pending2FAChallengeRef.current = challengeData.challenge || '';
          } catch {}

          // Invalida o JWT criado pela senha — a sessão real só nasce após o 2FA
          await supabase.auth.signOut();

          setPending2FAMethod(routedMethod);
          setPending2FAUserId(user.id);
          setPending2FAEmail(loginEmail);
          setPending2FAQRCode('');
          setPending2FATotpSecret('');
          setPending2FATotpVerified(false);
          setTwoFactorLoginCode('');
          setTwoFactorLoginError('');
          setPending2FABackupMode(false);
          setPending2FAEmailSent(false);
          setLoginLoading(false);
          return;
        }

        // No 2FA — proceed normally
        twoFALoginCheckRef.current = false;
        updateLastActivityTime();
        await supabase
          .from('system_users')
          .update({ last_login: new Date().toISOString() })
          .eq('auth_user_id', user.id);
      }

      // Persiste tentativa bem-sucedida e cria sessão no banco
      if (supabase && user) {
        const now = new Date();
        try {
          await supabase.from('login_attempts').insert({
            email: loginEmail,
            success: true,
            ip_address: '192.168.1.1',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent || 'Unknown' : 'Unknown',
          });
        } catch {}

        try {
          await supabase.from('user_sessions').insert({
            user_id: user.id,
            user_name: activeOperator || loginEmail,
            ip_address: '192.168.1.1',
            device_info: typeof navigator !== 'undefined' ? navigator.userAgent || 'Unknown' : 'Unknown',
            login_at: now.toISOString(),
            last_activity_at: now.toISOString(),
            expires_at: new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString(),
            active: true,
            revoked: false,
          });
        } catch {}
      }
    }
  };

  const handleLogout = useCallback(async () => {
    await addAuditLog('Logout do Sistema', activeOperator);
    setPending2FAUserId(null);
    setPending2FAEmail('');
    setTwoFactorLoginCode('');
    setPending2FABackupMode(false);
    setPending2FAMethod(null);
    setPending2FAQRCode('');
    setPending2FATotpSecret('');
    setPending2FAEmailSent(false);
    setPending2FATotpVerified(false);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const isPlaceholder = supabaseUrl.includes('your-supabase-url') || supabaseUrl === '';
    if (!isPlaceholder && supabase) {
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
  }, [addAuditLog, activeOperator]);

  const twoFAAuthHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(pending2FAChallengeRef.current ? { 'x-2fa-challenge': pending2FAChallengeRef.current } : {}),
  });

  const handle2FAVerify = async () => {
    if (!pending2FAUserId || !pending2FAMethod) return;

    if (pending2FAMethod === 'sms') {
      setTwoFactorLoginError(t('admin_2fa_login_sms_unavailable', 'app'));
      return;
    }

    if (pending2FAMethod === 'email' && !pending2FAEmailSent) {
      setTwoFactorLoginLoading(true);
      try {
        const res = await fetch('/api/admin/2fa', {
          method: 'POST',
          headers: twoFAAuthHeaders(),
          body: JSON.stringify({ action: 'send_email_otp', user_id: pending2FAUserId }),
        });
        const data = await res.json();
        if (data.success) {
          setPending2FAEmailSent(true);
          setTwoFactorLoginError('');
        } else {
          setTwoFactorLoginError(data.error || t('admin_2fa_login_err_send_email', 'app'));
        }
      } catch {
        setTwoFactorLoginError(t('admin_2fa_login_err_send_email', 'app'));
      }
      setTwoFactorLoginLoading(false);
      return;
    }

    if (pending2FAMethod === 'totp' && pending2FATotpVerified) {
      await completeLogin2FA();
      return;
    }

    if (twoFactorLoginCode.length !== 6) {
      setTwoFactorLoginError(t('fin_alert_6_digit_code', 'app') || 'Digite um código de 6 dígitos');
      return;
    }

    setTwoFactorLoginLoading(true);
    setTwoFactorLoginError('');
    try {
      let action = 'verify';
      if (pending2FABackupMode) action = 'verify_backup';
      else if (pending2FAMethod === 'email') action = 'verify_email_otp';

      const body: Record<string, string> = { action, user_id: pending2FAUserId, token: twoFactorLoginCode };
      if (pending2FABackupMode || pending2FAMethod === 'email') body.code = twoFactorLoginCode;

      const res = await fetch('/api/admin/2fa', {
        method: 'POST',
        headers: twoFAAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.valid) {
        if (pending2FAMethod === 'totp' && !pending2FATotpVerified) {
          setPending2FATotpVerified(true);
          setTwoFactorLoginCode('');
          await completeLogin2FA();
        } else {
          await completeLogin2FA();
        }
      } else {
        setTwoFactorLoginError(data.error || t('fin_alert_invalid_code', 'app') || 'Código inválido. Tente novamente.');
      }
    } catch {
      setTwoFactorLoginError(t('admin_2fa_login_err_verify', 'app'));
    }
    setTwoFactorLoginLoading(false);
  };

  const handle2FASendEmail = async () => {
    if (!pending2FAUserId) return;
    setTwoFactorLoginLoading(true);
    try {
      const res = await fetch('/api/admin/2fa', {
        method: 'POST',
        headers: twoFAAuthHeaders(),
        body: JSON.stringify({ action: 'send_email_otp', user_id: pending2FAUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setPending2FAEmailSent(true);
        setTwoFactorLoginError('');
      } else {
        setTwoFactorLoginError(data.error || t('admin_2fa_login_err_send_email', 'app'));
      }
    } catch {
      setTwoFactorLoginError(t('admin_2fa_login_err_send_email', 'app'));
    }
    setTwoFactorLoginLoading(false);
  };

  const completeLogin2FA = async () => {
    // Reautentica com as credenciais guardadas em memória: o JWT prematuro
    // foi invalidado via signOut no início do desafio 2FA
    const creds = pending2FACredentialsRef.current;
    let freshSession: Session | null = null;
    if (creds?.email && creds.password) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (!signInError && signInData.session) freshSession = signInData.session;
    }
    pending2FACredentialsRef.current = null;
    pending2FAChallengeRef.current = '';
    twoFALoginCheckRef.current = false;

    updateLastActivityTime();
    await supabase
      .from('system_users')
      .update({ last_login: new Date().toISOString() })
      .eq('auth_user_id', pending2FAUserId);

    const now = new Date();
    try {
      await supabase.from('login_attempts').insert({
        email: pending2FAEmail,
        success: true,
        ip_address: '192.168.1.1',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent || 'Unknown' : 'Unknown',
      });
    } catch {}

    try {
      await supabase.from('user_sessions').insert({
        user_id: pending2FAUserId,
        user_name: activeOperator || pending2FAEmail,
        ip_address: '192.168.1.1',
        device_info: typeof navigator !== 'undefined' ? navigator.userAgent || 'Unknown' : 'Unknown',
        login_at: now.toISOString(),
        last_activity_at: now.toISOString(),
        expires_at: new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString(),
        active: true,
        revoked: false,
      });
    } catch {}

    if (!freshSession) {
      const { data: { session: restoredSession } } = await supabase.auth.getSession();
      freshSession = restoredSession;
    }
    if (freshSession) setSession(freshSession);
    setPending2FAUserId(null);
    setPending2FAMethod(null);
    setPending2FAQRCode('');
    setPending2FATotpSecret('');
    setPending2FAEmailSent(false);
    setPending2FATotpVerified(false);
  };

  // ──────────────────────────────────────────────
  // 1b. Inactivity / Session Timeout Tracker
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    const handleUserActivity = () => {
      updateLastActivityTime();
      if (showInactivityWarningRef.current) {
        showInactivityWarningRef.current = false;
        setShowInactivityWarning(false);
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    const interval = setInterval(() => {
      const currentLastActivity = getLastActivityTime();
      const elapsed = Date.now() - currentLastActivity;
      // Grace period: if warning was dismissed in the last 5 seconds, skip logout check
      const dismissedRecently = Date.now() - lastWarningDismissedAtRef.current < 5000;
      if (elapsed >= SESSION_TIMEOUT_MS && !dismissedRecently) {
        addAuditLog('Sessão Expirada por Inatividade', activeOperator);
        handleLogout();
      } else if (elapsed >= INACTIVITY_WARNING_MS && !showInactivityWarningRef.current) {
        showInactivityWarningRef.current = true;
        setShowInactivityWarning(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(interval);
    };
  }, [session, SESSION_TIMEOUT_MS, INACTIVITY_WARNING_MS, activeOperator, addAuditLog, handleLogout]);

  // ──────────────────────────────────────────────
  // Submodule config
  // ──────────────────────────────────────────────
  const getSubmoduleTitle = () => {
    if (activeSubmodule === null) return t('portal_title', 'app');
    return t(`submodule_${activeSubmodule}`, 'app');
  };

  const cards = [
    { id: 1, icon: Users2, color: "border-teal-500 text-teal-600 bg-teal-50/50" },    { id: 2, icon: CalendarDays, color: "border-teal-500 text-teal-600 bg-teal-50/50" },
    { id: 3, icon: ClipboardList, color: "border-sky-500 text-sky-600 bg-sky-50/50" },
    { id: 4, icon: Microscope, color: "border-sky-500 text-sky-600 bg-sky-50/50" },
    { id: 5, icon: Receipt, color: "border-emerald-500 text-emerald-600 bg-emerald-50/50" },
    { id: 6, icon: TrendingUp, color: "border-emerald-500 text-emerald-600 bg-emerald-50/50" },
    { id: 7, icon: Pill, color: "border-indigo-500 text-indigo-600 bg-indigo-50/50" },
    { id: 8, icon: HeartPulse, color: "border-rose-500 text-rose-600 bg-rose-50/50" },
    { id: 9, icon: ShieldAlert, color: "border-rose-500 text-rose-600 bg-rose-50/50" },
    { id: 10, icon: Megaphone, color: "border-teal-500 text-teal-600 bg-teal-50/50" },
    { id: 11, icon: BedDouble, color: "border-violet-500 text-violet-600 bg-violet-50/50" },
    { id: 12, icon: BarChart3, color: "border-slate-500 text-slate-600 bg-slate-50/50" },
    { id: 13, icon: Smartphone, color: "border-indigo-500 text-indigo-600 bg-indigo-50/50" },
    { id: 14, icon: Settings, color: "border-slate-500 text-slate-600 bg-slate-50/50" },
    { id: 15, icon: Building2, color: "border-emerald-500 text-emerald-600 bg-emerald-50/50" },
    { id: 16, icon: Hash, color: "border-teal-500 text-teal-600 bg-teal-50/50" },
    { id: 17, icon: AlertCircle, color: "border-amber-500 text-amber-600 bg-amber-50/50" },
    { id: 18, icon: Send, color: "border-indigo-500 text-indigo-600 bg-indigo-50/50" },
    { id: 19, icon: Wifi, color: "border-cyan-500 text-cyan-600 bg-cyan-50/50" },
    { id: 20, icon: Banknote, color: "border-violet-500 text-violet-600 bg-violet-50/50" },
    { id: 21, icon: Globe, color: "border-blue-500 text-blue-600 bg-blue-50/50" },
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
  if (!session || pending2FAUserId || twoFALoginCheckRef.current) {
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
            {pending2FAUserId && pending2FAMethod ? (
              <TwoFactorLoginScreen
                method={pending2FAMethod}
                emailSent={pending2FAEmailSent}
                code={twoFactorLoginCode}
                error={twoFactorLoginError}
                loading={twoFactorLoginLoading}
                backupMode={pending2FABackupMode}
                onCodeChange={setTwoFactorLoginCode}
                onVerify={handle2FAVerify}
                onSendEmail={handle2FASendEmail}
                onToggleBackup={() => setPending2FABackupMode(!pending2FABackupMode)}
                onBack={() => {
                  twoFALoginCheckRef.current = false;
                  pending2FACredentialsRef.current = null;
                  pending2FAChallengeRef.current = '';
                  setPending2FAUserId(null);
                  setPending2FAMethod(null);
                  setPending2FAQRCode('');
                  setPending2FATotpSecret('');
                  setTwoFactorLoginCode('');
                  setTwoFactorLoginError('');
                  setPending2FABackupMode(false);
                  setPending2FAEmailSent(false);
                  setPending2FATotpVerified(false);
                }}
              />
            ) : (
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
                disabled={loginLoading || !!(lockedUntil && new Date(lockedUntil) > new Date())}
                className="w-full bg-[#00a884] hover:bg-[#008f70] text-white font-bold py-3 rounded-lg transition-all tracking-wide text-xs uppercase mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('authenticating')}
                  </span>
                ) : (lockedUntil && new Date(lockedUntil) > new Date()) ? t('blocked') : t('submit')}
              </Button>
            </form>
            )}

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
              {t('connecting', 'app')}
            </Badge>
          )}

          {/* Audit logs bell */}
          <div className="relative">
            <button
              onClick={() => { setShowLogDropdown(!showLogDropdown); setShowHelpModal(false); }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg shrink-0 transition relative cursor-pointer"
              title={t('audit_logs_tooltip', 'app')}
            >
              <Bell className="w-5 h-5" />
              {logs.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
            </button>

            {showLogDropdown && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-4 space-y-3 font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" /> {t('audit_logs_title', 'app')}
                  </h4>
                  <span className="text-[9px] bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-bold">{t('audit_live', 'app')}</span>
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
            title={t('manual_operational', 'app')}
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
                    <button
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
                    </button>
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
                {activeSubmodule === 1 && (
                  <PermissionGate view="reception" userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_reception', 'app')}>
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
                      userPermissions={profile?.permissions}
                      insurances={insurances}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
                )}
                {activeSubmodule === 2 && (
                  <PermissionGate view="agenda" userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_agenda', 'app')}>
                    <AgendaModule
                      patients={patients}
                      appointments={appointments}
                      setPatients={setPatients}
                      setAppointments={setAppointments}
                      addAuditLog={addAuditLog}
                      professionals={professionals}
                      activeRole={activeRole}
                      activeOperator={activeOperator}
                      userId={profile?.id}
                      userPermissions={profile?.permissions}
                      insurances={insurances}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
                )}
                {(activeSubmodule === 3 || activeSubmodule === 8) && (
                  <PermissionGate view={activeSubmodule === 8 ? 'pcmso' : 'hce'} userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_clinical', 'app')}>
                    <ClinicalModule
                      patients={patients}
                      setPatients={setPatients}
                      activeSubmodule={activeSubmodule}
                      addAuditLog={addAuditLog}
                      asos={asos}
                      setAsos={setAsos}
                      professionals={professionals}
                      userPermissions={profile?.permissions}
                      activeOperator={activeOperator}
                      activeOperatorEmail={session?.user?.email || ''}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
                )}
                {activeSubmodule === 9 && (
                  <PermissionGate view="med_work" userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_medwork', 'app')}>
                    <MedicinaTrabalhoModule
                      activeSubmodule={activeSubmodule}
                      addAuditLog={addAuditLog}
                      asos={asos}
                      setAsos={setAsos}
                      userPermissions={profile?.permissions}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
                )}
                {activeSubmodule === 4 && (
                  <PermissionGate view="diagnostic" userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_diag', 'app')}>
                    <DiagnosticModule
                      patients={patients}
                      activeSubmodule={activeSubmodule}
                      addAuditLog={addAuditLog}
                      userPermissions={profile?.permissions}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
                )}
                {activeSubmodule === 7 && (
                  <PermissionGate view="stock" userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_stock', 'app')}>
                    <EstoqueFarmaciaModule
                      addAuditLog={addAuditLog}
                      patients={patients}
                      pharmacyItems={pharmacyItems}
                      setPharmacyItems={setPharmacyItems}
                      stockMovements={stockMovements}
                      setStockMovements={setStockMovements}
                      inventoryCounts={inventoryCounts}
                      setInventoryCounts={setInventoryCounts}
                      adverseEvents={adverseEvents}
                      setAdverseEvents={setAdverseEvents}
                      qualityDeviations={qualityDeviations}
                      setQualityDeviations={setQualityDeviations}
                      batchRecalls={batchRecalls}
                      setBatchRecalls={setBatchRecalls}
                      activeRole={activeRole}
                      activeOperator={activeOperator}
                      userPermissions={profile?.permissions}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
                )}
                {(() => {
                  const adminView = activeSubmodule !== null ? ADMIN_FINANCE_VIEW_BY_SUBMODULE[activeSubmodule] : undefined;
                  if (!adminView) return null;
                  return (
                    <PermissionGate view={adminView} userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_admin', 'app')}>
                    <AdminFinanceModule
                    activeSubmodule={activeSubmodule}
                    addAuditLog={addAuditLog}
                    userPermissions={profile?.permissions}
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
                    professionalRoles={professionalRoles}
                    setProfessionalRoles={setProfessionalRoles}
                    insurances={insurances}
                    setInsurances={setInsurances}
                    feeSchedules={feeSchedules}
                    setFeeSchedules={setFeeSchedules}
                    preAuthorizations={preAuthorizations}
                    setPreAuthorizations={setPreAuthorizations}
                    procedureCatalog={procedureCatalog}
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
                    locations={locations}
                    setLocations={setLocations}
                    clinicalRooms={clinicalRooms}
                    setClinicalRooms={setClinicalRooms}
                     passwordPolicy={passwordPolicy}
                     onPasswordPolicyChange={setPasswordPolicy}
                     />
                     </ErrorBoundary>
                    </PermissionGate>
                  );
                })()}
                {activeSubmodule === 11 && (
                  <PermissionGate view="hospitalization" userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_intern', 'app')}>
                    <InternacaoCentroCirurgicoModule
                      activeSubmodule={activeSubmodule}
                      addAuditLog={addAuditLog}
                      patients={patients}
                      setPatients={setPatients}
                      userPermissions={profile?.permissions}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
                )}
                {(activeSubmodule === 10 || activeSubmodule === 12) && (
                  <PermissionGate view={activeSubmodule === 12 ? 'bi' : 'crm'} userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_crm', 'app')}>
                    <CrmBiModule
                      activeSubmodule={activeSubmodule}
                      addAuditLog={addAuditLog}
                      beds={beds}
                      setBeds={setBeds}
                      patients={patients}
                      financePostings={finance}
                      userPermissions={profile?.permissions}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
                )}
                {activeSubmodule === 13 && (
                  <PermissionGate view="patient_portal" userPermissions={profile?.permissions}>
                    <ErrorBoundary moduleName={t('mod_name_portal', 'app')}>
                    <PatientPortalModule
                      patients={patients}
                      setPatients={setPatients}
                      appointments={appointments}
                      setAppointments={setAppointments}
                      dtes={dtes}
                      setDtes={setDtes}
                      addAuditLog={addAuditLog}
                      userPermissions={profile?.permissions}
                    />
                    </ErrorBoundary>
                  </PermissionGate>
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
              <Info className="w-5 h-5 text-teal-600" /> {t('help_modal_title', 'app')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-800">{t('help_modal_subtitle', 'app')}</p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium text-slate-600">
              <li>{t('help_item_1', 'app')}</li>
              <li>{t('help_item_2', 'app')}</li>
              <li>{t('help_item_3', 'app')}</li>
              <li>{t('help_item_4', 'app')}</li>
              <li>{t('help_item_5', 'app')}</li>
              <li>{t('help_item_6', 'app')}</li>
              <li>{t('help_item_7', 'app')}</li>
              <li>{t('help_item_8', 'app')}</li>
            </ul>
          </div>
          <p className="text-[10px] text-slate-400 pt-2">{t('help_footer', 'app')}</p>
        </DialogContent>
      </Dialog>

      {/* Inactivity Warning Modal */}
      {showInactivityWarning && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-amber-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <h3 className="font-black text-sm">{t('session_warning_title', 'app')}</h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('session_warning_body', 'app')}
              </p>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-800 font-medium">
                  {t('session_warning_note', 'app')}
                </p>
              </div>
              <button
                onClick={() => { setShowInactivityWarning(false); updateLastActivityTime(); showInactivityWarningRef.current = false; lastWarningDismissedAtRef.current = Date.now(); }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer transition"
              >
                {t('session_continue', 'app')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
