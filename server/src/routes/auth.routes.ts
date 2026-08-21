import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db";
import { generateId } from "../utils/id";
import { signToken } from "../utils/jwt";
import { generateVerificationCode, hashVerificationCode, normalizeVerificationCode } from "../utils/verificationCode";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailClient";

const router = Router();

// Only the brute-force-sensitive auth endpoints (signup/login) get rate
// limited - this must be applied per-route, not as a blanket app.use('/',
// ...) middleware, since that would match every request in the app.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
  skip: () => process.env.NODE_ENV === "test",
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

router.post("/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { email, password, name } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const id = generateId();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`
  ).run(id, email, passwordHash, name ?? null);

  // Signup succeeds and logs the user in immediately regardless of email
  // verification - verification only marks the account as trusted, it
  // never blocks initial access (see /verify-email/* below).
  const verificationCode = generateVerificationCode();
  db.prepare(
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`
  ).run(generateId(), id, hashVerificationCode(verificationCode), new Date(Date.now() + VERIFICATION_CODE_TTL_MS).toISOString());
  await sendVerificationEmail(email, verificationCode);

  const token = signToken({ userId: id });
  res.status(201).json({ token, user: { id, email, name: name ?? null } });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", authLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { email, password } = parsed.data;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | { id: string; password_hash: string; email: string; name: string | null }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Stateless JWT auth: nothing to invalidate server-side for MVP.
// Client is responsible for discarding the token.
router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

const RESET_CODE_TTL_MS = 60 * 60 * 1000; // 1 hour, single-use
const VERIFICATION_CODE_TTL_MS = 60 * 60 * 1000; // 1 hour, single-use

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// POST /forgot-password - always responds with the same generic message,
// regardless of whether the email is registered, to avoid leaking account
// existence. Issues a single-use, 1-hour code and emails it when the
// account does exist.
router.post("/forgot-password", authLimiter, async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const genericResponse = {
    message: "If an account exists for that email, we've sent a password reset code.",
  };

  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(parsed.data.email) as
    | { id: string }
    | undefined;
  if (!user) {
    return res.json(genericResponse);
  }

  // Older unused codes for this user become invalid the moment a new one
  // is requested - only the most recently requested code should ever work.
  db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL").run(user.id);

  const code = generateVerificationCode();
  db.prepare(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`
  ).run(generateId(), user.id, hashVerificationCode(code), new Date(Date.now() + RESET_CODE_TTL_MS).toISOString());

  await sendPasswordResetEmail(parsed.data.email, code);

  res.json(genericResponse);
});

const resetPasswordSchema = z.object({
  code: z.string().min(1),
  newPassword: z.string().min(8),
});

// POST /reset-password - validates the code (hashed lookup, unused,
// unexpired), updates the password, and marks the code used so it can't
// be replayed.
router.post("/reset-password", authLimiter, (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const tokenHash = hashVerificationCode(normalizeVerificationCode(parsed.data.code));
  const row = db
    .prepare(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`
    )
    .get(tokenHash) as { id: string; user_id: string } | undefined;

  if (!row) {
    return res.status(400).json({ error: "This reset code is invalid or has expired." });
  }

  const passwordHash = bcrypt.hashSync(parsed.data.newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, row.user_id);
  db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?").run(row.id);

  res.json({ success: true });
});

export default router;
