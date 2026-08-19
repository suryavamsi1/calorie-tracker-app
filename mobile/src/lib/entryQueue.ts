import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MealType } from '@/types';

const QUEUE_KEY = 'calorie_tracker_entry_queue:v1';

/** Local-only id for an offline-created entry, before the server assigns a real one. */
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isLocalId(id: string): boolean {
  return id.startsWith('local_');
}

export type MutationStatus = 'pending' | 'syncing' | 'failed';

interface BaseMutation {
  id: string;
  createdAt: string;
  status: MutationStatus;
  lastError?: string;
}

/** Precomputed display fields so entries can render offline without a server round-trip. */
export interface EntryDisplay {
  foodName: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

export interface ProviderFoodSnapshot {
  provider: string;
  externalId: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface CreateEntryPayload {
  localEntryId: string;
  mealType: MealType;
  quantity: number;
  entryDate: string;
  foodId?: string;
  providerFood?: ProviderFoodSnapshot;
  customFoodName?: string;
  customCalories?: number;
  display: EntryDisplay;
}

export interface CreateEntryMutation extends BaseMutation {
  type: 'create-entry';
  payload: CreateEntryPayload;
}

export interface UpdateEntryPayload {
  entryId: string;
  updates: {
    mealType?: MealType;
    quantity?: number;
    entryDate?: string;
    foodId?: string;
    providerFood?: ProviderFoodSnapshot;
    customFoodName?: string;
    customCalories?: number;
  };
  display: Partial<EntryDisplay>;
}

export interface UpdateEntryMutation extends BaseMutation {
  type: 'update-entry';
  payload: UpdateEntryPayload;
}

export interface DeleteEntryMutation extends BaseMutation {
  type: 'delete-entry';
  payload: {
    entryId: string;
  };
}

export type PendingMutation = CreateEntryMutation | UpdateEntryMutation | DeleteEntryMutation;

export async function loadQueue(): Promise<PendingMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingMutation[]) : [];
  } catch {
    return [];
  }
}

export async function saveQueue(queue: PendingMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Best-effort persistence; an in-memory copy still drives the current session.
  }
}
