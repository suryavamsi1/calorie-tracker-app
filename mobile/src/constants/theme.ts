/**
 * BiteLog "Vitality" design tokens, adapted from the Stitch UX export
 * (stitch_calorie_tracker_ux_redesign/) into the app's existing theme shape
 * so every screen/component can keep consuming `useTheme()` unchanged.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1C30',
    textSecondary: '#3D4A3D',
    textTertiary: '#6D7B6C',
    background: '#F8F9FF',
    surface: '#FFFFFF',
    backgroundElement: '#EFF4FF',
    backgroundSelected: '#E5EEFF',
    primary: '#006E2F',
    primarySoft: '#DCFCE7',
    onPrimary: '#FFFFFF',
    accent: '#FBBF24',
    accentSoft: '#FEF3C7',
    secondary: '#0058BE',
    secondarySoft: '#E5EEFF',
    danger: '#BA1A1A',
    dangerSoft: '#FFDAD6',
    onDangerSoft: '#BA1A1A',
    success: '#22C55E',
    successSoft: '#DCFCE7',
    warning: '#855300',
    warningSoft: '#FEF0D8',
    border: 'rgba(189, 203, 185, 0.3)',
    overlay: 'rgba(11, 28, 48, 0.45)',
  },
  dark: {
    text: '#D8E3FB',
    textSecondary: '#BCCBB9',
    textTertiary: '#869585',
    background: '#081425',
    surface: '#152031',
    backgroundElement: '#111C2D',
    backgroundSelected: '#1F2A3C',
    primary: '#4BE277',
    primarySoft: '#123320',
    onPrimary: '#003915',
    accent: '#FBBF24',
    accentSoft: '#3A2E14',
    secondary: '#3B82F6',
    secondarySoft: '#16283F',
    danger: '#E5484D',
    dangerSoft: '#5C1A1A',
    onDangerSoft: '#FFB4AB',
    success: '#4BE277',
    successSoft: '#123320',
    warning: '#FBBF24',
    warningSoft: '#3A2E14',
    border: '#3D4A3D',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Macro-specific colors, consistent across light/dark, used for macro bars,
// legends and food metadata wherever protein/carbs/fat are broken out.
export const MacroColors = {
  protein: '#FB7185',
  carbs: '#FBBF24',
  fat: '#818CF8',
} as const;

// Per-meal accent colors, consistent across light/dark, used for meal card
// icons/badges on the dashboard and history detail screens. Icon names are
// Ionicons, matching the Material Symbols used in the Stitch mockups
// (light_mode/sunny/dark_mode/cookie) - no emoji, per the design system.
export const MealColors = {
  breakfast: { tint: '#FBBF24', soft: '#FEF3C7', softDark: '#3A2E14', icon: 'partly-sunny-outline' },
  lunch: { tint: '#0058BE', soft: '#E5EEFF', softDark: '#16283F', icon: 'sunny-outline' },
  dinner: { tint: '#818CF8', soft: '#E7E8FE', softDark: '#25264A', icon: 'moon-outline' },
  snacks: { tint: '#22C55E', soft: '#DCFCE7', softDark: '#123320', icon: 'nutrition-outline' },
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 12,
  full: 999,
} as const;

export const Shadow = {
  card: Platform.select({
    ios: {
      // Pure black (not a light-mode-tinted navy) so this shadow reads
      // correctly regardless of the active theme.
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
    },
    android: { elevation: 2 },
    default: {},
  }),
  raised: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

// Montserrat for headings/display, Inter for body/UI text - loaded via
// @expo-google-fonts in the root layout. expo-font registers these exact
// weighted family names as usable fontFamily values on every platform,
// including web (via injected @font-face), so no platform split is needed.
export const Fonts = {
  heading: 'Montserrat_700Bold',
  headingSemiBold: 'Montserrat_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  twoAndHalf: 12,
  three: 16,
  threeAndHalf: 20,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
