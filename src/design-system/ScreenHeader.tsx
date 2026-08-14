import { useFocusEffect } from 'expo-router';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenHeaderProps = {
  /** Uppercase context label displayed above the title. */
  overline?: string;
  title: string;
  subtitle?: string;
  variant?: 'hero' | 'section';
};

/**
 * Branded hero for Home and a quieter content header for primary sections.
 */
export function ScreenHeader({ overline, title, subtitle, variant = 'hero' }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [isFocused, setIsFocused] = useState(false);
  const isHero = variant === 'hero';
  const statusBarStyle: StatusBarStyle = isHero || colorScheme === 'dark' ? 'light' : 'dark';

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);

      return () => setIsFocused(false);
    }, [])
  );

  if (!isHero) {
    return (
      <>
        {isFocused ? <StatusBar style={statusBarStyle} /> : null}
        <View className="px-5 pb-4" style={{ paddingTop: insets.top + 20 }}>
          <Text
            accessibilityRole="header"
            className="font-display text-[32px] leading-[38px] text-ink dark:text-ink-dark"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 max-w-[340px] font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </>
    );
  }

  return (
    <>
      {isFocused ? <StatusBar style={statusBarStyle} /> : null}
      <View className="rounded-b-2xl bg-primary px-5 pb-6" style={{ paddingTop: insets.top + 16 }}>
        {overline ? (
          <Text className="font-label text-[11px] uppercase leading-[14px] tracking-[1.2px] text-primary-on/70">
            {overline}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          className="mt-1 font-display text-[28px] leading-[34px] text-primary-on"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 font-body text-[13px] leading-[18px] text-primary-on/80">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );
}
