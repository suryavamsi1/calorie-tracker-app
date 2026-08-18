import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface MacroStatCardProps {
  label: string;
  valueG: number;
  goalG?: number | null;
  color: string;
}

/** One of the three protein/carbs/fat tiles shown under the calorie ring and on day summaries. */
export function MacroStatCard({ label, valueG, goalG, color }: MacroStatCardProps) {
  const theme = useTheme();
  const rounded = Math.round(valueG * 10) / 10;
  const display = Number.isInteger(rounded) ? rounded : rounded.toFixed(1);
  const progress = goalG ? Math.min(valueG / goalG, 1) : null;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="overline" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="h2" style={styles.value}>
        {display}
        {goalG ? <ThemedText themeColor="textSecondary">{` / ${goalG}g`}</ThemedText> : 'g'}
      </ThemedText>
      <ProgressBar progress={progress ?? 0} color={color} height={6} style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.two + 4,
    gap: 4,
  },
  value: {
    letterSpacing: -0.2,
  },
  bar: {
    marginTop: 2,
  },
});
