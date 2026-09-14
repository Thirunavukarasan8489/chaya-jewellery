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

## 2026-09-13 hero banner rework (image-first, optional overlay/buttons)

User had uploaded a real banner creative (a pre-designed sale graphic with
its own baked-in text/offer) via `/admin/website/hero-section`, and it was
being squeezed into a small square card off to one side while our own
badge/title/subtitle/buttons filled the rest of the slide — redundant and,
for a creative that's already a whole composition, actively lossy (the
image got cropped to a square, cutting off parts of it).

**Model change:** every `HeroSection` field except `name` and `image` is
now optional (`lib/models/hero-section.ts`) — badge/title/subtitle/both
CTA pairs can all be left blank. `image` itself was already optional
(falls back to `GemImage` placeholder art, from the previous redesign).

**`hero-slider.tsx` rework:** the banner image is now the full-bleed
background of the whole slide (`fill` + `object-cover`, no more
`size-72` square card). What renders on top is entirely conditional:
- No badge/title/subtitle and no buttons → no text overlay, no scrim, and
  the *entire slide* becomes a link to `ctaHref` (a plain, fully-clickable
  banner image — the common case for a designer-provided creative).
- Any of badge/title/subtitle present → renders that overlay (with the
  gradient scrim for legibility), same visual style as before.
- `ctaText`+`ctaHref` and/or `secondaryCtaText`+`secondaryCtaHref` present
  → renders that button (each pair independently optional).
- **Bug fixed in passing:** the secondary button previously always linked
  to a hardcoded WhatsApp message, ignoring whatever `secondaryCtaHref`/
  `secondaryCtaText` the admin actually set in the form — it now uses the
  CMS fields like the primary button always did.

**`HeroSectionForm.tsx`:** removed the `required` attribute (and the red
`*`) from badge/title/subtitle/both CTA pairs, and added inline help text
explaining the optional/fallback behavior above. `name` and the image are
still required — client-side validation for "an image is required" was
already correct and untouched.

**Left alone:** the demo hero banners and testimonials/FAQs seeded in the
previous session are gone from the database — the user deleted them
directly through `/admin/website` while testing (confirmed via a
read-only DB check, not assumed). That's their call; nothing here
re-seeds or restores them. `npm run seed:catalog` still exists if demo
hero/testimonial/FAQ content is wanted again (categories/products from
that seed were left untouched and are still in the database).

**Verification:** `tsc --noEmit` and `eslint` clean; fetched the live
homepage before and after to confirm the old small-image-card markup
(`size-72`) is gone and the existing real "slider 1" banner (badge+title+
subtitle+both buttons all filled in) still renders correctly full-bleed.

## 2026-09-13 fix: stray vertical scrollbar on horizontal scroll-snap carousels

User added a second hero banner (triggering the hero's multi-slide carousel
path) and got a visible vertical scrollbar cutting through the banner.
Root cause is a genuine, easy-to-miss CSS spec rule, not a sizing mistake:
per the CSS Overflow spec, if `overflow-x` is set to anything other than
`visible` (e.g. Tailwind's `overflow-x-auto`) and `overflow-y` is left
unset, `overflow-y` **computes to `auto` too** — not `visible`. So any
horizontal scroll-snap track (`flex ... overflow-x-auto`) silently becomes
verticality-scrollable as well, and the moment any two slides/cards in
that track differ in height by even a sub-pixel (two different uploaded
images, one slide with a text overlay and one without, font rendering
rounding, etc.), a real vertical scrollbar appears on the track itself.

Fixed by adding `overflow-y-hidden` explicitly alongside every
`overflow-x-auto` horizontal scroll-snap track in the public site:
`hero-slider.tsx`, `promo-banners.tsx`, `product-rail.tsx` (mobile rail),
`testimonials.tsx` (mobile rail — desktop already resets to
`lg:overflow-visible` for its grid layout, untouched), `product-gallery.tsx`.
**If you add a new horizontal `snap-x` + `overflow-x-auto` rail anywhere,
pair it with `overflow-y-hidden` from the start** — this is the correct
default for that pattern, not a one-off patch. (Left the admin
`overflow-x-auto` table wrappers and `page-header.tsx`'s breadcrumb rail
alone — single-row content, not the multi-item-height-mismatch shape that
triggers this.)

Also, from the previous session's single-banner fix: the hero's
per-slide text/button overlay is `position: absolute inset-0` over the
image (not in normal flow with its own `min-height`) specifically so a
long title/subtitle can never stretch the slide — and therefore the whole
page — taller than intended. Keep that invariant if you touch
`HeroSlide` again.

## 2026-09-14 fix: Vercel build failing with npm ERESOLVE (nodemailer/next-auth peer conflict)

Vercel's `npm install` step was failing outright:
`next-auth@4.24.15` declares a `peerOptional` dependency on
`nodemailer@^7.0.7`, but `package.json` had drifted to
`nodemailer@^10.0.10` (dependencies list showed other unrelated
version bumps too — `next` → `^16.3.5`, `next-cloudinary`,
`sanitize-html`, etc. — those look like real, intentional feature work
done outside this session and were left untouched; only nodemailer
caused the ERESOLVE). npm's default strict peer-dependency algorithm
refuses to auto-resolve that conflict on a clean install (no local
`node_modules` to fall back on, unlike a local `npm install` which can
succeed quietly against an already-resolved tree) — so it always failed
in CI/Vercel even though it may not have failed locally.

**Fix:** pinned `nodemailer` back to `^7.0.13` (its original version in
this project, before whatever bumped it — `npm update`/`audit fix`,
most likely) rather than reaching for `legacy-peer-deps`/`--force`.
Checked first that this is actually safe: `lib/authOptions.ts` has no
`EmailProvider` configured, so next-auth never touches nodemailer at
runtime at all — it's a fully unused optional peer. The app's own
`lib/services/email.ts` only calls nodemailer's `createTransport()` /
`.sendMail()`, both stable core APIs unchanged across v7–v10, so the
downgrade has zero functional impact on transactional email.

Re-ran `npm install` locally (not `--package-lock-only` — a real
install, since this is a major-version change) to regenerate
`package-lock.json` with `nodemailer@7.0.13` resolved, confirmed no
ERESOLVE, then ran `npm run build` end-to-end (clean compile, all ~60
routes prerendered/typed) to confirm this is the actual fix for what
Vercel runs, not just a local shortcut.

**If a dependency bump ever needs to stay** (e.g. nodemailer v10 has a
security fix you need): don't reach for `legacy-peer-deps` as a
first move — check whether the peer relationship is actually load-bearing
(`grep` for the conflicting package's usage in the dependent, e.g.
`EmailProvider`/`nodemailer` in `authOptions.ts` here) before deciding
whether a version mismatch is safe to keep.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
