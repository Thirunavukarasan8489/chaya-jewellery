# Chaya Jewellery — agent notes

Next.js 16 (App Router) + React 19 + Tailwind v4 + MongoDB (Mongoose)
e-commerce platform for **Chaya Jewellery** (renamed from "A1 Gems" on
2026-09-12 — see rebrand log below). Full public storefront **and** an
admin panel with RBAC (`SUPER_ADMIN` / `CONTENT_MANAGER` / `LEAD_MANAGER`),
customer accounts, orders, payments (Razorpay), shipments, returns,
inventory, and a leads/CRM pipeline.

`README.md` is stale — it describes an early storefront-only snapshot. The
admin panel, orders, payments, shipments, returns, and leads are all
implemented; treat the actual `app/`, `components/`, `lib/` trees as the
source of truth over the README.

## Brand color system

All color tokens live in `app/globals.css` under `@theme` (Tailwind v4
CSS-first config). **Never hardcode brand hex in a component** — use the
token scale (`bg-plum-700`, `text-gold-600`, …) so a future palette change
stays a one-file edit. If you must hardcode a color for something Tailwind
can't reach (canvas gradients, chart.js configs, inline `style={}`), copy
the exact hex from the token list below so it stays in sync.

- **`plum-*`** — brand Purple family. Anchors: Deep Purple `#2B0A31`
  (900), Primary Purple `#430F4D` (700, the main brand color — aliased as
  `--color-premium-bg` for dark hero/banner sections), Royal Purple
  `#5A1766` (500), Light Purple `#8B4A9B` (400). Also backs `--color-ink`'s
  historical role and the "premium" dark surfaces across the site.
  Token is still named "plum" from the pre-rebrand oxblood/maroon
  palette — kept on purpose so every component already using `plum-*`
  repaints for free. Don't rename the token unless you're prepared to
  touch every call site.
- **`gold-*`** — brand Gold family. Anchors: Luxury Gold `#D6A04F` (500,
  primary accent/CTA), Button Hover Gold `#B98232` (600 — use for
  `hover:` states on gold buttons), Dark Gold `#A8752E` (700), Bright Gold
  `#E7BE70` (300), Champagne Gold `#F2D49B` (200).
- **`ivory-*`** — White `#FFFFFF` (50, = `--color-canvas`, the page
  background), Warm White `#FAF8F5` (100), Cream `#F7F0E5` (200, alt
  section backgrounds / `--color-surface-sunken`).
- **`--color-ink` / `--color-ink-soft`** — literal brand Text Black
  `#171717` / Soft Grey `#6B6870` (no longer derived from the purple
  scale, unlike the pre-rebrand palette).
- **`emerald-*`** and the `danger` / `warning` / `info` scales are
  **functional** (in-stock/success, error, warning, info states) — not
  part of brand identity. Don't recolor them on a future brand tweak
  unless explicitly asked; doing so would make status colors ambiguous.
- **Admin dashboard** (`admin-*` tokens): `admin-gray-*` (table/card
  chrome) is intentionally left as neutral gray. `admin-primary-*` now
  follows the brand gold (was a generic dashboard blue) so the admin
  panel doesn't read as a different product from the storefront.
- A handful of places use **hardcoded gemstone-hue swatches** (ruby red
  `#c81e4a`, sapphire blue `#1f4fd8`, emerald green `#0f9c68`, topaz
  `#e0a713`, etc.) for placeholder product-category art —
  `components/*/gem-image.tsx`, `promo-banners.tsx`, `about-section.tsx`.
  These are literal per-category colors, not brand chrome, and were
  deliberately left unchanged during the color rebrand. Note: `gemColor`
  is NOT an actual field on the `Category`/`Product` Mongoose schemas —
  see the 2026-09-12 homepage redesign entry below for the hash-based
  `gemColorFor()` fallback that replaced the old silent `'#000000'`
  default.
- WhatsApp CTA buttons use WhatsApp's own brand green (`#25D366`) —
  intentionally outside the Chaya palette; that's their brand mark, not
  ours.

## 2026-09-12 rebrand: "A1 Gems" (gemstone retailer) → "Chaya Jewellery" (jewellery retailer)

