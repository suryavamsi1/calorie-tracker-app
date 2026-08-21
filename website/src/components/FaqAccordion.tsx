"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "Does BiteLog work without an internet connection?",
    answer:
      "Yes. Logging, editing, and deleting food entries all work offline — your changes are queued on your device and sync automatically as soon as you're back online, with a banner showing anything still pending or failed.",
  },
  {
    question: "Do I need to verify my email address to use the app?",
    answer:
      "No — verification is optional and never blocks signup or login. We'll email you a code on signup, and a banner on your profile lets you verify (or resend the code) whenever you're ready.",
  },
  {
    question: "Can I edit or delete a food entry after logging it?",
    answer:
      "Yes. Tap any logged entry to change the quantity, meal, or the food itself, or swipe to delete it. Totals for the day recalculate automatically.",
  },
  {
    question: "How is my personal health data protected?",
    answer:
      "Your password is hashed, sessions use signed tokens, and all traffic runs over HTTPS. We never sell your personal data to third parties. See our Privacy Policy for full details.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4 w-full">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.question}
            className="bg-surface-container-lowest rounded-xl shadow-md shadow-on-surface-dark/5 overflow-hidden transition-all duration-300"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
            >
              <span className="text-headline-md text-on-surface text-lg">{faq.question}</span>
              <span
                className="material-symbols-outlined text-primary transition-transform duration-300"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                expand_more
              </span>
            </button>
            {isOpen ? (
              <div className="px-6 pb-6 pt-0">
                <p className="text-body-md text-on-surface-variant">{faq.answer}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
