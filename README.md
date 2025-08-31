This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Branded Shopify Checkout (Headless)

Goal: When a shopper clicks Checkout, redirect to a Shopify Checkout URL hosted on your domain (e.g., `https://checkout.tiskre-do.eu/...`).

1) Shopify Admin → Settings → Domains
- Connect domain/subdomain: `checkout.tiskre-do.eu`.
- DNS: create a CNAME record: `checkout` → `shops.myshopify.com`.
- Wait for SSL to be issued (green secure lock).
- Option A: set your custom domain as Primary; Option B: keep your main domain primary and use `checkout.tiskre-do.eu` for checkout only. Ensure “Use primary domain for checkout” is active.

2) Environment variables (e.g., `.env.local`)
```
CHECKOUT_DOMAIN=checkout.tiskre-do.eu
STORE_DOMAIN=mp3mpc-tc.myshopify.com
```

3) Code
- `src/lib/checkout.ts` provides `ensureCheckoutHost(url)` that swaps the host to `CHECKOUT_DOMAIN` while preserving the path/query.
- `POST /api/cart/prepareCheckout` updates buyer identity (optional), refetches the cart, applies `ensureCheckoutHost`, and returns `{ checkoutUrl }`.
- Cart drawer calls this endpoint and navigates to the returned URL in the same tab.

4) Locale & buyer identity
- We keep locale routing on our site; Shopify Checkout handles its own language/market.
- Update buyer identity with country/email for correct taxes/shipping.

5) Security / CSP
- Ensure your deployment allows navigation to `https://checkout.tiskre-do.eu`.

If `CHECKOUT_DOMAIN` is not set, the app falls back to Shopify’s original `checkoutUrl` safely.
