import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Card, Chip, ListItem, SectionHeader, StatusBadge } from '@/design-system';

function Row({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap items-center gap-3">{children}</View>;
}

export default function DesignSystemShowcase() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-24">
        <Text className="mt-4 font-display text-[28px] leading-[34px] text-ink dark:text-ink-dark">
          {t('showcase.title')}
        </Text>
        <Text className="font-body text-[12px] leading-[16px] text-ink-soft dark:text-ink-dark-soft">
          {t('showcase.subtitle')}
        </Text>

        <SectionHeader title={t('showcase.sections.typography')} />
        <Card className="gap-1">
          <Text className="font-display text-[28px] leading-[34px] text-ink dark:text-ink-dark">
            Display · Playfair 700
          </Text>
          <Text className="font-display-semi text-[20px] leading-[26px] text-ink dark:text-ink-dark">
            Títol · Playfair 600
          </Text>
          <Text className="font-body text-[15px] leading-[22px] text-ink dark:text-ink-dark">
            Body · Plus Jakarta Sans 400
          </Text>
          <Text className="font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
            Body strong · Jakarta 600
          </Text>
          <Text className="font-label text-[13px] leading-[18px] text-ink dark:text-ink-dark">
            Label · Montserrat 600
          </Text>
          <Text className="font-body text-[12px] leading-[16px] text-ink-soft dark:text-ink-dark-soft">
            Caption · Jakarta 500 — {t('incidents.reportedDaysAgo', { count: 2 })}
          </Text>
        </Card>

        <SectionHeader title={t('showcase.sections.buttons')} />
        <Card className="gap-3">
          <Button onPress={() => {}}>{t('showcase.buttons.voteFor')}</Button>
          <Button variant="outline" onPress={() => {}}>
            {t('showcase.buttons.voteAgainst')}
          </Button>
          <Button variant="danger" onPress={() => {}}>
            {t('showcase.buttons.delete')}
          </Button>
          <Button variant="ghost" onPress={() => {}}>
            {t('showcase.buttons.ghost')}
          </Button>
          <Row>
            <View className="flex-1">
              <Button loading onPress={() => {}}>
                {t('showcase.buttons.loading')}
              </Button>
            </View>
            <View className="flex-1">
              <Button disabled onPress={() => {}}>
                {t('showcase.buttons.disabled')}
              </Button>
            </View>
          </Row>
        </Card>

        <SectionHeader title={t('showcase.sections.badges')} />
        <Card>
          <Row>
            <StatusBadge status="received" label={t('incidents.status.received')} />
            <StatusBadge status="in-progress" label={t('incidents.status.inProgress')} />
            <StatusBadge status="resolved" label={t('incidents.status.resolved')} />
          </Row>
        </Card>

        <SectionHeader title={t('showcase.sections.chips')} />
        <Card>
          <Row>
            <Chip selected onPress={() => {}}>
              {t('incidents.categories.plumbing')}
            </Chip>
            <Chip onPress={() => {}}>{t('incidents.categories.electrical')}</Chip>
            <Chip onPress={() => {}}>{t('incidents.categories.elevator')}</Chip>
          </Row>
        </Card>

        <SectionHeader title={t('showcase.sections.incidentCard')} />
        <Card variant="elevated" className="gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-display-semi text-[20px] leading-[26px] text-ink dark:text-ink-dark">
              {t('showcase.incident.title')}
            </Text>
            <StatusBadge status="in-progress" label={t('incidents.status.inProgress')} />
          </View>
          <Text className="font-body text-[15px] leading-[22px] text-ink-soft dark:text-ink-dark-soft">
            {t('showcase.incident.description')}
          </Text>
          <Text className="font-body text-[12px] leading-[16px] text-ink-muted dark:text-ink-dark-soft">
            {t('incidents.reportedDaysAgo', { count: 2 })}
          </Text>
        </Card>

        <SectionHeader title={t('showcase.sections.lists')} />
        <Card className="gap-2" variant="default">
          <ListItem
            title={t('showcase.neighbour.name')}
            subtitle={t('showcase.neighbour.role')}
            leading={<Avatar initials="MV" />}
            chevron
            onPress={() => {}}
          />
          <ListItem
            title={t('showcase.document.title')}
            subtitle={t('showcase.document.meta')}
            chevron
            onPress={() => {}}
          />
        </Card>

        <SectionHeader title={t('showcase.sections.colors')} />
        <Card>
          <Row>
            {[
              ['bg-primary', 'primary'],
              ['bg-primary-dark', 'prim. fosc'],
              ['bg-secondary', 'secondary'],
              ['bg-tertiary', 'tertiary'],
              ['bg-surface-hi', 'surface-hi'],
              ['bg-highlight', 'highlight'],
              ['bg-danger', 'danger'],
              ['bg-ink', 'ink'],
            ].map(([cls, name]) => (
              <View key={cls} className="items-center gap-1">
                <View className={`h-10 w-10 rounded-md ${cls}`} />
                <Text className="font-body text-[10px] text-ink-soft dark:text-ink-dark-soft">
                  {name}
                </Text>
              </View>
            ))}
          </Row>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
