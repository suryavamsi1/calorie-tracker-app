import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface StepProgressProps {
  step: number;
  totalSteps: number;
}

/** Horizontal segmented progress bar used across onboarding steps. */
export function StepProgress({ step, totalSteps }: StepProgressProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[styles.segment, { backgroundColor: i < step ? theme.primary : theme.backgroundElement }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
  },
});
