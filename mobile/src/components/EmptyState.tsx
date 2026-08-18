import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  compact?: boolean;
}

export function EmptyState({ icon = 'restaurant-outline', title, subtitle, compact }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Icon name={icon} size={32} color={theme.textTertiary} />
      <ThemedText type="bodyBold" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.one,
  },
  compact: {
    paddingVertical: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
