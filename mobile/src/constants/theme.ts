/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1220',
    textTertiary: '#8A8F98',
    background: '#F7F8FA',
    surface: '#ffffff',
    backgroundElement: '#F0F1F5',
    backgroundSelected: '#E7EBF3',
    textSecondary: '#5C6270',
    primary: '#3D7EFF',
    primarySoft: '#EAF1FF',
    accent: '#FF8A3D',
    danger: '#E5484D',
    dangerSoft: '#FDECEC',
    success: '#1FAF6E',
    successSoft: '#E7F8EF',
    warning: '#F5A524',
    warningSoft: '#FEF3DE',
    border: '#E7E9EF',
    overlay: 'rgba(15, 18, 26, 0.45)',
  },
  dark: {
    text: '#F5F6F8',
    textTertiary: '#8A8F98',
    background: '#0B0D12',
    surface: '#171A21',
    backgroundElement: '#1E212B',
    backgroundSelected: '#2A2E3A',
    textSecondary: '#A2A7B4',
    primary: '#6FA1FF',
    primarySoft: '#1A2A4A',
    accent: '#FFA25F',
    danger: '#F5686C',
    dangerSoft: '#3A1E20',
    success: '#4FD196',
    successSoft: '#173428',
    warning: '#F7BB55',
    warningSoft: '#3A2E14',
    border: '#262A35',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Per-meal accent colors, consistent across light/dark, used for meal card
// icons/badges on the dashboard and history detail screens.
export const MealColors = {
  breakfast: { tint: '#F5A524', soft: '#FEF3DE', softDark: '#3A2E14', icon: '🌅' },
  lunch: { tint: '#3D7EFF', soft: '#EAF1FF', softDark: '#1A2A4A', icon: '🥗' },
  dinner: { tint: '#8A5CF6', soft: '#F0EAFE', softDark: '#2A1E3A', icon: '🍽️' },
  snacks: { tint: '#1FAF6E', soft: '#E7F8EF', softDark: '#173428', icon: '🍎' },
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const Shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: { elevation: 2 },
    default: {},
  }),
  raised: Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

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
