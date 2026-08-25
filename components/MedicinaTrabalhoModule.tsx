'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Empresa, ContratoEmpresa, PlanoExame, PostoTrabalho,
  RiscoOcupacional, MatrizExame, Trabalhador, ExameOcupacional,
  CalCertificado, RelatorioMtess,
  initialEmpresas, initialContratos, initialPostos,
  initialRiscos, initialMatrizExames, initialTrabalhadores,
  initialExamesOcupacionais, initialCals, initialRelatoriosMtess,
  AsoExam,
} from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { useFormValidation } from '@/lib/validation';
import {
  empresaSchema, trabalhadorSchema, exameOcupacionalSchema,
} from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';
import { canAccessTab } from '@/lib/rbac/catalog';
import { hasPermission } from '@/lib/usePermissions';
import I18nDatePicker from '@/components/I18nDatePicker';
import {
  Building2, Users, Stethoscope, FileCheck, AlertTriangle,
  FileBarChart, Plus, Search, Trash2, Eye, ShieldAlert,
  HeartPulse, ClipboardList, Check, X, Calendar, Clock,
  User, Briefcase, DollarSign, Hash, Printer, Download,
  ChevronDown, ChevronRight, Edit, Ban
} from 'lucide-react';

type TabName = 'dashboard' | 'empresas' | 'trabalhadores' | 'exames' | 'cal' | 'riscos' | 'relatorios';

interface MedicinaTrabalhoModuleProps {
  activeSubmodule: number;
  addAuditLog: (action: string, target: string) => void;
  asos: AsoExam[];
  setAsos: React.Dispatch<React.SetStateAction<AsoExam[]>>;
  userPermissions?: string[];
}

