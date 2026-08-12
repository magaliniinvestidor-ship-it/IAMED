import { describe, it, expect } from 'vitest';
import { classifyBmiForAge, getVitalsBands } from './vitalsLimits';

describe('classifyBmiForAge', () => {
  it('adult profile', () => {
    expect(classifyBmiForAge(24, 480, 'Masculino')?.color).toBe('green');
    expect(classifyBmiForAge(27, 480, 'Masculino')?.color).toBe('yellow');
    expect(classifyBmiForAge(17, 480, 'Masculino')?.color).toBe('yellow');
    expect(classifyBmiForAge(31, 480, 'Masculino')?.color).toBe('red');
  });

  it('child percentile via WHO LMS', () => {
    expect(classifyBmiForAge(16, 124, 'Feminino')?.color).toBe('green');
    expect(classifyBmiForAge(13.4, 124, 'Feminino')?.color).toBe('yellow');
    expect(classifyBmiForAge(22.5, 124, 'Feminino')?.color).toBe('red');
  });

  it('baby hidden (null)', () => {
    expect(classifyBmiForAge(17, 6, 'Masculino')).toBeNull();
  });

  it('teen adult-like', () => {
    expect(classifyBmiForAge(25.5, 180, 'Feminino')?.color).toBe('yellow');
  });
});

describe('getVitalsBands age ranges', () => {
  it('baby (< 12 months)', () => {
    expect(getVitalsBands(6).labelKey).toBe('rcpt_vitals_baby');
  });

  it('small child (1-5 years / 12-71 months)', () => {
    expect(getVitalsBands(24).labelKey).toBe('rcpt_vitals_child_small');
    expect(getVitalsBands(60).labelKey).toBe('rcpt_vitals_child_small');
  });

  it('older child (6-12 years / 72-155 months)', () => {
    expect(getVitalsBands(84).labelKey).toBe('rcpt_vitals_child_older');
    expect(getVitalsBands(144).labelKey).toBe('rcpt_vitals_child_older');
  });

  it('teen (13-17 years / 156-215 months)', () => {
    expect(getVitalsBands(180).labelKey).toBe('rcpt_vitals_teen');
  });

  it('adult (>= 18 years / >= 216 months)', () => {
    expect(getVitalsBands(240).labelKey).toBe('rcpt_vitals_adult');
  });
});

describe('Adult BP without pulse pressure penalty', () => {
  it('normal adult PA 110/70 must be green', () => {
    const bands = getVitalsBands(360);
    expect(bands.pa.red(110, 70)).toBe(false);
    expect(bands.pa.orange(110, 70)).toBe(false);
    expect(bands.pa.yellow(110, 70)).toBe(false);
  });

  it('wide pulse pressure in young adult 110/55 must NOT trigger differential penalty', () => {
    const bands = getVitalsBands(240);
    expect(bands.pa.red(110, 55)).toBe(false);
    expect(bands.pa.orange(110, 55)).toBe(false);
    expect(bands.pa.yellow(110, 55)).toBe(false);
  });

  it('elevated BP 125/82 is yellow', () => {
    const bands = getVitalsBands(360);
    expect(bands.pa.yellow(125, 82)).toBe(true);
  });

  it('hypertensive crisis 190/115 is red', () => {
    const bands = getVitalsBands(360);
    expect(bands.pa.red(190, 115)).toBe(true);
  });
});

describe('Baby vitals (PALS/WHO)', () => {
  it('baby FC 140 bpm at 6 months is NORMAL (not orange)', () => {
    const bands = getVitalsBands(6);
    expect(bands.fc.orange(140)).toBe(false);
    expect(bands.fc.red(140)).toBe(false);
    expect(bands.fc.yellow(140)).toBe(false);
  });

  it('baby FC 185 bpm is orange', () => {
    const bands = getVitalsBands(6);
    expect(bands.fc.orange(185)).toBe(true);
  });

  it('baby FC 220 bpm is red', () => {
    const bands = getVitalsBands(6);
    expect(bands.fc.red(220)).toBe(true);
  });

  it('baby FR 45 irpm is NORMAL (not yellow)', () => {
    const bands = getVitalsBands(6);
    expect(bands.fr.yellow(45)).toBe(false);
    expect(bands.fr.orange(45)).toBe(false);
    expect(bands.fr.red(45)).toBe(false);
  });

  it('baby FR 25 irpm is RED (neonatal bradypnea / apnea)', () => {
    const bands = getVitalsBands(6);
    expect(bands.fr.red(25)).toBe(true);
  });

  it('baby FR 75 irpm is red (severe tachypnea)', () => {
    const bands = getVitalsBands(6);
    expect(bands.fr.red(75)).toBe(true);
  });

  it('baby BP 70/40 at 3 months is NORMAL', () => {
    const bands = getVitalsBands(3);
    expect(bands.pa.red(70, 40)).toBe(false);
    expect(bands.pa.orange(70, 40)).toBe(false);
    expect(bands.pa.yellow(70, 40)).toBe(false);
  });

  it('baby temperature 38.5C at 6 months is yellow', () => {
    const bands = getVitalsBands(6);
    expect(bands.temp.yellow(38.5, 6)).toBe(true);
  });

  it('neonate <3 months with fever 38.5C is RED (sepsis emergency)', () => {
    const bands = getVitalsBands(1);
    expect(bands.temp.red(38.5, 1)).toBe(true);
  });

  it('baby FR 25 irpm at 1 month is RED (apnea/bradypnea)', () => {
    const bands = getVitalsBands(1);
    expect(bands.fr.red(25)).toBe(true);
  });

  it('baby FR 55 irpm at 6 months is YELLOW', () => {
    const bands = getVitalsBands(6);
    expect(bands.fr.yellow(55)).toBe(true);
  });
});

