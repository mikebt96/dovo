import type { Metadata, Viewport } from "next";
import { Syne, Space_Mono, Newsreader } from "next/font/google";
import "./globals.css";

/**
 * Self-host de fuentes vía next/font.
 * - Cero requests externos en runtime (todas las fuentes salen del mismo origen).
 * - `display: 'swap'` evita FOIT; texto visible al instante con fuente del sistema
 *   y se sustituye al cargar la real.
 * - Cada peso/ital declarado se prepara como subset latin para reducir bytes.
 * - Las CSS vars se inyectan en <html>; globals.css consume `var(--font-display)`.
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
  weight: ["500", "700"],
  style: ["italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dovo · carnet de dúo",
  description:
    "dovo · disciplina compartida a dos tintas para parejas, amigos y novios",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  themeColor: "#0e0d11",
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
      <body>{children}</body>
    </html>
  );
}
