import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { sessionStorage } from '@/lib/session-storage';

export const LANGUAGE_STORAGE_KEY = 'neighbours.language';

export function usePersistedLanguage() {
  const { i18n } = useTranslation();
  useEffect(() => {
    let active = true;
    // A user's explicit selection must win over a late initial storage read.
    let languageChanged = false;
    const onChange = () => {
      languageChanged = true;
    };
    i18n.on('languageChanged', onChange);
    void sessionStorage
      .getItem(LANGUAGE_STORAGE_KEY)
      .then((language) => {
        if (active && !languageChanged && (language === 'ca' || language === 'es')) {
          return i18n.changeLanguage(language);
        }
      })
      .catch(() => {
        // An unavailable preference store must not block authentication.
      });
    return () => {
      active = false;
      i18n.off('languageChanged', onChange);
    };
  }, [i18n]);
}
