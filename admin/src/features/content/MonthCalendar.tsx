import { ChevronLeft, ChevronRight, MapPin, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { EventRow } from './content-api';
import { Button } from '@/components/Button';

const MAX_CHIPS = 3;
const locale = (language: string | undefined) => (language === 'es' ? 'es-ES' : 'ca-ES');
const pad = (value: number) => String(value).padStart(2, '0');

/** Local calendar day of a date, as YYYY-MM-DD. */
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
/** "YYYY-MM" of a local date. */
export const monthKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export function parseMonth(value: string | null, fallback: Date): Date {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

// Monday-first weeks covering the whole month.
function monthDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days: Date[] = [];
  for (
    let day = new Date(start);
    days.length % 7 !== 0 || day <= last;
    day.setDate(day.getDate() + 1)
  ) {
    days.push(new Date(day));
  }
  return days;
}

export function MonthCalendar({
  events,
  month,
  today,
  onMonthChange,
  onEdit,
  onCreate,
}: {
  events: EventRow[];
  month: Date;
  today: Date;
  onMonthChange(month: Date): void;
  onEdit(id: string): void;
  onCreate(startsAt: string): void;
}) {
  const { t, i18n } = useTranslation();
  const lang = locale(i18n.resolvedLanguage);
  const [selected, setSelected] = useState<string | null>(null);
  const todayKey = dayKey(today);

  const byDay = new Map<string, EventRow[]>();
  for (const event of [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const key = dayKey(new Date(event.starts_at));
    byDay.set(key, [...(byDay.get(key) ?? []), event]);
  }

  const time = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
  const longDay = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const monthTitle = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(
    month
  );
  // 1 January 2024 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2024, 0, 1 + index))
  );
  const shift = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  // New events from the calendar start at 18:00 on the chosen day.
  const createOn = (key: string) => onCreate(new Date(`${key}T18:00`).toISOString());

  const selectedDate = selected ? new Date(`${selected}T12:00`) : null;
  const selectedEvents = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-ink first-letter:uppercase" aria-live="polite">
          {monthTitle}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="min-h-9 px-3"
            onClick={() => {
              onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelected(todayKey);
            }}
          >
            {t('events.calendar.today')}
          </Button>
          <Button
            variant="ghost"
            className="min-h-9 px-2"
            aria-label={t('events.calendar.previous')}
            onClick={() => shift(-1)}
          >
            <ChevronLeft aria-hidden size={18} />
          </Button>
          <Button
            variant="ghost"
            className="min-h-9 px-2"
            aria-label={t('events.calendar.next')}
            onClick={() => shift(1)}
          >
            <ChevronRight aria-hidden size={18} />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-outline/60 bg-surface">
        <div className="grid grid-cols-7 border-b border-outline/60 bg-bg" aria-hidden>
          {weekdays.map((weekday) => (
            <div
              key={weekday}
              className="px-2 py-2 text-center font-label text-[11px] text-ink-soft uppercase"
            >
              {weekday.replace('.', '')}
            </div>
          ))}
        </div>
        <ol className="grid grid-cols-7">
          {monthDays(month).map((date) => {
            const key = dayKey(date);
            const dayEvents = byDay.get(key) ?? [];
            const inMonth = date.getMonth() === month.getMonth();
            const isToday = key === todayKey;
            const isSelected = key === selected;
            const label = longDay.format(date);
            return (
              <li
                key={key}
                className={`group relative flex min-h-16 flex-col gap-1 border-r border-b border-outline/40 p-1 last:border-r-0 sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${
                  inMonth ? '' : 'bg-bg/60'
                } ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setSelected(isSelected ? null : key)}
                  aria-pressed={isSelected}
                  aria-label={`${label}: ${t('events.calendar.count', { count: dayEvents.length })}`}
                  className="absolute inset-0 rounded-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-dark"
                />
                <span
                  className={`pointer-events-none relative inline-flex size-7 items-center justify-center self-start rounded-full text-sm ${
                    isToday
                      ? 'bg-primary font-semibold text-primary-on'
                      : inMonth
                        ? 'text-ink'
                        : 'text-ink-muted'
                  }`}
                  aria-hidden
                >
                  {date.getDate()}
                </span>
                {/* Small screens: one dot per day with events. */}
                {dayEvents.length > 0 && (
                  <span
                    aria-hidden
                    className="pointer-events-none relative mx-auto size-1.5 rounded-full bg-primary sm:hidden"
                  />
                )}
                <div className="pointer-events-none relative hidden flex-col gap-0.5 sm:flex">
                  {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEdit(event.id)}
                      title={event.title}
                      aria-label={t('crud.editLabel', { name: event.title })}
                      className="pointer-events-auto truncate rounded-md bg-surface-hi px-1.5 py-0.5 text-left text-xs text-primary-dark hover:bg-highlight focus-visible:outline-2 focus-visible:outline-primary-dark"
                    >
                      <span className="font-semibold">
                        {time.format(new Date(event.starts_at))}
                      </span>{' '}
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > MAX_CHIPS && (
                    <button
                      type="button"
                      onClick={() => setSelected(key)}
                      className="pointer-events-auto self-start rounded-md px-1.5 text-xs text-ink-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-primary-dark"
                    >
                      {t('events.calendar.more', { count: dayEvents.length - MAX_CHIPS })}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => createOn(key)}
                  aria-label={t('events.calendar.addOn', { date: label })}
                  className="absolute top-1 right-1 hidden size-6 items-center justify-center rounded-full text-ink-soft opacity-0 group-hover:opacity-100 hover:bg-surface-hi hover:text-primary focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary-dark sm:inline-flex"
                >
                  <Plus aria-hidden size={14} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {selected && selectedDate && (
        <section
          aria-label={longDay.format(selectedDate)}
          className="flex flex-col gap-3 rounded-lg border border-outline/60 bg-surface p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg text-ink first-letter:uppercase">
              {longDay.format(selectedDate)}
            </h3>
            <Button variant="outline" className="min-h-9" onClick={() => createOn(selected)}>
              <Plus aria-hidden size={14} />
              {t('events.add')}
            </Button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('events.calendar.noEvents')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-outline/40">
              {selectedEvents.map((event) => (
                <li key={event.id} className="flex items-center gap-3 py-2">
                  <span className="w-12 shrink-0 font-label text-sm text-primary-dark">
                    {time.format(new Date(event.starts_at))}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-ink">{event.title}</span>
                    <span className="inline-flex items-center gap-1 truncate text-xs text-ink-soft">
                      <MapPin aria-hidden size={12} />
                      {event.location}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    className="px-3"
                    aria-label={t('crud.editLabel', { name: event.title })}
                    onClick={() => onEdit(event.id)}
                  >
                    <Pencil aria-hidden size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
