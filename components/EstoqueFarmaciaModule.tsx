'use client';

import React, { useState } from 'react';
import { PharmacyItem, LotControl, StockMovement, InventoryCount, AdverseEvent, QualityDeviation, BatchRecall, StockMovementType, DrugCategory, AdverseEventSeverity, AdverseEventOutcome } from '@/lib/mockData';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/I18nContext';
import {
  Pill, Plus, AlertTriangle, X, Check, Search, Package,
  ClipboardList, TrendingUpDown, BarChart3, QrCode,
  ChevronDown, ChevronRight, Clock, AlertCircle, Shield,
  Syringe, Stethoscope, User, Calendar, Building2, Hash,
  Printer, Download, Eye, Edit2, Trash2, RefreshCw,
  FileText, Truck, ArrowUpDown, Box, FlaskConical,
  Thermometer, Snowflake, Activity, Skull, FlaskRound,
  TestTube, HeartPulse, Bug, Ban, RotateCcw,
  MessageSquareWarning, FileWarning, TriangleAlert, Info
} from 'lucide-react';

interface EstoqueFarmaciaModuleProps {
  addAuditLog: (action: string, target: string) => void;
  patients?: { id: string; name: string }[];
  pharmacyItems: PharmacyItem[];
  setPharmacyItems: React.Dispatch<React.SetStateAction<PharmacyItem[]>>;
  stockMovements: StockMovement[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  inventoryCounts: InventoryCount[];
  setInventoryCounts: React.Dispatch<React.SetStateAction<InventoryCount[]>>;
  adverseEvents: AdverseEvent[];
  setAdverseEvents: React.Dispatch<React.SetStateAction<AdverseEvent[]>>;
  qualityDeviations: QualityDeviation[];
  setQualityDeviations: React.Dispatch<React.SetStateAction<QualityDeviation[]>>;
  batchRecalls: BatchRecall[];
  setBatchRecalls: React.Dispatch<React.SetStateAction<BatchRecall[]>>;
  activeRole: string;
  activeOperator: string;
}

const GS = (v: number) => `Gs. ${v.toLocaleString('es-PY')}`;

const CATEGORY_COLORS: Record<DrugCategory, string> = {
  venda_livre: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  sob_receita: 'bg-blue-100 text-blue-800 border-blue-200',
  controlado: 'bg-amber-100 text-amber-800 border-amber-200',
  entorpecente: 'bg-rose-100 text-rose-800 border-rose-200',
  psicotropico: 'bg-purple-100 text-purple-800 border-purple-200',
  uso_hospitalar: 'bg-slate-100 text-slate-800 border-slate-200',
  biologico: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  insumo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  descartavel: 'bg-teal-100 text-teal-800 border-teal-200',
  material: 'bg-stone-100 text-stone-800 border-stone-200',
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(expiryDate: string, t?: (key: string, section?: 'app' | 'login' | 'terms') => string) {
  const days = daysUntil(expiryDate);
  if (days <= 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200"><AlertTriangle className="w-3 h-3" /> {(t ? t('pharm_lot_status_expired', 'app') : 'Vencido')}</span>;
  if (days <= 30) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> {days}d</span>;
  if (days <= 90) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-200">{days}d</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">{days}d</span>;
}

export default function EstoqueFarmaciaModule({
  addAuditLog, patients = [],
  pharmacyItems: pharmacyItemsProp,
  setPharmacyItems,
  stockMovements: movements,
  setStockMovements: setMovements,
  inventoryCounts,
  setInventoryCounts,
  adverseEvents,
  setAdverseEvents,
  qualityDeviations,
  setQualityDeviations,
  batchRecalls,
  setBatchRecalls,
  activeRole,
  activeOperator,
}: EstoqueFarmaciaModuleProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<'dashboard' | 'items' | 'entries' | 'exits' | 'movements' | 'lots' | 'inventory' | 'reports' | 'alerts' | 'pharmacovigilance'>('dashboard');

  const pharmacyItems = pharmacyItemsProp;
  const canPerformStock = activeRole !== 'Usuário' && activeRole !== 'Recepcionista';
  const catLabel = (cat: DrugCategory) => t(`pharm_cat_${cat}`, 'app') as string;
  const moveLabel = (type: StockMovementType) => t(`pharm_movement_${type}`, 'app') as string;
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for new item
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<DrugCategory>('venda_livre');
  const [newItemForm, setNewItemForm] = useState('comprimido');
  const [newItemPresentation, setNewItemPresentation] = useState('');
  const [newItemManufacturer, setNewItemManufacturer] = useState('');
  const [newItemDinavisa, setNewItemDinavisa] = useState('');
  const [newItemQty, setNewItemQty] = useState(0);
  const [newItemMin, setNewItemMin] = useState(10);
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemCost, setNewItemCost] = useState(0);
  const [newItemPrice, setNewItemPrice] = useState(0);

  // Form state for entry (DTE inbound)
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryItemId, setEntryItemId] = useState('');
  const [entryLotNumber, setEntryLotNumber] = useState('');
  const [entrySerial, setEntrySerial] = useState('');
  const [entryQty, setEntryQty] = useState(0);
  const [entryCost, setEntryCost] = useState(0);
  const [entryExpiry, setEntryExpiry] = useState('');
  const [EntryMfg, setEntryMfg] = useState('');
  const [entryDte, setEntryDte] = useState('');
  const [entrySupplier, setEntrySupplier] = useState('');
  const [entrySupplierRuc, setEntrySupplierRuc] = useState('');

  // ─── Farmacovigilância states ───────────────────────────
  const [showAeForm, setShowAeForm] = useState(false);
  const [showQdForm, setShowQdForm] = useState(false);
  const [pvTab, setPvTab] = useState<'events' | 'deviations' | 'recalls'>('events');
  const totalPvAlerts = adverseEvents.filter(e => e.status === 'notificado').length +
    qualityDeviations.filter(d => d.status === 'aberto' || d.status === 'investigacao').length +
    batchRecalls.filter(r => r.status === 'ativo').length;

  // Adverse event form
  const [aePatient, setAePatient] = useState('');
  const [aeMedication, setAeMedication] = useState('');
  const [aeItemId, setAeItemId] = useState('');
  const [aeLotId, setAeLotId] = useState('');
  const [aeReaction, setAeReaction] = useState('');
  const [aeSeverity, setAeSeverity] = useState<AdverseEventSeverity>('leve');
  const [aeStart, setAeStart] = useState('');
  const [aeOutcome, setAeOutcome] = useState<AdverseEventOutcome>('recuperado');
  const [aeDescription, setAeDescription] = useState('');
  const [aeNotifier, setAeNotifier] = useState('');

  // Quality deviation form
  const [qdItemId, setQdItemId] = useState('');
  const [qdLotId, setQdLotId] = useState('');
  const [qdType, setQdType] = useState<QualityDeviation['deviationType']>('outro');
  const [qdDesc, setQdDesc] = useState('');
  const [qdSeverity, setQdSeverity] = useState<AdverseEventSeverity>('leve');
  const [qdQty, setQdQty] = useState(0);
  const [qdReporter, setQdReporter] = useState('');

  // Form state for exit (dispensation)
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitItemId, setExitItemId] = useState('');
  const [exitLotId, setExitLotId] = useState('');
  const [exitQty, setExitQty] = useState(1);
  const [exitPatient, setExitPatient] = useState('');
  const [exitProcedure, setExitProcedure] = useState('');
  const [exitSector, setExitSector] = useState('');
  const [exitRoom, setExitRoom] = useState('');
  const [exitDoctor, setExitDoctor] = useState('');
  const [exitNotes, setExitNotes] = useState('');

  // Inventory state
  const [invItemId, setInvItemId] = useState('');
  const [invLotId, setInvLotId] = useState('');
  const [invCounted, setInvCounted] = useState(0);

  // Alerts
  const lowStockItems = pharmacyItems.filter(i => i.totalQuantity <= i.minQuantity);
  const expiringItems = pharmacyItems.filter(i => i.lots.some(l => {
    const d = daysUntil(l.expiryDate);
    return d > 0 && d <= 90 && l.quantity > 0;
  }));
  const expiredItems = pharmacyItems.filter(i => i.lots.some(l => {
    return daysUntil(l.expiryDate) <= 0 && l.quantity > 0;
  }));
  const totalAlerts = lowStockItems.length + expiringItems.length + expiredItems.length;

