import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isLocale, LOCALES } from "@/i18n/config";
import { HeroSection } from "@/components/HeroSection";
import PortfolioSection from "@/components/PortfolioSection";
import TestimoniesAbout from "@/components/TestimoniesAbout";
import HexagonWithPosts from "@/components/HexagonWithPosts";
import ScrollDownButton from "@/components/ScrollDownButton";
import SpaRouter from "@/components/SpaRouter";

type Props = { params: { locale: string } };

// Generate static params for all locales
export async function generateStaticParams() {
  return LOCALES.map((locale) => ({
    locale,
  }));
}

// Add revalidation for ISR
export const revalidate = 3600; // Revalidate at most every hour

export default async function LocaleHome({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return notFound();
  
  return (
    <div className="w-full space-y-0">
      <Suspense fallback={<div />}>
        <SpaRouter />
      </Suspense>
      <HeroSection />
      <PortfolioSection />
      <TestimoniesAbout />
      <HexagonWithPosts locale={locale} />
      <ScrollDownButton scope="home" />
    </div>
  );
}