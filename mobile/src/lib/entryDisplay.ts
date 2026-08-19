import type { MealEntry } from '@/types';
import type { EntryDisplay } from '@/lib/entryQueue';

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Recomputes the display fields (calories/macros) for an entry given a
 * quantity/custom-calories change, using the entry's own current per-serving
 * rate - works the same whether it's linked to a catalog food or a custom
 * one, and needs no network round-trip (used for optimistic offline edits).
 */
export function computeUpdatedDisplay(
  entry: MealEntry,
  updates: { quantity?: number; customFoodName?: string; customCalories?: number }
): Partial<EntryDisplay> {
  const nextQuantity = updates.quantity ?? entry.quantity;
  const isCustomEdit = updates.customFoodName !== undefined || updates.customCalories !== undefined;

  if (isCustomEdit) {
    const perServing = updates.customCalories ?? entry.calories / entry.quantity;
    return {
      foodName: updates.customFoodName ?? entry.foodName,
      calories: Math.round(perServing * nextQuantity),
      proteinG: null,
      carbsG: null,
      fatG: null,
    };
  }

  const perServingCalories = entry.calories / entry.quantity;
  return {
    calories: Math.round(perServingCalories * nextQuantity),
    proteinG: entry.proteinG !== null ? round1((entry.proteinG / entry.quantity) * nextQuantity) : null,
    carbsG: entry.carbsG !== null ? round1((entry.carbsG / entry.quantity) * nextQuantity) : null,
    fatG: entry.fatG !== null ? round1((entry.fatG / entry.quantity) * nextQuantity) : null,
  };
}
