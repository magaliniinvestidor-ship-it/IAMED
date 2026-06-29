'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ptBR from './locales/pt-BR.json';
import ptPT from './locales/pt-PT.json';
import esAR from './locales/es-AR.json';
import esPY from './locales/es-PY.json';
import es from './locales/es.json';
import en from './locales/en.json';

type LocaleType = 'pt-BR' | 'pt-PT' | 'es-AR' | 'es-PY' | 'es' | 'en';

const locales: Record<LocaleType, any> = {
  'pt-BR': ptBR,
  'pt-PT': ptPT,
  'es-AR': esAR,
  'es-PY': esPY,
  'es': es,
  'en': en,
};

interface I18nContextType {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => void;
  t: (key: string, section?: 'login' | 'app' | 'terms') => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<LocaleType>('pt-BR');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem('iamed_locale') as LocaleType;
    if (savedLocale && locales[savedLocale]) {
      setLocaleState(savedLocale);
    } else {
      // Auto-detect based on navigator.language
      const browserLang = navigator.language;
      if (browserLang === 'pt-BR') setLocaleState('pt-BR');
      else if (browserLang === 'pt-PT' || browserLang.startsWith('pt')) setLocaleState('pt-PT');
      else if (browserLang === 'es-AR') setLocaleState('es-AR');
      else if (browserLang === 'es-PY') setLocaleState('es-PY');
      else if (browserLang.startsWith('es')) setLocaleState('es');
      else if (browserLang.startsWith('en')) setLocaleState('en');
    }
    setIsLoaded(true);
  }, []);

  const setLocale = (newLocale: LocaleType) => {
    setLocaleState(newLocale);
    localStorage.setItem('iamed_locale', newLocale);
  };

  const t = (key: string, section: 'login' | 'app' | 'terms' = 'login') => {
    if (!locales[locale]) return key;
    return locales[locale][section]?.[key] || key;
  };

  // Prevent hydration mismatch by not rendering children until locale is loaded from localStorage
  if (!isLoaded) return null;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
