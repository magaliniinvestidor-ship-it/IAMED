'use client';

import React, { useState } from 'react';
import { FinancialPosting, StockItem, AuditLog, Dte, DteItem, Patient, Professional, ProfessionalRole, ProfessionalCouncil, ProfessionalShift, FeeSchedule, InsuranceCompany, PreAuthorization, BatchInvoice, EligibilityCheck, ProfessionalSettlement, ForeignBilling, AccountPayable, AccountReceivable, CashFlowProjection, BankReconciliation, CostCenter, IncomeStatement, TaxCalculation, PurchaseBookEntry, SalesBookEntry, ExchangeRate, ChartOfAccount, AccountingEntry, initialInsurances, initialFeeSchedules, initialPreAuthorizations, initialBatchInvoices, initialEligibilityChecks, initialSettlements, initialForeignBillings, initialAccountsPayable, initialAccountsReceivable, initialCashFlows, initialBankReconciliations, initialCostCenters, initialIncomeStatements, initialTaxCalculations, initialPurchaseBook, initialSalesBook, initialExchangeRates, initialChartOfAccounts, initialAccountingEntries } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import {
  Receipt, TrendingUp, Pill, Settings, Plus, Check,
  AlertTriangle, ShieldCheck, Download, FileText, X,
  QrCode, Stamp, Wifi, WifiOff, CreditCard, Smartphone,
  ChevronDown, ChevronRight, RefreshCw, Send, Ban, Eye,
  Building2, Hash, Globe, CheckCircle2, XCircle, Clock,
  AlertCircle, Banknote, Zap, Shield, FileCheck, Printer,
  Stethoscope, UserPlus, UserCheck, UserX, Mail, Phone, Briefcase, Calendar, Edit2, Users
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
}

const GS = (v: number) => `Gs. ${v.toLocaleString('es-PY')}`;

const DTE_TYPES = [
  'Fatura Eletrônica',
  'Nota de Crédito',
  'Nota de Débito',
  'Nota de Remessa',
  'Autofatura',
] as const;

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