export default function MedicinaTrabalhoModule({
  activeSubmodule,
  addAuditLog,
  asos,
  setAsos,
  userPermissions,
}: MedicinaTrabalhoModuleProps) {
  const { t } = useI18n();
  const canAso = hasPermission(userPermissions, 'perform_aso');

  // ─── SEQUENTIAL ID GENERATION (Postgres RPC) ───
  const genModuleId = useModuleId();

  const empresaValidation = useFormValidation(empresaSchema);
  const trablValidation = useFormValidation(trabalhadorSchema);
  const exameValidation = useFormValidation(exameOcupacionalSchema);

  // ─── Data State ───
  const [empresas, setEmpresas] = useState<Empresa[]>(initialEmpresas);
  const [contratos, setContratos] = useState<ContratoEmpresa[]>(initialContratos);
  const [postos, setPostos] = useState<PostoTrabalho[]>(initialPostos);
  const [riscos] = useState<RiscoOcupacional[]>(initialRiscos);
  const [matrizExames, setMatrizExames] = useState<MatrizExame[]>(initialMatrizExames);
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>(initialTrabalhadores);
  const [examesOcupacionais, setExamesOcupacionais] = useState<ExameOcupacional[]>(initialExamesOcupacionais);
  const [cals, setCals] = useState<CalCertificado[]>(initialCals);
  const [relatorios, setRelatorios] = useState<RelatorioMtess[]>(initialRelatoriosMtess);

  // ─── UI State ───
  const [tab, setTab] = useState<TabName>('dashboard');

  // Guarda RBAC: aba ativa não pode ficar órfã quando permissões mudam
  useEffect(() => {
    if (canAccessTab(userPermissions, 'med_work', tab)) return;
    const order: TabName[] = ['dashboard', 'empresas', 'trabalhadores', 'exames', 'cal', 'riscos', 'relatorios'];
    const next = order.find(id => canAccessTab(userPermissions, 'med_work', id));
    if (next) setTab(next);
  }, [userPermissions, tab]);

  const [search, setSearch] = useState('');
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [showForm, setShowForm] = useState<string | null>(null);

  // ─── Empresa Form ───
  const [empresaForm, setEmpresaForm] = useState<Partial<Empresa>>({
    nome: '', ruc: '', endereco: '', cidade: 'Asunción', departamento: 'Capital',
    atividadeEconomica: '', setor: 'Serviços', porte: 'Pequena', nroFuncionarios: 0, status: 'ativa',
  });

  // ─── Trabalhador Form ───
  const [trabForm, setTrabForm] = useState<Partial<Trabalhador>>({
    nome: '', ci: '', dataNascimento: '', genero: 'Masculino',
    funcao: '', empresaId: '', status: 'ativo', nacionalidade: 'Paraguaya',
  });

  // ─── Exame Form ───
  const [exameForm, setExameForm] = useState({
    trabalhadorId: '', empresaId: '', tipo: 'Periódico' as ExameOcupacional['tipo'],
    medicoResponsavel: 'Dr. Bruno Castro', examesSelecionados: [] as string[],
  });

  // ─── Filters ───
  const filteredEmpresas = useMemo(() => {
    if (!search) return empresas;
    const q = search.toLowerCase();
    return empresas.filter(e => e.nome.toLowerCase().includes(q) || e.ruc.toLowerCase().includes(q) || e.ruc.includes(q));
  }, [empresas, search]);

  const filteredTrabalhadores = useMemo(() => {
    let list = trabalhadores;
    if (selectedEmpresaId) list = list.filter(t => t.empresaId === selectedEmpresaId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.nome.toLowerCase().includes(q) || t.ci.includes(q) || t.funcao.toLowerCase().includes(q));
    }
    return list;
  }, [trabalhadores, selectedEmpresaId, search]);

  const filteredExames = useMemo(() => {
    let list = examesOcupacionais;
    if (selectedEmpresaId) list = list.filter(e => e.empresaId === selectedEmpresaId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const trab = trabalhadores.find(t => t.id === e.trabalhadorId);
        return trab?.nome.toLowerCase().includes(q) || e.tipo.toLowerCase().includes(q);
      });
    }
    return list;
  }, [examesOcupacionais, selectedEmpresaId, search, trabalhadores]);

  const filteredCals = useMemo(() => {
    let list = cals;
    if (selectedEmpresaId) list = list.filter(c => c.empresaId === selectedEmpresaId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.numeroCal.toLowerCase().includes(q) || c.medicoEmissor.toLowerCase().includes(q));
    }
    return list;
  }, [cals, selectedEmpresaId, search]);

  // ─── Helpers ───
  const getEmpresaNome = (id: string) => empresas.find(e => e.id === id)?.nome || id;
  const getTrabalhadorNome = (id: string) => trabalhadores.find(t => t.id === id)?.nome || id;
  const getContratosEmpresa = (empId: string) => contratos.filter(c => c.empresaId === empId);
  const getPostosEmpresa = (empId: string) => postos.filter(p => p.empresaId === empId);
  const getExamesEmpresa = (empId: string) => examesOcupacionais.filter(e => e.empresaId === empId);
  const getTrabalhadoresEmpresa = (empId: string) => trabalhadores.filter(t => t.empresaId === empId);

  const gerarNumeroCal = () => {
    const count = cals.length + 1;
    return `CAL-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  };

  const examesDisponiveis = ['Audiometria Tonal', 'Audiometria Vocal', 'Eletrocardiograma', 'Hemograma', 'Raio-X de Tórax', 'Espirometria', 'Exame Clínico Ergonômico', 'Exame Toxicológico', 'Exame Clínico Ortopédico', 'Eletroencefalograma', 'Exame Psicológico', 'Exame Oftalmológico', 'Exames Sorológicos'];

  const handleToggleExameSelecionado = (exame: string) => {
    setExameForm(prev => ({
      ...prev,
      examesSelecionados: prev.examesSelecionados.includes(exame)
        ? prev.examesSelecionados.filter(e => e !== exame)
        : [...prev.examesSelecionados, exame],
    }));
  };

  const handleSaveEmpresa = async () => {
    const res = empresaValidation.validate({
      nome: empresaForm.nome || '',
      ruc: empresaForm.ruc || '',
      nomeFantasia: empresaForm.nomeFantasia,
      endereco: empresaForm.endereco,
      cidade: empresaForm.cidade,
      departamento: empresaForm.departamento,
      telefone: empresaForm.telefone,
      email: empresaForm.email,
      atividadeEconomica: empresaForm.atividadeEconomica,
      setor: empresaForm.setor || 'Serviços',
      porte: empresaForm.porte || 'Pequena',
      nroFuncionarios: empresaForm.nroFuncionarios || 0,
    });
    if (!res.success) return;
    if (!empresaForm.nome || !empresaForm.ruc) return;
    const nova: Empresa = {
      id: await genModuleId('emp'),
      nome: empresaForm.nome || '',
      ruc: empresaForm.ruc || '',
      nomeFantasia: empresaForm.nomeFantasia,
      endereco: empresaForm.endereco || '',
      cidade: empresaForm.cidade || 'Asunción',
      departamento: empresaForm.departamento || 'Capital',
      telefone: empresaForm.telefone,
      email: empresaForm.email,
      atividadeEconomica: empresaForm.atividadeEconomica || '',
      setor: (empresaForm.setor as Empresa['setor']) || 'Serviços',
      porte: (empresaForm.porte as Empresa['porte']) || 'Pequena',
      nroFuncionarios: empresaForm.nroFuncionarios || 0,
      representanteNome: empresaForm.representanteNome,
      representanteCi: empresaForm.representanteCi,
      status: (empresaForm.status as Empresa['status']) || 'ativa',
      observacoes: empresaForm.observacoes,
    };
    setEmpresas(prev => [nova, ...prev]);
    addAuditLog('Cadastrou Empresa', `${nova.nome} (RUC: ${nova.ruc})`);
    setEmpresaForm({ nome: '', ruc: '', endereco: '', cidade: 'Asunción', departamento: 'Capital', atividadeEconomica: '', setor: 'Serviços', porte: 'Pequena', nroFuncionarios: 0, status: 'ativa' });
    setShowForm(null);
  };

  const handleSaveTrabalhador = async () => {
    const res = trablValidation.validate({
      nome: trabForm.nome || '',
      ci: trabForm.ci || '',
      dataNascimento: trabForm.dataNascimento || '',
      genero: trabForm.genero || 'Masculino',
      nacionalidade: trabForm.nacionalidade || 'Paraguaya',
      funcao: trabForm.funcao,
      empresaId: trabForm.empresaId || '',
      telefone: trabForm.telefone,
      email: trabForm.email,
      dataAdmissao: trabForm.dataAdmissao,
    });
    if (!res.success) return;
    if (!trabForm.nome || !trabForm.ci || !trabForm.empresaId) return;
    const novoTrab: Trabalhador = {
      id: await genModuleId('trab'),
      nome: trabForm.nome || '',
      ci: trabForm.ci || '',
      dataNascimento: trabForm.dataNascimento || '',
      genero: trabForm.genero || 'Masculino',
      nacionalidade: trabForm.nacionalidade || 'Paraguaya',
      funcao: trabForm.funcao || '',
      empresaId: trabForm.empresaId || '',
      status: (trabForm.status as Trabalhador['status']) || 'ativo',
      telefone: trabForm.telefone,
      email: trabForm.email,
      dataAdmissao: trabForm.dataAdmissao,
    };
    setTrabalhadores(prev => [novoTrab, ...prev]);
    addAuditLog('Cadastrou Trabalhador', `${novoTrab.nome} (CI: ${novoTrab.ci})`);
    setTrabForm({ nome: '', ci: '', dataNascimento: '', genero: 'Masculino', funcao: '', empresaId: '', status: 'ativo', nacionalidade: 'Paraguaya' });
    setShowForm(null);
  };

  const handleRealizarExame = async () => {
    const res = exameValidation.validate({
      trabalhadorId: exameForm.trabalhadorId,
      empresaId: exameForm.empresaId,
      examesSelecionados: exameForm.examesSelecionados,
    });
    if (!res.success) return;
    if (!exameForm.trabalhadorId || !exameForm.empresaId || exameForm.examesSelecionados.length === 0) return;
    const novoExame: ExameOcupacional = {
      id: await genModuleId('ex'),
      trabalhadorId: exameForm.trabalhadorId,
      empresaId: exameForm.empresaId,
      tipo: exameForm.tipo,
      dataRealizacao: new Date().toISOString().split('T')[0],
      medicoResponsavel: exameForm.medicoResponsavel,
      examesRealizados: exameForm.examesSelecionados,
      resultados: exameForm.examesSelecionados.map(e => `${e}: Pendente`),
      status: 'realizado',
    };
    setExamesOcupacionais(prev => [novoExame, ...prev]);
    addAuditLog('Exame Ocupacional Realizado', `${getTrabalhadorNome(exameForm.trabalhadorId)} - ${exameForm.tipo}`);

    const numCal = gerarNumeroCal();
    const novoCal: CalCertificado = {
      id: await genModuleId('cal'),
      exameId: novoExame.id,
      trabalhadorId: exameForm.trabalhadorId,
      empresaId: exameForm.empresaId,
      numeroCal: numCal,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataValidade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      parecido: 'Apto',
      medicoEmissor: exameForm.medicoResponsavel,
      registroConselho: 'CRM-PY 123456',
      status: 'válido',
    };
    setCals(prev => [novoCal, ...prev]);
    addAuditLog('CAL Emitido', `${numCal} - ${getTrabalhadorNome(exameForm.trabalhadorId)}`);

    const asoEntry: AsoExam = {
      id: await genModuleId('aso'),
      patientName: getTrabalhadorNome(exameForm.trabalhadorId),
      type: exameForm.tipo === 'Pré-ocupacional' ? 'Admissional' : exameForm.tipo === 'Demissional' ? 'Demissional' : 'Periódico',
      risks: [],
      status: 'apto',
      date: new Date().toISOString().split('T')[0],
      doctor: exameForm.medicoResponsavel,
    };
    setAsos(prev => [asoEntry, ...prev]);

    setExameForm({ trabalhadorId: '', empresaId: '', tipo: 'Periódico', medicoResponsavel: 'Dr. Bruno Castro', examesSelecionados: [] });
    setShowForm(null);
  };

  const handleGerarRelatorioMtess = async (empresaId: string) => {
    const rel: RelatorioMtess = {
      id: await genModuleId('rel'),
      empresaId,
      periodoInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      periodoFim: new Date().toISOString().split('T')[0],
      tipoRelatorio: 'Anual',
      dados: {
        totalTrabalhadores: getTrabalhadoresEmpresa(empresaId).length,
        examesRealizados: getExamesEmpresa(empresaId).filter(e => e.status === 'realizado').length,
        aptos: cals.filter(c => c.empresaId === empresaId && c.parecido === 'Apto').length,
        inaptos: cals.filter(c => c.empresaId === empresaId && c.parecido !== 'Apto').length,
        calsVigentes: cals.filter(c => c.empresaId === empresaId && c.status === 'válido').length,
      },
      status: 'rascunho',
    };
    setRelatorios(prev => [rel, ...prev]);
    addAuditLog('Relatório MTESS Gerado', `Empresa: ${getEmpresaNome(empresaId)}`);
  };

  const handleToggleStatusTrab = (id: string) => {
    setTrabalhadores(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'ativo' ? 'afastado' : 'ativo' } : t));
    addAuditLog('Alterou Status Trabalhador', id);
  };

  // ─── Submodule 9: Paraguayan Occupational Health module ───
  // (Both 8 and 9 route here, but 8 shows basic ASO which we keep, 9 shows full module)
  if (activeSubmodule === 8) {
    return renderAsoLegacy();
  }

  // ─── Stats ───
  const totalTrab = trabalhadores.length;
  const totalExames = examesOcupacionais.filter(e => e.status === 'realizado').length;
  const totalCalsVigentes = cals.filter(c => c.status === 'válido').length;
  const trabalhadoresPorEmpresa = empresas.map(e => ({
    empresa: e.nome,
    count: getTrabalhadoresEmpresa(e.id).length,
    exames: getExamesEmpresa(e.id).filter(x => x.status === 'realizado').length,
  }));

  const tabs: { key: TabName; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: t('ocp_dashboard', 'app'), icon: HeartPulse },
    { key: 'empresas', label: t('ocp_empresas', 'app'), icon: Building2 },
    { key: 'trabalhadores', label: t('ocp_trabalhadores', 'app'), icon: Users },
    { key: 'exames', label: t('ocp_exames_cal', 'app'), icon: Stethoscope },
    { key: 'cal', label: t('ocp_certificados', 'app'), icon: FileCheck },
    { key: 'riscos', label: t('ocp_riscos_matriz', 'app'), icon: AlertTriangle },
    { key: 'relatorios', label: t('ocp_relatorios_mtess', 'app'), icon: FileBarChart },
  ];

  const visibleTabs = tabs.filter(tb => canAccessTab(userPermissions, 'med_work', tb.key));

  const inputCls = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans';
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
  const sectionCls = 'bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4';
  const btnCls = 'px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer';
  const btnSmCls = 'px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-[10px] transition cursor-pointer';
  const badgeCls = (color: string) => `px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 p-5 rounded-xl text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{t('ocp_saude_ocupacional', 'app')}</h2>
            <p className="text-teal-200 text-xs font-medium">{t('ocp_subtitle', 'app')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-teal-100 text-xs">
          <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{empresas.length} {t('medtrab_stat_companies', 'app')}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{totalTrab} {t('medtrab_stat_workers', 'app')}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{totalCalsVigentes} {t('medtrab_stat_cals_active', 'app')}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs">
        {visibleTabs.map(tabItem => {
          const Icon = tabItem.icon;
          return (
            <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer
                ${tab === tabItem.key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="w-3.5 h-3.5" /> {tabItem.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════ DASHBOARD ═══════════════════ */}
      {tab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('medtrab_kpi_empresas', 'app'), value: empresas.filter(e => e.status === 'ativa').length, icon: Building2, color: 'bg-teal-50 text-teal-700 border-teal-200' },
              { label: t('medtrab_kpi_trabalhadores', 'app'), value: totalTrab, icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: t('medtrab_kpi_exames', 'app'), value: totalExames, icon: ClipboardList, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { label: t('medtrab_kpi_cals', 'app'), value: totalCalsVigentes, icon: FileCheck, color: 'bg-green-50 text-green-700 border-green-200' },
            ].map((stat, i) => (
              <div key={i} className={`${stat.color} border rounded-xl p-4 flex items-center gap-3`}>
                <stat.icon className="w-8 h-8 opacity-60" />
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs font-medium opacity-75">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className={sectionCls}>
              <h4 className="font-bold text-slate-800 text-sm">{t('medtrab_workers_by_company', 'app')}</h4>
              <div className="space-y-2">
                {trabalhadoresPorEmpresa.map(item => (
                  <div key={item.empresa} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{item.empresa}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{item.count} {t('medtrab_stat_workers', 'app')}</span>
                      <span className="text-xs text-teal-600 font-semibold">{item.exames} {t('medtrab_stat_exams', 'app')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={sectionCls}>
              <h4 className="font-bold text-slate-800 text-sm">{t('medtrab_latest_cals', 'app')}</h4>
              <div className="space-y-1.5">
                {cals.slice(0, 5).map(cal => (
                  <div key={cal.id} className="flex items-center justify-between p-2 text-xs border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{cal.numeroCal}</span>
                      <span className="text-slate-500">— {getTrabalhadorNome(cal.trabalhadorId)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cal.parecido === 'Apto' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {cal.parecido}
                    </span>
                  </div>
                ))}
                {cals.length === 0 && <p className="text-xs text-slate-400">{t('medtrab_no_cal', 'app')}</p>}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className={sectionCls}>
              <h4 className="font-bold text-slate-800 text-sm">{t('medtrab_monitored_risks', 'app')}</h4>
              <div className="space-y-1.5">
                {riscos.slice(0, 8).map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: r.corIdentificacao }} />
                    <span className="font-medium text-slate-600">{r.nome}</span>
                    <span className="text-[9px] text-slate-400 ml-auto">{r.tipo}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={sectionCls}>
              <h4 className="font-bold text-slate-800 text-sm">MTESS</h4>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                <p className="font-bold text-amber-800">{t('medtrab_regulatory_body', 'app')}</p>
                <p className="text-amber-700">MTESS — Ministerio de Trabajo, Empleo y Seguridad Social</p>
                <p className="text-amber-600 text-[10px]">{t('medtrab_regulatory_law', 'app')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ EMPRESAS ═══════════════════ */}
      {tab === 'empresas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={sectionCls + ' lg:col-span-1'}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-600" /> {t('medtrab_client_companies', 'app')}</h4>
              <button onClick={() => setShowForm(showForm === 'empresa' ? null : 'empresa')} className={btnSmCls}>
                <Plus className="w-3 h-3 inline mr-1" /> {t('medtrab_btn_new_fem', 'app')}
              </button>
            </div>
            {showForm === 'empresa' && (
              <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3 mt-3">
                {empresaValidation.errors.length > 0 && <FormErrorSummary errors={empresaValidation.errors} />}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>{t('medtrab_label_name', 'app')} *</label>
                    <input type="text" value={empresaForm.nome} onChange={e => setEmpresaForm(p => ({ ...p, nome: e.target.value }))} className={inputCls} placeholder={t('medtrab_ph_razao_social', 'app')} />
                  </div>
                  <div>
                    <label className={labelCls}>RUC *</label>
                    <input type="text" value={empresaForm.ruc} onChange={e => setEmpresaForm(p => ({ ...p, ruc: e.target.value }))} className={inputCls} placeholder="80000000-0" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('medtrab_label_address', 'app')}</label>
                  <input type="text" value={empresaForm.endereco} onChange={e => setEmpresaForm(p => ({ ...p, endereco: e.target.value }))} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>{t('medtrab_label_econ_activity', 'app')}</label>
                    <input type="text" value={empresaForm.atividadeEconomica} onChange={e => setEmpresaForm(p => ({ ...p, atividadeEconomica: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('medtrab_label_sector', 'app')}</label>
                    <select value={empresaForm.setor} onChange={e => setEmpresaForm(p => ({ ...p, setor: e.target.value as Empresa['setor'] }))} className={inputCls}>
                      <option value="Industrial">{t('medtrab_sector_industrial', 'app')}</option>
                      <option value="Comercial">{t('medtrab_sector_commercial', 'app')}</option>
                      <option value="Serviços">{t('medtrab_sector_services', 'app')}</option>
                      <option value="Agropecuária">{t('medtrab_sector_agriculture', 'app')}</option>
                      <option value="Construção">{t('medtrab_sector_construction', 'app')}</option>
                      <option value="Transporte">{t('medtrab_sector_transport', 'app')}</option>
                      <option value="Outro">{t('medtrab_sector_other', 'app')}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>{t('medtrab_label_num_employees', 'app')}</label>
                    <input type="text" inputMode="numeric" value={empresaForm.nroFuncionarios || ''} onChange={e => setEmpresaForm(p => ({ ...p, nroFuncionarios: parseInt(e.target.value) || 0 }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('medtrab_label_representative', 'app')}</label>
                    <input type="text" value={empresaForm.representanteNome || ''} onChange={e => setEmpresaForm(p => ({ ...p, representanteNome: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <button onClick={handleSaveEmpresa} className={btnCls + ' w-full'}>{t('medtrab_btn_register_company', 'app')}</button>
              </div>
            )}
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setSelectedEmpresaId(''); }} placeholder={t('medtrab_ph_search_company', 'app')} className={`${inputCls} pl-7`} />
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto mt-2">
              {filteredEmpresas.map(emp => (
                <div key={emp.id}
                  onClick={() => { setSelectedEmpresaId(emp.id); setTab('trabalhadores'); }}
                  className={`p-2.5 rounded-lg border cursor-pointer text-xs transition hover:bg-slate-50 ${selectedEmpresaId === emp.id ? 'bg-teal-50 border-teal-200' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{emp.nome}</p>
                      <p className="text-[10px] text-slate-500">RUC: {emp.ruc}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${emp.status === 'ativa' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {emp.status}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1.5 text-[10px] text-slate-500">
                    <span>{getTrabalhadoresEmpresa(emp.id).length} trab.</span>
                    <span>{getContratosEmpresa(emp.id).length} contratos</span>
                    <span>{getExamesEmpresa(emp.id).length} exames</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {selectedEmpresaId ? (
              <>
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {getEmpresaNome(selectedEmpresaId)} — {t('medtrab_details', 'app')}
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    {(() => {
                      const emp = empresas.find(e => e.id === selectedEmpresaId);
                      if (!emp) return null;
                      return (
                        <>
                          <div><span className="text-slate-500">RUC:</span> <b>{emp.ruc}</b></div>
                          <div><span className="text-slate-500">{t('medtrab_label_sector_detail', 'app')}</span> <b>{emp.setor}</b></div>
                          <div><span className="text-slate-500">{t('medtrab_label_size', 'app')}</span> <b>{emp.porte}</b></div>
                          <div><span className="text-slate-500">{t('medtrab_label_employees_detail', 'app')}</span> <b>{emp.nroFuncionarios}</b></div>
                          <div><span className="text-slate-500">{t('medtrab_label_address_detail', 'app')}</span> <b>{emp.endereco}</b></div>
                          <div><span className="text-slate-500">{t('medtrab_label_representative_detail', 'app')}</span> <b>{emp.representanteNome || '—'}</b></div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">{t('medtrab_contracts', 'app')}</h4>
                  {getContratosEmpresa(selectedEmpresaId).length === 0 ? (
                    <p className="text-xs text-slate-400">{t('medtrab_no_contract', 'app')}</p>
                  ) : (
                    <div className="space-y-2">
                      {getContratosEmpresa(selectedEmpresaId).map(ctr => (
                        <div key={ctr.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-700">{ctr.numeroContrato}</p>
                            <p className="text-slate-500">{ctr.tipo} | {t('medtrab_label_start', 'app')} {ctr.dataInicio}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-teal-700">Gs. {ctr.valorMensal.toLocaleString()}{t('medtrab_per_month', 'app')}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ctr.status === 'vigente' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'}`}>{ctr.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={sectionCls}>
                  <h4 className="font-bold text-slate-800 text-sm">{t('medtrab_work_stations', 'app')}</h4>
                  {getPostosEmpresa(selectedEmpresaId).length === 0 ? (
                    <p className="text-xs text-slate-400">{t('medtrab_no_station', 'app')}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {getPostosEmpresa(selectedEmpresaId).map(posto => (
                        <div key={posto.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                          <p className="font-bold text-slate-700">{posto.nome}</p>
                          <p className="text-slate-500 text-[10px]">{posto.setor} | {posto.turno} | {posto.nroTrabalhadores} {t('medtrab_abbr_workers', 'app')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-10 text-slate-400 text-sm">
                {t('medtrab_select_company_hint', 'app')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ TRABALHADORES ═══════════════════ */}
      {tab === 'trabalhadores' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className={sectionCls + ' lg:col-span-1'}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-teal-600" /> {t('medtrab_workers_heading', 'app')}</h4>
              <button onClick={() => setShowForm(showForm === 'trabalhador' ? null : 'trabalhador')} className={btnSmCls}>
                <Plus className="w-3 h-3 inline mr-1" /> Novo
              </button>
            </div>
            {showForm === 'trabalhador' && (
              <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3 mt-3">
                {trablValidation.errors.length > 0 && <FormErrorSummary errors={trablValidation.errors} />}
                <div>
                  <label className={labelCls}>{t('medtrab_label_company', 'app')} *</label>
                  <select value={trabForm.empresaId} onChange={e => setTrabForm(p => ({ ...p, empresaId: e.target.value }))} className={inputCls}>
                    <option value="">{t('medtrab_select', 'app')}</option>
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>{t('medtrab_label_name', 'app')} *</label>
                    <input type="text" value={trabForm.nome} onChange={e => setTrabForm(p => ({ ...p, nome: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('medtrab_label_ci', 'app')} *</label>
                    <input type="text" value={trabForm.ci} onChange={e => setTrabForm(p => ({ ...p, ci: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>{t('medtrab_label_birthdate', 'app')}</label>
                    <I18nDatePicker value={trabForm.dataNascimento || ''} onChange={v => setTrabForm(p => ({ ...p, dataNascimento: v }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('medtrab_label_gender', 'app')}</label>
                    <select value={trabForm.genero} onChange={e => setTrabForm(p => ({ ...p, genero: e.target.value }))} className={inputCls}>
                      <option value="Masculino">{t('medtrab_gender_male', 'app')}</option>
                      <option value="Feminino">{t('medtrab_gender_female', 'app')}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>{t('medtrab_label_role', 'app')}</label>
                    <input type="text" value={trabForm.funcao} onChange={e => setTrabForm(p => ({ ...p, funcao: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('medtrab_label_admission_date', 'app')}</label>
                    <I18nDatePicker value={trabForm.dataAdmissao || ''} onChange={v => setTrabForm(p => ({ ...p, dataAdmissao: v }))} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>{t('medtrab_label_phone', 'app')}</label>
                    <input type="text" value={trabForm.telefone || ''} onChange={e => setTrabForm(p => ({ ...p, telefone: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('medtrab_label_email', 'app')}</label>
                    <input type="text" value={trabForm.email || ''} onChange={e => setTrabForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <button onClick={handleSaveTrabalhador} className={btnCls + ' w-full'}>{t('medtrab_btn_register_worker', 'app')}</button>
              </div>
            )}
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('medtrab_ph_search_worker', 'app')} className={`${inputCls} pl-7`} />
            </div>
            <div className="mt-2">
              <select value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)} className={inputCls}>
                <option value="">{t('medtrab_all_companies', 'app')}</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto mt-2">
              {filteredTrabalhadores.map(trab => (
                <div key={trab.id} className="p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800">{trab.nome}</p>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${trab.status === 'ativo' ? 'bg-green-50 text-green-600 border-green-200' : trab.status === 'afastado' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {trab.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">CI: {trab.ci} | {trab.funcao}</p>
                  <p className="text-[10px] text-slate-400">{getEmpresaNome(trab.empresaId)}</p>
                  <button onClick={() => handleToggleStatusTrab(trab.id)} className="text-[9px] text-teal-600 hover:text-teal-800 mt-1 font-semibold">
                    {trab.status === 'ativo' ? t('medtrab_btn_suspend', 'app') : t('medtrab_btn_reactivate', 'app')}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className={sectionCls}>
              <h4 className="font-bold text-slate-800 text-sm">{t('medtrab_exam_history', 'app')}</h4>
              <div className="space-y-2">
                {filteredTrabalhadores.slice(0, 10).map(trab => {
                  const examesTrab = examesOcupacionais.filter(e => e.trabalhadorId === trab.id);
                  return (
                    <div key={trab.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{trab.nome}</span>
                        <span className="text-slate-500">{examesTrab.length} {t('medtrab_stat_exams', 'app')}</span>
                      </div>
                      {examesTrab.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {examesTrab.map(ex => (
                            <div key={ex.id} className="flex items-center justify-between text-[10px] text-slate-500 pl-2 border-l-2 border-teal-200">
                              <span>{ex.tipo} — {ex.dataRealizacao}</span>
                              <span className={`font-bold ${ex.status === 'realizado' ? 'text-green-600' : 'text-amber-600'}`}>{ex.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ EXAMES E CAL ═══════════════════ */}
      {tab === 'exames' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={sectionCls + ' lg:col-span-1'}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Stethoscope className="w-4 h-4 text-teal-600" /> {t('medtrab_perform_exam', 'app')}</h4>
              <button onClick={() => setShowForm(showForm === 'exame' ? null : 'exame')} className={btnSmCls}>
                <Plus className="w-3 h-3 inline mr-1" /> {t('medtrab_btn_new', 'app')}
              </button>
            </div>
            {showForm === 'exame' && (
              <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3 mt-3">
                {exameValidation.errors.length > 0 && <FormErrorSummary errors={exameValidation.errors} />}
                <div>
                  <label className={labelCls}>{t('medtrab_label_company', 'app')}</label>
                  <select value={exameForm.empresaId} onChange={e => setExameForm(p => ({ ...p, empresaId: e.target.value, trabalhadorId: '' }))} className={inputCls}>
                    <option value="">{t('medtrab_select', 'app')}...</option>
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('medtrab_label_worker', 'app')} *</label>
                  <select value={exameForm.trabalhadorId} onChange={e => setExameForm(p => ({ ...p, trabalhadorId: e.target.value }))} className={inputCls}>
                    <option value="">{t('medtrab_select_worker', 'app')}</option>
                    {trabalhadores.filter(t => t.empresaId === exameForm.empresaId).map(t => (
                      <option key={t.id} value={t.id}>{t.nome} (CI: {t.ci})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('medtrab_label_exam_type', 'app')}</label>
                  <select value={exameForm.tipo} onChange={e => setExameForm(p => ({ ...p, tipo: e.target.value as ExameOcupacional['tipo'] }))} className={inputCls}>
                    <option value="Pré-ocupacional">Pré-ocupacional (Admissional)</option>
                    <option value="Periódico">Periódico</option>
                    <option value="Retorno ao Trabalho">Retorno ao Trabalho</option>
                    <option value="Mudança de Função">Mudança de Função</option>
                    <option value="Demissional">Demissional</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('medtrab_label_responsible_doctor', 'app')}</label>
                  <input type="text" value={exameForm.medicoResponsavel} onChange={e => setExameForm(p => ({ ...p, medicoResponsavel: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('medtrab_label_exams_to_perform', 'app')}</label>
                  <div className="space-y-1 max-h-[180px] overflow-y-auto border border-slate-200 rounded-lg p-2">
                    {examesDisponiveis.map(ex => (
                      <label key={ex} className="flex items-center gap-2 cursor-pointer text-xs py-0.5">
                        <input type="checkbox" checked={exameForm.examesSelecionados.includes(ex)}
                          onChange={() => handleToggleExameSelecionado(ex)} className="accent-teal-600" />
                        {ex}
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={handleRealizarExame} disabled={!canAso} className={btnCls + ' w-full disabled:opacity-50 disabled:cursor-not-allowed'}>
                  {t('medtrab_btn_perform_exam_emit_cal', 'app')}
                </button>
              </div>
            )}
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('medtrab_ph_search_exams', 'app')} className={`${inputCls} pl-7`} />
            </div>
            <div className="mt-2">
              <select value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)} className={inputCls}>
                <option value="">Todas as empresas</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {filteredExames.map(ex => {
              const trab = trabalhadores.find(t => t.id === ex.trabalhadorId);
              return (
                <div key={ex.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-slate-800 text-sm">{trab?.nome || '—'}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${ex.status === 'realizado' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {ex.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-slate-600">
                    <div><span className="text-slate-500">{t('medtrab_label_type', 'app')}</span> <b>{ex.tipo}</b></div>
                    <div><span className="text-slate-500">{t('medtrab_label_date', 'app')}</span> <b>{ex.dataRealizacao}</b></div>
                    <div><span className="text-slate-500">{t('medtrab_label_doctor', 'app')}</span> <b>{ex.medicoResponsavel}</b></div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.examesRealizados.map((er, i) => (
                      <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full font-medium border ${ex.resultados[i]?.includes('Normal') || ex.resultados[i]?.includes('Pendente') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {er}: {ex.resultados[i] || t('medtrab_pending', 'app')}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════ CAL ═══════════════════ */}
      {tab === 'cal' && (
        <div className="space-y-4">
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FileCheck className="w-4 h-4 text-teal-600" /> {t('medtrab_title_cal', 'app')}</h4>
              <div className="flex gap-2">
                <span className="text-xs font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">{cals.filter(c => c.status === 'válido').length} {t('medtrab_valid_count', 'app')}</span>
                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">{cals.filter(c => c.status === 'expirado').length} {t('medtrab_expired_count', 'app')}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCals.map(cal => {
              const trab = trabalhadores.find(t => t.id === cal.trabalhadorId);
              return (
                <div key={cal.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-teal-600" />
                      <span className="font-bold text-sm text-slate-800">{cal.numeroCal}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cal.status === 'válido' ? 'bg-green-50 text-green-700 border-green-200' : cal.status === 'expirado' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {cal.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-500">{t('medtrab_label_worker_detail', 'app')}</span> <b>{trab?.nome || '—'}</b></div>
                    <div><span className="text-slate-500">CI:</span> <b>{trab?.ci || '—'}</b></div>
                    <div><span className="text-slate-500">{t('medtrab_label_company_detail', 'app')}</span> <b>{getEmpresaNome(cal.empresaId)}</b></div>
                    <div><span className="text-slate-500">{t('medtrab_label_assessment', 'app')}</span>
                      <span className={`ml-1 font-bold ${cal.parecido === 'Apto' ? 'text-green-600' : cal.parecido === 'Apto com Restrições' ? 'text-amber-600' : 'text-red-600'}`}>
                        {cal.parecido}
                      </span>
                    </div>
                    <div><span className="text-slate-500">{t('medtrab_label_emission', 'app')}</span> <b>{cal.dataEmissao}</b></div>
                    <div><span className="text-slate-500">{t('medtrab_label_validity', 'app')}</span> <b>{cal.dataValidade || '—'}</b></div>
                    <div className="col-span-2"><span className="text-slate-500">{t('medtrab_label_doctor', 'app')}</span> <b>{cal.medicoEmissor}</b> ({cal.registroConselho})</div>
                  </div>
                  {cal.restricoes && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                      {t('medtrab_restrictions', 'app')} {cal.restricoes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════ RISCOS E MATRIZ ═══════════════════ */}
      {tab === 'riscos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={sectionCls}>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-teal-600" /> {t('medtrab_occupational_risks', 'app')}</h4>
            <div className="space-y-1.5">
              {riscos.map(r => (
                <div key={r.id} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" style={{ backgroundColor: r.corIdentificacao }} />
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">{r.nome}</p>
                    <p className="text-[10px] text-slate-500">{r.tipo}{r.descricao ? ` — ${r.descricao}` : ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${r.tipo === 'Físico' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : r.tipo === 'Químico' ? 'bg-orange-50 text-orange-700 border-orange-200' : r.tipo === 'Biológico' ? 'bg-green-50 text-green-700 border-green-200' : r.tipo === 'Ergonômico' ? 'bg-purple-50 text-purple-700 border-purple-200' : r.tipo === 'Acidente' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                    {r.tipo}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={sectionCls}>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-teal-600" /> {t('medtrab_exam_matrix', 'app')}</h4>
            <p className="text-xs text-slate-500">{t('medtrab_exam_matrix_subtitle', 'app')}</p>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {matrizExames.map(mat => {
                const risco = riscos.find(r => r.id === mat.riscoId);
                return (
                  <div key={mat.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: risco?.corIdentificacao }} />
                    <div className="flex-1">
                      <p className="font-bold text-slate-700">{mat.exameNome}</p>
                      <p className="text-[10px] text-slate-500">{risco?.nome || '—'} | {mat.exameTipo}</p>
                    </div>
                    <div className="text-right text-[10px]">
                      <p className="text-slate-500">{mat.periodicidadeRecomendadaDias ? `${mat.periodicidadeRecomendadaDias}d` : '—'}</p>
                      <span className={`font-bold ${mat.obrigatorio ? 'text-teal-600' : 'text-slate-400'}`}>{mat.obrigatorio ? t('medtrab_mandatory', 'app') : t('medtrab_optional', 'app')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ RELATÓRIOS MTESS ═══════════════════ */}
      {tab === 'relatorios' && (
        <div className="space-y-5">
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FileBarChart className="w-4 h-4 text-teal-600" /> {t('medtrab_consolidated_reports', 'app')}</h4>
            </div>
            <p className="text-xs text-slate-500">{t('medtrab_mtess_subtitle', 'app')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {empresas.map(emp => (
              <div key={emp.id} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <h5 className="font-bold text-sm text-slate-800">{emp.nome}</h5>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">{t('medtrab_label_workers_detail', 'app')}</span> <b>{getTrabalhadoresEmpresa(emp.id).length}</b></div>
                  <div><span className="text-slate-500">{t('medtrab_label_exams_done', 'app')}</span> <b>{getExamesEmpresa(emp.id).filter(e => e.status === 'realizado').length}</b></div>
                  <div><span className="text-slate-500">{t('medtrab_label_cals_valid', 'app')}</span> <b>{cals.filter(c => c.empresaId === emp.id && c.status === 'válido').length}</b></div>
                  <div><span className="text-slate-500">{t('medtrab_label_contracts_detail', 'app')}</span> <b>{getContratosEmpresa(emp.id).length}</b></div>
                </div>
                <button onClick={() => handleGerarRelatorioMtess(emp.id)} className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> {t('medtrab_btn_generate_mtess', 'app')}
                </button>
              </div>
            ))}
          </div>

          {relatorios.length > 0 && (
            <div className={sectionCls}>
              <h4 className="font-bold text-slate-800 text-sm">{t('medtrab_generated_reports', 'app')}</h4>
              <div className="space-y-2">
                {relatorios.map(rel => (
                  <div key={rel.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <p className="font-bold text-slate-700">{getEmpresaNome(rel.empresaId)}</p>
                      <p className="text-slate-500">{rel.periodoInicio} a {rel.periodoFim} | {rel.tipoRelatorio}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rel.status === 'rascunho' ? 'bg-slate-100 text-slate-600 border-slate-200' : rel.status === 'gerado' ? 'bg-blue-50 text-blue-700 border-blue-200' : rel.status === 'enviado' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                        {rel.status}
                      </span>
                      <button className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200 transition cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-400" />
              <h5 className="font-bold text-sm">{t('medtrab_applicable_law_title', 'app')}</h5>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-2.5 bg-white/10 rounded-lg">
                <p className="font-bold text-teal-300">{t('medtrab_law_labor_code', 'app')}</p>
                <p>{t('medtrab_law_labor_code_desc', 'app')}</p>
              </div>
              <div className="p-2.5 bg-white/10 rounded-lg">
                <p className="font-bold text-teal-300">{t('medtrab_law_safety_hygiene', 'app')}</p>
                <p>{t('medtrab_law_safety_hygiene_desc', 'app')}</p>
              </div>
              <div className="p-2.5 bg-white/10 rounded-lg">
                <p className="font-bold text-teal-300">MTESS</p>
                <p>{t('medtrab_law_mtess_desc', 'app')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render ASO Legacy (submodule 8) ───
  function renderAsoLegacy() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={sectionCls + ' lg:col-span-1'}>
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800 text-base">{t('medtrab_register_aso', 'app')}</h3>
            </div>
          </div>
          {/* Keep the existing ASO form from ClinicalModule */}
          <p className="text-xs text-slate-500 mt-2">{t('medtrab_aso_legacy_hint', 'app')}</p>
        </div>
      </div>
    );
  }
}
