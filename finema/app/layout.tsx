import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { IntroGate } from "@/components/intro/IntroGate";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { SiteFooterGate } from "@/components/layout/SiteFooterGate";
import { MusicPlayerShell } from "@/components/songs/MusicPlayerShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finema",
  description: "Stream movies with cinematic quality",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-finema-bg text-finema-text"
      >
        <IntroGate>
          <MusicPlayerShell>
            <div className="flex-1">{children}</div>
            <SiteFooterGate />
          </MusicPlayerShell>
          <GlobalSearch />
        </IntroGate>
      </body>
    </html>
  );
}
