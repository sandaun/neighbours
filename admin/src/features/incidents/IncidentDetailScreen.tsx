import { ChevronLeft } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { type IncidentDetail, incidentStatuses, type IncidentStatus } from './incidents-api';
import { useAddIncidentUpdate, useIncident } from './queries';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/Button';
import { NotFound } from '@/components/NotFound';
import { ErrorState, LoadingState } from '@/components/QueryState';
import { Select } from '@/components/Select';
import { useCommunity } from '@/features/communities/CommunityLayout';
import { formatDateTime } from '@/lib/format';

const MAX_BODY = 4000;

export function IncidentDetailScreen() {
  const { t } = useTranslation();
  const { incidentId = '' } = useParams();
  const { communityId } = useCommunity();
  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/communities/${communityId}/incidents`}
        className="inline-flex items-center gap-1 self-start font-label text-xs text-ink-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-primary-dark"
      >
        <ChevronLeft aria-hidden size={14} />
        {t('incidents.backToList')}
      </Link>
      <IncidentDetailContent communityId={communityId} incidentId={incidentId} />
    </div>
  );
}

function IncidentDetailContent({
  communityId,
  incidentId,
}: {
  communityId: string;
  incidentId: string;
}) {
  const { t } = useTranslation();
  const query = useIncident(communityId, incidentId);
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (!query.data)
    return <NotFound title={t('incidents.notFoundTitle')} body={t('incidents.notFoundBody')} />;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <IncidentSummaryCard incident={query.data} />
      <div className="lg:sticky lg:top-24">
        <ReplyForm communityId={communityId} incident={query.data} />
      </div>
    </div>
  );
}

function IncidentSummaryCard({ incident }: { incident: IncidentDetail }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  return (
    <article aria-labelledby="incident-title" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 id="incident-title" className="font-display text-3xl text-ink">
            {incident.title}
          </h1>
          <StatusBadge status={incident.status} />
        </div>
        <p className="text-sm text-ink-muted">
          {t('incidents.reportedAt', { date: formatDateTime(incident.reportedAt, language) })}
        </p>
      </header>

      <dl className="grid gap-4 rounded-lg border border-outline/60 bg-surface p-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="font-label text-xs text-ink-soft">{t('incidents.category')}</dt>
          <dd className="text-ink">{t(`incidents.categories.${incident.category}`)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-label text-xs text-ink-soft">{t('incidents.location')}</dt>
          <dd className="text-ink">{incident.location}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <dt className="font-label text-xs text-ink-soft">{t('incidents.description')}</dt>
          <dd className="whitespace-pre-line text-ink">{incident.description}</dd>
        </div>
      </dl>

      {incident.hasPhoto &&
        (incident.photoUrl ? (
          <img
            src={incident.photoUrl}
            alt={t('incidents.photo')}
            className="max-h-[420px] w-full rounded-lg border border-outline/60 bg-surface object-contain"
          />
        ) : (
          <p className="rounded-lg bg-surface-hi px-4 py-3 text-sm text-ink-soft">
            {t('incidents.photoUnavailable')}
          </p>
        ))}

      <section aria-labelledby="history-title" className="flex flex-col gap-3">
        <h2 id="history-title" className="font-display text-xl text-ink">
          {t('incidents.history')}
        </h2>
        {incident.updates.length === 0 ? (
          <p className="text-sm text-ink-soft">{t('incidents.noUpdates')}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {incident.updates.map((update) => (
              <li
                key={update.id}
                className="flex flex-col gap-2 rounded-lg border border-outline/60 bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-body text-sm font-semibold text-ink">
                    {update.authorName}
                  </span>
                  <time dateTime={update.createdAt} className="text-xs text-ink-muted">
                    {formatDateTime(update.createdAt, language)}
                  </time>
                </div>
                <p className="whitespace-pre-line text-ink">{update.body}</p>
                {update.status && (
                  <p className="text-xs text-ink-soft">
                    {t('incidents.statusChanged', {
                      status: t(`incidents.statuses.${update.status}`),
                    })}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}

function ReplyForm({ communityId, incident }: { communityId: string; incident: IncidentDetail }) {
  const { t } = useTranslation();
  const bodyId = useId();
  const hintId = useId();
  const statusId = useId();
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<IncidentStatus | ''>('');
  const [touched, setTouched] = useState(false);
  const mutation = useAddIncidentUpdate(communityId, incident.id);
  const trimmed = body.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= MAX_BODY;
  const showValidation = touched && !valid;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!valid || mutation.isPending) return;
    mutation.mutate(
      { body: trimmed, status: status || null },
      {
        onSuccess: () => {
          setBody('');
          setStatus('');
          setTouched(false);
        },
      }
    );
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="reply-title"
      className="flex flex-col gap-4 rounded-xl border border-outline/60 bg-surface p-5 shadow-sm"
    >
      <h2 id="reply-title" className="font-display text-xl text-ink">
        {t('incidents.form.title')}
      </h2>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={bodyId} className="font-label text-xs text-ink-soft">
          {t('incidents.form.body')}
        </label>
        <textarea
          id={bodyId}
          rows={5}
          maxLength={MAX_BODY}
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            mutation.reset();
          }}
          onBlur={() => setTouched(true)}
          placeholder={t('incidents.form.bodyPlaceholder')}
          aria-describedby={hintId}
          aria-invalid={showValidation || undefined}
          disabled={mutation.isPending}
          className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 aria-invalid:border-danger"
        />
        <p id={hintId} className={`text-xs ${showValidation ? 'text-danger' : 'text-ink-muted'}`}>
          {showValidation ? t('incidents.form.validation') : t('incidents.form.bodyHint')}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={statusId} className="font-label text-xs text-ink-soft">
          {t('incidents.form.status')}
        </label>
        <Select
          id={statusId}
          value={status}
          onValueChange={(value) => setStatus(value as IncidentStatus | '')}
          disabled={mutation.isPending}
          options={[
            {
              value: '',
              label: t('incidents.form.keepStatus', {
                status: t(`incidents.statuses.${incident.status}`),
              }),
            },
            ...incidentStatuses
              .filter((value) => value !== incident.status)
              .map((value) => ({ value, label: t(`incidents.statuses.${value}`) })),
          ]}
        />
      </div>
      {mutation.isError && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {t('incidents.form.error')}
        </p>
      )}
      {mutation.isSuccess && (
        <p
          role="status"
          className="rounded-md bg-secondary/20 px-3 py-2 text-sm text-secondary-txt"
        >
          {t('incidents.form.success')}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? t('incidents.form.submitting') : t('incidents.form.submit')}
      </Button>
    </form>
  );
}
