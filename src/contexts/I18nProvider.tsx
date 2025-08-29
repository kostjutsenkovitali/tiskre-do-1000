"use client";
import { createContext, useContext, type ReactNode } from "react";

export type Messages = Record<string, any>;

type I18nValue = {
  locale: string;
  messages: Messages;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: string; messages: Messages; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return { locale: "en", t: (k: string, _p?: Record<string, any>) => k };
  const { locale, messages } = ctx;
  const t = (key: string, params?: Record<string, any>) => {
    const path = key.split(".");
    let node: any = messages;
    for (const p of path) {
      node = node?.[p];
      if (node == null) return key;
    }
    let s = typeof node === "string" ? node : String(node);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.replace(new RegExp(`{${k}}`, "g"), String(v));
      }
    }
    return s;
  };
  return { locale, t };
}

export function formatPrice(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}