// ─── KuDE Modal ───────────────────────────────────────────────────────────────
function KudeModal({ dte, onClose }: { dte: Dte; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white p-4 flex justify-between items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-75">KuDE — Representação Gráfica do DTE</p>
            <h2 className="font-black text-lg mt-0.5">IAMED — Sistema de Gestão Médica</h2>
            <p className="text-xs opacity-80 mt-1">RUC Emissor: 80069563-1 | Encarnación, Paraguay</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Timbrado Nº</p>
            <p className="font-black text-xl tracking-widest">{dte.timbrado}</p>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs font-sans">
          {/* Meta */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Tipo</p>
              <p className="font-black text-slate-800 mt-1">{dte.type}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Número</p>
              <p className="font-black text-slate-800 mt-1 font-mono">{dte.number}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Data Emissão</p>
              <p className="font-black text-slate-800 mt-1">{dte.date}</p>
            </div>
          </div>

          {/* Recipient */}
          <div className="border border-slate-200 rounded-xl p-3 space-y-1">
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Beneficiário / Receptor</p>
            <p className="font-black text-slate-800">{dte.patient_name}</p>
            {dte.patient_email && <p className="text-slate-500">{dte.patient_email}</p>}
            {dte.patient_phone && <p className="text-slate-500">{dte.patient_phone}</p>}
          </div>

          {/* Items table */}
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                <th className="p-2 text-left rounded-tl-lg">Código</th>
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-center">Qtd</th>
                <th className="p-2 text-right">P. Unit.</th>
                <th className="p-2 text-center">IVA %</th>
                <th className="p-2 text-right rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {dte.items.map((it, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-2 font-mono text-slate-500">{it.code}</td>
                  <td className="p-2 font-semibold text-slate-800">{it.description}</td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-right font-mono">{GS(it.unit_price)}</td>
                  <td className="p-2 text-center">{it.iva_rate}%</td>
                  <td className="p-2 text-right font-bold font-mono">{GS(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="space-y-1 text-right min-w-[200px]">
              <div className="flex justify-between gap-8 text-slate-500">
                <span>IVA 5%</span><span className="font-mono">{GS(dte.iva_5)}</span>
              </div>
              <div className="flex justify-between gap-8 text-slate-500">
                <span>IVA 10%</span><span className="font-mono">{GS(dte.iva_10)}</span>
              </div>
              <div className="flex justify-between gap-8 font-black text-slate-900 text-sm border-t border-slate-300 pt-1">
                <span>TOTAL</span><span className="font-mono">{GS(dte.amount)}</span>
              </div>
            </div>
          </div>

          {/* CDC + QR */}
          <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl items-start">
            {/* Simulated QR code as grid */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 grid grid-cols-5 gap-0.5 bg-white p-1 border border-slate-300 rounded">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm"
                    style={{ background: ((i * 7 + i % 3) % 3 === 0) ? '#0f172a' : 'white' }}
                  />
                ))}
              </div>
              <p className="text-[8px] text-center text-slate-400 mt-1">QR DNIT/SIFEN</p>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Código de Control (CDC)</p>
              <p className="font-mono text-[10px] text-slate-700 break-all leading-relaxed">{dte.cdc}</p>
              <p className="text-[9px] text-slate-400 pt-1">Consulte a autenticidade em: <b>ekuatia.set.gov.py</b></p>
            </div>
          </div>

          {/* Signature */}
          <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded-lg text-teal-800">
            <Shield className="w-4 h-4 shrink-0 text-teal-600" />
            <p className="text-[10px] font-medium">Documento assinado digitalmente por <b>PCSC Habilitado — Lei 6822/2021</b>. Certificado: <span className="font-mono">CN=IAMED SA / O=DNIT / C=PY</span></p>
          </div>

          {/* Footer actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { alert('PDF KuDE gerado e pronto para impressão!'); }}
              className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" /> Imprimir KuDE
            </button>
            <button
              onClick={() => { alert('KuDE enviado ao e-mail/WhatsApp do paciente!'); }}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" /> Enviar ao Paciente
            </button>
            <button onClick={onClose} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── XML Viewer Modal ──────────────────────────────────────────────────────────
function XmlModal({ xml, onClose }: { xml: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-950 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <span className="text-teal-400 font-bold text-xs flex items-center gap-2">
            <FileText className="w-4 h-4" /> SIFEN XML — DTE Assinado (Lei 6822/2021)
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
        </div>
        <pre className="p-5 text-slate-300 text-[11px] leading-relaxed overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
          {xml}
        </pre>
        <div className="px-5 pb-4 flex gap-2">
          <button
            onClick={() => { const b = new Blob([xml], { type: 'text/xml' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'dte_sifen.xml'; a.click(); }}
            className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Baixar XML
          </button>
          <button onClick={onClose} className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Gateway Modal ─────────────────────────────────────────────────────────────
function GatewayModal({ dte, onClose, onConfirm }: { dte: Dte; onClose: () => void; onConfirm: (gateway: typeof GATEWAYS[number]) => void }) {
  const [selected, setSelected] = useState<typeof GATEWAYS[number]>('Bancard');

  const gwIcons: Record<string, string> = {
    'Bancard': '🏦',
    'Pagopar': '💳',
    'Tigo Money': '📱',
    'Personal Pay': '📲',
    'Eko Network': '🔗',
    'Transferência': '🏛️',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-4 text-white">
          <p className="text-xs opacity-75 font-bold uppercase tracking-widest">Cobrança / Gateway de Pagamento</p>
          <h3 className="font-black text-lg mt-1">{GS(dte.amount)}</h3>
          <p className="text-xs opacity-80 mt-1">Para: {dte.patient_name} — DTE {dte.number}</p>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 font-semibold">Selecione o meio de pagamento:</p>
          <div className="grid grid-cols-2 gap-2">
            {GATEWAYS.map(gw => (
              <button
                key={gw}
                onClick={() => setSelected(gw)}
                className={`p-3 border-2 rounded-xl text-left transition text-xs font-bold ${selected === gw ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
              >
                <span className="text-xl">{gwIcons[gw]}</span>
                <p className="mt-1">{gw}</p>
              </button>
            ))}
          </div>

          {/* Simulated QR */}
          <div className="flex flex-col items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="w-28 h-28 grid grid-cols-7 gap-0.5 bg-white p-1.5 border border-slate-300 rounded-lg">
              {Array.from({ length: 49 }).map((_, i) => (
                <div key={i} className="rounded-sm" style={{ background: ((i * 11 + i % 5) % 4 === 0) ? '#312e81' : 'white' }} />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">{selected} — Escaneie para pagar</p>
            <p className="font-mono font-black text-slate-900 text-sm">{GS(dte.amount)}</p>
          </div>

          <button
            onClick={() => onConfirm(selected)}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl shadow-md text-xs flex items-center justify-center gap-2 transition"
          >
            <Zap className="w-4 h-4" /> Simular Webhook — Marcar como Pago & Conciliar
          </button>
          <button onClick={onClose} className="w-full py-2 text-slate-500 text-xs font-semibold hover:text-slate-700">Cancelar</button>
        </div>
      </div>
    </div>
  );
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
}: AdminFinanceModuleProps) {
  const { t } = useI18n();

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
  const [adminTab, setAdminTab] = useState<'security' | 'professionals'>('security');

  // ── Professional Form States ────────────────────────────────────────────────────────
  const [profFormOpen, setProfFormOpen] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [profName, setProfName] = useState('');
  const [profRole, setProfRole] = useState<ProfessionalRole>('Médico(a)');
  const [profSpecialty, setProfSpecialty] = useState('');
  const [profCouncil, setProfCouncil] = useState<ProfessionalCouncil>('CRM');
  const [profCouncilNumber, setProfCouncilNumber] = useState('');
  const [profShift, setProfShift] = useState<ProfessionalShift>('Manhã');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profAdmission, setProfAdmission] = useState('');
  const [profStatus, setProfStatus] = useState<'ativo' | 'inativo' | 'férias'>('ativo');

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
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim() || !profSpecialty.trim()) return;
    if (!setProfessionals) return;
    if (editingProfId) {
      setProfessionals(prev => prev.map(p => p.id === editingProfId ? {
        ...p,
        name: profName, role: profRole, specialty: profSpecialty,
        council: profCouncil, councilNumber: profCouncilNumber,
        shift: profShift, email: profEmail, phone: profPhone,
        admissionDate: profAdmission, status: profStatus,
      } : p));
      addAuditLog('Editou Profissional', profName);

      await supabase.from('professionals').update({
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
      }).eq('id', editingProfId);
    } else {
      // Calculate sequential ID: prof_1, prof_2, etc.
      const numericIds = professionals.map(p => {
        const match = p.id.match(/^prof_(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const nextIdNum = Math.max(...numericIds, 0) + 1;
      const newProfId = `prof_${nextIdNum}`;

      const newProf: Professional = {
        id: newProfId,
        name: profName, role: profRole, specialty: profSpecialty,
        council: profCouncil, councilNumber: profCouncilNumber,
        shift: profShift, email: profEmail, phone: profPhone,
        admissionDate: profAdmission || new Date().toISOString().split('T')[0],
        status: profStatus,
        color: profColors[professionals.length % profColors.length],
        permissions: [],
      };
      setProfessionals(prev => [...prev, newProf]);
      addAuditLog('Cadastrou Profissional', profName);

      await supabase.from('professionals').insert({
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
      });
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
    await supabase.from('professionals').update({ status: nextStatus }).eq('id', profId);
  };

  // ── 5. SIFEN/DTE States ──────────────────────────────────────────────────────
  const [timbrado, setTimbrado] = useState('12345678');
  const [establishment, setEstablishment] = useState('001');
  const [expPoint, setExpPoint] = useState('001');
  const [certName] = useState('CN=IAMED SA, O=DNIT, C=PY | Serial: 4F2A9B01');
  const [dteEnv, setDteEnv] = useState<'homologacao' | 'producao'>('producao');

  // New DTE form
  const [dteType, setDteType] = useState<typeof DTE_TYPES[number]>('Fatura Eletrônica');
  const [dtePatient, setDtePatient] = useState('');
  const [dtePatientEmail, setDtePatientEmail] = useState('');
  const [dtePatientPhone, setDtePatientPhone] = useState('');
  const [selectedProcCode, setSelectedProcCode] = useState(PROCEDURES[0].code);
  const [dteQty, setDteQty] = useState(1);
  const [dteItems, setDteItems] = useState<DteItem[]>([]);
  const [dteFormOpen, setDteFormOpen] = useState(false);

  // Modals
  const [kudeTarget, setKudeTarget] = useState<Dte | null>(null);
  const [xmlTarget, setXmlTarget] = useState<string | null>(null);
  const [gatewayTarget, setGatewayTarget] = useState<Dte | null>(null);

  const nextDteSeq = dtes.length + 1;

  const addProcedureItem = () => {
    const proc = PROCEDURES.find(p => p.code === selectedProcCode)!;
    const total = proc.price * dteQty;
    setDteItems(prev => {
      const existing = prev.findIndex(i => i.code === proc.code);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + dteQty, total: (updated[existing].quantity + dteQty) * proc.price };
        return updated;
      }
      return [...prev, { code: proc.code, description: proc.desc, quantity: dteQty, unit_price: proc.price, iva_rate: proc.iva, total }];
    });
  };

  const removeItem = (code: string) => setDteItems(prev => prev.filter(i => i.code !== code));

  const totalAmount = dteItems.reduce((s, i) => s + i.total, 0);
  const totalIva10 = dteItems.filter(i => i.iva_rate === 10).reduce((s, i) => s + Math.round(i.total / 11), 0);
  const totalIva5 = dteItems.filter(i => i.iva_rate === 5).reduce((s, i) => s + Math.round(i.total / 21), 0);

  const handleEmitirDte = async () => {
    if (!dtePatient.trim() || dteItems.length === 0) {
      alert('Preencha o paciente e adicione ao menos um procedimento.');
      return;
    }
    const seq = nextDteSeq;
    const number = `${establishment}-${expPoint}-${String(seq).padStart(7, '0')}`;
    const cdc = generateCdc(timbrado, establishment, expPoint, seq);
    const partial: Partial<Dte> & { items: DteItem[] } = {
      timbrado, establishment, expedition_point: expPoint,
      type: dteType, number, cdc,
      patient_name: dtePatient, patient_email: dtePatientEmail, patient_phone: dtePatientPhone,
      date: new Date().toISOString().split('T')[0],
      amount: totalAmount, iva_5: totalIva5, iva_10: totalIva10,
      environment: dteEnv, items: dteItems,
    };
    const xml = generateXml(partial, certName, dteEnv);
    const newDte: Dte = {
      ...partial as any,
      id: `dte_${Date.now()}`,
      status: 'Enviado',
      payment_status: 'pendente',
      xml_content: xml,
    };

    setDtes?.(prev => [newDte, ...prev]);
    addAuditLog(`Emitiu DTE ${dteType}`, `${dtePatient} — ${number}`);

    // Auto-create financial receipt
    const newPosting: FinancialPosting = {
      id: `fin_dte_${Date.now()}`,
      description: `DTE ${number} — ${dtePatient} (${dteType})`,
      type: 'receita',
      amount: totalAmount,
      category: 'Faturamento DTE / SIFEN',
      date: new Date().toISOString().split('T')[0],
    };
    setFinancePostings(prev => [newPosting, ...prev]);

    // Persist to Supabase
    await supabase.from('dtes').insert({
      id: newDte.id, cdc, type: dteType, number, timbrado,
      establishment, expedition_point: expPoint,
      patient_name: dtePatient, patient_email: dtePatientEmail,
      patient_phone: dtePatientPhone,
      date: newDte.date, amount: totalAmount, iva_5: totalIva5, iva_10: totalIva10,
      environment: dteEnv, status: 'Enviado', payment_status: 'pendente',
      xml_content: xml, items: dteItems,
    }).then(({ error }) => {
      if (error) console.warn('DTE persist error:', error.message);
    });

    setDteItems([]);
    setDtePatient('');
    setDtePatientEmail('');
    setDtePatientPhone('');
    setDteFormOpen(false);
  };

  const handleCancelarDte = (id: string) => {
    setDtes?.(prev => prev.map(d => d.id === id ? { ...d, status: 'Cancelado', payment_status: 'cancelado' } : d));
    addAuditLog('Cancelou DTE', id);
    supabase.from('dtes').update({ status: 'Cancelado', payment_status: 'cancelado' }).eq('id', id);
  };

  const handleConciliar = (dte: Dte, gateway: typeof GATEWAYS[number]) => {
    setDtes?.(prev => prev.map(d => d.id === dte.id ? { ...d, payment_gateway: gateway, payment_status: 'conciliado' } : d));
    setGatewayTarget(null);
    addAuditLog(`Conciliou DTE via ${gateway}`, `${dte.number} — ${GS(dte.amount)}`);
    supabase.from('dtes').update({ payment_gateway: gateway, payment_status: 'conciliado' }).eq('id', dte.id);
  };

  // ── 6. Finance States ──────────────────────────────────────────────────────
  const [finDescription, setFinDescription] = useState('');
  const [finType, setFinType] = useState<'receita' | 'despesa'>('receita');
  const [finCategory, setFinCategory] = useState('Operacional');
  const [finAmount, setFinAmount] = useState(100);

  const handleAddPosting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finDescription.trim()) return;
    const newPosting: FinancialPosting = {
      id: `fin_${Date.now()}`,
      description: finDescription,
      type: finType,
      amount: finAmount,
      category: finCategory,
      date: new Date().toISOString().split('T')[0],
    };
    setFinancePostings(prev => [newPosting, ...prev]);
    addAuditLog(`Lançamento Financeiro (${finType})`, finDescription);
    setFinDescription('');
    await supabase.from('financial_postings').insert({
      id: newPosting.id, description: newPosting.description,
      type: newPosting.type, amount: newPosting.amount,
      category: newPosting.category, date: newPosting.date,
    });
  };

  // ── 7. Stock States ─────────────────────────────────────────────────────────
  const [newStockName, setNewStockName] = useState('');
  const [newStockCat, setNewStockCat] = useState('Medicamentos');
  const [newStockQty, setNewStockQty] = useState(100);
  const [newStockUnit, setNewStockUnit] = useState('frascos');

  const handleAddStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName.trim()) return;
    const newItem: StockItem = {
      id: `stk_${Date.now()}`,
      name: newStockName,
      category: newStockCat,
      quantity: newStockQty,
      minQuantity: 20,
      unit: newStockUnit,
    };
    setStockItems(prev => [...prev, newItem]);
    addAuditLog('Cadastrou Insumo Estoque', newStockName);
    setNewStockName('');
    await supabase.from('stock_items').insert({
      id: newItem.id, name: newItem.name, category: newItem.category,
      quantity: newItem.quantity, min_quantity: newItem.minQuantity, unit: newItem.unit,
    });
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
    await supabase.from('stock_items').update({ quantity: updatedQty }).eq('id', id);
  };

  // ── 14. Admin State ─────────────────────────────────────────────────────────
  const [currentSelectedUser, setCurrentSelectedUser] = useState('Marcela Ramos - Recepcionista');
  const [rbacSelectedProfId, setRbacSelectedProfId] = useState<string>('');

  // Finance calculations
  const totalIncome = financePostings.filter(p => p.type === 'receita').reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = financePostings.filter(p => p.type === 'despesa').reduce((sum, p) => sum + p.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* ─── 15. Convênios e Cobertura ──────────────────────────────────────── */}
      {activeSubmodule === 15 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
              <div><h3 className="font-black text-slate-800 text-sm">Convênios y Cobertura</h3><p className="text-[10px] text-slate-500">Gestión de aseguradoras, IPS, Sanidad, EMP y convenios corporativos</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {insurances.map(ins => (
                <div key={ins.id} className={`p-4 rounded-xl border ${ins.active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'} shadow-xs`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{ins.name}</h4>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${ins.type === 'IPS' ? 'bg-blue-100 text-blue-800' : ins.type === 'EMP' ? 'bg-purple-100 text-purple-800' : ins.type === 'Sanidade Militar' || ins.type === 'Sanidade Policial' ? 'bg-green-100 text-green-800' : ins.type === 'Seguro Privado' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{ins.type}</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <p><span className="font-semibold text-slate-700">RUC:</span> {ins.ruc}</p>
                    <p><span className="font-semibold text-slate-700">Contacto:</span> {ins.contact}</p>
                    <p><span className="font-semibold text-slate-700">Tel:</span> {ins.phone}</p>
                    <p><span className="font-semibold text-slate-700">Web Service:</span> {ins.has_webservice ? <span className="text-emerald-600 font-bold">✓ Activo</span> : <span className="text-slate-400">No</span>}</p>
                    <p><span className="font-semibold text-slate-700">Autorización:</span> {ins.requires_authorization ? <span className="text-amber-600 font-bold">Requerida</span> : <span className="text-emerald-600">No requiere</span>}</p>
                    <p><span className="font-semibold text-slate-700">Techo Cobertura:</span> {ins.coverage_ceiling > 0 ? `Gs. ${ins.coverage_ceiling.toLocaleString('es-PY')}` : 'Sin techo'}</p>
                    <p className="text-[10px] text-slate-400 italic mt-1">{ins.copay_rules}</p>
                    {ins.has_webservice && ins.webservice_url && <p className="text-[9px] font-mono text-slate-400 truncate mt-1">WS: {ins.webservice_url}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Pre-Authorizations */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> Autorizaciones Previas ({preAuthorizations.length})</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left">Paciente</th><th className="px-4 py-2.5 text-left">Procedimiento</th><th className="px-4 py-2.5 text-left">Aseguradora</th>
                  <th className="px-4 py-2.5 text-right">Solicitado</th><th className="px-4 py-2.5 text-right">Autorizado</th><th className="px-4 py-2.5 text-center">Status</th><th className="px-4 py-2.5 text-center">N° Auth</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {preAuthorizations.map(pa => (
                    <tr key={pa.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800">{pa.patient_name}</td>
                      <td className="px-4 py-3 text-slate-600">{pa.procedure_name}</td>
                      <td className="px-4 py-3 text-slate-600">{pa.insurance_name}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{GS(pa.requested_amount)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{pa.authorized_amount > 0 ? GS(pa.authorized_amount) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pa.status === 'autorizada' ? 'bg-emerald-100 text-emerald-800' : pa.status === 'negada' ? 'bg-rose-100 text-rose-800' : pa.status === 'parcial' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{pa.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[10px] text-slate-500">{pa.authorization_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
                    <input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="150000" id="copay-base-input" /></div>
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
              <button onClick={() => {
                const newId = `batch_${Date.now()}`;
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
                <button onClick={() => {
                  const pName = (document.getElementById('elig-patient-input') as HTMLInputElement)?.value;
                  const insId = (document.getElementById('elig-insurance-select') as HTMLSelectElement)?.value;
                  const procCode = (document.getElementById('elig-procedure-select') as HTMLSelectElement)?.value;
                  if (!pName || !insId || !procCode) { alert('Preencha todos os campos'); return; }
                  const ins = insurances.find(i => i.id === insId);
                  const proc = PROCEDURES.find(p => p.code === procCode);
                  if (!ins || !proc) return;
                  addAuditLog('Consultó Elegibilidad', `${pName} - ${ins.name} - ${proc.desc}`);
                  const wsSimulated = Math.random() > 0.3;
                  if (wsSimulated) {
                    const covPct = ins.type === 'IPS' ? 95 : ins.type === 'EMP' ? 100 : 80;
                    const copayAmt = ins.type === 'IPS' ? Math.round(proc.price * 0.05) : ins.type === 'Sanidade Policial' ? Math.round(proc.price * 0.1) : 0;
                    const newElig: EligibilityCheck = { id: `elig_${Date.now()}`, patient_id: '', patient_name: pName, insurance_id: insId, insurance_name: ins.name, procedure_code: procCode, procedure_name: proc.desc, status: 'coberto', coverage_percent: covPct, copay_amount: copayAmt, network: `RED_${ins.type.toUpperCase()}`, authorization_required: ins.requires_authorization, checked_at: new Date().toISOString(), response: `Cobertura vigente. ${ins.requires_authorization ? 'Requiere autorización previa.' : 'Sin autorización requerida.'}` };
                    setEligibilityChecks(prev => [newElig, ...prev]);
                    setEligProp?.(prev => [newElig, ...prev]);
                    alert(`✅ Cobertura Verificada\nPaciente: ${pName}\nConvênio: ${ins.name}\nProcedimiento: ${proc.desc}\nCobertura: ${covPct}%\nCopago: Gs. ${copayAmt.toLocaleString('es-PY')}\nAutorización: ${ins.requires_authorization ? 'Requerida' : 'No requerida'}\nRed: RED_${ins.type.toUpperCase()}\n\nWeb Service: ${ins.webservice_url || 'N/A'}`);
                  } else {
                    const newElig: EligibilityCheck = { id: `elig_${Date.now()}`, patient_id: '', patient_name: pName, insurance_id: insId, insurance_name: ins.name, procedure_code: procCode, procedure_name: proc.desc, status: 'negado', coverage_percent: 0, copay_amount: 0, network: '', authorization_required: false, checked_at: new Date().toISOString(), response: 'Contribuyente no activo. Verificar datos con el convenio.' };
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
                  <input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="Ej: 3500000" id="settle-gross-input" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">% Repasse</label>
                  <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold" id="settle-pct-select">
                    <option value="50">50%</option><option value="55">55%</option><option value="60" selected>60%</option><option value="65">65%</option><option value="70">70%</option>
                  </select>
                </div>
              </div>
              <button onClick={() => {
                const profId = (document.getElementById('settle-prof-select') as HTMLSelectElement)?.value;
                const gross = Number((document.getElementById('settle-gross-input') as HTMLInputElement)?.value) || 0;
                const pct = Number((document.getElementById('settle-pct-select') as HTMLSelectElement)?.value) || 60;
                if (!profId || !gross) { alert('Seleccione profesional e ingrese valor facturado'); return; }
                const prof = professionals.find(p => p.id === profId);
                if (!prof) return;
                const honorario = Math.round(gross * pct / 100);
                const irp = Math.round(honorario * 0.03);
                const iva = Math.round(honorario * 0.12);
                const deductions = irp + iva;
                const neto = honorario - deductions;
                addAuditLog('Simuló Honorarios', `${prof.name}: Bruto Gs. ${gross}, Neto Gs. ${neto}`);
                const newSett: ProfessionalSettlement = { id: `sett_${Date.now()}`, professional_id: profId, professional_name: prof.name, period_start: new Date().toISOString().slice(0, 7) + '-01', period_end: new Date().toISOString().split('T')[0], gross_amount: gross, deductions, net_amount: neto, irp_withheld: irp, iva_withheld: iva, status: 'calculado', dte_ids: [], settlement_date: new Date().toISOString().split('T')[0], payment_date: '' };
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
                      <input list="frn-patients" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="Nombre" id="frn-patient-input" />
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
                      <input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="7500" id="frn-rate-input" value="7500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Monto Local (Gs.)</label>
                    <input type="number" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="450000" id="frn-amount-input" />
                  </div>
                </div>
                <button onClick={() => {
                  const pName = (document.getElementById('frn-patient-input') as HTMLInputElement)?.value;
                  const country = (document.getElementById('frn-country-select') as HTMLSelectElement)?.value;
                  const currency = (document.getElementById('frn-currency-select') as HTMLSelectElement)?.value as ForeignBilling['currency'];
                  const rate = Number((document.getElementById('frn-rate-input') as HTMLInputElement)?.value) || 7500;
                  const amountLocal = Number((document.getElementById('frn-amount-input') as HTMLInputElement)?.value) || 0;
                  if (!pName || !amountLocal) { alert('Preencha nome e montante'); return; }
                  const amountForeign = Math.round(amountLocal / rate * 100) / 100;
                  const countryNames: Record<string, string> = { AR: 'Argentina', BR: 'Brasil', UY: 'Uruguay', CL: 'Chile', US: 'Estados Unidos' };
                  addAuditLog('Emitió Factura Extranjero', `${pName} - ${currency} ${amountForeign}`);
                  const docs = [`Invoice_INV-${Date.now()}.pdf`, `Recibo_Rec-${Date.now()}.pdf`, `Comprobante_Reembolso_${country}.pdf`];
                  const newFrn: ForeignBilling = { id: `frn_${Date.now()}`, patient_id: '', patient_name: pName, country, currency, exchange_rate: rate, amount_local: amountLocal, amount_foreign: amountForeign, documents_generated: docs, status: 'gerado' };
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
        <div className="space-y-5">
          {/* Config bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
                  <Stamp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">{t('sifen_billing', 'app')}</h3>
                  <p className="text-[10px] text-slate-500">Sistema Integrado de Faturação Eletrônica Nacional · Paraguay</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Cert badge */}
                <div className="flex items-center gap-1.5 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-bold">
                  <Shield className="w-3 h-3" /> PCSC Ativo — Lei 6822/2021
                </div>
                {/* Env toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
                  <button
                    onClick={() => setDteEnv('homologacao')}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold transition ${dteEnv === 'homologacao' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    🧪 Homologação
                  </button>
                  <button
                    onClick={() => setDteEnv('producao')}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold transition ${dteEnv === 'producao' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    🚀 Produção
                  </button>
                </div>
              </div>
            </div>

            {/* Timbrado config row */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Timbrado (8 dígitos)</label>
                <input
                  value={timbrado}
                  onChange={e => setTimbrado(e.target.value.slice(0, 8))}
                  maxLength={8}
                  className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Estabelecimento</label>
                <input
                  value={establishment}
                  onChange={e => setEstablishment(e.target.value.slice(0, 3))}
                  maxLength={3}
                  className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
                  placeholder="001"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Ponto Expedição</label>
                <input
                  value={expPoint}
                  onChange={e => setExpPoint(e.target.value.slice(0, 3))}
                  maxLength={3}
                  className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
                  placeholder="001"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Certificado Digital (PCSC)</label>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 truncate">
                  {certName}
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setDteFormOpen(v => !v)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Emitir Novo DTE
                </button>
              </div>
            </div>
          </div>

          {/* Emission Form (collapsible) */}
          {dteFormOpen && (
            <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-600" /> Novo Documento Tributário Eletrônico
                </h4>
                <button onClick={() => setDteFormOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Tipo de DTE</label>
                  <select value={dteType} onChange={e => setDteType(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold">
                    {DTE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Paciente / Receptor</label>
                  <input
                    list="patients-list"
                    value={dtePatient}
                    onChange={e => {
                      setDtePatient(e.target.value);
                      const found = patients.find(p => p.name === e.target.value);
                      if (found) { setDtePatientEmail(found.email || ''); setDtePatientPhone(found.phone || ''); }
                    }}
                    placeholder="Nome do paciente"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <datalist id="patients-list">
                    {patients.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">E-mail do Receptor</label>
                  <input
                    type="email"
                    value={dtePatientEmail}
                    onChange={e => setDtePatientEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Procedure picker */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-3">
                <h5 className="font-bold text-slate-700 text-xs">Adicionar Procedimentos / Serviços</h5>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={selectedProcCode}
                    onChange={e => setSelectedProcCode(e.target.value)}
                    className="flex-1 min-w-[200px] p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  >
                    {PROCEDURES.map(p => <option key={p.code} value={p.code}>{p.code} — {p.desc} ({GS(p.price)}, IVA {p.iva}%)</option>)}
                  </select>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-slate-500 font-semibold">Qtd:</label>
                    <input type="number" min={1} value={dteQty} onChange={e => setDteQty(Number(e.target.value))} className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center" />
                  </div>
                  <button onClick={addProcedureItem} className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>

                {dteItems.length > 0 && (
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase text-[9px] border-b border-slate-100">
                        <th className="pb-1 text-left">Código</th>
                        <th className="pb-1 text-left">Descrição</th>
                        <th className="pb-1 text-center">Qtd</th>
                        <th className="pb-1 text-right">Total</th>
                        <th className="pb-1 text-center">IVA</th>
                        <th className="pb-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dteItems.map(it => (
                        <tr key={it.code} className="border-b border-slate-50">
                          <td className="py-1.5 font-mono text-slate-500">{it.code}</td>
                          <td className="py-1.5 font-semibold text-slate-800">{it.description}</td>
                          <td className="py-1.5 text-center">{it.quantity}</td>
                          <td className="py-1.5 text-right font-mono font-bold">{GS(it.total)}</td>
                          <td className="py-1.5 text-center">{it.iva_rate}%</td>
                          <td className="py-1.5 text-center">
                            <button onClick={() => removeItem(it.code)} className="text-rose-400 hover:text-rose-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-black text-slate-900 border-t border-slate-200">
                        <td colSpan={3} className="pt-2 text-right text-xs">TOTAL:</td>
                        <td className="pt-2 text-right font-mono text-sm text-teal-700">{GS(totalAmount)}</td>
                        <td colSpan={2} className="pt-2 text-[10px] text-slate-400 text-right">IVA5: {GS(totalIva5)} / IVA10: {GS(totalIva10)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              <button
                onClick={handleEmitirDte}
                disabled={dteItems.length === 0 || !dtePatient.trim()}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-40 text-white font-black rounded-xl shadow-md text-xs flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" /> Assinar Digitalmente & Transmitir ao SIFEN
              </button>
            </div>
          )}

          {/* DTE Queue Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                Fila de Transmissão SIFEN — {dtes.length} DTEs
              </h4>
              <button
                className="text-[10px] text-slate-500 hover:text-teal-600 flex items-center gap-1 font-semibold"
                onClick={() => addAuditLog('Recarregou Fila SIFEN', 'Dashboard')}
              >
                <RefreshCw className="w-3 h-3" /> Atualizar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">Número</th>
                    <th className="px-4 py-2.5 text-left">Tipo</th>
                    <th className="px-4 py-2.5 text-left">Receptor</th>
                    <th className="px-4 py-2.5 text-left">Data</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                    <th className="px-4 py-2.5 text-center">Status SIFEN</th>
                    <th className="px-4 py-2.5 text-center">Pagamento</th>
                    <th className="px-4 py-2.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dtes.map(dte => (
                    <tr key={dte.id} className={`hover:bg-slate-50/70 transition ${dte.status === 'Cancelado' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{dte.number}</td>
                      <td className="px-4 py-3 text-slate-600">{dte.type}</td>
                      <td className="px-4 py-3 text-slate-800 font-semibold max-w-[150px] truncate">{dte.patient_name}</td>
                      <td className="px-4 py-3 text-slate-500">{dte.date}</td>
                      <td className="px-4 py-3 text-right font-bold font-mono text-slate-800">{GS(dte.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={statusBadge(dte.status)}>{dte.status}</span>
                        {dte.rejection_reason && (
                          <p className="text-[9px] text-rose-500 mt-0.5 max-w-[120px] leading-tight">{dte.rejection_reason.slice(0, 40)}…</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={payStatusBadge(dte.payment_status)}>{dte.payment_status}</span>
                        {dte.payment_gateway && <p className="text-[9px] text-slate-400 mt-0.5">{dte.payment_gateway}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setKudeTarget(dte)}
                            title="Ver KuDE"
                            className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 hover:text-teal-700 transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setXmlTarget(dte.xml_content || generateXml(dte, certName, dteEnv))}
                            title="Ver XML"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {dte.payment_status === 'pendente' && dte.status !== 'Cancelado' && (
                            <button
                              onClick={() => setGatewayTarget(dte)}
                              title="Cobrar / Conciliar"
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 transition"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {dte.status !== 'Cancelado' && dte.status !== 'Inutilizado' && (
                            <button
                              onClick={() => { if (confirm(`Cancelar DTE ${dte.number}?`)) handleCancelarDte(dte.id); }}
                              title="Cancelar DTE"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dtes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-xs font-semibold">
                        Nenhum DTE emitido ainda. Clique em "Emitir Novo DTE" para começar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Aprovados', value: dtes.filter(d => d.status === 'Aprovado').length, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Enviados', value: dtes.filter(d => d.status === 'Enviado').length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
              { label: 'Rejeitados', value: dtes.filter(d => d.status === 'Rejeitado').length, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
              { label: 'Conciliados', value: dtes.filter(d => d.payment_status === 'conciliado').length, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
            ].map(kpi => (
              <div key={kpi.label} className={`p-4 rounded-xl border ${kpi.bg}`}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
                <p className={`font-black text-3xl mt-1 ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
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
                <form onSubmit={handleAddPosting} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição</label>
                    <input type="text" value={finDescription} onChange={e => setFinDescription(e.target.value)} placeholder="Ex: Compra de insumos" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" required />
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
                      <input type="number" value={finAmount} onChange={e => setFinAmount(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" required />
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
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${br.status === 'conciliado' ? 'bg-emerald-100 text-emerald-800' : br.status === 'divergente' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{br.status}</span>
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
              <h3 className="font-semibold text-slate-800 text-base">Cadastrar Novo Insumo</h3>
            </div>

            <form onSubmit={handleAddStockItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Item / Medicamento</label>
                <input
                  type="text"
                  value={newStockName}
                  onChange={e => setNewStockName(e.target.value)}
                  placeholder="Ex: Paracetamol suspensão 15ml"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
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
                    placeholder="ampolas"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Quantidade em Registro Inicial</label>
                <input
                  type="number"
                  value={newStockQty}
                  onChange={e => setNewStockQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
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
                      <button onClick={() => handleUpdateStockQty(item.id, 50)} className="p-1 px-2.5 bg-slate-800 text-white font-bold rounded" title="Reabastecer 50 unid">+50</button>
                      <button onClick={() => handleUpdateStockQty(item.id, -1)} className="p-1 px-2.5 bg-slate-200 text-slate-700 font-bold rounded" title="Dispensar">-1</button>
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
          <div className="flex gap-2 border-b border-slate-200/80 pb-px">
            <button
              onClick={() => setAdminTab('security')}
              className={`pb-2.5 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                adminTab === 'security'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" /> {t('prof_tab_security', 'app')}
            </button>
            <button
              onClick={() => setAdminTab('professionals')}
              className={`pb-2.5 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                adminTab === 'professionals'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" /> {t('prof_tab_professionals', 'app')}
            </button>
          </div>

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
                        Selecionar Profissional para Editar Permissões
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

                    {/* Perfil de Operador Ativo simulador */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Perfil de Operador Ativo</label>
                      <select
                        value={currentSelectedUser}
                        onChange={e => setCurrentSelectedUser(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold"
                      >
                        <option value="Marcela Ramos - Recepcionista">Marcela Ramos (Recepcionista Principal)</option>
                        <option value="Dra. Amanda Silva - Cardiologista">Dra. Amanda Silva (Diretora Médica)</option>
                        <option value="Dr. Adriano Lima - Gestor">Dr. Adriano Lima (Gestão Administrador)</option>
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
                          Selecione ou cadastre um profissional para gerenciar suas permissões no sistema.
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
                        { key: 'perform_post_finance', label: 'Lançar Receitas / Despesas', desc: 'Adicionar movimentações financeiras ao caixa geral' },
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
                              Selecionar Tudo
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form de Cadastro */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">
                    {editingProfId ? t('save_professional', 'app') : t('register_professional', 'app')}
                  </h3>
                </div>

                <form onSubmit={handleSaveProfessional} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_name', 'app')} *</label>
                    <input
                      type="text"
                      value={profName}
                      onChange={e => setProfName(e.target.value)}
                      placeholder="Ex: Dra. Amanda Silva"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_role', 'app')}</label>
                      <select
                        value={profRole}
                        onChange={e => {
                          const role = e.target.value as ProfessionalRole;
                          setProfRole(role);
                          // Auto set council based on role
                          if (role === 'Médico(a)') setProfCouncil('CRM');
                          else if (role === 'Enfermeiro(a)' || role === 'Técnico(a) de Enfermagem') setProfCouncil('COREN');
                          else if (role === 'Fisioterapeuta') setProfCouncil('CREFITO');
                          else if (role === 'Psicólogo(a)') setProfCouncil('CFP');
                          else if (role === 'Nutricionista') setProfCouncil('CFN');
                          else setProfCouncil('N/A');
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="Médico(a)">Médico(a)</option>
                        <option value="Enfermeiro(a)">Enfermeiro(a)</option>
                        <option value="Fisioterapeuta">Fisioterapeuta</option>
                        <option value="Psicólogo(a)">Psicólogo(a)</option>
                        <option value="Nutricionista">Nutricionista</option>
                        <option value="Técnico(a) de Enfermagem">Técnico(a) de Enfermagem</option>
                        <option value="Administrador(a)">Administrador(a)</option>
                        <option value="Recepcionista">Recepcionista</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_specialty', 'app')} *</label>
                      <input
                        type="text"
                        value={profSpecialty}
                        onChange={e => setProfSpecialty(e.target.value)}
                        placeholder="Ex: Cardiologia"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_council', 'app')}</label>
                      <select
                        value={profCouncil}
                        onChange={e => setProfCouncil(e.target.value as ProfessionalCouncil)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="CRM">CRM</option>
                        <option value="COREN">COREN</option>
                        <option value="CREFITO">CREFITO</option>
                        <option value="CFP">CFP</option>
                        <option value="CFN">CFN</option>
                        <option value="CRO">CRO</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_council_number', 'app')}</label>
                      <input
                        type="text"
                        value={profCouncilNumber}
                        onChange={e => setProfCouncilNumber(e.target.value)}
                        placeholder="Ex: CRM-SP 12345"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_shift', 'app')}</label>
                      <select
                        value={profShift}
                        onChange={e => setProfShift(e.target.value as ProfessionalShift)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-sans"
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                        <option value="Integral">Integral</option>
                        <option value="Plantão 12h">Plantão 12h</option>
                        <option value="Plantão 24h">Plantão 24h</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_admission', 'app')}</label>
                      <input
                        type="date"
                        value={profAdmission}
                        onChange={e => setProfAdmission(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_email', 'app')}</label>
                      <input
                        type="email"
                        value={profEmail}
                        onChange={e => setProfEmail(e.target.value)}
                        placeholder="email@iamed.com.br"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_phone', 'app')}</label>
                      <input
                        type="text"
                        value={profPhone}
                        onChange={e => setProfPhone(e.target.value)}
                        placeholder="+55 11 99999-9999"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('professional_status', 'app')}</label>
                    <select
                      value={profStatus}
                      onChange={e => setProfStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="ativo">🟢 {t('prof_status_active', 'app')}</option>
                      <option value="inativo">🔴 {t('prof_status_inactive', 'app')}</option>
                      <option value="férias">🟡 {t('prof_status_vacation', 'app')}</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm text-xs cursor-pointer transition text-center"
                    >
                      {t('save_professional', 'app')}
                    </button>
                    {editingProfId && (
                      <button
                        type="button"
                        onClick={resetProfForm}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer transition"
                      >
                        {t('btn_cancel', 'app')}
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Lista de Profissionais */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-slate-800 text-base">{t('professionals_list', 'app')}</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                    {professionals.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {professionals.map(prof => (
                    <div
                      key={prof.id}
                      className={`p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs transition-all ${
                        prof.status === 'inativo' ? 'opacity-65' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm ${prof.color || 'bg-slate-500'}`}>
                          {prof.name.split(' ').map(n => n[0]).filter((_, i) => i < 2).join('').toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-800 text-sm">{prof.name}</p>
                            <span className={`text-[10px] py-0.5 px-2 rounded-full border font-bold ${
                              prof.role === 'Médico(a)'
                                ? 'bg-teal-50 text-teal-700 border-teal-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {prof.role} — {prof.specialty}
                            </span>
                            {prof.councilNumber && (
                              <span className="text-[9px] bg-slate-200 text-slate-600 py-0.5 px-1.5 rounded font-mono font-bold">
                                {prof.council}: {prof.councilNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-slate-500 font-medium flex-wrap">
                            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {prof.shift}</span>
                            {prof.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {prof.email}</span>}
                            {prof.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {prof.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          prof.status === 'ativo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : prof.status === 'férias'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {prof.status === 'ativo' ? t('prof_status_active', 'app') : prof.status === 'férias' ? t('prof_status_vacation', 'app') : t('prof_status_inactive', 'app')}
                        </span>
                        
                        <button
                          onClick={() => handleEditProf(prof)}
                          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleProfStatus(prof.id)}
                          className={`p-2 rounded-lg transition cursor-pointer ${
                            prof.status === 'ativo'
                              ? 'hover:bg-rose-50 text-rose-500'
                              : 'hover:bg-emerald-50 text-emerald-500'
                          }`}
                          title={prof.status === 'ativo' ? 'Inativar' : 'Ativar'}
                        >
                          {prof.status === 'ativo' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {professionals.length === 0 && (
                    <div className="text-center py-10 text-slate-400 font-semibold">
                      {t('no_professionals', 'app')}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
