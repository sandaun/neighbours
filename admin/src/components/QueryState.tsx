import { useTranslation } from 'react-i18next';

import { Button } from './Button';

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <p role="status" className="flex items-center gap-3 py-10 text-ink-soft">
      <span
        aria-hidden
        className="size-5 animate-spin rounded-full border-2 border-surface-hi border-t-primary"
      />
      {t('incidents.loading')}
    </p>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-danger/10 p-5">
      <p className="font-body font-semibold text-danger">{t('incidents.loadErrorTitle')}</p>
      <p className="text-sm text-ink-soft">{t('incidents.loadErrorBody')}</p>
      <Button variant="outline" onClick={onRetry}>
        {t('incidents.retry')}
      </Button>
    </div>
  );
}
