import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

const mockSendVerificationEmail = vi.fn(async () => {});
vi.mock("../src/services/emailClient", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
  sendPasswordResetEmail: vi.fn(async () => {}),
}));

describe("email verification", () => {
  const app = createTestApp();

  beforeEach(() => {
    mockSendVerificationEmail.mockClear();
  });

  async function signUp(email: string) {
    const res = await request(app).post("/signup").send({ email, password: "password123", name: "Verify Me" });
    const token = res.body.token as string;
    const [, code] = mockSendVerificationEmail.mock.calls.at(-1)!;
    return { token, code: code as string };
  }

  it("sends a verification code on signup, and /me reports emailVerified: false beforehand", async () => {
    const { token } = await signUp("verify1@example.com");
    expect(mockSendVerificationEmail).toHaveBeenCalledWith("verify1@example.com", expect.any(String));

    const me = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.emailVerified).toBe(false);
  });

  it("does not block login for an unverified account", async () => {
    await signUp("verify2@example.com");
    const login = await request(app).post("/login").send({ email: "verify2@example.com", password: "password123" });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();
  });

  it("verifies the account with a valid code, reflected in /me afterward", async () => {
    const { token, code } = await signUp("verify3@example.com");

    const confirm = await request(app).post("/verify-email/confirm").send({ code });
    expect(confirm.status).toBe(200);
    expect(confirm.body.success).toBe(true);

    const me = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(me.body.user.emailVerified).toBe(true);
  });

  it("rejects reusing an already-used verification code", async () => {
    const { code } = await signUp("verify4@example.com");
    await request(app).post("/verify-email/confirm").send({ code });

    const secondAttempt = await request(app).post("/verify-email/confirm").send({ code });
    expect(secondAttempt.status).toBe(400);
  });

  it("rejects an unknown/garbage verification code", async () => {
    const res = await request(app).post("/verify-email/confirm").send({ code: "NOTAREALCODE" });
    expect(res.status).toBe(400);
  });

  it("resend issues a fresh code, invalidating the previous one", async () => {
    const { token, code: firstCode } = await signUp("verify5@example.com");

    const resend = await request(app).post("/verify-email/resend").set("Authorization", `Bearer ${token}`);
    expect(resend.status).toBe(200);
    const [, secondCode] = mockSendVerificationEmail.mock.calls.at(-1)!;

    const staleAttempt = await request(app).post("/verify-email/confirm").send({ code: firstCode });
    expect(staleAttempt.status).toBe(400);

    const freshAttempt = await request(app).post("/verify-email/confirm").send({ code: secondCode });
    expect(freshAttempt.status).toBe(200);
  });

  it("resend requires authentication", async () => {
    const res = await request(app).post("/verify-email/resend");
    expect(res.status).toBe(401);
  });

  it("resend on an already-verified account is a no-op that does not send another email", async () => {
    const { token, code } = await signUp("verify6@example.com");
    await request(app).post("/verify-email/confirm").send({ code });
    mockSendVerificationEmail.mockClear();

    const resend = await request(app).post("/verify-email/resend").set("Authorization", `Bearer ${token}`);
    expect(resend.status).toBe(200);
    expect(resend.body.message).toMatch(/already verified/i);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });
});
