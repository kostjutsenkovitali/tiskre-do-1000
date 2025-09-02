"use client";

import { useI18n } from "@/contexts/I18nProvider";

export default function ViewProductText() {
  const { t } = useI18n();
  return <span>{t("Instructions.viewProduct")}</span>;
}