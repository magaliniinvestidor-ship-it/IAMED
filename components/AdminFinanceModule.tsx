'use client';

import React, { useState } from 'react';
import { FinancialPosting, StockItem, AuditLog, Dte, DteItem, Patient, Professional, ProfessionalRole, ProfessionalCouncil, ProfessionalShift } from '@/lib/mockData';
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
  activeSubmodule: number; // 5 = SIFEN, 6 = Financeiro, 7 = Estoque, 14 = Adm/Segurança
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
}: AdminFinanceModuleProps) {
  const { t } = useI18n();

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

  const handleSaveProfessional = (e: React.FormEvent) => {
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
    } else {
      const newProf: Professional = {
        id: `prof_${Date.now()}`,
        name: profName, role: profRole, specialty: profSpecialty,
        council: profCouncil, councilNumber: profCouncilNumber,
        shift: profShift, email: profEmail, phone: profPhone,
        admissionDate: profAdmission || new Date().toISOString().split('T')[0],
        status: profStatus,
        color: profColors[professionals.length % profColors.length],
      };
      setProfessionals(prev => [...prev, newProf]);
      addAuditLog('Cadastrou Profissional', profName);
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

  const handleToggleProfStatus = (profId: string) => {
    if (!setProfessionals) return;
    setProfessionals(prev => prev.map(p => {
      if (p.id !== profId) return p;
      const nextStatus = p.status === 'ativo' ? 'inativo' : 'ativo';
      addAuditLog('Alterou Status', `${p.name} → ${nextStatus}`);
      return { ...p, status: nextStatus };
    }));
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

  // Finance calculations
  const totalIncome = financePostings.filter(p => p.type === 'receita').reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = financePostings.filter(p => p.type === 'despesa').reduce((sum, p) => sum + p.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800 text-base">Registrar Fluxo de Caixa</h3>
            </div>

            <form onSubmit={handleAddPosting} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Lançamento</label>
                <input
                  type="text"
                  value={finDescription}
                  onChange={e => setFinDescription(e.target.value)}
                  placeholder="Ex: Compra de luvas estéreis"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Fluxo</label>
                  <select
                    value={finType}
                    onChange={e => setFinType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="receita" className="text-emerald-700">🟢 RECEITA</option>
                    <option value="despesa" className="text-rose-700">🔴 DESPESA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Valor (Gs.)</label>
                  <input
                    type="number"
                    value={finAmount}
                    onChange={e => setFinAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria Contábil</label>
                <select
                  value={finCategory}
                  onChange={e => setFinCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Consultas">Consultas &amp; Atendimentos</option>
                  <option value="Insumos Médicos">Insumos e Farmácia</option>
                  <option value="Operacional">Custos Operacionais</option>
                  <option value="Equipamentos">Equipamentos &amp; PACS</option>
                  <option value="Infraestrutura">Local e Internet</option>
                  <option value="Faturamento DTE / SIFEN">Faturamento DTE / SIFEN</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-sm">
                Injetar Lançamento Contábil
              </button>
            </form>
          </div>

          {/* Accounting visuals */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Dashboard Contábil IAMED</h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                <p className="text-emerald-600 font-bold uppercase tracking-wider text-[9px]">Faturamento Total</p>
                <p className="text-emerald-800 font-extrabold text-base pt-1">Gs. {totalIncome.toLocaleString('es-PY')}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs">
                <p className="text-rose-600 font-bold uppercase tracking-wider text-[9px]">Custos Totais</p>
                <p className="text-rose-800 font-extrabold text-base pt-1">Gs. {totalExpense.toLocaleString('es-PY')}</p>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 text-xs text-teal-800">
                <p className="text-teal-700 font-bold uppercase tracking-wider text-[9px]">Margem Líquida</p>
                <p className={`font-extrabold text-base pt-1 ${balance >= 0 ? 'text-teal-800' : 'text-rose-700'}`}>Gs. {balance.toLocaleString('es-PY')}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
              <h5 className="font-bold text-slate-700 text-xs">Participação Orçamentária Visual</h5>
              <div className="h-5 bg-slate-200 rounded-full flex overflow-hidden">
                <div
                  style={{ width: `${totalIncome > 0 ? (totalIncome / (totalIncome + totalExpense)) * 100 : 50}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title="Receitas"
                />
                <div
                  style={{ width: `${totalExpense > 0 ? (totalExpense / (totalIncome + totalExpense)) * 100 : 50}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title="Despesas"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Receitas ({Math.round(totalIncome > 0 ? (totalIncome / (totalIncome + totalExpense)) * 100 : 50)}%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Despesas ({Math.round(totalExpense > 0 ? (totalExpense / (totalIncome + totalExpense)) * 100 : 50)}%)</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Settings className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800 text-base">Controle de Segurança &amp; RBAC</h3>
                </div>

                <div className="space-y-4 text-xs font-sans">
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

                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-teal-900 leading-relaxed">
                    <span className="flex items-center gap-1.5 font-bold"><ShieldCheck className="w-4 h-4 text-teal-700" /> Encriptação de Logs Ativada</span>
                    <p className="text-xs text-teal-800">
                      Todo acesso à base de dados clínica, alterações em prontuários eletrônicos (HCE) ou emissões de faturamentos suspensos em lote são auditados com IP e operadora de acordo com as leis LGPD vigentes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 text-slate-100 lg:col-span-2 flex flex-col font-mono text-xs shadow-md">
                <div className="flex items-center gap-2 font-bold text-teal-400 border-b border-slate-800 pb-3 mb-3 shrink-0">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                  TERMINAL DE AUDITORIA DE SEGURANÇA GERAL (LGPD)
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto flex-1 pr-1">
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
