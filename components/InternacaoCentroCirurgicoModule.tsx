'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BedV2, BedStatus, BedType, BedSector,
  BedTransfer,
  SurgerySchedule, SurgeryStatus, AnesthesiaType, SurgicalTeam,
  SurgicalChecklist, IntraoperativeRecord,
  HospitalizationEpisode, HospitalizationStatus, CoverageType,
  MedicalEvolution, NursingSheet,
  HospitalAlert, AlertType,
  BedOccupationReport, HospitalizationReport, SurgeryReport, FinancialHospitalReport, StayReport,
  initialBedsV2, initialBedTransfers,
  initialSurgerySchedule,
  initialHospitalizations,
  initialHospitalAlerts,
  Patient, initialPatients,
} from '@/lib/mockData';
import { useI18n } from '@/lib/i18n/I18nContext';
import {
  BedDouble, CalendarClock, Users, FileBarChart,
  Plus, Search, AlertTriangle, Check, X, RefreshCw,
  Filter, ChevronDown, ChevronUp, Clock, User, Stethoscope,
  Syringe, Activity, ClipboardList, FileText, ArrowRight,
  AlertCircle, Info, CheckCircle, Ban, Circle,
  Building2, Eye, Trash2, Download, CalendarDays,
  ListTodo, HeartPulse, NotebookPen, BadgeInfo,
  Printer, Sparkles, LayoutDashboard, LayoutList,
  Pill, Thermometer, Droplets,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InternacaoCentroCirurgicoModuleProps {
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
}

type TabType = 'dashboard' | 'leitos' | 'cirurgia' | 'internacao' | 'relatorios';

const STATUS_COLORS: Record<BedStatus, string> = {
  livre: 'bg-green-500',
  ocupado: 'bg-red-500',
  limpeza: 'bg-amber-400',
  manutencao: 'bg-gray-400',
  reservado: 'bg-blue-400',
  bloqueado: 'bg-gray-700',
};

const STATUS_LABELS: Record<BedStatus, string> = {
  livre: 'Livre',
  ocupado: 'Ocupado',
  limpeza: 'Em Limpeza',
  manutencao: 'Manutenção',
  reservado: 'Reservado',
  bloqueado: 'Bloqueado',
};

const SURGERY_STATUS_COLORS: Record<SurgeryStatus, string> = {
  programada: 'bg-slate-400',
  confirmada: 'bg-blue-500',
  paciente_em_sala: 'bg-amber-400',
  em_intervencao: 'bg-red-500',
  em_recuperacao: 'bg-purple-500',
  finalizada: 'bg-green-500',
  suspensa: 'bg-orange-400',
  cancelada: 'bg-gray-600',
};

const SURGERY_STATUS_LABELS: Record<SurgeryStatus, string> = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  paciente_em_sala: 'Paciente em Sala',
  em_intervencao: 'Em Intervenção',
  em_recuperacao: 'Em Recuperação',
  finalizada: 'Finalizada',
  suspensa: 'Suspensa',
  cancelada: 'Cancelada',
};

const HOSP_STATUS_LABELS: Record<HospitalizationStatus, string> = {
  ativa: 'Ativa',
  alta_medica: 'Alta Médica',
  alta_voluntaria: 'Alta Voluntária',
  alta_administrativa: 'Alta Administrativa',
  transferencia: 'Transferência',
  obito: 'Óbito',
};

