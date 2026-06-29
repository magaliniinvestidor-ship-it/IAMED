'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bed, initialBeds, mockNps } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { 
  Megaphone, BedDouble, BarChart3, Smartphone, Sparkles, Send, 
  MessageSquare, Video, Check, AlertCircle, RefreshCw, Star, X
} from 'lucide-react';

interface CrmBiModuleProps {
  activeSubmodule: number; // 10 = CRM Marketing, 11 = Internação, 12 = BI, 13 = Portal/Telemedicina
  addAuditLog: (action: string, target: string) => void;
  beds: Bed[];
  setBeds: React.Dispatch<React.SetStateAction<Bed[]>>;
}

export default function CrmBiModule({
  activeSubmodule,
  addAuditLog,
  beds,
  setBeds,
}: CrmBiModuleProps) {
  const { t } = useI18n();
  // 10. Marketing/NPS States
  const [npsScores, setNpsScores] = useState(mockNps);
  const [whatsappTemplate, setWhatsappTemplate] = useState('Lembrete de Consulta');
  const [isCampaignSent, setIsCampaignSent] = useState(false);

  // 11. Hospitalization States
  const [selectedBedId, setSelectedBedId] = useState('');
  const [hospPatient, setHospPatient] = useState('');

  // 12. BI & Gemini chat States
  const [biFilterDomain, setBiFilterDomain] = useState('Todos');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ia'; text: string }[]>([
    { sender: 'ia', text: 'Olá! Sou o Dr. IA, analista corporativo do IAMED. Como posso ajudar com a inteligência de negócios ou análise de prontuários hoje?' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // 13. Telemedicine / Patient App Emulator camera States
  const [isCallActive, setIsCallActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 10. Dispatch campaign
  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCampaignSent(true);
    addAuditLog('Disparo Campanha CRM', whatsappTemplate);
    setTimeout(() => {
      setIsCampaignSent(false);
    }, 3000);
  };

  // 11. Hospital bed check-in
  const handleBedAlloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId || !hospPatient.trim()) return;

    const entryDate = new Date().toISOString().split('T')[0];

    // Optimistic UI update
    setBeds(prev => prev.map(b => {
      if (b.id === selectedBedId) {
        return { ...b, status: 'ocupado', patientName: hospPatient, entryDate };
      }
      return b;
    }));

    addAuditLog('Allocação de Leito', `${hospPatient} no ${selectedBedId}`);
    setHospPatient('');

    // Persist to Supabase
    await supabase.from('beds')
      .update({ status: 'ocupado', patient_name: hospPatient, entry_date: entryDate })
      .eq('id', selectedBedId);
  };

  const handleFreeBed = async (id: string, name?: string) => {
    setBeds(prev => prev.map(b => {
      if (b.id === id) {
        addAuditLog('Desocupou Leito', `${name || 'Paciente'}`);
        return { ...b, status: 'disponível', patientName: undefined, entryDate: undefined };
      }
      return b;
    }));
    // Persist to Supabase
    await supabase.from('beds')
      .update({ status: 'disponível', patient_name: null, entry_date: null })
      .eq('id', id);
  };

  // 12. Ask Gemini BI Analyst using Server-side api route
  const handleSendBiChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    const systemPromptAndContext = `
      Você é o "Dr. IA — Analista BI Corporativo", uma inteligência integrada ao IAMED.
      Responda sobre métricas de desempenho clínico, captação de pacientes, ocupação e gestão com tom executivo e profissional em português.
      Contexto clínico atual do IAMED:
      - Taxa de Ocupação de Leitos: ${beds.filter(b=>b.status==='ocupado').length} ocupados de ${beds.length} totais.
      - Total de NPS Médio: 9.3 de satisfação baseados em avaliações de pacientes.
      - Médicos Ativos: Dra. Amanda Silva (Cardiologia), Dr. Adriano Lima (Ortopedia), Dr. Bruno Castro (Medicina do Trabalho).
      
      Pergunta do usuário: "${userMessage}"
    `;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: systemPromptAndContext,
          systemInstruction: 'Você é o consultor de negócios analítico Dr. IA de volta ao IAMED, fornecendo relatórios e visões estratégicas resumidas.'
        })
      });
      const data = await response.json();
      if (data.text) {
        setChatMessages(prev => [...prev, { sender: 'ia', text: data.text }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ia', text: 'Eor ao processar a resposta analítica.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { sender: 'ia', text: 'Não foi possível contatar o servidor de Inteligência de Negócio.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 13. Telemedicine camera trigger
  const handleToggleTeleconsultation = async () => {
    if (isCallActive) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      setIsCallActive(false);
      addAuditLog('Encerrou Telemedicina', 'Vídeo Consulta');
    } else {
      setIsCallActive(true);
      addAuditLog('Iniciou Telemedicina', 'Vídeo Consulta');
      
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.warn("Camera access denied or blocked inside preview iframe:", err);
      }
    }
  };

  useEffect(() => {
    // Sync stream when call active
    if (isCallActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCallActive, stream]);

  // Cleanup camera stream on exit
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-6">
      {/* 10. Marketing e CRM de Pacientes */}
      {activeSubmodule === 10 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Megaphone className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800 text-base">{t('crm_marketing', 'app')}</h3>
            </div>

            <form onSubmit={handleSendCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Template do WhatsApp / SMS</label>
                <select
                  value={whatsappTemplate}
                  onChange={e => setWhatsappTemplate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  <option value="Lembrete de Consulta">Lembrete de Consulta Automatizado (&quot;Olá, confirmamos sua consulta amanhã...&quot;)</option>
                  <option value="Retorno Preventivo">Retorno Preventivo anual (&quot;Já faz um ano desde sua última consulta...&quot;)</option>
                  <option value="Aviso de Vacinação">Aviso de Vacinação (&quot;Campanha de gripe ativa. Agende sua vacina...&quot;)</option>
                </select>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-sans leading-relaxed">
                <span className="font-bold text-slate-800 text-[11px] block uppercase pb-1">Métricas de Alvo de Disparo:</span>
                <p>Este CRM de Pacientes visa reduzir as taxas de absenteísmo (não comparecimento) que hoje giram em torno de 18% na clínica. O envio melhora a fidelidade.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition"
              >
                Disparar Campanha de Engajamento
              </button>

              {isCampaignSent && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg font-bold flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4 text-green-600 font-bold" /> Campanha em massa despachada eletronicamente para 142 contatos!
                </div>
              )}
            </form>
          </div>

          {/* Feedback e NPS Reviews */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Avaliações de Pacientes (NPS Geral: 9.3)
            </h4>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {npsScores.map((nps, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800">{nps.patientName}</span>
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded font-bold">NPS: {nps.score}</span>
                  </div>
                  <p className="text-slate-500 italic">&ldquo;{nps.comment}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 11. Internação e Centro Cirúrgico */}
      {activeSubmodule === 11 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Allocação do Leito */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BedDouble className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800 text-base">Check-In e Internação</h3>
            </div>

            <form onSubmit={handleBedAlloc} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Selecionar Leito Vago</label>
                <select
                  value={selectedBedId}
                  onChange={e => setSelectedBedId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-teal-500 font-sans"
                  required
                >
                  <option value="">Selecione um leito...</option>
                  {beds.filter(b => b.status === 'disponível').map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.wing})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo do Paciente</label>
                <input
                  type="text"
                  value={hospPatient}
                  onChange={e => setHospPatient(e.target.value)}
                  placeholder="Nome do Internado"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs"
              >
                Efetivar Internação
              </button>
            </form>
          </div>

          {/* Gráfico Visual dos Leitos */}
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
                    <button
                      onClick={() => handleFreeBed(b.id, b.patientName)}
                      className="self-end text-[10px] bg-slate-800 hover:bg-slate-900 text-white font-bold px-2 py-1 rounded"
                    >
                      Dar Alta Médica / Desocupar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 12. Inteligência de Negócio (BI) */}
      {activeSubmodule === 12 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Relatórios Clínicos de Inteligência de Negócio</h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-xs">Capacidade Operacional Geral</p>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-teal-500 h-3 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-bold pt-1">
                  <span>Meta de Produtividade</span>
                  <span>75% ALCANÇADO</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-xs">Satisfação Geral NPS</p>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-amber-500 h-3 rounded-full" style={{ width: '93%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-bold pt-1">
                  <span>Alto Padrão de Serviço</span>
                  <span>9.3 / 10 EXCELENTE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gemini Chat Analytics Analyzer */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 flex flex-col h-[380px]">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-3 text-sm shrink-0">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h4 className="font-bold text-slate-800">IA Business Intelligence Analyst</h4>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-1 text-xs">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${msg.sender === 'ia' ? 'bg-slate-100 text-slate-800 self-start' : 'bg-teal-600 text-white ml-auto'}`}>
                  {msg.text}
                </div>
              ))}
              {isChatLoading && (
                <div className="p-2.5 bg-slate-100 text-slate-500 text-xs rounded-xl self-start flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dr. IA está analisando a performance da clínica...
                </div>
              )}
            </div>

            <form onSubmit={handleSendBiChatMessage} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Questione o analista sobre faturamento ou leitos do IAMED..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 rounded-lg font-bold flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 13. Portal do Paciente e App Móvel (Telemedicina) */}
      {activeSubmodule === 13 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Smartphone Simulator */}
          <div className="bg-slate-900 p-4 pt-10 pb-10 rounded-[35px] border-4 border-slate-700 shadow-xl max-w-sm mx-auto lg:col-span-1 border-t-8 border-b-8 relative">
            {/* Speaker hole */}
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

              {/* Digital Recipes emulator */}
              <div className="p-2 border border-slate-150 rounded-lg space-y-1">
                <p className="font-bold">💊 Receita Digital Homologada:</p>
                <p className="text-[10px] text-slate-500 italic">Losartana Potássica 50mg — Tomar 1x ao dia pela manhã.</p>
              </div>

              {/* Enter virtual videocall trigger */}
              <button
                onClick={handleToggleTeleconsultation}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 animate-pulse cursor-pointer shadow-sm"
              >
                <Video className="w-3.5 h-3.5" />
                {isCallActive ? 'Encerrar Consulta Virtual' : 'Entrar na Teleconsulta'}
              </button>
            </div>
          </div>

          {/* Telemedicine Video screen layout */}
          {isCallActive ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 lg:col-span-2 flex flex-col h-[380px] overflow-hidden relative group">
              <div className="absolute top-4 left-4 bg-black/60 p-2 py-1 rounded text-teal-400 text-xs font-black z-10 animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" /> TELEMEDICINA IAMED - SALA VIRTUAL ATIVA
              </div>

              {/* Video elements feed */}
              <div className="flex-1 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center relative border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Fallback frame if camera denied */}
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

                {/* Simulated clinician photo on right small thumb */}
                <div className="absolute bottom-4 right-4 w-24 h-32 bg-slate-900 border-2 border-white rounded-lg overflow-hidden shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"
                    alt="Médica"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1 rounded text-[8px] text-white">
                    Dra. Amanda
                  </div>
                </div>
              </div>

              {/* Bottom control hub */}
              <div className="flex justify-center gap-3 pt-3 shrink-0">
                <button
                  onClick={handleToggleTeleconsultation}
                  className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition"
                  title="Desconectar Chamada"
                >
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
