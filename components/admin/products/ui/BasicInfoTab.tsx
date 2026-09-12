'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Package } from 'lucide-react';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { ProductFormValues } from '../ProductForm';
import dynamic from 'next/dynamic';

const QuillEditor = dynamic(() => import('@/components/admin/ui/QuillEditor'), { ssr: false });

interface BasicInfoTabProps {
  categories: { value: string; label: string }[];
  isActive: boolean;
}

export function BasicInfoTab({ categories, isActive }: BasicInfoTabProps) {
  const { register, control, formState: { errors } } = useFormContext<ProductFormValues>();

  return (
    <div className={isActive ? 'space-y-6' : 'hidden'}>
      <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2 border-b border-gray-200 dark:border-plum-800 pb-3">
        <Package size={20} className="text-gold-500" />
        Basic Details
      </h2>

      <AdminInput
        label="Product Title *"
        placeholder="e.g. Natural Ceylon Blue Sapphire 5.62 Carat"
        {...register('name')}
        error={errors.name?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <AdminSelect
                label="Category *"
                placeholder="Choose category"
                options={categories}
                value={categories.find(c => c.value === field.value) || null}
                onChange={(opt: any) => field.onChange(opt ? opt.value : '')}
                error={errors.categoryId?.message}
              />
            )}
          />
        </div>

        <div>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <AdminSelect
                label="Catalog Status"
                options={[
                  { value: 'ACTIVE', label: 'Active (Visible on Store)' },
                  { value: 'DRAFT', label: 'Draft (Hidden)' }
                ]}
                value={[
                  { value: 'ACTIVE', label: 'Active (Visible on Store)' },
                  { value: 'DRAFT', label: 'Draft (Hidden)' }
                ].find(o => o.value === field.value) || null}
                onChange={(opt: any) => field.onChange(opt ? opt.value : 'ACTIVE')}
              />
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-plum-900 dark:text-ivory-100 mb-1.5">
          Short Description
        </label>
        <input
          type="text"
          placeholder="Key highlight or one-sentence stone summary"
          {...register('shortDescription')}
          className="w-full rounded-lg bg-white dark:bg-plum-950 text-plum-900 dark:text-ivory-100 border border-gray-300 dark:border-plum-700 focus:outline-none focus:ring-2 focus:ring-plum-600/30 focus:border-plum-600 px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-plum-900 dark:text-ivory-100 mb-1.5">
          Detailed Description
        </label>
        <div className="rounded-lg border border-gray-300 dark:border-plum-700 overflow-hidden bg-white dark:bg-plum-950 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 dark:[&_.ql-toolbar]:border-plum-700 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[150px] dark:[&_.ql-editor]:text-ivory-100">
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <QuillEditor
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Full gemological details, origins, astrology recommendations..."
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
