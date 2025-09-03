"use client";

import { Suspense } from "react";
import Hexagon from "@/components/Hexagon";

// Use the same Slide type as defined in HexagonWithPosts.tsx for consistency
type Slide = {
  id: string | number;
  title: string;
  quote: string;
  imageUrl: string;
  url: string;
};

// This component wraps the client-side Hexagon component for use in server components
export default function HexagonServerWrapper({ initialSlides }: { initialSlides: Slide[] }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading hexagon...</div>}>
      <Hexagon initialSlides={initialSlides} />
    </Suspense>
  );
}