import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

const sendPasswordResetEmail = vi.fn(async () => {});
vi.mock("../src/services/emailClient", () => ({
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...args),
}));

describe("password reset", () => {
  const app = createTestApp();

  beforeEach(() => {
    sendPasswordResetEmail.mockClear();
  });

  async function requestCode(email: string) {
    await request(app).post("/forgot-password").send({ email });
    const [, code] = sendPasswordResetEmail.mock.calls.at(-1)!;
    return code as string;
  }

  it("returns the same generic message whether or not the email is registered", async () => {
    await request(app)
      .post("/signup")
      .send({ email: "reset-user@example.com", password: "password123", name: "Reset User" });

    const known = await request(app).post("/forgot-password").send({ email: "reset-user@example.com" });
    const unknown = await request(app).post("/forgot-password").send({ email: "nobody@example.com" });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
    // Only the registered email should have actually triggered a send.
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith("reset-user@example.com", expect.any(String));
  });

  it("resets the password with a valid code, and the old password stops working", async () => {
    await request(app)
      .post("/signup")
      .send({ email: "reset-flow@example.com", password: "oldPassword123", name: "Flow" });

    const code = await requestCode("reset-flow@example.com");

    const resetRes = await request(app).post("/reset-password").send({ code, newPassword: "newPassword456" });
    expect(resetRes.status).toBe(200);

    const oldLogin = await request(app)
      .post("/login")
      .send({ email: "reset-flow@example.com", password: "oldPassword123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/login")
      .send({ email: "reset-flow@example.com", password: "newPassword456" });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.token).toBeDefined();
  });

  it("rejects reusing an already-used code", async () => {
    await request(app)
      .post("/signup")
      .send({ email: "reuse@example.com", password: "password123", name: "Reuse" });

    const code = await requestCode("reuse@example.com");
    await request(app).post("/reset-password").send({ code, newPassword: "firstNewPass1" });

    const secondAttempt = await request(app).post("/reset-password").send({ code, newPassword: "secondNewPass2" });
    expect(secondAttempt.status).toBe(400);
  });

  it("invalidates an older code once a newer one is requested", async () => {
    await request(app)
      .post("/signup")
      .send({ email: "superseded@example.com", password: "password123", name: "Superseded" });

    const firstCode = await requestCode("superseded@example.com");
    const secondCode = await requestCode("superseded@example.com");

    const staleAttempt = await request(app)
      .post("/reset-password")
      .send({ code: firstCode, newPassword: "irrelevantPass1" });
    expect(staleAttempt.status).toBe(400);

    const freshAttempt = await request(app)
      .post("/reset-password")
      .send({ code: secondCode, newPassword: "finalPassword1" });
    expect(freshAttempt.status).toBe(200);
  });

  it("rejects an unknown/garbage code", async () => {
    const res = await request(app).post("/reset-password").send({ code: "NOTAREALCODE", newPassword: "somePassword1" });
    expect(res.status).toBe(400);
  });

  it("rejects a reset with a too-short new password", async () => {
    await request(app)
      .post("/signup")
      .send({ email: "shortpass@example.com", password: "password123", name: "Short" });
    const code = await requestCode("shortpass@example.com");

    const res = await request(app).post("/reset-password").send({ code, newPassword: "short" });
    expect(res.status).toBe(400);
  });
});
