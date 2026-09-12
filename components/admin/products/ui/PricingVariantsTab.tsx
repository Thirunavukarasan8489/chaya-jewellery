'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Layers, X, Plus, Trash2 } from 'lucide-react';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { variantTypeLabel } from '@/lib/utils';
import { ProductFormValues } from '../ProductForm';

interface PricingVariantsTabProps {
  isActive: boolean;
  categories?: { label: string; value: string; variantType?: string; calculatePriceOnVariantValue?: boolean }[];
  productId?: string;
}

export function PricingVariantsTab({ isActive, categories = [], productId }: PricingVariantsTabProps) {
  const { register, control, setValue, formState: { errors } } = useFormContext<ProductFormValues>();

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants'
  });

  const categoryId = useWatch({ control, name: 'categoryId' });
  const selectedCategory = categories.find(c => c.value === categoryId);
  const variantType = variantTypeLabel(selectedCategory?.variantType);
  const priceOnValue = !!selectedCategory?.calculatePriceOnVariantValue;

  // Existing variants for an already-created product are read from the
  // standalone ProductVariant collection and managed on their own screens —
  // this tab only defines the initial set of variants at creation time.
  const existingVariants: any[] = useWatch({ control, name: 'variants' }) || [];

  const [numVariantsToGenerate, setNumVariantsToGenerate] = useState(1);
  const [bulkBasePrice, setBulkBasePrice] = useState('');
  const [bulkComparePrice, setBulkComparePrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  const handleGenerateVariants = () => {
    const newVariants = Array.from({ length: numVariantsToGenerate }).map(() => ({
      price: 0,
      stock: 1,
      lowStockThreshold: 5,
    }));
    appendVariant(newVariants);
  };

  const handleApplyBasePrice = () => {
    if (!bulkBasePrice) return;
    const price = Number(bulkBasePrice);
    if (isNaN(price)) return;

    variantFields.forEach((_, index) => {
      setValue(`variants.${index}.price`, price, { shouldValidate: true, shouldDirty: true });
    });
  };

  const handleApplyComparePrice = () => {
    if (!bulkComparePrice) return;
    const price = Number(bulkComparePrice);
    if (isNaN(price)) return;

    variantFields.forEach((_, index) => {
      setValue(`variants.${index}.comparePrice`, price, { shouldValidate: true, shouldDirty: true });
    });
  };

  const handleApplyStock = () => {
    if (!bulkStock) return;
    const stock = Number(bulkStock);
    if (isNaN(stock)) return;

    variantFields.forEach((_, index) => {
      setValue(`variants.${index}.stock`, stock, { shouldValidate: true, shouldDirty: true });
    });
  };

  const handleClearAllVariants = () => {
    if (confirm('Are you sure you want to clear all variants?')) {
      // Remove from the end to the beginning to avoid index shifting issues
      for (let i = variantFields.length - 1; i >= 0; i--) {
        removeVariant(i);
      }
    }
  };

  // Only one of Variant Value / Variant Name is editable at a time, based on
  // the category's calculatePriceOnVariantValue flag — clear the field that
  // just became disabled so a stale value from before a category switch
  // doesn't get silently submitted.
  useEffect(() => {
    if (!productId && variantFields.length > 0) {
      variantFields.forEach((_, index) => {
        if (priceOnValue) {
          setValue(`variants.${index}.size`, '');
        } else {
          setValue(`variants.${index}.variantValue`, undefined);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceOnValue]);

  if (productId) {
    // Editing an existing product: variants live in the standalone
    // ProductVariant collection and are managed on their own screens.
    return (
      <div className={isActive ? 'space-y-5' : 'hidden'}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-plum-800 pb-3">
          <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold-500" />
            Pricing & Variants
          </h2>
          <a
            href="/admin/productvarients"
            className="px-4 py-2 bg-plum-900 text-white rounded-lg text-sm hover:bg-plum-800 transition-colors"
          >
            Manage Variants
          </a>
        </div>

        <p className="text-sm text-plum-500 dark:text-plum-400">
          Pricing, stock, images, discount rules and SEO for each variant are edited on the standalone Product Variants screens — changes here on the main product form don&apos;t affect them.
        </p>

        <div className="border border-gray-200 dark:border-plum-700 rounded-xl overflow-hidden">
          {existingVariants.length === 0 ? (
            <div className="p-6 text-center text-sm text-plum-500">No variants yet for this product.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-plum-900 text-plum-500 dark:text-plum-400 text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Variant</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-plum-800">
                {existingVariants.map((v: any, idx: number) => (
                  <tr key={v._id || idx}>
                    <td className="px-4 py-3 font-medium text-plum-900 dark:text-ivory-100">{v.name}</td>
                    <td className="px-4 py-3 text-plum-500 font-mono text-xs">{v.sku || 'N/A'}</td>
                    <td className="px-4 py-3 text-plum-800 dark:text-plum-200">₹{(v.price || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-plum-800 dark:text-plum-200">{v.stock ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      {v._id && (
                        <a href={`/admin/productvarients/${v._id}/edit`} className="text-emerald-600 hover:underline text-xs font-medium">
                          Edit
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={isActive ? 'space-y-5' : 'hidden'}>
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-plum-800 pb-3">
        <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-gold-500" />
          Pricing & Variants
        </h2>
      </div>

      <div className="p-5 bg-gray-50 dark:bg-plum-900/40 rounded-2xl border border-gray-200 dark:border-plum-800 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-plum-500 dark:text-plum-400">Bulk Actions & Generation</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-48">
            <label className="block text-xs font-medium text-plum-700 dark:text-plum-300 mb-1">Variants to Generate</label>
            <div className="flex gap-2">
              <input
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                value={numVariantsToGenerate}
                onChange={e => setNumVariantsToGenerate(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-plum-700 rounded-md bg-white dark:bg-plum-950 text-plum-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-plum-600/30 focus:border-plum-600"
              />
              <AdminButton type="button" onClick={handleGenerateVariants} className="whitespace-nowrap">
                Generate
              </AdminButton>
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-medium text-plum-700 dark:text-plum-300 mb-1">Base Price (₹)</label>
            <div className="flex gap-2">
              <input
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                value={bulkBasePrice}
                onChange={e => setBulkBasePrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-plum-700 rounded-md bg-white dark:bg-plum-950 text-plum-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-plum-600/30 focus:border-plum-600"
              />
              <AdminButton type="button" onClick={handleApplyBasePrice} variant="outline" className="whitespace-nowrap">
                Apply
              </AdminButton>
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-medium text-plum-700 dark:text-plum-300 mb-1">Compare Price (₹)</label>
            <div className="flex gap-2">
              <input
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                value={bulkComparePrice}
                onChange={e => setBulkComparePrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-plum-700 rounded-md bg-white dark:bg-plum-950 text-plum-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-plum-600/30 focus:border-plum-600"
              />
              <AdminButton type="button" onClick={handleApplyComparePrice} variant="outline" className="whitespace-nowrap">
                Apply
              </AdminButton>
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-medium text-plum-700 dark:text-plum-300 mb-1">Current Stock</label>
            <div className="flex gap-2">
              <input
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                value={bulkStock}
                onChange={e => setBulkStock(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-plum-700 rounded-md bg-white dark:bg-plum-950 text-plum-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-plum-600/30 focus:border-plum-600"
              />
              <AdminButton type="button" onClick={handleApplyStock} variant="outline" className="whitespace-nowrap">
                Apply
              </AdminButton>
            </div>
          </div>

          <AdminButton
            type="button"
            onClick={handleClearAllVariants}
            variant="outline"
            className="flex items-center gap-1.5 whitespace-nowrap border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-900/30 transition-colors ml-auto"
          >
            <Trash2 size={16} />
            Clear All
          </AdminButton>
        </div>
      </div>

      <div className="space-y-4">
        {variantFields.map((field, index) => (
          <div
            key={field.id}
            className="p-3 border border-gray-200 dark:border-plum-700 rounded-xl bg-gray-50/60 dark:bg-plum-900/40 flex items-start gap-2 relative"
          >
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <AdminInput
                label={variantType}
                placeholder={priceOnValue ? `e.g. 1.5` : 'Set when Calculate Price on Variant Value is on'}
                type="text"
                disabled={!priceOnValue}
                className={!priceOnValue ? 'opacity-50 cursor-not-allowed' : ''}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                {...register(`variants.${index}.variantValue`)}
                error={errors.variants?.[index]?.variantValue?.message}
              />
              <AdminInput
                label="Variant Name"
                placeholder={priceOnValue ? 'Auto-generated from category variant value' : 'e.g. Oval Cut, 6x4mm'}
                disabled={priceOnValue}
                className={priceOnValue ? 'opacity-50 cursor-not-allowed' : ''}
                {...register(`variants.${index}.size`)}
                error={errors.variants?.[index]?.size?.message}
              />
              <AdminInput
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                label={selectedCategory?.calculatePriceOnVariantValue ? "Selling Price Per Unit (₹) *" : "Selling Price (₹) *"}
                placeholder=""
                {...register(`variants.${index}.price`)}
                error={errors.variants?.[index]?.price?.message}
              />
              <AdminInput
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                label="Compare Price"
                placeholder=""
                {...register(`variants.${index}.comparePrice`)}
                error={errors.variants?.[index]?.comparePrice?.message}
              />
              <AdminInput
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                label="Current Stock"
                placeholder=""
                {...register(`variants.${index}.stock`)}
                error={errors.variants?.[index]?.stock?.message}
              />
            </div>
            {variantFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="mt-7 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors absolute -right-2 -top-2 bg-white dark:bg-plum-900 shadow-sm border border-gray-200 dark:border-plum-700"
                title="Remove Variant"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        <AdminButton
          type="button"
          variant="outline"
          onClick={() => appendVariant({ price: 0, stock: 1, lowStockThreshold: 5 })}
          className="w-full border-dashed border-2 py-3 text-plum-600 dark:text-plum-300"
        >
          <Plus size={16} className="mr-1.5" />
          Add Another Option / Size
        </AdminButton>
      </div>
    </div>
  );
}
