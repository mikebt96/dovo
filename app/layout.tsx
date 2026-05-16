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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: "dovo",
  description:
    "Disciplina compartida en dúo. Tu plan semanal, sus rachas, sus recompensas reales.",
  robots: "noindex, nofollow",
  openGraph: {
    title: "dovo · disciplina compartida",
    description:
      "Plan semanal de dúo. Las rachas se ganan juntos. Los premios son reales — y las consecuencias también.",
    type: "website",
    locale: "es_MX",
  },
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
