'use client';

import { useState, useCallback } from 'react';
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

  const validate = useCallback(
    (data: unknown): ValidationResult<T> => {
      const result = validateForm(schema, data);
      setErrors(result.errors);
      return result;
    },
    [schema]
  );

  const clearErrors = useCallback(() => setErrors([]), []);

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
  };
}

export function groupErrorsByPath(errors: FieldError[]): Record<string, string> {
  return errors.reduce<Record<string, string>>((acc, err) => {
    acc[err.path] = err.message;
    return acc;
  }, {});
}
