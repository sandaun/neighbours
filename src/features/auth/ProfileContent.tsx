import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from './AuthProvider';
import { Button, Card } from '@/design-system';
import { isDemoMode } from '@/lib/app-config';

export function ProfileContent() {
  const { t } = useTranslation();
  const { membership, session, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const fields = [
    [t('auth.name'), membership?.displayName],
    [t('auth.email'), session?.user.email],
    [t('auth.community'), membership?.communityName],
    [t('auth.unit'), membership?.unitLabel],
  ];
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      {isDemoMode ? (
        <Card>
          <Text className="font-body text-[14px] leading-[21px] text-ink-soft dark:text-ink-dark-soft">
            {t('auth.demoProfile')}
          </Text>
        </Card>
      ) : (
        <>
          <Card className="gap-5">
            {fields.map(([label, value]) => (
              <View key={label} className="gap-1">
                <Text className="font-label text-[12px] text-ink-soft dark:text-ink-dark-soft">
                  {label}
                </Text>
                <Text selectable className="font-body text-[15px] text-ink dark:text-ink-dark">
                  {value ?? t('auth.notAssigned')}
                </Text>
              </View>
            ))}
          </Card>
          <Button
            variant="outline"
            loading={busy}
            onPress={() => {
              setBusy(true);
              void signOut().finally(() => setBusy(false));
            }}
          >
            {t('auth.signOut')}
          </Button>
        </>
      )}
    </ScrollView>
  );
}
