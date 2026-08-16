import { router, useScrollToTop } from 'expo-router';
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
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { MoreModuleKey } from '@/data';
import { ListItem, ScreenHeader, SectionHeader } from '@/design-system';
import { useTheme } from '@/hooks/use-theme';

type Destination = {
  key: MoreModuleKey;
  icon: LucideIcon;
  danger?: boolean;
};

const PARTICIPATION_DESTINATIONS: Destination[] = [
  { key: 'voting', icon: Vote },
  { key: 'board', icon: MessageSquare },
  { key: 'bookings', icon: CalendarCheck },
  { key: 'calendar', icon: Calendar },
];

const SERVICE_DESTINATIONS: Destination[] = [
  { key: 'directory', icon: IdCard },
  { key: 'access', icon: KeyRound },
  { key: 'emergencies', icon: TriangleAlert, danger: true },
];

const SETTINGS_DESTINATIONS: Destination[] = [
  { key: 'profile', icon: User },
  { key: 'notifications', icon: Bell },
  { key: 'language', icon: Languages },
  { key: 'privacy', icon: ShieldCheck },
];

function MoreIcon({ icon: Icon, danger = false }: Pick<Destination, 'icon' | 'danger'>) {
  const colors = useTheme();

  return (
    <View
      className={`h-11 w-11 items-center justify-center rounded-full ${
        danger ? 'bg-danger/10' : 'bg-surface-hi dark:bg-surface-dark-hi'
      }`}
    >
      <Icon color={danger ? colors.danger : colors.primary} size={22} />
    </View>
  );
}

function DestinationTile({ destination }: { destination: Destination }) {
  const { t } = useTranslation();
  const title = t(`more.destinations.${destination.key}`);

  return (
    <Pressable
      accessibilityHint={t('more.openHint', { name: title })}
      accessibilityRole="button"
      className="min-h-28 w-[48%] justify-between rounded-lg bg-surface p-4 shadow-md shadow-ink/10 active:opacity-60 dark:bg-surface-dark"
      onPress={() =>
        router.push({
          pathname: '/mes/[module]',
          params: { module: destination.key },
        })
      }
    >
      <MoreIcon danger={destination.danger} icon={destination.icon} />
      <Text className="mt-4 font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
        {title}
      </Text>
    </Pressable>
  );
}

function DestinationRow({ destination }: { destination: Destination }) {
  const { t } = useTranslation();
  const title = t(`more.destinations.${destination.key}`);

  return (
    <ListItem
      accessibilityHint={t('more.openHint', { name: title })}
      chevron
      className="rounded-lg shadow-md shadow-ink/10 elevation-1"
      leading={<MoreIcon danger={destination.danger} icon={destination.icon} />}
      onPress={() =>
        router.push({
          pathname: '/mes/[module]',
          params: { module: destination.key },
        })
      }
      title={title}
    />
  );
}

export default function MoreScreen() {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader subtitle={t('more.subtitle')} title={t('more.title')} variant="section" />
      <ScrollView
        ref={scrollRef}
        contentContainerClassName="px-5 pb-12"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SectionHeader title={t('more.sections.participation')} />
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {PARTICIPATION_DESTINATIONS.map((destination) => (
            <DestinationTile destination={destination} key={destination.key} />
          ))}
        </View>

        <SectionHeader title={t('more.sections.services')} />
        <View className="gap-2">
          {SERVICE_DESTINATIONS.map((destination) => (
            <DestinationRow destination={destination} key={destination.key} />
          ))}
        </View>

        <SectionHeader title={t('more.sections.settings')} />
        <View className="gap-2">
          {SETTINGS_DESTINATIONS.map((destination) => (
            <DestinationRow destination={destination} key={destination.key} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
