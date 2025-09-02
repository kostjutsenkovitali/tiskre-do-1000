// Localized instructions route wrapper: renders the shared Instructions page at /[locale]/instructions
import Instructions from "@/app/(pages)/instructions/page";
import { Suspense } from "react";

export default function LocalizedInstructionsPage() {
  return (
    <Suspense fallback={<div />}> 
      <Instructions />
    </Suspense>
  );
}