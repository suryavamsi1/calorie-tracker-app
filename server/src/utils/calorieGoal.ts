export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType = "lose" | "maintain" | "gain";

export type Sex = "male" | "female";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Kept in sync with mobile/src/lib/calorieGoal.ts - see that file for the
// reasoning (flat -500/+300 kcal/day adjustment on top of TDEE, matching the
// standard ~0.5kg/week deficit/surplus recommendation).
const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
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
 * Estimates a daily calorie target using the Mifflin-St Jeor equation for BMR,
 * scaled by an activity multiplier to get maintenance calories (TDEE), then
 * adjusted based on the user's goal.
 */
export function calculateCalorieGoal(input: CalorieGoalInput): number {
  const { sex, age, heightCm, weightKg, activityLevel, goalType } = input;

  const bmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const maintenance = Math.round(tdee / 10) * 10;
  const adjusted = maintenance + GOAL_ADJUSTMENTS[goalType];

  return Math.max(MIN_CALORIE_GOAL, Math.round(adjusted / 10) * 10);
}
