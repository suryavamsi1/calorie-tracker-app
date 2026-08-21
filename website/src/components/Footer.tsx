import Image from "next/image";
import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    heading: "Company",
    links: [
      { href: "#", label: "About Us" },
      { href: "#", label: "Careers" },
      { href: "#", label: "Blog" },
    ],
  },
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#insights", label: "Insights" },
      { href: "#download", label: "Download" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/support", label: "Support" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-low py-section-gap-md border-t border-outline-variant/30">
      <div className="max-w-[1200px] mx-auto px-grid-gutter grid grid-cols-1 md:grid-cols-4 gap-grid-gutter">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Image src="/bitelog-icon.png" alt="BiteLog" width={24} height={24} className="h-6 w-6" />
            <span className="text-button-text text-primary">BiteLog</span>
          </Link>
          <p className="text-on-surface-variant text-body-md text-sm">Precision tracking for a healthier you.</p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading} className="flex flex-col gap-4">
            <h4 className="text-label-caps text-on-surface uppercase">{column.heading}</h4>
            {column.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-on-surface-variant hover:text-primary text-body-md text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="max-w-[1200px] mx-auto px-grid-gutter mt-12 pt-8 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-on-surface-variant text-sm">© {new Date().getFullYear()} BiteLog Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
