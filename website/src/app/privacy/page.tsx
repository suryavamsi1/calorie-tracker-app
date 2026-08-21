import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How BiteLog collects, uses, and protects your personal and health data.",
};

const sections: LegalSection[] = [
  {
    id: "overview",
    number: 1,
    title: "Overview",
    content: (
      <>
        <p>
          This Privacy Policy describes how BiteLog (&quot;we&quot;, &quot;us&quot;) collects, uses, and protects
          information when you use the BiteLog application, website, and related services (the &quot;Services&quot;).
        </p>
        <p>
          By using the Services, you agree to the collection and use of information as described here. If you do not
          agree, please do not use the Services.
        </p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    number: 2,
    title: "Information We Collect",
    content: (
      <>
        <p>We collect only what&apos;s needed to provide accurate nutrition tracking:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>
            <strong>Account information:</strong> email address and a securely hashed password (or a name, if you
            provide one).
          </li>
          <li>
            <strong>Health profile:</strong> age, sex, height, weight, activity level, and goal type — used only to
            calculate your suggested daily calorie and macro targets (via the Mifflin-St Jeor equation).
          </li>
          <li>
            <strong>Food logs:</strong> the foods, quantities, meal types, and dates you log, plus any custom foods
            you create.
          </li>
          <li>
            <strong>Basic product analytics:</strong> lightweight, anonymized usage events (e.g. signup, first log)
            used to understand feature adoption — never sold or shared with advertisers.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-data",
    number: 3,
    title: "How We Use Your Data",
    content: (
      <>
        <p>Your data is used exclusively to operate and improve the Services:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>Calculating and displaying your daily calorie and macro targets and progress.</li>
          <li>Powering food search, including live results from third-party nutrition databases (USDA FoodData Central, or Edamam where configured).</li>
          <li>Sending account-related emails: email verification, password reset codes, and support responses.</li>
          <li>Diagnosing bugs and improving reliability.</li>
        </ul>
        <p className="mt-4">
          We do not sell your personal data, and we do not use your health data for advertising.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    number: 4,
    title: "Third-Party Services",
    content: (
      <>
        <p>BiteLog relies on a small number of infrastructure providers to operate:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>
            <strong>USDA FoodData Central / Edamam:</strong> queried live to power food search. Only your search
            term is sent — not your identity or health profile.
          </li>
          <li>
            <strong>Resend:</strong> our transactional email provider, used to deliver verification codes, password
            reset codes, and support replies.
          </li>
          <li>
            <strong>Railway / Render:</strong> our hosting providers, storing your account and food-log data on a
            persistent, access-controlled disk.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "security",
    number: 5,
    title: "Data Security",
    highlight: true,
    content: (
      <>
        <p className="font-bold">We take reasonable, industry-standard measures to protect your data.</p>
        <p>
          Passwords are hashed and never stored in plain text. Sessions use signed, expiring tokens. All traffic
          between the app and our servers is encrypted in transit via HTTPS. That said, no method of transmission or
          storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    number: 6,
    title: "Your Rights & Choices",
    content: (
      <>
        <p>
          You can review and edit your health profile and goals at any time from the app&apos;s profile screen. You
          can permanently delete your account — along with all associated entries and custom foods — from the same
          screen at any time; deletion is immediate and irreversible.
        </p>
        <p className="mt-4">
          For any other data access, correction, or deletion requests, contact us via the{" "}
          <Link className="text-primary hover:underline font-bold" href="/support">
            Support page
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "children",
    number: 7,
    title: "Children's Privacy",
    content: <p>The Services are not directed to children under 13, and we do not knowingly collect their data.</p>,
  },
  {
    id: "changes",
    number: 8,
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. Material changes will be posted here and, where
        appropriate, communicated via email. Continued use of the Services after changes take effect constitutes
        acceptance of the revised policy.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      lastUpdated="August 21, 2026"
      intro="Your privacy matters to us. This policy explains what data BiteLog collects, why, and how it's protected."
      sections={sections}
    />
  );
}
