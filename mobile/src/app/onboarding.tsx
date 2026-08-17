import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_LEVEL_OPTIONS, GOAL_TYPE_OPTIONS } from '@/constants/options';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { calculateCalorieGoal } from '@/lib/calorieGoal';
import type { ActivityLevel, GoalType, Sex, User } from '@/types';

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
        },
      ]}
    >
      <ThemedText style={{ color: selected ? '#ffffff' : theme.text }} type="smallBold">
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { setUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [goalOverride, setGoalOverride] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canContinue = Boolean(age && sex && heightCm && weightKg && activityLevel && goalType);

  const suggestedGoal = useMemo(() => {
    if (!canContinue) return null;
    return calculateCalorieGoal({
      age: Number(age),
      sex: sex as Sex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel: activityLevel as ActivityLevel,
      goalType: goalType as GoalType,
    });
  }, [age, sex, heightCm, weightKg, activityLevel, goalType, canContinue]);

  function handleContinue() {
    setError(null);
    if (!canContinue) {
      setError('Please fill in all fields to continue.');
      return;
    }
    setGoalOverride(String(suggestedGoal));
    setStep(2);
  }

  async function handleSave() {
    setError(null);
    const finalGoal = Number(goalOverride);
    if (!finalGoal || finalGoal < 800) {
      setError('Enter a valid calorie goal.');
      return;
    }
    setSaving(true);
    try {
      const { user: updated } = await api.put<{ user: User }>('/me', {
        age: Number(age),
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel,
        goalType,
        targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
      });
      const { user: withGoal } = await api.put<{ user: User }>('/me/goal', {
        dailyCalorieGoal: finalGoal,
      });
      setUser(withGoal ?? updated);
      router.replace('/(tabs)');
    } catch {
      setError('Unable to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (step === 2) {
    return (
      <ScreenContainer>
        <ThemedText type="title" style={styles.title}>
          Your daily goal
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Based on your profile, here&apos;s a suggested calorie target. You can adjust it any time.
        </ThemedText>

        <Card style={styles.goalCard}>
          <ThemedText themeColor="textSecondary" type="small">
            Suggested daily calories
          </ThemedText>
          <TextField
            keyboardType="number-pad"
            value={goalOverride ?? ''}
            onChangeText={setGoalOverride}
            style={styles.goalInput}
          />
        </Card>

        {error ? (
          <ThemedText themeColor="danger" type="small">
            {error}
          </ThemedText>
        ) : null}

        <Button title="Save and continue" onPress={handleSave} loading={saving} />
        <Button title="Back" variant="ghost" onPress={() => setStep(1)} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Tell us about you
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        We&apos;ll use this to suggest a daily calorie target.
      </ThemedText>

      <TextField label="Age" keyboardType="number-pad" value={age} onChangeText={setAge} placeholder="30" />

      <View style={styles.field}>
        <ThemedText type="smallBold">Sex</ThemedText>
        <View style={styles.row}>
          <Chip label="Male" selected={sex === 'male'} onPress={() => setSex('male')} />
          <Chip label="Female" selected={sex === 'female'} onPress={() => setSex('female')} />
        </View>
      </View>

      <TextField
        label="Height (cm)"
        keyboardType="decimal-pad"
        value={heightCm}
        onChangeText={setHeightCm}
        placeholder="175"
      />
      <TextField
        label="Weight (kg)"
        keyboardType="decimal-pad"
        value={weightKg}
        onChangeText={setWeightKg}
        placeholder="75"
      />

      <View style={styles.field}>
        <ThemedText type="smallBold">Activity level</ThemedText>
        <View style={styles.wrap}>
          {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={activityLevel === opt.value}
              onPress={() => setActivityLevel(opt.value as ActivityLevel)}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Goal</ThemedText>
        <View style={styles.row}>
          {GOAL_TYPE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={goalType === opt.value}
              onPress={() => setGoalType(opt.value as GoalType)}
            />
          ))}
        </View>
      </View>

      <TextField
        label="Target weight (kg, optional)"
        keyboardType="decimal-pad"
        value={targetWeightKg}
        onChangeText={setTargetWeightKg}
        placeholder="70"
      />

      {error ? (
        <ThemedText themeColor="danger" type="small">
          {error}
        </ThemedText>
      ) : null}

      <Button title="Continue" onPress={handleContinue} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
  },
  field: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  goalCard: {
    alignItems: 'center',
  },
  goalInput: {
    fontSize: 32,
    textAlign: 'center',
    fontWeight: '700',
  },
});
