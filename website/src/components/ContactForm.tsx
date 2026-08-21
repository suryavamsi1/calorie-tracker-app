"use client";

import { useState, type FormEvent } from "react";

const TOPICS = ["Account Issue", "Billing Inquiry", "Feature Request", "Bug Report", "Other"];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      topic: data.get("topic"),
      message: data.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1 relative">
        <label className="text-label-caps text-on-surface-variant uppercase ml-2" htmlFor="name">
          Full Name
        </label>
        <input
          className="w-full bg-surface-bright px-4 py-3 rounded-xl border border-surface-container-highest focus:border-secondary focus:outline-none transition-colors text-on-surface"
          id="name"
          name="name"
          placeholder="Jane Doe"
          required
          type="text"
        />
      </div>
      <div className="flex flex-col gap-1 relative">
        <label className="text-label-caps text-on-surface-variant uppercase ml-2" htmlFor="email">
          Email Address
        </label>
        <input
          className="w-full bg-surface-bright px-4 py-3 rounded-xl border border-surface-container-highest focus:border-secondary focus:outline-none transition-colors text-on-surface"
          id="email"
          name="email"
          placeholder="jane@example.com"
          required
          type="email"
        />
      </div>
      <div className="flex flex-col gap-1 relative">
        <label className="text-label-caps text-on-surface-variant uppercase ml-2" htmlFor="topic">
          Topic
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none bg-surface-bright px-4 py-3 rounded-xl border border-surface-container-highest focus:border-secondary focus:outline-none transition-colors text-on-surface pr-10"
            id="topic"
            name="topic"
            defaultValue={TOPICS[0]}
          >
            {TOPICS.map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            arrow_drop_down
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 relative">
        <label className="text-label-caps text-on-surface-variant uppercase ml-2" htmlFor="message">
          Message
        </label>
        <textarea
          className="w-full bg-surface-bright px-4 py-3 rounded-xl border border-surface-container-highest focus:border-secondary focus:outline-none transition-colors text-on-surface resize-none"
          id="message"
          name="message"
          placeholder="How can we help you today?"
          required
          rows={4}
        />
      </div>
      <button
        className="w-full mt-2 bg-primary hover:bg-primary-fixed-dim text-on-primary text-button-text py-4 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
        type="submit"
        disabled={status === "submitting"}
      >
        <span>{status === "submitting" ? "Sending…" : "Send Message"}</span>
        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
      </button>
      {status === "success" ? (
        <div className="mt-4 p-4 rounded-xl bg-primary-container/20 text-on-primary-container flex items-start gap-3">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <div>
            <p className="text-button-text text-sm mb-1">Message Sent Successfully</p>
            <p className="text-xs">We&apos;ve received your inquiry and will respond to your email address shortly.</p>
          </div>
        </div>
      ) : null}
      {status === "error" && error ? (
        <div className="mt-4 p-4 rounded-xl bg-error-container text-on-error-container flex items-start gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="text-sm">{error}</p>
        </div>
      ) : null}
    </form>
  );
}
