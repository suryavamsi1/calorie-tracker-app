import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Checkbox } from '@/components/Checkbox';
import { Divider } from '@/components/Divider';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SocialButton } from '@/components/SocialButton';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      setError('Enter an email and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      router.replace('/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function comingSoon() {
    toast.show('Coming soon', 'info');
  }

  return (
    <ScreenContainer style={styles.content}>
      <View style={[styles.logoCard, Shadow.raised, { backgroundColor: theme.surface }]}>
        <View style={[StyleSheet.absoluteFill, styles.logoOverlay, { backgroundColor: theme.primary }]} />
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image source={require('../../assets/images/bitelog-logo-square.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <ThemedText type="title" style={styles.title}>
        Create account
      </ThemedText>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
        Start logging your journey today.
      </ThemedText>

      <TextField label="Full Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Jamie Lee" />
      <TextField
        label="Email Address"
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <View>
        <TextField
          label="Password"
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
        <ThemedText type="caption" themeColor="textSecondary" style={styles.passwordHint}>
          Must be at least 8 characters
        </ThemedText>
      </View>

      <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms}>
        <ThemedText type="caption" themeColor="textSecondary">
          I agree to the{' '}
          <ThemedText type="caption" themeColor="primary" onPress={comingSoon}>
            Terms of Service
          </ThemedText>{' '}
          and{' '}
          <ThemedText type="caption" themeColor="primary" onPress={comingSoon}>
            Privacy Policy
          </ThemedText>
        </ThemedText>
      </Checkbox>

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
          {loading ? 'Creating account\u2026' : 'Create Account'}
        </ThemedText>
      </Pressable>

      <Divider label="OR" />

      <SocialButton provider="google" title="Continue with Google" onPress={comingSoon} />
      <SocialButton provider="apple" title="Continue with Apple" onPress={comingSoon} />

      <Link href="/login" style={styles.link}>
        <ThemedText type="link" themeColor="textSecondary">
          Already have an account?{' '}
        </ThemedText>
        <ThemedText type="link" themeColor="primary">
          Sign In
        </ThemedText>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {},
  logoCard: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  logoOverlay: {
    opacity: 0.1,
  },
  logo: {
    width: 80,
    height: 80,
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
  passwordHint: {
    marginTop: Spacing.one,
  },
  link: {
    flexDirection: 'row',
    marginTop: Spacing.two,
    alignSelf: 'center',
  },
});
