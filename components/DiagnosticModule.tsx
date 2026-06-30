'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Patient, DicomStudy, DicomModality, ImagingReport, WorklistEntry, Hl7Message,
  LabOrder, LabResult, LabAlert, LabTest, ReportTemplate, modalityList,
  initialDicomStudies, initialWorklist, initialHl7Messages, initialLabTests,
  initialLabOrders, initialLabResults, initialLabAlerts, initialReportTemplates,
  initialImagingReports,
} from '@/lib/mockData';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Microscope, Eye, FileText, Layers, Settings2, Search, Filter, Sliders,
  Plus, Trash2, Check, AlertTriangle, AlertCircle, Send, Clock, User,
  ChevronDown, ChevronRight, Printer, Download, FileSignature, RotateCw,
  Volume2, History, Info, Loader2, MonitorPlay, Magnet, Waves, Atom,
  GitBranch, Heart, Bone, Shield, Activity, Hash, Bell, MessageSquare,
  Globe, Zap, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, BarChart3,
  RefreshCw, ClipboardCheck, Package, CheckCircle, XCircle, AlertOctagon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DiagnosticModuleProps {
  patients: Patient[];
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
}

type DiagnosticTab = 'pacs' | 'laudos' | 'worklist' | 'laboratorio';

// ── Utility helpers ──
const inputCls = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans';
const textareaCls = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans leading-relaxed resize-none';
const labelCls = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';
const sectionCls = 'bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4';

const modalityColors: Record<string, string> = {
  RX: 'bg-blue-100 text-blue-700 border-blue-200',
  TC: 'bg-purple-100 text-purple-700 border-purple-200',
  RM: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  US: 'bg-teal-100 text-teal-700 border-teal-200',
  MG: 'bg-pink-100 text-pink-700 border-pink-200',
  PET: 'bg-amber-100 text-amber-700 border-amber-200',
  XA: 'bg-rose-100 text-rose-700 border-rose-200',
  ALL: 'bg-slate-100 text-slate-700 border-slate-200',
};

const flagColors: Record<string, string> = {
  normal: 'bg-green-100 text-green-700 border-green-200',
  alto: 'bg-amber-100 text-amber-700 border-amber-200',
  baixo: 'bg-blue-100 text-blue-700 border-blue-200',
  critico_alto: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
  critico_baixo: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
  indeterminado: 'bg-slate-100 text-slate-500 border-slate-200',
};

const alertSeverityColors: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
};

const worklistStatusColors: Record<string, string> = {
  pendente: 'bg-slate-100 text-slate-700',
  em_execucao: 'bg-blue-100 text-blue-700',
  concluido: 'bg-green-100 text-green-700',
  cancelado: 'bg-rose-100 text-rose-700',
  nao_compareceu: 'bg-amber-100 text-amber-700',
};

const labStatusColors: Record<string, string> = {
  solicitado: 'bg-amber-100 text-amber-700',
  em_coleta: 'bg-blue-100 text-blue-700',
  em_processamento: 'bg-indigo-100 text-indigo-700',
  parcial: 'bg-orange-100 text-orange-700',
  concluido: 'bg-green-100 text-green-700',
  cancelado: 'bg-rose-100 text-rose-700',
};

