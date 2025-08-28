import type { NextConfig } from "next";

const LOCALES = ["en", "et", "de", "fi", "sv", "fr"] as const;
type Locale = typeof LOCALES[number];

// Localized segments
const segments = {
  shop: { en: "shop", et: "pood", de: "shop-de", fi: "kauppa", sv: "butik", fr: "boutique" },
  blog: { en: "blog", et: "blogi", de: "blog", fi: "blogi", sv: "blogg", fr: "blog" },
} as const;

// EXAMPLE: old WP paths you want to 301 to the new ones.
// Add your real legacy routes here.
const legacyWpRoutes: Array<{ source: string; to: "shop" | "blog"; locale: Locale }> = [
  // { source: "/en/old-shop", to: "shop", locale: "en" },
  // { source: "/et/vanapood", to: "shop", locale: "et" },
  // { source: "/en/old-blog", to: "blog", locale: "en" },
];

function buildRedirects() {
  const rules: Array<{ source: string; destination: string; permanent: boolean }> = [];

  // Example: normalize wrong segment to right one (avoid self-redirects)
  for (const l of LOCALES) {
    // If someone hits the "other" segment name by mistake, send them to the correct one.
    // (Add your own normalization rules if needed.)
  }

  // Map legacy WP routes to new localized segments
  for (const r of legacyWpRoutes) {
    const seg = segments[r.to][r.locale];
    rules.push({
      source: r.source,
      destination: `/${r.locale}/${seg}`,
      permanent: true,
    });
  }

  return rules;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.tiskre-do.eu" },
      { protocol: "https", hostname: "tiskre-do.eu" },
      { protocol: "https", hostname: "*.wp.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  async redirects() {
    return buildRedirects();
  },
};

export default nextConfig;
