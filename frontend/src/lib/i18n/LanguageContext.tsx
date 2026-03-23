'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import en from './translations/en';
import vi from './translations/vi';

export type Locale = 'en' | 'vi';

const translations = { en, vi } as const;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// Helper to get nested value by dot-separated key
function getNestedValue(obj: Record<string, unknown>, key: string): string {
  const keys = key.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return key; // Return key as fallback
    }
    current = (current as Record<string, unknown>)[k];
  }
  return typeof current === 'string' ? current : key;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('gxktm-language') as Locale | null;
    if (saved && (saved === 'en' || saved === 'vi')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('gxktm-language', newLocale);
    // Update html lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(
      translations[locale] as unknown as Record<string, unknown>,
      key
    );

    // Fallback to English if key not found in current locale
    if (value === key) {
      value = getNestedValue(
        translations.en as unknown as Record<string, unknown>,
        key
      );
    }

    // Replace template parameters like {count}, {year}, etc.
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
    }

    return value;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
