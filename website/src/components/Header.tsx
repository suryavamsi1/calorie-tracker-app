"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#insights", label: "Insights" },
  { href: "/support", label: "Support" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-[1200px] mx-auto px-grid-gutter flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            eco
          </span>
          <span className="text-headline-md text-primary tracking-tight">BiteLog</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/support" && pathname === "/support";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "text-button-text text-primary font-bold transition-colors"
                    : "text-button-text text-on-surface-variant hover:text-primary transition-colors"
                }
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href="#download"
            className="bg-primary text-on-primary px-6 py-2 rounded-full text-button-text hover:bg-primary-fixed-dim transition-all shadow-sm"
          >
            Download App
          </a>
        </nav>
      </div>
    </header>
  );
}
