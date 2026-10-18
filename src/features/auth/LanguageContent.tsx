import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text } from 'react-native';

import { Button, Card } from '@/design-system';
import { LANGUAGE_STORAGE_KEY } from './use-persisted-language';
import { sessionStorage } from '@/lib/session-storage';

export function LanguageContent() {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function selectLanguage(language: 'ca' | 'es') {
    setBusy(true);
    setError(false);
    try {
      await sessionStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      await i18n.changeLanguage(language);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20 }}>
      <Card className="gap-4">
        <Text className="font-body text-[14px] leading-[21px] text-ink-soft dark:text-ink-dark-soft">
          {t('auth.languageBody')}
        </Text>
        <Button
          variant={i18n.resolvedLanguage === 'ca' ? 'primary' : 'outline'}
          disabled={busy}
          accessibilityState={{ selected: i18n.resolvedLanguage === 'ca', disabled: busy }}
          onPress={() => void selectLanguage('ca')}
        >
          Català
        </Button>
        <Button
          variant={i18n.resolvedLanguage === 'es' ? 'primary' : 'outline'}
          disabled={busy}
          accessibilityState={{ selected: i18n.resolvedLanguage === 'es', disabled: busy }}
          onPress={() => void selectLanguage('es')}
        >
          Castellano
        </Button>
        {error ? (
          <Text accessibilityRole="alert" className="font-body text-[13px] text-danger">
            {t('auth.languageError')}
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}
