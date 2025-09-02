// Localized about route wrapper: renders the shared About page at /[locale]/about
import About from "@/app/(pages)/about/page";
import { Suspense } from "react";

export default function LocalizedAboutPage() {
  return (
    <Suspense fallback={<div />}> 
      <About />
    </Suspense>
  );
}