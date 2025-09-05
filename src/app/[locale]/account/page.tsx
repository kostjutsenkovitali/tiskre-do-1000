// Localized account route wrapper: renders the shared Account page at /[locale]/account
import Account from "@/app/(pages)/account/page";
import { Suspense } from "react";

export default function LocalizedAccountPage() {
  return (
    <Suspense fallback={<div />}>
      <Account />
    </Suspense>
  );
}