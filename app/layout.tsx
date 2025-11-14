import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LenisScroll from "./LenisScroll";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voixly - AI Voice Call Agent",
  description: "Deliver natural, compliant, and productive customer conversations at scale with AI-powered voice calling.",
  keywords: ["AI voice calls", "automated calling", "customer conversations", "AI agent", "voice AI"],
  authors: [{ name: "Voixly" }],
  openGraph: {
    title: "Voixly - AI Voice Call Agent",
    description: "Deliver natural, compliant, and productive customer conversations at scale.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voixly - AI Voice Call Agent",
    description: "Deliver natural, compliant, and productive customer conversations at scale.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrains.variable} antialiased`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster />
        <LenisScroll />
      </body>
    </html>
  );
}
