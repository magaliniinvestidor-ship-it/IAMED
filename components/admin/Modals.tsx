'use client';

import React, { useState } from 'react';
import { FileText, X, Download, Shield, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Dte, DteItem, GATEWAYS, Gateway, STATUS_BADGE } from './AdminContext';

export function KudeModal({ dte, onClose }: { dte: Dte; onClose: () => void }) {
  const { t } = useI18n();
  const fmt = (n?: number) =>
    n == null
      ? 'Gs. 0'
      : `Gs. ${n.toLocaleString('es-PY')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white p-4 flex justify-between items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-75">
              KuDE — Representação Gráfica do DTE
            </p>
            <h2 className="font-black text-lg mt-0.5">IAMED — Sistema de Gestão Médica</h2>
            <p className="text-xs opacity-80 mt-1">RUC Emissor: 80069563-1 | Encarnación, Paraguay</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Timbrado Nº</p>
            <p className="font-black text-xl tracking-widest">{dte.timbrado}</p>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs font-sans">
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

          <div className="border border-slate-200 rounded-xl p-3 space-y-1">
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">
              Beneficiário / Receptor
            </p>
            <p className="font-black text-slate-800">{dte.patient_name}</p>
            {dte.patient_email && <p className="text-slate-500">{dte.patient_email}</p>}
            {dte.patient_phone && <p className="text-slate-500">{dte.patient_phone}</p>}
          </div>

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
              {(dte.items || []).map((it, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-2 font-mono text-slate-500">{it.code}</td>
                  <td className="p-2 font-semibold text-slate-800">{it.description}</td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-right font-mono">{fmt(it.unit_price)}</td>
                  <td className="p-2 text-center">{it.iva_rate}%</td>
                  <td className="p-2 text-right font-bold font-mono">{fmt(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="space-y-1 text-right min-w-[200px]">
              <div className="flex justify-between gap-8 text-slate-500">
                <span>IVA 5%</span>
                <span className="font-mono">{fmt(dte.iva_5)}</span>
              </div>
              <div className="flex justify-between gap-8 text-slate-500">
                <span>IVA 10%</span>
                <span className="font-mono">{fmt(dte.iva_10)}</span>
              </div>
              <div className="flex justify-between gap-8 font-black text-slate-900 text-sm border-t border-slate-300 pt-1">
                <span>TOTAL</span>
                <span className="font-mono">{fmt(dte.amount)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl items-start">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 grid grid-cols-5 gap-0.5 bg-white p-1 border border-slate-300 rounded">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm"
                    style={{ background: ((i * 7 + (i % 3)) % 3 === 0) ? '#0f172a' : 'white' }}
                  />
                ))}
              </div>
              <p className="text-[8px] text-center text-slate-400 mt-1">QR DNIT/SIFEN</p>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">
                Código de Control (CDC)
              </p>
              <p className="font-mono text-[10px] text-slate-700 break-all leading-relaxed">
                {dte.cdc}
              </p>
              <p className="text-[9px] text-slate-400 pt-1">
                Consulte a autenticidade em: <b>ekuatia.set.gov.py</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded-lg text-teal-800">
            <Shield className="w-4 h-4 shrink-0 text-teal-600" />
            <p className="text-[10px] font-medium">
              Documento assinado digitalmente por <b>PCSC Habilitado — Lei 6822/2021</b>.
              Certificado: <span className="font-mono">CN=IAMED SA / O=DNIT / C=PY</span>
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  alert(t('admin_alert_kude_printed', 'app'));
                }
              }}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
            >
              Imprimir KuDE
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  alert(t('admin_alert_kude_sent', 'app'));
                }
              }}
              className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
            >
              Enviar ao Paciente
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function XmlModal({ xml, onClose }: { xml: string; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <span className="text-teal-400 font-bold text-xs flex items-center gap-2">
            <FileText className="w-4 h-4" /> SIFEN XML — DTE Assinado (Lei 6822/2021)
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <pre className="p-5 text-slate-300 text-[11px] leading-relaxed overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
          {xml}
        </pre>
        <div className="px-5 pb-4 flex gap-2">
          <button
            onClick={() => {
              if (typeof window === 'undefined') return;
              const b = new Blob([xml], { type: 'text/xml' });
              const u = URL.createObjectURL(b);
              const a = document.createElement('a');
              a.href = u;
              a.download = 'dte_sifen.xml';
              a.click();
            }}
            className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> {t('fin_btn_download_xml', 'app')}
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
          >
            {t('fin_btn_close', 'app')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GatewayModal({
  dte,
  onClose,
  onConfirm,
}: {
  dte: Dte;
  onClose: () => void;
  onConfirm: (gateway: Gateway) => void;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Gateway>('Bancard');

  const gwIcons: Record<Gateway, string> = {
    'Bancard': '🏦',
    'Pagopar': '💳',
    'Tigo Money': '📱',
    'Personal Pay': '📲',
    'Eko Network': '🔗',
    'Transferência': '🏛️',
  };

  const fmt = (n?: number) =>
    n == null ? 'Gs. 0' : `Gs. ${n.toLocaleString('es-PY')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-4 text-white">
          <p className="text-xs opacity-75 font-bold uppercase tracking-widest">
            Cobrança / Gateway de Pagamento
          </p>
          <h3 className="font-black text-lg mt-1">{fmt(dte.amount)}</h3>
          <p className="text-xs opacity-80 mt-1">
            Para: {dte.patient_name} — DTE {dte.number}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 font-semibold">
            {t('fin_select_payment_method', 'app')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GATEWAYS.map((gw) => (
              <button
                key={gw}
                onClick={() => setSelected(gw)}
                className={`p-3 border-2 rounded-xl text-left transition text-xs font-bold ${
                  selected === gw
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-xl mr-2">{gwIcons[gw]}</span>
                {gw}
              </button>
            ))}
          </div>

          <button
            onClick={() => onConfirm(selected)}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl shadow-md text-xs flex items-center justify-center gap-2 transition"
          >
            <Zap className="w-4 h-4" /> Simular Webhook — Marcar como Pago & Conciliar
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-slate-500 text-xs font-semibold hover:text-slate-700"
          >
            {t('fin_btn_cancel', 'app')}
          </button>
        </div>
      </div>
    </div>
  );
}
