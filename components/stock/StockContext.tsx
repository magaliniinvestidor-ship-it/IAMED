import type {
  PharmacyItem,
  LotControl,
  StockMovement,
  InventoryCount,
  AdverseEvent,
  QualityDeviation,
  BatchRecall,
  DrugCategory,
} from '@/lib/mockData';

export type {
  PharmacyItem,
  LotControl,
  StockMovement,
  InventoryCount,
  AdverseEvent,
  QualityDeviation,
  BatchRecall,
  DrugCategory,
};

export type StockSubTab =
  | 'items'
  | 'movements'
  | 'counts'
  | 'adverse'
  | 'quality'
  | 'recalls';

export interface EstoqueFarmaciaModuleProps {
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

export const GS = (v: number | null | undefined): string => {
  if (v == null) return 'Gs. 0';
  return `Gs. ${v.toLocaleString('es-PY')}`;
};

export const CATEGORY_COLORS: Record<DrugCategory, string> = {
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

export const CATEGORY_LABELS: Record<DrugCategory, string> = {
  venda_livre: 'Venda Livre',
  sob_receita: 'Sob Receita',
  controlado: 'Controlado',
  entorpecente: 'Entorpecente',
  psicotropico: 'Psicotrópico',
  uso_hospitalar: 'Uso Hospitalar',
  biologico: 'Biológico',
  insumo: 'Insumo',
  descartavel: 'Descartável',
  material: 'Material',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  perda: 'Perda',
  transferencia: 'Transferência',
  ajuste: 'Ajuste',
  vencimento: 'Vencimento',
  inventario: 'Inventário',
};

export const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  entrada: 'bg-emerald-100 text-emerald-800',
  saida: 'bg-rose-100 text-rose-800',
  perda: 'bg-orange-100 text-orange-800',
  transferencia: 'bg-blue-100 text-blue-800',
  ajuste: 'bg-amber-100 text-amber-800',
  vencimento: 'bg-slate-100 text-slate-800',
  inventario: 'bg-indigo-100 text-indigo-800',
};

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
