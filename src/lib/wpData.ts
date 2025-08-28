import { wpRequest } from "./wpClient";
import {
  QUERY_MENUS,
  QUERY_PAGES_BY_SLUG,
  QUERY_POSTS,
  QUERY_CATEGORIES,
  QUERY_PRODUCTS,
} from "./queries";

export type MenuItem = { id: string; label: string; path: string };

export async function getMenu(location: "PRIMARY" | "FOOTER" = "PRIMARY") {
  const data = await wpRequest<{ menuItems: { nodes: MenuItem[] } }>(
    QUERY_MENUS,
    { location }
  );
  return data.menuItems?.nodes ?? [];
}

export type WPPage = {
  id: string;
  title: string;
  content: string;
  uri: string;
  featuredImage?: { node?: { sourceUrl?: string; altText?: string } };
};

export async function getPageBySlug(slug: string) {
  const data = await wpRequest<{ page: WPPage | null }>(QUERY_PAGES_BY_SLUG, {
    slug,
  });
  return data.page ?? null;
}

export type WPPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage?: { node?: { sourceUrl?: string; altText?: string } };
};

export async function getPosts(first = 10) {
  const data = await wpRequest<{ posts: { nodes: WPPost[] } }>(QUERY_POSTS, {
    first,
  });
  return data.posts?.nodes ?? [];
}

export async function getProductCategories(first = 50) {
  const data = await wpRequest<{
    productCategories: { nodes: { id: string; slug: string; name: string; description?: string | null }[] };
  }>(QUERY_CATEGORIES, { first });
  return data.productCategories?.nodes ?? [];
}

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

export async function getProducts(first = 20, categorySlugs?: string[]) {
  const data = await wpRequest<{ products: { nodes: Product[] } }>(
    QUERY_PRODUCTS,
    { first, category: categorySlugs }
  );
  return data.products?.nodes ?? [];
}



