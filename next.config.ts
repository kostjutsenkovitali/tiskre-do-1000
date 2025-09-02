import type { NextConfig } from "next";
import { segments, LOCALES } from "./src/i18n/config";

const nextConfig: NextConfig = {
  // Removed output: "export" to enable hybrid approach
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.tiskre-do.eu" },
      { protocol: "https", hostname: "tiskre-do.eu" },
      { protocol: "https", hostname: "*.wp.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add redirects for better UX
  async redirects() {
    const redirects = [];
    
    // Redirect root paths to localized versions
    redirects.push({
      source: '/shop',
      destination: '/en/shop/',
      permanent: true,
    });
    
    redirects.push({
      source: '/blog',
      destination: '/en/blog/',
      permanent: true,
    });
    
    // Redirect non-localized pages to their English versions
    redirects.push({
      source: '/about',
      destination: '/en/about/',
      permanent: true,
    });
    
    redirects.push({
      source: '/contact',
      destination: '/en/contact/',
      permanent: true,
    });
    
    redirects.push({
      source: '/instructions',
      destination: '/en/instructions/',
      permanent: true,
    });
    
    // Add locale-specific segment redirects
    for (const locale of LOCALES) {
      if (locale !== 'en') {
        redirects.push({
          source: `/${locale}/shop`,
          destination: `/${locale}/${segments.shop[locale]}/`,
          permanent: true,
        });
        
        redirects.push({
          source: `/${locale}/blog`,
          destination: `/${locale}/${segments.blog[locale]}/`,
          permanent: true,
        });
      }
    }
    
    return redirects;
  },
};

export default nextConfig;