import { env } from "../env";

const RESEND_URL = "https://api.resend.com/emails";

interface CodeEmailContent {
  subject: string;
  text: string;
  html: string;
  logLabel: string;
}

/**
 * Shared send path for any transactional "here's a code" email (password
 * reset, email verification, ...) via Resend. Degrades gracefully without a
 * configured API key, or if Resend itself rejects/errors (e.g. its sandbox
 * sender refusing a recipient outside your own account) - always falls back
 * to logging the code server-side instead of throwing, so callers never
 * have to treat email delivery as something that can fail their request.
 */
async function sendCodeEmail(to: string, code: string, content: CodeEmailContent): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email disabled] ${content.logLabel} for ${to}: ${code}`);
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
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    });
    if (!response.ok) {
      console.error(
        `Failed to send ${content.logLabel.toLowerCase()} email (falling back to logging the code): ${response.status} ${await response.text()}`
      );
      console.log(`[email delivery failed] ${content.logLabel} for ${to}: ${code}`);
    }
  } catch (err) {
    console.error(`Failed to send ${content.logLabel.toLowerCase()} email (falling back to logging the code):`, err);
    console.log(`[email delivery failed] ${content.logLabel} for ${to}: ${code}`);
  }
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  await sendCodeEmail(to, code, {
    logLabel: "Password reset code",
    subject: "Reset your BiteLog password",
    text: `Your BiteLog password reset code is: ${code}\n\nEnter this code in the app to set a new password. It expires in 1 hour and can only be used once.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `<p>Your BiteLog password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>Enter this code in the app to set a new password. It expires in 1 hour and can only be used once.</p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  await sendCodeEmail(to, code, {
    logLabel: "Email verification code",
    subject: "Verify your BiteLog email",
    text: `Your BiteLog email verification code is: ${code}\n\nEnter this code in the app to verify your email. It expires in 1 hour and can only be used once.\n\nIf you didn't create a BiteLog account, you can safely ignore this email.`,
    html: `<p>Your BiteLog email verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>Enter this code in the app to verify your email. It expires in 1 hour and can only be used once.</p><p>If you didn't create a BiteLog account, you can safely ignore this email.</p>`,
  });
}
