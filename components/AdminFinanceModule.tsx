'use client';

import React, { useState } from 'react';
import PhoneInput from '@/components/PhoneInput';
import { isValidPhoneNumber } from 'libphonenumber-js';
import {
  LocationsTab,
  InsuranceTab,
  DteTab,
  ProfessionalsTab,
  UsersTab,
  FinancialTab,
  AuditTab,
  SsoTab,
  PasswordPolicyTab,
  KudeModal,
  XmlModal,
  GatewayModal,
} from './admin';
import { FinancialPosting, StockItem, AuditLog, Dte, DteItem, Patient, Professional, ProfessionalCouncil, ProfessionalShift, FeeSchedule, InsuranceCompany, PreAuthorization, BatchInvoice, EligibilityCheck, ProfessionalSettlement, ForeignBilling, AccountPayable, AccountReceivable, CashFlowProjection, BankReconciliation, CostCenter, IncomeStatement, TaxCalculation, PurchaseBookEntry, SalesBookEntry, ExchangeRate, ChartOfAccount, AccountingEntry, initialInsurances, initialFeeSchedules, initialPreAuthorizations, initialBatchInvoices, initialEligibilityChecks, initialSettlements, initialForeignBillings, initialAccountsPayable, initialAccountsReceivable, initialCashFlows, initialBankReconciliations, initialCostCenters, initialIncomeStatements, initialTaxCalculations, initialPurchaseBook, initialSalesBook, initialExchangeRates, initialChartOfAccounts, initialAccountingEntries,
  SystemUser, PasswordPolicy, UserSession, LoginAttempt, SSOProvider, SystemRole,
  InsuranceType,
  initialPasswordPolicy, initialUserSessions, initialLoginAttempts, initialSSOProviders,
  Location, ClinicalRoom, initialLocations, initialClinicalRooms,
} from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { useFormValidation } from '@/lib/validation';
import { financialPostingSchema, financeStockItemSchema, ssoProviderSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';
import I18nDatePicker from '@/components/I18nDatePicker';
import RolesTab from './RolesTab';
import {
  Receipt, TrendingUp, Pill, Settings, Plus, Check,
  AlertTriangle, ShieldCheck, Download, FileText, X,
  QrCode, Stamp, Wifi, WifiOff, CreditCard, Smartphone,
  ChevronDown, ChevronRight, RefreshCw, Send, Ban, Eye,
  Building2, Hash, Globe, CheckCircle2, XCircle, Clock,
  AlertCircle, Banknote, Zap, Shield, FileCheck, Printer,
  Stethoscope, UserPlus, UserCheck, UserX, Mail, Phone, Briefcase, Calendar, Edit2, Users, Trash2,
  Lock, KeyRound, Fingerprint, DoorOpen, LogOut, Gauge,
  Smartphone as SmartphoneIcon, ScanLine, Copy, CheckCheck,
  IdCard, MapPin, Star, ToggleLeft, ToggleRight,
} from 'lucide-react';

interface AdminFinanceModuleProps {
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  logs: AuditLog[];
  financePostings: FinancialPosting[];
  setFinancePostings: React.Dispatch<React.SetStateAction<FinancialPosting[]>>;
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  dtes?: Dte[];
  setDtes?: React.Dispatch<React.SetStateAction<Dte[]>>;
  patients?: Patient[];
  professionals?: Professional[];
  setProfessionals?: React.Dispatch<React.SetStateAction<Professional[]>>;
  professionalRoles?: {id: string; name: string; description?: string; category?: string; active?: boolean}[];
  setProfessionalRoles?: React.Dispatch<React.SetStateAction<{id: string; name: string; description?: string; category?: string; active?: boolean}[]>>;
  insurances?: InsuranceCompany[];
  setInsurances?: React.Dispatch<React.SetStateAction<InsuranceCompany[]>>;
  feeSchedules?: FeeSchedule[];
  setFeeSchedules?: React.Dispatch<React.SetStateAction<FeeSchedule[]>>;
  preAuthorizations?: PreAuthorization[];
  setPreAuthorizations?: React.Dispatch<React.SetStateAction<PreAuthorization[]>>;
  batchInvoices?: BatchInvoice[];
  setBatchInvoices?: React.Dispatch<React.SetStateAction<BatchInvoice[]>>;
  eligibilityChecks?: EligibilityCheck[];
  setEligibilityChecks?: React.Dispatch<React.SetStateAction<EligibilityCheck[]>>;
  settlements?: ProfessionalSettlement[];
  setSettlements?: React.Dispatch<React.SetStateAction<ProfessionalSettlement[]>>;
  foreignBillings?: ForeignBilling[];
  setForeignBillings?: React.Dispatch<React.SetStateAction<ForeignBilling[]>>;
  accountsPayable?: AccountPayable[];
  setAccountsPayable?: React.Dispatch<React.SetStateAction<AccountPayable[]>>;
  accountsReceivable?: AccountReceivable[];
  setAccountsReceivable?: React.Dispatch<React.SetStateAction<AccountReceivable[]>>;
  cashFlows?: CashFlowProjection[];
  setCashFlows?: React.Dispatch<React.SetStateAction<CashFlowProjection[]>>;
  bankReconciliations?: BankReconciliation[];
  setBankReconciliations?: React.Dispatch<React.SetStateAction<BankReconciliation[]>>;
  costCenters?: CostCenter[];
  setCostCenters?: React.Dispatch<React.SetStateAction<CostCenter[]>>;
  incomeStatements?: IncomeStatement[];
  setIncomeStatements?: React.Dispatch<React.SetStateAction<IncomeStatement[]>>;
  taxCalculations?: TaxCalculation[];
  setTaxCalculations?: React.Dispatch<React.SetStateAction<TaxCalculation[]>>;
  purchaseBook?: PurchaseBookEntry[];
  setPurchaseBook?: React.Dispatch<React.SetStateAction<PurchaseBookEntry[]>>;
  salesBook?: SalesBookEntry[];
  setSalesBook?: React.Dispatch<React.SetStateAction<SalesBookEntry[]>>;
  exchangeRates?: ExchangeRate[];
  setExchangeRates?: React.Dispatch<React.SetStateAction<ExchangeRate[]>>;
  chartOfAccounts?: ChartOfAccount[];
  setChartOfAccounts?: React.Dispatch<React.SetStateAction<ChartOfAccount[]>>;
  accountingEntries?: AccountingEntry[];
  setAccountingEntries?: React.Dispatch<React.SetStateAction<AccountingEntry[]>>;
  locations?: Location[];
  setLocations?: React.Dispatch<React.SetStateAction<Location[]>>;
  clinicalRooms?: ClinicalRoom[];
  setClinicalRooms?: React.Dispatch<React.SetStateAction<ClinicalRoom[]>>;
  passwordPolicy?: PasswordPolicy;
  onPasswordPolicyChange?: (policy: PasswordPolicy) => void;
}

const GS = (v: number) => `Gs. ${v.toLocaleString('es-PY')}`;

const GATEWAYS = ['Bancard', 'Pagopar', 'Tigo Money', 'Personal Pay', 'Eko Network', 'Transferência'] as const;

const PROCEDURES = [
  { code: '10101012', desc: 'Consulta Médica Geral', price: 150000, iva: 10 as const },
  { code: '10101025', desc: 'Consulta Cardiológica', price: 350000, iva: 10 as const },
  { code: '40101010', desc: 'Eletrocardiograma (ECG)', price: 250000, iva: 10 as const },
  { code: '40201011', desc: 'Ultrassonografia Obstétrica', price: 500000, iva: 10 as const },
  { code: '40201020', desc: 'Ecografia Abdominal', price: 400000, iva: 10 as const },
  { code: '20103015', desc: 'Hemograma Completo', price: 120000, iva: 5 as const },
  { code: '99001001', desc: 'Exame Admissional - Med. Trabalho', price: 300000, iva: 10 as const },
  { code: '30101000', desc: 'Raio-X Tórax (2 incidências)', price: 180000, iva: 10 as const },
];

function statusBadge(status: Dte['status']) {
  const map: Record<string, string> = {
    'Aprovado': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Enviado': 'bg-blue-100 text-blue-800 border-blue-200',
    'Gerado': 'bg-slate-100 text-slate-700 border-slate-200',
    'Pendente de Envio': 'bg-amber-100 text-amber-800 border-amber-200',
    'Rejeitado': 'bg-rose-100 text-rose-800 border-rose-200',
    'Cancelado': 'bg-slate-100 text-slate-500 border-slate-200 line-through',
    'Inutilizado': 'bg-slate-200 text-slate-400 border-slate-300',
  };
  return `inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${map[status] || ''}`;
}

function payStatusBadge(s: Dte['payment_status']) {
  const map: Record<string, string> = {
    pendente: 'bg-amber-50 text-amber-700 border-amber-200',
    pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    conciliado: 'bg-teal-50 text-teal-700 border-teal-200',
    cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return `inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${map[s] || ''}`;
}

function generateCdc(timbrado: string, establishment: string, point: string, seq: number): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = String(seq).padStart(7, '0');
  const rand = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
  return `${timbrado}${establishment}${point}${seqStr}${dateStr}00${rand}`;
}

function generateXml(dte: Partial<Dte> & { items: DteItem[] }, certName: string, env: string): string {
  const itemsXml = dte.items.map(it => `
    <gCamItem>
      <dCodInt>${it.code}</dCodInt>
      <dDesProSer>${it.description}</dDesProSer>
      <cUniMed>77</cUniMed>
      <dCantProSer>${it.quantity}</dCantProSer>
      <dPUniProSer>${it.unit_price}</dPUniProSer>
      <dTotBruOpeItem>${it.total}</dTotBruOpeItem>
      <dIVA>${it.iva_rate}</dIVA>
    </gCamItem>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://ekuatia.set.gov.py/sifen/xsd"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://ekuatia.set.gov.py/sifen/xsd siRecepDE_v150.xsd">
  <DE>
    <gTimb>
      <iTiDE>${dte.type === 'Fatura Eletrônica' ? 1 : dte.type === 'Nota de Crédito' ? 5 : dte.type === 'Nota de Débito' ? 6 : dte.type === 'Nota de Remessa' ? 7 : 4}</iTiDE>
      <dNumTim>${dte.timbrado}</dNumTim>
      <dEst>${dte.establishment}</dEst>
      <dPunExp>${dte.expedition_point}</dPunExp>
      <dNumDoc>${String(dte.number?.split('-')[2] || '1').padStart(7, '0')}</dNumDoc>
      <dSerieNum>${dte.number}</dSerieNum>
      <dFeIniVig>${new Date().toISOString().split('T')[0]}</dFeIniVig>
      <dVencTim>2027-12-31</dVencTim>
    </gTimb>
    <gDatGralOpe>
      <dFeEmiDE>${new Date().toISOString()}</dFeEmiDE>
      <dCodSeg>${Math.floor(10000000 + Math.random() * 89999999)}</dCodSeg>
      <dInfoEmi>IAMED - Sistema de Gestão Médica</dInfoEmi>
      <dInfoFisc>${env === 'producao' ? 'PRODUCCION' : 'TEST'}</dInfoFisc>
    </gDatGralOpe>
    <gDatRec>
      <dNomRec>${dte.patient_name}</dNomRec>
      <dEmailRec>${dte.patient_email || ''}</dEmailRec>
    </gDatRec>
    <gDtipDE>
      <gCamCond>
        <iCondOpe>1</iCondOpe>
        <gPaConEIVA>${dte.items.reduce((s, i) => s + i.total, 0)}</gPaConEIVA>
      </gCamCond>
      <gCamItem>
        ${itemsXml}
      </gCamItem>
    </gDtipDE>
    <gTotSub>
      <dTotGralOpe>${dte.amount || 0}</dTotGralOpe>
      <dIVA5>${dte.iva_5 || 0}</dIVA5>
      <dIVA10>${dte.iva_10 || 0}</dIVA10>
    </gTotSub>
  </DE>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    </SignedInfo>
    <SignatureValue><!-- Assinado por PCSC: ${certName} — Lei 6822/2021 --></SignatureValue>
    <KeyInfo>
      <X509Data><X509Certificate>MIIDvTCCAqWgAwIBAgI...PCSC-HABILITADO</X509Certificate></X509Data>
    </KeyInfo>
  </Signature>
</rDE>`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminFinanceModule({
  activeSubmodule,
  addAuditLog,
  logs,
  financePostings,
  setFinancePostings,
  stockItems,
  setStockItems,
  dtes = [],
  setDtes,
  patients = [],
  professionals = [],
  setProfessionals,
  professionalRoles = [],
  setProfessionalRoles = () => {},
  insurances: insurancesProp,
  setInsurances: setInsurancesProp,
  feeSchedules: feeSchedulesProp,
  setFeeSchedules: setFeeSchedulesProp,
  preAuthorizations: preAuthsProp,
  setPreAuthorizations: setPreAuthsProp,
  batchInvoices: batchInvoicesProp,
  setBatchInvoices: setBatchInvoicesProp,
  eligibilityChecks: eligProp,
  setEligibilityChecks: setEligProp,
  settlements: settlementsProp,
  setSettlements: setSettlementsProp,
  foreignBillings: foreignBillingsProp,
  setForeignBillings: setForeignBillingsProp,
  accountsPayable: accountsPayableProp,
  setAccountsPayable: setAccountsPayableProp,
  accountsReceivable: accountsReceivableProp,
  setAccountsReceivable: setAccountsReceivableProp,
  cashFlows: cashFlowsProp,
  setCashFlows: setCashFlowsProp,
  bankReconciliations: bankReconciliationsProp,
  setBankReconciliations: setBankReconciliationsProp,
  costCenters: costCentersProp,
  setCostCenters: setCostCentersProp,
  incomeStatements: incomeStatementsProp,
  setIncomeStatements: setIncomeStatementsProp,
  taxCalculations: taxCalculationsProp,
  setTaxCalculations: setTaxCalculationsProp,
  purchaseBook: purchaseBookProp,
  setPurchaseBook: setPurchaseBookProp,
  salesBook: salesBookProp,
  setSalesBook: setSalesBookProp,
  exchangeRates: exchangeRatesProp,
  setExchangeRates: setExchangeRatesProp,
  chartOfAccounts: chartOfAccountsProp,
  setChartOfAccounts: setChartOfAccountsProp,
  accountingEntries: accountingEntriesProp,
  setAccountingEntries: setAccountingEntriesProp,
  locations: locationsProp,
  setLocations: setLocationsProp,
  clinicalRooms: clinicalRoomsProp,
  setClinicalRooms: setClinicalRoomsProp,
  passwordPolicy: passwordPolicyProp,
  onPasswordPolicyChange,
}: AdminFinanceModuleProps) {
  const { t } = useI18n();

  // ─── SEQUENTIAL ID GENERATION (Postgres RPC) ───
  const genModuleId = useModuleId();

  const postingValidation = useFormValidation(financialPostingSchema);
  const stockItemValidation = useFormValidation(financeStockItemSchema);
  const ssoValidation = useFormValidation(ssoProviderSchema);

  // Financial tabs
  const [finTab, setFinTab] = useState<'dashboard' | 'ap_ar' | 'cashflow' | 'reconciliation' | 'cost_centers' | 'dre' | 'tax' | 'books' | 'multicurrency' | 'chart_accounts' | 'accounting_entries'>('dashboard');

  // Local state fallbacks for new data
  const [insurances, setInsurances] = useState<InsuranceCompany[]>(insurancesProp || initialInsurances);
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>(feeSchedulesProp || initialFeeSchedules);
  const [preAuthorizations, setPreAuthorizations] = useState<PreAuthorization[]>(preAuthsProp || initialPreAuthorizations);
  const [batchInvoices, setBatchInvoices] = useState<BatchInvoice[]>(batchInvoicesProp || initialBatchInvoices);
  const [eligibilityChecks, setEligibilityChecks] = useState<EligibilityCheck[]>(eligProp || initialEligibilityChecks);
  const [settlements, setSettlements] = useState<ProfessionalSettlement[]>(settlementsProp || initialSettlements);
  const [foreignBillings, setForeignBillings] = useState<ForeignBilling[]>(foreignBillingsProp || initialForeignBillings);

  // Sync local state up when props change
   
  React.useEffect(() => { if (insurancesProp) setInsurances(insurancesProp); }, [insurancesProp]);
   
  React.useEffect(() => { if (feeSchedulesProp) setFeeSchedules(feeSchedulesProp); }, [feeSchedulesProp]);
   
  React.useEffect(() => { if (preAuthsProp) setPreAuthorizations(preAuthsProp); }, [preAuthsProp]);
   
  React.useEffect(() => { if (batchInvoicesProp) setBatchInvoices(batchInvoicesProp); }, [batchInvoicesProp]);
   
  React.useEffect(() => { if (eligProp) setEligibilityChecks(eligProp); }, [eligProp]);
   
  React.useEffect(() => { if (settlementsProp) setSettlements(settlementsProp); }, [settlementsProp]);
   
  React.useEffect(() => { if (foreignBillingsProp) setForeignBillings(foreignBillingsProp); }, [foreignBillingsProp]);

  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>(accountsPayableProp || initialAccountsPayable);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>(accountsReceivableProp || initialAccountsReceivable);
  const [cashFlows, setCashFlows] = useState<CashFlowProjection[]>(cashFlowsProp || initialCashFlows);
  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>(bankReconciliationsProp || initialBankReconciliations);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(costCentersProp || initialCostCenters);
  const [incomeStatements, setIncomeStatements] = useState<IncomeStatement[]>(incomeStatementsProp || initialIncomeStatements);
  const [taxCalculations, setTaxCalculations] = useState<TaxCalculation[]>(taxCalculationsProp || initialTaxCalculations);
  const [purchaseBook, setPurchaseBook] = useState<PurchaseBookEntry[]>(purchaseBookProp || initialPurchaseBook);
  const [salesBook, setSalesBook] = useState<SalesBookEntry[]>(salesBookProp || initialSalesBook);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(exchangeRatesProp || initialExchangeRates);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>(chartOfAccountsProp || initialChartOfAccounts);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>(accountingEntriesProp || initialAccountingEntries);

  // Insurance form state
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingInsuranceId, setEditingInsuranceId] = useState<string | null>(null);
  const [insuranceForm, setInsuranceForm] = useState({
    name: '',
    type: 'IPS' as InsuranceType,
    ruc: '',
    contact: '',
    phone: '',
    email: '',
    has_webservice: false,
    webservice_url: '',
    requires_authorization: true,
    requires_pre_approval: false,
    copay_rules: '',
    coverage_ceiling: 0,
  });

   
  React.useEffect(() => { if (accountsPayableProp) setAccountsPayable(accountsPayableProp); }, [accountsPayableProp]);
   
  React.useEffect(() => { if (accountsReceivableProp) setAccountsReceivable(accountsReceivableProp); }, [accountsReceivableProp]);
   
  React.useEffect(() => { if (cashFlowsProp) setCashFlows(cashFlowsProp); }, [cashFlowsProp]);
   
  React.useEffect(() => { if (bankReconciliationsProp) setBankReconciliations(bankReconciliationsProp); }, [bankReconciliationsProp]);
   
  React.useEffect(() => { if (costCentersProp) setCostCenters(costCentersProp); }, [costCentersProp]);
   
  React.useEffect(() => { if (incomeStatementsProp) setIncomeStatements(incomeStatementsProp); }, [incomeStatementsProp]);
   
  React.useEffect(() => { if (taxCalculationsProp) setTaxCalculations(taxCalculationsProp); }, [taxCalculationsProp]);
   
  React.useEffect(() => { if (purchaseBookProp) setPurchaseBook(purchaseBookProp); }, [purchaseBookProp]);
   
  React.useEffect(() => { if (salesBookProp) setSalesBook(salesBookProp); }, [salesBookProp]);
   
  React.useEffect(() => { if (exchangeRatesProp) setExchangeRates(exchangeRatesProp); }, [exchangeRatesProp]);
   
  React.useEffect(() => { if (chartOfAccountsProp) setChartOfAccounts(chartOfAccountsProp); }, [chartOfAccountsProp]);
   
  React.useEffect(() => { if (accountingEntriesProp) setAccountingEntries(accountingEntriesProp); }, [accountingEntriesProp]);

  // ── Admin tab (submodule 14) ────────────────────────────────────────────────────────
  type AdminTab = 'users' | 'security' | 'password-policy' | 'two-factor' | 'sso' | 'sessions' | 'professionals' | 'locations' | 'rooms' | 'roles';
  const [adminTab, setAdminTab] = useState<AdminTab>('users');

  // ── Locations & Rooms State ────────────────────────────────────────────────────────
  const [locations, setLocations] = useState<Location[]>(locationsProp || initialLocations);
  const [clinicalRooms, setClinicalRooms] = useState<ClinicalRoom[]>(clinicalRoomsProp || initialClinicalRooms);

   
  React.useEffect(() => { if (locationsProp) setLocations(locationsProp); }, [locationsProp]);
   
  React.useEffect(() => { if (clinicalRoomsProp) setClinicalRooms(clinicalRoomsProp); }, [clinicalRoomsProp]);

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  const loadSystemUsersFromSupabase = async () => {
    const { data: usersData } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: true });
    if (usersData) {
      const profIds = usersData.filter(u => u.professional_id).map(u => u.professional_id);
      let profMap: Record<string, string> = {};
      let profEmailMap: Record<string, string> = {};

      if (profIds.length > 0) {
        const { data: profs } = await supabase.from('professionals').select('id, name, email').in('id', profIds);
        if (profs) {
          profMap = Object.fromEntries(profs.map(p => [p.id, p.name]));
          profEmailMap = Object.fromEntries(profs.filter(p => p.email).map(p => [p.id, p.email]));
        }
      }

      setSystemUsers(usersData.map(u => {
        const profName = u.professional_id ? profMap[u.professional_id] : null;
        const profEmail = u.professional_id ? profEmailMap[u.professional_id] : null;
        return {
          id: u.id,
          authUserId: u.auth_user_id,
          professionalId: u.professional_id,
          name: profName || u.ci || u.id,
          email: profEmail || '',
          ci: u.ci,
          systemRole: u.system_role,
          permissions: u.permissions || [],
          location: u.location,
          status: u.status,
          twoFactorEnabled: u.two_factor_enabled,
          twoFactorMethod: u.two_factor_method,
          lastLogin: u.last_login,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        };
      }));
    }
  };

  React.useEffect(() => {
     
    loadSystemUsersFromSupabase();
  }, []);

  // ── Professional Form States ────────────────────────────────────────────────────────
  const [profFormOpen, setProfFormOpen] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [profName, setProfName] = useState('');
  const [profRole, setProfRole] = useState<string>('Médico(a)');
  const [profSpecialty, setProfSpecialty] = useState('');
  const [profCouncil, setProfCouncil] = useState<ProfessionalCouncil>('CRM');
  const [profCouncilNumber, setProfCouncilNumber] = useState('');
  const [profShift, setProfShift] = useState<ProfessionalShift>('Manhã');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profAdmission, setProfAdmission] = useState('');
  const [profStatus, setProfStatus] = useState<'ativo' | 'inativo' | 'férias'>('ativo');
  const [profLocationId, setProfLocationId] = useState('');

  const profColors = ['bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-pink-500'];

