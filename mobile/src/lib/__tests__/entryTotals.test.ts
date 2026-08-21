import { computeEntryTotals, computeRemainingCalories } from '@/lib/entryTotals';
import type { MealEntry } from '@/types';

function makeEntry(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: 'entry-1',
    foodId: 'food-1',
    foodName: 'Food',
    servingSize: 100,
    servingUnit: 'g',
    quantity: 1,
    calories: 100,
    proteinG: 10,
    carbsG: 10,
    fatG: 5,
    mealType: 'lunch',
    entryDate: '2026-01-15',
    createdAt: '2026-01-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('computeEntryTotals', () => {
  it('returns all zeros for an empty entry list', () => {
    expect(computeEntryTotals([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it('sums calories and macros across multiple entries', () => {
    const entries = [
      makeEntry({ calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }),
      makeEntry({ calories: 375, proteinG: 15, carbsG: 18, fatG: 27 }),
    ];
    expect(computeEntryTotals(entries)).toEqual({ calories: 540, proteinG: 46, carbsG: 18, fatG: 30.6 });
  });

  it('treats null macros (quick-add entries) as zero', () => {
    const entries = [makeEntry({ calories: 200, proteinG: null, carbsG: null, fatG: null })];
    expect(computeEntryTotals(entries)).toEqual({ calories: 200, proteinG: 0, carbsG: 0, fatG: 0 });
  });
});

describe('computeRemainingCalories', () => {
  it('returns null when there is no calorie goal', () => {
    expect(computeRemainingCalories(500, null)).toBeNull();
  });

  it('subtracts consumed calories from the goal', () => {
    expect(computeRemainingCalories(500, 2000)).toBe(1500);
  });

  it('goes negative when consumed exceeds the goal', () => {
    expect(computeRemainingCalories(2500, 2000)).toBe(-500);
  });
});
