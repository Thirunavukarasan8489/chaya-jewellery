'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Tag, Plus, X } from 'lucide-react';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { ProductFormValues } from '../ProductForm';

interface DiscountRulesTabProps {
  isActive: boolean;
}

export function DiscountRulesTab({ isActive }: DiscountRulesTabProps) {
  const { register, control, formState: { errors } } = useFormContext<ProductFormValues>();

  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control,
    name: 'discountRules'
  });

  return (
    <div className={isActive ? 'space-y-5' : 'hidden'}>
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-plum-800 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2">
            <Tag size={18} className="text-gold-500" />
            Bulk Discount Rules
          </h2>
          <p className="text-xs text-plum-500 mt-1">Add quantity-based discounts. If the category evaluates based on Variant Value, &apos;Qty&apos; refers to the total value (e.g. Carats) instead of pieces.</p>
        </div>
        <AdminButton type="button" variant="outline" onClick={() => appendRule({ minQty: 1, maxQty: 10, discountPercentage: 5 })}>
          <Plus size={16} className="mr-1" /> Add Rule
        </AdminButton>
      </div>

      <div className="space-y-3">
        {ruleFields.length === 0 && (
          <div className="p-4 border border-gray-200 dark:border-plum-800 border-dashed rounded-xl text-center text-plum-500 text-sm">
            No discount rules applied. Click &quot;Add Rule&quot; to set up tier pricing.
          </div>
        )}
        {ruleFields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-4 p-4 border border-gray-200 dark:border-plum-700 rounded-xl bg-white dark:bg-plum-950 relative">
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
              className="mt-7 text-rose-500 hover:text-rose-700 p-2"
              title="Remove Rule"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
