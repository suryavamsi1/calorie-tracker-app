import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Icon } from '@/components/Icon';
import { ListRow } from '@/components/ListRow';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_LEVEL_OPTIONS } from '@/constants/options';
import { MacroColors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useThemeMode, type ThemePreference } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { calculateCalorieGoal, calculateMacroGoals } from '@/lib/calorieGoal';
import { formatMemberSince } from '@/lib/date';
import type { ActivityLevel, GoalType, Sex, User } from '@/types';

export default function ProfileScreen() {
  const { user, logOut, setUser } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [goal, setGoal] = useState(user?.dailyCalorieGoal ? String(user.dailyCalorieGoal) : '');
  const [goalEditedManually, setGoalEditedManually] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const ageNum = age ? Number(age) : null;
    const nextAgeError = age && (!Number.isFinite(ageNum) || (ageNum as number) < 13 || (ageNum as number) > 100) ? 'Enter an age between 13 and 100.' : null;
    const heightNum = heightCm ? Number(heightCm) : null;
    const nextHeightError = heightCm && (!Number.isFinite(heightNum) || (heightNum as number) < 100 || (heightNum as number) > 250) ? 'Enter a height between 100 and 250 cm.' : null;
    const weightNum = weightKg ? Number(weightKg) : null;
    const nextWeightError = weightKg && (!Number.isFinite(weightNum) || (weightNum as number) <= 0) ? 'Enter a valid weight.' : null;
    const goalNum = goal ? Number(goal) : null;
    const nextGoalError = goal && (!Number.isFinite(goalNum) || (goalNum as number) < 800) ? 'Enter a valid calorie goal.' : null;
    setAgeError(nextAgeError);
    setHeightError(nextHeightError);
    setWeightError(nextWeightError);
    setGoalError(nextGoalError);
    if (nextAgeError || nextHeightError || nextWeightError || nextGoalError) return;
    setSaving(true);
    try {
      const newWeightKg = weightKg ? Number(weightKg) : undefined;
      const { user: updated } = await api.put<{ user: User }>('/me', {
        name: name.trim() || undefined,
        age: age ? Number(age) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: newWeightKg,
      });

      // Weight affects both the Mifflin-St Jeor calorie estimate and the
      // bodyweight-based protein target, so re-derive both whenever weight
      // changes - unless the user typed their own calorie goal this session,
      // in which case respect their explicit override.
      const canRecalculate =
        !goalEditedManually &&
        newWeightKg &&
        updated.age &&
        updated.sex &&
        updated.heightCm &&
        updated.activityLevel &&
        updated.goalType;

      const finalGoal = canRecalculate
        ? calculateCalorieGoal({
            age: updated.age as number,
            sex: updated.sex as Sex,
            heightCm: updated.heightCm as number,
            weightKg: newWeightKg as number,
            activityLevel: updated.activityLevel as ActivityLevel,
            goalType: updated.goalType as GoalType,
          })
        : Number(goal) || updated.dailyCalorieGoal;

      const macros = finalGoal && newWeightKg ? calculateMacroGoals(finalGoal, newWeightKg) : null;

      const { user: withGoal } = finalGoal
        ? await api.put<{ user: User }>('/me/goal', {
            dailyCalorieGoal: finalGoal,
            dailyProteinGoal: macros?.proteinG ?? undefined,
            dailyCarbsGoal: macros?.carbsG ?? undefined,
            dailyFatGoal: macros?.fatG ?? undefined,
          })
        : { user: updated };

      setUser(withGoal);
      setGoal(withGoal.dailyCalorieGoal ? String(withGoal.dailyCalorieGoal) : '');
      setGoalEditedManually(false);
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

  const activity = ACTIVITY_LEVEL_OPTIONS.find((o) => o.value === user.activityLevel);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.surface }}>
        <AppHeader title="Profile" />
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
          <View>
            <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="display" themeColor="primary" style={styles.avatarInitial}>
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => toast.show('Coming soon')}
              style={[styles.avatarBadge, { backgroundColor: theme.primary }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <Icon name="pencil" size={14} color={theme.onPrimary} />
            </Pressable>
          </View>
          <ThemedText type="h1">{user.name ?? 'Your profile'}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            Member since {formatMemberSince(user.createdAt)}
          </ThemedText>
        </View>

        {!user.emailVerified ? <EmailVerificationBanner /> : null}

        <Card>
          <View style={styles.cardHeader}>
            <ThemedText type="h3">Health Profile</ThemedText>
            <Pressable
              onPress={() => {
                if (!editing) {
                  setName(user.name ?? '');
                  setAge(user.age ? String(user.age) : '');
                  setHeightCm(user.heightCm ? String(user.heightCm) : '');
                  setWeightKg(user.weightKg ? String(user.weightKg) : '');
                  setGoal(user.dailyCalorieGoal ? String(user.dailyCalorieGoal) : '');
                  setGoalEditedManually(false);
                  setAgeError(null);
                  setHeightError(null);
                  setWeightError(null);
                  setGoalError(null);
                  setError(null);
                }
                setEditing((v) => !v);
              }}
              hitSlop={13}
              accessibilityRole="button"
              accessibilityLabel={editing ? 'Close edit form' : 'Edit health profile'}
            >
              <Icon name={editing ? 'close' : 'pencil'} size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          {editing ? (
            <View style={styles.form}>
              <TextField label="Name" value={name} onChangeText={setName} />
              <TextField
                label="Age"
                keyboardType="number-pad"
                value={age}
                onChangeText={(text) => {
                  setAge(text);
                  setAgeError(null);
                }}
                error={ageError}
              />
              <TextField
                label="Height (cm)"
                keyboardType="decimal-pad"
                value={heightCm}
                onChangeText={(text) => {
                  setHeightCm(text);
                  setHeightError(null);
                }}
                error={heightError}
              />
              <TextField
                label="Weight (kg)"
                keyboardType="decimal-pad"
                value={weightKg}
                onChangeText={(text) => {
                  setWeightKg(text);
                  setWeightError(null);
                }}
                error={weightError}
              />
              <TextField
                label="Daily calorie goal"
                keyboardType="number-pad"
                value={goal}
                onChangeText={(text) => {
                  setGoal(text);
                  setGoalEditedManually(true);
                  setGoalError(null);
                }}
                error={goalError}
              />
              {error ? (
                <ThemedText themeColor="danger" type="caption">
                  {error}
                </ThemedText>
              ) : null}
              <Button title="Save" onPress={handleSave} loading={saving} />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setGoalEditedManually(false);
                  setAgeError(null);
                  setHeightError(null);
                  setWeightError(null);
                  setGoalError(null);
                  setEditing(false);
                }}
              />
            </View>
          ) : (
            <View>
              <ListRow label="Age" value={user.age ? `${user.age}` : '—'} showChevron />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <ListRow label="Height" value={user.heightCm ? `${user.heightCm} cm` : '—'} showChevron />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <ListRow label="Weight" value={user.weightKg ? `${user.weightKg} kg` : '—'} showChevron />
            </View>
          )}
        </Card>

        <Card>
          <ThemedText type="h3">Daily Targets</ThemedText>
          <View style={styles.calorieCenter}>
            <ThemedText type="overline" themeColor="textSecondary">
              Calorie Goal
            </ThemedText>
            <View style={styles.calorieValueRow}>
              <ThemedText type="display" style={styles.calorieValue}>
                {user.dailyCalorieGoal ? user.dailyCalorieGoal.toLocaleString() : '—'}
              </ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                kcal
              </ThemedText>
            </View>
          </View>
          <View style={styles.macroBarRow}>
            <MacroBarTile label="Protein" valueG={user.dailyProteinGoal} color={MacroColors.protein} />
            <MacroBarTile label="Carbs" valueG={user.dailyCarbsGoal} color={MacroColors.carbs} />
            <MacroBarTile label="Fats" valueG={user.dailyFatGoal} color={MacroColors.fat} />
          </View>
        </Card>

        {activity ? (
          <View>
            <ThemedText type="h3" style={styles.activityHeading}>Activity Level</ThemedText>
            <Card style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: theme.backgroundElement }]}>
                <Icon name="walk" size={18} color={theme.primary} />
              </View>
              <View style={styles.flexOne}>
                <ThemedText type="bodyBold">{activity.label}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {activity.description}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => toast.show('Coming soon')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Edit activity level"
              >
                <Icon name="pencil" size={18} color={theme.textSecondary} />
              </Pressable>
            </Card>
          </View>
        ) : null}

        <Card>
          <ThemedText type="h3" style={styles.accountHeading}>
            Account
          </ThemedText>
          <ChangePasswordSection />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <AppearanceSection />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ListRow
            icon="scale-outline"
            label="Units of Measurement"
            value="Metric"
            onPress={() => toast.show('Coming soon')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ListRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => toast.show('Coming soon')}
          />
        </Card>

        <Button title="Log out" variant="secondary" onPress={handleLogout} />

        <DeleteAccountSection />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function EmailVerificationBanner() {
  const theme = useTheme();
  const toast = useToast();
  const [resending, setResending] = useState(false);

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
    <Card style={[styles.verifyBanner, { backgroundColor: theme.warningSoft }]}>
      <View style={styles.verifyBannerRow}>
        <Icon name="mail-unread-outline" size={20} color={theme.warning} />
        <View style={styles.flexOne}>
          <ThemedText type="smallBold" themeColor="warning">
            Verify your email
          </ThemedText>
          <ThemedText type="caption" themeColor="warning">
            Check your inbox for a verification code.
          </ThemedText>
        </View>
      </View>
      <View style={styles.verifyBannerActions}>
        <Button
          title="Resend code"
          variant="secondary"
          size="sm"
          onPress={handleResend}
          loading={resending}
        />
        <Button
          title="Enter code"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/verify-email')}
        />
      </View>
    </Card>
  );
}

