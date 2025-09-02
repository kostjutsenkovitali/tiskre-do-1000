// src/components/HexagonWithPosts.tsx
import Hexagon from "@/components/Hexagon";
import { sf } from "@/lib/shopify";
import { GET_BLOG_WITH_ARTICLES, LIST_ARTICLES } from "@/lib/queries/blog";
import { SHOPIFY_BLOG_HANDLE } from "@/lib/shopify";
import { articlePath, detectLocaleFromPath } from "@/lib/paths";
import { languageToShopify } from "@/i18n/config";

// Types
type Article = {
  id?: string;
  handle: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  url: string;
};

type Slide = {
  id: string | number;
  title: string;
  quote: string;
  imageUrl: string;
  url: string;
};

// Helper functions (copied from Hexagon.tsx)
function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = html
    .replace(/\[\/.+?\]/g, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ");
  return decodeBasicEntities(tmp).replace(/\s+/g, " ").trim();
}

function decodeBasicEntities(s: string): string {
  if (!s) return "";
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function truncateForQuote(s: string, max = 220): string {
  if (!s) return "";
  const clean = s.trim();
  if (clean.length <= max) return clean;
  const boundary = clean.lastIndexOf(". ", max - 1);
  const cut = boundary > 80 ? boundary + 1 : max;
  return clean.slice(0, cut).trim() + "…";
}

// Fetch blog posts function
export async function fetchBlogPosts(locale: string, first = 4): Promise<Slide[]> {
  try {
    // Convert locale to Shopify language code using proper mapping
    const shopifyLanguage = languageToShopify[locale as keyof typeof languageToShopify] || "EN";
    console.log("HexagonWithPosts: Fetching blog posts for locale:", locale, "language:", shopifyLanguage);
    const preferred = await sf<{ blog?: { articles?: { nodes?: any[] } } }>(
      GET_BLOG_WITH_ARTICLES,
      { blogHandle: SHOPIFY_BLOG_HANDLE, first, language: shopifyLanguage }
    );
    console.log("HexagonWithPosts: Preferred blog response:", preferred);
    let nodes = preferred?.blog?.articles?.nodes || [];
    if (!nodes.length) {
      console.log("HexagonWithPosts: No articles in preferred blog, trying list articles");
      const all = await sf<{ articles?: { nodes?: any[] } }>(LIST_ARTICLES, { first, language: shopifyLanguage });
      console.log("HexagonWithPosts: List articles response:", all);
      nodes = all?.articles?.nodes || [];
    }
    console.log("HexagonWithPosts: Final nodes:", nodes);
    
    const items: Slide[] = nodes.slice(0, first).map((n: any) => ({
      id: n.id || n.handle,
      title: n.title || "Untitled",
      quote: truncateForQuote(stripHtml(n.excerpt || "")),
      imageUrl: n.image?.url || "/placeholder.jpg",
      url: articlePath(locale as any, n.handle),
    }));
    
    console.log("HexagonWithPosts: Mapped items:", items);
    return items;
  } catch (e) {
    console.error("HexagonWithPosts: failed to load Shopify articles", e);
    return [];
  }
}

// Component that fetches blog posts and passes them to Hexagon
export default async function HexagonWithPosts({ locale }: { locale: string }) {
  const slides = await fetchBlogPosts(locale, 4);
  console.log("HexagonWithPosts: final slides", slides);
  
  // Pass the fetched slides as initialSlides prop to Hexagon component
  return <Hexagon initialSlides={slides} />;
}
