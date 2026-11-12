import { useTranslation } from 'react-i18next';

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-xl text-primary">{t('brand.name')}</span>
      <span
        className={`rounded-pill bg-surface-hi px-2.5 py-0.5 font-label text-xs text-primary-dark ${compact ? 'hidden sm:inline' : ''}`}
      >
        {t('brand.area')}
      </span>
    </div>
  );
}
