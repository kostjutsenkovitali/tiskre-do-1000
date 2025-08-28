import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { HeroSection } from "@/components/HeroSection";
import PortfolioSection from "@/components/PortfolioSection";
import TestimoniesAbout from "@/components/TestimoniesAbout";
import Hexagon from "@/components/Hexagon";

type Props = { params: { locale: string } };

export default async function LocaleHome({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return notFound();
  return (
    <div className="w-full space-y-0">
      <HeroSection />
      <PortfolioSection />
      <TestimoniesAbout />
      <Hexagon />
    </div>
  );
}


