# Plan: Add a new Product Variant from an existing product's edit page

## Problem

There is currently no way to add a brand-new variant to a product once it
exists. Variants can only be created as part of `createProduct`'s initial
batch (`lib/actions/product.actions.ts`'s `formatVariants`), or edited one
at a time via `updateVariant`/`deleteVariant`. The standalone
`/admin/productvarients` screens only have `[id]/edit` and `[id]/view`
routes — no `create`. In `PricingVariantsTab.tsx`, the edit-mode branch
(`productId` present) is read-only: a table of existing variants plus a
"Manage Variants" link.

## Approach

Reuse the existing standalone-screen architecture (full media/discount/SEO
tabs in `VariantForm.tsx`) rather than building a second, separate
"quick add" mini-form inside the product edit page. This keeps one variant
UI instead of two, consistent with how editing already works.

## Steps

### 1. `createVariant` server action

File: `lib/actions/product.actions.ts`, placed near `updateVariant`/`deleteVariant`.

```ts
export async function createVariant(productId: string, data: any) {
  try {
    await checkAuth(["SUPER_ADMIN", "CONTENT_MANAGER"]);
    await dbConnect();

    const product = await Product.findById(productId).lean();
    if (!product) throw new Error("Product not found");

    const category = await Category.findById(product.category).lean();

    const existingCount = await ProductVariant.countDocuments({ productId });

    const catShort = generateShortname(category?.name || "Uncategorized");
    const prodShort = generateShortname(product.name);
    const baseSkuPrefix = `A1-${catShort}-${prodShort}`;
    const skuVariantType = category?.variantType || "NONE";
    const indexStr = String(existingCount + 1).padStart(3, "0");

    const name = buildVariantName({
      priceOnValue: !!category?.calculatePriceOnVariantValue,
      variantType: category?.variantType,
      variantValue: data.variantValue,
      enteredName: data.size,
      productName: product.name,
      optionIndex: existingCount + 1,
    });

    const session = await mongoose.startSession();
    session.startTransaction();
    let variant: any;
    try {
      const created = await ProductVariant.create(
        [
          {
            ...data,
            productId,
            categoryId: category?._id,
            name,
            sku: data.sku || `${baseSkuPrefix}-${skuVariantType}-${indexStr}`,
          },
        ],
        { session },
      );
      variant = created[0];

      if (existingCount >= 1) {
        // Second+ variant: this product is no longer single-SKU, so the
        // storefront's variant selector needs to turn on.
        await Product.findByIdAndUpdate(
          productId,
          { hasVariants: true },
          { session },
        );
      }

      await recalcProductStockStatus(productId, session); // from lib/inventory.ts
      await session.commitTransaction();
      session.endSession();
    } catch (txError) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }

    await logAuditAction({
      action: "PRODUCT_VARIANT_CREATED",
      entity: "Product",
      entityId: productId,
      metadata: { variantId: variant._id.toString() },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/productvarients");
    return { success: true, data: JSON.parse(JSON.stringify(variant)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

Notes:

- Import `recalcProductStockStatus` from `@/lib/inventory` (already exported,
  already takes a `mongoose.ClientSession` — no new stock-math needed).
- `buildVariantName` and `generateShortname` already exist in this file.
- SKU has no unique DB constraint (see `lib/models/product-variant.ts`), so
  `existingCount + 1` collisions after a delete are cosmetic only, matching
  the informality already accepted by `formatVariants`.

### 2. Extend `VariantForm.tsx` to support create mode

File: `components/admin/products/VariantForm.tsx`

- Add props: `productId: string` (new, required) and make the existing
  variant-loading prop optional so the form can mount with no variant yet.
- Import `createVariant` alongside the existing `updateVariant`.
- In the submit handler: if there's no `variantId`, call
  `createVariant(productId, values)`; on success, `router.push` to
  `/admin/productvarients/${newVariant._id}/edit` (not back to the list) —
  the image/discount/SEO tabs need a real `_id` to attach uploads to, so
  send the admin straight into editing the variant they just created.
- Default values for create mode: empty `name`/`size`, `price: 0`,
  `lowStockThreshold: 5`, `purchaseType: 'BUY_ENQUIRE'`, everything else
  matching the schema's existing defaults.
- Tabs/UI stay the same — this is additive, not a rewrite.

### 3. New route: create-variant page

File: `app/(admin)/admin/productvarients/create/page.tsx` (new)

```tsx
export default async function CreateVariantPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;
  if (!productId) return notFound();

  const productRes = await getProductById(productId); // already exists
  if (!productRes.success || !productRes.data) return notFound();

  return <VariantForm productId={productId} />;
}
```

Pass through whatever product-context header (name/breadcrumb) the
`[id]/edit` variant page already renders, so create/edit look consistent.

### 4. Wire up the entry point

File: `components/admin/products/ui/PricingVariantsTab.tsx`, in the
`productId` branch (around line 119-124, next to the existing
"Manage Variants" link):

```tsx
<a
  href={`/admin/productvarients/create?productId=${productId}`}
  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
>
  Add Variant
</a>
```

No client-side state sync needed — the product edit page is a server
component (`app/(admin)/admin/products/[id]/edit/page.tsx`) that re-fetches
`variants` via `getProductById` on every navigation, so the table picks up
the new variant automatically when the admin navigates back.

## Files touched

- `lib/actions/product.actions.ts` — add `createVariant`
- `components/admin/products/VariantForm.tsx` — add create mode
- `app/(admin)/admin/productvarients/create/page.tsx` — new file
- `components/admin/products/ui/PricingVariantsTab.tsx` — add "Add Variant" button

## Out of scope / follow-ups

- No bulk "add N variants" affordance on the edit-mode screen — that
  already exists for product _creation_ only (`PricingVariantsTab`'s
  non-`productId` branch); adding one variant at a time via the full
  `VariantForm` matches how editing already works.
- SKU numbering is best-effort (`existingCount + 1`), same as the rest of
  the codebase — not collision-proof against manual SKU edits or deletes,
  but that's the existing standard, not a regression.
