import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export interface MacroLineProps {
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  /** Visual style: 'caption' (default, for cards/lists) or 'small' (denser rows). */
  size?: 'caption' | 'small';
}

function formatGrams(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
}

/**
 * Compact macro summary used consistently across the app wherever a food or
 * entry is shown: "P 31g • C 0g • F 4g". Renders nothing if macro data isn't
 * available (e.g. quick-add entries that only track calories).
 */
export function MacroLine({ proteinG, carbsG, fatG, size = 'caption' }: MacroLineProps) {
  if (proteinG === null || carbsG === null || fatG === null) return null;

  return (
    <ThemedText type={size === 'small' ? 'small' : 'caption'} themeColor="textSecondary" style={styles.text}>
      P {formatGrams(proteinG)}g • C {formatGrams(carbsG)}g • F {formatGrams(fatG)}g
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '600',
  },
});
