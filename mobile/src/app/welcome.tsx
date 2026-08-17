import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <ScreenContainer scroll={false} style={styles.container}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title" style={styles.emoji}>
          🍽️
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Calorie Tracker
        </ThemedText>
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
          Log meals in seconds and see exactly how many calories you have left today.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.actions}>
        <Button title="Get started" onPress={() => router.push('/signup')} />
        <Button
          title="I already have an account"
          variant="ghost"
          onPress={() => router.push('/login')}
        />
      </ThemedView>
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
