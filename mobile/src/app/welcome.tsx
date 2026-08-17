import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <ScreenContainer scroll={false} style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
        <ThemedText type="title" style={styles.emoji}>
          🍽️
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Calorie Tracker
        </ThemedText>
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
          Log meals in seconds and see exactly how many calories you have left today.
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(150)} style={styles.actions}>
        <Button title="Get started" onPress={() => router.push('/signup')} />
        <Button
          title="I already have an account"
          variant="ghost"
          onPress={() => router.push('/login')}
        />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.three,
  },
});