**Done:**
- Repainted every `@theme` color token in `app/globals.css` to the brand
  Purple/Gold palette above, plus every hardcoded hex that mirrored the
  old token values: `AdminCharts.tsx` chart colors, `promo-banners.tsx`
  gradient endpoints, `gem-image.tsx` shadow falloff, `mobile-drawer.tsx`
  category-tile gradient, the Razorpay checkout `theme.color`, and the PWA
  `themeColor` meta in `app/layout.tsx`.
- Renamed every user-facing "A1 Gems" string to "Chaya Jewellery" — header
  and footer logo, admin login/reset-password/forgot-password screens,
  page titles and metadata, JSON-LD structured data, WhatsApp prefilled
  message text, seed-script admin emails, the SMTP from-name, the
  Cloudinary upload folder, and sitemap/robots/llms.txt.
- `package.json` was already `chaya-jewellery`; `package-lock.json`'s
  stale `a1gems-ecommerce` name was resynced via
  `npm install --package-lock-only` (no dependency changes).
- Verified with `tsc --noEmit` (clean) and by fetching the dev server's
  rendered HTML for `/` and `/admin/login` to confirm the new name and
  purple tokens actually reach the page.

**Deliberately not touched:**
- `MONGODB_URI` in `.env.local` — the real Atlas cluster hostname and
  credentials (`a1gems.s8z0dii.mongodb.net`, user `a1gemsindia_db_user`)
  are live infrastructure, not display branding. Renaming the actual
  cluster/database is a separate, deliberate infra migration — don't do
  it as a drive-by branding edit.
