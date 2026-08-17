import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_LEVEL_OPTIONS, GOAL_TYPE_OPTIONS } from '@/constants/options';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { calculateCalorieGoal } from '@/lib/calorieGoal';
import type { ActivityLevel, GoalType, Sex, User } from '@/types';

const TOTAL_STEPS = 2;

function StepIndicator({ step }: { step: 1 | 2 }) {
  const theme = useTheme();
  return (
    <View style={styles.stepRow}>
      <ThemedText type="caption" themeColor="textSecondary">
        Step {step} of {TOTAL_STEPS}
      </ThemedText>
      <View style={styles.stepDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepDot,
              { backgroundColor: i < step ? theme.primary : theme.backgroundElement },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

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
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      {selected ? <ThemedText style={styles.chipCheck}>✓ </ThemedText> : null}
      <ThemedText style={{ color: selected ? '#ffffff' : theme.text }} type="bodyBold">
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { setUser } = useAuth();
  const theme = useTheme();
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

  const isEdited = goalOverride !== null && suggestedGoal !== null && Number(goalOverride) !== suggestedGoal;

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

  const activityLabel = ACTIVITY_LEVEL_OPTIONS.find((o) => o.value === activityLevel)?.label;
  const goalLabel = GOAL_TYPE_OPTIONS.find((o) => o.value === goalType)?.label;

  if (step === 2) {
    return (
      <ScreenContainer>
        <StepIndicator step={2} />
        <ThemedText type="h1">Your daily goal</ThemedText>
        <ThemedText themeColor="textSecondary">
          Based on your profile, here&apos;s a suggested calorie target. You can adjust it any time.
        </ThemedText>

        <Animated.View entering={FadeInRight.duration(300)}>
          <Card style={styles.goalCard}>
            <ThemedText themeColor="textSecondary" type="caption">
              {isEdited ? 'Your calorie target' : 'Recommended daily calories'}
            </ThemedText>
            <TextField
              keyboardType="number-pad"
              value={goalOverride ?? ''}
              onChangeText={setGoalOverride}
              style={styles.goalInput}
              textAlign="center"
            />
            {isEdited && suggestedGoal !== null ? (
              <Pressable onPress={() => setGoalOverride(String(suggestedGoal))}>
                <ThemedText type="caption" themeColor="primary">
                  Reset to recommended ({suggestedGoal})
                </ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.recommendedBadge, { backgroundColor: theme.successSoft }]}>
                <ThemedText type="caption" themeColor="success">
                  Based on your profile
                </ThemedText>
              </View>
            )}
          </Card>

          <Card style={styles.summaryCard}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.summaryHeading}>
              Your profile
            </ThemedText>
            <SummaryRow label="Age" value={`${age} years`} />
            <SummaryRow label="Sex" value={sex === 'male' ? 'Male' : 'Female'} />
            <SummaryRow label="Height" value={`${heightCm} cm`} />
            <SummaryRow label="Weight" value={`${weightKg} kg`} />
            <SummaryRow label="Activity" value={activityLabel ?? '—'} />
            <SummaryRow label="Goal" value={goalLabel ?? '—'} />
          </Card>
        </Animated.View>

        {error ? (
          <ThemedText themeColor="danger" type="caption">
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
      <StepIndicator step={1} />
      <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
        <ThemedText type="h1">Tell us about you</ThemedText>
        <ThemedText themeColor="textSecondary">
          We&apos;ll use this to suggest a daily calorie target.
        </ThemedText>

        <TextField label="Age" keyboardType="number-pad" value={age} onChangeText={setAge} placeholder="30" />

        <View style={styles.field}>
          <ThemedText type="bodyBold">Sex</ThemedText>
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
          <ThemedText type="bodyBold">Activity level</ThemedText>
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
          <ThemedText type="bodyBold">Goal</ThemedText>
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
          <ThemedText themeColor="danger" type="caption">
            {error}
          </ThemedText>
        ) : null}

        <Button title="Continue" onPress={handleContinue} />
      </Animated.View>
    </ScreenContainer>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="bodyBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepDots: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: Radius.full,
  },
  stepContent: {
    gap: Spacing.three,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipCheck: {
    color: '#ffffff',
  },
  goalCard: {
    alignItems: 'center',
  },
  goalInput: {
    fontSize: 34,
    fontWeight: '800',
  },
  recommendedBadge: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.three,
  },
  summaryCard: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  summaryHeading: {
    marginBottom: Spacing.half,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
