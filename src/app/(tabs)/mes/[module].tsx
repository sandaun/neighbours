import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme, View } from 'react-native';

import { appDataSource, isMoreModuleKey, type MoreModuleKey } from '@/data';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { MoreModuleContent } from '@/features/more/MoreModuleContent';
import { useDataResource } from '@/hooks/use-data-resource';

function useMoreModuleResource(key: MoreModuleKey | null) {
  const load = useCallback(
    () =>
      key
        ? appDataSource.getMoreModule(key)
        : Promise.reject(new Error('Unknown More destination')),
    [key]
  );

  return useDataResource(load);
}

export default function MoreDestinationScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { module } = useLocalSearchParams<{ module?: string | string[] }>();
  const key = typeof module === 'string' && isMoreModuleKey(module) ? module : null;
  const resource = useMoreModuleResource(key);
  const title = key ? t(`more.destinations.${key}`) : t('tabs.more');

  return (
    <>
      <Stack.Screen options={{ title }} />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View className="flex-1 bg-bg dark:bg-bg-dark">
        {key === null ? (
          <EmptyState subtitle={t('errors.notFoundSubtitle')} title={t('errors.notFoundTitle')} />
        ) : null}
        {key !== null && resource.status === 'loading' ? (
          <LoadingState label={t('common.loading')} />
        ) : null}
        {key !== null && resource.status === 'error' ? (
          <ErrorState subtitle={t('errors.loadSubtitle')} title={t('errors.loadTitle')} />
        ) : null}
        {key !== null && resource.status === 'success' ? (
          <MoreModuleContent data={resource.data} />
        ) : null}
      </View>
    </>
  );
}
