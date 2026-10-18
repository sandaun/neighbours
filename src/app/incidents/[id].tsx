import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { appDataSource } from '@/data';
import { Button, ErrorState, LoadingState } from '@/design-system';
import { IncidentDetailContent } from '@/features/incidents/IncidentDetailContent';
import { useDataResource } from '@/hooks/use-data-resource';

export default function IncidentDetailScreen() {
  const { t } = useTranslation();
  const { id, photoUploadFailed } = useLocalSearchParams<{
    id: string;
    photoUploadFailed?: string;
  }>();
  const load = useCallback(() => appDataSource.getIncident(id), [id]);
  const resource = useDataResource(load);

  return (
    <ScrollView
      className="flex-1 bg-bg dark:bg-bg-dark"
      contentContainerClassName="gap-4 px-5 pb-12 pt-4"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={resource.refreshing} onRefresh={resource.reload} />
      }
    >
      {photoUploadFailed === '1' ? (
        <Text
          accessibilityRole="alert"
          className="rounded-md bg-tertiary/15 p-4 font-body text-[14px] text-tertiary-txt dark:text-tertiary"
        >
          {t('incidentFlow.photoUploadFailed')}
        </Text>
      ) : null}
      {resource.status === 'loading' ? <LoadingState label={t('common.loading')} /> : null}
      {resource.status === 'error' ? (
        <View>
          <ErrorState
            title={t('incidentFlow.unavailableTitle')}
            subtitle={t('incidentFlow.unavailableSubtitle')}
          />
          <Button variant="outline" onPress={resource.reload}>
            {t('common.retry')}
          </Button>
        </View>
      ) : null}
      {resource.status === 'success' ? (
        <IncidentDetailContent key={resource.data.photoUrl} incident={resource.data} />
      ) : null}
    </ScrollView>
  );
}
