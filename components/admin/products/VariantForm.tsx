'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, useFieldArray, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { Save, Package, UploadCloud, X, Trash2, Plus } from 'lucide-react';
import { updateVariant } from '@/lib/actions/product.actions';
import { uploadMedia } from '@/lib/actions/media.actions';
import { variantTypeLabel } from '@/lib/utils';

const discountRuleSchema = z.object({
  minQty: z.coerce.number().min(1, 'Min Qty is required'),
  maxQty: z.coerce.number().min(1, 'Max Qty is required'),
  discountPercentage: z.coerce.number().min(0).max(100, 'Invalid discount %'),
});

const variantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  variantValue: z.number().optional(),
  size: z.string().optional(),
  price: z.number().min(0, 'Price must be >= 0'),
  comparePrice: z.number().optional(),
  lowStockThreshold: z.number().min(0).default(5),
  purchaseType: z.enum(['ENQUIRE_ONLY', 'BUY_ONLY', 'BUY_ENQUIRE']).default('BUY_ENQUIRE'),
  whatsappEnabled: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),
  primaryImage: z.object({ url: z.string(), altText: z.string().optional() }).optional(),
  gallery: z.array(z.object({ url: z.string(), altText: z.string().optional() })).optional(),
  discountRules: z.array(discountRuleSchema).optional().superRefine((rules, ctx) => {
    if (!rules || rules.length <= 1) return;

    rules.forEach((rule, index) => {
      if (rule.minQty > rule.maxQty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Min Qty cannot be greater than Max Qty',
          path: [index, 'minQty'],
        });
      }
    });

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const r1 = rules[i];
        const r2 = rules[j];
        if (r1.minQty <= r2.maxQty && r1.maxQty >= r2.minQty) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Discount ranges cannot overlap',
            path: [j, 'minQty'],
          });
        }
      }
    }
  }),
});

type VariantFormValues = z.infer<typeof variantSchema>;

