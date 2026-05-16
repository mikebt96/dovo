import type { Metadata, Viewport } from "next";
import { Syne, Space_Mono, Newsreader } from "next/font/google";
import BackgroundWrapper from "@/app/components/BackgroundWrapper";
import "./globals.css";

/**
 * Self-host fuentes vía next/font.
 * - Syne: display + body
 * - Space Mono: numerics + labels mono
 * - Newsreader (italic): para momentos literarios cuando se necesite
 */
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-syne",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dovo",
  description: "Disciplina compartida para parejas. Tu plan semanal, sus rachas, sus recompensas reales.",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${syne.variable} ${spaceMono.variable} ${newsreader.variable}`}
    >
      <body>
        <BackgroundWrapper />
        {children}
      </body>
    </html>
  );
}
