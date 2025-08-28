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

type Env = {
  SHOPIFY_STORE_DOMAIN: string | undefined;
  SHOPIFY_STOREFRONT_API_VERSION?: string | undefined;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: string | undefined;
};

function readEnv(): Required<Pick<Env, "SHOPIFY_STORE_DOMAIN" | "SHOPIFY_STOREFRONT_ACCESS_TOKEN">> & {SHOPIFY_STOREFRONT_API_VERSION: string} {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2025-01";
  const publicAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!storeDomain) throw new Error("Missing env SHOPIFY_STORE_DOMAIN");
  if (!publicAccessToken) throw new Error("Missing env SHOPIFY_STOREFRONT_ACCESS_TOKEN");

  return {
    SHOPIFY_STORE_DOMAIN: storeDomain,
    SHOPIFY_STOREFRONT_API_VERSION: apiVersion,
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: publicAccessToken,
  };
}

export function createStorefrontClient() {
  const env = readEnv();
  return createStorefrontApiClient({
    storeDomain: env.SHOPIFY_STORE_DOMAIN,
    apiVersion: env.SHOPIFY_STOREFRONT_API_VERSION,
    publicAccessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  });
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
    const {SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN} = readEnv();
    throw new Error(
      `Shopify client not initialized. Check env: SHOPIFY_STORE_DOMAIN='${SHOPIFY_STORE_DOMAIN}', SHOPIFY_STOREFRONT_ACCESS_TOKEN present=${Boolean(
        SHOPIFY_STOREFRONT_ACCESS_TOKEN
      )}`
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


