import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

describe("foods", () => {
  const app = createTestApp();
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/signup")
      .send({ email: "food-user@example.com", password: "password123", name: "Food User" });
    token = res.body.token;
  });

  it("searches the curated food database", async () => {
    const res = await request(app)
      .get("/foods?query=chicken")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.foods.length).toBeGreaterThan(0);
    expect(res.body.foods[0]).toHaveProperty("isFavorite", false);
    expect(res.body.foods[0]).toHaveProperty("proteinG");
    expect(res.body.foods[0]).toHaveProperty("carbsG");
    expect(res.body.foods[0]).toHaveProperty("fatG");
    expect(res.body.foods[0].proteinG).toBeGreaterThan(0);
  });

  it("creates a custom food with macros", async () => {
    const res = await request(app)
      .post("/foods/custom")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Protein shake",
        servingSize: 1,
        servingUnit: "scoop",
        calories: 120,
        proteinG: 24,
        carbsG: 3,
        fatG: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.food.name).toBe("Protein shake");
    expect(res.body.food.proteinG).toBe(24);
    expect(res.body.food.carbsG).toBe(3);
    expect(res.body.food.fatG).toBe(1);
  });

  it("defaults custom food macros to 0 when omitted", async () => {
    const res = await request(app)
      .post("/foods/custom")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Mystery snack", calories: 50 });

    expect(res.status).toBe(201);
    expect(res.body.food.proteinG).toBe(0);
    expect(res.body.food.carbsG).toBe(0);
    expect(res.body.food.fatG).toBe(0);
  });

  it("stars and unstars a food as a favorite", async () => {
    const search = await request(app).get("/foods?query=apple").set("Authorization", `Bearer ${token}`);
    const foodId = search.body.foods[0].id;

    const star = await request(app)
      .post(`/foods/${foodId}/favorite`)
      .set("Authorization", `Bearer ${token}`);
    expect(star.status).toBe(201);

    const favorites = await request(app).get("/foods/favorites").set("Authorization", `Bearer ${token}`);
    expect(favorites.body.foods.some((f: { id: string }) => f.id === foodId)).toBe(true);

    const unstar = await request(app)
      .delete(`/foods/${foodId}/favorite`)
      .set("Authorization", `Bearer ${token}`);
    expect(unstar.status).toBe(204);

    const favoritesAfter = await request(app)
      .get("/foods/favorites")
      .set("Authorization", `Bearer ${token}`);
    expect(favoritesAfter.body.foods.some((f: { id: string }) => f.id === foodId)).toBe(false);
  });

  it("returns recently logged foods", async () => {
    const search = await request(app).get("/foods?query=banana").set("Authorization", `Bearer ${token}`);
    const foodId = search.body.foods[0].id;

    await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-01-01", mealType: "snacks", foodId, quantity: 1 });

    const recent = await request(app).get("/foods/recent").set("Authorization", `Bearer ${token}`);
    expect(recent.body.foods.some((f: { id: string }) => f.id === foodId)).toBe(true);
  });
});
