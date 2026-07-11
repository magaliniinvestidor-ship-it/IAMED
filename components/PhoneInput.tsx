'use client';

import React, { useState, useMemo } from 'react';
import { parsePhoneNumber, isValidPhoneNumber, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const COUNTRIES: { code: CountryCode; name: string; flag: string }[] = [
  { code: 'PY', name: 'Paraguai', flag: '\u{1F1F5}\u{1F1FE}' },
  { code: 'BR', name: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'AR', name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  { code: 'US', name: 'Estados Unidos', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'CL', name: 'Chile', flag: '\u{1F1E8}\u{1F1F1}' },
  { code: 'UY', name: 'Uruguai', flag: '\u{1F1FA}\u{1F1FE}' },
  { code: 'BO', name: 'Bolívia', flag: '\u{1F1E7}\u{1F1F4}' },
  { code: 'PE', name: 'Peru', flag: '\u{1F1F5}\u{1F1EA}' },
  { code: 'CO', name: 'Colômbia', flag: '\u{1F1E8}\u{1F1F4}' },
  { code: 'MX', name: 'México', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'ES', name: 'Espanha', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'PT', name: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'IT', name: 'Itália', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'DE', name: 'Alemanha', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'FR', name: 'França', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'JP', name: 'Japão', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'IN', name: 'Índia', flag: '\u{1F1EE}\u{1F1F3}' },
];

function detectCountry(value: string): CountryCode | undefined {
  if (!value.startsWith('+')) return undefined;
  for (const c of COUNTRIES) {
    try {
      const code = getCountryCallingCode(c.code);
      if (value.startsWith('+' + code)) return c.code;
    } catch {}
  }
  return undefined;
}

export default function PhoneInput({
  value,
  onChange,
  label,
  required = false,
  placeholder = '+595 981 123 456',
  className = '',
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('PY');

  const isPhoneValid = useMemo(() => {
    if (!value) return false;
    return isValidPhoneNumber(value, selectedCountry);
  }, [value, selectedCountry]);

  const handleChange = (val: string) => {
    if (val === '' || val === '+') {
      onChange(val);
      return;
    }
    const detected = detectCountry(val);
    if (detected) {
      setSelectedCountry(detected);
    }
    onChange(val);
  };

  const formatPhone = () => {
    if (!value) return value;
    try {
      const parsed = parsePhoneNumber(value, selectedCountry);
      if (parsed && parsed.isValid()) {
        return parsed.formatInternational();
      }
    } catch {}
    return value;
  };

  const handleBlur = () => {
    if (value && value.startsWith('+')) {
      const formatted = formatPhone();
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  };

  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {value && (
          isPhoneValid ? (
            <span className="text-green-600 font-bold">&#10004;</span>
          ) : (
            <span className="text-amber-500 animate-pulse text-[10px]">Pendente</span>
          )
        )}
      </label>
      <div className="flex gap-2">
        <select
          value={selectedCountry}
          onChange={e => {
            const country = e.target.value as CountryCode;
            setSelectedCountry(country);
            try {
              const code = getCountryCallingCode(country);
              if (value.startsWith('+')) {
                const national = value.replace(/^\+\d+/, '');
                onChange('+' + code + national);
              } else if (value) {
                onChange('+' + code + value.replace(/\D/g, ''));
              }
            } catch {}
          }}
          className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.flag} +{getCountryCallingCode(c.code)}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`min-w-0 flex-1 p-2.5 bg-slate-50 border rounded-lg focus:outline-teal-500 font-sans text-xs ${
            value && !isPhoneValid ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
          }`}
          required={required}
        />
      </div>
    </div>
  );
}
