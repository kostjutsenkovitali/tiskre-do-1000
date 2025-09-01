import type { Metadata } from "next";
import { Geist, Geist_Mono, Fira_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "@/styles/backgrounds.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tiskre-do.eu"),
  title: {
    default: "TISKRE-DO",
    template: "%s | TISKRE-DO",
  },
  description: "Quality products and practical guidance.",
  openGraph: {
    title: "TISKRE-DO",
    description: "Quality products and practical guidance.",
    url: "/",
    siteName: "TISKRE-DO",
    type: "website",
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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${firaSans.variable} antialiased`}
      >
        <Suspense fallback={<div className="h-16" />}>
          <Header />
        </Suspense>
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
