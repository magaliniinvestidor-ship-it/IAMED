import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateForm, groupErrorsByPath } from './useFormValidation';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  age: z.number().min(18, 'Idade mínima 18'),
});

describe('validateForm', () => {
  it('retorna success true e data em dados válidos', () => {
    const result = validateForm(schema, { name: 'Ana', age: 25 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'Ana', age: 25 });
    expect(result.errors).toEqual([]);
  });

  it('retorna success false com erro mapeado para os dados inválidos', () => {
    const result = validateForm(schema, { name: '', age: 10 });
    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      { path: 'name', message: 'Nome é obrigatório' },
      { path: 'age', message: 'Idade mínima 18' },
    ]);
  });

  it('trata valores de tipos errados como falha', () => {
    const result = validateForm(schema, { name: 123, age: 'x' });
    expect(result.success).toBe(false);
    const paths = result.errors.map((e) => e.path);
    expect(paths).toContain('name');
    expect(paths).toContain('age');
  });
});

describe('groupErrorsByPath', () => {
  it('agrupa erros por path em registro', () => {
    const result = groupErrorsByPath([
      { path: 'name', message: 'obrigatório' },
      { path: 'phone', message: 'inválido' },
    ]);
    expect(result).toEqual({ name: 'obrigatório', phone: 'inválido' });
  });

  it('último erro sobrescreve anterior para o mesmo path', () => {
    const result = groupErrorsByPath([
      { path: 'name', message: 'primeiro' },
      { path: 'name', message: 'segundo' },
    ]);
    expect(result.name).toBe('segundo');
  });

  it('retorna objeto vazio quando não há erros', () => {
    expect(groupErrorsByPath([])).toEqual({});
  });
});