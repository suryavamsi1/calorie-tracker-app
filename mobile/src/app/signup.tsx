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

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Create your account
      </ThemedText>

      <TextField label="Name" value={name} onChangeText={setName} placeholder="Jamie Lee" />
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
        placeholder="At least 8 characters"
      />

      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      <Button title="Sign up" onPress={handleSubmit} loading={loading} />

      <Link href="/login" style={styles.link}>
        <ThemedText type="link" themeColor="primary">
          Already have an account? Log in
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
