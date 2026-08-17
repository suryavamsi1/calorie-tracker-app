import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';

export default function LoginScreen() {
  const { logIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Welcome back
      </ThemedText>

      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
      />

      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      <Button title="Log in" onPress={handleSubmit} loading={loading} />

      <Link href="/signup" style={styles.link}>
        <ThemedText type="link" themeColor="primary">
          Don&apos;t have an account? Sign up
        </ThemedText>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    marginBottom: Spacing.two,
  },
  link: {
    marginTop: Spacing.two,
    alignSelf: 'center',
  },
});
