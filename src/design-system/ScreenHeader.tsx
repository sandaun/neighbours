import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenHeaderProps = {
  /** Uppercase context label displayed above the title. */
  overline?: string;
  title: string;
  subtitle?: string;
  backAction?: {
    label: string;
    onPress: () => void;
  };
};

/**
 * Purple screen header that extends behind the status bar while keeping content safe.
 */
export function ScreenHeader({ overline, title, subtitle, backAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="rounded-b-2xl bg-primary px-5 pb-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      {backAction ? (
        <Pressable
          accessibilityLabel={backAction.label}
          accessibilityRole="button"
          className="mb-3 min-h-11 flex-row items-center self-start pr-4 active:opacity-60"
          hitSlop={8}
          onPress={backAction.onPress}
        >
          <Text className="mr-1 font-body text-[30px] leading-[30px] text-primary-on">‹</Text>
          <Text className="font-label text-[13px] leading-[18px] text-primary-on">
            {backAction.label}
          </Text>
        </Pressable>
      ) : null}
      {overline ? (
        <Text className="font-label text-[11px] uppercase leading-[14px] tracking-[1.2px] text-primary-on/70">
          {overline}
        </Text>
      ) : null}
      <Text className="mt-1 font-display text-[28px] leading-[34px] text-primary-on">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 font-body text-[13px] leading-[18px] text-primary-on/80">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
