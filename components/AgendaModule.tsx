'use client';

import React, { useState, useEffect, useRef, useReducer, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Patient, Appointment, Professional, AuditLog } from '@/lib/mockData';
import { 
  CalendarDays, Smartphone, ClipboardList, PhoneCall, Plus, 
  Trash2, AlertTriangle, CheckCircle, Clock, Check, RefreshCw, 
  ChevronLeft, ChevronRight, Sliders, Calendar, Play, Pause, 
  User, Send, ShieldAlert, PhoneOff, ArrowRightLeft, Star, HeartPulse, Search,
  Lock, AlertTriangle as AlertTriangleIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PermissionGate, WithPermissions } from '@/components/ui/PermissionGate';

interface AgendaModuleProps {
  patients: Patient[];
  appointments: Appointment[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  addAuditLog: (action: string, target: string) => void;
  professionals: Professional[];
  activeRole?: string;
  activeOperator?: string;
  userPermissions?: string[];
}

// -------------------------------------------------------------
// TYPES & MOCK STRUCTURES FOR EXTRA DETAILS
// -------------------------------------------------------------
interface BlockedSlot {
  id: string;
  doctor_name: string | null; // null = all
  branch: string | null;      // null = all
  start_date: string;
  end_date: string;
  start_time: string | null;  // null = all day
  end_time: string | null;
  reason: 'feriado' | 'férias' | 'capacitação' | 'emergência';
  description: string;
}

interface WaitlistEntry {
  id: string;
  patient_id: string;
  patient_name: string;
  phone: string;
  specialty: string;
  doctor_name: string | null;
  priority_criteria: 'arrival' | 'urgency' | 'coverage' | 'seniority';
  priority_score: number;
  preferred_days: string[]; // e.g., ['Segunda', 'Quarta']
  preferred_hours: string[]; // e.g., ['Manhã', 'Tarde']
  status: 'aguardando' | 'notificado' | 'alocado' | 'cancelado';
  created_at: string;
}

interface WhatsappReminder {
  id: string;
  appointment_id: string;
  patient_name: string;
  patient_phone: string;
  message_template: string;
  language: 'es' | 'gn' | 'pt';
  status: 'scheduled' | 'sent' | 'delivered' | 'read' | 'confirmed' | 'cancelled' | 'rescheduled';
  scheduled_for: string;
  sent_at: string | null;
  response_received: string | null;
}

interface CallLog {
  id: string;
  operator_name: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  type: 'inbound' | 'outbound';
  reason: 'agendamento' | 'cancelamento' | 'remarcação' | 'dúvida' | 'reclamação' | 'financeiro' | 'outros';
  notes: string;
  duration_seconds: number;
  recording_url: string | null;
  created_at: string;
}

// PRE-DEFINED PARAGUAYAN HOLIDAYS (Itapúa & National)
const PARAGUAY_HOLIDAYS = [
  { date: '01-01', name: 'Año Nuevo (Nacional)' },
  { date: '03-01', name: 'Día de los Héroes (Nacional)' },
  { date: '03-25', name: 'Aniversario de Encarnación (Itapúa Local)' },
  { date: '05-01', name: 'Día del Trabajador (Nacional)' },
  { date: '05-14', name: 'Día de la Independencia (Nacional)' },
  { date: '05-15', name: 'Día de la Independencia (Nacional)' },
  { date: '06-11', name: 'Día de la Bandera de Itapúa (Itapúa Local)' },
  { date: '06-12', name: 'Día de la Paz del Chaco (Nacional)' },
  { date: '08-15', name: 'Día de la Fundación de Asunción (Nacional)' },
  { date: '09-29', name: 'Día de la Victoria de Boquerón (Nacional)' },
  { date: '12-08', name: 'Día de la Virgen de Caacupé (Nacional)' },
];

const AgendaModuleContent = ({
  patients,
  appointments,
  setPatients,
  setAppointments,
  addAuditLog,
  professionals,
  activeRole = 'Recepcionista',
  activeOperator = 'Operador',
}: AgendaModuleProps) => {
  const { locale, t } = useI18n();

  // Abas do Módulo
  const [activeTab, setActiveTab] = useState<'calendar' | 'whatsapp' | 'waitlist' | 'callcenter'>('calendar');

  // -------------------------------------------------------------
  // STATES
  // -------------------------------------------------------------
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  const [calendarGroupBy, setCalendarGroupBy] = useState<'doctor' | 'room' | 'specialty' | 'branch'>('doctor');
  
  // Set default current date to '2026-06-29' (to match mock environments and current local time in context)
  const [selectedDate, setSelectedDate] = useState('2026-06-29');

  // Drag & drop
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // Blockage modal
  const [showBlockageModal, setShowBlockageModal] = useState(false);
  const [blockDoctor, setBlockDoctor] = useState<string>('');
  const [blockBranch, setBlockBranch] = useState<string>('');
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState<'feriado' | 'férias' | 'capacitação' | 'emergência'>('feriado');
  const [blockDesc, setBlockDesc] = useState('');

  // WhatsApp Reminders
  const [reminders, setReminders] = useState<WhatsappReminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    appointment_id: '',
    specialty: '',
    doctor_name: '',
    scheduled_for: '',
    language: 'es' as 'es' | 'gn' | 'pt',
    message_template: '',
  });

  // Waitlist
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({
    patient_id: '',
    patient_name: '',
    phone: '',
    specialty: '',
    doctor_name: '',
    priority_criteria: 'arrival' as 'arrival' | 'urgency' | 'coverage' | 'seniority',
  });

  // Call Center
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callForm, setCallForm] = useState({
    operator_name: '',
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    type: 'outbound' as 'inbound' | 'outbound',
    reason: 'agendamento' as 'agendamento' | 'cancelamento' | 'remarcação' | 'dúvida' | 'reclamação' | 'financeiro' | 'outros',
    notes: '',
    duration_seconds: 0,
  });

  // Blocked slots
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  // -------------------------------------------------------------
  // EFFECTS & LOADERS
  // -------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        if (supabase) {
          const [blocked, whatsapp, wait, calls] = await Promise.all([
            supabase.from('blocked_slots').select('*').order('start_date', { ascending: true }),
            supabase.from('whatsapp_reminders').select('*').order('scheduled_for', { ascending: true }),
            supabase.from('waiting_list').select('*').order('priority_score', { ascending: false }),
            supabase.from('call_center_logs').select('*').order('created_at', { ascending: false }),
          ]);
          if (blocked.data) setBlockedSlots(blocked.data);
          if (whatsapp.data) setReminders(whatsapp.data);
          if (wait.data) setWaitlist(wait.data);
          if (calls.data) setCallLogs(calls.data);
        }
      } catch (e) {
        console.warn('AgendaModule load error:', e);
      }
    };
    load();
  }, []);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleAddAppointment = () => {
    addAuditLog('Criou Agendamento', `Novo agendamento para ${selectedDate}`);
  };

  const handleBlockageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBlock: BlockedSlot = {
      id: `block_${Date.now()}`,
      doctor_name: blockDoctor || null,
      branch: blockBranch || null,
      start_date: blockStartDate,
      end_date: blockEndDate,
      start_time: blockStartTime || null,
      end_time: blockEndTime || null,
      reason: blockReason,
      description: blockDesc,
    };
    setBlockedSlots(prev => [...prev, newBlock]);
    addAuditLog('Registrou Bloqueio', `${blockReason} - ${blockDesc}`);
    if (supabase) {
      await supabase.from('blocked_slots').insert(newBlock);
    }
    setShowBlockageModal(false);
    setBlockDoctor('');
    setBlockBranch('');
    setBlockStartDate('');
    setBlockEndDate('');
    setBlockStartTime('');
    setBlockEndTime('');
    setBlockReason('feriado');
    setBlockDesc('');
  };

  const handleDeleteBlockage = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este bloqueio?')) {
      setBlockedSlots(prev => prev.filter(b => b.id !== id));
      if (supabase) {
        await supabase.from('blocked_slots').delete().eq('id', id);
      }
      addAuditLog('Remoção de Bloqueio', `ID: ${id}`);
    }
  };

  // WhatsApp Reminders
  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReminder: WhatsappReminder = {
      id: `rem_${Date.now()}`,
      ...reminderForm,
      status: 'scheduled',
      sent_at: null,
      response_received: null,
    };
    setReminders(prev => [...prev, newReminder]);
    addAuditLog('Agendou Lembrete WhatsApp', `Para ${reminderForm.patient_name}`);
    if (supabase) {
      await supabase.from('whatsapp_reminders').insert(newReminder);
    }
    setShowReminderModal(false);
    setReminderForm({
      patient_id: '',
      patient_name: '',
      patient_phone: '',
      appointment_id: '',
      specialty: '',
      doctor_name: '',
      scheduled_for: '',
      language: 'es',
      message_template: '',
    });
  };

  // Waitlist
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: WaitlistEntry = {
      id: `wl_${Date.now()}`,
      ...waitlistForm,
      priority_score: Math.random() * 100,
      preferred_days: [],
      preferred_hours: [],
      status: 'aguardando',
      created_at: new Date().toISOString(),
    };
    setWaitlist(prev => [...prev, newEntry]);
    addAuditLog('Adicionou à Lista de Espera', waitlistForm.patient_name);
    if (supabase) {
      await supabase.from('waiting_list').insert(newEntry);
    }
    setShowWaitlistModal(false);
  };

  // Call Center
  const handleCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCall: CallLog = {
      id: `call_${Date.now()}`,
      ...callForm,
      recording_url: null,
      created_at: new Date().toISOString(),
    };
    setCallLogs(prev => [newCall, ...prev]);
    addAuditLog('Registrou Ligação', `${callForm.type} - ${callForm.patient_name}`);
    if (supabase) {
      await supabase.from('call_center_logs').insert(newCall);
    }
    setShowCallModal(false);
  };

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{t('agenda_medical', 'app')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestão completa de agendas, bloqueios, WhatsApp, lista de espera e Call Center
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBlockageModal(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-2 transition">
            <AlertTriangle className="w-4 h-4" /> Novo Bloqueio
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {([
          { id: 'calendar', label: 'Calendário', icon: CalendarDays },
          { id: 'whatsapp', label: 'WhatsApp', icon: Send },
          { id: 'waitlist', label: 'Lista Espera', icon: ClipboardList },
          { id: 'callcenter', label: 'Call Center', icon: PhoneCall },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'calendar' | 'whatsapp' | 'waitlist' | 'callcenter')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar View Controls */}
          <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    calendarView === v ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {v === 'day' && 'Dia'} {v === 'week' && 'Semana'} {v === 'month' && 'Mês'}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex gap-2">
              {(['doctor', 'room', 'specialty', 'branch'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setCalendarGroupBy(g)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    calendarGroupBy === g ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g === 'doctor' && 'Por Médico'} {g === 'room' && 'Por Sala'} 
                  {g === 'specialty' && 'Por Especialidade'} {g === 'branch' && 'Por Sede'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Calendar Grid - Simplified */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[500px]">
            <div className="text-center text-slate-500 py-12">
              <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">Visualização de Calendário</p>
              <p className="text-sm text-slate-400 mt-1">
                Agenda agrupada por {calendarGroupBy === 'doctor' ? 'Médico' : calendarGroupBy === 'room' ? 'Sala' : calendarGroupBy === 'specialty' ? 'Especialidade' : 'Sede'}
              </p>
            </div>
          </div>

          {/* Blocked Slots List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Bloqueios de Agenda ({blockedSlots.length})
              </h3>
              <button onClick={() => setShowBlockageModal(true)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition">
                + Novo Bloqueio
              </button>
            </div>
            {blockedSlots.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Nenhum bloqueio cadastrado</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blockedSlots.map(b => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${b.reason === 'feriado' ? 'bg-red-500' : b.reason === 'férias' ? 'bg-blue-500' : b.reason === 'capacitação' ? 'bg-purple-500' : 'bg-rose-500'}`} />
                      <div>
                        <p className="font-semibold text-sm">{b.description}</p>
                        <p className="text-xs text-slate-500">
                          {b.start_date} a {b.end_date} {b.start_time && `(${b.start_time}-${b.end_time})`}
                          {b.doctor_name && ` • Dr(a). ${b.doctor_name}`}
                          {b.branch && ` • ${b.branch}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteBlockage(b.id)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">Remover</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Tab */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Lembretes WhatsApp ({reminders.length})
            </h3>
            <button onClick={() => setShowReminderModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">
              + Novo Lembrete
            </button>
          </div>
          {reminders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">Nenhum lembrete agendado</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Idioma</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map(r => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-sm">{r.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{r.patient_phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{r.scheduled_for}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          r.language === 'es' ? 'bg-blue-100 text-blue-700' :
                          r.language === 'gn' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{r.language.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          r.status === 'sent' ? 'bg-green-100 text-green-700' :
                          r.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                          r.status === 'read' ? 'bg-purple-100 text-purple-700' :
                          r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-teal-600 hover:text-teal-800 text-xs font-semibold">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Waitlist Tab */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Lista de Espera ({waitlist.length})
            </h3>
            <button onClick={() => setShowWaitlistModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">
              + Adicionar Paciente
            </button>
          </div>
          {waitlist.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">Lista de espera vazia</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Especialidade</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Médico</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Prioridade</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map(w => (
                    <tr key={w.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-sm">{w.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.specialty}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.doctor_name || 'Qualquer'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-700">{w.priority_criteria} ({w.priority_score.toFixed(0)})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          w.status === 'aguardando' ? 'bg-amber-100 text-amber-700' :
                          w.status === 'notificado' ? 'bg-blue-100 text-blue-700' :
                          w.status === 'alocado' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{w.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Call Center Tab */}
      {activeTab === 'callcenter' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-rose-600" />
              Call Center ({callLogs.length})
            </h3>
            <button onClick={() => setShowCallModal(true)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition">
              + Registrar Ligação
            </button>
          </div>
          {callLogs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <PhoneCall className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">Nenhuma ligação registrada</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Operador</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Motivo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Duração</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {callLogs.map(c => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-sm">{c.operator_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.patient_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${c.type === 'inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.type === 'inbound' ? 'Recebida' : 'Efetuada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.reason}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {Math.floor(c.duration_seconds / 60)}:{String(c.duration_seconds % 60).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{c.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Dialog open={showBlockageModal} onOpenChange={setShowBlockageModal}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleBlockageSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Novo Bloqueio de Agenda</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Médico</label>
                <select value={blockDoctor} onChange={e => setBlockDoctor(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">Todos os Médicos</option>
                  {professionals.filter(p => p.role === 'Médico(a)').map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sede</label>
                <select value={blockBranch} onChange={e => setBlockBranch(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">Todas as Sedes</option>
                  <option value="Sede Central">Sede Central</option>
                  <option value="Sede Norte">Sede Norte</option>
                  <option value="Sede Sul">Sede Sul</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Início</label>
                <input type="date" value={blockStartDate} onChange={e => setBlockStartDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Fim</label>
                <input type="date" value={blockEndDate} onChange={e => setBlockEndDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Hora Início</label>
                <input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Hora Fim</label>
                <input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Motivo</label>
              <select value={blockReason} onChange={e => setBlockReason(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="feriado">Feriado</option>
                <option value="férias">Férias</option>
                <option value="capacitação">Capacitação</option>
                <option value="emergência">Emergência</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
              <input type="text" value={blockDesc} onChange={e => setBlockDesc(e.target.value)} placeholder="Ex: Capacitação da Equipe ou Licença Médica..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">Registrar Bloqueio</button>
              <button type="button" onClick={() => setShowBlockageModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Fechar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Reminder Modal */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleReminderSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Agendar Lembrete WhatsApp</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Paciente</label>
                <input type="text" value={reminderForm.patient_name} onChange={e => setReminderForm({...reminderForm, patient_name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Telefone</label>
                <input type="text" value={reminderForm.patient_phone} onChange={e => setReminderForm({...reminderForm, patient_phone: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Data/Hora Envio</label>
              <input type="datetime-local" value={reminderForm.scheduled_for} onChange={e => setReminderForm({...reminderForm, scheduled_for: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Idioma</label>
              <select value={reminderForm.language} onChange={e => setReminderForm({...reminderForm, language: e.target.value as any})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="es">Espanhol</option>
                <option value="gn">Guarani</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Template da Mensagem</label>
              <textarea value={reminderForm.message_template} onChange={e => setReminderForm({...reminderForm, message_template: e.target.value})} rows={3} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">Agendar</button>
              <button type="button" onClick={() => setShowReminderModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Cancelar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Waitlist Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleWaitlistSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Adicionar à Lista de Espera</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Paciente</label>
              <input type="text" value={waitlistForm.patient_name} onChange={e => setWaitlistForm({...waitlistForm, patient_name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Telefone</label>
              <input type="text" value={waitlistForm.phone} onChange={e => setWaitlistForm({...waitlistForm, phone: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Especialidade</label>
              <input type="text" value={waitlistForm.specialty} onChange={e => setWaitlistForm({...waitlistForm, specialty: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Médico Preferido</label>
              <select value={waitlistForm.doctor_name} onChange={e => setWaitlistForm({...waitlistForm, doctor_name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">Qualquer médico</option>
                {professionals.filter(p => p.role === 'Médico(a)').map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Critério de Prioridade</label>
              <select value={waitlistForm.priority_criteria} onChange={e => setWaitlistForm({...waitlistForm, priority_criteria: e.target.value as any})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="arrival">Chegada</option>
                <option value="urgency">Urgência</option>
                <option value="coverage">Cobertura</option>
                <option value="seniority">Antiguidade</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">Adicionar</button>
              <button type="button" onClick={() => setShowWaitlistModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Cancelar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Call Center Modal */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCallSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Registrar Ligação</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Operador</label>
              <input type="text" value={callForm.operator_name} onChange={e => setCallForm({...callForm, operator_name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Paciente</label>
              <input type="text" value={callForm.patient_name} onChange={e => setCallForm({...callForm, patient_name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
                <select value={callForm.type} onChange={e => setCallForm({...callForm, type: e.target.value as any})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="inbound">Recebida</option>
                  <option value="outbound">Efetuada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Motivo</label>
                <select value={callForm.reason} onChange={e => setCallForm({...callForm, reason: e.target.value as any})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="agendamento">Agendamento</option>
                  <option value="cancelamento">Cancelamento</option>
                  <option value="remarcação">Remarcação</option>
                  <option value="dúvida">Dúvida</option>
                  <option value="reclamação">Reclamação</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Duração (segundos)</label>
              <input type="number" value={callForm.duration_seconds} onChange={e => setCallForm({...callForm, duration_seconds: parseInt(e.target.value)})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
              <textarea value={callForm.notes} onChange={e => setCallForm({...callForm, notes: e.target.value})} rows={3} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition">Registrar</button>
              <button type="button" onClick={() => setShowCallModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Cancelar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function AgendaModule(props: AgendaModuleProps) {
  const { userPermissions = [], ...rest } = props;
  
  return (
    <WithPermissions userPermissions={userPermissions}>
      <PermissionGate view="agenda" userPermissions={userPermissions}>
        <AgendaModuleContent {...rest} />
      </PermissionGate>
    </WithPermissions>
  );
}