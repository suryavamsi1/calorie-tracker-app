import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { InsightBanner } from '@/components/InsightBanner';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { SelectableCard } from '@/components/SelectableCard';
import { StepProgress } from '@/components/StepProgress';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_LEVEL_OPTIONS, GOAL_TYPE_OPTIONS } from '@/constants/options';
import { MacroColors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { calculateCalorieBreakdown, calculateMacroGoals } from '@/lib/calorieGoal';
import type { ActivityLevel, GoalType, Sex, User } from '@/types';

const TOTAL_STEPS = 4;

const ACTIVITY_ICONS: Record<ActivityLevel, IconName> = {
  sedentary: 'body-outline',
  light: 'walk-outline',
  moderate: 'barbell-outline',
  active: 'bicycle-outline',
  very_active: 'flash-outline',
};

const GOAL_ICONS: Record<GoalType, IconName> = {
  lose: 'trending-down-outline',
  maintain: 'remove-outline',
  gain: 'trending-up-outline',
};

const MACRO_ICONS: Record<'protein' | 'carbs' | 'fat', IconName> = {
  protein: 'barbell-outline',
  carbs: 'flash-outline',
  fat: 'water-outline',
};

export default function OnboardingScreen() {
  const { setUser } = useAuth();
  const theme = useTheme();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [goalOverride, setGoalOverride] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [sexError, setSexError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canComputeGoal = Boolean(age && sex && heightCm && weightKg && activityLevel && goalType);

  const breakdown = useMemo(() => {
    if (!canComputeGoal) return null;
    return calculateCalorieBreakdown({
      age: Number(age),
      sex: sex as Sex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel: activityLevel as ActivityLevel,
      goalType: goalType as GoalType,
    });
  }, [age, sex, heightCm, weightKg, activityLevel, goalType, canComputeGoal]);
  const suggestedGoal = breakdown?.dailyTarget ?? null;

  const finalGoalNumber = Number(goalOverride ?? suggestedGoal ?? 0);
  const macroGoals = useMemo(() => {
    if (!finalGoalNumber || !weightKg) return null;
    return calculateMacroGoals(finalGoalNumber, Number(weightKg));
  }, [finalGoalNumber, weightKg]);

  const isEdited = goalOverride !== null && suggestedGoal !== null && Number(goalOverride) !== suggestedGoal;

  function goNext() {
    setError(null);
    if (step === 1) {
      const ageNum = Number(age);
      const heightNum = Number(heightCm);
      const weightNum = Number(weightKg);
      const nextAgeError = !age ? 'Enter your age.' : !Number.isFinite(ageNum) || ageNum < 13 || ageNum > 100 ? 'Enter an age between 13 and 100.' : null;
      const nextSexError = !sex ? 'Select your sex.' : null;
      const nextHeightError = !heightCm ? 'Enter your height.' : !Number.isFinite(heightNum) || heightNum < 100 || heightNum > 250 ? 'Enter a height between 100 and 250 cm.' : null;
      const nextWeightError = !weightKg ? 'Enter your weight.' : !Number.isFinite(weightNum) || weightNum < 20 || weightNum > 300 ? 'Enter a weight between 20 and 300 kg.' : null;
      setAgeError(nextAgeError);
      setSexError(nextSexError);
      setHeightError(nextHeightError);
      setWeightError(nextWeightError);
      if (nextAgeError || nextSexError || nextHeightError || nextWeightError) {
        setError('Please fix the highlighted fields to continue.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!activityLevel) {
        setError('Please select your activity level.');
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!goalType) {
        setError('Please select a goal.');
        return;
      }
      setGoalOverride(String(suggestedGoal));
      setStep(4);
    }
  }

  function goBack() {
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
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
        dailyProteinGoal: macroGoals?.proteinG ?? null,
        dailyCarbsGoal: macroGoals?.carbsG ?? null,
        dailyFatGoal: macroGoals?.fatG ?? null,
      });
      setUser(withGoal ?? updated);
      track('onboarding_completed', { goalType, isEdited });
      router.replace('/(tabs)');
    } catch {
      setError('Unable to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (step === 4) {
    return (
      <ScreenContainer>
        <StepProgress step={4} totalSteps={TOTAL_STEPS} />
        <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
          <ThemedText type="h1">Your Daily Target</ThemedText>
          <ThemedText themeColor="textSecondary">
            Based on your goals and profile, here&apos;s your customized plan.
          </ThemedText>

          <Card style={styles.goalCard}>
            {breakdown ? (
              <View style={styles.maintenanceRow}>
                <View style={styles.maintenanceItem}>
                  <ThemedText type="overline" themeColor="textSecondary">
                    Maintenance
                  </ThemedText>
                  <ThemedText type="h3">{breakdown.maintenance.toLocaleString()}</ThemedText>
                </View>
                <View style={[styles.maintenanceDivider, { backgroundColor: theme.border }]} />
                <View style={styles.maintenanceItem}>
                  <ThemedText type="overline" themeColor="textSecondary">
                    Est. Weekly Change
                  </ThemedText>
                  <ThemedText type="h3" themeColor={breakdown.weeklyRateKg < 0 ? 'success' : breakdown.weeklyRateKg > 0 ? 'accent' : 'text'}>
                    {breakdown.weeklyRateKg > 0 ? '+' : ''}
                    {breakdown.weeklyRateKg} kg
                  </ThemedText>
                </View>
              </View>
            ) : null}

            <ThemedText themeColor="textSecondary" type="overline">
              Daily Target
            </ThemedText>
            <View style={styles.goalInputWrapper}>
              <TextField
                keyboardType="number-pad"
                value={goalOverride ?? ''}
                onChangeText={setGoalOverride}
                style={styles.goalInput}
                textAlign="center"
              />
            </View>
            {isEdited && suggestedGoal !== null ? (
              <Pressable
                onPress={() => setGoalOverride(String(suggestedGoal))}
                hitSlop={8}
                accessibilityRole="button"
                style={styles.resetButton}
              >
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

            <ThemedText themeColor="textSecondary" type="overline" style={styles.macroHeading}>
              Macro Targets
            </ThemedText>
            <View style={styles.macroRow}>
              <MacroTargetTile
                label="Protein"
                valueG={macroGoals?.proteinG ?? 0}
                color={MacroColors.protein}
                icon={MACRO_ICONS.protein}
              />
              <MacroTargetTile
                label="Carbs"
                valueG={macroGoals?.carbsG ?? 0}
                color={MacroColors.carbs}
                icon={MACRO_ICONS.carbs}
              />
              <MacroTargetTile label="Fats" valueG={macroGoals?.fatG ?? 0} color={MacroColors.fat} icon={MACRO_ICONS.fat} />
            </View>
          </Card>

          <InsightBanner
            icon="flask-outline"
            title="Why this works"
            message="We estimate your maintenance calories (TDEE) from the Mifflin-St Jeor equation and your activity level, then apply a moderate 500 kcal/day deficit or surplus so your daily target - not your maintenance number - is what you actually eat toward your goal."
            tone="info"
          />

          {error ? (
            <ThemedText themeColor="danger" type="caption">
              {error}
            </ThemedText>
          ) : null}

          <Button title="Start Tracking" onPress={handleSave} loading={saving} />
          <Button title="Back" variant="ghost" onPress={goBack} />
        </Animated.View>
      </ScreenContainer>
    );
  }

  if (step === 3) {
    return (
      <ScreenContainer>
        <StepProgress step={3} totalSteps={TOTAL_STEPS} />
        <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
          <ThemedText type="h1">What&apos;s your goal?</ThemedText>
          <ThemedText themeColor="textSecondary">
            We&apos;ll tailor your calorie and macro targets based on your selection.
          </ThemedText>

          <View style={[styles.stack, !goalType && error ? [styles.stackError, { borderColor: theme.danger }] : null]}>
            {GOAL_TYPE_OPTIONS.map((opt) => (
              <SelectableCard
                key={opt.value}
                icon={GOAL_ICONS[opt.value as GoalType]}
                title={opt.label}
                description={
                  opt.value === 'lose'
                    ? 'Sustainable fat loss through a calculated caloric deficit.'
                    : opt.value === 'gain'
                      ? 'Controlled surplus to support muscle and weight gain.'
                      : 'Stay exactly where you are with balanced energy intake.'
                }
                selected={goalType === opt.value}
                onPress={() => setGoalType(opt.value as GoalType)}
              />
            ))}
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

          <Button title="Continue" onPress={goNext} />
          <Button title="Back" variant="ghost" onPress={goBack} />
        </Animated.View>
      </ScreenContainer>
    );
  }

  if (step === 2) {
    return (
      <ScreenContainer>
        <StepProgress step={2} totalSteps={TOTAL_STEPS} />
        <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
          <ThemedText type="h1">How active are you?</ThemedText>
          <ThemedText themeColor="textSecondary">
            This helps us estimate your daily energy expenditure.
          </ThemedText>

          <View style={[styles.stack, !activityLevel && error ? [styles.stackError, { borderColor: theme.danger }] : null]}>
            {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
              <SelectableCard
                key={opt.value}
                icon={ACTIVITY_ICONS[opt.value as ActivityLevel]}
                title={opt.label}
                description={opt.description}
                selected={activityLevel === opt.value}
                onPress={() => setActivityLevel(opt.value as ActivityLevel)}
              />
            ))}
          </View>

          {error ? (
            <ThemedText themeColor="danger" type="caption">
              {error}
            </ThemedText>
          ) : null}

          <Button title="Continue" onPress={goNext} />
          <Button title="Back" variant="ghost" onPress={goBack} />
        </Animated.View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <StepProgress step={1} totalSteps={TOTAL_STEPS} />
      <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
        <ThemedText type="h1">Tell us about you</ThemedText>
        <ThemedText themeColor="textSecondary">
          We&apos;ll use this to suggest a daily calorie target.
        </ThemedText>

        <TextField
          label="Age"
          keyboardType="number-pad"
          value={age}
          onChangeText={(text) => {
            setAge(text);
            setAgeError(null);
          }}
          placeholder="30"
          error={ageError}
        />

        <View style={styles.field}>
          <ThemedText type="bodyBold">Sex</ThemedText>
          <SegmentedToggle
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
            value={sex}
            onChange={(value) => {
              setSex(value);
              setSexError(null);
            }}
          />
          {sexError ? (
            <ThemedText type="small" themeColor="danger">
              {sexError}
            </ThemedText>
          ) : null}
        </View>

        <TextField
          label="Height (cm)"
          keyboardType="decimal-pad"
          value={heightCm}
          onChangeText={(text) => {
            setHeightCm(text);
            setHeightError(null);
          }}
          placeholder="175"
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
          placeholder="75"
          error={weightError}
        />

        {error ? (
          <ThemedText themeColor="danger" type="caption">
            {error}
          </ThemedText>
        ) : null}

        <Button title="Continue" onPress={goNext} />
      </Animated.View>
    </ScreenContainer>
  );
}

function MacroTargetTile({
  label,
  valueG,
  color,
  icon,
}: {
  label: string;
  valueG: number;
  color: string;
  icon: IconName;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.macroTile, { backgroundColor: theme.backgroundSelected }]}>
      <Icon name={icon} size={20} color={color} />
      <ThemedText type="overline" themeColor="textSecondary" style={styles.macroTileLabel}>
        {label}
      </ThemedText>
      <ThemedText type="h3">{valueG}g</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  stack: {
    gap: Spacing.two,
  },
  stackError: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.two,
  },
  goalCard: {
    alignItems: 'center',
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.three,
  },
  maintenanceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  maintenanceDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  goalInputWrapper: {
    width: '100%',
  },
  goalInput: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  recommendedBadge: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.three,
  },
  resetButton: {
    paddingVertical: Spacing.one,
    alignSelf: 'flex-start',
  },
  macroHeading: {
    marginTop: Spacing.three,
    alignSelf: 'flex-start',
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.two,
  },
  macroTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.two + 4,
  },
  macroTileLabel: {
    letterSpacing: 0.3,
  },
});

