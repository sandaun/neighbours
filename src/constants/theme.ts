/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#803EF6',
    secondary: '#50E3C2',
    highlight: '#D2BCFF',
    onPrimary: '#FFFFFF',
    danger: '#BA1A1A',
    warning: '#FFBA00',
    text: '#321461',
    textSoft: '#4A4455',
    muted: '#7B7487',
    background: '#FAFBFC',
    surface: '#FFFFFF',
    surfaceHi: '#F0E3FF',
    outline: '#CCC3D8',
  },
  dark: {
    primary: '#9B6BFF',
    secondary: '#50E3C2',
    highlight: '#D2BCFF',
    onPrimary: '#FFFFFF',
    danger: '#C13B3B',
    warning: '#FFBA00',
    text: '#EFE7FF',
    textSoft: '#B9AECC',
    muted: '#B9AECC',
    background: '#140A24',
    surface: '#1E1132',
    surfaceHi: '#33204F',
    outline: '#44355E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
