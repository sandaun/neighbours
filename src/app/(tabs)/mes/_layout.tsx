import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function MoreLayout() {
  const colors = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.text,
          fontFamily: 'Montserrat_600SemiBold',
          fontSize: 17,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[module]" />
    </Stack>
  );
}
