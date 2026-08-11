import { Wrench } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState, ScreenHeader } from '@/design-system';
import { useTrackLastTab } from '@/components/mes-sheet';

export default function IncidentsScreen() {
  const { t } = useTranslation();
  useTrackLastTab('/incidencies');
  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader title={t('tabs.incidents')} />
      <EmptyState
        icon={<Wrench color="#803EF6" size={28} />}
        title={t('empty.incidents')}
        subtitle={t('empty.comingSoon')}
      />
    </View>
  );
}
