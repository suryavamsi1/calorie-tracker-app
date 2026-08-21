import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { isValidEmail } from '@/lib/validation';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(null);
    setLoading(true);
    try {
      await api.post('/forgot-password', { email: trimmed }, { auth: false });
    } catch {
      // Only a genuine network/server failure reaches here - the endpoint
      // itself always responds with the same generic success message.
      // Still show the "sent" state; resubmitting is cheap if it didn't.
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <ScreenContainer style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="mail-outline" size={32} color={theme.primary} />
        </View>
        <ThemedText type="title" style={styles.title}>
          Check your email
        </ThemedText>
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
          If an account exists for {email.trim()}, we&apos;ve sent a password reset code. It expires in 1 hour.
        </ThemedText>

        <Button title="I have a code" onPress={() => router.push('/reset-password')} variant="accent" />
        <Button title="Back to sign in" variant="ghost" onPress={() => router.replace('/login')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.content}>
      <ThemedText type="title" style={styles.title}>
        Forgot password?
      </ThemedText>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
        Enter your account email and we&apos;ll send you a code to reset your password.
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

      <Button title="Send reset code" onPress={handleSubmit} loading={loading} variant="accent" />

      <Link href="/login" style={styles.link}>
        <ThemedText type="link" themeColor="textSecondary">
          Remembered it?{' '}
        </ThemedText>
        <ThemedText type="link" themeColor="primary">
          Back to sign in
        </ThemedText>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {},
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
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
  link: {
    flexDirection: 'row',
    marginTop: Spacing.two,
    alignSelf: 'center',
  },
});
