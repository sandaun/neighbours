import { useTranslation } from 'react-i18next';

import { Select } from './Select';
import { type Language, languages, setLanguage } from '@/i18n';

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <div className="w-32">
      <Select
        size="sm"
        aria-label={t('language.label')}
        value={i18n.resolvedLanguage ?? 'ca'}
        onValueChange={(value) => setLanguage(value as Language)}
        options={languages.map((language) => ({
          value: language,
          label: t(`language.${language}`),
        }))}
      />
    </div>
  );
}
