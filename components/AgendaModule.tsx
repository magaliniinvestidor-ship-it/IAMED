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
  UserCheck, UserX, MapPin, Stethoscope, Building2, HeartPulse,
  UserPlus, Camera, Upload, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PermissionGate, WithPermissions, useUserPermissions } from '@/components/ui/PermissionGate';
import { Button } from '@/components/ui/button';
import PhoneInput from '@/components/PhoneInput';
import I18nDatePicker from '@/components/I18nDatePicker';
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
// PATIENT CARD (Cadastro de Pacientes)
// ==============================================================
function ClinicPatientCard({
  cp,
  locale,
  t,
  canEdit,
  onEdit,
  onDelete,
}: {
  cp: ClinicPatient;
  locale: string;
  t: (key: string, ns?: string) => string;
  canEdit: boolean;
  onEdit: (cp: ClinicPatient) => void;
  onDelete: (cp: ClinicPatient) => void;
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        {cp.photo_url ? (
          <img src={cp.photo_url} alt={cp.name} className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
            {cp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-800 truncate">{cp.name}</p>
          {cp.birth_date && (() => {
            const today = new Date();
            const birth = new Date(cp.birth_date);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            return <p className="text-xs text-slate-500">{t('agenda_birth_date', 'app')} {new Date(cp.birth_date).toLocaleDateString(locale)} ({age} {t('agenda_years', 'app')})</p>;
          })()}
          {cp.gender && <p className="text-xs text-slate-500">{t('agenda_gender', 'app')} {cp.gender}</p>}
          {cp.phone && <p className="text-xs text-slate-500">{t('agenda_phone', 'app')} {cp.phone}</p>}
          {cp.preferred_language && <p className="text-xs text-slate-500">{t('agenda_preferred_language', 'app')} {cp.preferred_language === 'es' ? 'Espanhol' : cp.preferred_language === 'es-AR' ? 'Espanhol (Argentina)' : cp.preferred_language === 'es-PY' ? 'Espanhol (Paraguay)' : cp.preferred_language === 'gn' ? 'Guarani' : cp.preferred_language === 'pt-BR' ? 'Português (Brasil)' : cp.preferred_language === 'pt-PT' ? 'Português (Portugal)' : cp.preferred_language === 'en' ? 'English' : cp.preferred_language === 'outros' ? 'Outros' : cp.preferred_language}</p>}
          {cp.allergies && <p className="text-xs text-slate-500 truncate" title={cp.allergies}>{t('agenda_allergies', 'app')} {cp.allergies}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
        {cp.insurance_type && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">{cp.insurance_type}</span>
        )}
        <div className="flex-1" />
        {canEdit && (
          <>
            <button onClick={() => onEdit(cp)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">{t('agenda_edit', 'app')}</button>
            <button onClick={() => onDelete(cp)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">{t('agenda_delete', 'app')}</button>
          </>
        )}
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
  branch: string;
  specialty: string;
  doctor_name: string | null;
  priority_criteria: 'arrival' | 'urgency' | 'coverage' | 'seniority';
  priority_score: number;
  preferred_days: string[];
  preferred_hours: string[];
  allocated_date: string | null;
  allocated_time: string | null;
  notified_date: string | null;
  notified_time: string | null;
  status: 'aguardando' | 'notificado' | 'alocado' | 'cancelado';
  appointment_id: string | null;
  created_at: string;
}

interface WhatsappReminder {
  id: string;
  appointment_id: string | null;
  patient_name: string;
  patient_phone: string;
  message_template: string;
  language: 'es' | 'gn' | 'pt' | 'pt-BR' | 'pt-PT' | 'es-AR' | 'es-PY' | 'en';
  status: 'scheduled' | 'sent' | 'delivered' | 'read' | 'confirmed' | 'cancelled' | 'rescheduled';
  scheduled_for: string;
  sent_at: string | null;
  response_received: string | null;
  created_at: string;
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
// CLINIC PATIENT (Pacientes de consultas clínicas)
// ==============================================================
export interface ClinicPatient {
  id: string;
  name: string;
  document_type: string;
  document_number: string;
  birth_date: string;
  gender: string;
  nationality: string;
  civil_status: string;
  photo_url: string | null;
  phone: string;
  email: string;
  address_department: string;
  address_district: string;
  address_city: string;
  address_neighborhood: string;
  address_street: string;
  address_number: string;
  country: string;
  insurance_type: string;
  insurance_number: string;
  preferred_language: string;
  allergies: string;
  responsible_name: string;
  responsible_document_type: string;
  responsible_document_number: string;
  responsible_phone: string;
  responsible_relationship: string;
  whatsapp_verified: boolean;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================
// CONSTANTS
// ==============================================================
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; labelKey: string }> = {
  'agendado':        { color: 'text-blue-700',     bg: 'bg-blue-100',     border: 'border-blue-300',     labelKey: 'agenda_status_scheduled' },
  'confirmado':      { color: 'text-emerald-700',  bg: 'bg-emerald-100',  border: 'border-emerald-300',  labelKey: 'agenda_status_confirmed' },
  'pendente':        { color: 'text-amber-700',    bg: 'bg-amber-100',    border: 'border-amber-300',    labelKey: 'agenda_status_pending' },
  'em sala de espera': { color: 'text-purple-700', bg: 'bg-purple-100',   border: 'border-purple-300',   labelKey: 'agenda_status_in_waiting_room' },
  'em atendimento':  { color: 'text-orange-700',   bg: 'bg-orange-100',   border: 'border-orange-300',   labelKey: 'agenda_status_in_attendance' },
  'finalizado':      { color: 'text-slate-700',    bg: 'bg-slate-100',    border: 'border-slate-300',    labelKey: 'agenda_status_finished' },
  'ausente':         { color: 'text-red-700',      bg: 'bg-red-100',      border: 'border-red-300',      labelKey: 'agenda_status_absent' },
  'cancelado':       { color: 'text-rose-700',     bg: 'bg-rose-100',     border: 'border-rose-300',     labelKey: 'agenda_status_cancelled' },
  'remarcado':       { color: 'text-cyan-700',     bg: 'bg-cyan-100',     border: 'border-cyan-300',     labelKey: 'agenda_status_rescheduled' },
  'atendido':        { color: 'text-green-700',    bg: 'bg-green-100',    border: 'border-green-300',    labelKey: 'agenda_status_attended' },
};

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

const normalizeTime = (t: string) => {
  if (!t) return '';
  const parts = t.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
};

const getLangMessageKey = (lang: string): 'messageEs' | 'messageGn' | 'messagePt' | 'messageEn' => {
  if (lang === 'gn') return 'messageGn';
  if (lang === 'en') return 'messageEn';
  if (lang.startsWith('pt')) return 'messagePt';
  return 'messageEs';
};

const isTimeSlotTaken = (
  date: string,
  time: string,
  doctorName: string,
  appointments: Appointment[],
  waitlist: WaitlistEntry[],
  excludeWaitlistId?: string
): boolean => {
  const normalizedTime = normalizeTime(time);
  const takenByAppt = appointments.some(a => a.date === date && normalizeTime(a.time) === normalizedTime && a.doctorName === doctorName && a.status !== 'cancelado');
  const takenByWaitlist = waitlist.some(w => {
    if (excludeWaitlistId && w.id === excludeWaitlistId) return false;
    if (w.status !== 'notificado') return false;
    if (w.doctor_name !== doctorName) return false;
    if (w.notified_date !== date) return false;
    if (!w.notified_time) return false;
    return normalizeTime(w.notified_time) === normalizedTime;
  });
  return takenByAppt || takenByWaitlist;
};

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
  { id: 'tpl_1', nameKey: 'agenda_reminder_48h', hoursBefore: 48, messageEs: 'Hola {nombre}. Le recordamos su consulta con {profesional} el {fecha} a las {hora} en {sede}. Responda: 1=Confirmar, 2=Cancelar, 3=Remarcar', messageGn: 'Hola {nombre}. Rembiapoite upeicha rendaite con {profesional} {fecha} {hora} en {sede}. Jawepy: 1=Jepive, 2=Ñanomboya, 3=Tembiapo ipahague', messagePt: 'Olá {nombre}. Lembramos sua consulta com {profesional} em {fecha} às {hora} em {sede}. Responda: 1=Confirmar, 2=Cancelar, 3=Remarcar', messageEn: 'Hello {nombre}. We remind you of your appointment with {profesional} on {fecha} at {hora} at {sede}. Reply: 1=Confirm, 2=Cancel, 3=Reschedule' },
  { id: 'tpl_2', nameKey: 'agenda_reminder_24h', hoursBefore: 24, messageEs: 'Hola {nombre}. Mañana tiene consulta con {profesional} a las {hora} en {sede}. Por favor confirme su asistencia.', messageGn: 'Hola {nombre}. Arange upeicha rendaite con {profesional} {hora} en {sede}. Ikatu peẽ jepive.', messagePt: 'Olá {nombre}. Amanhã você tem consulta com {profesional} às {hora} em {sede}. Por favor confirme.', messageEn: 'Hello {nombre}. You have an appointment with {profesional} tomorrow at {hora} at {sede}. Please confirm.' },
  { id: 'tpl_3', nameKey: 'agenda_reminder_2h', hoursBefore: 2, messageEs: 'Hola {nombre}. Su consulta con {profesional} es en 2 horas en {sede}. Lo esperamos.', messageGn: 'Hola {nombre}. Upicha rendaite con {profesional} ha e\'ho 2 horas en {sede}. Jaha jave.', messagePt: 'Olá {nombre}. Sua consulta com {profesional} é em 2 horas em {sede}. Aguardamos você.', messageEn: 'Hello {nombre}. Your appointment with {profesional} is in 2 hours at {sede}. We look forward to seeing you.' },
];

const CALL_CENTER_REASONS = [
  { value: 'agendamento', labelKey: 'agenda_reason_scheduling' },
  { value: 'cancelamento', labelKey: 'agenda_reason_cancellation' },
  { value: 'remarcação', labelKey: 'agenda_reason_reschedule' },
  { value: 'dúvida', labelKey: 'agenda_reason_question' },
  { value: 'reclamação', labelKey: 'agenda_reason_complaint' },
  { value: 'financeiro', labelKey: 'agenda_reason_financial' },
  { value: 'outros', labelKey: 'agenda_reason_others' },
];

const APPOINTMENT_TYPES = [
  { value: 'primeira_vez', labelKey: 'agenda_appt_type_first_visit', color: 'bg-blue-100 text-blue-700', icon: '🩺' },
  { value: 'retorno', labelKey: 'agenda_appt_type_return', color: 'bg-emerald-100 text-emerald-700', icon: '🔄' },
  { value: 'exame_diagnostico', labelKey: 'agenda_appt_type_diagnostic', color: 'bg-purple-100 text-purple-700', icon: '🔬' },
  { value: 'procedimento', labelKey: 'agenda_appt_type_procedure', color: 'bg-orange-100 text-orange-700', icon: '⚕️' },
  { value: 'telemedicina', labelKey: 'agenda_appt_type_telemedicine', color: 'bg-cyan-100 text-cyan-700', icon: '📹' },
];

const INSURANCE_TYPES = [
  { value: 'IPS', labelKey: 'agenda_ins_type_ips', quotaPresencial: 80, quotaVirtual: 20 },
  { value: 'Sanidade Militar', labelKey: 'agenda_ins_type_military', quotaPresencial: 90, quotaVirtual: 10 },
  { value: 'Sanidade Policial', labelKey: 'agenda_ins_type_police', quotaPresencial: 85, quotaVirtual: 15 },
  { value: 'Pré-paga', labelKey: 'agenda_ins_type_prepaid', quotaPresencial: 70, quotaVirtual: 30 },
  { value: 'Seguro Privado', labelKey: 'agenda_ins_type_private', quotaPresencial: 60, quotaVirtual: 40 },
  { value: 'Particular', labelKey: 'agenda_ins_type_particular', quotaPresencial: 50, quotaVirtual: 50 },
];

const RESOURCES = [
  { id: 'ecg', nameKey: 'agenda_res_ecg' },
  { id: 'usg', nameKey: 'agenda_res_ultrasound' },
  { id: 'rx', nameKey: 'agenda_res_xray' },
  { id: 'oximetro', nameKey: 'agenda_res_oximeter' },
  { id: 'nebulizador', nameKey: 'agenda_res_nebulizer' },
  { id: 'bisturi', nameKey: 'agenda_res_bistoury' },
  { id: 'video_consulta', nameKey: 'agenda_res_telemed_camera' },
];

const MIN_GAP_OPTIONS = [
  { value: 0, labelKey: 'agenda_gap_none' },
  { value: 5, labelKey: 'agenda_gap_5min' },
  { value: 10, labelKey: 'agenda_gap_10min' },
  { value: 15, labelKey: 'agenda_gap_15min' },
  { value: 30, labelKey: 'agenda_gap_30min' },
  { value: 60, labelKey: 'agenda_gap_1h' },
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

  // Clinic Patients (Cadastro)
  const [clinicPatients, setClinicPatients] = useState<ClinicPatient[]>([]);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [editingClinicPatient, setEditingClinicPatient] = useState<ClinicPatient | null>(null);
  const [clinicPatientSearch, setClinicPatientSearch] = useState('');
  const [clinicPatientSort, setClinicPatientSort] = useState<'name_asc' | 'name_desc' | 'recent' | 'oldest'>('name_asc');
  const [clinicPatientVisibleCount, setClinicPatientVisibleCount] = useState(3);
  const [clinicPatientFormTab, setClinicPatientFormTab] = useState<'identification' | 'contact' | 'complementary' | 'guardian'>('identification');
  const [cpForm, setCpForm] = useState({
    name: '', document_type: '', document_number: '', birth_date: '', gender: '',
    nationality: '', civil_status: '', photo_url: '',
    phone: '', email: '',
    address_department: '', address_district: '', address_city: '', address_neighborhood: '', address_street: '', address_number: '', country: 'Paraguai',
    insurance_type: '', insurance_number: '', preferred_language: '', allergies: '',
    responsible_name: '', responsible_document_type: '', responsible_document_number: '', responsible_phone: '', responsible_relationship: '',
    whatsapp_verified: false,
    notes: '',
  });
  const [cpIsCameraActive, setCpIsCameraActive] = useState(false);
  const [cpCameraCountdown, setCpCameraCountdown] = useState<number | null>(null);
  const [cpWebcamPlaceholder, setCpWebcamPlaceholder] = useState<string | null>(null);
  const cpVideoRef = useRef<HTMLVideoElement>(null);
  const cpCanvasRef = useRef<HTMLCanvasElement>(null);
  const cpStreamRef = useRef<MediaStream | null>(null);
  const cpPhotoCounterRef = useRef(0);
  const cpPendingCaptureRef = useRef<'real' | 'simulation' | null>(null);
  const cpSimulationFileRef = useRef('');

  // Patient search in appointment form
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'register' | 'calendar' | 'whatsapp' | 'waitlist' | 'callcenter'>('register');

  // Calendar states
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  const [calendarGroupBy, setCalendarGroupBy] = useState<'doctor' | 'room' | 'specialty' | 'branch'>('doctor');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Calendar cascade filters
  const [calendarFilterBranch, setCalendarFilterBranch] = useState('');
  const [calendarFilterSpecialty, setCalendarFilterSpecialty] = useState('');
  const [calendarFilterRoom, setCalendarFilterRoom] = useState('');
  const [calendarFilterDoctor, setCalendarFilterDoctor] = useState('');

  // Blockage modal
  const [showBlockageModal, setShowBlockageModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ doctor_name: '', branch: '', start_date: '', end_date: '', start_time: '', end_time: '', reason: 'feriado' as BlockedSlot['reason'], description: '' });

  // WhatsApp
  const [reminders, setReminders] = useState<WhatsappReminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({ patient_id: '', patient_name: '', patient_phone: '', appointment_id: '', language: '' as '' | 'es' | 'gn' | 'pt' | 'pt-BR' | 'pt-PT' | 'es-AR' | 'es-PY' | 'en', template_id: '' });

  // Waitlist
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({ patient_id: '', patient_name: '', phone: '', branch: '', specialty: '', doctor_name: '', priority_criteria: 'arrival' as WaitlistEntry['priority_criteria'], preferred_days: [] as string[], preferred_hours: [] as string[] });

  // Waitlist - Notify modal
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEntry, setNotifyEntry] = useState<WaitlistEntry | null>(null);
  const [notifyTemplate, setNotifyTemplate] = useState('');
  const [notifyLanguage, setNotifyLanguage] = useState<'' | 'es' | 'gn' | 'pt' | 'pt-BR' | 'pt-PT' | 'es-AR' | 'es-PY' | 'en'>('');
  const [notifyAppointmentId, setNotifyAppointmentId] = useState('');
  const [notifyConsultDate, setNotifyConsultDate] = useState('');
  const [notifyConsultTime, setNotifyConsultTime] = useState('');

  // Waitlist - Allocate modal
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateEntry, setAllocateEntry] = useState<WaitlistEntry | null>(null);
  const [allocateDate, setAllocateDate] = useState('');
  const [allocateTime, setAllocateTime] = useState('');
  const [allocateDoctor, setAllocateDoctor] = useState('');

  // Waitlist - Edit modal
  const [showEditWaitlistModal, setShowEditWaitlistModal] = useState(false);
  const [editingWaitlistEntry, setEditingWaitlistEntry] = useState<WaitlistEntry | null>(null);
  const [editWaitlistForm, setEditWaitlistForm] = useState({ patient_id: '', patient_name: '', phone: '', branch: '', specialty: '', doctor_name: '', priority_criteria: 'arrival' as WaitlistEntry['priority_criteria'], status: 'aguardando' as WaitlistEntry['status'], preferred_days: [] as string[], preferred_hours: [] as string[], allocated_date: '' as string | null, allocated_time: '' as string | null });

  // Waitlist cascade filters
  const [waitlistFilterBranch, setWaitlistFilterBranch] = useState('');
  const [waitlistFilterSpecialty, setWaitlistFilterSpecialty] = useState('');
  const [waitlistFilterDoctor, setWaitlistFilterDoctor] = useState('');

  // Waitlist date filter
  const [waitlistDateView, setWaitlistDateView] = useState<'day' | 'week' | 'month'>('day');
  const [waitlistSelectedDate, setWaitlistSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // WhatsApp date filter
  const [whatsappDateView, setWhatsappDateView] = useState<'day' | 'week' | 'month'>('day');
  const [whatsappSelectedDate, setWhatsappSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Call Center
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callForm, setCallForm] = useState({ operator_name: activeOperator, patient_id: '', patient_name: '', patient_phone: '', type: '' as '' | CallLog['type'], reason: '' as '' | CallLog['reason'], notes: '', duration_seconds: 0 });
  const [activeCall, setActiveCall] = useState<CallLog | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callDateView, setCallDateView] = useState<'day' | 'week' | 'month'>('day');
  const [callSelectedDate, setCallSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const callCounterRef = useRef(0);
  const apptCounterRef = useRef(0);
  const waitlistCounterRef = useRef(0);
  const reminderCounterRef = useRef(0);

  // Initialize counters from existing data to avoid duplicate IDs
  useEffect(() => {
    let maxApptId = 0;
    let maxWlId = 0;
    let maxRemId = 0;
    let maxCallId = 0;
    appointments.forEach(a => {
      const match = a.id.match(/^agenda_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxApptId) maxApptId = num;
      }
    });
    waitlist.forEach(w => {
      const match = w.id.match(/^wl_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxWlId) maxWlId = num;
      }
    });
    reminders.forEach(r => {
      const match = r.id.match(/^rem_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxRemId) maxRemId = num;
      }
    });
    callLogs.forEach(c => {
      const match = c.id.match(/^call_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxCallId) maxCallId = num;
      }
    });
    if (maxApptId > apptCounterRef.current) apptCounterRef.current = maxApptId;
    if (maxWlId > waitlistCounterRef.current) waitlistCounterRef.current = maxWlId;
    if (maxRemId > reminderCounterRef.current) reminderCounterRef.current = maxRemId;
    if (maxCallId > callCounterRef.current) callCounterRef.current = maxCallId;
  }, [appointments, waitlist, reminders, callLogs]);

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

  // Load clinic_patients from Supabase
  useEffect(() => {
    const loadClinicPatients = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('clinic_patients').select('*').eq('status', 'ativo').order('name');
        if (data) setClinicPatients(data);
        if (error) console.warn('[SUPABASE] load clinic_patients error:', error.message);
      } catch (e) {
        console.warn('clinic_patients load error:', e);
      }
    };
    loadClinicPatients();
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
      // Date filter
      if (calendarView === 'day') {
        if (a.date !== selectedDate) return false;
      } else if (calendarView === 'week') {
        const d = new Date(a.date);
        const sel = new Date(selectedDate);
        const diff = (sel.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        if (!(diff >= 0 && diff < 7)) return false;
      } else {
        if (a.date.substring(0, 7) !== selectedDate.substring(0, 7)) return false;
      }
      // Cascade filters
      if (calendarFilterBranch && a.branch !== calendarFilterBranch) return false;
      if (calendarFilterSpecialty && a.specialty !== calendarFilterSpecialty) return false;
      if (calendarFilterRoom && a.room !== calendarFilterRoom) return false;
      if (calendarFilterDoctor && a.doctorName !== calendarFilterDoctor) return false;
      return true;
    });
  }, [appointments, selectedDate, calendarView, calendarFilterBranch, calendarFilterSpecialty, calendarFilterRoom, calendarFilterDoctor]);

  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    filteredAppointments.forEach(a => {
      let key = '';
      if (calendarGroupBy === 'doctor') key = a.doctorName;
      else if (calendarGroupBy === 'room') key = a.room || t('agenda_no_room', 'app');
      else if (calendarGroupBy === 'specialty') key = a.specialty;
      else {
        const loc = locations.find(l => l.id === a.branch);
        key = loc?.name || a.branch || t('agenda_no_branch', 'app');
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

  // ============================================================
  // CALENDAR CASCADE FILTERS
  // ============================================================
  // Specialties available for calendar filter (based on selected branch)
  const calendarAvailableSpecialties = useMemo(() => {
    const specialtySet = new Set<string>();
    professionals.forEach(p => {
      if (p.status !== 'ativo' || !p.specialty) return;
      if (calendarFilterBranch && p.locationId && p.locationId !== calendarFilterBranch) return;
      specialtySet.add(p.specialty);
    });
    return Array.from(specialtySet).sort();
  }, [professionals, calendarFilterBranch]);

  // Rooms available for calendar filter (based on selected branch)
  const calendarAvailableRooms = useMemo(() => {
    if (!calendarFilterBranch) return clinicalRooms;
    return clinicalRooms.filter(r => r.location_id === calendarFilterBranch);
  }, [clinicalRooms, calendarFilterBranch]);

  // Professionals available for calendar filter (based on branch + specialty)
  const calendarAvailableDoctors = useMemo(() => {
    return professionals.filter(p => {
      if (p.status !== 'ativo') return false;
      if (calendarFilterBranch && p.locationId && p.locationId !== calendarFilterBranch) return false;
      if (calendarFilterSpecialty && p.specialty !== calendarFilterSpecialty) return false;
      return true;
    });
  }, [professionals, calendarFilterBranch, calendarFilterSpecialty]);

  // ============================================================
  // WAITLIST CASCADE FILTERS
  // ============================================================
  const waitlistAvailableSpecialties = useMemo(() => {
    const specialtySet = new Set<string>();
    professionals.forEach(p => {
      if (p.status !== 'ativo' || !p.specialty) return;
      if (waitlistForm.branch && p.locationId && p.locationId !== waitlistForm.branch) return;
      specialtySet.add(p.specialty);
    });
    return Array.from(specialtySet).sort();
  }, [professionals, waitlistForm.branch]);

  const waitlistAvailableDoctors = useMemo(() => {
    return professionals.filter(p => {
      if (p.status !== 'ativo') return false;
      if (waitlistForm.branch && p.locationId && p.locationId !== waitlistForm.branch) return false;
      if (waitlistForm.specialty && p.specialty !== waitlistForm.specialty) return false;
      return true;
    });
  }, [professionals, waitlistForm.branch, waitlistForm.specialty]);

  // Waitlist list filter computed values
  const waitlistFilterSpecialties = useMemo(() => {
    const specialtySet = new Set<string>();
    waitlist.forEach(w => {
      if (waitlistFilterBranch && w.branch !== waitlistFilterBranch) return;
      if (w.specialty) specialtySet.add(w.specialty);
    });
    return Array.from(specialtySet).sort();
  }, [waitlist, waitlistFilterBranch]);

  const waitlistFilterDoctors = useMemo(() => {
    const doctorSet = new Set<string>();
    waitlist.forEach(w => {
      if (waitlistFilterBranch && w.branch !== waitlistFilterBranch) return;
      if (waitlistFilterSpecialty && w.specialty !== waitlistFilterSpecialty) return;
      if (w.doctor_name) doctorSet.add(w.doctor_name);
    });
    return Array.from(doctorSet).sort();
  }, [waitlist, waitlistFilterBranch, waitlistFilterSpecialty]);

  const filteredWaitlist = useMemo(() => {
    const dateObj = new Date(waitlistSelectedDate + 'T12:00:00');
    let startMs: number;
    let endMs: number;
    if (waitlistDateView === 'day') {
      startMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      endMs = startMs + 86400000;
    } else if (waitlistDateView === 'week') {
      const d = new Date(dateObj);
      d.setDate(d.getDate() - d.getDay());
      startMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      endMs = startMs + 7 * 86400000;
    } else {
      startMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), 1);
      endMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth() + 1, 1);
    }
    return waitlist.filter(w => {
      if (waitlistFilterBranch && w.branch !== waitlistFilterBranch) return false;
      if (waitlistFilterSpecialty && w.specialty !== waitlistFilterSpecialty) return false;
      if (waitlistFilterDoctor && w.doctor_name !== waitlistFilterDoctor) return false;
      // Check if any relevant date falls within the selected range
      const dates = [w.created_at, w.allocated_date, w.notified_date].filter(Boolean);
      const hasDateInRange = dates.some(d => {
        const dt = new Date(d!);
        const dtMs = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
        return dtMs >= startMs && dtMs < endMs;
      });
      // If no dates, show entry (don't filter out)
      if (dates.length === 0) return true;
      return hasDateInRange;
    });
  }, [waitlist, waitlistFilterBranch, waitlistFilterSpecialty, waitlistFilterDoctor, waitlistDateView, waitlistSelectedDate]);

  // WhatsApp Reminder helpers
  const reminderAppointments = useMemo(() => {
    if (!reminderForm.patient_id) return [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return appointments.filter(a => {
      if (a.patientId !== reminderForm.patient_id) return false;
      if (a.status === 'cancelado') return false;
      // Only show appointments today or in the future
      if (a.date < todayStr) return false;
      return true;
    });
  }, [appointments, reminderForm.patient_id]);

  const detectLanguage = (nationality?: string): typeof reminderForm.language => {
    if (!nationality) return 'es';
    const n = nationality.toLowerCase();
    if (n.includes('paragu')) return 'gn';
    if (n.includes('brasil')) return 'pt-BR';
    if (n.includes('argent')) return 'es-AR';
    return 'es';
  };

  const suggestTemplate = (appointmentDate: string, appointmentTime: string): string => {
    const now = Date.now();
    const apptMs = new Date(`${appointmentDate}T${appointmentTime}`).getTime();
    const hoursUntil = (apptMs - now) / 3600000;
    if (hoursUntil > 24) return 'tpl_1';
    if (hoursUntil > 4) return 'tpl_2';
    return 'tpl_3';
  };

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
      alert(t('agenda_alert_blocked_reschedule', 'app'));
      setDraggedAppId(null);
      return;
    }
    if (hasTimeOverlap(targetDate, targetTime, app.doctorName, app.room || '', draggedAppId)) {
      alert(t('agenda_alert_slot_conflict_reschedule', 'app'));
      setDraggedAppId(null);
      return;
    }

    setAppointments(prev => prev.map(a =>
      a.id === draggedAppId ? { ...a, date: targetDate, time: targetTime, status: 'remarcado' as const } : a
    ));
    addAuditLog('Remarcação (Drag & Drop)', `${app.patientName}: ${app.date} ${normalizeTime(app.time)} → ${targetDate} ${normalizeTime(targetTime)}`);
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
    if (!confirm(t('agenda_confirm_remove_blockage', 'app'))) return;
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
    if (!confirm(t('agenda_confirm_delete_appointment', 'app').replace('{patient}', appt.patientName).replace('{date}', appt.date).replace('{time}', normalizeTime(appt.time)))) return;
    // Find linked waitlist entries by appointment_id (preferred) or patient_name (fallback)
    const linkedWaitlist = waitlist.filter(w => w.appointment_id === appt.id || (w.patient_name === appt.patientName && (w.status === 'notificado' || w.status === 'alocado')));
    // Find linked reminders by appointment_id (preferred) or patient_name (fallback)
    const linkedReminders = reminders.filter(r => r.appointment_id === appt.id || r.patient_name === appt.patientName);
    // Delete linked waitlist entries
    linkedWaitlist.forEach(w => {
      setWaitlist(prev => prev.filter(we => we.id !== w.id));
      if (supabase) supabase.from('waiting_list').delete().eq('id', w.id);
    });
    // Delete linked reminders
    linkedReminders.forEach(r => {
      setReminders(prev => prev.filter(rem => rem.id !== r.id));
      if (supabase) supabase.from('whatsapp_reminders').delete().eq('id', r.id);
    });
    // Delete appointment
    setAppointments(prev => prev.filter(a => a.id !== appt.id));
    addAuditLog('Excluiu Agendamento', `${appt.patientName} - ${appt.date} ${normalizeTime(appt.time)} (+ ${linkedWaitlist.length} lista(s) espera, + ${linkedReminders.length} lembrete(s))`);
    if (supabase) {
      const { error } = await supabase.from('appointments').delete().eq('id', appt.id);
      if (error) console.error('[SUPABASE] DELETE appointment FAILED:', error.message);
    }
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tpl = WHATSAPP_TEMPLATES.find(t => t.id === reminderForm.template_id);
    const langKey = getLangMessageKey(reminderForm.language);
    const newReminder: WhatsappReminder = {
      id: `rem_${++reminderCounterRef.current}`,
      appointment_id: reminderForm.appointment_id,
      patient_name: reminderForm.patient_name,
      patient_phone: reminderForm.patient_phone,
      message_template: tpl ? tpl[langKey] || tpl.messageEs : '',
      language: reminderForm.language || 'es',
      status: 'scheduled',
      scheduled_for: new Date(Date.now() + (tpl?.hoursBefore || 48) * 3600000).toISOString(),
      sent_at: null,
      response_received: null,
      created_at: new Date().toISOString(),
    };
    setReminders(prev => [...prev, newReminder]);
    addAuditLog('Agendou Lembrete WhatsApp', `Para ${reminderForm.patient_name}`);
    if (supabase) await supabase.from('whatsapp_reminders').insert(newReminder);
    setShowReminderModal(false);
    setReminderForm({ patient_id: '', patient_name: '', patient_phone: '', appointment_id: '', language: '', template_id: '' });
  };

  const simulateWhatsAppSend = async (reminderId: string) => {
    const now = new Date().toISOString();
    setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'sent' as const, sent_at: now } : r));
    if (supabase) {
      await supabase.from('whatsapp_reminders').update({ status: 'sent', sent_at: now }).eq('id', reminderId);
    }
    addAuditLog('WhatsApp Enviado', `Lembrete ${reminderId}`);
    setTimeout(() => {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'delivered' as const } : r));
      if (supabase) supabase.from('whatsapp_reminders').update({ status: 'delivered' }).eq('id', reminderId);
    }, 2000);
    setTimeout(() => {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'read' as const } : r));
      if (supabase) supabase.from('whatsapp_reminders').update({ status: 'read' }).eq('id', reminderId);
    }, 5000);
  };

  const simulateWhatsAppResponse = async (reminderId: string, response: 'confirmed' | 'cancelled' | 'rescheduled') => {
    const newStatus = response === 'confirmed' ? 'confirmed' : response === 'cancelled' ? 'cancelled' : 'rescheduled';
    const newResponse = response === 'confirmed' ? '1' : response === 'cancelled' ? '2' : '3';
    setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: newStatus, response_received: newResponse } : r));
    if (supabase) {
      await supabase.from('whatsapp_reminders').update({ status: newStatus, response_received: newResponse }).eq('id', reminderId);
    }
    const rem = reminders.find(r => r.id === reminderId);
    if (rem) {
      // Find waitlist entry by appointment_id (preferred) or by patient_name (fallback)
      let waitlistEntry = waitlist.find(w => w.appointment_id === rem.appointment_id && w.status === 'notificado');
      if (!waitlistEntry && rem.appointment_id) {
        // Fallback: find by patient_name if no appointment_id match
        waitlistEntry = waitlist.find(w => w.patient_name === rem.patient_name && w.status === 'notificado');
      }
      // Update waitlist entry if found
      if (waitlistEntry) {
        if (response === 'confirmed') {
          // Confirmed → Alocado
          setWaitlist(prev => prev.map(w => w.id === waitlistEntry.id ? { ...w, status: 'alocado', allocated_date: waitlistEntry.notified_date, allocated_time: waitlistEntry.notified_time } : w));
          addAuditLog('Paciente confirmou via WhatsApp', rem.patient_name);
          if (supabase) {
            await supabase.from('waiting_list').update({ 
              status: 'alocado', 
              allocated_date: waitlistEntry.notified_date, 
              allocated_time: waitlistEntry.notified_time 
            }).eq('id', waitlistEntry.id);
          }
        } else if (response === 'cancelled') {
          // Cancelled → Cancelado
          setWaitlist(prev => prev.map(w => w.id === waitlistEntry.id ? { ...w, status: 'cancelado' } : w));
          addAuditLog('Paciente cancelou via WhatsApp', rem.patient_name);
          if (supabase) {
            await supabase.from('waiting_list').update({ status: 'cancelado' }).eq('id', waitlistEntry.id);
          }
        }
      }
      // Always update the linked appointment status (regardless of waitlist)
      if (rem.appointment_id) {
        if (response === 'confirmed') {
          setAppointments(prev => prev.map(a =>
            a.id === rem.appointment_id ? { ...a, status: 'confirmado' as const } : a
          ));
          if (supabase) {
            await supabase.from('appointments').update({ status: 'confirmado' }).eq('id', rem.appointment_id);
          }
        } else if (response === 'cancelled') {
          setAppointments(prev => prev.map(a =>
            a.id === rem.appointment_id ? { ...a, status: 'cancelado' as const } : a
          ));
          if (supabase) {
            await supabase.from('appointments').update({ status: 'cancelado' }).eq('id', rem.appointment_id);
          }
        }
      }
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm(t('agenda_confirm_delete_reminder', 'app'))) return;
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    addAuditLog('Excluiu Lembrete WhatsApp', reminderId);
    if (supabase) await supabase.from('whatsapp_reminders').delete().eq('id', reminderId);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: WaitlistEntry = {
      id: `wl_${++waitlistCounterRef.current}`,
      ...waitlistForm,
      priority_score: Math.floor(Math.random() * 100),
      preferred_days: waitlistForm.preferred_days,
      preferred_hours: waitlistForm.preferred_hours,
      allocated_date: null,
      allocated_time: null,
      notified_date: null,
      notified_time: null,
      status: 'aguardando',
      appointment_id: null,
      created_at: new Date().toISOString(),
    };
    setWaitlist(prev => [...prev, newEntry]);
    addAuditLog('Adicionou à Lista de Espera', waitlistForm.patient_name);
    if (supabase) {
      const { error } = await supabase.from('waiting_list').insert(newEntry);
      if (error) console.error('[SUPABASE] INSERT waiting_list FAILED:', error.message, error.details, error.hint);
    }
    setShowWaitlistModal(false);
    setWaitlistForm({ patient_id: '', patient_name: '', phone: '', branch: '', specialty: '', doctor_name: '', priority_criteria: 'arrival', preferred_days: [], preferred_hours: [] });
  };

  // Handle Notify patient from waitlist
  const handleNotifySubmit = async () => {
    if (!notifyEntry) return;
    if (!notifyConsultDate) {
      alert(t('agenda_alert_required_consult_date', 'app'));
      return;
    }
    if (!notifyConsultTime) {
      alert(t('agenda_alert_required_consult_time', 'app'));
      return;
    }
    const tpl = WHATSAPP_TEMPLATES.find(t => t.id === notifyTemplate);
    if (!tpl) return;
    const langKey = getLangMessageKey(notifyLanguage);
    const locName = locations.find(l => l.id === notifyEntry.branch)?.name || t('agenda_branch_fallback', 'app');
    
    // Get consult date/time from appointment or manual fields
    let consultDate = notifyConsultDate;
    let consultTime = notifyConsultTime;
    if (notifyAppointmentId) {
      const appt = appointments.find(a => a.id === notifyAppointmentId);
      if (appt) {
        consultDate = appt.date;
        consultTime = appt.time;
      }
    }
    
    // Validate availability
    if (consultDate && consultTime && notifyEntry.doctor_name) {
      const taken = isTimeSlotTaken(consultDate, consultTime, notifyEntry.doctor_name, appointments, waitlist, notifyEntry.id);
      const blocked = isBlocked(consultDate, consultTime, notifyEntry.doctor_name, notifyEntry.branch || undefined);
      if (taken) {
        alert(t('agenda_alert_slot_taken', 'app'));
        return;
      }
      if (blocked) {
        alert(t('agenda_alert_slot_blocked', 'app'));
        return;
      }
    }
    
    const message = tpl[langKey]
      .replace('{nombre}', notifyEntry.patient_name)
      .replace('{profesional}', notifyEntry.doctor_name || t('agenda_any_professional', 'app'))
      .replace('{fecha}', consultDate || t('agenda_not_defined', 'app'))
      .replace('{hora}', consultTime || t('agenda_not_defined', 'app'))
      .replace('{sede}', locName);

    const newReminder: WhatsappReminder = {
      id: `rem_${++reminderCounterRef.current}`,
      appointment_id: notifyAppointmentId || null,
      patient_name: notifyEntry.patient_name,
      patient_phone: notifyEntry.phone,
      message_template: message,
      language: notifyLanguage || 'es',
      status: 'scheduled',
      scheduled_for: new Date().toISOString(),
      sent_at: null,
      response_received: null,
      created_at: new Date().toISOString(),
    };

    const existingReminder = reminders.find(r => r.appointment_id === notifyAppointmentId && (r.status === 'scheduled' || r.status === 'sent'));

    if (existingReminder) {
      const updatedReminder = { ...existingReminder, ...newReminder, id: existingReminder.id };
      setReminders(prev => prev.map(r => r.id === existingReminder.id ? updatedReminder : r));
      if (supabase) {
        await supabase.from('whatsapp_reminders').update({
          appointment_id: updatedReminder.appointment_id,
          patient_name: updatedReminder.patient_name,
          patient_phone: updatedReminder.patient_phone,
          message_template: updatedReminder.message_template,
          language: updatedReminder.language,
          status: updatedReminder.status,
          scheduled_for: updatedReminder.scheduled_for,
        }).eq('id', existingReminder.id);
      }
    } else {
      setReminders(prev => [...prev, newReminder]);
      if (supabase) {
        await supabase.from('whatsapp_reminders').insert(newReminder);
      }
    }
    setWaitlist(prev => prev.map(e => e.id === notifyEntry.id ? { ...e, status: 'notificado', notified_date: consultDate, notified_time: consultTime } : e));
    addAuditLog('Notificou paciente da lista de espera', notifyEntry.patient_name);
    if (supabase) {
      await supabase.from('waiting_list').update({ status: 'notificado', notified_date: consultDate, notified_time: consultTime }).eq('id', notifyEntry.id);
    }
    // Create pending appointment to block the time slot
    if (consultDate && consultTime && notifyEntry.doctor_name) {
      const pendingAppt: Appointment = {
        id: `agenda_${++apptCounterRef.current}`,
        patientId: notifyEntry.patient_id,
        patientName: notifyEntry.patient_name,
        doctorName: notifyEntry.doctor_name,
        specialty: notifyEntry.specialty,
        date: consultDate,
        time: consultTime,
        status: 'pendente',
        branch: notifyEntry.branch,
        room: '',
        type: 'primeira_vez',
        modality: 'Presencial',
        duration_minutes: 30,
      };
      setAppointments(prev => [...prev, pendingAppt]);
      // Link the pending appointment to the reminder
      setReminders(prev => prev.map(r => r.id === newReminder.id ? { ...r, appointment_id: pendingAppt.id } : r));
      // Link the pending appointment to the waitlist entry
      setWaitlist(prev => prev.map(e => e.id === notifyEntry.id ? { ...e, appointment_id: pendingAppt.id } : e));
      if (supabase) {
        const inserted = await supabase.from('appointments').insert({
          id: pendingAppt.id,
          patient_id: pendingAppt.patientId,
          patient_name: pendingAppt.patientName,
          doctor_name: pendingAppt.doctorName,
          specialty: pendingAppt.specialty,
          date: pendingAppt.date,
          time: pendingAppt.time,
          status: pendingAppt.status,
          branch: pendingAppt.branch,
          room: pendingAppt.room,
          type: pendingAppt.type,
          modality: pendingAppt.modality,
          duration_minutes: pendingAppt.duration_minutes,
        }).select('id').single();
        if (inserted.data) {
          await supabase.from('whatsapp_reminders').update({ appointment_id: inserted.data.id }).eq('id', newReminder.id);
          // Update waiting_list with appointment_id
          await supabase.from('waiting_list').update({ appointment_id: inserted.data.id }).eq('id', notifyEntry.id);
        }
      }
    }
    setShowNotifyModal(false);
    setNotifyEntry(null);
    setNotifyAppointmentId('');
    setNotifyConsultDate('');
    setNotifyConsultTime('');
  };

  // Handle Allocate patient from waitlist
  const handleAllocateSubmit = async () => {
    if (!allocateEntry || !allocateDate || !allocateTime || !allocateDoctor) return;
    const doc = professionals.find(p => p.name === allocateDoctor);
    const newAppointment: Appointment = {
      id: `agenda_${++apptCounterRef.current}`,
      patientId: allocateEntry.patient_id,
      patientName: allocateEntry.patient_name,
      doctorName: allocateDoctor,
      specialty: allocateEntry.specialty,
      date: allocateDate,
      time: allocateTime,
      status: 'agendado',
      branch: allocateEntry.branch,
      room: '',
      type: 'primeira_vez',
      modality: 'Presencial',
      duration_minutes: 30,
    };
    setAppointments(prev => [...prev, newAppointment]);
    setWaitlist(prev => prev.map(e => e.id === allocateEntry.id ? { ...e, status: 'alocado', allocated_date: allocateDate, allocated_time: allocateTime, appointment_id: newAppointment.id } : e));
    addAuditLog('Alocou paciente da lista de espera', `${allocateEntry.patient_name} → ${allocateDate} ${allocateTime}`);
    if (supabase) {
      const { error: apptError } = await supabase.from('appointments').insert({
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
        duration_minutes: newAppointment.duration_minutes,
      });
      if (apptError) {
        console.error('[SUPABASE] INSERT appointments FAILED:', apptError.message, apptError);
      }
      const { error: wlError } = await supabase.from('waiting_list').update({ status: 'alocado', allocated_date: allocateDate, allocated_time: allocateTime, appointment_id: newAppointment.id }).eq('id', allocateEntry.id);
      if (wlError) {
        console.error('[SUPABASE] UPDATE waiting_list FAILED:', wlError.message, wlError);
      }
    }
    setShowAllocateModal(false);
    setAllocateEntry(null);
    setAllocateDate('');
    setAllocateTime('');
    setAllocateDoctor('');
  };

  // Handle Edit Waitlist Entry
  const handleEditWaitlistSubmit = async () => {
    if (!editingWaitlistEntry) return;
    const updated: WaitlistEntry = {
      ...editingWaitlistEntry,
      patient_id: editWaitlistForm.patient_id,
      patient_name: editWaitlistForm.patient_name,
      phone: editWaitlistForm.phone,
      branch: editWaitlistForm.branch,
      specialty: editWaitlistForm.specialty,
      doctor_name: editWaitlistForm.doctor_name,
      priority_criteria: editWaitlistForm.priority_criteria,
      status: editWaitlistForm.status,
      preferred_days: editWaitlistForm.preferred_days,
      preferred_hours: editWaitlistForm.preferred_hours,
      allocated_date: editWaitlistForm.allocated_date,
      allocated_time: editWaitlistForm.allocated_time,
    };
    setWaitlist(prev => prev.map(e => e.id === editingWaitlistEntry.id ? updated : e));
    addAuditLog('Editou Lista de Espera', updated.patient_name);

    if (updated.status === 'notificado' && updated.notified_date && updated.notified_time) {
      const existingReminder = reminders.find(r => r.patient_name === updated.patient_name && (r.status === 'scheduled' || r.status === 'sent'));
      if (existingReminder) {
        const updatedScheduledFor = `${updated.notified_date}T${updated.notified_time}:00`;
        setReminders(prev => prev.map(r => r.id === existingReminder.id ? { ...r, scheduled_for: updatedScheduledFor } : r));
        if (supabase) {
          await supabase.from('whatsapp_reminders').update({ scheduled_for: updatedScheduledFor }).eq('id', existingReminder.id);
        }
      }
    }

    if (updated.status === 'alocado' || updated.status === 'cancelado') {
      const existingReminder = reminders.find(r => r.patient_name === updated.patient_name && (r.status === 'scheduled' || r.status === 'sent'));
      if (existingReminder) {
        setReminders(prev => prev.map(r => r.id === existingReminder.id ? { ...r, status: 'cancelled' } : r));
        if (supabase) {
          await supabase.from('whatsapp_reminders').update({ status: 'cancelled' }).eq('id', existingReminder.id);
        }
      }
    }

    if (supabase) {
      const { error } = await supabase.from('waiting_list').update({
        patient_id: updated.patient_id,
        patient_name: updated.patient_name,
        phone: updated.phone,
        branch: updated.branch,
        specialty: updated.specialty,
        doctor_name: updated.doctor_name,
        priority_criteria: updated.priority_criteria,
        status: updated.status,
        preferred_days: updated.preferred_days,
        preferred_hours: updated.preferred_hours,
        allocated_date: updated.allocated_date,
        allocated_time: updated.allocated_time,
      }).eq('id', editingWaitlistEntry.id);
      if (error) console.error('[SUPABASE] UPDATE waiting_list FAILED:', error.message);
    }
    setShowEditWaitlistModal(false);
    setEditingWaitlistEntry(null);
  };

  // Handle Delete Waitlist Entry
  const handleDeleteWaitlist = async (entry: WaitlistEntry) => {
    if (!confirm(t('agenda_confirm_delete_waitlist_entry', 'app').replace('{patient}', entry.patient_name))) return;
    // Find linked appointments and reminders by appointment_id (preferred) or patient_name (fallback)
    const linkedAppointments = entry.appointment_id 
      ? appointments.filter(a => a.id === entry.appointment_id && (a.status === 'pendente' || a.status === 'agendado'))
      : appointments.filter(a => a.patientName === entry.patient_name && (a.status === 'pendente' || a.status === 'agendado'));
    const linkedReminders = entry.appointment_id
      ? reminders.filter(r => r.appointment_id === entry.appointment_id)
      : reminders.filter(r => r.patient_name === entry.patient_name);
    // Delete linked appointments
    linkedAppointments.forEach(a => {
      setAppointments(prev => prev.filter(ap => ap.id !== a.id));
      if (supabase) supabase.from('appointments').delete().eq('id', a.id);
    });
    // Delete linked reminders
    linkedReminders.forEach(r => {
      setReminders(prev => prev.filter(rem => rem.id !== r.id));
      if (supabase) supabase.from('whatsapp_reminders').delete().eq('id', r.id);
    });
    // Delete waitlist entry
    setWaitlist(prev => prev.filter(e => e.id !== entry.id));
    addAuditLog('Excluiu da Lista de Espera', `${entry.patient_name} (+ ${linkedAppointments.length} agendamento(s), + ${linkedReminders.length} lembrete(s))`);
    if (supabase) {
      const { error } = await supabase.from('waiting_list').delete().eq('id', entry.id);
      if (error) console.error('[SUPABASE] DELETE waiting_list FAILED:', error.message);
    }
  };

  const handleCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callForm.patient_id) { alert(t('agenda_alert_select_patient', 'app')); return; }
    if (!callForm.type) { alert(t('agenda_alert_select_call_type', 'app')); return; }
    if (!callForm.reason) { alert(t('agenda_alert_select_call_reason', 'app')); return; }
    const newCall: CallLog = {
      id: `call_${++callCounterRef.current}`,
      ...callForm,
      type: callForm.type as CallLog['type'],
      reason: callForm.reason as CallLog['reason'],
      recording_url: null,
      created_at: new Date().toISOString(),
    };
    setCallLogs(prev => [newCall, ...prev]);
    addAuditLog('Registrou Ligação', `${callForm.type} - ${callForm.patient_name}`);
    if (supabase) await supabase.from('call_center_logs').insert(newCall);
    setShowCallModal(false);
    setCallForm({ operator_name: activeOperator, patient_id: '', patient_name: '', patient_phone: '', type: '', reason: '', notes: '', duration_seconds: 0 });
  };

  const startCall = (patientName: string, phone: string, type: 'outbound' | 'inbound' = 'outbound') => {
    setActiveCall({
      id: `call_${++callCounterRef.current}`,
      operator_name: activeOperator,
      patient_id: null,
      patient_name: patientName,
      patient_phone: phone,
      type: type,
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
    if (!newApptForm.patient_id) { alert(t('agenda_alert_select_patient', 'app')); return; }
    if (!newApptForm.branch) { alert(t('agenda_alert_select_branch', 'app')); return; }
    if (!newApptForm.room) { alert(t('agenda_alert_select_room', 'app')); return; }
    if (!newApptForm.specialty) { alert(t('agenda_alert_select_specialty', 'app')); return; }
    if (!newApptForm.doctor_name) { alert(t('agenda_alert_select_professional', 'app')); return; }
    if (!newApptForm.date) { alert(t('agenda_alert_select_date', 'app')); return; }
    if (!newApptForm.time) { alert(t('agenda_alert_select_time', 'app')); return; }
    if (!newApptForm.insurance_type) { alert(t('agenda_alert_select_insurance', 'app')); return; }
    if (isBlocked(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.branch)) {
      alert(t('agenda_alert_slot_blocked_doctor_branch', 'app'));
      return;
    }
    if (hasTimeOverlap(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.room)) {
      alert(t('agenda_alert_slot_conflict_new_appt', 'app'));
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
        alert(t('agenda_alert_min_gap_violation', 'app').replace('{minutes}', String(minGapMinutes)));
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
  // CLINIC PATIENTS CRUD
  // ============================================================
  const cpCalculatedDV = useMemo(() => {
    if (cpForm.document_type !== 'CI' || !cpForm.document_number) return null;
    const cleanDoc = cpForm.document_number.replace(/\D/g, '');
    if (cleanDoc.length === 0) return null;
    let sum = 0;
    let factor = 2;
    for (let i = cleanDoc.length - 1; i >= 0; i--) {
      sum += parseInt(cleanDoc.charAt(i)) * factor;
      factor++;
      if (factor > 11) factor = 2;
    }
    const remainder = sum % 11;
    return remainder > 1 ? 11 - remainder : 0;
  }, [cpForm.document_number, cpForm.document_type]);

  const cpAge = useMemo(() => {
    if (!cpForm.birth_date) return 0;
    const today = new Date();
    const birthDate = new Date(cpForm.birth_date);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
    return calculatedAge;
  }, [cpForm.birth_date]);

  const cpIsMinor = cpAge < 18;

  const guardianCalculatedDV = useMemo(() => {
    if (cpForm.responsible_document_type !== 'CI' || !cpForm.responsible_document_number) return null;
    const cleanDoc = cpForm.responsible_document_number.replace(/\D/g, '');
    if (cleanDoc.length === 0) return null;
    let sum = 0;
    let factor = 2;
    for (let i = cleanDoc.length - 1; i >= 0; i--) {
      sum += parseInt(cleanDoc.charAt(i)) * factor;
      factor++;
      if (factor > 11) factor = 2;
    }
    const remainder = sum % 11;
    return remainder > 1 ? 11 - remainder : 0;
  }, [cpForm.responsible_document_number, cpForm.responsible_document_type]);

  const sortedFilteredClinicPatients = useMemo(() => {
    const filtered = !patientSearchQuery
      ? clinicPatients
      : clinicPatients.filter(p => {
          const q = patientSearchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            (p.document_number && p.document_number.toLowerCase().includes(q)) ||
            (p.phone && p.phone.toLowerCase().includes(q)) ||
            (p.email && p.email.toLowerCase().includes(q))
          );
        });
    const arr = [...filtered];
    switch (clinicPatientSort) {
      case 'name_desc':
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'recent':
        arr.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        break;
      case 'oldest':
        arr.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
        break;
      case 'name_asc':
      default:
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return arr;
  }, [clinicPatients, patientSearchQuery, clinicPatientSort]);

  const resetCpForm = () => {
    setCpForm({
      name: '', document_type: '', document_number: '', birth_date: '', gender: '',
      nationality: '', civil_status: '', photo_url: '',
      phone: '', email: '',
      address_department: '', address_district: '', address_city: '', address_neighborhood: '', address_street: '', address_number: '', country: 'Paraguai',
      insurance_type: '', insurance_number: '', preferred_language: '', allergies: '',
      responsible_name: '', responsible_document_type: '', responsible_document_number: '', responsible_phone: '', responsible_relationship: '',
    whatsapp_verified: false,
      notes: '',
    });
    setCpWebcamPlaceholder(null);
    setEditingClinicPatient(null);
    setClinicPatientFormTab('identification');
  };

  const handleClinicPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ID do paciente: ao editar usa o existente, ao criar gera um novo
    const patientId = editingClinicPatient?.id || `cp_${Date.now()}`;

    // Upload da foto se houver preview em base64 (camera/upload ainda nao salvou no storage)
    let finalPhotoUrl = cpForm.photo_url;
    const hasNewPhoto = cpWebcamPlaceholder && cpWebcamPlaceholder.startsWith('data:');
    if (hasNewPhoto) {
      const fileName = `patient_${patientId}.jpg`;
      try {
        const res = await fetch(cpWebcamPlaceholder);
        const blob = await res.blob();
        const { data } = await supabase.storage.from('patient-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
        if (data) {
          const { data: urlData } = supabase.storage.from('patient-photos').getPublicUrl(data.path);
          finalPhotoUrl = urlData.publicUrl;
        }
      } catch (err) { console.warn('Upload error:', err); }
    }

    if (editingClinicPatient) {
      const updated: ClinicPatient = {
        ...editingClinicPatient,
        ...cpForm,
        photo_url: finalPhotoUrl,
        updated_at: new Date().toISOString(),
      };
      setClinicPatients(prev => prev.map(p => p.id === editingClinicPatient.id ? updated : p));
      addAuditLog('Editou Paciente Clinico', cpForm.name);
      if (supabase) {
        const { error } = await supabase.from('clinic_patients').update({
          name: cpForm.name, document_type: cpForm.document_type, document_number: cpForm.document_number,
          birth_date: cpForm.birth_date, gender: cpForm.gender, nationality: cpForm.nationality,
          civil_status: cpForm.civil_status, photo_url: finalPhotoUrl,
          phone: cpForm.phone, email: cpForm.email,
          address_department: cpForm.address_department, address_district: cpForm.address_district,
          address_city: cpForm.address_city, address_neighborhood: cpForm.address_neighborhood,
          address_street: cpForm.address_street, address_number: cpForm.address_number,
          country: cpForm.country,
          insurance_type: cpForm.insurance_type, insurance_number: cpForm.insurance_number,
          preferred_language: cpForm.preferred_language, allergies: cpForm.allergies,
          responsible_name: cpForm.responsible_name, responsible_document_type: cpForm.responsible_document_type,
          responsible_document_number: cpForm.responsible_document_number, responsible_phone: cpForm.responsible_phone,
          responsible_relationship: cpForm.responsible_relationship, whatsapp_verified: cpForm.whatsapp_verified, notes: cpForm.notes,
        }).eq('id', editingClinicPatient.id);
      }
    } else {
      // Gerar ID sequencial: CLI001, CLI002, etc.
      const numericIds = clinicPatients.map(p => {
        const match = p.id.match(/^CLI(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const nextIdNum = Math.max(...numericIds, 0) + 1;
      const tempId = `CLI${String(nextIdNum).padStart(3, '0')}`;
      const newPatient: ClinicPatient = {
        id: tempId,
        ...cpForm,
        photo_url: '',
        status: 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setClinicPatients(prev => [...prev, newPatient]);
      addAuditLog('Cadastrou Paciente Clinico', cpForm.name);
      if (supabase) {
        const { data, error } = await supabase.from('clinic_patients').insert({
          name: cpForm.name, document_type: cpForm.document_type, document_number: cpForm.document_number,
          birth_date: cpForm.birth_date, gender: cpForm.gender, nationality: cpForm.nationality,
          civil_status: cpForm.civil_status, photo_url: '',
          phone: cpForm.phone, email: cpForm.email,
          address_department: cpForm.address_department, address_district: cpForm.address_district,
          address_city: cpForm.address_city, address_neighborhood: cpForm.address_neighborhood,
          address_street: cpForm.address_street, address_number: cpForm.address_number,
          country: cpForm.country,
          insurance_type: cpForm.insurance_type, insurance_number: cpForm.insurance_number,
          preferred_language: cpForm.preferred_language, allergies: cpForm.allergies,
          responsible_name: cpForm.responsible_name, responsible_document_type: cpForm.responsible_document_type,
          responsible_document_number: cpForm.responsible_document_number, responsible_phone: cpForm.responsible_phone,
          responsible_relationship: cpForm.responsible_relationship, whatsapp_verified: cpForm.whatsapp_verified, notes: cpForm.notes,
          status: 'ativo',
        }).select('id').single();
        if (data) {
          const realId = data.id;
          setClinicPatients(prev => prev.map(p => p.id === tempId ? { ...p, id: realId } : p));
          // Upload da foto com o ID correto do Supabase
          if (hasNewPhoto) {
            const fileName = `patient_${realId}.jpg`;
            try {
              const res = await fetch(cpWebcamPlaceholder!);
              const blob = await res.blob();
              const { data: uploadData } = await supabase.storage.from('patient-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
              if (uploadData) {
                const { data: urlData } = supabase.storage.from('patient-photos').getPublicUrl(uploadData.path);
                await supabase.from('clinic_patients').update({ photo_url: urlData.publicUrl }).eq('id', realId);
                setClinicPatients(prev => prev.map(p => p.id === realId ? { ...p, photo_url: urlData.publicUrl } : p));
              }
            } catch (err) { console.warn('Upload error:', err); }
          }
        }
      }
    }
    setShowNewPatientModal(false);
    resetCpForm();
  };

  const handleDeleteClinicPatient = async (patient: ClinicPatient) => {
    if (!confirm(t('agenda_confirm_delete_clinic_patient', 'app').replace('{patient}', patient.name))) return;
    setClinicPatients(prev => prev.filter(p => p.id !== patient.id));
    addAuditLog('Excluiu Paciente Clinico', patient.name);
    if (supabase) {
      await supabase.from('clinic_patients').delete().eq('id', patient.id);
    }
  };

  const handleEditClinicPatient = (patient: ClinicPatient) => {
    setEditingClinicPatient(patient);
    setCpForm({
      name: patient.name, document_type: patient.document_type, document_number: patient.document_number,
      birth_date: patient.birth_date, gender: patient.gender, nationality: patient.nationality,
      civil_status: patient.civil_status, photo_url: patient.photo_url || '',
      phone: patient.phone, email: patient.email,
      address_department: patient.address_department, address_district: patient.address_district,
      address_city: patient.address_city, address_neighborhood: patient.address_neighborhood,
      address_street: patient.address_street, address_number: patient.address_number,
      country: patient.country,
      insurance_type: patient.insurance_type, insurance_number: patient.insurance_number,
      preferred_language: patient.preferred_language, allergies: patient.allergies,
      responsible_name: patient.responsible_name, responsible_document_type: patient.responsible_document_type,
      responsible_document_number: patient.responsible_document_number, responsible_phone: patient.responsible_phone,
      responsible_relationship: patient.responsible_relationship, whatsapp_verified: patient.whatsapp_verified || false, notes: patient.notes,
    });
    setCpWebcamPlaceholder(patient.photo_url || null);
    setShowNewPatientModal(true);
  };

  // Camera handlers for clinic patient form
  const cpStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      cpStreamRef.current = stream;
      setCpIsCameraActive(true);
      setCpCameraCountdown(3);
      setTimeout(() => { if (cpVideoRef.current) { cpVideoRef.current.srcObject = stream; cpVideoRef.current.play(); } }, 100);
      const interval = setInterval(() => {
        setCpCameraCountdown(prev => {
          if (prev === null) return null;
          if (prev <= 1) { clearInterval(interval); cpPendingCaptureRef.current = 'real'; return null; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      cpStartCameraFallback();
    }
  };

  const cpStartCameraFallback = () => {
    setCpIsCameraActive(true);
    setCpCameraCountdown(3);
    cpSimulationFileRef.current = `patient_${++cpPhotoCounterRef.current}.svg`;
    const interval = setInterval(() => {
      setCpCameraCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) { clearInterval(interval); cpPendingCaptureRef.current = 'simulation'; return null; }
        return prev - 1;
      });
    }, 1000);
  };

  const cpCapturePhoto = async () => {
    if (cpVideoRef.current && cpCanvasRef.current) {
      const canvas = cpCanvasRef.current;
      const video = cpVideoRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCpWebcamPlaceholder(photoData);
      }
    }
    cpStopCamera();
  };

  const cpStopCamera = () => {
    if (cpStreamRef.current) { cpStreamRef.current.getTracks().forEach(t => t.stop()); cpStreamRef.current = null; }
    setCpIsCameraActive(false);
    setCpCameraCountdown(null);
  };

  useEffect(() => {
    if (cpCameraCountdown !== null) return;
    if (cpPendingCaptureRef.current === 'real') { cpPendingCaptureRef.current = null; cpCapturePhoto(); }
    else if (cpPendingCaptureRef.current === 'simulation') {
      cpPendingCaptureRef.current = null;
      const svgPlaceholder = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23e2e8f0" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="48">CP</text></svg>`)}`;
      setCpWebcamPlaceholder(svgPlaceholder);
      setCpForm(prev => ({ ...prev, photo_url: svgPlaceholder }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpCameraCountdown]);

  const cpHandleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCpWebcamPlaceholder(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // ============================================================
  // CALL CENTER
  // ============================================================
  const filteredCallLogs = useMemo(() => {
    const dateObj = new Date(callSelectedDate + 'T12:00:00');
    let startMs: number;
    let endMs: number;
    if (callDateView === 'day') {
      startMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      endMs = startMs + 86400000;
    } else if (callDateView === 'week') {
      const d = new Date(dateObj);
      d.setDate(d.getDate() - d.getDay());
      startMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      endMs = startMs + 7 * 86400000;
    } else {
      startMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), 1);
      endMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth() + 1, 1);
    }
    return callLogs.filter(c => {
      const created = new Date(c.created_at);
      const createdMs = Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate());
      if (createdMs < startMs || createdMs >= endMs) return false;
      return true;
    });
  }, [callLogs, callDateView, callSelectedDate]);

  const callCenterKPIs = useMemo(() => {
    const total = filteredCallLogs.length;
    const inbound = filteredCallLogs.filter(c => c.type === 'inbound').length;
    const outbound = filteredCallLogs.filter(c => c.type === 'outbound').length;
    const avgDuration = total > 0 ? Math.round(filteredCallLogs.reduce((sum, c) => sum + c.duration_seconds, 0) / total) : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCalls = callLogs.filter(c => c.created_at.startsWith(todayStr)).length;
    return { total, inbound, outbound, avgDuration, todayCalls };
  }, [filteredCallLogs, callLogs]);

  const whatsappMetrics = useMemo(() => {
    const total = reminders.length;
    const sent = reminders.filter(r => ['sent', 'delivered', 'read', 'confirmed'].includes(r.status)).length;
    const delivered = reminders.filter(r => ['delivered', 'read', 'confirmed'].includes(r.status)).length;
    const read = reminders.filter(r => ['read', 'confirmed'].includes(r.status)).length;
    const confirmed = reminders.filter(r => r.status === 'confirmed').length;
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, sent, delivered, read, confirmed, rate };
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    const dateObj = new Date(whatsappSelectedDate + 'T12:00:00');
    let startMs: number;
    let endMs: number;
    if (whatsappDateView === 'day') {
      startMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      endMs = startMs + 86400000;
    } else if (whatsappDateView === 'week') {
      const d = new Date(dateObj);
      d.setDate(d.getDate() - d.getDay());
      startMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      endMs = startMs + 7 * 86400000;
    } else {
      startMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), 1);
      endMs = Date.UTC(dateObj.getFullYear(), dateObj.getMonth() + 1, 1);
    }
    return reminders.filter(r => {
      // Check reminder created_at
      const created = new Date(r.created_at);
      const createdMs = Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate());
      if (createdMs >= startMs && createdMs < endMs) return true;
      // Check linked appointment date
      const linkedAppointment = r.appointment_id ? appointments.find(a => a.id === r.appointment_id) : null;
      if (linkedAppointment) {
        const apptDate = new Date(linkedAppointment.date);
        const apptMs = Date.UTC(apptDate.getUTCFullYear(), apptDate.getUTCMonth(), apptDate.getUTCDate());
        if (apptMs >= startMs && apptMs < endMs) return true;
      }
      return false;
    });
  }, [reminders, appointments, whatsappDateView, whatsappSelectedDate]);

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
            {t('agenda_subtitle', 'app')}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <button onClick={() => setShowNewApptModal(true)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg flex items-center gap-2 transition">
                <Plus className="w-4 h-4" /> {t('agenda_new_appointment', 'app')}
              </button>
              <button onClick={() => setShowBlockageModal(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-2 transition">
                <AlertTriangle className="w-4 h-4" /> {t('agenda_block', 'app')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        {([
          { id: 'register', label: t('agenda_tab_register', 'app'), icon: UserPlus, badge: clinicPatients.length },
          { id: 'calendar', label: t('agenda_tab_calendar', 'app'), icon: CalendarDays, badge: filteredAppointments.length },
          { id: 'whatsapp', label: 'WhatsApp', icon: Send, badge: reminders.filter(r => r.status !== 'confirmed' && r.status !== 'cancelled').length },
          { id: 'waitlist', label: t('agenda_tab_waitlist', 'app'), icon: ClipboardList, badge: waitlist.filter(w => w.status === 'aguardando').length },
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

      {/* ==================== REGISTER TAB ==================== */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              {t('agenda_patient_registration', 'app')} ({patientSearchQuery ? `${sortedFilteredClinicPatients.length} / ${clinicPatients.length}` : clinicPatients.length})
            </h3>
            {canEdit && (
              <button onClick={() => { resetCpForm(); setShowNewPatientModal(true); }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> {t('agenda_new_patient', 'app')}
              </button>
            )}
          </div>

          {/* Search + Sort Bar */}
          {clinicPatients.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => { setPatientSearchQuery(e.target.value); setClinicPatientVisibleCount(3); }}
                  placeholder={t('agenda_search_patient_placeholder', 'app')}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <select
                value={clinicPatientSort}
                onChange={(e) => { setClinicPatientSort(e.target.value as typeof clinicPatientSort); setClinicPatientVisibleCount(3); }}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                aria-label={t('agenda_sort_by', 'app')}
              >
                <option value="name_asc">{t('agenda_sort_name_asc', 'app')}</option>
                <option value="name_desc">{t('agenda_sort_name_desc', 'app')}</option>
                <option value="recent">{t('agenda_sort_recent', 'app')}</option>
                <option value="oldest">{t('agenda_sort_oldest', 'app')}</option>
              </select>
            </div>
          )}

          {/* Patient List */}
          {clinicPatients.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">{t('agenda_no_patients', 'app')}</p>
              <p className="text-sm text-slate-400 mt-1">{t('agenda_register_first_patient', 'app')}</p>
            </div>
          ) : sortedFilteredClinicPatients.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">{t('agenda_no_patients_found', 'app')}</p>
              <p className="text-sm text-slate-400 mt-1">{patientSearchQuery}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedFilteredClinicPatients.slice(0, clinicPatientVisibleCount).map(cp => (
                  <ClinicPatientCard
                    key={cp.id}
                    cp={cp}
                    locale={locale}
                    t={t}
                    canEdit={canEdit}
                    onEdit={handleEditClinicPatient}
                    onDelete={handleDeleteClinicPatient}
                  />
                ))}
              </div>
              {sortedFilteredClinicPatients.length > clinicPatientVisibleCount && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setClinicPatientVisibleCount(prev => prev + 3)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
                  >
                    {t('agenda_load_more', 'app')} ({sortedFilteredClinicPatients.length - clinicPatientVisibleCount} {t('agenda_remaining', 'app')})
                  </button>
                </div>
              )}
            </>
          )}

          {/* Blocked Slots List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                {t('agenda_blocks_title', 'app')} ({blockedSlots.length})
              </h3>
              {canEdit && (
                <button onClick={() => setShowBlockageModal(true)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition">
                  {t('agenda_new_block', 'app')}
                </button>
              )}
            </div>
            {blockedSlots.length === 0 ? (
              <p className="text-center text-slate-400 py-6">{t('agenda_no_blocks', 'app')}</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blockedSlots.map(b => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${b.reason === 'feriado' ? 'bg-red-500' : b.reason === 'férias' ? 'bg-blue-500' : b.reason === 'capacitação' ? 'bg-purple-500' : 'bg-rose-500'}`} />
                      <div>
                        <p className="font-semibold text-sm">{b.description}</p>
                        <p className="text-xs text-slate-500">
                          {b.start_date} a {b.end_date} {b.start_time && `(${normalizeTime(b.start_time)}-${normalizeTime(b.end_time || '')})`}
                          {b.doctor_name && ` • ${b.doctor_name}`}
                          {b.branch && ` • ${b.branch}`}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteBlockage(b.id)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">{t('agenda_remove', 'app')}</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== NEW CLINIC PATIENT MODAL ==================== */}
      <InlineModal open={showNewPatientModal} onClose={() => { setShowNewPatientModal(false); resetCpForm(); }} className="max-w-2xl">
        <div className="p-6">
          <form onSubmit={handleClinicPatientSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{editingClinicPatient ? t('agenda_edit_clinic_patient', 'app') : t('agenda_checkin_admission', 'app')}</h3>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200">
              {([
                { id: 'identification' as const, label: t('agenda_identification', 'app') },
                { id: 'contact' as const, label: t('agenda_contact', 'app') },
                { id: 'complementary' as const, label: t('agenda_complementary', 'app') },
                ...(cpIsMinor ? [{ id: 'guardian' as const, label: t('agenda_guardian', 'app') }] : []),
              ]).map(tab => (
                <button key={tab.id} type="button" onClick={() => setClinicPatientFormTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                    clinicPatientFormTab === tab.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}>{tab.label}</button>
              ))}
            </div>

            {/* Aba Identificacao */}
            {clinicPatientFormTab === 'identification' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_full_name', 'app')}</label>
                  <input type="text" value={cpForm.name} onChange={e => setCpForm({ ...cpForm, name: e.target.value })}
                    placeholder="" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_document_type', 'app')}</label>
                    <select value={cpForm.document_type} onChange={e => setCpForm({ ...cpForm, document_type: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                      <option value="">{t('agenda_select', 'app')}</option>
                      <option value="CI">{t('rcpt_doc_ci', 'app')}</option>
                      <option value="Pasaporte">{t('rcpt_doc_passport', 'app')}</option>
                      <option value="RG">{t('rcpt_doc_rg', 'app')}</option>
                      <option value="DNI / Outro">{t('rcpt_doc_other', 'app')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_document_number', 'app')}</label>
                    <div className="flex gap-1">
                      <input type="text" value={cpForm.document_number} onChange={e => setCpForm({ ...cpForm, document_number: e.target.value })}
                        placeholder="" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
                      {cpCalculatedDV !== null && cpForm.document_type === 'CI' && (
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-lg self-center">DV: {cpCalculatedDV}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_birth_date_field', 'app')}</label>
                    <I18nDatePicker value={cpForm.birth_date} onChange={v => setCpForm({ ...cpForm, birth_date: v })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
                    {cpForm.birth_date && <p className="text-xs text-slate-400 mt-1">{cpAge} {t('agenda_years', 'app')}{cpIsMinor ? ` (${t('agenda_minor_guardian_required', 'app')})` : ''}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_gender_field', 'app')}</label>
                    <select value={cpForm.gender} onChange={e => setCpForm({ ...cpForm, gender: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                      <option value="">{t('agenda_select', 'app')}</option>
                      <option value="Masculino">{t('rcpt_gender_male', 'app')}</option>
                      <option value="Feminino">{t('rcpt_gender_female', 'app')}</option>
                      <option value="Outro">{t('rcpt_gender_other', 'app')}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_nationality', 'app')}</label>
                    <input type="text" value={cpForm.nationality} onChange={e => setCpForm({ ...cpForm, nationality: e.target.value })} placeholder="" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_civil_status', 'app')}</label>
                    <select value={cpForm.civil_status} onChange={e => setCpForm({ ...cpForm, civil_status: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                      <option value="">{t('agenda_select', 'app')}</option>
                      <option value="Solteiro(a)">{t('rcpt_civil_single', 'app')}</option>
                      <option value="Casado(a)">{t('rcpt_civil_married', 'app')}</option>
                      <option value="Divorciado(a)">{t('rcpt_civil_divorced', 'app')}</option>
                      <option value="Viuvo(a)">{t('rcpt_civil_widowed', 'app')}</option>
                      <option value="Uniao Estavel">{t('rcpt_civil_union', 'app')}</option>
                    </select>
                  </div>
                </div>
                {/* Foto do Paciente */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">{t('agenda_patient_photo', 'app')}</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                      {cpWebcamPlaceholder ? (
                        <img src={cpWebcamPlaceholder} alt={t('rcpt_alt_patient_capture', 'app')} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      {cpIsCameraActive ? (
                        <div className="relative w-full max-w-xs">
                          <video ref={cpVideoRef} className="w-full rounded-lg" playsInline muted />
                          <canvas ref={cpCanvasRef} className="hidden" />
                          {cpCameraCountdown !== null && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <span className="text-4xl font-bold text-white">{cpCameraCountdown}</span>
                            </div>
                          )}
                          <button type="button" onClick={cpStopCamera} className="mt-1 text-xs text-red-500 hover:text-red-700 font-semibold">{t('agenda_cancel', 'app')}</button>
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={cpStartCamera}
                            className="w-full py-2 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-lg flex items-center justify-center gap-2 border border-teal-200 transition">
                            <Camera className="w-4 h-4" /> {t('agenda_capture_camera', 'app')}
                          </button>
                          <label className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg flex items-center justify-center gap-2 border border-slate-200 cursor-pointer transition">
                            <Upload className="w-4 h-4" /> {t('agenda_upload_file', 'app')}
                            <input type="file" accept="image/*" onChange={cpHandleFileUpload} className="hidden" />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Contato / Endereco */}
            {clinicPatientFormTab === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <PhoneInput
                    value={cpForm.phone}
                    onChange={phone => setCpForm({ ...cpForm, phone })}
                    label={t('agenda_phone', 'app')}
                    required
                    allowEmpty
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                    <button type="button" onClick={() => setCpForm({ ...cpForm, whatsapp_verified: !cpForm.whatsapp_verified })}
                      className={`w-full py-2.5 px-2.5 rounded-lg border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        cpForm.whatsapp_verified 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}>
                      <Check className={`w-3.5 h-3.5 ${cpForm.whatsapp_verified ? 'text-emerald-700' : 'text-slate-400'}`} />
                      {cpForm.whatsapp_verified ? t('agenda_whatsapp_verified', 'app') : t('agenda_whatsapp_validate', 'app')}
                    </button>
                  </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('agenda_email', 'app')}</label>
                  <input type="email" value={cpForm.email} onChange={e => setCpForm({ ...cpForm, email: e.target.value })}
                    placeholder="" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm pb-1 border-b border-slate-200">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>{t('agenda_full_address', 'app')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t('agenda_department', 'app')}</label>
                      <input type="text" value={cpForm.address_department} onChange={e => setCpForm({ ...cpForm, address_department: e.target.value })}
                        placeholder="" className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t('agenda_district', 'app')}</label>
                      <input type="text" value={cpForm.address_district} onChange={e => setCpForm({ ...cpForm, address_district: e.target.value })}
                        placeholder="" className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t('agenda_city', 'app')}</label>
                      <input type="text" value={cpForm.address_city} onChange={e => setCpForm({ ...cpForm, address_city: e.target.value })}
                        placeholder="" className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t('agenda_neighborhood', 'app')}</label>
                      <input type="text" value={cpForm.address_neighborhood} onChange={e => setCpForm({ ...cpForm, address_neighborhood: e.target.value })}
                        placeholder="" className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t('agenda_street', 'app')}</label>
                      <input type="text" value={cpForm.address_street} onChange={e => setCpForm({ ...cpForm, address_street: e.target.value })}
                        placeholder="" className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t('agenda_number', 'app')}</label>
                      <input type="text" value={cpForm.address_number} onChange={e => setCpForm({ ...cpForm, address_number: e.target.value })}
                        placeholder="" className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm" required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Convenio / Complementares */}
            {clinicPatientFormTab === 'complementary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_insurance_type', 'app')}</label>
                    <select value={cpForm.insurance_type} onChange={e => setCpForm({ ...cpForm, insurance_type: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                      <option value="">{t('agenda_select', 'app')}</option>
                      <option value="IPS">IPS</option>
                      <option value="Sanidade Militar">{t('agenda_ins_type_military', 'app')}</option>
                      <option value="Sanidade Policial">{t('agenda_ins_type_police', 'app')}</option>
                      <option value="Pre-paga">{t('agenda_ins_type_prepaid', 'app')}</option>
                      <option value="Seguro Privado">{t('agenda_ins_type_private', 'app')}</option>
                      <option value="Particular">{t('agenda_ins_type_particular', 'app')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_insurance_number', 'app')}</label>
                    <input type="text" value={cpForm.insurance_number} onChange={e => setCpForm({ ...cpForm, insurance_number: e.target.value })}
                      disabled={cpForm.insurance_type === 'Particular'}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-50 disabled:bg-slate-100"
                      required={cpForm.insurance_type !== 'Particular'} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_preferred_language_field', 'app')}</label>
                  <select value={cpForm.preferred_language} onChange={e => setCpForm({ ...cpForm, preferred_language: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                    <option value="">{t('agenda_select', 'app')}</option>
                    <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                    <option value="pt-PT">🇵🇹 Português (Portugal)</option>
                    <option value="es-AR">🇦🇷 Español (Argentina)</option>
                    <option value="es-PY">🇵🇾 Español (Paraguay)</option>
                    <option value="es">🇪🇸 Español (Geral)</option>
                    <option value="en">🇺🇸 English (US/UK)</option>
                    <option value="outros">{t('agenda_others', 'app')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_allergies_field', 'app')}</label>
                  <textarea value={cpForm.allergies} onChange={e => setCpForm({ ...cpForm, allergies: e.target.value })} rows={3}
                    placeholder="" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_notes', 'app')}</label>
                  <textarea value={cpForm.notes} onChange={e => setCpForm({ ...cpForm, notes: e.target.value })} rows={2}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
              </div>
            )}

            {/* Aba Responsavel (so aparece se menor de idade) */}
            {clinicPatientFormTab === 'guardian' && (
              <div className="space-y-4">
                {cpIsMinor && cpForm.birth_date && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {t('agenda_minor_patient', 'app').replace('{age}', String(cpAge))}
                      <br />
                      {t('agenda_guardian_required', 'app')}
                    </p>
                  </div>
                )}
                {!cpIsMinor && (
                  <p className="text-xs text-slate-500 mb-2">
                    {t('agenda_guardian_optional', 'app')}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('agenda_guardian_name', 'app')}{cpIsMinor ? ' *' : ''}</label>
                  <input type="text" value={cpForm.responsible_name} onChange={e => setCpForm({ ...cpForm, responsible_name: e.target.value })}
                    placeholder="" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required={cpIsMinor} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('agenda_document_type', 'app')}{cpIsMinor ? ' *' : ''}</label>
                    <select value={cpForm.responsible_document_type} onChange={e => setCpForm({ ...cpForm, responsible_document_type: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" required={cpIsMinor}>
                      <option value="">{t('agenda_select', 'app')}</option>
                      <option value="CI">{t('rcpt_doc_ci', 'app')}</option>
                      <option value="Pasaporte">{t('rcpt_doc_passport', 'app')}</option>
                      <option value="RG">{t('rcpt_doc_rg', 'app')}</option>
                      <option value="Outro">{t('rcpt_doc_other', 'app')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Cédula / Doc{cpIsMinor ? ' *' : ''}</label>
                    <div className="relative">
                      <input type="text" value={cpForm.responsible_document_number} onChange={e => setCpForm({ ...cpForm, responsible_document_number: e.target.value })}
                        placeholder="" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        required={cpIsMinor} />
                      {guardianCalculatedDV !== null && (
                        <span className="absolute right-2 top-2 px-1.5 py-0.5 bg-teal-50 border border-teal-100 text-teal-800 font-bold text-[10px] rounded">
                          DV: {guardianCalculatedDV}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('agenda_guardian_phone', 'app')}</label>
                  <input type="tel" value={cpForm.responsible_phone} onChange={e => setCpForm({ ...cpForm, responsible_phone: e.target.value })}
                    placeholder="" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('agenda_relationship', 'app')}{cpIsMinor ? ' *' : ''}</label>
                  <select value={cpForm.responsible_relationship} onChange={e => setCpForm({ ...cpForm, responsible_relationship: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required={cpIsMinor}>
                    <option value="">{t('rcpt_guardian_select_vinculo', 'app')}</option>
                    <option value="Pai">{t('rcpt_guardian_father', 'app')}</option>
                    <option value="Mãe">{t('rcpt_guardian_mother', 'app')}</option>
                    <option value="Tutor Legal">{t('rcpt_guardian_legal', 'app')}</option>
                    <option value="Cônjuge">{t('rcpt_guardian_spouse', 'app')}</option>
                    <option value="Filho(a)">{t('rcpt_guardian_child', 'app')}</option>
                    <option value="Outros">{t('rcpt_guardian_other', 'app')}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Actions */}
            {(() => {
              const isLastTab = cpIsMinor
                ? clinicPatientFormTab === 'guardian'
                : clinicPatientFormTab === 'complementary';

              const tabOrder: Array<'identification' | 'contact' | 'complementary' | 'guardian'> = cpIsMinor
                ? ['identification', 'contact', 'complementary', 'guardian']
                : ['identification', 'contact', 'complementary'];
              const currentIdx = tabOrder.indexOf(clinicPatientFormTab);
              const nextTab = currentIdx < tabOrder.length - 1 ? tabOrder[currentIdx + 1] : null;

              return (
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  {nextTab && (
                    <button type="button" onClick={() => setClinicPatientFormTab(nextTab)}
                      className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition flex items-center gap-1">
                      {t('agenda_next', 'app')} <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {isLastTab && (
                    <button type="submit" className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition">
                      {editingClinicPatient ? t('agenda_save_changes', 'app') : t('agenda_register_patient', 'app')}
                    </button>
                  )}
                  <button type="button" onClick={() => { setShowNewPatientModal(false); resetCpForm(); }}
                    className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
                </div>
              );
            })()}
          </form>
        </div>
      </InlineModal>

      {/* ==================== CALENDAR TAB ==================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Cascade Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-700">{t('agenda_filters', 'app')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Sede */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('agenda_branch', 'app')}</label>
                <select
                  value={calendarFilterBranch}
                  onChange={e => {
                    setCalendarFilterBranch(e.target.value);
                    setCalendarFilterSpecialty('');
                    setCalendarFilterRoom('');
                    setCalendarFilterDoctor('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{t('agenda_all_branches', 'app')}</option>
                  {locations.filter(l => l.status === 'ativo').map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              {/* Especialidade */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('agenda_specialty', 'app')}</label>
                <select
                  value={calendarFilterSpecialty}
                  onChange={e => {
                    setCalendarFilterSpecialty(e.target.value);
                    setCalendarFilterRoom('');
                    setCalendarFilterDoctor('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{t('agenda_all_specialties', 'app')}</option>
                  {calendarAvailableSpecialties.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>
              {/* Sala */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('agenda_room', 'app')}</label>
                <select
                  value={calendarFilterRoom}
                  onChange={e => {
                    setCalendarFilterRoom(e.target.value);
                    setCalendarFilterDoctor('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{t('agenda_all_rooms', 'app')}</option>
                  {calendarAvailableRooms.map(room => (
                    <option key={room.id} value={room.name}>{room.name}</option>
                  ))}
                </select>
              </div>
              {/* Profissional */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('agenda_professional', 'app')}</label>
                <select
                  value={calendarFilterDoctor}
                  onChange={e => setCalendarFilterDoctor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{t('agenda_all_professionals', 'app')}</option>
                  {calendarAvailableDoctors.map(doc => (
                    <option key={doc.id} value={doc.name}>{doc.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {(calendarFilterBranch || calendarFilterSpecialty || calendarFilterRoom || calendarFilterDoctor) && (
              <button
                onClick={() => {
                  setCalendarFilterBranch('');
                  setCalendarFilterSpecialty('');
                  setCalendarFilterRoom('');
                  setCalendarFilterDoctor('');
                }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> {t('agenda_clear_filters', 'app')}
              </button>
            )}
          </div>

          {/* Controls - View + Grouping + Date Navigation */}
          <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as const).map(v => (
                <button key={v} onClick={() => setCalendarView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    calendarView === v ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {v === 'day' ? t('agenda_day', 'app') : v === 'week' ? t('agenda_week', 'app') : t('agenda_month', 'app')}
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
                  {g === 'doctor' ? t('agenda_professional', 'app') : g === 'room' ? t('agenda_room', 'app') : g === 'specialty' ? t('agenda_specialty', 'app') : t('agenda_branch', 'app')}
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
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} lang={locale}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" />
              <button onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + (calendarView === 'day' ? 1 : calendarView === 'week' ? 7 : 30));
                setSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 text-xs font-semibold bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100">
                {t('agenda_today', 'app')}
              </button>
            </div>
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 mr-2">{t('agenda_legend', 'app')}</span>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg.replace('100', '400')}`} />
                {t(cfg.labelKey, 'app')}
              </span>
            ))}
          </div>

          {/* DAY VIEW */}
          {calendarView === 'day' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {Object.keys(groupedAppointments).length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-600">{t('agenda_no_appointments_date', 'app')}</p>
                  <p className="text-sm text-slate-400 mt-1">{t('agenda_drag_or_create', 'app')}</p>
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
                                <span className="text-sm font-bold text-slate-500">{normalizeTime(app.time)} {app.duration_minutes ? `(${app.duration_minutes}min)` : ''}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${sc.bg} ${sc.color}`}>{t(sc.labelKey, 'app')}</span>
                            </div>
                            <p className="text-base font-semibold text-slate-800 truncate">{app.patientName}</p>
                            <p className="text-sm text-slate-500 truncate">{app.doctorName} • {app.specialty}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {apptType && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${apptType.color}`}>
                                  {apptType.icon} {t(apptType.labelKey, 'app')}
                                </span>
                              )}
                              {app.modality && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${app.modality === 'Virtual' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {app.modality === 'Virtual' ? t('agenda_modality_virtual_emoji', 'app') : t('agenda_modality_presential_emoji', 'app')}
                                </span>
                              )}
                              {app.room && <span className="text-[10px] text-slate-400">📍 {app.room}</span>}
                              {app.resource && <span className="text-[10px] text-slate-400">🔧 {app.resource}</span>}
                              {app.insurance_type && <span className="text-[10px] text-blue-500">🏥 {app.insurance_type}</span>}
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200/50">
                                <button onClick={() => handleEditAppointment(app)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">{t('agenda_edit', 'app')}</button>
                                <button onClick={() => handleDeleteAppointment(app)} className="text-sm font-semibold text-rose-500 hover:text-rose-700">{t('agenda_delete', 'app')}</button>
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
                    else if (calendarGroupBy === 'room') key = app.room || t('agenda_no_room', 'app');
                    else if (calendarGroupBy === 'specialty') key = app.specialty;
                    else {
                      const loc = locations.find(l => l.id === app.branch);
                      key = loc?.name || app.branch || t('agenda_no_branch', 'app');
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
                        <p className="text-[10px] font-semibold uppercase">{d.toLocaleDateString(locale, { weekday: 'short' })}</p>
                        <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-800'}`}>{d.getDate()}</p>
                      </div>
                      <div className="p-1 space-y-1">
                        {Object.entries(dayGroups).map(([group, apps]) => (
                          <div key={group}>
                            <p className="text-[10px] font-bold text-slate-400 px-1 pt-1 truncate flex items-center gap-1">
                              {calendarGroupBy === 'branch' && <Building2 className="w-2.5 h-2.5 text-blue-400" />}
                              {calendarGroupBy === 'specialty' && <HeartPulse className="w-2.5 h-2.5 text-rose-400" />}
                              {calendarGroupBy === 'room' && <MapPin className="w-2.5 h-2.5 text-purple-400" />}
                              {calendarGroupBy === 'doctor' && <Stethoscope className="w-2.5 h-2.5 text-teal-400" />}
                              {group}
                            </p>
                            {apps.map(app => {
                              const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG['agendado'];
                              return (
                                <div key={app.id}
                                  className={`p-1.5 rounded text-[11px] border-l-2 ${sc.border} ${sc.bg} hover:bg-white transition-colors`}>
                                   <p className="font-bold truncate">{normalizeTime(app.time)} {app.patientName.split(' ')[0]}</p>
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
                {[t('agenda_dow_mon', 'app'), t('agenda_dow_tue', 'app'), t('agenda_dow_wed', 'app'), t('agenda_dow_thu', 'app'), t('agenda_dow_fri', 'app'), t('agenda_dow_sat', 'app'), t('agenda_dow_sun', 'app')].map(d => (
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
                    else if (calendarGroupBy === 'room') key = app.room || t('agenda_no_room', 'app');
                    else if (calendarGroupBy === 'specialty') key = app.specialty;
                    else {
                      const loc = locations.find(l => l.id === app.branch);
                      key = loc?.name || app.branch || t('agenda_no_branch', 'app');
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
                        {groupKeys.length > 0 ? (
                          groupKeys.slice(0, 3).map(group => (
                            <div key={group} className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                calendarGroupBy === 'branch' ? 'bg-blue-400' :
                                calendarGroupBy === 'specialty' ? 'bg-rose-400' :
                                calendarGroupBy === 'room' ? 'bg-purple-400' :
                                'bg-teal-400'
                              }`} />
                              <span className="text-[10px] text-slate-600 truncate font-semibold">
                                {calendarGroupBy === 'branch' ? group : group.split(' ')[0]} ({dayGroups[group].length})
                              </span>
                            </div>
                          ))
                        ) : (
                          dayApps.slice(0, 3).map(app => {
                            const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG['agendado'];
                            return (
                              <div key={app.id}
                                className={`text-xs px-1 py-0.5 rounded truncate ${sc.bg} ${sc.color} font-semibold hover:bg-white transition-colors`}>
                                {normalizeTime(app.time)} {app.patientName.split(' ')[0]}
                              </div>
                            );
                          })
                        )}
                        {dayApps.length > 3 && (
                          <p className="text-xs text-slate-400 font-semibold">+{dayApps.length - 3} {t('agenda_more_items', 'app')}</p>
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
                {t('agenda_blocks_title', 'app')} ({blockedSlots.length})
              </h3>
              {canEdit && (
                <button onClick={() => setShowBlockageModal(true)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition">
                  {t('agenda_new_block', 'app')}
                </button>
              )}
            </div>
            {blockedSlots.length === 0 ? (
              <p className="text-center text-slate-400 py-6">{t('agenda_no_blocks', 'app')}</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blockedSlots.map(b => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${b.reason === 'feriado' ? 'bg-red-500' : b.reason === 'férias' ? 'bg-blue-500' : b.reason === 'capacitação' ? 'bg-purple-500' : 'bg-rose-500'}`} />
                      <div>
                        <p className="font-semibold text-sm">{b.description}</p>
                        <p className="text-xs text-slate-500">
                          {b.start_date} a {b.end_date} {b.start_time && `(${normalizeTime(b.start_time)}-${normalizeTime(b.end_time || '')})`}
                          {b.doctor_name && ` • ${b.doctor_name}`}
                          {b.branch && ` • ${b.branch}`}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteBlockage(b.id)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">{t('agenda_remove', 'app')}</button>
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
              { label: t('agenda_total', 'app'), value: whatsappMetrics.total, icon: Send, color: 'text-slate-600', bg: 'bg-slate-50' },
              { label: t('agenda_sent', 'app'), value: whatsappMetrics.sent, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: t('agenda_delivered', 'app'), value: whatsappMetrics.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: t('agenda_read', 'app'), value: whatsappMetrics.read, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: t('agenda_confirmed', 'app'), value: `${whatsappMetrics.rate}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
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
              {t('agenda_whatsapp_reminders', 'app')} ({filteredReminders.length}{filteredReminders.length !== reminders.length ? ` de ${reminders.length}` : ''})
            </h3>
            <button onClick={() => setShowReminderModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t('agenda_new_reminder', 'app')}
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as const).map(v => (
                <button key={v} onClick={() => setWhatsappDateView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    whatsappDateView === v ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {v === 'day' ? t('agenda_day', 'app') : v === 'week' ? t('agenda_week', 'app') : t('agenda_month', 'app')}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button onClick={() => {
                const d = new Date(whatsappSelectedDate + 'T12:00:00');
                d.setDate(d.getDate() - (whatsappDateView === 'day' ? 1 : whatsappDateView === 'week' ? 7 : 30));
                setWhatsappSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <input type="date" value={whatsappSelectedDate} onChange={e => setWhatsappSelectedDate(e.target.value)} lang={locale}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" />
              <button onClick={() => {
                const d = new Date(whatsappSelectedDate + 'T12:00:00');
                d.setDate(d.getDate() + (whatsappDateView === 'day' ? 1 : whatsappDateView === 'week' ? 7 : 30));
                setWhatsappSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => setWhatsappSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                {t('agenda_today', 'app')}
              </button>
            </div>
          </div>

          {reminders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">{t('agenda_no_reminders', 'app')}</p>
              <p className="text-sm text-slate-400 mt-1">{t('agenda_create_reminders_hint', 'app')}</p>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">{t('agenda_no_reminders_period', 'app')}</p>
              <p className="text-sm text-slate-400 mt-1">{t('agenda_try_change_date_filter', 'app')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_patient', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_phone', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_reminder', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_consult_date', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_language', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_status', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_actions', 'app')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReminders.map(r => {
                    const linkedAppointment = r.appointment_id ? appointments.find(a => a.id === r.appointment_id) : null;
                    return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-sm">{r.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{r.patient_phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(r.scheduled_for).toLocaleDateString(locale)} {normalizeTime(new Date(r.scheduled_for).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }))}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{linkedAppointment ? `${linkedAppointment.date.split('-').reverse().join('/')} ${normalizeTime(linkedAppointment.time)}` : '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          r.language === 'es' ? 'bg-blue-100 text-blue-700' :
                          r.language === 'gn' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{r.language === 'pt-BR' ? 'Português (Brasil)' : r.language === 'pt-PT' ? 'Português (Portugal)' : r.language === 'es-AR' ? 'Español (Argentina)' : r.language === 'es-PY' ? 'Español (Paraguay)' : r.language === 'es' ? 'Español (Geral)' : r.language === 'gn' ? 'Guarani' : r.language === 'en' ? 'English' : r.language}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'sent' || r.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          r.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          r.status === 'rescheduled' ? 'bg-cyan-100 text-cyan-700' :
                          r.status === 'read' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{r.status === 'scheduled' ? t('agenda_wa_status_scheduled', 'app') : r.status === 'confirmed' ? t('agenda_wa_status_confirmed', 'app') : r.status === 'sent' ? t('agenda_wa_status_sent', 'app') : r.status === 'delivered' ? t('agenda_wa_status_delivered', 'app') : r.status === 'read' ? t('agenda_wa_status_read', 'app') : r.status === 'cancelled' ? t('agenda_wa_status_cancelled', 'app') : r.status === 'rescheduled' ? t('agenda_wa_status_rescheduled', 'app') : r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {r.status === 'scheduled' && (
                            <button onClick={() => simulateWhatsAppSend(r.id)} className="text-green-600 hover:text-green-800 text-xs font-semibold">{t('agenda_send', 'app')}</button>
                          )}
                          {r.status === 'read' && (
                            <>
                              <button onClick={() => simulateWhatsAppResponse(r.id, 'confirmed')} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold">✓</button>
                              <button onClick={() => simulateWhatsAppResponse(r.id, 'cancelled')} className="text-rose-600 hover:text-rose-800 text-xs font-semibold">✗</button>
                            </>
                          )}
                          <button onClick={() => handleDeleteReminder(r.id)} className="text-slate-400 hover:text-rose-600 text-xs font-semibold">{t('agenda_delete', 'app')}</button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
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
              {t('agenda_waitlist_title', 'app')} ({filteredWaitlist.length}{(waitlistFilterBranch || waitlistFilterSpecialty || waitlistFilterDoctor) ? ` de ${waitlist.length}` : ''})
            </h3>
            <button onClick={() => setShowWaitlistModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t('agenda_add_patient', 'app')}
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as const).map(v => (
                <button key={v} onClick={() => setWaitlistDateView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    waitlistDateView === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {v === 'day' ? t('agenda_day', 'app') : v === 'week' ? t('agenda_week', 'app') : t('agenda_month', 'app')}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button onClick={() => {
                const d = new Date(waitlistSelectedDate + 'T12:00:00');
                d.setDate(d.getDate() - (waitlistDateView === 'day' ? 1 : waitlistDateView === 'week' ? 7 : 30));
                setWaitlistSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <input type="date" value={waitlistSelectedDate} onChange={e => setWaitlistSelectedDate(e.target.value)} lang={locale}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" />
              <button onClick={() => {
                const d = new Date(waitlistSelectedDate + 'T12:00:00');
                d.setDate(d.getDate() + (waitlistDateView === 'day' ? 1 : waitlistDateView === 'week' ? 7 : 30));
                setWaitlistSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => setWaitlistSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100">
                {t('agenda_today', 'app')}
              </button>
            </div>
          </div>

          {/* Cascade Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700">{t('agenda_waitlist_filters', 'app')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Sede */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('agenda_branch', 'app')}</label>
                <select
                  value={waitlistFilterBranch}
                  onChange={e => {
                    setWaitlistFilterBranch(e.target.value);
                    setWaitlistFilterSpecialty('');
                    setWaitlistFilterDoctor('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('agenda_all_branches', 'app')}</option>
                  {locations.filter(l => l.status === 'ativo').map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              {/* Especialidade */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('agenda_specialty', 'app')}</label>
                <select
                  value={waitlistFilterSpecialty}
                  onChange={e => {
                    setWaitlistFilterSpecialty(e.target.value);
                    setWaitlistFilterDoctor('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('agenda_all_specialties', 'app')}</option>
                  {waitlistFilterSpecialties.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>
              {/* Profissional */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('agenda_professional', 'app')}</label>
                <select
                  value={waitlistFilterDoctor}
                  onChange={e => setWaitlistFilterDoctor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('agenda_all_professionals', 'app')}</option>
                  {waitlistFilterDoctors.map(doc => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>
            </div>
            {(waitlistFilterBranch || waitlistFilterSpecialty || waitlistFilterDoctor) && (
              <button
                onClick={() => {
                  setWaitlistFilterBranch('');
                  setWaitlistFilterSpecialty('');
                  setWaitlistFilterDoctor('');
                }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> {t('agenda_clear_filters', 'app')}
              </button>
            )}
          </div>

          {waitlist.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">{t('agenda_waitlist_empty', 'app')}</p>
            </div>
          ) : filteredWaitlist.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">{t('agenda_no_filter_results', 'app')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_patient', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_phone', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_specialty', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_professional', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_priority', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_status', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_preference', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_actions', 'app')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWaitlist.sort((a, b) => b.priority_score - a.priority_score).map(w => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-sm">{w.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.specialty}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{w.doctor_name || t('agenda_all_professionals', 'app')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          w.priority_criteria === 'urgency' ? 'bg-red-100 text-red-700' :
                          w.priority_criteria === 'coverage' ? 'bg-blue-100 text-blue-700' :
                          w.priority_criteria === 'seniority' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                           {w.priority_criteria === 'arrival' ? t('agenda_priority_arrival', 'app') :
                           w.priority_criteria === 'urgency' ? t('agenda_priority_urgency', 'app') :
                           w.priority_criteria === 'coverage' ? t('agenda_priority_coverage', 'app') : t('agenda_priority_seniority', 'app')}
                          {' '}({filteredWaitlist.filter(x => x.priority_criteria === w.priority_criteria).length})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          w.status === 'aguardando' ? 'bg-amber-100 text-amber-700' :
                          w.status === 'notificado' ? 'bg-blue-100 text-blue-700' :
                          w.status === 'alocado' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{w.status === 'aguardando' ? t('agenda_wl_status_waiting', 'app') : w.status === 'notificado' ? t('agenda_wl_status_notified', 'app') : w.status === 'alocado' ? t('agenda_wl_status_allocated', 'app') : w.status === 'cancelado' ? t('agenda_wl_status_cancelled', 'app') : w.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(w.status === 'notificado' || w.status === 'alocado') && (w.preferred_days?.length > 0 || w.preferred_hours?.length > 0 || w.allocated_date || w.notified_date) ? (
                          <div className="text-xs space-y-0.5">
                            {w.status === 'alocado' && w.allocated_date ? (
                               <p className="text-green-700 font-semibold">{t('agenda_waitlist_allocated_label', 'app')} {new Date(w.allocated_date + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })} {t('agenda_at_time_connector', 'app')} {normalizeTime(w.allocated_time || '')}</p>
                            ) : w.status === 'notificado' && w.notified_date ? (
                               <p className="text-blue-700 font-semibold">{t('agenda_waitlist_consult_label', 'app')} {new Date(w.notified_date + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })} {t('agenda_at_time_connector', 'app')} {normalizeTime(w.notified_time || '')}</p>
                            ) : (
                              <>
                                {w.preferred_days?.length > 0 && (
                                  <p className="text-slate-600"><span className="font-semibold">{t('agenda_days_label', 'app')}</span> {w.preferred_days.join(', ')}</p>
                                )}
                                {w.preferred_hours?.length > 0 && (
                                  <p className="text-slate-600"><span className="font-semibold">{t('agenda_hours_label', 'app')}</span> {w.preferred_hours.join(', ')}</p>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {w.status === 'aguardando' && (
                            <>
                              <button onClick={() => {
                                setNotifyEntry(w);
                                setShowNotifyModal(true);
                              }} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">{t('agenda_notify', 'app')}</button>
                              <button onClick={() => {
                                setAllocateEntry(w);
                                setAllocateDoctor(w.doctor_name || '');
                                setShowAllocateModal(true);
                              }} className="text-green-600 hover:text-green-800 text-xs font-semibold">{t('agenda_allocate', 'app')}</button>
                            </>
                          )}
                          <button onClick={() => {
                            setEditingWaitlistEntry(w);
                            setEditWaitlistForm({
                              patient_id: w.patient_id,
                              patient_name: w.patient_name,
                              phone: w.phone,
                              branch: w.branch || '',
                              specialty: w.specialty,
                              doctor_name: w.doctor_name || '',
                              priority_criteria: w.priority_criteria,
                              status: w.status,
                              preferred_days: w.preferred_days || [],
                              preferred_hours: w.preferred_hours || [],
                              allocated_date: w.allocated_date || '',
                              allocated_time: w.allocated_time || '',
                            });
                            setShowEditWaitlistModal(true);
                          }} className="text-amber-600 hover:text-amber-800 text-xs font-semibold">{t('agenda_edit', 'app')}</button>
                          <button onClick={() => handleDeleteWaitlist(w)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold">{t('agenda_delete', 'app')}</button>
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

      {/* ==================== CALL CENTER TAB ==================== */}
      {activeTab === 'callcenter' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {[
              { label: t('agenda_total', 'app'), value: callCenterKPIs.total, icon: PhoneCall, color: 'text-slate-600', bg: 'bg-slate-50' },
              { label: t('agenda_incoming', 'app'), value: callCenterKPIs.inbound, icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
              { label: t('agenda_outgoing', 'app'), value: callCenterKPIs.outbound, icon: PhoneOff, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: t('agenda_avg_duration', 'app'), value: `${callCenterKPIs.avgDuration}s`, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: t('agenda_today', 'app'), value: callCenterKPIs.todayCalls, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50' },
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
                  <p className="font-bold text-green-800">{t('agenda_active_call', 'app')}</p>
                  <p className="text-sm text-green-600">{activeCall.patient_name} • {activeCall.patient_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-mono font-bold text-green-700">
                  {Math.floor(callTimer / 60)}:{String(callTimer % 60).padStart(2, '0')}
                </span>
                <button onClick={endCall} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2">
                  <PhoneOff className="w-4 h-4" /> {t('agenda_end_call', 'app')}
                </button>
              </div>
            </div>
          )}

          {/* Date Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['day', 'week', 'month'] as const).map(v => (
                <button key={v} onClick={() => setCallDateView(v)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${callDateView === v ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:text-slate-800'}`}>
                  {v === 'day' ? t('agenda_day', 'app') : v === 'week' ? t('agenda_week', 'app') : t('agenda_month', 'app')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
              <button onClick={() => { const d = new Date(callSelectedDate); d.setDate(d.getDate() - (callDateView === 'day' ? 1 : callDateView === 'week' ? 7 : 30)); setCallSelectedDate(d.toISOString().split('T')[0]); }} className="text-slate-400 hover:text-slate-600">{'<'}</button>
              <input type="date" value={callSelectedDate} onChange={e => setCallSelectedDate(e.target.value)} lang={locale} className="text-xs text-slate-600 border-0 bg-transparent w-28 text-center" />
              <button onClick={() => { const d = new Date(callSelectedDate); d.setDate(d.getDate() + (callDateView === 'day' ? 1 : callDateView === 'week' ? 7 : 30)); setCallSelectedDate(d.toISOString().split('T')[0]); }} className="text-slate-400 hover:text-slate-600">{'>'}</button>
            </div>
            <button onClick={() => setCallSelectedDate(new Date().toISOString().split('T')[0])} className="px-3 py-1.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition">{t('agenda_today', 'app')}</button>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-rose-600" />
              {t('agenda_call_history', 'app')} ({filteredCallLogs.length}{filteredCallLogs.length !== callLogs.length ? ` de ${callLogs.length}` : ''})
            </h3>
            <button onClick={() => setShowCallModal(true)} className="px-4 py-2 bg-rose-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t('agenda_register_call', 'app')}
            </button>
          </div>

          {filteredCallLogs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <PhoneCall className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">{t('agenda_no_calls_period', 'app')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_operator', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_patient', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_type', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_reason', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_duration', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_datetime', 'app')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('agenda_th_actions', 'app')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCallLogs.slice(0, 50).map(c => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-sm">{c.operator_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.patient_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${c.type === 'inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.type === 'inbound' ? t('agenda_type_inbound', 'app') : t('agenda_type_outbound', 'app')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{(() => { const r = CALL_CENTER_REASONS.find(x => x.value === c.reason); return r ? t(r.labelKey, 'app') : c.reason; })()}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {Math.floor(c.duration_seconds / 60)}:{String(c.duration_seconds % 60).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(c.created_at).toLocaleString(locale)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startCall(c.patient_name, c.patient_phone)} className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-200 transition">{t('agenda_call', 'app')}</button>
                          <button onClick={() => startCall(c.patient_name, c.patient_phone, 'inbound')} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-200 transition">{t('agenda_receive', 'app')}</button>
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

      {/* ==================== MODALS ==================== */}

      {/* New Appointment Modal */}
      <InlineModal open={showNewApptModal} onClose={() => { setShowNewApptModal(false); resetNewApptForm(); }} className="max-w-2xl">
        <div className="p-6">
        <form onSubmit={handleNewAppointment} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('agenda_new_appointment_title', 'app')}</h3>
            </div>


            {/* Paciente (Busca em clinic_patients) */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_th_patient', 'app')} *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={newApptForm.patient_name || patientSearchQuery}
                  onChange={e => {
                    setPatientSearchQuery(e.target.value);
                    setShowPatientDropdown(true);
                    if (newApptForm.patient_id) {
                      setNewApptForm({ ...newApptForm, patient_id: '', patient_name: '' });
                    }
                  }}
                  onFocus={() => { setShowPatientDropdown(true); setPatientSearchQuery(''); }}
                  placeholder={t('agenda_search_patient', 'app')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required={!newApptForm.patient_id}
                />
                {newApptForm.patient_id && (
                  <button type="button" onClick={() => { setNewApptForm({ ...newApptForm, patient_id: '', patient_name: '' }); setPatientSearchQuery(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showPatientDropdown && !newApptForm.patient_id && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {clinicPatients.filter(cp => {
                    if (!patientSearchQuery) return true;
                    const q = patientSearchQuery.toLowerCase();
                    return cp.name.toLowerCase().includes(q) ||
                      (cp.document_number && cp.document_number.includes(q)) ||
                      (cp.phone && cp.phone.includes(q));
                  }).slice(0, 20).map(cp => (
                    <button key={cp.id} type="button"
                      onClick={() => { setNewApptForm({ ...newApptForm, patient_id: cp.id, patient_name: cp.name }); setShowPatientDropdown(false); setPatientSearchQuery(''); }}
                      className="w-full px-4 py-3 text-left hover:bg-teal-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition">
                      {cp.photo_url ? (
                        <img src={cp.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                          {cp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{cp.name}</p>
                        <p className="text-xs text-slate-500">{cp.document_type}: {cp.document_number || '-'} {cp.phone ? `| ${cp.phone}` : ''}</p>
                      </div>
                      {cp.insurance_type && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">{cp.insurance_type}</span>
                      )}
                    </button>
                  ))}
                  {clinicPatients.filter(cp => {
                    if (!patientSearchQuery) return true;
                    const q = patientSearchQuery.toLowerCase();
                    return cp.name.toLowerCase().includes(q) || (cp.document_number && cp.document_number.includes(q)) || (cp.phone && cp.phone.includes(q));
                  }).length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-slate-500">{t('agenda_no_patient_found', 'app')}</p>
                      <button type="button" onClick={() => { setShowPatientDropdown(false); resetCpForm(); setShowNewPatientModal(true); }}
                        className="mt-2 text-sm font-semibold text-teal-600 hover:text-teal-800">{t('agenda_register_new_patient', 'app')}</button>
            </div>
          )}
                </div>
              )}
              {showPatientDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowPatientDropdown(false)} />
              )}
            </div>

            {/* Modalidade + Sede + Sala */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_modality', 'app')}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewApptForm({ ...newApptForm, modality: 'Presencial' })}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition ${
                      newApptForm.modality === 'Presencial' ? 'bg-teal-100 border-teal-400 text-teal-700' : 'bg-white border-slate-200 text-slate-500'
                    }`}>{t('agenda_presential', 'app')}</button>
                  <button type="button" onClick={() => setNewApptForm({ ...newApptForm, modality: 'Virtual' })}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition ${
                      newApptForm.modality === 'Virtual' ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-white border-slate-200 text-slate-500'
                    }`}>{t('agenda_virtual', 'app')}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_branch', 'app')} *</label>
                <select value={newApptForm.branch} onChange={e => setNewApptForm({ ...newApptForm, branch: e.target.value, room: '', doctor_name: '', specialty: '' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_room', 'app')} *</label>
                <select value={newApptForm.room} onChange={e => setNewApptForm({ ...newApptForm, room: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!newApptForm.branch}>
                  <option value="">{newApptForm.branch ? t('agenda_select', 'app') : t('agenda_select_branch', 'app')}</option>
                  {availableRooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Especialidade + Profissional */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_specialty', 'app')} *</label>
                <select value={newApptForm.specialty} onChange={e => setNewApptForm({ ...newApptForm, specialty: e.target.value, doctor_name: '' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!newApptForm.branch}>
                  <option value="">{newApptForm.branch ? t('agenda_select_specialty', 'app') : t('agenda_select_branch_first', 'app')}</option>
                  {availableSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_professional', 'app')} *</label>
                <select value={newApptForm.doctor_name} onChange={e => setNewApptForm({ ...newApptForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!newApptForm.specialty}>
                  <option value="">{newApptForm.specialty ? t('agenda_select_professional', 'app') : t('agenda_select_specialty_first', 'app')}</option>
                  {availableProfessionals.map(p => <option key={p.id} value={p.name}>{p.name} - {p.specialty}</option>)}
                </select>
              </div>
            </div>

            {/* Tipo de Consulta */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_appointment_type', 'app')}</label>
              <div className="grid grid-cols-5 gap-1.5">
                {APPOINTMENT_TYPES.map(at => (
                  <button key={at.value} type="button" onClick={() => setNewApptForm({ ...newApptForm, type: at.value })}
                    className={`p-2 rounded-lg border-2 text-center transition text-xs font-semibold ${
                      newApptForm.type === at.value
                        ? `${at.color} border-current`
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    <span className="text-base block">{at.icon}</span>
                    <span className="mt-0.5 block">{t(at.labelKey, 'app')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data + Horário + Duração */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_date', 'app')}</label>
                <I18nDatePicker value={newApptForm.date} onChange={v => setNewApptForm({ ...newApptForm, date: v })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_time', 'app')}</label>
                <select value={newApptForm.time} onChange={e => setNewApptForm({ ...newApptForm, time: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!newApptForm.date}>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {TIME_SLOTS.map(slot => {
                    const blocked = isBlocked(newApptForm.date, slot, newApptForm.doctor_name, newApptForm.branch);
                    const occupied = hasTimeOverlap(newApptForm.date, slot, newApptForm.doctor_name, newApptForm.room);
                    return (
                      <option key={slot} value={slot} disabled={blocked || occupied} className={blocked || occupied ? 'text-red-400' : ''}>
                        {slot} {blocked ? t('agenda_time_blocked_label', 'app') : occupied ? t('agenda_time_occupied_label', 'app') : '✓'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_duration', 'app')}</label>
                <select value={newApptForm.duration_minutes} onChange={e => setNewApptForm({ ...newApptForm, duration_minutes: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value={15}>15 {t('agenda_minutes', 'app')}</option>
                  <option value={20}>20 {t('agenda_minutes', 'app')}</option>
                  <option value={30}>30 {t('agenda_minutes', 'app')}</option>
                  <option value={45}>45 {t('agenda_minutes', 'app')}</option>
                  <option value={60}>60 {t('agenda_minutes', 'app')}</option>
                  <option value={90}>90 {t('agenda_minutes', 'app')}</option>
                  <option value={120}>120 {t('agenda_minutes', 'app')}</option>
                </select>
              </div>
            </div>

            {/* Convênio/Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_insurance', 'app')}</label>
              <select value={newApptForm.insurance_type} onChange={e => {
                const it = INSURANCE_TYPES.find(i => i.value === e.target.value);
                setNewApptForm({ ...newApptForm, insurance_type: e.target.value || undefined, insurance: it ? t(it.labelKey, 'app') : '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select', 'app')}</option>
                {INSURANCE_TYPES.map(i => <option key={i.value} value={i.value}>{t(i.labelKey, 'app')}</option>)}
              </select>
            </div>

            {/* Cota Modalidade */}
            {newApptForm.insurance_type && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs font-bold text-blue-700 mb-1">{t('agenda_quota_modality_title', 'app').replace('{insurance}', newApptForm.insurance_type)}</p>
                <div className="flex gap-4">
                  {(() => {
                    const ins = INSURANCE_TYPES.find(i => i.value === newApptForm.insurance_type);
                    if (!ins) return null;
                    const presencialCount = appointments.filter(a => a.insurance_type === newApptForm.insurance_type && a.modality === 'Presencial' && a.date === newApptForm.date).length;
                    const virtualCount = appointments.filter(a => a.insurance_type === newApptForm.insurance_type && a.modality === 'Virtual' && a.date === newApptForm.date).length;
                    return (
                      <>
                        <div>
                          <span className="text-[10px] text-blue-600">{t('agenda_quota_presential', 'app').replace('{count}', String(presencialCount))}</span>
                          <div className="w-24 h-1.5 bg-blue-200 rounded-full mt-0.5">
                            <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (presencialCount / Math.max(1, ins.quotaPresencial)) * 100)}%` }} />
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-blue-600">{t('agenda_quota_virtual', 'app').replace('{count}', String(virtualCount))}</span>
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
                    ? `🔒 ${t('agenda_blocked_slot', 'app')}`
                    : hasTimeOverlap(newApptForm.date, newApptForm.time, newApptForm.doctor_name, newApptForm.room)
                    ? `⛔ ${t('agenda_conflict', 'app')}`
                    : `✓ ${t('agenda_available', 'app')}`}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition">{t('agenda_create_appointment', 'app')}</button>
              <button type="button" onClick={() => { setShowNewApptModal(false); resetNewApptForm(); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* Edit Appointment Modal */}
      <InlineModal open={showEditApptModal} onClose={() => { setShowEditApptModal(false); setEditingAppt(null); }} className="max-w-2xl">
        <div className="p-6">
          <form onSubmit={handleUpdateAppointment} className="space-y-4">
            <h3 className="font-bold text-lg">{t('agenda_edit_appointment', 'app')}</h3>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_th_status', 'app')} *</label>
              <select value={editApptForm.status} onChange={e => setEditApptForm({ ...editApptForm, status: e.target.value as Appointment['status'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{t(cfg.labelKey, 'app')}</option>
                ))}
              </select>
            </div>

            {/* Paciente */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_th_patient', 'app')} *</label>
              <select value={editApptForm.patient_id} onChange={e => {
                const p = patients.find(p => p.id === e.target.value);
                setEditApptForm({ ...editApptForm, patient_id: e.target.value, patient_name: p?.name || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select', 'app')}</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Sede + Sala */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_branch', 'app')} *</label>
                <select value={editApptForm.branch} onChange={e => setEditApptForm({ ...editApptForm, branch: e.target.value, room: '' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_room', 'app')} *</label>
                <select value={editApptForm.room} onChange={e => setEditApptForm({ ...editApptForm, room: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!editApptForm.branch}>
                  <option value="">{editApptForm.branch ? t('agenda_select_room', 'app') : t('agenda_select_branch_first', 'app')}</option>
                  {locations.filter(l => l.id === editApptForm.branch).length > 0 &&
                    clinicalRooms.filter(r => r.location_id === editApptForm.branch).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Especialidade + Profissional */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_specialty', 'app')} *</label>
                <select value={editApptForm.specialty} onChange={e => setEditApptForm({ ...editApptForm, specialty: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {availableSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_professional', 'app')} *</label>
                <select value={editApptForm.doctor_name} onChange={e => setEditApptForm({ ...editApptForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {availableProfessionals.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Data + Horário + Duração */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_date', 'app')}</label>
                <I18nDatePicker value={editApptForm.date} onChange={v => setEditApptForm({ ...editApptForm, date: v })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_time', 'app')} *</label>
                <select value={editApptForm.time} onChange={e => setEditApptForm({ ...editApptForm, time: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!editApptForm.date}>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {TIME_SLOTS.map(slot => {
                    const occupied = hasTimeOverlap(editApptForm.date, slot, editApptForm.doctor_name, editApptForm.room, editingAppt?.id);
                    return (
                      <option key={slot} value={slot} disabled={occupied} className={occupied ? 'text-red-400' : ''}>
                        {slot} {occupied ? t('agenda_time_occupied_label', 'app') : '✓'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_duration', 'app')}</label>
                <select value={editApptForm.duration_minutes} onChange={e => setEditApptForm({ ...editApptForm, duration_minutes: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value={15}>15 {t('agenda_minutes', 'app')}</option>
                  <option value={20}>20 {t('agenda_minutes', 'app')}</option>
                  <option value={30}>30 {t('agenda_minutes', 'app')}</option>
                  <option value={45}>45 {t('agenda_minutes', 'app')}</option>
                  <option value={60}>60 {t('agenda_minutes', 'app')}</option>
                  <option value={90}>90 {t('agenda_minutes', 'app')}</option>
                  <option value={120}>120 {t('agenda_minutes', 'app')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition">{t('agenda_save_changes', 'app')}</button>
              <button type="button" onClick={() => { setShowEditApptModal(false); setEditingAppt(null); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* Blockage Modal */}
      <InlineModal open={showBlockageModal} onClose={() => setShowBlockageModal(false)} className="max-w-md">
        <div className="p-6">
          <form onSubmit={handleBlockageSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">{t('agenda_new_block_title', 'app')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sede *</label>
                <select value={blockForm.branch} onChange={e => setBlockForm({ ...blockForm, branch: e.target.value, doctor_name: '' })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">{t('agenda_select_branch', 'app')}</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_professionals', 'app')} *</label>
                <select value={blockForm.doctor_name} onChange={e => setBlockForm({ ...blockForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!blockForm.branch}>
                  <option value="">{blockForm.branch ? t('agenda_all_professionals', 'app') : t('agenda_select_branch_first', 'app')}</option>
                  {blockProfessionals.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_start_date', 'app')}</label>
                <I18nDatePicker value={blockForm.start_date} onChange={v => setBlockForm({ ...blockForm, start_date: v })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_end_date', 'app')}</label>
                <I18nDatePicker value={blockForm.end_date} onChange={v => setBlockForm({ ...blockForm, end_date: v })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_start_time', 'app')}</label>
                <input type="time" value={blockForm.start_time} onChange={e => setBlockForm({ ...blockForm, start_time: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_end_time', 'app')}</label>
                <input type="time" value={blockForm.end_time} onChange={e => setBlockForm({ ...blockForm, end_time: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_reason_required', 'app')}</label>
              <select value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value as BlockedSlot['reason'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="feriado">{t('agenda_block_type_holiday', 'app')}</option>
                <option value="férias">{t('agenda_block_type_vacation', 'app')}</option>
                <option value="capacitação">{t('agenda_block_type_training', 'app')}</option>
                <option value="emergência">{t('agenda_block_type_emergency', 'app')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_description', 'app')}</label>
              <input type="text" value={blockForm.description} onChange={e => setBlockForm({ ...blockForm, description: e.target.value })} placeholder={t('agenda_block_description_placeholder', 'app')} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">{t('agenda_register', 'app')}</button>
              <button type="button" onClick={() => setShowBlockageModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_close', 'app')}</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* WhatsApp Reminder Modal */}
      <InlineModal open={showReminderModal} onClose={() => { setShowReminderModal(false); setReminderForm({ patient_id: '', patient_name: '', patient_phone: '', appointment_id: '', language: '', template_id: '' }); }} className="max-w-md">
        <div className="p-6">
          <form onSubmit={handleReminderSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">{t('agenda_schedule_reminder_title', 'app')}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_patient', 'app')}</label>
              <select value={reminderForm.patient_id} onChange={e => {
                const p = clinicPatients.find(p => p.id === e.target.value);
                setReminderForm({ ...reminderForm, patient_id: e.target.value, patient_name: p?.name || '', patient_phone: p?.phone || '', appointment_id: '', language: detectLanguage(p?.nationality) });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select_patient', 'app')}</option>
                {clinicPatients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_linked_appointment', 'app')}</label>
              <select value={reminderForm.appointment_id} onChange={e => {
                const appt = reminderAppointments.find(a => a.id === e.target.value);
                setReminderForm({ ...reminderForm, appointment_id: e.target.value, template_id: appt ? suggestTemplate(appt.date, appt.time) : reminderForm.template_id });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required disabled={!reminderForm.patient_id}>
                <option value="">{!reminderForm.patient_id ? t('agenda_select_patient_first', 'app') : t('agenda_select_appointment', 'app')}</option>
                {reminderAppointments.map(a => (
                   <option key={a.id} value={a.id}>{a.date} {normalizeTime(a.time)} - {a.doctorName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_language', 'app')}</label>
                <select value={reminderForm.language} onChange={e => setReminderForm({ ...reminderForm, language: e.target.value as typeof reminderForm.language })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">{t('agenda_select', 'app')}</option>
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="pt-PT">Português (Portugal)</option>
                  <option value="es-AR">Español (Argentina)</option>
                  <option value="es-PY">Español (Paraguay)</option>
                  <option value="es">Español (Geral)</option>
                  <option value="gn">Guarani</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_template', 'app')}</label>
                <select value={reminderForm.template_id} onChange={e => setReminderForm({ ...reminderForm, template_id: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">{t('agenda_select', 'app')}</option>
                  {WHATSAPP_TEMPLATES.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{t(tpl.nameKey, 'app')} ({tpl.hoursBefore}{t('agenda_hours_before', 'app')})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 mb-1">{t('agenda_message_preview', 'app')}</p>
              <p className="text-sm text-slate-700">
                {(() => {
                  const tpl = WHATSAPP_TEMPLATES.find(t => t.id === reminderForm.template_id);
                  const text = tpl?.[getLangMessageKey(reminderForm.language)] || tpl?.messageEs || '';
                  const selectedAppt = reminderAppointments.find(a => a.id === reminderForm.appointment_id);
                  return text
                    .replace('{nombre}', reminderForm.patient_name || '{nombre}')
                    .replace('{profesional}', selectedAppt?.doctorName || '{profesional}')
                    .replace('{fecha}', selectedAppt ? new Date(selectedAppt.date + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '{fecha}')
                    .replace('{hora}', selectedAppt ? normalizeTime(selectedAppt.time) : '{hora}')
                    .replace('{sede}', selectedAppt?.branch || '{sede}');
                })() || t('agenda_select_template', 'app')}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">{t('agenda_schedule', 'app')}</button>
              <button type="button" onClick={() => { setShowReminderModal(false); setReminderForm({ patient_id: '', patient_name: '', patient_phone: '', appointment_id: '', language: '', template_id: '' }); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* Waitlist Modal */}
      <InlineModal open={showWaitlistModal} onClose={() => { setShowWaitlistModal(false); setWaitlistForm({ patient_id: '', patient_name: '', phone: '', branch: '', specialty: '', doctor_name: '', priority_criteria: 'arrival', preferred_days: [], preferred_hours: [] }); }} className="max-w-md">
        <div className="p-6">
          <form onSubmit={handleWaitlistSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">{t('agenda_add_to_waitlist_title', 'app')}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_patient', 'app')}</label>
              <select value={waitlistForm.patient_id} onChange={e => {
                const p = clinicPatients.find(p => p.id === e.target.value);
                setWaitlistForm({ ...waitlistForm, patient_id: e.target.value, patient_name: p?.name || '', phone: p?.phone || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select_patient', 'app')}</option>
                {clinicPatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_branch', 'app')}</label>
              <select value={waitlistForm.branch} onChange={e => {
                setWaitlistForm({ ...waitlistForm, branch: e.target.value, specialty: '', doctor_name: '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select_branch', 'app')}</option>
                {locations.filter(l => l.status === 'ativo').map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_specialty', 'app')}</label>
              <select value={waitlistForm.specialty} onChange={e => {
                setWaitlistForm({ ...waitlistForm, specialty: e.target.value, doctor_name: '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select_specialty', 'app')}</option>
                {waitlistAvailableSpecialties.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_professional', 'app')}</label>
              <select value={waitlistForm.doctor_name} onChange={e => setWaitlistForm({ ...waitlistForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">{t('agenda_all_professionals', 'app')}</option>
                {waitlistAvailableDoctors.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_priority_criteria', 'app')}</label>
              <select value={waitlistForm.priority_criteria} onChange={e => setWaitlistForm({ ...waitlistForm, priority_criteria: e.target.value as WaitlistEntry['priority_criteria'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="arrival">{t('agenda_priority_arrival', 'app')}</option>
                <option value="urgency">{t('agenda_priority_urgency', 'app')}</option>
                <option value="coverage">{t('agenda_priority_coverage', 'app')}</option>
                <option value="seniority">{t('agenda_priority_seniority', 'app')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_preferred_days', 'app')}</label>
              <div className="flex flex-wrap gap-2">
                {[t('agenda_day_mon', 'app'), t('agenda_day_tue', 'app'), t('agenda_day_wed', 'app'), t('agenda_day_thu', 'app'), t('agenda_day_fri', 'app'), t('agenda_day_sat', 'app')].map((day, i) => (
                  <label key={i} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={waitlistForm.preferred_days.includes(day)} onChange={e => {
                      const newDays = e.target.checked 
                        ? [...waitlistForm.preferred_days, day]
                        : waitlistForm.preferred_days.filter(d => d !== day);
                      setWaitlistForm({ ...waitlistForm, preferred_days: newDays });
                    }} className="rounded" />
                    {day}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_preferred_hours', 'app')}</label>
              <div className="flex flex-wrap gap-2">
                {[t('agenda_pref_hours_morning', 'app'), t('agenda_pref_hours_afternoon', 'app'), t('agenda_pref_hours_night', 'app')].map((hour, i) => (
                  <label key={i} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={waitlistForm.preferred_hours.includes(hour)} onChange={e => {
                      const newHours = e.target.checked 
                        ? [...waitlistForm.preferred_hours, hour]
                        : waitlistForm.preferred_hours.filter(h => h !== hour);
                      setWaitlistForm({ ...waitlistForm, preferred_hours: newHours });
                    }} className="rounded" />
                    {hour}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">{t('agenda_add', 'app')}</button>
              <button type="button" onClick={() => { setShowWaitlistModal(false); setWaitlistForm({ patient_id: '', patient_name: '', phone: '', branch: '', specialty: '', doctor_name: '', priority_criteria: 'arrival', preferred_days: [], preferred_hours: [] }); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
            </div>
          </form>
        </div>
      </InlineModal>

      {/* Waitlist - Notify Modal */}
      <InlineModal open={showNotifyModal} onClose={() => setShowNotifyModal(false)} className="max-w-md">
        <div className="p-6">
          <h3 className="font-bold text-lg mb-4">{t('agenda_notify_patient', 'app')}</h3>
          {notifyEntry && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-semibold">{notifyEntry.patient_name}</p>
                <p className="text-xs text-slate-500">{notifyEntry.phone} • {notifyEntry.specialty}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_language', 'app')}</label>
                <select value={notifyLanguage} onChange={e => setNotifyLanguage(e.target.value as typeof notifyLanguage)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">{t('agenda_select', 'app')}</option>
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="pt-PT">Português (Portugal)</option>
                  <option value="es-AR">Español (Argentina)</option>
                  <option value="es-PY">Español (Paraguay)</option>
                  <option value="es">Español (Geral)</option>
                  <option value="gn">Guarani</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_template', 'app')}</label>
                <select value={notifyTemplate} onChange={e => setNotifyTemplate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">{t('agenda_select', 'app')}</option>
                  {WHATSAPP_TEMPLATES.map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>{t(tmpl.nameKey, 'app')} ({tmpl.hoursBefore}{t('agenda_hours_before', 'app')})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_consult_date_label', 'app')} <span className="text-red-500">*</span></label>
                  <I18nDatePicker value={notifyConsultDate} onChange={setNotifyConsultDate} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_th_consult_date', 'app')} <span className="text-red-500">*</span></label>
                  <select value={notifyConsultTime} onChange={e => setNotifyConsultTime(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <option value="">{t('agenda_select', 'app')}</option>
                    {TIME_SLOTS.map(slot => {
                      const taken = isTimeSlotTaken(notifyConsultDate, slot, notifyEntry.doctor_name || '', appointments, waitlist, notifyEntry.id);
                      const blocked = isBlocked(notifyConsultDate, slot, (notifyEntry.doctor_name || ''), notifyEntry.branch || undefined);
                      const disabled = taken || blocked;
                      return <option key={slot} value={slot} disabled={disabled}>{slot} {taken ? `(${t('agenda_time_occupied_label', 'app').replace('⛔ ', '')})` : blocked ? `(${t('agenda_time_blocked_label', 'app').replace('🔒 ', '')})` : ''}</option>;
                    })}
                  </select>
                </div>
              </div>
              {notifyConsultDate && notifyEntry.doctor_name && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 mb-2">{t('agenda_unavailable_times', 'app')}</p>
                  <div className="flex flex-wrap gap-1">
                    {TIME_SLOTS.filter(slot => {
                      const docName = notifyEntry.doctor_name || '';
                      const taken = isTimeSlotTaken(notifyConsultDate, slot, docName, appointments, waitlist, notifyEntry.id);
                      const blocked = isBlocked(notifyConsultDate, slot, docName, notifyEntry.branch || undefined);
                      return taken || blocked;
                    }).map(slot => (
                      <span key={slot} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">{slot}</span>
                    ))}
                    {TIME_SLOTS.filter(slot => {
                      const docName = notifyEntry.doctor_name || '';
                      const taken = isTimeSlotTaken(notifyConsultDate, slot, docName, appointments, waitlist, notifyEntry.id);
                      const blocked = isBlocked(notifyConsultDate, slot, docName, notifyEntry.branch || undefined);
                      return taken || blocked;
                    }).length === 0 && (
                      <span className="text-xs text-green-600">{t('agenda_all_times_available', 'app')}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 mb-1">{t('agenda_message_preview', 'app')}</p>
                <p className="text-sm text-blue-800">
                  {WHATSAPP_TEMPLATES.find(t => t.id === notifyTemplate)?.[
                    getLangMessageKey(notifyLanguage)
                  ]
                    .replace('{nombre}', notifyEntry.patient_name)
                    .replace('{profesional}', notifyEntry.doctor_name || t('agenda_any_professional', 'app'))
                    .replace('{sede}', locations.find(l => l.id === notifyEntry.branch)?.name || t('agenda_branch_fallback', 'app'))
                    .replace('{fecha}', notifyConsultDate || t('agenda_not_defined', 'app'))
                    .replace('{hora}', notifyConsultTime || t('agenda_not_defined', 'app'))
                    || t('agenda_select_template', 'app')}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={handleNotifySubmit} className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">{t('agenda_send_notification', 'app')}</button>
                <button type="button" onClick={() => setShowNotifyModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
              </div>
            </div>
          )}
        </div>
      </InlineModal>

      {/* Waitlist - Allocate Modal */}
      <InlineModal open={showAllocateModal} onClose={() => setShowAllocateModal(false)} className="max-w-lg">
        <div className="p-6">
            <h3 className="font-bold text-lg mb-4">{t('agenda_allocate_patient_title', 'app')}</h3>
          {allocateEntry && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-semibold">{allocateEntry.patient_name}</p>
                <p className="text-xs text-slate-500">{allocateEntry.phone} • {allocateEntry.specialty}</p>
                <p className="text-xs text-slate-500">{t('agenda_branch', 'app')}: {locations.find(l => l.id === allocateEntry.branch)?.name || t('agenda_not_defined', 'app')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_date', 'app')}</label>
                  <I18nDatePicker value={allocateDate} onChange={setAllocateDate} minDate={new Date().toISOString().split('T')[0]} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_time', 'app')}</label>
                  <select value={allocateTime} onChange={e => setAllocateTime(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                    <option value="">{t('agenda_select', 'app')}</option>
                    {TIME_SLOTS.map(slot => {
                      const taken = isTimeSlotTaken(allocateDate, slot, allocateDoctor, appointments, waitlist);
                      return <option key={slot} value={slot} disabled={taken}>{slot} {taken ? `(${t('agenda_time_occupied_label', 'app').replace('⛔ ', '')})` : ''}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_professional', 'app')}</label>
                <select value={allocateDoctor} onChange={e => setAllocateDoctor(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                  <option value="">{t('agenda_select', 'app')}</option>
                  {professionals.filter(p => {
                    if (p.status !== 'ativo') return false;
                    if (allocateEntry.branch && p.locationId && p.locationId !== allocateEntry.branch) return false;
                    if (allocateEntry.specialty && p.specialty !== allocateEntry.specialty) return false;
                    return true;
                  }).map(p => (
                    <option key={p.id} value={p.name}>{p.name} - {p.specialty}</option>
                  ))}
                </select>
              </div>
              {allocateDate && allocateDoctor && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 mb-2">{t('agenda_occupied_times', 'app')}</p>
                  <div className="flex flex-wrap gap-1">
                    {appointments.filter(a => a.date === allocateDate && a.doctorName === allocateDoctor && a.status !== 'cancelado').map(a => (
                       <span key={a.id} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">{normalizeTime(a.time)}</span>
                    ))}
                    {appointments.filter(a => a.date === allocateDate && a.doctorName === allocateDoctor && a.status !== 'cancelado').length === 0 && (
                      <span className="text-xs text-green-600">{t('agenda_no_occupied_times', 'app')}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={handleAllocateSubmit} disabled={!allocateDate || !allocateTime || !allocateDoctor} className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition">{t('agenda_allocate_and_schedule', 'app')}</button>
                <button type="button" onClick={() => setShowAllocateModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
              </div>
            </div>
          )}
        </div>
      </InlineModal>

      {/* Waitlist - Edit Modal */}
      <InlineModal open={showEditWaitlistModal} onClose={() => setShowEditWaitlistModal(false)} className="max-w-md">
        <div className="p-6">
          <h3 className="font-bold text-lg mb-4">{t('agenda_edit_waitlist', 'app')}</h3>
          {editingWaitlistEntry && (
            <div className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_patient', 'app')}</label>
              <select value={editWaitlistForm.patient_id} onChange={e => {
                const p = patients.find(p => p.id === e.target.value);
                setEditWaitlistForm({ ...editWaitlistForm, patient_id: e.target.value, patient_name: p?.name || '', phone: p?.phone || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select_patient', 'app')}</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_branch', 'app')}</label>
              <select value={editWaitlistForm.branch} onChange={e => {
                setEditWaitlistForm({ ...editWaitlistForm, branch: e.target.value, specialty: '', doctor_name: '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select_branch', 'app')}</option>
                  {locations.filter(l => l.status === 'ativo').map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_specialty', 'app')}</label>
              <select value={editWaitlistForm.specialty} onChange={e => {
                setEditWaitlistForm({ ...editWaitlistForm, specialty: e.target.value, doctor_name: '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select_specialty', 'app')}</option>
                  {waitlistAvailableSpecialties.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_professional', 'app')}</label>
                <select value={editWaitlistForm.doctor_name} onChange={e => setEditWaitlistForm({ ...editWaitlistForm, doctor_name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">{t('agenda_all_professionals', 'app')}</option>
                  {waitlistAvailableDoctors.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_priority_criteria', 'app')}</label>
                <select value={editWaitlistForm.priority_criteria} onChange={e => setEditWaitlistForm({ ...editWaitlistForm, priority_criteria: e.target.value as WaitlistEntry['priority_criteria'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="arrival">{t('agenda_priority_arrival', 'app')}</option>
                  <option value="urgency">{t('agenda_priority_urgency', 'app')}</option>
                  <option value="coverage">{t('agenda_priority_coverage', 'app')}</option>
                  <option value="seniority">{t('agenda_priority_seniority', 'app')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_status', 'app')}</label>
                <select value={editWaitlistForm.status} onChange={e => setEditWaitlistForm({ ...editWaitlistForm, status: e.target.value as WaitlistEntry['status'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="aguardando">{t('agenda_wl_status_waiting', 'app')}</option>
                  <option value="notificado">{t('agenda_wl_status_notified', 'app')}</option>
                  <option value="alocado">{t('agenda_wl_status_allocated', 'app')}</option>
                  <option value="cancelado">{t('agenda_wl_status_cancelled', 'app')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_preferred_days', 'app')}</label>
                <div className="flex flex-wrap gap-2">
                  {[t('agenda_day_mon', 'app'), t('agenda_day_tue', 'app'), t('agenda_day_wed', 'app'), t('agenda_day_thu', 'app'), t('agenda_day_fri', 'app'), t('agenda_day_sat', 'app')].map((day, i) => (
                    <label key={i} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={editWaitlistForm.preferred_days.includes(day)} onChange={e => {
                        const newDays = e.target.checked 
                          ? [...editWaitlistForm.preferred_days, day]
                          : editWaitlistForm.preferred_days.filter(d => d !== day);
                        setEditWaitlistForm({ ...editWaitlistForm, preferred_days: newDays });
                      }} className="rounded" />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_preferred_hours', 'app')}</label>
                <div className="flex flex-wrap gap-2">
                  {[t('agenda_pref_hours_morning', 'app'), t('agenda_pref_hours_afternoon', 'app'), t('agenda_pref_hours_night', 'app')].map((hour, i) => (
                    <label key={i} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={editWaitlistForm.preferred_hours.includes(hour)} onChange={e => {
                        const newHours = e.target.checked 
                          ? [...editWaitlistForm.preferred_hours, hour]
                          : editWaitlistForm.preferred_hours.filter(h => h !== hour);
                        setEditWaitlistForm({ ...editWaitlistForm, preferred_hours: newHours });
                      }} className="rounded" />
                      {hour}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={handleEditWaitlistSubmit} className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">{t('agenda_save_changes', 'app')}</button>
                <button type="button" onClick={() => setShowEditWaitlistModal(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
              </div>
            </div>
          )}
        </div>
      </InlineModal>

      {/* Call Center Modal */}
      <InlineModal open={showCallModal} onClose={() => { setShowCallModal(false); setCallForm({ operator_name: activeOperator, patient_id: '', patient_name: '', patient_phone: '', type: '', reason: '', notes: '', duration_seconds: 0 }); }} className="max-w-md">
        <div className="p-6">
          <form onSubmit={handleCallSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">{t('agenda_register_call_title', 'app')}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_patient', 'app')}</label>
              <select value={callForm.patient_id} onChange={e => {
                const p = clinicPatients.find(p => p.id === e.target.value);
                setCallForm({ ...callForm, patient_id: e.target.value, patient_name: p?.name || '', patient_phone: p?.phone || '' });
              }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" required>
                <option value="">{t('agenda_select_patient', 'app')}</option>
                {clinicPatients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_type', 'app')}</label>
                <select value={callForm.type} onChange={e => setCallForm({ ...callForm, type: e.target.value as CallLog['type'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">{t('agenda_select', 'app')}</option>
                  <option value="inbound">{t('agenda_type_inbound', 'app')}</option>
                  <option value="outbound">{t('agenda_type_outbound', 'app')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_reason', 'app')}</label>
                <select value={callForm.reason} onChange={e => setCallForm({ ...callForm, reason: e.target.value as CallLog['reason'] })} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">{t('agenda_select', 'app')}</option>
                  {CALL_CENTER_REASONS.map(r => <option key={r.value} value={r.value}>{t(r.labelKey, 'app')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t('agenda_call_notes', 'app')}</label>
              <textarea value={callForm.notes} onChange={e => setCallForm({ ...callForm, notes: e.target.value })} rows={3} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition">{t('agenda_register', 'app')}</button>
              <button type="button" onClick={() => { setShowCallModal(false); setCallForm({ operator_name: activeOperator, patient_id: '', patient_name: '', patient_phone: '', type: '', reason: '', notes: '', duration_seconds: 0 }); }} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition">{t('agenda_cancel', 'app')}</button>
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
