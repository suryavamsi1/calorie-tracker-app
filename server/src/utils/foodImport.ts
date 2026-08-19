import { db } from "../db";
import { generateId } from "./id";

export interface ProviderFoodInput {
  provider: string;
  externalId: string;
  name: string;
  brand?: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/**
 * Resolves a provider search result to a real local `foods` row id,
 * importing a normalized snapshot on first use (log/favorite) so nutrition
 * data stays stable even if the provider's own data changes later. Safe to
 * call repeatedly for the same provider+externalId - reuses the existing
 * row (shared across all users, like curated foods) instead of duplicating.
 */
export function resolveProviderFood(input: ProviderFoodInput): string {
  const existing = db
    .prepare("SELECT id FROM foods WHERE provider = ? AND external_id = ?")
    .get(input.provider, input.externalId) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = generateId();
  db.prepare(
    `INSERT INTO foods
     (id, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, source, provider, external_id, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'provider', ?, ?, NULL)`
  ).run(
    id,
    input.name,
    input.brand ?? null,
    input.servingSize,
    input.servingUnit,
    Math.round(input.calories),
    input.proteinG,
    input.carbsG,
    input.fatG,
    input.provider,
    input.externalId
  );
  return id;
}
