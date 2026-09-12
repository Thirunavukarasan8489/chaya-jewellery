'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, UploadCloud } from 'lucide-react';
import { createCategory, updateCategory } from '@/lib/actions/category.actions';
import { uploadMedia } from '@/lib/actions/media.actions';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { toast } from 'react-hot-toast';

export default function CategoryForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    status: initialData?.status || 'ACTIVE',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    image: initialData?.image || '',
    variantType: initialData?.variantType || 'NONE',
    calculatePriceOnVariantValue: initialData?.calculatePriceOnVariantValue || false,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image || '');


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Create local preview URL
      setImagePreview(URL.createObjectURL(file));
      // Clear out the manual image string just in case
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.image;
      
      // If a file is selected, upload it first
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        
        const uploadResult = await uploadMedia(uploadData);
        if (uploadResult.success && uploadResult.data) {
          finalImageUrl = uploadResult.data.secureUrl || uploadResult.data.url;
        } else {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
      }

      // Then create the category with the new URL
      const categoryData = {
        ...formData,
        image: finalImageUrl,
      };

      const savePromise = initialData?._id 
        ? updateCategory(initialData._id, categoryData) 
        : createCategory(categoryData);

      toast.promise(savePromise.then((res) => {
        if (!res.success) throw new Error(res.error);
        return res;
      }), {
        loading: 'Saving...',
        success: initialData ? 'Category updated successfully' : 'Category created successfully',
        error: (err) => err.message || 'Failed to save category',
      }).then(() => {
        setTimeout(() => {
          router.push('/admin/categories');
        }, 1000);
      }).catch(() => {
        setIsSubmitting(false);
      });
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/categories"
            className="p-2 border border-gold-200 dark:border-gold-700 rounded-md text-gold-500 hover:bg-gold-50 dark:hover:bg-gold-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gold-800 dark:text-white">
              {initialData ? 'Edit Category' : 'Create Category'}
            </h1>
            <p className="text-sm text-gold-500 dark:text-gold-400 mt-1">
              {initialData ? 'Update the category details' : 'Add a new product category to your catalogue'}
            </p>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : initialData ? 'Update Category' : 'Save Category'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-gold-50 dark:bg-gold-800 text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                  placeholder="e.g. Ruby Rings"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-gold-50 dark:bg-gold-800 text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                  placeholder="Describe the category..."
                />
              </div>

              <div className="pt-4 border-t border-gold-200 dark:border-gold-800">
                <h4 className="text-md font-semibold text-gold-800 dark:text-white mb-3">Variant Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                      Variant Type *
                    </label>
                    <AdminSelect
                      name="variantType"
                      value={[
                        { value: 'CARAT', label: 'Carat' },
                        { value: 'SIZE', label: 'Size' },
                        { value: 'WEIGHT', label: 'Weight' },
                        { value: 'NONE', label: 'None' }
                      ].find(o => o.value === formData.variantType) || { value: 'NONE', label: 'None' }}
                      onChange={(opt: any) => handleChange({ target: { name: 'variantType', value: opt ? opt.value : 'NONE' } } as any)}
                      options={[
                        { value: 'CARAT', label: 'Carat' },
                        { value: 'SIZE', label: 'Size' },
                        { value: 'WEIGHT', label: 'Weight' },
                        { value: 'NONE', label: 'None' }
                      ]}
                    />
                    <p className="text-xs text-gold-500 mt-1">If products in this category have variants, what type are they?</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex items-center h-5">
                      <input
                        id="calculatePriceOnVariantValue"
                        name="calculatePriceOnVariantValue"
                        type="checkbox"
                        checked={formData.calculatePriceOnVariantValue}
                        onChange={(e) => setFormData({ ...formData, calculatePriceOnVariantValue: e.target.checked })}
                        className="h-4 w-4 rounded border-plum-300 text-gold-600 focus:ring-gold-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="calculatePriceOnVariantValue" className="font-medium text-gold-700 dark:text-gold-300">
                        Price Calculation Rule (Per Variant Unit)
                      </label>
                      <p className="text-gold-500 dark:text-gold-400">
                        If checked, the product price will be calculated as Variant Value × Quantity × Price. If unchecked, it will be Quantity × Price.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* SEO Details */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">Search Engine Optimization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-gold-50 dark:bg-gold-800 text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                  placeholder="Leave blank to use category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  rows={3}
                  value={formData.metaDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gold-200 dark:border-gold-700 rounded-md bg-gold-50 dark:bg-gold-800 text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">Status</h3>
            <div>
              <label className="block text-sm font-medium text-gold-700 dark:text-gold-300 mb-1">
                Visibility
              </label>
              <AdminSelect
                name="status"
                value={[
                  { value: 'ACTIVE', label: 'Active (Visible)' },
                  { value: 'DRAFT', label: 'Draft (Hidden)' }
                ].find(o => o.value === formData.status) || null}
                onChange={(opt: any) => handleChange({ target: { name: 'status', value: opt ? opt.value : 'ACTIVE' } } as any)}
                options={[
                  { value: 'ACTIVE', label: 'Active (Visible)' },
                  { value: 'DRAFT', label: 'Draft (Hidden)' }
                ]}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gold-800 dark:text-white mb-4">Category Image</h3>
            <div className="space-y-4">
              
              <div className="flex flex-col items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gold-300 border-dashed rounded-lg cursor-pointer bg-gold-50 dark:hover:bg-bray-800 dark:bg-gold-800 hover:bg-gold-100 dark:border-gold-600 dark:hover:border-gold-500 dark:hover:bg-gold-700 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-gold-400" />
                    <p className="mb-2 text-sm text-gold-500 dark:text-gold-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange} 
                  />
                </label>
              </div>

              {/* Preview */}
              {(imagePreview || formData.image) && (
                <div className="relative w-full h-40 rounded-md overflow-hidden border border-gold-200 dark:border-gold-700 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={imagePreview || formData.image} 
                    alt="Category preview" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, image: '' }));
                      }}
                      className="text-white text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gold-100 dark:border-gold-800">
                <label className="block text-xs font-medium text-gold-500 dark:text-gold-400 mb-1">
                  Or enter image URL manually
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={(e) => {
                    handleChange(e);
                    // Clear file selection if manual URL is entered
                    if (e.target.value) {
                      setSelectedFile(null);
                      setImagePreview('');
                    }
                  }}
                  disabled={!!selectedFile}
                  className="w-full px-3 py-2 text-sm border border-gold-200 dark:border-gold-700 rounded-md bg-gold-50 dark:bg-gold-800 text-gold-800 dark:text-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors disabled:opacity-50"
                  placeholder="https://res.cloudinary.com/..."
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
