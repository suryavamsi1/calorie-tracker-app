import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of the BiteLog app and services.",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    number: 1,
    title: "Acceptance of Terms",
    content: (
      <>
        <p>
          By downloading, accessing, or using the BiteLog application (&quot;App&quot;), website, and associated
          services (collectively, the &quot;Services&quot;), you agree to comply with and be bound by these Terms of
          Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Services.
        </p>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of any material changes by
          posting the updated Terms within the App or via email. Your continued use of the Services after such
          modifications constitutes your acceptance of the revised Terms.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    number: 2,
    title: "Privacy & Data Handling",
    content: (
      <>
        <p>
          Your privacy is paramount to us. Our collection and use of your personal information, including dietary
          habits, health metrics, and account data, are governed by our{" "}
          <Link className="text-primary hover:underline font-bold" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          By using the Services, you consent to the processing of your data as described in the Privacy Policy. We
          employ industry-standard security measures, including hashed passwords and signed session tokens, to
          protect your account.
        </p>
      </>
    ),
  },
  {
    id: "user-conduct",
    number: 3,
    title: "User Conduct & Account Security",
    content: (
      <>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>Provide accurate and complete information when creating an account.</li>
          <li>Use the Services only for lawful purposes.</li>
          <li>Not share your account access with third parties.</li>
          <li>Notify us immediately of any unauthorized use of your account.</li>
        </ul>
        <p className="mt-4">
          We reserve the right to suspend or terminate accounts that violate these guidelines or exhibit suspicious
          activity.
        </p>
      </>
    ),
  },
  {
    id: "medical-disclaimer",
    number: 4,
    title: "Medical Disclaimer",
    highlight: true,
    content: (
      <>
        <p className="font-bold">
          BiteLog is a tracking and informational tool, not a medical device or healthcare provider.
        </p>
        <p>
          The information provided through the Services, including nutritional analysis, calorie/macro targets, and
          suggestions, is for general informational purposes only. It is not intended to be a substitute for
          professional medical advice, diagnosis, or treatment.
        </p>
        <p>
          Always seek the advice of your physician or other qualified health provider with any questions you may
          have regarding a medical condition or dietary restrictions.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    number: 5,
    title: "Accounts & Data Portability",
    content: (
      <>
        <p>
          BiteLog is currently offered free of charge. You may delete your account at any time from the app&apos;s
          profile settings; this permanently removes your profile, entries, and custom foods.
        </p>
        <p>
          If we introduce paid subscription tiers in the future, we will update these Terms and notify you before
          any changes take effect.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    number: 6,
    title: "Termination",
    content: (
      <>
        <p>
          We may terminate or suspend your access to the Services immediately, without prior notice or liability,
          for any reason, including, without limitation, a breach of these Terms.
        </p>
        <p>
          Upon termination, your right to use the Services will cease immediately. If you wish to terminate your
          account, you may simply discontinue using the Services and delete your account via the App settings.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      lastUpdated="August 21, 2026"
      intro="Please read these terms carefully before using the BiteLog platform. By accessing or using our services, you agree to be bound by these terms and all incorporated policies."
      sections={sections}
    />
  );
}
