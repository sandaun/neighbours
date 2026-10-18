import { getLocales } from 'expo-localization';
import { init, use as registerPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

import ca from './locales/ca.json';
import es from './locales/es.json';
import authCa from './locales/auth-ca.json';
import authEs from './locales/auth-es.json';
import incidentCa from './locales/incident-ca.json';
import incidentEs from './locales/incident-es.json';

const deviceLanguage = getLocales()[0]?.languageCode;

registerPlugin(initReactI18next);
init({
  resources: {
    ca: { translation: { ...ca, ...authCa, ...incidentCa } },
    es: { translation: { ...es, ...authEs, ...incidentEs } },
  },
  lng: deviceLanguage === 'es' ? 'es' : 'ca',
  fallbackLng: 'ca',
  interpolation: { escapeValue: false },
});
