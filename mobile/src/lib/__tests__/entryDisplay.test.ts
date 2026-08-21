import { computeUpdatedDisplay, round1 } from '@/lib/entryDisplay';
import type { MealEntry } from '@/types';

function makeEntry(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: 'entry-1',
    foodId: 'food-1',
    foodName: 'Chicken breast',
    servingSize: 100,
    servingUnit: 'g',
    quantity: 1,
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    mealType: 'lunch',
    entryDate: '2026-01-15',
    createdAt: '2026-01-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('round1', () => {
  it('rounds to one decimal place', () => {
    expect(round1(31.449)).toBe(31.4);
    expect(round1(31.45)).toBe(31.5);
    expect(round1(0)).toBe(0);
  });
});

describe('computeUpdatedDisplay', () => {
  it('scales calories and macros proportionally when quantity changes', () => {
    const entry = makeEntry({ quantity: 1, calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });
    const result = computeUpdatedDisplay(entry, { quantity: 2 });
    expect(result).toEqual({ calories: 330, proteinG: 62, carbsG: 0, fatG: 7.2 });
  });

  it('scales down correctly for a fractional quantity', () => {
    const entry = makeEntry({ quantity: 2, calories: 530, proteinG: 36.6, carbsG: 6.8, fatG: 41.6 });
    const result = computeUpdatedDisplay(entry, { quantity: 1 });
    expect(result.calories).toBe(265);
    expect(result.proteinG).toBeCloseTo(18.3, 1);
  });

  it('preserves null macros for quick-add entries when scaling quantity', () => {
    const entry = makeEntry({ quantity: 1, calories: 200, proteinG: null, carbsG: null, fatG: null });
    const result = computeUpdatedDisplay(entry, { quantity: 2 });
    expect(result).toEqual({ calories: 400, proteinG: null, carbsG: null, fatG: null });
  });

  it('treats a customFoodName/customCalories edit as a custom-entry edit, zeroing macros', () => {
    const entry = makeEntry({ foodName: 'Chicken breast', quantity: 1, calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });
    const result = computeUpdatedDisplay(entry, { customFoodName: 'Snack', customCalories: 300, quantity: 2 });
    expect(result).toEqual({ foodName: 'Snack', calories: 600, proteinG: null, carbsG: null, fatG: null });
  });

  it('keeps the current per-serving calories when only customFoodName changes (no customCalories given)', () => {
    const entry = makeEntry({ foodName: 'Old name', quantity: 2, calories: 400 });
    const result = computeUpdatedDisplay(entry, { customFoodName: 'New name' });
    // per-serving = 400/2 = 200, quantity unchanged (still 2) => 400
    expect(result.foodName).toBe('New name');
    expect(result.calories).toBe(400);
  });
});
