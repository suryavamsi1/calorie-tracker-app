import { Pressable, StyleSheet, View } from 'react-native';

import { MacroLine } from '@/components/MacroLine';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MealEntry } from '@/types';

export function EntryRow({ entry, onPress }: { entry: MealEntry; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.info}>
        <ThemedText type="small">{entry.foodName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {entry.quantity}x {entry.servingUnit}
        </ThemedText>
        <MacroLine proteinG={entry.proteinG} carbsG={entry.carbsG} fatG={entry.fatG} size="small" />
      </View>
      <ThemedText type="smallBold">{entry.calories} cal</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    gap: 2,
  },
});