  const handleNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformStock) { alert(t('pharm_perm_denied_new', 'app')); return; }
    if (!newItemName.trim()) return;
    const newId = `pharm_${Date.now()}`;
    const newLot: LotControl = {
      id: `lot_${Date.now()}`,
      itemId: newId,
      lotNumber: `LOT-NEW-${String(pharmacyItems.length + 1).padStart(3, '0')}`,
      manufactureDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      quantity: newItemQty,
      initialQuantity: newItemQty,
      costPerUnit: newItemCost,
      dinavisaRegistration: newItemDinavisa,
      receivedDate: new Date().toISOString().split('T')[0],
      status: 'disponivel',
    };
    const newItem: PharmacyItem = {
      id: newId,
      name: newItemName,
      category: newItemCategory,
      form: newItemForm as any,
      presentation: newItemPresentation,
      manufacturer: newItemManufacturer,
      dinavisaRegistration: newItemDinavisa,
      requiresPrescription: newItemCategory !== 'venda_livre' && newItemCategory !== 'insumo' && newItemCategory !== 'descartavel' && newItemCategory !== 'material',
      lots: [newLot],
      totalQuantity: newItemQty,
      minQuantity: newItemMin,
      storageLocation: newItemLocation,
      unitCost: newItemCost,
      unitPrice: newItemPrice,
      active: true,
    };
    setPharmacyItems(prev => [...prev, newItem]);
    supabase.from('pharmacy_items').insert({
      id: newId, name: newItemName, category: newItemCategory, form: newItemForm,
      presentation: newItemPresentation, manufacturer: newItemManufacturer,
      dinavisa_registration: newItemDinavisa, requires_prescription: newItem.requiresPrescription,
      total_quantity: newItemQty, min_quantity: newItemMin, storage_location: newItemLocation,
      unit_cost: newItemCost, unit_price: newItemPrice, active: true,
    }).then(({ error }) => { if (error) console.warn('pharmacy_items insert error:', error.message); });
    supabase.from('lot_controls').insert({
      id: newLot.id, item_id: newId, lot_number: newLot.lotNumber,
      manufacture_date: newLot.manufactureDate, expiry_date: newLot.expiryDate,
      quantity: newItemQty, initial_quantity: newItemQty, cost_per_unit: newItemCost,
      dinavisa_registration: newItemDinavisa, received_date: newLot.receivedDate, status: 'disponivel',
    }).then(({ error }) => { if (error) console.warn('lot_controls insert error:', error.message); });
    addAuditLog('Cadastrou Item Farmácia', newItemName);
    setShowNewItemForm(false);
    setNewItemName(''); setNewItemPresentation(''); setNewItemManufacturer(''); setNewItemDinavisa('');
    setNewItemQty(0); setNewItemMin(10); setNewItemLocation(''); setNewItemCost(0); setNewItemPrice(0);
  };

  const handleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformStock) { alert(t('pharm_perm_denied_entry', 'app')); return; }
    if (!entryItemId || !entryQty || !entryLotNumber) return;
    const item = pharmacyItems.find(i => i.id === entryItemId);
    if (!item) return;
    const newLot: LotControl = {
      id: `lot_${Date.now()}`,
      itemId: entryItemId,
      lotNumber: entryLotNumber,
      serialNumber: entrySerial || undefined,
      manufactureDate: EntryMfg || new Date().toISOString().split('T')[0],
      expiryDate: entryExpiry || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      quantity: entryQty,
      initialQuantity: entryQty,
      costPerUnit: entryCost || item.unitCost,
      dinavisaRegistration: item.dinavisaRegistration,
      dteEntryNumber: entryDte || undefined,
      supplierName: entrySupplier || undefined,
      supplierRuc: entrySupplierRuc || undefined,
      receivedDate: new Date().toISOString().split('T')[0],
      status: 'disponivel',
    };
    const newMovement: StockMovement = {
      id: `mov_${Date.now()}`,
      itemId: entryItemId,
      itemName: item.name,
      lotId: newLot.id,
      lotNumber: entryLotNumber,
      movementType: 'entrada',
      quantity: entryQty,
      unitCost: newLot.costPerUnit,
      totalCost: entryQty * newLot.costPerUnit,
      date: new Date().toISOString().split('T')[0],
      operatorName: 'Operador',
      dteNumber: entryDte || undefined,
      supplierName: entrySupplier || undefined,
    };
    setPharmacyItems(prev => prev.map(i => i.id === entryItemId ? {
      ...i,
      lots: [...i.lots, newLot],
      totalQuantity: i.totalQuantity + entryQty,
      unitCost: entryCost || i.unitCost,
    } : i));
    supabase.from('lot_controls').insert({
      id: newLot.id, item_id: entryItemId, lot_number: entryLotNumber,
      serial_number: entrySerial || null, manufacture_date: newLot.manufactureDate,
      expiry_date: newLot.expiryDate, quantity: entryQty, initial_quantity: entryQty,
      cost_per_unit: newLot.costPerUnit, dinavisa_registration: item.dinavisaRegistration,
      dte_entry_number: entryDte || null, supplier_name: entrySupplier || null,
      supplier_ruc: entrySupplierRuc || null, received_date: newLot.receivedDate, status: 'disponivel',
    }).then(({ error }) => { if (error) console.warn('lot_controls entry insert error:', error.message); });
    supabase.from('pharmacy_items').update({
      total_quantity: item.totalQuantity + entryQty,
      unit_cost: entryCost || item.unitCost,
    }).eq('id', entryItemId).then(({ error }) => { if (error) console.warn('pharmacy_items entry update error:', error.message); });
    setMovements(prev => [newMovement, ...prev]);
    supabase.from('stock_movements').insert({
      id: newMovement.id, item_id: entryItemId, item_name: item.name,
      lot_id: newLot.id, lot_number: entryLotNumber, movement_type: 'entrada',
      quantity: entryQty, unit_cost: newLot.costPerUnit, total_cost: entryQty * newLot.costPerUnit,
      date: newMovement.date, operator_name: 'Operador',
      dte_number: entryDte || null, supplier_name: entrySupplier || null,
    }).then(({ error }) => { if (error) console.warn('stock_movements entry insert error:', error.message); });
    addAuditLog('Entrada Estoque por DTE', `${item.name} - Lote ${entryLotNumber} (${entryQty})`);
    setShowEntryForm(false);
    setEntryItemId(''); setEntryLotNumber(''); setEntrySerial(''); setEntryQty(0);
    setEntryCost(0); setEntryExpiry(''); setEntryMfg(''); setEntryDte('');
    setEntrySupplier(''); setEntrySupplierRuc('');
  };

  const handleExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformStock) { alert(t('pharm_perm_denied_exit', 'app')); return; }
    if (!exitItemId || !exitLotId || !exitQty) return;
    const item = pharmacyItems.find(i => i.id === exitItemId);
    if (!item) return;
    const lot = item.lots.find(l => l.id === exitLotId);
    if (!lot || lot.quantity < exitQty) { alert(t('pharm_insufficient_lot', 'app')); return; }
    const totalCost = exitQty * lot.costPerUnit;
    const newMovement: StockMovement = {
      id: `mov_${Date.now()}`,
      itemId: exitItemId,
      itemName: item.name,
      lotId: exitLotId,
      lotNumber: lot.lotNumber,
      movementType: 'saida',
      quantity: exitQty,
      unitCost: lot.costPerUnit,
      totalCost,
      date: new Date().toISOString().split('T')[0],
      operatorName: 'Operador',
      patientName: exitPatient || undefined,
      procedureName: exitProcedure || undefined,
      sector: exitSector || undefined,
      room: exitRoom || undefined,
      doctorName: exitDoctor || undefined,
      notes: exitNotes || undefined,
    };
    setPharmacyItems(prev => prev.map(i => i.id === exitItemId ? {
      ...i,
      lots: i.lots.map(l => l.id === exitLotId ? { ...l, quantity: l.quantity - exitQty } : l),
      totalQuantity: i.totalQuantity - exitQty,
    } : i));
    supabase.from('lot_controls').update({ quantity: lot.quantity - exitQty }).eq('id', exitLotId)
      .then(({ error }) => { if (error) console.warn('lot_controls exit update error:', error.message); });
    supabase.from('pharmacy_items').update({ total_quantity: item.totalQuantity - exitQty })
      .eq('id', exitItemId)
      .then(({ error }) => { if (error) console.warn('pharmacy_items exit update error:', error.message); });
    setMovements(prev => [newMovement, ...prev]);
    supabase.from('stock_movements').insert({
      id: newMovement.id, item_id: exitItemId, item_name: item.name,
      lot_id: exitLotId, lot_number: lot.lotNumber, movement_type: 'saida',
      quantity: exitQty, unit_cost: lot.costPerUnit, total_cost: totalCost,
      date: newMovement.date, operator_name: 'Operador',
      patient_name: exitPatient || null, procedure_name: exitProcedure || null,
      sector: exitSector || null, room: exitRoom || null,
      doctor_name: exitDoctor || null, notes: exitNotes || null,
    }).then(({ error }) => { if (error) console.warn('stock_movements exit insert error:', error.message); });
    addAuditLog('Saída Estoque', `${item.name} - ${exitQty} para ${exitPatient || exitSector || 'setor'}`);
    setShowExitForm(false);
    setExitItemId(''); setExitLotId(''); setExitQty(1); setExitPatient('');
    setExitProcedure(''); setExitSector(''); setExitRoom(''); setExitDoctor(''); setExitNotes('');
  };

  const handleInventorySubmit = () => {
    if (!canPerformStock) { alert(t('pharm_perm_denied_inventory', 'app')); return; }
    if (!invItemId || !invLotId) return;
    const item = pharmacyItems.find(i => i.id === invItemId);
    if (!item) return;
    const lot = item.lots.find(l => l.id === invLotId);
    if (!lot) return;
    const diff = invCounted - lot.quantity;
    setInventoryCounts(prev => {
      const existing = prev[0];
      if (existing && existing.status === 'programado') {
        return [{
          ...existing,
          status: 'em_andamento',
          items: [...existing.items, { itemId: invItemId, itemName: item.name, lotId: invLotId, lotNumber: lot.lotNumber, expectedQuantity: lot.quantity, countedQuantity: invCounted, difference: diff }],
        }, ...prev.slice(1)];
      }
      return prev;
    });
    if (diff !== 0) {
      setPharmacyItems(prev => prev.map(i => i.id === invItemId ? {
        ...i, lots: i.lots.map(l => l.id === invLotId ? { ...l, quantity: invCounted } : l),
        totalQuantity: i.totalQuantity + diff,
      } : i));
      supabase.from('lot_controls').update({ quantity: invCounted }).eq('id', invLotId)
        .then(({ error }) => { if (error) console.warn('lot_controls inv update error:', error.message); });
      supabase.from('pharmacy_items').update({ total_quantity: item.totalQuantity + diff })
        .eq('id', invItemId)
        .then(({ error }) => { if (error) console.warn('pharmacy_items inv update error:', error.message); });
    }
    addAuditLog('Inventário Físico', `${item.name} Lote ${lot.lotNumber}: esperado ${lot.quantity}, contado ${invCounted}`);
    setInvItemId(''); setInvLotId(''); setInvCounted(0);
  };

  // ─── Farmacovigilância handlers ──────────────────────────
  const handleNewAdverseEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformStock) { alert(t('pharm_perm_denied_ae', 'app')); return; }
    if (!aePatient.trim() || !aeMedication.trim() || !aeReaction.trim()) return;
    const item = pharmacyItems.find(i => i.id === aeItemId);
    const lot = item?.lots.find(l => l.id === aeLotId);
    const newEvent: AdverseEvent = {
      id: `ae_${Date.now()}`,
      patientName: aePatient,
      medicationName: aeMedication,
      itemId: aeItemId,
      lotId: aeLotId,
      lotNumber: lot?.lotNumber || '',
      adverseReaction: aeReaction,
      severity: aeSeverity,
      startDate: aeStart || new Date().toISOString().split('T')[0],
      outcome: aeOutcome,
      suspectedDrug: true,
      concomitantDrugs: [],
      description: aeDescription,
      notifierName: aeNotifier || 'Operador',
      notifierRole: 'Operador',
      notificationDate: new Date().toISOString().split('T')[0],
      status: 'notificado',
    };
    setAdverseEvents(prev => [newEvent, ...prev]);
    supabase.from('adverse_events').insert({
      id: newEvent.id, patient_name: aePatient, patient_id: null,
      medication_name: aeMedication, item_id: aeItemId || null, lot_id: aeLotId || null,
      lot_number: newEvent.lotNumber, adverse_reaction: aeReaction, severity: aeSeverity,
      start_date: newEvent.startDate, outcome: aeOutcome, suspected_drug: true,
      concomitant_drugs: [], description: aeDescription, notifier_name: aeNotifier || 'Operador',
      notifier_role: 'Operador', notification_date: newEvent.notificationDate, status: 'notificado',
    }).then(({ error }) => { if (error) console.warn('adverse_events insert error:', error.message); });
    addAuditLog('Notificou RAM', `${aeMedication} - ${aeReaction} (${aePatient})`);
    setShowAeForm(false);
    setAePatient(''); setAeMedication(''); setAeItemId(''); setAeLotId('');
    setAeReaction(''); setAeSeverity('leve'); setAeStart(''); setAeOutcome('recuperado');
    setAeDescription(''); setAeNotifier('');
  };

  const handleNewQualityDeviation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformStock) { alert(t('pharm_perm_denied_qd', 'app')); return; }
    if (!qdItemId || !qdLotId || !qdDesc.trim()) return;
    const item = pharmacyItems.find(i => i.id === qdItemId);
    const lot = item?.lots.find(l => l.id === qdLotId);
    const newDev: QualityDeviation = {
      id: `qd_${Date.now()}`,
      itemId: qdItemId,
      itemName: item?.name || '',
      lotId: qdLotId,
      lotNumber: lot?.lotNumber || '',
      deviationType: qdType,
      severity: qdSeverity,
      affectedQuantity: qdQty || 0,
      description: qdDesc,
      reportDate: new Date().toISOString().split('T')[0],
      reporterName: qdReporter || 'Operador',
      status: 'aberto',
    };
    setQualityDeviations(prev => [newDev, ...prev]);
    supabase.from('quality_deviations').insert({
      id: newDev.id, item_id: qdItemId, item_name: item?.name || '',
      lot_id: qdLotId, lot_number: lot?.lotNumber || '', deviation_type: qdType,
      severity: qdSeverity, affected_quantity: qdQty || 0, description: qdDesc,
      report_date: newDev.reportDate, reporter_name: qdReporter || 'Operador', status: 'aberto',
    }).then(({ error }) => { if (error) console.warn('quality_deviations insert error:', error.message); });
    addAuditLog('Notificou Desvio Qualidade', `${item?.name} - ${qdType}`);
    setShowQdForm(false);
    setQdItemId(''); setQdLotId(''); setQdDesc(''); setQdSeverity('leve'); setQdQty(0); setQdReporter('');
  };

  const handleResolveDeviation = (id: string) => {
    setQualityDeviations(prev => prev.map(d => d.id === id ? {
      ...d, status: 'concluido' as const, closedAt: new Date().toISOString().split('T')[0],
    } : d));
    supabase.from('quality_deviations').update({
      status: 'concluido', closed_at: new Date().toISOString().split('T')[0],
    }).eq('id', id).then(({ error }) => { if (error) console.warn('quality_deviation update error:', error.message); });
  };

  const handleCompleteRecall = (id: string) => {
    setBatchRecalls(prev => prev.map(r => r.id === id ? {
      ...r, status: 'concluido' as const, completedAt: new Date().toISOString().split('T')[0],
    } : r));
    supabase.from('batch_recalls').update({
      status: 'concluido', completed_at: new Date().toISOString().split('T')[0],
    }).eq('id', id).then(({ error }) => { if (error) console.warn('batch_recall update error:', error.message); });
  };

  const filteredItems = pharmacyItems.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.dinavisaRegistration.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.lots.some(l => l.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderDashboard = () => (
    <div className="space-y-5">
      {/* Alert Bar */}
      {(totalAlerts > 0 || totalPvAlerts > 0) && (
        <div className="space-y-2">
          {totalAlerts > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-800 text-sm">{t('pharm_dashboard_alerts_count', 'app').replace('{count}', String(totalAlerts))}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  {lowStockItems.length > 0 && <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold">{lowStockItems.length} {t('pharm_alert_stock_low', 'app')}</span>}
                  {expiringItems.length > 0 && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">{expiringItems.reduce((s, i) => s + i.lots.filter(l => { const d = daysUntil(l.expiryDate); return d > 0 && d <= 90; }).length, 0)} {t('pharm_alert_expiring', 'app')}</span>}
                  {expiredItems.length > 0 && <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold">{expiredItems.reduce((s, i) => s + i.lots.filter(l => daysUntil(l.expiryDate) <= 0).length, 0)} {t('pharm_alert_expired', 'app')}</span>}
                </div>
              </div>
            </div>
          )}
          {totalPvAlerts > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <Activity className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 text-sm">{t('pharm_dashboard_pv_count', 'app').replace('{count}', String(totalPvAlerts))}</p>
                <div className="flex gap-2 mt-1.5 text-xs">
                  {adverseEvents.filter(e => e.status === 'notificado').length > 0 && <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">{adverseEvents.filter(e => e.status === 'notificado').length} {t('pharm_alert_ae_pending', 'app')}</span>}
                  {qualityDeviations.filter(d => d.status === 'aberto' || d.status === 'investigacao').length > 0 && <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">{qualityDeviations.filter(d => d.status === 'aberto' || d.status === 'investigacao').length} {t('pharm_alert_qd_active', 'app')}</span>}
                  {batchRecalls.filter(r => r.status === 'ativo').length > 0 && <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold">{batchRecalls.filter(r => r.status === 'ativo').length} {t('pharm_alert_recall_active', 'app')}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Pill className="w-5 h-5 text-indigo-600" /></div>
            <div><p className="text-2xl font-black text-slate-800">{pharmacyItems.length}</p><p className="text-[10px] text-slate-500 font-bold uppercase">{t('pharm_dashboard_stock_items', 'app')}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-black text-slate-800">{pharmacyItems.reduce((s, i) => s + i.lots.length, 0)}</p><p className="text-[10px] text-slate-500 font-bold uppercase">{t('pharm_dashboard_lots', 'app')}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><TrendingUpDown className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-black text-slate-800">{movements.length}</p><p className="text-[10px] text-slate-500 font-bold uppercase">{t('pharm_dashboard_movements', 'app')}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
            <div><p className="text-2xl font-black text-slate-800">{totalAlerts}</p><p className="text-[10px] text-slate-500 font-bold uppercase">{t('pharm_dashboard_alerts', 'app')}</p></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
        <h4 className="font-black text-slate-800 text-sm mb-3">{t('pharm_dashboard_quick_actions', 'app')}</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button data-testid="open-new-item-form" aria-label={t('pharm_item_new', 'app')} onClick={() => setShowNewItemForm(true)} className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-2 transition"><Plus className="w-4 h-4" /> {t('pharm_dashboard_new_item', 'app')}</button>
          <button onClick={() => setShowEntryForm(true)} className="p-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-bold text-teal-700 flex items-center gap-2 transition"><Truck className="w-4 h-4" /> {t('pharm_dashboard_entry_dte', 'app')}</button>
          <button onClick={() => setShowExitForm(true)} className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-2 transition"><Syringe className="w-4 h-4" /> {t('pharm_dashboard_exit', 'app')}</button>
          <button onClick={() => setTab('inventory')} className="p-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl text-xs font-bold text-cyan-700 flex items-center gap-2 transition"><ClipboardList className="w-4 h-4" /> {t('pharm_dashboard_inventory', 'app')}</button>
          <button onClick={() => setTab('alerts')} className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2 transition"><AlertTriangle className="w-4 h-4" /> {t('pharm_dashboard_alerts', 'app')} ({totalAlerts})</button>
        </div>
      </div>

      {/* Recent movements */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h4 className="font-black text-slate-800 text-sm">{t('pharm_dashboard_last_movements', 'app')}</h4>
          <button onClick={() => setTab('movements')} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold">{t('pharm_dashboard_view_all', 'app')}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_movement_type', 'app')}</th>
                <th className="px-4 py-2.5 text-right">{t('pharm_movement_qty', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_movement_origin_dest', 'app')}</th>
                <th className="px-4 py-2.5 text-left">{t('date', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_movement_total_cost', 'app')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {movements.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">{t('pharm_no_movements', 'app') || 'Nenhuma movimentação'}</td></tr>
              ) : movements.slice(0, 5).map(m => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800">{m.itemName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${m.movementType === 'entrada' ? 'bg-emerald-100 text-emerald-800' : m.movementType === 'saida' ? 'bg-amber-100 text-amber-800' : m.movementType === 'ajuste' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                      {moveLabel(m.movementType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{m.quantity}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">{m.patientName || m.supplierName || m.sector || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{m.date}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{GS(m.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderItems = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('pharm_item_search', 'app')} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
        </div>
        <button data-testid="open-new-item-form" aria-label={t('pharm_item_new', 'app')} onClick={() => setShowNewItemForm(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition"><Plus className="w-4 h-4" /> {t('pharm_item_new', 'app')}</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_item_category', 'app')}</th>
                <th className="px-4 py-2.5 text-left">{t('pharm_item_dinavisa', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_item_total', 'app')}</th>
                <th className="px-4 py-2.5 text-right">{t('pharm_item_minimum', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_item_location', 'app')}</th>
                <th className="px-4 py-2.5 text-center">{t('pharm_item_lots', 'app')}</th><th className="px-4 py-2.5 text-center">{t('pharm_item_alert', 'app')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400">{t('pharm_no_items', 'app') || 'Nenhum item encontrado'}</td></tr>
              ) : filteredItems.map(item => {
                const low = item.totalQuantity <= item.minQuantity;
                const hasExpiring = item.lots.some(l => { const d = daysUntil(l.expiryDate); return d > 0 && d <= 90; });
                const hasExpired = item.lots.some(l => daysUntil(l.expiryDate) <= 0 && l.quantity > 0);
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/70 transition ${!item.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        {item.requiresPrescription && <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">RX</span>}
                        {item.category === 'biologico' && <Snowflake className="w-3 h-3 text-cyan-500" />}
                      </div>
                      {item.activePrinciple && <p className="text-[9px] text-slate-400 mt-0.5">{item.activePrinciple}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${CATEGORY_COLORS[item.category]}`}>{catLabel(item.category)}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{item.dinavisaRegistration}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${low ? 'text-rose-600' : 'text-slate-800'}`}>{item.totalQuantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">{item.minQuantity}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-600 max-w-[120px] truncate">{item.storageLocation}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500">{item.lots.length}</td>
                    <td className="px-4 py-3 text-center">
                      {low && <span className="text-rose-500" title={t('pharm_alert_stock_low', 'app')}><AlertTriangle className="w-3.5 h-3.5 inline" /></span>}
                      {hasExpired && <span className="text-rose-600 ml-1" title={t('pharm_lot_status_expired', 'app')}><X className="w-3.5 h-3.5 inline" /></span>}
                      {hasExpiring && !hasExpired && <span className="text-amber-500 ml-1" title={t('pharm_alert_expiring', 'app')}><Clock className="w-3.5 h-3.5 inline" /></span>}
                      {!low && !hasExpired && !hasExpiring && <Check className="w-3.5 h-3.5 text-emerald-500 inline" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLots = () => (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h4 className="font-black text-slate-800 text-sm">{t('pharm_lot_control', 'app')}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
              <th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th>
              <th className="px-4 py-2.5 text-left">{t('pharm_lot_serial', 'app')}</th><th className="px-4 py-2.5 text-center">{t('pharm_lot_status', 'app')}</th>
              <th className="px-4 py-2.5 text-right">{t('pharm_lot_qty', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_lot_mfg', 'app')}</th>
              <th className="px-4 py-2.5 text-left">{t('pharm_lot_expiry', 'app')}</th><th className="px-4 py-2.5 text-center">{t('pharm_item_alert', 'app')}</th>
              <th className="px-4 py-2.5 text-left">{t('pharm_item_dinavisa', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_lot_supplier', 'app')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pharmacyItems.flatMap(item =>
              item.lots.filter(l => l.quantity > 0).map(lot => {
                const d = daysUntil(lot.expiryDate);
                return (
                  <tr key={lot.id} className={`hover:bg-slate-50/70 transition ${d <= 0 ? 'bg-rose-50/50' : d <= 30 ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-bold">{lot.lotNumber}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{lot.serialNumber || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${lot.status === 'disponivel' ? 'bg-emerald-100 text-emerald-800' : lot.status === 'bloqueado' ? 'bg-amber-100 text-amber-800' : lot.status === 'vencido' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>{t(`pharm_lot_status_${lot.status}`, 'app')}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{lot.quantity}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{lot.manufactureDate}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{lot.expiryDate}</td>
                    <td className="px-4 py-3">{expiryBadge(lot.expiryDate, t)}</td>
                    <td className="px-4 py-3 font-mono text-[9px] text-slate-500">{lot.dinavisaRegistration}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-600 max-w-[120px] truncate">{lot.supplierName || '-'}</td>
                  </tr>
                );
              })
            )}
            {pharmacyItems.flatMap(item => item.lots.filter(l => l.quantity > 0)).length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-xs text-slate-400">{t('pharm_no_lots', 'app') || 'Nenhum lote encontrado'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMovements = () => (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h4 className="font-black text-slate-800 text-sm">{t('pharm_movement_title', 'app')} ({movements.length})</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
              <th className="px-4 py-2.5 text-left">{t('date', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th>
              <th className="px-4 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_movement_type', 'app')}</th>
              <th className="px-4 py-2.5 text-right">{t('pharm_movement_qty', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_movement_unit_cost', 'app')}</th>
              <th className="px-4 py-2.5 text-right">{t('pharm_movement_total_cost', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_movement_origin_dest', 'app')}</th>
              <th className="px-4 py-2.5 text-left">{t('pharm_movement_operator', 'app')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {movements.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-xs text-slate-400">{t('pharm_no_movements', 'app') || 'Nenhuma movimentação encontrada'}</td></tr>
            ) : movements.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/70 transition">
                <td className="px-4 py-3 text-slate-500">{m.date}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{m.itemName}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{m.lotNumber}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${m.movementType === 'entrada' ? 'bg-emerald-100 text-emerald-800' : m.movementType === 'saida' ? 'bg-amber-100 text-amber-800' : m.movementType === 'ajuste' ? 'bg-blue-100 text-blue-800' : m.movementType === 'perda' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                    {moveLabel(m.movementType)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold">{m.quantity}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-500">{GS(m.unitCost)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{GS(m.totalCost)}</td>
                <td className="px-4 py-3 text-[10px] text-slate-600 max-w-[120px] truncate">{m.patientName || m.supplierName || m.sector || m.doctorName || '-'}</td>
                <td className="px-4 py-3 text-[10px] text-slate-500">{m.operatorName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center"><ClipboardList className="w-5 h-5 text-white" /></div>
          <div><h3 className="font-black text-slate-800 text-sm">{t('pharm_inventory_title', 'app')}</h3><p className="text-[10px] text-slate-500">{t('pharm_inventory_subtitle', 'app')}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <h4 className="font-bold text-slate-700 text-xs">{t('pharm_inventory_register', 'app')}</h4>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_name', 'app')}</label>
                <select value={invItemId} onChange={e => setInvItemId(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs">
                  <option value="">{t('pharm_modal_select', 'app')}</option>
                  {pharmacyItems.map(i => <option key={i.id} value={i.id}>{i.name} ({t('pharm_item_total', 'app')}: {i.totalQuantity})</option>)}
                </select>
              </div>
              {invItemId && (
                <>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_lot_lot', 'app')}</label>
                    <select value={invLotId} onChange={e => setInvLotId(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs">
                      <option value="">{t('pharm_modal_select', 'app')}</option>
                      {pharmacyItems.find(i => i.id === invItemId)?.lots.filter(l => l.quantity > 0).map(l => (
                        <option key={l.id} value={l.id}>{l.lotNumber} ({t('pharm_lot_qty', 'app')}: {l.quantity}, {t('pharm_lot_expiry', 'app')}: {l.expiryDate})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_inventory_counted', 'app')}</label>
                    <div className="flex gap-2">
                      <input type="number" value={invCounted} onChange={e => setInvCounted(Number(e.target.value))} className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="0" />
                      <button onClick={handleInventorySubmit} disabled={!invItemId || !invLotId} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center gap-2"><QrCode className="w-4 h-4" /> {t('pharm_inventory_register', 'app')}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2 text-[10px] text-cyan-800">
              <p className="font-bold flex items-center gap-1"><QrCode className="w-3 h-3" /> {t('pharm_inventory_scanner', 'app')}</p>
              <p>{t('pharm_inventory_scanner_hint', 'app')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 text-xs">{t('pharm_inventory_history', 'app')}</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {inventoryCounts.map(inv => (
                <div key={inv.id} className="border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">{inv.date} - {inv.operatorName}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${inv.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' : inv.status === 'em_andamento' ? 'bg-amber-100 text-amber-800' : inv.status === 'programado' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>{inv.status}</span>
                  </div>
                  {inv.items.length > 0 && (
                    <div className="space-y-1">
                      {inv.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-slate-600">{it.itemName} - Lote {it.lotNumber}</span>
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-slate-400">{t('pharm_inventory_expected', 'app')} {it.expectedQuantity}</span>
                            <span className="font-bold">{t('pharm_inventory_counted_label', 'app')} {it.countedQuantity}</span>
                            <span className={`font-bold ${it.difference !== 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{it.difference !== 0 ? `${it.difference > 0 ? '+' : ''}${it.difference}` : 'ok'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {inv.notes && <p className="text-[9px] text-slate-400 italic">{inv.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-5">
      {/* Low Stock */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-600" /> {t('pharm_alert_stock_low_title', 'app')} ({lowStockItems.length})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
              <th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_item_total', 'app')}</th>
              <th className="px-4 py-2.5 text-right">{t('pharm_item_minimum', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_movement_qty', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_item_location', 'app')}</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {lowStockItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">{item.totalQuantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{item.minQuantity}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">{item.totalQuantity - item.minQuantity}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-600">{item.storageLocation}</td>
                </tr>
              ))}
              {lowStockItems.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">{t('pharm_alert_no_low_stock', 'app')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expiring */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /> {t('pharm_alert_expiring_title', 'app')}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
              <th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th>
              <th className="px-4 py-2.5 text-right">{t('pharm_lot_qty', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_lot_expiry', 'app')}</th>
              <th className="px-4 py-2.5 text-center">{t('pharm_lot_status', 'app')}</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {pharmacyItems.flatMap(item =>
                item.lots.filter(l => { const d = daysUntil(l.expiryDate); return d > 0 && d <= 90 && l.quantity > 0; }).map(lot => (
                  <tr key={lot.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{lot.lotNumber}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{lot.quantity}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{lot.expiryDate}</td>
                    <td className="px-4 py-3">{expiryBadge(lot.expiryDate, t)}</td>
                  </tr>
                ))
              )}
              {expiringItems.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">{t('pharm_alert_no_expiring', 'app')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expired */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><X className="w-4 h-4 text-rose-600" /> {t('pharm_alert_expired_title', 'app')} ({expiredItems.reduce((s, i) => s + i.lots.filter(l => daysUntil(l.expiryDate) <= 0 && l.quantity > 0).length, 0)} {t('pharm_lot_lot', 'app').toLowerCase()}s)</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
              <th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th>
              <th className="px-4 py-2.5 text-right">{t('pharm_lot_qty', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_lot_expiry', 'app')}</th>
              <th className="px-4 py-2.5 text-left">{t('pharm_lot_write_off', 'app')}</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {pharmacyItems.flatMap(item =>
                item.lots.filter(l => daysUntil(l.expiryDate) <= 0 && l.quantity > 0).map(lot => (
                  <tr key={lot.id} className="hover:bg-slate-50/70 transition bg-rose-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{lot.lotNumber}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">{lot.quantity}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{lot.expiryDate}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => {
                        if (!canPerformStock) { alert(t('pharm_perm_denied_write_off', 'app')); return; }
                        setPharmacyItems(prev => prev.map(i => i.id === item.id ? {
                          ...i,
                          lots: i.lots.map(l => l.id === lot.id ? { ...l, status: 'vencido' as const, quantity: 0 } : l),
                          totalQuantity: i.totalQuantity - lot.quantity,
                        } : i));
                        supabase.from('lot_controls').update({ status: 'vencido', quantity: 0 }).eq('id', lot.id)
                          .then(({ error }) => { if (error) console.warn('lot_controls expired update error:', error.message); });
                        supabase.from('pharmacy_items').update({ total_quantity: item.totalQuantity - lot.quantity })
                          .eq('id', item.id)
                          .then(({ error }) => { if (error) console.warn('pharmacy_items expired update error:', error.message); });
                        const lossId = `mov_${Date.now()}`;
                        setMovements(prev => [{
                          id: lossId, itemId: item.id, itemName: item.name,
                          lotId: lot.id, lotNumber: lot.lotNumber, movementType: 'perda',
                          quantity: lot.quantity, unitCost: lot.costPerUnit, totalCost: lot.quantity * lot.costPerUnit,
                          date: new Date().toISOString().split('T')[0], operatorName: 'Operador',
                          notes: 'Lote vencido - baixa automática',
                        }, ...prev]);
                        supabase.from('stock_movements').insert({
                          id: lossId, item_id: item.id, item_name: item.name,
                          lot_id: lot.id, lot_number: lot.lotNumber, movement_type: 'perda',
                          quantity: lot.quantity, unit_cost: lot.costPerUnit,
                          total_cost: lot.quantity * lot.costPerUnit,
                          date: new Date().toISOString().split('T')[0], operator_name: 'Operador',
                          notes: 'Lote vencido - baixa automática',
                        }).then(({ error }) => { if (error) console.warn('stock_movements loss insert error:', error.message); });
                        addAuditLog('Baixa Lote Vencido', `${item.name} ${lot.lotNumber}`);
                      }} className="text-[10px] px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg transition">{t('pharm_lot_write_off', 'app')}</button>
                    </td>
                  </tr>
                ))
              )}
              {expiredItems.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">{t('pharm_alert_no_expired', 'app')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => {
    const consumptionByPatient = movements.filter(m => m.movementType === 'saida' && m.patientName);
    const bySector = movements.filter(m => m.movementType === 'saida' && m.sector);
    const totalCost = movements.reduce((s, m) => s + m.totalCost, 0);
    const totalConsumed = movements.filter(m => m.movementType === 'saida').reduce((s, m) => s + m.quantity, 0);
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-400">{t('pharm_report_consumed', 'app')}</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalConsumed}</p>
            <p className="text-[10px] text-slate-500">{t('pharm_report_units', 'app')}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-400">{t('pharm_report_total_cost', 'app')}</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{GS(totalCost)}</p>
            <p className="text-[10px] text-slate-500">{t('pharm_report_all_movements', 'app')}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase text-slate-400">{t('pharm_report_distinct_items', 'app')}</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{pharmacyItems.length}</p>
            <p className="text-[10px] text-slate-500">{t('pharm_report_in_stock', 'app')}</p>
          </div>
        </div>

        {/* Consumption by patient */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><User className="w-4 h-4 text-indigo-600" /> {t('pharm_report_by_patient', 'app')}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">{t('pharm_exit_patient', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th>
                <th className="px-4 py-2.5 text-right">{t('pharm_movement_qty', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_movement_total_cost', 'app')}</th>
                <th className="px-4 py-2.5 text-left">{t('pharm_exit_procedure', 'app')}</th><th className="px-4 py-2.5 text-left">{t('date', 'app')}</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {consumptionByPatient.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.patientName}</td>
                    <td className="px-4 py-3 text-slate-600">{m.itemName}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{m.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">{GS(m.totalCost)}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{m.procedureName || '-'}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{m.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consumption by sector */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-600" /> {t('pharm_report_by_sector', 'app')}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">{t('pharm_exit_sector', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th>
                <th className="px-4 py-2.5 text-right">{t('pharm_movement_qty', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_movement_total_cost', 'app')}</th>
                <th className="px-4 py-2.5 text-left">{t('pharm_report_period', 'app')}</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {bySector.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.sector}</td>
                    <td className="px-4 py-3 text-slate-600">{m.itemName}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{m.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">{GS(m.totalCost)}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{m.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─── Pharmacovigilance Content ────────────────────────────────────────────────
  const renderPharmacovigilance = () => (
    <div className="space-y-5">
      {/* Alert summary */}
      {totalPvAlerts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <MessageSquareWarning className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 font-semibold">{t('pharm_dashboard_pv_count', 'app').replace('{count}', String(totalPvAlerts))}</p>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {[
          { id: 'events' as const, label: t('pharm_pv_tab_ram', 'app'), icon: HeartPulse },
          { id: 'deviations' as const, label: t('pharm_pv_tab_deviations', 'app'), icon: FlaskRound },
          { id: 'recalls' as const, label: t('pharm_pv_tab_recalls', 'app'), icon: RotateCcw },
        ].map(st => {
          const Icon = st.icon;
          return (
            <button key={st.id} onClick={() => setPvTab(st.id)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 ${pvTab === st.id ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Icon className="w-3.5 h-3.5" /> {st.label}
            </button>
          );
        })}
      </div>

      {/* RAM Events */}
      {pvTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-black text-slate-800 text-sm">{t('pharm_pv_ae_list', 'app')} ({adverseEvents.length})</h4>
            <button onClick={() => setShowAeForm(true)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> {t('pharm_pv_ae_new', 'app')}</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                  <th className="px-3 py-2.5 text-left">{t('pharm_pv_ae_patient', 'app')}</th><th className="px-3 py-2.5 text-left">{t('pharm_pv_ae_medication', 'app')}</th>
                  <th className="px-3 py-2.5 text-left">{t('pharm_pv_ae_reaction', 'app')}</th><th className="px-3 py-2.5 text-center">{t('pharm_pv_ae_severity', 'app')}</th>
                  <th className="px-3 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th><th className="px-3 py-2.5 text-left">{t('pharm_pv_ae_notifier', 'app')}</th>
                  <th className="px-3 py-2.5 text-center">{t('pharm_pv_ae_status', 'app')}</th><th className="px-3 py-2.5 text-left">{t('pharm_pv_ae_protocol', 'app')}</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {adverseEvents.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-3 py-3 font-semibold text-slate-800">{ev.patientName}</td>
                      <td className="px-3 py-3 text-slate-700">{ev.medicationName}</td>
                      <td className="px-3 py-3 text-slate-600 max-w-[180px] truncate" title={ev.adverseReaction}>{ev.adverseReaction}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${ev.severity === 'leve' ? 'bg-emerald-100 text-emerald-800' : ev.severity === 'moderada' ? 'bg-amber-100 text-amber-800' : ev.severity === 'grave' ? 'bg-rose-100 text-rose-800' : 'bg-red-100 text-red-800'}`}>{t(`pharm_severity_${ev.severity}`, 'app')}</span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[10px] text-slate-500">{ev.lotNumber}</td>
                      <td className="px-3 py-3 text-[10px] text-slate-600">{ev.notifierName}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${ev.status === 'notificado' ? 'bg-amber-100 text-amber-800' : ev.status === 'em_analise' ? 'bg-blue-100 text-blue-800' : ev.status === 'arquivado' ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-600'}`}>{ev.status}</span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[9px] text-slate-500">{ev.dinavisaProtocol || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[10px] text-rose-800">
            <p className="font-bold flex items-center gap-1"><Info className="w-3 h-3" /> {t('pharm_pv_ae_notify_rule', 'app')}</p>
            <p className="mt-0.5">{t('pharm_pv_ae_resolution', 'app')}</p>
          </div>
        </div>
      )}

      {/* Quality Deviations */}
      {pvTab === 'deviations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-black text-slate-800 text-sm">{t('pharm_pv_qd_list', 'app')} ({qualityDeviations.length})</h4>
            <button onClick={() => setShowQdForm(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> {t('pharm_pv_qd_new', 'app')}</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                  <th className="px-3 py-2.5 text-left">{t('pharm_item_name', 'app')}</th><th className="px-3 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th>
                  <th className="px-3 py-2.5 text-left">{t('pharm_pv_qd_type', 'app')}</th><th className="px-3 py-2.5 text-center">{t('pharm_pv_ae_severity', 'app')}</th>
                  <th className="px-3 py-2.5 text-right">{t('pharm_lot_qty', 'app')}</th><th className="px-3 py-2.5 text-center">{t('status', 'app')}</th>
                  <th className="px-3 py-2.5 text-left">{t('date', 'app')}</th><th className="px-3 py-2.5 text-center">{t('pharm_pv_qd_resolve', 'app')}</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {qualityDeviations.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-3 py-3 font-semibold text-slate-800">{d.itemName}</td>
                      <td className="px-3 py-3 font-mono text-slate-600">{d.lotNumber}</td>
                      <td className="px-3 py-3 text-[10px] text-slate-600 capitalize">{t(`pharm_qd_type_${d.deviationType}`, 'app')}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${d.severity === 'leve' ? 'bg-emerald-100 text-emerald-800' : d.severity === 'moderada' ? 'bg-amber-100 text-amber-800' : d.severity === 'grave' ? 'bg-rose-100 text-rose-800' : 'bg-red-100 text-red-800'}`}>{t(`pharm_severity_${d.severity}`, 'app')}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold">{d.affectedQuantity}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${d.status === 'aberto' ? 'bg-rose-100 text-rose-800' : d.status === 'investigacao' ? 'bg-amber-100 text-amber-800' : d.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{d.status}</span>
                      </td>
                      <td className="px-3 py-3 text-[10px] text-slate-500">{d.reportDate}</td>
                      <td className="px-3 py-3 text-center">
                        {d.status === 'aberto' || d.status === 'investigacao' ? (
                          <button onClick={() => handleResolveDeviation(d.id)} className="text-[9px] px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg">{t('pharm_pv_qd_resolve', 'app')}</button>
                        ) : <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Batch Recalls */}
      {pvTab === 'recalls' && (
        <div className="space-y-4">
          <h4 className="font-black text-slate-800 text-sm">{t('pharm_pv_recall_list', 'app')} ({batchRecalls.length})</h4>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                  <th className="px-3 py-2.5 text-left">{t('pharm_item_name', 'app')}</th><th className="px-3 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th>
                  <th className="px-3 py-2.5 text-left">{t('pharm_pv_recall_type', 'app')}</th><th className="px-3 py-2.5 text-left">{t('pharm_pv_recall_reason', 'app')}</th>
                  <th className="px-3 py-2.5 text-center">{t('pharm_pv_recall_risk', 'app')}</th><th className="px-3 py-2.5 text-right">{t('pharm_pv_recall_affected', 'app')}</th>
                  <th className="px-3 py-2.5 text-right">{t('pharm_pv_recall_collected', 'app')}</th><th className="px-3 py-2.5 text-center">{t('status', 'app')}</th>
                  <th className="px-3 py-2.5 text-left">{t('date', 'app')}</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {batchRecalls.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-3 py-3 font-semibold text-slate-800">{r.itemName}</td>
                      <td className="px-3 py-3 font-mono text-slate-700">{r.lotNumber}</td>
                      <td className="px-3 py-3 text-[10px] text-slate-600 capitalize">{t(`pharm_recall_type_${r.recallType}`, 'app')}</td>
                      <td className="px-3 py-3 text-[10px] text-slate-600 max-w-[150px] truncate" title={r.reason}>{r.reason}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${r.riskLevel === 'baixo' ? 'bg-emerald-100 text-emerald-800' : r.riskLevel === 'medio' ? 'bg-amber-100 text-amber-800' : r.riskLevel === 'alto' ? 'bg-rose-100 text-rose-800' : 'bg-red-100 text-red-800'}`}>{t(`pharm_risk_${r.riskLevel}`, 'app')}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold">{r.affectedQuantity}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-700">{r.recollectedQuantity}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${r.status === 'ativo' ? 'bg-rose-100 text-rose-800' : r.status === 'monitoramento' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{r.status}</span>
                      </td>
                      <td className="px-3 py-3 text-[10px] text-slate-500">{r.alertDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {batchRecalls.filter(r => r.status === 'ativo').length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[10px] text-red-800">
              <p className="font-bold flex items-center gap-1"><TriangleAlert className="w-3.5 h-3.5" /> {t('pharm_pv_recall_warning', 'app')}</p>
              <p>{t('pharm_pv_recall_instructions', 'app')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ─── Adverse Event Modal ─────────────────────────────────────────────────────
  const AeModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAeForm(false)}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-rose-700 to-pink-700 text-white p-4">
          <p className="text-xs font-bold uppercase tracking-widest opacity-75">{t('pharm_pv_title', 'app')}</p>
          <h3 className="font-black text-lg mt-0.5">{t('pharm_pv_ae_new', 'app')}</h3>
        </div>
        <form onSubmit={handleNewAdverseEvent} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_patient', 'app')} *</label>
              <input list="ae-patients" value={aePatient} onChange={e => setAePatient(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_pv_ae_patient', 'app')} />
              <datalist id="ae-patients">{patients.map((p: any) => <option key={p.id} value={p.name} />)}</datalist>
            </div>
            <div className="col-span-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_medication', 'app')} *</label>
              <input value={aeMedication} onChange={e => setAeMedication(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_pv_ae_medication', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_name', 'app')}</label>
              <select value={aeItemId} onChange={e => { setAeItemId(e.target.value); setAeLotId(''); }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">{t('pharm_modal_select', 'app')}</option>
                {pharmacyItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_lot_lot', 'app')}</label>
              <select value={aeLotId} onChange={e => setAeLotId(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">{t('pharm_modal_select', 'app')}</option>
                {pharmacyItems.find(i => i.id === aeItemId)?.lots.map(l => (
                  <option key={l.id} value={l.id}>{l.lotNumber}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_reaction', 'app')} *</label>
              <input value={aeReaction} onChange={e => setAeReaction(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_pv_ae_reaction', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_severity', 'app')}</label>
              <select value={aeSeverity} onChange={e => setAeSeverity(e.target.value as AdverseEventSeverity)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="leve">{t('pharm_severity_leve', 'app')}</option><option value="moderada">{t('pharm_severity_moderada', 'app')}</option>
                <option value="grave">{t('pharm_severity_grave', 'app')}</option><option value="fatal">{t('pharm_severity_fatal', 'app')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_outcome', 'app')}</label>
              <select value={aeOutcome} onChange={e => setAeOutcome(e.target.value as AdverseEventOutcome)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="recuperado">{t('pharm_outcome_recuperado', 'app')}</option><option value="recuperando">{t('pharm_outcome_recuperando', 'app')}</option>
                <option value="nao_recuperado">{t('pharm_outcome_nao_recuperado', 'app')}</option><option value="obito">{t('pharm_outcome_obito', 'app')}</option>
                <option value="desconhecido">{t('pharm_outcome_desconhecido', 'app')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_start_date', 'app')}</label>
              <input type="date" value={aeStart} onChange={e => setAeStart(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_notifier', 'app')}</label>
              <input value={aeNotifier} onChange={e => setAeNotifier(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_pv_ae_notifier_name', 'app')} />
            </div>
            <div className="col-span-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_description', 'app')} *</label>
              <textarea value={aeDescription} onChange={e => setAeDescription(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" rows={3} placeholder={t('pharm_pv_ae_description', 'app')} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={!aePatient.trim() || !aeMedication.trim() || !aeReaction.trim() || !aeDescription.trim()}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition">{t('pharm_pv_ae_register', 'app')}</button>
            <button type="button" onClick={() => setShowAeForm(false)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">{t('pharm_modal_cancel', 'app')}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── Quality Deviation Modal ─────────────────────────────────────────────────
  const QdModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowQdForm(false)}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 text-white p-4">
          <p className="text-xs font-bold uppercase tracking-widest opacity-75">{t('pharm_pv_qd_type', 'app')}</p>
          <h3 className="font-black text-lg mt-0.5">{t('pharm_pv_qd_new', 'app')}</h3>
        </div>
        <form onSubmit={handleNewQualityDeviation} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_name', 'app')} *</label>
              <select value={qdItemId} onChange={e => { setQdItemId(e.target.value); setQdLotId(''); }} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">{t('pharm_modal_select', 'app')}</option>
                {pharmacyItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_lot_lot', 'app')} *</label>
              <select value={qdLotId} onChange={e => setQdLotId(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">{t('pharm_modal_select', 'app')}</option>
                {pharmacyItems.find(i => i.id === qdItemId)?.lots.map(l => (
                  <option key={l.id} value={l.id}>{l.lotNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_qd_type', 'app')}</label>
              <select value={qdType} onChange={e => setQdType(e.target.value as QualityDeviation['deviationType'])} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="quebra">{t('pharm_qd_type_quebra', 'app')}</option><option value="contaminacao">{t('pharm_qd_type_contaminacao', 'app')}</option>
                <option value="rotulagem">{t('pharm_qd_type_rotulagem', 'app')}</option><option value="embalagem">{t('pharm_qd_type_embalagem', 'app')}</option>
                <option value="esterilidade">{t('pharm_qd_type_esterilidade', 'app')}</option><option value="potencia">{t('pharm_qd_type_potencia', 'app')}</option>
                <option value="outro">{t('pharm_qd_type_outro', 'app')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_severity', 'app')}</label>
              <select value={qdSeverity} onChange={e => setQdSeverity(e.target.value as AdverseEventSeverity)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="leve">{t('pharm_severity_leve', 'app')}</option><option value="moderada">{t('pharm_severity_moderada', 'app')}</option>
                <option value="grave">{t('pharm_severity_grave', 'app')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_lot_qty', 'app')}</label>
              <input type="number" value={qdQty || ''} onChange={e => setQdQty(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_notifier', 'app')}</label>
              <input value={qdReporter} onChange={e => setQdReporter(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_pv_ae_description', 'app')} *</label>
              <textarea value={qdDesc} onChange={e => setQdDesc(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" rows={3} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={!qdItemId || !qdLotId || !qdDesc.trim()}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition">{t('pharm_pv_qd_new', 'app')}</button>
            <button type="button" onClick={() => setShowQdForm(false)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">{t('pharm_modal_cancel', 'app')}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── Entry Form Modal ──────────────────────────────────────────────────────────
  const EntryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowEntryForm(false)}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-4">
          <p className="text-xs font-bold uppercase tracking-widest opacity-75">{t('pharm_entry_title', 'app')}</p>
          <h3 className="font-black text-lg mt-0.5">{t('pharm_entry_register', 'app')}</h3>
        </div>
        <form onSubmit={handleEntry} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_name', 'app')} *</label>
              <select value={entryItemId} onChange={e => setEntryItemId(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">{t('pharm_modal_select', 'app')}</option>
                {pharmacyItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_entry_lot', 'app')} *</label>
              <input value={entryLotNumber} onChange={e => setEntryLotNumber(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_entry_lot', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_entry_serial', 'app')}</label>
              <input value={entrySerial} onChange={e => setEntrySerial(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_entry_serial', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_entry_qty', 'app')} *</label>
              <input type="number" value={entryQty || ''} onChange={e => setEntryQty(Number(e.target.value))} required min={1} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_entry_cost', 'app')}</label>
              <input type="number" value={entryCost || ''} onChange={e => setEntryCost(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_entry_expiry', 'app')} *</label>
              <input type="date" value={entryExpiry} onChange={e => setEntryExpiry(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_entry_mfg', 'app')}</label>
              <input type="date" value={EntryMfg} onChange={e => setEntryMfg(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_entry_dte', 'app')}</label>
              <input value={entryDte} onChange={e => setEntryDte(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_entry_dte', 'app')} />
            </div>
            <div className="col-span-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_entry_supplier', 'app')}</label>
              <input value={entrySupplier} onChange={e => setEntrySupplier(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_entry_supplier', 'app')} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" data-testid="entry-register-submit" aria-label={t('pharm_entry_register', 'app')} disabled={!entryItemId || !entryQty || !entryLotNumber} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition">{t('pharm_entry_register', 'app')}</button>
            <button type="button" data-testid="entry-register-cancel" aria-label={t('pharm_modal_cancel', 'app')} onClick={() => setShowEntryForm(false)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">{t('pharm_modal_cancel', 'app')}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── Exit Form Modal ───────────────────────────────────────────────────────────
  const ExitModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowExitForm(false)}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 text-white p-4">
          <p className="text-xs font-bold uppercase tracking-widest opacity-75">{t('pharm_exit_title', 'app')}</p>
          <h3 className="font-black text-lg mt-0.5">{t('pharm_exit_register', 'app')}</h3>
        </div>
        <form onSubmit={handleExit} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_name', 'app')} *</label>
              <select value={exitItemId} onChange={e => { setExitItemId(e.target.value); setExitLotId(''); }} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">{t('pharm_modal_select', 'app')}</option>
                {pharmacyItems.filter(i => i.totalQuantity > 0).map(i => <option key={i.id} value={i.id}>{i.name} ({t('pharm_lot_status_disponivel', 'app').toLowerCase()}: {i.totalQuantity})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_lot_lot', 'app')} *</label>
              <select value={exitLotId} onChange={e => setExitLotId(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">{t('pharm_modal_select', 'app')}</option>
                {pharmacyItems.find(i => i.id === exitItemId)?.lots.filter(l => l.quantity > 0).map(l => (
                  <option key={l.id} value={l.id}>{l.lotNumber} ({t('pharm_lot_status_disponivel', 'app').toLowerCase()}: {l.quantity}, {t('pharm_lot_expiry', 'app').toLowerCase()}: {l.expiryDate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_exit_qty', 'app')} *</label>
              <input type="number" value={exitQty || ''} onChange={e => setExitQty(Number(e.target.value))} required min={1} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_exit_patient', 'app')}</label>
              <input list="exit-patients" value={exitPatient} onChange={e => setExitPatient(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_exit_patient', 'app')} />
              <datalist id="exit-patients">{patients.map((p: any) => <option key={p.id} value={p.name} />)}</datalist>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_exit_procedure', 'app')}</label>
              <input value={exitProcedure} onChange={e => setExitProcedure(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_exit_procedure', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_exit_sector', 'app')}</label>
              <input value={exitSector} onChange={e => setExitSector(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_exit_sector', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_exit_room', 'app')}</label>
              <input value={exitRoom} onChange={e => setExitRoom(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_exit_room', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_exit_doctor', 'app')}</label>
              <input value={exitDoctor} onChange={e => setExitDoctor(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_exit_doctor', 'app')} />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_exit_notes', 'app')}</label>
            <textarea value={exitNotes} onChange={e => setExitNotes(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" data-testid="exit-register-submit" aria-label={t('pharm_exit_register', 'app')} disabled={!exitItemId || !exitLotId || !exitQty} className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition">{t('pharm_exit_register', 'app')}</button>
            <button type="button" data-testid="exit-register-cancel" aria-label={t('pharm_modal_cancel', 'app')} onClick={() => setShowExitForm(false)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">{t('pharm_modal_cancel', 'app')}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── New Item Modal ────────────────────────────────────────────────────────────
  const NewItemModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowNewItemForm(false)}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-4">
          <p className="text-xs font-bold uppercase tracking-widest opacity-75">{t('pharm_item_new', 'app')}</p>
          <h3 className="font-black text-lg mt-0.5">{t('pharm_item_list_title', 'app')}</h3>
        </div>
        <form onSubmit={handleNewItem} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_name', 'app')} *</label>
              <input value={newItemName} onChange={e => setNewItemName(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_item_name', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_category', 'app')} *</label>
              <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value as DrugCategory)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                {(['venda_livre','sob_receita','controlado','entorpecente','psicotropico','uso_hospitalar','biologico','insumo','descartavel','material'] as DrugCategory[]).map(key => <option key={key} value={key}>{catLabel(key)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_form', 'app')}</label>
              <select value={newItemForm} onChange={e => setNewItemForm(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="comprimido">{t('pharm_form_comprimido', 'app')}</option><option value="capsula">{t('pharm_form_capsula', 'app')}</option>
                <option value="ampola">{t('pharm_form_ampola', 'app')}</option><option value="frasco">{t('pharm_form_frasco', 'app')}</option>
                <option value="seringa">{t('pharm_form_seringa', 'app')}</option><option value="spray">{t('pharm_form_spray', 'app')}</option>
                <option value="creme">{t('pharm_form_creme', 'app')}</option><option value="solucao">{t('pharm_form_solucao', 'app')}</option>
                <option value="po">{t('pharm_form_po', 'app')}</option><option value="outro">{t('pharm_form_outro', 'app')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_presentation', 'app')}</label>
              <input value={newItemPresentation} onChange={e => setNewItemPresentation(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_item_presentation', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_manufacturer', 'app')}</label>
              <input value={newItemManufacturer} onChange={e => setNewItemManufacturer(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_dinavisa', 'app')} *</label>
              <input value={newItemDinavisa} onChange={e => setNewItemDinavisa(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder={t('pharm_item_dinavisa', 'app')} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_initial_qty', 'app')}</label>
              <input type="number" value={newItemQty || ''} onChange={e => setNewItemQty(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_min_qty', 'app')}</label>
              <input type="number" value={newItemMin || ''} onChange={e => setNewItemMin(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_storage', 'app')}</label>
              <input value={newItemLocation} onChange={e => setNewItemLocation(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_unit_cost', 'app')}</label>
              <input type="number" value={newItemCost || ''} onChange={e => setNewItemCost(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{t('pharm_item_unit_price', 'app')}</label>
              <input type="number" value={newItemPrice || ''} onChange={e => setNewItemPrice(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" data-testid="new-item-submit" aria-label={t('pharm_modal_register', 'app')} disabled={!newItemName.trim() || !newItemDinavisa.trim()} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition">{t('pharm_modal_register', 'app')}</button>
            <button type="button" data-testid="new-item-cancel" aria-label={t('pharm_modal_cancel', 'app')} onClick={() => setShowNewItemForm(false)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">{t('pharm_modal_cancel', 'app')}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── Main navigation tabs ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard' as const, label: t('pharm_tab_dashboard', 'app'), icon: BarChart3 },
    { id: 'items' as const, label: t('pharm_tab_items', 'app'), icon: Pill },
    { id: 'lots' as const, label: t('pharm_tab_lots', 'app'), icon: Package },
    { id: 'movements' as const, label: t('pharm_tab_movements', 'app'), icon: TrendingUpDown },
    { id: 'entries' as const, label: t('pharm_tab_entries', 'app'), icon: Truck },
    { id: 'exits' as const, label: t('pharm_tab_exits', 'app'), icon: Syringe },
    { id: 'inventory' as const, label: t('pharm_tab_inventory', 'app'), icon: ClipboardList },
    { id: 'alerts' as const, label: `${t('pharm_tab_alerts', 'app')}${totalAlerts > 0 ? ` (${totalAlerts})` : ''}`, icon: AlertTriangle },
    { id: 'reports' as const, label: t('pharm_tab_reports', 'app'), icon: BarChart3 },
    { id: 'pharmacovigilance' as const, label: `${t('pharm_tab_pv', 'app')}${totalPvAlerts > 0 ? ` (${totalPvAlerts})` : ''}`, icon: Activity },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Pill className="w-5 h-5 text-white" /></div>
          <div>
            <h3 className="font-black text-slate-800 text-base">{t('stock_pharmacy', 'app')}</h3>
            <p className="text-[10px] text-slate-500">{t('pharm_dashboard_subtitle', 'app')}</p>
          </div>
          {totalAlerts > 0 && (
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> {totalAlerts} {t('pharm_tab_alerts', 'app')}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(tabItem => {
            const Icon = tabItem.icon;
            const isActive = tab === tabItem.id;
            const isAlertsTab = tabItem.id === 'alerts';
            return (
              <button
                key={tabItem.id}
                data-testid={`pharm-tab-${tabItem.id}`}
                aria-label={tabItem.label}
                onClick={() => setTab(tabItem.id)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isAlertsTab && totalAlerts > 0
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tabItem.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'items' && renderItems()}
        {tab === 'lots' && renderLots()}
        {tab === 'movements' && renderMovements()}
        {tab === 'entries' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button data-testid="open-entry-form" aria-label={t('pharm_entry_title', 'app')} onClick={() => setShowEntryForm(true)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> {t('pharm_entry_title', 'app')}</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm">{t('pharm_entry_list', 'app')}</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">{t('date', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th>
                    <th className="px-4 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_movement_qty', 'app')}</th>
                    <th className="px-4 py-2.5 text-right">{t('pharm_movement_total_cost', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_entry_dte', 'app')}</th>
                    <th className="px-4 py-2.5 text-left">{t('pharm_lot_supplier', 'app')}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {movements.filter(m => m.movementType === 'entrada').length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">{t('pharm_no_entries', 'app') || 'Nenhuma entrada registrada'}</td></tr>
                    ) : movements.filter(m => m.movementType === 'entrada').map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 text-slate-500">{m.date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{m.itemName}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{m.lotNumber}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{m.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{GS(m.totalCost)}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{m.dteNumber || '-'}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-600">{m.supplierName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {tab === 'exits' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button data-testid="open-exit-form" aria-label={t('pharm_exit_title', 'app')} onClick={() => setShowExitForm(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> {t('pharm_exit_title', 'app')}</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100"><h4 className="font-black text-slate-800 text-sm">{t('pharm_exit_list', 'app')}</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left">{t('date', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_item_name', 'app')}</th>
                    <th className="px-4 py-2.5 text-left">{t('pharm_lot_lot', 'app')}</th><th className="px-4 py-2.5 text-right">{t('pharm_movement_qty', 'app')}</th>
                    <th className="px-4 py-2.5 text-left">{t('pharm_exit_patient', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_exit_procedure', 'app')}</th>
                    <th className="px-4 py-2.5 text-left">{t('pharm_exit_sector', 'app')}</th><th className="px-4 py-2.5 text-left">{t('pharm_exit_doctor', 'app')}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {movements.filter(m => m.movementType === 'saida').length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400">{t('pharm_no_exits', 'app') || 'Nenhuma saída registrada'}</td></tr>
                    ) : movements.filter(m => m.movementType === 'saida').map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 text-slate-500">{m.date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{m.itemName}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{m.lotNumber}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{m.quantity}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-600">{m.patientName || '-'}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-600">{m.procedureName || '-'}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-600">{m.sector || '-'}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-600">{m.doctorName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {tab === 'inventory' && renderInventory()}
        {tab === 'alerts' && renderAlerts()}
        {tab === 'reports' && renderReports()}
        {tab === 'pharmacovigilance' && renderPharmacovigilance()}
      </div>

      {/* Modals */}
      {showNewItemForm && <NewItemModal />}
      {showEntryForm && <EntryModal />}
      {showExitForm && <ExitModal />}
      {showAeForm && <AeModal />}
      {showQdForm && <QdModal />}
    </div>
  );
}
