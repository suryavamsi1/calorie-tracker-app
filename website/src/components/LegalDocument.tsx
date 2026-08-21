import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  number: number;
  title: string;
  content: ReactNode;
  highlight?: boolean;
}

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalDocument({ title, lastUpdated, intro, sections }: LegalDocumentProps) {
  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1200px] mx-auto px-grid-gutter w-full py-section-gap-md">
        <div className="max-w-3xl mb-16">
          <h1 className="text-display-hero text-on-surface mb-6 relative inline-block">
            {title}
            <span className="absolute -bottom-2 left-0 w-1/3 h-2 bg-primary rounded-full" />
          </h1>
          <p className="text-body-xl text-on-surface-variant">Last updated: {lastUpdated}</p>
          <p className="text-body-md text-on-surface-variant mt-4">{intro}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-section-gap-md relative">
          <aside className="hidden md:block w-64 shrink-0 relative">
            <nav className="sticky top-32 space-y-4">
              <h3 className="text-label-caps text-on-surface uppercase mb-6 tracking-wider">Contents</h3>
              <ul className="space-y-3 text-body-md">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      className="text-on-surface hover:text-primary transition-colors flex items-center gap-2"
                      href={`#${section.id}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-surface-dim" /> {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="flex-1 max-w-3xl space-y-16 bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-xl">
            {sections.map((section) =>
              section.highlight ? (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-32 bg-error-container p-6 rounded-xl relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-error text-on-error text-headline-md shadow-sm">
                        {section.number}
                      </span>
                      <h2 className="text-headline-lg text-on-error-container">{section.title}</h2>
                    </div>
                    <div className="text-on-error-container text-body-md space-y-4">{section.content}</div>
                  </div>
                </section>
              ) : (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-container text-on-primary-container text-headline-md shadow-sm">
                      {section.number}
                    </span>
                    <h2 className="text-headline-lg text-on-surface">{section.title}</h2>
                  </div>
                  <div className="text-on-surface-variant text-body-md space-y-4">{section.content}</div>
                </section>
              )
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-2 flex mt-section-gap-md" aria-hidden="true">
        <div className="flex-1 bg-primary" />
        <div className="flex-1 bg-carbs-amber" />
        <div className="flex-1 bg-protein-coral" />
        <div className="flex-1 bg-fats-indigo" />
      </div>
    </div>
  );
}
