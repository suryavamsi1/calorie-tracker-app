import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { MacroLine } from '@/components/MacroLine';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MealEntry } from '@/types';

function pendingLabel(entry: MealEntry): string | null {
  if (!entry.pendingStatus) return null;
  if (entry.pendingStatus === 'syncing') return 'Syncing…';
  if (entry.pendingStatus === 'failed') {
    return entry.pendingAction === 'delete' ? 'Delete failed — tap to retry' : 'Sync failed — tap to retry';
  }
  return 'Pending sync';
}

export function EntryRow({ entry, onPress }: { entry: MealEntry; onPress: () => void }) {
  const theme = useTheme();
  const label = pendingLabel(entry);
  const isFailed = entry.pendingStatus === 'failed';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.info}>
        <ThemedText type="small" style={styles.name}>{entry.foodName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {entry.quantity}x {entry.servingUnit}
        </ThemedText>
        <MacroLine proteinG={entry.proteinG} carbsG={entry.carbsG} fatG={entry.fatG} size="small" />
        {label ? (
          <View style={styles.pendingRow}>
            <Icon
              name={isFailed ? 'alert-circle-outline' : 'cloud-upload-outline'}
              size={12}
              color={isFailed ? theme.danger : theme.textTertiary}
            />
            <ThemedText type="caption" themeColor={isFailed ? 'danger' : 'textTertiary'}>
              {label}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText type="smallBold" style={styles.calories}>{entry.calories}</ThemedText>
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
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  name: {
    fontSize: 16,
    lineHeight: 24,
  },
  calories: {
    fontSize: 16,
    lineHeight: 24,
  },
});
