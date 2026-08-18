import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { MacroColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BAR_HEIGHTS_PCT = [0.4, 0.7, 0.9, 0.6, 0.3, 0.8];
const BAR_HEIGHT_CONTAINER = 64;

export default function WelcomeScreen() {
  const theme = useTheme();
  const barColors = [
    MacroColors.protein,
    theme.primary,
    theme.secondary,
    MacroColors.carbs,
    MacroColors.fat,
    theme.primary,
  ];

  return (
    <ScreenContainer style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
        <View style={styles.logoWrap}>
          <View style={[styles.logoGlow, { backgroundColor: theme.primary }]} />
          <View style={styles.logoCard}>
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
            <Image source={require('../../assets/images/bitelog-logo-square.png')} style={styles.logo} resizeMode="cover" />
          </View>
        </View>
        <View style={styles.titleBlock}>
          <ThemedText type="title" style={styles.title}>
            Master Your
          </ThemedText>
          <ThemedText type="title" themeColor="primary" style={styles.title}>
            Nutrition
          </ThemedText>
        </View>
        <ThemedText type="body" themeColor="textSecondary" style={styles.subtitle}>
          The smartest way to track your macros and crush your goals.
        </ThemedText>

        <View style={styles.barsRow}>
          {BAR_HEIGHTS_PCT.map((pct, i) => (
            <View
              key={i}
              style={[styles.bar, { height: BAR_HEIGHT_CONTAINER * pct, backgroundColor: barColors[i] }]}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(150)} style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/signup')}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary, shadowColor: theme.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <ThemedText type="bodyBold" style={styles.buttonLabel} numberOfLines={1} allowFontScaling={false}>
            Get Started
          </ThemedText>
          <Icon name="arrow-forward" size={18} color="#ffffff" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: '#ffffff', borderColor: 'rgba(188, 203, 185, 0.3)', opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <ThemedText
            type="bodyBold"
            style={[styles.buttonLabel, { color: '#2170E4' }]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            Log In
          </ThemedText>
        </Pressable>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  logoWrap: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: Radius.full,
    opacity: 0.2,
  },
  logoCard: {
    width: 128,
    height: 128,
    borderRadius: Radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 128,
    height: 128,
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    height: BAR_HEIGHT_CONTAINER,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
    opacity: 0.4,
  },
  bar: {
    width: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  actions: {
    gap: Spacing.three,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Radius.full,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 6,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 0.6,
  },
});
