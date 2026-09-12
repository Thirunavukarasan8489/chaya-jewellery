
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Package
} from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { createProduct, updateProduct } from '@/lib/actions/product.actions';
import { uploadMedia } from '@/lib/actions/media.actions';
import { toast } from 'react-hot-toast';

import { BasicInfoTab } from './ui/BasicInfoTab';
import { PricingVariantsTab } from './ui/PricingVariantsTab';
import { MediaUploadTab } from './ui/MediaUploadTab';
import { PurchaseRulesTab } from './ui/PurchaseRulesTab';
import { SeoTab } from './ui/SeoTab';
import { DiscountRulesTab } from './ui/DiscountRulesTab';

const variantSchema = z.object({
  variantValue: z.coerce.number().optional(),
  size: z.string().optional(),
  price: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().min(0, 'Selling Price is required')),
  comparePrice: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().optional()),
  stock: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().min(0, 'Stock must be 0 or more').int()),
  lowStockThreshold: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().int().optional()),
});

const productSchema = z.object({
  // Basic
  name: z.string().min(3, 'Name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  // Variants
  hasVariants: z.boolean(),
  variants: z.array(variantSchema).optional(),

  // Purchase Rules
  purchaseType: z.enum(['BUY_ONLY', 'ENQUIRE_ONLY', 'BUY_ENQUIRE']),
  whatsappEnabled: z.boolean().optional(),
  discountRules: z.array(z.object({
    minQty: z.coerce.number().min(1, 'Min Qty is required'),
    maxQty: z.coerce.number().min(1, 'Max Qty is required'),
    discountPercentage: z.coerce.number().min(0).max(100, 'Invalid discount %'),
  })).optional().superRefine((rules, ctx) => {
    if (!rules || rules.length <= 1) return;

    // Check for min > max
    rules.forEach((rule, index) => {
      if (rule.minQty > rule.maxQty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Min Qty cannot be greater than Max Qty",
          path: [index, 'minQty']
        });
      }
    });

    // Check for overlaps
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const r1 = rules[i];
        const r2 = rules[j];
        // Overlap condition: r1.min <= r2.max && r1.max >= r2.min
        if (r1.minQty <= r2.maxQty && r1.maxQty >= r2.minQty) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Discount ranges cannot overlap",
            path: [j, 'minQty']
          });
        }
      }
    }
  }),

  // Images & Media
  primaryImage: z.object({ url: z.string(), altText: z.string().optional() }).optional(),
  gallery: z.array(z.object({ url: z.string(), altText: z.string().optional() })).optional(),

  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),

  status: z.enum(['ACTIVE', 'DRAFT']),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductForm({ initialData, categories = [] }: { initialData?: any; categories?: { label: string; value: string; variantType?: string; calculatePriceOnVariantValue?: boolean }[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');

  const [coverFile, setCoverFile] = useState<{ file?: File; previewUrl: string; isExisting: boolean } | null>(
    initialData?.primaryImage?.url ? { previewUrl: initialData.primaryImage.url, isExisting: true } : null
  );

  const [galleryItems, setGalleryItems] = useState<{ id: string; file?: File; previewUrl: string; isExisting: boolean }[]>(
    initialData?.gallery?.length > 0
      ? initialData.gallery.filter((img: any) => img && img.url && img.url.trim() !== '').map((img: any, i: number) => ({
          id: `existing-${i}-${img.url.slice(-10).replace(/[^a-zA-Z0-9]/g, '')}`,
          previewUrl: img.url,
          isExisting: true
        }))
      : []
  );
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string; tabId: string }[] | null>(null);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      categoryId: initialData.category?._id || initialData.categoryId || '',
    } : {
      name: '',
      categoryId: '',
      shortDescription: '',
      description: '',
      hasVariants: true,
      variants: [],
      purchaseType: 'BUY_ENQUIRE',
      whatsappEnabled: false,
      primaryImage: { url: '', altText: '' },
      gallery: [],
      metaTitle: '',
      metaDescription: '',
      status: 'ACTIVE',
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isSubmitted },
  } = methods;

  // Handle Cover Image Selection
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (coverFile) {
      URL.revokeObjectURL(coverFile.previewUrl);
    }

    setCoverFile({
      file,
      previewUrl: URL.createObjectURL(file),
      isExisting: false
    });
  };

  // Handle Gallery Images Selection
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
      isExisting: false
    }));

    setGalleryItems(prev => [...prev, ...newFiles]);

    // We add placeholders in react-hook-form to render the alt text inputs
    const currentGallery = getValues('gallery') || [];
    setValue('gallery', [...currentGallery, ...newFiles.map(() => ({ url: '', altText: '' }))], { shouldValidate: true });
  };

  const removeGalleryImage = (indexToRemove: number) => {
    const removed = galleryItems[indexToRemove];
    if (removed && !removed.isExisting) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    setGalleryItems(prev => prev.filter((_, idx) => idx !== indexToRemove));

    const currentGallery = getValues('gallery') || [];
    setValue('gallery', currentGallery.filter((_, idx) => idx !== indexToRemove), { shouldValidate: true });
  };

  const onSubmit = async (data: ProductFormValues) => {
    const uploadAndSubmit = async () => {
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
        throw new Error('Cover image is required');
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
      uploadedGalleryImages.forEach(img => {
        if (img) finalGallery[img.index] = img.data;
      });

      const finalData = { ...data, primaryImage: finalPrimaryImage, gallery: finalGallery };

      let res;
      if (initialData?._id) {
        res = await updateProduct(initialData._id, finalData);
      } else {
        res = await createProduct(finalData);
      }

      if (!res.success) {
        throw new Error(res.error || `Failed to ${initialData ? 'update' : 'create'} product`);
      }
      return res;
    };

    return toast.promise(
      uploadAndSubmit(),
      {
        loading: 'Uploading media and saving product...',
        success: `Product ${initialData ? 'updated' : 'created'} successfully!`,
        error: (err) => err.message || `Failed to ${initialData ? 'update' : 'create'} product.`,
      }
    ).then(() => {
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    }).catch(() => {
      // toast.promise already surfaced the error to the user; nothing else to do.
    });
  };
 
  const tabs = [
    { id: 'basic', label: '1. Basic Details', shortLabel: 'Basic' },
    { id: 'media', label: '2. Cover Image & Gallery', shortLabel: 'Media' },
    { id: 'variants', label: '3. Price & Variant', shortLabel: 'Pricing' },
    { id: 'discount', label: '4. Discount Rule', shortLabel: 'Discount' },
    { id: 'purchase', label: '5. Purchase Rule', shortLabel: 'Purchase' },
    { id: 'seo', label: '6. SEO', shortLabel: 'SEO' },
  ];

  const tabFields: Record<string, (keyof ProductFormValues)[]> = {
    basic: ['name', 'categoryId', 'status', 'shortDescription', 'description'],
    media: ['primaryImage', 'gallery'],
    variants: ['hasVariants', 'variants'],
    discount: ['discountRules'],
    purchase: ['purchaseType', 'whatsappEnabled'],
    seo: ['metaTitle', 'metaDescription'],
  };

  // Which tabs currently hold a validation error, so the sidebar can flag
  // them without the admin having to hunt through every step. Only shown
  // once a submit has been attempted, so a fresh form doesn't look broken.
  const tabHasError = (tabId: string) => {
    if (!isSubmitted) return false;
    if (tabId === 'media' && !coverFile) return true;
    return tabFields[tabId].some((field) => !!(errors as any)[field]);
  };

  const onInvalid = (formErrors: any) => {
    const extractedErrs: { field: string; message: string; tabId: string }[] = [];
    const getTabForField = (fieldName: string) => {
      for (const tab of Object.keys(tabFields)) {
        if (tabFields[tab].some(f => fieldName === f || fieldName.startsWith(f + '.'))) return tab;
      }
      return 'basic';
    };
    const traverseErrors = (obj: any, parentKey = '') => {
      for (const key in obj) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        if (obj[key]?.message) {
          extractedErrs.push({ field: fullKey, message: obj[key].message, tabId: getTabForField(fullKey) });
        } else if (typeof obj[key] === 'object') {
          traverseErrors(obj[key], fullKey);
        }
      }
    };
    traverseErrors(formErrors);

    // Explicit cover image validation check
    if (!coverFile) {
      extractedErrs.push({ field: 'Cover Image', message: 'Cover image is required', tabId: 'media' });
    }

    if (extractedErrs.length > 0) {
      setValidationErrors(extractedErrs);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit as any, onInvalid)(e);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 relative">

      {/* Sticky Header — z-30, deliberately below the global mobile sidebar's
          overlay (z-40) and drawer (z-50, see Sidebar.tsx) so it never paints
          over the mobile nav when it's open. Title/actions and, on mobile and
          tablet, the step strip live inside ONE sticky wrapper so they always
          stay pinned together as a single unit — no separate sticky element
          to fall out of sync while scrolling. */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-plum-950/90 backdrop-blur-md border-b border-gray-200 dark:border-plum-800 rounded-b-2xl shadow-sm -mx-4 sm:mx-0 mb-8">
        <div className="py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="p-2 border border-gray-200 dark:border-plum-700 rounded-lg hover:bg-gray-50 dark:hover:bg-plum-800 transition-colors text-plum-500 dark:text-plum-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-plum-900 dark:text-ivory-100 flex items-center gap-2">
                <Package className="w-6 h-6 text-gold-500" />
                {initialData ? 'Edit Product' : 'Create Product'}
              </h1>
              <p className="text-xs text-plum-500 dark:text-plum-400 mt-0.5">
                Unique slug is automatically generated in the backend from product title.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminButton type="button" variant="outline" onClick={() => router.push('/admin/products')}>
              Cancel
            </AdminButton>
            <AdminButton onClick={handleFormSubmit} isLoading={isSubmitting} className="gap-2">
              <Save size={18} />
              {initialData ? 'Update Product' : 'Publish Product'}
            </AdminButton>
          </div>
        </div>

        {/* Mobile & tablet step strip — replaces the vertical "Form Steps"
            sidebar below md, since a 6-item vertical list pinned on screen
            would eat most of a phone's viewport. Horizontally scrollable,
            numbered, and part of the same sticky header above. */}
        <div className="md:hidden overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-plum-800 px-4 py-2.5">
          <div className="flex gap-2 w-max">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const hasError = tabHasError(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${isActive
                    ? 'bg-plum-900 dark:bg-ivory-100 text-white dark:text-plum-900 border-plum-900 dark:border-ivory-100'
                    : 'bg-white dark:bg-plum-900 text-plum-600 dark:text-plum-300 border-gray-200 dark:border-plum-700'
                    }`}
                >
                  <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0 ${isActive
                    ? 'bg-white/25 text-white dark:bg-plum-900/15 dark:text-plum-900'
                    : hasError
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 dark:bg-plum-800 text-plum-500 dark:text-plum-400'
                    }`}>
                    {hasError && !isActive ? '!' : idx + 1}
                  </span>
                  {tab.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* Navigation Tabs Sidebar — desktop/tablet-landscape only (md+); the
            step strip above covers mobile and tablet-portrait. z-20 is
            explicitly below the sticky header above (z-30) so a tall header
            always wins if the two ever overlap while scrolling. */}
        <div className="hidden md:block md:w-64 shrink-0 bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-2xl shadow-sm p-3 sticky top-32 z-20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-plum-500 mb-3 px-3">Form Steps</h3>
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const hasError = tabHasError(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-[3px] ${isActive
                    ? 'text-plum-900 dark:text-ivory-100 bg-gray-50 dark:bg-plum-900 border-emerald-500'
                    : 'text-plum-600 dark:text-plum-400 border-transparent hover:bg-gray-50 dark:hover:bg-plum-900/60'
                    }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>{tab.label}</span>
                    {hasError ? (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form Content Area */}
        <div className="flex-1 w-full bg-white dark:bg-plum-950 border border-gray-200 dark:border-plum-800 rounded-2xl shadow-sm p-6 lg:p-8">
          <form
            id="product-form"
            className="space-y-6"
            onSubmit={handleFormSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as any).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
          >

            <FormProvider {...methods}>
              {/* 1. BASIC DETAILS */}
              <div className={activeTab === 'basic' ? 'space-y-6' : 'hidden'}>
                <BasicInfoTab categories={categories} isActive={true} />
              </div>

              {/* 2. COVER IMAGE & GALLERY */}
              <MediaUploadTab
                isActive={activeTab === 'media'}
                coverFile={coverFile}
                setCoverFile={setCoverFile}
                galleryItems={galleryItems}
                handleCoverUpload={handleCoverUpload}
                handleGalleryUpload={handleGalleryUpload}
                removeGalleryImage={removeGalleryImage}
              />

              {/* 3. PRICE & VARIANT */}
              <PricingVariantsTab
                isActive={activeTab === 'variants'}
                categories={categories}
                productId={initialData?._id}
              />

              {/* 4. DISCOUNT RULE */}
              <DiscountRulesTab isActive={activeTab === 'discount'} />

              {/* 5. PURCHASE RULE */}
              <PurchaseRulesTab isActive={activeTab === 'purchase'} />

              {/* 6. SEO */}
              <SeoTab isActive={activeTab === 'seo'} />
            </FormProvider>

            {/* Form Navigation / Save */}
            <div className="flex items-center justify-between p-4 mt-6 bg-white dark:bg-plum-950 border-t border-gray-200 dark:border-plum-800 rounded-b-xl -mx-5 -mb-5 lg:-mx-6 lg:-mb-6">
              <div>
                {tabs.findIndex(t => t.id === activeTab) > 0 && (
                  <AdminButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const idx = tabs.findIndex(t => t.id === activeTab);
                      setActiveTab(tabs[idx - 1].id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Previous Step
                  </AdminButton>
                )}
              </div>
              <div className="flex items-center gap-3">
                {tabs.findIndex(t => t.id === activeTab) < tabs.length - 1 && (
                  <AdminButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const idx = tabs.findIndex(t => t.id === activeTab);
                      if (idx < tabs.length - 1) {
                        setActiveTab(tabs[idx + 1].id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    Next Step
                  </AdminButton>
                )}

                <AdminButton type="button" onClick={handleFormSubmit} isLoading={isSubmitting} className="gap-2">
                  <Save size={18} />
                  {initialData ? 'Update Product' : 'Publish Product'}
                </AdminButton>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Validation Errors Modal — z-[60], explicitly above the global mobile
          sidebar's drawer (z-50, see Sidebar.tsx) so a blocking modal is
          never hidden behind it instead of relying on DOM order. */}
      {validationErrors && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-plum-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-plum-950 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-plum-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-plum-800 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20">
              <h3 className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <X size={18} /> Validation Errors
              </h3>
              <button onClick={() => setValidationErrors(null)} className="text-plum-400 hover:text-plum-600 dark:hover:text-plum-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-plum-600 dark:text-plum-300 mb-4">Please fix the following required fields before saving:</p>
              <ul className="space-y-3">
                {validationErrors.map((err, i) => (
                  <li key={i} className="flex flex-col text-sm p-3 bg-gray-50 dark:bg-plum-900 rounded-lg border border-gray-100 dark:border-plum-800">
                    <span className="font-medium text-plum-800 dark:text-plum-200 capitalize">{err.field.replace(/\./g, ' ')}</span>
                    <span className="text-rose-600 dark:text-rose-400 mt-1">{err.message}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setValidationErrors(null);
                        setActiveTab(err.tabId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-left mt-2 hover:underline"
                    >
                      Go to {tabs.find(t => t.id === err.tabId)?.label.replace(/^\d+\.\s/, '')} Tab &rarr;
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-plum-800 bg-gray-50 dark:bg-plum-900/40 flex justify-end">
              <AdminButton onClick={() => setValidationErrors(null)} variant="outline">Close</AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
