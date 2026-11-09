import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';

import { incidentStatuses, type IncidentStatus } from './incidents-api';
import { useIncidents } from './queries';
import { StatusBadge } from './StatusBadge';
import { NotFound } from '@/components/NotFound';
import { ErrorState, LoadingState } from '@/components/QueryState';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatDateTime } from '@/lib/format';

const isStatus = (value: string | null): value is IncidentStatus =>
  incidentStatuses.includes(value as IncidentStatus);

export function IncidentsScreen() {
  const { communityId = '' } = useParams();
  const community = useAuth().communities.find((item) => item.communityId === communityId);
  if (!community) return <NotFound />;
  return <IncidentsList communityId={communityId} communityName={community.communityName} />;
}

function IncidentsList({
  communityId,
  communityName,
}: {
  communityId: string;
  communityName: string;
}) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('status');
  const filter = isStatus(filterParam) ? filterParam : null;
  const query = useIncidents(communityId);
  const incidents = query.data ?? [];
  const visible = filter ? incidents.filter((incident) => incident.status === filter) : incidents;
  const count = (status: IncidentStatus | null) =>
    status ? incidents.filter((incident) => incident.status === status).length : incidents.length;

  return (
    <section aria-labelledby="incidents-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 self-start font-label text-xs text-ink-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-primary-dark"
        >
          <ChevronLeft aria-hidden size={14} />
          {t('incidents.back')}
        </Link>
        <p className="font-label text-xs tracking-wide text-primary uppercase">{communityName}</p>
        <h1 id="incidents-title" className="font-display text-3xl text-ink">
          {t('incidents.title')}
        </h1>
        <p className="text-ink-soft">{t('incidents.subtitle')}</p>
      </div>

      <div role="group" aria-label={t('incidents.filters.label')} className="flex flex-wrap gap-2">
        {[null, ...incidentStatuses].map((status) => {
          const active = status === filter;
          const label = status ? t(`incidents.statuses.${status}`) : t('incidents.filters.all');
          return (
            <button
              key={status ?? 'all'}
              type="button"
              aria-pressed={active}
              aria-label={query.isSuccess ? `${label} (${count(status)})` : label}
              onClick={() => setSearchParams(status ? { status } : {}, { replace: true })}
              className={`min-h-9 rounded-pill border px-4 font-label text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark ${
                active
                  ? 'border-primary bg-primary text-primary-on'
                  : 'border-outline bg-surface text-ink hover:bg-surface-hi'
              }`}
            >
              {label}
              {query.isSuccess && (
                <span aria-hidden className="ml-1.5 opacity-75">
                  {count(status)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline px-4 py-8 text-center text-ink-soft">
          {filter ? t('incidents.emptyFilter') : t('incidents.empty')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-outline/50 overflow-hidden rounded-lg border border-outline/60 bg-surface">
          {visible.map((incident) => (
            <li key={incident.id}>
              <Link
                to={incident.id}
                className="flex items-center gap-4 px-4 py-4 hover:bg-surface-hi/50 focus-visible:bg-surface-hi focus-visible:outline-none sm:px-5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="line-clamp-2 font-body font-semibold break-words text-ink">
                    {incident.title}
                  </span>
                  <span className="truncate text-sm text-ink-soft">
                    {t(`incidents.categories.${incident.category}`)} · {incident.location}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {formatDateTime(incident.reportedAt, i18n.resolvedLanguage)}
                  </span>
                </div>
                <StatusBadge status={incident.status} />
                <ChevronRight aria-hidden size={18} className="shrink-0 text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
