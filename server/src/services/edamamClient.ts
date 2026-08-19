import { env } from "../env";
import { ProviderUnavailableError, type FoodProviderClient, type NormalizedProviderFood } from "./foodProviderTypes";

export { ProviderUnavailableError };

interface EdamamNutrients {
  ENERC_KCAL?: number;
  PROCNT?: number;
  CHOCDF?: number;
  FAT?: number;
}

interface EdamamMeasure {
  label?: string;
  weight?: number;
}

interface EdamamFood {
  foodId?: string;
  label?: string;
  brand?: string;
  nutrients?: EdamamNutrients;
}

interface EdamamHint {
  food?: EdamamFood;
  measures?: EdamamMeasure[];
}

interface EdamamParserResponse {
  hints?: EdamamHint[];
}

const EDAMAM_PARSER_URL = "https://api.edamam.com/api/food-database/v2/parser";
const REQUEST_TIMEOUT_MS = 8000;

// Edamam's nutrient values in the parser/hints response are per 100g, not
// per serving - pick the food's own named "Serving" measure when Edamam
// provides one (common for branded/packaged foods), otherwise fall back to
// a plain 100g serving for generic foods.
function pickServing(measures: EdamamMeasure[]): { weightG: number; servingSize: number; servingUnit: string } {
  const serving = measures.find((m) => m.label?.toLowerCase() === "serving" && m.weight);
  if (serving?.weight) {
    return { weightG: serving.weight, servingSize: 1, servingUnit: "serving" };
  }
  return { weightG: 100, servingSize: 100, servingUnit: "g" };
}

function normalizeHint(hint: EdamamHint): NormalizedProviderFood | null {
  const food = hint.food;
  if (!food?.foodId || !food.label) return null;

  const nutrients = food.nutrients ?? {};
  const { weightG, servingSize, servingUnit } = pickServing(hint.measures ?? []);
  const scale = weightG / 100;

  return {
    provider: "edamam",
    externalId: food.foodId,
    name: food.label,
    brand: food.brand ?? null,
    servingSize,
    servingUnit,
    calories: Math.round((nutrients.ENERC_KCAL ?? 0) * scale),
    proteinG: Math.round((nutrients.PROCNT ?? 0) * scale * 10) / 10,
    carbsG: Math.round((nutrients.CHOCDF ?? 0) * scale * 10) / 10,
    fatG: Math.round((nutrients.FAT ?? 0) * scale * 10) / 10,
  };
}

export async function searchEdamamFoods(query: string, limit = 20): Promise<NormalizedProviderFood[]> {
  if (!env.EDAMAM_APP_ID || !env.EDAMAM_APP_KEY) {
    throw new ProviderUnavailableError("Edamam credentials are not configured");
  }

  const url = new URL(EDAMAM_PARSER_URL);
  url.searchParams.set("app_id", env.EDAMAM_APP_ID);
  url.searchParams.set("app_key", env.EDAMAM_APP_KEY);
  url.searchParams.set("ingr", query);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), { signal: controller.signal });
  } catch (err) {
    throw new ProviderUnavailableError(err instanceof Error ? err.message : "Edamam request failed");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ProviderUnavailableError(`Edamam responded with status ${response.status}`);
  }

  let data: EdamamParserResponse;
  try {
    data = (await response.json()) as EdamamParserResponse;
  } catch {
    throw new ProviderUnavailableError("Edamam returned an unexpected response");
  }

  const hints = data.hints ?? [];
  const results: NormalizedProviderFood[] = [];
  for (const hint of hints) {
    const normalized = normalizeHint(hint);
    if (normalized) results.push(normalized);
    if (results.length >= limit) break;
  }
  return results;
}

export const edamamClient: FoodProviderClient = { search: searchEdamamFoods };
