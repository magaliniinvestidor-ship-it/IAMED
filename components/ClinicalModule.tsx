'use client';
 
import React, { useState } from 'react';
import { Patient, AsoExam } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import { 
  ClipboardList, Microscope, HeartPulse, ShieldAlert, Sparkles, 
  Send, Plus, FileDown, Check, Eye, Trash2, Sliders, AlertCircle
} from 'lucide-react';
 
interface ClinicalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  activeSubmodule: number; // 3 = HCE, 4 = Imagem, 8 = Medicina Trabalho, 9 = Medicina Trabalho Opcional
  addAuditLog: (action: string, target: string) => void;
  asos: AsoExam[];
  setAsos: React.Dispatch<React.SetStateAction<AsoExam[]>>;
}
 
export default function ClinicalModule({
  patients,
  setPatients,
  activeSubmodule,
  addAuditLog,
  asos,
  setAsos,
}: ClinicalModuleProps) {
  const { t } = useI18n();
  // Clinical States
  const [selectedPatId, setSelectedPatId] = useState(patients[0]?.id || '');
  const [templateType, setTemplateType] = useState('Anamnese Geral');
  const [cidCode, setCidCode] = useState('I10');
  const [icpDiagnosis, setIcpDiagnosis] = useState('');
  const [prescriptionItem, setPrescriptionItem] = useState('');
  const [prescriptions, setPrescriptions] = useState<string[]>([]);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [doctorName, setDoctorName] = useState('Dra. Amanda Silva');
 
  // AI Co-Pilot Clinical Summary states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
 
  // Diagnostic/Laboratory states
  const [imageContrast, setImageContrast] = useState(100);
  const [imageBrightness, setImageBrightness] = useState(100);
  const [laboratoryNotes, setLaboratoryNotes] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('Raio-X Tórax');
  const [selectedImageUrl, setSelectedImageUrl] = useState('https://picsum.photos/seed/xray/600/400');
 
  // Occupational Medicine (Medicina do Trabalho) state
  const [asoPatient, setAsoPatient] = useState('');
  const [asoType, setAsoType] = useState<'Admissional' | 'Periódico' | 'Demissional'>('Periódico');
  const [asoRisks, setAsoRisks] = useState('Ruídos, Ergonomia');
  const [asoStatus, setAsoStatus] = useState<'apto' | 'inapto'>('apto');

  // NR-35 Opcional Risk State
  const [catEmployee, setCatEmployee] = useState('');
  const [catDate, setCatDate] = useState('2026-06-21');
  const [catNotes, setCatNotes] = useState('');
  const [catRegistered, setCatRegistered] = useState(false);

  // Computed Values
  const selectedPatient = patients.find(p => p.id === selectedPatId) || patients[0];

  const handleApplyTemplate = () => {
    if (templateType === 'Anamnese Geral') {
      setConsultationNotes("Queixa Principal: Paciente relata cefaleia constante.\nSintomas adicionais: Fadiga muscular leve, alterações visuais ocasionais.\nSinais Vitais: PA 130/85, FC 78 bpm.\nConduta: Solicitação de hemograma completo e exames laboratoriais complementares.");
    } else if (templateType === 'Acompanhamento Crônico') {
      setConsultationNotes("Acompanhamento regular de distúrbio metabólico/hipertensão.\nUso regular das medicações prescritas em visitas anteriores.\nSintomas recentes: Ausentes.\nPróxima avaliação em 60 dias.");
    } else {
      setConsultationNotes("Exame Físico de Rotina.\nPaciente assintomático, bom estado geral. Tórax livre, murmúrios vesiculares universais e simétricos.\nSem prescrições urgentes.");
    }
  };

  const handleAddPrescription = () => {
    if (!prescriptionItem.trim()) return;
    setPrescriptions(prev => [...prev, prescriptionItem.trim()]);
    setPrescriptionItem('');
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const newHistoryEntry = {
      id: `his_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: "Consulta Clínica",
      diagnosis: icpDiagnosis || "Avaliação de Sintomas",
      cid10: cidCode,
      prescriptions: prescriptions.length > 0 ? prescriptions : ["Nenhuma medicação prescrita"],
      notes: consultationNotes,
      doctor: doctorName,
    };

    // Optimistic UI update
    setPatients(prev => prev.map(p => {
      if (p.id === selectedPatient.id) {
        return {
          ...p,
          clinicalHistory: [newHistoryEntry, ...p.clinicalHistory],
          status: 'atendido' as const
        };
      }
      return p;
    }));

    addAuditLog('Atualizou Prontuário HCE', selectedPatient.name);

    // Persist to Supabase
    await supabase.from('clinical_history').insert({
      id: newHistoryEntry.id,
      patient_id: selectedPatient.id,
      date: newHistoryEntry.date,
      type: newHistoryEntry.type,
      diagnosis: newHistoryEntry.diagnosis,
      cid10: newHistoryEntry.cid10,
      prescriptions: newHistoryEntry.prescriptions,
      notes: newHistoryEntry.notes,
      doctor: newHistoryEntry.doctor,
    });
    await supabase.from('patients').update({ status: 'atendido' }).eq('id', selectedPatient.id);

    // Reset fields
    setIcpDiagnosis('');
    setPrescriptions([]);
    setConsultationNotes('');
  };

  // Real-Time GenAI Case Analysis from sever-side API!
  const handleQueryAiCoPilot = async () => {
    if (!selectedPatient) return;
    setAiLoading(true);
    setAiResponse('');

    const patientRecordString = `
      Nome: ${selectedPatient.name}
      Idade: 45 anos
      Prioridade: ${selectedPatient.priority}
      Histórico Clínico Pregresso:
      ${selectedPatient.clinicalHistory.map(h => `- ${h.date}: ${h.type} (${h.diagnosis} - ${h.cid10}). Notas: ${h.notes}. Prescrições: ${h.prescriptions.join(', ')}`).join('\n')}
    `;

    const promptText = `
      Você é o "Dr. IA" Co-piloto clínico especialista do sistema IAMED.
      Analise o seguinte prontuário eletrônico do paciente e forneça de forma muito objetiva, concisa e profissional:
      1. Um resumo curto clínico do caso.
      2. 3 fatores de risco potenciais relevantes para esse histórico.
      3. Sugestão rápida de exames recomendados ou ajuste de terapia.
      
      Importante: Forneça a resposta estruturada em tópicos curtos em português.
      
      Prontuário:
      ${patientRecordString}
    `;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: 'Você é um assistente clínico de IA avançado para apoio a médicos no IAMED CRM. Seja técnico, sutil e extremamente preciso.'
        })
      });
      const data = await response.json();
      if (data.text) {
        setAiResponse(data.text);
      } else {
        setAiResponse('Erro no processamento da co-piloto.');
      }
    } catch {
      setAiResponse('Não foi possível conectar com o servidor da Inteligência Artificial. Verifique a chave.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateAso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asoPatient.trim()) return;

    const newAso: AsoExam = {
      id: `aso_${Date.now()}`,
      patientName: asoPatient,
      type: asoType,
      risks: asoRisks.split(',').map(r => r.trim()),
      status: asoStatus,
      date: new Date().toISOString().split('T')[0],
      doctor: "Dr. Bruno Castro"
    };

    // Optimistic UI update
    setAsos(prev => [newAso, ...prev]);
    addAuditLog('Emissão ASO Ocupacional', `${asoPatient} (${asoStatus.toUpperCase()})`);

    // Persist to Supabase
    await supabase.from('aso_exams').insert({
      id: newAso.id,
      patient_name: newAso.patientName,
      type: newAso.type,
      risks: newAso.risks,
      status: newAso.status,
      date: newAso.date,
      doctor: newAso.doctor,
    });

    setAsoPatient('');
  };

  const handleRegisterCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catEmployee.trim()) return;

    addAuditLog('Emissão de CAT (Acidente Trabalho)', `${catEmployee}`);
    setCatRegistered(true);
    setTimeout(() => {
      setCatRegistered(false);
      setCatEmployee('');
      setCatNotes('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* 3. Prontuário Médico Eletrônico */}
      {activeSubmodule === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seletor de Prontuário */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('access_record', 'app')}</label>
              <select
                value={selectedPatId}
                onChange={e => setSelectedPatId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold focus:outline-teal-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.priority.toUpperCase()})</option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="space-y-4">
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-2 text-sm">
                  <h4 className="font-bold text-teal-800 text-base">{selectedPatient.name}</h4>
                  <div className="text-xs text-teal-700 font-medium space-y-1">
                    <p>📅 Nascimento: {selectedPatient.birthdate}</p>
                    <p>🩺 Status: <b className="uppercase">{selectedPatient.status}</b></p>
                    <p>✉️ Contato: {selectedPatient.email}</p>
                  </div>

                  <button
                    onClick={handleQueryAiCoPilot}
                    className="w-full mt-3 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition border border-teal-600"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    {t('ai_copilot', 'app')}
                  </button>
                </div>

                {/* AI response panel */}
                {(aiLoading || aiResponse) && (
                  <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2 text-xs font-mono shadow-md border border-slate-800">
                    <div className="flex items-center gap-1.5 text-teal-300 font-semibold text-xs border-b border-slate-800 pb-1.5">
                      <Sparkles className="w-4 h-4 animate-spin text-yellow-400" />
                      CO-PILOTO CLÍNICO GEMINI AI
                    </div>

                    {aiLoading ? (
                      <div className="py-4 text-center text-slate-400 animate-pulse">
                        Processando dados e gerando insights de diagnóstico...
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed text-slate-300 max-h-[220px] overflow-y-auto pr-1">
                        {aiResponse}
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Antiga */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-600 uppercase">{t('clinical_timeline', 'app')}</h5>
                  <div className="border-l-2 border-slate-200 pl-4 space-y-4 max-h-[240px] overflow-y-auto pr-2">
                    {selectedPatient.clinicalHistory.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">{t('no_records', 'app')}</p>
                    ) : (
                      selectedPatient.clinicalHistory.map(entry => (
                        <div key={entry.id} className="relative text-xs">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-teal-500 rounded-full border border-white" />
                          <p className="font-black text-slate-800">{entry.date} - {entry.type}</p>
                          <p className="text-[10px] text-teal-700 font-bold uppercase">{entry.doctor}</p>
                          <p className="font-medium text-slate-600 mt-0.5">{entry.notes}</p>
                          <p className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 inline-block font-bold rounded mt-1 border border-slate-200">
                            CID: {entry.cid10} — {entry.diagnosis}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Evolution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800 text-base">{t('new_evolution', 'app')}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={templateType}
                  onChange={e => setTemplateType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 py-1.5 px-2.5 text-xs rounded-lg focus:outline-teal-500 font-sans"
                >
                  <option value="Anamnese Geral">Anamnese Geral</option>
                  <option value="Acompanhamento Crônico">Acompanhamento Crônico</option>
                  <option value="Exame Físico">Exame Físico</option>
                </select>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-2.5 py-2 rounded-lg font-medium shadow-xs transition"
                >
                  Aplicar Presets
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveConsultation} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Médico Responsável</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Diagnóstico Clínico</label>
                  <input
                    type="text"
                    value={icpDiagnosis}
                    onChange={e => setIcpDiagnosis(e.target.value)}
                    placeholder="Hipertensão Secundária, etc."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Código CID-10</label>
                  <input
                    type="text"
                    value={cidCode}
                    onChange={e => setCidCode(e.target.value)}
                    placeholder="I10"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans uppercase font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Evolução de Anamnese & Sinais Vitais</label>
                <textarea
                  value={consultationNotes}
                  onChange={e => setConsultationNotes(e.target.value)}
                  rows={6}
                  placeholder="Descreva as queixas, sintomas, exame clínico físico e conduta adotada..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans leading-relaxed"
                  required
                />
              </div>

              {/* Prescrições */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-bold text-slate-600 uppercase">Receituário de Medicamentos</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prescriptionItem}
                    onChange={e => setPrescriptionItem(e.target.value)}
                    placeholder="Ex: Paracetamol 500mg, tomar de 8 em 8 horas..."
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrescription}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 rounded-lg font-bold"
                  >
                    Inserir
                  </button>
                </div>

                {prescriptions.length > 0 && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200/60 text-xs text-slate-700 space-y-1">
                    {prescriptions.map((pre, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 last:border-0">
                        <span>💊 {pre}</span>
                        <button
                          type="button"
                          onClick={() => setPrescriptions(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-800 font-bold"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="submit"
                  className="py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer text-xs"
                >
                  Confirmar e Salvar Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Diagnóstico por Imagens e Laboratório */}
      {activeSubmodule === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Microscope className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800 text-base">Laudar Novo Exame</h3>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Paciente</label>
                <select
                  value={selectedPatId}
                  onChange={e => setSelectedPatId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Exame</label>
                  <select
                    value={selectedExamType}
                    onChange={e => {
                      setSelectedExamType(e.target.value);
                      if (e.target.value === 'Raio-X Tórax') {
                        setSelectedImageUrl('https://picsum.photos/seed/xray/600/400');
                      } else if (e.target.value === 'Ressonância') {
                        setSelectedImageUrl('https://picsum.photos/seed/mri/600/400');
                      } else {
                        setSelectedImageUrl('https://picsum.photos/seed/ct/600/400');
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Raio-X Tórax">Raio-X Tórax</option>
                    <option value="Ressonância">Ressonância Magnética</option>
                    <option value="Tomografia">Tomografia Computadorizada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Exame</label>
                  <div className="p-2.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg font-bold text-center">
                    Aguardando Laudo
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observações Laboratoriais</label>
                <textarea
                  value={laboratoryNotes}
                  onChange={e => setLaboratoryNotes(e.target.value)}
                  rows={4}
                  placeholder="Ex: Área cardiopulmonar preservada, ausência de derrame pleural..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  addAuditLog('Emissão de Laudo Radiológico', `${selectedExamType} de ${selectedPatient?.name}`);
                  alert('Laudo cadastrado com sucesso!');
                  setLaboratoryNotes('');
                }}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs"
              >
                Salvar Laudo Médico
              </button>
            </div>
          </div>

          {/* Imaging Viewer Simulator */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-base">IAMED Workstation - PACS Radiológico</h4>
                <p className="text-xs text-slate-500">Visualizador de imagens diagnósticas cirúrgicas de alta definição</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs font-bold bg-slate-100 py-1 px-2.5 rounded text-slate-600">ID: PACS_8390</span>
                <span className="text-xs font-bold bg-teal-50 text-teal-700 py-1 px-2.5 rounded border border-teal-100">ONLINE</span>
              </div>
            </div>

            {/* Simulated X-Ray Visualizer */}
            <div className="relative bg-black rounded-lg text-slate-300 flex items-center justify-center overflow-hidden border border-slate-800 group h-[320px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImageUrl}
                alt="Simulado Clínica"
                referrerPolicy="no-referrer"
                style={{
                  filter: `contrast(${imageContrast}%) brightness(${imageBrightness}%) grayscale(100%)`
                }}
                className="object-cover max-h-full max-w-full transition duration-150"
              />
              <div className="absolute top-3 left-3 bg-black/70 p-2 rounded-md font-mono text-[9px] text-teal-400 space-y-0.5 pointer-events-none">
                <p>NOME: {selectedPatient?.name.toUpperCase()}</p>
                <p>EXAME: {selectedExamType.toUpperCase()}</p>
                <p>SÉRIE: SD-2026/06R</p>
                <p>BRILHO: {imageBrightness}% / CONTRASTE: {imageContrast}%</p>
              </div>
              <div className="absolute bottom-3 right-3 bg-black/70 p-2 rounded-md font-mono text-[10px] text-teal-400 pointer-events-none">
                12-BIT GRAYSCALE PACS
              </div>
            </div>

            {/* PACS adjustments bar */}
            <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-600 w-16">Contraste:</span>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={imageContrast}
                  onChange={e => setImageContrast(Number(e.target.value))}
                  className="flex-1 accent-teal-600"
                />
                <span className="w-10 text-right font-bold text-slate-800">{imageContrast}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-600 w-16">Brilho:</span>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={imageBrightness}
                  onChange={e => setImageBrightness(Number(e.target.value))}
                  className="flex-1 accent-teal-600"
                />
                <span className="w-10 text-right font-bold text-slate-800">{imageBrightness}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Medicina do Trabalho PCMSO */}
      {activeSubmodule === 8 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800 text-base">Registrar ASO (PCMSO)</h3>
              </div>
            </div>

            <form onSubmit={handleCreateAso} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Colaborador / Paciente *</label>
                <input
                  type="text"
                  value={asoPatient}
                  onChange={e => setAsoPatient(e.target.value)}
                  placeholder="Nome Completo do Funcionário"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de ASO</label>
                  <select
                    value={asoType}
                    onChange={e => setAsoType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Admissional">Admissional</option>
                    <option value="Periódico">Periódico</option>
                    <option value="Demissional">Demissional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Parecer Clínico</label>
                  <select
                    value={asoStatus}
                    onChange={e => setAsoStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-teal-800"
                  >
                    <option value="apto">APTO PARA TRABALHO</option>
                    <option value="inapto">INAPTO TEMPORÁRIO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Riscos Ocupacionais Associados</label>
                <input
                  type="text"
                  value={asoRisks}
                  onChange={e => setAsoRisks(e.target.value)}
                  placeholder="Ex: Altura NR-35, Ruído, Vibrações"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Separe os riscos ocupacionais por vírgula.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs"
              >
                Gerar Parecer de ASO Eletrônico
              </button>
            </form>
          </div>

          {/* Histórico de ASOs Homologados */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Histórico de Pareceres de Saúde Ocupacional</h4>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {asos.map(aso => (
                <div key={aso.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 text-sm">{aso.patientName}</p>
                    <p className="text-slate-500 font-medium">
                      Exame: <b className="text-slate-700">{aso.type}</b> | Autor: {aso.doctor}
                    </p>
                    <div className="flex gap-1.5 flex-wrap pt-0.5">
                      {aso.risks.map((r, i) => (
                        <span key={i} className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{r}</span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    {aso.status === 'apto' ? (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold uppercase">
                        ✅ Apto
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold uppercase animate-bounce">
                        ❌ Inapto
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400 font-medium pt-1">Data: {aso.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. Medicina do Trabalho / Opcional (EPI & CAT) */}
      {activeSubmodule === 9 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CAT Registration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800 text-base">Emitir Comunicação de Acidente de Trabalho (CAT)</h3>
            </div>

            <form onSubmit={handleRegisterCat} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Trabalhador Acidentado *</label>
                <input
                  type="text"
                  value={catEmployee}
                  onChange={e => setCatEmployee(e.target.value)}
                  placeholder="Nome do Acidentado"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data e Hora do Ocorrido</label>
                <input
                  type="date"
                  value={catDate}
                  onChange={e => setCatDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Natureza da Lesão & Resumo de Circunstâncias</label>
                <textarea
                  value={catNotes}
                  onChange={e => setCatNotes(e.target.value)}
                  rows={4}
                  placeholder="Ex: Entorse na articulação do tornozelo direito devido a queda de nível..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
              >
                Registrar CAT & Transmitir ao eSocial
              </button>

              {catRegistered && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg font-bold flex items-center gap-2 animate-pulse">
                  <Check className="w-4 h-4 text-green-600" /> CAT registrada com sucesso e enviada ao eSocial!
                </div>
              )}
            </form>
          </div>

          {/* Segurança e EPI Checkup */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Controle de Entregas e Conformidade de EPI</h4>
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Protetores Auriculares tipo Cinto</p>
                  <p className="text-[10px] text-slate-500">CA: 12.389 | Renovação obrigatória anual</p>
                </div>
                <span className="py-1 px-2.5 bg-green-50 text-green-700 border border-green-200 font-semibold rounded">Estoque OK</span>
              </div>

              <div className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Cinturões de Segurança antiquedas (para NR-35)</p>
                  <p className="text-[10px] text-slate-500">CA: 44.910 | Inspeção semestral obrigatória</p>
                </div>
                <span className="py-1 px-2.5 bg-red-50 text-red-700 border border-red-200 font-semibold rounded animate-pulse">Revisão Pendente</span>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex gap-3 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Norma Regulamentadora NR-35 & PCMSO</p>
                  <p className="mt-1 font-medium text-amber-800 leading-relaxed">
                    Todo trabalhador que execute atividades em altura superior a 2 metros deve possuir ASO válido de aptidão específica de saúde física e neurológica homologado pelo médico coordenador clínico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
