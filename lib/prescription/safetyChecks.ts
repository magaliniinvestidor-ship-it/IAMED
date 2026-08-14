import { supabase } from '@/lib/supabaseClient';

export type SafetySeverity = 'leve' | 'moderada' | 'grave' | 'contraindicado';

export interface SafetyAlert {
  id: string;
  type: 'interaction' | 'allergy';
  severity: SafetySeverity;
  drugName: string;
  otherName: string;
  message: string;
  recommendation?: string;
}

export interface SafetyItem {
  drugName: string;
  activeIngredient: string;
  snomedCode?: string | null;
  prescriptionType?: string;
}

export interface DrugInteractionRow {
  id: string;
  drug_a: string;
  drug_b: string;
  drug_a_ingredient: string | null;
  drug_b_ingredient: string | null;
  severity: SafetySeverity;
  description: string | null;
  recommendation: string | null;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ');
}

export async function checkInteractions(items: SafetyItem[]): Promise<SafetyAlert[]> {
  if (items.length < 2 || !supabase) return [];

  const ingredients = items
    .map(i => (i.activeIngredient || i.drugName || '').trim())
    .filter(Boolean);

  if (ingredients.length < 2) return [];

  const { data, error } = await supabase
    .from('drug_interactions')
    .select('*')
    .in('drug_a_ingredient', ingredients)
    .in('drug_b_ingredient', ingredients);

  if (error || !data) return [];

  const alerts: SafetyAlert[] = [];
  (data as DrugInteractionRow[]).forEach(row => {
    const itemA = items.find(i =>
      (i.activeIngredient || i.drugName).toLowerCase() === row.drug_a_ingredient?.toLowerCase() ||
      (i.activeIngredient || i.drugName).toLowerCase() === row.drug_a?.toLowerCase()
    );
    const itemB = items.find(i =>
      (i.activeIngredient || i.drugName).toLowerCase() === row.drug_b_ingredient?.toLowerCase() ||
      (i.activeIngredient || i.drugName).toLowerCase() === row.drug_b?.toLowerCase()
    );
    if (!itemA || !itemB) return;
    alerts.push({
      id: row.id,
      type: 'interaction',
      severity: row.severity,
      drugName: itemA.drugName,
      otherName: itemB.drugName,
      message: row.description || `${itemA.drugName} interage com ${itemB.drugName}.`,
      recommendation: row.recommendation || undefined,
    });
  });

  return alerts;
}

export function checkAllergies(allergies: string[], items: SafetyItem[]): SafetyAlert[] {
  if (!allergies.length || !items.length) return [];

  const allergens = allergies.map(a => normalize(a)).filter(Boolean);
  const alerts: SafetyAlert[] = [];

  items.forEach(item => {
    const haystack = normalize(`${item.drugName} ${item.activeIngredient} ${item.snomedCode || ''}`);
    allergens.forEach(allergen => {
      if (haystack.includes(allergen)) {
        alerts.push({
          id: `al_${allergen}_${item.drugName}`,
          type: 'allergy',
          severity: 'grave',
          drugName: item.drugName,
          otherName: allergen,
          message: `Alergia conhecida: ${item.drugName}`,
        });
      }
    });
  });

  return alerts;
}