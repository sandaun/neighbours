import { AlertCircle } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function LoadingState({ label }: { label: string }) {
  const colors = useTheme();

  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" className="items-center py-16">
      <ActivityIndicator color={colors.primary} size="small" />
      <Text className="mt-3 font-body text-[13px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
        {label}
      </Text>
    </View>
  );
}

export function ErrorState({ title, subtitle }: { title: string; subtitle: string }) {
  const colors = useTheme();

  return (
    <View accessibilityRole="alert" className="items-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-danger/10">
        <AlertCircle color={colors.danger} size={28} />
      </View>
      <Text className="text-center font-body-semi text-[15px] leading-[22px] text-ink dark:text-ink-dark">
        {title}
      </Text>
      <Text className="text-center font-body text-[13px] leading-[18px] text-ink-soft dark:text-ink-dark-soft">
        {subtitle}
      </Text>
    </View>
  );
}