const HOSP_STATUS_COLORS: Record<HospitalizationStatus, string> = {
  ativa: 'bg-blue-500',
  alta_medica: 'bg-green-500',
  alta_voluntaria: 'bg-amber-400',
  alta_administrativa: 'bg-orange-500',
  transferencia: 'bg-purple-500',
  obito: 'bg-gray-800',
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function InternacaoCentroCirurgicoModule({
  activeSubmodule,
  addAuditLog,
  patients,
  setPatients,
}: InternacaoCentroCirurgicoModuleProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabType>('dashboard');
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<BedStatus | 'todos'>('todos');

  // Data
  const [beds, setBeds] = useState<BedV2[]>(initialBedsV2);
  const [transfers, setTransfers] = useState<BedTransfer[]>(initialBedTransfers);
  const [surgeries, setSurgeries] = useState<SurgerySchedule[]>(initialSurgerySchedule);
  const [hospitalizations, setHospitalizations] = useState<HospitalizationEpisode[]>(initialHospitalizations);
  const [alerts, setAlerts] = useState<HospitalAlert[]>(initialHospitalAlerts);

  // Auto-transition beds from 'limpeza' to 'livre' after 30 minutes
  useEffect(() => {
    const CLEANING_DURATION_MS = 30 * 60 * 1000; // 30 minutes
    const interval = setInterval(() => {
      const now = Date.now();
      setBeds(prev => prev.map(b => {
        if (b.status === 'limpeza' && b.lastCleaningAt) {
          const cleaningTime = new Date(b.lastCleaningAt).getTime();
          if (now - cleaningTime >= CLEANING_DURATION_MS) {
            return { ...b, status: 'livre' as BedStatus };
          }
        }
        return b;
      }));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<'surgeryForm' | 'admissionForm' | 'transferForm' | 'dischargeForm' | 'evolutionForm' | 'checklistForm' | 'nursingForm' | 'bedDetail' | 'surgeryDetail' | 'hospitalizationDetail' | 'alertPanel'>('surgeryForm');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Surgery form
  const [surgForm, setSurgForm] = useState({
    patientId: '', patientName: '', surgeon: '', room: '',
    procedureType: '', estimatedDuration: 60, anesthesiaType: 'geral' as AnesthesiaType,
    scheduledDate: '', scheduledTime: '', preOpDiagnosis: '', notes: '',
    anesthesiologist: '', instrumentator: '', circulator: '', assistants: '',
  });

  // Admission form
  const [admitForm, setAdmitForm] = useState({
    patientId: '', patientName: '', reason: '', initialDiagnosis: '',
    initialCid10: '', responsibleDoctor: '', coverageType: 'particular' as CoverageType,
    coverageAuthorization: '', bedId: '',
  });

  // Transfer form
  const [transferForm, setTransferForm] = useState({
    patientId: '', patientName: '', bedFromId: '', bedFromName: '',
    bedToId: '', reason: '', notes: '',
  });

  // Discharge form
  const [dischargeForm, setDischargeForm] = useState({
    dischargeType: 'alta_medica' as HospitalizationStatus,
    summary: '', doctor: '', transferInstitution: '', deathCause: '', deathCertificate: '',
  });

  // Evolution form
  const [evolForm, setEvolForm] = useState({
    subjective: '', objective: '', assessment: '', plan: '',
    bp: '', hr: 0, rr: 0, temp: '', spo2: 0,
  });

  // Checklist form
  const [checkForm, setCheckForm] = useState({
    patientIdentityVerified: false,
    lateralityVerified: false,
    fastingVerified: false,
    preOpExamsVerified: false,
    informedConsentSigned: false,
    antibioticProphylaxis: false,
    notes: '',
  });

  const [nursForm, setNursForm] = useState({
    date: todayStr(), shift: 'manha' as 'manha' | 'tarde' | 'noite',
    intake: 0, output: 0, observations: '',
  });

  // Computed stats
  const stats = useMemo(() => {
    const total = beds.length;
    const occupied = beds.filter(b => b.status === 'ocupado').length;
    const free = beds.filter(b => b.status === 'livre').length;
    const cleaning = beds.filter(b => b.status === 'limpeza').length;
    const maintenance = beds.filter(b => b.status === 'manutencao').length;
    const reserved = beds.filter(b => b.status === 'reservado').length;
    const blocked = beds.filter(b => b.status === 'bloqueado').length;
    const todaySurg = surgeries.filter(s => s.scheduledDate === todayStr());
    const activeHosp = hospitalizations.filter(h => h.status === 'ativa');
    const unreadAlerts = alerts.filter(a => !a.resolved);
    return { total, occupied, free, cleaning, maintenance, reserved, blocked, todaySurg, activeHosp, unreadAlerts };
  }, [beds, surgeries, hospitalizations, alerts]);

  // Filtered beds
  const filteredBeds = useMemo(() => {
    return beds.filter(b => {
      if (statusFilter !== 'todos' && b.status !== statusFilter) return false;
      if (sectorFilter !== 'todos' && b.sector !== sectorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return b.name.toLowerCase().includes(q) || (b.patientName && b.patientName.toLowerCase().includes(q));
      }
      return true;
    });
  }, [beds, statusFilter, sectorFilter, search]);

  const sectors = useMemo(() => [...new Set(beds.map(b => b.sector))], [beds]);

  // Filtered hospitalizations
  const filteredHosp = useMemo(() => {
    if (!search) return hospitalizations;
    const q = search.toLowerCase();
    return hospitalizations.filter(h =>
      h.patientName.toLowerCase().includes(q) ||
      h.initialDiagnosis.toLowerCase().includes(q) ||
      h.responsibleDoctor.toLowerCase().includes(q)
    );
  }, [hospitalizations, search]);

  function openModal(content: typeof modalContent, item?: any) {
    setModalContent(content);
    setSelectedItem(item || null);
    setShowModal(true);
  }

  function addSurgery() {
    if (!surgForm.patientName || !surgForm.surgeon || !surgForm.scheduledDate) return;
    const newSurg: SurgerySchedule = {
      id: `surg_${Date.now()}`,
      patientId: surgForm.patientId || `pat_${Date.now()}`,
      patientName: surgForm.patientName,
      surgeon: surgForm.surgeon,
      team: {
        surgeon: surgForm.surgeon,
        anesthesiologist: surgForm.anesthesiologist,
        instrumentator: surgForm.instrumentator,
        circulator: surgForm.circulator,
        assistants: surgForm.assistants ? surgForm.assistants.split(',').map(s => s.trim()).filter(Boolean) : [],
      },
      room: surgForm.room,
      procedureType: surgForm.procedureType,
      procedureCode: '',
      estimatedDuration: surgForm.estimatedDuration,
      anesthesiaType: surgForm.anesthesiaType,
      specialMaterials: [],
      status: 'programada',
      scheduledDate: surgForm.scheduledDate,
      scheduledTime: surgForm.scheduledTime,
      preOpDiagnosis: surgForm.preOpDiagnosis,
      notes: surgForm.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSurgeries(prev => [newSurg, ...prev]);
    addAuditLog('Agendou Cirurgia', `${surgForm.patientName} - ${surgForm.procedureType}`);
    setShowModal(false);
    setSurgForm({ patientId: '', patientName: '', surgeon: '', room: '', procedureType: '', estimatedDuration: 60, anesthesiaType: 'geral', scheduledDate: '', scheduledTime: '', preOpDiagnosis: '', notes: '', anesthesiologist: '', instrumentator: '', circulator: '', assistants: '' });
  }

  function admitPatient() {
    if (!admitForm.patientName || !admitForm.responsibleDoctor || !admitForm.bedId) return;
    const bed = beds.find(b => b.id === admitForm.bedId);
    if (!bed) return;
    const newHosp: HospitalizationEpisode = {
      id: `hosp_${Date.now()}`,
      patientId: admitForm.patientId || `pat_${Date.now()}`,
      patientName: admitForm.patientName,
      admissionDate: todayStr(),
      admissionTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      reason: admitForm.reason,
      initialDiagnosis: admitForm.initialDiagnosis,
      initialCid10: admitForm.initialCid10,
      responsibleDoctor: admitForm.responsibleDoctor,
      coverageType: admitForm.coverageType,
      coverageAuthorization: admitForm.coverageAuthorization,
      bedId: admitForm.bedId,
      bedName: bed.name,
      status: 'ativa',
      medicalEvolutions: [],
      nursingSheets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setHospitalizations(prev => [newHosp, ...prev]);
    setBeds(prev => prev.map(b => b.id === admitForm.bedId ? { ...b, status: 'ocupado', patientId: admitForm.patientId, patientName: admitForm.patientName, entryDate: todayStr() } : b));
    if (admitForm.patientId) {
      setPatients(prev => prev.map(p => p.id === admitForm.patientId ? { ...p, status: 'internado' as const } : p));
    }
    addAuditLog('Admitiu Paciente', `${admitForm.patientName} em ${bed.name}`);
    setShowModal(false);
    setAdmitForm({ patientId: '', patientName: '', reason: '', initialDiagnosis: '', initialCid10: '', responsibleDoctor: '', coverageType: 'particular', coverageAuthorization: '', bedId: '' });
  }

  function transferBed() {
    if (!transferForm.bedToId || !transferForm.reason) return;
    const bedFrom = beds.find(b => b.id === transferForm.bedFromId);
    const bedTo = beds.find(b => b.id === transferForm.bedToId);
    if (!bedFrom || !bedTo) return;
    const newTransfer: BedTransfer = {
      id: `bt_${Date.now()}`,
      bedFromId: transferForm.bedFromId,
      bedFromName: bedFrom.name,
      bedToId: transferForm.bedToId,
      bedToName: bedTo.name,
      patientId: transferForm.patientId,
      patientName: transferForm.patientName,
      reason: transferForm.reason,
      transferredBy: 'Operador',
      transferredAt: new Date().toISOString(),
      notes: transferForm.notes,
    };
    setTransfers(prev => [newTransfer, ...prev]);
    setBeds(prev => prev.map(b => {
      if (b.id === transferForm.bedFromId) return { ...b, status: 'livre', patientId: undefined, patientName: undefined, entryDate: undefined };
      if (b.id === transferForm.bedToId) return { ...b, status: 'ocupado', patientId: transferForm.patientId, patientName: transferForm.patientName, entryDate: todayStr() };
      return b;
    }));
    setHospitalizations(prev => prev.map(h => h.patientId === transferForm.patientId ? { ...h, bedId: transferForm.bedToId, bedName: bedTo.name } : h));
    addAuditLog('Transferiu Leito', `${transferForm.patientName}: ${bedFrom.name} -> ${bedTo.name}`);
    setShowModal(false);
  }

  function dischargePatient(hosp: HospitalizationEpisode) {
    const updatedHosp = {
      ...hosp,
      status: dischargeForm.dischargeType,
      dischargeDate: new Date().toISOString(),
      dischargeSummary: dischargeForm.summary,
      dischargeDoctor: dischargeForm.doctor || hosp.responsibleDoctor,
      transferInstitution: dischargeForm.transferInstitution,
      deathCause: dischargeForm.deathCause,
      deathCertificate: dischargeForm.deathCertificate,
    };
    setHospitalizations(prev => prev.map(h => h.id === hosp.id ? updatedHosp : h));
    setBeds(prev => prev.map(b => b.id === hosp.bedId ? { ...b, status: 'limpeza', patientId: undefined, patientName: undefined, entryDate: undefined, lastCleaningAt: new Date().toISOString() } : b));
    setPatients(prev => prev.map(p => p.id === hosp.patientId ? { ...p, status: 'atendido' as const } : p));
    addAuditLog('Realizou Alta', `${hosp.patientName} - ${dischargeForm.dischargeType}`);
    setShowModal(false);
    setDischargeForm({ dischargeType: 'alta_medica', summary: '', doctor: '', transferInstitution: '', deathCause: '', deathCertificate: '' });
  }

  function addEvolution(hosp: HospitalizationEpisode) {
    const newEvol: MedicalEvolution = {
      id: `evol_${Date.now()}`,
      hospitalizationId: hosp.id,
      patientId: hosp.patientId,
      date: todayStr(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      doctor: evolForm.assessment ? 'Médico' : '',
      subjective: evolForm.subjective,
      objective: evolForm.objective,
      assessment: evolForm.assessment,
      plan: evolForm.plan,
      vitalSigns: { bp: evolForm.bp, hr: evolForm.hr, rr: evolForm.rr, temp: evolForm.temp, spo2: evolForm.spo2 },
      createdAt: new Date().toISOString(),
    };
    setHospitalizations(prev => prev.map(h => h.id === hosp.id ? { ...h, medicalEvolutions: [...h.medicalEvolutions, newEvol], updatedAt: new Date().toISOString() } : h));
    addAuditLog('Adicionou Evolução', `${hosp.patientName}`);
    setShowModal(false);
    setEvolForm({ subjective: '', objective: '', assessment: '', plan: '', bp: '', hr: 0, rr: 0, temp: '', spo2: 0 });
  }

  function addNursingSheet(hosp: HospitalizationEpisode) {
    const newSheet: NursingSheet = {
      id: `nurs_${Date.now()}`,
      hospitalizationId: hosp.id,
      patientId: hosp.patientId,
      date: nursForm.date,
      shift: nursForm.shift,
      nurse: 'Enfermeiro',
      vitalSigns: [],
      fluidBalance: { intake: nursForm.intake, output: nursForm.output, balance: nursForm.intake - nursForm.output },
      medications: [],
      interventions: [],
      observations: nursForm.observations,
      createdAt: new Date().toISOString(),
    };
    setHospitalizations(prev => prev.map(h => h.id === hosp.id ? { ...h, nursingSheets: [...h.nursingSheets, newSheet] } : h));
    addAuditLog('Adicionou Folha de Enfermagem', `${hosp.patientName}`);
    setShowModal(false);
    setNursForm({ date: todayStr(), shift: 'manha', intake: 0, output: 0, observations: '' });
  }

  function completeChecklist(surg: SurgerySchedule) {
    const newCheck: SurgicalChecklist = {
      id: `check_${Date.now()}`,
      surgeryId: surg.id,
      patientIdentityVerified: checkForm.patientIdentityVerified,
      lateralityVerified: checkForm.lateralityVerified,
      fastingVerified: checkForm.fastingVerified,
      preOpExamsVerified: checkForm.preOpExamsVerified,
      informedConsentSigned: checkForm.informedConsentSigned,
      antibioticProphylaxis: checkForm.antibioticProphylaxis,
      checklistCompletedBy: 'Operador',
      checklistCompletedAt: new Date().toISOString(),
      notes: checkForm.notes,
    };
    setSurgeries(prev => prev.map(s => s.id === surg.id ? { ...s, checklist: newCheck, status: 'confirmada' } : s));
    addAuditLog('Completou Checklist', `${surg.patientName} - ${surg.procedureType}`);
    setShowModal(false);
    setCheckForm({ patientIdentityVerified: false, lateralityVerified: false, fastingVerified: false, preOpExamsVerified: false, informedConsentSigned: false, antibioticProphylaxis: false, notes: '' });
  }

  function resolveAlert(alertId: string) {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: 'Operador' } : a));
    addAuditLog('Resolveu Alerta', alertId);
  }

  function getAlertIcon(type: AlertType) {
    switch (type) {
      case 'alta_prevista': return <Info className="w-4 h-4 text-blue-500" />;
      case 'tempo_internacao_excedido': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'limpeza_excedida': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'conflito_sala': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'checklist_pendente': return <ClipboardList className="w-4 h-4 text-purple-500" />;
    }
  }

  // Reports
  const bedReport = useMemo((): BedOccupationReport[] => {
    return sectors.map(sector => {
      const sectorBeds = beds.filter(b => b.sector === sector);
      const total = sectorBeds.length;
      const occupied = sectorBeds.filter(b => b.status === 'ocupado').length;
      return {
        date: todayStr(),
        sector,
        bedType: sector,
        totalBeds: total,
        occupiedBeds: occupied,
        freeBeds: total - occupied,
        occupancyRate: total ? Math.round((occupied / total) * 100) : 0,
      };
    });
  }, [beds, sectors]);

  const hospReport = useMemo((): HospitalizationReport[] => {
    const byDoctor: Record<string, { admissions: string[]; discharges: string[]; days: number[] }> = {};
    hospitalizations.forEach(h => {
      if (!byDoctor[h.responsibleDoctor]) byDoctor[h.responsibleDoctor] = { admissions: [h.id], discharges: [], days: [] };
      else byDoctor[h.responsibleDoctor].admissions.push(h.id);
      if (h.status !== 'ativa' && h.admissionDate) {
        const adm = new Date(h.admissionDate);
        const dis = h.dischargeDate ? new Date(h.dischargeDate) : new Date();
        const days = Math.floor((dis.getTime() - adm.getTime()) / 86400000);
        byDoctor[h.responsibleDoctor].days.push(days);
        byDoctor[h.responsibleDoctor].discharges.push(h.id);
      }
    });
    return Object.entries(byDoctor).map(([doctor, data]) => ({
      period: '2026-06',
      specialty: '',
      doctor,
      diagnosis: '',
      coverage: '',
      admissions: data.admissions.length,
      discharges: data.discharges.length,
      averageStay: data.days.length ? Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length) : 0,
      deaths: hospitalizations.filter(h => h.status === 'obito' && h.responsibleDoctor === doctor).length,
    }));
  }, [hospitalizations]);

  const surgeryReport = useMemo((): SurgeryReport[] => {
    const bySurgeon: Record<string, { scheduled: string[]; performed: string[]; suspended: string[]; cancelled: string[]; durations: number[] }> = {};
    surgeries.forEach(s => {
      if (!bySurgeon[s.surgeon]) bySurgeon[s.surgeon] = { scheduled: [], performed: [], suspended: [], cancelled: [], durations: [] };
      bySurgeon[s.surgeon].scheduled.push(s.id);
      if (s.status === 'finalizada' || s.status === 'em_recuperacao') bySurgeon[s.surgeon].performed.push(s.id);
      if (s.status === 'suspensa') bySurgeon[s.surgeon].suspended.push(s.id);
      if (s.status === 'cancelada') bySurgeon[s.surgeon].cancelled.push(s.id);
      if (s.estimatedDuration) bySurgeon[s.surgeon].durations.push(s.estimatedDuration);
    });
    return Object.entries(bySurgeon).map(([surgeon, data]) => ({
      period: '2026-06',
      surgeon,
      procedureType: '',
      scheduled: data.scheduled.length,
      performed: data.performed.length,
      suspended: data.suspended.length,
      cancelled: data.cancelled.length,
      averageDuration: data.durations.length ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length) : 0,
    }));
  }, [surgeries]);

  const stayReports = useMemo((): StayReport[] => {
    const avgStayByCid: Record<string, number> = { K80: 4, M17: 3, O80: 3 };
    return hospitalizations.filter(h => h.status !== 'ativa').map(h => {
      const adm = new Date(h.admissionDate);
      const dis = h.dischargeDate ? new Date(h.dischargeDate) : new Date();
      const actual = Math.floor((dis.getTime() - adm.getTime()) / 86400000);
      const avg = avgStayByCid[h.initialCid10] || 5;
      return {
        patientId: h.patientId,
        patientName: h.patientName,
        diagnosis: h.initialDiagnosis,
        actualStay: actual,
        averageStayForDiagnosis: avg,
        difference: actual - avg,
      };
    });
  }, [hospitalizations]);

  const totalDirect = hospitalizations.reduce((acc, h) => acc + (h.status === 'ativa' ? 1500 : 2000), 0);
  const totalRevenue = hospitalizations.reduce((acc, h) => acc + (h.coverageType === 'particular' ? 5000 : 3500), 0);

  // ─── RENDER ───
  return (
    <div className="font-sans space-y-4">
      {/* Header tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
        {([
          { key: 'dashboard' as TabType, label: 'Dashboard / Mapa de Leitos', icon: LayoutDashboard },
          { key: 'leitos' as TabType, label: 'Controle de Leitos', icon: BedDouble },
          { key: 'cirurgia' as TabType, label: 'Agenda Cirúrgica', icon: CalendarClock },
          { key: 'internacao' as TabType, label: 'Pacientes Internados', icon: Users },
          { key: 'relatorios' as TabType, label: 'Relatórios', icon: FileBarChart },
        ]).map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => { setTab(t.key); addAuditLog('Aba Internação', t.label); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${tab === t.key ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: 'Total Leitos', value: stats.total, color: 'text-slate-800' },
          { label: 'Ocupados', value: stats.occupied, color: 'text-red-600' },
          { label: 'Livres', value: stats.free, color: 'text-green-600' },
          { label: 'Limpeza', value: stats.cleaning, color: 'text-amber-600' },
          { label: 'Reservados', value: stats.reserved, color: 'text-blue-600' },
          { label: 'Cirurgias Hoje', value: stats.todaySurg.length, color: 'text-purple-600' },
          { label: 'Alertas', value: stats.unreadAlerts.length, color: 'text-rose-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ───── ALERTS BAR ───── */}
      {stats.unreadAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4" /> Alertas ({stats.unreadAlerts.length})
          </div>
          {stats.unreadAlerts.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-amber-100 text-xs">
              <div className="flex items-center gap-2">
                {getAlertIcon(a.type)}
                <div>
                  <span className="font-bold text-slate-800">{a.title}</span>
                  <span className="text-slate-500 ml-2">{a.description}</span>
                </div>
              </div>
              <button onClick={() => resolveAlert(a.id)} className="p-1 hover:bg-amber-100 rounded cursor-pointer" title="Resolver">
                <Check className="w-4 h-4 text-green-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ───── TAB: DASHBOARD ───── */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* Mapa visual interativo de leitos */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-violet-600" /> Mapa de Leitos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {beds.map(bed => (
                <div key={bed.id} onClick={() => openModal('bedDetail', bed)}
                  className="border border-slate-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition bg-white">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[bed.status]}`} />
                    <Badge variant="outline" className="text-[9px] font-bold">{bed.sector}</Badge>
                  </div>
                  <p className="font-bold text-xs text-slate-800">{bed.name}</p>
                  <p className="text-[10px] text-slate-500">{STATUS_LABELS[bed.status]}</p>
                  {bed.patientName && (
                    <p className="text-[10px] font-semibold text-slate-700 mt-1 truncate">{bed.patientName}</p>
                  )}
                  {bed.specialFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bed.specialFeatures.slice(0, 3).map(f => (
                        <span key={f} className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">{f.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline de cirurgias de hoje */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-purple-600" /> Cirurgias de Hoje
            </h3>
            {stats.todaySurg.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhuma cirurgia programada para hoje.</p>
            ) : (
              <div className="space-y-2">
                {stats.todaySurg.map(s => (
                  <div key={s.id} onClick={() => openModal('surgeryDetail', s)}
                    className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-100 cursor-pointer hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${SURGERY_STATUS_COLORS[s.status]}`} />
                      <div>
                        <p className="font-bold text-xs text-slate-800">{s.patientName}</p>
                        <p className="text-[10px] text-slate-500">{s.procedureType} | {s.scheduledTime} | {s.room}</p>
                      </div>
                    </div>
                    <Badge className={`text-[9px] ${s.status === 'finalizada' ? 'bg-green-100 text-green-700' : s.status === 'em_intervencao' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {SURGERY_STATUS_LABELS[s.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pacientes internados ativos */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Pacientes Internados ({stats.activeHosp.length})
            </h3>
            {stats.activeHosp.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum paciente internado no momento.</p>
            ) : (
              <div className="space-y-2">
                {stats.activeHosp.map(h => (
                  <div key={h.id} onClick={() => openModal('hospitalizationDetail', h)}
                    className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-100 cursor-pointer hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <div>
                        <p className="font-bold text-xs text-slate-800">{h.patientName}</p>
                        <p className="text-[10px] text-slate-500">{h.initialDiagnosis} | {h.bedName} | Dr. {h.responsibleDoctor}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      {Math.floor((new Date().getTime() - new Date(h.admissionDate).getTime()) / 86400000)} dias
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── TAB: LEITOS ───── */}
      {tab === 'leitos' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar leito ou paciente..." className="pl-9 text-xs h-9" />
            </div>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-semibold">
              <option value="todos">Todos os Setores</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as BedStatus | 'todos')}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-semibold">
              <option value="todos">Todos os Status</option>
              {(Object.entries(STATUS_LABELS) as [BedStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSearch(''); setSectorFilter('todos'); setStatusFilter('todos'); }}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Limpar
            </Button>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-slate-600">
            {(Object.entries(STATUS_LABELS) as [BedStatus, string][]).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[k]}`} /> {v}
              </span>
            ))}
          </div>

          {/* Grid de leitos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredBeds.map(bed => (
              <div key={bed.id} onClick={() => openModal('bedDetail', bed)}
                className={`border-2 rounded-xl p-3 cursor-pointer hover:shadow-md transition bg-white
                  ${bed.status === 'ocupado' ? 'border-red-200' : bed.status === 'livre' ? 'border-green-200' : bed.status === 'limpeza' ? 'border-amber-200' : bed.status === 'reservado' ? 'border-blue-200' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[bed.status]}`} />
                    <p className="font-bold text-xs text-slate-800">{bed.name}</p>
                  </div>
                  <Badge variant="outline" className="text-[8px]">{bed.type.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="text-[10px] text-slate-500">{bed.sector} | {bed.wing}</p>
                {bed.patientName && (
                  <div className="mt-2 bg-slate-50 rounded-lg p-2">
                    <p className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                      <User className="w-3 h-3" /> {bed.patientName}
                    </p>
                    {bed.entryDate && <p className="text-[9px] text-slate-400">Desde {bed.entryDate}</p>}
                    {bed.doctor && <p className="text-[9px] text-slate-500">Dr. {bed.doctor}</p>}
                  </div>
                )}
                {bed.isolation && <Badge className="mt-1 text-[8px] bg-amber-100 text-amber-700">Isolamento</Badge>}
                {bed.lastCleaningAt && <p className="text-[8px] text-slate-400 mt-1">Limpeza: {timeAgo(bed.lastCleaningAt)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── TAB: CIRURGIA ───── */}
      {tab === 'cirurgia' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cirurgia..." className="pl-9 text-xs h-9" />
            </div>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs font-bold" onClick={() => openModal('surgeryForm')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nova Cirurgia
            </Button>
          </div>

          <div className="space-y-2">
            {surgeries.filter(s => {
              if (!search) return true;
              const q = search.toLowerCase();
              return s.patientName.toLowerCase().includes(q) || s.procedureType.toLowerCase().includes(q) || s.surgeon.toLowerCase().includes(q);
            }).map(s => (
              <div key={s.id} onClick={() => openModal('surgeryDetail', s)}
                className="bg-white border border-slate-200/80 rounded-xl p-3 cursor-pointer hover:shadow-sm transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${SURGERY_STATUS_COLORS[s.status]}`} />
                    <div>
                      <p className="font-bold text-xs text-slate-800">{s.patientName}</p>
                      <p className="text-[10px] text-slate-500">{s.procedureType} | {s.room} | {s.scheduledDate} {s.scheduledTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{s.surgeon}</span>
                    <Badge className={`text-[9px] ${s.status === 'finalizada' ? 'bg-green-100 text-green-700' : s.status === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {SURGERY_STATUS_LABELS[s.status]}
                    </Badge>
                  </div>
                </div>
                {s.checklist && (
                  <div className="mt-1.5 flex items-center gap-1 text-[9px] text-green-600">
                    <CheckCircle className="w-3 h-3" /> Checklist completo por {s.checklist.checklistCompletedBy}
                  </div>
                )}
                {!s.checklist && s.status !== 'cancelada' && s.status !== 'suspensa' && (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedItem(s); openModal('checklistForm'); }}
                    className="mt-1.5 text-[9px] text-amber-600 font-semibold hover:underline flex items-center gap-1">
                    <ClipboardList className="w-3 h-3" /> Checklist pendente
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── TAB: INTERNAÇÃO ───── */}
      {tab === 'internacao' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..." className="pl-9 text-xs h-9" />
            </div>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs font-bold" onClick={() => openModal('admissionForm')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nova Internação
            </Button>
          </div>

          <div className="space-y-2">
            {filteredHosp.map(h => {
              const daysAdmitted = Math.floor((new Date().getTime() - new Date(h.admissionDate).getTime()) / 86400000);
              return (
                <div key={h.id} onClick={() => openModal('hospitalizationDetail', h)}
                  className="bg-white border border-slate-200/80 rounded-xl p-3 cursor-pointer hover:shadow-sm transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${HOSP_STATUS_COLORS[h.status]}`} />
                      <div>
                        <p className="font-bold text-xs text-slate-800">{h.patientName}</p>
                        <p className="text-[10px] text-slate-500">{h.initialDiagnosis} | Leito: {h.bedName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div className="text-[10px] text-slate-500">
                        <p className="font-semibold">{h.responsibleDoctor}</p>
                        <p>{h.admissionDate} ({daysAdmitted}d)</p>
                      </div>
                      <Badge className={`text-[9px] ${h.status === 'ativa' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {HOSP_STATUS_LABELS[h.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="outline" className="text-[8px]">{h.coverageType.replace(/_/g, ' ')}</Badge>
                    {h.status === 'ativa' && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedItem(h); openModal('evolutionForm'); }}
                          className="text-[9px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-semibold hover:bg-sky-100 transition cursor-pointer">
                          + Evolução
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedItem(h); openModal('nursingForm'); }}
                          className="text-[9px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold hover:bg-teal-100 transition cursor-pointer">
                          + Enfermagem
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedItem(h); openModal('dischargeForm'); }}
                          className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold hover:bg-amber-100 transition cursor-pointer">
                          Alta
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───── TAB: RELATÓRIOS ───── */}
      {tab === 'relatorios' && (
        <div className="space-y-4">
          {/* Ocupação de leitos */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-800 mb-3 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-violet-600" /> Relatório de Ocupação de Leitos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold">
                    <th className="p-2 text-left">Setor</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-right">Ocupados</th>
                    <th className="p-2 text-right">Livres</th>
                    <th className="p-2 text-right">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {bedReport.map(r => (
                    <tr key={r.sector} className="border-t border-slate-100">
                      <td className="p-2 font-semibold text-slate-800">{r.sector}</td>
                      <td className="p-2 text-right">{r.totalBeds}</td>
                      <td className="p-2 text-right text-red-600 font-semibold">{r.occupiedBeds}</td>
                      <td className="p-2 text-right text-green-600 font-semibold">{r.freeBeds}</td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${r.occupancyRate > 80 ? 'text-red-600' : r.occupancyRate > 60 ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.occupancyRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cirurgias */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-800 mb-3 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-purple-600" /> Relatório de Cirurgias
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold">
                    <th className="p-2 text-left">Cirurgião</th>
                    <th className="p-2 text-right">Programadas</th>
                    <th className="p-2 text-right">Realizadas</th>
                    <th className="p-2 text-right">Suspensas</th>
                    <th className="p-2 text-right">Canceladas</th>
                    <th className="p-2 text-right">Duração Média</th>
                  </tr>
                </thead>
                <tbody>
                  {surgeryReport.map(r => (
                    <tr key={r.surgeon} className="border-t border-slate-100">
                      <td className="p-2 font-semibold text-slate-800">{r.surgeon}</td>
                      <td className="p-2 text-right">{r.scheduled}</td>
                      <td className="p-2 text-right text-green-600 font-semibold">{r.performed}</td>
                      <td className="p-2 text-right text-amber-600 font-semibold">{r.suspended}</td>
                      <td className="p-2 text-right text-red-600 font-semibold">{r.cancelled}</td>
                      <td className="p-2 text-right">{r.averageDuration} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permanência */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Relatório de Permanência
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold">
                    <th className="p-2 text-left">Paciente</th>
                    <th className="p-2 text-left">Diagnóstico</th>
                    <th className="p-2 text-right">Permanência</th>
                    <th className="p-2 text-right">Média do Diagnóstico</th>
                    <th className="p-2 text-right">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {stayReports.map(r => (
                    <tr key={r.patientId} className="border-t border-slate-100">
                      <td className="p-2 font-semibold text-slate-800">{r.patientName}</td>
                      <td className="p-2 text-slate-500">{r.diagnosis}</td>
                      <td className="p-2 text-right font-semibold">{r.actualStay}d</td>
                      <td className="p-2 text-right">{r.averageStayForDiagnosis}d</td>
                      <td className={`p-2 text-right font-bold ${r.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {r.difference > 0 ? '+' : ''}{r.difference}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financeiro */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-800 mb-3 flex items-center gap-2">
              <FileBarChart className="w-4 h-4 text-emerald-600" /> Relatório Financeiro por Internação
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold">
                    <th className="p-2 text-left">Paciente</th>
                    <th className="p-2 text-left">Cobertura</th>
                    <th className="p-2 text-right">Custos Diretos</th>
                    <th className="p-2 text-right">Custos Indiretos</th>
                    <th className="p-2 text-right">Total Custos</th>
                    <th className="p-2 text-right">Receita</th>
                    <th className="p-2 text-right">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitalizations.map(h => {
                    const dc = h.status === 'ativa' ? 1200 : 1800;
                    const ic = 300;
                    const rev = h.coverageType === 'particular' ? 5000 : 3500;
                    return (
                      <tr key={h.id} className="border-t border-slate-100">
                        <td className="p-2 font-semibold text-slate-800">{h.patientName}</td>
                        <td className="p-2 text-slate-500">{h.coverageType.replace(/_/g, ' ')}</td>
                        <td className="p-2 text-right">R$ {dc}</td>
                        <td className="p-2 text-right">R$ {ic}</td>
                        <td className="p-2 text-right font-semibold">R$ {dc + ic}</td>
                        <td className="p-2 text-right text-green-600 font-semibold">R$ {rev}</td>
                        <td className={`p-2 text-right font-bold ${rev - (dc + ic) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {rev - (dc + ic)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───── MODALS ───── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              {modalContent === 'surgeryForm' && <><CalendarClock className="w-5 h-5 text-violet-600" /> Novo Agendamento Cirúrgico</>}
              {modalContent === 'admissionForm' && <><User className="w-5 h-5 text-blue-600" /> Nova Admissão</>}
              {modalContent === 'transferForm' && <><ArrowRight className="w-5 h-5 text-amber-600" /> Transferir Leito</>}
              {modalContent === 'dischargeForm' && <><CheckCircle className="w-5 h-5 text-green-600" /> Alta Hospitalar</>}
              {modalContent === 'evolutionForm' && <><Stethoscope className="w-5 h-5 text-sky-600" /> Nova Evolução Médica</>}
              {modalContent === 'checklistForm' && <><ClipboardList className="w-5 h-5 text-purple-600" /> Checklist Pré-Cirúrgico</>}
              {modalContent === 'nursingForm' && <><HeartPulse className="w-5 h-5 text-teal-600" /> Folha de Enfermagem</>}
              {modalContent === 'bedDetail' && <><BedDouble className="w-5 h-5 text-violet-600" /> Detalhes do Leito</>}
              {modalContent === 'surgeryDetail' && <><CalendarClock className="w-5 h-5 text-purple-600" /> Detalhes da Cirurgia</>}
              {modalContent === 'hospitalizationDetail' && <><Users className="w-5 h-5 text-blue-600" /> Detalhes da Internação</>}
            </DialogTitle>
          </DialogHeader>

          {/* Surgery Form */}
          {modalContent === 'surgeryForm' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Paciente</Label>
                  <Input value={surgForm.patientName} onChange={e => {
                    setSurgForm(p => ({ ...p, patientName: e.target.value }));
                    const found = patients.find(pt => pt.name.toLowerCase().includes(e.target.value.toLowerCase()));
                    if (found) setSurgForm(p => ({ ...p, patientId: found.id, patientName: found.name }));
                  }} placeholder="Nome do paciente" className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Cirurgião</Label>
                  <Input value={surgForm.surgeon} onChange={e => setSurgForm(p => ({ ...p, surgeon: e.target.value }))} placeholder="Cirurgião responsável" className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Sala Cirúrgica</Label>
                  <Input value={surgForm.room} onChange={e => setSurgForm(p => ({ ...p, room: e.target.value }))} placeholder="Ex: Sala 01" className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Tipo de Procedimento</Label>
                  <Input value={surgForm.procedureType} onChange={e => setSurgForm(p => ({ ...p, procedureType: e.target.value }))} placeholder="Ex: Colecistectomia" className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Duração Estimada (min)</Label>
                  <Input type="number" value={surgForm.estimatedDuration} onChange={e => setSurgForm(p => ({ ...p, estimatedDuration: Number(e.target.value) }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Tipo de Anestesia</Label>
                  <select value={surgForm.anesthesiaType} onChange={e => setSurgForm(p => ({ ...p, anesthesiaType: e.target.value as AnesthesiaType }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold bg-white">
                    {(['geral', 'regional', 'local', 'sedacao', 'bloqueio', 'combinada'] as AnesthesiaType[]).map(a => (
                      <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Data</Label>
                  <Input type="date" value={surgForm.scheduledDate} onChange={e => setSurgForm(p => ({ ...p, scheduledDate: e.target.value }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Horário</Label>
                  <Input type="time" value={surgForm.scheduledTime} onChange={e => setSurgForm(p => ({ ...p, scheduledTime: e.target.value }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] font-bold">Diagnóstico Pré-Operatório</Label>
                  <Input value={surgForm.preOpDiagnosis} onChange={e => setSurgForm(p => ({ ...p, preOpDiagnosis: e.target.value }))} placeholder="Diagnóstico" className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Anestesista</Label>
                  <Input value={surgForm.anesthesiologist} onChange={e => setSurgForm(p => ({ ...p, anesthesiologist: e.target.value }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Instrumentador</Label>
                  <Input value={surgForm.instrumentator} onChange={e => setSurgForm(p => ({ ...p, instrumentator: e.target.value }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] font-bold">Observações</Label>
                  <textarea value={surgForm.notes} onChange={e => setSurgForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={addSurgery} className="bg-violet-600 hover:bg-violet-700 text-xs font-bold">Agendar Cirurgia</Button>
              </div>
            </div>
          )}

          {/* Admission Form */}
          {modalContent === 'admissionForm' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Paciente</Label>
                  <Input value={admitForm.patientName} onChange={e => {
                    setAdmitForm(p => ({ ...p, patientName: e.target.value }));
                    const found = patients.find(pt => pt.name.toLowerCase().includes(e.target.value.toLowerCase()));
                    if (found) setAdmitForm(p => ({ ...p, patientId: found.id, patientName: found.name }));
                  }} placeholder="Nome" className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Médico Responsável</Label>
                  <Input value={admitForm.responsibleDoctor} onChange={e => setAdmitForm(p => ({ ...p, responsibleDoctor: e.target.value }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] font-bold">Motivo da Internação</Label>
                  <textarea value={admitForm.reason} onChange={e => setAdmitForm(p => ({ ...p, reason: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] font-bold">Diagnóstico Inicial</Label>
                  <Input value={admitForm.initialDiagnosis} onChange={e => setAdmitForm(p => ({ ...p, initialDiagnosis: e.target.value }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">CID-10</Label>
                  <Input value={admitForm.initialCid10} onChange={e => setAdmitForm(p => ({ ...p, initialCid10: e.target.value }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Tipo de Cobertura</Label>
                  <select value={admitForm.coverageType} onChange={e => setAdmitForm(p => ({ ...p, coverageType: e.target.value as CoverageType }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold bg-white">
                    {['particular', 'convênio', 'ips', 'sanidade_militar', 'sanidade_policial', 'seguro_privado', 'corporativo', 'mercosul'].map(c => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Leito</Label>
                  <select value={admitForm.bedId} onChange={e => setAdmitForm(p => ({ ...p, bedId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold bg-white">
                    <option value="">Selecione...</option>
                    {beds.filter(b => b.status === 'livre').map(b => (
                      <option key={b.id} value={b.id}>{b.name} - {b.sector} ({b.type.replace(/_/g, ' ')})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={admitPatient} className="bg-blue-600 hover:bg-blue-700 text-xs font-bold">Admitir Paciente</Button>
              </div>
            </div>
          )}

          {/* Transfer Form */}
          {modalContent === 'transferForm' && selectedItem && (
            <div className="space-y-3 text-xs">
              <p className="font-semibold text-slate-700">Paciente: {selectedItem.patientName}</p>
              <p className="text-slate-500">Leito atual: {selectedItem.bedName}</p>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Novo Leito</Label>
                <select value={transferForm.bedToId} onChange={e => setTransferForm(p => ({ ...p, bedToId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold bg-white">
                  <option value="">Selecione...</option>
                  {beds.filter(b => b.status === 'livre' && b.id !== selectedItem.bedId).map(b => (
                    <option key={b.id} value={b.id}>{b.name} - {b.sector}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Motivo da Transferência</Label>
                <textarea value={transferForm.reason} onChange={e => setTransferForm(p => ({ ...p, reason: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={() => {
                  setTransferForm({
                    patientId: selectedItem.patientId || '',
                    patientName: selectedItem.patientName || '',
                    bedFromId: selectedItem.bedId || '',
                    bedFromName: selectedItem.bedName || '',
                    bedToId: transferForm.bedToId,
                    reason: transferForm.reason,
                    notes: transferForm.notes,
                  });
                  transferBed();
                }} className="bg-amber-600 hover:bg-amber-700 text-xs font-bold">Transferir</Button>
              </div>
            </div>
          )}

          {/* Discharge Form */}
          {modalContent === 'dischargeForm' && selectedItem && (
            <div className="space-y-3 text-xs">
              <p className="font-semibold text-slate-700">Paciente: {selectedItem.patientName}</p>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Tipo de Alta</Label>
                <select value={dischargeForm.dischargeType} onChange={e => setDischargeForm(p => ({ ...p, dischargeType: e.target.value as HospitalizationStatus }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold bg-white">
                  <option value="alta_medica">Alta Médica</option>
                  <option value="alta_voluntaria">Alta Voluntária</option>
                  <option value="alta_administrativa">Alta Administrativa</option>
                  <option value="transferencia">Transferência</option>
                  <option value="obito">Óbito</option>
                </select>
              </div>
              {dischargeForm.dischargeType !== 'obito' && dischargeForm.dischargeType !== 'transferencia' && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Resumo de Alta (Epicrise)</Label>
                  <textarea value={dischargeForm.summary} onChange={e => setDischargeForm(p => ({ ...p, summary: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={4} />
                </div>
              )}
              {dischargeForm.dischargeType === 'transferencia' && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Instituição de Destino</Label>
                  <Input value={dischargeForm.transferInstitution} onChange={e => setDischargeForm(p => ({ ...p, transferInstitution: e.target.value }))} className="text-xs h-9" />
                </div>
              )}
              {dischargeForm.dischargeType === 'obito' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Causa do Óbito</Label>
                    <textarea value={dischargeForm.deathCause} onChange={e => setDischargeForm(p => ({ ...p, deathCause: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">Declaração de Óbito</Label>
                    <Input value={dischargeForm.deathCertificate} onChange={e => setDischargeForm(p => ({ ...p, deathCertificate: e.target.value }))} className="text-xs h-9" />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={() => dischargePatient(selectedItem)} className="bg-green-600 hover:bg-green-700 text-xs font-bold">Confirmar Alta</Button>
              </div>
            </div>
          )}

          {/* Evolution Form */}
          {modalContent === 'evolutionForm' && selectedItem && (
            <div className="space-y-3 text-xs">
              <p className="font-semibold text-slate-700">Paciente: {selectedItem.patientName}</p>
              <div className="grid grid-cols-4 gap-2">
                {[{ key: 'bp', label: 'PA' }, { key: 'hr', label: 'FC' }, { key: 'rr', label: 'FR' }, { key: 'temp', label: 'Temp' }, { key: 'spo2', label: 'SpO2' }].map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-[9px] font-bold">{f.label}</Label>
                    <Input value={(evolForm as any)[f.key]} onChange={e => setEvolForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="text-xs h-8" placeholder={f.key === 'bp' ? '120x80' : f.key === 'temp' ? '36.5' : ''} />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Subjetivo (S)</Label>
                <textarea value={evolForm.subjective} onChange={e => setEvolForm(p => ({ ...p, subjective: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Objetivo (O)</Label>
                <textarea value={evolForm.objective} onChange={e => setEvolForm(p => ({ ...p, objective: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Avaliação (A)</Label>
                <textarea value={evolForm.assessment} onChange={e => setEvolForm(p => ({ ...p, assessment: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Plano (P)</Label>
                <textarea value={evolForm.plan} onChange={e => setEvolForm(p => ({ ...p, plan: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={() => addEvolution(selectedItem)} className="bg-sky-600 hover:bg-sky-700 text-xs font-bold">Registrar Evolução</Button>
              </div>
            </div>
          )}

          {/* Checklist Form */}
          {modalContent === 'checklistForm' && selectedItem && (
            <div className="space-y-3 text-xs">
              <p className="font-semibold text-slate-700">Paciente: {selectedItem.patientName}</p>
              <p className="text-slate-500">{selectedItem.procedureType} | {selectedItem.scheduledDate}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Protocolo de Cirurgia Segura OMS</p>
              <div className="space-y-2">
                {[
                  { key: 'patientIdentityVerified', label: 'Identidade do paciente verificada' },
                  { key: 'lateralityVerified', label: 'Lateralidade/Procedimento confirmado' },
                  { key: 'fastingVerified', label: 'Jejum confirmado' },
                  { key: 'preOpExamsVerified', label: 'Exames pré-operatórios verificados' },
                  { key: 'informedConsentSigned', label: 'Consentimento informado assinado' },
                  { key: 'antibioticProphylaxis', label: 'Antibioticoprofilaxia administrada' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={(checkForm as any)[item.key]} onChange={e => setCheckForm(p => ({ ...p, [item.key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                    <span className="font-semibold text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Observações</Label>
                <textarea value={checkForm.notes} onChange={e => setCheckForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={() => completeChecklist(selectedItem)} className="bg-purple-600 hover:bg-purple-700 text-xs font-bold">Completar Checklist</Button>
              </div>
            </div>
          )}

          {/* Nursing Form */}
          {modalContent === 'nursingForm' && selectedItem && (
            <div className="space-y-3 text-xs">
              <p className="font-semibold text-slate-700">Paciente: {selectedItem.patientName}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Data</Label>
                  <Input type="date" value={nursForm.date} onChange={e => setNursForm(p => ({ ...p, date: e.target.value }))} className="text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Turno</Label>
                  <select value={nursForm.shift} onChange={e => setNursForm(p => ({ ...p, shift: e.target.value as 'manha' | 'tarde' | 'noite' }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold bg-white">
                    <option value="manha">Manhã</option><option value="tarde">Tarde</option><option value="noite">Noite</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold">Balanço Hídrico</Label>
                  <div className="flex items-center gap-1">
                    <Input type="number" value={nursForm.intake || ''} onChange={e => setNursForm(p => ({ ...p, intake: Number(e.target.value) }))} placeholder="Ingesta" className="text-xs h-9 w-full" />
                    <span className="text-slate-400">/</span>
                    <Input type="number" value={nursForm.output || ''} onChange={e => setNursForm(p => ({ ...p, output: Number(e.target.value) }))} placeholder="Perda" className="text-xs h-9 w-full" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold">Observações de Enfermagem</Label>
                <textarea value={nursForm.observations} onChange={e => setNursForm(p => ({ ...p, observations: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={() => addNursingSheet(selectedItem)} className="bg-teal-600 hover:bg-teal-700 text-xs font-bold">Registrar Folha</Button>
              </div>
            </div>
          )}

          {/* Bed Detail */}
          {modalContent === 'bedDetail' && selectedItem && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-sm text-slate-800">{selectedItem.name}</p>
                  <p className="text-slate-500">{selectedItem.sector} | {selectedItem.wing}</p>
                </div>
                <Badge className={`text-[10px] ${STATUS_COLORS[selectedItem.status as BedStatus]?.replace('bg-', 'bg-').replace('500', '100 text-').replace('700', '500') || 'bg-slate-500'}`}>
                  {STATUS_LABELS[selectedItem.status as BedStatus] || selectedItem.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Tipo</p>
                  <p className="font-semibold text-slate-800">{selectedItem.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Características Especiais</p>
                  <p className="font-semibold text-slate-800">{selectedItem.specialFeatures.length > 0 ? selectedItem.specialFeatures.map((f: string) => f.replace(/_/g, ' ')).join(', ') : 'Nenhuma'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Isolamento</p>
                  <p className="font-semibold text-slate-800">{selectedItem.isolation ? 'Sim' : 'Não'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Pressão Negativa</p>
                  <p className="font-semibold text-slate-800">{selectedItem.negativePressure ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              {selectedItem.patientName && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-blue-600 uppercase">Paciente</p>
                  <p className="font-bold text-slate-800">{selectedItem.patientName}</p>
                  <p className="text-slate-500">Desde {selectedItem.entryDate}</p>
                  {selectedItem.doctor && <p className="text-slate-500">Dr. {selectedItem.doctor}</p>}
                </div>
              )}
              {selectedItem.status === 'manutencao' && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-amber-600 uppercase">Motivo da Manutenção</p>
                  <p className="font-semibold text-slate-800">{selectedItem.maintenanceReason}</p>
                </div>
              )}
              {selectedItem.status === 'reservado' && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-blue-600 uppercase">Reserva</p>
                  <p className="font-semibold text-slate-800">Para: {selectedItem.reservedForPatient}</p>
                  <p className="text-slate-500">Até: {selectedItem.reservedUntil}</p>
                </div>
              )}
              {selectedItem.status === 'limpeza' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      setBeds(prev => prev.map(b => b.id === selectedItem.id ? { ...b, status: 'livre' as BedStatus } : b));
                      addAuditLog('Concluiu Limpeza', selectedItem.name);
                      setShowModal(false);
                    }}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Concluir Limpeza
                  </Button>
                </div>
              )}
              {selectedItem.status === 'ocupado' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                    setTransferForm({
                      patientId: selectedItem.patientId || '',
                      patientName: selectedItem.patientName || '',
                      bedFromId: selectedItem.id,
                      bedFromName: selectedItem.name,
                      bedToId: '',
                      reason: '',
                      notes: '',
                    });
                    openModal('transferForm', selectedItem);
                  }}>
                    <ArrowRight className="w-3.5 h-3.5 mr-1" /> Transferir
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      const hosp = hospitalizations.find(h => h.patientId === selectedItem.patientId && h.status === 'ativa');
                      if (hosp) openModal('dischargeForm', { ...hosp, bedId: selectedItem.id, bedName: selectedItem.name });
                    }}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Alta
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Surgery Detail */}
          {modalContent === 'surgeryDetail' && selectedItem && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-sm text-slate-800">{selectedItem.patientName}</p>
                  <p className="text-slate-500">{selectedItem.procedureType}</p>
                </div>
                <Badge className={`text-[10px] ${SURGERY_STATUS_COLORS[selectedItem.status as SurgeryStatus]?.replace('bg-', 'bg-').replace('500', '100 text-').replace('700', '500') || 'bg-slate-500'}`}>
                  {SURGERY_STATUS_LABELS[selectedItem.status as SurgeryStatus] || selectedItem.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Cirurgião</p>
                  <p className="font-semibold">{selectedItem.surgeon}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Sala</p>
                  <p className="font-semibold">{selectedItem.room}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Data / Horário</p>
                  <p className="font-semibold">{selectedItem.scheduledDate} {selectedItem.scheduledTime}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Duração Estimada</p>
                  <p className="font-semibold">{selectedItem.estimatedDuration} min</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Anestesia</p>
                  <p className="font-semibold">{selectedItem.anesthesiaType}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Anestesista</p>
                  <p className="font-semibold">{selectedItem.team.anesthesiologist}</p>
                </div>
              </div>
              {selectedItem.preOpDiagnosis && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Diagnóstico Pré-Operatório</p>
                  <p className="font-semibold">{selectedItem.preOpDiagnosis}</p>
                </div>
              )}
              {selectedItem.notes && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-amber-600 uppercase">Observações</p>
                  <p>{selectedItem.notes}</p>
                </div>
              )}
              {selectedItem.checklist && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-green-600 uppercase flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Checklist Completo
                  </p>
                  <p className="text-slate-600">Por: {selectedItem.checklist.checklistCompletedBy} em {new Date(selectedItem.checklist.checklistCompletedAt).toLocaleString('pt-BR')}</p>
                </div>
              )}
              {!selectedItem.checklist && selectedItem.status !== 'cancelada' && selectedItem.status !== 'suspensa' && (
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs" onClick={() => completeChecklist(selectedItem)}>
                  <ClipboardList className="w-3.5 h-3.5 mr-1" /> Preencher Checklist
                </Button>
              )}
              {selectedItem.intraoperative && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Registro Intraoperatório</p>
                  <p className="font-semibold">Início: {selectedItem.intraoperative.startTime}</p>
                  <p className="text-slate-600">Intercorrências: {selectedItem.intraoperative.intercurrences || 'Nenhuma'}</p>
                  <p className="text-slate-600">Materiais: {selectedItem.intraoperative.materialsConsumed.map((m: any) => `${m.name} (${m.quantity})`).join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Hospitalization Detail */}
          {modalContent === 'hospitalizationDetail' && selectedItem && (
            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-sm text-slate-800">{selectedItem.patientName}</p>
                  <p className="text-slate-500">{selectedItem.initialDiagnosis}</p>
                </div>
                <Badge className={`text-[10px] ${selectedItem.status === 'ativa' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {HOSP_STATUS_LABELS[selectedItem.status as HospitalizationStatus] || selectedItem.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Admissão</p>
                  <p className="font-semibold">{selectedItem.admissionDate} às {selectedItem.admissionTime}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Médico</p>
                  <p className="font-semibold">{selectedItem.responsibleDoctor}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Leito</p>
                  <p className="font-semibold">{selectedItem.bedName}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Cobertura</p>
                  <p className="font-semibold">{selectedItem.coverageType.replace(/_/g, ' ')}</p>
                </div>
              </div>
              {selectedItem.reason && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Motivo</p>
                  <p>{selectedItem.reason}</p>
                </div>
              )}

              {/* Evolutions */}
              <div>
                <p className="font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-600" /> Evoluções Médicas ({selectedItem.medicalEvolutions.length})
                </p>
                {selectedItem.medicalEvolutions.length === 0 ? (
                  <p className="text-slate-400">Nenhuma evolução registrada.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedItem.medicalEvolutions.map((ev: MedicalEvolution) => (
                      <div key={ev.id} className="bg-sky-50 border border-sky-100 rounded-lg p-3">
                        <div className="flex justify-between text-[9px] font-bold text-sky-700">
                          <span>{ev.date} {ev.time} - {ev.doctor}</span>
                          {ev.vitalSigns?.bp && <span>PA {ev.vitalSigns.bp} | FC {ev.vitalSigns.hr} | SpO2 {ev.vitalSigns.spo2}%</span>}
                        </div>
                        {ev.subjective && <p className="mt-1"><b>S:</b> {ev.subjective}</p>}
                        {ev.objective && <p><b>O:</b> {ev.objective}</p>}
                        {ev.assessment && <p><b>A:</b> {ev.assessment}</p>}
                        {ev.plan && <p><b>P:</b> {ev.plan}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {selectedItem.status === 'ativa' && (
                  <Button size="sm" variant="outline" className="text-xs mt-2" onClick={() => openModal('evolutionForm', selectedItem)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Nova Evolução
                  </Button>
                )}
              </div>

              {/* Nursing sheets */}
              <div>
                <p className="font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-teal-600" /> Folhas de Enfermagem ({selectedItem.nursingSheets.length})
                </p>
                {selectedItem.nursingSheets.length === 0 ? (
                  <p className="text-slate-400">Nenhum registro de enfermagem.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedItem.nursingSheets.map((ns: NursingSheet) => (
                      <div key={ns.id} className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                        <div className="flex justify-between text-[9px] font-bold text-teal-700">
                          <span>{ns.date} - Turno: {ns.shift}</span>
                          <span>{ns.nurse}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-2 text-[9px]">
                          <span>Ingesta: {ns.fluidBalance.intake}ml</span>
                          <span>Perda: {ns.fluidBalance.output}ml</span>
                          <span>Balanço: <b className={ns.fluidBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'}>{ns.fluidBalance.balance}ml</b></span>
                        </div>
                        {ns.medications.length > 0 && (
                          <div className="mt-1">
                            <p className="text-[9px] font-bold text-slate-500">Medicações:</p>
                            {ns.medications.map((m, i) => (
                              <p key={i} className="text-[9px]">{m.name} {m.dosage} - {m.time}</p>
                            ))}
                          </div>
                        )}
                        {ns.observations && <p className="mt-1 text-[9px] text-slate-600">{ns.observations}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {selectedItem.status === 'ativa' && (
                  <Button size="sm" variant="outline" className="text-xs mt-2" onClick={() => openModal('nursingForm', selectedItem)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Nova Folha de Enfermagem
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
