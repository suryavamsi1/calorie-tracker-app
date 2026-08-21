import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ApiError, api } from '@/lib/api';

export default function VerifyEmailScreen() {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    setError(null);
    if (!code.trim()) {
      setCodeError('Enter the code from your email.');
      return;
    }
    setCodeError(null);
    setVerifying(true);
    try {
      await api.post('/verify-email/confirm', { code: code.trim() }, { auth: false });
      await refreshUser();
      toast.show('Email verified!');
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to verify. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const { message } = await api.post<{ message: string }>('/verify-email/resend');
      toast.show(message);
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Couldn't resend the code. Try again.", 'error');
    } finally {
      setResending(false);
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <ThemedText type="title" style={styles.title}>
        Verify your email
      </ThemedText>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
        Enter the verification code we emailed you.
      </ThemedText>

      <TextField
        label="VERIFICATION CODE"
        icon="key-outline"
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={(text) => {
          setCode(text);
          setCodeError(null);
        }}
        placeholder="e.g. 3F9A2B7C1D"
        error={codeError}
      />

      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      <Button title="Verify email" onPress={handleVerify} loading={verifying} variant="accent" />
      <Button title="Resend code" variant="ghost" onPress={handleResend} loading={resending} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {},
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
});
