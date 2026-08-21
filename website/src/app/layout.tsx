import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bitelog.app"),
  title: {
    default: "BiteLog — Master Your Nutrition",
    template: "%s | BiteLog",
  },
  description:
    "Effortless calorie and macro tracking meets data-driven precision. Achieve your health goals with intelligent insights and unwavering consistency.",
  icons: {
    icon: "/bitelog-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface-canvas text-on-surface">
        <Header />
        <main className="w-full pt-20 flex-1 flex flex-col bg-surface-canvas">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

