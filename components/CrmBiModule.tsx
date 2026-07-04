'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Patient, Bed, FinancialPosting, initialBeds, Campaign, Lead, CommercialOpportunity, NpsSurvey, OptOutRecord, WebFormLead, initialCampaigns, initialLeads, initialOpportunities, initialNpsSurveys, initialOptOuts, initialWebFormLeads, initialHospitalizations, initialSurgerySchedule, type HospitalizationEpisode, type SurgerySchedule } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import {
  Megaphone, BedDouble, BarChart3, Smartphone, Sparkles, Send,
  MessageSquare, Video, Check, AlertCircle, RefreshCw, Star, X,
  Users, Filter, TrendingUp, DollarSign, Mail, Phone, Globe,
  Share2, UserPlus, Funnel, Target, ThumbsUp, ThumbsDown,
  Minus, Eye, Trash2, Plus, Search, Download, Ban, Link2,
  HelpCircle, Calendar, Clock, ArrowRight, ChevronDown, ChevronUp,
  FileText, Activity, HeartPulse, Syringe, Gauge, Stethoscope,
  Timer, CalendarX, Skull, Wallet, Percent, Smile, Info,
  ChevronRight, Table, LayoutGrid, Bell, Printer, ExternalLink
} from 'lucide-react';

interface CrmBiModuleProps {
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  beds: Bed[];
  setBeds: React.Dispatch<React.SetStateAction<Bed[]>>;
  patients?: Patient[];
  financePostings?: FinancialPosting[];
}

type CrmTab = 'dashboard' | 'segmentacao' | 'campanhas' | 'funil' | 'oportunidades' | 'nps' | 'leads' | 'optout';

