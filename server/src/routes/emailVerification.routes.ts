import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db";
import { generateId } from "../utils/id";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { sendVerificationEmail } from "../services/emailClient";
import { generateVerificationCode, hashVerificationCode, normalizeVerificationCode } from "../utils/verificationCode";

const router = Router();

const VERIFICATION_CODE_TTL_MS = 60 * 60 * 1000; // 1 hour, single-use

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification emails requested. Please try again later." },
  skip: () => process.env.NODE_ENV === "test",
});

const confirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
  skip: () => process.env.NODE_ENV === "test",
});

// POST /verify-email/resend - authenticated; issues a fresh single-use code
// for the current user (invalidating any older unused one) and emails it.
// No-ops with a friendly message if the account is already verified.
router.post("/resend", requireAuth, resendLimiter, async (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT email, email_verified_at FROM users WHERE id = ?").get(req.userId) as
    | { email: string; email_verified_at: string | null }
    | undefined;
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.email_verified_at) {
    return res.json({ message: "Your email is already verified." });
  }

  db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ? AND used_at IS NULL").run(req.userId);

  const code = generateVerificationCode();
  db.prepare(
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`
  ).run(generateId(), req.userId, hashVerificationCode(code), new Date(Date.now() + VERIFICATION_CODE_TTL_MS).toISOString());

  await sendVerificationEmail(user.email, code);

  res.json({ message: "Verification code sent." });
});

const confirmSchema = z.object({
  code: z.string().min(1),
});

// POST /verify-email/confirm - public (matches purely by code hash, same
// pattern as password reset - no auth required since the code itself
// proves ownership). Marks the account verified and the code single-use.
router.post("/confirm", confirmLimiter, (req, res) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const tokenHash = hashVerificationCode(normalizeVerificationCode(parsed.data.code));
  const row = db
    .prepare(
      `SELECT id, user_id FROM email_verification_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`
    )
    .get(tokenHash) as { id: string; user_id: string } | undefined;

  if (!row) {
    return res.status(400).json({ error: "This verification code is invalid or has expired." });
  }

  db.prepare("UPDATE users SET email_verified_at = datetime('now') WHERE id = ?").run(row.user_id);
  db.prepare("UPDATE email_verification_tokens SET used_at = datetime('now') WHERE id = ?").run(row.id);

  res.json({ success: true });
});

export default router;
