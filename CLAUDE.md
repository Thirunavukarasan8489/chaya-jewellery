# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # dev server, http://localhost:3000
npm run build   # production build (also the fastest way to type-check everything, incl. route files)
npm run start   # run a production build
npm run lint    # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit  # type-check only, no build output
```

Data scripts (require `MONGODB_URI` in `.env.local`, loaded via `@next/env`):

```bash
npm run seed                       # scripts/seed.js — creates SUPER_ADMIN users
                                    #   admin@chayajewellery.com / project@chayajewellery.com, pw "admin123"
npm run seed:catalog               # scripts/seed-catalog.js — demo categories/products/hero banners/
                                    #   testimonials/FAQs; every insert is lookup-guarded, safe to re-run
npm run migrate:variants           # scripts/migrate-variants.js
npm run migrate:category-flags     # scripts/migrate-category-variant-flags.js
```

**There is no test suite** — no Jest/Vitest/Playwright config and no `*.test.*` files exist anywhere in
the repo, and there's no `test` script in `package.json`. Don't assume one and don't invent a test
command; verify changes with `npm run build` / `tsc --noEmit` plus manual/browser checks (the `run` skill
can drive the dev server for you).

Required env vars (see `lib/db.ts`, `lib/authOptions.ts`, `lib/services/*`, `proxy.ts`,
`app/api/webhooks/**`, `app/api/cron/**`):

```
MONGODB_URI
NEXTAUTH_SECRET
RAZORPAY_KEY_ID  RAZORPAY_KEY_SECRET  RAZORPAY_WEBHOOK_SECRET  PAYMENT_WEBHOOK_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
CLOUDINARY_CLOUD_NAME  CLOUDINARY_API_KEY  CLOUDINARY_API_SECRET
SMTP_HOST  SMTP_PORT  SMTP_SECURE  SMTP_USER  SMTP_PASS  SMTP_FROM
CRON_SECRET                    # bearer-auth for app/api/cron/* (Vercel Cron)
NEXT_PUBLIC_GA_ID
```

`NEXTAUTH_SECRET` and the Razorpay webhook secret both have hardcoded dev fallbacks in code
(`lib/authOptions.ts`, `proxy.ts`) — fine for local dev, but a deploy without them set is running on
those fallbacks silently.

## Architecture

### Route structure & auth gating

`app/` uses two parallel route groups sharing one Next.js app: `(public)/` (storefront + customer
`/account/*`) and `(admin)/admin/*` (staff panel). Auth/session gating for **both** happens in one place:
`proxy.ts` — this is Next.js 16's renamed `middleware.ts` convention, so don't go looking for a
`middleware.ts` file. It:

- Redirects unauthenticated requests to `/admin/*` (except the admin auth pages) to `/admin/login`,
  and unauthenticated `/account/*` to `/login`.
- Enforces role gates inline: only `SUPER_ADMIN` may reach `/admin/system` or `/admin/settings`; any of
  `SUPER_ADMIN`/`CONTENT_MANAGER`/`LEAD_MANAGER` may reach the rest of `/admin`; only `CUSTOMER` may
  reach `/account`.
- On **every** authenticated request outside the auth pages, calls `/api/auth/verify` to re-check the
  user still exists and is active, and clears the session cookie on failure — this is what makes a
  deactivated/deleted user's existing JWT stop working immediately instead of waiting for token expiry.
  If you touch this flow, preserve the auth-page skip; removing it reintroduces the self-redirect loop
  described in the code comment.

Server-side, every mutating server action re-checks role via a local `checkAuth(allowedRoles)` helper
(see `lib/actions/product.actions.ts`) that reads `getSession()` (`lib/auth.ts`, wraps
`getServerSession(authOptions)`) — the proxy gate is not the only enforcement layer, actions are not
automatically safe just because a route is reachable.

### Data layer: Mongoose models vs. `lib/types.ts` public shapes

`lib/models/*.ts` are the Mongoose schemas (DB truth). `lib/types.ts` defines a separate, admin-panel-style
public domain model consumed by the storefront. `lib/services/product-service.ts` (`mapToPublicProduct`)
is the translation boundary between them — when adding a product field, it usually needs to be threaded
through the Mongoose schema, this mapper, and `lib/types.ts`, not just one of the three.

**Known enum mismatch across that boundary, by design — don't "fix" one side in isolation:**
`purchaseType` is stored in Mongo (`lib/models/product.ts`, `product-variant.ts`) and edited in the admin
forms as `'ENQUIRE_ONLY' | 'BUY_ONLY' | 'BUY_ENQUIRE'`, but the public storefront type (`lib/types.ts`,
`lib/config/purchaseTypeConfig.ts`) uses `'ENQUIRY_ONLY' | 'BUY_ONLY' | 'BUY_AND_ENQUIRE'`.
`mapToPublicProduct` is the only place that translates between them. If you add a purchase-type check,
match it to which side of the boundary you're on (admin form/DB vs. storefront), and don't assume the
strings are interchangeable.

Validation: `lib/validations/*.schema.ts` (zod, one file per domain — `product.schema.ts`,
`order.schema.ts`, etc.) is the schema-per-action-file pattern most server actions import. `lib/schemas.ts`
is older and narrower in scope — only the checkout flow (`AddressSchema`, `CheckoutSchema`, …) still uses
it; put new validation in `lib/validations/`, not there.

### Server actions (`lib/actions/*.ts`)

All are `'use server'` files, one per domain (`product.actions.ts`, `order.actions.ts`,
`inventory.actions.ts`, `lead.actions.ts`, …), each starting with a local `checkAuth()`/role check where
the action is admin-only. Mutations that touch inventory or money wrap the write in a Mongoose
`session.startTransaction()` (see `placeOrder` in `checkout.actions.ts`) — follow that pattern for any
new action that changes stock or order/payment state, since a partial write here leaves stock and order
records inconsistent.

### Inventory model — reserve → finalize/release, never touch `stock`/`reservedQuantity` directly

`lib/inventory.ts` is the only place that should mutate a `ProductVariant`'s `stock`/`reservedQuantity`.
Available quantity is always derived (`stock - reservedQuantity`), never stored:

- `reserveInventory` — called from `placeOrder` when an order is created (`orderStatus: PAYMENT_PENDING`);
  increments `reservedQuantity`.
- `finalizeInventory` — called from the Razorpay webhook (`app/api/webhooks/razorpay/route.ts`) on
  `payment.captured`; decrements both `stock` and `reservedQuantity` (the sale is now real).
- `releaseInventory` — called from `app/api/cron/release-inventory` (a Vercel Cron hitting this route with
  `CRON_SECRET`), which cancels any order still `PAYMENT_PENDING` after 30 minutes and gives the stock
  back.
- `restockInventory` — used for cancellations/returns after a sale finalized.

Every one of these functions **requires** an active `mongoose.ClientSession` and must be called inside a
transaction alongside the corresponding `Order`/`Product` write — they call
`recalcProductStockStatus` internally, which re-derives the parent `Product.stockStatus`
(`IN_STOCK`/`LOW_STOCK`/`OUT_OF_STOCK`) from the sum of its variants, so calling them outside the same
transaction as the order state change can leave stock status and order status looking at different
versions of the data.

### Product/variant relationship

Every `Product` has one or more `ProductVariant` documents (standalone collection, `productId` FK) — even
a single-SKU product stores its price/stock on exactly one variant document; `Product.hasVariants` only
toggles whether the storefront shows a variant selector, it doesn't mean "no variant document exists."
`lib/inventory.ts`'s `resolveVariant()` falls back to "the product's only variant" when no `variantId` is
given, which is what makes single-SKU add-to-cart/checkout work without the UI ever picking a variant.

### Payments & order lifecycle

Razorpay is the only payment provider. Order status flow (`lib/config/statusMaps.ts` documents the full
`nextAllowed` transition table): `PAYMENT_PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED →
OUT_FOR_DELIVERY → DELIVERED`, with `CANCELLED`/`DELIVERY_FAILED`/`RETURNED` as side branches. Payment
confirmation arrives async via `app/api/webhooks/razorpay/route.ts` (HMAC-verified against
`RAZORPAY_WEBHOOK_SECRET`), not synchronously from the checkout request — don't assume `placeOrder`
returning success means the order is paid.

### Leads/CRM

Separate from orders: `ENQUIRY_ONLY`/enquiry-enabled products feed `lib/models/lead.ts` via
`lib/actions/lead.actions.ts` / `admin-leads.ts`, with its own status pipeline in
`lib/config/statusMaps.ts` (`leadStatusConfig`: `NEW → CONTACTED → FOLLOW_UP → QUALIFIED → CONVERTED`,
plus `CLOSED`/`SPAM`). This is the CRM side of the `LEAD_MANAGER` role.

### Cart: `localStorage` is the source of truth, not the DB

`components/public/cart/cart-provider.tsx` keeps cart lines in `localStorage`
(`chayajewellery.cart.v1`) — that's what the UI reads/writes on every add/remove/quantity change.
On changes it also fires `syncCart` (`lib/actions/cart.actions.ts`), which mirrors the lines into a
`TemporaryCart` Mongo document (`lib/models/cart.ts`, keyed by a client-generated `sessionId`, 24h TTL
index) — but that Mongo copy is used for exactly one thing: `validateCart` re-checks stock/status
against it right before checkout. `placeOrder` (`lib/actions/checkout.actions.ts`) does **not** read
`TemporaryCart` — it takes the `items` array the client submits directly (straight off `localStorage`
state) and recomputes `subtotal`/`shippingFee`/`tax`/`total` server-side from those items. So if you
change cart line shape, update `CartLine` (`lib/types.ts`), the `syncCart` mapper, and the `items` shape
`placeOrder` expects — they're three independent call sites, not one.
