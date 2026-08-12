import { classifyBmi, type BmiSex } from './bmiLms';

export type VitalColor = 'red' | 'orange' | 'yellow' | 'green';
export type BmiKind = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface VitalsBand {
  red: (...args: number[]) => boolean;
  orange: (...args: number[]) => boolean;
  yellow: (...args: number[]) => boolean;
}

export interface VitalsBands {
  labelKey: string;
  pa: VitalsBand;
  temp: VitalsBand;
  spo2: VitalsBand;
  fc: VitalsBand;
  fr: VitalsBand;
  bmi: VitalsBand;
}

const never = () => false;

const ADULT: VitalsBands = {
  labelKey: 'rcpt_vitals_adult',
  pa: {
    red: (sys: number, dia: number) =>
      sys < 90 || sys >= 180 || dia >= 110 || dia < 30,
    orange: (sys: number, dia: number) =>
      (sys >= 90 && sys <= 99) ||
      (sys >= 140 && sys <= 179) ||
      (dia >= 90 && dia <= 109) ||
      (dia >= 30 && dia <= 49),
    yellow: (sys: number, dia: number) =>
      (sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89),
  },
  temp: {
    red: (v: number) => v >= 41 || v <= 35,
    orange: (v: number) => v >= 39 && v <= 40.9,
    yellow: (v: number) => v >= 38 && v <= 38.9,
  },
  spo2: {
    red: (v: number) => v < 90,
    orange: (v: number) => v >= 90 && v <= 94,
    yellow: never,
  },
  fc: {
    red: (v: number) => v > 150 || v < 40,
    orange: (v: number) => (v >= 130 && v <= 150) || (v >= 40 && v <= 49),
    yellow: (v: number) => (v >= 101 && v <= 129) || (v >= 50 && v <= 59),
  },
  fr: {
    red: (v: number) => v > 30 || v < 8,
    orange: (v: number) => v >= 25 && v <= 30,
    yellow: (v: number) => (v >= 21 && v <= 24) || (v >= 8 && v <= 11),
  },
  bmi: {
    red: (v: number) => v >= 30,
    orange: never,
    yellow: (v: number) => v < 18.5 || (v >= 25 && v < 30),
  },
};

const CHILD_OLDER: VitalsBands = {
  labelKey: 'rcpt_vitals_child_older',
  pa: {
    red: (sys: number, dia: number) => sys < 80 || sys >= 140 || dia >= 90,
    orange: (sys: number, dia: number) =>
      (sys >= 80 && sys <= 89) ||
      (sys >= 120 && sys <= 139) ||
      (dia >= 80 && dia <= 89),
    yellow: (sys: number, dia: number) =>
      (sys >= 110 && sys <= 119) || (dia >= 70 && dia <= 79),
  },
  temp: {
    red: (v: number) => v >= 41 || v <= 35,
    orange: (v: number) => v >= 39 && v <= 40.9,
    yellow: (v: number) => v >= 38 && v <= 38.9,
  },
  spo2: ADULT.spo2,
  fc: {
    red: (v: number) => v > 150 || v < 50,
    orange: (v: number) => (v >= 131 && v <= 150) || (v >= 50 && v <= 59),
    yellow: (v: number) => (v >= 111 && v <= 130) || (v >= 60 && v <= 69),
  },
  fr: {
    red: (v: number) => v > 30 || v < 12,
    orange: (v: number) => v >= 26 && v <= 30,
    yellow: (v: number) => (v >= 12 && v <= 17),
  },
  bmi: {
    red: (v: number) => v >= 30,
    orange: never,
    yellow: (v: number) => v < 18.5 || (v >= 25 && v < 30),
  },
};

const CHILD_SMALL: VitalsBands = {
  labelKey: 'rcpt_vitals_child_small',
  pa: {
    red: (sys: number, dia: number) => sys < 70 || sys >= 130 || dia >= 85,
    orange: (sys: number, dia: number) =>
      (sys >= 70 && sys <= 79) ||
      (sys >= 110 && sys <= 129) ||
      (dia >= 75 && dia <= 84),
    yellow: (sys: number, dia: number) =>
      (sys >= 100 && sys <= 109) || (dia >= 65 && dia <= 74),
  },
  temp: {
    red: (v: number) => v >= 41 || v <= 35,
    orange: (v: number) => v >= 39 && v <= 40.9,
    yellow: (v: number) => v >= 38 && v <= 38.9,
  },
  spo2: ADULT.spo2,
  fc: {
    red: (v: number) => v > 180 || v < 60,
    orange: (v: number) => (v >= 161 && v <= 180) || (v >= 50 && v <= 59),
    yellow: (v: number) => (v >= 131 && v <= 160) || (v >= 60 && v <= 79),
  },
  fr: {
    red: (v: number) => v > 50 || v < 15,
    orange: (v: number) => v >= 41 && v <= 50,
    yellow: (v: number) => (v >= 31 && v <= 40) || (v >= 15 && v <= 19),
  },
  bmi: {
    red: (v: number) => v >= 30,
    orange: never,
    yellow: (v: number) => v < 18.5 || (v >= 25 && v < 30),
  },
};

