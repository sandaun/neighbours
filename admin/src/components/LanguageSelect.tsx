import { useTranslation } from 'react-i18next';

import { type Language, languages, setLanguage } from '@/i18n';

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <label className="flex items-center gap-2 font-label text-xs text-ink-soft">
      <span className="sr-only">{t('language.label')}</span>
      <select
        className="min-h-9 rounded-md border border-outline bg-surface px-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary-dark"
        value={i18n.resolvedLanguage}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        {languages.map((language) => (
          <option key={language} value={language}>
            {t(`language.${language}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
