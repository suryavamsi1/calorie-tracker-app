import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Divider } from '@/components/Divider';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SocialButton } from '@/components/SocialButton';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';

export default function LoginScreen() {
  const { logIn } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await logIn(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function comingSoon() {
    toast.show('Coming soon', 'info');
  }

  return (
    <ScreenContainer style={styles.content}>
      <View style={styles.logoWrap}>
        <View style={[styles.logoCard, { shadowColor: theme.primary }]}>
          {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
          <Image source={require('../../assets/images/bitelog-logo-square.png')} style={styles.logo} resizeMode="contain" />
        </View>
      </View>

      <ThemedText type="title" style={styles.title}>
        Welcome back
      </ThemedText>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
        Let&apos;s get back on track with your goals.
      </ThemedText>

      <TextField
        label="EMAIL ADDRESS"
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />

      <View>
        <View style={styles.passwordLabelRow}>
          <ThemedText type="smallBold">PASSWORD</ThemedText>
          <Pressable onPress={comingSoon} hitSlop={8}>
            <ThemedText type="small" themeColor="secondary">
              Forgot?
            </ThemedText>
          </Pressable>
        </View>
        <TextField
          icon="lock-closed-outline"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          rightAccessory={
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
            </Pressable>
          }
        />
      </View>

      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={handleSubmit}
        disabled={loading}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: theme.success, shadowColor: theme.success, opacity: pressed || loading ? 0.85 : 1 },
        ]}
      >
        <ThemedText type="h2" style={styles.primaryButtonLabel}>
          {loading ? 'Signing in…' : 'Sign In'}
        </ThemedText>
      </Pressable>

      <Divider label="OR CONTINUE WITH" />

      <View style={styles.socialRow}>
        <SocialButton provider="google" title="Google" onPress={comingSoon} style={styles.socialButton} />
        <SocialButton provider="apple" title="Apple" onPress={comingSoon} style={styles.socialButton} />
      </View>

      <Link href="/signup" style={styles.link}>
        <ThemedText type="link" themeColor="textSecondary">
          New to BiteLog?{' '}
        </ThemedText>
        <ThemedText type="link" themeColor="primary">
          Create Account
        </ThemedText>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {},
  logoWrap: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  logoCard: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 280,
    marginBottom: Spacing.two,
  },
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  primaryButtonLabel: {
    color: '#002109',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  socialButton: {
    flex: 1,
  },
  link: {
    flexDirection: 'row',
    marginTop: Spacing.two,
    alignSelf: 'center',
  },
});
