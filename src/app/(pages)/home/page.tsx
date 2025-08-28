// app/(pages)/home/page.tsx

import { HeroSection } from "@/components/HeroSection";
import PortfolioSection from "@/components/PortfolioSection"; // COMBINED (Portfolio + Popular)
import TestimoniesAbout from "@/components/TestimoniesAbout";
import Hexagon from "@/components/Hexagon";
// WP data removed; adjust or remove category usage if present.

export default async function HomeCmsPage() {
  const categories = await getProductCategories();

  return (
    <div className="w-full space-y-0">
      {/* 1) Hero */}
      <HeroSection categories={categories} />

      {/* 2) Combined: Portfolio (ends at Blue=100%) → Popular (gather + zoom) */}
      <PortfolioSection />

      {/* 3) Next stages */}
      <TestimoniesAbout />

      {/* 4) Hexagon section */}
      <Hexagon />
    </div>
  );
}
