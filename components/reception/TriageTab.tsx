'use client';

import React, { useState } from 'react';
import { Activity, AlertCircle, Check, Heart, Stethoscope } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Patient, ReceptionModuleProps, PRIORITY_BADGE, STATUS_BADGE } from './ReceptionContext';
import I18nDatePicker from '@/components/I18nDatePicker';

interface TriageTabProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  addAuditLog: (action: string, target: string) => void;
}

type TriageColor = 'blue' | 'green' | 'yellow' | 'orange' | 'red';

const TRIAGE_COLORS: Record<TriageColor, { bg: string; text: string; label: string; priority: 'normal' | 'preferencial' | 'emergência' }> = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Não urgente (até 4h)', priority: 'normal' },
  green: { bg: 'bg-emerald-500', text: 'text-emerald-700', label: 'Pouco urgente (até 2h)', priority: 'normal' },
  yellow: { bg: 'bg-amber-500', text: 'text-amber-700', label: 'Urgente (até 1h)', priority: 'preferencial' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-700', label: 'Muito urgente (até 30min)', priority: 'emergência' },
  red: { bg: 'bg-rose-500', text: 'text-rose-700', label: 'Emergência (imediato)', priority: 'emergência' },
};

export function TriageTab({ patients, setPatients, addAuditLog }: TriageTabProps) {
  const { t } = useI18n();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [triageColor, setTriageColor] = useState<TriageColor>('green');
  const [vitalSigns, setVitalSigns] = useState({
    bp: '',
    temp: '',
    spo2: '',
    hr: '',
    rr: '',
  });
  const [symptoms, setSymptoms] = useState('');
  const [preliminaryDiagnosis, setPreliminaryDiagnosis] = useState('');

  const waitingPatients = patients.filter((p) => p.status === 'aguardando');

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setTriageColor('green');
    setVitalSigns({ bp: '', temp: '', spo2: '', hr: '', rr: '' });
    setSymptoms('');
    setPreliminaryDiagnosis('');
  };

  const handleSaveTriage = () => {
    if (!selectedPatient) return;
    const triageInfo = TRIAGE_COLORS[triageColor];

    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedPatient.id
          ? {
              ...p,
              priority: triageInfo.priority,
              status: 'triado',
            }
          : p
      )
    );

    addAuditLog(t('rcpt_audit_triaged', 'app'), `${selectedPatient.name} → ${triageInfo.label}`);
    setSelectedPatient(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Waiting List */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-rose-50">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" /> Aguardando Triagem ({waitingPatients.length})
          </h3>
        </div>
        <div className="space-y-2 p-3 max-h-[600px] overflow-y-auto">
          {waitingPatients.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-semibold text-xs">
              Nenhum paciente aguardando triagem.
            </div>
          ) : (
            waitingPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  selectedPatient?.id === p.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-800 text-sm">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.document_number || 'Sem doc.'}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${PRIORITY_BADGE[p.priority || 'normal']}`}>
                    {p.priority}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Triage Form */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
        {selectedPatient ? (
          <>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 text-sm">{selectedPatient.name}</h3>
                <p className="text-[10px] text-slate-500">Triagem · Classificação de Risco</p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${STATUS_BADGE[selectedPatient.status || 'aguardando']}`}>
                {selectedPatient.status}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Triage Color Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wider">
                  Classificação de Risco (Manchester)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(TRIAGE_COLORS) as TriageColor[]).map((color) => {
                    const info = TRIAGE_COLORS[color];
                    return (
                      <button
                        key={color}
                        onClick={() => setTriageColor(color)}
                        className={`p-3 rounded-xl border-2 transition ${
                          triageColor === color
                            ? `${info.bg} text-white border-slate-900 shadow-md`
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-8 h-8 mx-auto rounded-full ${info.bg}`} />
                        <p className="text-[10px] font-bold uppercase mt-1.5 text-center">{color}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  {TRIAGE_COLORS[triageColor].label}
                </p>
              </div>

              {/* Vital Signs */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wider">
                  <Heart className="w-3 h-3 inline mr-1" /> Sinais Vitais
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">PA (mmHg)</label>
                    <input
                      type="text"
                      value={vitalSigns.bp}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, bp: e.target.value })}
                      placeholder="120/80"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Temp (°C)</label>
                    <input
                      type="text"
                      value={vitalSigns.temp}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, temp: e.target.value })}
                      placeholder="36.5"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">SpO2 (%)</label>
                    <input
                      type="text"
                      value={vitalSigns.spo2}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, spo2: e.target.value })}
                      placeholder="98"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">FC (bpm)</label>
                    <input
                      type="text"
                      value={vitalSigns.hr}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, hr: e.target.value })}
                      placeholder="75"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">FR (irpm)</label>
                    <input
                      type="text"
                      value={vitalSigns.rr}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, rr: e.target.value })}
                      placeholder="16"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
                  Sintomas / Queixa Principal
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  placeholder="Ex: Dor torácica há 2 horas, sudorese..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
                  <Stethoscope className="w-3 h-3 inline mr-1" /> Hipótese Diagnóstica Preliminar
                </label>
                <input
                  type="text"
                  value={preliminaryDiagnosis}
                  onChange={(e) => setPreliminaryDiagnosis(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  placeholder="Ex: Síndrome Coronariana Aguda (CID-10 I20)"
                />
              </div>

              <button
                onClick={handleSaveTriage}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black rounded-xl shadow-md text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Confirmar Triagem
              </button>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-semibold text-sm mt-3">Selecione um paciente da lista ao lado</p>
            <p className="text-[10px] mt-1">A triagem classifica o paciente por risco (cor)</p>
          </div>
        )}
      </div>
    </div>
  );
}
