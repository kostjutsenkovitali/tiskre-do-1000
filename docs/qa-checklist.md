## QA Checklist

- [ ] Per-locale shop index loads and paginates
  - Navigate to `/{locale}/{shop-segment}` for each locale
  - Verify products render; Next/Prev paginates via `pageInfo.endCursor`

- [ ] Product detail: image slider, 6 thumbs, price format
  - Open `/{locale}/{shop-segment}/{handle}`
  - Main image shows with thin gray frame; can navigate media (arrows), see up to 6 thumbs
  - Price displays with correct currency code

- [ ] Cart: add / update / remove lines + checkoutUrl
  - Click “Add to cart”; drawer opens and line appears
  - Update quantity ±; quantity and total items update
  - Remove line; it disappears
  - “Checkout” button links to valid `checkoutUrl`

- [ ] Blog list & article detail render safely
  - Visit `/{locale}/{blog-segment}`; list shows image, title, excerpt, date
  - Open article `/{locale}/{blog-segment}/{handle}`; `contentHtml` is sanitized (no unsafe scripts)

- [ ] Header/footer links are locale-aware
  - Header “Shop” and “Blog” use `/{locale}/{segment}` paths from helpers
  - Home links to `/{locale}`; other links remain functional

- [ ] Wrong localized segments 404
  - Example: `/et/shop` (should be `/et/pood`) returns 404 via middleware

- [ ] Sitemap, robots, canonical
  - `sitemap.xml` includes localized URLs and `alternateRefs`
  - `robots.txt` generated
  - Canonical URLs present and correct per page

- [ ] Lighthouse i18n/SEO pass
  - Run Lighthouse for a localized URL; check Internationalization and SEO audits pass


