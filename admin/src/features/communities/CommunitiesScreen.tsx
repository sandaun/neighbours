import { Building2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useAuth } from '@/features/auth/AuthProvider';

export function CommunitiesScreen() {
  const { t } = useTranslation();
  const { communities } = useAuth();

  return (
    <section aria-labelledby="communities-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 id="communities-title" className="font-display text-3xl text-ink">
          {t('communities.title')}
        </h1>
        <p className="text-ink-soft">{t('communities.subtitle', { count: communities.length })}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => (
          <li key={community.communityId}>
            <Link
              to={`/communities/${community.communityId}/incidents`}
              aria-label={t('communities.open', { name: community.communityName })}
              className="flex items-center gap-3 rounded-lg border border-outline/60 bg-surface p-5 shadow-sm transition-colors hover:border-primary/60 hover:bg-surface-hi/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-hi text-primary">
                <Building2 aria-hidden size={22} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-body text-base font-semibold text-ink">
                  {community.communityName}
                </span>
                <span className="font-label text-xs text-ink-soft">{t('communities.manage')}</span>
              </span>
              <ChevronRight aria-hidden size={18} className="shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="rounded-lg bg-surface-hi px-4 py-3 text-sm text-ink-soft">
        {t('communities.comingSoon')}
      </p>
    </section>
  );
}
