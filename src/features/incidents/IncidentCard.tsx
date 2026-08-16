import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { Incident, IncidentStatus } from '@/data';
import { Card, StatusBadge } from '@/design-system';
import { formatShortDate } from '@/utils/formatters';

const STATUS_LABEL_KEYS: Record<IncidentStatus, string> = {
  received: 'incidents.status.received',
  'in-progress': 'incidents.status.inProgress',
  resolved: 'incidents.status.resolved',
};

export function IncidentCard({ incident }: { incident: Incident }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? 'ca';

  return (
    <Card className="gap-2">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 font-display-semi text-[20px] leading-[26px] text-ink dark:text-ink-dark">
          {incident.title}
        </Text>
        <StatusBadge status={incident.status} label={t(STATUS_LABEL_KEYS[incident.status])} />
      </View>
      <Text className="font-body text-[12px] leading-[16px] text-ink-soft dark:text-ink-dark-soft">
        {incident.location}
      </Text>
      <Text className="font-body text-[12px] leading-[16px] text-ink-muted dark:text-ink-dark-soft">
        {t('incidents.reportedOn', {
          date: formatShortDate(incident.reportedAt, locale),
        })}
      </Text>
    </Card>
  );
}
