'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

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
  onClose?: () => void;
}

export function FormErrorSummary({ errors, title = 'Corrija os seguintes erros:', onClose }: FormErrorSummaryProps) {
  if (errors.length === 0) return null;
  return (
    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {title}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={title}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-md p-0.5 transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <ul className="space-y-0.5 ml-5 list-disc text-[11px] text-rose-600">
        {errors.map((err, idx) => (
          <li key={idx}>{err.message}</li>
        ))}
      </ul>
    </div>
  );
}
