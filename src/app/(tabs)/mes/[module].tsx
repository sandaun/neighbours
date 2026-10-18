import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme, View } from 'react-native';

import { appDataSource, isMoreModuleKey, type MoreModuleKey } from '@/data';
import { Button, EmptyState, ErrorState, LoadingState } from '@/design-system';
import { LanguageContent } from '@/features/auth/LanguageContent';
import { ProfileContent } from '@/features/auth/ProfileContent';
import { MoreModuleContent } from '@/features/more/MoreModuleContent';
import { useDataResource } from '@/hooks/use-data-resource';
import { isDemoMode } from '@/lib/app-config';

function ModuleResource({ moduleKey }: { moduleKey: MoreModuleKey }) {
  const { t } = useTranslation();
  const load = useCallback(() => appDataSource.getMoreModule(moduleKey), [moduleKey]);
  const resource = useDataResource(load);
  if (resource.status === 'loading') return <LoadingState label={t('common.loading')} />;
  if (resource.status === 'error')
    return (
      <View className="px-5">
        <ErrorState subtitle={t('errors.loadSubtitle')} title={t('errors.loadTitle')} />
        <Button onPress={resource.reload}>{t('common.retry')}</Button>
      </View>
    );
  return <MoreModuleContent data={resource.data} />;
}

export default function MoreDestinationScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { module } = useLocalSearchParams<{ module?: string | string[] }>();
  const key = typeof module === 'string' && isMoreModuleKey(module) ? module : null;
  const title = key ? t(`more.destinations.${key}`) : t('tabs.more');
  let content;
  if (!key)
    content = (
      <EmptyState subtitle={t('errors.notFoundSubtitle')} title={t('errors.notFoundTitle')} />
    );
  else if (key === 'profile') content = <ProfileContent />;
  else if (key === 'language') content = <LanguageContent />;
  else if (!isDemoMode && key !== 'calendar')
    content = <EmptyState title={title} subtitle={t('empty.comingSoon')} />;
  else content = <ModuleResource key={key} moduleKey={key} />;

  return (
    <>
      <Stack.Screen options={{ title }} />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View className="flex-1 bg-bg dark:bg-bg-dark">{content}</View>
    </>
  );
}
