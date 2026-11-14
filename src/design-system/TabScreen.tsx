import { useIsFocused, useScrollToTop } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

type TabScreenProps = {
  title: string;
  /** Element shown before the title, such as the brand mark on Home. */
  leading?: ReactNode;
  /** Small line under the title, such as the community address on Home. */
  caption?: string | null;
  /** Context line rendered at the top of the content, so it scrolls away. */
  subtitle?: string;
  children: ReactNode;
  contentContainerClassName?: string;
  refreshControl?: ScrollViewProps['refreshControl'];
};

/** Tab screen with a fixed title bar and a hairline once content scrolls. */
export function TabScreen({
  title,
  leading,
  caption,
  subtitle,
  children,
  contentContainerClassName,
  refreshControl,
}: TabScreenProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);

  useScrollToTop(scrollRef);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const hairlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 8], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View className="flex-1 bg-bg dark:bg-bg-dark" style={{ paddingTop: insets.top }}>
      {isFocused ? <StatusBar style="auto" /> : null}
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-3">
        {leading}
        <View className="flex-1">
          <Text
            accessibilityRole="header"
            className="font-label text-[23px] leading-[30px] text-ink dark:text-ink-dark"
            numberOfLines={1}
          >
            {title}
          </Text>
          {caption ? (
            <Text
              className="font-body text-[13px] leading-[18px] text-ink-soft dark:text-ink-dark-soft"
              numberOfLines={1}
            >
              {caption}
            </Text>
          ) : null}
        </View>
        <Animated.View
          pointerEvents="none"
          style={[styles.hairline, { backgroundColor: colors.outline }, hairlineStyle]}
        />
      </View>
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={refreshControl}
      >
        <View className={contentContainerClassName}>
          {subtitle ? (
            <Text className="mt-1 font-body text-[14px] leading-[20px] text-ink-soft dark:text-ink-dark-soft">
              {subtitle}
            </Text>
          ) : null}
          {children}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
