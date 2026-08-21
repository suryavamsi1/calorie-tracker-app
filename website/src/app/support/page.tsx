import type { Metadata } from "next";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with BiteLog — FAQs, documentation, and a direct line to our team.",
};

export default function SupportPage() {
  return (
    <div className="flex flex-col w-full relative overflow-hidden">
      {/* Header Section */}
      <section className="w-full max-w-[1200px] mx-auto px-grid-gutter pt-section-gap-md pb-section-gap-md relative z-10 flex flex-col md:flex-row gap-grid-gutter items-center justify-between">
        <div className="w-full md:w-1/2 flex flex-col gap-element-gap">
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-primary rounded-full" />
            <span className="text-label-caps text-primary uppercase tracking-widest">Support Center</span>
          </div>
          <h1 className="text-display-hero text-on-background max-w-2xl">
            We&apos;re here
            <br />
            to help.
          </h1>
          <p className="text-body-xl text-on-surface-variant max-w-xl mt-4">
            Whether you need help with syncing, interpreting your data, or your account, our team is ready to guide
            you.
          </p>
        </div>
        <div className="w-full md:w-5/12 relative">
          <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl shadow-on-surface-dark/10">
            <img
              className="w-full h-full object-cover"
              alt="A diverse team of smiling customer support specialists wearing headsets in a bright, modern office."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBemMsSxv6Zzh1KkvS83xD1KdSmH3_xFRZ-UbgaB8HNzxGDrpyRj-NNFyPpwUyBCD-3U4eyQZBsgBiwLJ3aCUQn_9sn54HLEm6BEEvlCQ6i-hhyKD3T7gdQtCh5B_GY9hxmaXa0TTtLzqWi03Pkux4adrt0_evYQrFwWBBdgNiSI2p8AENrP-ShliZP3AmJQqdXwplADlh4Z7f-ThCGl9W-ZNV3OEBEUWRH8K8dUPpc4fv5Sb7VGAJv6A"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-surface p-4 rounded-xl shadow-lg flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                speed
              </span>
            </div>
            <div>
              <p className="text-label-caps text-on-surface-variant uppercase">Response Time</p>
              <p className="text-headline-md text-on-surface">Under 2 business days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: FAQ + Contact Form */}
      <section className="w-full max-w-[1200px] mx-auto px-grid-gutter pb-section-gap-lg relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid-gutter">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div>
              <h2 className="text-headline-lg text-on-background mb-2">Frequently Asked Questions</h2>
              <p className="text-body-md text-on-surface-variant">Quick answers to our most common inquiries.</p>
            </div>
            <FaqAccordion />
          </div>
          <div className="lg:col-span-5 relative mt-12 lg:mt-0">
            <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-xl shadow-on-surface-dark/10 flex flex-col gap-6">
              <div>
                <h3 className="text-headline-md text-on-surface">Send a Message</h3>
                <p className="text-body-md text-on-surface-variant mt-2">
                  Fill out the form below and we&apos;ll get back to you shortly.
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
