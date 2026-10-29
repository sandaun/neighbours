import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { IncidentDetail, IncidentStatus } from '@/data';
import { Card } from '@/design-system/Card';
import { SectionHeader } from '@/design-system/SectionHeader';
import { StatusBadge } from '@/design-system/StatusBadge';
import { formatShortDate } from '@/utils/formatters';

const STATUS_LABEL_KEYS: Record<IncidentStatus, string> = {
  received: 'incidents.status.received',
  'in-progress': 'incidents.status.inProgress',
  resolved: 'incidents.status.resolved',
};

export function IncidentDetailContent({ incident }: { incident: IncidentDetail }) {
  const { t, i18n } = useTranslation();
  const [photoFailed, setPhotoFailed] = useState(false);
  const locale = i18n.resolvedLanguage ?? 'ca';
  const photoSource =
    incident.photoAsset ?? (incident.photoUrl ? { uri: incident.photoUrl } : undefined);

  return (
    <>
      <Card className="gap-3">
        <Text
          accessibilityRole="header"
          className="font-display text-[28px] leading-[34px] text-ink dark:text-ink-dark"
        >
          {incident.title}
        </Text>
        <StatusBadge status={incident.status} label={t(STATUS_LABEL_KEYS[incident.status])} />
        <Text className="font-body-semi text-[14px] text-ink dark:text-ink-dark">
          {incident.location}
        </Text>
        <Text className="font-body text-[13px] text-ink-soft dark:text-ink-dark-soft">
          {t(`incidentFlow.categories.${incident.category}`)}
        </Text>
        <Text className="font-body text-[12px] text-ink-soft dark:text-ink-dark-soft">
          {t('incidents.reportedOn', { date: formatShortDate(incident.reportedAt, locale) })}
        </Text>
        <Text
          selectable
          className="font-body text-[15px] leading-[23px] text-ink dark:text-ink-dark"
        >
          {incident.description}
        </Text>
        {photoSource !== undefined ? (
          <Image
            accessibilityLabel={t('incidentFlow.photoPreview')}
            source={photoSource}
            style={{ width: '100%', height: 240, borderRadius: 16 }}
            contentFit="contain"
            onError={() => setPhotoFailed(true)}
          />
        ) : null}
        {photoFailed ? (
          <Text accessibilityRole="alert" className="font-body text-[13px] text-danger">
            {t('incidentFlow.photoLoadError')}
          </Text>
        ) : null}
      </Card>
      <SectionHeader title={t('incidentFlow.history')} />
      {incident.updates.length === 0 ? (
        <Text className="font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
          {t('incidentFlow.noUpdates')}
        </Text>
      ) : null}
      {incident.updates.map((update) => (
        <Card key={update.id} className="gap-3">
          <View className="flex-row flex-wrap items-start justify-between gap-2">
            <Text className="font-body-semi text-[14px] text-ink dark:text-ink-dark">
              {update.authorName}
            </Text>
            {update.status ? (
              <StatusBadge status={update.status} label={t(STATUS_LABEL_KEYS[update.status])} />
            ) : null}
          </View>
          <Text className="font-body text-[12px] text-ink-soft dark:text-ink-dark-soft">
            {formatShortDate(update.createdAt, locale)}
          </Text>
          <Text
            selectable
            className="font-body text-[15px] leading-[23px] text-ink dark:text-ink-dark"
          >
            {update.body}
          </Text>
        </Card>
      ))}
    </>
  );
}
