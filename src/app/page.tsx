import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/i18n/config";

// Make this page statically generated
export const dynamic = 'force-static';

export default function Home() {
  redirect(`/${DEFAULT_LOCALE}`);
}