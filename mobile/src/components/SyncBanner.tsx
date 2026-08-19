import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useSync } from '@/context/SyncContext';
import { useTheme } from '@/hooks/use-theme';

/**
 * Surfaces the offline-mutation-queue state above an entry list: offline
 * (changes will queue), actively syncing, or failed mutations needing a
 * manual retry. Renders nothing when there's nothing to say.
 */
export function SyncBanner() {
  const theme = useTheme();
  const { isOnline, isSyncing, pendingCount, hasFailedMutations, retryFailed } = useSync();

  if (hasFailedMutations) {
    return (
      <Animated.View entering={FadeInDown.duration(250)}>
        <Pressable onPress={retryFailed} style={[styles.banner, { backgroundColor: theme.dangerSoft }]}>
          <Icon name="alert-circle-outline" size={16} color={theme.danger} />
          <ThemedText type="caption" themeColor="danger" style={styles.text}>
            Some changes failed to sync — tap to retry
          </ThemedText>
        </Pressable>
      </Animated.View>
    );
  }

  if (!isOnline) {
    return (
      <Animated.View entering={FadeInDown.duration(250)}>
        <View style={[styles.banner, { backgroundColor: theme.warningSoft }]}>
          <Icon name="cloud-offline-outline" size={16} color={theme.warning} />
          <ThemedText type="caption" themeColor="warning" style={styles.text}>
            {pendingCount > 0
              ? `Offline — ${pendingCount} change${pendingCount === 1 ? '' : 's'} will sync when you're back online`
              : "Offline — changes will sync when you're back online"}
          </ThemedText>
        </View>
      </Animated.View>
    );
  }

  if (isSyncing || pendingCount > 0) {
    return (
      <Animated.View entering={FadeInDown.duration(250)}>
        <View style={[styles.banner, { backgroundColor: theme.successSoft }]}>
          <Icon name="sync-outline" size={16} color={theme.success} />
          <ThemedText type="caption" themeColor="success" style={styles.text}>
            Syncing…
          </ThemedText>
        </View>
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  text: {
    flex: 1,
  },
});
