import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PracticeFlow — Learn by Doing",
  description:
    "A distraction-free video learning app that auto-pauses at smart intervals so you can practice what you learn. Supports Normal, Strict, and Always Strict modes.",
  keywords: ["video player", "learning", "practice", "study tool", "auto-pause"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
