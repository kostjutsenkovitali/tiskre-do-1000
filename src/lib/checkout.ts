export function ensureCheckoutHost(url: string): string {
  const host = process.env.CHECKOUT_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_HOST || "";
  if (!host) return url;
  try {
    const u = new URL(url);
    u.host = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return u.toString();
  } catch {
    return url;
  }
}


