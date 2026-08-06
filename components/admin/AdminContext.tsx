import type {
  Dte,
  InsuranceCompany,
  FeeSchedule,
  PreAuthorization,
  BatchInvoice,
  EligibilityCheck,
  ProfessionalSettlement,
  ForeignBilling,
  AccountPayable,
  AccountReceivable,
  CashFlowProjection,
  BankReconciliation,
  CostCenter,
  IncomeStatement,
  TaxCalculation,
  PurchaseBookEntry,
  SalesBookEntry,
  ExchangeRate,
  ChartOfAccount,
  AccountingEntry,
  Professional,
  ProfessionalRole,
  AuditLog,
  FinancialPosting,
  StockItem,
  DteItem,
  SystemUser,
  PasswordPolicy,
  SSOProvider,
  Patient,
  Location,
  ClinicalRoom,
} from '@/lib/mockData';

export type {
  Dte,
  InsuranceCompany,
  FeeSchedule,
  PreAuthorization,
  BatchInvoice,
  EligibilityCheck,
  ProfessionalSettlement,
  ForeignBilling,
  AccountPayable,
  AccountReceivable,
  CashFlowProjection,
  BankReconciliation,
  CostCenter,
  IncomeStatement,
  TaxCalculation,
  PurchaseBookEntry,
  SalesBookEntry,
  ExchangeRate,
  ChartOfAccount,
  AccountingEntry,
  Professional,
  ProfessionalRole,
  AuditLog,
  FinancialPosting,
  StockItem,
  DteItem,
  SystemUser,
  PasswordPolicy,
  SSOProvider,
  Patient,
  Location,
  ClinicalRoom,
};

export type Gateway = 'Bancard' | 'Pagopar' | 'Tigo Money' | 'Personal Pay' | 'Eko Network' | 'Transferência';

export type FinTab =
  | 'dashboard'
  | 'ap_ar'
  | 'cashflow'
  | 'reconciliation'
  | 'cost_centers'
  | 'dre'
  | 'tax'
  | 'books'
  | 'multicurrency'
  | 'chart_accounts'
  | 'accounting_entries';

export type AdminTab =
  | 'overview'
  | 'dte'
  | 'insurances'
  | 'professionals'
  | 'users'
  | 'sso'
  | 'locations'
  | 'finance'
  | 'audit';

export const GATEWAYS: readonly Gateway[] = [
  'Bancard',
  'Pagopar',
  'Tigo Money',
  'Personal Pay',
  'Eko Network',
  'Transferência',
] as const;

export const PROCEDURES: Array<{ code: string; desc: string; price: number; iva: 5 | 10 }> = [
  { code: '10101012', desc: 'Consulta Médica Geral', price: 150000, iva: 10 },
  { code: '10101025', desc: 'Consulta Cardiológica', price: 350000, iva: 10 },
  { code: '40101010', desc: 'Eletrocardiograma (ECG)', price: 250000, iva: 10 },
  { code: '40201011', desc: 'Ultrassonografia Obstétrica', price: 500000, iva: 10 },
  { code: '40201020', desc: 'Ecografia Abdominal', price: 400000, iva: 10 },
  { code: '20103015', desc: 'Hemograma Completo', price: 120000, iva: 5 },
  { code: '99001001', desc: 'Exame Admissional - Med. Trabalho', price: 300000, iva: 10 },
  { code: '30101000', desc: 'Raio-X Tórax (2 incidências)', price: 180000, iva: 10 },
];

export const DTE_STATUS_BADGE: Record<string, string> = {
  'Aprovado': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Enviado': 'bg-blue-100 text-blue-200 border-blue-200',
  'Gerado': 'bg-slate-100 text-slate-700 border-slate-200',
  'Pendente de Envio': 'bg-amber-100 text-amber-800 border-amber-200',
  'Rejeitado': 'bg-rose-100 text-rose-800 border-rose-200',
  'Cancelado': 'bg-slate-100 text-slate-500 border-slate-200 line-through',
  'Inutilizado': 'bg-slate-200 text-slate-400 border-slate-300',
};

export const PAY_STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  conciliado: 'bg-teal-50 text-teal-700 border-teal-200',
  cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
};

export interface AdminFinanceModuleProps {
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
  professionalRoles?: ProfessionalRole[];
  setProfessionalRoles?: React.Dispatch<React.SetStateAction<ProfessionalRole[]>>;
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
  locations?: Array<{ id: string; name: string; status?: string; address?: string; city?: string; phone?: string }>;
  setLocations?: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; status?: string; address?: string; city?: string; phone?: string }>>>;
  clinicalRooms?: Array<{ id: string; name: string; location_id?: string; status?: string }>;
  setClinicalRooms?: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; location_id?: string; status?: string }>>>;
  passwordPolicy?: PasswordPolicy;
  onPasswordPolicyChange?: (policy: PasswordPolicy) => void;
}

export const STATUS_BADGE = (status: Dte['status']): string =>
  `inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${DTE_STATUS_BADGE[status || ''] || ''}`;

export const PAY_BADGE = (s: Dte['payment_status']): string =>
  `inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${PAY_STATUS_BADGE[s || ''] || ''}`;
