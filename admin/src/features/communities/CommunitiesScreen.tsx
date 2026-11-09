import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
          <li
            key={community.communityId}
            className="flex items-center gap-3 rounded-lg border border-outline/60 bg-surface p-5 shadow-sm"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-hi text-primary">
              <Building2 aria-hidden size={22} />
            </span>
            <span className="font-body text-base font-semibold text-ink">
              {community.communityName}
            </span>
          </li>
        ))}
      </ul>
      <p className="rounded-lg bg-surface-hi px-4 py-3 text-sm text-ink-soft">
        {t('communities.comingSoon')}
      </p>
    </section>
  );
}
