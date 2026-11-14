import { useTranslation } from 'react-i18next';

import logo from '@/assets/finquify-logo.svg';

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="Finquify" className={compact ? 'w-28' : 'w-40'} />
      <span
        className={`rounded-pill bg-surface-hi px-2.5 py-0.5 font-label text-xs text-primary-dark ${compact ? 'hidden sm:inline' : ''}`}
      >
        {t('brand.area')}
      </span>
    </div>
  );
}
