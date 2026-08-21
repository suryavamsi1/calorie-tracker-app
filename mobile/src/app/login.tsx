import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Divider } from '@/components/Divider';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SocialButton } from '@/components/SocialButton';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { isValidEmail } from '@/lib/validation';

export default function LoginScreen() {
  const { logIn } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const nextEmailError = !email.trim() ? 'Enter your email.' : !isValidEmail(email) ? 'Enter a valid email address.' : null;
    const nextPasswordError = !password ? 'Enter your password.' : null;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;
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
        onChangeText={(text) => {
          setEmail(text);
          setEmailError(null);
        }}
        placeholder="you@example.com"
        error={emailError}
      />

      <View>
        <View style={styles.passwordLabelRow}>
          <ThemedText type="smallBold">PASSWORD</ThemedText>
          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
            <ThemedText type="small" themeColor="secondary">
              Forgot?
            </ThemedText>
          </Pressable>
        </View>
        <TextField
          icon="lock-closed-outline"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError(null);
          }}
          placeholder="••••••••"
          error={passwordError}
          rightAccessory={
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
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

      <View style={styles.primaryButton}>
        <Button title="Sign In" onPress={handleSubmit} loading={loading} variant="accent" />
      </View>

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
    marginTop: Spacing.one,
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
