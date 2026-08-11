import { Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState, ScreenHeader } from '@/design-system';

export default function AccountsScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      <ScreenHeader title={t('tabs.accounts')} />
      <EmptyState
        icon={<Wallet color="#803EF6" size={28} />}
        title={t('empty.accounts')}
        subtitle={t('empty.comingSoon')}
      />
    </View>
  );
}
