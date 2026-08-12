import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState, ScreenHeader } from '@/design-system';

const DESTINATION_KEYS = new Set([
  'voting',
  'board',
  'bookings',
  'calendar',
  'directory',
  'access',
  'emergencies',
  'profile',
  'notifications',
  'language',
  'privacy',
]);

export default function MoreDestinationScreen() {
  const { t } = useTranslation();
  const { module } = useLocalSearchParams<{ module?: string | string[] }>();
  const key = typeof module === 'string' && DESTINATION_KEYS.has(module) ? module : null;
  const title = key ? t(`more.destinations.${key}`) : t('tabs.more');

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/mes');
  }

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader
        backAction={{ label: t('tabs.more'), onPress: goBack }}
        title={title}
      />
      <EmptyState subtitle={t('empty.comingSoon')} title={title} />
    </View>
  );
}
