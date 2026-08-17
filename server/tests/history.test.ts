import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

describe("history", () => {
  const app = createTestApp();
  let token: string;

  beforeAll(async () => {
    const signup = await request(app)
      .post("/signup")
      .send({ email: "history-user@example.com", password: "password123", name: "History User" });
    token = signup.body.token;

    const chicken = await request(app).get("/foods?query=chicken").set("Authorization", `Bearer ${token}`);
    const chickenFoodId = chicken.body.foods[0].id;

    const apple = await request(app).get("/foods?query=apple").set("Authorization", `Bearer ${token}`);
    const appleFoodId = apple.body.foods[0].id;

    await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-03-01", mealType: "lunch", foodId: chickenFoodId, quantity: 1 });
    await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-03-01", mealType: "snacks", foodId: appleFoodId, quantity: 2 });
  });

  it("includes daily macro totals in the history list", async () => {
    const res = await request(app).get("/history").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const day = res.body.days.find((d: { date: string }) => d.date === "2026-03-01");
    expect(day).toBeDefined();
    expect(day).toHaveProperty("totalProteinG");
    expect(day).toHaveProperty("totalCarbsG");
    expect(day).toHaveProperty("totalFatG");
    // Chicken breast (31g protein x1) + apple (0.5g protein x2) = 32g
    expect(day.totalProteinG).toBe(32);
  });

  it("includes per-entry and total macros in the day detail", async () => {
    const res = await request(app)
      .get("/history/2026-03-01")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body).toHaveProperty("totalProteinG", 32);

    const chickenEntry = res.body.entries.find((e: { foodName: string }) => /chicken/i.test(e.foodName));
    expect(chickenEntry.proteinG).toBe(31);
    expect(chickenEntry.carbsG).toBe(0);
  });
});
