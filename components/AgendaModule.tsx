'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Patient, Appointment, Professional } from '@/lib/mockData';
import {
  CalendarDays, ClipboardList, PhoneCall, Plus,
  Trash2, AlertTriangle, CheckCircle, Clock, Check, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, User, Send, ShieldAlert,
  PhoneOff, ArrowRightLeft, Search, Lock, BarChart3, Eye, EyeOff,
  Play, Pause, RotateCcw, MessageSquare, Users, Timer, Phone,
  TrendingUp, TrendingDown, Minus, Zap, Bell, Settings, Filter,
  ChevronDown, X, AlertCircle, CheckCircle2, XCircle, Clock3,
  UserCheck, UserX, MapPin, Stethoscope, Building2, HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PermissionGate, WithPermissions, useUserPermissions } from '@/components/ui/PermissionGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ==============================================================
// INLINE MODAL (avoids Radix Dialog portal/focus issues)
// ==============================================================
function InlineModal({ open, onClose, children, className = '' }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-h-[90vh] overflow-y-auto ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// ==============================================================
// TYPES
// ==============================================================
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

interface BlockedSlot {
  id: string;
  doctor_name: string | null;
  branch: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
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
  preferred_days: string[];
  preferred_hours: string[];
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

// ==============================================================
// CONSTANTS
// ==============================================================
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  'agendado':        { color: 'text-blue-700',     bg: 'bg-blue-100',     border: 'border-blue-300',     label: 'Agendado' },
  'confirmado':      { color: 'text-emerald-700',  bg: 'bg-emerald-100',  border: 'border-emerald-300',  label: 'Confirmado' },
  'pendente':        { color: 'text-amber-700',    bg: 'bg-amber-100',    border: 'border-amber-300',    label: 'Pendente' },
  'em sala de espera': { color: 'text-purple-700', bg: 'bg-purple-100',   border: 'border-purple-300',   label: 'Em Sala de Espera' },
  'em atendimento':  { color: 'text-orange-700',   bg: 'bg-orange-100',   border: 'border-orange-300',   label: 'Em Atendimento' },
  'finalizado':      { color: 'text-slate-700',    bg: 'bg-slate-100',    border: 'border-slate-300',    label: 'Finalizado' },
  'ausente':         { color: 'text-red-700',      bg: 'bg-red-100',      border: 'border-red-300',      label: 'Ausente' },
  'cancelado':       { color: 'text-rose-700',     bg: 'bg-rose-100',     border: 'border-rose-300',     label: 'Cancelado' },
  'remarcado':       { color: 'text-cyan-700',     bg: 'bg-cyan-100',     border: 'border-cyan-300',     label: 'Remarcado' },
  'atendido':        { color: 'text-green-700',    bg: 'bg-green-100',    border: 'border-green-300',    label: 'Atendido' },
};

const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

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

const WHATSAPP_TEMPLATES = [
  { id: 'tpl_1', name: 'Lembrete 48h', hoursBefore: 48, messageEs: 'Hola {nombre}. Le recordamos su consulta con {profesional} el {fecha} a las {hora} en {sede}. Responda: 1=Confirmar, 2=Cancelar, 3=Remarcar', messageGn: 'Hola {nombre}. Rembiapoite upeicha rendaite con {profesional} {fecha} {hora} en {sede}. Jawepy: 1=Jepive, 2=Ñanomboya, 3=Tembiapo ipahague', messagePt: 'Olá {nombre}. Lembramos sua consulta com {profesional} em {fecha} às {hora} em {sede}. Responda: 1=Confirmar, 2=Cancelar, 3=Remarcar' },
  { id: 'tpl_2', name: 'Lembrete 24h', hoursBefore: 24, messageEs: 'Hola {nombre}. Mañana tiene consulta con {profesional} a las {hora} en {sede}. Por favor confirme su asistencia.', messageGn: 'Hola {nombre}. Arange upeicha rendaite con {profesional} {hora} en {sede}. Ikatu peẽ jepive.', messagePt: 'Olá {nombre}. Amanhã você tem consulta com {profesional} às {hora} em {sede}. Por favor confirme.' },
  { id: 'tpl_3', name: 'Lembrete 2h', hoursBefore: 2, messageEs: 'Hola {nombre}. Su consulta con {profesional} es en 2 horas en {sede}. Lo esperamos.', messageGn: 'Hola {nombre}. Upicha rendaite con {profesional} ha e\'ho 2 horas en {sede}. Jaha jave.', messagePt: 'Olá {nombre}. Sua consulta com {profesional} é em 2 horas em {sede}. Aguardamos você.' },
];

const CALL_CENTER_REASONS = [
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'cancelamento', label: 'Cancelamento' },
  { value: 'remarcação', label: 'Remarcação' },
  { value: 'dúvida', label: 'Dúvida' },
  { value: 'reclamação', label: 'Reclamação' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'outros', label: 'Outros' },
];

const APPOINTMENT_TYPES = [
  { value: 'primeira_vez', label: 'Primeira Vez', color: 'bg-blue-100 text-blue-700', icon: '🩺' },
  { value: 'retorno', label: 'Retorno/Controle', color: 'bg-emerald-100 text-emerald-700', icon: '🔄' },
  { value: 'exame_diagnostico', label: 'Exame Diagnóstico', color: 'bg-purple-100 text-purple-700', icon: '🔬' },
  { value: 'procedimento', label: 'Procedimento', color: 'bg-orange-100 text-orange-700', icon: '⚕️' },
  { value: 'telemedicina', label: 'Telemedicina', color: 'bg-cyan-100 text-cyan-700', icon: '📹' },
];

const INSURANCE_TYPES = [
  { value: 'IPS', label: 'IPS', quotaPresencial: 80, quotaVirtual: 20 },
  { value: 'Sanidade Militar', label: 'Sanidade Militar', quotaPresencial: 90, quotaVirtual: 10 },
  { value: 'Sanidade Policial', label: 'Sanidade Policial', quotaPresencial: 85, quotaVirtual: 15 },
  { value: 'Pré-paga', label: 'Pré-paga (EMP)', quotaPresencial: 70, quotaVirtual: 30 },
  { value: 'Seguro Privado', label: 'Seguro Privado', quotaPresencial: 60, quotaVirtual: 40 },
  { value: 'Particular', label: 'Particular', quotaPresencial: 50, quotaVirtual: 50 },
];

const RESOURCES = [
  { id: 'ecg', name: 'Eletrocardiógrafo' },
  { id: 'usg', name: 'Ultrassom' },
  { id: 'rx', name: 'Raio-X' },
  { id: 'oximetro', name: 'Oxímetro' },
  { id: 'nebulizador', name: 'Nebulizador' },
  { id: 'bisturi', name: 'Bisturi Elétrico' },
  { id: 'video_consulta', name: 'Câmera Telemedicina' },
];

