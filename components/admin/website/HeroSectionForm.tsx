'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createHeroSection, updateHeroSection } from '@/lib/actions/cms.actions';
import { uploadMedia } from '@/lib/actions/media.actions';
import { Save, ArrowLeft, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function HeroSectionForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    badge: initialData?.badge || '',
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    ctaText: initialData?.ctaText || '',
    ctaHref: initialData?.ctaHref || '',
    secondaryCtaText: initialData?.secondaryCtaText || '',
    secondaryCtaHref: initialData?.secondaryCtaHref || '',
    image: initialData?.image || '',
    displayOrder: initialData?.displayOrder || '',
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.image && !selectedFile) {
      toast.error('An image is required. Please upload an image or enter a URL.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.image;
      
      // Upload file if selected
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

      const sectionData = {
        ...formData,
        image: finalImageUrl,
        displayOrder: formData.displayOrder ? Number(formData.displayOrder) : undefined,
      };

      const savePromise = initialData?._id
        ? updateHeroSection(initialData._id, sectionData)
        : createHeroSection(sectionData);

      toast.promise(savePromise.then((res) => {
        if (!res.success) throw new Error(res.error);
        return res;
      }), {
        loading: 'Saving...',
        success: initialData ? 'Hero Section updated successfully' : 'Hero Section created successfully',
        error: (err) => err.message || 'Failed to save section',
      }).then(() => {
        setTimeout(() => {
          router.push('/admin/website/hero-section');
        }, 1000);
      }).catch(() => {
        setIsSubmitting(false);
      });
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/website/hero-section"
          className="p-2 text-gold-500 hover:text-gold-700 dark:hover:text-gold-300 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gold-800 dark:text-white">
            {initialData ? 'Edit Hero Section' : 'Create Hero Section'}
          </h1>
          <p className="text-sm text-gold-500 dark:text-gold-400">
            {initialData ? 'Update the existing slide.' : 'Add a new slide to the public hero banner.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gold-800 rounded-xl shadow-sm border border-gold-200 dark:border-gold-700 overflow-hidden p-6 space-y-8">
        
        {/* Core Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gold-800 dark:text-white border-b border-gold-100 dark:border-gold-700 pb-2">Basic Details</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Internal Name (Admin Only) <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Summer Sale Banner"
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gold-800 dark:text-white border-b border-gold-100 dark:border-gold-700 pb-2">Content</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Badge Text <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="badge" 
                value={formData.badge}
                onChange={handleChange}
                required
                placeholder="e.g. Certified Unheated Gemstones"
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Hero Slide Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Stones you can verify, not just admire."
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Subtitle <span className="text-red-500">*</span></label>
              <textarea 
                name="subtitle" 
                rows={3}
                value={formData.subtitle}
                onChange={handleChange}
                required
                placeholder="e.g. Every gemstone carries an independent laboratory report."
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gold-800 dark:text-white border-b border-gold-100 dark:border-gold-700 pb-2">Call to Action (CTA) Buttons</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Primary Button Text <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="ctaText" 
                value={formData.ctaText}
                onChange={handleChange}
                required
                placeholder="Explore Collection"
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Primary Button Link <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="ctaHref" 
                value={formData.ctaHref}
                onChange={handleChange}
                required
                placeholder="/products"
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Secondary Button Text <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="secondaryCtaText" 
                value={formData.secondaryCtaText}
                onChange={handleChange}
                required
                placeholder="Free Consultation"
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Secondary Button Link <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="secondaryCtaHref" 
                value={formData.secondaryCtaHref}
                onChange={handleChange}
                required
                placeholder="/contact"
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gold-800 dark:text-white border-b border-gold-100 dark:border-gold-700 pb-2">Hero Image <span className="text-red-500">*</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gold-300 border-dashed rounded-lg cursor-pointer bg-gold-50 dark:hover:bg-bray-800 dark:bg-gold-800 hover:bg-gold-100 dark:border-gold-600 dark:hover:border-gold-500 dark:hover:bg-gold-700 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-gold-400" />
                    <p className="mb-2 text-sm text-gold-500 dark:text-gold-400">
                      <span className="font-semibold">Click to upload image</span>
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

            {/* Preview */}
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[160px] bg-gold-50/50 dark:bg-gold-900/50 rounded-lg border border-gold-200 dark:border-gold-800 p-2">
              {(imagePreview || formData.image) ? (
                <div className="relative w-full h-full min-h-[160px] rounded-md overflow-hidden group shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={imagePreview || formData.image} 
                    alt="Hero preview" 
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
                      className="text-white text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors shadow-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gold-400 dark:text-gold-600 h-full">
                  <span className="text-sm font-medium">No image selected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gold-800 dark:text-white border-b border-gold-100 dark:border-gold-700 pb-2">Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gold-700 dark:text-gold-300">Display Order</label>
              <input 
                type="number" 
                name="displayOrder" 
                value={formData.displayOrder}
                onChange={handleChange}
                placeholder="Leave blank to add at the end"
                className="w-full px-3 py-2 bg-gold-50 dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input 
                type="checkbox" 
                name="isActive" 
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-gold-600 rounded border-gold-300 focus:ring-gold-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gold-700 dark:text-gold-300">
                Publish Immediately (Is Active)
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gold-200 dark:border-gold-700 flex justify-end gap-3">
          <Link 
            href="/admin/website/hero-section"
            className="px-4 py-2 border border-gold-300 dark:border-gold-600 text-gold-700 dark:text-gold-300 rounded-md hover:bg-gold-50 dark:hover:bg-gold-800 font-medium transition-colors"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : <><Save size={18} /> Save Section</>}
          </button>
        </div>
      </form>
    </div>
  );
}
