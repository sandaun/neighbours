import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Avatar, Card, ListItem, ScreenHeader } from '@/design-system';

export default function MoreScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader title={t('tabs.more')} />
      <ScrollView contentContainerClassName="gap-3 px-5 py-5">
        <Card>
          <ListItem
            title={t('showcase.neighbour.name')}
            subtitle={t('showcase.neighbour.role')}
            leading={<Avatar initials="MV" />}
            chevron
            onPress={() => {}}
          />
        </Card>
        <Card className="gap-2">
          <ListItem title={t('more.notifications')} chevron onPress={() => {}} />
          <ListItem title={t('more.language')} chevron onPress={() => {}} />
          <ListItem title={t('more.privacy')} chevron onPress={() => {}} />
        </Card>
      </ScrollView>
    </View>
  );
}
