export interface PediatricDoseInput {
  weightKg: number;
  heightCm?: number;
  dosePerKgPerDay: number;
  dosesPerDay: number;
  maxDosePerDay?: number;
  maxDosePerDose?: number;
}

export interface PediatricDoseResult {
  dosePerDoseMg: number;
  totalPerDayMg: number;
  aboveMaxDaily?: boolean;
  aboveMaxPerDose?: boolean;
}

export interface PediatricDoseByBsaInput {
  bsaM2: number;
  dosePerM2PerDay: number;
  dosesPerDay: number;
  maxDosePerDay?: number;
}

export function calculateBodySurfaceArea(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  return Math.sqrt((heightCm * weightKg) / 3600);
}

export function calculatePediatricDoseByWeight(input: PediatricDoseInput): PediatricDoseResult {
  const dosePerKg = Number.isFinite(input.dosePerKgPerDay) && input.dosePerKgPerDay > 0 ? input.dosePerKgPerDay : 0;
  const weight = input.weightKg > 0 ? input.weightKg : 0;
  const dosesPerDay = input.dosesPerDay > 0 ? input.dosesPerDay : 1;

  const totalPerDayMg = dosePerKg * weight;
  const dosePerDoseMg = dosesPerDay > 0 ? totalPerDayMg / dosesPerDay : 0;

  return {
    dosePerDoseMg: round(dosePerDoseMg),
    totalPerDayMg: round(totalPerDayMg),
    aboveMaxDaily: input.maxDosePerDay != null && totalPerDayMg > input.maxDosePerDay,
    aboveMaxPerDose: input.maxDosePerDose != null && dosePerDoseMg > input.maxDosePerDose,
  };
}

export function calculatePediatricDoseByBsa(input: PediatricDoseByBsaInput): { dosePerDoseMg: number; totalPerDayMg: number } {
  const bsa = input.bsaM2 > 0 ? input.bsaM2 : 0;
  const dosePerM2 = input.dosePerM2PerDay > 0 ? input.dosePerM2PerDay : 0;
  const dosesPerDay = input.dosesPerDay > 0 ? input.dosesPerDay : 1;

  const totalPerDayMg = bsa * dosePerM2;
  return {
    dosePerDoseMg: round(totalPerDayMg / dosesPerDay),
    totalPerDayMg: round(totalPerDayMg),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}