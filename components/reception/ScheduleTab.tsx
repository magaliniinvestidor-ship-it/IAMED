'use client';

import React, { useState, useMemo } from 'react';
import { CalendarDays, Clock, User, Stethoscope, Check, AlertTriangle, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Appointment, Patient, Professional, STATUS_BADGE } from './ReceptionContext';

interface ScheduleTabProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  patients: Patient[];
  professionals: Professional[];
  addAuditLog: (action: string, target: string) => void;
}

const APPOINTMENT_STATUSES = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'em sala de espera', label: 'Em sala de espera' },
  { value: 'em atendimento', label: 'Em atendimento' },
  { value: 'atendido', label: 'Atendido' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'ausente', label: 'Ausente' },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export function ScheduleTab({
  appointments,
  setAppointments,
  patients,
  professionals,
  addAuditLog,
}: ScheduleTabProps) {
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDoctor, setFilterDoctor] = useState<string>('todos');

  const dailyAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate)
      .filter((a) => filterDoctor === 'todos' || a.doctorName === filterDoctor)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, filterDoctor]);

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      addAuditLog(t('rcpt_audit_appt_status', 'app').replace('{name}', apt.patientName), status);
    }
  };

  const groupByHour = (apts: Appointment[]) => {
    const groups: Record<string, Appointment[]> = {};
    apts.forEach((a) => {
      const hour = a.time.split(':')[0];
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(a);
    });
    return groups;
  };

  const grouped = groupByHour(dailyAppointments);
  const totalSlots = TIME_SLOTS.length;

  const stats = useMemo(() => {
    const total = dailyAppointments.length;
    const attended = dailyAppointments.filter((a) => a.status === 'atendido').length;
    const waiting = dailyAppointments.filter((a) => a.status === 'em sala de espera').length;
    const absent = dailyAppointments.filter((a) => a.status === 'ausente' || a.status === 'cancelado').length;
    return { total, attended, waiting, absent };
  }, [dailyAppointments]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
              <CalendarDays className="w-3 h-3 inline mr-1" /> Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
              <Stethoscope className="w-3 h-3 inline mr-1" /> Profissional
            </label>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="todos">Todos</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="text-center bg-blue-50 rounded-lg p-2">
              <p className="text-[9px] font-bold uppercase text-blue-700">Total</p>
              <p className="text-lg font-black text-blue-800">{stats.total}</p>
            </div>
            <div className="text-center bg-emerald-50 rounded-lg p-2">
              <p className="text-[9px] font-bold uppercase text-emerald-700">Atendidos</p>
              <p className="text-lg font-black text-emerald-800">{stats.attended}</p>
            </div>
            <div className="text-center bg-amber-50 rounded-lg p-2">
              <p className="text-[9px] font-bold uppercase text-amber-700">Esperando</p>
              <p className="text-lg font-black text-amber-800">{stats.waiting}</p>
            </div>
            <div className="text-center bg-rose-50 rounded-lg p-2">
              <p className="text-[9px] font-bold uppercase text-rose-700">Ausentes</p>
              <p className="text-lg font-black text-rose-800">{stats.absent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600" />
          <h3 className="font-black text-slate-800 text-sm">
            Agenda do Dia ({dailyAppointments.length} consultas)
          </h3>
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {TIME_SLOTS.map((slot) => {
            const hour = slot.split(':')[0];
            const apts = grouped[hour] || [];
            return (
              <div key={slot} className="flex border-b border-slate-100 min-h-[60px]">
                <div className="w-20 flex-shrink-0 bg-slate-50 border-r border-slate-200 p-2 flex items-start justify-end">
                  <span className="text-xs font-mono font-bold text-slate-500">{slot}</span>
                </div>
                <div className="flex-1 p-2 space-y-1">
                  {apts.length === 0 ? (
                    <div className="text-[10px] text-slate-300 italic py-1">— livre —</div>
                  ) : (
                    apts.map((apt) => {
                      const statusClass = STATUS_BADGE[apt.status] || '';
                      return (
                        <div
                          key={apt.id}
                          className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-teal-700 text-sm w-12">{apt.time}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <p className="font-bold text-slate-800 text-sm truncate">{apt.patientName}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Stethoscope className="w-3 h-3" /> {apt.doctorName}
                              </span>
                              {apt.specialty && <span>· {apt.specialty}</span>}
                              {apt.modality && <span>· {apt.modality}</span>}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${statusClass}`}>
                            {apt.status}
                          </span>
                          <select
                            value={apt.status}
                            onChange={(e) => updateAppointmentStatus(apt.id, e.target.value as Appointment['status'])}
                            className="px-2 py-1 text-[10px] bg-white border border-slate-200 rounded"
                          >
                            {APPOINTMENT_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {dailyAppointments.length === 0 && (
        <div className="text-center py-8 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-slate-400 font-semibold text-sm">Nenhuma consulta agendada para esta data.</p>
        </div>
      )}
    </div>
  );
}
