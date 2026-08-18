import { ActivityLevel, GoalType, Sex } from '@/types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// A flat -500/+300 kcal/day adjustment is the commonly cited starting point
// for a ~0.5kg/week pace (500-750 deficit range for weight loss, 250-500
// surplus range for lean gain) - applied on TOP OF the user's own TDEE, so
// higher-activity users (who have a higher maintenance) still land on a
// higher, but still deficit-relative, target rather than a fixed number.
const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

// Rough energy density of body-weight change; ~7700 kcal per kg of fat is the
// standard estimate used to translate a daily deficit/surplus into an
// expected weekly rate of weight change.
const KCAL_PER_KG = 7700;

const MIN_CALORIE_GOAL = 1200;

export interface CalorieGoalInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}

export interface CalorieBreakdown {
  /** Basal metabolic rate - calories burned at rest. */
  bmr: number;
  /** Total daily energy expenditure (maintenance calories) at the selected activity level. */
  maintenance: number;
  /** Recommended daily intake after the goal-based deficit/surplus is applied. */
  dailyTarget: number;
  /** dailyTarget - maintenance (negative for a deficit, positive for a surplus). */
  deficit: number;
  /** Estimated weekly weight change (kg) implied by the deficit/surplus, negative = loss. */
  weeklyRateKg: number;
}

/**
 * Full Mifflin-St Jeor breakdown: BMR -> maintenance (TDEE) -> goal-adjusted
 * daily target, so the UI can show maintenance and the weight-loss/gain
 * target as two distinct numbers rather than presenting TDEE as if it were
 * the intake target.
 */
export function calculateCalorieBreakdown(input: CalorieGoalInput): CalorieBreakdown {
  const { sex, age, heightCm, weightKg, activityLevel, goalType } = input;

  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const maintenance = Math.round((bmr * ACTIVITY_MULTIPLIERS[activityLevel]) / 10) * 10;
  const adjustment = GOAL_ADJUSTMENTS[goalType];
  const dailyTarget = Math.max(MIN_CALORIE_GOAL, Math.round((maintenance + adjustment) / 10) * 10);
  const deficit = dailyTarget - maintenance;
  const weeklyRateKg = Math.round((deficit * 7 * 10) / KCAL_PER_KG) / 10;

  return { bmr: Math.round(bmr), maintenance, dailyTarget, deficit, weeklyRateKg };
}

/**
 * Client-side preview of the Mifflin-St Jeor calorie goal estimate, mirroring
 * the server calculation in server/src/utils/calorieGoal.ts so onboarding can
 * show an instant suggestion before saving the profile.
 */
export function calculateCalorieGoal(input: CalorieGoalInput): number {
  return calculateCalorieBreakdown(input).dailyTarget;
}

export interface MacroGoals {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/**
 * Standard macro split: protein by bodyweight (1.6g/kg), fat at 25% of
 * calories, remaining calories filled with carbs.
 */
export function calculateMacroGoals(calorieGoal: number, weightKg: number): MacroGoals {
  const proteinG = Math.round(weightKg * 1.6);
  const fatG = Math.round((calorieGoal * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calorieGoal - proteinG * 4 - fatG * 9) / 4));
  return { proteinG, carbsG, fatG };
}
