import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';

export default function IncidentsLayout() {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontFamily: 'Montserrat_600SemiBold' },
      }}
    >
      <Stack.Screen name="new" options={{ title: t('incidentFlow.create') }} />
      <Stack.Screen name="[id]" options={{ title: t('incidentFlow.detail') }} />
    </Stack>
  );
}
