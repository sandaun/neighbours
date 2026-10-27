import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';

import type { ModuleItem, MoreModuleData } from '@/data';
import { Card, SectionHeader } from '@/design-system';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

// Leave a rounding margin so seven percentage cells stay on the same native row.
const CALENDAR_CELL_STYLE: ViewStyle = { width: '14.28%' };

type CalendarEvent = ModuleItem & { startsAt: string };

function isCalendarEvent(item: ModuleItem): item is CalendarEvent {
  return typeof item.startsAt === 'string';
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonth(date: Date, locale: string): string {
  const label = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);

  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function formatTimeRange(event: CalendarEvent, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const start = formatter.format(new Date(event.startsAt));

  return event.endsAt ? `${start}–${formatter.format(new Date(event.endsAt))}` : start;
}

function DateBadge({ date, locale }: { date: Date; locale: string }) {
  const month = new Intl.DateTimeFormat(locale, { month: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase();

  return (
    <View className="h-14 w-14 items-center justify-center rounded-lg bg-primary">
      <Text className="font-body-semi text-[20px] leading-[24px] text-primary-on">
        {date.getDate()}
      </Text>
      <Text className="font-label text-[9px] uppercase leading-[12px] text-primary-on/85">
        {month}
      </Text>
    </View>
  );
}

export function CalendarModuleContent({ data }: { data: MoreModuleData }) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const today = new Date();
  const events = useMemo(
    () => data.sections.flatMap((section) => section.items).filter(isCalendarEvent),
    [data.sections]
  );
  const todayKey = getDateKey(today);
  const initialEvent =
    events.find((event) => getDateKey(new Date(event.startsAt)) === todayKey) ?? events[0];
  const initialDate = initialEvent ? new Date(initialEvent.startsAt) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(initialDate));
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(initialDate));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlankDays = (new Date(year, month, 1).getDay() + 6) % 7;
  const selectedEvents = events.filter(
    (event) => getDateKey(new Date(event.startsAt)) === selectedDateKey
  );
  const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
  const isTodaySelected =
    selectedDateKey === todayKey && year === today.getFullYear() && month === today.getMonth();

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(year, month + offset, 1);
    setVisibleMonth(nextMonth);
    setSelectedDateKey(getDateKey(nextMonth));
  };

  const goToToday = () => {
    setVisibleMonth(getMonthStart(today));
    setSelectedDateKey(todayKey);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: !isTodaySelected
            ? () => (
                <Pressable
                  accessibilityLabel={t('more.modules.calendar.today')}
                  accessibilityRole="button"
                  className="h-11 justify-center px-1"
                  onPress={goToToday}
                >
                  <Text className="font-body-semi text-[15px] leading-[20px] text-primary dark:text-primary-darkmode">
                    {t('more.modules.calendar.today')}
                  </Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <ScrollView contentContainerClassName="px-5 pb-12" contentInsetAdjustmentBehavior="automatic">
        <Text className="pt-5 font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
          {t(data.descriptionKey)}
        </Text>

        <View className="mt-5">
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityLabel={t('more.modules.calendar.previousMonth')}
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full border border-outline active:bg-surface-hi dark:border-outline-dark dark:active:bg-surface-dark-hi"
              onPress={() => changeMonth(-1)}
            >
              <ChevronLeft color={colors.textSoft} size={20} />
            </Pressable>
            <Text className="font-display-semi text-[21px] leading-[28px] text-ink dark:text-ink-dark">
              {formatMonth(visibleMonth, locale)}
            </Text>
            <Pressable
              accessibilityLabel={t('more.modules.calendar.nextMonth')}
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full border border-outline active:bg-surface-hi dark:border-outline-dark dark:active:bg-surface-dark-hi"
              onPress={() => changeMonth(1)}
            >
              <ChevronRight color={colors.textSoft} size={20} />
            </Pressable>
          </View>

          <View className="mt-4 flex-row">
            {WEEKDAY_KEYS.map((weekday) => (
              <View className="items-center" key={weekday} style={CALENDAR_CELL_STYLE}>
                <Text className="font-label text-[10px] uppercase leading-[14px] text-ink-muted dark:text-ink-dark-soft">
                  {t(`more.modules.calendar.weekdays.${weekday}`)}
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-2 flex-row flex-wrap">
            {Array.from({ length: leadingBlankDays }, (_, index) => (
              <View className="h-11" key={`blank-${index}`} style={CALENDAR_CELL_STYLE} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const dateKey = getDateKey(date);
              const isSelected = dateKey === selectedDateKey;
              const isToday = dateKey === todayKey;
              const hasEvent = events.some(
                (event) => getDateKey(new Date(event.startsAt)) === dateKey
              );
              const dayStateClass = isSelected
                ? 'bg-primary'
                : isToday
                  ? 'border-2 border-primary'
                  : hasEvent
                    ? 'border border-highlight bg-surface-hi/40 dark:border-primary-darkmode/60 dark:bg-surface-dark-hi'
                    : 'bg-transparent';
              const dayLabelClass = isSelected
                ? 'text-primary-on'
                : hasEvent || isToday
                  ? 'text-primary dark:text-primary-darkmode'
                  : 'text-ink dark:text-ink-dark';

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className="h-11 items-center justify-center"
                  key={dateKey}
                  onPress={() => setSelectedDateKey(dateKey)}
                  style={CALENDAR_CELL_STYLE}
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-md ${dayStateClass}`}
                  >
                    <Text className={`font-body-semi text-[14px] leading-[20px] ${dayLabelClass}`}>
                      {day}
                    </Text>
                    {hasEvent ? (
                      <View
                        className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-primary-on/85' : 'bg-primary dark:bg-primary-darkmode'
                        }`}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <SectionHeader title={t('more.modules.calendar.eventsForDay')} />
        {selectedEvents.length > 0 ? (
          <View className="gap-3">
            {selectedEvents.map((event) => (
              <Card className="flex-row items-center gap-4" key={event.id}>
                <DateBadge date={selectedDate} locale={locale} />
                <View className="flex-1">
                  <Text className="font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
                    {event.title}
                  </Text>
                  <Text className="mt-0.5 font-body text-[13px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
                    {formatTimeRange(event, locale)}
                    {event.meta ? ` · ${event.meta}` : ''}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View className="rounded-lg bg-surface-hi/50 p-4 dark:bg-surface-dark-hi">
            <Text className="font-body text-[13px] leading-[19px] text-ink-soft dark:text-ink-dark-soft">
              {t('more.modules.calendar.noEvents')}
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
