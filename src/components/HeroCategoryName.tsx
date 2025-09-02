// src/components/HeroCategoryName.tsx
"use client";
import { useI18n } from "@/contexts/I18nProvider";

type Props = {
  slug: string;
  defaultName: string;
};

// Mapping from category slugs to translation keys
const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  "corten-products": "Home.categories.cortenProducts",
  "kamado-carts": "Home.categories.kamadoCarts",
  "smokers": "Home.categories.smokers",
  "outdoor-kitchens": "Home.categories.outdoorKitchens",
};

export function HeroCategoryName({ slug, defaultName }: Props) {
  const { t } = useI18n();
  
  // Use translated name if available, otherwise fall back to default name
  const translatedName = CATEGORY_TRANSLATION_KEYS[slug] ? t(CATEGORY_TRANSLATION_KEYS[slug]) : defaultName;
  
  return <>{translatedName}</>;
}