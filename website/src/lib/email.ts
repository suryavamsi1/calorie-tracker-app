const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs to the server console so nothing is lost. */
export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey) {
    console.log(`[email disabled] To: ${to} | Subject: ${subject}\n${text}`);
    return;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text, html, reply_to: replyTo }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email delivery failed] To: ${to} | Subject: ${subject} | Status: ${res.status} ${body}`);
    }
  } catch (err) {
    console.error(`[email delivery failed] To: ${to} | Subject: ${subject}`, err);
  }
}
