'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ShoppingBag } from 'lucide-react';
import { ProductFormValues } from '../ProductForm';

interface PurchaseRulesTabProps {
  isActive: boolean;
}

export function PurchaseRulesTab({ isActive }: PurchaseRulesTabProps) {
  const { register } = useFormContext<ProductFormValues>();

  return (
    <div className={isActive ? 'space-y-5' : 'hidden'}>
      <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100 flex items-center gap-2 border-b border-gray-200 dark:border-plum-800 pb-3">
        <ShoppingBag size={20} className="text-gold-500" />
        Purchase & Consultation Settings
      </h2>

      <div className="space-y-3">
        <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-plum-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-plum-900/50 transition-colors">
          <input type="radio" value="BUY_ENQUIRE" {...register('purchaseType')} className="mt-1 accent-plum-600" />
          <div>
            <p className="font-medium text-plum-900 dark:text-ivory-100">Buy & Enquire (Recommended)</p>
            <p className="text-xs text-plum-500">Customer can either Add to Cart directly or submit an enquiry lead.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-plum-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-plum-900/50 transition-colors">
          <input type="radio" value="BUY_ONLY" {...register('purchaseType')} className="mt-1 accent-plum-600" />
          <div>
            <p className="font-medium text-plum-900 dark:text-ivory-100">Buy Only (Standard E-Commerce)</p>
            <p className="text-xs text-plum-500">Direct checkout only. No consultation form shown on product page.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-plum-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-plum-900/50 transition-colors">
          <input type="radio" value="ENQUIRE_ONLY" {...register('purchaseType')} className="mt-1 accent-plum-600" />
          <div>
            <p className="font-medium text-plum-900 dark:text-ivory-100">Enquire Only (High-Value / Collector Stones)</p>
            <p className="text-xs text-plum-500">Disables direct cart checkout. Customer must submit an enquiry lead.</p>
          </div>
        </label>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-plum-800 space-y-3">
        <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-plum-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-plum-900/50 transition-colors">
          <input type="checkbox" {...register('whatsappEnabled')} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
          <span className="text-sm font-medium text-plum-700 dark:text-plum-300">Enable 1-Click WhatsApp Consultation Button on product page</span>
        </label>
      </div>
    </div>
  );
}
