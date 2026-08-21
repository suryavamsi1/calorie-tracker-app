import type { MealEntry } from '@/types';

export interface EntryTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Sums calories/macros across a list of entries; null macros (quick-add) count as 0. */
export function computeEntryTotals(entries: MealEntry[]): EntryTotals {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      proteinG: totals.proteinG + (entry.proteinG ?? 0),
      carbsG: totals.carbsG + (entry.carbsG ?? 0),
      fatG: totals.fatG + (entry.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

/** Calories remaining vs. a goal, or null when there's no goal set. */
export function computeRemainingCalories(consumed: number, calorieGoal: number | null): number | null {
  return calorieGoal !== null ? calorieGoal - consumed : null;
}
