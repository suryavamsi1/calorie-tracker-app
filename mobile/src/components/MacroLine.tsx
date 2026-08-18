import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MacroColors } from '@/constants/theme';

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
 * Compact color-coded macro summary used consistently across the app wherever
 * a food or entry is shown: protein/carbs/fat dots + "31g • 0g • 4g". Renders
 * nothing if macro data isn't available (e.g. quick-add entries).
 */
export function MacroLine({ proteinG, carbsG, fatG, size = 'caption' }: MacroLineProps) {
  if (proteinG === null || carbsG === null || fatG === null) return null;

  // Design spec is 14/20 regardless of context - matches ThemedText's "small" type.
  const textType = 'small';

  return (
    <View style={styles.row}>
      <Dot color={MacroColors.protein} />
      <ThemedText type={textType} themeColor="textSecondary">
        {formatGrams(proteinG)}g P
      </ThemedText>
      <ThemedText type={textType} themeColor="textTertiary">
        {' · '}
      </ThemedText>
      <Dot color={MacroColors.carbs} />
      <ThemedText type={textType} themeColor="textSecondary">
        {formatGrams(carbsG)}g C
      </ThemedText>
      <ThemedText type={textType} themeColor="textTertiary">
        {' · '}
      </ThemedText>
      <Dot color={MacroColors.fat} />
      <ThemedText type={textType} themeColor="textSecondary">
        {formatGrams(fatG)}g F
      </ThemedText>
    </View>
  );
}

function Dot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
