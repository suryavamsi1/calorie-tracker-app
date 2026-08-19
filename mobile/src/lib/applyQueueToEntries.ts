import type { MealEntry } from '@/types';
import type { PendingMutation } from '@/lib/entryQueue';

/**
 * Merges pending offline mutations on top of the last-fetched entries for a
 * given date, so the UI reflects optimistic create/update/delete state
 * immediately, without waiting for a sync round-trip.
 */
export function applyQueueToEntries(base: MealEntry[], queue: PendingMutation[], date: string): MealEntry[] {
  const byId = new Map<string, MealEntry>(base.map((e) => [e.id, { ...e }]));

  for (const m of queue) {
    if (m.type !== 'delete-entry') continue;
    const existing = byId.get(m.payload.entryId);
    if (!existing) continue;
    if (m.status === 'failed') {
      existing.pendingStatus = 'failed';
      existing.pendingAction = 'delete';
    } else {
      byId.delete(m.payload.entryId);
    }
  }

  for (const m of queue) {
    if (m.type !== 'update-entry') continue;
    const existing = byId.get(m.payload.entryId);
    if (!existing) continue;
    Object.assign(existing, m.payload.display);
    existing.pendingStatus = m.status;
    existing.pendingAction = 'update';
  }

  for (const m of queue) {
    if (m.type !== 'create-entry' || m.payload.entryDate !== date) continue;
    byId.set(m.payload.localEntryId, {
      id: m.payload.localEntryId,
      foodId: m.payload.foodId ?? null,
      foodName: m.payload.display.foodName,
      servingSize: m.payload.display.servingSize,
      servingUnit: m.payload.display.servingUnit,
      quantity: m.payload.quantity,
      calories: m.payload.display.calories,
      proteinG: m.payload.display.proteinG,
      carbsG: m.payload.display.carbsG,
      fatG: m.payload.display.fatG,
      mealType: m.payload.mealType,
      entryDate: m.payload.entryDate,
      createdAt: m.createdAt,
      pendingStatus: m.status,
      pendingAction: 'create',
    });
  }

  return Array.from(byId.values());
}
