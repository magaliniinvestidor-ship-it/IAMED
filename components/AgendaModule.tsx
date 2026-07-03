'use client';

import React, { useState, useEffect, useRef, useReducer, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Patient, Appointment, Professional, AuditLog } from '@/lib/mockData';
import { 
  CalendarDays, Smartphone, ClipboardList, PhoneCall, Plus, 
  Trash2, AlertTriangle, CheckCircle, Clock, Check, RefreshCw, 
  ChevronLeft, ChevronRight, Sliders, Calendar, Play, Pause, 
  User, Send, ShieldAlert, PhoneOff, ArrowRightLeft, Star, HeartPulse, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AgendaModuleProps {
  patients: Patient[];
  appointments: Appointment[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  addAuditLog: (action: string, target: string) => void;
  professionals: Professional[];
  activeRole?: string;
  activeOperator?: string;
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

export default function AgendaModule({
  patients,
  appointments,
  setPatients,
  setAppointments,
  addAuditLog,
  professionals,
  activeRole = 'Recepcionista',
  activeOperator = 'Operador',
}: AgendaModuleProps) {
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
  const [rescheduleTarget, setRescheduleTarget] = useState<{ appId: string, date: string, time: string, groupVal: string } | null>(null);

  // Database lists (managed via useReducer to avoid setState-in-effect lint errors)
  type DbDataState = {
    blockedSlots: BlockedSlot[];
    waitingList: WaitlistEntry[];
    whatsappReminders: WhatsappReminder[];
    callLogs: CallLog[];
  };
  type DbDataAction =
    | { type: 'SET_ALL'; payload: DbDataState }
    | { type: 'SET_BLOCKED_SLOTS'; payload: BlockedSlot[] | ((prev: BlockedSlot[]) => BlockedSlot[]) }
    | { type: 'SET_WAITING_LIST'; payload: WaitlistEntry[] | ((prev: WaitlistEntry[]) => WaitlistEntry[]) }
    | { type: 'SET_WHATSAPP_REMINDERS'; payload: WhatsappReminder[] | ((prev: WhatsappReminder[]) => WhatsappReminder[]) }
    | { type: 'SET_CALL_LOGS'; payload: CallLog[] | ((prev: CallLog[]) => CallLog[]) };

  const dbDataReducer = (state: DbDataState, action: DbDataAction): DbDataState => {
    switch (action.type) {
      case 'SET_ALL': return action.payload;
      case 'SET_BLOCKED_SLOTS': return { ...state, blockedSlots: typeof action.payload === 'function' ? action.payload(state.blockedSlots) : action.payload };
      case 'SET_WAITING_LIST': return { ...state, waitingList: typeof action.payload === 'function' ? action.payload(state.waitingList) : action.payload };
      case 'SET_WHATSAPP_REMINDERS': return { ...state, whatsappReminders: typeof action.payload === 'function' ? action.payload(state.whatsappReminders) : action.payload };
      case 'SET_CALL_LOGS': return { ...state, callLogs: typeof action.payload === 'function' ? action.payload(state.callLogs) : action.payload };
      default: return state;
    }
  };

  const [dbData, dispatchDb] = useReducer(dbDataReducer, {
    blockedSlots: [],
    waitingList: [],
    whatsappReminders: [],
    callLogs: [],
  });

  const setBlockedSlots = useCallback((value: BlockedSlot[] | ((prev: BlockedSlot[]) => BlockedSlot[])) => dispatchDb({ type: 'SET_BLOCKED_SLOTS', payload: value }), []);
  const setWaitingList = useCallback((value: WaitlistEntry[] | ((prev: WaitlistEntry[]) => WaitlistEntry[])) => dispatchDb({ type: 'SET_WAITING_LIST', payload: value }), []);
  const setWhatsappReminders = useCallback((value: WhatsappReminder[] | ((prev: WhatsappReminder[]) => WhatsappReminder[])) => dispatchDb({ type: 'SET_WHATSAPP_REMINDERS', payload: value }), []);
  const setCallLogs = useCallback((value: CallLog[] | ((prev: CallLog[]) => CallLog[])) => dispatchDb({ type: 'SET_CALL_LOGS', payload: value }), []);

  const blockedSlots = dbData.blockedSlots;
  const waitingList = dbData.waitingList;
  const whatsappReminders = dbData.whatsappReminders;
  const callLogs = dbData.callLogs;

  // Create appointment state
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [newApptPatientId, setNewApptPatientId] = useState('');
  const [newApptDoctor, setNewApptDoctor] = useState('');
  const [newApptSpecialty, setNewApptSpecialty] = useState('Clínica Geral');
  const [newApptDate, setNewApptDate] = useState(selectedDate);
  const [newApptTime, setNewApptTime] = useState('08:00');
  const [newApptModality, setNewApptModality] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [newApptBranch, setNewApptBranch] = useState('Sede Central');
  const [newApptRoom, setNewApptRoom] = useState('Consultório 101');

  // Create blockage state
  const [showBlockageModal, setShowBlockageModal] = useState(false);
  const [blockDoctor, setBlockDoctor] = useState<string>('todos');
  const [blockBranch, setBlockBranch] = useState<string>('todos');
  const [blockStartDate, setBlockStartDate] = useState('2026-06-29');
  const [blockEndDate, setBlockEndDate] = useState('2026-06-29');
  const [blockStartTime, setBlockStartTime] = useState('08:00');
  const [blockEndTime, setBlockEndTime] = useState('12:00');
  const [blockReason, setBlockReason] = useState<'feriado' | 'férias' | 'capacitação' | 'emergência'>('capacitação');
  const [blockDesc, setBlockDesc] = useState('');

  // WhatsApp states
  const [selectedWhatsAppAppId, setSelectedWhatsAppAppId] = useState<string>('');
  const [whatsappLanguage, setWhatsappLanguage] = useState<'es' | 'gn' | 'pt'>('es');
  const [whatsappSearch, setWhatsappSearch] = useState('');

  // Waitlist states
  const [wlPatientId, setWlPatientId] = useState('');
  const [wlSpecialty, setWlSpecialty] = useState('Cardiologia');
  const [wlDoctor, setWlDoctor] = useState('todos');
  const [wlCriteria, setWlCriteria] = useState<'arrival' | 'urgency' | 'coverage' | 'seniority'>('arrival');
  const [wlDays, setWlDays] = useState<string[]>([]);
  const [wlHours, setWlHours] = useState<string[]>([]);
  const [notifiedWlItem, setNotifiedWlItem] = useState<WaitlistEntry | null>(null);

  // Call Center states
  const [simulatedCallNumber, setSimulatedCallNumber] = useState('+595 981 123456');
  const [activeCall, setActiveCall] = useState<{
    inbound: boolean;
    active: boolean;
    ringing: boolean;
    patient: Patient | null;
    phone: string;
    seconds: number;
    tipificacao: 'agendamento' | 'cancelamento' | 'remarcação' | 'dúvida' | 'reclamação' | 'financeiro' | 'outros';
    notes: string;
    forwardTo: string;
  } | null>(null);
  
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // MOCK SEED DATA FOR DEMO MODE
  const initialBlockedSlots: BlockedSlot[] = [
    { id: 'block_1', doctor_name: 'Dra. Amanda Silva', branch: 'Sede Central', start_date: '2026-06-30', end_date: '2026-06-30', start_time: '08:00', end_time: '12:00', reason: 'capacitação', description: 'Capacitação Sistemas de Telemedicina' },
    { id: 'block_2', doctor_name: null, branch: null, start_date: '2026-12-08', end_date: '2026-12-08', start_time: null, end_time: null, reason: 'feriado', description: 'Día de la Virgen de Caacupé (Feriado Nacional)' },
    { id: 'block_3', doctor_name: 'Dr. Adriano Lima', branch: 'Filial Ciudad del Este', start_date: '2026-07-02', end_date: '2026-07-15', start_time: null, end_time: null, reason: 'férias', description: 'Férias Regulamentares' }
  ];

  const initialWaitlist: WaitlistEntry[] = [
    { id: 'wl_1', patient_id: 'pat_1', patient_name: 'Carlos Eduardo Almeida', phone: '+595 981 112233', specialty: 'Cardiologia', doctor_name: 'Dra. Amanda Silva', priority_criteria: 'urgency', priority_score: 95, preferred_days: ['Segunda', 'Quarta'], preferred_hours: ['Manhã'], status: 'aguardando', created_at: '2026-06-25T10:00:00Z' },
    { id: 'wl_2', patient_id: 'pat_3', patient_name: 'Joaquim Bento Pereira', phone: '+595 972 556677', specialty: 'Ortopedia', doctor_name: null, priority_criteria: 'seniority', priority_score: 80, preferred_days: ['Tercas', 'Quintas'], preferred_hours: ['Tarde'], status: 'aguardando', created_at: '2026-06-20T08:30:00Z' },
    { id: 'wl_3', patient_id: 'pat_4', patient_name: 'Ana Júlia de Souza', phone: '+595 993 998877', specialty: 'Cardiologia', doctor_name: null, priority_criteria: 'urgency', priority_score: 110, preferred_days: ['Segunda', 'Terca', 'Quarta'], preferred_hours: ['Manhã', 'Tarde'], status: 'aguardando', created_at: '2026-06-28T14:15:00Z' }
  ];

  const initialWhatsappReminders: WhatsappReminder[] = [
    { id: 'wa_1', appointment_id: 'app_1', patient_name: 'Joaquim Bento Pereira', patient_phone: '+595 972 556677', message_template: 'template_reminder_24h', language: 'es', status: 'delivered', scheduled_for: '2026-06-21T09:00:00Z', sent_at: '2026-06-21T09:05:00Z', response_received: null },
    { id: 'wa_2', appointment_id: 'app_2', patient_name: 'Carlos Eduardo Almeida', patient_phone: '+595 981 112233', message_template: 'template_reminder_24h', language: 'pt', status: 'confirmed', scheduled_for: '2026-06-21T10:30:00Z', sent_at: '2026-06-21T10:35:00Z', response_received: 'Confirmar' },
    { id: 'wa_3', appointment_id: 'app_4', patient_name: 'Roberto de Oliveira Cruz', patient_phone: '+595 985 443322', message_template: 'template_reminder_48h', language: 'es', status: 'scheduled', scheduled_for: '2026-06-23T14:15:00Z', sent_at: null, response_received: null }
  ];

  const initialCallLogs: CallLog[] = [
    { id: 'call_1', operator_name: 'Marcela Ramos', patient_id: 'pat_1', patient_name: 'Carlos Eduardo Almeida', patient_phone: '+595 981 112233', type: 'inbound', reason: 'agendamento', notes: 'Solicitou consulta com cardiologista urgente. Adicionado à lista de espera.', duration_seconds: 145, recording_url: 'mock_recording_1.mp3', created_at: '2026-06-28T11:20:00Z' },
    { id: 'call_2', operator_name: 'Marcela Ramos', patient_id: 'pat_3', patient_name: 'Joaquim Bento Pereira', patient_phone: '+595 972 556677', type: 'outbound', reason: 'remarcação', notes: 'Ligação para confirmar mudança de horário por feriado de Itapúa.', duration_seconds: 98, recording_url: 'mock_recording_2.mp3', created_at: '2026-06-28T14:05:00Z' }
  ];

  // -------------------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // -------------------------------------------------------------
  const loadModuleData = async () => {
    try {
      const [blockRes, wlRes, waRes, callRes] = await Promise.all([
        supabase.from('blocked_slots').select('*').order('start_date', { ascending: true }),
        supabase.from('waiting_list').select('*').order('priority_score', { ascending: false }),
        supabase.from('whatsapp_reminders').select('*').order('created_at', { ascending: false }),
        supabase.from('call_center_logs').select('*').order('created_at', { ascending: false })
      ]);

      dispatchDb({
        type: 'SET_ALL',
        payload: {
          blockedSlots: blockRes.data && !blockRes.error ? blockRes.data : initialBlockedSlots,
          waitingList: wlRes.data && !wlRes.error ? wlRes.data : initialWaitlist,
          whatsappReminders: waRes.data && !waRes.error ? waRes.data : initialWhatsappReminders,
          callLogs: callRes.data && !callRes.error ? callRes.data : initialCallLogs,
        },
      });

    } catch (e) {
      console.warn("Failed to fetch from Supabase. Falling back to mock variables.", e);
      dispatchDb({
        type: 'SET_ALL',
        payload: {
          blockedSlots: initialBlockedSlots,
          waitingList: initialWaitlist,
          whatsappReminders: initialWhatsappReminders,
          callLogs: initialCallLogs,
        },
      });
    }
  };

  useEffect(() => {
    loadModuleData();
  }, []);

  // Update selected WhatsApp appointment default selection (derived state)
  const effectiveWhatsAppAppId = useMemo(() => {
    if (selectedWhatsAppAppId) return selectedWhatsAppAppId;
    if (appointments.length > 0) return appointments[0].id;
    return '';
  }, [selectedWhatsAppAppId, appointments]);

  // -------------------------------------------------------------
  // CALL CENTER TIMER
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeCall && activeCall.active) {
      callIntervalRef.current = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, seconds: prev.seconds + 1 } : null);
      }, 1000);
    } else {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
        callIntervalRef.current = null;
      }
    }
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [activeCall?.active]);

  // -------------------------------------------------------------
  // DATES AND TIMES GENERATOR HELPERS
  // -------------------------------------------------------------
  const startHour = 7;
  const endHour = 19;
  const hoursGrid = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const h = startHour + i;
    return `${h.toString().padStart(2, '0')}:00`;
  });

  const getDayOfWeekName = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', { weekday: 'long' });
  };

  const getFormattedDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Check if a date is a Paraguayan holiday
  const checkHoliday = (dateStr: string) => {
    const parts = dateStr.split('-'); // YYYY-MM-DD
    if (parts.length < 3) return null;
    const key = `${parts[1]}-${parts[2]}`; // MM-DD
    return PARAGUAY_HOLIDAYS.find(h => h.date === key) || null;
  };

  // Check if slot is blocked by blocked_slots table
  const checkCustomBlockage = (dateStr: string, timeStr: string, groupVal: string, groupBy: string) => {
    return blockedSlots.find(b => {
      // Check date range
      if (dateStr < b.start_date || dateStr > b.end_date) return false;
      // Check general or specific doctor/branch
      if (groupBy === 'doctor' && b.doctor_name && b.doctor_name !== groupVal) return false;
      if (groupBy === 'branch' && b.branch && b.branch !== groupVal) return false;
      
      // Check time range if specified
      if (b.start_time && b.end_time) {
        return timeStr >= b.start_time && timeStr <= b.end_time;
      }
      return true; // All day blockage
    });
  };

  // Group options values depending on calendarGroupBy
  const getGroupOptions = () => {
    if (calendarGroupBy === 'doctor') {
      const docs = professionals.filter(p => p.role === 'Médico(a)').map(p => p.name);
      return docs.length > 0 ? docs : ['Dra. Amanda Silva', 'Dr. Adriano Lima', 'Dr. Bruno Castro'];
    }
    if (calendarGroupBy === 'room') {
      return ['Consultório 101', 'Consultório 102', 'Sala de Exames 1', 'Sala de Procedimentos A'];
    }
    if (calendarGroupBy === 'specialty') {
      return ['Cardiologia', 'Ortopedia', 'Medicina do Trabalho', 'Clínico Geral'];
    }
    return ['Sede Central', 'Filial Ciudad del Este', 'Filial Encarnación'];
  };

  // -------------------------------------------------------------
  // ACTIONS / LOGIC HANDLERS
  // -------------------------------------------------------------

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    // Only allow drag if role has editing rights
    if (activeRole !== 'Recepcionista' && activeRole !== 'Gestor' && activeRole !== 'Diretor Clínico') {
      e.preventDefault();
      alert("Você não possui permissões de edição de agenda.");
      return;
    }
    setDraggedAppId(appId);
    e.dataTransfer.setData('text/plain', appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, time: string, groupVal: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (!appId) return;

    // Check if slot is blocked
    const holiday = checkHoliday(selectedDate);
    const blockage = checkCustomBlockage(selectedDate, time, groupVal, calendarGroupBy);
    if (holiday || blockage) {
      alert(`Erro: Horário indisponível devido a bloqueio clínico (${holiday?.name || blockage?.description})`);
      setDraggedAppId(null);
      return;
    }

    setRescheduleTarget({ appId, date: selectedDate, time, groupVal });
    setDraggedAppId(null);
  };

  const confirmRescheduling = async () => {
    if (!rescheduleTarget) return;

    const { appId, date, time, groupVal } = rescheduleTarget;
    const oldApp = appointments.find(a => a.id === appId);
    if (!oldApp) return;

    const changes: Partial<Appointment> = {
      date,
      time: `${time}:00`,
      status: 'remarcado',
    };

    if (calendarGroupBy === 'doctor') changes.doctorName = groupVal;
    if (calendarGroupBy === 'room') changes.room = groupVal;
    if (calendarGroupBy === 'specialty') changes.specialty = groupVal;
    if (calendarGroupBy === 'branch') changes.branch = groupVal;

    // Optimistic UI update
    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, ...changes } : a));

    // Audit logs
    const msg = `Remarcou consulta de ${oldApp.patientName} de ${oldApp.date} ${oldApp.time} para ${date} ${time}:00 (${groupVal})`;
    addAuditLog('Remarcação de Consulta', msg);

    // Save to Database
    try {
      const payload: any = {
        date,
        time: `${time}:00`,
        status: 'remarcado'
      };
      if (calendarGroupBy === 'doctor') payload.doctor_name = groupVal;
      if (calendarGroupBy === 'room') payload.room = groupVal;
      if (calendarGroupBy === 'specialty') payload.specialty = groupVal;
      if (calendarGroupBy === 'branch') payload.branch = groupVal;

      await supabase.from('appointments').update(payload).eq('id', appId);

      // Create WhatsApp reminder log for this rescheduling
      const newWaReminder: WhatsappReminder = {
        id: `wa_${Date.now()}`,
        appointment_id: appId,
        patient_name: oldApp.patientName,
        patient_phone: patients.find(p => p.id === oldApp.patientId)?.phone || '+595 981 000000',
        message_template: 'template_reschedule_alert',
        language: whatsappLanguage,
        status: 'sent',
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        response_received: null
      };

      setWhatsappReminders(prev => [newWaReminder, ...prev]);
      await supabase.from('whatsapp_reminders').insert(newWaReminder);

    } catch (e) {
      console.warn("DB write failed in drag & drop, running memory-only mode.", e);
    }

    setRescheduleTarget(null);
  };

  // Create block time slot
  const handleCreateBlockage = async (e: React.FormEvent) => {
    e.preventDefault();

    const newBlock: BlockedSlot = {
      id: `block_${Date.now()}`,
      doctor_name: blockDoctor === 'todos' ? null : blockDoctor,
      branch: blockBranch === 'todos' ? null : blockBranch,
      start_date: blockStartDate,
      end_date: blockEndDate,
      start_time: blockStartTime,
      end_time: blockEndTime,
      reason: blockReason,
      description: blockDesc || `Bloqueio por ${blockReason}`,
    };

    setBlockedSlots(prev => [...prev, newBlock]);
    setShowBlockageModal(false);
    addAuditLog('Bloqueio de Agenda', `Bloqueou faixa para ${blockDoctor} (Sede: ${blockBranch}) de ${blockStartDate} a ${blockEndDate} (${blockReason})`);

    try {
      await supabase.from('blocked_slots').insert({
        id: newBlock.id,
        doctor_name: newBlock.doctor_name,
        branch: newBlock.branch,
        start_date: newBlock.start_date,
        end_date: newBlock.end_date,
        start_time: newBlock.start_time ? `${newBlock.start_time}:00` : null,
        end_time: newBlock.end_time ? `${newBlock.end_time}:00` : null,
        reason: newBlock.reason,
        description: newBlock.description,
      });
    } catch (err) {
      console.warn("Could not insert blocked slot to Supabase", err);
    }

    // Reset fields
    setBlockDesc('');
  };

  const handleDeleteBlockage = async (id: string) => {
    setBlockedSlots(prev => prev.filter(b => b.id !== id));
    addAuditLog('Remoção de Bloqueio', `Removeu o bloqueio ID: ${id}`);
    try {
      await supabase.from('blocked_slots').delete().eq('id', id);
    } catch (err) {
      console.warn("Could not delete blocked slot from Supabase", err);
    }
  };

  // -------------------------------------------------------------
  // WHATSAPP RESPONDER SIMULATION
  // -------------------------------------------------------------
  const triggerWhatsAppWebhookResponse = async (appId: string, statusResponse: 'confirmado' | 'cancelado' | 'remarcado') => {
    // 1. Update the appointment status
    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: statusResponse } : a));

    const app = appointments.find(a => a.id === appId);
    if (!app) return;

    addAuditLog('Confirmação Integrada WhatsApp', `Paciente ${app.patientName} respondeu via WhatsApp: ${statusResponse.toUpperCase()}`);

    // 2. Update DB
    try {
      await supabase.from('appointments').update({ status: statusResponse }).eq('id', appId);
    } catch (err) {
      console.warn("DB update failed for WhatsApp response hook", err);
    }

    // 3. Update WhatsApp reminder log status
    setWhatsappReminders(prev => prev.map(r => r.appointment_id === appId ? { 
      ...r, 
      status: statusResponse === 'confirmado' ? 'confirmed' : statusResponse === 'cancelado' ? 'cancelled' : 'rescheduled',
      response_received: statusResponse.charAt(0).toUpperCase() + statusResponse.slice(1),
      sent_at: new Date().toISOString()
    } : r));

    try {
      await supabase.from('whatsapp_reminders').update({
        status: statusResponse === 'confirmado' ? 'confirmed' : statusResponse === 'cancelado' ? 'cancelled' : 'rescheduled',
        response_received: statusResponse.charAt(0).toUpperCase() + statusResponse.slice(1),
        sent_at: new Date().toISOString()
      }).eq('appointment_id', appId);
    } catch (err) {
      console.warn("DB whatsapp_reminders update failed", err);
    }

    // 4. If cancelled, check if waitlist can auto-fill this slot!
    if (statusResponse === 'cancelado') {
      const waitlistCandidates = waitingList.filter(w => w.specialty === app.specialty && w.status === 'aguardando');
      if (waitlistCandidates.length > 0) {
        // Find the top prioritized candidate
        const candidate = waitlistCandidates[0];
        // Trigger notification
        setNotifiedWlItem({ ...candidate, status: 'notificado' });
        setWaitingList(prev => prev.map(w => w.id === candidate.id ? { ...w, status: 'notificado' } : w));
        try {
          await supabase.from('waiting_list').update({ status: 'notificado' }).eq('id', candidate.id);
        } catch (err) {}
      }
    }
  };

  // -------------------------------------------------------------
  // SMART WAITLIST HANDLERS
  // -------------------------------------------------------------
  const handleAddToWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlPatientId) return;

    const patient = patients.find(p => p.id === wlPatientId);
    if (!patient) return;

    // Prioritization algorithm
    // 1. Urgency score (emergência = 100, preferencial = 50, normal = 0)
    let score = 0;
    if (patient.priority === 'emergência') score += 100;
    else if (patient.priority === 'preferencial') score += 50;

    // 2. Coverage score (Particular = 20, IPS = 10, other = 0)
    if (patient.health_insurance_type === 'Particular') score += 20;
    else if (patient.health_insurance_type === 'IPS') score += 10;

    // 3. Seniority score (based on date, newer on waitlist gets lower base, older gets higher)
    // Here we just add a random increment to simulate arrival time or keep it basic
    score += Math.floor(Math.random() * 15);

    const newWl: WaitlistEntry = {
      id: `wl_${Date.now()}`,
      patient_id: wlPatientId,
      patient_name: patient.name,
      phone: patient.phone || '+595 981 000000',
      specialty: wlSpecialty,
      doctor_name: wlDoctor === 'todos' ? null : wlDoctor,
      priority_criteria: wlCriteria,
      priority_score: score,
      preferred_days: wlDays.length > 0 ? wlDays : ['Qualquer Dia'],
      preferred_hours: wlHours.length > 0 ? wlHours : ['Qualquer Horário'],
      status: 'aguardando',
      created_at: new Date().toISOString()
    };

    setWaitingList(prev => [...prev, newWl].sort((a, b) => b.priority_score - a.priority_score));
    addAuditLog('Adição à Lista de Espera', `Adicionou ${patient.name} para especialidade ${wlSpecialty} (Score: ${score})`);

    try {
      await supabase.from('waiting_list').insert({
        id: newWl.id,
        patient_id: newWl.patient_id,
        patient_name: newWl.patient_name,
        phone: newWl.phone,
        specialty: newWl.specialty,
        doctor_name: newWl.doctor_name,
        priority_criteria: newWl.priority_criteria,
        priority_score: newWl.priority_score,
        preferred_days: newWl.preferred_days,
        preferred_hours: newWl.preferred_hours,
        status: newWl.status,
      });
    } catch (err) {
      console.warn("DB waitlist write error", err);
    }

    // Reset
    setWlPatientId('');
    setWlDays([]);
    setWlHours([]);
  };

  const confirmWaitlistReallocation = async () => {
    if (!notifiedWlItem) return;

    // 1. Find a cancelled slot or release target
    // We will auto-allocate them to the next matching time slot. Let's create an appointment for them.
    const newAppId = `app_${Date.now()}`;
    const targetDoc = notifiedWlItem.doctor_name || 'Dra. Amanda Silva';
    
    const newAppointment: Appointment = {
      id: newAppId,
      patientId: notifiedWlItem.patient_id,
      patientName: notifiedWlItem.patient_name,
      doctorName: targetDoc,
      specialty: notifiedWlItem.specialty,
      date: '2026-06-29', // Allocate today
      time: '16:00:00', // Auto slot
      status: 'confirmado',
      branch: 'Sede Central',
      room: 'Consultório 101',
      type: 'consulta de retorno/controle',
      modality: 'Presencial',
      insurance: patients.find(p => p.id === notifiedWlItem.patient_id)?.health_insurance_type || 'Particular'
    };

    setAppointments(prev => [newAppointment, ...prev]);
    setWaitingList(prev => prev.filter(w => w.id !== notifiedWlItem.id));

    addAuditLog('Reatribuição Automática Lista de Espera', `Reatribuiu slot liberado para paciente ${notifiedWlItem.patient_name} (${notifiedWlItem.specialty})`);

    try {
      await supabase.from('appointments').insert({
        id: newAppointment.id,
        patient_id: newAppointment.patientId,
        patient_name: newAppointment.patientName,
        doctor_name: newAppointment.doctorName,
        specialty: newAppointment.specialty,
        date: newAppointment.date,
        time: newAppointment.time,
        status: newAppointment.status,
        branch: newAppointment.branch,
        room: newAppointment.room,
        type: newAppointment.type,
        modality: newAppointment.modality,
      });

      await supabase.from('waiting_list').delete().eq('id', notifiedWlItem.id);
    } catch (err) {
      console.warn("DB waitlist reallocation write failed", err);
    }

    setNotifiedWlItem(null);
  };

  // -------------------------------------------------------------
  // CALL CENTER ACTION HANDLERS
  // -------------------------------------------------------------
  const simulateIncomingCall = () => {
    // Find a random patient in DB to identify
    const randomIndex = Math.floor(Math.random() * patients.length);
    const matchedPatient = patients[randomIndex] || null;
    const phone = matchedPatient?.phone || simulatedCallNumber;

    setActiveCall({
      inbound: true,
      active: false,
      ringing: true,
      patient: matchedPatient,
      phone,
      seconds: 0,
      tipificacao: 'agendamento',
      notes: '',
      forwardTo: 'Nenhum'
    });

    addAuditLog('CTI Call Center', `Chamada recebida do número ${phone}. Status: Tocando...`);
  };

  const handleAnswerCall = () => {
    if (!activeCall) return;
    setActiveCall(prev => prev ? { ...prev, ringing: false, active: true } : null);
    addAuditLog('CTI Call Center', `Chamada atendida pelo operador ${activeOperator}. Iniciado cronômetro.`);
  };

  const handleDeclineCall = () => {
    if (!activeCall) return;
    setActiveCall(null);
    addAuditLog('CTI Call Center', `Chamada rejeitada/desconectada.`);
  };

  const handleSaveCallRecord = async () => {
    if (!activeCall) return;

    const newLog: CallLog = {
      id: `call_${Date.now()}`,
      operator_name: activeOperator,
      patient_id: activeCall.patient?.id || null,
      patient_name: activeCall.patient?.name || 'Cliente Desconhecido',
      patient_phone: activeCall.phone,
      type: activeCall.inbound ? 'inbound' : 'outbound',
      reason: activeCall.tipificacao,
      notes: activeCall.notes || 'Sem anotações adicionais.',
      duration_seconds: activeCall.seconds,
      recording_url: `rec_${Date.now()}.mp3`, // Simulated recording url
      created_at: new Date().toISOString()
    };

    setCallLogs(prev => [newLog, ...prev]);
    addAuditLog('Call Center Registro', `Chamada finalizada com ${newLog.patient_name}. Tipificação: ${newLog.reason.toUpperCase()} (Duração: ${newLog.duration_seconds}s)`);

    try {
      await supabase.from('call_center_logs').insert({
        id: newLog.id,
        operator_name: newLog.operator_name,
        patient_id: newLog.patient_id,
        patient_name: newLog.patient_name,
        patient_phone: newLog.patient_phone,
        type: newLog.type,
        reason: newLog.reason,
        notes: newLog.notes,
        duration_seconds: newLog.duration_seconds,
        recording_url: newLog.recording_url,
      });
    } catch (err) {
      console.warn("DB call_center_logs write failed", err);
    }

    // Reset call screen
    setActiveCall(null);
  };

  const handleWlDayToggle = (day: string) => {
    setWlDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleWlHourToggle = (hour: string) => {
    setWlHours(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]);
  };

  // WHATSAPP TEMPLATE BUILDERS
  const getWhatsAppMessageText = (app: Appointment, lang: 'es' | 'gn' | 'pt') => {
    const formattedDate = app.date;
    const time = app.time.substring(0, 5);
    const branch = app.branch || 'Sede Central';
    const doctor = app.doctorName;
    const patientName = app.patientName;

    if (lang === 'es') {
      return `Hola ${patientName}, te recordamos tu consulta de ${app.specialty} con el/la ${doctor} el día ${formattedDate} a las ${time} hs en ${branch}. Por favor, confirma tu asistencia respondiendo con los botones de abajo o escribe Confirmar / Cancelar.`;
    }
    if (lang === 'gn') {
      return `Mba\'éichapa ${patientName}, nemomandu\'a nderehe nde pohanohára ${doctor} ndive ára ${formattedDate} jave, ${time} aravo oikótava ${branch} pe. Emoañetéma ne rembiapo eklikávo ko\'ápe: Confirmar terã Cancelar.`;
    }
    // Portuguese
    return `Olá ${patientName}, lembramos que você tem uma consulta de ${app.specialty} com o(a) ${doctor} no dia ${formattedDate} às ${time} na ${branch}. Por favor, confirme respondendo a esta mensagem com Confirmar ou Cancelar.`;
  };

  // -------------------------------------------------------------
  // RENDERING COMPONENTS
  // -------------------------------------------------------------
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden font-sans">
      
      {/* HEADER TABS */}
      <div className="bg-slate-50 border-b border-slate-200 p-4.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition select-none cursor-pointer ${activeTab === 'calendar' ? 'bg-teal-600 text-white shadow-sm' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'}`}
          >
            <CalendarDays className="w-4 h-4" />
            Agenda Inteligente
          </button>
          
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition select-none cursor-pointer relative ${activeTab === 'whatsapp' ? 'bg-teal-600 text-white shadow-sm' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'}`}
          >
            <Smartphone className="w-4 h-4" />
            Confirmação WhatsApp
            <span className="absolute -top-1.5 -right-1 bg-green-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-white animate-pulse">
              Meta
            </span>
          </button>

          <button
            onClick={() => setActiveTab('waitlist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition select-none cursor-pointer ${activeTab === 'waitlist' ? 'bg-teal-600 text-white shadow-sm' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'}`}
          >
            <ClipboardList className="w-4 h-4" />
            Lista de Espera
            {waitingList.filter(w => w.status === 'aguardando').length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                {waitingList.filter(w => w.status === 'aguardando').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('callcenter')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition select-none cursor-pointer ${activeTab === 'callcenter' ? 'bg-teal-600 text-white shadow-sm' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'}`}
          >
            <PhoneCall className="w-4 h-4" />
            Call Center CTI
            {activeCall?.ringing && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-bounce">
                CALL
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={loadModuleData}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition"
            title="Atualizar Dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Perfil Ativo</p>
            <p className="text-[11.5px] text-slate-700 font-extrabold leading-none mt-1.5">{activeOperator} ({activeRole})</p>
          </div>
        </div>
      </div>

      {/* BODY CONTENT AREA */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <motion.div
              key="tab-calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              
              {/* CALENDAR CONTROLS BAR */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap gap-4 items-center justify-between text-xs font-semibold">
                
                {/* View selectors */}
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setCalendarView('day')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition ${calendarView === 'day' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Diária
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition ${calendarView === 'week' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition ${calendarView === 'month' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Mensal
                  </button>
                </div>

                {/* Group By selector (Active only in Daily view) */}
                {calendarView === 'day' && (
                  <div className="flex items-center gap-2">
                    <label className="text-slate-500 font-bold uppercase text-[10px]">Agrupar Colunas por:</label>
                    <select
                      value={calendarGroupBy}
                      onChange={e => setCalendarGroupBy(e.target.value as any)}
                      className="bg-white border border-slate-200 py-1.5 px-2.5 rounded-lg text-slate-700 font-bold font-sans"
                    >
                      <option value="doctor">Profissional</option>
                      <option value="room">Sala / Consultório</option>
                      <option value="specialty">Especialidade</option>
                      <option value="branch">Sede / Filial</option>
                    </select>
                  </div>
                )}

                {/* Date navigator */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate + 'T00:00:00');
                      d.setDate(d.getDate() - 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>

                  <span className="text-sm font-extrabold text-slate-800 bg-white border border-slate-200 py-1.5 px-4 rounded-xl min-w-[200px] text-center shadow-2xs">
                    {getFormattedDateLabel(selectedDate)}
                  </span>

                  <button
                    onClick={() => {
                      const d = new Date(selectedDate + 'T00:00:00');
                      d.setDate(d.getDate() + 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>

                  {/* Novo Agendamento button */}
                  <button
                    onClick={() => { setNewApptDate(selectedDate); setShowNewAppointmentModal(true); }}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo Agendamento
                  </button>

                  {/* Blockages button */}
                  <button
                    onClick={() => setShowBlockageModal(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition text-[11px]"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Gerenciar Bloqueios
                  </button>
                </div>

              </div>

              {/* HOLIDAY DETECTOR BANNER */}
              {checkHoliday(selectedDate) && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Calendário Paraguaio: Hoje é feriado de <b>{checkHoliday(selectedDate)?.name}</b>. A agenda geral está bloqueada para novos slots.</span>
                </div>
              )}

              {/* CALENDAR MAIN LAYOUTS */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50/50">

                {/* 1. DAILY VIEW (GRID BY GROUPS) */}
                {calendarView === 'day' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="p-3 text-[10px] font-bold text-slate-500 uppercase text-center w-24 border-r border-slate-200">Hora</th>
                          {getGroupOptions().map(groupVal => (
                            <th key={groupVal} className="p-3 text-xs font-extrabold text-slate-700 text-center border-r border-slate-200 last:border-0 min-w-[160px]">
                              {groupVal}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hoursGrid.map(hour => {
                          const isHoliday = checkHoliday(selectedDate);

                          return (
                            <tr key={hour} className="border-b border-slate-100 hover:bg-slate-50/20 last:border-0">
                              {/* Time label */}
                              <td className="p-3 text-center border-r border-slate-200 bg-slate-50/60 font-bold text-slate-600 text-xs">
                                {hour}
                              </td>

                              {/* Group Columns */}
                              {getGroupOptions().map(groupVal => {
                                // Find appointment matching hour, date and grouping criteria
                                const matchingApps = appointments.filter(app => {
                                  if (app.date !== selectedDate) return false;
                                  if (app.time.substring(0, 5) !== hour) return false;
                                  
                                  if (calendarGroupBy === 'doctor') return app.doctorName === groupVal;
                                  if (calendarGroupBy === 'room') return app.room === groupVal;
                                  if (calendarGroupBy === 'specialty') return app.specialty === groupVal;
                                  return app.branch === groupVal;
                                });

                                // Check blockage for this slot
                                const blockage = checkCustomBlockage(selectedDate, hour, groupVal, calendarGroupBy);
                                const isBlocked = isHoliday || blockage;

                                return (
                                  <td
                                    key={groupVal}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, hour, groupVal)}
                                    className={`p-2.5 border-r border-slate-200 last:border-0 relative min-h-[70px] ${isBlocked ? 'bg-stripes bg-slate-100/70 text-slate-400 select-none' : ''}`}
                                  >
                                    {isBlocked ? (
                                      <div className="flex flex-col items-center justify-center p-2 text-center select-none text-[10px] font-bold text-slate-400 leading-tight">
                                        <AlertTriangle className="w-3.5 h-3.5 text-slate-300 mb-0.5" />
                                        <span>Bloqueado ({isHoliday ? 'Feriado' : blockage?.reason})</span>
                                        <p className="font-medium text-[9px] text-slate-400/80">{isHoliday ? isHoliday.name : blockage?.description}</p>
                                      </div>
                                    ) : (
                                      <div className="min-h-[50px] flex flex-col gap-2">
                                        {matchingApps.map(app => {
                                          let statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                                          let indicator = '🔵';
                                          
                                          if (app.status === 'confirmado') { statusColor = 'bg-green-50 text-green-700 border-green-200'; indicator = '🟢'; }
                                          else if (app.status === 'em sala de espera') { statusColor = 'bg-amber-50 text-amber-700 border-amber-200'; indicator = '🟡'; }
                                          else if (app.status === 'em atendimento') { statusColor = 'bg-purple-50 text-purple-700 border-purple-200'; indicator = '🟣'; }
                                          else if (app.status === 'finalizado') { statusColor = 'bg-slate-100 text-slate-600 border-slate-300'; indicator = '⚪'; }
                                          else if (app.status === 'ausente') { statusColor = 'bg-rose-50 text-rose-700 border-rose-200'; indicator = '🔴'; }
                                          else if (app.status === 'cancelado') { statusColor = 'bg-gray-100 text-gray-400 border-gray-200 line-through'; indicator = '❌'; }
                                          else if (app.status === 'remarcado') { statusColor = 'bg-sky-50 text-sky-700 border-sky-200'; indicator = '🔹'; }

                                          return (
                                            <div
                                              key={app.id}
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, app.id)}
                                              className={`p-2 rounded-lg border text-xs shadow-3xs cursor-grab active:cursor-grabbing font-medium flex flex-col justify-between gap-1 transition ${statusColor} select-none`}
                                            >
                                              <div className="flex justify-between items-start gap-1">
                                                <span className="font-extrabold text-[12.5px] leading-tight truncate">{app.patientName}</span>
                                                <span className="text-[9.5px] shrink-0 font-bold bg-white/70 px-1 rounded">{app.insurance || 'Particular'}</span>
                                              </div>
                                              
                                              <div className="text-[9.5px] leading-none text-slate-500 font-semibold space-y-0.5 mt-0.5">
                                                {calendarGroupBy !== 'doctor' && <p>👨‍⚕️ {app.doctorName}</p>}
                                                {calendarGroupBy !== 'specialty' && <p>🩺 {app.specialty}</p>}
                                                {calendarGroupBy !== 'room' && <p>🚪 {app.room || 'N/A'}</p>}
                                                {calendarGroupBy !== 'branch' && <p>🏢 {app.branch || 'Sede Central'}</p>}
                                              </div>

                                              <div className="flex items-center justify-between text-[9px] mt-1 pt-1 border-t border-black/5">
                                                <span className="font-bold">{indicator} {app.status.toUpperCase()}</span>
                                                {app.modality === 'Virtual' && <span className="font-black text-indigo-600">💻 TELEMED</span>}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. WEEKLY VIEW */}
                {calendarView === 'week' && (
                  <div className="grid grid-cols-6 bg-white min-w-[700px]">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day, dIdx) => {
                      // Calculate date for the day of current week
                      const baseDate = new Date(selectedDate + 'T00:00:00');
                      const dayDiff = dIdx + 1 - baseDate.getDay(); // 1 = Monday, 6 = Saturday
                      const targetD = new Date(baseDate);
                      targetD.setDate(baseDate.getDate() + dayDiff);
                      const targetDateStr = targetD.toISOString().split('T')[0];

                      const dayApps = appointments.filter(a => a.date === targetDateStr);
                      const isHol = checkHoliday(targetDateStr);

                      return (
                        <div key={day} className="border-r border-slate-200 last:border-0 min-h-[400px] flex flex-col">
                          <div className="bg-slate-100 border-b border-slate-200 p-3 text-center">
                            <p className="text-xs font-black text-slate-700 uppercase leading-none">{day}</p>
                            <p className="text-[10px] text-slate-400 font-extrabold mt-1">{targetDateStr.split('-').reverse().slice(0, 2).join('/')}</p>
                          </div>

                          <div className="p-2.5 flex-1 space-y-2 bg-slate-50/20 max-h-[480px] overflow-y-auto">
                            {isHol && (
                              <div className="p-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] rounded-lg font-bold text-center">
                                ⚠️ Feriado: {isHol.name}
                              </div>
                            )}

                            {dayApps.map(app => (
                              <div key={app.id} className="p-2 bg-white border border-slate-200 rounded-lg text-xs shadow-3xs space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-[11px] text-slate-700 truncate">{app.patientName}</span>
                                  <span className="text-[9px] font-black text-teal-600">{app.time.substring(0, 5)}</span>
                                </div>
                                <p className="text-[9.5px] text-slate-500 truncate leading-none">👨‍⚕️ {app.doctorName}</p>
                                <p className="text-[9px] text-slate-400 font-semibold truncate leading-none">🩺 {app.specialty}</p>
                                <span className={`inline-block text-[8px] font-bold px-1 rounded leading-normal ${
                                  app.status === 'confirmado' ? 'bg-green-50 text-green-700 border-green-200' :
                                  app.status === 'pendente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  app.status === 'cancelado' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {app.status.toUpperCase()}
                                </span>
                              </div>
                            ))}

                            {!isHol && dayApps.length === 0 && (
                              <p className="text-center text-[10px] text-slate-400 pt-6">Sem agendamentos</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. MONTHLY VIEW */}
                {calendarView === 'month' && (
                  <div className="grid grid-cols-7 bg-white">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(wday => (
                      <div key={wday} className="bg-slate-100 border-b border-slate-200 p-2.5 text-center font-extrabold text-[10.5px] text-slate-600">
                        {wday}
                      </div>
                    ))}
                    {/* Render days of month */}
                    {Array.from({ length: 30 }, (_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `2026-06-${dayNum.toString().padStart(2, '0')}`;
                      const dayApps = appointments.filter(a => a.date === dateStr);
                      const holiday = checkHoliday(dateStr);

                      return (
                        <div key={dayNum} className="border-r border-b border-slate-200 p-2 min-h-[85px] flex flex-col justify-between">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-xs text-slate-700">{dayNum}</span>
                            {holiday && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={holiday.name} />
                            )}
                          </div>

                          <div className="space-y-0.5 mt-1 overflow-y-auto max-h-[50px] pr-0.5">
                            {dayApps.slice(0, 3).map(app => (
                              <div key={app.id} className="text-[8px] font-bold truncate bg-teal-50 border border-teal-100 rounded px-1 text-teal-800 leading-normal">
                                {app.time.substring(0, 5)} - {app.patientName}
                              </div>
                            ))}
                            {dayApps.length > 3 && (
                              <p className="text-[8px] font-bold text-slate-400 text-center">+{dayApps.length - 3} mais</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </motion.div>
          )}

          {/* TAB 2: WHATSAPP INTEGRATION PANEL */}
          {activeTab === 'whatsapp' && (
            <motion.div
              key="tab-whatsapp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* WHATSAPP METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 text-center shadow-3xs space-y-1.5">
                  <h4 className="text-[10px] text-slate-500 font-extrabold uppercase leading-none">Taxa de Confirmação</h4>
                  <p className="text-3xl font-black text-green-600">84.2%</p>
                  <p className="text-[10px] text-slate-400 font-bold">Meta API Webhook Status</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 text-center shadow-3xs space-y-1.5">
                  <h4 className="text-[10px] text-slate-500 font-extrabold uppercase leading-none">Mensagens Entregues</h4>
                  <p className="text-3xl font-black text-slate-800">1.240</p>
                  <span className="text-[9.5px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-150">
                    98.6% Sucesso
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 text-center shadow-3xs space-y-1.5">
                  <h4 className="text-[10px] text-slate-500 font-extrabold uppercase leading-none">Mensagens Lidas</h4>
                  <p className="text-3xl font-black text-teal-600">91.4%</p>
                  <p className="text-[10px] text-slate-400 font-bold">Média de Abertura</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 text-center shadow-3xs space-y-1.5">
                  <h4 className="text-[10px] text-slate-500 font-extrabold uppercase leading-none">Lembretes Programados</h4>
                  <p className="text-3xl font-black text-slate-800">{whatsappReminders.filter(r => r.status === 'scheduled').length}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Fila de Disparo (48h/24h/2h)</p>
                </div>
              </div>

              {/* INTEGRATION VIEW SPLIT */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* REMINDERS LOGS */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs xl:col-span-2 space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-teal-600 animate-pulse" />
                      <h3 className="font-bold text-slate-800 text-sm">Registro de Disparos de Lembretes (BIP)</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
                      <span className="text-[10px] text-slate-500">Filtrar por nome:</span>
                      <input 
                        type="text" 
                        value={whatsappSearch}
                        onChange={e => setWhatsappSearch(e.target.value)}
                        placeholder="Pesquisar..." 
                        className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs text-slate-700 outline-none w-28"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 text-xs">
                    {whatsappReminders
                      .filter(r => r.patient_name.toLowerCase().includes(whatsappSearch.toLowerCase()))
                      .map(rem => (
                        <div 
                          key={rem.id} 
                          onClick={() => setSelectedWhatsAppAppId(rem.appointment_id)}
                          className={`p-3 border rounded-xl flex items-center justify-between gap-4 cursor-pointer transition ${effectiveWhatsAppAppId === rem.appointment_id ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-700 text-sm">{rem.patient_name}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{rem.patient_phone}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex flex-wrap gap-3 font-semibold">
                              <span className="capitalize">📋 Template: <b>{rem.message_template.replace('template_', '')}</b></span>
                              <span>🌐 Idioma: <b className="uppercase">{rem.language}</b></span>
                              {rem.sent_at && <span>Disparo: <b>{rem.sent_at.substring(11, 16)} hs</b></span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {rem.status === 'scheduled' && <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-full font-bold">🟡 Agendado</span>}
                            {rem.status === 'sent' && <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded-full font-bold">🔵 Enviado</span>}
                            {rem.status === 'delivered' && <span className="bg-sky-50 text-sky-700 text-[10px] px-2 py-1 rounded-full font-bold">🔹 Entregue</span>}
                            {rem.status === 'read' && <span className="bg-teal-50 text-teal-700 text-[10px] px-2 py-1 rounded-full font-bold">✔️ Lida</span>}
                            {rem.status === 'confirmed' && <span className="bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold">🟢 Confirmada</span>}
                            {rem.status === 'cancelled' && <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-1 rounded-full font-bold">🔴 Cancelada</span>}
                            {rem.status === 'rescheduled' && <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold">🔶 Remarcada</span>}
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* PHONE SIMULATION PANEL */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs xl:col-span-1 space-y-4">
                  <div className="pb-3 border-b border-slate-100 text-center">
                    <h3 className="font-bold text-slate-800 text-sm">Simulador de WhatsApp (Paciente)</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Veja a interação e force atualizações de agenda.</p>
                  </div>

                  {/* PHONE FRAME */}
                  {(() => {
                    const activeWaApp = appointments.find(a => a.id === effectiveWhatsAppAppId);
                    if (!activeWaApp) {
                      return <p className="text-center text-xs text-slate-400 py-10 font-bold">Selecione um lembrete à esquerda para simular a tela do paciente.</p>;
                    }

                    return (
                      <div className="border-[8px] border-slate-800 rounded-3xl overflow-hidden bg-slate-100 max-w-[280px] mx-auto shadow-md">
                        {/* Status bar */}
                        <div className="bg-teal-800 p-2 text-white text-[9px] font-bold flex justify-between items-center">
                          <span>14:04</span>
                          <div className="flex gap-1 items-center">
                            <span>Signal 📶</span>
                            <span>Battery 🔋</span>
                          </div>
                        </div>

                        {/* WhatsApp Header */}
                        <div className="bg-teal-700 p-2.5 text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center font-extrabold text-[11px] text-white">IM</div>
                          <div>
                            <p className="font-extrabold text-[11px] leading-tight">IAMED Atendimento</p>
                            <p className="text-[8px] text-teal-200">Online</p>
                          </div>
                        </div>

                        {/* Chat Body */}
                        <div className="p-3.5 space-y-3.5 max-h-[300px] overflow-y-auto bg-[#efeae2]">
                          
                          {/* Received Reminder Message bubble */}
                          <div className="bg-white p-2.5 rounded-lg text-[10px] text-slate-800 shadow-3xs max-w-[90%] leading-relaxed">
                            <p className="font-bold text-teal-700 text-[9px] mb-1">🤖 Lembrete Automático</p>
                            <p className="font-semibold text-slate-700">{getWhatsAppMessageText(activeWaApp, whatsappLanguage)}</p>
                            <span className="text-[8px] text-slate-400 block text-right mt-1.5">14:00</span>
                          </div>

                          {/* Bidirectional Interactive buttons simulator */}
                          <div className="space-y-1.5">
                            <p className="text-[8px] text-slate-500 font-extrabold uppercase text-center tracking-wider">Ações do Paciente (Botões Meta API)</p>
                            <button
                              onClick={() => triggerWhatsAppWebhookResponse(activeWaApp.id, 'confirmado')}
                              className="w-full py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Confirmar Consulta
                            </button>
                            <button
                              onClick={() => triggerWhatsAppWebhookResponse(activeWaApp.id, 'cancelado')}
                              className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <PhoneOff className="w-3 h-3" /> Cancelar Consulta
                            </button>
                            <button
                              onClick={() => triggerWhatsAppWebhookResponse(activeWaApp.id, 'remarcado')}
                              className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Solicitar Remarcação
                            </button>
                          </div>

                          {/* Patient message response bubble */}
                          {whatsappReminders.find(r => r.appointment_id === activeWaApp.id)?.response_received && (
                            <div className="bg-[#d9fdd3] p-2 rounded-lg text-[10px] text-slate-800 shadow-3xs max-w-[80%] self-end ml-auto leading-relaxed">
                              <p className="font-bold text-slate-700">Resposta enviada: &quot;{whatsappReminders.find(r => r.appointment_id === activeWaApp.id)?.response_received}&quot;</p>
                              <span className="text-[8px] text-slate-400 block text-right mt-1">14:02 ✔️✔️</span>
                            </div>
                          )}

                        </div>

                        {/* Interactive Language Selector */}
                        <div className="bg-slate-50 border-t border-slate-200 p-2 flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-500">Mudar Idioma:</span>
                          <div className="flex gap-1">
                            <button onClick={() => setWhatsappLanguage('es')} className={`px-1.5 py-0.5 rounded ${whatsappLanguage === 'es' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>ES</button>
                            <button onClick={() => setWhatsappLanguage('gn')} className={`px-1.5 py-0.5 rounded ${whatsappLanguage === 'gn' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GN</button>
                            <button onClick={() => setWhatsappLanguage('pt')} className={`px-1.5 py-0.5 rounded ${whatsappLanguage === 'pt' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>PT</button>
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 3: SMART WAITING LIST */}
          {activeTab === 'waitlist' && (
            <motion.div
              key="tab-waitlist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-6"
            >
              
              {/* ADD WAITLIST FORM */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 mb-1 border-b border-slate-100">
                  <ClipboardList className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Adicionar à Lista de Espera</h3>
                </div>

                <form onSubmit={handleAddToWaitlist} className="space-y-4 text-xs font-semibold">
                  
                  <div>
                    <label className="block text-slate-600 mb-1">Selecionar Paciente *</label>
                    <select
                      value={wlPatientId}
                      onChange={e => setWlPatientId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                      required
                    >
                      <option value="">Selecione o paciente...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.priority.toUpperCase()})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Especialidade Desejada</label>
                    <select
                      value={wlSpecialty}
                      onChange={e => setWlSpecialty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                    >
                      <option value="Cardiologia">Cardiologia</option>
                      <option value="Ortopedia">Ortopedia</option>
                      <option value="Medicina do Trabalho">Medicina do Trabalho</option>
                      <option value="Clínico Geral">Clínico Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Médico Preferencial</label>
                    <select
                      value={wlDoctor}
                      onChange={e => setWlDoctor(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                    >
                      <option value="todos">Qualquer Profissional</option>
                      {professionals.filter(p => p.role === 'Médico(a)').map(prof => (
                        <option key={prof.id} value={prof.name}>{prof.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Critério de Priorização</label>
                    <select
                      value={wlCriteria}
                      onChange={e => setWlCriteria(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                    >
                      <option value="arrival">Ordem de Chegada</option>
                      <option value="urgency">Urgência Clínica (Score Automático)</option>
                      <option value="coverage">Tipo de Cobertura (Particular Prioritário)</option>
                      <option value="seniority">Antiguidade do Paciente</option>
                    </select>
                  </div>

                  {/* Day preferences checkboxes */}
                  <div>
                    <label className="block text-slate-600 mb-1">Preferência de Dias</label>
                    <div className="flex flex-wrap gap-2">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                        <button
                          type="button"
                          key={day}
                          onClick={() => handleWlDayToggle(day)}
                          className={`py-1 px-2.5 rounded-lg border text-[10px] font-bold transition select-none cursor-pointer ${wlDays.includes(day) ? 'bg-teal-600 border-teal-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shift preferences */}
                  <div>
                    <label className="block text-slate-600 mb-1">Preferência de Turno</label>
                    <div className="flex gap-2">
                      {['Manhã', 'Tarde', 'Noite'].map(hour => (
                        <button
                          type="button"
                          key={hour}
                          onClick={() => handleWlHourToggle(hour)}
                          className={`py-1 px-3 rounded-lg border text-[10px] font-bold transition select-none cursor-pointer ${wlHours.includes(hour) ? 'bg-teal-600 border-teal-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        >
                          {hour}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar à Lista
                  </button>

                </form>
              </div>

              {/* LIST OF PRIORITIZED QUEUE */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs xl:col-span-2 space-y-4">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-teal-600 animate-pulse" />
                    <h3 className="font-bold text-slate-800 text-sm">Fila Automática Priorizada</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-full">
                    Ordenado por Algoritmo de Score Clínico
                  </span>
                </div>

                {/* NOTIFICATION WIDGET ON VACANCY SIMULATION */}
                {notifiedWlItem && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex flex-col gap-3 animate-pulse shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="font-bold">Vaga Liberada Encontrada!</p>
                        <p className="font-medium text-amber-700">O slot das 16:00 de Ortopedia/Cardiologia liberou. Notificação enviada para: <b>{notifiedWlItem.patient_name}</b>.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end">
                      <button
                        onClick={confirmWaitlistReallocation}
                        className="py-1 px-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition cursor-pointer text-[10px]"
                      >
                        Simular Confirmação do Paciente
                      </button>
                      <button
                        onClick={() => {
                          setWaitingList(prev => prev.map(w => w.id === notifiedWlItem.id ? { ...w, status: 'aguardando' } : w));
                          setNotifiedWlItem(null);
                        }}
                        className="py-1 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded transition cursor-pointer text-[10px]"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {waitingList.length === 0 ? (
                    <p className="text-center text-slate-400 py-10 font-bold text-xs">A lista de espera está vazia.</p>
                  ) : (
                    waitingList.map((entry, index) => {
                      let rankBadge = 'bg-slate-100 text-slate-500';
                      if (index === 0) rankBadge = 'bg-rose-500 text-white animate-pulse';
                      else if (index === 1) rankBadge = 'bg-amber-500 text-white';
                      else if (index === 2) rankBadge = 'bg-blue-500 text-white';

                      return (
                        <div key={entry.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 transition text-xs font-semibold">
                          <div className="flex items-center gap-3.5">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${rankBadge}`}>
                              {index + 1}
                            </span>
                            
                            <div className="space-y-1">
                              <p className="font-extrabold text-slate-800 text-sm">{entry.patient_name}</p>
                              <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                                <span>Esp: <b className="text-teal-700">{entry.specialty}</b></span>
                                <span>Médico: <b>{entry.doctor_name || 'Qualquer'}</b></span>
                                <span>Dias: <b>{entry.preferred_days.join(', ')}</b></span>
                                <span>Turno: <b>{entry.preferred_hours.join(', ')}</b></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5">
                            <div className="text-right">
                              <p className="text-[10.5px] font-black text-slate-700">Prioridade Score: {entry.priority_score}</p>
                              <p className="text-[9px] text-slate-400 uppercase font-extrabold">Filtro: {entry.priority_criteria}</p>
                            </div>
                            
                            <span className={`px-2 py-0.5 rounded font-black text-[9.5px] capitalize ${
                              entry.status === 'notificado' ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: CALL CENTER CTI */}
          {activeTab === 'callcenter' && (
            <motion.div
              key="tab-callcenter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              
              {/* CALL CENTER TOP CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-semibold">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-3xs">
                  <h4 className="text-[10px] text-slate-400 font-extrabold uppercase">Tempo Médio de Atendimento (TMA)</h4>
                  <p className="text-2xl font-black text-slate-800 mt-1">3m 45s</p>
                  <p className="text-[9px] text-green-600">Meta: &lt; 4m 00s</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-3xs">
                  <h4 className="text-[10px] text-slate-400 font-extrabold uppercase">Taxa de Abandono</h4>
                  <p className="text-2xl font-black text-rose-600 mt-1">4.2%</p>
                  <p className="text-[9px] text-slate-400">Ligaçoes perdidas na fila</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-3xs">
                  <h4 className="text-[10px] text-slate-400 font-extrabold uppercase">Resolução no 1º Contato (FCR)</h4>
                  <p className="text-2xl font-black text-teal-600 mt-1">78.5%</p>
                  <p className="text-[9px] text-green-600">Eficiência Operacional</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-3xs flex flex-col justify-center items-center">
                  <button
                    onClick={simulateIncomingCall}
                    className="w-full bg-[#00a884] hover:bg-[#008f70] text-white font-extrabold text-[11px] uppercase tracking-wide py-2.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" /> Simular Chamada Entrando
                  </button>
                </div>
              </div>

              {/* ACTIVE CALL PANEL CTI */}
              {activeCall && (
                <div className={`p-5 rounded-2xl border text-xs font-semibold shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 transition duration-150 ${activeCall.ringing ? 'bg-amber-50 border-amber-200 animate-pulse' : 'bg-teal-50/20 border-teal-200'}`}>
                  
                  <div className="flex items-center gap-4">
                    {/* Pulsing ring indicator */}
                    <div className={`p-4 rounded-full flex items-center justify-center text-white shadow-md shrink-0 ${activeCall.ringing ? 'bg-amber-500 animate-bounce' : 'bg-teal-600'}`}>
                      <PhoneCall className="w-6 h-6 animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      {activeCall.ringing ? (
                        <p className="text-sm font-extrabold text-amber-800">Chamada Recebida Entrando...</p>
                      ) : (
                        <p className="text-sm font-extrabold text-teal-800">Chamada Ativa em Andamento</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-700">
                        <span>📞 Telefone: <b className="text-slate-800">{activeCall.phone}</b></span>
                        {activeCall.patient ? (
                          <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                            🟢 Paciente Identificado: {activeCall.patient.name} ({activeCall.patient.priority.toUpperCase()})
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            ❓ Contato Não Cadastrado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Controls / Active Call fields */}
                  <div className="flex flex-wrap items-center gap-4 self-end md:self-auto shrink-0 font-sans">
                    {activeCall.ringing ? (
                      <>
                        <button
                          onClick={handleAnswerCall}
                          className="bg-green-600 hover:bg-green-700 text-white font-extrabold py-2 px-4 rounded-xl cursor-pointer shadow-sm transition"
                        >
                          Atender Ligação
                        </button>
                        <button
                          onClick={handleDeclineCall}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2 px-4 rounded-xl cursor-pointer shadow-sm transition"
                        >
                          Rejeitar
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        
                        {/* Call Timer */}
                        <div className="text-center bg-slate-50 border px-3 py-1.5 rounded-lg shrink-0">
                          <p className="text-[9px] text-slate-400 font-extrabold">DURAÇÃO</p>
                          <p className="text-sm font-black text-slate-800">
                            {Math.floor(activeCall.seconds / 60)}:{(activeCall.seconds % 60).toString().padStart(2, '0')}
                          </p>
                        </div>

                        {/* Tipificação */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Motivo (Tipificação)</label>
                          <select
                            value={activeCall.tipificacao}
                            onChange={e => setActiveCall({ ...activeCall, tipificacao: e.target.value as any })}
                            className="bg-slate-50 border p-1 rounded font-bold"
                          >
                            <option value="agendamento">Agendamento de Consulta</option>
                            <option value="cancelamento">Cancelamento de Consulta</option>
                            <option value="remarcação">Remarcação de Consulta</option>
                            <option value="dúvida">Dúvidas Clínicas / Convênios</option>
                            <option value="reclamação">Reclamações / Ouvidoria</option>
                            <option value="financeiro">Financeiro / Faturamento</option>
                            <option value="outros">Outros Motivos</option>
                          </select>
                        </div>

                        {/* Notes */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Notas de Atendimento</label>
                          <input
                            type="text"
                            value={activeCall.notes}
                            onChange={e => setActiveCall({ ...activeCall, notes: e.target.value })}
                            placeholder="Escreva anotações..."
                            className="bg-slate-50 border p-1 rounded font-medium w-48 focus:outline-teal-500"
                          />
                        </div>

                        {/* Encaminhamento */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Encaminhar Área</label>
                          <select
                            value={activeCall.forwardTo}
                            onChange={e => setActiveCall({ ...activeCall, forwardTo: e.target.value })}
                            className="bg-slate-50 border p-1 rounded font-bold"
                          >
                            <option value="Nenhum">Manter comigo</option>
                            <option value="Médico Principal">Médico Responsável</option>
                            <option value="Financeiro">Gestão Financeira</option>
                            <option value="Triagem/Enfermagem">Enfermagem / Triagem</option>
                            <option value="Faturamento">Faturamento SIFEN</option>
                          </select>
                        </div>

                        {/* Save button */}
                        <button
                          onClick={handleSaveCallRecord}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-2.5 px-4 rounded-lg shadow-sm transition shrink-0 self-end cursor-pointer"
                        >
                          Salvar e Encerrar
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* CALL LOGS HISTORICO & PATIENT DETAILS SPLIT */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* INTERACTION LOGS HISTORY */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs xl:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 pb-3 mb-1 border-b border-slate-100">
                    <PhoneCall className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Histórico Consolidado de Interações</h3>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 text-xs">
                    {callLogs.map(log => (
                      <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-700">{log.patient_name}</span>
                            <span className="text-[10px] text-slate-400">{log.patient_phone}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${log.type === 'inbound' ? 'bg-blue-50 text-blue-700' : 'bg-slate-150 text-slate-600'}`}>
                              {log.type === 'inbound' ? 'Entrada' : 'Saída'}
                            </span>
                          </div>
                          
                          <span className="text-[10px] text-slate-400 font-bold">
                            {log.created_at.substring(0, 10).split('-').reverse().join('/')} às {log.created_at.substring(11, 16)} hs
                          </span>
                        </div>

                        <div className="text-[10.5px] text-slate-500 font-semibold flex flex-wrap gap-3 border-b border-slate-200/60 pb-1.5">
                          <span>Tipificação: <b className="text-teal-700 uppercase">{log.reason}</b></span>
                          <span>Atendido por: <b>{log.operator_name}</b></span>
                          <span>Duração: <b>{log.duration_seconds}s</b></span>
                        </div>

                        <p className="text-slate-600 font-medium leading-relaxed italic bg-white p-2 rounded border border-slate-200/40">
                          &quot; {log.notes} &quot;
                        </p>

                        {/* Simulated Audio Recording Player */}
                        {log.recording_url && (
                          <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200 w-fit text-[10px]">
                            <span className="font-extrabold text-slate-500">🔊 Gravação de Ligação:</span>
                            <button
                              onClick={() => alert("Reproduzindo gravação criptografada... (Simulado para auditoria LGPD)")}
                              className="bg-white hover:bg-slate-200 border p-1 rounded flex items-center gap-1 font-bold text-slate-700 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-slate-700" /> Ouvir Áudio (Consentimento Confirmado)
                            </button>
                            <span className="text-slate-400 font-bold">rec_id_{log.id.substring(5)}.mp3</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* PATIENT INFO CARD IF IDENTIFIED */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs xl:col-span-1 space-y-4">
                  <div className="flex items-center gap-2 pb-3 mb-1 border-b border-slate-100">
                    <User className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Ficha CTI do Paciente</h3>
                  </div>

                  {activeCall?.patient ? (
                    <div className="space-y-4 text-xs font-semibold font-sans">
                      
                      <div className="text-center space-y-2">
                        {activeCall.patient.photo_url ? (
                          <img 
                            src={activeCall.patient.photo_url} 
                            alt="Patient Photo" 
                            className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-teal-500 shadow-xs"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-xl border-2 border-teal-500 text-teal-600 font-bold">
                            {activeCall.patient.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">{activeCall.patient.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">ID: {activeCall.patient.id}</p>
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        <div className="flex justify-between border-b pb-1 text-slate-600">
                          <span>Nascimento:</span>
                          <span className="text-slate-800 font-bold">{activeCall.patient.birthdate.split('-').reverse().join('/')}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1 text-slate-600">
                          <span>Prioridade:</span>
                          <span className="text-slate-800 font-extrabold capitalize text-teal-700">{activeCall.patient.priority}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1 text-slate-600">
                          <span>Gênero:</span>
                          <span className="text-slate-800 font-bold">{activeCall.patient.gender}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Convênio:</span>
                          <span className="text-slate-800 font-bold">{activeCall.patient.health_insurance_type || 'Particular'}</span>
                        </div>
                      </div>

                      {/* Active Appointments */}
                      <div className="space-y-2">
                        <h4 className="font-black text-slate-700 text-[10px] uppercase">Consultas Recentes / Futuras</h4>
                        {appointments.filter(a => a.patientId === activeCall.patient?.id).map(a => (
                          <div key={a.id} className="p-2 bg-slate-50 border rounded-lg text-[10px] font-semibold space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-700 font-bold">{a.date.split('-').reverse().slice(0, 2).join('/')} às {a.time.substring(0, 5)} hs</span>
                              <span className="text-teal-600 uppercase font-black">{a.status}</span>
                            </div>
                            <p className="text-slate-500 font-bold">Médico: {a.doctorName} ({a.specialty})</p>
                          </div>
                        ))}
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-bold font-sans">
                      <PhoneCall className="w-8 h-8 mx-auto text-slate-350 mb-2 animate-bounce" />
                      <p>Nenhuma chamada ativa ou paciente identificado para exibição de ficha rápida CTI.</p>
                    </div>
                  )}

                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* -------------------------------------------------------------
          MODALS / BOX DIALOGS
      ------------------------------------------------------------- */}

      {/* 0. NEW APPOINTMENT MODAL */}
      <Dialog open={showNewAppointmentModal} onOpenChange={setShowNewAppointmentModal}>
        <DialogContent className="max-w-md font-sans">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b text-slate-800">
              <Plus className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-sm uppercase">Novo Agendamento</h3>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newApptPatientId || !newApptDoctor) { alert('Selecione paciente e médico.'); return; }
              const patient = patients.find(p => p.id === newApptPatientId);
              const newAppt: Appointment = {
                id: `app_${Date.now()}`,
                patientId: newApptPatientId,
                patientName: patient?.name || '',
                doctorName: newApptDoctor,
                specialty: newApptSpecialty,
                date: newApptDate,
                time: `${newApptTime}:00`,
                status: 'confirmado' as const,
                branch: newApptBranch,
                room: newApptRoom,
                modality: newApptModality,
                type: 'consulta',
              };
              setAppointments(prev => [newAppt, ...prev]);
              addAuditLog('Novo Agendamento', `${newAppt.patientName} - ${newAppt.doctorName} - ${newAppt.date}`);
              setShowNewAppointmentModal(false);
              setNewApptPatientId('');
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Paciente *</label>
                <select value={newApptPatientId} onChange={e => setNewApptPatientId(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold" required>
                  <option value="">Selecionar paciente...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} - {p.health_insurance_type || 'Particular'}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Médico *</label>
                  <select value={newApptDoctor} onChange={e => setNewApptDoctor(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold" required>
                    <option value="">Selecionar...</option>
                    {professionals.filter(p => p.role === 'Médico(a)' && p.status === 'ativo').map(p => <option key={p.id} value={p.name}>{p.name} - {p.specialty}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Especialidade</label>
                  <select value={newApptSpecialty} onChange={e => setNewApptSpecialty(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold">
                    <option value="Clínica Geral">Clínica Geral</option>
                    <option value="Cardiologia">Cardiologia</option>
                    <option value="Ortopedia">Ortopedia</option>
                    <option value="Pediatria">Pediatria</option>
                    <option value="Ginecologia">Ginecologia</option>
                    <option value="Dermatologia">Dermatologia</option>
                    <option value="Medicina do Trabalho">Medicina do Trabalho</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data</label>
                  <input type="date" value={newApptDate} onChange={e => setNewApptDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horário</label>
                  <input type="time" value={newApptTime} onChange={e => setNewApptTime(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Modalidade</label>
                  <select value={newApptModality} onChange={e => setNewApptModality(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold">
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual (Telemedicina)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sede</label>
                  <select value={newApptBranch} onChange={e => setNewApptBranch(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold">
                    <option value="Sede Central">Sede Central</option>
                    <option value="Filial - Centro">Filial - Centro</option>
                    <option value="Filial - Shopping">Filial - Shopping</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer transition">
                  Criar Agendamento
                </button>
                <button type="button" onClick={() => setShowNewAppointmentModal(false)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* 1. RESCHEDULE CONFIRMATION MODAL */}
      <Dialog open={rescheduleTarget !== null} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="max-w-md font-sans">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b text-slate-800">
              <ArrowRightLeft className="w-5 h-5 text-teal-600 animate-spin-slow" />
              <h3 className="font-extrabold text-sm uppercase">Confirmar Remarcação Rápida</h3>
            </div>
            
            {rescheduleTarget && (() => {
              const app = appointments.find(a => a.id === rescheduleTarget.appId);
              if (!app) return null;

              return (
                <div className="text-xs font-semibold text-slate-600 space-y-3 leading-relaxed">
                  <p>Você deseja confirmar a alteração de horário da consulta abaixo?</p>
                  
                  <div className="bg-slate-50 border p-3.5 rounded-xl space-y-1 text-slate-700 shadow-3xs">
                    <p className="text-slate-800 font-extrabold text-sm">{app.patientName}</p>
                    <p className="font-medium">Médico: {app.doctorName} ({app.specialty})</p>
                    <div className="pt-2 mt-2 border-t text-[11px] grid grid-cols-2 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Horário Anterior</span>
                        <span className="font-extrabold text-slate-700 bg-slate-100 py-1 px-2 rounded block mt-1">{app.date} às {app.time.substring(0, 5)} hs</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-teal-600 block uppercase font-bold">Novo Horário</span>
                        <span className="font-extrabold text-teal-700 bg-teal-50 py-1 px-2 rounded block mt-1">{rescheduleTarget.date} às {rescheduleTarget.time} hs</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">Uma mensagem SMS/WhatsApp de notificação será disparada automaticamente para o paciente em {whatsappLanguage.toUpperCase()}.</p>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={confirmRescheduling}
                className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                Confirmar Alteração
              </button>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. BLOCKAGE CREATION MODAL */}
      <Dialog open={showBlockageModal} onOpenChange={setShowBlockageModal}>
        <DialogContent className="max-w-lg font-sans">
          <div className="space-y-4">
            
            <div className="flex items-center gap-2 pb-2.5 border-b text-slate-800">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-extrabold text-sm uppercase">Bloqueio de Horários da Agenda</h3>
            </div>

            {/* Existing Blockages List */}
            <div className="space-y-2">
              <h4 className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider">Bloqueios Ativos</h4>
              <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 text-xs">
                {blockedSlots.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Nenhum bloqueio cadastrado.</p>
                ) : (
                  blockedSlots.map(b => (
                    <div key={b.id} className="p-2.5 bg-slate-50 border rounded-xl flex items-center justify-between gap-3 font-semibold text-slate-700">
                      <div>
                        <p className="text-slate-800 font-bold">{b.description} ({b.reason.toUpperCase()})</p>
                        <p className="text-[9.5px] text-slate-400">
                          Ref: {b.doctor_name || 'Geral'} | Período: {b.start_date.split('-').reverse().join('/')} a {b.end_date.split('-').reverse().join('/')} {b.start_time ? `(${b.start_time} - ${b.end_time})` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteBlockage(b.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Remover Bloqueio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Create blockages form */}
            <form onSubmit={handleCreateBlockage} className="space-y-3.5 text-xs font-semibold">
              <h4 className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider">Novo Registro de Bloqueio</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Médico Associado</label>
                  <select
                    value={blockDoctor}
                    onChange={e => setBlockDoctor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans"
                  >
                    <option value="todos">Todos os Profissionais</option>
                    {professionals.filter(p => p.role === 'Médico(a)').map(doc => (
                      <option key={doc.id} value={doc.name}>{doc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Filial / Sede</label>
                  <select
                    value={blockBranch}
                    onChange={e => setBlockBranch(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans"
                  >
                    <option value="todos">Todas as Sedes</option>
                    <option value="Sede Central">Sede Central (Asunción)</option>
                    <option value="Filial Ciudad del Este">Filial Ciudad del Este</option>
                    <option value="Filial Encarnación">Filial Encarnación</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={blockStartDate}
                    onChange={e => setBlockStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={e => setBlockEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Hora Início (Opcional)</label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={e => setBlockStartTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Hora Fim (Opcional)</label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={e => setBlockEndTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-600 mb-1">Motivo</label>
                  <select
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans"
                  >
                    <option value="férias">Férias</option>
                    <option value="capacitação">Capacitação</option>
                    <option value="emergência">Emergência</option>
                    <option value="feriado">Feriado</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 mb-1">Descrição do Bloqueio</label>
                  <input
                    type="text"
                    value={blockDesc}
                    onChange={e => setBlockDesc(e.target.value)}
                    placeholder="Ex: Capacitação da Equipe ou Licença Médica..."
                    className="w-full p-2 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2.5">
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition cursor-pointer shadow-sm"
                >
                  Registrar Bloqueio
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockageModal(false)}
                  className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>

            </form>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
