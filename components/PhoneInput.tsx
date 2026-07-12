'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  // 🌎 Zona 5: América do Sul e Central (prioridade para Paraguai)
  { code: 'PY', name: 'Paraguai', flag: '\u{1F1F5}\u{1F1FE}' },
  { code: 'BR', name: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'AR', name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  { code: 'CL', name: 'Chile', flag: '\u{1F1E8}\u{1F1F1}' },
  { code: 'UY', name: 'Uruguai', flag: '\u{1F1FA}\u{1F1FE}' },
  { code: 'BO', name: 'Bolívia', flag: '\u{1F1E7}\u{1F1F4}' },
  { code: 'PE', name: 'Peru', flag: '\u{1F1F5}\u{1F1EA}' },
  { code: 'CO', name: 'Colômbia', flag: '\u{1F1E8}\u{1F1F4}' },
  { code: 'VE', name: 'Venezuela', flag: '\u{1F1FB}\u{1F1EA}' },
  { code: 'EC', name: 'Equador', flag: '\u{1F1EA}\u{1F1E8}' },
  { code: 'MX', name: 'México', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'PA', name: 'Panamá', flag: '\u{1F1F5}\u{1F1E6}' },
  { code: 'CR', name: 'Costa Rica', flag: '\u{1F1E8}\u{1F1F7}' },
  { code: 'GT', name: 'Guatemala', flag: '\u{1F1EC}\u{1F1F9}' },
  { code: 'HN', name: 'Honduras', flag: '\u{1F1ED}\u{1F1F3}' },
  { code: 'SV', name: 'El Salvador', flag: '\u{1F1F8}\u{1F1FB}' },
  { code: 'NI', name: 'Nicarágua', flag: '\u{1F1F3}\u{1F1EE}' },
  { code: 'CU', name: 'Cuba', flag: '\u{1F1E8}\u{1F1FA}' },
  { code: 'DO', name: 'República Dominicana', flag: '\u{1F1E9}\u{1F1F4}' },
  { code: 'JM', name: 'Jamaica', flag: '\u{1F1EF}\u{1F1F2}' },
  { code: 'HT', name: 'Haiti', flag: '\u{1F1ED}\u{1F1F9}' },
  { code: 'TT', name: 'Trinidad e Tobago', flag: '\u{1F1F9}\u{1F1F9}' },
  { code: 'GY', name: 'Guiana', flag: '\u{1F1EC}\u{1F1FE}' },
  { code: 'SR', name: 'Suriname', flag: '\u{1F1F8}\u{1F1F7}' },
  { code: 'BZ', name: 'Belize', flag: '\u{1F1E7}\u{1F1FF}' },
  // 🌎 Zona 1: América do Norte e Caribe
  { code: 'US', name: 'Estados Unidos', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'CA', name: 'Canadá', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'BS', name: 'Bahamas', flag: '\u{1F1E7}\u{1F1F8}' },
  { code: 'BB', name: 'Barbados', flag: '\u{1F1E7}\u{1F1E7}' },
  { code: 'AG', name: 'Antígua e Barbuda', flag: '\u{1F1E6}\u{1F1EC}' },
  { code: 'GD', name: 'Granada', flag: '\u{1F1EC}\u{1F1E9}' },
  { code: 'LC', name: 'Santa Lúcia', flag: '\u{1F1F1}\u{1F1E8}' },
  { code: 'DM', name: 'Dominica', flag: '\u{1F1E9}\u{1F1F2}' },
  { code: 'VC', name: 'São Vicente e Granadinas', flag: '\u{1F1FB}\u{1F1E8}' },
  { code: 'PR', name: 'Porto Rico', flag: '\u{1F1F5}\u{1F1F7}' },
  // 🇪🇺 Zona 3/4: Europa
  { code: 'ES', name: 'Espanha', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'PT', name: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'IT', name: 'Itália', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'DE', name: 'Alemanha', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'FR', name: 'França', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'GB', name: 'Reino Unido', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'NL', name: 'Holanda', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'BE', name: 'Bélgica', flag: '\u{1F1E7}\u{1F1EA}' },
  { code: 'CH', name: 'Suíça', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'AT', name: 'Áustria', flag: '\u{1F1E6}\u{1F1F9}' },
  { code: 'IE', name: 'Irlanda', flag: '\u{1F1EE}\u{1F1EA}' },
  { code: 'SE', name: 'Suécia', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'NO', name: 'Noruega', flag: '\u{1F1F3}\u{1F1F4}' },
  { code: 'DK', name: 'Dinamarca', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'FI', name: 'Finlândia', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'PL', name: 'Polônia', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'CZ', name: 'Tchéquia', flag: '\u{1F1E8}\u{1F1FF}' },
  { code: 'GR', name: 'Grécia', flag: '\u{1F1EC}\u{1F1F7}' },
  { code: 'RO', name: 'Romênia', flag: '\u{1F1F7}\u{1F1F4}' },
  { code: 'HU', name: 'Hungria', flag: '\u{1F1ED}\u{1F1FA}' },
  { code: 'BG', name: 'Bulgária', flag: '\u{1F1E7}\u{1F1EC}' },
  { code: 'HR', name: 'Croácia', flag: '\u{1F1E8}\u{1F1F7}' },
  { code: 'UA', name: 'Ucrânia', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'RS', name: 'Sérvia', flag: '\u{1F1F7}\u{1F1F8}' },
  { code: 'BA', name: 'Bósnia e Herzegovina', flag: '\u{1F1E7}\u{1F1E6}' },
  { code: 'AL', name: 'Albânia', flag: '\u{1F1E6}\u{1F1F1}' },
  { code: 'IS', name: 'Islândia', flag: '\u{1F1EE}\u{1F1F8}' },
  { code: 'LU', name: 'Luxemburgo', flag: '\u{1F1F1}\u{1F1FA}' },
  { code: 'MT', name: 'Malta', flag: '\u{1F1F2}\u{1F1F9}' },
  { code: 'SI', name: 'Eslovênia', flag: '\u{1F1F8}\u{1F1EE}' },
  { code: 'SK', name: 'Eslováquia', flag: '\u{1F1F8}\u{1F1F0}' },
  { code: 'LT', name: 'Lituânia', flag: '\u{1F1F1}\u{1F1F9}' },
  { code: 'LV', name: 'Letônia', flag: '\u{1F1F1}\u{1F1FB}' },
  { code: 'EE', name: 'Estônia', flag: '\u{1F1EA}\u{1F1EA}' },
  { code: 'MD', name: 'Moldávia', flag: '\u{1F1F2}\u{1F1E9}' },
  { code: 'BY', name: 'Bielorrússia', flag: '\u{1F1E7}\u{1F1FE}' },
  { code: 'MK', name: 'Macedônia do Norte', flag: '\u{1F1F2}\u{1F1F0}' },
  { code: 'ME', name: 'Montenegro', flag: '\u{1F1F2}\u{1F1EA}' },
  { code: 'XK', name: 'Kosovo', flag: '\u{1F1FD}\u{1F1F0}' },
  { code: 'AD', name: 'Andorra', flag: '\u{1F1E6}\u{1F1E9}' },
  { code: 'MC', name: 'Mônaco', flag: '\u{1F1F2}\u{1F1E8}' },
  { code: 'SM', name: 'San Marino', flag: '\u{1F1F8}\u{1F1F2}' },
  { code: 'LI', name: 'Liechtenstein', flag: '\u{1F1F1}\u{1F1EE}' },
  { code: 'CY', name: 'Chipre', flag: '\u{1F1E8}\u{1F1FE}' },
  { code: 'TR', name: 'Turquia', flag: '\u{1F1F9}\u{1F1F7}' },
  // 🌏 Zona 8: Leste Asiático
  { code: 'JP', name: 'Japão', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'KR', name: 'Coreia do Sul', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'TW', name: 'Taiwan', flag: '\u{1F1F9}\u{1F1FC}' },
  { code: 'HK', name: 'Hong Kong', flag: '\u{1F1ED}\u{1F1F0}' },
  { code: 'MO', name: 'Macau', flag: '\u{1F1F2}\u{1F1F4}' },
  { code: 'VN', name: 'Vietnã', flag: '\u{1F1FB}\u{1F1F3}' },
  { code: 'TH', name: 'Tailândia', flag: '\u{1F1F9}\u{1F1ED}' },
  { code: 'PH', name: 'Filipinas', flag: '\u{1F1F5}\u{1F1ED}' },
  { code: 'MY', name: 'Malásia', flag: '\u{1F1F2}\u{1F1FE}' },
  { code: 'SG', name: 'Singapura', flag: '\u{1F1F8}\u{1F1EC}' },
  { code: 'ID', name: 'Indonésia', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'KH', name: 'Camboja', flag: '\u{1F1F0}\u{1F1ED}' },
  { code: 'MM', name: 'Mianmar', flag: '\u{1F1F2}\u{1F1F2}' },
  { code: 'BD', name: 'Bangladesh', flag: '\u{1F1E7}\u{1F1E9}' },
  { code: 'LK', name: 'Sri Lanka', flag: '\u{1F1F1}\u{1F1F0}' },
  { code: 'NP', name: 'Nepal', flag: '\u{1F1F3}\u{1F1F5}' },
  { code: 'BT', name: 'Butão', flag: '\u{1F1E7}\u{1F1F9}' },
  { code: 'MN', name: 'Mongólia', flag: '\u{1F1F2}\u{1F1F3}' },
  { code: 'TL', name: 'Timor-Leste', flag: '\u{1F1F9}\u{1F1F1}' },
  // 🕌 Zona 9: Sul da Ásia e Oriente Médio
  { code: 'IN', name: 'Índia', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'PK', name: 'Paquistão', flag: '\u{1F1F5}\u{1F1F0}' },
  { code: 'AF', name: 'Afeganistão', flag: '\u{1F1E6}\u{1F1EB}' },
  { code: 'IR', name: 'Irã', flag: '\u{1F1EE}\u{1F1F7}' },
  { code: 'IQ', name: 'Iraque', flag: '\u{1F1EE}\u{1F1F6}' },
  { code: 'SA', name: 'Arábia Saudita', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'AE', name: 'Emirados Árabes Unidos', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'QA', name: 'Catar', flag: '\u{1F1F6}\u{1F1E6}' },
  { code: 'KW', name: 'Kuwait', flag: '\u{1F1F0}\u{1F1FC}' },
  { code: 'BH', name: 'Bahrein', flag: '\u{1F1E7}\u{1F1ED}' },
  { code: 'OM', name: 'Omã', flag: '\u{1F1F4}\u{1F1F2}' },
  { code: 'JO', name: 'Jordânia', flag: '\u{1F1EF}\u{1F1F4}' },
  { code: 'LB', name: 'Líbano', flag: '\u{1F1F1}\u{1F1E7}' },
  { code: 'IL', name: 'Israel', flag: '\u{1F1EE}\u{1F1F1}' },
  { code: 'SY', name: 'Síria', flag: '\u{1F1F8}\u{1F1FE}' },
  { code: 'YE', name: 'Iêmen', flag: '\u{1F1FE}\u{1F1EA}' },
  { code: 'PS', name: 'Palestina', flag: '\u{1F1F5}\u{1F1F8}' },
  { code: 'GE', name: 'Geórgia', flag: '\u{1F1EC}\u{1F1EA}' },
  { code: 'AM', name: 'Armênia', flag: '\u{1F1E6}\u{1F1F2}' },
  { code: 'AZ', name: 'Azerbaijão', flag: '\u{1F1E6}\u{1F1FF}' },
  // 🌏 Zona 7/9: Central e Norte da Ásia
  { code: 'RU', name: 'Rússia', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'KZ', name: 'Cazaquistão', flag: '\u{1F1F0}\u{1F1F0}' },
  { code: 'UZ', name: 'Uzbequistão', flag: '\u{1F1FA}\u{1F1FF}' },
  { code: 'TM', name: 'Turcomenistão', flag: '\u{1F1F9}\u{1F1F2}' },
  { code: 'TJ', name: 'Tajiquistão', flag: '\u{1F1F9}\u{1F1EF}' },
  { code: 'KG', name: 'Quirguistão', flag: '\u{1F1F0}\u{1F1EC}' },
  // 🌏 Zona 6: Oceania
  { code: 'AU', name: 'Austrália', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'NZ', name: 'Nova Zelândia', flag: '\u{1F1F3}\u{1F1FF}' },
  { code: 'FJ', name: 'Fiji', flag: '\u{1F1EB}\u{1F1EF}' },
  // 🌍 Zona 2: África
  { code: 'ZA', name: 'África do Sul', flag: '\u{1F1FF}\u{1F1E6}' },
  { code: 'EG', name: 'Egito', flag: '\u{1F1EA}\u{1F1EC}' },
  { code: 'MA', name: 'Marrocos', flag: '\u{1F1F2}\u{1F1E6}' },
  { code: 'NG', name: 'Nigéria', flag: '\u{1F1F3}\u{1F1EC}' },
  { code: 'KE', name: 'Quênia', flag: '\u{1F1F0}\u{1F1EA}' },
  { code: 'GH', name: 'Gana', flag: '\u{1F1EC}\u{1F1ED}' },
  { code: 'ET', name: 'Etiópia', flag: '\u{1F1EA}\u{1F1F9}' },
  { code: 'TZ', name: 'Tanzânia', flag: '\u{1F1F9}\u{1F1FF}' },
  { code: 'AO', name: 'Angola', flag: '\u{1F1E6}\u{1F1F4}' },
  { code: 'MZ', name: 'Moçambique', flag: '\u{1F1F2}\u{1F1FF}' },
  { code: 'CM', name: 'Camarões', flag: '\u{1F1E8}\u{1F1F2}' },
  { code: 'SN', name: 'Senegal', flag: '\u{1F1F8}\u{1F1F3}' },
  { code: 'CI', name: 'Costa do Marfim', flag: '\u{1F1E8}\u{1F1EE}' },
  { code: 'TN', name: 'Tunísia', flag: '\u{1F1F9}\u{1F1F3}' },
  { code: 'DZ', name: 'Argélia', flag: '\u{1F1E9}\u{1F1FF}' },
  { code: 'LY', name: 'Líbia', flag: '\u{1F1F1}\u{1F1FE}' },
  { code: 'SD', name: 'Sudão', flag: '\u{1F1F8}\u{1F1E9}' },
  { code: 'UG', name: 'Uganda', flag: '\u{1F1FA}\u{1F1EC}' },
  { code: 'RW', name: 'Ruanda', flag: '\u{1F1F7}\u{1F1FC}' },
  { code: 'BI', name: 'Burundi', flag: '\u{1F1E7}\u{1F1EE}' },
  { code: 'CD', name: 'RD Congo', flag: '\u{1F1E8}\u{1F1E9}' },
  { code: 'CG', name: 'Congo', flag: '\u{1F1E8}\u{1F1EC}' },
  { code: 'GA', name: 'Gabão', flag: '\u{1F1EC}\u{1F1E6}' },
  { code: 'MG', name: 'Madagascar', flag: '\u{1F1F2}\u{1F1EC}' },
  { code: 'MU', name: 'Maurício', flag: '\u{1F1F2}\u{1F1FA}' },
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

  useEffect(() => {
    if (value && value.startsWith('+')) {
      const detected = detectCountry(value);
      if (detected) {
        setSelectedCountry(detected);
      }
    }
  }, [value]);

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
      onChange(val);
    } else if (!val.startsWith('+')) {
      try {
        const code = getCountryCallingCode(selectedCountry);
        onChange('+' + code + val.replace(/\D/g, ''));
      } catch {
        onChange(val);
      }
    } else {
      onChange(val);
    }
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
    if (!value) return;
    if (!value.startsWith('+')) {
      try {
        const code = getCountryCallingCode(selectedCountry);
        onChange('+' + code + value.replace(/\D/g, ''));
      } catch {}
      return;
    }
    const formatted = formatPhone();
    if (formatted !== value) {
      onChange(formatted);
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
