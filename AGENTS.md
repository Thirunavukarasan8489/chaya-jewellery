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
token scale (`bg-plum-900`, `text-gold-500`, …) so a future palette change
stays a one-file edit. If you must hardcode a color for something Tailwind
can't reach (canvas gradients, chart.js configs, inline `style={}`), copy
the exact hex from the token list below so it stays in sync.

**Source of truth: `docs/chaya color code.jpeg`** (the official "Brand
Colour Palette" poster) and the matching implementation-guide strip at
the bottom of `docs/chaya home page.jpeg`. As of 2026-09-16 every anchor
value in the theme is copied verbatim from that poster — see the
2026-09-16 entry below for the full recalibration (values before that
date were a self-derived approximation from an earlier plain-text
description and are now superseded).

- **`plum-*`** — brand Purple family. Exact anchors: Royal Plum `#4A0B52`
  (500, highlights/gradients), Chaya Plum `#26002F` (900, brand/headings/
  buttons — this is what most of the UI's `bg-plum-900`/`text-plum-900`
  calls actually render as), Deep Plum `#16001D` (950, luxury dark
  sections — aliased as `--color-premium-bg`, used for nav/footer/hero
  dark surfaces). Every other step (50–400, 600–800) is interpolated
  between those three anchors, not independently brand-specified. Token
  is still named "plum" from a pre-rebrand oxblood/maroon palette (two
  rebrands ago) — kept on purpose so every component already using
  `plum-*` repaints for free. Don't rename the token unless you're
  prepared to touch every call site.
- **`gold-*`** — brand Gold family. Exact anchors: Soft Gold `#F4D58A`
  (300 — hover/light accent; the brand kit explicitly wants hover states
  to _lighten_ toward gold, not darken, matching the site's existing
  gold-foil `shine-sweep` hover treatment) and Champagne Gold `#D9A441`
  (500, primary accent — icons/borders/highlights). 50–200/400/600–950
  are interpolated.
- **`ivory-*`** — exact 1:1 brand anchors, no interpolation: Pure White
  `#FFFFFF` (50, = `--color-canvas`, main background), Soft Ivory
  `#FFFDF9` (100, warm sections), Petal Mist `#F8F1F7` (200,
  product/category panels — `--color-surface-sunken`), Fine Line
  `#E9DFE7` (300, borders/dividers — `--color-hairline`).
- **`--color-ink` / `--color-ink-soft`** — literal brand Ink `#1C1720` /
  Muted `#756B76`, taken directly from the poster (not derived from the
  plum scale).
- **`emerald-*`** and the `danger` / `warning` / `info` scales are
  **functional** (in-stock/success, error, warning, info states) — not
  part of brand identity, not in the brand kit, and were left unchanged
  through every color pass so far. Don't recolor them on a future brand
  tweak unless explicitly asked; doing so would make status colors
  ambiguous.
- **Admin dashboard** (`admin-*` tokens): `admin-gray-*` (table/card
  chrome) is intentionally left as neutral gray. `admin-primary-*`
  follows the brand gold anchors above (was a generic dashboard blue
  originally) so the admin panel doesn't read as a different product
  from the storefront.
- A handful of places use **hardcoded gemstone-hue swatches** (ruby red
  `#c81e4a`, sapphire blue `#1f4fd8`, emerald green `#0f9c68`, topaz
  `#e0a713`, etc.) for placeholder product-category art —
  `components/*/gem-image.tsx`, `promo-banners.tsx`, `about-section.tsx`.
  These are literal per-category colors, not brand chrome, and were
  deliberately left unchanged through every color pass so far. Note:
  `gemColor` is NOT an actual field on the `Category`/`Product` Mongoose
  schemas — see the 2026-09-12 homepage redesign entry below for the
  hash-based `gemColorFor()` fallback that replaced the old silent
  `'#000000'` default; its own internal palette (`lib/utils.ts`) was
  updated to the new brand plum/gold anchors on 2026-09-16 too.
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
  `<meta>` description/keywords in `app/layout.tsx` (Certified Jewellery", "Bracelet", "Earrings", "Necklace", "Rings", …), the About page origin
  story, WhatsApp message copy ("free gemmologist consultation"), and
  several homepage sections. The user said the business itself is
  pivoting from Jewellery to general jewellery — deciding what replaces
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
  the _entire slide_ becomes a link to `ctaHref` (a plain, fully-clickable
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

## 2026-09-15 fixes: admin media preview broken by CSP; hero image replace/delete now cleans up Cloudinary

Between sessions, something (most likely a `/security-audit` pass — see
the `security-audit`/`performance-audit` skills now available in this
project) added real security headers via `next.config.ts` (`headers()`),
including a `Content-Security-Policy` — a good, previously-missing
hardening. But its `img-src` directive
(`'self' data: https://res.cloudinary.com https://images.unsplash.com
https://*.razorpay.com`) didn't include `blob:`, which is exactly the
scheme `URL.createObjectURL(file)` produces for local file previews.
Every admin media-upload form that shows a live preview before saving
(hero banners, presumably product images/other forms using the same
pattern) was silently broken — the file itself uploaded fine on submit,
but the preview `<img>` rendered a broken-image icon because the browser
blocked the `blob:` source per CSP, not because of any bug in the
preview code itself. **Fix:** added `blob:` to `img-src`. This is a
standard, safe CSP allowance — `blob:` URLs here are always client-
generated from a `File` the user just picked in their own browser, never
an externally-injected network resource, so it doesn't weaken what the
CSP is actually defending against.

Separately, `HeroSectionForm.tsx`'s "Remove" button and the edit-then-
replace-image flow only ever cleared the `image` field in Mongo —
nothing deleted the old file from Cloudinary, so every replaced or
removed hero image became a permanently orphaned (billed) asset.
**Fix, in `lib/actions/cms.actions.ts`:**

- `updateHeroSection` now reads the section's _current_ `image` before
  applying the update, and — only after the DB write succeeds, and only
  if the image actually changed — deletes the old Cloudinary asset via
  `deleteMediaByUrl()` (already existed in `media.actions.ts`, previously
  only wired up from `product.actions.ts`).
- `deleteHeroSection` now does the same when a whole hero section is
  deleted from the list page.
- Deliberately **not** wired into the form's "Remove" button itself
  (client-side) — that only clears local component state, so a user who
  clicks Remove, then cancels/navigates away without saving, never
  touches Cloudinary at all. Deletion is deferred to the server action,
  after the new state is actually persisted; if you touch this flow
  again, keep that ordering — deleting the old image _before_ confirming
  the new one is saved would leave a live banner pointing at nothing if
  anything failed in between.
- `deleteMediaByUrl` only ever deletes assets whose URL folder segment
  matches `CLOUDINARY_FOLDER` (`'chayajewellery'`) — an external or
  manually-pasted image URL silently no-ops instead of attempting a
  delete, so this is safe to call speculatively on every replace/delete.

**Verification:** `tsc --noEmit`, `eslint`, and `npm run build` all
clean; confirmed via `curl -I` against the running dev server that the
`Content-Security-Policy` response header now includes `blob:` in
`img-src`.

## 2026-09-16 official brand-kit recalibration + homepage rebuild to match `docs/chaya home page.jpeg`

User supplied two designer-made reference images in `docs/`: a full brand
colour-palette poster and a complete homepage mockup (with an
implementation-guide colour strip baked into its own footer). Explicit
scope: Navbar and the hero/banner section were called out as already
correct and untouched; everything else on the homepage was rebuilt to
match the mockup. Confirmed with the user first (asked, didn't guess)
whether to match the mockup's shorter section list exactly or keep the
existing longer page and add the new sections alongside — user chose
"match exactly."

**Color recalibration** — see the "Brand color system" section above for
the resulting token values; this is the _third_ color pass on this repo
(gemstone-era → first Chaya purple/gold guess → this exact brand-kit
version), so if you're reading old context/commits, don't trust
previously-stated hex values without checking `app/globals.css` first.
Every hardcoded hex that mirrored the old anchors was swept and updated
too: `AdminCharts.tsx`, `promo-banners.tsx`, `gem-image.tsx` (both
copies — `components/ui/gem-image.tsx` is dead/unused, don't edit it
expecting it to matter, but it was kept in sync anyway), `mobile-drawer.tsx`,
`hero-slider.tsx`'s `SLIDE_ACCENTS`, `CheckoutClient.tsx`'s Razorpay theme
color, `layout.tsx`'s PWA `themeColor`, and `lib/utils.ts`'s
`JEWEL_TONE_PALETTE` (the `gemColorFor()` hash palette — its ruby/
emerald/sapphire/topaz entries are literal gem hues and were left alone;
only the plum/gold-derived entries changed).

**Homepage rebuilt to this order** (`app/(public)/page.tsx`):

1. `HeroSlider` — unchanged, per scope.
2. `FeaturedCategories` — rewritten from square image cards to a
   circular-icon row (scroll-snap on mobile, wrapped/centered from `lg:`)
   matching the mockup. Dropped the per-category piece-count text; the
   mockup doesn't show it and the circle format has no room for it.
3. `CollectionSplit` (new) — asymmetric 2-panel promo ("The Chaya
   Collection" + a single-category spotlight), pulling a real product
   image from the `necklaces`/`rings` categories via
   `getProductsByCategory()` where available, `GemImage` placeholder
   otherwise.
4. Bestsellers rail — kept, reworded heading to match the mockup's copy.
5. `CraftedForGenerations` (new) — editorial image+text split. Replaces
   `certification-trust-section.tsx` _on the homepage only_ — that file
   still exists with its BIS/IGI/925/COA trust-badge content, just no
   longer imported by `page.tsx`; it's a candidate to reuse on `/about`
   or elsewhere later, not deleted.
6. `TrustStrip` — rewritten to the mockup's 4 icons (Certified Quality /
   Timeless Designs / Beautifully Packed / Customer Love). The "Customer
   Love" rating is a **real computed average** of `getTestimonials()`
   ratings (passed in as a prop from `page.tsx`, not fetched twice) —
   not a hardcoded "4.9★" — so it's honest today (reflects the
   placeholder demo testimonials) and stays honest once real reviews
   replace them. `trust-marquee.tsx` (the scrolling ticker from the
   previous redesign) is no longer used anywhere — it wasn't in the
   mockup and didn't earn a place next to it.
7. `BridalGiftsSplit` (new) — 2-panel bridal + gifting promo.
8. `Testimonials` — kept. Not shown in the mockup, but not contradicted
   by it either, and real customer reviews are worth keeping; this was
   the one explicit carve-out when the user confirmed "match exactly."

**Dropped from the homepage** (files kept, just unimported — same
pattern as `rashi-finder.tsx`/`why-choose-us.tsx` already were):
`new-arrivals.tsx`, `how-it-works.tsx` (still rendered on `/about`,
don't touch that usage), the second "Bangles & Bracelets" `ProductRail`,
`consultation-cta.tsx`, `final-cta.tsx`, and the homepage FAQ
`Accordion` block (FAQs are still fully live at `/faqs`, just not
duplicated on the homepage).

**Footer** (`site-footer.tsx`, sitewide — not homepage-only, but shown
in the mockup and not in the hands-off list): added a newsletter capture
bar above the column grid, backed by a genuinely new, minimal feature —
`lib/models/newsletter-subscriber.ts` + `lib/actions/newsletter.actions.ts`
(`subscribeToNewsletter`, zod-validated, upsert-on-duplicate so a repeat
signup isn't an error) + `components/public/layout/newsletter-form.tsx`.
No admin UI to view subscribers yet — a real follow-up if this needs
managing later, not built here. Also reworded the footer's remaining
"independently certified Jewellery" / "Chat with a gemmologist" copy to
jewellery language, and added the brand tagline "More Than Jewellery, A
Part of Your Story" from the mockup. Did **not** add social icons
(Instagram/Facebook/YouTube/Pinterest, shown in the mockup) — there are
no real profile URLs anywhere in the codebase (`NAV_DATA.business` has
none) and linking decorative icons to nowhere or to guessed URLs would
be worse than omitting them; add them once real URLs exist.

**Still open, unchanged from earlier sessions:** the sitewide `<meta>`
title/description/keywords in `app/layout.tsx` and the nav's "Gemstone
Guides" label are still gemstone-flavored — same reasoning as before,
still needs the user's input on product taxonomy rather than a guess.

**Verification:** `tsc --noEmit`, `eslint`, and a full `npm run build`
all clean; fetched the live dev server's rendered `/`, `/about`,
`/products` and `/admin/login` after a full cache-cleared restart to
confirm the new sections render, the removed sections are actually gone
from the page body, and the new color tokens reach real markup
(`bg-plum-900`/`bg-plum-950`/`text-gold-700` counts checked, not just
compiled).

## 2026-09-17 flat design: every corner radius is now 0

User wants a flat (square-cornered) look sitewide instead of rounded
cards/buttons/inputs. Done as a token-level flip, not a per-component
sweep, since `--radius-xs/sm/md/lg/xl/2xl` were already a real design
token scale in `app/globals.css` (see "Brand color system" above — same
one-file-edit principle already established for color):

- `app/globals.css` `@theme`: `--radius`, `--radius-xs` through
  `--radius-2xl`, and `--radius-3xl` are all now `0px`. Tokens are kept
  (not deleted) so `rounded-md` etc. still compile everywhere they're
  used — they just resolve to zero. `--radius` and `--radius-3xl` are
  Tailwind's own built-in scale steps that this project had never
  customized before (only xs–2xl had project-specific values); both are
  overridden now too so the bare `rounded` and `rounded-3xl` utilities
  go flat as well, not just the six that were already tokenized.
  Confirmed in the actual compiled CSS output (not just source), all
  seven resolve to `0px`.
- The scrollbar-thumb `border-radius: 10px` in the same file's
  `::-webkit-scrollbar-thumb` rule was hardcoded outside the token scale
  — set to `0` directly.
- `rounded-full` (pills, circular avatars/category icons, round buttons)
  is a **fixed Tailwind keyword outside the `--radius-*` scale entirely**
  (always `9999px`, not driven by any theme variable) — zeroing the
  tokens above does not touch it. Swept literally: every `rounded-full`
  in `app/` and `components/` (119 occurrences across 66 files) replaced
  with `rounded-none`. Three arbitrary-value radii (`rounded-[2px]`,
  `rounded-[0.5rem]`, `rounded-[0.3rem]`) were replaced the same way —
  arbitrary values also bypass the theme scale.
- **If you add new UI**, don't reach for `rounded-full` or an arbitrary
  `rounded-[...]` value expecting the flat theme to catch it — it won't.
  Use the tokenized classes (`rounded-md`, etc.) so a future radius
  change (partial revert, a different corner treatment) stays a
  one-file edit; if a genuinely circular shape is unavoidable, that's
  the one case `rounded-full` is still the right tool, but it will
  render as a filled square/pill corner today, not a circle, and
  needs deliberately re-adding `rounded-full` back for that call site.

**Verification:** `tsc --noEmit` and `eslint` clean across the whole
`app`/`components`/`lib` tree; full `npm run build` clean; fetched the
live dev server's homepage and its compiled CSS chunk directly and
confirmed all seven `--radius-*` custom properties equal `0px` in the
actual served stylesheet, and that no `rounded-full` string remains in
the rendered homepage HTML.

## 2026-09-17 fix: admin edits took up to 60s to reach the public site

User wanted admin panel changes to reach the public storefront almost
immediately ("within 2 seconds"). Root cause: every public data read
(`product-service.ts`, `category-service.ts`, `content-service.ts`,
`cms.actions.ts`'s `getCachedHeroSections`) is wrapped in `unstable_cache`
with `tags: [...]` and `revalidate: 60`. **Every** mutating admin action
across the whole codebase (`grep -c revalidateTag lib/actions/*.ts`) only
ever called `revalidatePath('/admin/...')` — zero calls to
`revalidateTag`/`updateTag`, anywhere, before this fix. `revalidatePath`
tells Next "re-render this route on next request," but the `unstable_cache`
data calls _inside_ that re-render are a separate cache layer keyed by
their own tag + revalidate window — without busting that tag too, the
route recomputes but still reads the stale cached data until its own 60s
window naturally lapses. So admin saves were never technically broken,
just slow by design (up to 60s), regardless of how many admin paths got
revalidated.

**Next.js 16 API change to know about** (this project's `next` is
`^16.3.5` — see the "This is NOT the Next.js you know" block at the
bottom of this file): `revalidateTag` was restructured and **now requires
a second argument** (`revalidateTag(tag, 'max' | {expire})`) —
`tsc` catches the old one-argument call as a hard type error, it doesn't
silently work. More importantly, `revalidateTag('tag', 'max')` gives
**stale-while-revalidate** semantics (the very next request can still
see old data while a background refresh runs) — wrong for "the admin
should see their own change immediately." The bundled docs
(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/updateTag.md`)
point to the actual right tool: **`updateTag(tag)`**, new in this
version, single-argument, callable _only_ from Server Actions, built
specifically for read-your-own-writes — "the next request will wait to
fetch fresh data rather than serving stale content." Every action touched
here is invoked directly from an admin form as a Server Action, so
`updateTag` applies uniformly; don't reach for `revalidateTag` in this
codebase unless the caller is a Route Handler or webhook, where
`updateTag` isn't available.

**Fix — added `updateTag(...)` calls matching each service's existing
tag, right after the existing `revalidatePath` calls (kept, they still
serve the admin-side pages):**

- `lib/actions/product.actions.ts` — `updateTag('products')` in
  `createProduct`, `updateProduct`, `deleteProduct`, `createVariant`,
  `updateVariant`, `deleteVariant` (all 6 mutating functions).
- `lib/actions/category.actions.ts` — `updateTag('categories')` **and**
  `updateTag('products')` in `createCategory`/`updateCategory`/
  `deleteCategory` (product listings embed category name/slug, so a
  category rename needs both busted).
- `lib/actions/cms.actions.ts` — `updateTag('content')` in
  `createHeroSection`, `updateHeroSection`, `deleteHeroSection`,
  `reorderHeroSections` (`getCachedHeroSections` shares the `'content'`
  tag with `content-service.ts`'s FAQ/testimonial/policy reads).
- `lib/actions/inventory.actions.ts` — `updateTag('products')` in
  `updateStockLevel`, since a manual stock adjustment changes the public
  in-stock/low-stock/sold-out badge, not just admin-side numbers.
- **Not touched:** FAQs/testimonials/policies have no admin CRUD UI at
  all yet (confirmed by grep — nothing in `lib/actions` or
  `components/admin` imports those models), so there's no mutation path
  to fix there; if that admin UI gets built later, its actions need
  `updateTag('content')` too. `settings.actions.ts`'s `getSettings()`
  isn't wrapped in `unstable_cache` at all — its existing
  `revalidatePath('/', 'layout')` is already sufficient, nothing to add.
  Checkout/webhook-driven inventory changes (`lib/inventory.ts`'s
  `reserveInventory`/`finalizeInventory`/`releaseInventory`) were left
  alone — out of scope (the user asked about admin panel edits
  specifically), and `updateTag` isn't callable from the Razorpay webhook
  route handler anyway (`revalidateTag(tag, {expire: 0})` would be the
  Route Handler equivalent if this is ever needed there).

This is a caching/data-layer fix with no UI surface — "with proper
responsive" from the request doesn't apply here; nothing visual changed.

**Verification:** `tsc --noEmit` (this is what actually caught the
`revalidateTag` two-argument signature change — trust the compiler over
memory of older Next.js APIs on this project), `eslint`, and a full
`npm run build` all clean. Did not fabricate a live browser click-through
test (no headless browser tool available in this environment, and
`updateTag`/`revalidateTag` can only be exercised inside a real Next.js
server-action request — not from a standalone script) — verified the
fix is the officially-documented correct API for this exact scenario
instead, via the docs bundled in `node_modules/next/dist/docs`. If you
touch this again, `node -e` scripts calling these functions directly will
throw ("`updateTag` can only be called from within a Server Action") —
that's expected, not a bug in the function.

## 2026-09-17 customer login (`/login`) redesigned to match `/admin/login`

User asked for the admin login page's design applied to the customer
login page. `app/(public)/login/page.tsx` was a single centered card
(`bg-plum-50`, gold button); rebuilt to mirror `app/(admin)/admin/login`'s
structure: a desktop-only left brand image panel (`lg:w-[44%]`) next to
the form, mobile-only branding above the form on small screens, an
icon-prefixed input style (`Mail`/`Lock` glyphs, inline show/hide-password
toggle), and a "Keep me signed in" checkbox for visual parity — same as
the admin page, this checkbox isn't wired to any actual longer-session
logic (`grep rememberMe lib/authOptions.ts` — nothing), it's cosmetic on
both pages, not something this session added or fixed.

**Deliberately used the site's own tokens/components instead of copying
the admin page's raw values** — this was "apply this design," not
"duplicate this markup byte-for-byte":

- Real `<Logo />` component for the mobile branding block, not the admin
  page's generic gem-icon placeholder.
- `buttonStyles({ size: "lg", full: true })` (gold, shine-sweep, the same
  primary button every other customer page uses) instead of the admin
  page's dark-plum submit button — a customer-facing page should keep
  the storefront's own established button language, not the admin
  panel's separate one.
- Semantic `danger-*`/`ivory-*` tokens for the error banner and input
  borders, instead of the admin page's raw untokenized `rose-*`/`gray-*`
  Tailwind defaults (a pre-existing inconsistency on the admin page
  itself, not replicated here).
- Brand image: reused `/images/admin-login.png` initially (generic Chaya
  marketing imagery, no admin-specific text) — **the user then swapped
  it to their own `/images/login-page.png` while this session was still
  running**; left that edit in place, don't revert it.

**Bug fixed in passing:** the old login page's `onSubmit` ignored any
`?callbackUrl=` query param and always redirected to
`/account/dashboard` after signing in — so a customer bounced here by
`proxy.ts` from a protected `/account/*` deep link would land on the
dashboard instead of back where they were headed. Now reads
`useSearchParams().get('callbackUrl')` and only follows it if it's a
same-site relative path (starts with `/`), else falls back to the
dashboard. Per the codebase's existing convention for client pages
using `useSearchParams()` (see `app/(public)/search/page.tsx`), the
component reading it is wrapped in `<Suspense>` — a bare top-level
`useSearchParams()` call in a page component is a Next.js build-time
foot-gun otherwise.

**Found, not fixed (pre-existing, out of scope):** the "Forgot
password?" link on both the old and new customer login page points to
`/forgot-password`, which doesn't exist as a route yet (only
`/admin/forgot-password` does) — confirmed by listing
`app/(public)/*` directories. Building the customer-facing forgot-
password flow (token email, reset page) is a separate feature, not a
redesign task; flagging it here rather than silently building it or
silently leaving the link looking functional when it 404s.

**Environment note for next time:** running `npm run build` while
`npm run dev` is also running against the same `.next` directory
corrupts Turbopack's cache and produces confusing, code-unrelated
failures (`Persisting failed during shutdown: Unable to write SST
file...`, then on retry a `ChunkLoadError`/`MODULE_NOT_FOUND` for an
unrelated route). Neither was a real bug — stopping the dev server,
`rm -rf .next`, and rebuilding produced a clean build immediately. If a
build fails with a filesystem/chunk error that doesn't point at your
actual change, check for a concurrent `dev` process on port 3000 before
assuming the code is broken.

## 2026-09-18 payment gateway: Razorpay → Cashfree

User added real Cashfree sandbox credentials (`CASHFREE_APP_ID`/
`CASHFREE_SECRET_KEY` in `.env.local`) and asked for payment integration.
Found first: the existing Razorpay integration was **never actually
functional** — `RAZORPAY_*` env vars were all commented out (falling back
to `"rzp_test_dummy"` client-side), and independently of that, its webhook
(`app/api/webhooks/razorpay/route.ts`) looked up
`Order.findOne({ razorpayOrderId })` and later assigned
`order.paymentStatus = "COMPLETED"` — **neither `razorpayOrderId` nor
`"COMPLETED"` ever existed** on the `Order` schema (`paymentStatus` enum
is `['PENDING','CONFIRMED','FAILED']`), so even with real keys the webhook
could never have found an order or saved successfully. Given that, and
the user's explicit choice, Razorpay was fully retired rather than kept
alongside Cashfree — see "Deleted" below.

**Verified against Cashfree's real sandbox API before calling this
done**, not just compiled: `POST https://sandbox.cashfree.com/pg/orders`
with the user's actual test credentials, from a throwaway script outside
Next.js, returned a real `200` with a `payment_session_id` — confirms the
API version, headers and payload shape are actually correct, not just
docs-plausible. Also confirmed the webhook route 400s on both a missing
and an invalid `x-webhook-signature` (fails closed).

**New:**

- `lib/services/cashfree.ts` — `createCashfreeOrder()` (raw `fetch`, no
  SDK dependency — Cashfree's Orders API is simple enough that adding a
  server-side SDK package felt like unnecessary dependency risk, see the
  2026-09-14 nodemailer/next-auth ERESOLVE entry above for why that risk
  is not hypothetical on this project) and
  `verifyCashfreeWebhookSignature()` (`base64(HMAC-SHA256(secretKey,
timestamp + rawBody))`, constant-time compare). Sandbox vs production
  base URL is derived from whether `CASHFREE_APP_ID` starts with `"TEST"`
  (Cashfree's own convention) rather than a separate env flag that could
  be left pointing the wrong way after a key rotation. API version pinned
  to `2023-08-01` (a long-stable, well-documented version — verified
  working against the real sandbox above).
- `app/api/webhooks/cashfree/route.ts` — verifies the signature (fails
  closed — `503` if `CASHFREE_SECRET_KEY` is unset, matching the fail-
  closed fix the Razorpay webhook had received previously), then on
  `PAYMENT_SUCCESS_WEBHOOK` checks `data.payment.payment_status ===
"SUCCESS"` **and** that `data.order.order_amount` matches `order.total`
  (same amount-integrity rule the old Razorpay webhook had — a valid
  signature only proves the event came from Cashfree, not that the paid
  amount matches this specific order) before marking the order
  `CONFIRMED` and calling `finalizeInventory` inside a transaction, same
  pattern as before. `PAYMENT_FAILED_WEBHOOK`/`PAYMENT_USER_DROPPED_WEBHOOK`
  mark `paymentStatus: 'FAILED'` but deliberately leave `orderStatus:
'PAYMENT_PENDING'` alone — the existing `release-inventory` cron
  filters only on `orderStatus`, so it still sweeps and frees the stock
  after 30 minutes without this route needing to duplicate that logic.
- **`Order.findOne({ orderNumber })` is the webhook's lookup** — no new
  gateway-order-id field needed for that, because `createCashfreePaymentSession`
  (in `checkout.actions.ts`) sends Cashfree our own `orderNumber` AS
  their `order_id` in the first place. This is the fix for the exact
  class of bug that silently broke the Razorpay webhook (a lookup field
  that was never actually persisted) — don't reintroduce a separate
  "gateway's order id" field as the primary lookup key if you touch this
  again; keep `orderNumber` as the one shared identifier.
  `gatewayOrderId`/`gatewayPaymentId` (new, optional, on `Order`) are
  populated by the webhook purely for admin-side support/reconciliation
  display (`app/(admin)/admin/orders/[id]/page.tsx`, which used to read
  the never-populated `order.razorpayPaymentId` — fixed to read
  `gatewayPaymentId`) — never used for lookups.
- `createCashfreePaymentSession(orderNumber)` (`checkout.actions.ts`) —
  re-fetches the order server-side and prices the Cashfree order from
  `order.total`, never a client-submitted amount, same rule
  `resolveOrderItems()`'s doc-comment already established for cart line
  prices in this file.
- `getOrderStatusSummary(orderNumber)` (`checkout.actions.ts`) — minimal
  fields only (no address/items/contact info), used by the now-dynamic
  `/checkout/success` page, which **no longer assumes success on arrival**
  for gateway orders: Cashfree's `return_url` redirect is client-
  controlled and not proof of payment, so the page looks up the order's
  real `paymentStatus` (set by the webhook) and renders success/pending/
  failed accordingly. COD/Bank Transfer orders still show success
  immediately — no gateway involved, the order itself is the
  confirmation, same as before. A pending order auto-refreshes itself
  (`PendingPaymentRefresh.tsx`, `router.refresh()` every 5s, capped at 10
  tries) since the webhook typically lands a few seconds after redirect.
- `types/cashfree-js.d.ts` — `@cashfreepayments/cashfree-js` ships no
  type declarations; hand-written, narrow ambient types covering only
  `load()`/`checkout()`, the only surface used.
- `CheckoutClient.tsx` — swapped the Razorpay `checkout.js` CDN
  script-tag + `window.Razorpay` modal flow for the npm package
  `@cashfreepayments/cashfree-js`'s `load()`/`checkout()`
  (`redirectTarget: "_self"` — a full-page redirect to Cashfree's hosted
  checkout, not a modal; some payment methods there, e.g. netbanking,
  need the full page and don't work reliably inside an iframe/modal).
  `placeOrder()` now always runs first regardless of payment method
  (previously only for COD/Bank Transfer) — Cashfree needs a real,
  already-created order to attach a payment session to.

**Deleted (superseded, not left as dead code — these are internet-
reachable route files and an unused dependency, a different risk profile
than unused UI components elsewhere in this codebase):**

- `app/api/webhooks/razorpay/route.ts` — broken as described above, and
  Razorpay was never configured with real keys or webhooks in any actual
  Razorpay dashboard.
- `app/api/webhooks/payment/route.ts` and `lib/services/payment.ts` —
  were _already_ marked "DEAD CODE, candidate for deletion" by a prior
  pass (unfinished generic gateway stub, `verifyWebhookSignature` always
  returned `true`); squarely in scope now, so cleaned up rather than
  left cluttering the same problem space as the real integration.
- `razorpay` npm dependency (`createRazorpayOrder`/`verifyRazorpaySignature`
  in `checkout.actions.ts` had zero remaining callers after the above).

**Not done:** no `Payment` model documents are created by the webhook —
matches the prior Razorpay webhook's behavior (it only ever updated
`Order`, never created a `lib/models/payment.ts` record either), not a
new gap introduced here. Admin-side payment reconciliation still reads
`Order.gatewayPaymentId` directly, not a `Payment` collection.

**Environment note:** Cashfree's `notify_url` (webhook) must be a
publicly reachable URL — it cannot reach `http://localhost:3000` in
local dev. Testing the actual webhook delivery (not just order creation)
needs a tunnel (ngrok or similar) pointed at the dev server, or testing
against a deployed environment.

**Verification:** `tsc --noEmit`, `eslint`, and a full `npm run build`
all clean (one transient Google Fonts fetch failure on the first build
attempt, unrelated to this change — resolved on retry). Confirmed live
against the real Cashfree sandbox (see above) and confirmed the webhook
route 400s on missing/invalid signatures. Did not fabricate an end-to-end
browser payment test — no headless browser tool in this environment, and
a real webhook can't reach local dev without a tunnel (see above); the
order-creation half is verified for real, the webhook half is verified
by code review + signature-rejection behavior, not a live payment.

## 2026-09-18 fix: checkout failed for every first-time customer (`addresses.0.zip`/`street1`/`phone`/`name` required)

Real, order-breaking bug, not related to the Cashfree work above (same
day, separate issue): **any checkout where the customer's phone number
had no existing `Customer` record, or an existing one with zero saved
addresses, failed outright** — `placeOrder` (`checkout.actions.ts`)
threw a Mongoose validation error and rolled back the _entire_
transaction (order included, not just the customer update), because
step 4 pushed `data.shippingAddress` straight into `customer.addresses`.

Root cause: two different address shapes that look similar but aren't.
`shippingAddress` as built in `CheckoutClient.tsx` uses `street`/
`apartment`/`pincode` and has no `name`/`phone` at all — fine for
`Order.shippingAddress`/`billingAddress`, which are schemaless
`type: Object` fields. But `Customer.addresses` (`lib/models/customer.ts`)
is a _strict_ sub-schema requiring `name`, `phone`, `street1`, `zip` —
confirmed by reproducing the exact reported error message against the
real schema before touching any code, not just reasoning about it
(`CheckoutClient.tsx` itself already knew the correct shape — it reads
`customer.addresses[0].street1`/`.zip` correctly when _pre-filling_ the
form for a returning customer; only the _write_ side going into
`Customer.addresses` was wrong).

**Fix:** `placeOrder` now builds a separate `customerAddress` object
mapped to what the `Customer.addresses` sub-schema actually requires
(`name`/`phone` from the order's own `customerName`/`phone`, `street1`
from `.street`, `zip` from `.pincode`, etc.) and uses _that_ wherever an
address gets pushed onto `customer.addresses` — the `Order` document's
own `shippingAddress`/`billingAddress` fields are untouched (still the
original free-form shape every admin/account order view already reads).
Deliberately fixed at this one mapping point rather than changing
`CheckoutClient.tsx`'s field names to match the Customer schema — that
would have meant auditing and updating every other place that already
reads `.street`/`.pincode`/`.apartment` off an order's stored address
(admin order detail, account order history, shipment labels, etc.).

**Verification:** reproduced the user's exact error message character-
for-character against the real `Customer`/`AddressSchema` definitions
(a throwaway script, not the actual model files, to avoid needing
ts-node) before fixing anything, then confirmed the new mapped shape
passes validation cleanly. `tsc --noEmit`, `eslint`, and a full
`npm run build` all clean (one transient Google Fonts fetch failure on
first attempt again, same as the Cashfree entry above — resolved on
retry; if you hit this exact font error, just retry the build before
assuming your change broke something).

## 2026-09-18 fix: checkout failed client-side with a generic error — CSP was never updated for Cashfree

Follow-on from the same day's Cashfree integration above. After the
customer-address fix, checkout got further but still failed with a bare
"An unexpected error occurred" toast — and the `catch` in
`CheckoutClient.tsx` that produced it didn't even log the real error
(`catch { ... }`, no error binding), so there was nothing to read.

**Found by reproducing, not guessing:** checked the live database first
— three real orders existed (`ORD-2026-0001..0003`), all
`paymentStatus: PENDING`, proving `placeOrder` was succeeding. Then
replayed `createCashfreePaymentSession`'s exact request against the real
Cashfree sandbox for the most recent order and got back `409
order_already_exists` — meaning **Cashfree already had that order_id
registered**, which only happens if the user's own earlier attempt had
already successfully created the Cashfree order server-side. So the
failure had to be _after_ that point — client-side, in the SDK hand-off,
not in any of the code reviewed/tested when the integration was built.

**Root cause:** the exact same class of bug as the 2026-09-15
`img-src`/`blob:` CSP entry (see above) — `next.config.ts`'s CSP was
written for Razorpay and **never updated** when Cashfree replaced it
earlier the same day. `@cashfreepayments/cashfree-js`'s `load()`
dynamically injects `<script src="https://sdk.cashfree.com/js/v3/cashfree.js">`
at runtime (confirmed by grepping the actual installed package —
`node_modules/@cashfreepayments/cashfree-js/dist/script.js`, not
assumed from docs) — a domain nowhere in `script-src`. The browser
silently blocked it; no console-visible link back to `next.config.ts`,
which is exactly why it needed the database/API reproduction above
instead of being obvious from a stack trace.

**Fix:**

- `next.config.ts` — replaced every leftover Razorpay-only CSP entry
  (`script-src`, `img-src`, `connect-src`, `frame-src`) with
  `https://*.cashfree.com`. Used the wildcard rather than enumerating
  `sdk.cashfree.com` alone because Cashfree's checkout hand-off likely
  also touches their API/checkout-page subdomains (api.cashfree.com,
  sandbox.cashfree.com, payment pages) that weren't independently
  confirmed the way the script URL was — if you tighten this later,
  verify each subdomain against a real checkout attempt first, the same
  way the script URL was confirmed here.
- `CheckoutClient.tsx`'s catch block now does `console.error("Checkout
failed:", error)` before the toast. **This should have existed from
  the start** — the bare `catch { }` this replaced is why this bug took
  a database query and a replayed API call to find instead of five
  seconds of reading the browser console. Don't reintroduce a
  swallowed-error catch block in a payment flow.

**Lesson for next time a third-party client-side SDK is added to this
project:** grep the actual installed package for hardcoded URLs
(`grep -oE "https?://[^\"' ]+"` on its dist file) and add them to
`next.config.ts`'s CSP in the _same change_ that adds the SDK — don't
treat it as a follow-up. This is now the second time in one project a
new third-party script silently broke on CSP with no helpful error
message.

**Verification:** confirmed live via `curl -I` that the served CSP
header now includes `https://*.cashfree.com` in all four directives.
`tsc --noEmit`, `eslint`, and a full `npm run build` all clean.

## 2026-09-19 customer account isolation, order history & pending payment reconciliation

User reported cross-account data leakage in the customer portal (a new user
account could see orders placed by another customer) and Cashfree orders
remaining in `PAYMENT PENDING` status on the dashboard despite successful
payment completion.

**Root cause:**

- `app/(public)/account/dashboard/page.tsx` and `app/(public)/account/orders/page.tsx`
  had queries that fell back loosely to phone number or unconstrained customer
  lookups when email or user IDs were ambiguous. Because guest orders or multiple
  test users often used the same dummy phone number, customer records merged or
  cross-read orders.
- Orders placed via online gateway redirect were only finalized if the webhook
  landed immediately; if a user navigated directly to the dashboard, their
  order stayed in `PENDING` until a manual sync.

**Fix:**

- **Strict identity scoping:** `dashboard/page.tsx` and `orders/page.tsx` now
  strictly filter orders by authenticated user identity only:
  `{ userId: new mongoose.Types.ObjectId(userId) }` and `{ email: userEmail }`.
  Never match or scope customer data by phone number alone.
- **Customer profile auto-linking:** On account page access, if a customer
  record does not exist for the authenticated user, it is created and linked
  bidirectionally (`Customer.userId = user._id` and `User.customerProfileId = customer._id`).
  If a customer record exists with matching email, `userId` is patched to link it.
- **Real-time Cashfree order reconciliation:** On loading `orders` or `dashboard`,
  any orders for that user in `paymentStatus: "PENDING"` (excluding COD / Bank
  Transfer) immediately invoke `finalizeCashfreePayment(orderNumber)` to poll
  Cashfree's API and update the database, instantly reflecting `PAID` / `CONFIRMED`.
- **Honest metrics computation:** Dashboard metrics (`totalOrders` and `totalSpend`)
  are recalculated on the fly from the user's actual isolated orders rather than
  trusting stale or unlinked counter fields.
- **Account sidebar active states:** Corrected active navlink class logic in the
  account dashboard layout sidebar so current subpage is accurately highlighted.

## 2026-09-19 admin vs customer session separation in navbar & bottom navigation

User noticed that while logged in as an Admin, clicking the user icon in the
storefront navbar navigated to the admin login/portal instead of providing
customer-facing access.

**Fix:**

- `components/public/layout/user-nav.tsx`: Replaced direct link with a smart,
  accessible dropdown when a session exists:
  - Displays authenticated user's name.
  - Provides a direct link to "Customer Dashboard" (`/account/dashboard`).
  - If the session role is administrative (`SUPER_ADMIN`, `CONTENT_MANAGER`,
    `LEAD_MANAGER`), displays an "Admin Portal" link (`/admin`).
  - Built-in accessible sign-out action.
- `components/public/layout/bottom-nav.tsx`:
  - Updated the Account tab to route dynamically to `/account/dashboard` if a
    session is active, and `/login` when unauthenticated.
  - Fixed initial homepage path (`/`) active tab highlighting bug so the "Home"
    icon is correctly active on the root URL.

## 2026-09-19 UX: product slug breadcrumbs restored & sitewide responsive BackButton

User reported that on product slug pages (`/products/[slug]`), breadcrumb
navigation was missing, and requested adding responsive Back buttons across
all website pages.

**Fix:**

- `app/(public)/products/[slug]/page.tsx`: `<Breadcrumbs />` was commented out
  in JSX. Restored the full breadcrumb hierarchy:
  `Home` > `Products` > `Category` (e.g. Rings, Necklaces) > `Product Name`.
- `components/public/ui/back-button.tsx` (new): Client component using Next.js
  `useRouter()`. Intelligently performs `window.history.length > 1 ? router.back() : router.push(fallbackHref)`.
  Features luxury styling adhering to Chaya theme tokens (`plum-*`, `gold-*`),
  smooth hover micro-animation (arrow translates left on hover: `group-hover:-translate-x-1`),
  active tactile feedback (`active:scale-95`), responsive touch targets (40-44px min),
  and supports an `onDark` variant for dark header surfaces.
- `components/public/ui/page-header.tsx`: Added `showBack`, `backHref`, `backLabel`
  props. Equips all public pages utilizing `PageHeader` with Back navigation
  beside breadcrumbs: Catalogue (`/products`), Cart (`/cart` -> "Continue Shopping"),
  Checkout (`/checkout` -> "Back to Cart"), Contact, Search, Track Order, About,
  FAQs, Testimonials, and Policy pages.
- Added custom Back buttons to Account Dashboard, Orders, Addresses, Profile,
  Login, and Register pages.

## 2026-09-19 Google OAuth integration for customer registration & login

User provided `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
and requested Google OAuth login/registration support for customers.

**Data-layer & Auth changes:**

- `lib/models/user.ts`: Made `password` optional (`required: false`) on
  `UserSchema` so Google OAuth users can be created without validation errors.
  Added `googleId`, `image`, and `provider: { type: String, default: "credentials" }`.
- `lib/authOptions.ts`:
  - Dynamically registers `GoogleProvider` when `GOOGLE_CLIENT_ID` and
    `GOOGLE_CLIENT_SECRET` are set.
  - Configured `allowDangerousEmailAccountLinking: true` so customers who
    previously registered via email/password can sign in with Google seamlessly
    without getting blocked by `OAuthAccountNotLinked`.
  - Added `signIn` callback: Normalizes email (`toLowerCase().trim()`). If user
    does not exist, auto-provisions `User` (role `CUSTOMER`, status `ACTIVE`)
    and creates a linked `Customer` record; if user exists, links Google ID and
    profile picture and ensures `Customer.userId` association.
  - Added `jwt` & `session` callbacks: Crucial fix for MongoDB scoping — resolves
    the real MongoDB `_id` from the database for `token.id` and `session.user.id`
    rather than storing Google's raw numeric subject ID string, ensuring all
    downstream Mongo queries (`userId: new mongoose.Types.ObjectId(userId)`)
    on orders and saved addresses match properly.
  - Set `pages: { signIn: '/login', error: '/login' }` so OAuth redirects and
    errors land on customer `/login` instead of `/admin/login` (admin routes
    remain guarded independently by `proxy.ts`).
- `.env.local`: Added `NEXTAUTH_URL=http://localhost:3000` for accurate OAuth
  redirect URI resolution. Authorized redirect URI in Google Cloud Console is:
  `http://localhost:3000/api/auth/callback/google` (and production equivalent).

**UI Components:**

- `components/public/auth/google-sign-in-button.tsx` (new): Reusable Google
  button with official multi-color SVG icon, loading spinner state during redirect,
  responsive styling matching brand theme, and `callbackUrl` awareness.
- `app/(public)/register/page.tsx`: Added "Sign up with Google" button above the
  registration form with an "Or register with email" divider and OAuth error handling.
- `app/(public)/login/page.tsx`: Added "Continue with Google" button above the
  login form with an "Or continue with email" divider and OAuth error handling.

**Verification:** `npx tsc --noEmit` clean (0 errors across whole project);
full `npm run build` with Turbopack and static optimization completed cleanly
with all 36 routes and dynamic endpoints prerendered.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