const MIN_GAP_OPTIONS = [
  { value: 0, label: 'Sem intervalo' },
  { value: 5, label: '5 minutos' },
  { value: 10, label: '10 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
];

// ==============================================================
// MAIN COMPONENT
// ==============================================================
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
  const userPermissions = useUserPermissions();
  const canEdit = userPermissions?.includes('agenda_edit') || 
                  userPermissions?.includes('admin:*') || 
                  userPermissions?.includes('perform_admit') ||
                  activeRole === 'Administrador(a)' || 
                  activeRole === 'Recepcionista' ||
                  activeRole === 'Gestor' ||
                  activeRole === 'Médico' ||
                  activeRole === 'Diretor Clínico';

  // Tabs
  const [activeTab, setActiveTab] = useState<'calendar' | 'whatsapp' | 'waitlist' | 'callcenter'>('calendar');

  // Calendar states
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  const [calendarGroupBy, setCalendarGroupBy] = useState<'doctor' | 'room' | 'specialty' | 'branch'>('doctor');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Blockage modal
  const [showBlockageModal, setShowBlockageModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ doctor_name: '', branch: '', start_date: '', end_date: '', start_time: '', end_time: '', reason: 'feriado' as BlockedSlot['reason'], description: '' });

  // WhatsApp
  const [reminders, setReminders] = useState<WhatsappReminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({ patient_id: '', patient_name: '', patient_phone: '', appointment_id: '', language: 'es' as 'es' | 'gn' | 'pt', template_id: 'tpl_1' });

  // Waitlist
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({ patient_id: '', patient_name: '', phone: '', specialty: '', doctor_name: '', priority_criteria: 'arrival' as WaitlistEntry['priority_criteria'] });

  // Call Center
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callForm, setCallForm] = useState({ operator_name: activeOperator, patient_id: '', patient_name: '', patient_phone: '', type: 'inbound' as CallLog['type'], reason: 'agendamento' as CallLog['reason'], notes: '', duration_seconds: 0 });
  const [activeCall, setActiveCall] = useState<CallLog | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const callCounterRef = useRef(0);
  const apptCounterRef = useRef(0);

  // Initialize counter from existing appointments to avoid duplicate IDs
  useEffect(() => {
    let maxId = 0;
    appointments.forEach(a => {
      const match = a.id.match(/^agenda_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    });
    if (maxId > apptCounterRef.current) {
      apptCounterRef.current = maxId;
    }
  }, [appointments]);

  // Blocked slots
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  // New appointment modal
  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [newApptForm, setNewApptForm] = useState({
    patient_id: '', patient_name: '', doctor_name: '', specialty: '', date: '', time: '',
    branch: '', room: '', type: 'primeira_vez' as string,
    modality: 'Presencial' as 'Presencial' | 'Virtual',
    insurance: '', insurance_type: '' as string | undefined,
    duration_minutes: 30,
  });
  const [minGapMinutes, setMinGapMinutes] = useState(30);
  const [schedulingConfig, setSchedulingConfig] = useState({ showConfig: false });

  // Edit appointment modal
  const [showEditApptModal, setShowEditApptModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editApptForm, setEditApptForm] = useState({
    patient_id: '', patient_name: '', doctor_name: '', specialty: '', date: '', time: '',
    branch: '', room: '', type: 'primeira_vez' as string,
    modality: 'Presencial' as 'Presencial' | 'Virtual',
    insurance: '', insurance_type: '' as string | undefined,
    duration_minutes: 30,
    status: 'agendado' as Appointment['status'],
  });

  // Dynamic data for locations and rooms
  const [locations, setLocations] = useState<{ id: string; name: string; status: string }[]>([]);
  const [clinicalRooms, setClinicalRooms] = useState<{ id: string; name: string; location_id: string; status: string }[]>([]);

  // ============================================================
  // DATA LOADING
  // ============================================================
  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      try {
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
      } catch (e) {
        console.warn('AgendaModule load error:', e);
      }
    };
    load();
  }, []);

  // Load locations and rooms from Supabase
  useEffect(() => {
    const loadLocationData = async () => {
      if (!supabase) return;
      try {
        const [locRes, roomRes] = await Promise.all([
          supabase.from('locations').select('id, name, status').eq('status', 'ativo').order('name'),
          supabase.from('clinical_rooms').select('id, name, location_id, status').eq('status', 'ativo').order('name'),
        ]);
        if (locRes.data) setLocations(locRes.data);
        if (roomRes.data) setClinicalRooms(roomRes.data);
      } catch (e) {
        console.warn('Location data load error:', e);
      }
    };
    loadLocationData();
  }, []);

  // ============================================================
  // COMPUTED DATA
  // ============================================================
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (calendarView === 'day') return a.date === selectedDate;
      if (calendarView === 'week') {
        const d = new Date(a.date);
        const sel = new Date(selectedDate);
        const diff = (sel.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 7;
      }
      return a.date.substring(0, 7) === selectedDate.substring(0, 7);
    });
  }, [appointments, selectedDate, calendarView]);

  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    filteredAppointments.forEach(a => {
      let key = '';
      if (calendarGroupBy === 'doctor') key = a.doctorName;
      else if (calendarGroupBy === 'room') key = a.room || 'Sem Sala';
      else if (calendarGroupBy === 'specialty') key = a.specialty;
      else {
        const loc = locations.find(l => l.id === a.branch);
        key = loc?.name || a.branch || 'Sem Sede';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    Object.keys(groups).forEach(k => {
      groups[k].sort((a, b) => a.time.localeCompare(b.time));
    });
    return groups;
  }, [filteredAppointments, calendarGroupBy, locations]);

  const isBlocked = useCallback((date: string, time?: string, doctor?: string, branch?: string) => {
    return blockedSlots.some(b => {
      if (date < b.start_date || date > b.end_date) return false;
      if (b.doctor_name && doctor && b.doctor_name !== doctor) return false;
      if (b.branch && branch && b.branch !== branch) return false;
      if (b.start_time && b.end_time && time) {
        if (time < b.start_time || time > b.end_time) return false;
      }
      return true;
    });
  }, [blockedSlots]);

  const hasTimeOverlap = useCallback((date: string, time: string, doctorName: string, room: string, excludeId?: string) => {
    const [h1, m1] = time.split(':').map(Number);
    const startMin = h1 * 60 + m1;
    const dur = newApptForm.duration_minutes || 30;
    const endMin = startMin + dur;
    return appointments.some(a => {
      if (a.id === excludeId) return false;
      if (a.date !== date) return false;
      if (a.status === 'cancelado') return false;
      const [h2, m2] = a.time.split(':').map(Number);
      const aStart = h2 * 60 + m2;
      const aDur = a.duration_minutes || 30;
      const aEnd = aStart + aDur;
      const overlap = startMin < aEnd && endMin > aStart;
      const sameDoctor = doctorName && a.doctorName === doctorName;
      const sameRoom = room && a.room && a.room === room;
      return overlap && (sameDoctor || sameRoom);
    });
  }, [appointments, newApptForm.duration_minutes]);

  const getSlotAvailability = useCallback((date: string, time: string) => {
    const blocked = isBlocked(date, time);
    const overlap = hasTimeOverlap(date, time, '', '');
    if (blocked) return 'blocked';
    if (overlap) return 'occupied';
    return 'available';
  }, [isBlocked, hasTimeOverlap]);

  const weekDates = useMemo(() => {
    const sel = new Date(selectedDate);
    const start = new Date(sel);
    start.setDate(sel.getDate() - sel.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const startPad = (first.getDay() + 6) % 7;
    const days: (string | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return days;
  }, [selectedDate]);

  // Dynamic specialties derived from professionals at the selected sede
  const availableSpecialties = useMemo(() => {
    const specialtySet = new Set<string>();
    professionals.forEach(p => {
      if (p.status !== 'ativo') return;
      if (!p.specialty) return;
      // If sede selected, only show specialties from professionals at that sede
      if (newApptForm.branch && p.locationId && p.locationId !== newApptForm.branch) return;
      specialtySet.add(p.specialty);
    });
    return Array.from(specialtySet).sort();
  }, [professionals, newApptForm.branch]);

  // Dynamic professionals filtered by sede + specialty
  const availableProfessionals = useMemo(() => {
    return professionals.filter(p => {
      if (p.status !== 'ativo') return false;
      // If sede selected, professional MUST have locationId matching the sede
      if (newApptForm.branch) {
        if (!p.locationId || p.locationId !== newApptForm.branch) return false;
      }
      if (newApptForm.specialty && p.specialty !== newApptForm.specialty) return false;
      return true;
    });
  }, [professionals, newApptForm.branch, newApptForm.specialty]);

  // Dynamic rooms filtered by sede
  const availableRooms = useMemo(() => {
    if (!newApptForm.branch) return clinicalRooms;
    return clinicalRooms.filter(r => r.location_id === newApptForm.branch);
  }, [clinicalRooms, newApptForm.branch]);

  // Professionals filtered by sede for blockage form
  const blockProfessionals = useMemo(() => {
    return professionals.filter(p => {
      if (p.status !== 'ativo') return false;
      if (blockForm.branch) {
        if (!p.locationId || p.locationId !== blockForm.branch) return false;
      }
      return true;
    });
  }, [professionals, blockForm.branch]);

  // ============================================================
  // DRAG & DROP
  // ============================================================
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    if (!canEdit) return;
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appId);
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotKey);
  };

  const handleDragLeave = () => setDragOverSlot(null);

  const handleDrop = (e: React.DragEvent, targetDate: string, targetTime: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (!draggedAppId || !canEdit) return;

    const app = appointments.find(a => a.id === draggedAppId);
    if (!app) return;

    if (isBlocked(targetDate, targetTime, app.doctorName, app.branch)) {
      alert('Este horário está bloqueado. Não é possível remarcar.');
      setDraggedAppId(null);
      return;
    }
    if (hasTimeOverlap(targetDate, targetTime, app.doctorName, app.room || '', draggedAppId)) {
      alert('Já existe uma consulta neste horário para este médico/sala.');
      setDraggedAppId(null);
      return;
    }

    setAppointments(prev => prev.map(a =>
      a.id === draggedAppId ? { ...a, date: targetDate, time: targetTime, status: 'remarcado' as const } : a
    ));
    addAuditLog('Remarcação (Drag & Drop)', `${app.patientName}: ${app.date} ${app.time} → ${targetDate} ${targetTime}`);
    setDraggedAppId(null);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverSlot(null);
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleBlockageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBlock: BlockedSlot = {
      id: `block_${Date.now()}`,
      doctor_name: blockForm.doctor_name || null,
      branch: blockForm.branch || null,
      start_date: blockForm.start_date,
      end_date: blockForm.end_date,
      start_time: blockForm.start_time || null,
      end_time: blockForm.end_time || null,
      reason: blockForm.reason,
      description: blockForm.description,
    };
    setBlockedSlots(prev => [...prev, newBlock]);
    addAuditLog('Registrou Bloqueio', `${blockForm.reason} - ${blockForm.description}`);
    if (supabase) await supabase.from('blocked_slots').insert(newBlock);
    setShowBlockageModal(false);
    setBlockForm({ doctor_name: '', branch: '', start_date: '', end_date: '', start_time: '', end_time: '', reason: 'feriado', description: '' });
  };

  const handleDeleteBlockage = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este bloqueio?')) return;
    setBlockedSlots(prev => prev.filter(b => b.id !== id));
    if (supabase) await supabase.from('blocked_slots').delete().eq('id', id);
    addAuditLog('Remoção de Bloqueio', `ID: ${id}`);
  };

  // Edit appointment
  const handleEditAppointment = (appt: Appointment) => {
    setEditingAppt(appt);
    setEditApptForm({
      patient_id: appt.patientId,
      patient_name: appt.patientName,
      doctor_name: appt.doctorName,
      specialty: appt.specialty,
      date: appt.date,
      time: appt.time,
      branch: appt.branch || '',
      room: appt.room || '',
      type: appt.type || 'primeira_vez',
      modality: appt.modality || 'Presencial',
      insurance: appt.insurance || '',
      insurance_type: appt.insurance_type,
      duration_minutes: appt.duration_minutes || 30,
      status: appt.status,
    });
    setShowEditApptModal(true);
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;
    const updated: Appointment = {
      ...editingAppt,
      patientId: editApptForm.patient_id,
      patientName: editApptForm.patient_name,
      doctorName: editApptForm.doctor_name,
      specialty: editApptForm.specialty,
      date: editApptForm.date,
      time: editApptForm.time,
      branch: editApptForm.branch,
      room: editApptForm.room,
      type: editApptForm.type,
      modality: editApptForm.modality,
      insurance: editApptForm.insurance,
      insurance_type: editApptForm.insurance_type,
      duration_minutes: editApptForm.duration_minutes,
      status: editApptForm.status,
    };
    setAppointments(prev => prev.map(a => a.id === editingAppt.id ? updated : a));
    addAuditLog('Editou Agendamento', `${updated.patientName} - ${updated.date} ${updated.time}`);
    if (supabase) {
      const { error } = await supabase.from('appointments').update({
        patient_id: updated.patientId,
        patient_name: updated.patientName,
        doctor_name: updated.doctorName,
        specialty: updated.specialty,
        date: updated.date,
        time: updated.time,
        status: updated.status,
        branch: updated.branch,
        room: updated.room,
        type: updated.type,
        modality: updated.modality,
        insurance: updated.insurance,
        duration_minutes: updated.duration_minutes,
      }).eq('id', editingAppt.id);
      if (error) console.error('[SUPABASE] UPDATE appointment FAILED:', error.message);
    }
    setShowEditApptModal(false);
    setEditingAppt(null);
  };

  // Delete appointment
  const handleDeleteAppointment = async (appt: Appointment) => {
    if (!confirm(`Tem certeza que deseja excluir o agendamento de ${appt.patientName} em ${appt.date} às ${appt.time}?`)) return;
    setAppointments(prev => prev.filter(a => a.id !== appt.id));
    addAuditLog('Excluiu Agendamento', `${appt.patientName} - ${appt.date} ${appt.time}`);
    if (supabase) {
      const { error } = await supabase.from('appointments').delete().eq('id', appt.id);
      if (error) console.error('[SUPABASE] DELETE appointment FAILED:', error.message);
    }
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tpl = WHATSAPP_TEMPLATES.find(t => t.id === reminderForm.template_id);
    const langKey = `message${reminderForm.language.charAt(0).toUpperCase() + reminderForm.language.slice(1)}` as 'messageEs' | 'messageGn' | 'messagePt';
    const newReminder: WhatsappReminder = {
      id: `rem_${Date.now()}`,
      appointment_id: reminderForm.appointment_id,
      patient_name: reminderForm.patient_name,
      patient_phone: reminderForm.patient_phone,
      message_template: tpl ? tpl[langKey] || tpl.messageEs : '',
      language: reminderForm.language,
      status: 'scheduled',
      scheduled_for: new Date(Date.now() + (tpl?.hoursBefore || 48) * 3600000).toISOString(),
      sent_at: null,
      response_received: null,
    };
    setReminders(prev => [...prev, newReminder]);
    addAuditLog('Agendou Lembrete WhatsApp', `Para ${reminderForm.patient_name}`);
    if (supabase) await supabase.from('whatsapp_reminders').insert(newReminder);
    setShowReminderModal(false);
    setReminderForm({ patient_id: '', patient_name: '', patient_phone: '', appointment_id: '', language: 'es', template_id: 'tpl_1' });
  };

  const simulateWhatsAppSend = async (reminderId: string) => {
    setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'sent' as const, sent_at: new Date().toISOString() } : r));
    addAuditLog('WhatsApp Enviado', `Lembrete ${reminderId}`);
    setTimeout(() => {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'delivered' as const } : r));
    }, 2000);
    setTimeout(() => {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'read' as const } : r));
    }, 5000);
  };

  const simulateWhatsAppResponse = async (reminderId: string, response: 'confirmed' | 'cancelled' | 'rescheduled') => {
    setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: response, response_received: response === 'confirmed' ? '1' : response === 'cancelled' ? '2' : '3' } : r));
    if (response === 'confirmed') {
      const rem = reminders.find(r => r.id === reminderId);
      if (rem) {
        setAppointments(prev => prev.map(a =>
          a.id === rem.appointment_id ? { ...a, status: 'confirmado' as const } : a
        ));
        addAuditLog('Paciente confirmou via WhatsApp', rem.patient_name);
      }
    }
  };

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
    if (supabase) await supabase.from('waiting_list').insert(newEntry);
    setShowWaitlistModal(false);
    setWaitlistForm({ patient_id: '', patient_name: '', phone: '', specialty: '', doctor_name: '', priority_criteria: 'arrival' });
  };

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
    if (supabase) await supabase.from('call_center_logs').insert(newCall);
    setShowCallModal(false);
    setCallForm({ operator_name: activeOperator, patient_id: '', patient_name: '', patient_phone: '', type: 'inbound', reason: 'agendamento', notes: '', duration_seconds: 0 });
  };

  const startCall = (patientName: string, phone: string) => {
    callCounterRef.current += 1;
    setActiveCall({
      id: `call_active_${callCounterRef.current}`,
      operator_name: activeOperator,
      patient_id: null,
      patient_name: patientName,
      patient_phone: phone,
      type: 'outbound',
      reason: 'agendamento',
      notes: '',
      duration_seconds: 0,
      recording_url: null,
      created_at: new Date().toISOString(),
    });
    setCallTimer(0);
  };

  const endCall = () => {
    if (!activeCall) return;
    const endedCall = { ...activeCall, duration_seconds: callTimer };
    setCallLogs(prev => [endedCall, ...prev]);
    addAuditLog('Encerrou Ligação', `${activeCall.patient_name} (${callTimer}s)`);
    setActiveCall(null);
    setCallTimer(0);
  };

  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => setCallTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleNewAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApptForm.patient_id) { alert('Selecione o paciente.'); return; }
    if (!newApptForm.branch) { alert('Selecione a sede.'); return; }
    if (!newApptForm.room) { alert('Selecione a sala.'); return; }
    if (!newApptForm.specialty) { alert('Selecione a especialidade.'); return; }
    if (!newApptForm.doctor_name) { alert('Selecione o profissional.'); return; }
    if (!newApptForm.date) { alert('Selecione a data.'); return; }
    if (!newApptForm.time) { alert('Selecione o horário.'); return; }
    if (!newApptForm.insurance_type) { alert('Selecione o convênio/tipo.'); return; }
    if (isBlocked(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.branch)) {
      alert('Este horário está bloqueado para este médico/sede. Escolha outro horário.');
      return;
    }
    if (hasTimeOverlap(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.room)) {
      alert('Já existe uma consulta agendada neste horário para este médico/sala. Verifique a agenda.');
      return;
    }
    if (minGapMinutes > 0) {
      const [h, m] = newApptForm.time.split(':').map(Number);
      const startMin = h * 60 + m;
      const hasGapViolation = appointments.some(a => {
        if (a.date !== newApptForm.date || a.doctorName !== newApptForm.doctor_name || a.status === 'cancelado') return false;
        const [ah, am] = a.time.split(':').map(Number);
        const aStart = ah * 60 + am;
        const diff = Math.abs(startMin - aStart);
        const aDur = a.duration_minutes || 30;
        if (diff < minGapMinutes && diff > 0) return true;
        if (diff === 0) return false;
        return false;
      });
      if (hasGapViolation) {
        alert(`Intervalo mínimo de ${minGapMinutes} minutos entre consultas não respeitado.`);
        return;
      }
    }
    apptCounterRef.current += 1;
    const apptId = `agenda_${apptCounterRef.current}`;
    const newApp: Appointment = {
      id: apptId,
      patientId: newApptForm.patient_id,
      patientName: newApptForm.patient_name,
      doctorName: newApptForm.doctor_name,
      specialty: newApptForm.specialty,
      date: newApptForm.date,
      time: newApptForm.time,
      branch: newApptForm.branch,
      room: newApptForm.room,
      type: newApptForm.type,
      modality: newApptForm.modality,
      insurance: newApptForm.insurance,
      insurance_type: newApptForm.insurance_type,
      duration_minutes: newApptForm.duration_minutes,
      booked_via: 'recepcao',
      status: 'agendado',
    };
    setAppointments(prev => [...prev, newApp]);
    addAuditLog('Criou Agendamento', `${newApptForm.patient_name} - ${newApptForm.date} ${newApptForm.time} (${newApptForm.type})`);
    if (supabase) {
      const { error: agendaInsertError } = await supabase.from('appointments').insert({
        id: apptId,
        patient_id: newApp.patientId,
        patient_name: newApp.patientName,
        doctor_name: newApp.doctorName,
        specialty: newApp.specialty,
        date: newApp.date,
        time: newApp.time,
        status: newApp.status,
        branch: newApp.branch,
        room: newApp.room,
        type: newApp.type,
        modality: newApp.modality,
        insurance: newApp.insurance,
        duration_minutes: newApp.duration_minutes,
      });
      if (agendaInsertError) {
        console.error("[SUPABASE] INSERT appointments from Agenda FAILED:", agendaInsertError.message);
      }
    }
    setShowNewApptModal(false);
    resetNewApptForm();
  };

  const resetNewApptForm = () => {
    setNewApptForm({
      patient_id: '', patient_name: '', doctor_name: '', specialty: '', date: '', time: '',
      branch: '', room: '', type: 'primeira_vez',
      modality: 'Presencial', insurance: '', insurance_type: undefined, duration_minutes: 30,
    });
  };

  // ============================================================
  // CALL CENTER KPIs
  // ============================================================
  const callCenterKPIs = useMemo(() => {
    const total = callLogs.length;
    const inbound = callLogs.filter(c => c.type === 'inbound').length;
    const outbound = callLogs.filter(c => c.type === 'outbound').length;
    const avgDuration = total > 0 ? Math.round(callLogs.reduce((sum, c) => sum + c.duration_seconds, 0) / total) : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCalls = callLogs.filter(c => c.created_at.startsWith(todayStr)).length;
    return { total, inbound, outbound, avgDuration, todayCalls };
  }, [callLogs]);

  const whatsappMetrics = useMemo(() => {
    const total = reminders.length;
    const sent = reminders.filter(r => ['sent', 'delivered', 'read', 'confirmed'].includes(r.status)).length;
    const delivered = reminders.filter(r => ['delivered', 'read', 'confirmed'].includes(r.status)).length;
    const read = reminders.filter(r => ['read', 'confirmed'].includes(r.status)).length;
    const confirmed = reminders.filter(r => r.status === 'confirmed').length;
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, sent, delivered, read, confirmed, rate };
  }, [reminders]);

  // ============================================================
  // RENDER
  // ============================================================
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
          {canEdit && (
            <>
              <button onClick={() => setShowNewApptModal(true)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg flex items-center gap-2 transition">
                <Plus className="w-4 h-4" /> Novo Agendamento
              </button>
              <button onClick={() => setShowBlockageModal(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-2 transition">
                <AlertTriangle className="w-4 h-4" /> Bloqueio
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {([
          { id: 'calendar', label: 'Calendário', icon: CalendarDays, badge: filteredAppointments.length },
          { id: 'whatsapp', label: 'WhatsApp', icon: Send, badge: reminders.length },
          { id: 'waitlist', label: 'Lista Espera', icon: ClipboardList, badge: waitlist.filter(w => w.status === 'aguardando').length },
          { id: 'callcenter', label: 'Call Center', icon: PhoneCall, badge: callLogs.length },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
              }`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ==================== CALENDAR TAB ==================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as const).map(v => (
                <button key={v} onClick={() => setCalendarView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    calendarView === v ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex gap-1">
              {(['doctor', 'room', 'specialty', 'branch'] as const).map(g => (
                <button key={g} onClick={() => setCalendarGroupBy(g)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    calendarGroupBy === g ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {g === 'doctor' ? 'Médico' : g === 'room' ? 'Sala' : g === 'specialty' ? 'Especialidade' : 'Sede'}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - (calendarView === 'day' ? 1 : calendarView === 'week' ? 7 : 30));
                setSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" />
              <button onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + (calendarView === 'day' ? 1 : calendarView === 'week' ? 7 : 30));
                setSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 text-xs font-semibold bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100">
                Hoje
              </button>
            </div>
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 mr-2">Legenda:</span>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg.replace('100', '400')}`} />
                {cfg.label}
              </span>
            ))}
          </div>

          {/* DAY VIEW */}
          {calendarView === 'day' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {Object.keys(groupedAppointments).length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-600">Nenhum agendamento para esta data</p>
                  <p className="text-sm text-slate-400 mt-1">Arraste um agendamento ou crie um novo</p>
                </div>
              ) : (
                Object.entries(groupedAppointments).map(([group, apps]) => (
                  <div key={group} className="border-b border-slate-100 last:border-0">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                      {calendarGroupBy === 'doctor' && <Stethoscope className="w-4 h-4 text-teal-600" />}
                      {calendarGroupBy === 'room' && <MapPin className="w-4 h-4 text-purple-600" />}
                      {calendarGroupBy === 'specialty' && <HeartPulse className="w-4 h-4 text-rose-600" />}
                      {calendarGroupBy === 'branch' && <Building2 className="w-4 h-4 text-blue-600" />}
                      <span className="text-sm font-bold text-slate-700">{group}</span>
                      <span className="text-xs text-slate-400">({apps.length})</span>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {apps.map(app => {
                        const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG['agendado'];
                        const apptType = APPOINTMENT_TYPES.find(t => t.value === app.type);
                        return (
                          <div
                            key={app.id}
                            className={`p-3 rounded-lg border-l-4 ${sc.border} ${sc.bg} hover:bg-white hover:shadow-md transition-all`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {canEdit && (
                                  <span draggable onDragStart={(e) => handleDragStart(e, app.id)} onDragEnd={handleDragEnd} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500" title="Arrastar">⋮⋮</span>
                                )}
                                <span className="text-sm font-bold text-slate-500">{app.time} {app.duration_minutes ? `(${app.duration_minutes}min)` : ''}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                            </div>
                            <p className="text-base font-semibold text-slate-800 truncate">{app.patientName}</p>
                            <p className="text-sm text-slate-500 truncate">{app.doctorName} • {app.specialty}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {apptType && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${apptType.color}`}>
                                  {apptType.icon} {apptType.label}
                                </span>
                              )}
                              {app.modality && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${app.modality === 'Virtual' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {app.modality === 'Virtual' ? '📹 Virtual' : '🏥 Presencial'}
                                </span>
                              )}
                              {app.room && <span className="text-[10px] text-slate-400">📍 {app.room}</span>}
                              {app.resource && <span className="text-[10px] text-slate-400">🔧 {app.resource}</span>}
                              {app.insurance_type && <span className="text-[10px] text-blue-500">🏥 {app.insurance_type}</span>}
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200/50">
                                <button onClick={() => handleEditAppointment(app)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Editar</button>
                                <button onClick={() => handleDeleteAppointment(app)} className="text-sm font-semibold text-rose-500 hover:text-rose-700">Excluir</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* WEEK VIEW */}
          {calendarView === 'week' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <div className="grid grid-cols-7 min-w-[700px]">
                {weekDates.map((date, i) => {
                  const d = new Date(date + 'T12:00:00');
                  const dayApps = filteredAppointments.filter(a => a.date === date).sort((a, b) => a.time.localeCompare(b.time));
                  const isToday = date === new Date().toISOString().split('T')[0];
                  // Group by filter
                  const dayGroups: Record<string, typeof dayApps> = {};
                  dayApps.forEach(app => {
                    let key = '';
                    if (calendarGroupBy === 'doctor') key = app.doctorName;
                    else if (calendarGroupBy === 'room') key = app.room || 'Sem Sala';
                    else if (calendarGroupBy === 'specialty') key = app.specialty;
                    else {
                      const loc = locations.find(l => l.id === app.branch);
                      key = loc?.name || app.branch || 'Sem Sede';
                    }
                    if (!dayGroups[key]) dayGroups[key] = [];
                    dayGroups[key].push(app);
                  });
                  return (
                    <div key={date}
                      onDragOver={(e) => handleDragOver(e, `week_${date}`)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => { e.preventDefault(); handleDrop(e, date, '09:00'); }}
                      className={`border-r border-slate-100 last:border-0 min-h-[200px] ${isToday ? 'bg-teal-50/30' : ''} ${dragOverSlot === `week_${date}` ? 'bg-teal-50 ring-2 ring-teal-300' : ''}`}>
                      <div className={`px-2 py-2 text-center border-b border-slate-100 ${isToday ? 'bg-teal-500 text-white' : 'bg-slate-50'}`}>
                        <p className="text-[10px] font-semibold uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                        <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-800'}`}>{d.getDate()}</p>
                      </div>
                      <div className="p-1 space-y-1">
                        {Object.entries(dayGroups).map(([group, apps]) => (
                          <div key={group}>
                            {Object.keys(dayGroups).length > 1 && (
                              <p className="text-[10px] font-bold text-slate-400 px-1 pt-1 truncate">{group}</p>
                            )}
                            {apps.map(app => {
                              const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG['agendado'];
                              return (
                                <div key={app.id}
                                  className={`p-1.5 rounded text-[11px] border-l-2 ${sc.border} ${sc.bg} hover:bg-white transition-colors`}>
                                  <p className="font-bold truncate">{app.time} {app.patientName.split(' ')[0]}</p>
                                  <p className="text-slate-500 truncate text-[10px]">{app.doctorName.split(' ')[0]}</p>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        {dayApps.length === 0 && <div className="text-[9px] text-slate-300 text-center py-2">—</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MONTH VIEW */}
          {calendarView === 'month' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="px-2 py-2 text-center text-xs font-bold text-slate-500">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((date, i) => {
                  if (!date) return <div key={`pad_${i}`} className="p-2 min-h-[80px] bg-slate-50/50" />;
                  const dayApps = filteredAppointments.filter(a => a.date === date);
                  const isToday = date === new Date().toISOString().split('T')[0];
                  const blocked = isBlocked(date);
                  // Group by filter
                  const dayGroups: Record<string, typeof dayApps> = {};
                  dayApps.forEach(app => {
                    let key = '';
                    if (calendarGroupBy === 'doctor') key = app.doctorName;
                    else if (calendarGroupBy === 'room') key = app.room || 'Sem Sala';
                    else if (calendarGroupBy === 'specialty') key = app.specialty;
                    else {
                      const loc = locations.find(l => l.id === app.branch);
                      key = loc?.name || app.branch || 'Sem Sede';
                    }
                    if (!dayGroups[key]) dayGroups[key] = [];
                    dayGroups[key].push(app);
                  });
                  const groupKeys = Object.keys(dayGroups);
                  return (
                    <div key={date}
                      onDragOver={(e) => handleDragOver(e, `month_${date}`)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => { e.preventDefault(); handleDrop(e, date, '09:00'); }}
                      className={`border-r border-b border-slate-100 p-1 min-h-[80px] ${isToday ? 'bg-teal-50/30' : ''} ${dragOverSlot === `month_${date}` ? 'bg-teal-50 ring-2 ring-teal-300' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isToday ? 'bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                          {new Date(date + 'T12:00:00').getDate()}
                        </span>
                        {blocked && <Lock className="w-3 h-3 text-amber-500" />}
                      </div>
                      <div className="space-y-0.5">
                        {groupKeys.length > 1 ? (
                          groupKeys.slice(0, 2).map(group => (
                            <div key={group} className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                              <span className="text-[10px] text-slate-600 truncate font-semibold">{group} ({dayGroups[group].length})</span>
                            </div>
                          ))
                        ) : (
                          dayApps.slice(0, 3).map(app => {
                            const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG['agendado'];
                            return (
                              <div key={app.id}
                                className={`text-xs px-1 py-0.5 rounded truncate ${sc.bg} ${sc.color} font-semibold hover:bg-white transition-colors`}>
                                {app.time} {app.patientName.split(' ')[0]}
                              </div>
                            );
                          })
                        )}
                        {dayApps.length > 3 && (
                          <p className="text-xs text-slate-400 font-semibold">+{dayApps.length - 3} mais</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Blocked Slots List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Bloqueios de Agenda ({blockedSlots.length})
              </h3>
              {canEdit && (
                <button onClick={() => setShowBlockageModal(true)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition">
                  + Novo Bloqueio
                </button>
              )}
            </div>
            {blockedSlots.length === 0 ? (
              <p className="text-center text-slate-400 py-6">Nenhum bloqueio cadastrado</p>
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
                          {b.doctor_name && ` • ${b.doctor_name}`}
                          {b.branch && ` • ${b.branch}`}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteBlockage(b.id)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">Remover</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== WHATSAPP TAB ==================== */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-4">
          {/* Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: whatsappMetrics.total, icon: Send, color: 'text-slate-600', bg: 'bg-slate-50' },
              { label: 'Enviados', value: whatsappMetrics.sent, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Entregues', value: whatsappMetrics.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Lidos', value: whatsappMetrics.read, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Confirmados', value: `${whatsappMetrics.rate}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            ].map((m, i) => (
              <div key={i} className={`${m.bg} rounded-xl p-3 border border-slate-100`}>
                <div className="flex items-center gap-2 mb-1">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">{m.label}</span>
                </div>
                <p className={`text-xl font-extrabold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Lembretes WhatsApp ({reminders.length})
            </h3>
            <button onClick={() => setShowReminderModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Lembrete
            </button>
          </div>

          {reminders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">Nenhum lembrete agendado</p>
              <p className="text-sm text-slate-400 mt-1">Crie lembretes automáticos para seus pacientes</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Telefone</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Agendamento</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Idioma</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-sm">{r.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{r.patient_phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(r.scheduled_for).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          r.language === 'es' ? 'bg-blue-100 text-blue-700' :
                          r.language === 'gn' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{r.language.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'sent' || r.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          r.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          r.status === 'rescheduled' ? 'bg-cyan-100 text-cyan-700' :
                          r.status === 'read' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {r.status === 'scheduled' && (
                            <button onClick={() => simulateWhatsAppSend(r.id)} className="text-green-600 hover:text-green-800 text-xs font-semibold">Enviar</button>
                          )}
                          {r.status === 'read' && (
                            <>
                              <button onClick={() => simulateWhatsAppResponse(r.id, 'confirmed')} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold">✓</button>
                              <button onClick={() => simulateWhatsAppResponse(r.id, 'cancelled')} className="text-rose-600 hover:text-rose-800 text-xs font-semibold">✗</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== WAITLIST TAB ==================== */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Lista de Espera ({waitlist.length})
            </h3>
            <button onClick={() => setShowWaitlistModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar Paciente
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
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.sort((a, b) => b.priority_score - a.priority_score).map(w => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-sm">{w.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.specialty}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.doctor_name || 'Qualquer'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          w.priority_criteria === 'urgency' ? 'bg-red-100 text-red-700' :
                          w.priority_criteria === 'coverage' ? 'bg-blue-100 text-blue-700' :
                          w.priority_criteria === 'seniority' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {w.priority_criteria === 'arrival' ? 'Chegada' :
                           w.priority_criteria === 'urgency' ? 'Urgência' :
                           w.priority_criteria === 'coverage' ? 'Cobertura' : 'Antiguidade'}
                          {' '}({w.priority_score.toFixed(0)})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          w.status === 'aguardando' ? 'bg-amber-100 text-amber-700' :
                          w.status === 'notificado' ? 'bg-blue-100 text-blue-700' :
                          w.status === 'alocado' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{w.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {w.status === 'aguardando' && (
                          <div className="flex gap-1">
                            <button onClick={() => {
                              setWaitlist(prev => prev.map(e => e.id === w.id ? { ...e, status: 'notificado' } : e));
                              addAuditLog('Notificou paciente da lista de espera', w.patient_name);
                            }} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">Notificar</button>
                            <button onClick={() => {
                              setWaitlist(prev => prev.map(e => e.id === w.id ? { ...e, status: 'alocado' } : e));
                              addAuditLog('Alocou paciente da lista de espera', w.patient_name);
                            }} className="text-green-600 hover:text-green-800 text-xs font-semibold">Alocar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== CALL CENTER TAB ==================== */}
      {activeTab === 'callcenter' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: callCenterKPIs.total, icon: PhoneCall, color: 'text-slate-600', bg: 'bg-slate-50' },
              { label: 'Recebidas', value: callCenterKPIs.inbound, icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Efetuadas', value: callCenterKPIs.outbound, icon: PhoneOff, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Média Duração', value: `${callCenterKPIs.avgDuration}s`, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Hoje', value: callCenterKPIs.todayCalls, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((m, i) => (
              <div key={i} className={`${m.bg} rounded-xl p-3 border border-slate-100`}>
                <div className="flex items-center gap-2 mb-1">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">{m.label}</span>
                </div>
                <p className={`text-xl font-extrabold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Active Call */}
          {activeCall && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <p className="font-bold text-green-800">Chamada Ativa</p>
                  <p className="text-sm text-green-600">{activeCall.patient_name} • {activeCall.patient_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-mono font-bold text-green-700">
                  {Math.floor(callTimer / 60)}:{String(callTimer % 60).padStart(2, '0')}
                </span>
                <button onClick={endCall} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2">
                  <PhoneOff className="w-4 h-4" /> Encerrar
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-rose-600" />
              Histórico de Ligações ({callLogs.length})
            </h3>
            <button onClick={() => setShowCallModal(true)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> Registrar Ligação
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
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {callLogs.slice(0, 50).map(c => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
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
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(c.created_at).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => startCall(c.patient_name, c.patient_phone)} className="text-green-600 hover:text-green-800 text-xs font-semibold">Ligar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* New Appointment Modal */}
      <InlineModal open={showNewApptModal} onClose={() => { setShowNewApptModal(false); resetNewApptForm(); }} className="max-w-2xl">
        <div className="p-6">
        <form onSubmit={handleNewAppointment} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Novo Agendamento</h3>
            </div>


            {/* Paciente */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Paciente *</label>
              <select value={newApptForm.patient_id} onChange={e => {
                const p = patients.find(p => p.id === e.target.value);
                setNewApptForm({ ...newApptForm, patient_id: e.target.value, patient_name: p?.name || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">Selecionar paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Modalidade + Sede + Sala */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Modalidade *</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewApptForm({ ...newApptForm, modality: 'Presencial' })}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition ${
                      newApptForm.modality === 'Presencial' ? 'bg-teal-100 border-teal-400 text-teal-700' : 'bg-white border-slate-200 text-slate-500'
                    }`}>Presencial</button>
                  <button type="button" onClick={() => setNewApptForm({ ...newApptForm, modality: 'Virtual' })}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition ${
                      newApptForm.modality === 'Virtual' ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-slate-200 text-slate-500'
                    }`}>Virtual</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sede *</label>
                <select value={newApptForm.branch} onChange={e => setNewApptForm({ ...newApptForm, branch: e.target.value, room: '', doctor_name: '', specialty: '' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">Selecionar...</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sala *</label>
                <select value={newApptForm.room} onChange={e => setNewApptForm({ ...newApptForm, room: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!newApptForm.branch}>
                  <option value="">{newApptForm.branch ? 'Selecionar...' : 'Selecione a sede'}</option>
                  {availableRooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Especialidade + Profissional */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Especialidade *</label>
                <select value={newApptForm.specialty} onChange={e => setNewApptForm({ ...newApptForm, specialty: e.target.value, doctor_name: '' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!newApptForm.branch}>
                  <option value="">{newApptForm.branch ? 'Selecionar Especialidade' : 'Selecione a sede'}</option>
                  {availableSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Profissional *</label>
                <select value={newApptForm.doctor_name} onChange={e => setNewApptForm({ ...newApptForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!newApptForm.specialty}>
                  <option value="">{newApptForm.specialty ? 'Selecionar Profissional' : 'Selecione a especialidade'}</option>
                  {availableProfessionals.map(p => <option key={p.id} value={p.name}>{p.name} - {p.specialty}</option>)}
                </select>
              </div>
            </div>

            {/* Tipo de Consulta */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Consulta *</label>
              <div className="grid grid-cols-5 gap-1.5">
                {APPOINTMENT_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setNewApptForm({ ...newApptForm, type: t.value })}
                    className={`p-2 rounded-lg border-2 text-center transition text-xs font-semibold ${
                      newApptForm.type === t.value
                        ? `${t.color} border-current`
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    <span className="text-base block">{t.icon}</span>
                    <span className="mt-0.5 block">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data + Horário + Duração */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Data *</label>
                <input type="date" value={newApptForm.date} onChange={e => setNewApptForm({ ...newApptForm, date: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Horário *</label>
                <select value={newApptForm.time} onChange={e => setNewApptForm({ ...newApptForm, time: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!newApptForm.date}>
                  <option value="">Selecionar...</option>
                  {TIME_SLOTS.map(t => {
                    const blocked = isBlocked(newApptForm.date, t, newApptForm.doctor_name, newApptForm.branch);
                    const occupied = hasTimeOverlap(newApptForm.date, t, newApptForm.doctor_name, newApptForm.room);
                    return (
                      <option key={t} value={t} disabled={blocked || occupied} className={blocked || occupied ? 'text-red-400' : ''}>
                        {t} {blocked ? '🔒 Bloqueado' : occupied ? '⛔ Ocupado' : '✓'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Duração</label>
                <select value={newApptForm.duration_minutes} onChange={e => setNewApptForm({ ...newApptForm, duration_minutes: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>
            </div>

            {/* Convênio/Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Convênio/Tipo *</label>
              <select value={newApptForm.insurance_type} onChange={e => {
                const it = INSURANCE_TYPES.find(i => i.value === e.target.value);
                setNewApptForm({ ...newApptForm, insurance_type: e.target.value || undefined, insurance: it?.label || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">Selecionar...</option>
                {INSURANCE_TYPES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>

            {/* Cota Modalidade */}
            {newApptForm.insurance_type && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs font-bold text-blue-700 mb-1">Cota de Modalidade — {newApptForm.insurance_type}</p>
                <div className="flex gap-4">
                  {(() => {
                    const ins = INSURANCE_TYPES.find(i => i.value === newApptForm.insurance_type);
                    if (!ins) return null;
                    const presencialCount = appointments.filter(a => a.insurance_type === newApptForm.insurance_type && a.modality === 'Presencial' && a.date === newApptForm.date).length;
                    const virtualCount = appointments.filter(a => a.insurance_type === newApptForm.insurance_type && a.modality === 'Virtual' && a.date === newApptForm.date).length;
                    return (
                      <>
                        <div>
                          <span className="text-[10px] text-blue-600">Presencial: {presencialCount} vagas usadas</span>
                          <div className="w-24 h-1.5 bg-blue-200 rounded-full mt-0.5">
                            <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (presencialCount / Math.max(1, ins.quotaPresencial)) * 100)}%` }} />
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-blue-600">Virtual: {virtualCount} vagas usadas</span>
                          <div className="w-24 h-1.5 bg-purple-200 rounded-full mt-0.5">
                            <div className="h-1.5 bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (virtualCount / Math.max(1, ins.quotaVirtual)) * 100)}%` }} />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Status Preview */}
            {newApptForm.date && newApptForm.time && newApptForm.doctor_name && (
              <div className={`p-3 rounded-lg border ${
                isBlocked(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.branch)
                  ? 'bg-red-50 border-red-300' :
                hasTimeOverlap(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.room)
                  ? 'bg-amber-50 border-amber-300' :
                'bg-green-50 border-green-300'
              }`}>
                <p className={`text-xs font-bold ${
                  isBlocked(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.branch) ? 'text-red-700' :
                  hasTimeOverlap(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.room) ? 'text-amber-700' :
                  'text-green-700'
                }`}>
                  {isBlocked(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.branch)
                    ? '🔒 Horário bloqueado'
                    : hasTimeOverlap(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.room)
                    ? '⛔ Conflito de horário'
                    : '✓ Horário disponível'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition">Criar Agendamento</button>
              <button type="button" onClick={() => { setShowNewApptModal(false); resetNewApptForm(); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Cancelar</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* Edit Appointment Modal */}
      <InlineModal open={showEditApptModal} onClose={() => { setShowEditApptModal(false); setEditingAppt(null); }} className="max-w-2xl">
        <div className="p-6">
          <form onSubmit={handleUpdateAppointment} className="space-y-4">
            <h3 className="font-bold text-lg">Editar Agendamento</h3>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Status *</label>
              <select value={editApptForm.status} onChange={e => setEditApptForm({ ...editApptForm, status: e.target.value as Appointment['status'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Paciente */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Paciente *</label>
              <select value={editApptForm.patient_id} onChange={e => {
                const p = patients.find(p => p.id === e.target.value);
                setEditApptForm({ ...editApptForm, patient_id: e.target.value, patient_name: p?.name || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">Selecionar paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Sede + Sala */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sede *</label>
                <select value={editApptForm.branch} onChange={e => setEditApptForm({ ...editApptForm, branch: e.target.value, room: '' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">Selecionar sede...</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sala *</label>
                <select value={editApptForm.room} onChange={e => setEditApptForm({ ...editApptForm, room: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!editApptForm.branch}>
                  <option value="">{editApptForm.branch ? 'Selecionar sala...' : 'Selecionar sede primeiro...'}</option>
                  {locations.filter(l => l.id === editApptForm.branch).length > 0 &&
                    clinicalRooms.filter(r => r.location_id === editApptForm.branch).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Especialidade + Profissional */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Especialidade *</label>
                <select value={editApptForm.specialty} onChange={e => setEditApptForm({ ...editApptForm, specialty: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">Selecionar...</option>
                  {availableSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Profissional *</label>
                <select value={editApptForm.doctor_name} onChange={e => setEditApptForm({ ...editApptForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">Selecionar...</option>
                  {availableProfessionals.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Data + Horário + Duração */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Data *</label>
                <input type="date" value={editApptForm.date} onChange={e => setEditApptForm({ ...editApptForm, date: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Horário *</label>
                <select value={editApptForm.time} onChange={e => setEditApptForm({ ...editApptForm, time: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!editApptForm.date}>
                  <option value="">Selecionar...</option>
                  {TIME_SLOTS.map(t => {
                    const occupied = hasTimeOverlap(editApptForm.date, t, editApptForm.doctor_name, editApptForm.room, editingAppt?.id);
                    return (
                      <option key={t} value={t} disabled={occupied} className={occupied ? 'text-red-400' : ''}>
                        {t} {occupied ? '⛔ Ocupado' : '✓'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Duração</label>
                <select value={editApptForm.duration_minutes} onChange={e => setEditApptForm({ ...editApptForm, duration_minutes: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition">Salvar Alterações</button>
              <button type="button" onClick={() => { setShowEditApptModal(false); setEditingAppt(null); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Cancelar</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* Blockage Modal */}
      <InlineModal open={showBlockageModal} onClose={() => setShowBlockageModal(false)} className="max-w-md">
        <div className="p-6">
          <form onSubmit={handleBlockageSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Novo Bloqueio de Agenda</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sede *</label>
                <select value={blockForm.branch} onChange={e => setBlockForm({ ...blockForm, branch: e.target.value, doctor_name: '' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">Selecionar sede...</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Profissionais *</label>
                <select value={blockForm.doctor_name} onChange={e => setBlockForm({ ...blockForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!blockForm.branch}>
                  <option value="">{blockForm.branch ? 'Todos os Profissionais' : 'Selecionar sede primeiro...'}</option>
                  {blockProfessionals.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Início *</label>
                <input type="date" value={blockForm.start_date} onChange={e => setBlockForm({ ...blockForm, start_date: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Fim *</label>
                <input type="date" value={blockForm.end_date} onChange={e => setBlockForm({ ...blockForm, end_date: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Hora Início *</label>
                <input type="time" value={blockForm.start_time} onChange={e => setBlockForm({ ...blockForm, start_time: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Hora Fim *</label>
                <input type="time" value={blockForm.end_time} onChange={e => setBlockForm({ ...blockForm, end_time: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Motivo *</label>
              <select value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value as BlockedSlot['reason'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="feriado">Feriado</option>
                <option value="férias">Férias</option>
                <option value="capacitação">Capacitação</option>
                <option value="emergência">Emergência</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
              <input type="text" value={blockForm.description} onChange={e => setBlockForm({ ...blockForm, description: e.target.value })} placeholder="Ex: Capacitação da Equipe..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">Registrar</button>
              <button type="button" onClick={() => setShowBlockageModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Fechar</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* WhatsApp Reminder Modal */}
      <InlineModal open={showReminderModal} onClose={() => setShowReminderModal(false)} className="max-w-md">
        <div className="p-6">
          <form onSubmit={handleReminderSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Agendar Lembrete WhatsApp</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Paciente</label>
              <select value={reminderForm.patient_id} onChange={e => {
                const p = patients.find(p => p.id === e.target.value);
                setReminderForm({ ...reminderForm, patient_id: e.target.value, patient_name: p?.name || '', patient_phone: p?.phone || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">Selecionar paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Agendamento Vinculado</label>
              <select value={reminderForm.appointment_id} onChange={e => setReminderForm({ ...reminderForm, appointment_id: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">Selecionar agendamento...</option>
                {appointments.filter(a => a.status !== 'cancelado').map(a => (
                  <option key={a.id} value={a.id}>{a.patientName} - {a.date} {a.time} ({a.doctorName})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Idioma</label>
                <select value={reminderForm.language} onChange={e => setReminderForm({ ...reminderForm, language: e.target.value as 'es' | 'gn' | 'pt' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="es">Espanhol</option>
                  <option value="gn">Guarani</option>
                  <option value="pt">Português</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Modelo</label>
                <select value={reminderForm.template_id} onChange={e => setReminderForm({ ...reminderForm, template_id: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {WHATSAPP_TEMPLATES.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name} ({tpl.hoursBefore}h antes)</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 mb-1">Preview da mensagem:</p>
              <p className="text-sm text-slate-700">
                {WHATSAPP_TEMPLATES.find(t => t.id === reminderForm.template_id)?.[
                  `message${reminderForm.language.charAt(0).toUpperCase() + reminderForm.language.slice(1)}` as 'messageEs' | 'messageGn' | 'messagePt'
                ] || 'Selecione um modelo'}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">Agendar</button>
              <button type="button" onClick={() => setShowReminderModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Cancelar</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* Waitlist Modal */}
      <InlineModal open={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} className="max-w-md">
        <div className="p-6">
          <form onSubmit={handleWaitlistSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Adicionar à Lista de Espera</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Paciente</label>
              <select value={waitlistForm.patient_id} onChange={e => {
                const p = patients.find(p => p.id === e.target.value);
                setWaitlistForm({ ...waitlistForm, patient_id: e.target.value, patient_name: p?.name || '', phone: p?.phone || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">Selecionar paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Especialidade</label>
              <input type="text" value={waitlistForm.specialty} onChange={e => setWaitlistForm({ ...waitlistForm, specialty: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Médico Preferido</label>
              <select value={waitlistForm.doctor_name} onChange={e => setWaitlistForm({ ...waitlistForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">Qualquer médico</option>
                {professionals.filter(p => p.role === 'Médico(a)').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Critério de Prioridade</label>
              <select value={waitlistForm.priority_criteria} onChange={e => setWaitlistForm({ ...waitlistForm, priority_criteria: e.target.value as WaitlistEntry['priority_criteria'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="arrival">Ordem de Chegada</option>
                <option value="urgency">Urgência Clínica</option>
                <option value="coverage">Tipo de Cobertura</option>
                <option value="seniority">Antiguidade do Paciente</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">Adicionar</button>
              <button type="button" onClick={() => setShowWaitlistModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Cancelar</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* Call Center Modal */}
      <InlineModal open={showCallModal} onClose={() => setShowCallModal(false)} className="max-w-md">
        <div className="p-6">
          <form onSubmit={handleCallSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Registrar Ligação</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Paciente</label>
              <select value={callForm.patient_id} onChange={e => {
                const p = patients.find(p => p.id === e.target.value);
                setCallForm({ ...callForm, patient_id: e.target.value, patient_name: p?.name || '', patient_phone: p?.phone || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">Selecionar paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
                <select value={callForm.type} onChange={e => setCallForm({ ...callForm, type: e.target.value as CallLog['type'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="inbound">Recebida</option>
                  <option value="outbound">Efetuada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Motivo</label>
                <select value={callForm.reason} onChange={e => setCallForm({ ...callForm, reason: e.target.value as CallLog['reason'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {CALL_CENTER_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
              <textarea value={callForm.notes} onChange={e => setCallForm({ ...callForm, notes: e.target.value })} rows={3} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition">Registrar</button>
              <button type="button" onClick={() => setShowCallModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">Cancelar</button>
            </div>
          </form>
        </div>
      </InlineModal>
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
