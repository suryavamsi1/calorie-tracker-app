import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Checkbox } from '@/components/Checkbox';
import { Button } from '@/components/Button';
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const nextEmailError = !email.trim() ? 'Enter your email.' : !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Enter a valid email address.' : null;
    const nextPasswordError = !password ? 'Enter a password.' : password.length < 8 ? 'Password must be at least 8 characters.' : null;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;
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
        onChangeText={(text) => {
          setEmail(text);
          setEmailError(null);
        }}
        placeholder="you@example.com"
        error={emailError}
      />
      <View>
        <TextField
          label="Password"
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
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
            </Pressable>
          }
        />
        {passwordError ? null : (
          <ThemedText type="caption" themeColor="textSecondary" style={styles.passwordHint}>
            Must be at least 8 characters
          </ThemedText>
        )}
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

      <View style={styles.primaryButton}>
        <Button title="Create Account" onPress={handleSubmit} loading={loading} variant="accent" />
      </View>

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
    marginTop: Spacing.one,
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
