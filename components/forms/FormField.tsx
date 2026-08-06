'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, required, hint, className = '', children }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[10px] text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-[10px] text-rose-600 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export interface FormErrorSummaryProps {
  errors: Array<{ path: string; message: string }>;
  title?: string;
}

export function FormErrorSummary({ errors, title = 'Corrija os seguintes erros:' }: FormErrorSummaryProps) {
  if (errors.length === 0) return null;
  return (
    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5">
      <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" />
        {title}
      </p>
      <ul className="space-y-0.5 ml-5 list-disc text-[11px] text-rose-600">
        {errors.map((err, idx) => (
          <li key={idx}>{err.message}</li>
        ))}
      </ul>
    </div>
  );
}
