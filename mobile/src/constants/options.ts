export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;

export const MEAL_TYPE_LABELS: Record<(typeof MEAL_TYPES)[number], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export const ACTIVITY_LEVEL_OPTIONS: Array<{ value: string; label: string; description: string }> = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Lightly active', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderately active', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very active', description: 'Physical job or 2x/day training' },
];

export const GOAL_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain', label: 'Gain weight' },
];
