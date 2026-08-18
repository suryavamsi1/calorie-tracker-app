import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface DividerProps {
  label?: string;
}

/** Horizontal rule with an optional centered label, e.g. "OR CONTINUE WITH". */
export function Divider({ label }: DividerProps) {
  const theme = useTheme();
  if (!label) return <View style={[styles.line, { backgroundColor: theme.border }]} />;

  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
      <ThemedText type="overline" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  line: {
    flex: 1,
    height: 1,
  },
});
