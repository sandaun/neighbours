import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export function NotFound({ title, body }: { title?: string; body?: string }) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col items-start gap-3 py-10">
      <h1 className="font-display text-2xl text-ink">{title ?? t('notFound.title')}</h1>
      <p className="text-ink-soft">{body ?? t('notFound.body')}</p>
      <Link
        to="/"
        className="font-label text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary-dark"
      >
        {t('notFound.back')}
      </Link>
    </section>
  );
}
