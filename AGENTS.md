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
  `components/*/gem-image.tsx`, `promo-banners.tsx`, `about-section.tsx`,
  and the `gemColor` field on the `Category` model. These are literal
  per-category colors, not brand chrome, and were deliberately left
  unchanged during the color rebrand.
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
