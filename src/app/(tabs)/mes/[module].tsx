import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useColorScheme, View } from 'react-native';

import { EmptyState } from '@/design-system';

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
  const colorScheme = useColorScheme();
  const { module } = useLocalSearchParams<{ module?: string | string[] }>();
  const key = typeof module === 'string' && DESTINATION_KEYS.has(module) ? module : null;
  const title = key ? t(`more.destinations.${key}`) : t('tabs.more');

  return (
    <>
      <Stack.Screen options={{ title }} />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View className="flex-1 bg-bg dark:bg-bg-dark">
        <EmptyState subtitle={t('empty.comingSoon')} title={title} />
      </View>
    </>
  );
}
