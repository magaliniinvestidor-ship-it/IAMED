import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation } from './useFormValidation';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
});

describe('useFormValidation', () => {
  it('começa sem erros', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    expect(result.current.errors).toEqual([]);
  });

  it('validate() preenche errors a partir de dados inválidos', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    let outcome!: ReturnType<ReturnType<typeof useFormValidation>["validate"]>;
    act(() => {
      outcome = result.current.validate({ name: '' });
    });
    expect(outcome.success).toBe(false);
    expect(result.current.errors).toEqual([{ path: 'name', message: 'Nome obrigatório' }]);
  });

  it('validate() com dados válidos limpa errors', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    act(() => {
      result.current.validate({ name: '' });
    });
    expect(result.current.errors.length).toBeGreaterThan(0);
    let outcome!: ReturnType<ReturnType<typeof useFormValidation>["validate"]>;
    act(() => {
      outcome = result.current.validate({ name: 'Ana' });
    });
    expect(outcome.success).toBe(true);
    expect(result.current.errors).toEqual([]);
  });

  it('getFieldError retorna mensagem de um path', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    act(() => {
      result.current.validate({ name: '' });
    });
    expect(result.current.getFieldError('name')).toBe('Nome obrigatório');
    expect(result.current.getFieldError('phone')).toBeUndefined();
  });

  it('setFieldError injeta/sobrescreve erro manual em um path', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    act(() => {
      result.current.setFieldError('name', 'erro custom');
    });
    expect(result.current.getFieldError('name')).toBe('erro custom');
  });

  it('clearErrors zera errors e estado interno', () => {
    const { result } = renderHook(() => useFormValidation(schema));
    act(() => {
      result.current.validate({ name: '' });
    });
    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.errors).toEqual([]);
    expect(result.current.getFieldError('name')).toBeUndefined();
  });

  it('revalida dados anteriores quando o schema muda (ex.: troca de locale)', () => {
    const validSchema = z.object({ name: z.string().min(1, 'A') });
    const invalidSchema = z.object({ name: z.string().min(1, 'B') });
    const { result, rerender } = renderHook(({ s }) => useFormValidation(s), {
      initialProps: { s: validSchema },
    });
    act(() => {
      result.current.validate({ name: '' });
    });
    expect(result.current.errors[0].message).toBe('A');
    rerender({ s: invalidSchema });
    expect(result.current.errors[0].message).toBe('B');
  });
});