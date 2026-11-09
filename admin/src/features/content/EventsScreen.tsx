import { CalendarDays, List, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import {
  createEvent,
  deleteEvent,
  type EventInput,
  type EventRow,
  listEvents,
  updateEvent,
} from './content-api';
import { CrudScreen, FormCard, type FormProps } from './CrudScreen';
import { useLengthMessages } from './messages';
import { MonthCalendar, monthKey, parseMonth } from './MonthCalendar';
import type { CrudApi } from './use-crud';
import { lengthError, TextField } from '@/components/Field';
import { useCommunity } from '@/features/communities/CommunityLayout';
import { fromLocalInput, toLocalInput } from '@/lib/datetime';
import { formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';

const eventsApi: CrudApi<EventRow, EventInput> = {
  key: 'events',
  list: listEvents,
  create: createEvent,
  update: updateEvent,
  remove: (client, row) => deleteEvent(client, row.id),
};

export function EventsScreen() {
  const { t, i18n } = useTranslation();
  const { communityId } = useCommunity();
  const language = i18n.resolvedLanguage;
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'list' ? 'list' : 'month';
  const month = parseMonth(params.get('month'), new Date(now));
  const update = (changes: Record<string, string>) =>
    setParams((current) => ({ ...Object.fromEntries(current), ...changes }), { replace: true });

  return (
    <CrudScreen
      api={eventsApi}
      communityId={communityId}
      title={t('events.title')}
      subtitle={t('events.subtitle')}
      addLabel={t('events.add')}
      emptyText={t('events.empty')}
      itemName={(row) => row.title}
      toolbar={
        <div
          role="group"
          aria-label={t('events.views.label')}
          className="inline-flex rounded-pill border border-outline bg-surface p-1"
        >
          {(
            [
              ['month', CalendarDays, t('events.views.month')],
              ['list', List, t('events.views.list')],
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => update({ view: value })}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-pill px-3 font-label text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary-dark ${
                view === value ? 'bg-primary text-primary-on' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon aria-hidden size={14} />
              {label}
            </button>
          ))}
        </div>
      }
      renderCollection={
        view === 'month'
          ? (rows, actions) => (
              <MonthCalendar
                events={rows}
                month={month}
                today={new Date(now)}
                onMonthChange={(next) => update({ month: monthKey(next) })}
                onEdit={actions.edit}
                onCreate={(startsAt) => actions.create({ starts_at: startsAt })}
              />
            )
          : undefined
      }
      sections={(rows) => {
        const sorted = [...rows].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        const upcoming = sorted.filter((row) => Date.parse(row.ends_at ?? row.starts_at) >= now);
        const past = sorted.filter((row) => !upcoming.includes(row)).reverse();
        return [
          { title: t('events.upcoming'), rows: upcoming },
          { title: t('events.past'), rows: past },
        ];
      }}
      renderItem={(row) => (
        <div className="flex flex-col gap-1">
          <span className="font-body font-semibold text-ink">{row.title}</span>
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <CalendarDays aria-hidden size={14} />
            {formatDateTime(row.starts_at, language)}
            {row.ends_at && ` – ${formatDateTime(row.ends_at, language)}`}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin aria-hidden size={14} />
            {row.location}
          </span>
        </div>
      )}
      renderForm={(props) => <EventForm {...props} />}
    />
  );
}

function EventForm({
  initial,
  defaults,
  pending,
  onSubmit,
  onCancel,
}: FormProps<EventRow, EventInput>) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.starts_at ?? defaults?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.ends_at));
  const [submitted, setSubmitted] = useState(false);

  const starts = fromLocalInput(startsAt);
  const ends = fromLocalInput(endsAt);
  const errors = {
    title: lengthError(title, { max: 160 }, messages),
    location: lengthError(location, { max: 160 }, messages),
    startsAt: starts ? null : messages.required,
    endsAt: ends && starts && ends < starts ? t('events.endsBeforeStart') : null,
  };
  const show = (error: string | null) => (submitted ? error : null);

  return (
    <FormCard
      title={initial ? t('events.edit') : t('events.add')}
      pending={pending}
      onCancel={onCancel}
      onSubmit={() => {
        setSubmitted(true);
        if (Object.values(errors).some(Boolean) || !starts) return;
        onSubmit({
          title: title.trim(),
          location: location.trim(),
          starts_at: starts,
          ends_at: ends,
        });
      }}
    >
      <TextField
        label={t('events.fields.title')}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={show(errors.title)}
        maxLength={160}
        disabled={pending}
      />
      <TextField
        label={t('events.fields.location')}
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        error={show(errors.location)}
        placeholder={t('events.locationPlaceholder')}
        maxLength={160}
        disabled={pending}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('events.fields.startsAt')}
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          error={show(errors.startsAt)}
          disabled={pending}
        />
        <TextField
          label={t('events.fields.endsAt')}
          type="datetime-local"
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
          error={show(errors.endsAt)}
          hint={t('events.endsHint')}
          disabled={pending}
        />
      </div>
    </FormCard>
  );
}
