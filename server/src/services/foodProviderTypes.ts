/** Common contract every food-search provider adapter must return. */
export interface NormalizedProviderFood {
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

/** Thrown for any provider failure (missing credentials, network error, non-2xx, bad shape) so callers can fall back to local-only results. */
export class ProviderUnavailableError extends Error {}

export interface FoodProviderClient {
  search(query: string, limit?: number): Promise<NormalizedProviderFood[]>;
}
