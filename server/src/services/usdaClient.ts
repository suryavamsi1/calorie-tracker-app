import { env } from "../env";
import { ProviderUnavailableError, type FoodProviderClient, type NormalizedProviderFood } from "./foodProviderTypes";

interface UsdaNutrient {
  nutrientNumber?: string;
  value?: number;
}

interface UsdaFood {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaNutrient[];
}

interface UsdaSearchResponse {
  foods?: UsdaFood[];
}

const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const REQUEST_TIMEOUT_MS = 8000;

// USDA nutrient numbers are stable across data types (Foundation, SR Legacy,
// Branded, Survey/FNDDS) - see https://fdc.nal.usda.gov/data-documentation.
const NUTRIENT_NUMBER = {
  ENERGY_KCAL: "208",
  PROTEIN: "203",
  FAT: "204",
  CARBS: "205",
} as const;

function findNutrient(nutrients: UsdaNutrient[], nutrientNumber: string): number {
  return nutrients.find((n) => n.nutrientNumber === nutrientNumber)?.value ?? 0;
}

// USDA's foodNutrients values are always reported per 100g of food,
// regardless of data type. Branded foods additionally carry the label's own
// servingSize/servingSizeUnit (e.g. "28 g") - scale down to that when
// present so results read naturally (e.g. "1 serving (28g)" instead of a
// flat 100g for every packaged product); generic (Foundation/SR Legacy)
// foods have no serving size, so default to a plain 100g serving.
function normalizeFood(food: UsdaFood): NormalizedProviderFood | null {
  if (!food.fdcId || !food.description) return null;

  const nutrients = food.foodNutrients ?? [];
  const per100 = {
    calories: findNutrient(nutrients, NUTRIENT_NUMBER.ENERGY_KCAL),
    protein: findNutrient(nutrients, NUTRIENT_NUMBER.PROTEIN),
    fat: findNutrient(nutrients, NUTRIENT_NUMBER.FAT),
    carbs: findNutrient(nutrients, NUTRIENT_NUMBER.CARBS),
  };

  const hasServing = Boolean(food.servingSize && food.servingSizeUnit);
  const servingSize = hasServing ? (food.servingSize as number) : 100;
  const servingUnit = hasServing ? (food.servingSizeUnit as string) : "g";
  const scale = servingSize / 100;

  // Title Case the name - USDA descriptions are frequently ALL CAPS.
  const name = food.description.length > 3 ? toTitleCase(food.description) : food.description;

  return {
    provider: "usda",
    externalId: String(food.fdcId),
    name,
    brand: food.brandName || food.brandOwner || null,
    servingSize,
    servingUnit,
    calories: Math.round(per100.calories * scale),
    proteinG: Math.round(per100.protein * scale * 10) / 10,
    carbsG: Math.round(per100.carbs * scale * 10) / 10,
    fatG: Math.round(per100.fat * scale * 10) / 10,
  };
}

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/(^|[\s,()/-])([a-z])/g, (_match, sep: string, letter: string) => sep + letter.toUpperCase());
}

export async function searchUsdaFoods(query: string, limit = 20): Promise<NormalizedProviderFood[]> {
  // USDA's public DEMO_KEY works with zero signup (30 req/hour, 50/day) -
  // exactly meant for "explore before you sign up", so it's a safe default
  // rather than treating a missing key as unconfigured/unavailable. Set
  // USDA_API_KEY in server/.env for a free, much higher personal rate limit
  // (1000 req/hour) once you have one: https://fdc.nal.usda.gov/api-key-signup
  const apiKey = env.USDA_API_KEY || "DEMO_KEY";

  const url = new URL(USDA_SEARCH_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(Math.min(limit, 50)));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), { signal: controller.signal });
  } catch (err) {
    throw new ProviderUnavailableError(err instanceof Error ? err.message : "USDA request failed");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ProviderUnavailableError(`USDA responded with status ${response.status}`);
  }

  let data: UsdaSearchResponse;
  try {
    data = (await response.json()) as UsdaSearchResponse;
  } catch {
    throw new ProviderUnavailableError("USDA returned an unexpected response");
  }

  const foods = data.foods ?? [];
  const results: NormalizedProviderFood[] = [];
  for (const food of foods) {
    const normalized = normalizeFood(food);
    if (normalized) results.push(normalized);
    if (results.length >= limit) break;
  }
  return results;
}

export const usdaClient: FoodProviderClient = { search: searchUsdaFoods };
