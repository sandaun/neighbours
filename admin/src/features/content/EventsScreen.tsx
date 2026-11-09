import { CalendarDays, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

  return (
    <CrudScreen
      api={eventsApi}
      communityId={communityId}
      title={t('events.title')}
      subtitle={t('events.subtitle')}
      addLabel={t('events.add')}
      emptyText={t('events.empty')}
      itemName={(row) => row.title}
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

function EventForm({ initial, pending, onSubmit, onCancel }: FormProps<EventRow, EventInput>) {
  const { t } = useTranslation();
  const messages = useLengthMessages();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.starts_at));
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
