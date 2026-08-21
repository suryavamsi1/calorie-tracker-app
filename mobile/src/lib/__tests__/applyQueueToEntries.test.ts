import { applyQueueToEntries } from '@/lib/applyQueueToEntries';
import type { PendingMutation } from '@/lib/entryQueue';
import type { MealEntry } from '@/types';

const DATE = '2026-01-15';

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
    entryDate: DATE,
    createdAt: '2026-01-15T12:00:00.000Z',
    ...overrides,
  };
}

function makeCreateMutation(overrides: Partial<PendingMutation> = {}): PendingMutation {
  return {
    id: 'mut-create-1',
    createdAt: '2026-01-15T12:05:00.000Z',
    status: 'pending',
    type: 'create-entry',
    payload: {
      localEntryId: 'local_123',
      mealType: 'snacks',
      quantity: 1,
      entryDate: DATE,
      foodId: 'food-2',
      display: {
        foodName: 'Granola bar',
        servingSize: 1,
        servingUnit: 'serving',
        calories: 180,
        proteinG: null,
        carbsG: null,
        fatG: null,
      },
    },
    ...overrides,
  } as PendingMutation;
}

describe('applyQueueToEntries', () => {
  it('returns the base entries unchanged when the queue is empty', () => {
    const base = [makeEntry()];
    expect(applyQueueToEntries(base, [], DATE)).toEqual(base);
  });

  it('appends a pending create-entry mutation for the matching date as a synthetic entry', () => {
    const result = applyQueueToEntries([], [makeCreateMutation()], DATE);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'local_123',
      foodName: 'Granola bar',
      calories: 180,
      mealType: 'snacks',
      pendingStatus: 'pending',
      pendingAction: 'create',
    });
  });

  it('does not append a create-entry mutation for a different date', () => {
    const result = applyQueueToEntries([], [makeCreateMutation()], '2026-02-01');
    expect(result).toHaveLength(0);
  });

  it('overlays a pending update-entry mutation on top of the matching base entry', () => {
    const base = [makeEntry()];
    const queue: PendingMutation[] = [
      {
        id: 'mut-update-1',
        createdAt: '2026-01-15T12:10:00.000Z',
        status: 'pending',
        type: 'update-entry',
        payload: {
          entryId: 'entry-1',
          updates: { quantity: 2 },
          display: { calories: 330, proteinG: 62, carbsG: 0, fatG: 7.2 },
        },
      },
    ];
    const result = applyQueueToEntries(base, queue, DATE);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'entry-1',
      calories: 330,
      proteinG: 62,
      pendingStatus: 'pending',
      pendingAction: 'update',
    });
  });

  it('hides an entry with a pending or syncing delete-entry mutation', () => {
    const base = [makeEntry()];
    for (const status of ['pending', 'syncing'] as const) {
      const queue: PendingMutation[] = [
        {
          id: 'mut-delete-1',
          createdAt: '2026-01-15T12:10:00.000Z',
          status,
          type: 'delete-entry',
          payload: { entryId: 'entry-1' },
        },
      ];
      expect(applyQueueToEntries(base, queue, DATE)).toHaveLength(0);
    }
  });

  it('reappears an entry with a FAILED delete-entry mutation, marked failed', () => {
    const base = [makeEntry()];
    const queue: PendingMutation[] = [
      {
        id: 'mut-delete-1',
        createdAt: '2026-01-15T12:10:00.000Z',
        status: 'failed',
        type: 'delete-entry',
        payload: { entryId: 'entry-1' },
      },
    ];
    const result = applyQueueToEntries(base, queue, DATE);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'entry-1',
      pendingStatus: 'failed',
      pendingAction: 'delete',
    });
  });

  it('handles a full mixed queue (create + update + delete) independently for the same date', () => {
    const base = [makeEntry({ id: 'entry-1' }), makeEntry({ id: 'entry-2', foodName: 'Rice' })];
    const queue: PendingMutation[] = [
      {
        id: 'mut-delete',
        createdAt: '2026-01-15T12:10:00.000Z',
        status: 'pending',
        type: 'delete-entry',
        payload: { entryId: 'entry-2' },
      },
      {
        id: 'mut-update',
        createdAt: '2026-01-15T12:11:00.000Z',
        status: 'syncing',
        type: 'update-entry',
        payload: { entryId: 'entry-1', updates: { quantity: 3 }, display: { calories: 495 } },
      },
      makeCreateMutation(),
    ];
    const result = applyQueueToEntries(base, queue, DATE);
    const ids = result.map((e) => e.id).sort();
    expect(ids).toEqual(['entry-1', 'local_123'].sort());
    expect(result.find((e) => e.id === 'entry-1')).toMatchObject({ calories: 495, pendingStatus: 'syncing' });
  });
});
