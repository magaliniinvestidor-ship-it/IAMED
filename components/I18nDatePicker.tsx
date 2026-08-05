'use client';

import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { ptBR, pt, enUS, es } from 'date-fns/locale';
import { useI18n } from '@/lib/i18n/I18nContext';
import 'react-datepicker/dist/react-datepicker.css';

interface I18nDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  minDate?: string;
  className?: string;
  required?: boolean;
  id?: string;
}

const LOCALE_MAP: Record<string, typeof ptBR> = {
  'pt-BR': ptBR,
  'pt-PT': pt,
  'en': enUS,
  'es': es,
  'es-AR': es,
  'es-PY': es,
};

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

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

const STYLE_ID = 'iamed-datepicker-styles';

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .react-datepicker-wrapper {
      display: block !important;
      width: 100%;
    }
    .react-datepicker__input-container input {
      width: 100%;
      padding-left: 0.75rem !important;
      padding-right: 2.25rem !important;
      text-align: left !important;
    }
    .react-datepicker__input-container {
      position: relative;
    }
    .react-datepicker__input-container::after {
      content: '';
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='4' rx='2' ry='2'/%3E%3Cline x1='16' x2='16' y1='2' y2='6'/%3E%3Cline x1='8' x2='8' y1='2' y2='6'/%3E%3Cline x1='3' x2='21' y1='10' y2='10'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
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
  const dpLocale = LOCALE_MAP[locale] || ptBR;
  const placeholderText = placeholder || PLACEHOLDER_MAP[locale] || 'dd/mm/yyyy';

  useEffect(() => {
    injectStyles();
  }, []);

  const selected = parseDate(value);
  const minDateObj = minDate ? parseDate(minDate) : undefined;

  return (
    <DatePicker
      id={id}
      selected={selected}
      onChange={(date: Date | null) => onChange(toDateString(date))}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholderText}
      minDate={minDateObj ?? undefined}
      className={className}
      required={required}
      locale={dpLocale}
      autoComplete="off"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  );
}
