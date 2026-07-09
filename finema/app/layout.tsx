import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { SiteFooter } from "@/components/layout/SiteFooter";
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
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <GlobalSearch />
      </body>
    </html>
  );
}
