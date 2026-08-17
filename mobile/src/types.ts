export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type Sex = 'male' | 'female';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface User {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goalType: GoalType | null;
  targetWeightKg: number | null;
  dailyCalorieGoal: number | null;
  createdAt: string;
}

export interface Food {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  source: string;
  isFavorite: boolean;
}

export interface MealEntry {
  id: string;
  foodId: string | null;
  foodName: string;
  servingSize: number;
  servingUnit: string;
  quantity: number;
  calories: number;
  mealType: MealType;
  entryDate: string;
  createdAt: string;
}

export interface HistoryDay {
  date: string;
  totalCalories: number;
  calorieGoal: number | null;
  remainingCalories: number | null;
  overGoal: boolean | null;
}

export interface HistoryDayDetail {
  date: string;
  totalCalories: number;
  calorieGoal: number | null;
  remainingCalories: number | null;
  entries: Array<{
    id: string;
    foodId: string | null;
    foodName: string;
    mealType: MealType;
    quantity: number;
    servingSize: number;
    servingUnit: string;
    calories: number;
  }>;
}
