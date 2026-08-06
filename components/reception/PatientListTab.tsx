'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Phone, Mail, AlertTriangle, UserPlus, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Patient, PRIORITY_BADGE, STATUS_BADGE, PRIORITY_LABELS } from './ReceptionContext';

interface PatientListTabProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onAdmitNew: () => void;
}

export function PatientListTab({ patients, onSelectPatient, onAdmitNew }: PatientListTabProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('todos');

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (filterPriority !== 'todos' && p.priority !== filterPriority) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(s) ||
          p.email.toLowerCase().includes(s) ||
          p.phone.toLowerCase().includes(s) ||
          (p.document_number || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [patients, search, filterPriority]);

  const priorities = ['todos', 'normal', 'preferencial', 'emergência'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, telefone ou CI..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <button
            onClick={onAdmitNew}
            className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" /> Nova Admissão
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Prioridade:</span>
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                filterPriority === p
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-500">
            <b>{filtered.length}</b> de {patients.length}
          </span>
        </div>
      </div>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((patient) => {
          const priorityClass = PRIORITY_BADGE[patient.priority || 'normal'] || '';
          const statusClass = STATUS_BADGE[patient.status || 'agendado'] || '';

          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className={`p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300 transition cursor-pointer group ${
                patient.priority === 'emergência' ? 'ring-1 ring-rose-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                    {patient.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{patient.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {patient.document_type ? `${patient.document_type}: ` : ''}{patient.document_number || 'Sem documento'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition" />
              </div>

              <div className="space-y-1 text-[11px] text-slate-600">
                {patient.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                  </p>
                )}
                {patient.email && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-400" /> {patient.email}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-100">
                {patient.priority === 'emergência' && (
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                )}
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${priorityClass}`}>
                  {patient.priority}
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${statusClass}`}>
                  {patient.status}
                </span>
                {patient.blood_type && patient.blood_type !== 'Não Informado' && (
                  <span className="ml-auto text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    {patient.blood_type}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-slate-400 font-semibold text-sm">Nenhum paciente encontrado.</p>
          <button
            onClick={onAdmitNew}
            className="mt-3 text-teal-600 hover:text-teal-700 font-bold text-xs"
          >
            Cadastrar novo paciente →
          </button>
        </div>
      )}
    </div>
  );
}
