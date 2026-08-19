import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

// Mock the provider dispatcher (not a specific client) so these tests stay
// valid regardless of which provider (USDA/Edamam/future) is active, are
// deterministic, and don't require real network access or API credentials.
vi.mock("../src/services/foodProvider", () => ({
  searchProviderFoods: vi.fn(async (query: string) => {
    if (query === "throw") throw new Error("boom");
    return [
      {
        provider: "edamam",
        externalId: "food_abc123",
        name: "Paneer Tikka",
        brand: "Amul",
        servingSize: 100,
        servingUnit: "g",
        calories: 265,
        proteinG: 18.3,
        carbsG: 3.4,
        fatG: 20.8,
      },
    ];
  }),
}));

describe("food search (external provider)", () => {
  const app = createTestApp();
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/signup")
      .send({ email: "search-user@example.com", password: "password123", name: "Search User" });
    token = res.body.token;
  });

  it("merges local and provider results with no providerError when the provider succeeds", async () => {
    const res = await request(app)
      .get("/foods/search?query=paneer")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.providerError).toBe(false);
    const providerResult = res.body.foods.find((f: any) => f.source === "provider");
    expect(providerResult).toBeDefined();
    expect(providerResult.id).toBe("provider:edamam:food_abc123");
    expect(providerResult.name).toBe("Paneer Tikka");
    expect(providerResult.brand).toBe("Amul");
    expect(providerResult.calories).toBe(265);
    expect(providerResult.proteinG).toBeGreaterThan(0);
    expect(providerResult.isFavorite).toBe(false);
  });

  it("returns providerError true and still returns local results when the provider throws", async () => {
    const res = await request(app)
      .get("/foods/search?query=throw")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.providerError).toBe(true);
    expect(res.body.foods.every((f: any) => f.source !== "provider")).toBe(true);
  });

  it("returns empty results for a blank query without calling the provider", async () => {
    const res = await request(app).get("/foods/search?query=").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.foods).toEqual([]);
    expect(res.body.providerError).toBe(false);
  });

  it("logs a provider food by importing a local snapshot, and reuses it on a second log instead of duplicating", async () => {
    const providerFood = {
      provider: "edamam",
      externalId: "food_abc123",
      name: "Paneer Tikka",
      brand: "Amul",
      servingSize: 100,
      servingUnit: "g",
      calories: 265,
      proteinG: 18.3,
      carbsG: 3.4,
      fatG: 20.8,
    };

    const first = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-08-19", mealType: "lunch", quantity: 1, providerFood });

    expect(first.status).toBe(201);
    expect(first.body.entry.foodName).toBe("Paneer Tikka");
    expect(first.body.entry.calories).toBe(265);
    expect(first.body.entry.proteinG).toBeCloseTo(18.3);
    const importedFoodId = first.body.entry.foodId;
    expect(importedFoodId).toBeTruthy();

    const second = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-08-19", mealType: "dinner", quantity: 2, providerFood });

    expect(second.status).toBe(201);
    expect(second.body.entry.foodId).toBe(importedFoodId);
    expect(second.body.entry.calories).toBe(530);
  });

  it("favorites a not-yet-imported provider food when given the full snapshot", async () => {
    const providerFood = {
      provider: "edamam",
      externalId: "food_xyz789",
      name: "Masala Dosa",
      brand: null,
      servingSize: 1,
      servingUnit: "serving",
      calories: 168,
      proteinG: 3.9,
      carbsG: 28,
      fatG: 4.5,
    };

    const res = await request(app)
      .post(`/foods/${encodeURIComponent("provider:edamam:food_xyz789")}/favorite`)
      .set("Authorization", `Bearer ${token}`)
      .send(providerFood);

    expect(res.status).toBe(201);
    expect(res.body.food.name).toBe("Masala Dosa");
    expect(res.body.food.isFavorite).toBe(true);

    const favorites = await request(app)
      .get("/foods/favorites")
      .set("Authorization", `Bearer ${token}`);
    expect(favorites.body.foods.some((f: any) => f.name === "Masala Dosa")).toBe(true);
  });

  it("rejects favoriting an unimported provider food without a snapshot body", async () => {
    const res = await request(app)
      .post(`/foods/${encodeURIComponent("provider:edamam:food_never_seen")}/favorite`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
