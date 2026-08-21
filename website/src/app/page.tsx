import type { Metadata } from "next";
import { TrackingBar } from "@/components/TrackingBar";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "BiteLog — Master Your Nutrition",
  description:
    "Effortless calorie and macro tracking meets data-driven precision. Achieve your health goals with intelligent insights and unwavering consistency.",
};

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-section-gap-md pb-section-gap-lg px-grid-gutter max-w-[1200px] mx-auto w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-grid-gutter items-center">
          <div className="md:col-span-6 flex flex-col gap-6 z-10">
            <h1 className="text-display-hero text-on-surface">
              Master Your Nutrition with{" "}
              <span className="text-primary relative inline-block">
                BiteLog
                <span className="absolute bottom-0 left-0 w-full h-[8px] bg-primary-fixed-dim/30 rounded-full -z-10 translate-y-1" />
              </span>
            </h1>
            <p className="text-body-xl text-on-surface-variant max-w-[480px]">
              Effortless tracking meets data-driven precision. Achieve your health goals with intelligent insights and
              unwavering consistency.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <a
                href="#waitlist"
                className="bg-primary text-on-primary text-button-text px-8 py-4 rounded-full shadow-[0_4px_16px_rgba(0,110,47,0.2)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,110,47,0.3)] transition-all duration-300"
              >
                Join the Waitlist
              </a>
              <a
                href="#features"
                className="bg-transparent text-secondary text-button-text px-8 py-4 rounded-full shadow-[inset_0_0_0_2px_#085ac0] hover:bg-secondary/5 transition-all duration-300 flex items-center gap-2"
              >
                Explore Features
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="flex items-center gap-3 mt-8 opacity-80">
              <p className="text-body-md text-sm text-on-surface-variant">
                Built on the Mifflin-St Jeor equation, with real-time macro tracking.
              </p>
            </div>
          </div>
          <div className="md:col-span-6 relative z-0 h-[600px] w-full rounded-[40px] overflow-hidden shadow-xl transform md:translate-x-8">
            <img
              className="w-full h-full object-cover"
              alt="An athletic young woman in a sunlit kitchen preparing a healthy salad."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgLddu3UMSPN69GjJ3KjP5c2p6_BnHalBoDErvQ_dj-HAw06moxG1ACdV2Gq_ImFcYgjt3a4_1B3xY4gT1jrAJao_AJrs-XUqpuvmKjFu7afvoBe5PGbbtlXyquTW_sVKWDBj95f5lf2l8_JEPF5nR6ZCz1Ao-HSg7UvsFetN57Y3fLl6fohFTLBwKaqGDLweUlJNd__sMRWh0W2gEmIHHoSGhnp5eij8Gx8KSwofSzctcOWNRwbk5tQ"
            />
            <div className="absolute bottom-8 -left-8 bg-surface-container-lowest p-4 rounded-2xl shadow-[0_12px_32px_rgba(11,28,48,0.1)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  monitor_weight
                </span>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">Goal Reached</p>
                <p className="text-headline-md text-on-surface">Target Macro Hit</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrackingBar />

      {/* Features Grid */}
      <section id="features" className="py-section-gap-lg px-grid-gutter max-w-[1200px] mx-auto w-full scroll-mt-24">
        <div className="text-center max-w-[600px] mx-auto mb-16">
          <span className="text-label-caps text-primary uppercase tracking-widest mb-4 block">Core Capabilities</span>
          <h2 className="text-headline-lg text-on-surface">Designed for Frictionless Tracking</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "search_insights",
              title: "Smart Search",
              body: "Instantly find foods from a curated database plus a live USDA-backed catalog. Your recent and favorite foods rise to the top automatically.",
            },
            {
              icon: "balance",
              title: "Macro Consistency",
              body: "Set precise targets for protein, carbs, and fats. Intuitive progress bars turn complex nutritional balancing into a simple, visual daily habit.",
            },
            {
              icon: "monitoring",
              title: "Visual Insights",
              body: "Watch your history unfold with per-day totals, trends, and a day-detail view that reveals the relationship between intake and progress.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-surface-container-lowest p-8 rounded-[32px] shadow-[0_12px_32px_rgba(11,28,48,0.05)] hover:-translate-y-2 transition-transform duration-300 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-3xl group-hover:text-on-primary transition-colors duration-300">
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">{feature.title}</h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section id="insights" className="bg-surface-container-low py-section-gap-lg scroll-mt-24">
        <div className="max-w-[1200px] mx-auto px-grid-gutter grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative w-full aspect-square md:aspect-auto md:h-[600px] rounded-[40px] overflow-hidden shadow-lg">
            <img
              className="w-full h-full object-cover"
              alt="A modern smartphone displaying a sleek health data dashboard."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSW2R2SBcwfNAmIheoU7LGkq4HfDWizXpHNJDx8SKqqgBpEdTrFW_i8t4f8PZpEI2WkUqjj9LMrOTYHGjxq-URv4Fe0o6--aY2xALbRaQrYnOAzZ20Yw1y3e069sNZfKSwhLDE4TlrQf6xBN9o-Qz4s92io6VX4s4ojl9WB-E-yQ3XuJFiYOfMXImvSb8u86aNJeq_IPm1GdEGGz_RCWhCzmBuo__xDQaCIJWd2Qts7kzn1qt2OV1apg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface-dark/60 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex text-carbs-amber mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                ))}
              </div>
              <p className="text-headline-md text-on-tertiary italic">
                &quot;BiteLog transformed my prep. The accuracy is unmatched.&quot;
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-body-md text-sm text-on-tertiary/80">Marcus J., Fitness Coach</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <span className="text-label-caps text-secondary uppercase tracking-widest block">Why Choose BiteLog</span>
            <h2 className="text-headline-lg text-on-surface">Clinical Precision for Everyday Use</h2>
            <p className="text-body-xl text-on-surface-variant">
              We don&apos;t guess your needs. BiteLog uses the <strong>Mifflin-St Jeor equation</strong> — the clinical
              gold standard for calculating Basal Metabolic Rate — so your caloric targets are grounded in proven
              nutritional science.
            </p>
            <ul className="flex flex-col gap-4 mt-4">
              <li className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                <div>
                  <strong className="text-button-text text-on-surface block">Science-Backed Baselines</strong>
                  <span className="text-body-md text-on-surface-variant text-sm">
                    Targets tailored to your exact physiology.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                <div>
                  <strong className="text-button-text text-on-surface block">Dynamic Adjustments</strong>
                  <span className="text-body-md text-on-surface-variant text-sm">
                    Goals that adapt as your body composition changes.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section id="download" className="py-section-gap-lg px-grid-gutter max-w-[1200px] mx-auto w-full relative overflow-hidden scroll-mt-24">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-surface-container-low rounded-l-full -z-10 translate-x-1/4 opacity-50" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <span className="text-label-caps text-tertiary uppercase tracking-widest block">Coming Soon</span>
            <h2 className="text-headline-lg text-on-surface">The BiteLog Mobile Experience</h2>
            <p className="text-body-xl text-on-surface-variant">
              Take your nutrition everywhere. BiteLog is in active testing today, bringing seamless offline sync,
              smart food search, and real-time macro tracking to your pocket.
            </p>
            <div className="flex items-center gap-4 mt-8 opacity-50 grayscale pointer-events-none">
              <div className="h-12 w-[140px] bg-inverse-surface rounded-lg flex items-center justify-center">
                <span className="text-inverse-on-surface text-xs">App Store</span>
              </div>
              <div className="h-12 w-[140px] bg-inverse-surface rounded-lg flex items-center justify-center">
                <span className="text-inverse-on-surface text-xs">Google Play</span>
              </div>
            </div>
            <p className="text-body-md text-sm text-on-surface-variant mt-2 italic">Public launch coming soon.</p>
          </div>
          <div className="relative flex justify-center">
            <div
              className="relative w-[300px] h-[600px] bg-surface rounded-[48px] overflow-hidden rotate-[-5deg] transform origin-bottom-right transition-transform hover:rotate-0 duration-500"
              style={{ boxShadow: "0 24px 64px rgba(11,28,48,0.15), inset 0 0 0 8px #191c20" }}
            >
              <img
                className="w-full h-full object-cover"
                alt="BiteLog mobile app dashboard mockup"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfxuJBa7P4GaD4YvXZIvuFcmWSKfJtjdmV3Rc-fXF5FPneqA3Fz-HNofVbTNmH_YkwjcM0o9ZqMPpkLWXzmhYUj98h4c4glPhTvEIueganVE2ZkPEJdGbO9v0IFW67Ha8z9aKRIUlz3tJmcM060bgNhWCKVt78fUs6bofMiKWjTzJ-x8HXHpt3P5l5N-4mM4A5rQx0HpXeOM--85NNtNl-PUwhPDQQzZoN5b3Fd-3cwaJwbDibu6K9Lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section id="waitlist" className="bg-primary text-on-primary py-section-gap-lg px-grid-gutter relative overflow-hidden text-center scroll-mt-24">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />
        <div className="relative z-10 max-w-[800px] mx-auto flex flex-col items-center gap-8">
          <h2 className="text-headline-lg md:text-display-hero text-on-primary">Ready to Optimize Your Health?</h2>
          <p className="text-body-xl text-on-primary/80 max-w-[600px]">
            Join the waitlist today to be first in line when BiteLog launches publicly.
          </p>
          <WaitlistForm />
          <p className="text-xs text-on-primary/60 mt-2">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}
