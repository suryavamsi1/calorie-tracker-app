import { describe, expect, it } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

describe("auth", () => {
  const app = createTestApp();

  it("signs up a new user and returns a token", async () => {
    const res = await request(app)
      .post("/signup")
      .send({ email: "alice@example.com", password: "password123", name: "Alice" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("alice@example.com");
  });

  it("rejects duplicate signups", async () => {
    await request(app)
      .post("/signup")
      .send({ email: "dup@example.com", password: "password123", name: "Dup" });

    const res = await request(app)
      .post("/signup")
      .send({ email: "dup@example.com", password: "password123", name: "Dup" });

    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials", async () => {
    await request(app)
      .post("/signup")
      .send({ email: "bob@example.com", password: "password123", name: "Bob" });

    const res = await request(app).post("/login").send({ email: "bob@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects an incorrect password", async () => {
    await request(app)
      .post("/signup")
      .send({ email: "carol@example.com", password: "password123", name: "Carol" });

    const res = await request(app)
      .post("/login")
      .send({ email: "carol@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated requests to protected routes", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
  });
});
