"use client";

import { useState, type FormEvent } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p className="text-button-text text-on-primary bg-white/10 px-6 py-4 rounded-full">
        You&apos;re on the list! We&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form className="w-full max-w-[480px] flex flex-col sm:flex-row gap-4 mt-4" onSubmit={handleSubmit}>
      <input
        className="flex-1 px-6 py-4 rounded-full bg-surface-container-lowest text-on-surface border-2 border-transparent focus:outline-none focus:border-secondary transition-colors placeholder:text-on-surface-variant/50"
        placeholder="Enter your email address"
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={status === "submitting"}
      />
      <button
        className="bg-surface-container-lowest text-primary text-button-text px-8 py-4 rounded-full shadow-md hover:bg-surface-bright transition-colors whitespace-nowrap disabled:opacity-60"
        type="submit"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Joining…" : "Join Waitlist"}
      </button>
      {error ? <p className="text-sm text-on-primary/90 sm:absolute sm:mt-16">{error}</p> : null}
    </form>
  );
}