describe('Small child vitals (1-5 years / PALS)', () => {
  it('child FC 130 bpm at 3 years is NORMAL (green)', () => {
    const bands = getVitalsBands(36);
    expect(bands.fc.yellow(130)).toBe(false);
    expect(bands.fc.orange(130)).toBe(false);
    expect(bands.fc.red(130)).toBe(false);
  });

  it('child FC 165 bpm at 3 years is orange', () => {
    const bands = getVitalsBands(36);
    expect(bands.fc.orange(165)).toBe(true);
  });

  it('child FR 30 irpm at 2 years is NORMAL (green)', () => {
    const bands = getVitalsBands(24);
    expect(bands.fr.red(30)).toBe(false);
    expect(bands.fr.orange(30)).toBe(false);
    expect(bands.fr.yellow(30)).toBe(false);
  });
});

describe('Older child vitals (6-12 years / PALS)', () => {
  it('child FC 110 bpm at 8 years is NORMAL (green)', () => {
    const bands = getVitalsBands(96);
    expect(bands.fc.yellow(110)).toBe(false);
    expect(bands.fc.orange(110)).toBe(false);
    expect(bands.fc.red(110)).toBe(false);
  });

  it('child FC 150 bpm at 8 years is orange', () => {
    const bands = getVitalsBands(96);
    expect(bands.fc.orange(150)).toBe(true);
  });

  it('child FR 22 irpm at 10 years is NORMAL (green)', () => {
    const bands = getVitalsBands(120);
    expect(bands.fr.red(22)).toBe(false);
    expect(bands.fr.orange(22)).toBe(false);
    expect(bands.fr.yellow(22)).toBe(false);
  });

  it('child FR 28 irpm at 10 years is ORANGE (tachypnea)', () => {
    const bands = getVitalsBands(120);
    expect(bands.fr.orange(28)).toBe(true);
  });

  it('child FR 16 irpm at 10 years is YELLOW (mild bradypnea)', () => {
    const bands = getVitalsBands(120);
    expect(bands.fr.yellow(16)).toBe(true);
  });

  it('child FC 160 bpm at 8 years is RED', () => {
    const bands = getVitalsBands(96);
    expect(bands.fc.red(160)).toBe(true);
  });
});

describe('Teen vitals (13-17 years / AAP)', () => {
  it('teen BP 130/85 is ORANGE (stage 1 hypertension)', () => {
    const bands = getVitalsBands(180);
    expect(bands.pa.orange(130, 85)).toBe(true);
  });

  it('teen BP 145/95 is RED', () => {
    const bands = getVitalsBands(180);
    expect(bands.pa.red(145, 95)).toBe(true);
  });

  it('teen BP 115/75 is GREEN (normal)', () => {
    const bands = getVitalsBands(180);
    expect(bands.pa.red(115, 75)).toBe(false);
    expect(bands.pa.orange(115, 75)).toBe(false);
    expect(bands.pa.yellow(115, 75)).toBe(false);
  });

  it('teen FC 105 is YELLOW (mild tachycardia)', () => {
    const bands = getVitalsBands(180);
    expect(bands.fc.yellow(105)).toBe(true);
  });

  it('teen FC 50 is YELLOW (mild bradycardia)', () => {
    const bands = getVitalsBands(180);
    expect(bands.fc.yellow(50)).toBe(true);
  });

  it('teen FC 160 is RED', () => {
    const bands = getVitalsBands(180);
    expect(bands.fc.red(160)).toBe(true);
  });
});
