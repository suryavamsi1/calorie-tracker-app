import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function OfflineBanner() {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(250)}>
      <View style={[styles.banner, { backgroundColor: theme.warningSoft }]}>
        <ThemedText type="caption" themeColor="warning" style={styles.text}>
          You&apos;re offline — showing your last saved data
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  text: {
    textAlign: 'center',
  },
});
