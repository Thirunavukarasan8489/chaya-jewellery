'use client';

import React from 'react';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';
import { UploadCloud, X, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { ProductFormValues } from '../ProductForm';

interface MediaUploadTabProps {
  isActive: boolean;
  coverFile: { file?: File; previewUrl: string; isExisting: boolean } | null;
  setCoverFile: (val: { file?: File; previewUrl: string; isExisting: boolean } | null) => void;
  galleryItems: { file?: File; previewUrl: string; id: string; isExisting: boolean }[];
  handleCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeGalleryImage: (index: number) => void;
}

export function MediaUploadTab({
  isActive,
  coverFile,
  setCoverFile,
  galleryItems,
  handleCoverUpload,
  handleGalleryUpload,
  removeGalleryImage
}: MediaUploadTabProps) {
  const { register, setValue } = useFormContext<ProductFormValues>();

  const handleRemoveCover = () => {
    if (coverFile && !coverFile.isExisting) {
      URL.revokeObjectURL(coverFile.previewUrl);
    }
    setCoverFile(null);
    setValue('primaryImage', { url: '', altText: '' }, { shouldValidate: true });
  };

  return (
    <div className={isActive ? 'space-y-6' : 'hidden'}>
      <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2 border-b border-gray-200 dark:border-plum-800 pb-3">
        <ImageIcon size={20} className="text-gold-500" />
        Cover Image & Feature Gallery
      </h2>

      {/* Cover (Primary) Image */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-plum-800 dark:text-plum-200">
          Cover Image (Primary Card & Catalog Thumbnail) *
        </label>

        {coverFile ? (
          <div className="space-y-3 max-w-md">
            <div className="relative w-48 h-48 rounded-xl border-2 border-emerald-500 overflow-hidden shadow-sm group">
              <Image src={coverFile.previewUrl} alt="Cover Preview" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              <button
                type="button"
                onClick={handleRemoveCover}
                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 transition-colors"
                title="Remove Cover Image"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-plum-900/90 text-white text-center py-1 text-xs font-semibold">
                Primary Cover
              </div>
            </div>
            <AdminInput
              label="Cover Image Alt Text"
              placeholder="e.g. Untreated Burmese Ruby gemstone"
              {...register('primaryImage.altText')}
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 dark:border-plum-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-plum-900/40 hover:bg-gray-100 dark:hover:bg-plum-800/60 transition-colors relative cursor-pointer group max-w-md">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-plum-900/40 text-plum-500 dark:text-plum-300 mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UploadCloud size={24} />
            </div>
            <p className="text-sm font-medium text-plum-800 dark:text-plum-200">
              Click or drop cover image here
            </p>
            <p className="text-xs text-plum-400 mt-1">High resolution PNG, JPG, WebP</p>
          </div>
        )}
      </div>

      {/* Gallery Images */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-plum-800">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-semibold text-plum-800 dark:text-plum-200">
              Feature Images (Gallery Views, Angles, Certificates)
            </label>
            <p className="text-xs text-plum-500">Upload multiple angle photos and certificates</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {galleryItems.map((item, idx) => (
            <div key={item.id} className="space-y-2">
              <div className="relative aspect-square rounded-xl border border-gray-200 dark:border-plum-700 overflow-hidden group shadow-sm">
                {item.previewUrl ? (
                  <Image src={item.previewUrl} alt={`Gallery Preview ${idx + 1}`} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-plum-900 flex items-center justify-center text-plum-400 text-xs text-center p-2">Invalid Image</div>
                )}
                <button
                  type="button"
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="Remove image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Alt text"
                {...register(`gallery.${idx}.altText`)}
                className="w-full text-xs rounded-md bg-white dark:bg-plum-950 text-plum-900 dark:text-ivory-100 border border-gray-200 dark:border-plum-700 focus:outline-none focus:ring-1 focus:ring-plum-600 px-2 py-1.5"
              />
            </div>
          ))}

          {/* Upload Box */}
          <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-plum-700 bg-gray-50 dark:bg-plum-900/40 hover:bg-gray-100 dark:hover:bg-plum-800 flex flex-col items-center justify-center cursor-pointer transition-colors group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleGalleryUpload}
              className="hidden"
            />
            <div className="w-9 h-9 bg-white dark:bg-plum-800 rounded-full flex items-center justify-center shadow-sm text-plum-500 dark:text-plum-300 mb-1 group-hover:scale-110 transition-transform">
              <Plus size={18} />
            </div>
            <span className="text-xs font-medium text-plum-600 dark:text-plum-300">
              Add Images
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
