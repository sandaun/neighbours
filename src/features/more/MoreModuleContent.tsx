import {
  Bell,
  Calendar,
  CalendarCheck,
  IdCard,
  KeyRound,
  Languages,
  MessageSquare,
  ShieldCheck,
  TriangleAlert,
  User,
  Vote,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import type { ModuleItemTone, MoreModuleData, MoreModuleKey } from '@/data';
import { Card, Chip, SectionHeader } from '@/design-system';
import { useTheme } from '@/hooks/use-theme';
import { formatShortDate } from '@/utils/formatters';

import { CalendarModuleContent } from './CalendarModuleContent';

const BOARD_FILTERS = [
  { key: 'all', topic: null },
  { key: 'parking', topic: 'Parking' },
  { key: 'garden', topic: 'Jardí' },
  { key: 'activities', topic: 'Activitats' },
] as const;

const MODULE_ICONS: Record<MoreModuleKey, LucideIcon> = {
  voting: Vote,
  board: MessageSquare,
  bookings: CalendarCheck,
  calendar: Calendar,
  directory: IdCard,
  access: KeyRound,
  emergencies: TriangleAlert,
  profile: User,
  notifications: Bell,
  language: Languages,
  privacy: ShieldCheck,
};

const badgeStyles: Record<ModuleItemTone, string> = {
  default: 'bg-surface-hi dark:bg-surface-dark-hi',
  success: 'bg-secondary/25',
  warning: 'bg-tertiary/15',
  danger: 'bg-danger/10',
};

const badgeLabelStyles: Record<ModuleItemTone, string> = {
  default: 'text-ink dark:text-ink-dark',
  success: 'text-secondary-txt dark:text-secondary',
  warning: 'text-tertiary-txt dark:text-tertiary',
  danger: 'text-danger dark:text-danger-soft',
};

function ModuleBadge({ label, tone = 'default' }: { label: string; tone?: ModuleItemTone }) {
  return (
    <View className={`self-start rounded-pill px-2.5 py-1 ${badgeStyles[tone]}`}>
      <Text className={`font-label text-[10px] leading-[14px] ${badgeLabelStyles[tone]}`}>
        {label}
      </Text>
    </View>
  );
}

export function MoreModuleContent({ data }: { data: MoreModuleData }) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const isBoard = data.key === 'board';
  const sections =
    isBoard && selectedTopic !== null
      ? data.sections
          .map((section) => ({
            ...section,
            items: section.items.filter((item) => item.topic === selectedTopic),
          }))
          .filter((section) => section.items.length > 0)
      : data.sections;
  const highlightTone = data.highlight.tone ?? 'default';
  const HighlightIcon = MODULE_ICONS[data.key];
  const highlightIconColor = highlightTone === 'danger' ? colors.danger : colors.primary;

  if (data.key === 'calendar') {
    return <CalendarModuleContent data={data} />;
  }

  return (
    <ScrollView contentContainerClassName="px-5 pb-12" contentInsetAdjustmentBehavior="automatic">
      <Text className="pt-5 font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
        {t(data.descriptionKey)}
      </Text>

      {isBoard ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 py-4"
        >
          {BOARD_FILTERS.map((filter) => (
            <Chip
              key={filter.key}
              selected={selectedTopic === filter.topic}
              onPress={() => setSelectedTopic(filter.topic)}
            >
              {t(`more.modules.board.filters.${filter.key}`)}
            </Chip>
          ))}
        </ScrollView>
      ) : null}

      <Card className="mt-5 flex-row items-center justify-between gap-4" variant="elevated">
        <View className="flex-1">
          <Text className="font-label text-[10px] uppercase leading-[14px] tracking-[1.1px] text-ink-muted dark:text-ink-dark-soft">
            {t(data.highlight.labelKey)}
          </Text>
          <Text className="mt-1 font-display text-[27px] leading-[34px] text-ink dark:text-ink-dark">
            {data.highlight.value}
          </Text>
        </View>
        <View
          className={`h-12 w-12 items-center justify-center rounded-full ${badgeStyles[highlightTone]}`}
        >
          <HighlightIcon color={highlightIconColor} size={23} />
        </View>
      </Card>

      {isBoard && !sections.some((section) => section.items.length > 0) ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-6 font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft"
        >
          {t('more.modules.board.noPosts')}
        </Text>
      ) : null}

      {sections.map((section) => (
        <View key={section.id}>
          <SectionHeader title={t(section.titleKey)} />
          <View className="gap-3">
            {section.items.map((item) => (
              <Card className="gap-2" key={item.id}>
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
                    {item.title}
                  </Text>
                  {item.badgeKey ? <ModuleBadge label={t(item.badgeKey)} tone={item.tone} /> : null}
                </View>
                {item.subtitle ? (
                  <Text className="font-body text-[13px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
                    {item.subtitle}
                  </Text>
                ) : null}
                {item.meta ? (
                  <Text className="font-body text-[12px] leading-[16px] text-ink-muted dark:text-ink-dark-soft">
                    {item.meta}
                    {item.publishedAt
                      ? ` · ${formatShortDate(item.publishedAt, i18n.resolvedLanguage ?? 'ca')}`
                      : ''}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
