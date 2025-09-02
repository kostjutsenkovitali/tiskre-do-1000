// src/components/HeroViewMoreText.tsx
"use client";
import { useI18n } from "@/contexts/I18nProvider";

export function HeroViewMoreText() {
  const { t } = useI18n();
  return <span>{t("Common.viewMore")}</span>;
}