import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  topic: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill out all fields with a valid email address." }, { status: 400 });
  }

  const { name, email, topic, message } = parsed.data;
  const to = process.env.CONTACT_TO_EMAIL ?? "support@bitelog.app";

  await sendEmail({
    to,
    replyTo: email,
    subject: `[BiteLog Support] ${topic} — ${name}`,
    text: `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}`,
    html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Topic:</strong> ${topic}</p><p>${message.replace(/\n/g, "<br/>")}</p>`,
  });

  return NextResponse.json({ ok: true });
}
