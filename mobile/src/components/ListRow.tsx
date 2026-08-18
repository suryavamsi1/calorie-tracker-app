import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Pressable } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ListRowProps {
  icon?: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

/** Icon/label/value row with an optional chevron, used for profile & settings lists. */
export function ListRow({ icon, label, value, onPress, showChevron = Boolean(onPress), style }: ListRowProps) {
  const theme = useTheme();
  const content = (
    <View style={[styles.row, style]}>
      {icon ? <Icon name={icon} size={24} color={theme.textSecondary} /> : null}
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      {value ? (
        <ThemedText type="bodyBold" themeColor="textSecondary">
          {value}
        </ThemedText>
      ) : null}
      {showChevron ? <Icon name="chevron-forward" size={20} color={theme.textTertiary} /> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  label: {
    flex: 1,
  },
});
