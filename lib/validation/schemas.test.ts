import { describe, it, expect } from 'vitest';
import {
  patientSchema,
  appointmentSchema,
  emailSchema,
  phoneSchema,
  dateSchema,
} from './schemas';

describe('schemas primitivas', () => {
  describe('emailSchema', () => {
    it('aceita e-mail válido', () => {
      expect(emailSchema.safeParse('ana@example.com').success).toBe(true);
    });
    it('rejeita e-mail inválido', () => {
      expect(emailSchema.safeParse('não-e-mail').success).toBe(false);
    });
    it('rejeita vazio', () => {
      expect(emailSchema.safeParse('').success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    it('aceita telefone com dígitos, hífen, espaço, + e parênteses', () => {
      expect(phoneSchema.safeParse('+55 (11) 99999-0000').success).toBe(true);
    });
    it('rejeita letras', () => {
      expect(phoneSchema.safeParse('abc').success).toBe(false);
    });
    it('rejeita curtíssimo', () => {
      expect(phoneSchema.safeParse('1234').success).toBe(false);
    });
  });

  describe('dateSchema', () => {
    it('aceita formato ISO yyyy-mm-dd', () => {
      expect(dateSchema.safeParse('2000-01-15').success).toBe(true);
    });
    it('rejeita formato inválido', () => {
      expect(dateSchema.safeParse('15/01/2000').success).toBe(false);
    });
    it('rejeita data inexistente', () => {
      expect(dateSchema.safeParse('2001-13-45').success).toBe(false);
    });
  });
});

describe('patientSchema', () => {
  const valid = {
    name: 'Ana Souza',
    email: 'ana@example.com',
    phone: '+595 21 123-4567',
    birthdate: '1990-05-20',
    gender: 'F',
    nationality: 'Paraguaia',
  };

  it('aceita paciente adulto sem responsável', () => {
    expect(patientSchema.safeParse(valid).success).toBe(true);
  });

  it('exige responsável para menor de 18 anos', () => {
    const minor = { ...valid, birthdate: '2010-01-01' };
    const result = patientSchema.safeParse(minor);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join('.') === 'guardian_name')).toBe(true);
    }
  });

  it('rejeita nome vazio', () => {
    const result = patientSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita data de nascimento com idade fora de 0-130', () => {
    const old = { ...valid, birthdate: '1800-01-01' };
    expect(patientSchema.safeParse(old).success).toBe(false);
  });
});

describe('appointmentSchema', () => {
  it('rejeita hora em formato errado', () => {
    const result = appointmentSchema.safeParse({
      patientId: 'P1',
      patientName: 'Ana',
      doctorName: 'Dr. A',
      specialty: 'Clínica',
      date: '2026-12-10',
      time: '10h30',
      status: 'agendado',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join('.') === 'time')).toBe(true);
    }
  });

  it('aceita dados mínimos válidos de consulta futura', () => {
    const result = appointmentSchema.safeParse({
      patientId: 'P1',
      patientName: 'Ana',
      doctorName: 'Dr. A',
      specialty: 'Clínica',
      date: '2027-06-15',
      time: '09:00',
      status: 'agendado',
      branch: 'Sede Central',
      room: 'Sala 1',
      insurance_type: 'Particular',
    });
    expect(result.success).toBe(true);
  });
});