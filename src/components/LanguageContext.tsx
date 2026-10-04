'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Language, TranslationSchema, DICTIONARY } from '@/lib/i18n'

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: TranslationSchema;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('preferred_lang') as Language;
      if (saved === 'tr' || saved === 'en') return saved;
      if (typeof navigator !== 'undefined' && navigator.language) {
        if (!navigator.language.toLowerCase().startsWith('tr')) {
          return 'en';
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  return 'tr';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  // CSS "uppercase" dönüşümü <html lang>'e göre yapılır: lang="tr" kalırsa İngilizce
  // "Eating" → "EATİNG" olur. Dil değişince lang ve sekme başlığını da güncelle.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = DICTIONARY[lang].meta.title;
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('preferred_lang', newLang);
    } catch {
      // Ignore localStorage errors
    }
  };

  const toggleLang = () => {
    setLang(lang === 'tr' ? 'en' : 'tr');
  };

  const value: LanguageContextType = {
    lang,
    setLang,
    toggleLang,
    t: DICTIONARY[lang] || DICTIONARY.tr
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