const resetProfForm = () => {
    setEditingProfId(null);
    setProfName('');
    setProfRole('Médico(a)');
    setProfSpecialty('');
    setProfCouncil('CRM');
    setProfCouncilNumber('');
    setProfShift('Manhã');
    setProfEmail('');
    setProfPhone('');
    setProfAdmission('');
    setProfStatus('ativo');
    setProfLocationId('');
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim() || !profSpecialty.trim() || !profCouncilNumber.trim() || !profAdmission.trim() || !profLocationId.trim()) {
      alert(t('admin_alert_required_prof_fields', 'app'));
      return;
    }
    if (!profPhone.trim()) {
      alert(t('admin_alert_required_phone', 'app'));
      return;
    }
    if (!isValidPhoneNumber(profPhone)) {
      alert(t('admin_alert_invalid_phone', 'app'));
      return;
    }
    if (!setProfessionals) return;
    if (editingProfId) {
      setProfessionals(prev => prev.map(p => p.id === editingProfId ? {
        ...p,
        name: profName, role: profRole, specialty: profSpecialty,
        council: profCouncil, councilNumber: profCouncilNumber,
        shift: profShift, email: profEmail, phone: profPhone,
        admissionDate: profAdmission, status: profStatus,
        locationId: profLocationId,
      } : p));
      addAuditLog('Editou Profissional', profName);

      if (supabase) {
        const { error } = await supabase.from('professionals').update({
          name: profName,
          role: profRole,
          specialty: profSpecialty,
          council: profCouncil,
          council_number: profCouncilNumber,
          shift: profShift,
          email: profEmail,
          phone: profPhone,
          admission_date: profAdmission,
          status: profStatus,
          location_id: profLocationId || null,
        }).eq('id', editingProfId);
        if (error) {
          console.error('Erro ao atualizar profissional no Supabase:', error.message, error);
        }
      }
    } else {
      if (!supabase) {
        console.error('Supabase não inicializado para gerar ID de profissional');
        return;
      }
      const { data: newProfId, error: rpcErr } = await supabase.rpc('next_professional_id');
      if (rpcErr || !newProfId) {
        console.error('Erro ao gerar ID de profissional via RPC:', rpcErr?.message);
        return;
      }

      const newProf: Professional = {
        id: newProfId,
        name: profName, role: profRole, specialty: profSpecialty,
        council: profCouncil, councilNumber: profCouncilNumber,
        shift: profShift, email: profEmail, phone: profPhone,
        admissionDate: profAdmission, status: profStatus,
        locationId: profLocationId,
        color: profColors[professionals.length % profColors.length],
        permissions: [],
      };
      setProfessionals(prev => [...prev, newProf]);
      addAuditLog('Cadastrou Profissional', profName);

      if (supabase) {
        const { error } = await supabase.from('professionals').insert({
          id: newProf.id,
          name: newProf.name,
          role: newProf.role,
          specialty: newProf.specialty,
          council: newProf.council,
          council_number: newProf.councilNumber,
          shift: newProf.shift,
          email: newProf.email,
          phone: newProf.phone,
          status: newProf.status,
          admission_date: newProf.admissionDate,
          color: newProf.color,
          location_id: newProf.locationId || null,
        });
        if (error) {
          console.error('Erro ao salvar profissional no Supabase:', error.message, error);
        }
      }
    }
    resetProfForm();
    setProfFormOpen(false);
  };

  const handleEditProf = (prof: Professional) => {
    setEditingProfId(prof.id);
    setProfName(prof.name);
    setProfRole(prof.role);
    setProfSpecialty(prof.specialty);
    setProfCouncil(prof.council);
    setProfCouncilNumber(prof.councilNumber);
    setProfShift(prof.shift);
    setProfEmail(prof.email);
    setProfPhone(prof.phone);
    setProfAdmission(prof.admissionDate);
    setProfStatus(prof.status);
    setProfLocationId(prof.locationId || '');
    setProfFormOpen(true);
  };

  const handleToggleProfStatus = async (profId: string) => {
    if (!setProfessionals) return;
    let nextStatus: 'ativo' | 'inativo' | 'férias' = 'ativo';
    setProfessionals(prev => prev.map(p => {
      if (p.id !== profId) return p;
      nextStatus = p.status === 'ativo' ? 'inativo' : 'ativo';
      addAuditLog('Alterou Status', `${p.name} → ${nextStatus}`);
      return { ...p, status: nextStatus };
    }));
    if (supabase) {
      const { error } = await supabase.from('professionals').update({ status: nextStatus }).eq('id', profId);
      if (error) {
        console.error('Erro ao atualizar status do profissional:', error.message, error);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userCi.trim() || !userLocation) {
      alert(t('fin_alert_fill_user_fields', 'app'));
      return;
    }
    if (!editingUserId && !userPassword) {
      alert(t('fin_alert_password_required', 'app'));
      return;
    }
    if (userPassword && userPassword !== userPasswordConfirm) {
      alert(t('fin_alert_passwords_mismatch', 'app'));
      return;
    }
    if (userPassword && userPassword.length < 6) {
      alert(t('fin_alert_password_min_length', 'app'));
      return;
    }

    const handleApiError = async (response: Response, fallback: string) => {
      let backendMsg = fallback;
      try {
        const data = await response.json();
        if (data?.error) backendMsg = data.error;
      } catch {
        try {
          const txt = await response.text();
          if (txt) backendMsg = txt.slice(0, 500);
        } catch {}
      }
      console.error('API /api/admin/users error:', response.status, backendMsg);
      throw new Error(backendMsg);
    };

    try {
      if (editingUserId) {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUserId,
            email: userEmail,
            name: userName,
            role: userRole,
            location: userLocation,
            ci: userCi,
            professionalId: userProfessionalId,
            status: userStatus,
            password: userPassword || undefined,
          }),
        });
        if (!response.ok) await handleApiError(response, t('fin_alert_error_update_user', 'app'));
        const data = await response.json();
        console.log('Update user response:', data);
        addAuditLog('Atualizou Usuário', userName);
        alert(t('fin_alert_user_updated', 'app'));
      } else {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            password: userPassword,
            name: userName,
            role: userRole,
            location: userLocation,
            ci: userCi,
            professionalId: userProfessionalId,
          }),
        });
        if (!response.ok) await handleApiError(response, t('fin_alert_error_create_user', 'app'));
        const data = await response.json();
        console.log('Create user response:', data);
        addAuditLog('Cadastrou Usuário via Auth', userName);
        alert(t('fin_alert_user_created', 'app'));
      }

      await loadSystemUsersFromSupabase();
      setEditingUserId(null);
      setUserProfessionalId(null);
      setUserName('');
      setUserEmail('');
      setUserCi('');
      setUserPassword('');
      setUserPasswordConfirm('');
      setUserRole('Visualizador');
      setUserLocation('');
      setUserStatus('ativo');
      setUser2FA(false);
      setUser2FAMethod('none');
      setUserFormOpen(false);
    } catch (error: any) {
      const msg = (error && (error.message || String(error))) || 'Erro desconhecido';
      console.error('handleCreateUser failed:', error);
      alert(t('fin_alert_error_prefix', 'app') + msg);
    }
  };

  // ── DTE Modals ───────────────────────────────────────────────────────────────
  const [kudeTarget, setKudeTarget] = useState<Dte | null>(null);
  const [xmlTarget, setXmlTarget] = useState<string | null>(null);
  const [gatewayTarget, setGatewayTarget] = useState<Dte | null>(null);

  const handleCancelarDte = (id: string) => {
    setDtes?.(prev => prev.map(d => d.id === id ? { ...d, status: 'Cancelado', payment_status: 'cancelado' } : d));
    addAuditLog('Cancelou DTE', id);
    if (supabase) {
      supabase.from('dtes').update({ status: 'Cancelado', payment_status: 'cancelado' }).eq('id', id);
    }
  };

  const handleConciliar = (dte: Dte, gateway: typeof GATEWAYS[number]) => {
    setDtes?.(prev => prev.map(d => d.id === dte.id ? { ...d, payment_gateway: gateway, payment_status: 'conciliado' } : d));
    setGatewayTarget(null);
    addAuditLog(`Conciliou DTE via ${gateway}`, `${dte.number} — ${GS(dte.amount)}`);
    if (supabase) {
      supabase.from('dtes').update({ payment_gateway: gateway, payment_status: 'conciliado' }).eq('id', dte.id);
    }
  };

  // ── 6. Finance States ──────────────────────────────────────────────────────
  const [finDescription, setFinDescription] = useState('');
  const [finType, setFinType] = useState<'receita' | 'despesa'>('receita');
  const [finCategory, setFinCategory] = useState('Operacional');
  const [finAmount, setFinAmount] = useState(100);

  const handleAddPosting = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = postingValidation.validate({
      description: finDescription,
      type: finType,
      category: finCategory,
      amount: finAmount,
    });
    if (!res.success) return;
    if (!finDescription.trim()) return;
    const newPosting: FinancialPosting = {
      id: await genModuleId('fin'),
      description: finDescription,
      type: finType,
      amount: finAmount,
      category: finCategory,
      date: new Date().toISOString().split('T')[0],
    };
    setFinancePostings(prev => [newPosting, ...prev]);
    addAuditLog(`Lançamento Financeiro (${finType})`, finDescription);
    setFinDescription('');
    if (supabase) {
      await supabase.from('financial_postings').insert({
        id: newPosting.id, description: newPosting.description,
        type: newPosting.type, amount: newPosting.amount,
        category: newPosting.category, date: newPosting.date,
      });
    }
  };

  // ── 7. Stock States ─────────────────────────────────────────────────────────
  const [newStockName, setNewStockName] = useState('');
  const [newStockCat, setNewStockCat] = useState('Medicamentos');
  const [newStockQty, setNewStockQty] = useState(100);
  const [newStockUnit, setNewStockUnit] = useState('frascos');

  const handleAddStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = stockItemValidation.validate({
      name: newStockName,
      category: newStockCat,
      quantity: newStockQty,
      unit: newStockUnit,
    });
    if (!res.success) return;
    if (!newStockName.trim()) return;
    const newItem: StockItem = {
      id: await genModuleId('stk'),
      name: newStockName,
      category: newStockCat,
      quantity: newStockQty,
      minQuantity: 20,
      unit: newStockUnit,
    };
    setStockItems(prev => [...prev, newItem]);
    addAuditLog('Cadastrou Insumo Estoque', newStockName);
    setNewStockName('');
    if (supabase) {
      await supabase.from('stock_items').insert({
        id: newItem.id, name: newItem.name, category: newItem.category,
        quantity: newItem.quantity, min_quantity: newItem.minQuantity, unit: newItem.unit,
      });
    }
  };

  const handleUpdateStockQty = async (id: string, delta: number) => {
    let updatedQty = 0;
    setStockItems(prev => prev.map(item => {
      if (item.id === id) {
        updatedQty = Math.max(0, item.quantity + delta);
        addAuditLog('Ajustou Qtd Estoque', `${item.name} (${updatedQty})`);
        return { ...item, quantity: updatedQty };
      }
      return item;
    }));
    if (supabase) {
      await supabase.from('stock_items').update({ quantity: updatedQty }).eq('id', id);
    }
  };

  // ── 14. Admin State ─────────────────────────────────────────────────────────
  const [activeOperatorProfile, setActiveOperatorProfile] = useState<'recepcao' | 'medico' | 'gestor'>('recepcao');
  const [rbacSelectedProfId, setRbacSelectedProfId] = useState<string>('');
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>(passwordPolicyProp || initialPasswordPolicy);
  const [userSessions, setUserSessions] = useState<UserSession[]>(initialUserSessions);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>(initialLoginAttempts);
  const [ssoProviders, setSSOProviders] = useState<SSOProvider[]>(initialSSOProviders);
  const [passwordPolicySaved, setPasswordPolicySaved] = useState(false);

  // User form state
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userProfessionalId, setUserProfessionalId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userCi, setUserCi] = useState('');
  const [userRole, setUserRole] = useState<SystemRole>('Visualizador');
  const [userLocation, setUserLocation] = useState('');
  const [userStatus, setUserStatus] = useState<'ativo' | 'inativo' | 'bloqueado'>('ativo');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('');
  const [user2FA, setUser2FA] = useState(false);
  const [user2FAMethod, setUser2FAMethod] = useState<'totp' | 'sms' | 'email' | 'none'>('none');

  const userCalculatedDV = React.useMemo(() => {
    if (!userCi) return null;
    const cleanDoc = userCi.replace(/\D/g, '');
    if (cleanDoc.length === 0) return null;
    let sum = 0;
    let factor = 2;
    for (let i = cleanDoc.length - 1; i >= 0; i--) {
      sum += parseInt(cleanDoc.charAt(i)) * factor;
      factor++;
      if (factor > 11) factor = 2;
    }
    const remainder = sum % 11;
    return remainder > 1 ? 11 - remainder : 0;
  }, [userCi]);

  // 2FA simulation state
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [showTwoFactorQR, setShowTwoFactorQR] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>(['ABCD-1234', 'EFGH-5678', 'IJKL-9012', 'MNOP-3456', 'QRST-7890']);

  // Password reset simulation
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null);
  const [passwordResetNewPass, setPasswordResetNewPass] = useState('');
  const [passwordResetConfirm, setPasswordResetConfirm] = useState('');

  // SSO form state
  const [ssoFormOpen, setSsoFormOpen] = useState(false);
  const [editingSsoId, setEditingSsoId] = useState<string | null>(null);
  const [ssoName, setSsoName] = useState('');
  const [ssoType, setSsoType] = useState<'saml' | 'oauth2' | 'oidc'>('oidc');
  const [ssoIssuer, setSsoIssuer] = useState('');
  const [ssoClientId, setSsoClientId] = useState('');
  const [ssoClientSecret, setSsoClientSecret] = useState('');
  const [ssoMetadataUrl, setSsoMetadataUrl] = useState('');
  const [ssoCertFingerprint, setSsoCertFingerprint] = useState('');
  const [ssoDefaultRole, setSsoDefaultRole] = useState<SystemRole>('Visualizador');
  const [ssoEnabled, setSsoEnabled] = useState(false);

  // Session filter/view
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'revoked'>('active');

  // Finance calculations
  const totalIncome = financePostings.filter(p => p.type === 'receita').reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = financePostings.filter(p => p.type === 'despesa').reduce((sum, p) => sum + p.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* ─── 15. Convênios e Cobertura ──────────────────────────────────────── */}
      {activeSubmodule === 15 && (
        <InsuranceTab
          insurances={insurances}
          setInsurances={setInsurances}
          preAuthorizations={preAuthorizations}
          feeSchedules={feeSchedules}
          addAuditLog={addAuditLog}
        />
      )}

      {/* ─── 16. Tabela de Honorários Parametrizável ──────────────────────────── */}
      {activeSubmodule === 16 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center"><Hash className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-slate-800 text-sm">Tabla de Honorários Parametrizable</h3><p className="text-[10px] text-slate-500">Precios, repasse, copagos y límites por convenio, especialidad y procedimiento</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                  <th className="px-3 py-2.5 text-left">Convênio</th><th className="px-3 py-2.5 text-left">Especialidad</th><th className="px-3 py-2.5 text-left">Procedimiento</th>
                  <th className="px-3 py-2.5 text-right">Precio Base</th><th className="px-3 py-2.5 text-center">Repasse %</th>
                  <th className="px-3 py-2.5 text-right">Copago Fijo</th><th className="px-3 py-2.5 text-right">Copago %</th>
                  <th className="px-3 py-2.5 text-right">Límite</th><th className="px-3 py-2.5 text-center">Autoriz.</th><th className="px-3 py-2.5 text-center">Activo</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {feeSchedules.map(fs => (
                    <tr key={fs.id} className={`hover:bg-slate-50/70 transition ${!fs.active ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">{fs.insurance_name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{fs.specialty}</td>
                      <td className="px-3 py-2.5 text-slate-600"><span className="font-mono text-slate-400">{fs.procedure_code}</span> {fs.procedure_name}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{GS(fs.base_price)}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-teal-700">{fs.repasse_percent}%</td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600">{fs.copay_amount > 0 ? GS(fs.copay_amount) : '-'}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{fs.copay_percent > 0 ? `${fs.copay_percent}%` : '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600">{fs.coverage_limit > 0 ? GS(fs.coverage_limit) : '∞'}</td>
                      <td className="px-3 py-2.5 text-center">{fs.requires_authorization ? <span className="text-amber-600 font-bold text-[10px]">✓</span> : '-'}</td>
                      <td className="px-3 py-2.5 text-center">{fs.active ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">El repasse se calcula automáticamente sobre el precio base: <b className="text-slate-600">Honorario = Precio Base × Repasse% / 100</b></p>
          </div>
        </div>
      )}

      {/* ─── 17. Coparticipação e Tetos ──────────────────────────────────────── */}
      {activeSubmodule === 17 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center"><AlertCircle className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-slate-800 text-sm">Coparticipación, Copago y Techos de Cobertura</h3><p className="text-[10px] text-slate-500">Reglas de copago por convenio y cálculo automático de valores</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-700 text-xs">Calculadora de Copago</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Convênio</label>
                    <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold" id="copay-insurance-select">
                      {insurances.filter(i => i.active).map(ins => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
                    </select></div>
                  <div><label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Valor Base (Gs.)</label>
                    <input type="text" inputMode="numeric" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="150000" id="copay-base-input" /></div>
                </div>
                <button onClick={() => {
                  const sel = (document.getElementById('copay-insurance-select') as HTMLSelectElement)?.value;
                  const base = Number((document.getElementById('copay-base-input') as HTMLInputElement)?.value) || 0;
                  if (!sel || !base) return;
                  const ins = insurances.find(i => i.id === sel);
                  if (!ins) return;
                  const pctMatch = ins.copay_rules.match(/(\d+)%/);
                  const pct = pctMatch ? parseInt(pctMatch[1]) : 0;
                  const copayVal = ins.copay_rules.includes('fijo') ? base * 0.2 : Math.round(base * pct / 100);
                  alert(`Convênio: ${ins.name}\nValor Base: Gs. ${base.toLocaleString('es-PY')}\nRegra: ${ins.copay_rules}\nCopago Calculado: Gs. ${copayVal.toLocaleString('es-PY')}\nTecho: ${ins.coverage_ceiling > 0 ? 'Gs. ' + ins.coverage_ceiling.toLocaleString('es-PY') : 'Sin techo'}`);
                  addAuditLog('Calculó Copago', `${ins.name}: Gs. ${copayVal}`);
                }} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition">Calcular Copago</button>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-700 text-xs">Resumen de Techos por Convênio</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {insurances.filter(i => i.active).map(ins => (
                    <div key={ins.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">{ins.name}</span>
                      <span className="font-mono font-bold text-slate-800">{ins.coverage_ceiling > 0 ? GS(ins.coverage_ceiling) : '∞'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
              <p className="font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Reglas de Copago (Res. DNIT 21/2024)</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-amber-700">
                <li>IPS: 5% sobre nomenclador oficial, retención en fuente</li>
                <li>Sanidad Policial: 10% sobre tabla referencial</li>
                <li>EMP: Copago fijo 50.000 Gs. por consulta, 20% procedimientos</li>
                <li>Seguros Privados: Reembolso 80% sobre tabla, paciente paga 20%</li>
                <li>Corporativo: Descuento 15% directo sobre precio de tabla</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── 18. Lotes Massivos de Faturamento ────────────────────────────────── */}
      {activeSubmodule === 18 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center"><Send className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-slate-800 text-sm">Lotes Masivos de Facturación</h3><p className="text-[10px] text-slate-500">Generación y envío de lotes consolidados por aseguradora y período</p></div>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={async () => {
                const newId = await genModuleId('batch');
                const newBatch: BatchInvoice = { id: newId, insurance_id: 'ins_1', insurance_name: 'IPS - Instituto de Previsión Social', period_start: '2026-07-01', period_end: '2026-07-31', total_amount: dtes.filter(d => d.status === 'Aprovado').reduce((s, d) => s + d.amount, 0), dte_count: dtes.filter(d => d.status === 'Aprovado').length, status: 'gerado', dte_ids: dtes.filter(d => d.status === 'Aprovado').map(d => d.id), created_at: new Date().toISOString().split('T')[0] };
                setBatchInvoices(prev => [newBatch, ...prev]);
                setBatchInvoicesProp?.(prev => [newBatch, ...prev]);
                addAuditLog('Generó Lote Masivo', `IPS - ${newBatch.dte_count} DTEs, Gs. ${newBatch.total_amount}`);
                alert(`Lote generado: ${newBatch.dte_count} DTEs · Total: Gs. ${newBatch.total_amount.toLocaleString('es-PY')}`);
              }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition"><Plus className="w-4 h-4" /> Generar Lote desde DTEs Aprobados</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left">Aseguradora</th><th className="px-4 py-2.5 text-left">Período</th><th className="px-4 py-2.5 text-right">DTEs</th>
                  <th className="px-4 py-2.5 text-right">Total Gs.</th><th className="px-4 py-2.5 text-center">Status</th><th className="px-4 py-2.5 text-center">Creado</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {batchInvoices.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800">{b.insurance_name}</td>
                      <td className="px-4 py-3 text-slate-600">{b.period_start} ~ {b.period_end}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{b.dte_count}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{GS(b.total_amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800' : b.status === 'enviado' ? 'bg-blue-100 text-blue-800' : b.status === 'rejeitado' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-center">{b.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 19. Consulta de Elegibilidade On-line ───────────────────────────── */}
      {activeSubmodule === 19 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center"><Wifi className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-slate-800 text-sm">Consulta de Elegibilidad On-line</h3><p className="text-[10px] text-slate-500">Verificación de cobertura en tiempo real vía Web Service del convenio</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-700 text-xs">Nueva Consulta</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Paciente</label>
                    <input list="elig-patients" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="Nombre del paciente" id="elig-patient-input" />
                    <datalist id="elig-patients">{patients.map(p => <option key={p.id} value={p.name} />)}</datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Convênio</label>
                      <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold" id="elig-insurance-select">
                        {insurances.filter(i => i.active && i.has_webservice).map(ins => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Procedimiento</label>
                      <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono" id="elig-procedure-select">
                        {PROCEDURES.map(p => <option key={p.code} value={p.code}>{p.code} - {p.desc}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button onClick={async () => {
                  const pName = (document.getElementById('elig-patient-input') as HTMLInputElement)?.value;
                  const insId = (document.getElementById('elig-insurance-select') as HTMLSelectElement)?.value;
                  const procCode = (document.getElementById('elig-procedure-select') as HTMLSelectElement)?.value;
                   if (!pName || !insId || !procCode) { alert(t('fin_alert_fill_all_fields', 'app')); return; }
                  const ins = insurances.find(i => i.id === insId);
                  const proc = PROCEDURES.find(p => p.code === procCode);
                  if (!ins || !proc) return;
                  addAuditLog('Consultó Elegibilidad', `${pName} - ${ins.name} - ${proc.desc}`);
                  const wsSimulated = Math.random() > 0.3;
                  if (wsSimulated) {
                    const covPct = ins.type === 'IPS' ? 95 : ins.type === 'EMP' ? 100 : 80;
                    const copayAmt = ins.type === 'IPS' ? Math.round(proc.price * 0.05) : ins.type === 'Sanidade Policial' ? Math.round(proc.price * 0.1) : 0;
                    const newElig: EligibilityCheck = { id: await genModuleId('elig'), patient_id: '', patient_name: pName, insurance_id: insId, insurance_name: ins.name, procedure_code: procCode, procedure_name: proc.desc, status: 'coberto', coverage_percent: covPct, copay_amount: copayAmt, network: `RED_${ins.type.toUpperCase()}`, authorization_required: ins.requires_authorization, checked_at: new Date().toISOString(), response: `Cobertura vigente. ${ins.requires_authorization ? 'Requiere autorización previa.' : 'Sin autorización requerida.'}` };
                    setEligibilityChecks(prev => [newElig, ...prev]);
                    setEligProp?.(prev => [newElig, ...prev]);
                    alert(`✅ Cobertura Verificada\nPaciente: ${pName}\nConvênio: ${ins.name}\nProcedimiento: ${proc.desc}\nCobertura: ${covPct}%\nCopago: Gs. ${copayAmt.toLocaleString('es-PY')}\nAutorización: ${ins.requires_authorization ? 'Requerida' : 'No requerida'}\nRed: RED_${ins.type.toUpperCase()}\n\nWeb Service: ${ins.webservice_url || 'N/A'}`);
                  } else {
                    const newElig: EligibilityCheck = { id: await genModuleId('elig'), patient_id: '', patient_name: pName, insurance_id: insId, insurance_name: ins.name, procedure_code: procCode, procedure_name: proc.desc, status: 'negado', coverage_percent: 0, copay_amount: 0, network: '', authorization_required: false, checked_at: new Date().toISOString(), response: 'Contribuyente no activo. Verificar datos con el convenio.' };
                    setEligibilityChecks(prev => [newElig, ...prev]);
                    setEligProp?.(prev => [newElig, ...prev]);
                    alert(`❌ Cobertura Negada\nPaciente: ${pName}\nConvênio: ${ins.name}\nRespuesta: Contribuyente no activo.\nContacte al convenio para más detalles.`);
                  }
                }} className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition"><Wifi className="w-3.5 h-3.5" /> Consultar Web Service</button>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-700 text-xs">Convenios con Web Service</h4>
                <div className="space-y-2">
                  {insurances.filter(i => i.has_webservice).map(ins => (
                    <div key={ins.id} className="p-2 bg-white rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-700">{ins.name}</span>
                        <p className="text-[9px] font-mono text-slate-400 truncate max-w-[200px]">{ins.webservice_url}</p>
                      </div>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Online</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm">Historial de Consultas ({eligibilityChecks.length})</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">Paciente</th><th className="px-4 py-2.5 text-left">Convênio</th><th className="px-4 py-2.5 text-left">Procedimiento</th>
                    <th className="px-4 py-2.5 text-center">Cobertura</th><th className="px-4 py-2.5 text-right">Copago</th><th className="px-4 py-2.5 text-center">Autoriz.</th><th className="px-4 py-2.5 text-center">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {eligibilityChecks.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-semibold text-slate-800">{e.patient_name}</td>
                        <td className="px-4 py-3 text-slate-600">{e.insurance_name}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{e.procedure_name}</td>
                        <td className="px-4 py-3 text-center font-bold">{e.coverage_percent > 0 ? `${e.coverage_percent}%` : '-'}</td>
                        <td className="px-4 py-3 text-right font-mono">{e.copay_amount > 0 ? GS(e.copay_amount) : '-'}</td>
                        <td className="px-4 py-3 text-center">{e.authorization_required ? <span className="text-amber-600 font-bold text-[10px]">✓</span> : '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${e.status === 'coberto' ? 'bg-emerald-100 text-emerald-800' : e.status === 'negado' ? 'bg-rose-100 text-rose-800' : e.status === 'erro' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{e.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 20. Controle de Honorários e Repasse ─────────────────────────────── */}
      {activeSubmodule === 20 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center"><Banknote className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-slate-800 text-sm">Control de Honorários y Repasse</h3><p className="text-[10px] text-slate-500">Cálculo automático de honorarios, retenciones IRP/IVA y liquidación periódica</p></div>
            </div>
            {/* Current settlements */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left">Profesional</th><th className="px-4 py-2.5 text-left">Período</th>
                  <th className="px-4 py-2.5 text-right">Bruto</th><th className="px-4 py-2.5 text-right">Deducciones</th>
                  <th className="px-4 py-2.5 text-right">IRP</th><th className="px-4 py-2.5 text-right">IVA</th>
                  <th className="px-4 py-2.5 text-right font-bold text-teal-700">Neto</th>
                  <th className="px-4 py-2.5 text-center">Status</th><th className="px-4 py-2.5 text-center">Liquidación</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {settlements.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800">{s.professional_name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.period_start} ~ {s.period_end}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{GS(s.gross_amount)}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">{GS(s.deductions)}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-600">{GS(s.irp_withheld)}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-600">{GS(s.iva_withheld)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-teal-700">{GS(s.net_amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : s.status === 'liquidado' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-[10px] text-slate-500">{s.settlement_date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Calculation simulator */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-700 text-xs">Simulador de Cálculo de Honorarios</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Profesional</label>
                  <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold" id="settle-prof-select">
                    {professionals.filter(p => p.role === 'Médico(a)').map(p => <option key={p.id} value={p.id}>{p.name} - {p.specialty}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Valor Facturado (Gs.)</label>
                  <input type="text" inputMode="numeric" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="Ej: 3500000" id="settle-gross-input" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">% Repasse</label>
                  <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold" id="settle-pct-select">
                    <option value="50">50%</option><option value="55">55%</option><option value="60" selected>60%</option><option value="65">65%</option><option value="70">70%</option>
                  </select>
                </div>
              </div>
              <button onClick={async () => {
                const profId = (document.getElementById('settle-prof-select') as HTMLSelectElement)?.value;
                const gross = Number((document.getElementById('settle-gross-input') as HTMLInputElement)?.value) || 0;
                const pct = Number((document.getElementById('settle-pct-select') as HTMLSelectElement)?.value) || 60;
                if (!profId || !gross) { alert(t('fin_alert_select_professional_value', 'app')); return; }
                const prof = professionals.find(p => p.id === profId);
                if (!prof) return;
                const honorario = Math.round(gross * pct / 100);
                const irp = Math.round(honorario * 0.03);
                const iva = Math.round(honorario * 0.12);
                const deductions = irp + iva;
                const neto = honorario - deductions;
                addAuditLog('Simuló Honorarios', `${prof.name}: Bruto Gs. ${gross}, Neto Gs. ${neto}`);
                const newSett: ProfessionalSettlement = { id: await genModuleId('sett'), professional_id: profId, professional_name: prof.name, period_start: new Date().toISOString().slice(0, 7) + '-01', period_end: new Date().toISOString().split('T')[0], gross_amount: gross, deductions, net_amount: neto, irp_withheld: irp, iva_withheld: iva, status: 'calculado', dte_ids: [], settlement_date: new Date().toISOString().split('T')[0], payment_date: '' };
                setSettlements(prev => [newSett, ...prev]);
                setSettlementsProp?.(prev => [newSett, ...prev]);
                alert(`✅ Cálculo de Honorarios\nProfesional: ${prof.name}\nValor Facturado: Gs. ${gross.toLocaleString('es-PY')}\nRepasse (${pct}%): Gs. ${honorario.toLocaleString('es-PY')}\nIRP (3%): -Gs. ${irp.toLocaleString('es-PY')}\nIVA (12%): -Gs. ${iva.toLocaleString('es-PY')}\n\nNeto a Pagar: Gs. ${neto.toLocaleString('es-PY')}`);
              }} className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-xs transition">Calcular y Generar Liquidación</button>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-[10px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">Fórmula de Cálculo:</p>
                <p>Honorario = Valor Facturado × Repasse% / 100</p>
                <p>IRP (Impuesto a la Renta Personal) = 3% del honorario (Ley 6380/2019)</p>
                <p>IVA (12%) = Retención en la fuente sobre el honorario</p>
                <p>Líquido = Honorario - IRP - IVA</p>
                <p className="text-amber-600 font-bold">La autofactura electrónica (DTE tipo Autofatura) se genera automáticamente al liquidar.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 21. Pacientes Estrangeiros (Mercosul) ────────────────────────────── */}
      {activeSubmodule === 21 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"><Globe className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-slate-800 text-sm">Facturación Pacientes Extranjeros (Mercosur)</h3><p className="text-[10px] text-slate-500">Emisión en USD, comprobantes para reembolso en país de origen</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-700 text-xs">Nuevo Comprobante Internacional</h4>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Paciente</label>
                      <input list="frn-patients" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder={t('fin_placeholder_name', 'app')} id="frn-patient-input" />
                      <datalist id="frn-patients">{patients.map(p => <option key={p.id} value={p.name} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">País</label>
                      <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold" id="frn-country-select">
                        <option value="AR">Argentina</option><option value="BR" selected>Brasil</option><option value="UY">Uruguay</option><option value="CL">Chile</option><option value="US">Estados Unidos</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Moneda</label>
                      <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold" id="frn-currency-select">
                        <option value="USD">USD - Dólar</option><option value="ARS">ARS - Peso Argentino</option><option value="BRL">BRL - Real Brasileño</option><option value="EUR">EUR - Euro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Tasa de Cambio</label>
                      <input type="text" inputMode="numeric" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="7500" id="frn-rate-input" value="7500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Monto Local (Gs.)</label>
                    <input type="text" inputMode="numeric" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="450000" id="frn-amount-input" />
                  </div>
                </div>
                <button onClick={async () => {
                  const pName = (document.getElementById('frn-patient-input') as HTMLInputElement)?.value;
                  const country = (document.getElementById('frn-country-select') as HTMLSelectElement)?.value;
                  const currency = (document.getElementById('frn-currency-select') as HTMLSelectElement)?.value as ForeignBilling['currency'];
                  const rate = Number((document.getElementById('frn-rate-input') as HTMLInputElement)?.value) || 7500;
                  const amountLocal = Number((document.getElementById('frn-amount-input') as HTMLInputElement)?.value) || 0;
                   if (!pName || !amountLocal) { alert(t('fin_alert_fill_name_amount', 'app')); return; }
                  const amountForeign = Math.round(amountLocal / rate * 100) / 100;
                  const countryNames: Record<string, string> = { AR: 'Argentina', BR: 'Brasil', UY: 'Uruguay', CL: 'Chile', US: 'Estados Unidos' };
                  addAuditLog('Emitió Factura Extranjero', `${pName} - ${currency} ${amountForeign}`);
                  const docId = await genModuleId('dte');
                  const docs = [`Invoice_INV-${docId}.pdf`, `Recibo_Rec-${docId}.pdf`, `Comprobante_Reembolso_${country}_${docId}.pdf`];
                  const newFrn: ForeignBilling = { id: await genModuleId('frn'), patient_id: '', patient_name: pName, country, currency, exchange_rate: rate, amount_local: amountLocal, amount_foreign: amountForeign, documents_generated: docs, status: 'gerado' };
                  setForeignBillings(prev => [newFrn, ...prev]);
                  setForeignBillingsProp?.(prev => [newFrn, ...prev]);
                  alert(`✅ Comprobante Internacional Generado\nPaciente: ${pName}\nPaís: ${countryNames[country] || country}\nMoneda: ${currency}\nMonto Local: Gs. ${amountLocal.toLocaleString('es-PY')}\nTasa: ${rate}\nMonto Extranjero: ${currency} ${amountForeign.toFixed(2)}\n\nDocumentos generados:\n${docs.map(d => `  📄 ${d}`).join('\n')}`);
                }} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition"><Globe className="w-3.5 h-3.5" /> Generar Comprobante Internacional</button>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-700 text-xs">Resumen de Cambios</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-white rounded-lg border border-slate-100 flex justify-between text-xs">
                    <span className="text-slate-600">USD (Dólar)</span><span className="font-mono font-bold text-slate-800">1 USD = 7.500 Gs.</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100 flex justify-between text-xs">
                    <span className="text-slate-600">BRL (Real)</span><span className="font-mono font-bold text-slate-800">1 BRL = 1.400 Gs.</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100 flex justify-between text-xs">
                    <span className="text-slate-600">ARS (Peso)</span><span className="font-mono font-bold text-slate-800">1 ARS = 8 Gs.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm">Historial ({foreignBillings.length})</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">Paciente</th><th className="px-4 py-2.5 text-left">País</th><th className="px-4 py-2.5 text-right">Gs.</th>
                    <th className="px-4 py-2.5 text-right">Extranjero</th><th className="px-4 py-2.5 text-center">Status</th><th className="px-4 py-2.5 text-center">Docs</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {foreignBillings.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-semibold text-slate-800">{f.patient_name}</td>
                        <td className="px-4 py-3 text-slate-600">{f.country}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{GS(f.amount_local)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{f.currency} {f.amount_foreign.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${f.status === 'reembolsado' ? 'bg-emerald-100 text-emerald-800' : f.status === 'entregue' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>{f.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => alert(f.documents_generated.join('\n'))} className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold">📄 {f.documents_generated.length} docs</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. SIFEN / DTE ─────────────────────────────────────────────────── */}
      {activeSubmodule === 5 && (
        <DteTab
          dtes={dtes}
          setDtes={setDtes ?? (() => {})}
          patients={patients}
          addAuditLog={addAuditLog}
          onShowKude={(dte) => setKudeTarget(dte)}
        />
      )}

      {/* ─── 6. Gestão Financeira e Contábil ───────────────────────────────── */}
      {activeSubmodule === 6 && (
        <div className="space-y-5">
          {/* Tab Navigator */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-1 flex flex-wrap gap-1">
            {([
              ['dashboard', 'Dashboard', TrendingUp],
              ['ap_ar', 'AP/AR', Receipt],
              ['cashflow', 'Fluxo Caixa', TrendingUp],
              ['reconciliation', 'Conciliação', RefreshCw],
              ['cost_centers', 'Centros Custo', Building2],
              ['dre', 'DRE', FileText],
              ['tax', 'Impostos', AlertCircle],
              ['books', 'Livros DNIT', FileCheck],
              ['multicurrency', 'Multimoeda', Globe],
              ['chart_accounts', 'Plano Contas', Hash],
              ['accounting_entries', 'Lançamentos', Edit2],
            ] as const).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setFinTab(key)} className={`px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition ${finTab === key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>

          {/* ── Dashboard ───────────────────────────────────────────────── */}
          {finTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">Registrar Fluxo de Caixa</h3>
                </div>
                <form onSubmit={handleAddPosting} noValidate className="space-y-4 text-xs">
                  {postingValidation.errors.length > 0 && <FormErrorSummary errors={postingValidation.errors} />}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição</label>
                    <input type="text" value={finDescription} onChange={e => setFinDescription(e.target.value)} placeholder="Ex: Compra de insumos" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
                      <select value={finType} onChange={e => setFinType(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold">
                        <option value="receita" className="text-emerald-700">🟢 RECEITA</option>
                        <option value="despesa" className="text-rose-700">🔴 DESPESA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Valor (Gs.)</label>
                      <input type="text" inputMode="decimal" value={finAmount} onChange={e => setFinAmount(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
                    <select value={finCategory} onChange={e => setFinCategory(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <option value="Consultas">Consultas</option>
                      <option value="Exames">Exames</option>
                      <option value="Procedimentos">Procedimentos</option>
                      <option value="Insumos Médicos">Insumos</option>
                      <option value="Operacional">Operacional</option>
                      <option value="Pessoal">Pessoal</option>
                      <option value="Faturamento DTE / SIFEN">SIFEN</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-sm text-xs">
                    Registrar Lançamento
                  </button>
                </form>
              </div>

              {/* Dashboard KPIs */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200"><p className="text-emerald-600 font-bold uppercase tracking-wider text-[9px]">Faturamento Total</p><p className="text-emerald-800 font-extrabold text-xl pt-1">Gs. {totalIncome.toLocaleString('es-PY')}</p></div>
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200"><p className="text-rose-600 font-bold uppercase tracking-wider text-[9px]">Custos Totais</p><p className="text-rose-800 font-extrabold text-xl pt-1">Gs. {totalExpense.toLocaleString('es-PY')}</p></div>
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-200"><p className="text-teal-700 font-bold uppercase tracking-wider text-[9px]">Margem Líquida</p><p className={`font-extrabold text-xl pt-1 ${balance >= 0 ? 'text-teal-800' : 'text-rose-700'}`}>Gs. {balance.toLocaleString('es-PY')}</p></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <h4 className="font-bold text-slate-700 text-xs mb-3">Resumo Mensal</h4>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto">
                    {financePostings.map(post => (
                      <div key={post.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-[11.5px]">
                        <span className="font-bold text-slate-800">{post.description}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full uppercase font-bold">{post.category}</span>
                          <span className={`font-black ${post.type === 'receita' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {post.type === 'receita' ? '+' : '-'} Gs. {post.amount.toLocaleString('es-PY')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Contas a Pagar e Receber ──────────────────────────────────── */}
          {finTab === 'ap_ar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Contas a Pagar ({accountsPayable.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                      <th className="px-3 py-2.5 text-left">Descrição</th><th className="px-3 py-2.5 text-left">Fornecedor</th><th className="px-3 py-2.5 text-right">Valor</th><th className="px-3 py-2.5 text-center">Vencimento</th><th className="px-3 py-2.5 text-center">Dias</th><th className="px-3 py-2.5 text-center">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {accountsPayable.map(ap => (
                        <tr key={ap.id} className={`hover:bg-slate-50/70 ${ap.status === 'vencido' ? 'bg-rose-50/50' : ''}`}>
                          <td className="px-3 py-2.5 font-semibold text-slate-700 max-w-[160px] truncate">{ap.description}</td>
                          <td className="px-3 py-2.5 text-slate-600">{ap.supplier}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{GS(ap.amount)}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500">{ap.due_date}</td>
                          <td className="px-3 py-2.5 text-center">{ap.days_overdue > 0 ? <span className="text-rose-600 font-bold">{ap.days_overdue}d</span> : <span className="text-slate-400">-</span>}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${ap.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : ap.status === 'vencido' ? 'bg-rose-100 text-rose-800' : ap.status === 'a_vencer' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>{ap.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Contas a Receber ({accountsReceivable.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                      <th className="px-3 py-2.5 text-left">Descrição</th><th className="px-3 py-2.5 text-left">Paciente</th><th className="px-3 py-2.5 text-right">Valor</th><th className="px-3 py-2.5 text-center">Vencimento</th><th className="px-3 py-2.5 text-center">Dias</th><th className="px-3 py-2.5 text-center">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {accountsReceivable.map(ar => (
                        <tr key={ar.id} className={`hover:bg-slate-50/70 ${ar.status === 'vencido' ? 'bg-amber-50/50' : ''}`}>
                          <td className="px-3 py-2.5 font-semibold text-slate-700 max-w-[160px] truncate">{ar.description}</td>
                          <td className="px-3 py-2.5 text-slate-600">{ar.patient_name}<br /><span className="text-[9px] text-slate-400">{ar.insurance_name}</span></td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{GS(ar.amount)}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500">{ar.due_date}</td>
                          <td className="px-3 py-2.5 text-center">{ar.days_overdue > 0 ? <span className="text-amber-600 font-bold">{ar.days_overdue}d</span> : <span className="text-slate-400">-</span>}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${ar.status === 'recebido' ? 'bg-emerald-100 text-emerald-800' : ar.status === 'vencido' ? 'bg-amber-100 text-amber-800' : ar.status === 'a_vencer' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>{ar.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Fluxo de Caixa ─────────────────────────────────────────────── */}
          {finTab === 'cashflow' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-600" /> Fluxo de Caixa Diário</h4>
                <div className="flex gap-2 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Realizado</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-full" /> Projetado</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">Data</th><th className="px-4 py-2.5 text-center">Tipo</th><th className="px-4 py-2.5 text-right">Receitas</th><th className="px-4 py-2.5 text-right">Despesas</th><th className="px-4 py-2.5 text-right">Saldo Dia</th><th className="px-4 py-2.5 text-right font-bold">Acumulado</th><th className="px-4 py-2.5 text-left">Obs</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {cashFlows.map(cf => (
                      <tr key={cf.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-700">{cf.date}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cf.type === 'realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{cf.type}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">{GS(cf.income)}</td>
                        <td className="px-4 py-3 text-right font-mono text-rose-600 font-bold">{GS(cf.expense)}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${cf.balance >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>{cf.balance >= 0 ? '+' : ''}{GS(cf.balance)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{GS(cf.accumulated)}</td>
                        <td className="px-4 py-3 text-slate-400 max-w-[120px] truncate">{cf.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Conciliação Bancária ────────────────────────────────────────── */}
          {finTab === 'reconciliation' && (
            <div className="space-y-4">
              {bankReconciliations.map(br => (
                <div key={br.id} className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{br.bank_name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">Cta: {br.account_number} · Extracto: {br.statement_date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${br.status === 'conciliado' ? 'bg-emerald-100 text-emerald-800' : br.status === 'divergente' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{br.status}</span>
                      {br.status === 'pendente' && (
                        <button
                          data-testid="reconcile-entry"
                          onClick={() => setBankReconciliations(prev => prev.map(r => r.id === br.id ? { ...r, status: 'conciliado' as const } : r))}
                          className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Conciliar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-[9px] text-slate-400 uppercase font-bold">Saldo Banco</p><p className="font-black text-slate-800 mt-1">{GS(br.bank_balance)}</p></div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-[9px] text-slate-400 uppercase font-bold">Saldo Libro</p><p className="font-black text-slate-800 mt-1">{GS(br.book_balance)}</p></div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-[9px] text-slate-400 uppercase font-bold">Diferencia</p><p className={`font-black mt-1 ${br.difference === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{br.difference === 0 ? '✓' : GS(br.difference)}</p></div>
                  </div>
                  {br.entries.length > 0 && (
                    <div className="border-t border-slate-100 pt-3">
                      <h5 className="font-bold text-slate-600 text-[10px] mb-2 uppercase">Partidas Pendentes</h5>
                      {br.entries.map((e, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg mb-1 text-xs">
                          <span className="text-slate-600">{e.description}</span>
                          <div className="flex items-center gap-3">
                            <span className={`font-mono font-bold ${e.type === 'debito' ? 'text-rose-600' : 'text-emerald-600'}`}>{e.type === 'debito' ? '-' : '+'}{GS(e.amount)}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${e.reconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{e.reconciled ? 'Conciliado' : 'Pendente'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Centros de Custo ────────────────────────────────────────────── */}
          {finTab === 'cost_centers' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm">Centros de Custo e Resultado</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">Nome</th><th className="px-4 py-2.5 text-center">Tipo</th><th className="px-4 py-2.5 text-right">Orçamento</th><th className="px-4 py-2.5 text-right">Gasto</th><th className="px-4 py-2.5 text-right">Receita</th><th className="px-4 py-2.5 text-right">% Utilizado</th><th className="px-4 py-2.5 text-center">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {costCenters.map(cc => {
                      const pct = cc.budget > 0 ? Math.round(cc.spent / cc.budget * 100) : 0;
                      return (
                        <tr key={cc.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-700">{cc.name}</td>
                          <td className="px-4 py-3 text-center"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cc.type === 'unidade' ? 'bg-purple-100 text-purple-800' : cc.type === 'especialidade' ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800'}`}>{cc.type}</span></td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{GS(cc.budget)}</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-600">{GS(cc.spent)}</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-700">{GS(cc.revenue)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct > 80 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="font-bold text-slate-600">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{cc.active ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DRE (Demonstração de Resultados) ────────────────────────────── */}
          {finTab === 'dre' && incomeStatements.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm">DRE — Período: {incomeStatements[0].period}</h4></div>
              <div className="p-5 space-y-2 text-xs">
                {[
                  { label: 'RECEITAS', children: [
                    { label: 'Consultas', value: incomeStatements[0].revenue_consultas, indent: true },
                    { label: 'Exames', value: incomeStatements[0].revenue_exames, indent: true },
                    { label: 'Procedimentos', value: incomeStatements[0].revenue_procedimentos, indent: true },
                    { label: 'Internação', value: incomeStatements[0].revenue_internacao, indent: true },
                    { label: 'Outros', value: incomeStatements[0].revenue_outros, indent: true },
                  ], total: incomeStatements[0].revenue_total, color: 'text-emerald-700' },
                  { label: 'CUSTOS', children: [
                    { label: 'Insumos', value: incomeStatements[0].cost_insumos, indent: true },
                    { label: 'Pessoal', value: incomeStatements[0].cost_pessoal, indent: true },
                    { label: 'Operacional', value: incomeStatements[0].cost_operacional, indent: true },
                    { label: 'Ocupacional', value: incomeStatements[0].cost_ocupacional, indent: true },
                  ], total: incomeStatements[0].cost_total, color: 'text-rose-700' },
                ].map(section => (
                  <div key={section.label}>
                    <div className="flex justify-between font-black text-slate-800 text-sm border-b border-slate-200 pb-1 mb-1">{section.label}<span className={section.color}>{GS(section.total)}</span></div>
                    {section.children.map(c => (
                      <div key={c.label} className="flex justify-between py-0.5 pl-4 text-slate-600">{c.label}<span className="font-mono font-bold">{GS(c.value)}</span></div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between font-black text-teal-700 border-t-2 border-teal-300 pt-2 mt-2">LUCRO BRUTO<span>{GS(incomeStatements[0].gross_profit)}</span></div>
                <div className="ml-4 space-y-1">
                  <div className="flex justify-between py-0.5 text-slate-600">Despesas Administrativas<span className="font-mono font-bold">{GS(incomeStatements[0].expenses_admin)}</span></div>
                  <div className="flex justify-between py-0.5 text-slate-600">Marketing<span className="font-mono font-bold">{GS(incomeStatements[0].expenses_marketing)}</span></div>
                  <div className="flex justify-between py-0.5 text-slate-600">Impuestos/Tasas<span className="font-mono font-bold">{GS(incomeStatements[0].expenses_tax)}</span></div>
                  <div className="flex justify-between py-0.5 text-slate-600">Despesas Financeiras<span className="font-mono font-bold">{GS(incomeStatements[0].expenses_financial)}</span></div>
                </div>
                <div className="flex justify-between font-black text-slate-800 border-t border-slate-200 pt-2">RESULTADO LÍQUIDO<span>{GS(incomeStatements[0].net_income)}</span></div>
                <div className="flex justify-between text-amber-700 font-bold text-[10px]">IRP ({GS(incomeStatements[0].irp)}) · IVA ({GS(incomeStatements[0].iva)})<span>Resultado Final: {GS(incomeStatements[0].net_income_after_tax)}</span></div>
              </div>
            </div>
          )}

          {/* ── Apuração de Impostos ─────────────────────────────────────────── */}
          {finTab === 'tax' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm">Apuração de Impostos — Período: 2026-06</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">Imposto</th><th className="px-4 py-2.5 text-right">Base</th><th className="px-4 py-2.5 text-center">Alíquota</th><th className="px-4 py-2.5 text-right">Valor</th><th className="px-4 py-2.5 text-center">Vencimento</th><th className="px-4 py-2.5 text-center">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {taxCalculations.map(tax => (
                      <tr key={tax.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-800">
                          <span className={`inline-flex items-center gap-1 ${tax.tax_type === 'IVA' ? 'text-blue-700' : tax.tax_type === 'IRE' ? 'text-purple-700' : tax.tax_type === 'IRP' ? 'text-amber-700' : 'text-slate-700'}`}>
                            {tax.tax_type === 'IVA' ? '📋' : tax.tax_type === 'IRE' ? '🏢' : tax.tax_type === 'IRP' ? '👤' : '📄'} {tax.tax_type}
                          </span>
                          <p className="text-[9px] text-slate-400 font-normal mt-0.5">{tax.notes}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{GS(tax.taxable_base)}</td>
                        <td className="px-4 py-3 text-center font-bold">{tax.tax_rate}%</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">{GS(tax.tax_amount)}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{tax.due_date}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${tax.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : tax.status === 'declarado' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{tax.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <p className="font-bold text-slate-700 text-xs">Total Impostos a Pagar: <span className="text-amber-700">{GS(taxCalculations.reduce((s, t) => s + t.tax_amount, 0))}</span></p>
                <p className="text-[9px] text-slate-400 mt-1">IVA: vencimiento 15/07 · IRE: 31/07 · IRP: 15/08 · IDU: 20/07 · Conforme normativa DNIT/Resolución 21/2024</p>
              </div>
            </div>
          )}

          {/* ── Livros de Compras e Vendas DNIT ───────────────────────────────── */}
          {finTab === 'books' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><FileCheck className="w-4 h-4 text-rose-500" /> Livro de Compras (formato DNIT)</h4></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[8px] tracking-wide border-b border-slate-100">
                      <th className="px-2 py-2">DTE</th><th className="px-2 py-2">Proveedor</th><th className="px-2 py-2">RUC</th><th className="px-2 py-2">Fecha</th><th className="px-2 py-2">Timbrado</th><th className="px-2 py-2">Tipo</th><th className="px-2 py-2 text-right">Base 5%</th><th className="px-2 py-2 text-right">Base 10%</th><th className="px-2 py-2 text-right">IVA 5%</th><th className="px-2 py-2 text-right">IVA 10%</th><th className="px-2 py-2 text-right">Total</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {purchaseBook.map(pb => (
                        <tr key={pb.id} className="hover:bg-slate-50/70">
                          <td className="px-2 py-2 font-mono font-bold text-slate-700">{pb.dte_number}</td>
                          <td className="px-2 py-2 text-slate-600">{pb.supplier}</td>
                          <td className="px-2 py-2 font-mono text-slate-500">{pb.ruc}</td>
                          <td className="px-2 py-2 text-slate-500">{pb.date}</td>
                          <td className="px-2 py-2 font-mono text-slate-500">{pb.timbrado}</td>
                          <td className="px-2 py-2 text-slate-600">{pb.invoice_type}</td>
                          <td className="px-2 py-2 text-right font-mono">{pb.taxable_5 > 0 ? GS(pb.taxable_5) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{pb.taxable_10 > 0 ? GS(pb.taxable_10) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{pb.iva_5 > 0 ? GS(pb.iva_5) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{pb.iva_10 > 0 ? GS(pb.iva_10) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-slate-800">{GS(pb.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><FileCheck className="w-4 h-4 text-emerald-500" /> Livro de Vendas (formato DNIT)</h4></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[8px] tracking-wide border-b border-slate-100">
                      <th className="px-2 py-2">DTE</th><th className="px-2 py-2">Paciente</th><th className="px-2 py-2">RUC</th><th className="px-2 py-2">Fecha</th><th className="px-2 py-2">Timbrado</th><th className="px-2 py-2">Tipo</th><th className="px-2 py-2 text-right">Base 5%</th><th className="px-2 py-2 text-right">Base 10%</th><th className="px-2 py-2 text-right">IVA 5%</th><th className="px-2 py-2 text-right">IVA 10%</th><th className="px-2 py-2 text-right">Total</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {salesBook.map(sb => (
                        <tr key={sb.id} className="hover:bg-slate-50/70">
                          <td className="px-2 py-2 font-mono font-bold text-slate-700">{sb.dte_number}</td>
                          <td className="px-2 py-2 text-slate-600">{sb.patient_name}</td>
                          <td className="px-2 py-2 font-mono text-slate-500">{sb.ruc || '—'}</td>
                          <td className="px-2 py-2 text-slate-500">{sb.date}</td>
                          <td className="px-2 py-2 font-mono text-slate-500">{sb.timbrado}</td>
                          <td className="px-2 py-2 text-slate-600">{sb.invoice_type}</td>
                          <td className="px-2 py-2 text-right font-mono">{sb.taxable_5 > 0 ? GS(sb.taxable_5) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{sb.taxable_10 > 0 ? GS(sb.taxable_10) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{sb.iva_5 > 0 ? GS(sb.iva_5) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono">{sb.iva_10 > 0 ? GS(sb.iva_10) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-slate-800">{GS(sb.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Multimoeda (BCP) ──────────────────────────────────────────────── */}
          {finTab === 'multicurrency' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-teal-600" /> Cotações — Banco Central del Paraguay (BCP)</h4>
                <span className="text-[9px] text-slate-400">Atualizado: {exchangeRates[0]?.date || '-'}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5">
                {exchangeRates.map(fx => (
                  <div key={fx.id} className="border border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                    <p className="font-black text-slate-800 text-lg">{fx.currency}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">por Gs.</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Compra</span><span className="font-mono font-bold text-emerald-700">{fx.buy_rate.toLocaleString('es-PY')}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Venta</span><span className="font-mono font-bold text-rose-700">{fx.sell_rate.toLocaleString('es-PY')}</span></div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2">Fuente: {fx.source}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4 flex gap-2">
                <button onClick={() => {
                  const conv = prompt('Valor em Gs. para converter a USD:');
                  if (!conv) return;
                  const gs = Number(conv);
                  if (!gs) return;
                  const usdRate = exchangeRates.find(r => r.currency === 'USD');
                  if (!usdRate) return;
                  alert(`Gs. ${gs.toLocaleString('es-PY')} = USD ${(gs / usdRate.sell_rate).toFixed(2)} (tasa venta: ${usdRate.sell_rate})`);
                }} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition">Conversor Gs. → USD</button>
                <button onClick={() => {
                  let msg = 'COTIZACIONES BCP\n' + '='.repeat(30) + '\n';
                  exchangeRates.forEach(fx => {
                    msg += `\n${fx.currency}:\n  Compra: Gs. ${fx.buy_rate.toLocaleString('es-PY')}\n  Venta:  Gs. ${fx.sell_rate.toLocaleString('es-PY')}`;
                  });
                  msg += '\n\nFuente: Banco Central del Paraguay (BCP)';
                  alert(msg);
                }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">Ver todas las cotizaciones</button>
              </div>
            </div>
          )}

          {/* ── Plano de Contas ─────────────────────────────────────────────────── */}
          {finTab === 'chart_accounts' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Hash className="w-4 h-4 text-teal-600" /> Plano de Contas (Normativa Paraguaya)</h4>
                <span className="text-[9px] text-slate-400">Total cuentas: {chartOfAccounts.length}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
                {['ativo', 'passivo', 'patrimonio', 'receita', 'custo', 'despesa'].map(type => {
                  const accounts = chartOfAccounts.filter(c => c.type === type);
                  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
                  const typeColors: Record<string, string> = { ativo: 'text-blue-700 bg-blue-50 border-blue-200', passivo: 'text-amber-700 bg-amber-50 border-amber-200', patrimonio: 'text-purple-700 bg-purple-50 border-purple-200', receita: 'text-emerald-700 bg-emerald-50 border-emerald-200', custo: 'text-rose-700 bg-rose-50 border-rose-200', despesa: 'text-red-700 bg-red-50 border-red-200' };
                  return (
                    <div key={type} className={`border rounded-xl p-3 ${typeColors[type] || 'border-slate-200'}`}>
                      <h5 className="font-black uppercase text-[11px] tracking-wider mb-2">{type} (Gs. {totalBalance.toLocaleString('es-PY')})</h5>
                      {accounts.map(acc => (
                        <div key={acc.id} className="flex justify-between py-1 text-xs" style={{ paddingLeft: `${(acc.level - 1) * 12}px` }}>
                          <span><span className="font-mono text-slate-400 text-[9px]">{acc.code}</span> {acc.name}</span>
                          <span className="font-mono font-bold">{GS(acc.balance)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Lançamentos Contábeis ────────────────────────────────────────── */}
          {finTab === 'accounting_entries' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Edit2 className="w-4 h-4 text-teal-600" /> Lançamentos Contábeis Automáticos</h4>
                <span className="text-[9px] text-slate-400">{accountingEntries.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[8px] tracking-wide border-b border-slate-100">
                    <th className="px-3 py-2.5">Data</th><th className="px-3 py-2.5 text-left">Descrição</th><th className="px-3 py-2.5 text-center">Débito</th><th className="px-3 py-2.5 text-center">Crédito</th><th className="px-3 py-2.5 text-right">Valor</th><th className="px-3 py-2.5 text-center">Evento</th><th className="px-3 py-2.5 text-left">Documento</th><th className="px-3 py-2.5 text-left">CC</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {accountingEntries.map(ae => (
                      <tr key={ae.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 text-slate-500">{ae.date}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700 max-w-[200px] truncate">{ae.description}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-rose-700 font-bold">{ae.account_debit}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-emerald-700 font-bold">{ae.account_credit}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{GS(ae.amount)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${ae.event_type === 'faturamento' ? 'bg-blue-100 text-blue-800' : ae.event_type === 'recebimento' ? 'bg-emerald-100 text-emerald-800' : ae.event_type === 'pagamento' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>{ae.event_type}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-500 text-[9px]">{ae.document_number || '-'}</td>
                        <td className="px-3 py-2.5 text-slate-500 text-[9px]">{ae.cost_center}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500">
                <p className="font-bold text-slate-700 mb-1">Regra de Lançamento Automático:</p>
                <p>Faturamento → D: Contas a Receber (1.1.2) / C: Receita (4.1)</p>
                <p>Recebimento → D: Caixa (1.1.1) / C: Contas a Receber (1.1.2)</p>
                <p>Pagamento → D: Custo/Despesa (5/6) / C: Caixa (1.1.1)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 7. Estoque e Farmácia ───────────────────────────────────────────── */}
      {activeSubmodule === 7 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Pill className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800 text-base">{t('fin_new_supply', 'app')}</h3>
            </div>

            <form onSubmit={handleAddStockItem} noValidate className="space-y-4 text-xs">
              {stockItemValidation.errors.length > 0 && <FormErrorSummary errors={stockItemValidation.errors} />}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Item / Medicamento</label>
                <input
                  type="text"
                  value={newStockName}
                  onChange={e => setNewStockName(e.target.value)}
                  placeholder="Ex: Paracetamol suspensão 15ml"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={newStockCat}
                    onChange={e => setNewStockCat(e.target.value)}
                    placeholder="Antibióticos, Consumíveis"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unidade</label>
                  <input
                    type="text"
                    value={newStockUnit}
                    onChange={e => setNewStockUnit(e.target.value)}
                    placeholder={t('fin_placeholder_ampoules', 'app')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Quantidade em Registro Inicial</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newStockQty}
                  onChange={e => setNewStockQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs transition">
                Registrar Medicamento / Insumo
              </button>
            </form>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Prateleira Geral e Farmacovigilância</h4>

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {stockItems.map(item => {
                const isUnderStock = item.quantity < item.minQuantity;
                return (
                  <div key={item.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800 text-sm">{item.name}</p>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 py-0.5 px-2 rounded-full border border-indigo-100 font-bold">{item.category}</span>
                      </div>
                      <p className="text-slate-500 font-medium">Quantidade: <b className={`text-sm ${isUnderStock ? 'text-rose-700 underline font-black' : 'text-slate-800 font-bold'}`}>{item.quantity}</b> {item.unit}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUnderStock && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase rounded border border-rose-200 animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3" /> Baixo Estoque
                        </span>
                      )}
                      <button onClick={() => handleUpdateStockQty(item.id, 50)} className="p-1 px-2.5 bg-slate-800 text-white font-bold rounded" title={t('fin_title_restock_50', 'app')}>+50</button>
                      <button onClick={() => handleUpdateStockQty(item.id, -1)} className="p-1 px-2.5 bg-slate-200 text-slate-700 font-bold rounded" title={t('fin_title_dispense', 'app')}>-1</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── 14. Administração e Segurança ──────────────────────────────────── */}
      {activeSubmodule === 14 && (
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex gap-1 border-b border-slate-200/80 pb-px overflow-x-auto">
            <button onClick={() => setAdminTab('users')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'users' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Users className="w-3.5 h-3.5" /> Usuários
            </button>
            <button onClick={() => setAdminTab('security')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'security' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Shield className="w-3.5 h-3.5" /> RBAC
            </button>
            <button onClick={() => setAdminTab('password-policy')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'password-policy' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Lock className="w-3.5 h-3.5" /> Política de Senhas
            </button>
            <button onClick={() => setAdminTab('two-factor')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'two-factor' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Fingerprint className="w-3.5 h-3.5" /> 2FA / MFA
            </button>
            <button onClick={() => setAdminTab('sso')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'sso' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Globe className="w-3.5 h-3.5" /> SSO
            </button>
            <button onClick={() => setAdminTab('sessions')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'sessions' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <DoorOpen className="w-3.5 h-3.5" /> Sessões
            </button>
            <button onClick={() => setAdminTab('professionals')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'professionals' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Stethoscope className="w-3.5 h-3.5" /> Profissionais
            </button>
            <button onClick={() => setAdminTab('locations')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'locations' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Building2 className="w-3.5 h-3.5" /> Sede
            </button>
            <button onClick={() => setAdminTab('rooms')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'rooms' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <DoorOpen className="w-3.5 h-3.5" /> Salas
            </button>
            <button onClick={() => setAdminTab('roles')} className={`pb-2.5 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${adminTab === 'roles' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Briefcase className="w-3.5 h-3.5" /> Profissões
            </button>
          </div>

          {adminTab === 'users' && (
            <UsersTab addAuditLog={addAuditLog} />
          )}

          {adminTab === 'password-policy' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Lock className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">Política de Senhas</h3>
                </div>
                <div className="space-y-4 text-xs font-sans">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700">Política Ativa</span>
                    <button onClick={() => { setPasswordPolicy(prev => ({ ...prev, enabled: !prev.enabled })); setPasswordPolicySaved(false); }} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${passwordPolicy.enabled ? 'bg-teal-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${passwordPolicy.enabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tamanho Mínimo: {passwordPolicy.minLength} caracteres</label>
                    <input type="range" min={4} max={32} value={passwordPolicy.minLength} onChange={e => setPasswordPolicy(prev => ({ ...prev, minLength: Number(e.target.value) }))} className="w-full accent-teal-600" />
                    <div className="flex justify-between text-[9px] text-slate-400"><span>4</span><span>32</span></div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">Requisitos de Complexidade</p>
                    {[
                      { key: 'requireUppercase' as const, label: 'Exigir letra maiúscula (A-Z)' },
                      { key: 'requireLowercase' as const, label: 'Exigir letra minúscula (a-z)' },
                      { key: 'requireNumbers' as const, label: 'Exigir número (0-9)' },
                      { key: 'requireSpecialChars' as const, label: 'Exigir caractere especial (!@#$%)' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={passwordPolicy[item.key]} onChange={e => setPasswordPolicy(prev => ({ ...prev, [item.key]: e.target.checked }))} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                        <span className="text-xs font-medium text-slate-700">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Expiração (dias)</label>
                      <input type="text" inputMode="numeric" value={passwordPolicy.expirationDays} onChange={e => setPasswordPolicy(prev => ({ ...prev, expirationDays: Number(e.target.value) }))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                      {passwordPolicy.expirationDays === 0 && <p className="text-[9px] text-amber-600 font-medium mt-0.5">0 = sem expiração</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Histórico (senhas anteriores)</label>
                      <input type="text" inputMode="numeric" value={passwordPolicy.historyCount} onChange={e => setPasswordPolicy(prev => ({ ...prev, historyCount: Number(e.target.value) }))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                    </div>
                  </div>

                  <button onClick={() => { setPasswordPolicySaved(true); addAuditLog('Alterou Política de Senhas', JSON.stringify(passwordPolicy)); setTimeout(() => setPasswordPolicySaved(false), 3000); }} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer transition flex items-center justify-center gap-2">
                    {passwordPolicySaved ? <><CheckCheck className="w-4 h-4" /> {t('fin_password_policy_saved', 'app')}</> : t('fin_save_password_policy', 'app')}
                  </button>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">Bloqueio Automático</h3>
                </div>
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tentativas Máximas Antes do Bloqueio: {passwordPolicy.maxLoginAttempts}</label>
                    <input type="range" min={1} max={20} value={passwordPolicy.maxLoginAttempts} onChange={e => setPasswordPolicy(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))} className="w-full accent-teal-600" />
                    <div className="flex justify-between text-[9px] text-slate-400"><span>1</span><span>20</span></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Duração do Bloqueio: {passwordPolicy.lockoutDurationMinutes} minutos</label>
                    <input type="range" min={1} max={1440} value={passwordPolicy.lockoutDurationMinutes} onChange={e => setPasswordPolicy(prev => ({ ...prev, lockoutDurationMinutes: Number(e.target.value) }))} className="w-full accent-teal-600" />
                    <div className="flex justify-between text-[9px] text-slate-400"><span>1 min</span><span>24 h</span></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Timeout de Sessão por Inatividade: {passwordPolicy.sessionTimeoutMinutes} minutos</label>
                    <input type="range" min={5} max={480} value={passwordPolicy.sessionTimeoutMinutes} onChange={e => { const updated = { ...passwordPolicy, sessionTimeoutMinutes: Number(e.target.value) }; setPasswordPolicy(updated); onPasswordPolicyChange?.(updated); }} className="w-full accent-teal-600" />
                    <div className="flex justify-between text-[9px] text-slate-400"><span>5 min</span><span>8 h</span></div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[10px] text-amber-800 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Usuários bloqueados serão notificados por e-mail com instruções de desbloqueio. O administrador pode desbloquear manualmente na aba &quot;Usuários&quot;.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'two-factor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Fingerprint className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">Autenticação de Dois Fatores (2FA / MFA)</h3>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <p className="text-xs text-teal-800 font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      {systemUsers.filter(u => u.twoFactorEnabled).length} de {systemUsers.length} usuários com 2FA ativo
                    </p>
                    <div className="mt-2 w-full bg-teal-200 rounded-full h-2">
                      <div className="bg-teal-600 h-2 rounded-full transition-all" style={{ width: `${(systemUsers.filter(u => u.twoFactorEnabled).length / systemUsers.length) * 100}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <SmartphoneIcon className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                      <p className="font-bold text-slate-700 text-xs">TOTP</p>
                      <p className="text-[9px] text-slate-400">Google Authenticator, Authy</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <SmartphoneIcon className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                      <p className="font-bold text-slate-700 text-xs">SMS</p>
                      <p className="text-[9px] text-slate-400">Código via SMS</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <Mail className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                      <p className="font-bold text-slate-700 text-xs">E-mail</p>
                      <p className="text-[9px] text-slate-400">Código via e-mail</p>
                    </div>
                  </div>

                  {/* Simulador de Configuração 2FA */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                      <ScanLine className="w-4 h-4 text-teal-600" /> Simular Configuração 2FA (TOTP)
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                        <div className="w-20 h-20 grid grid-cols-6 gap-0.5">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div key={i} className="rounded-sm" style={{ background: ((i * 13 + i % 7) % 3 === 0) ? '#0f172a' : 'white' }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="text-[10px] text-slate-500 font-medium">Escaneie o QR code com seu aplicativo autenticador:</p>
                        <p className="font-mono text-[9px] text-slate-700 bg-slate-100 p-2 rounded break-all">otpauth://totp/IAMED:admin@iamed.med.br?secret=JBSWY3DPEHPK3PXP&issuer=IAMED</p>
                        <button onClick={() => { setShowTwoFactorQR(!showTwoFactorQR); }} className="text-[10px] text-teal-600 font-bold hover:text-teal-800 cursor-pointer">
                          {showTwoFactorQR ? 'Ocultar' : 'Mostrar'} chave secreta
                        </button>
                        {showTwoFactorQR && (
                          <p className="font-mono text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 break-all">
                            Chave: JBSWY3DPEHPK3PXP
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Código de Verificação (6 dígitos)</label>
                        <input type="text" maxLength={6} value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center tracking-widest" />
                      </div>
                       <button onClick={() => { if (twoFactorCode.length === 6) { setTwoFactorVerified(true); addAuditLog('Verificou 2FA TOTP', 'Código validado com sucesso'); } else { alert(t('fin_alert_6_digit_code', 'app')); } }} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer transition">
                        Verificar
                      </button>
                    </div>
                    {twoFactorVerified && (
                      <p className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> 2FA verificado com sucesso! Código válido.
                      </p>
                    )}
                  </div>

                  {/* Códigos de Backup */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                      <Copy className="w-4 h-4 text-amber-600" /> {t('fin_backup_codes', 'app')}
                    </h4>
                    <p className="text-[10px] text-slate-500">Guarde estes códigos em local seguro. Cada código só pode ser usado uma vez.</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {backupCodes.map((code, i) => (
                        <div key={i} className="font-mono text-xs bg-slate-100 p-2 rounded border border-slate-200 text-center text-slate-700 font-bold tracking-wider">
                          {code}
                        </div>
                      ))}
                    </div>
                       <button onClick={() => { addAuditLog('Gerou novos códigos de backup 2FA', 'Backup codes regenerated'); setBackupCodes(Array.from({ length: 5 }, () => { const c = () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]; return `${c()}${c()}${c()}${c()}-${c()}${c()}${c()}${c()}`; })); alert(t('fin_alert_new_backup_codes', 'app')); }} className="text-[10px] text-amber-600 font-bold hover:text-amber-800 cursor-pointer">
                      {t('fin_regenerate_backup_codes', 'app')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status 2FA por Usuário */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Users className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">Status 2FA por Usuário</h3>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {systemUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[9px] ${u.twoFactorEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700 text-[10px] truncate">{u.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">{u.systemRole}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {u.twoFactorEnabled ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            <span className="text-[9px] text-teal-700 font-bold">{u.twoFactorMethod === 'totp' ? 'TOTP' : u.twoFactorMethod === 'sms' ? 'SMS' : 'E-mail'}</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[9px] text-slate-400">Inativo</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === 'sso' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form SSO */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Globe className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">{editingSsoId ? t('fin_edit_sso_provider', 'app') : t('fin_new_sso_provider', 'app')}</h3>
                </div>
                <form onSubmit={async (e) => { e.preventDefault(); const ssoRes = ssoValidation.validate({ name: ssoName, type: ssoType, issuerUrl: ssoIssuer, clientId: ssoClientId, clientSecret: ssoClientSecret, metadataUrl: ssoMetadataUrl, certificateFingerprint: ssoCertFingerprint, defaultRole: ssoDefaultRole, enabled: ssoEnabled }); if (!ssoRes.success) return; if (editingSsoId) { setSSOProviders(prev => prev.map(p => p.id === editingSsoId ? { ...p, name: ssoName, type: ssoType, issuerUrl: ssoIssuer, clientId: ssoClientId, clientSecret: ssoClientSecret, metadataUrl: ssoMetadataUrl, certificateFingerprint: ssoCertFingerprint, defaultRole: ssoDefaultRole, enabled: ssoEnabled } : p)); addAuditLog('Editou Provedor SSO', ssoName); } else { const ssoId = await genModuleId('sso'); setSSOProviders(prev => [...prev, { id: ssoId, name: ssoName, type: ssoType, enabled: ssoEnabled, issuerUrl: ssoIssuer, clientId: ssoClientId, clientSecret: ssoClientSecret, metadataUrl: ssoMetadataUrl, certificateFingerprint: ssoCertFingerprint, defaultRole: ssoDefaultRole, active: ssoEnabled }]); addAuditLog('Cadastrou Provedor SSO', ssoName); } setSsoFormOpen(false); setEditingSsoId(null); setSsoName(''); }} noValidate className="space-y-3 text-xs font-sans">
                  {ssoValidation.errors.length > 0 && <FormErrorSummary errors={ssoValidation.errors} />}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_sso_provider_name', 'app')}</label>
                    <input type="text" value={ssoName} onChange={e => setSsoName(e.target.value)} placeholder="Azure AD" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_sso_type', 'app')}</label>
                    <select value={ssoType} onChange={e => setSsoType(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <option value="oidc">OpenID Connect (OIDC)</option>
                      <option value="oauth2">OAuth 2.0</option>
                      <option value="saml">SAML 2.0</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Issuer URL *</label>
                    <input type="text" value={ssoIssuer} onChange={e => setSsoIssuer(e.target.value)} placeholder="https://login.microsoftonline.com/tenant/v2.0" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Client ID *</label>
                      <input type="text" value={ssoClientId} onChange={e => setSsoClientId(e.target.value)} placeholder="app_client_id" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Client Secret</label>
                      <input type="password" value={ssoClientSecret} onChange={e => setSsoClientSecret(e.target.value)} placeholder="********" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Metadata URL</label>
                    <input type="text" value={ssoMetadataUrl} onChange={e => setSsoMetadataUrl(e.target.value)} placeholder="https://.../.well-known/openid-configuration" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  {ssoType === 'saml' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Certificado / Impressão Digital</label>
                      <input type="text" value={ssoCertFingerprint} onChange={e => setSsoCertFingerprint(e.target.value)} placeholder="A1:B2:C3:D4:..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Perfil Padrão</label>
                    <select value={ssoDefaultRole} onChange={e => setSsoDefaultRole(e.target.value as SystemRole)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <option value="SuperAdmin">SuperAdmin</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Gestor">Gestor</option>
                      <option value="Diretor Clínico">Diretor Clínico</option>
                      <option value="Médico">Médico</option>
                      <option value="Enfermeiro">Enfermeiro</option>
                      <option value="Recepcionista">Recepcionista</option>
                      <option value="Financeiro">Financeiro</option>
                      <option value="Farmacêutico">Farmacêutico</option>
                      <option value="Visualizador">Visualizador</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">Ativo</span>
                    <button type="button" onClick={() => setSsoEnabled(!ssoEnabled)} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${ssoEnabled ? 'bg-teal-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${ssoEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer transition">
                    {editingSsoId ? t('fin_update_provider', 'app') : t('fin_add_provider', 'app')}
                  </button>
                  {editingSsoId && (
                    <button type="button" onClick={() => { setEditingSsoId(null); setSsoName(''); setSsoType('oidc'); setSsoIssuer(''); setSsoClientId(''); setSsoClientSecret(''); setSsoMetadataUrl(''); setSsoCertFingerprint(''); setSsoDefaultRole('Visualizador'); setSsoEnabled(false); }} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition">
                      {t('fin_btn_cancel', 'app')}
                    </button>
                  )}
                </form>
              </div>

              {/* Lista de Provedores SSO */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-slate-800 text-base">Provedores SSO Configurados</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">{ssoProviders.length}</span>
                </div>
                <div className="space-y-3">
                  {ssoProviders.map(p => (
                    <div key={p.id} className={`p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs transition ${!p.active ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${p.type === 'oidc' ? 'bg-blue-600' : p.type === 'oauth2' ? 'bg-green-600' : 'bg-purple-600'}`}>
                            {p.type === 'oidc' ? 'O' : p.type === 'oauth2' ? 'A' : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-mono uppercase">{p.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${p.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{p.enabled ? 'Ativo' : 'Inativo'}</span>
                          <button onClick={() => { setEditingSsoId(p.id); setSsoName(p.name); setSsoType(p.type); setSsoIssuer(p.issuerUrl); setSsoClientId(p.clientId); setSsoClientSecret(p.clientSecret); setSsoMetadataUrl(p.metadataUrl); setSsoCertFingerprint(p.certificateFingerprint); setSsoDefaultRole(p.defaultRole); setSsoEnabled(p.enabled); }} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-500">
                        <p><span className="font-semibold text-slate-600">Issuer:</span> <span className="font-mono text-[10px]">{p.issuerUrl}</span></p>
                        <p><span className="font-semibold text-slate-600">Client ID:</span> <span className="font-mono text-[10px]">{p.clientId}</span></p>
                        {p.metadataUrl && <p className="col-span-2"><span className="font-semibold text-slate-600">Metadata:</span> <span className="font-mono text-[10px]">{p.metadataUrl}</span></p>}
                        <p><span className="font-semibold text-slate-600">Perfil Padrão:</span> {p.defaultRole}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === 'sessions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bloqueio e Sessões */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <DoorOpen className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">Sessões Ativas</h3>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {(sessionFilter === 'all' ? userSessions : userSessions.filter(s => sessionFilter === 'active' ? s.active : !s.active)).map(s => (
                    <div key={s.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{s.userName}</span>
                        {s.active ? <span className="w-2 h-2 rounded-full bg-emerald-500" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
                      </div>
                      <p className="text-slate-400 font-mono text-[9px]">{s.ipAddress} | {s.deviceInfo}</p>
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Login: {s.loginAt}</span>
                        <span>Expira: {s.expiresAt}</span>
                      </div>
                      {s.active && (
                        <button onClick={() => { setUserSessions(prev => prev.map(x => x.id === s.id ? { ...x, active: false, revoked: true } : x)); addAuditLog('Revogou Sessão', s.userName); }} className="text-[9px] text-rose-600 font-bold hover:text-rose-800 cursor-pointer">
                          Revogar Sessão
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-1 pt-2">
                    <button onClick={() => setSessionFilter('active')} className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer ${sessionFilter === 'active' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>Ativas ({userSessions.filter(s => s.active).length})</button>
                    <button onClick={() => setSessionFilter('all')} className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer ${sessionFilter === 'all' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>Todas ({userSessions.length})</button>
                  </div>
                </div>
              </div>

              {/* Login Attempts */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-slate-800 text-base">Tentativas de Login</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">{loginAttempts.filter(a => !a.success).length} falhas</span>
                </div>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {loginAttempts.map(a => (
                    <div key={a.id} className={`flex items-center justify-between p-2 rounded-lg text-[10px] border ${a.success ? 'bg-emerald-50/50 border-emerald-200/50' : 'bg-rose-50/50 border-rose-200/50'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {a.success ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> : <XCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700 truncate">{a.email}</p>
                          <p className="text-[9px] text-slate-400">{a.ipAddress} | {a.userAgent}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-slate-500">{a.attemptedAt}</p>
                        {a.failureReason && <p className="text-[9px] text-rose-600 font-medium">{a.failureReason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 font-medium">
                    Últimas {loginAttempts.length} tentativas registradas. As tentativas são armazenadas por 90 dias conforme política de retenção.
                  </span>
                  <button onClick={() => { addAuditLog('Limpou Tentativas de Login', `${loginAttempts.length} registros removidos`); setLoginAttempts([]); }} className="text-[10px] text-rose-600 font-bold hover:text-rose-800 cursor-pointer shrink-0">
                    Limpar Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna 1: Seleção de Profissional e Operador */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Shield className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-slate-800 text-base">Controle de Acesso &amp; RBAC</h3>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    {/* Selecionar profissional */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                        {t('fin_select_professional_permissions', 'app')}
                      </label>
                      <select
                        value={rbacSelectedProfId || (professionals.length > 0 ? professionals[0].id : '')}
                        onChange={e => setRbacSelectedProfId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold"
                      >
                        {professionals.length === 0 && <option value="">Sem profissionais cadastrados</option>}
                        {professionals.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2 text-teal-900 leading-relaxed">
                      <span className="flex items-center gap-1.5 font-bold"><ShieldCheck className="w-4 h-4 text-teal-700" /> Encriptação de Logs Ativada</span>
                      <p className="text-[11px] text-teal-800 font-medium">
                        Todo acesso à base de dados clínica, alterações em prontuários eletrônicos (HCE) ou emissão de faturamentos são auditados com IP e operador de acordo com as leis LGPD vigentes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Configuração de Permissões */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
                  {(() => {
                    const activeRbacProfId = rbacSelectedProfId || (professionals.length > 0 ? professionals[0].id : '');
                    const rbacProf = professionals.find(p => p.id === activeRbacProfId);
                    
                    if (!rbacProf) {
                      return (
                        <div className="text-center py-10 text-slate-400 font-semibold text-xs">
                          {t('fin_select_or_register_professional', 'app')}
                        </div>
                      );
                    }

                    const currentPerms = rbacProf.permissions || [];

                    const handleTogglePermission = async (permKey: string) => {
                      if (!setProfessionals) return;
                      const updatedPerms = currentPerms.includes(permKey)
                        ? currentPerms.filter(k => k !== permKey)
                        : [...currentPerms, permKey];

                      setProfessionals(prev => prev.map(p => p.id === rbacProf.id ? { ...p, permissions: updatedPerms } : p));
                      addAuditLog('Alterou Permissões RBAC', `${rbacProf.name}: ${permKey} → ${!currentPerms.includes(permKey) ? 'ATIVADO' : 'DESATIVADO'}`);

                      try {
                        await supabase
                          .from('professionals')
                          .update({ permissions: updatedPerms })
                          .eq('id', rbacProf.id);
                      } catch (e) {
                        console.warn('Database permissions update failed, operating in memory-only mode:', e);
                      }
                    };

                    const handleSelectAll = async (type: 'view' | 'perform' | 'all') => {
                      if (!setProfessionals) return;
                      
                      const viewKeys = ['view_reception', 'view_agenda', 'view_hce', 'view_diagnostic', 'view_finance', 'view_stock', 'view_med_work', 'view_crm', 'view_security'];
                      const performKeys = ['perform_admit', 'perform_prescribe', 'perform_sifen', 'perform_post_finance', 'perform_stock', 'perform_beds', 'perform_rbac'];
                      
                      let targetKeys: string[] = [];
                      if (type === 'view') targetKeys = viewKeys;
                      else if (type === 'perform') targetKeys = performKeys;
                      else targetKeys = [...viewKeys, ...performKeys];

                      const updatedPerms = Array.from(new Set([...currentPerms, ...targetKeys]));

                      setProfessionals(prev => prev.map(p => p.id === rbacProf.id ? { ...p, permissions: updatedPerms } : p));
                      addAuditLog('Alterou Permissões RBAC (Lote)', `${rbacProf.name}: Ativou todas as permissões de ${type}`);

                      try {
                        await supabase
                          .from('professionals')
                          .update({ permissions: updatedPerms })
                          .eq('id', rbacProf.id);
                      } catch (e) {
                        console.warn('Database permissions update failed:', e);
                      }
                    };

                    const handleClearAll = async () => {
                      if (!setProfessionals) return;
                      
                      setProfessionals(prev => prev.map(p => p.id === rbacProf.id ? { ...p, permissions: [] } : p));
                      addAuditLog('Alterou Permissões RBAC (Lote)', `${rbacProf.name}: Limpou todas as permissões`);

                      try {
                        await supabase
                          .from('professionals')
                          .update({ permissions: [] })
                          .eq('id', rbacProf.id);
                      } catch (e) {
                        console.warn('Database permissions update failed:', e);
                      }
                    };

                    const permsList = {
                      visualize: [
                        { key: 'view_reception', label: 'Recepção e Triagem', desc: 'Visualizar fila de pacientes, prioridades e leitos' },
                        { key: 'view_agenda', label: 'Agenda e Consultas', desc: 'Visualizar horários de consultas e agendas médicas' },
                        { key: 'view_hce', label: 'Histórico Clínico (HCE)', desc: 'Acessar fichas de evolução, anamneses e prontuários' },
                        { key: 'view_diagnostic', label: 'Diagnósticos e PACS', desc: 'Visualizar exames de imagens radiológicas e laudos' },
                        { key: 'view_finance', label: 'Financeiro e Contas', desc: 'Visualizar lançamentos de caixa, receitas e despesas' },
                        { key: 'view_stock', label: 'Medicamentos e Insumos', desc: 'Acompanhar nível de estoque e alertas de reposição' },
                        { key: 'view_med_work', label: 'Saúde Ocupacional', desc: 'Acessar exames ASO e dados de medicina do trabalho' },
                        { key: 'view_crm', label: 'Marketing e CRM', desc: 'Visualizar dashboards de inteligência, NPS e campanhas' },
                        { key: 'view_security', label: 'Auditoria de Logs', desc: 'Visualizar logs de segurança e acessos de operador' }
                      ],
                      perform: [
                        { key: 'perform_admit', label: 'Internar / Admitir Paciente', desc: 'Registrar e priorizar pacientes na fila de triagem' },
                        { key: 'perform_prescribe', label: 'Prescrever / Evoluir HCE', desc: 'Evoluir anamneses clínicas e receitar remédios' },
                        { key: 'perform_sifen', label: 'Faturar e Emitir SIFEN', desc: 'Emitir XMLs de faturamento eletrônico integrado à DNIT' },
                        { key: 'perform_post_finance', label: t('fin_post_revenue_expenses', 'app'), desc: t('fin_add_financial_transactions', 'app') },
                        { key: 'perform_stock', label: 'Dispensar Insumos / Droga', desc: 'Dispensar produtos e gerenciar baixa de estoque' },
                        { key: 'perform_beds', label: 'Gerenciar Leitos / UTI', desc: 'Internar pacientes e alterar status dos leitos' },
                        { key: 'perform_rbac', label: 'Configurar Regras RBAC', desc: 'Gerenciar níveis de acesso de outros profissionais' }
                      ]
                    };

                    return (
                      <div className="space-y-4 text-xs font-sans">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <span className={`w-3 h-3 rounded-full ${rbacProf.color || 'bg-slate-400'}`} />
                              Configurar Permissões: <span className="text-teal-700">{rbacProf.name}</span>
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cargo: {rbacProf.role} | Especialidade: {rbacProf.specialty}</p>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleSelectAll('all')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] transition cursor-pointer"
                            >
                              {t('fin_select_all', 'app')}
                            </button>
                            <button
                              onClick={handleClearAll}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[10px] transition cursor-pointer"
                            >
                              Limpar Tudo
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Bloco de Visualização */}
                          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                              <span className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Pode Visualizar / Acessar</span>
                              <button
                                onClick={() => handleSelectAll('view')}
                                className="text-[9px] font-bold text-teal-600 hover:text-teal-800"
                              >
                                Todos
                              </button>
                            </div>
                            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                              {permsList.visualize.map(item => {
                                const isChecked = currentPerms.includes(item.key);
                                return (
                                  <label
                                    key={item.key}
                                    className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer select-none ${
                                      isChecked
                                        ? 'border-teal-500 bg-teal-50/40 text-teal-900 font-bold'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermission(item.key)}
                                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0"
                                    />
                                    <div>
                                      <p className="font-semibold text-xs">{item.label}</p>
                                      <p className="text-[9.5px] text-slate-400 font-medium leading-tight mt-0.5">{item.desc}</p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Bloco de Realização */}
                          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                              <span className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Pode Realizar / Alterar</span>
                              <button
                                onClick={() => handleSelectAll('perform')}
                                className="text-[9px] font-bold text-teal-600 hover:text-teal-800"
                              >
                                Todos
                              </button>
                            </div>
                            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                              {permsList.perform.map(item => {
                                const isChecked = currentPerms.includes(item.key);
                                return (
                                  <label
                                    key={item.key}
                                    className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer select-none ${
                                      isChecked
                                        ? 'border-teal-500 bg-teal-50/40 text-teal-900 font-bold'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermission(item.key)}
                                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0"
                                    />
                                    <div>
                                      <p className="font-semibold text-xs">{item.label}</p>
                                      <p className="text-[9.5px] text-slate-400 font-medium leading-tight mt-0.5">{item.desc}</p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Linha Inferior: Terminal de Auditoria */}
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 text-slate-100 flex flex-col font-mono text-xs shadow-md">
                <div className="flex items-center gap-2 font-bold text-teal-400 border-b border-slate-800 pb-3 mb-3 shrink-0">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                  TERMINAL DE AUDITORIA DE SEGURANÇA GERAL (LGPD)
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto flex-1 pr-1">
                  {logs.map((log, idx) => (
                    <div key={idx} className="p-2 bg-slate-900 border border-slate-800/80 rounded text-[11px] text-slate-300 leading-relaxed">
                      <span className="text-teal-400 font-black">[{log.timestamp}]</span> Op: <span className="font-black text-white">{log.operator}</span> (<i>{log.role}</i>) | <b className="text-yellow-400 font-bold uppercase">{log.action}:</b> <span className="text-slate-400 font-medium">{log.target}</span> | <span className="text-slate-500">IP: {log.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === 'professionals' && (
            <ProfessionalsTab
              professionals={professionals}
              setProfessionals={setProfessionals ?? (() => {})}
              professionalRoles={professionalRoles.map(r => r.name)}
              addAuditLog={addAuditLog}
            />
          )}

          {adminTab === 'locations' && (
            <LocationsTab
              mode="locations"
              locations={locations}
              setLocations={setLocations}
              clinicalRooms={clinicalRooms}
              setClinicalRooms={setClinicalRooms}
              addAuditLog={addAuditLog}
            />
          )}

          {adminTab === 'rooms' && (
            <LocationsTab
              mode="rooms"
              locations={locations}
              setLocations={setLocations}
              clinicalRooms={clinicalRooms}
              setClinicalRooms={setClinicalRooms}
              addAuditLog={addAuditLog}
            />
          )}

          {/* ─── Tab: Profissões ─────────────────────────────────────────────────── */}
          {adminTab === 'roles' && (
            <RolesTab
              professionalRoles={professionalRoles}
              setProfessionalRoles={setProfessionalRoles}
              supabase={supabase}
              addAuditLog={addAuditLog}
            />
          )}
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}
      {kudeTarget && <KudeModal dte={kudeTarget} onClose={() => setKudeTarget(null)} />}
      {xmlTarget && <XmlModal xml={xmlTarget} onClose={() => setXmlTarget(null)} />}
      {gatewayTarget && (
        <GatewayModal
          dte={gatewayTarget}
          onClose={() => setGatewayTarget(null)}
          onConfirm={(gw) => handleConciliar(gatewayTarget, gw)}
        />
      )}
    </div>
  );
}
