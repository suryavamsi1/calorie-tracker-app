"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "How do I sync my wearable device?",
    answer:
      "Navigate to the 'Devices' tab in your profile settings. Ensure Bluetooth is enabled on your smartphone, and select 'Add New Device'. Follow the on-screen prompts for Apple Health, Google Fit, or your specific hardware manufacturer.",
  },
  {
    question: "Can I export my macronutrient data?",
    answer:
      "Yes. Visit the history section of the app and use the day-detail view to review your logged entries. CSV export for longer date ranges is on our roadmap.",
  },
  {
    question: "What happens if I forget to log a meal?",
    answer:
      "Don't worry — you can edit or backdate entries from the history screen. Simply pick the date, add your meals, and your daily totals recalculate automatically.",
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