- Marketing/SEO copy is still gemstone-specific in many places: the site
  `<meta>` description/keywords in `app/layout.tsx` ("certified
  gemstones", "ruby", "blue sapphire neelam", …), the About page origin
  story, WhatsApp message copy ("free gemmologist consultation"), and
  several homepage sections. The user said the business itself is
  pivoting from gemstones to general jewellery — deciding what replaces
  "ruby / sapphire / emerald" as the product taxonomy is a product
  decision, not a mechanical rename, so it needs their input rather than
  a guess. **Flag this as an open follow-up, don't silently rewrite it.**
- Cloudinary account, MongoDB cluster/db name, and the actual Vercel
  deployment were not renamed — only source-code references/placeholder
  domains were (`chayajewellery.com`, `chayajewellery-ecommerce.vercel.app`).
  Confirm the real production domain before launch if it differs.
- The cart's `localStorage` key changed from `a1gems.cart.v1` to
  `chayajewellery.cart.v1`. Any customer with an in-progress cart from
  before this deploy will see an empty cart once — expected one-time
  side effect of the rename, not a bug.

## 2026-09-12 homepage redesign ("full redesign", "Rich Indian luxury" direction)

User asked to redesign the homepage to look like an attractive, animated,
responsive jewellery e-commerce site (chosen explicitly over a lighter
"visual polish only" option). Scope was homepage-first; a few shared
components got touched because they're rendered on the homepage.

**Found first, changed the plan:** the live database had 0 products and
1 leftover category ("Gemstone", from the old business). User opted to
seed demo data rather than build purely for the empty state — see
`scripts/seed-catalog.js` (`npm run seed:catalog`, safe to re-run —
every insert is guarded by a lookup, nothing duplicates).

**Data-layer changes (not just visual):**
- `lib/models/product.ts` — added `featured`/`bestseller` boolean fields.
  These were already read by `getFeaturedProducts()`/`getBestsellers()` in
  `lib/services/product-service.ts` but never existed on the schema or
  anywhere in the admin UI, so those two rails always silently fell back
  to "all products" with no real curation. Toggling them still has no
  admin UI — set directly in the database, or wire up a checkbox in the
  admin product form as a follow-up.
- `lib/services/product-service.ts` — added `getNewArrivals()` (sorts by
  `createdAt desc`, powers the new "New Arrivals" homepage rail).
- `lib/models/hero-section.ts` — `image` is now optional (was
  `required: true`). `HeroSlider` falls back to the `GemImage` placeholder
  art when a banner has no photo, same as products/categories without one.
- `lib/utils.ts` — added `gemColorFor(seed)`, a deterministic hash into a
  small jewel-tone palette. `gemColor` isn't an actual schema field on
  Category/Product, so every placeholder card was silently rendering
  flat black before this; now every product/category/hero-banner
  placeholder gets a stable, varied colour instead. Wired into
  `product-service.ts`'s `mapToPublicProduct`, `featured-categories.tsx`,
  and `mobile-drawer.tsx`.
- Fixed a leftover old-oxblood-palette value (`rgba(25,10,9,.55)`, missed
  by the color-rebrand hex sweep because it wasn't `#rrggbb` format) in
  both `gem-image.tsx` copies.
- Set the legacy "Gemstone" category to `DRAFT` (hidden, not deleted —
  reversible from `/admin/categories`) so it doesn't show alongside the
  new jewellery categories in Shop by Category.

**New homepage sections:**
- `trust-marquee.tsx` — infinite scrolling trust-message ribbon under the
  hero, using the `--animate-marquee` keyframe that already existed in
  `globals.css` but was unused anywhere.
- `new-arrivals.tsx` — product rail sorted by recency.
- `promo-banners.tsx` was fully built but never imported/rendered on any
  page — wired it into the homepage as a "shop by occasion" carousel and
  reworded its content from gemstone parcels to jewellery categories.
- `reveal.tsx` — scroll-triggered fade/rise wrapper (IntersectionObserver
  based). Renders fully visible with no extra classes until mounted, so a
  reduced-motion preference or a JS failure never leaves content stuck
  hidden. Used at the section level in `page.tsx`, and for staggered
  grids inside `featured-categories.tsx` and `how-it-works.tsx`.

**Retired gemstone-specific content (homepage + shared components only,
per the "full redesign" choice):**
- `certification-trust-section.tsx` — was a GIA/IGI/GRS gemstone lab
  certificate section, including a static image of an actual gemstone
  lab report (`public/images/grsss-bg-img-040324.png`, now unused —
  left in place, just unreferenced). Replaced with a jewellery
  craftsmanship/trust section using generic, non-fabricated industry
  marks (BIS Hallmark, IGI, 925 Silver, Certificate of Authenticity) —
  deliberately no fake specific certificate numbers or scanned documents.
- `how-it-works.tsx` (also rendered on `/about`) — was a 4-step "share
  your birth chart → astrologer recommends a gemstone" flow. Replaced
  with a generic browse → consult → customise → delivery flow.
- `rashi-finder.tsx` (zodiac gemstone finder) was already unused/dead —
  left as-is, out of scope.
- Reworded homepage-visible copy that referenced "gemmologist" /
  "gemstone" to jewellery-appropriate language (WhatsApp CTA text, trust
  strip, consultation CTA, final CTA, FAQ intro line). Did **not** touch
  the site-wide `<meta>` title/description/keywords in `app/layout.tsx`
  or the nav's "Gemstone Guides" label — those are sitewide, not
  homepage, and are still the open follow-up noted in the rebrand entry
  above (needs the user's input on product taxonomy).

**Demo content seeded (clearly placeholder, flag before launch):**
- 6 categories (Rings, Necklaces, Earrings, Bangles & Bracelets, Pendants,
  Mangalsutra) and 18 products/variants with realistic INR pricing —
  prices are in **plain rupees**, not paise, matching the actual runtime
  convention (`CheckoutClient.tsx` displays `totals.total` directly and
  only `× 100`s it right at the Razorpay API call — `lib/types.ts`'s
  "Money in paise" comment and `lib/filters.ts`'s price-band constants
  are stale/inconsistent with this and were NOT relied on or fixed here;
  the price-band filter is a pre-existing, separate bug on `/products`).
- 2 new hero banners, 5 testimonials, 6 FAQs — all placeholder/demo
  content written for this task, not real customer data.
- The one real hero banner the user had already created in `/admin/website`
  (title/subtitle literally "test") was edited in place — same document,
  same uploaded image, same links — replacing the placeholder copy with
  real brand copy. Nothing else the user created was modified or deleted.

**Verification:** `tsc --noEmit` clean; fetched the live dev server's
rendered `/`, `/about`, `/products`, and a product detail page after
seeding to confirm the new sections, categories and copy actually render
(and that no stale category leftover or gemstone copy remained in the
page body — sitewide nav/meta excepted, see above).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
