'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Search } from 'lucide-react';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { ProductFormValues } from '../ProductForm';

interface SeoTabProps {
  isActive: boolean;
}

export function SeoTab({ isActive }: SeoTabProps) {
  const { register } = useFormContext<ProductFormValues>();

  return (
    <div className={isActive ? 'space-y-5' : 'hidden'}>
      <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2 border-b border-gray-200 dark:border-plum-800 pb-3">
        <Search size={20} className="text-gold-500" />
        Search Engine Optimization (SEO)
      </h2>

      <div className="space-y-4">
        <AdminInput label="Meta Title" placeholder="Custom page title for search engines" {...register('metaTitle')} />
        <div>
          <label className="block text-sm font-medium text-plum-900 dark:text-ivory-100 mb-1.5">Meta Description</label>
          <textarea
            rows={3}
            placeholder="Brief snippet shown in Google search results..."
            {...register('metaDescription')}
            className="w-full rounded-lg bg-white dark:bg-plum-950 text-plum-900 dark:text-ivory-100 border border-gray-300 dark:border-plum-700 focus:outline-none focus:ring-2 focus:ring-plum-600/30 focus:border-plum-600 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
