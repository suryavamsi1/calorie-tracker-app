import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const waitlistSchema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const { email } = parsed.data;
  const to = process.env.WAITLIST_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL ?? "support@bitelog.app";

  await sendEmail({
    to,
    subject: "New BiteLog waitlist signup",
    text: `${email} joined the BiteLog waitlist.`,
    html: `<p><strong>${email}</strong> joined the BiteLog waitlist.</p>`,
  });

  return NextResponse.json({ ok: true });
}
