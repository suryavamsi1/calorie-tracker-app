import { env } from "../env";

const RESEND_URL = "https://api.resend.com/emails";

/**
 * Sends a password-reset code by email via Resend. Degrades gracefully
 * without a configured API key (logs the code instead) so the forgot-
 * password flow is fully testable locally without a real email provider -
 * production deployments must set RESEND_API_KEY for it to actually send.
 */
export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email disabled] Password reset code for ${to}: ${code}`);
    return;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to,
        subject: "Reset your BiteLog password",
        text: `Your BiteLog password reset code is: ${code}\n\nEnter this code in the app to set a new password. It expires in 1 hour and can only be used once.\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `<p>Your BiteLog password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>Enter this code in the app to set a new password. It expires in 1 hour and can only be used once.</p><p>If you didn't request this, you can safely ignore this email.</p>`,
      }),
    });
    if (!response.ok) {
      console.error(`Failed to send password reset email: ${response.status} ${await response.text()}`);
    }
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }
  // Errors are logged but not thrown - the /forgot-password route must
  // always return its generic response regardless of email delivery
  // success, both to avoid leaking account existence and to not fail the
  // request on a 3rd-party provider outage.
}