export default function CrmBiModule({
  activeSubmodule,
  addAuditLog,
  beds,
  setBeds,
  patients = [],
  financePostings = [],
}: CrmBiModuleProps) {
  const { t } = useI18n();

  // ─── CRM DATA ───
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [opportunities, setOpportunities] = useState<CommercialOpportunity[]>(initialOpportunities);
  const [npsSurveys, setNpsSurveys] = useState<NpsSurvey[]>(initialNpsSurveys);
  const [optOuts, setOptOuts] = useState<OptOutRecord[]>(initialOptOuts);
  const [webFormLeads, setWebFormLeads] = useState<WebFormLead[]>(initialWebFormLeads);

  // ─── Load from Supabase ───
  useEffect(() => {
    if (!supabase) return;

    const loadCrmData = async () => {
      const tables = [
        { key: 'campaigns', table: 'crm_campaigns', setter: setCampaigns, map: (d: any) => ({ id: d.id, nome: d.nome, tipo: d.tipo, template: d.template || '', segmentoAlvo: d.segmento_alvo || '', mensagem: d.mensagem, dataDisparo: d.data_disparo, status: d.status, totalContatos: d.total_contatos || 0, totalEnviados: d.total_enviados || 0, totalFalhas: d.total_falhas || 0, totalOptOut: d.total_optout || 0, consentimentoObrigatorio: d.consentimento_obrigatorio ?? true, createdBy: d.created_by || '' }) },
        { key: 'leads', table: 'crm_leads', setter: setLeads, map: (d: any) => ({ id: d.id, nome: d.nome, email: d.email || undefined, telefone: d.telefone || undefined, origem: d.origem, dataPrimeiroContato: d.data_primeiro_contato, etapaFunil: d.etapa_funil, interesse: d.interesse || undefined, observacoes: d.observacoes || undefined, ultimoContato: d.ultimo_contato || undefined, responsavel: d.responsavel || undefined, convertido: d.convertido ?? false }) },
        { key: 'opportunities', table: 'crm_opportunities', setter: setOpportunities, map: (d: any) => ({ id: d.id, pacienteNome: d.paciente_nome, pacienteTelefone: d.paciente_telefone || undefined, tipo: d.tipo, descricao: d.descricao, valorEstimado: Number(d.valor_estimado), status: d.status, probabilidade: d.probabilidade || 0, dataCriacao: d.data_criacao, dataFechamento: d.data_fechamento || undefined, responsavel: d.responsavel || '', observacoes: d.observacoes || undefined }) },
        { key: 'nps', table: 'crm_nps_surveys', setter: setNpsSurveys, map: (d: any) => ({ id: d.id, pacienteNome: d.paciente_nome, pacienteId: d.paciente_id || undefined, dataAtendimento: d.data_atendimento, dataResposta: d.data_resposta || '', score: d.score || 0, comentario: d.comentario || undefined, categoria: d.categoria || 'neutro', origem: d.origem, respondido: d.respondido ?? false }) },
        { key: 'optouts', table: 'crm_optouts', setter: setOptOuts, map: (d: any) => ({ id: d.id, pacienteNome: d.paciente_nome || '', pacienteContato: d.paciente_contato, canal: d.canal, dataOptOut: d.data_optout, motivo: d.motivo || undefined, ipRegistro: d.ip_registro || undefined, confirmado: d.confirmado ?? false }) },
        { key: 'webform', table: 'crm_webform_leads', setter: setWebFormLeads, map: (d: any) => ({ id: d.id, nome: d.nome, email: d.email, telefone: d.telefone, origem: d.origem, mensagem: d.mensagem || '', dataRecebimento: d.data_recebimento, status: d.status, interesse: d.interesse || undefined, responsavel: d.responsavel || undefined }) },
      ];
      for (const t of tables) {
        const { data, error } = await supabase.from(t.table).select('*').order('created_at', { ascending: false });
        if (data && !error) (t.setter as React.Dispatch<React.SetStateAction<any[]>>)(data.map((d: any) => t.map(d)));
      }
    };
    loadCrmData();
  }, []);

  // ─── UI State ───
  const [crmTab, setCrmTab] = useState<CrmTab>('dashboard');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState<string | null>(null);

  // ─── Campaign Form ───
  const [campForm, setCampForm] = useState({
    nome: '', tipo: 'whatsapp' as Campaign['tipo'], template: '', mensagem: '', segmentoAlvo: '',
  });

  // ─── Lead Form ───
  const [leadForm, setLeadForm] = useState({
    nome: '', email: '', telefone: '', origem: 'site' as Lead['origem'], interesse: '', observacoes: '',
  });

  // ─── Opportunity Form ───
  const [oppForm, setOppForm] = useState({
    pacienteNome: '', pacienteTelefone: '', tipo: 'tratamento_clinico' as CommercialOpportunity['tipo'],
    descricao: '', valorEstimado: 0, probabilidade: 50, responsavel: '',
  });

  // ─── NPS Stats ───
  const npsStats = useMemo(() => {
    const responded = npsSurveys.filter(n => n.respondido);
    const avg = responded.length ? Math.round((responded.reduce((a, n) => a + n.score, 0) / responded.length) * 10) / 10 : 0;
    const promoters = responded.filter(n => n.score >= 9).length;
    const detractors = responded.filter(n => n.score <= 6).length;
    const neutrals = responded.filter(n => n.score >= 7 && n.score <= 8).length;
    const nps = responded.length ? Math.round(((promoters - detractors) / responded.length) * 100) : 0;
    return { avg, promoters, detractors, neutrals, total: responded.length, nps };
  }, [npsSurveys]);

  // ─── Funnel Stats ───
  const funnelStats = useMemo(() => ({
    lead: leads.filter(l => l.etapaFunil === 'lead').length,
    primeiroContato: leads.filter(l => l.etapaFunil === 'primeiro_contato').length,
    primeiraConsulta: leads.filter(l => l.etapaFunil === 'primeira_consulta').length,
    pacienteRecorrente: leads.filter(l => l.etapaFunil === 'paciente_recorrente').length,
  }), [leads]);

  const segmentOptions = [
    { label: 'Idade (0-17)', filter: (p: Patient) => new Date().getFullYear() - new Date(p.birthdate).getFullYear() < 18 },
    { label: 'Idade (18-39)', filter: (p: Patient) => { const age = new Date().getFullYear() - new Date(p.birthdate).getFullYear(); return age >= 18 && age <= 39; } },
    { label: 'Idade (40-59)', filter: (p: Patient) => { const age = new Date().getFullYear() - new Date(p.birthdate).getFullYear(); return age >= 40 && age <= 59; } },
    { label: 'Idade (60+)', filter: (p: Patient) => new Date().getFullYear() - new Date(p.birthdate).getFullYear() >= 60 },
    { label: 'Feminino', filter: (p: Patient) => p.gender === 'Feminino' },
    { label: 'Masculino', filter: (p: Patient) => p.gender === 'Masculino' },
    { label: 'Com Convênio', filter: (p: Patient) => !!p.health_insurance_company },
    { label: 'Particular', filter: (p: Patient) => !p.health_insurance_company },
    { label: 'Emergência', filter: (p: Patient) => p.priority === 'emergência' },
    { label: 'Preferencial', filter: (p: Patient) => p.priority === 'preferencial' },
  ];

  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

  const segmentedPatients = useMemo(() => {
    if (selectedSegments.length === 0) return patients;
    return patients.filter(p => selectedSegments.every(s => {
      const seg = segmentOptions.find(o => o.label === s);
      return seg ? seg.filter(p) : true;
    }));
  }, [patients, selectedSegments]);

  const handleToggleSegment = (label: string) => {
    setSelectedSegments(prev => prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]);
  };

  const handleSaveCampaign = () => {
    if (!campForm.nome || !campForm.mensagem) return;
    const nova: Campaign = {
      id: `camp_${Date.now()}`,
      nome: campForm.nome,
      tipo: campForm.tipo,
      template: campForm.template,
      segmentoAlvo: campForm.segmentoAlvo,
      mensagem: campForm.mensagem,
      dataDisparo: new Date().toISOString().split('T')[0],
      status: 'enviada',
      totalContatos: Math.floor(Math.random() * 100) + 30,
      totalEnviados: 0,
      totalFalhas: 0,
      totalOptOut: 0,
      consentimentoObrigatorio: true,
      createdBy: 'Operador Atual',
    };
    setCampaigns(prev => [nova, ...prev]);
    addAuditLog('Campanha CRM Enviada', `${nova.nome} (${nova.tipo})`);
    if (supabase) {
      supabase.from('crm_campaigns').insert({ id: nova.id, nome: nova.nome, tipo: nova.tipo, template: nova.template, segmento_alvo: nova.segmentoAlvo, mensagem: nova.mensagem, data_disparo: nova.dataDisparo, status: nova.status, total_contatos: nova.totalContatos, total_enviados: nova.totalEnviados, total_falhas: nova.totalFalhas, total_optout: nova.totalOptOut, consentimento_obrigatorio: nova.consentimentoObrigatorio, created_by: nova.createdBy });
    }
    setCampForm({ nome: '', tipo: 'whatsapp', template: '', mensagem: '', segmentoAlvo: '' });
    setShowForm(null);
  };

  const handleSaveLead = () => {
    if (!leadForm.nome) return;
    const novo: Lead = {
      id: `lead_${Date.now()}`,
      nome: leadForm.nome,
      email: leadForm.email || undefined,
      telefone: leadForm.telefone || undefined,
      origem: leadForm.origem,
      dataPrimeiroContato: new Date().toISOString().split('T')[0],
      etapaFunil: 'lead',
      interesse: leadForm.interesse || undefined,
      observacoes: leadForm.observacoes || undefined,
      convertido: false,
    };
    setLeads(prev => [novo, ...prev]);
    addAuditLog('Lead Capturado', `${novo.nome} (${novo.origem})`);
    if (supabase) {
      supabase.from('crm_leads').insert({ id: novo.id, nome: novo.nome, email: novo.email || null, telefone: novo.telefone || null, origem: novo.origem, data_primeiro_contato: novo.dataPrimeiroContato, etapa_funil: novo.etapaFunil, interesse: novo.interesse || null, observacoes: novo.observacoes || null, convertido: novo.convertido });
    }
    setLeadForm({ nome: '', email: '', telefone: '', origem: 'site', interesse: '', observacoes: '' });
    setShowForm(null);
  };

  const handleSaveOpportunity = () => {
    if (!oppForm.pacienteNome || !oppForm.descricao) return;
    const nova: CommercialOpportunity = {
      id: `opp_${Date.now()}`,
      pacienteNome: oppForm.pacienteNome,
      pacienteTelefone: oppForm.pacienteTelefone || undefined,
      tipo: oppForm.tipo,
      descricao: oppForm.descricao,
      valorEstimado: oppForm.valorEstimado,
      status: 'aberta',
      probabilidade: oppForm.probabilidade,
      dataCriacao: new Date().toISOString().split('T')[0],
      responsavel: oppForm.responsavel || 'Operador Atual',
    };
    setOpportunities(prev => [nova, ...prev]);
    addAuditLog('Oportunidade Criada', `${nova.pacienteNome} - ${nova.tipo}`);
    if (supabase) {
      supabase.from('crm_opportunities').insert({ id: nova.id, paciente_nome: nova.pacienteNome, paciente_telefone: nova.pacienteTelefone || null, tipo: nova.tipo, descricao: nova.descricao, valor_estimado: nova.valorEstimado, status: nova.status, probabilidade: nova.probabilidade, data_criacao: nova.dataCriacao, responsavel: nova.responsavel });
    }
    setOppForm({ pacienteNome: '', pacienteTelefone: '', tipo: 'tratamento_clinico', descricao: '', valorEstimado: 0, probabilidade: 50, responsavel: '' });
    setShowForm(null);
  };

  const handleAdvanceFunnel = (id: string) => {
    const stages: Lead['etapaFunil'][] = ['lead', 'primeiro_contato', 'primeira_consulta', 'paciente_recorrente'];
    setLeads(prev => prev.map(l => {
      if (l.id !== id) return l;
      const idx = stages.indexOf(l.etapaFunil);
      const next = idx < stages.length - 1 ? stages[idx + 1] : l.etapaFunil;
      const ultimo = new Date().toISOString().split('T')[0];
      if (supabase) {
        supabase.from('crm_leads').update({ etapa_funil: next, ultimo_contato: ultimo, convertido: next === 'paciente_recorrente' }).eq('id', id);
      }
      return { ...l, etapaFunil: next, ultimoContato: ultimo, convertido: next === 'paciente_recorrente' };
    }));
  };

  const handleChangeOppStatus = (id: string, status: CommercialOpportunity['status']) => {
    setOpportunities(prev => prev.map(o => o.id === id ? {
      ...o, status,
      dataFechamento: status === 'fechada_ganha' || status === 'fechada_perdida' ? new Date().toISOString().split('T')[0] : o.dataFechamento,
      probabilidade: status === 'fechada_ganha' ? 100 : status === 'fechada_perdida' ? 0 : o.probabilidade,
    } : o));
    addAuditLog('Status Oportunidade Alterado', id);
    const dataFechamento = status === 'fechada_ganha' || status === 'fechada_perdida' ? new Date().toISOString().split('T')[0] : null;
    if (supabase) {
      supabase.from('crm_opportunities').update({ status, data_fechamento: dataFechamento, probabilidade: status === 'fechada_ganha' ? 100 : status === 'fechada_perdida' ? 0 : undefined }).eq('id', id);
    }
  };

  const handleRegisterOptOut = () => {
    const novo: OptOutRecord = {
      id: `opt_${Date.now()}`,
      pacienteNome: 'Paciente via formulário',
      pacienteContato: 'contato@exemplo.com',
      canal: 'todos',
      dataOptOut: new Date().toISOString().split('T')[0],
      confirmado: true,
    };
    setOptOuts(prev => [novo, ...prev]);
    addAuditLog('Opt-Out Registrado', novo.pacienteContato);
    if (supabase) {
      supabase.from('crm_optouts').insert({ id: novo.id, paciente_nome: novo.pacienteNome, paciente_contato: novo.pacienteContato, canal: novo.canal, data_optout: novo.dataOptOut, confirmado: novo.confirmado });
    }
  };

  // ─── Hospitalization States (unchanged) ───
  const [selectedBedId, setSelectedBedId] = useState('');
  const [hospPatient, setHospPatient] = useState('');

  // ─── BI / Gemini States (unchanged) ───
  const [biFilterDomain, setBiFilterDomain] = useState('Todos');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ia'; text: string }[]>([
    { sender: 'ia', text: 'Olá! Sou o Dr. IA, analista corporativo do IAMED. Como posso ajudar com a inteligência de negócios ou análise de prontuários hoje?' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ─── Telemedicine States (unchanged) ───
  const [isCallActive, setIsCallActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ─── Campaign dispatch ───
  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveCampaign();
  };

  // ─── Hospitalization handlers (unchanged) ───
  const handleBedAlloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId || !hospPatient.trim()) return;
    const entryDate = new Date().toISOString().split('T')[0];
    setBeds(prev => prev.map(b => {
      if (b.id === selectedBedId) return { ...b, status: 'ocupado', patientName: hospPatient, entryDate };
      return b;
    }));
    addAuditLog('Allocação de Leito', `${hospPatient} no ${selectedBedId}`);
    setHospPatient('');
    if (supabase) {
      await supabase.from('beds').update({ status: 'ocupado', patient_name: hospPatient, entry_date: entryDate }).eq('id', selectedBedId);
    }
  };

  const handleFreeBed = async (id: string, name?: string) => {
    setBeds(prev => prev.map(b => {
      if (b.id === id) {
        addAuditLog('Desocupou Leito', `${name || 'Paciente'}`);
        return { ...b, status: 'disponível', patientName: undefined, entryDate: undefined };
      }
      return b;
    }));
    if (supabase) {
      await supabase.from('beds').update({ status: 'disponível', patient_name: null, entry_date: null }).eq('id', id);
    }
  };

  // ─── Gemini BI handler (unchanged) ───
  const handleSendBiChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);
    const ctx = `Você é o "Dr. IA — Analista BI Corporativo" do IAMED.
      Contexto: Ocupação de Leitos: ${beds.filter(b=>b.status==='ocupado').length}/${beds.length}.
      NPS Médio: ${npsStats.avg}. Leads: ${leads.length}. Oportunidades: ${opportunities.length}.
      Campanhas enviadas: ${campaigns.length}. Pergunta: "${userMessage}"`;
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: ctx, systemInstruction: 'Analista de negócios do IAMED.' })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { sender: 'ia', text: data.text || 'Erro ao processar.' }]);
    } catch {
      setChatMessages(prev => [...prev, { sender: 'ia', text: 'Não foi possível contatar o servidor.' }]);
    } finally { setIsChatLoading(false); }
  };

  // ─── Telemedicine handlers (unchanged) ───
  const handleToggleTeleconsultation = async () => {
    if (isCallActive) {
      if (stream) stream.getTracks().forEach(track => track.stop());
      setStream(null); setIsCallActive(false); addAuditLog('Encerrou Telemedicina', 'Vídeo Consulta');
    } else {
      setIsCallActive(true); addAuditLog('Iniciou Telemedicina', 'Vídeo Consulta');
      try { const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); setStream(s); if (videoRef.current) videoRef.current.srcObject = s; }
      catch (err) { console.warn("Camera access denied:", err); }
    }
  };

  useEffect(() => { if (isCallActive && stream && videoRef.current) videoRef.current.srcObject = stream; }, [isCallActive, stream]);
  useEffect(() => { return () => { if (stream) stream.getTracks().forEach(t => t.stop()); }; }, [stream]);

  // ─── Shared UI classes ───
  const inputCls = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans';
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
  const sectionCls = 'bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4';
  const btnCls = 'px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer';
  const btnSmCls = 'px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-[10px] transition cursor-pointer';

  // ─── BI Data ───
  const [biHospitalizations] = useState<HospitalizationEpisode[]>(initialHospitalizations);
  const [biSurgeries] = useState<SurgerySchedule[]>(initialSurgerySchedule);
  const [biShowChat, setBiShowChat] = useState(false);
  const [biSelectedKpi, setBiSelectedKpi] = useState<string | null>(null);
  const [biFilterPeriod, setBiFilterPeriod] = useState('30d');
  const [biFilterSector, setBiFilterSector] = useState('todos');
  const [biFilterSpecialty, setBiFilterSpecialty] = useState('todos');
  const [biFilterDoctor, setBiFilterDoctor] = useState('todos');
  const [biFilterCoverage, setBiFilterCoverage] = useState('todos');
  const [biDetailTab, setBiDetailTab] = useState('ocupacao');

  // ─── BI Computed Indicators ───
  const biIndicators = useMemo(() => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'ocupado').length;
    const freeBeds = beds.filter(b => b.status !== 'ocupado').length;
    const occupancyRate = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const admissions = biHospitalizations.length;
    const discharges = biHospitalizations.filter(h => h.status !== 'ativa').length;
    const deaths = biHospitalizations.filter(h => h.status === 'obito').length;

    const totalStayDays = biHospitalizations
      .filter(h => h.status !== 'ativa')
      .reduce((sum, h) => {
        const adm = new Date(h.admissionDate);
        const dis = h.dischargeDate ? new Date(h.dischargeDate) : new Date();
        return sum + Math.max(0, Math.floor((dis.getTime() - adm.getTime()) / 86400000));
      }, 0);
    const tmi = discharges ? Math.round(totalStayDays / discharges) : 0;
    const turnoverRate = totalBeds ? Math.round((discharges / totalBeds) * 100) / 100 : 0;
    const substitutionInterval = totalBeds && admissions ? Math.round((freeBeds / totalBeds) * 6.2 * 10) / 10 : 0;

    const totalSurgeries = biSurgeries.length;
    const cancelledSurgeries = biSurgeries.filter(s => s.status === 'cancelada').length;
    const suspendedSurgeries = biSurgeries.filter(s => s.status === 'suspensa').length;
    const performedSurgeries = biSurgeries.filter(s => s.status === 'finalizada' || s.status === 'em_recuperacao' || s.status === 'em_intervencao').length;
    const cancelRate = totalSurgeries ? Math.round((cancelledSurgeries / totalSurgeries) * 100) : 0;

    const surgeriesWithDur = biSurgeries.filter(s => s.estimatedDuration > 0);
    const avgSurgeryDuration = surgeriesWithDur.length
      ? Math.round(surgeriesWithDur.reduce((sum, s) => sum + s.estimatedDuration, 0) / surgeriesWithDur.length)
      : 0;

    const surgeryDays = [...new Set(biSurgeries.map(s => s.scheduledDate))].length;
    const totalSurgeryDuration = biSurgeries
      .filter(s => s.actualStartTime && s.status !== 'programada' && s.status !== 'confirmada')
      .reduce((sum, s) => sum + (s.estimatedDuration || 0), 0);
    const avgInterval = surgeryDays && performedSurgeries > 1
      ? Math.round((totalSurgeryDuration / Math.max(1, performedSurgeries - 1)) / surgeryDays * 10) / 10
      : 0;

    const egressos = discharges;
    const mortalityRate = egressos ? Math.round((deaths / egressos) * 100 * 10) / 10 : 0;

    const infectionRate = 2.3;
    const readmissionRate = 4.7;

    const revenue = financePostings.filter(f => f.type === 'receita').reduce((sum, f) => sum + f.amount, 0);
    const expenses = financePostings.filter(f => f.type === 'despesa').reduce((sum, f) => sum + f.amount, 0);
    const revenuePerPatient = admissions ? Math.round((revenue * 100) / admissions) / 100 : 0;
    const margin = revenue ? Math.round(((revenue - expenses) / revenue) * 100 * 10) / 10 : 0;

    const responded = npsSurveys.filter(n => n.respondido);
    const promoters = responded.filter(n => n.score >= 9).length;
    const detractors = responded.filter(n => n.score <= 6).length;
    const nps = responded.length ? Math.round(((promoters - detractors) / responded.length) * 100) : 0;

    return {
      occupancyRate, occupiedBeds, totalBeds, freeBeds,
      tmi, totalStayDays, turnoverRate, substitutionInterval,
      infectionRate, readmissionRate,
      avgSurgeryDuration, cancelRate,
      mortalityRate, revenuePerPatient, margin, nps,
      admissions, discharges, deaths, egressos,
      totalSurgeries, cancelledSurgeries, suspendedSurgeries, performedSurgeries,
      revenue, expenses, promoters, detractors, respondedCount: responded.length,
    };
  }, [beds, biHospitalizations, biSurgeries, financePostings, npsSurveys]);

  const kpiDefinitions = [
    { key: 'occupancyRate', label: t('bi_kpi_ocupacao', 'app'), value: `${biIndicators.occupancyRate}%`, icon: BedDouble, color: 'bg-blue-50 text-blue-700 border-blue-200', detail: `${biIndicators.occupiedBeds} ocupados / ${biIndicators.totalBeds} total` },
    { key: 'tmi', label: t('bi_kpi_tmi', 'app'), value: `${biIndicators.tmi} dias`, icon: Clock, color: 'bg-cyan-50 text-cyan-700 border-cyan-200', detail: `${biIndicators.totalStayDays || '0'} dias totais / ${biIndicators.discharges} altas` },
    { key: 'turnoverRate', label: t('bi_kpi_giro', 'app'), value: `${biIndicators.turnoverRate}`, icon: RefreshCw, color: 'bg-teal-50 text-teal-700 border-teal-200', detail: `${biIndicators.discharges} altas / ${biIndicators.totalBeds} leitos` },
    { key: 'substitutionInterval', label: t('bi_kpi_intervalo', 'app'), value: `${biIndicators.substitutionInterval}h`, icon: Timer, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', detail: 'Tempo médio de giro entre pacientes' },
    { key: 'infectionRate', label: t('bi_kpi_infeccao', 'app'), value: `${biIndicators.infectionRate}%`, icon: Syringe, color: biIndicators.infectionRate > 5 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200', detail: `Meta: <5%` },
    { key: 'readmissionRate', label: t('bi_kpi_reinternacao', 'app'), value: `${biIndicators.readmissionRate}%`, icon: Activity, color: 'bg-orange-50 text-orange-700 border-orange-200', detail: `Meta: <10%` },
    { key: 'avgSurgeryDuration', label: t('bi_kpi_tempo_cirurgia', 'app'), value: `${biIndicators.avgSurgeryDuration} min`, icon: Timer, color: 'bg-purple-50 text-purple-700 border-purple-200', detail: `${biIndicators.performedSurgeries} realizadas` },
    { key: 'cancelRate', label: t('bi_kpi_cancelamento', 'app'), value: `${biIndicators.cancelRate}%`, icon: CalendarX, color: biIndicators.cancelRate > 10 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200', detail: `${biIndicators.cancelledSurgeries} canceladas / ${biIndicators.totalSurgeries} programadas` },
    { key: 'mortalityRate', label: t('bi_kpi_mortalidade', 'app'), value: `${biIndicators.mortalityRate}%`, icon: Skull, color: biIndicators.mortalityRate > 3 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200', detail: `${biIndicators.deaths} óbitos / ${biIndicators.egressos} egressos` },
    { key: 'revenuePerPatient', label: t('bi_kpi_receita', 'app'), value: `R$ ${biIndicators.revenuePerPatient.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', detail: `R$ ${biIndicators.revenue.toLocaleString()} / ${biIndicators.admissions} internações` },
    { key: 'margin', label: t('bi_kpi_margem', 'app'), value: `${biIndicators.margin}%`, icon: Percent, color: biIndicators.margin > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200', detail: `(R$ ${biIndicators.revenue.toLocaleString()} - R$ ${biIndicators.expenses.toLocaleString()}) / R$ ${biIndicators.revenue.toLocaleString()}` },
    { key: 'nps', label: t('bi_kpi_nps', 'app'), value: `${biIndicators.nps}`, icon: Smile, color: biIndicators.nps >= 50 ? 'bg-green-50 text-green-700 border-green-200' : biIndicators.nps >= 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200', detail: `${biIndicators.promoters} promotores / ${biIndicators.detractors} detratores` },
  ];

  const filteredHosp = useMemo(() => {
    return biHospitalizations.filter(h => {
      if (biFilterDoctor !== 'todos' && h.responsibleDoctor !== biFilterDoctor) return false;
      if (biFilterCoverage !== 'todos' && h.coverageType !== biFilterCoverage) return false;
      if (biFilterPeriod === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        if (new Date(h.admissionDate) < d) return false;
      }
      if (biFilterPeriod === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        if (new Date(h.admissionDate) < d) return false;
      }
      return true;
    });
  }, [biHospitalizations, biFilterDoctor, biFilterCoverage, biFilterPeriod]);

  const filteredSurgeries = useMemo(() => {
    return biSurgeries.filter(s => {
      if (biFilterDoctor !== 'todos' && s.surgeon !== biFilterDoctor) return false;
      if (biFilterPeriod === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        if (new Date(s.scheduledDate) < d) return false;
      }
      if (biFilterPeriod === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        if (new Date(s.scheduledDate) < d) return false;
      }
      return true;
    });
  }, [biSurgeries, biFilterDoctor, biFilterPeriod]);

  const uniqueDoctors = useMemo(() => {
    const set = new Set<string>();
    biHospitalizations.forEach(h => set.add(h.responsibleDoctor));
    biSurgeries.forEach(s => set.add(s.surgeon));
    return Array.from(set);
  }, [biHospitalizations, biSurgeries]);

  const handleExportCSV = useCallback((data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addAuditLog('Exportou BI', filename);
  }, [addAuditLog]);

  const funnelLabels: Record<Lead['etapaFunil'], string> = {
    lead: 'Lead', primeiro_contato: 'Primeiro Contato', primeira_consulta: 'Primeira Consulta', paciente_recorrente: 'Paciente Recorrente',
  };

  const statusColors: Record<string, string> = {
    enviada: 'bg-green-50 text-green-700 border-green-200',
    agendada: 'bg-blue-50 text-blue-700 border-blue-200',
    rascunho: 'bg-slate-100 text-slate-600 border-slate-200',
    cancelada: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* ════════════════════════════════════════════ */}
      {/* 10. CRM & MARKETING DE PACIENTES            */}
      {/* ════════════════════════════════════════════ */}
      {activeSubmodule === 10 && (
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-5 rounded-xl text-white shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg"><Megaphone className="w-6 h-6" /></div>
              <div>
                <h2 className="font-bold text-lg">{t('crm_title', 'app')}</h2>
                <p className="text-indigo-200 text-xs font-medium">{t('crm_subtitle', 'app')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-indigo-100 text-xs">
              <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{leads.length} leads</span>
              <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{opportunities.filter(o => o.status === 'aberta' || o.status === 'em_negociacao').length} oportunidades</span>
              <span className="bg-white/20 px-3 py-1 rounded-full font-bold">NPS {npsStats.nps}</span>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 overflow-x-auto bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            {([
              { key: 'dashboard' as CrmTab, label: t('crm_dashboard', 'app'), icon: TrendingUp },
              { key: 'segmentacao' as CrmTab, label: t('crm_segmentacao', 'app'), icon: Filter },
              { key: 'campanhas' as CrmTab, label: t('crm_campanhas', 'app'), icon: Send },
              { key: 'funil' as CrmTab, label: t('crm_funil', 'app'), icon: Funnel },
              { key: 'oportunidades' as CrmTab, label: t('crm_oportunidades', 'app'), icon: DollarSign },
              { key: 'nps' as CrmTab, label: t('crm_nps', 'app'), icon: ThumbsUp },
              { key: 'leads' as CrmTab, label: t('crm_captura_web', 'app'), icon: Globe },
              { key: 'optout' as CrmTab, label: t('crm_optout', 'app'), icon: Ban },
            ]).map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setCrmTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer
                    ${crmTab === tab.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ═══ DASHBOARD ═══ */}
          {crmTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Leads no Funil', value: leads.length, icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                  { label: 'Oportunidades Abertas', value: opportunities.filter(o => o.status === 'aberta' || o.status === 'em_negociacao').length, icon: Target, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { label: 'NPS Geral', value: `${npsStats.nps}`, icon: ThumbsUp, color: 'bg-green-50 text-green-700 border-green-200' },
                  { label: 'Campanhas Enviadas', value: campaigns.filter(c => c.status === 'enviada').length, icon: Send, color: 'bg-teal-50 text-teal-700 border-teal-200' },
                ].map((s, i) => (
                  <div key={i} className={`${s.color} border rounded-xl p-4 flex items-center gap-3`}>
                    <s.icon className="w-8 h-8 opacity-60" />
                    <div><p className="text-2xl font-black">{s.value}</p><p className="text-xs font-medium opacity-75">{s.label}</p></div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">Funil de Conversão</h4>
                  <div className="space-y-2">
                    {Object.entries(funnelStats).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-600 w-32">{funnelLabels[key as Lead['etapaFunil']]}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-5">
                          <div className="bg-indigo-500 h-5 rounded-full text-[9px] text-white font-bold flex items-center pl-2"
                            style={{ width: `${leads.length ? (val / leads.length) * 100 : 0}%` }}>
                            {val}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">Últimas Campanhas</h4>
                  <div className="space-y-1.5">
                    {campaigns.slice(0, 4).map(camp => (
                      <div key={camp.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          {camp.tipo === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5 text-green-600" /> : camp.tipo === 'sms' ? <Phone className="w-3.5 h-3.5 text-blue-600" /> : <Mail className="w-3.5 h-3.5 text-amber-600" />}
                          <span className="font-bold text-slate-700">{camp.nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{camp.totalEnviados}/{camp.totalContatos}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[camp.status] || ''}`}>{camp.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">NPS — Net Promoter Score</h4>
                  <div className="text-center">
                    <p className="text-4xl font-black text-indigo-600">{npsStats.nps}</p>
                    <p className="text-xs text-slate-500">de -100 a +100</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-green-50 rounded-lg"><p className="font-bold text-green-700">{npsStats.promoters}</p><p className="text-green-600 text-[10px]">Promotores</p></div>
                    <div className="p-2 bg-amber-50 rounded-lg"><p className="font-bold text-amber-700">{npsStats.neutrals}</p><p className="text-amber-600 text-[10px]">Neutros</p></div>
                    <div className="p-2 bg-rose-50 rounded-lg"><p className="font-bold text-rose-700">{npsStats.detractors}</p><p className="text-rose-600 text-[10px]">Detratores</p></div>
                  </div>
                </div>
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">Consentimento (LGPD PY)</h4>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-indigo-800">Lei 1682/2001</p>
                    <p className="text-indigo-700">Todos os contatos possuem consentimento registrado. {optOuts.length} opt-outs registrados.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SEGMENTAÇÃO ═══ */}
          {crmTab === 'segmentacao' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              <div className={sectionCls + ' lg:col-span-1'}>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-indigo-600" /> Segmentos</h4>
                <p className="text-xs text-slate-500">Combine critérios para filtrar pacientes</p>
                <div className="space-y-1.5 mt-2">
                  {segmentOptions.map(seg => (
                    <label key={seg.label} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                      <input type="checkbox" checked={selectedSegments.includes(seg.label)}
                        onChange={() => handleToggleSegment(seg.label)} className="accent-indigo-600" />
                      {seg.label}
                    </label>
                  ))}
                </div>
                {selectedSegments.length > 0 && (
                  <button onClick={() => setSelectedSegments([])} className="text-xs text-rose-600 font-semibold hover:text-rose-800 mt-2">
                    Limpar filtros
                  </button>
                )}
              </div>
              <div className="lg:col-span-3 space-y-4">
                <div className={sectionCls}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm">Pacientes Segmentados ({segmentedPatients.length})</h4>
                    <div className="flex gap-2">
                      {segmentedPatients.length > 0 && (
                        <button className={btnSmCls} onClick={() => {
                          addAuditLog('Exportou Segmento', `${segmentedPatients.length} pacientes`);
                        }}><Download className="w-3 h-3 inline mr-1" /> Exportar</button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {segmentedPatients.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-700">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.gender} | {new Date().getFullYear() - new Date(p.birthdate).getFullYear()} anos | {p.health_insurance_company || 'Particular'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${p.status === 'atendido' ? 'bg-green-50 text-green-600 border-green-200' : p.status === 'agendado' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>{p.status}</span>
                      </div>
                    ))}
                    {segmentedPatients.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">Nenhum paciente encontrado com os filtros atuais.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CAMPANHAS ═══ */}
          {crmTab === 'campanhas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className={sectionCls + ' lg:col-span-1'}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Send className="w-4 h-4 text-indigo-600" /> Disparar Campanha</h4>
                  <button onClick={() => setShowForm(showForm === 'campanha' ? null : 'campanha')} className={btnSmCls}><Plus className="w-3 h-3 inline mr-1" /> Nova</button>
                </div>
                {showForm === 'campanha' && (
                  <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3 mt-3">
                    <div>
                      <label className={labelCls}>Nome da Campanha *</label>
                      <input type="text" value={campForm.nome} onChange={e => setCampForm(p => ({ ...p, nome: e.target.value }))} className={inputCls} placeholder="Ex: Lembrete Consultas Julho" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Canal *</label>
                        <select value={campForm.tipo} onChange={e => setCampForm(p => ({ ...p, tipo: e.target.value as Campaign['tipo'] }))} className={inputCls}>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="sms">SMS</option>
                          <option value="email">E-mail</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Template</label>
                        <select value={campForm.template} onChange={e => setCampForm(p => ({ ...p, template: e.target.value }))} className={inputCls}>
                          <option value="">Personalizado</option>
                          <option value="Lembrete de Consulta">Lembrete de Consulta</option>
                          <option value="Retorno Preventivo">Retorno Preventivo</option>
                          <option value="Aviso de Vacinação">Aviso de Vacinação</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Segmento Alvo</label>
                      <input type="text" value={campForm.segmentoAlvo} onChange={e => setCampForm(p => ({ ...p, segmentoAlvo: e.target.value }))} className={inputCls} placeholder="Ex: Pacientes 60+ com consulta nos próximos 7 dias" />
                    </div>
                    <div>
                      <label className={labelCls}>Mensagem *</label>
                      <textarea value={campForm.mensagem} onChange={e => setCampForm(p => ({ ...p, mensagem: e.target.value }))} rows={4} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans leading-relaxed resize-none" placeholder="Use {{nome}} para personalizar..." />
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800">
                      <AlertCircle className="w-3 h-3 inline mr-1" /> Consentimento obrigatório conforme Lei 1682/2001. Pacientes com opt-out serão excluídos automaticamente.
                    </div>
                    <button onClick={handleSaveCampaign} className={btnCls + ' w-full'}>Disparar Campanha</button>
                  </div>
                )}
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar campanhas..." className={`${inputCls} pl-7`} />
                </div>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto mt-2">
                  {campaigns.filter(c => !search || c.nome.toLowerCase().includes(search.toLowerCase())).map(camp => (
                    <div key={camp.id} className="p-2.5 rounded-lg border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {camp.tipo === 'whatsapp' ? <MessageSquare className="w-3 h-3 text-green-600" /> : camp.tipo === 'sms' ? <Phone className="w-3 h-3 text-blue-600" /> : <Mail className="w-3 h-3 text-amber-600" />}
                          <span className="font-bold text-slate-700">{camp.nome}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[camp.status] || ''}`}>{camp.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{camp.dataDisparo} | {camp.totalEnviados}/{camp.totalContatos} enviados | {camp.totalFalhas} falhas | {camp.totalOptOut} opt-out</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">Métricas de Campanhas</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-2xl font-black text-green-700">{campaigns.reduce((a, c) => a + c.totalEnviados, 0)}</p>
                      <p className="text-xs text-green-600">Total Enviados</p>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                      <p className="text-2xl font-black text-rose-700">{campaigns.reduce((a, c) => a + c.totalFalhas, 0)}</p>
                      <p className="text-xs text-rose-600">Falhas</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-2xl font-black text-slate-700">{campaigns.reduce((a, c) => a + c.totalOptOut, 0)}</p>
                      <p className="text-xs text-slate-600">Opt-Outs</p>
                    </div>
                  </div>
                </div>
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">Consentimento e Conformidade</h4>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-indigo-800">Base legal: Lei 1682/2001 — Proteção de Dados (Paraguai)</p>
                    <p className="text-indigo-700">Todas as campanhas respeitam o consentimento explícito do paciente. O mecanismo de opt-out está disponível em todos os canais.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ FUNIL ═══ */}
          {crmTab === 'funil' && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(funnelStats).map(([key, val]) => (
                  <div key={key} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center">
                    <p className="text-3xl font-black text-indigo-600">{val}</p>
                    <p className="text-xs font-bold text-slate-600 mt-1">{funnelLabels[key as Lead['etapaFunil']]}</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${leads.length ? (val / leads.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className={sectionCls}>
                <h4 className="font-bold text-slate-800 text-sm">Leads no Funil</h4>
                <div className="space-y-1.5">
                  {leads.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{l.nome}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${l.etapaFunil === 'lead' ? 'bg-slate-100 text-slate-600 border-slate-200' : l.etapaFunil === 'primeiro_contato' ? 'bg-blue-50 text-blue-600 border-blue-200' : l.etapaFunil === 'primeira_consulta' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                            {funnelLabels[l.etapaFunil]}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{l.origem} | {l.dataPrimeiroContato}{l.interesse ? ` | ${l.interesse}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.etapaFunil !== 'paciente_recorrente' && (
                          <button onClick={() => handleAdvanceFunnel(l.id)} className={btnSmCls} title="Avançar no funil">
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ OPORTUNIDADES ═══ */}
          {crmTab === 'oportunidades' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className={sectionCls + ' lg:col-span-1'}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-indigo-600" /> Oportunidades</h4>
                  <button onClick={() => setShowForm(showForm === 'oportunidade' ? null : 'oportunidade')} className={btnSmCls}><Plus className="w-3 h-3 inline mr-1" /> Nova</button>
                </div>
                {showForm === 'oportunidade' && (
                  <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3 mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Paciente *</label>
                        <input type="text" value={oppForm.pacienteNome} onChange={e => setOppForm(p => ({ ...p, pacienteNome: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Telefone</label>
                        <input type="text" value={oppForm.pacienteTelefone} onChange={e => setOppForm(p => ({ ...p, pacienteTelefone: e.target.value }))} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Tipo</label>
                      <select value={oppForm.tipo} onChange={e => setOppForm(p => ({ ...p, tipo: e.target.value as CommercialOpportunity['tipo'] }))} className={inputCls}>
                        <option value="tratamento_clinico">Tratamento Clínico</option>
                        <option value="cirurgia_estetica">Cirurgia Estética</option>
                        <option value="cirurgia_geral">Cirurgia Geral</option>
                        <option value="odontologia">Odontologia</option>
                        <option value="exame">Exame</option>
                        <option value="internacao">Internação</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Descrição *</label>
                      <input type="text" value={oppForm.descricao} onChange={e => setOppForm(p => ({ ...p, descricao: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Valor Estimado (Gs.)</label>
                        <input type="number" value={oppForm.valorEstimado || ''} onChange={e => setOppForm(p => ({ ...p, valorEstimado: parseInt(e.target.value) || 0 }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Probabilidade (%)</label>
                        <input type="number" min={0} max={100} value={oppForm.probabilidade} onChange={e => setOppForm(p => ({ ...p, probabilidade: parseInt(e.target.value) || 0 }))} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Responsável</label>
                      <input type="text" value={oppForm.responsavel} onChange={e => setOppForm(p => ({ ...p, responsavel: e.target.value }))} className={inputCls} />
                    </div>
                    <button onClick={handleSaveOpportunity} className={btnCls + ' w-full'}>Criar Oportunidade</button>
                  </div>
                )}
              </div>
              <div className="lg:col-span-2 space-y-3">
                {opportunities.map(opp => (
                  <div key={opp.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800 text-sm">{opp.pacienteNome}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{opp.tipo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-700">Gs. {opp.valorEstimado.toLocaleString()}</span>
                        <select value={opp.status} onChange={e => handleChangeOppStatus(opp.id, e.target.value as CommercialOpportunity['status'])}
                          className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${opp.status === 'fechada_ganha' ? 'bg-green-50 text-green-700 border-green-200' : opp.status === 'fechada_perdida' ? 'bg-rose-50 text-rose-700 border-rose-200' : opp.status === 'em_negociacao' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          <option value="aberta">Aberta</option>
                          <option value="em_negociacao">Em Negociação</option>
                          <option value="fechada_ganha">Ganha</option>
                          <option value="fechada_perdida">Perdida</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-xs text-slate-600">
                      <div><span className="text-slate-500">Descrição:</span> <b>{opp.descricao}</b></div>
                      <div><span className="text-slate-500">Probabilidade:</span> <b>{opp.probabilidade}%</b></div>
                      <div><span className="text-slate-500">Criação:</span> <b>{opp.dataCriacao}</b></div>
                      <div><span className="text-slate-500">Responsável:</span> <b>{opp.responsavel}</b></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ NPS ═══ */}
          {crmTab === 'nps' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center col-span-1">
                  <p className="text-4xl font-black text-indigo-600">{npsStats.nps}</p>
                  <p className="text-xs text-slate-500">Net Promoter Score</p>
                  <div className="mt-2 flex justify-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-green-600" /> {npsStats.promoters}</span>
                    <span className="flex items-center gap-1"><Minus className="w-3 h-3 text-amber-500" /> {npsStats.neutrals}</span>
                    <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-rose-600" /> {npsStats.detractors}</span>
                  </div>
                </div>
                <div className="lg:col-span-3 p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Pesquisas de Satisfação</h4>
                  <div className="grid grid-cols-3 gap-4 text-center text-xs">
                    <div>
                      <label className={labelCls}>Disparar NPS Automático</label>
                      <select className={inputCls} defaultValue="whatsapp">
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                        <option value="email">E-mail</option>
                        <option value="app">App Paciente</option>
                      </select>
                      <button className={btnCls + ' w-full mt-2'} onClick={() => {
                        const novaNps: NpsSurvey = { id: `nps_${Date.now()}`, pacienteNome: 'Pesquisa automática', dataAtendimento: new Date().toISOString().split('T')[0], dataResposta: '', score: 0, categoria: 'neutro', origem: 'whatsapp', respondido: false };
                        setNpsSurveys(prev => [novaNps, ...prev]);
                        if (supabase) {
                          supabase.from('crm_nps_surveys').insert({ id: novaNps.id, paciente_nome: novaNps.pacienteNome, data_atendimento: novaNps.dataAtendimento, score: 0, categoria: 'neutro', origem: novaNps.origem, respondido: false });
                        }
                        addAuditLog('NPS Disparado', 'Pesquisa automática');
                      }}>
                        <Send className="w-3 h-3 inline mr-1" /> Disparar Agora
                      </button>
                    </div>
                    <div className="col-span-2 space-y-2 max-h-[200px] overflow-y-auto">
                      {npsSurveys.filter(n => n.respondido).slice(0, 8).map(n => (
                        <div key={n.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${n.score >= 9 ? 'bg-green-500' : n.score >= 7 ? 'bg-amber-500' : 'bg-rose-500'}`}>{n.score}</span>
                            <div>
                              <p className="font-bold text-slate-700">{n.pacienteNome}</p>
                              <p className="text-[10px] text-slate-500 italic">&quot;{n.comentario}&quot;</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">{n.origem} | {n.dataResposta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className={sectionCls}>
                <h4 className="font-bold text-slate-800 text-sm">Pendentes de Resposta</h4>
                <div className="space-y-1.5">
                  {npsSurveys.filter(n => !n.respondido).map(n => (
                    <div key={n.id} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                      <span className="font-bold text-amber-800">{n.pacienteNome}</span>
                      <span className="text-amber-600">Atendimento: {n.dataAtendimento} | Canal: {n.origem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ CAPTURA WEB / LEADS ═══ */}
          {crmTab === 'leads' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className={sectionCls + ' lg:col-span-1'}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-600" /> Captura de Leads</h4>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-200 space-y-3">
                  <h5 className="font-bold text-indigo-800 text-xs">Formulários Web & Redes Sociais</h5>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600" /> Site Institucional
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600" /> Facebook Ads
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600" /> Instagram
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600" /> Google Ads
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-indigo-600" /> WhatsApp Business
                    </label>
                  </div>
                  <p className="text-[10px] text-indigo-600 font-medium">Leads capturados automaticamente via webhook</p>
                </div>
                <div className="mt-3">
                  <h5 className="font-bold text-slate-700 text-xs mb-2">Lead Manual</h5>
                  <div className="space-y-2 text-xs">
                    <input type="text" value={leadForm.nome} onChange={e => setLeadForm(p => ({ ...p, nome: e.target.value }))} className={inputCls} placeholder="Nome *" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="email" value={leadForm.email} onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="Email" />
                      <input type="text" value={leadForm.telefone} onChange={e => setLeadForm(p => ({ ...p, telefone: e.target.value }))} className={inputCls} placeholder="Telefone" />
                    </div>
                    <select value={leadForm.origem} onChange={e => setLeadForm(p => ({ ...p, origem: e.target.value as Lead['origem'] }))} className={inputCls}>
                      <option value="site">Site</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="google">Google</option>
                      <option value="indicacao">Indicação</option>
                      <option value="presencial">Presencial</option>
                      <option value="outro">Outro</option>
                    </select>
                    <input type="text" value={leadForm.interesse} onChange={e => setLeadForm(p => ({ ...p, interesse: e.target.value }))} className={inputCls} placeholder="Interesse" />
                    <textarea value={leadForm.observacoes} onChange={e => setLeadForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" placeholder="Observações" />
                    <button onClick={handleSaveLead} className={btnCls + ' w-full'}><UserPlus className="w-3 h-3 inline mr-1" /> Capturar Lead</button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">Leads de Formulários Web</h4>
                  <div className="space-y-1.5">
                    {webFormLeads.map(wfl => (
                      <div key={wfl.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-700">{wfl.nome}</p>
                          <p className="text-[10px] text-slate-500">{wfl.email} | {wfl.telefone} | {wfl.origem}</p>
                          <p className="text-[10px] text-slate-400 italic">&quot;{wfl.mensagem.substring(0, 80)}...&quot;</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${wfl.status === 'novo' ? 'bg-blue-50 text-blue-600 border-blue-200' : wfl.status === 'contatado' ? 'bg-amber-50 text-amber-600 border-amber-200' : wfl.status === 'convertido' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {wfl.status}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">{wfl.dataRecebimento}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ OPT-OUT ═══ */}
          {crmTab === 'optout' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className={sectionCls + ' lg:col-span-1'}>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Ban className="w-4 h-4 text-rose-600" /> Mecanismo de Opt-Out</h4>
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-3">
                  <p className="font-bold text-rose-800">Lei 1682/2001 — Descadastro de Comunicações</p>
                  <p className="text-rose-700">Disponibilize um link de descadastro em todas as comunicações. O registro do opt-out deve ser mantido por 5 anos.</p>
                  <div className="bg-white rounded-lg p-3 border border-rose-100">
                    <p className="font-bold text-slate-700 text-xs">Link de Descadastro</p>
                    <p className="text-[10px] text-teal-600 font-mono mt-1">https://iamed.com.py/opt-out?token=abc123</p>
                    <button onClick={handleRegisterOptOut} className={btnCls + ' w-full mt-2 text-[10px]'}>
                      Simular Registro de Opt-Out
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
                  <p className="font-bold text-indigo-800">Formulário de Opt-Out</p>
                  <div className="space-y-2 mt-2">
                    <input type="text" className={inputCls} placeholder="Email ou telefone para descadastro" />
                    <button className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[10px] transition cursor-pointer w-full">
                      <Ban className="w-3 h-3 inline mr-1" /> Descadastrar
                    </button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-3">
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">Registros de Opt-Out ({optOuts.length})</h4>
                  <p className="text-xs text-slate-500">Conforme Lei 1682/2001, todos os descadastros são registrados com data e canal.</p>
                  <div className="space-y-1.5">
                    {optOuts.map(opt => (
                      <div key={opt.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100 text-xs">
                        <div>
                          <p className="font-bold text-rose-800">{opt.pacienteNome}</p>
                          <p className="text-[10px] text-rose-600">{opt.pacienteContato} | Canal: {opt.canal}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-rose-500">{opt.dataOptOut}</p>
                          {opt.motivo && <p className="text-[9px] text-rose-400 italic">&quot;{opt.motivo}&quot;</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 11. Internação e Centro Cirúrgico (unchanged) */}
      {activeSubmodule === 11 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BedDouble className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800 text-base">Check-In e Internação</h3>
            </div>
            <form onSubmit={handleBedAlloc} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Selecionar Leito Vago</label>
                <select value={selectedBedId} onChange={e => setSelectedBedId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans" required>
                  <option value="">Selecione um leito...</option>
                  {beds.filter(b => b.status === 'disponível').map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.wing})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo do Paciente</label>
                <input type="text" value={hospPatient} onChange={e => setHospPatient(e.target.value)}
                  placeholder="Nome do Internado" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" required />
              </div>
              <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs">
                Efetivar Internação
              </button>
            </form>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">Mapa Clínico de Leitos de Internação</h4>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">Ocupação: {beds.filter(b=>b.status==='ocupado').length}/{beds.length} leitos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {beds.map(b => (
                <div key={b.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 text-xs transition duration-150 ${b.status === 'ocupado' ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-sm">{b.name}</span>
                      <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold rounded ${b.wing === 'UTI' ? 'bg-red-100 text-red-800' : b.wing === 'Centro Cirúrgico' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'}`}>{b.wing}</span>
                    </div>
                    {b.status === 'ocupado' ? (
                      <div className="text-rose-900 mt-2 space-y-0.5">
                        <p className="font-extrabold text-base">{b.patientName}</p>
                        <p className="text-[10px] text-rose-600 font-medium">Internado em: {b.entryDate}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic mt-2">Leito Higienizado & Disponível</p>
                    )}
                  </div>
                  {b.status === 'ocupado' && (
                    <button onClick={() => handleFreeBed(b.id, b.patientName)}
                      className="self-end text-[10px] bg-slate-800 hover:bg-slate-900 text-white font-bold px-2 py-1 rounded">
                      Dar Alta Médica / Desocupar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* 12. BI / BUSINESS INTELLIGENCE              */}
      {/* ════════════════════════════════════════════ */}
      {activeSubmodule === 12 && (
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 rounded-xl text-white shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg"><BarChart3 className="w-6 h-6" /></div>
              <div>
                <h2 className="font-bold text-lg">{t('bi_title', 'app')}</h2>
                <p className="text-slate-300 text-xs font-medium">{t('bi_subtitle', 'app')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setBiShowChat(!biShowChat)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold transition cursor-pointer">
                <Sparkles className="w-3.5 h-3.5" /> {t('bi_dr_ia', 'app')}
              </button>
              <button onClick={() => { addAuditLog('Exportou BI Geral', 'Dashboard'); handleExportCSV('Dados simulados do BI IAMED', 'iamed_bi_export.csv'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold transition cursor-pointer">
                <Download className="w-3.5 h-3.5" /> {t('bi_exportar', 'app')}
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={biFilterPeriod} onChange={e => setBiFilterPeriod(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-semibold">
              <option value="7d">{t('bi_filtro_7d', 'app')}</option>
              <option value="30d">{t('bi_filtro_30d', 'app')}</option>
              <option value="90d">{t('bi_filtro_90d', 'app')}</option>
            </select>
            <select value={biFilterSector} onChange={e => setBiFilterSector(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-semibold">
              <option value="todos">{t('bi_todos_setores', 'app')}</option>
              {[...new Set(biHospitalizations.map(h => h.coverageType))].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select value={biFilterDoctor} onChange={e => setBiFilterDoctor(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-semibold">
              <option value="todos">{t('bi_todos_medicos', 'app')}</option>
              {uniqueDoctors.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={biFilterCoverage} onChange={e => setBiFilterCoverage(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-semibold">
              <option value="todos">{t('bi_todos_convenios', 'app')}</option>
              <option value="particular">Particular</option>
              <option value="convênio">Convênio</option>
              <option value="ips">IPS</option>
            </select>
          </div>

          <div className="flex gap-5">
            {/* KPIs Grid */}
            <div className="flex-1 space-y-5">
              {/* 12 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {kpiDefinitions.map(kpi => {
                  const Icon = kpi.icon;
                  const isSelected = biSelectedKpi === kpi.key;
                  const isAlert = ['infectionRate', 'cancelRate', 'mortalityRate'].includes(kpi.key) &&
                    parseFloat(kpi.value) > (kpi.key === 'infectionRate' ? 5 : kpi.key === 'cancelRate' ? 10 : 3);
                  return (
                    <button key={kpi.key} onClick={() => setBiSelectedKpi(biSelectedKpi === kpi.key ? null : kpi.key)}
                      className={`${kpi.color} ${isSelected ? 'ring-2 ring-slate-800' : ''} border rounded-xl p-3 text-left transition hover:shadow-md cursor-pointer relative`}>
                      {isAlert && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold animate-pulse">!</span>}
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 opacity-60 shrink-0" />
                        <span className="text-[9px] font-semibold opacity-70 leading-tight">{kpi.label}</span>
                      </div>
                      <p className="text-lg font-black">{kpi.value}</p>
                      <p className="text-[8px] opacity-60 mt-0.5 truncate">{kpi.detail}</p>
                    </button>
                  );
                })}
              </div>

              {/* Drill-down detail */}
              {biSelectedKpi && (
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Info className="w-4 h-4 text-slate-600" />
                      Detalhes: {kpiDefinitions.find(k => k.key === biSelectedKpi)?.label}
                    </h4>
                    <button onClick={() => setBiSelectedKpi(null)} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Fechar</button>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    {biSelectedKpi === 'occupancyRate' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-slate-50 text-slate-600 font-bold"><th className="p-2 text-left">Setor</th><th className="p-2 text-right">Total</th><th className="p-2 text-right">Ocupados</th><th className="p-2 text-right">Livres</th><th className="p-2 text-right">Taxa</th></tr></thead>
                          <tbody>
                            {['Alas Gerais', 'UTI', 'Centro Cirúrgico'].map(s => {
                              const sb = beds.filter(b => b.wing === s);
                              const so = sb.filter(b => b.status === 'ocupado').length;
                              return (
                                <tr key={s} className="border-t border-slate-100">
                                  <td className="p-2 font-semibold text-slate-800">{s}</td>
                                  <td className="p-2 text-right">{sb.length}</td>
                                  <td className="p-2 text-right text-red-600 font-semibold">{so}</td>
                                  <td className="p-2 text-right text-green-600 font-semibold">{sb.length - so}</td>
                                  <td className="p-2 text-right font-bold">{sb.length ? Math.round((so / sb.length) * 100) : 0}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {biSelectedKpi === 'tmi' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-slate-50 text-slate-600 font-bold"><th className="p-2 text-left">Paciente</th><th className="p-2 text-left">Diagnóstico</th><th className="p-2 text-right">Admissão</th><th className="p-2 text-right">Dias</th></tr></thead>
                          <tbody>
                            {filteredHosp.filter(h => h.status !== 'ativa').slice(0, 10).map(h => (
                              <tr key={h.id} className="border-t border-slate-100">
                                <td className="p-2 font-semibold text-slate-800">{h.patientName}</td>
                                <td className="p-2 text-slate-500">{h.initialDiagnosis}</td>
                                <td className="p-2 text-right">{h.admissionDate}</td>
                                <td className="p-2 text-right font-bold">
                                  {h.dischargeDate ? Math.floor((new Date(h.dischargeDate).getTime() - new Date(h.admissionDate).getTime()) / 86400000) : '-'}d
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {biSelectedKpi === 'cancelRate' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-slate-50 text-slate-600 font-bold"><th className="p-2 text-left">Paciente</th><th className="p-2 text-left">Procedimento</th><th className="p-2 text-left">Cirurgião</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Data</th></tr></thead>
                          <tbody>
                            {biSurgeries.filter(s => s.status === 'cancelada' || s.status === 'suspensa').map(s => (
                              <tr key={s.id} className="border-t border-slate-100">
                                <td className="p-2 font-semibold text-slate-800">{s.patientName}</td>
                                <td className="p-2 text-slate-500">{s.procedureType}</td>
                                <td className="p-2 text-slate-500">{s.surgeon}</td>
                                <td className="p-2"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.status === 'cancelada' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{s.status}</span></td>
                                <td className="p-2 text-slate-500">{s.scheduledDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {biSelectedKpi === 'margin' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-slate-50 text-slate-600 font-bold"><th className="p-2 text-left">Tipo</th><th className="p-2 text-right">Valor</th><th className="p-2 text-left">%</th></tr></thead>
                          <tbody>
                            <tr className="border-t border-slate-100"><td className="p-2 font-semibold text-green-700">Receita Total</td><td className="p-2 text-right font-bold text-green-700">R$ {biIndicators.revenue.toLocaleString()}</td><td className="p-2 text-left">100%</td></tr>
                            <tr className="border-t border-slate-100"><td className="p-2 font-semibold text-red-700">Despesa Total</td><td className="p-2 text-right font-bold text-red-700">R$ {biIndicators.expenses.toLocaleString()}</td><td className="p-2 text-left">{biIndicators.revenue ? Math.round((biIndicators.expenses / biIndicators.revenue) * 100) : 0}%</td></tr>
                            <tr className="border-t border-slate-100 bg-slate-50"><td className="p-2 font-semibold text-slate-800">Margem</td><td className={`p-2 text-right font-bold ${biIndicators.margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>R$ {(biIndicators.revenue - biIndicators.expenses).toLocaleString()}</td><td className={`p-2 text-left font-bold ${biIndicators.margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{biIndicators.margin}%</td></tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    {biSelectedKpi === 'nps' && (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200"><p className="text-2xl font-black text-green-700">{biIndicators.promoters}</p><p className="text-xs text-green-600">Promotores (9-10)</p></div>
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200"><p className="text-2xl font-black text-amber-700">{biIndicators.respondedCount - biIndicators.promoters - biIndicators.detractors}</p><p className="text-xs text-amber-600">Neutros (7-8)</p></div>
                        <div className="p-4 bg-red-50 rounded-xl border border-red-200"><p className="text-2xl font-black text-red-700">{biIndicators.detractors}</p><p className="text-xs text-red-600">Detratores (0-6)</p></div>
                      </div>
                    )}
                    {!['occupancyRate', 'tmi', 'cancelRate', 'margin', 'nps'].includes(biSelectedKpi) && (
                      <p className="text-slate-400 italic py-4 text-center">Dados detalhados disponíveis na seção de análises abaixo.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Analysis Tabs */}
              <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
                <div className="flex border-b border-slate-200">
                  {[
                    { key: 'ocupacao', label: t('bi_tab_ocupacao', 'app'), icon: BedDouble },
                    { key: 'cirurgias', label: t('bi_tab_cirurgias', 'app'), icon: Activity },
                    { key: 'financeiro', label: t('bi_tab_financeiro', 'app'), icon: DollarSign },
                    { key: 'nps', label: t('bi_tab_nps', 'app'), icon: ThumbsUp },
                    { key: 'alertas', label: t('bi_tab_alertas', 'app'), icon: Bell },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button key={tab.key} onClick={() => setBiDetailTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer border-b-2 ${biDetailTab === tab.key ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <Icon className="w-3.5 h-3.5" /> {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4">
                  {/* Ocupação e Leitos */}
                  {biDetailTab === 'ocupacao' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: t('bi_sum_leitos', 'app'), value: biIndicators.totalBeds, color: 'text-slate-800' },
                          { label: t('bi_sum_ocupados', 'app'), value: biIndicators.occupiedBeds, color: 'text-red-600' },
                          { label: t('bi_sum_taxa_ocup', 'app'), value: `${biIndicators.occupancyRate}%`, color: biIndicators.occupancyRate > 80 ? 'text-red-600' : 'text-green-600' },
                          { label: 'TMI', value: `${biIndicators.tmi}d`, color: 'text-blue-600' },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">{s.label}</p>
                            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold">
                              <th className="p-2 text-left">Paciente</th>
                              <th className="p-2 text-left">Diagnóstico</th>
                              <th className="p-2 text-left">Médico</th>
                              <th className="p-2 text-left">Leito</th>
                              <th className="p-2 text-right">Admissão</th>
                              <th className="p-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredHosp.map(h => (
                              <tr key={h.id} className="border-t border-slate-100">
                                <td className="p-2 font-semibold text-slate-800">{h.patientName}</td>
                                <td className="p-2 text-slate-500">{h.initialDiagnosis}</td>
                                <td className="p-2 text-slate-500">{h.responsibleDoctor}</td>
                                <td className="p-2 text-slate-500">{h.bedName}</td>
                                <td className="p-2 text-right">{h.admissionDate}</td>
                                <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${h.status === 'ativa' ? 'bg-blue-50 text-blue-700' : h.status === 'obito' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{h.status.replace(/_/g, ' ')}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Cirurgias */}
                  {biDetailTab === 'cirurgias' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: t('bi_sum_programadas', 'app'), value: biIndicators.totalSurgeries, color: 'text-slate-800' },
                          { label: t('bi_sum_realizadas', 'app'), value: biIndicators.performedSurgeries, color: 'text-green-600' },
                          { label: t('bi_sum_canceladas', 'app'), value: biIndicators.cancelledSurgeries, color: 'text-red-600' },
                          { label: t('bi_sum_taxa_cancel', 'app'), value: `${biIndicators.cancelRate}%`, color: biIndicators.cancelRate > 10 ? 'text-red-600' : 'text-amber-600' },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">{s.label}</p>
                            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold">
                              <th className="p-2 text-left">Paciente</th>
                              <th className="p-2 text-left">Procedimento</th>
                              <th className="p-2 text-left">Cirurgião</th>
                              <th className="p-2 text-left">Sala</th>
                              <th className="p-2 text-right">Duração</th>
                              <th className="p-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSurgeries.map(s => (
                              <tr key={s.id} className="border-t border-slate-100">
                                <td className="p-2 font-semibold text-slate-800">{s.patientName}</td>
                                <td className="p-2 text-slate-500">{s.procedureType}</td>
                                <td className="p-2 text-slate-500">{s.surgeon}</td>
                                <td className="p-2 text-slate-500">{s.room}</td>
                                <td className="p-2 text-right">{s.estimatedDuration} min</td>
                                <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.status === 'finalizada' ? 'bg-green-50 text-green-700' : s.status === 'cancelada' ? 'bg-red-50 text-red-700' : s.status === 'suspensa' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{s.status.replace(/_/g, ' ')}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Financeiro */}
                  {biDetailTab === 'financeiro' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { label: t('bi_sum_receita', 'app'), value: `R$ ${biIndicators.revenue.toLocaleString()}`, color: 'text-green-700' },
                          { label: t('bi_sum_despesa', 'app'), value: `R$ ${biIndicators.expenses.toLocaleString()}`, color: 'text-red-700' },
                          { label: t('bi_sum_margem', 'app'), value: `${biIndicators.margin}%`, color: biIndicators.margin > 0 ? 'text-green-700' : 'text-red-700' },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">{s.label}</p>
                            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold">
                              <th className="p-2 text-left">Descrição</th>
                              <th className="p-2 text-left">Categoria</th>
                              <th className="p-2 text-right">Valor</th>
                              <th className="p-2 text-left">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financePostings.map(f => (
                              <tr key={f.id} className="border-t border-slate-100">
                                <td className="p-2 font-semibold text-slate-800">{f.description}</td>
                                <td className="p-2 text-slate-500">{f.category}</td>
                                <td className={`p-2 text-right font-bold ${f.type === 'receita' ? 'text-green-700' : 'text-red-700'}`}>
                                  {f.type === 'receita' ? '+' : '-'} R$ {f.amount}
                                </td>
                                <td className="p-2 text-slate-500">{f.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* NPS */}
                  {biDetailTab === 'nps' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: t('bi_sum_nps', 'app'), value: biIndicators.nps, color: biIndicators.nps >= 50 ? 'text-green-700' : biIndicators.nps >= 0 ? 'text-amber-700' : 'text-red-700' },
                          { label: t('bi_sum_promotores', 'app'), value: biIndicators.promoters, color: 'text-green-700' },
                          { label: t('bi_sum_detratores', 'app'), value: biIndicators.detractors, color: 'text-red-700' },
                          { label: t('bi_sum_total_respostas', 'app'), value: biIndicators.respondedCount, color: 'text-slate-800' },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">{s.label}</p>
                            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        {npsSurveys.filter(n => n.respondido).slice(0, 8).map(n => (
                          <div key={n.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${n.score >= 9 ? 'bg-green-500' : n.score >= 7 ? 'bg-amber-500' : 'bg-red-500'}`}>{n.score}</span>
                              <span className="font-bold text-slate-700">{n.pacienteNome}</span>
                              {n.comentario && <span className="text-slate-400 italic text-[10px]">&quot;{n.comentario}&quot;</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {biDetailTab === 'alertas' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500">{t('bi_alert_subtitle', 'app')}</p>
                      {[
                        { icon: BedDouble, label: t('bi_kpi_ocupacao', 'app'), value: `${biIndicators.occupancyRate}%`, limit: '> 80%', alert: biIndicators.occupancyRate > 80, severity: biIndicators.occupancyRate > 90 ? 'Crítico' : 'Atenção' },
                        { icon: Activity, label: t('bi_kpi_reinternacao', 'app'), value: `${biIndicators.readmissionRate}%`, limit: '< 10%', alert: biIndicators.readmissionRate > 10, severity: 'Normal' },
                        { icon: CalendarX, label: t('bi_kpi_cancelamento', 'app'), value: `${biIndicators.cancelRate}%`, limit: '< 10%', alert: biIndicators.cancelRate > 10, severity: biIndicators.cancelRate > 20 ? 'Crítico' : 'Atenção' },
                        { icon: Syringe, label: t('bi_kpi_infeccao', 'app'), value: `${biIndicators.infectionRate}%`, limit: '< 5%', alert: biIndicators.infectionRate > 5, severity: 'Normal' },
                        { icon: Skull, label: t('bi_kpi_mortalidade', 'app'), value: `${biIndicators.mortalityRate}%`, limit: '< 3%', alert: biIndicators.mortalityRate > 3, severity: biIndicators.mortalityRate > 5 ? 'Crítico' : 'Atenção' },
                        { icon: Smile, label: t('bi_kpi_nps', 'app'), value: `${biIndicators.nps}`, limit: '> 50', alert: biIndicators.nps < 50, severity: biIndicators.nps < 0 ? 'Crítico' : 'Atenção' },
                      ].map(a => {
                        const Icon = a.icon;
                        return (
                          <div key={a.label} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${a.alert ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${a.alert ? 'text-red-600' : 'text-green-600'}`} />
                              <div>
                                <p className={`font-bold ${a.alert ? 'text-red-800' : 'text-green-800'}`}>{a.label}</p>
                                <p className={`text-[10px] ${a.alert ? 'text-red-600' : 'text-green-600'}`}>Atual: {a.value} | Limite: {a.limit}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${a.alert ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {a.alert ? (a.severity === 'Crítico' ? t('bi_severity_critico', 'app') : a.severity === 'Atenção' ? t('bi_severity_atencao', 'app') : t('bi_severity_normal', 'app')) : t('bi_severity_ok', 'app')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Chat Sidebar */}
            {biShowChat && (
              <div className="w-80 shrink-0">
                <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col h-[600px]">
                  <div className="flex items-center justify-between p-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <h4 className="font-bold text-slate-800 text-xs">{t('bi_analista', 'app')}</h4>
                    </div>
                    <button onClick={() => setBiShowChat(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`p-2.5 rounded-xl max-w-[90%] leading-relaxed ${msg.sender === 'ia' ? 'bg-slate-100 text-slate-800 self-start' : 'bg-teal-600 text-white ml-auto'}`}>
                        {msg.text}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="p-2.5 bg-slate-100 text-slate-500 text-xs rounded-xl self-start flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('bi_analisando', 'app')}
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSendBiChatMessage} className="flex gap-2 p-3 border-t border-slate-100">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                      placeholder={t('bi_placeholder', 'app')}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                    <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-3 rounded-lg font-bold cursor-pointer">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 13. Portal / Telemedicina (unchanged) */}
      {activeSubmodule === 13 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-4 pt-10 pb-10 rounded-[35px] border-4 border-slate-700 shadow-xl max-w-sm mx-auto lg:col-span-1 border-t-8 border-b-8 relative">
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-6 absolute left-1/2 -ml-10 top-3" />
            <div className="bg-white rounded-2xl p-4 min-h-[360px] text-xs font-sans text-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-teal-700 text-sm">IAMED Paciente APP</span>
                <span className="text-[9px] bg-slate-100 py-0.5 px-2 rounded-full text-slate-500 font-bold">CARLOS A.</span>
              </div>
              <div className="space-y-1 bg-slate-50 p-2 border border-slate-100 rounded-lg">
                <p className="font-bold text-slate-700">📋 Próxima Consulta:</p>
                <p className="text-slate-500">Cardiologia com Dra. Amanda</p>
                <p className="text-teal-700 font-black">22 de Junho às 10:30</p>
              </div>
              <div className="p-2 border border-slate-150 rounded-lg space-y-1">
                <p className="font-bold">💊 Receita Digital Homologada:</p>
                <p className="text-[10px] text-slate-500 italic">Losartana Potássica 50mg — Tomar 1x ao dia pela manhã.</p>
              </div>
              <button onClick={handleToggleTeleconsultation}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 animate-pulse cursor-pointer shadow-sm">
                <Video className="w-3.5 h-3.5" />
                {isCallActive ? 'Encerrar Consulta Virtual' : 'Entrar na Teleconsulta'}
              </button>
            </div>
          </div>
          {isCallActive ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 lg:col-span-2 flex flex-col h-[380px] overflow-hidden relative group">
              <div className="absolute top-4 left-4 bg-black/60 p-2 py-1 rounded text-teal-400 text-xs font-black z-10 animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" /> TELEMEDICINA IAMED - SALA VIRTUAL ATIVA
              </div>
              <div className="flex-1 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center relative border border-slate-800">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                {!stream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 text-center p-6 space-y-3">
                    <Video className="w-12 h-12 text-slate-600 animate-pulse" />
                    <div>
                      <p className="font-bold text-slate-300">Sala Virtual Pronta com Sucesso</p>
                      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                        Exibindo animação de chamada segura. O co-piloto e a gravação de anamnese simultânea estão operacionais.
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 w-24 h-32 bg-slate-900 border-2 border-white rounded-lg overflow-hidden shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200" alt="Médica" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1 rounded text-[8px] text-white">Dra. Amanda</div>
                </div>
              </div>
              <div className="flex justify-center gap-3 pt-3 shrink-0">
                <button onClick={handleToggleTeleconsultation} className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition" title="Desconectar Chamada">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 lg:col-span-2 flex flex-col justify-center items-center text-center space-y-3 text-sm h-[380px]">
              <Video className="w-12 h-12 text-slate-300" />
              <div>
                <h4 className="font-bold text-slate-700">Nenhuma Vídeo Chamada de Telemedicina Ativa</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Para testar, ative a Vídeo Consulta clicando em &quot;Entrar na Teleconsulta&quot; direto no aplicativo simulador do paciente ao lado!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
