import { env } from "../env";
import type { NormalizedProviderFood } from "./foodProviderTypes";
import { edamamClient } from "./edamamClient";
import { usdaClient } from "./usdaClient";

// Central place to pick which external food-search provider is active.
// Swapping providers (or adding a new one later) never touches the routes -
// just register it here and flip FOOD_PROVIDER in server/.env.
const PROVIDERS = {
  usda: usdaClient,
  edamam: edamamClient,
} as const;

export type FoodProviderName = keyof typeof PROVIDERS;

export function searchProviderFoods(query: string, limit?: number): Promise<NormalizedProviderFood[]> {
  const provider = PROVIDERS[env.FOOD_PROVIDER] ?? PROVIDERS.usda;
  return provider.search(query, limit);
}
