import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import { appDataSource, type IncidentStatus } from '@/data';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  SectionHeader,
} from '@/design-system';
import { IncidentCard } from '@/features/incidents/IncidentCard';
import { useDataResource } from '@/hooks/use-data-resource';

export default function IncidentsScreen() {
  const { t } = useTranslation();
  const resource = useDataResource(appDataSource.getIncidents);
  const [filter, setFilter] = useState<IncidentStatus | 'all'>('all');
  const incidents =
    resource.status === 'success'
      ? resource.data.filter((incident) => filter === 'all' || incident.status === filter)
      : [];

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader
        subtitle={t('incidents.subtitle')}
        title={t('tabs.incidents')}
        variant="section"
      />
      <ScrollView
        contentContainerClassName="px-5 pb-12"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={resource.refreshing} onRefresh={resource.reload} />
        }
      >
        <Button onPress={() => router.push('/incidents/new')}>{t('incidentFlow.create')}</Button>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 py-2"
        >
          <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>
            {t('incidents.filters.all')}
          </Chip>
          <Chip selected={filter === 'in-progress'} onPress={() => setFilter('in-progress')}>
            {t('incidents.status.inProgress')}
          </Chip>
          <Chip selected={filter === 'received'} onPress={() => setFilter('received')}>
            {t('incidents.status.received')}
          </Chip>
          <Chip selected={filter === 'resolved'} onPress={() => setFilter('resolved')}>
            {t('incidents.status.resolved')}
          </Chip>
        </ScrollView>

        {resource.status === 'loading' ? <LoadingState label={t('common.loading')} /> : null}
        {resource.status === 'error' ? (
          <>
            <ErrorState subtitle={t('errors.loadSubtitle')} title={t('errors.loadTitle')} />
            <Button variant="outline" onPress={resource.reload}>
              {t('common.retry')}
            </Button>
          </>
        ) : null}
        {resource.status === 'success' && incidents.length === 0 ? (
          <EmptyState
            title={t(filter === 'all' ? 'empty.incidents' : 'incidentFlow.emptyFilter')}
            subtitle={t('empty.incidentsSubtitle')}
          />
        ) : null}
        {resource.status === 'success' && incidents.length > 0 ? (
          <>
            <SectionHeader title={t('incidents.sections.all')} />
            <View className="gap-3">
              {incidents.map((incident) => (
                <IncidentCard incident={incident} key={incident.id} />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
