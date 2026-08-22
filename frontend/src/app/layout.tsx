import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "ThreatPulse — The 60-Second Breach",
  description:
    "Real-time threat detection, prioritization and explainable security intelligence within 60 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const fontVars = {
    ["--font-sans"]: "var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif",
    ["--font-mono"]: "var(--font-plex-mono), ui-monospace, monospace",
    ["--font-display"]: "var(--font-space), ui-sans-serif, system-ui, sans-serif",
  } as CSSProperties;

  return (
    <html lang="en">
      <body
        className={`${plexSans.variable} ${plexMono.variable} ${spaceGrotesk.variable} antialiased`}
        style={fontVars}
      >
        {children}
      </body>
    </html>
  );
}