function MacroBarTile({ label, valueG, color }: { label: string; valueG: number | null; color: string }) {
  const theme = useTheme();
  const pct = valueG ? Math.min(1, Math.max(0.1, valueG / 250)) : 0;
  return (
    <View style={styles.macroBarTile}>
      <View style={[styles.macroBarTrack, { backgroundColor: theme.backgroundSelected }]}>
        {valueG ? <View style={[styles.macroBarFill, { height: `${pct * 100}%`, backgroundColor: color }]} /> : null}
      </View>
      <ThemedText type="smallBold" themeColor={valueG ? undefined : 'textTertiary'}>
        {valueG ? `${valueG}g` : 'Not set'}
      </ThemedText>
      <ThemedText type="overline" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function AppearanceSection() {
  const { preference, setPreference } = useThemeMode();
  const options: Array<{ value: ThemePreference; label: string }> = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <View>
      <ListRow icon="contrast" label="Appearance" showChevron={false} />
      <View style={styles.appearanceRow}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={preference === option.value}
            onPress={() => setPreference(option.value)}
            size="sm"
          />
        ))}
      </View>
    </View>
  );
}

function ChangePasswordSection() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword() {
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setOpen(false);
      toast.show('Password changed');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <ListRow
        icon="lock-closed"
        label="Change Password"
        onPress={() => {
          setCurrentPassword('');
          setNewPassword('');
          setError(null);
          setOpen((v) => !v);
        }}
      />
      {open ? (
        <View style={styles.form}>
          <TextField
            label="Current password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextField label="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
          {error ? (
            <ThemedText themeColor="danger" type="caption">
              {error}
            </ThemedText>
          ) : null}
          <Button title="Update password" onPress={handleChangePassword} loading={saving} />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => {
              setCurrentPassword('');
              setNewPassword('');
              setError(null);
              setOpen(false);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function DeleteAccountSection() {
  const { logOut } = useAuth();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  async function performDelete() {
    setConfirmVisible(false);
    setDeleting(true);
    try {
      await api.delete('/me');
      await logOut();
      router.replace('/welcome');
    } catch {
      toast.show("Couldn't delete account. Check your connection.", 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <ThemedText type="caption" themeColor="textSecondary">
        Deleting your account permanently removes your profile, entries, and custom foods.
      </ThemedText>
      <Button title="Delete account" variant="dangerSoft" onPress={() => setConfirmVisible(true)} loading={deleting} />
      <ConfirmDialog
        visible={confirmVisible}
        title="Delete account?"
        message="This permanently deletes your account and all logged data. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={performDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexOne: { flex: 1 },
  verifyBanner: {
    gap: Spacing.two,
  },
  verifyBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  verifyBannerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  content: {
    padding: Spacing.threeAndHalf,
    gap: Spacing.five,
    paddingBottom: Spacing.six,
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  header: {
    alignItems: 'center',
    gap: 2,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  avatarInitial: {
    fontSize: 36,
    lineHeight: 42,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: Spacing.two + 2,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  form: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  calorieCenter: {
    alignItems: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.four,
  },
  calorieValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  calorieValue: {
    fontSize: 40,
    lineHeight: 46,
  },
  macroBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
    gap: Spacing.two,
  },
  macroBarTile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  macroBarTrack: {
    width: 48,
    height: 96,
    borderRadius: Radius.full,
    justifyContent: 'flex-end',
    padding: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    width: '100%',
    borderRadius: Radius.full,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  activityHeading: {
    marginBottom: Spacing.one,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountHeading: {
    marginBottom: Spacing.one,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.one,
  },
});
