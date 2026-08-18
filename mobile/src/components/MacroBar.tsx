import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MacroColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface MacroBarProps {
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

/** Proportional stacked macro bar + legend, shared by the edit-entry and add-food flows. */
export function MacroBar({ proteinG, carbsG, fatG }: MacroBarProps) {
  const theme = useTheme();
  if (proteinG === null || carbsG === null || fatG === null) return null;
  const total = proteinG + carbsG + fatG || 1;
  const segments = [
    { label: 'Protein', valueG: proteinG, color: MacroColors.protein },
    { label: 'Carbs', valueG: carbsG, color: MacroColors.carbs },
    { label: 'Fat', valueG: fatG, color: MacroColors.fat },
  ];

  return (
    <View>
      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        {segments.map((segment) => (
          <View
            key={segment.label}
            style={{ flex: Math.max(segment.valueG, 0.001) / total, backgroundColor: segment.color }}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <ThemedText type="small" themeColor="textSecondary">
              {segment.label} {Math.round(segment.valueG)}g
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 12,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  legendItem: {
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
