import { useScrollToTop } from 'expo-router';
import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type ScrollViewProps } from 'react-native';
import Animated, {
  clamp,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from './ScreenHeader';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CollapsibleScreenProps = {
  header: Omit<ComponentProps<typeof ScreenHeader>, 'embedded'>;
  children: ReactNode;
  contentContainerClassName?: string;
  refreshControl?: ScrollViewProps['refreshControl'];
};

/** Scroll the large heading away while retaining a compact screen title. */
export function CollapsibleScreen({
  header,
  children,
  contentContainerClassName,
  refreshControl,
}: CollapsibleScreenProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [titleHeight, setTitleHeight] = useState(24);
  const scrollY = useSharedValue(0);
  const isHero = header.variant !== 'section';
  // ScreenHeader uses the same brand purple in both appearances.
  const backgroundColor = isHero ? Colors.light.primary : colors.background;
  const compactHeight = insets.top + titleHeight + 24;
  const collapseDistance = Math.max(headerHeight - compactHeight, 1);

  useScrollToTop(scrollRef);

  const onScroll = useAnimatedScrollHandler((event) => {
    // Ignore both pull-to-refresh and bottom rubber-banding, including short lists.
    const maximumOffset = Math.max(event.contentSize.height - event.layoutMeasurement.height, 0);
    scrollY.value = clamp(event.contentOffset.y, 0, maximumOffset);
  });
  const progress = useDerivedValue(() => clamp(scrollY.value / collapseDistance, 0, 1));
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? 1
      : interpolate(progress.value, [0.4, 0.7], [1, 0], Extrapolation.CLAMP),
  }));
  const compactStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? Number(progress.value >= 1)
      : interpolate(progress.value, [0.7, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const compactTitleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reduceMotion ? 0 : (1 - progress.value) * 6 }],
  }));

  function measureHeader(event: LayoutChangeEvent) {
    setHeaderHeight(event.nativeEvent.layout.height);
  }

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: compactHeight, bottom: insets.bottom }}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={refreshControl}
      >
        <View
          onLayout={measureHeader}
          style={{ backgroundColor, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
        >
          <Animated.View style={expandedStyle}>
            <ScreenHeader {...header} />
          </Animated.View>
        </View>
        <View className={contentContainerClassName}>{children}</View>
      </Animated.ScrollView>
      <View
        pointerEvents="none"
        style={[styles.statusBar, { height: insets.top, backgroundColor }]}
      />
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.compact,
          {
            paddingTop: insets.top + 12,
            backgroundColor,
            shadowColor: colors.text,
          },
          compactStyle,
        ]}
      >
        <Animated.View style={compactTitleStyle}>
          <Text
            numberOfLines={1}
            onLayout={(event) => setTitleHeight(event.nativeEvent.layout.height)}
            style={[styles.compactTitle, { color: isHero ? colors.onPrimary : colors.text }]}
          >
            {header.title}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  statusBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  compact: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  compactTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
    lineHeight: 24,
  },
});
