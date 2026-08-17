import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

describe("entries", () => {
  const app = createTestApp();
  let token: string;
  let chickenFoodId: string;
  let appleFoodId: string;

  beforeAll(async () => {
    const signup = await request(app)
      .post("/signup")
      .send({ email: "entries-user@example.com", password: "password123", name: "Entries User" });
    token = signup.body.token;

    const chicken = await request(app).get("/foods?query=chicken").set("Authorization", `Bearer ${token}`);
    chickenFoodId = chicken.body.foods[0].id;

    const apple = await request(app).get("/foods?query=apple").set("Authorization", `Bearer ${token}`);
    appleFoodId = apple.body.foods[0].id;
  });

  it("creates a food-based entry and lists it for the date", async () => {
    const created = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-02-01", mealType: "lunch", foodId: chickenFoodId, quantity: 2 });

    expect(created.status).toBe(201);
    expect(created.body.entry.foodId).toBe(chickenFoodId);
    // Chicken breast: 31g protein per 100g serving x2 quantity = 62g
    expect(created.body.entry.proteinG).toBe(62);

    const list = await request(app)
      .get("/entries?date=2026-02-01")
      .set("Authorization", `Bearer ${token}`);
    expect(list.body.entries).toHaveLength(1);
    expect(list.body.entries[0].proteinG).toBe(62);
  });

  it("reports null macros for a quick-add (custom) entry", async () => {
    const res = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-02-15",
        mealType: "snacks",
        quantity: 1,
        customFoodName: "Mystery snack",
        customCalories: 90,
      });

    expect(res.status).toBe(201);
    expect(res.body.entry.proteinG).toBeNull();
    expect(res.body.entry.carbsG).toBeNull();
    expect(res.body.entry.fatG).toBeNull();
  });

  it("creates a custom (quick-add) entry", async () => {
    const res = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-02-02",
        mealType: "snacks",
        quantity: 1,
        customFoodName: "Trail mix",
        customCalories: 210,
      });

    expect(res.status).toBe(201);
    expect(res.body.entry.foodName).toBe("Trail mix");
    expect(res.body.entry.calories).toBe(210);
  });

  it("edits quantity and meal type", async () => {
    const created = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-02-03", mealType: "breakfast", foodId: appleFoodId, quantity: 1 });

    const edited = await request(app)
      .put(`/entries/${created.body.entry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 3, mealType: "snacks" });

    expect(edited.status).toBe(200);
    expect(edited.body.entry.quantity).toBe(3);
    expect(edited.body.entry.mealType).toBe("snacks");
  });

  it("corrects a mistaken entry by switching to a different catalog food", async () => {
    const created = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-02-04", mealType: "lunch", foodId: appleFoodId, quantity: 1 });

    // User meant to log chicken, not apple - correct the mistake in place.
    const edited = await request(app)
      .put(`/entries/${created.body.entry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ foodId: chickenFoodId });

    expect(edited.status).toBe(200);
    expect(edited.body.entry.foodId).toBe(chickenFoodId);
    expect(edited.body.entry.foodName).toMatch(/chicken/i);
  });

  it("corrects a mistaken calorie count on a custom entry", async () => {
    const created = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-02-05",
        mealType: "dinner",
        quantity: 1,
        customFoodName: "Homemade soup",
        customCalories: 300,
      });

    const edited = await request(app)
      .put(`/entries/${created.body.entry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ customCalories: 450 });

    expect(edited.status).toBe(200);
    expect(edited.body.entry.calories).toBe(450);
    expect(edited.body.entry.foodName).toBe("Homemade soup");
  });

  it("moves an entry to a different date", async () => {
    const created = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-02-06", mealType: "lunch", foodId: appleFoodId, quantity: 1 });

    const edited = await request(app)
      .put(`/entries/${created.body.entry.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ entryDate: "2026-02-07" });

    expect(edited.status).toBe(200);
    expect(edited.body.entry.entryDate).toBe("2026-02-07");

    const oldDayList = await request(app)
      .get("/entries?date=2026-02-06")
      .set("Authorization", `Bearer ${token}`);
    expect(oldDayList.body.entries).toHaveLength(0);
  });

  it("deletes an entry", async () => {
    const created = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-02-08", mealType: "snacks", foodId: appleFoodId, quantity: 1 });

    const deleted = await request(app)
      .delete(`/entries/${created.body.entry.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const list = await request(app)
      .get("/entries?date=2026-02-08")
      .set("Authorization", `Bearer ${token}`);
    expect(list.body.entries).toHaveLength(0);
  });

  it("rejects editing another user's entry", async () => {
    const otherSignup = await request(app)
      .post("/signup")
      .send({ email: "other-entries-user@example.com", password: "password123" });
    const otherToken = otherSignup.body.token;

    const created = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-02-09", mealType: "lunch", foodId: appleFoodId, quantity: 1 });

    const res = await request(app)
      .put(`/entries/${created.body.entry.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(404);
  });
});
