"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nProvider";

export default function InstructionsContent() {
  const { t } = useI18n();
  
  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-3xl font-medium text-foreground mb-6">{t("Instructions.title")}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("Instructions.intro")}
        </p>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground">
          {t("Instructions.contactSupport")} {" "}
          <Link href="/contact" className="underline">
            {t("Instructions.contactSupportLink")}
          </Link>
        </p>
      </div>
    </>
  );
}