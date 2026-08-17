import { ActivityLevel, GoalType, Sex } from '@/types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  lose: -450,
  maintain: 0,
  gain: 250,
};

const MIN_CALORIE_GOAL = 1200;

export interface CalorieGoalInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}

/**
 * Client-side preview of the Mifflin-St Jeor calorie goal estimate, mirroring
 * the server calculation in server/src/utils/calorieGoal.ts so onboarding can
 * show an instant suggestion before saving the profile.
 */
export function calculateCalorieGoal(input: CalorieGoalInput): number {
  const { sex, age, heightCm, weightKg, activityLevel, goalType } = input;

  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const adjusted = tdee + GOAL_ADJUSTMENTS[goalType];

  return Math.max(MIN_CALORIE_GOAL, Math.round(adjusted / 10) * 10);
}
