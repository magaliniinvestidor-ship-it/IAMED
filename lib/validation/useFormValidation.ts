'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ZodError, ZodSchema } from 'zod';

export interface FieldError {
  path: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: FieldError[];
}

export function validateForm<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue: ZodError['issues'][number]) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export function useFormValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<FieldError[]>([]);
  const lastValidatedDataRef = useRef<unknown>(null);
  const lastErrorsRef = useRef<FieldError[]>([]);

  const validate = useCallback(
    (data: unknown): ValidationResult<T> => {
      const result = validateForm(schema, data);
      lastValidatedDataRef.current = data;
      lastErrorsRef.current = result.errors;
      setErrors(result.errors);
      return result;
    },
    [schema]
  );

  // Quando o schema muda (ex.: locale alterado), revalida os últimos dados
  // para que as mensagens de erro sejam traduzidas imediatamente.
  useEffect(() => {
    if (lastValidatedDataRef.current === null || lastValidatedDataRef.current === undefined) {
      return;
    }
    const result = validateForm(schema, lastValidatedDataRef.current);
    const same = `${JSON.stringify(result.errors.map((e) => e.message))}` === `${JSON.stringify(lastErrorsRef.current.map((e) => e.message))}`;
    if (same) return;
    lastErrorsRef.current = result.errors;
    setErrors(result.errors);
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors([]);
    lastValidatedDataRef.current = null;
    lastErrorsRef.current = [];
  }, []);

  const setFieldError = useCallback((path: string, message: string) => {
    setErrors((prev) => {
      const filtered = prev.filter((e) => e.path !== path);
      return [...filtered, { path, message }];
    });
  }, []);

  const getFieldError = useCallback(
    (path: string): string | undefined => {
      return errors.find((e) => e.path === path)?.message;
    },
    [errors]
  );

  return {
    errors,
    validate,
    clearErrors,
    setFieldError,
    getFieldError,
    setErrors,
  };
}

export function groupErrorsByPath(errors: FieldError[]): Record<string, string> {
  return errors.reduce<Record<string, string>>((acc, err) => {
    acc[err.path] = err.message;
    return acc;
  }, {});
}
