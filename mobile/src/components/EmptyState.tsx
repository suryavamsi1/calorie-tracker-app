import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
}

export function EmptyState({ icon = '🍽️', title, subtitle, compact }: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
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
  icon: {
    fontSize: 32,
    marginBottom: Spacing.one,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
