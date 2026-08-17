import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { User } from '@/types';

export default function ProfileScreen() {
  const { user, logOut, setUser } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [weightKg, setWeightKg] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [goal, setGoal] = useState(user?.dailyCalorieGoal ? String(user.dailyCalorieGoal) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const { user: updated } = await api.put<{ user: User }>('/me', {
        name: name.trim() || undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      });
      const goalNumber = Number(goal);
      const { user: withGoal } =
        goalNumber && goalNumber !== updated.dailyCalorieGoal
          ? await api.put<{ user: User }>('/me/goal', { dailyCalorieGoal: goalNumber })
          : { user: updated };
      setUser(withGoal);
      setEditing(false);
      toast.show('Profile updated');
    } catch {
      setError('Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logOut();
    router.replace('/welcome');
  }

  if (!user) return null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="h2" themeColor="primary">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View>
          <ThemedText type="h2">{user.name ?? 'Your profile'}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {user.email}
          </ThemedText>
        </View>
      </View>

      <Card>
        {editing ? (
          <View style={styles.form}>
            <TextField label="Name" value={name} onChangeText={setName} />
            <TextField label="Weight (kg)" keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
            <TextField label="Daily calorie goal" keyboardType="number-pad" value={goal} onChangeText={setGoal} />
            {error ? (
              <ThemedText themeColor="danger" type="caption">
                {error}
              </ThemedText>
            ) : null}
            <Button title="Save" onPress={handleSave} loading={saving} />
            <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} />
          </View>
        ) : (
          <View style={styles.form}>
            <Row label="Weight" value={user.weightKg ? `${user.weightKg} kg` : '—'} />
            <Row label="Goal type" value={user.goalType ?? '—'} />
            <Row label="Daily calorie goal" value={user.dailyCalorieGoal ? `${user.dailyCalorieGoal} cal` : '—'} />
            <Button title="Edit profile" variant="secondary" onPress={() => setEditing(true)} />
          </View>
        )}
      </Card>

      <Button title="Log out" variant="danger" onPress={handleLogout} />
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="bodyBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
