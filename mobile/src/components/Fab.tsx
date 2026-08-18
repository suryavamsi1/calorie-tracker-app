import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/Icon';
import { Radius, Shadow } from '@/constants/theme';
import { useThemeMode } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';

export interface FabProps {
  onPress: () => void;
  style?: object;
}

/** Fixed floating "quick add" button anchored above the tab bar. */
export function Fab({ onPress, style }: FabProps) {
  const theme = useTheme();
  const { scheme } = useThemeMode();
  const iconColor = scheme === 'dark' ? '#003915' : '#ffffff';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        Shadow.raised,
        { backgroundColor: theme.primary, shadowColor: theme.primary, opacity: pressed ? 0.9 : 1 },
        style,
      ]}
    >
      <Icon name="add" size={28} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
