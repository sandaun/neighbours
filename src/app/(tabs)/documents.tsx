import { FileText } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState, ScreenHeader } from '@/design-system';
import { useTrackLastTab } from '@/components/mes-sheet';

export default function DocumentsScreen() {
  const { t } = useTranslation();
  useTrackLastTab('/documents');
  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader title={t('tabs.documents')} />
      <EmptyState
        icon={<FileText color="#803EF6" size={28} />}
        title={t('empty.documents')}
        subtitle={t('empty.comingSoon')}
      />
    </View>
  );
}
