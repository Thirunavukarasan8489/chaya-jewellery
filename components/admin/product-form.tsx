import React from 'react';

function FormSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gold-200 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gold-800 mb-4 pb-2 border-b border-gold-100">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export function ProductForm() {
  return (
    <form className="max-w-4xl">
      <FormSection title="Basic Information">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gold-700 mb-1">Product Name</label>
            <input type="text" className="w-full border border-gold-300 rounded-md p-2" placeholder="e.g. Emerald Ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-700 mb-1">Slug</label>
            <input type="text" className="w-full border border-gold-300 rounded-md p-2" placeholder="emerald-ring" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gold-700 mb-1">Description</label>
          <textarea className="w-full border border-gold-300 rounded-md p-2 h-32" />
        </div>
      </FormSection>

      <FormSection title="Pricing & Inventory">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gold-700 mb-1">Selling Price (₹)</label>
            <input type="number" className="w-full border border-gold-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-700 mb-1">SKU</label>
            <input type="text" className="w-full border border-gold-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-700 mb-1">Stock Quantity</label>
            <input type="number" className="w-full border border-gold-300 rounded-md p-2" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Purchase Configuration">
        <div>
          <label className="block text-sm font-medium text-gold-700 mb-1">Purchase Type</label>
          <select className="w-full border border-gold-300 rounded-md p-2">
            <option value="BUY_ONLY">Buy Only (Add to Cart)</option>
            <option value="ENQUIRY_ONLY">Enquiry Only (Lead Form)</option>
            <option value="BUY_AND_ENQUIRE">Buy & Enquire</option>
          </select>
        </div>
      </FormSection>

      <div className="flex justify-end space-x-4 mt-6">
        <button type="button" className="px-4 py-2 border border-gold-300 rounded-md text-gold-700 hover:bg-gold-50">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-gold-900 text-white rounded-md hover:bg-gold-800">Save Product</button>
      </div>
    </form>
  );
}
