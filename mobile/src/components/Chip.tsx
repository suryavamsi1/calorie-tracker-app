import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
}

/** Pill-shaped filter/selection control used for meal types, goals, activity levels, tabs, etc. */
export function Chip({ label, selected = false, onPress, icon, size = 'md', style }: ChipProps) {
  const theme = useTheme();
  const backgroundColor = selected ? theme.success : theme.backgroundElement;
  const textColor = selected ? '#004B1E' : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' && styles.chipSm,
        { backgroundColor, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={textColor} /> : null}
      <ThemedText type={size === 'sm' ? 'caption' : 'bodyBold'} style={{ color: textColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  chipSm: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 4,
  },
});
