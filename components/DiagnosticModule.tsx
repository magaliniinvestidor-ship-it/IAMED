'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { canAccessTab } from '@/lib/rbac/catalog';
import {
  Patient, DicomStudy, DicomModality, ImagingReport, WorklistEntry, Hl7Message,
  LabOrder, LabResult, LabAlert, LabTest, ReportTemplate, modalityList,
  ClinicalAttachment,
} from '@/lib/mockData';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import { useModuleId } from '@/hooks/useModuleId';
import { hasPermission } from '@/lib/usePermissions';
import { resolveStudyImageUrl } from '@/lib/pacs/wado';
import {
  Microscope, Eye, FileText, Layers, Settings2, Search, Filter, Sliders,
  Plus, Trash2, Check, AlertTriangle, AlertCircle, Send, Clock, User,
  ChevronDown, ChevronRight, Printer, Download, FileSignature, RotateCw,
  Volume2, History, Info, Loader2, MonitorPlay, Magnet, Waves, Atom,
  GitBranch, Heart, Bone, Shield, Activity, Hash, Bell, MessageSquare,
  Globe, Zap, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, BarChart3,
  RefreshCw, ClipboardCheck, Package, CheckCircle, XCircle, AlertOctagon,
  Lock as LockIcon
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { PermissionGate, WithPermissions } from '@/components/ui/PermissionGate';
import { AttachmentImageViewer } from './diagnostic/AttachmentImageViewer';

interface DiagnosticModuleProps {
  patients: Patient[];
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  userPermissions?: string[];
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

const DiagnosticModuleContent = ({
  patients,
  activeSubmodule,
  addAuditLog,
  userPermissions,
}: DiagnosticModuleProps) => {
  const { t } = useI18n();

  // ─── SEQUENTIAL ID GENERATION (Postgres RPC) ───
  const genModuleId = useModuleId();
  const [diagTab, setDiagTab] = useState<DiagnosticTab>('pacs');

  // Guarda RBAC: aba ativa não pode ficar órfã quando permissões mudam
  useEffect(() => {
    if (canAccessTab(userPermissions, 'diagnostic', diagTab)) return;
    const order: DiagnosticTab[] = ['pacs', 'laudos', 'worklist', 'laboratorio'];
    const next = order.find(id => canAccessTab(userPermissions, 'diagnostic', id));
    if (next) setDiagTab(next);
  }, [userPermissions, diagTab]);

  const [selectedPatId, setSelectedPatId] = useState('');

  // ── PACS STATE ──
  const [dicomStudies, setDicomStudies] = useState<DicomStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<DicomStudy | null>(null);
  const [pacsModalityFilter, setPacsModalityFilter] = useState<string>('all');
  const [pacsSearchQuery, setPacsSearchQuery] = useState('');
  const [imageContrast, setImageContrast] = useState(100);
  const [imageBrightness, setImageBrightness] = useState(100);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [windowLevel, setWindowLevel] = useState({ center: 40, width: 400 });
  const [pacsAnnotation, setPacsAnnotation] = useState('');
  const [pacsMeasurements, setPacsMeasurements] = useState<{ id: string; label: string; value: string; unit: string }[]>([]);
  const [mprActive, setMprActive] = useState(false);
  const [selectedKeyImages, setSelectedKeyImages] = useState<string[]>([]);

  // ── LAUDOS STATE ──
  const [reports, setReports] = useState<ImagingReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedReport, setSelectedReport] = useState<ImagingReport | null>(null);
  const [reportEditor, setReportEditor] = useState({
    technique: '', findings: '', impression: '', recommendations: '', bodyPart: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);

  // ── WORKLIST STATE ──
  const [worklist, setWorklist] = useState<WorklistEntry[]>([]);
  const [hl7Messages, setHl7Messages] = useState<Hl7Message[]>([]);
  const [worklistSearchQuery, setWorklistSearchQuery] = useState('');
  const [worklistStatusFilter, setWorklistStatusFilter] = useState<string>('all');
  const [hl7DetailOpen, setHl7DetailOpen] = useState<string | null>(null);
  const [hl7SearchQuery, setHl7SearchQuery] = useState('');
  const [fhirEndpoint, setFhirEndpoint] = useState('https://iamed.py/fhir/R4');

  // ── LABORATÓRIO STATE ──
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [labAlerts, setLabAlerts] = useState<LabAlert[]>([]);
  const [labOrderSearch, setLabOrderSearch] = useState('');
  const [labStatusFilter, setLabStatusFilter] = useState<string>('all');
  const [selectedLabResult, setSelectedLabResult] = useState<LabResult | null>(null);
  const [labResultDetailOpen, setLabResultDetailOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [showCriticalAlert, setShowCriticalAlert] = useState(true);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [patientAttachments, setPatientAttachments] = useState<ClinicalAttachment[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [selectedAttachment, setSelectedAttachment] = useState<ClinicalAttachment | null>(null);
  const [attachmentViewer, setAttachmentViewer] = useState<ClinicalAttachment | null>(null);

  const generateAttachmentUrls = useCallback(async (attachments: ClinicalAttachment[]) => {
    const urls: Record<string, string> = {};
    await Promise.all(
      attachments.map(async (att) => {
        try {
          const { data } = await supabase.storage
            .from('clinical-attachments')
            .createSignedUrl(att.filePath, 3600);
          if (data?.signedUrl) urls[att.id] = data.signedUrl;
        } catch { /* ignore */ }
      })
    );
    setAttachmentUrls(urls);
  }, []);

  // ── FETCH DATA FROM SUPABASE ──
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedPatId) {
        setDicomStudies([]);
        setSelectedStudy(null);
        setReports([]);
        setSelectedReport(null);
        setWorklist([]);
        setHl7Messages([]);
        setLabOrders([]);
        setLabResults([]);
        setLabAlerts([]);
        setPatientAttachments([]);
        setAttachmentUrls({});
        setSelectedAttachment(null);
        setAttachmentViewer(null);
        return;
      }
      try {
        const [studiesRes, reportsRes, worklistRes, hl7Res, labOrdersRes, labResultsRes, labAlertsRes, attachmentsRes] = await Promise.all([
          supabase.from('dicom_studies').select('*').eq('patient_id', selectedPatId).order('created_at', { ascending: false }),
          supabase.from('imaging_reports').select('*').eq('patient_id', selectedPatId).order('created_at', { ascending: false }),
          supabase.from('dicom_worklist').select('*').eq('patient_id', selectedPatId).order('scheduled_at', { ascending: false }),
          supabase.from('hl7_messages').select('*').eq('patient_id', selectedPatId).order('received_at', { ascending: false }),
          supabase.from('lab_orders').select('*').eq('patient_id', selectedPatId).order('created_at', { ascending: false }),
          supabase.from('lab_results').select('*').eq('patient_id', selectedPatId).order('performed_at', { ascending: false }),
          supabase.from('lab_alerts').select('*').eq('patient_id', selectedPatId).order('created_at', { ascending: false }),
          supabase.from('clinical_attachments').select('*').eq('patient_id', selectedPatId).order('created_at', { ascending: false }),
        ]);
        setDicomStudies((studiesRes.data as DicomStudy[]) || []);
        setSelectedStudy(null);
        setReports((reportsRes.data as ImagingReport[]) || []);
        setSelectedReport(null);
        setWorklist((worklistRes.data as WorklistEntry[]) || []);
        setHl7Messages((hl7Res.data as Hl7Message[]) || []);
        setLabOrders((labOrdersRes.data as LabOrder[]) || []);
        setLabResults((labResultsRes.data as LabResult[]) || []);
        setLabAlerts((labAlertsRes.data as LabAlert[]) || []);
        const atts = ((attachmentsRes.data as Array<Record<string, unknown>>) || []).map(a => ({
          id: String(a.id),
          patientId: String(a.patient_id || ''),
          examRequestId: a.exam_request_id as string | undefined,
          createdBy: String(a.created_by || ''),
          createdAt: String(a.created_at || ''),
          updatedBy: (a.updated_by as string) || undefined,
          fileName: String(a.file_name || ''),
          filePath: String(a.file_path || ''),
          fileSizeBytes: Number(a.file_size_bytes || 0),
          mimeType: String(a.mime_type || 'application/octet-stream'),
          category: (a.category as ClinicalAttachment['category']) || 'outro',
          description: String(a.description || ''),
          isSensitive: Boolean(a.is_sensitive),
          signedBy: a.signed_by as string | undefined,
          signedAt: a.signed_at as string | undefined,
          signatureId: a.signature_id as string | undefined,
        }));
        setPatientAttachments(atts);
        setSelectedAttachment(null);
        generateAttachmentUrls(atts);
      } catch {
        setDicomStudies([]);
        setSelectedStudy(null);
        setReports([]);
        setSelectedReport(null);
        setWorklist([]);
        setHl7Messages([]);
        setLabOrders([]);
        setLabResults([]);
        setLabAlerts([]);
        setPatientAttachments([]);
        setAttachmentUrls({});
        setSelectedAttachment(null);
      }
    };
    fetchData();
  }, [selectedPatId, generateAttachmentUrls]);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [templatesRes, labTestsRes] = await Promise.all([
          supabase.from('report_templates').select('*').order('name'),
          supabase.from('lab_tests').select('*').order('name'),
        ]);
        setTemplates((templatesRes.data as ReportTemplate[]) || []);
        setLabTests((labTestsRes.data as LabTest[]) || []);
      } catch {
        setTemplates([]);
        setLabTests([]);
      }
    };
    fetchCatalogs();
  }, []);

  // ── Derived lists ──
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.document_number && p.document_number.toLowerCase().includes(q))
    );
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatId) return null;
    return patients.find(p => p.id === selectedPatId) || null;
  }, [patients, selectedPatId]);

  const filteredStudies = useMemo(() => {
    if (!selectedPatId) return [];
    return dicomStudies.filter(s => {
      if (s.patientId !== selectedPatId) return false;
      if (pacsModalityFilter !== 'all' && s.modality !== pacsModalityFilter) return false;
      if (pacsSearchQuery) {
        const q = pacsSearchQuery.toLowerCase();
        return s.patientName.toLowerCase().includes(q) || s.accessionNumber.toLowerCase().includes(q) || s.studyDescription.toLowerCase().includes(q);
      }
      return true;
    });
  }, [dicomStudies, selectedPatId, pacsModalityFilter, pacsSearchQuery]);

  const filteredReports = useMemo(() => {
    if (!selectedPatId) return [];
    return reports.filter(r => {
      if (r.patientId !== selectedPatId) return false;
      if (reportStatusFilter !== 'all' && r.status !== reportStatusFilter) return false;
      if (reportSearchQuery) {
        const q = reportSearchQuery.toLowerCase();
        return r.patientName.toLowerCase().includes(q) || r.findings.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [reports, selectedPatId, reportStatusFilter, reportSearchQuery]);

  const filteredWorklist = useMemo(() => {
    if (!selectedPatId) return [];
    return worklist.filter(w => {
      if (w.patientId !== selectedPatId) return false;
      if (worklistStatusFilter !== 'all' && w.status !== worklistStatusFilter) return false;
      if (worklistSearchQuery) {
        const q = worklistSearchQuery.toLowerCase();
        return w.patientName.toLowerCase().includes(q) || w.accessionNumber.toLowerCase().includes(q) || w.requestedProcedureDescription.toLowerCase().includes(q);
      }
      return true;
    });
  }, [worklist, selectedPatId, worklistStatusFilter, worklistSearchQuery]);

  const filteredHl7 = useMemo(() => {
    if (!selectedPatId) return [];
    return hl7Messages.filter(m => {
      if (m.patientId !== selectedPatId) return false;
      if (hl7SearchQuery) {
        const q = hl7SearchQuery.toLowerCase();
        return m.patientName.toLowerCase().includes(q) || m.controlId.toLowerCase().includes(q) || m.messageType.toLowerCase().includes(q);
      }
      return true;
    });
  }, [hl7Messages, selectedPatId, hl7SearchQuery]);

  const filteredLabOrders = useMemo(() => {
    if (!selectedPatId) return [];
    return labOrders.filter(o => {
      if (o.patientId !== selectedPatId) return false;
      if (labStatusFilter !== 'all' && o.status !== labStatusFilter) return false;
      if (labOrderSearch) {
        const q = labOrderSearch.toLowerCase();
        return o.patientName.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q) || o.requestingPhysician.toLowerCase().includes(q);
      }
      return true;
    });
  }, [labOrders, selectedPatId, labStatusFilter, labOrderSearch]);

  const filteredLabAlerts = useMemo(() => {
    if (!selectedPatId) return [];
    return labAlerts.filter(a => {
      if (a.patientId !== selectedPatId) return false;
      if (alertFilter !== 'all' && a.severity !== alertFilter) return false;
      return true;
    });
  }, [labAlerts, selectedPatId, alertFilter]);

  // ── TRANSLATED STATUS LABELS ──
  const statusLabels = useMemo(() => ({
    worklist: {
      pendente: t('diag_worklist_status_pending', 'app'),
      em_execucao: t('diag_worklist_status_in_progress', 'app'),
      concluido: t('diag_worklist_status_completed', 'app'),
      cancelado: t('diag_worklist_status_cancelled', 'app'),
      nao_compareceu: t('diag_worklist_status_no_show', 'app'),
    } as Record<string, string>,
    labOrder: {
      solicitado: t('diag_lab_orders_status_requested', 'app'),
      em_coleta: t('diag_lab_orders_status_collecting', 'app'),
      em_processamento: t('diag_lab_orders_status_processing', 'app'),
      parcial: t('diag_lab_orders_status_partial', 'app'),
      concluido: t('diag_lab_orders_status_completed', 'app'),
      cancelado: t('diag_worklist_status_cancelled', 'app'),
    } as Record<string, string>,
    labPriority: {
      urgente: t('diag_lab_priority_urgent', 'app'),
      emergencia: t('diag_lab_priority_emergency', 'app'),
      rotina: t('diag_lab_priority_routine', 'app'),
    } as Record<string, string>,
    labFlag: {
      normal: t('diag_lab_flag_normal', 'app'),
      alto: t('diag_lab_flag_high', 'app'),
      baixo: t('diag_lab_flag_low', 'app'),
      critico_alto: t('diag_lab_flag_critical_high', 'app'),
      critico_baixo: t('diag_lab_flag_critical_low', 'app'),
      indeterminado: t('diag_lab_flag_nd', 'app'),
    } as Record<string, string>,
  }), [t]);

  // ── PACS HANDLERS ──
  const handleAnnotateStudy = useCallback(async () => {
    if (!selectedStudy || !pacsAnnotation.trim()) return;
    const m = { id: await genModuleId('m'), label: pacsAnnotation, value: (Math.random() * 10).toFixed(1), unit: 'mm' };
    setPacsMeasurements(prev => [...prev, m]);
    setPacsAnnotation('');
    addAuditLog('Medición DICOM', `${m.label}: ${m.value}${m.unit} en ${selectedStudy.accessionNumber}`);
  }, [selectedStudy, pacsAnnotation, addAuditLog, genModuleId]);

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
      setVoiceLog(prev => [...prev, `[${new Date().toLocaleTimeString('es')}] ${t('diag_voice_activated', 'app')}`]);
      addAuditLog('Dictado por voz iniciado', selectedReport?.id || '');
      // Simulated voice transcription
      const phrases = [
        t('diag_voice_phrase_1', 'app'),
        t('diag_voice_phrase_2', 'app'),
        t('diag_voice_phrase_3', 'app'),
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
          setVoiceLog(prev => [...prev, `[${new Date().toLocaleTimeString('es')}] ${t('diag_voice_completed', 'app')}`]);
        }
      }, 2000);
    }
  }, [voiceActive, selectedReport, addAuditLog, t]);

  const handleSaveReport = useCallback(async () => {
    if (!reportEditor.findings.trim()) return;
    const studyId = selectedStudy?.id || dicomStudies[0]?.id || '';
    const report: ImagingReport = {
      id: await genModuleId('rep'), studyId, patientId: selectedPatient?.id || '', patientName: selectedPatient?.name || '',
      modality: selectedStudy?.modality || 'RX', templateId: selectedTemplate?.id,
      technique: reportEditor.technique, findings: reportEditor.findings,
      impression: reportEditor.impression, recommendations: reportEditor.recommendations,
      keyImages: selectedKeyImages, bodyPart: reportEditor.bodyPart || selectedStudy?.bodyPart || '',
      status: 'pre_laudo', reportedBy: 'Dra. Amanda Silva', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), reportedAt: new Date().toISOString(),
      distributionChannels: [], voiceTranscriptionUsed: voiceLog.length > 0,
    };
    setReports(prev => [report, ...prev]);
    setSelectedReport(report);
    addAuditLog('Laudo Guardado', `${report.modality} — ${selectedPatient?.name}`);
  }, [reportEditor, selectedStudy, selectedPatient, selectedTemplate, voiceLog, addAuditLog, dicomStudies, genModuleId, selectedKeyImages]);

  const handleSignReport = useCallback(async (reportId: string) => {
    const sigId = await genModuleId('sig');
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'laudado', signedBy: 'Dra. Amanda Silva', signedAt: new Date().toISOString(), signatureId: sigId } : r));
    addAuditLog('Laudo Firmado', reportId);
  }, [addAuditLog, genModuleId]);

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

  const handleSendHl7 = useCallback(async () => {
    const msgId = await genModuleId('hl7');
    const msg: Hl7Message = {
      id: msgId, messageType: 'ACK', triggerEvent: 'ACK',
      controlId: `ACK-${msgId}`, sendingApp: 'IAMED', sendingFacility: 'IAMED',
      receivingApp: 'MODALITY-ALL', receivingFacility: 'ALL', patientId: selectedPatient?.id || '',
      patientName: selectedPatient?.name || '', rawMessage: 'ACK simulado',
      parsedSegments: [{ name: 'MSH', fields: ['IAMED', 'ACK', '2026'] }],
      status: 'processado', receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(), protocol: 'HL7_v2.x',
      direction: 'outbound', sourceSystem: 'IAMED',
    };
    setHl7Messages(prev => [msg, ...prev]);
    addAuditLog('HL7 ACK Enviado', msg.controlId);
  }, [selectedPatient, addAuditLog, genModuleId]);

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
    { key: 'pacs', label: t('diag_tab_pacs', 'app'), icon: MonitorPlay },
    { key: 'laudos', label: t('diag_tab_laudos', 'app'), icon: FileText },
    { key: 'worklist', label: t('diag_tab_worklist', 'app'), icon: Layers },
    { key: 'laboratorio', label: t('diag_tab_lab', 'app'), icon: Microscope },
  ];

  const visibleDiagTabs = diagTabs.filter(tb => canAccessTab(userPermissions, 'diagnostic', tb.key));

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className={sectionCls + ' pb-1'}>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100">
          {visibleDiagTabs.map(tab => {
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

      {/* Patient Selector */}
      <div className={sectionCls}>
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-teal-600 shrink-0" />
          <label className="text-xs font-bold text-slate-600 shrink-0">{t('diag_patient', 'app')}:</label>
          <div className="relative flex-1">
            <input
              type="text"
              value={patientDropdownOpen ? patientSearch : (selectedPatient ? `${selectedPatient.name}${selectedPatient.document_number ? ' — ' + selectedPatient.document_number : ''}` : '')}
              onChange={e => { setPatientSearch(e.target.value); setPatientDropdownOpen(true); }}
              onFocus={() => { setPatientSearch(''); setPatientDropdownOpen(true); }}
              onBlur={() => setTimeout(() => setPatientDropdownOpen(false), 200)}
              placeholder={t('diag_patient_search', 'app')}
              className={inputCls}
            />
            {patientDropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div
                  onClick={() => { setSelectedPatId(''); setPatientSearch(''); setPatientDropdownOpen(false); }}
                  className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer font-semibold border-b border-slate-100"
                >
                  {t('diag_patient_all', 'app')} ({patients.length})
                </div>
                {filteredPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPatId(p.id); setPatientSearch(''); setPatientDropdownOpen(false); }}
                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-teal-50 flex justify-between items-center ${selectedPatId === p.id ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700'}`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[9px] text-slate-400 shrink-0 ml-2">{p.document_number || p.phone || ''}</span>
                  </div>
                ))}
                {filteredPatients.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-400">{t('diag_patient_none', 'app')}</div>
                )}
              </div>
            )}
          </div>
          {selectedPatient && (
            <button onClick={() => { setSelectedPatId(''); }} className="text-[10px] text-slate-400 hover:text-rose-500 transition" title={t('diag_patient_clear', 'app')}>
              <XCircle className="w-4 h-4" />
            </button>
          )}
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
                <h3 className="font-bold text-slate-800 text-sm">{t('diag_pacs_title', 'app')}</h3>
              </div>
              {/* Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" value={pacsSearchQuery} onChange={e => setPacsSearchQuery(e.target.value)} placeholder={t('diag_pacs_search', 'app')} className={`${inputCls} pl-9`} />
                </div>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setPacsModalityFilter('all')} className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${pacsModalityFilter === 'all' ? 'bg-teal-600 text-white border-teal-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>{t('diag_pacs_all', 'app')}</button>
                  {modalityList.map(m => (
                    <button key={m.code} onClick={() => setPacsModalityFilter(m.code)} className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${pacsModalityFilter === m.code ? modalityColors[m.code] + ' border-current font-black' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{m.code}</button>
                  ))}
                </div>
              </div>
              {/* Study list */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredStudies.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">{t('diag_pacs_empty', 'app')}</p>
                ) : filteredStudies.map(s => (
                  <div key={s.id} onClick={() => { setSelectedStudy(s); setImageContrast(100); setImageBrightness(100); setImageZoom(100); setImageRotation(0); setPacsMeasurements([]); }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${selectedStudy?.id === s.id ? 'bg-teal-50 border-teal-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${modalityColors[s.modality]}`}>{s.modality}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.status === 'laudado' ? 'bg-green-100 text-green-700' : s.status === 'laudo_pendente' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{s.status === 'laudado' ? t('diag_reports_status_signed', 'app') : s.status === 'laudo_pendente' ? t('diag_pacs_status_pend_laud', 'app') : s.status.toUpperCase()}</span>
                    </div>
                    <p className="font-bold text-slate-800">{s.patientName}</p>
                    <p className="text-slate-500 text-[10px]">{s.studyDescription}</p>
                    <p className="text-slate-400 text-[9px] mt-1">{t('diag_dicom_label_acc', 'app')} {s.accessionNumber} | {s.seriesCount} series</p>
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
                      <span className="text-[10px] font-bold bg-slate-100 py-1 px-2.5 rounded text-slate-600">{t('diag_pacs_id_badge', 'app')}</span>
                      <span className="text-[10px] font-bold bg-teal-50 text-teal-700 py-1 px-2.5 rounded border border-teal-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" /> {t('diag_pacs_online', 'app')}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 py-1 px-2 rounded">{selectedStudy.vendor || 'Siemens'}</span>
                    </div>
                  </div>

                  {/* DICOM Viewer */}
                    <div className="relative bg-black rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 h-[380px] select-none">
                      <Image
                        src={resolveStudyImageUrl(selectedStudy.studyInstanceUID, selectedStudy.thumbnailUrl)}
                        alt="DICOM Study"
                        referrerPolicy="no-referrer"
                        fill
                        className="object-cover transition duration-150"
                        style={{
                          filter: `contrast(${imageContrast}%) brightness(${imageBrightness}%) grayscale(100%)`,
                          transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                        }}
                        unoptimized
                      />

                    {/* Patient info overlay */}
                    <div className="absolute top-3 left-3 bg-black/80 p-2 rounded-md font-mono text-[9px] text-teal-400 space-y-0.5 pointer-events-none">
                      <p>{t('diag_dicom_label_name', 'app')} {selectedStudy.patientName.toUpperCase()}</p>
                      <p>{t('diag_dicom_label_study', 'app')} {selectedStudy.studyDescription}</p>
                      <p>{t('diag_dicom_label_acc', 'app')} {selectedStudy.accessionNumber}</p>
                      <p>{t('diag_dicom_label_modality', 'app')} {selectedStudy.modalityName || selectedStudy.modality}</p>
                      <p>{t('diag_dicom_label_station', 'app')} {selectedStudy.stationName}</p>
                      <p>{t('diag_dicom_label_series', 'app')} {selectedStudy.seriesCount} | {t('diag_dicom_label_instances', 'app')} {selectedStudy.instanceCount}</p>
                    </div>

                    {/* Window/Level overlay */}
                    <div className="absolute top-3 right-3 bg-black/80 p-2 rounded-md font-mono text-[9px] text-amber-400 pointer-events-none">
                      <p>{t('diag_dicom_window', 'app')} {windowLevel.width} {t('diag_dicom_level', 'app')} {windowLevel.center}</p>
                      <p>{t('diag_dicom_zoom', 'app')} {imageZoom}% | {t('diag_dicom_rotation', 'app')} {imageRotation}°</p>
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
                        <span className="font-semibold text-slate-600 w-16 text-[10px]">{t('diag_pacs_contrast', 'app')}</span>
                        <input type="range" min="25" max="200" value={imageContrast} onChange={e => setImageContrast(Number(e.target.value))} className="flex-1 accent-teal-600" />
                        <span className="w-10 text-right font-bold text-[10px]">{imageContrast}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-600 w-16 text-[10px]">{t('diag_pacs_brightness', 'app')}</span>
                        <input type="range" min="25" max="200" value={imageBrightness} onChange={e => setImageBrightness(Number(e.target.value))} className="flex-1 accent-teal-600" />
                        <span className="w-10 text-right font-bold text-[10px]">{imageBrightness}%</span>
                      </div>
                    </div>

                    {/* Zoom / Rotation / Window-Level */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>{t('diag_pacs_zoom', 'app')}</label>
                        <div className="flex gap-1">
                          <button onClick={handleZoomOut} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold">−</button>
                          <input type="range" min="25" max="400" value={imageZoom} onChange={e => setImageZoom(Number(e.target.value))} className="flex-1 accent-teal-600" />
                          <button onClick={handleZoomIn} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold">+</button>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>{t('diag_pacs_rotation', 'app')}</label>
                        <div className="flex gap-1">
                          <button onClick={() => setImageRotation(prev => prev - 90)} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold"><RotateCw className="w-3 h-3 inline" /> -90°</button>
                          <button onClick={() => setImageRotation(0)} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold">0°</button>
                          <button onClick={() => setImageRotation(prev => prev + 90)} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold"><RotateCw className="w-3 h-3 inline rotate-180" /> +90°</button>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>{t('diag_pacs_window_level', 'app')}</label>
                        <div className="flex gap-1">
                          <input type="number" value={windowLevel.width} onChange={e => setWindowLevel(p => ({ ...p, width: +e.target.value }))} className={`${inputCls} w-16`} placeholder="W" />
                          <input type="number" value={windowLevel.center} onChange={e => setWindowLevel(p => ({ ...p, center: +e.target.value }))} className={`${inputCls} w-16`} placeholder="L" />
                        </div>
                      </div>
                    </div>

                    {/* Measurements */}
                    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                      <h5 className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1"><Hash className="w-3 h-3" /> {t('diag_pacs_annotations', 'app')}</h5>
                      <div className="flex gap-2">
                        <input type="text" value={pacsAnnotation} onChange={e => setPacsAnnotation(e.target.value)} placeholder={t('diag_pacs_annotation_placeholder', 'app')} className={`${inputCls} flex-1`} />
                        <button onClick={handleAnnotateStudy} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> {t('diag_pacs_add_annotation', 'app')}</button>
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

                    {/* Reset + MPR */}
                    <div className="flex gap-2">
                      <button onClick={handleResetImage} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1 transition">
                        <RefreshCw className="w-3 h-3" /> {t('diag_pacs_reset', 'app')}
                      </button>
                      <button onClick={() => setMprActive(!mprActive)} className={`flex-1 py-2 font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1 transition ${mprActive ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
                        <Layers className="w-3 h-3" /> MPR
                      </button>
                    </div>

                    {/* Key Images selector */}
                    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                      <h5 className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                        <svg className="w-3 h-3 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg> {t('diag_pacs_key_images', 'app')}
                        {selectedKeyImages.length > 0 && <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[8px]">{selectedKeyImages.length}</span>}
                      </h5>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          const url = resolveStudyImageUrl(selectedStudy.studyInstanceUID, selectedStudy.thumbnailUrl);
                          setSelectedKeyImages(prev => prev.includes(url) ? prev : [...prev, url]);
                        }} className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold border border-indigo-200 transition">
                          {t('diag_pacs_add_key_image', 'app')}
                        </button>
                        {selectedKeyImages.length > 0 && (
                          <button onClick={() => setSelectedKeyImages([])} className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold border border-rose-200 transition">
                            {t('diag_pacs_clear_key_images', 'app')}
                          </button>
                        )}
                      </div>
                      {selectedKeyImages.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {selectedKeyImages.map((url, i) => (
                            <div key={i} className="relative group">
                              <Image src={url} alt={`Key ${i + 1}`} width={48} height={36} className="rounded border border-indigo-200 object-cover" unoptimized />
                              <button onClick={() => setSelectedKeyImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-3.5 h-3.5 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* MPR View */}
                {mprActive && (
                  <div className={sectionCls}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        <h5 className="text-xs font-bold text-slate-600 uppercase">{t('diag_pacs_mpr_title', 'app')}</h5>
                      </div>
                      <button onClick={() => setMprActive(false)} className="text-slate-400 hover:text-slate-700"><XCircle className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { label: t('diag_pacs_mpr_axial', 'app'), rotateX: 0, rotateY: 0, rotateZ: 0 },
                        { label: t('diag_pacs_mpr_sagittal', 'app'), rotateX: 0, rotateY: 90, rotateZ: 0 },
                        { label: t('diag_pacs_mpr_coronal', 'app'), rotateX: 90, rotateY: 0, rotateZ: 0 },
                      ]).map(plane => (
                        <div key={plane.label} className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-500 uppercase text-center">{plane.label}</p>
                          <div className="relative bg-black rounded-lg overflow-hidden border border-slate-700 h-[160px] flex items-center justify-center">
                            <Image
                              src={resolveStudyImageUrl(selectedStudy.studyInstanceUID, selectedStudy.thumbnailUrl)}
                              alt={plane.label}
                              fill
                              className="object-cover"
                              style={{
                                filter: `contrast(${imageContrast}%) brightness(${imageBrightness}%) grayscale(100%)`,
                                transform: `perspective(400px) rotateX(${plane.rotateX}deg) rotateY(${plane.rotateY}deg) rotateZ(${plane.rotateZ}deg) scale(0.9)`,
                              }}
                              unoptimized
                            />
                            <div className="absolute bottom-1 left-1 bg-black/70 text-[7px] text-indigo-400 px-1 rounded font-mono">{plane.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 text-center">{t('diag_pacs_mpr_note', 'app')}</p>
                  </div>
                )}

                {/* Study Details */}
                <div className={sectionCls}>
                  <h5 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1"><Info className="w-3.5 h-3.5" /> {t('diag_pacs_details', 'app')}</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="font-bold text-slate-500">{t('diag_pacs_clinical_history', 'app')}</span> <span className="text-slate-700">{selectedStudy.clinicalHistory}</span></div>
                    <div><span className="font-bold text-slate-500">{t('diag_pacs_referring', 'app')}</span> <span className="text-slate-700">{selectedStudy.referringPhysician}</span></div>
                    <div><span className="font-bold text-slate-500">{t('diag_pacs_equipment', 'app')}</span> <span className="text-slate-700">{selectedStudy.stationName} ({selectedStudy.vendor})</span></div>
                    <div><span className="font-bold text-slate-500">{t('diag_pacs_scheduled', 'app')}</span> <span className="text-slate-700">{selectedStudy.scheduledAt ? new Date(selectedStudy.scheduledAt).toLocaleString('es') : 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-500">{t('diag_dicom_uid', 'app')}</span> <span className="text-[9px] font-mono text-slate-500 break-all">{selectedStudy.studyInstanceUID}</span></div>
                  </div>
                </div>
              </>
            ) : (
              <div className={sectionCls + ' flex flex-col items-center justify-center py-16 text-slate-400'}>
                <MonitorPlay className="w-10 h-10 mb-3" />
                <p className="text-sm font-bold">{t('diag_pacs_select', 'app')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {patientAttachments.length > 0 && (
        <div className={sectionCls}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">{t('diag_attachments_title', 'app')}</h3>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">{patientAttachments.length}</span>
          </div>
          <p className="text-[10px] text-slate-500">{t('diag_attachments_subtitle', 'app')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {patientAttachments.map(att => (
              <div
                key={att.id}
                onClick={() => {
                  if ((att.mimeType || '').startsWith('image/')) {
                    setAttachmentViewer(att);
                  } else {
                    setSelectedAttachment(att);
                  }
                }}
                className="border border-slate-200 rounded-lg p-2 hover:border-indigo-400 cursor-pointer transition bg-white"
                title={att.description}
              >
                <div className="aspect-square bg-slate-50 rounded mb-1 overflow-hidden flex items-center justify-center relative">
                  {attachmentUrls[att.id] && att.mimeType.startsWith('image/') ? (
                    <Image
                      src={attachmentUrls[att.id]}
                      alt={att.fileName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-700 truncate">{att.fileName}</p>
                <p className="text-[9px] text-slate-500 truncate">{att.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachment preview modal */}
      {selectedAttachment && attachmentUrls[selectedAttachment.id] && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAttachment(null)}>
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">{selectedAttachment.fileName}</h4>
              <button onClick={() => setSelectedAttachment(null)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 bg-slate-50">
              {selectedAttachment.mimeType.startsWith('image/') ? (
                <div className="relative w-full h-[70vh]">
                  <Image
                    src={attachmentUrls[selectedAttachment.id]}
                    alt={selectedAttachment.fileName}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : selectedAttachment.mimeType === 'application/pdf' ? (
                <iframe
                  src={attachmentUrls[selectedAttachment.id]}
                  className="w-full h-[70vh] border-0"
                  title={selectedAttachment.fileName}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <p className="text-sm font-bold text-slate-700">{selectedAttachment.fileName}</p>
                  <a
                    href={attachmentUrls[selectedAttachment.id]}
                    download={selectedAttachment.fileName}
                    className="inline-block mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg"
                  >
                    {t('diag_attachments_download', 'app')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attachment image viewer (W/L, zoom, rotation, measurements) — additive, não substitui o viewer DICOM nem o modal de anexo */}
      {attachmentViewer && attachmentUrls[attachmentViewer.id] && (
        <AttachmentImageViewer
          imageUrl={attachmentUrls[attachmentViewer.id]}
          metadata={{
            fileName: attachmentViewer.fileName,
            category: attachmentViewer.category,
            description: attachmentViewer.description,
            mimeType: attachmentViewer.mimeType,
            patientName: selectedPatient?.name,
            patientId: selectedPatient?.id,
          }}
          onClose={() => setAttachmentViewer(null)}
          addAuditLog={addAuditLog}
        />
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
                <h3 className="font-bold text-slate-800 text-sm">{t('diag_reports_title', 'app')}</h3>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" value={reportSearchQuery} onChange={e => setReportSearchQuery(e.target.value)} placeholder={t('diag_reports_search', 'app')} className={`${inputCls} pl-9`} />
                </div>
                <select value={reportStatusFilter} onChange={e => setReportStatusFilter(e.target.value)} className={inputCls}>
                  <option value="all">{t('diag_reports_all_status', 'app')}</option>
                  <option value="rascunho">{t('diag_reports_status_draft', 'app')}</option>
                  <option value="pre_laudo">{t('diag_reports_status_pre', 'app')}</option>
                  <option value="laudado">{t('diag_reports_status_signed', 'app')}</option>
                  <option value="corrigido">{t('diag_reports_status_corrected', 'app')}</option>
                  <option value="cancelado">{t('diag_reports_status_cancelled', 'app')}</option>
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
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{r.impression || r.findings || t('diag_reports_no_content', 'app')}</p>
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
                  <h4 className="font-bold text-slate-800 text-sm">{t('diag_reports_editor', 'app')}</h4>
                  <p className="text-[10px] text-slate-500">{t('diag_reports_subtitle', 'app')}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${selectedReport?.status === 'laudado' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                    {selectedReport?.status === 'laudado' ? t('diag_reports_status_signed_distributed', 'app') : selectedReport?.status?.toUpperCase() || t('diag_reports_status_new', 'app')}
                  </span>
                </div>
              </div>

              {/* Template selector & Voice */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('diag_reports_template', 'app')}</label>
                  <select value={selectedTemplate?.id || ''} onChange={e => { const t = templates.find(x => x.id === e.target.value); setSelectedTemplate(t || null); }} className={inputCls}>
                    <option value="">{t('diag_reports_select_template', 'app')}</option>
                    {templates.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name} ({t.modality})</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={handleLoadTemplate} className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
                    <ClipboardCheck className="w-3 h-3" /> {t('diag_reports_load_template', 'app')}
                  </button>
                  <button onClick={handleVoiceToggle} className={`py-2 px-3 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${voiceActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
                    <Volume2 className="w-3 h-3" /> {voiceActive ? t('diag_reports_voice_stop', 'app') : t('diag_reports_voice_start', 'app')}
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
                  <div><label className={labelCls}>{t('diag_reports_body_part', 'app')}</label><input type="text" value={reportEditor.bodyPart} onChange={e => setReportEditor(p => ({ ...p, bodyPart: e.target.value }))} className={inputCls} placeholder={t('diag_reports_body_part_placeholder', 'app')} /></div>
                  <div><label className={labelCls}>{t('diag_reports_modality', 'app')}</label><input type="text" value={selectedReport?.modality || selectedStudy?.modality || ''} className={inputCls} readOnly /></div>
                </div>
                <div><label className={labelCls}>{t('diag_reports_technique', 'app')}</label><textarea value={reportEditor.technique} onChange={e => setReportEditor(p => ({ ...p, technique: e.target.value }))} rows={2} className={textareaCls} placeholder={t('diag_reports_technique_placeholder', 'app')} /></div>
                <div><label className={labelCls}>{t('diag_reports_findings', 'app')}</label><textarea value={reportEditor.findings} onChange={e => setReportEditor(p => ({ ...p, findings: e.target.value }))} rows={5} className={textareaCls} placeholder={t('diag_reports_findings_placeholder', 'app')} /></div>
                <div><label className={labelCls}>{t('diag_reports_impression', 'app')}</label><textarea value={reportEditor.impression} onChange={e => setReportEditor(p => ({ ...p, impression: e.target.value }))} rows={3} className={textareaCls} placeholder={t('diag_reports_impression_placeholder', 'app')} /></div>
                <div><label className={labelCls}>{t('diag_reports_recommendations', 'app')}</label><textarea value={reportEditor.recommendations} onChange={e => setReportEditor(p => ({ ...p, recommendations: e.target.value }))} rows={2} className={textareaCls} placeholder={t('diag_reports_recommendations_placeholder', 'app')} /></div>
              </div>

              {/* Vocabulary hints */}
              {selectedTemplate && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px]">
                  <span className="font-bold text-slate-600 uppercase">{t('diag_reports_vocabulary', 'app')}</span>{' '}
                  {selectedTemplate.vocabularyHints.map((v, i) => (
                    <span key={i} className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold cursor-pointer hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition mx-0.5 inline-block" onClick={() => setReportEditor(p => ({ ...p, findings: p.findings ? p.findings + ', ' + v : v }))}>{v}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button onClick={handleSaveReport} className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-[10px] transition">
                    {t('diag_reports_save', 'app')}
                  </button>
                  {selectedReport && selectedReport.status !== 'laudado' && hasPermission(userPermissions, 'perform_diagnostic_sign') && (
                    <button onClick={() => handleSignReport(selectedReport.id)} className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-[10px] transition flex items-center gap-1">
                      <FileSignature className="w-3 h-3" /> {t('diag_reports_sign', 'app')}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {hasPermission(userPermissions, 'perform_diagnostic_report') && (
                    <button onClick={() => setShowDistributeDialog(true)} className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-[10px] transition flex items-center gap-1">
                      <Send className="w-3 h-3" /> {t('diag_reports_distribute', 'app')}
                    </button>
                  )}
                  <button className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-[10px] transition flex items-center gap-1">
                    <Printer className="w-3 h-3" /> PDF
                  </button>
                </div>
              </div>

              {/* Distribution dialog */}
              {showDistributeDialog && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                  <h5 className="text-xs font-bold text-teal-800 flex items-center gap-1"><Send className="w-3.5 h-3.5" /> {t('diag_reports_dist_title', 'app')}</h5>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    {[
                      { label: t('diag_reports_dist_portal', 'app'), icon: Globe, key: 'portal_paciente' },
                      { label: t('diag_reports_dist_email', 'app'), icon: Send, key: 'email_solicitante' },
                      { label: t('diag_reports_dist_whatsapp', 'app'), icon: MessageSquare, key: 'whatsapp' },
                    ].map(ch => (
                      <label key={ch.key} className="flex items-center gap-2 p-2 bg-white border border-teal-100 rounded-lg cursor-pointer hover:bg-teal-100 transition">
                        <input type="checkbox" defaultChecked className="accent-teal-600" />
                        <ch.icon className="w-3 h-3 text-teal-600" />
                        <span className="font-semibold">{ch.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDistributeReport} className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold">{t('diag_btn_confirm_send', 'app')}</button>
                    <button onClick={() => setShowDistributeDialog(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold">{t('diag_btn_cancel', 'app')}</button>
                  </div>
                </div>
              )}

              {/* Report display (signed) */}
              {selectedReport && selectedReport.status === 'laudado' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-green-800 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {t('diag_reports_signed_title', 'app')}</h5>
                    <span className="text-[9px] text-green-600">{selectedReport.signedAt ? new Date(selectedReport.signedAt).toLocaleString('es') : ''}</span>
                  </div>
                  <p className="text-green-700">{t('diag_reports_signed_by', 'app')}: {selectedReport.signedBy} | {t('diag_reports_signed_verification', 'app')}: {selectedReport.signatureId}</p>
                  <p className="text-green-600">{t('diag_reports_signed_channels', 'app')}: {selectedReport.distributionChannels.join(', ')}</p>
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
                <h3 className="font-bold text-slate-800 text-sm">{t('diag_worklist_title', 'app')}</h3>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input type="text" value={worklistSearchQuery} onChange={e => setWorklistSearchQuery(e.target.value)} placeholder={t('diag_worklist_search', 'app')} className={`${inputCls} pl-8 w-48`} />
                </div>
                <select value={worklistStatusFilter} onChange={e => setWorklistStatusFilter(e.target.value)} className={inputCls + ' w-36'}>
                  <option value="all">{t('diag_worklist_all', 'app')}</option>
                  <option value="pendente">{t('diag_worklist_status_pending', 'app')}</option>
                  <option value="em_execucao">{t('diag_worklist_status_in_progress', 'app')}</option>
                  <option value="concluido">{t('diag_worklist_status_completed', 'app')}</option>
                  <option value="cancelado">{t('diag_worklist_status_cancelled', 'app')}</option>
                  <option value="nao_compareceu">{t('diag_worklist_status_no_show', 'app')}</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_worklist_col_patient', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_worklist_col_scheduled', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_worklist_col_modality', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_worklist_col_procedure', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_worklist_col_referring', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_worklist_col_indication', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_worklist_col_status', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_worklist_col_actions', 'app')}</th>
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
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-[9px] font-bold ${worklistStatusColors[w.status]}`}>{statusLabels.worklist[w.status] || w.status.toUpperCase()}</span></td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {w.status === 'pendente' && <button onClick={() => handleUpdateWorklist(w.id, 'em_execucao')} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[9px] font-bold">{t('diag_worklist_start', 'app')}</button>}
                          {w.status === 'em_execucao' && <button onClick={() => handleUpdateWorklist(w.id, 'concluido')} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[9px] font-bold">{t('diag_worklist_complete', 'app')}</button>}
                          {w.status === 'pendente' && <button onClick={() => handleUpdateWorklist(w.id, 'nao_compareceu')} className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[9px] font-bold">{t('diag_worklist_no_show', 'app')}</button>}
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
                <h3 className="font-bold text-slate-800 text-sm">{t('diag_hl7_title', 'app')}</h3>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input type="text" value={hl7SearchQuery} onChange={e => setHl7SearchQuery(e.target.value)} placeholder={t('diag_hl7_search', 'app')} className={`${inputCls} pl-8 w-48`} />
                </div>
                <button onClick={handleSendHl7} className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Send className="w-3 h-3" /> {t('diag_hl7_send_ack', 'app')}
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
                  <p className="text-[9px] text-slate-400 mt-1">{t('diag_hl7_metadata_id', 'app')} {m.controlId} | {m.direction} | {t('diag_hl7_metadata_received', 'app')} {new Date(m.receivedAt).toLocaleString('es')}</p>
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
              <h3 className="font-bold text-slate-800 text-sm">{t('diag_fhir_title', 'app')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className={labelCls}>{t('diag_fhir_endpoint', 'app')}</label>
                <input type="text" value={fhirEndpoint} onChange={e => setFhirEndpoint(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('diag_fhir_version', 'app')}</label>
                <input type="text" value="FHIR R4 (4.0.1)" className={inputCls} readOnly />
              </div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 space-y-1">
              <p className="font-bold">{t('diag_fhir_resources', 'app')}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {['Patient', 'Observation', 'DiagnosticReport', 'ImagingStudy', 'ServiceRequest', 'Practitioner', 'Organization'].map(r => (
                  <span key={r} className="bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded text-[9px] font-bold">{r}</span>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-indigo-600">{t('diag_fhir_future', 'app')}</p>
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
                  <p className="font-bold text-red-800 text-xs">⚠️ {filteredLabAlerts.filter(a => !a.acknowledgedAt && a.severity === 'critical').length} {t('diag_lab_alerts_critical', 'app')}</p>
                  <p className="text-[10px] text-red-600">{t('diag_lab_alerts_notified', 'app')}</p>
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
                <h3 className="font-bold text-slate-800 text-sm">{t('diag_lab_alerts_title', 'app')}</h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{filteredLabAlerts.filter(a => !a.acknowledgedAt).length} {t('diag_lab_alerts_pending', 'app')}</span>
              </div>
              <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} className={inputCls + ' w-32'}>
                <option value="all">{t('diag_lab_alerts_all', 'app')}</option>
                <option value="critical">{t('diag_lab_critical', 'app')}</option>
                <option value="warning">{t('diag_lab_alerts_warning', 'app')}</option>
                <option value="info">{t('diag_lab_alerts_info', 'app')}</option>
              </select>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {filteredLabAlerts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">{t('diag_lab_alerts_empty', 'app')}</p>
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
                    <p className="text-[9px]">{t('diag_lab_field_patient', 'app')} {a.patientName} | {t('diag_lab_notified_to', 'app')} {a.notifiedTo.join(', ')}</p>
                    {!a.acknowledgedAt && (
                      <button onClick={() => handleAckAlert(a.id)} className="bg-white/50 hover:bg-white px-2 py-0.5 rounded text-[9px] font-bold transition">
                        <Check className="w-3 h-3 inline mr-0.5" /> {t('diag_lab_alerts_confirm', 'app')}
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
                <h3 className="font-bold text-slate-800 text-sm">{t('diag_lab_orders_title', 'app')}</h3>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input type="text" value={labOrderSearch} onChange={e => setLabOrderSearch(e.target.value)} placeholder={t('diag_lab_orders_search', 'app')} className={`${inputCls} pl-8 w-48`} />
                </div>
                <select value={labStatusFilter} onChange={e => setLabStatusFilter(e.target.value)} className={inputCls + ' w-36'}>
                  <option value="all">{t('diag_lab_orders_all', 'app')}</option>
                  <option value="solicitado">{t('diag_lab_orders_status_requested', 'app')}</option>
                  <option value="em_coleta">{t('diag_lab_orders_status_collecting', 'app')}</option>
                  <option value="em_processamento">{t('diag_lab_orders_status_processing', 'app')}</option>
                  <option value="parcial">{t('diag_lab_orders_status_partial', 'app')}</option>
                  <option value="concluido">{t('diag_lab_orders_status_completed', 'app')}</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {filteredLabOrders.map(order => (
                <div key={order.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{order.orderNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${labStatusColors[order.status]}`}>{statusLabels.labOrder[order.status] || order.status.toUpperCase()}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${order.priority === 'urgente' ? 'bg-red-100 text-red-700 border border-red-200' : order.priority === 'emergencia' ? 'bg-red-200 text-red-800 border border-red-300 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>{statusLabels.labPriority[order.priority] || order.priority.toUpperCase()}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">{new Date(order.createdAt).toLocaleString('es')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <p className="text-slate-600"><span className="font-bold">{t('diag_lab_field_patient', 'app')}</span> {order.patientName}</p>
                    <p className="text-slate-600"><span className="font-bold">{t('diag_lab_field_requester', 'app')}</span> {order.requestingPhysician}</p>
                    <p className="text-slate-600"><span className="font-bold">{t('diag_lab_field_insurance', 'app')}</span> {order.insuranceType}</p>
                    <p className="text-slate-600"><span className="font-bold">{t('diag_lab_field_collection', 'app')}</span> {order.collectedAt ? new Date(order.collectedAt).toLocaleString('es') : t('diag_lab_pending', 'app')}</p>
                  </div>
                  {/* Order items */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden">
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="text-left p-1.5 font-bold text-slate-600">{t('diag_lab_header_code', 'app')}</th>
                          <th className="text-left p-1.5 font-bold text-slate-600">{t('diag_lab_header_exam', 'app')}</th>
                          <th className="text-left p-1.5 font-bold text-slate-600">{t('diag_lab_header_sample', 'app')}</th>
                          <th className="text-left p-1.5 font-bold text-slate-600">{t('diag_lab_header_status', 'app')}</th>
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
                  {order.observations && <p className="text-[10px] text-slate-500 italic">{t('diag_lab_obs', 'app')} {order.observations}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Lab Results + Critical Value Alerts */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">{t('diag_lab_results_title', 'app')}</h3>
            </div>

            {/* Results table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_lab_results_col_patient', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_lab_results_col_test', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_lab_results_col_value', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_lab_results_col_reference', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_lab_results_col_flag', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_lab_results_col_equipment', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_lab_results_col_date', 'app')}</th>
                    <th className="text-left p-2 font-bold text-slate-600 uppercase">{t('diag_lab_results_col_action', 'app')}</th>
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
                          {statusLabels.labFlag[r.flag] || t('diag_lab_flag_nd', 'app')}
                        </span>
                      </td>
                      <td className="p-2 text-slate-400 text-[9px]">{r.equipment}</td>
                      <td className="p-2 text-slate-400">{r.performedAt.split('T')[0]}</td>
                      <td className="p-2">
                        <button onClick={() => { setSelectedLabResult(r); setLabResultDetailOpen(true); }} className="text-blue-600 hover:text-blue-800 font-bold text-[9px]">{t('diag_lab_results_history', 'app')}</button>
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
                  <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> {t('diag_lab_history_title', 'app')}: {selectedLabResult.testName}</h5>
                  <button onClick={() => { setLabResultDetailOpen(false); setSelectedLabResult(null); }} className="text-slate-400 hover:text-slate-700"><XCircle className="w-4 h-4" /></button>
                </div>
                {(() => {
                  const history = getLabPatientHistory(selectedLabResult.patientId, selectedLabResult.testCode);
                  if (history.length === 0)                     return <p className="text-[10px] text-slate-400">{t('diag_lab_no_results', 'app')}</p>;
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
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" /> {t('diag_lab_normal', 'app')}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" /> {t('diag_lab_altered', 'app')}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> {t('diag_lab_critical', 'app')}</span>
                        <span className="text-slate-500">{t('diag_lab_reference', 'app')} {selectedLabResult.referenceLow} - {selectedLabResult.referenceHigh} {selectedLabResult.unit}</span>
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

export default function DiagnosticModule(props: DiagnosticModuleProps) {
  const { userPermissions = [], ...rest } = props;

  return (
    <WithPermissions userPermissions={userPermissions}>
      <PermissionGate view="diagnostic" userPermissions={userPermissions}>
        <DiagnosticModuleContent {...rest} userPermissions={userPermissions} />
      </PermissionGate>
    </WithPermissions>
  );
}
