import { useTranslation } from 'react-i18next';
import { RefreshControl, Text, View } from 'react-native';

import { appDataSource } from '@/data';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  LoadingState,
  CollapsibleScreen,
  SectionHeader,
} from '@/design-system';
import { IncidentCard } from '@/features/incidents/IncidentCard';
import { useDataResource } from '@/hooks/use-data-resource';
import { formatEventDate } from '@/utils/formatters';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const resource = useDataResource(appDataSource.getHome);
  const locale = i18n.resolvedLanguage ?? 'ca';
  const communityName =
    resource.status === 'success' ? resource.data.communityName : t('home.communityName');

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <CollapsibleScreen
        header={{ overline: t('home.overline'), title: communityName }}
        contentContainerClassName="px-5 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={resource.refreshing && resource.status !== 'loading'}
            onRefresh={resource.reload}
          />
        }
      >
        {resource.status === 'loading' ? <LoadingState label={t('common.loading')} /> : null}
        {resource.status === 'error' ? (
          <View>
            <ErrorState subtitle={t('errors.loadSubtitle')} title={t('errors.loadTitle')} />
            <Button onPress={resource.reload}>{t('common.retry')}</Button>
          </View>
        ) : null}
        {resource.status === 'success' ? (
          <>
            <SectionHeader title={t('home.sections.recentIncidents')} />
            <View className="gap-3">
              {resource.data.incidents.map((incident) => (
                <IncidentCard incident={incident} key={incident.id} />
              ))}
            </View>

            <SectionHeader title={t('home.sections.upcomingEvents')} />
            {resource.data.events.length === 0 ? (
              <Text className="font-body text-[13px] text-ink-soft dark:text-ink-dark-soft">
                {t('home.noEvents')}
              </Text>
            ) : null}
            <View className="gap-3">
              {resource.data.events.map((event) => (
                <Card key={event.id}>
                  <Text className="font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
                    {event.title}
                  </Text>
                  <Text className="font-body text-[12px] leading-[16px] text-ink-soft dark:text-ink-dark-soft">
                    {`${formatEventDate(event.startsAt, locale)} · ${event.location}`}
                  </Text>
                </Card>
              ))}
            </View>

            <SectionHeader title={t('home.sections.board')} />
            {resource.data.boardPosts.length === 0 ? (
              <Text className="font-body text-[13px] text-ink-soft dark:text-ink-dark-soft">
                {t('home.noBoardPosts')}
              </Text>
            ) : null}
            <View className="gap-3">
              {resource.data.boardPosts.map((post) => (
                <Card className="gap-3" key={post.id}>
                  <View className="flex-row items-center gap-3">
                    <Avatar initials={post.authorInitials} />
                    <View className="flex-1">
                      <Text className="font-body-semi text-[14px] leading-[20px] text-ink dark:text-ink-dark">
                        {post.author}
                      </Text>
                      <Text className="font-label text-[10px] uppercase leading-[14px] tracking-[1px] text-primary dark:text-primary-darkmode">
                        {post.topic}
                      </Text>
                    </View>
                  </View>
                  <Text className="font-body text-[13px] leading-[19px] text-ink-soft dark:text-ink-dark-soft">
                    {post.body}
                  </Text>
                  <Text className="font-body text-[11px] leading-[15px] text-ink-muted dark:text-ink-dark-soft">
                    {t('home.boardComments', { count: post.commentsCount })}
                  </Text>
                </Card>
              ))}
            </View>
          </>
        ) : null}
      </CollapsibleScreen>
    </View>
  );
}
