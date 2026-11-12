import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ca from './locales/ca.json';
import es from './locales/es.json';

export const languages = ['ca', 'es'] as const;
export type Language = (typeof languages)[number];

const storageKey = 'neighbours-admin.language';

function storedLanguage(): Language | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value === 'ca' || value === 'es' ? value : null;
  } catch {
    return null;
  }
}

function initialLanguage(): Language {
  return storedLanguage() ?? (navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'ca');
}

export function setLanguage(language: Language) {
  void i18n.changeLanguage(language);
  try {
    localStorage.setItem(storageKey, language);
  } catch {
    // The preference is a convenience; the UI still switches without storage.
  }
}

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources: { ca: { translation: ca }, es: { translation: es } },
  lng: initialLanguage(),
  fallbackLng: 'ca',
  interpolation: { escapeValue: false },
});

export default i18n;
