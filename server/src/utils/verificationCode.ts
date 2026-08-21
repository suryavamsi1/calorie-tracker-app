import { createHash, randomBytes } from "crypto";

// 10 uppercase hex chars (40 bits of entropy) - short enough to type/paste
// by hand (no working deep-link/hosted page for these flows yet), long-
// lived and rate-limited enough to be reasonably resistant to guessing for
// an MVP. Shared shape for both password-reset and email-verification codes.
export function generateVerificationCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

export function hashVerificationCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function normalizeVerificationCode(code: string): string {
  return code.trim().toUpperCase();
}
