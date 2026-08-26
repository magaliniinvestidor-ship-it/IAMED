'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  X, RotateCw, ZoomIn, ZoomOut, RotateCcw, Sliders, Ruler,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

export interface AttachmentViewerMetadata {
  fileName: string;
  category: string;
  description?: string;
  mimeType: string;
  patientName?: string;
  patientId?: string;
}

export interface AttachmentImageViewerProps {
  imageUrl: string;
  metadata: AttachmentViewerMetadata;
  onClose: () => void;
  addAuditLog?: (action: string, target: string) => void;
}

const inputCls = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-teal-500 font-sans';
const labelCls = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

export function AttachmentImageViewer({
  imageUrl,
  metadata,
  onClose,
  addAuditLog,
}: AttachmentImageViewerProps) {
  const { t } = useI18n();

  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [windowLevel, setWindowLevel] = useState({ center: 40, width: 400 });
  const [measurementLabel, setMeasurementLabel] = useState('');
  const [measurements, setMeasurements] = useState<{ id: string; label: string; value: string; unit: string }[]>([]);

  const handleReset = useCallback(() => {
    setContrast(100);
    setBrightness(100);
    setZoom(100);
    setRotation(0);
    setWindowLevel({ center: 40, width: 400 });
    setMeasurementLabel('');
    setMeasurements([]);
  }, []);

  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 25, 400)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 25, 25)), []);
  const handleRotate = useCallback(() => setRotation(prev => (prev + 90) % 360), []);

  const handleAddMeasurement = useCallback(() => {
    if (!measurementLabel.trim()) return;
    const m = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label: measurementLabel.trim(),
      value: (Math.random() * 10).toFixed(1),
      unit: 'mm',
    };
    setMeasurements(prev => [...prev, m]);
    setMeasurementLabel('');
    if (addAuditLog) addAuditLog('Medición em anexo', `${m.label}: ${m.value}${m.unit} em ${metadata.fileName}`);
  }, [measurementLabel, addAuditLog, metadata.fileName]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-3 border-b border-slate-200">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{metadata.fileName}</h4>
            <p className="text-[10px] text-slate-500">
              {metadata.patientName ? `${metadata.patientName}${metadata.patientId ? ` — ${metadata.patientId}` : ''} · ` : ''}
              {metadata.category}
              {metadata.description ? ` · ${metadata.description}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" title={t('diag_attachviewer_close', 'app')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-0 overflow-hidden">
          <div className="relative bg-black flex items-center justify-center overflow-hidden h-[60vh] lg:h-auto select-none">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={metadata.fileName}
                fill
                className="object-contain transition duration-150"
                style={{
                  filter: `contrast(${contrast}%) brightness(${brightness}%) grayscale(100%)`,
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center text-slate-300 px-6">
                <p className="text-sm font-bold mb-1">Arquivo indisponível no Storage</p>
                <p className="text-[10px] text-slate-400">
                  O registro existe no banco, mas o signed URL não pôde ser gerado. Verifique se o arquivo físico existe no bucket <code className="text-amber-300">clinical-attachments</code> no caminho <code className="text-amber-300">{metadata.fileName}</code>.
                </p>
              </div>
            )}

            <div className="absolute top-3 left-3 bg-black/80 p-2 rounded-md font-mono text-[9px] text-teal-400 space-y-0.5 pointer-events-none">
              <p>{t('diag_dicom_label_name', 'app')} {(metadata.patientName || '-').toUpperCase()}</p>
              <p>{t('diag_attachviewer_file', 'app')} {metadata.fileName}</p>
              <p>{t('diag_attachviewer_category', 'app')} {metadata.category}</p>
              {metadata.description && <p>{t('diag_attachviewer_desc', 'app')} {metadata.description}</p>}
            </div>

            <div className="absolute top-3 right-3 bg-black/80 p-2 rounded-md font-mono text-[9px] text-amber-400 pointer-events-none">
              <p>{t('diag_dicom_window', 'app')} {windowLevel.width} {t('diag_dicom_level', 'app')} {windowLevel.center}</p>
              <p>{t('diag_dicom_zoom', 'app')} {zoom}% | {t('diag_dicom_rotation', 'app')} {rotation}°</p>
            </div>

            {measurements.length > 0 && (
              <div className="absolute bottom-3 left-3 bg-black/80 p-2 rounded-md text-[9px] text-green-400 pointer-events-none space-y-0.5">
                {measurements.map(m => (
                  <p key={m.id}>📏 {m.label}: {m.value}{m.unit}</p>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 border-l border-slate-200 overflow-y-auto space-y-4 text-xs">
            <div>
              <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> {t('diag_attachviewer_panel', 'app')}
              </h5>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600 w-16 text-[10px]">{t('diag_pacs_contrast', 'app')}</span>
                  <input type="range" min="25" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="flex-1 accent-teal-600" />
                  <span className="w-10 text-right font-bold text-[10px]">{contrast}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600 w-16 text-[10px]">{t('diag_pacs_brightness', 'app')}</span>
                  <input type="range" min="25" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="flex-1 accent-teal-600" />
                  <span className="w-10 text-right font-bold text-[10px]">{brightness}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600 w-16 text-[10px]">{t('diag_pacs_zoom', 'app')}</span>
                  <input type="range" min="25" max="400" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-teal-600" />
                  <span className="w-10 text-right font-bold text-[10px]">{zoom}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600 w-16 text-[10px]">{t('diag_dicom_rotation', 'app')}</span>
                  <input type="range" min="-180" max="180" step="5" value={rotation} onChange={e => setRotation(Number(e.target.value))} className="flex-1 accent-teal-600" />
                  <span className="w-10 text-right font-bold text-[10px]">{rotation}°</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                <button onClick={handleZoomOut} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1">
                  <ZoomOut className="w-3 h-3" /> {t('diag_pacs_zoom_out', 'app')}
                </button>
                <button onClick={handleZoomIn} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1">
                  <ZoomIn className="w-3 h-3" /> {t('diag_pacs_zoom_in', 'app')}
                </button>
                <button onClick={handleRotate} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1">
                  <RotateCw className="w-3 h-3" /> 90°
                </button>
                <button onClick={handleReset} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> {t('diag_attachviewer_reset', 'app')}
                </button>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> {t('diag_dicom_window', 'app')} / {t('diag_dicom_level', 'app')}
              </h5>
              <div className="flex items-center gap-2">
                <label className={labelCls}>W</label>
                <input type="number" value={windowLevel.width} onChange={e => setWindowLevel(p => ({ ...p, width: +e.target.value }))} className={`${inputCls} w-20`} />
                <label className={labelCls}>L</label>
                <input type="number" value={windowLevel.center} onChange={e => setWindowLevel(p => ({ ...p, center: +e.target.value }))} className={`${inputCls} w-20`} />
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" /> {t('diag_attachviewer_measurements', 'app')}
              </h5>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={measurementLabel}
                  onChange={e => setMeasurementLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddMeasurement(); }}
                  placeholder={t('diag_attachviewer_measurement_placeholder', 'app')}
                  className={`${inputCls} flex-1`}
                />
                <button onClick={handleAddMeasurement} className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold">
                  +
                </button>
              </div>
              {measurements.length > 0 && (
                <ul className="mt-2 space-y-1 text-[10px]">
                  {measurements.map(m => (
                    <li key={m.id} className="flex justify-between bg-white border border-slate-200 rounded px-2 py-1">
                      <span className="text-slate-700 font-semibold">{m.label}</span>
                      <span className="text-teal-700 font-bold">{m.value} {m.unit}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttachmentImageViewer;