export default function DiagnosticModule({ patients, activeSubmodule, addAuditLog }: DiagnosticModuleProps) {
  const { t } = useI18n();
  const [diagTab, setDiagTab] = useState<DiagnosticTab>('pacs');
  const [selectedPatId, setSelectedPatId] = useState(patients[0]?.id || '');

  // ── PACS STATE ──
  const [dicomStudies, setDicomStudies] = useState<DicomStudy[]>(initialDicomStudies);
  const [selectedStudy, setSelectedStudy] = useState<DicomStudy | null>(initialDicomStudies[0]);
  const [pacsModalityFilter, setPacsModalityFilter] = useState<string>('all');
  const [pacsSearchQuery, setPacsSearchQuery] = useState('');
  const [imageContrast, setImageContrast] = useState(100);
  const [imageBrightness, setImageBrightness] = useState(100);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [windowLevel, setWindowLevel] = useState({ center: 40, width: 400 });
  const [pacsAnnotation, setPacsAnnotation] = useState('');
  const [pacsMeasurements, setPacsMeasurements] = useState<{ id: string; label: string; value: string; unit: string }[]>([]);

  // ── LAUDOS STATE ──
  const [reports, setReports] = useState<ImagingReport[]>(initialImagingReports);
  const [templates, setTemplates] = useState<ReportTemplate[]>(initialReportTemplates);
  const [selectedReport, setSelectedReport] = useState<ImagingReport | null>(initialImagingReports[0]);
  const [reportEditor, setReportEditor] = useState({
    technique: '', findings: '', impression: '', recommendations: '', bodyPart: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(initialReportTemplates[0]);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);

  // ── WORKLIST STATE ──
  const [worklist, setWorklist] = useState<WorklistEntry[]>(initialWorklist);
  const [hl7Messages, setHl7Messages] = useState<Hl7Message[]>(initialHl7Messages);
  const [worklistSearchQuery, setWorklistSearchQuery] = useState('');
  const [worklistStatusFilter, setWorklistStatusFilter] = useState<string>('all');
  const [hl7DetailOpen, setHl7DetailOpen] = useState<string | null>(null);
  const [hl7SearchQuery, setHl7SearchQuery] = useState('');
  const [fhirEndpoint, setFhirEndpoint] = useState('https://iamed.py/fhir/R4');

  // ── LABORATÓRIO STATE ──
  const [labTests, setLabTests] = useState<LabTest[]>(initialLabTests);
  const [labOrders, setLabOrders] = useState<LabOrder[]>(initialLabOrders);
  const [labResults, setLabResults] = useState<LabResult[]>(initialLabResults);
  const [labAlerts, setLabAlerts] = useState<LabAlert[]>(initialLabAlerts);
  const [labOrderSearch, setLabOrderSearch] = useState('');
  const [labStatusFilter, setLabStatusFilter] = useState<string>('all');
  const [selectedLabResult, setSelectedLabResult] = useState<LabResult | null>(null);
  const [labResultDetailOpen, setLabResultDetailOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [showCriticalAlert, setShowCriticalAlert] = useState(true);

  // ── Derived lists ──
  const selectedPatient = patients.find(p => p.id === selectedPatId) || patients[0];

  const filteredStudies = useMemo(() => {
    return dicomStudies.filter(s => {
      if (pacsModalityFilter !== 'all' && s.modality !== pacsModalityFilter) return false;
      if (pacsSearchQuery) {
        const q = pacsSearchQuery.toLowerCase();
        return s.patientName.toLowerCase().includes(q) || s.accessionNumber.toLowerCase().includes(q) || s.studyDescription.toLowerCase().includes(q);
      }
      return true;
    });
  }, [dicomStudies, pacsModalityFilter, pacsSearchQuery]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (reportStatusFilter !== 'all' && r.status !== reportStatusFilter) return false;
      if (reportSearchQuery) {
        const q = reportSearchQuery.toLowerCase();
        return r.patientName.toLowerCase().includes(q) || r.findings.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [reports, reportStatusFilter, reportSearchQuery]);

  const filteredWorklist = useMemo(() => {
    return worklist.filter(w => {
      if (worklistStatusFilter !== 'all' && w.status !== worklistStatusFilter) return false;
      if (worklistSearchQuery) {
        const q = worklistSearchQuery.toLowerCase();
        return w.patientName.toLowerCase().includes(q) || w.accessionNumber.toLowerCase().includes(q) || w.requestedProcedureDescription.toLowerCase().includes(q);
      }
      return true;
    });
  }, [worklist, worklistStatusFilter, worklistSearchQuery]);

  const filteredHl7 = useMemo(() => {
    return hl7Messages.filter(m => {
      if (hl7SearchQuery) {
        const q = hl7SearchQuery.toLowerCase();
        return m.patientName.toLowerCase().includes(q) || m.controlId.toLowerCase().includes(q) || m.messageType.toLowerCase().includes(q);
      }
      return true;
    });
  }, [hl7Messages, hl7SearchQuery]);

  const filteredLabOrders = useMemo(() => {
    return labOrders.filter(o => {
      if (labStatusFilter !== 'all' && o.status !== labStatusFilter) return false;
      if (labOrderSearch) {
        const q = labOrderSearch.toLowerCase();
        return o.patientName.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q) || o.requestingPhysician.toLowerCase().includes(q);
      }
      return true;
    });
  }, [labOrders, labStatusFilter, labOrderSearch]);

  const filteredLabAlerts = useMemo(() => {
    return labAlerts.filter(a => {
      if (alertFilter !== 'all' && a.severity !== alertFilter) return false;
      return true;
    });
  }, [labAlerts, alertFilter]);

  // ── PACS HANDLERS ──
  const handleAnnotateStudy = useCallback(() => {
    if (!selectedStudy || !pacsAnnotation.trim()) return;
    const m = { id: `m_${Date.now()}`, label: pacsAnnotation, value: (Math.random() * 10).toFixed(1), unit: 'mm' };
    setPacsMeasurements(prev => [...prev, m]);
    setPacsAnnotation('');
    addAuditLog('Medición DICOM', `${m.label}: ${m.value}${m.unit} en ${selectedStudy.accessionNumber}`);
  }, [selectedStudy, pacsAnnotation, addAuditLog]);

  const handleZoomIn = useCallback(() => setImageZoom(prev => Math.min(prev + 25, 400)), []);
  const handleZoomOut = useCallback(() => setImageZoom(prev => Math.max(prev - 25, 25)), []);
  const handleResetImage = useCallback(() => {
    setPacsAnnotation('');
    setPacsMeasurements([]);
    setImageContrast(100);
    setImageBrightness(100);
    setImageZoom(100);
    setImageRotation(0);
    setWindowLevel({ center: 40, width: 400 });
  }, []);

  // ── LAUDO HANDLERS ──
  const handleLoadTemplate = useCallback(() => {
    if (!selectedTemplate) return;
    const sections = selectedTemplate.sections.sort((a, b) => a.order - b.order);
    setReportEditor({
      technique: sections.find(s => s.key === 'tecnica')?.content || '',
      findings: sections.find(s => s.key === 'hallazgos' || s.key === 'serie_roja')?.content || '',
      impression: sections.find(s => s.key === 'impresion')?.content || '',
      recommendations: sections.find(s => s.key === 'recomendaciones')?.content || '',
      bodyPart: selectedStudy?.bodyPart || '',
    });
    addAuditLog('Plantilla Cargada', selectedTemplate.name);
  }, [selectedTemplate, selectedStudy, addAuditLog]);

  const handleVoiceToggle = useCallback(() => {
    if (voiceActive) {
      setVoiceActive(false);
      addAuditLog('Dictado por voz finalizado', selectedReport?.id || '');
    } else {
      setVoiceActive(true);
      setVoiceLog(prev => [...prev, `[${new Date().toLocaleTimeString('es')}] Dictado activado — vocabulario médico`]);
      addAuditLog('Dictado por voz iniciado', selectedReport?.id || '');
      // Simulated voice transcription
      const phrases = [
        'Se observan campos pulmonares limpios en ambas proyecciones...',
        'Silueta cardíaca de dimensiones normales...',
        'Ángulos costofrénicos nítidos...',
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < phrases.length) {
          setVoiceLog(prev => [...prev, `→ ${phrases[i]}`]);
          setReportEditor(prev => ({ ...prev, findings: prev.findings + '\n' + phrases[i] }));
          i++;
        } else {
          clearInterval(interval);
          setVoiceActive(false);
          setVoiceLog(prev => [...prev, `[${new Date().toLocaleTimeString('es')}] Dictado completado`]);
        }
      }, 2000);
    }
  }, [voiceActive, selectedReport, addAuditLog]);

  const handleSaveReport = useCallback(() => {
    if (!reportEditor.findings.trim()) return;
    const studyId = selectedStudy?.id || dicomStudies[0]?.id || '';
    const report: ImagingReport = {
      id: `rep_${Date.now()}`, studyId, patientId: selectedPatient?.id || '', patientName: selectedPatient?.name || '',
      modality: selectedStudy?.modality || 'RX', templateId: selectedTemplate?.id,
      technique: reportEditor.technique, findings: reportEditor.findings,
      impression: reportEditor.impression, recommendations: reportEditor.recommendations,
      keyImages: [], bodyPart: reportEditor.bodyPart || selectedStudy?.bodyPart || '',
      status: 'pre_laudo', reportedBy: 'Dra. Amanda Silva', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), reportedAt: new Date().toISOString(),
      distributionChannels: [], voiceTranscriptionUsed: voiceLog.length > 0,
    };
    setReports(prev => [report, ...prev]);
    setSelectedReport(report);
    addAuditLog('Laudo Guardado', `${report.modality} — ${selectedPatient?.name}`);
  }, [reportEditor, selectedStudy, selectedPatient, selectedTemplate, voiceLog, addAuditLog, dicomStudies]);

  const handleSignReport = useCallback((reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'laudado', signedBy: 'Dra. Amanda Silva', signedAt: new Date().toISOString(), signatureId: `sig_${Date.now()}` } : r));
    addAuditLog('Laudo Firmado', reportId);
  }, [addAuditLog]);

  const handleDistributeReport = useCallback(() => {
    if (!selectedReport) return;
    setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, distributionChannels: ['portal_paciente', 'email_solicitante', 'whatsapp'] } : r));
    setShowDistributeDialog(false);
    addAuditLog('Laudo Distribuido', selectedReport.id);
  }, [selectedReport, addAuditLog]);

  // ── WORKLIST HANDLERS ──
  const handleUpdateWorklist = useCallback((id: string, status: WorklistEntry['status']) => {
    setWorklist(prev => prev.map(w => {
      if (w.id !== id) return w;
      const update: Partial<WorklistEntry> = { status };
      if (status === 'em_execucao') update.startedAt = new Date().toISOString();
      if (status === 'concluido') update.completedAt = new Date().toISOString();
      return { ...w, ...update };
    }));
    addAuditLog('Worklist Actualizado', `${id} → ${status}`);
  }, [addAuditLog]);

  const handleSendHl7 = useCallback(() => {
    const msg: Hl7Message = {
      id: `hl7_${Date.now()}`, messageType: 'ACK', triggerEvent: 'ACK',
      controlId: `ACK-${Date.now()}`, sendingApp: 'IAMED', sendingFacility: 'IAMED',
      receivingApp: 'MODALITY-ALL', receivingFacility: 'ALL', patientId: selectedPatient?.id || '',
      patientName: selectedPatient?.name || '', rawMessage: 'ACK simulado',
      parsedSegments: [{ name: 'MSH', fields: ['IAMED', 'ACK', '2026'] }],
      status: 'processado', receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(), protocol: 'HL7_v2.x',
      direction: 'outbound', sourceSystem: 'IAMED',
    };
    setHl7Messages(prev => [msg, ...prev]);
    addAuditLog('HL7 ACK Enviado', msg.controlId);
  }, [selectedPatient, addAuditLog]);

  // ── LAB HANDLERS ──
  const handleAckAlert = useCallback((alertId: string) => {
    setLabAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'Dra. Amanda Silva' } : a));
    addAuditLog('Alerta Laboratorio Confirmado', alertId);
  }, [addAuditLog]);

  const getLabPatientHistory = useCallback((patientId: string, testCode: string) => {
    return labResults.filter(r => r.patientId === patientId && r.testCode === testCode).sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }, [labResults]);

  // ── Tab config ──
  const diagTabs: { key: DiagnosticTab; label: string; icon: React.ElementType }[] = [
    { key: 'pacs', label: 'PACS / DICOM', icon: MonitorPlay },
    { key: 'laudos', label: 'Laudos Imagen', icon: FileText },
    { key: 'worklist', label: 'Worklist / HL7 / FHIR', icon: Layers },
    { key: 'laboratorio', label: 'Laboratorio', icon: Microscope },
  ];

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className={sectionCls + ' pb-1'}>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100">
          {diagTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setDiagTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-lg transition whitespace-nowrap cursor-pointer
                  ${diagTab === tab.key ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 6.1 PACS / DICOM                       */}
      {/* ═══════════════════════════════════════ */}
      {diagTab === 'pacs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sidebar: Study List */}
          <div className="lg:col-span-1 space-y-4">
            <div className={sectionCls}>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MonitorPlay className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm">Estudios DICOM</h3>
              </div>
              {/* Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" value={pacsSearchQuery} onChange={e => setPacsSearchQuery(e.target.value)} placeholder="Buscar por paciente, ACC..." className={`${inputCls} pl-9`} />
                </div>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setPacsModalityFilter('all')} className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${pacsModalityFilter === 'all' ? 'bg-teal-600 text-white border-teal-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Todos</button>
                  {modalityList.map(m => (
                    <button key={m.code} onClick={() => setPacsModalityFilter(m.code)} className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${pacsModalityFilter === m.code ? modalityColors[m.code] + ' border-current font-black' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{m.code}</button>
                  ))}
                </div>
              </div>
              {/* Study list */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredStudies.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Sin estudios disponibles</p>
                ) : filteredStudies.map(s => (
                  <div key={s.id} onClick={() => { setSelectedStudy(s); setImageContrast(100); setImageBrightness(100); setImageZoom(100); setImageRotation(0); setPacsMeasurements([]); }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${selectedStudy?.id === s.id ? 'bg-teal-50 border-teal-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${modalityColors[s.modality]}`}>{s.modality}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.status === 'laudado' ? 'bg-green-100 text-green-700' : s.status === 'laudo_pendente' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{s.status === 'laudado' ? 'LAUDADO' : s.status === 'laudo_pendente' ? 'PEND. LAUDO' : s.status.toUpperCase()}</span>
                    </div>
                    <p className="font-bold text-slate-800">{s.patientName}</p>
                    <p className="text-slate-500 text-[10px]">{s.studyDescription}</p>
                    <p className="text-slate-400 text-[9px] mt-1">ACC: {s.accessionNumber} | {s.seriesCount} series</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main: PACS Viewer */}
          <div className="lg:col-span-2 space-y-4">
            {selectedStudy ? (
              <>
                <div className={sectionCls}>
                  {/* Study Header */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${modalityColors[selectedStudy.modality]}`}>{selectedStudy.modality}</span>
                        {selectedStudy.studyDescription}
                      </h4>
                      <p className="text-xs text-slate-500">{selectedStudy.patientName} — {selectedStudy.accessionNumber}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] font-bold bg-slate-100 py-1 px-2.5 rounded text-slate-600">ID: PACS-IAMED</span>
                      <span className="text-[10px] font-bold bg-teal-50 text-teal-700 py-1 px-2.5 rounded border border-teal-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" /> ONLINE
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 py-1 px-2 rounded">{selectedStudy.vendor || 'Siemens'}</span>
                    </div>
                  </div>

                  {/* DICOM Viewer */}
                  <div className="relative bg-black rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 h-[380px] select-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedStudy.thumbnailUrl || 'https://picsum.photos/seed/xray/600/400'} alt="DICOM Study"
                      referrerPolicy="no-referrer"
                      style={{
                        filter: `contrast(${imageContrast}%) brightness(${imageBrightness}%) grayscale(100%)`,
                        transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                      }}
                      className="object-cover max-h-full max-w-full transition duration-150" />

                    {/* Patient info overlay */}
                    <div className="absolute top-3 left-3 bg-black/80 p-2 rounded-md font-mono text-[9px] text-teal-400 space-y-0.5 pointer-events-none">
                      <p>NOMBRE: {selectedStudy.patientName.toUpperCase()}</p>
                      <p>ESTUDIO: {selectedStudy.studyDescription}</p>
                      <p>ACC: {selectedStudy.accessionNumber}</p>
                      <p>MODALIDAD: {selectedStudy.modalityName || selectedStudy.modality}</p>
                      <p>ESTACIÓN: {selectedStudy.stationName}</p>
                      <p>SERIES: {selectedStudy.seriesCount} | INSTANCIAS: {selectedStudy.instanceCount}</p>
                    </div>

                    {/* Window/Level overlay */}
                    <div className="absolute top-3 right-3 bg-black/80 p-2 rounded-md font-mono text-[9px] text-amber-400 pointer-events-none">
                      <p>W: {windowLevel.width} L: {windowLevel.center}</p>
                      <p>ZOOM: {imageZoom}% | ROT: {imageRotation}°</p>
                    </div>

                    {/* Measurements overlay */}
                    {pacsMeasurements.length > 0 && (
                      <div className="absolute bottom-3 left-3 bg-black/80 p-2 rounded-md text-[9px] text-green-400 pointer-events-none space-y-0.5">
                        {pacsMeasurements.map(m => <p key={m.id}>📏 {m.label}: {m.value}{m.unit}</p>)}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl space-y-3 text-xs">
                    {/* Brightness / Contrast */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-600 w-16 text-[10px]">Contraste:</span>
                        <input type="range" min="25" max="200" value={imageContrast} onChange={e => setImageContrast(Number(e.target.value))} className="flex-1 accent-teal-600" />
                        <span className="w-10 text-right font-bold text-[10px]">{imageContrast}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-600 w-16 text-[10px]">Brilho:</span>
                        <input type="range" min="25" max="200" value={imageBrightness} onChange={e => setImageBrightness(Number(e.target.value))} className="flex-1 accent-teal-600" />
                        <span className="w-10 text-right font-bold text-[10px]">{imageBrightness}%</span>
                      </div>
                    </div>

                    {/* Zoom / Rotation / Window-Level */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Zoom</label>
                        <div className="flex gap-1">
                          <button onClick={handleZoomOut} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold">−</button>
                          <input type="range" min="25" max="400" value={imageZoom} onChange={e => setImageZoom(Number(e.target.value))} className="flex-1 accent-teal-600" />
                          <button onClick={handleZoomIn} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold">+</button>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Rotación</label>
                        <div className="flex gap-1">
                          <button onClick={() => setImageRotation(prev => prev - 90)} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold"><RotateCw className="w-3 h-3 inline" /> -90°</button>
                          <button onClick={() => setImageRotation(0)} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold">0°</button>
                          <button onClick={() => setImageRotation(prev => prev + 90)} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold"><RotateCw className="w-3 h-3 inline rotate-180" /> +90°</button>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Window/Level</label>
                        <div className="flex gap-1">
                          <input type="number" value={windowLevel.width} onChange={e => setWindowLevel(p => ({ ...p, width: +e.target.value }))} className={`${inputCls} w-16`} placeholder="W" />
                          <input type="number" value={windowLevel.center} onChange={e => setWindowLevel(p => ({ ...p, center: +e.target.value }))} className={`${inputCls} w-16`} placeholder="L" />
                        </div>
                      </div>
                    </div>

                    {/* Measurements */}
                    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                      <h5 className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1"><Hash className="w-3 h-3" /> Mediciones / Anotaciones</h5>
                      <div className="flex gap-2">
                        <input type="text" value={pacsAnnotation} onChange={e => setPacsAnnotation(e.target.value)} placeholder="Ej: Distancia AP, Diámetro cardíaco..." className={`${inputCls} flex-1`} />
                        <button onClick={handleAnnotateStudy} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Agregar</button>
                      </div>
                      {pacsMeasurements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pacsMeasurements.map(m => (
                            <span key={m.id} className="bg-green-50 border border-green-200 text-green-800 px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1">
                              {m.label}: {m.value}{m.unit}
                              <button onClick={() => setPacsMeasurements(prev => prev.filter(x => x.id !== m.id))} className="text-green-600 hover:text-green-800"><Trash2 className="w-2.5 h-2.5" /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reset */}
                    <button onClick={handleResetImage} className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1 transition">
                      <RefreshCw className="w-3 h-3" /> Restablecer imagen
                    </button>
                  </div>
                </div>

                {/* Study Details */}
                <div className={sectionCls}>
                  <h5 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Detalles del Estudio</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="font-bold text-slate-500">Indicación clínica:</span> <span className="text-slate-700">{selectedStudy.clinicalHistory}</span></div>
                    <div><span className="font-bold text-slate-500">Solicitante:</span> <span className="text-slate-700">{selectedStudy.referringPhysician}</span></div>
                    <div><span className="font-bold text-slate-500">Equipo:</span> <span className="text-slate-700">{selectedStudy.stationName} ({selectedStudy.vendor})</span></div>
                    <div><span className="font-bold text-slate-500">Programado:</span> <span className="text-slate-700">{selectedStudy.scheduledAt ? new Date(selectedStudy.scheduledAt).toLocaleString('es') : 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-500">UID:</span> <span className="text-[9px] font-mono text-slate-500 break-all">{selectedStudy.studyInstanceUID}</span></div>
                  </div>
                </div>
              </>
            ) : (
              <div className={sectionCls + ' flex flex-col items-center justify-center py-16 text-slate-400'}>
                <MonitorPlay className="w-10 h-10 mb-3" />
                <p className="text-sm font-bold">Seleccione un estudio DICOM para visualizar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* 6.2 EDITOR DE LAUDOS                    */}
      {/* ═══════════════════════════════════════ */}
      {diagTab === 'laudos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sidebar: Reports List */}
          <div className="lg:col-span-1 space-y-4">
            <div className={sectionCls}>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm">Laudos de Imagen</h3>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" value={reportSearchQuery} onChange={e => setReportSearchQuery(e.target.value)} placeholder="Buscar laudo..." className={`${inputCls} pl-9`} />
                </div>
                <select value={reportStatusFilter} onChange={e => setReportStatusFilter(e.target.value)} className={inputCls}>
                  <option value="all">Todos los estados</option>
                  <option value="rascunho">Borrador</option>
                  <option value="pre_laudo">Pre-laudo</option>
                  <option value="laudado">Laudado</option>
                  <option value="corrigido">Corregido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredReports.map(r => (
                  <div key={r.id} onClick={() => { setSelectedReport(r); setReportEditor({ technique: r.technique, findings: r.findings, impression: r.impression, recommendations: r.recommendations, bodyPart: r.bodyPart }); }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${selectedReport?.id === r.id ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${modalityColors[r.modality]}`}>{r.modality}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.status === 'laudado' ? 'bg-green-100 text-green-700' : r.status === 'rascunho' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{r.status.toUpperCase()}</span>
                    </div>
                    <p className="font-bold text-slate-800">{r.patientName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{r.impression || r.findings || 'Sin contenido...'}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{r.reportedBy} | {r.createdAt.split('T')[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main: Report Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className={sectionCls}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Editor de Laudo</h4>
                  <p className="text-[10px] text-slate-500">Plantillas configurables · Dictado por voz · Firma electrónica (Lei 6822/2021)</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${selectedReport?.status === 'laudado' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                    {selectedReport?.status === 'laudado' ? 'FIRMADO Y DISTRIBUIDO' : selectedReport?.status?.toUpperCase() || 'NUEVO'}
                  </span>
                </div>
              </div>

              {/* Template selector & Voice */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Plantilla por modalidad</label>
                  <select value={selectedTemplate?.id || ''} onChange={e => { const t = templates.find(x => x.id === e.target.value); setSelectedTemplate(t || null); }} className={inputCls}>
                    <option value="">Seleccionar plantilla...</option>
                    {templates.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name} ({t.modality})</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={handleLoadTemplate} className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
                    <ClipboardCheck className="w-3 h-3" /> Cargar plantilla
                  </button>
                  <button onClick={handleVoiceToggle} className={`py-2 px-3 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${voiceActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
                    <Volume2 className="w-3 h-3" /> {voiceActive ? 'Detener dictado' : 'Dictar por voz (ES)'}
                  </button>
                </div>
              </div>

              {/* Voice log */}
              {voiceLog.length > 0 && (
                <div className="bg-slate-900 rounded-lg p-3 text-[9px] font-mono text-green-400 max-h-[80px] overflow-y-auto space-y-0.5">
                  {voiceLog.map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}

              {/* Report form */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Cuerpo / Región</label><input type="text" value={reportEditor.bodyPart} onChange={e => setReportEditor(p => ({ ...p, bodyPart: e.target.value }))} className={inputCls} placeholder="Ej: Tórax PA y lateral" /></div>
                  <div><label className={labelCls}>Modalidad</label><input type="text" value={selectedReport?.modality || selectedStudy?.modality || ''} className={inputCls} readOnly /></div>
                </div>
                <div><label className={labelCls}>Técnica</label><textarea value={reportEditor.technique} onChange={e => setReportEditor(p => ({ ...p, technique: e.target.value }))} rows={2} className={textareaCls} placeholder="Descripción de la técnica utilizada..." /></div>
                <div><label className={labelCls}>Hallazgos</label><textarea value={reportEditor.findings} onChange={e => setReportEditor(p => ({ ...p, findings: e.target.value }))} rows={5} className={textareaCls} placeholder="Hallazgos radiológicos detallados..." /></div>
                <div><label className={labelCls}>Impresión diagnóstica</label><textarea value={reportEditor.impression} onChange={e => setReportEditor(p => ({ ...p, impression: e.target.value }))} rows={3} className={textareaCls} placeholder="Impresión diagnóstica..." /></div>
                <div><label className={labelCls}>Recomendaciones</label><textarea value={reportEditor.recommendations} onChange={e => setReportEditor(p => ({ ...p, recommendations: e.target.value }))} rows={2} className={textareaCls} placeholder="Recomendaciones clínicas..." /></div>
              </div>

              {/* Vocabulary hints */}
              {selectedTemplate && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px]">
                  <span className="font-bold text-slate-600 uppercase">Vocabulario sugerido:</span>{' '}
                  {selectedTemplate.vocabularyHints.map((v, i) => (
                    <span key={i} className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold cursor-pointer hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition mx-0.5 inline-block" onClick={() => setReportEditor(p => ({ ...p, findings: p.findings ? p.findings + ', ' + v : v }))}>{v}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button onClick={handleSaveReport} className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-[10px] transition">
                    Guardar borrador
                  </button>
                  {selectedReport && selectedReport.status !== 'laudado' && (
                    <button onClick={() => handleSignReport(selectedReport.id)} className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-[10px] transition flex items-center gap-1">
                      <FileSignature className="w-3 h-3" /> Firmar laudo
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowDistributeDialog(true)} className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-[10px] transition flex items-center gap-1">
                    <Send className="w-3 h-3" /> Distribuir laudo
                  </button>
                  <button className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-[10px] transition flex items-center gap-1">
                    <Printer className="w-3 h-3" /> PDF
                  </button>
                </div>
              </div>

              {/* Distribution dialog */}
              {showDistributeDialog && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                  <h5 className="text-xs font-bold text-teal-800 flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Distribución automática del laudo</h5>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    {[
                      { label: 'Portal del paciente', icon: Globe, key: 'portal_paciente' },
                      { label: 'Email al médico solicitante', icon: Send, key: 'email_solicitante' },
                      { label: 'WhatsApp al paciente', icon: MessageSquare, key: 'whatsapp' },
                    ].map(ch => (
                      <label key={ch.key} className="flex items-center gap-2 p-2 bg-white border border-teal-100 rounded-lg cursor-pointer hover:bg-teal-100 transition">
                        <input type="checkbox" defaultChecked className="accent-teal-600" />
                        <ch.icon className="w-3 h-3 text-teal-600" />
                        <span className="font-semibold">{ch.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDistributeReport} className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold">Confirmar envío</button>
                    <button onClick={() => setShowDistributeDialog(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold">Cancelar</button>
                  </div>
                </div>
              )}

              {/* Report display (signed) */}
              {selectedReport && selectedReport.status === 'laudado' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-green-800 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Laudo firmado electrónicamente</h5>
                    <span className="text-[9px] text-green-600">{selectedReport.signedAt ? new Date(selectedReport.signedAt).toLocaleString('es') : ''}</span>
                  </div>
                  <p className="text-green-700">Firmante: {selectedReport.signedBy} | Verificación: {selectedReport.signatureId}</p>
                  <p className="text-green-600">Canales de distribución: {selectedReport.distributionChannels.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* 6.3 WORKLIST / HL7 / FHIR              */}
      {/* ═══════════════════════════════════════ */}
      {diagTab === 'worklist' && (
        <div className="space-y-5">
          {/* DICOM Worklist */}
          <div className={sectionCls}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm">Worklist DICOM (DMWL)</h3>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input type="text" value={worklistSearchQuery} onChange={e => setWorklistSearchQuery(e.target.value)} placeholder="Buscar..." className={`${inputCls} pl-8 w-48`} />
                </div>
                <select value={worklistStatusFilter} onChange={e => setWorklistStatusFilter(e.target.value)} className={inputCls + ' w-36'}>
                  <option value="all">Todos</option>
                  <option value="pendente">Pendiente</option>
                  <option value="em_execucao">En proceso</option>
                  <option value="concluido">Completado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="nao_compareceu">No asistió</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Paciente</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Programado</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Modalidad</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Procedimiento</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Solicitante</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Indicación</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Estado</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorklist.map(w => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-2"><span className="font-bold text-slate-800">{w.patientName}</span><br /><span className="text-[9px] text-slate-400">{w.patientDocument} | {w.patientSex}</span></td>
                      <td className="p-2 text-slate-600">{new Date(w.scheduledAt).toLocaleString('es')}</td>
                      <td className="p-2"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${modalityColors[w.modality]}`}>{w.modality}</span></td>
                      <td className="p-2 text-slate-600">{w.requestedProcedureDescription}</td>
                      <td className="p-2 text-slate-600">{w.referringPhysician}</td>
                      <td className="p-2 text-slate-500 max-w-[150px] truncate">{w.clinicalIndication}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-[9px] font-bold ${worklistStatusColors[w.status]}`}>{w.status === 'em_execucao' ? 'EN PROCESO' : w.status === 'concluido' ? 'COMPLETADO' : w.status.toUpperCase()}</span></td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {w.status === 'pendente' && <button onClick={() => handleUpdateWorklist(w.id, 'em_execucao')} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[9px] font-bold">Iniciar</button>}
                          {w.status === 'em_execucao' && <button onClick={() => handleUpdateWorklist(w.id, 'concluido')} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[9px] font-bold">Completar</button>}
                          {w.status === 'pendente' && <button onClick={() => handleUpdateWorklist(w.id, 'nao_compareceu')} className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[9px] font-bold">No asistió</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* HL7 Messages */}
          <div className={sectionCls}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">Mensageria HL7 v2.x / ASTM</h3>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input type="text" value={hl7SearchQuery} onChange={e => setHl7SearchQuery(e.target.value)} placeholder="Buscar mensaje..." className={`${inputCls} pl-8 w-48`} />
                </div>
                <button onClick={handleSendHl7} className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Send className="w-3 h-3" /> Enviar ACK
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredHl7.map(m => (
                <div key={m.id} className={`p-3 border rounded-xl text-xs transition ${m.status === 'processado' ? 'bg-green-50 border-green-200' : m.status === 'erro' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${m.protocol === 'HL7_v2.x' ? 'bg-blue-100 text-blue-700' : m.protocol === 'ASTM' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>{m.protocol}</span>
                      <span className="font-bold text-slate-800">{m.messageType}^{m.triggerEvent}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500">{m.patientName}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500">{m.sendingApp} → {m.receivingApp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${m.status === 'processado' ? 'bg-green-100 text-green-700' : m.status === 'erro' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{m.status.toUpperCase()}</span>
                      <button onClick={() => setHl7DetailOpen(hl7DetailOpen === m.id ? null : m.id)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
                        <ChevronRight className={`w-4 h-4 transition-transform ${hl7DetailOpen === m.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">ID: {m.controlId} | {m.direction} | Recibido: {new Date(m.receivedAt).toLocaleString('es')}</p>
                  {hl7DetailOpen === m.id && (
                    <div className="mt-2 p-2 bg-slate-900 text-green-400 rounded-lg font-mono text-[8px] max-h-[120px] overflow-y-auto whitespace-pre-wrap leading-relaxed">{m.rawMessage}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FHIR R4 */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">FHIR R4 — Interoperabilidade Moderna</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className={labelCls}>Endpoint FHIR R4</label>
                <input type="text" value={fhirEndpoint} onChange={e => setFhirEndpoint(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Versão</label>
                <input type="text" value="FHIR R4 (4.0.1)" className={inputCls} readOnly />
              </div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 space-y-1">
              <p className="font-bold">Recursos FHIR soportados:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {['Patient', 'Observation', 'DiagnosticReport', 'ImagingStudy', 'ServiceRequest', 'Practitioner', 'Organization'].map(r => (
                  <span key={r} className="bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded text-[9px] font-bold">{r}</span>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-indigo-600">Integración futura con HIS, IPS (International Patient Summary) y Superintendencia de Salud.</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* 6.4 LABORATORIO CLÍNICO                */}
      {/* ═══════════════════════════════════════ */}
      {diagTab === 'laboratorio' && (
        <div className="space-y-5">
          {/* Critical Alerts Banner */}
          {showCriticalAlert && filteredLabAlerts.filter(a => !a.acknowledgedAt && a.severity === 'critical').length > 0 && (
            <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-bold text-red-800 text-xs">⚠️ {filteredLabAlerts.filter(a => !a.acknowledgedAt && a.severity === 'critical').length} Valores CRÍTICOS sin confirmar</p>
                  <p className="text-[10px] text-red-600">Se notificó al médico solicitante automáticamente.</p>
                </div>
              </div>
              <button onClick={() => setShowCriticalAlert(false)} className="text-red-400 hover:text-red-700"><XCircle className="w-5 h-5" /></button>
            </div>
          )}

          {/* Lab Alerts */}
          <div className={sectionCls}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">Alertas de Laboratorio</h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{filteredLabAlerts.filter(a => !a.acknowledgedAt).length} pendientes</span>
              </div>
              <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} className={inputCls + ' w-32'}>
                <option value="all">Todos</option>
                <option value="critical">Crítico</option>
                <option value="warning">Advertencia</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {filteredLabAlerts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">Sin alertas</p>
              ) : filteredLabAlerts.map(a => (
                <div key={a.id} className={`p-3 border rounded-xl text-xs ${alertSeverityColors[a.severity]} ${a.acknowledgedAt ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {a.severity === 'critical' ? <AlertOctagon className="w-4 h-4 text-red-600" /> : a.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <Info className="w-4 h-4 text-blue-600" />}
                      <span className="font-bold">{a.testName}: {a.value} ({a.flag})</span>
                    </div>
                    <span className="text-[9px]">{new Date(a.createdAt).toLocaleString('es')}</span>
                  </div>
                  <p className="mt-1 text-[10px]">{a.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[9px]">Paciente: {a.patientName} | Notificado a: {a.notifiedTo.join(', ')}</p>
                    {!a.acknowledgedAt && (
                      <button onClick={() => handleAckAlert(a.id)} className="bg-white/50 hover:bg-white px-2 py-0.5 rounded text-[9px] font-bold transition">
                        <Check className="w-3 h-3 inline mr-0.5" /> Confirmar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Orders */}
          <div className={sectionCls}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm">Pedidos de Laboratorio</h3>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input type="text" value={labOrderSearch} onChange={e => setLabOrderSearch(e.target.value)} placeholder="Buscar..." className={`${inputCls} pl-8 w-48`} />
                </div>
                <select value={labStatusFilter} onChange={e => setLabStatusFilter(e.target.value)} className={inputCls + ' w-36'}>
                  <option value="all">Todos</option>
                  <option value="solicitado">Solicitado</option>
                  <option value="em_coleta">En colecta</option>
                  <option value="em_processamento">En proceso</option>
                  <option value="parcial">Parcial</option>
                  <option value="concluido">Completado</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {filteredLabOrders.map(order => (
                <div key={order.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{order.orderNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${labStatusColors[order.status]}`}>{order.status.toUpperCase()}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${order.priority === 'urgente' ? 'bg-red-100 text-red-700 border border-red-200' : order.priority === 'emergencia' ? 'bg-red-200 text-red-800 border border-red-300 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>{order.priority.toUpperCase()}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">{new Date(order.createdAt).toLocaleString('es')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <p className="text-slate-600"><span className="font-bold">Paciente:</span> {order.patientName}</p>
                    <p className="text-slate-600"><span className="font-bold">Solicitante:</span> {order.requestingPhysician}</p>
                    <p className="text-slate-600"><span className="font-bold">Seguro:</span> {order.insuranceType}</p>
                    <p className="text-slate-600"><span className="font-bold">Colecta:</span> {order.collectedAt ? new Date(order.collectedAt).toLocaleString('es') : 'Pendiente'}</p>
                  </div>
                  {/* Order items */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden">
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="text-left p-1.5 font-bold text-slate-600">Código</th>
                          <th className="text-left p-1.5 font-bold text-slate-600">Examen</th>
                          <th className="text-left p-1.5 font-bold text-slate-600">Muestra</th>
                          <th className="text-left p-1.5 font-bold text-slate-600">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map(item => (
                          <tr key={item.id} className="border-b border-slate-50">
                            <td className="p-1.5 font-mono text-slate-500">{item.code}</td>
                            <td className="p-1.5 font-bold text-slate-700">{item.name}</td>
                            <td className="p-1.5 text-slate-500">{item.sampleType} — {item.container}</td>
                            <td className="p-1.5"><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${labStatusColors[item.status]}`}>{item.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {order.observations && <p className="text-[10px] text-slate-500 italic">Obs: {order.observations}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Lab Results + Critical Value Alerts */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Resultados y Comparativo Histórico</h3>
            </div>

            {/* Results table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Paciente</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Prueba</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Valor</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Referencia</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Bandera</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Equipo</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Fecha</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {labResults.map(r => (
                    <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${r.flag.includes('critico') ? 'bg-red-50' : ''}`}>
                      <td className="p-2"><span className="font-bold text-slate-800">{selectedPatient?.name}</span></td>
                      <td className="p-2 text-slate-700">{r.testName}</td>
                      <td className="p-2">
                        <span className={`font-black ${r.flag === 'normal' ? 'text-green-700' : r.flag.includes('critico') ? 'text-red-700' : 'text-amber-700'}`}>
                          {r.value} {r.unit}
                        </span>
                      </td>
                      <td className="p-2 text-slate-500">{r.referenceLow} - {r.referenceHigh} {r.unit}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${flagColors[r.flag]}`}>
                          {r.flag === 'normal' ? 'NORMAL' : r.flag === 'alto' ? '▲ ALTO' : r.flag === 'baixo' ? '▼ BAJO' : r.flag === 'critico_alto' ? '▲▲ CRÍTICO ↑' : r.flag === 'critico_baixo' ? '▼▼ CRÍTICO ↓' : 'N/D'}
                        </span>
                      </td>
                      <td className="p-2 text-slate-400 text-[9px]">{r.equipment}</td>
                      <td className="p-2 text-slate-400">{r.performedAt.split('T')[0]}</td>
                      <td className="p-2">
                        <button onClick={() => { setSelectedLabResult(r); setLabResultDetailOpen(true); }} className="text-blue-600 hover:text-blue-800 font-bold text-[9px]">Ver histórico</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Historical comparison (mini chart) */}
            {selectedLabResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Comparativo histórico: {selectedLabResult.testName}</h5>
                  <button onClick={() => { setLabResultDetailOpen(false); setSelectedLabResult(null); }} className="text-slate-400 hover:text-slate-700"><XCircle className="w-4 h-4" /></button>
                </div>
                {(() => {
                  const history = getLabPatientHistory(selectedLabResult.patientId, selectedLabResult.testCode);
                  if (history.length === 0) return <p className="text-[10px] text-slate-400">Sin registros previos</p>;
                  const maxVal = Math.max(...history.map(h => Number(h.value)), selectedLabResult.referenceHigh || 0) * 1.3;
                  const minVal = Math.min(...history.map(h => Number(h.value)), selectedLabResult.referenceLow || 0) * 0.7;
                  const range = maxVal - minVal;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-end gap-1 h-[100px]">
                        {history.slice(0, 10).reverse().map((h, i) => {
                          const val = Number(h.value);
                          const heightPct = range > 0 ? ((val - minVal) / range) * 100 : 50;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <span className={`text-[8px] font-bold ${h.flag === 'normal' ? 'text-green-700' : 'text-amber-700'}`}>{val}</span>
                              <div className={`w-full rounded-t transition-all ${h.flag === 'normal' ? 'bg-green-400' : h.flag.includes('critico') ? 'bg-red-400' : 'bg-amber-400'}`} style={{ height: `${Math.max(heightPct, 5)}%` }} />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-end gap-1 text-[8px] text-slate-400">
                        {history.slice(0, 10).reverse().map((h, i) => (
                          <span key={i} className="flex-1 text-center">{h.performedAt.split('T')[0]}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-[9px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" /> Normal</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" /> Alterado</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> Crítico</span>
                        <span className="text-slate-500">Ref: {selectedLabResult.referenceLow} - {selectedLabResult.referenceHigh} {selectedLabResult.unit}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
