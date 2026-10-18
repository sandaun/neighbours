import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from './AuthProvider';
import { Button, ErrorState, LoadingState } from '@/design-system';
import { appConfig, isDemoMode } from '@/lib/app-config';
import { useTheme } from '@/hooks/use-theme';

export function AuthNavigator() {
  const auth = useAuth();
  const { t } = useTranslation();
  const colors = useTheme();
  if (auth.status === 'loading')
    return (
      <SafeAreaView className="flex-1 justify-center bg-bg dark:bg-bg-dark">
        <LoadingState label={t('auth.loading')} />
      </SafeAreaView>
    );
  if (auth.status === 'error' || auth.status === 'no-membership')
    return (
      <SafeAreaView className="flex-1 justify-center bg-bg dark:bg-bg-dark">
        <ErrorState
          title={t(auth.status === 'no-membership' ? 'auth.noMembershipTitle' : 'auth.errorTitle')}
          subtitle={t(
            auth.status === 'no-membership'
              ? 'auth.noMembershipBody'
              : appConfig.mode === 'error'
                ? 'auth.configErrorBody'
                : 'auth.errorBody'
          )}
        />
        <View className="gap-3 px-5">
          <Button onPress={auth.retry}>{t('auth.retry')}</Button>
          {auth.session ? (
            <Button variant="outline" onPress={() => void auth.signOut()}>
              {t('auth.signOut')}
            </Button>
          ) : null}
        </View>
      </SafeAreaView>
    );
  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark">
      {isDemoMode ? (
        <View className="bg-surface-hi px-5 py-1 dark:bg-surface-dark-hi">
          <Text className="text-center font-label text-[11px] leading-[16px] text-primary dark:text-primary-darkmode">
            {t('auth.demoMode')}
          </Text>
        </View>
      ) : null}
      <Stack
        key={auth.session?.user.id ?? 'demo'}
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontFamily: 'Montserrat_600SemiBold' },
        }}
      >
        <Stack.Protected guard={auth.status === 'ready'}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="incidents/new" options={{ title: t('incidentFlow.create') }} />
          <Stack.Screen name="incidents/[id]" options={{ title: t('incidentFlow.detail') }} />
        </Stack.Protected>
        <Stack.Protected guard={auth.status === 'signed-out'}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={isDemoMode}>
          <Stack.Screen name="ds-playground" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </View>
  );
}
