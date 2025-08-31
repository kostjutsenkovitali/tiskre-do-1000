import {createStorefrontApiClient} from "@shopify/storefront-api-client";

// Local enums for interoperability across app code. Align with Shopify codes in i18n config.
export enum CountryCode {
  EE = "EE",
  DE = "DE",
  FI = "FI",
  SE = "SE",
  FR = "FR",
}

export enum LanguageCode {
  EN = "EN",
  ET = "ET",
  DE = "DE",
  FI = "FI",
  SV = "SV",
  FR = "FR",
}

export const SHOPIFY_BLOG_HANDLE: string = process.env.SHOPIFY_BLOG_HANDLE || "news";

function readEnv(): { storeDomain: string; publicAccessToken: string; apiVersion: string } {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "";
  const publicAccessToken =
    process.env.SHOPIFY_STOREFRONT_API_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
    "";
  const requestedVersion = process.env.SHOPIFY_API_VERSION || process.env.SHOPIFY_STOREFRONT_API_VERSION || "2025-07";
  const supported = new Set(["2024-10", "2025-01", "2025-04", "2025-07", "2025-10", "unstable"]);
  const apiVersion = supported.has(requestedVersion) ? requestedVersion : "2025-07";

  if (!storeDomain) throw new Error("Missing env SHOPIFY_STORE_DOMAIN (or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN)");
  if (!publicAccessToken)
    throw new Error("Missing env SHOPIFY_STOREFRONT_API_TOKEN (or _ACCESS_TOKEN)");
  return { storeDomain, publicAccessToken, apiVersion } as { storeDomain: string; publicAccessToken: string; apiVersion: string };
}

export function createStorefrontClient() {
  const { storeDomain, publicAccessToken, apiVersion } = readEnv();
  return createStorefrontApiClient({ storeDomain, apiVersion, publicAccessToken });
}

const _client = (() => {
  try {
    return createStorefrontClient();
  } catch {
    return null;
  }
})();

export async function sf<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!_client) {
    const { storeDomain, publicAccessToken } = readEnv();
    throw new Error(
      `Shopify client not initialized. Check env: SHOPIFY_STORE_DOMAIN='${storeDomain}', STOREFRONT TOKEN present=${Boolean(publicAccessToken)}`
    );
  }

  const {data, errors} = await _client.request<T>(query, {variables});

  if (errors) {
    let message: string | undefined;
    if (Array.isArray(errors.graphQLErrors) && errors.graphQLErrors.length > 0) {
      message = errors.graphQLErrors
        .map((err) => {
          if (
            err &&
            typeof err === "object" &&
            "message" in err &&
            typeof (err as { message?: unknown }).message === "string"
          ) {
            return (err as { message: string }).message;
          }
          try {
            return JSON.stringify(err);
          } catch {
            return String(err);
          }
        })
        .join(", ");
    }
    if (!message && typeof errors.message === "string") {
      message = errors.message;
    }
    const status = errors.networkStatusCode;
    throw new Error(`Shopify GraphQL error${status ? ` (HTTP ${status})` : ""}: ${message || "Unknown GraphQL error"}`);
  }

  return data as T;
}


// Branded checkout helper: optionally rewrite checkoutUrl host to your custom domain
// Usage: brandedCheckoutUrl(cart.checkoutUrl)
const RAW_CHECKOUT_HOST =
  process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_HOST ||
  process.env.SHOPIFY_CHECKOUT_HOST ||
  "";

export function brandedCheckoutUrl(url: string): string {
  if (!RAW_CHECKOUT_HOST) return url;
  try {
    const u = new URL(url);
    const host = RAW_CHECKOUT_HOST.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (host) u.host = host;
    return u.toString();
  } catch {
    return url;
  }
}


