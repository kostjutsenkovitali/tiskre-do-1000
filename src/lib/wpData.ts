// Legacy WP/Woo data helpers disabled. Leaving file as a feature-flagged stub to avoid import crashes.
// To re-enable, restore WP client and queries.

export type MenuItem = { id: string; label: string; path: string };

export async function getMenu() { return []; }

export type WPPage = {
  id: string;
  title: string;
  content: string;
  uri: string;
  featuredImage?: { node?: { sourceUrl?: string; altText?: string } };
};

export async function getPageBySlug(_slug: string) { return null; }

export type WPPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage?: { node?: { sourceUrl?: string; altText?: string } };
};

export async function getPosts(_first = 10) { return []; }

export async function getProductCategories(_first = 50) { return []; }

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sku?: string | null;
  stockStatus?: string | null;
  image?: { sourceUrl?: string; altText?: string } | null;
  galleryImages?: { nodes?: { sourceUrl?: string; altText?: string }[] } | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
};

export async function getProducts(_first = 20, _categorySlugs?: string[]) { return []; }



