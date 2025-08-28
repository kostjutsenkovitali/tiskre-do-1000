"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { CountryCode, LanguageCode } from "@/i18n/config";

export type LanguageValue = { country: CountryCode; language: LanguageCode } | null;

export const LanguageContext = createContext<LanguageValue>(null);

export function useLanguage(): LanguageValue {
  return useContext(LanguageContext);
}

export function LanguageProvider({ value, children }: { value: NonNullable<LanguageValue>; children: ReactNode }) {
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}