const TEEN: VitalsBands = {
  labelKey: 'rcpt_vitals_teen',
  pa: {
    red: (sys: number, dia: number) => sys >= 140 || dia >= 90,
    orange: (sys: number, dia: number) =>
      (sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89),
    yellow: (sys: number, dia: number) =>
      sys >= 120 && sys <= 129 && dia <= 79,
  },
  temp: ADULT.temp,
  spo2: ADULT.spo2,
  fc: ADULT.fc,
  fr: ADULT.fr,
  bmi: ADULT.bmi,
};

const BABY: VitalsBands = {
  labelKey: 'rcpt_vitals_baby',
  pa: {
    red: (sys: number, dia: number) => sys < 50 || sys >= 100 || dia >= 80,
    orange: (sys: number, dia: number) =>
      (sys >= 50 && sys <= 59) ||
      (sys >= 90 && sys <= 99) ||
      (dia >= 70 && dia <= 79),
    yellow: (sys: number, dia: number) =>
      (sys >= 80 && sys <= 89) || (dia >= 60 && dia <= 69),
  },
  temp: {
    red: (v: number, ageMonths: number) =>
      v >= 41 || v <= 35 || (ageMonths < 3 && v >= 38),
    orange: (v: number, ageMonths: number) =>
      ageMonths >= 3 && v >= 39 && v <= 40.9,
    yellow: (v: number, ageMonths: number) =>
      ageMonths >= 3 && v >= 38 && v <= 38.9,
  },
  spo2: ADULT.spo2,
  fc: {
    red: (v: number) => v > 200 || v < 80,
    orange: (v: number) => (v >= 181 && v <= 200) || (v >= 80 && v <= 99),
    yellow: (v: number) => (v >= 161 && v <= 180) || (v >= 100 && v <= 109),
  },
  fr: {
    red: (v: number) => v > 70 || v < 30,
    orange: (v: number) => v >= 61 && v <= 70,
    yellow: (v: number) => v >= 51 && v <= 60,
  },
  bmi: {
    red: never,
    orange: never,
    yellow: never,
  },
};

export function getVitalsBands(ageMonths: number): VitalsBands {
  if (ageMonths < 12) return BABY;
  if (ageMonths < 72) return CHILD_SMALL;
  if (ageMonths < 156) return CHILD_OLDER;
  if (ageMonths < 216) return TEEN;
  return ADULT;
}

function genderToSex(gender?: string): BmiSex | null {
  const g = (gender || '').toLowerCase();
  if (g.includes('fem') || g.includes('mujer') || g.includes('woman') || g === '2') return 'F';
  if (g.includes('masc') || g.includes('hombre') || g.includes('man') || g === '1') return 'M';
  return null;
}

export interface BmiClassification {
  color: VitalColor;
  kind: BmiKind;
}

export function classifyBmiForAge(bmi: number, ageMonths: number, gender?: string): BmiClassification | null {
  if (!isFinite(bmi) || bmi <= 0) return null;
  if (ageMonths < 12) return null;
  if (ageMonths < 156) {
    const sex = genderToSex(gender);
    const band = sex ? classifyBmi(bmi, ageMonths, sex) : null;
    if (band === 'red') return { color: 'red', kind: 'obese' };
    if (band === 'orange') return { color: 'orange', kind: 'overweight' };
    if (band === 'yellow') return { color: 'yellow', kind: 'underweight' };
    return { color: 'green', kind: 'normal' };
  }
  const bands = getVitalsBands(ageMonths);
  if (bands.bmi.red(bmi)) return { color: 'red', kind: 'obese' };
  if (bands.bmi.yellow(bmi)) {
    return bmi < 18.5 ? { color: 'yellow', kind: 'underweight' } : { color: 'yellow', kind: 'overweight' };
  }
  return { color: 'green', kind: 'normal' };
}