export default function VariantForm({
  productId,
  variant,
  calculatePriceOnVariantValue = false,
  variantType,
}: {
  productId: string;
  variant: any;
  /** From the parent product's category — mirrors the same flag on the main
   * product form's Pricing & Variants tab: when true, Variant Value is the
   * editable field (Variant Name is auto-generated and locked); when false,
   * Variant Name is editable and Variant Value is locked. */
  calculatePriceOnVariantValue?: boolean;
  variantType?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const priceOnValue = !!calculatePriceOnVariantValue;
  const variantValueLabel = variantTypeLabel(variantType);

  const [coverFile, setCoverFile] = useState<{ file?: File; previewUrl: string; isExisting: boolean } | null>(
    variant.primaryImage?.url ? { previewUrl: variant.primaryImage.url, isExisting: true } : null
  );

  const [galleryItems, setGalleryItems] = useState<{ id: string; file?: File; previewUrl: string; isExisting: boolean }[]>(
    (variant.gallery || [])
      .filter((img: any) => img?.url?.trim())
      .map((img: any, i: number) => ({
        id: `existing-${i}-${img.url.slice(-10).replace(/[^a-zA-Z0-9]/g, '')}`,
        previewUrl: img.url,
        isExisting: true,
      }))
  );

  const methods = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema) as any,
    defaultValues: {
      name: variant.name || '',
      sku: variant.sku || '',
      variantValue: variant.variantValue,
      size: variant.size || '',
      price: variant.price || 0,
      comparePrice: variant.comparePrice,
      lowStockThreshold: variant.lowStockThreshold || 5,
      purchaseType: variant.purchaseType || 'BUY_ENQUIRE',
      whatsappEnabled: variant.whatsappEnabled || false,
      metaTitle: variant.metaTitle || '',
      metaDescription: variant.metaDescription || '',
      keywords: variant.keywords?.join(', ') || '',
      primaryImage: variant.primaryImage || { url: '', altText: '' },
      gallery: (variant.gallery || []).filter((img: any) => img?.url?.trim()),
      discountRules: variant.discountRules || [],
    }
  });

  const { register, control, handleSubmit, setValue, getValues, formState: { errors } } = methods;

  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control,
    name: 'discountRules',
  });

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverFile) URL.revokeObjectURL(coverFile.previewUrl);
    setCoverFile({ file, previewUrl: URL.createObjectURL(file), isExisting: false });
  };

  const handleRemoveCover = () => {
    if (coverFile && !coverFile.isExisting) URL.revokeObjectURL(coverFile.previewUrl);
    setCoverFile(null);
    setValue('primaryImage', { url: '', altText: '' });
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
      isExisting: false,
    }));

    setGalleryItems((prev) => [...prev, ...newFiles]);

    const currentGallery = getValues('gallery') || [];
    setValue('gallery', [...currentGallery, ...newFiles.map(() => ({ url: '', altText: '' }))]);
  };

  const removeGalleryImage = (indexToRemove: number) => {
    const removed = galleryItems[indexToRemove];
    if (removed && !removed.isExisting) URL.revokeObjectURL(removed.previewUrl);
    setGalleryItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));

    const currentGallery = getValues('gallery') || [];
    setValue('gallery', currentGallery.filter((_, idx) => idx !== indexToRemove));
  };

  const onSubmit = async (data: VariantFormValues) => {
    setIsSubmitting(true);
    try {
      let finalPrimaryImage = data.primaryImage;
      if (coverFile && !coverFile.isExisting) {
        const formData = new FormData();
        formData.append('file', coverFile.file!);
        const res = await uploadMedia(formData);
        if (res.success && res.data) {
          finalPrimaryImage = { url: res.data.secureUrl || res.data.url, altText: data.primaryImage?.altText || '' };
        } else {
          throw new Error(`Cover upload failed: ${res.error}`);
        }
      } else if (!coverFile) {
        finalPrimaryImage = { url: '', altText: '' };
      }

      const finalGallery = [...(data.gallery || [])];
      const galleryUploadPromises = galleryItems.map(async (item, i) => {
        if (item.isExisting) return null;
        const formData = new FormData();
        formData.append('file', item.file!);
        const res = await uploadMedia(formData);
        if (res.success && res.data) {
          return { index: i, data: { url: res.data.secureUrl || res.data.url, altText: finalGallery[i]?.altText || item.file!.name } };
        } else {
          throw new Error(`Gallery upload failed: ${res.error}`);
        }
      });

      const uploadedGalleryImages = await Promise.all(galleryUploadPromises);
      uploadedGalleryImages.forEach((img) => {
        if (img) finalGallery[img.index] = img.data;
      });

      const formattedData = {
        ...data,
        primaryImage: finalPrimaryImage,
        gallery: finalGallery,
        keywords: data.keywords ? data.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
      };

      const result = await updateVariant(productId, variant._id, formattedData);

      if (result.success) {
        toast.success('Variant updated successfully!');
        setTimeout(() => router.push('/admin/productvarients'), 1200);
      } else {
        toast.error(result.error || 'Failed to update variant');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white dark:bg-plum-950 p-6 rounded-2xl border border-gray-200 dark:border-plum-800 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2 border-b border-gray-100 dark:border-plum-800 pb-3">
              <Package size={20} className="text-gold-500" />
              Basic Details & Pricing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminInput
                label="Variant Name *"
                placeholder={priceOnValue ? 'Auto-generated from category variant value' : undefined}
                disabled={priceOnValue}
                className={priceOnValue ? 'opacity-50 cursor-not-allowed' : ''}
                {...register('name')}
                error={errors.name?.message}
              />
              <AdminInput
                label="SKU"
                {...register('sku')}
                error={errors.sku?.message}
              />
              <AdminInput
                label={`${variantValueLabel} (Numeric)`}
                type="text"
                placeholder={priceOnValue ? 'e.g. 1.5' : 'Set when Calculate Price on Variant Value is on'}
                disabled={!priceOnValue}
                className={!priceOnValue ? 'opacity-50 cursor-not-allowed' : ''}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                {...register('variantValue', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                error={errors.variantValue?.message}
              />
              <AdminInput
                label="Size Description"
                {...register('size')}
                error={errors.size?.message}
              />
              <AdminInput
                label="Selling Price (₹) *"
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                {...register('price', { setValueAs: (v) => v === '' ? 0 : Number(v) })}
                error={errors.price?.message}
              />
              <AdminInput
                label="Compare Price (₹)"
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                {...register('comparePrice', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                error={errors.comparePrice?.message}
              />
              <AdminInput
                label="Low Stock Threshold"
                type="text"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                {...register('lowStockThreshold', { setValueAs: (v) => v === '' ? 5 : Number(v) })}
                error={errors.lowStockThreshold?.message}
              />
            </div>
          </div>

          {/* Cover Image & Gallery */}
          <div className="bg-white dark:bg-plum-950 p-6 rounded-2xl border border-gray-200 dark:border-plum-800 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 border-b border-gray-100 dark:border-plum-800 pb-3">
              Cover Image & Gallery
            </h3>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-plum-700 dark:text-plum-300">
                Cover Image (Primary)
              </label>

              {coverFile ? (
                <div className="space-y-3 max-w-md">
                  <div className="relative w-40 h-40 rounded-xl border-2 border-gold-500 overflow-hidden shadow-md">
                    <Image src={coverFile.previewUrl} alt="Cover Preview" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition-colors"
                      title="Remove Cover Image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <AdminInput
                    label="Cover Image Alt Text"
                    placeholder="e.g. 1.5 Carat Ruby closeup"
                    {...register('primaryImage.altText')}
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-plum-700 rounded-xl p-6 text-center bg-gray-50 dark:bg-plum-900/40 hover:bg-gray-100 dark:hover:bg-plum-800/60 transition-colors relative cursor-pointer max-w-md">
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  <UploadCloud size={22} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-plum-700 dark:text-plum-300">Click or drop cover image here</p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-plum-800">
              <label className="block text-sm font-semibold text-plum-700 dark:text-plum-300">
                Gallery Images
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryItems.map((item, idx) => (
                  <div key={item.id} className="space-y-2">
                    <div className="relative aspect-square rounded-xl border border-gray-200 dark:border-plum-700 overflow-hidden group shadow-sm">
                      {item.previewUrl ? (
                        <Image src={item.previewUrl} alt={`Gallery Preview ${idx + 1}`} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center p-2">Invalid Image</div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Alt text"
                      {...register(`gallery.${idx}.altText`)}
                      className="w-full text-xs rounded-md bg-white dark:bg-plum-900 text-plum-900 dark:text-white border border-gray-200 dark:border-plum-700 focus:outline-none focus:ring-1 focus:ring-gold-500 px-2 py-1.5"
                    />
                  </div>
                ))}

                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-plum-700 bg-gray-50 dark:bg-plum-900/40 hover:bg-gray-100 dark:hover:bg-plum-800 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                  <Plus size={18} className="mb-1 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-plum-300">Add Images</span>
                </label>
              </div>
            </div>
          </div>

          {/* Discount Rules */}
          <div className="bg-white dark:bg-plum-950 p-6 rounded-2xl border border-gray-200 dark:border-plum-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-plum-800 pb-3">
              <div>
                <h3 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">Discount Rules</h3>
                <p className="text-xs text-plum-500 mt-1">Quantity-based tier discounts for this variant only.</p>
              </div>
              <AdminButton type="button" variant="outline" onClick={() => appendRule({ minQty: 1, maxQty: 10, discountPercentage: 5 })}>
                <Plus size={16} className="mr-1" /> Add Rule
              </AdminButton>
            </div>

            <div className="space-y-3">
              {ruleFields.length === 0 && (
                <div className="p-4 border border-gray-200 dark:border-plum-800 border-dashed rounded-xl text-center text-plum-500 text-sm">
                  No discount rules applied for this variant.
                </div>
              )}
              {ruleFields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-4 p-4 border border-gray-200 dark:border-plum-700 rounded-xl bg-white dark:bg-plum-900 relative">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AdminInput
                      type="text"
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                      label="Min Qty"
                      {...register(`discountRules.${index}.minQty`)}
                      error={errors.discountRules?.[index]?.minQty?.message}
                    />
                    <AdminInput
                      type="text"
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                      label="Max Qty"
                      {...register(`discountRules.${index}.maxQty`)}
                      error={errors.discountRules?.[index]?.maxQty?.message}
                    />
                    <AdminInput
                      type="text"
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); }}
                      label="Discount (%)"
                      {...register(`discountRules.${index}.discountPercentage`)}
                      error={errors.discountRules?.[index]?.discountPercentage?.message}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="mt-7 text-red-500 hover:text-red-700 p-2"
                    title="Remove Rule"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SEO & Purchase Rules */}
          <div className="bg-white dark:bg-plum-950 p-6 rounded-2xl border border-gray-200 dark:border-plum-800 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 border-b border-gray-100 dark:border-plum-800 pb-3">
              SEO & Purchase Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={control}
                name="purchaseType"
                render={({ field }) => {
                  const options = [
                    { label: 'Buy & Enquire', value: 'BUY_ENQUIRE' },
                    { label: 'Buy Only', value: 'BUY_ONLY' },
                    { label: 'Enquire Only', value: 'ENQUIRE_ONLY' },
                  ];
                  return (
                    <AdminSelect
                      label="Purchase Mode *"
                      options={options}
                      value={options.find((o) => o.value === field.value) || null}
                      onChange={(opt: any) => field.onChange(opt ? opt.value : 'BUY_ENQUIRE')}
                      error={errors.purchaseType?.message}
                    />
                  );
                }}
              />
              <div className="flex items-center gap-3 mt-8">
                <input
                  type="checkbox"
                  id="whatsappEnabled"
                  {...register('whatsappEnabled')}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="whatsappEnabled" className="text-sm text-plum-700 dark:text-plum-300">
                  Enable WhatsApp Inquiry
                </label>
              </div>

              <AdminInput
                label="Meta Title"
                {...register('metaTitle')}
                error={errors.metaTitle?.message}
              />
              <AdminInput
                label="Meta Description"
                {...register('metaDescription')}
                error={errors.metaDescription?.message}
              />
              <AdminInput
                label="Keywords (comma separated)"
                {...register('keywords')}
                error={errors.keywords?.message}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <AdminButton type="submit" disabled={isSubmitting}>
              <Save size={16} className="mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Variant Details'}
            </AdminButton>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
