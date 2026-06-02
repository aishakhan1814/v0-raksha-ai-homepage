// app/layout.tsx
// ── NO "use client" here — server component required for metadata + fonts ──
// The language switcher lives in GlobalHeader (a separate client component)

import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  DM_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// ─── FONTS ────────────────────────────────────────────────────────────────────
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

// ─── METADATA ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title:
    "Raksha AI — Blood Intelligence & Care Coordination for Thalassemia Patients",
  description:
    "Raksha AI connects voluntary blood donors with Thalassemia patients across India through intelligent matching, automated scheduling, and care that never stops.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png",  media: "(prefers-color-scheme: dark)"  },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

// ─── ROOT LAYOUT ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-raksha-deep text-raksha-white">

        {/*
          GlobalHeader renders on EVERY page automatically.
          It contains the logo + the LanguageSwitcher dropdown.
          It's a "use client" component imported here safely.
        */}
        <GlobalHeader />

        {/*
          Every page.tsx in your /app folder renders here.
          The header is always above it.
        */}
        <main>
          {children}
        </main>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}