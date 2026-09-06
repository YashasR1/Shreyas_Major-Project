import React, { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES, translations } from '../lib/translations';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  languages: LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('smart_ration_language') || 'en';
  });

  const setLanguage = (langCode) => {
    setLanguageState(langCode);
    localStorage.setItem('smart_ration_language', langCode);
  };

  const t = (key, fallback = '') => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    const defaultDict = translations.en;
    if (defaultDict && defaultDict[key] !== undefined) {
      return defaultDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
