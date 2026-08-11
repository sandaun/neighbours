import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ca from './locales/ca.json';
import es from './locales/es.json';

const deviceLanguage = getLocales()[0]?.languageCode;

i18n.use(initReactI18next).init({
  resources: {
    ca: { translation: ca },
    es: { translation: es },
  },
  lng: deviceLanguage === 'es' ? 'es' : 'ca',
  fallbackLng: 'ca',
  interpolation: { escapeValue: false },
});

export default i18n;
