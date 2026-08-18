import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeMode } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';

export interface SelectableCardProps {
  icon: IconName;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

/** Full-width icon+title+description row with a trailing radio indicator, used for goal/activity pickers. */
export function SelectableCard({ icon, title, description, selected, onPress }: SelectableCardProps) {
  const theme = useTheme();
  const { scheme } = useThemeMode();
  const selectedOverlay = scheme === 'dark' ? 'rgba(75, 226, 119, 0.1)' : 'rgba(0, 110, 47, 0.05)';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: selected ? selectedOverlay : theme.surface, borderColor: selected ? theme.primary : theme.border },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.backgroundElement }]}>
        <Icon name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.text}>
        <ThemedText type="bodyBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : 'transparent' },
        ]}
      >
        {selected ? <Icon name="checkmark" size={14} color="#ffffff" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
