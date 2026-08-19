import { afterEach, describe, expect, it, vi } from "vitest";
import { searchUsdaFoods } from "../src/services/usdaClient";
import { ProviderUnavailableError } from "../src/services/foodProviderTypes";

// Response shape verified against the real (live) USDA FoodData Central API
// during development - see /memories/repo/real-food-search-mvp.md.
function usdaResponseFixture() {
  return {
    foods: [
      {
        fdcId: 2057648,
        description: "CHEDDAR CHEESE",
        dataType: "Branded",
        brandOwner: "Grafton Village Cheese Co, LLC",
        brandName: "GRAFTON VILLAGE",
        servingSize: 28.0,
        servingSizeUnit: "g",
        foodNutrients: [
          { nutrientNumber: "203", value: 21.4 }, // Protein per 100g
          { nutrientNumber: "204", value: 28.6 }, // Fat per 100g
          { nutrientNumber: "205", value: 3.57 }, // Carbs per 100g
          { nutrientNumber: "208", value: 393 }, // Energy (kcal) per 100g
        ],
      },
      {
        fdcId: 173410,
        description: "CHICKEN, BROILERS OR FRYERS, BREAST, MEAT ONLY, RAW",
        dataType: "SR Legacy",
        // No servingSize/servingSizeUnit - generic food, defaults to 100g.
        foodNutrients: [
          { nutrientNumber: "203", value: 22.5 },
          { nutrientNumber: "204", value: 1.24 },
          { nutrientNumber: "205", value: 0 },
          { nutrientNumber: "208", value: 114 },
        ],
      },
    ],
  };
}

describe("usdaClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes a branded food, scaling per-100g nutrients down to the label serving size", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => usdaResponseFixture() }))
    );

    const results = await searchUsdaFoods("cheddar cheese");
    const cheese = results.find((f) => f.externalId === "2057648")!;

    expect(cheese.provider).toBe("usda");
    expect(cheese.name).toBe("Cheddar Cheese");
    expect(cheese.brand).toBe("GRAFTON VILLAGE");
    expect(cheese.servingSize).toBe(28);
    expect(cheese.servingUnit).toBe("g");
    // 28/100 = 0.28 scale factor
    expect(cheese.calories).toBe(Math.round(393 * 0.28));
    expect(cheese.proteinG).toBeCloseTo(21.4 * 0.28, 1);
    expect(cheese.fatG).toBeCloseTo(28.6 * 0.28, 1);
    expect(cheese.carbsG).toBeCloseTo(3.57 * 0.28, 1);
  });

  it("defaults to a plain 100g serving for generic foods with no label serving size", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => usdaResponseFixture() }))
    );

    const results = await searchUsdaFoods("chicken breast");
    const chicken = results.find((f) => f.externalId === "173410")!;

    expect(chicken.servingSize).toBe(100);
    expect(chicken.servingUnit).toBe("g");
    expect(chicken.calories).toBe(114);
    expect(chicken.proteinG).toBe(22.5);
  });

  it("throws ProviderUnavailableError on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }))
    );

    await expect(searchUsdaFoods("anything")).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it("throws ProviderUnavailableError when the network request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );

    await expect(searchUsdaFoods("anything")).rejects.toBeInstanceOf(ProviderUnavailableError);
  });
});
