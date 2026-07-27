'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';

interface I18nDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  minDate?: string;
  className?: string;
  required?: boolean;
  id?: string;
}

const PLACEHOLDER_MAP: Record<string, string> = {
  'pt-BR': 'dd/mm/aaaa',
  'pt-PT': 'dd/mm/aaaa',
  'en': 'mm/dd/yyyy',
  'es': 'dd/mm/aaaa',
  'es-AR': 'dd/mm/aaaa',
  'es-PY': 'dd/mm/aaaa',
};

function toDateString(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function I18nDatePicker({
  value,
  onChange,
  placeholder,
  minDate,
  className = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg',
  required,
  id,
}: I18nDatePickerProps) {
  const { locale } = useI18n();
  const placeholderText = placeholder || PLACEHOLDER_MAP[locale] || 'dd/mm/yyyy';

  return (
    <input
      id={id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholderText}
      min={minDate}
      className={className}
      required={required}
      lang={locale}
      autoComplete="off"
    />
  );
}
