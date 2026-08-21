import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { ApiError, api } from '@/lib/api';
import { validateResetPasswordForm } from '@/lib/validation';

export default function ResetPasswordScreen() {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const errors = validateResetPasswordForm({ code, newPassword, confirmPassword });
    setCodeError(errors.code ?? null);
    setPasswordError(errors.password ?? null);
    setConfirmError(errors.confirm ?? null);
    if (errors.code || errors.password || errors.confirm) return;

    setLoading(true);
    try {
      await api.post('/reset-password', { code: code.trim(), newPassword }, { auth: false });
      toast.show('Password reset! Log in with your new password.');
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <ThemedText type="title" style={styles.title}>
        Reset your password
      </ThemedText>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
        Enter the code we emailed you along with your new password.
      </ThemedText>

      <TextField
        label="RESET CODE"
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
      <TextField
        label="NEW PASSWORD"
        icon="lock-closed-outline"
        secureTextEntry
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);
          setPasswordError(null);
        }}
        placeholder="••••••••"
        error={passwordError}
      />
      <TextField
        label="CONFIRM NEW PASSWORD"
        icon="lock-closed-outline"
        secureTextEntry
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setConfirmError(null);
        }}
        placeholder="••••••••"
        error={confirmError}
      />

      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      <Button title="Reset password" onPress={handleSubmit} loading={loading} variant="accent" />

      <Link href="/login" style={styles.link}>
        <ThemedText type="link" themeColor="primary">
          Back to sign in
        </ThemedText>
      </Link>
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
  link: {
    flexDirection: 'row',
    marginTop: Spacing.two,
    alignSelf: 'center',
  },
});
