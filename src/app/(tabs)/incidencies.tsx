import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { appDataSource } from '@/data';
import {
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

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader
        subtitle={t('incidents.subtitle')}
        title={t('tabs.incidents')}
        variant="section"
      />
      <ScrollView contentContainerClassName="px-5 pb-12" contentInsetAdjustmentBehavior="automatic">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 py-2"
        >
          <Chip selected>{t('incidents.filters.all')}</Chip>
          <Chip>{t('incidents.status.inProgress')}</Chip>
          <Chip>{t('incidents.status.received')}</Chip>
          <Chip>{t('incidents.status.resolved')}</Chip>
        </ScrollView>

        {resource.status === 'loading' ? <LoadingState label={t('common.loading')} /> : null}
        {resource.status === 'error' ? (
          <ErrorState subtitle={t('errors.loadSubtitle')} title={t('errors.loadTitle')} />
        ) : null}
        {resource.status === 'success' && resource.data.length === 0 ? (
          <EmptyState title={t('empty.incidents')} subtitle={t('empty.incidentsSubtitle')} />
        ) : null}
        {resource.status === 'success' && resource.data.length > 0 ? (
          <>
            <SectionHeader title={t('incidents.sections.all')} />
            <View className="gap-3">
              {resource.data.map((incident) => (
                <IncidentCard incident={incident} key={incident.id} />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
