import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Card, ListItem, ScreenHeader, SectionHeader, StatusBadge } from '@/design-system';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader overline={t('home.overline')} title={t('home.communityName')} />
      <ScrollView contentContainerClassName="px-5 pb-8">
        <SectionHeader title={t('home.sections.recentIncidents')} />
        <Card className="gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-display-semi text-[20px] leading-[26px] text-ink dark:text-ink-dark">
              {t('showcase.incident.title')}
            </Text>
            <StatusBadge status="in-progress" label={t('incidents.status.inProgress')} />
          </View>
          <Text className="font-body text-[12px] leading-[16px] text-ink-muted dark:text-ink-dark-soft">
            {t('incidents.reportedDaysAgo', { count: 2 })}
          </Text>
        </Card>
        <Card className="mt-3 gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-display-semi text-[20px] leading-[26px] text-ink dark:text-ink-dark">
              {t('home.incident2.title')}
            </Text>
            <StatusBadge status="resolved" label={t('incidents.status.resolved')} />
          </View>
          <Text className="font-body text-[12px] leading-[16px] text-ink-muted dark:text-ink-dark-soft">
            {t('incidents.reportedDaysAgo', { count: 6 })}
          </Text>
        </Card>

        <SectionHeader title={t('home.sections.upcomingEvents')} />
        <Card>
          <ListItem
            title={t('home.event1.title')}
            subtitle={t('home.event1.meta')}
            chevron
            onPress={() => {}}
          />
        </Card>
      </ScrollView>
    </View>
  );
}
