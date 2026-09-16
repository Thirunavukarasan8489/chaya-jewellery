"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CldImage } from '@/components/shared/CldImage';
import DataTable from '@/components/admin/ui/DataTable';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import DeleteConfirmButton from '@/components/admin/ui/DeleteConfirmButton';
import { deleteVariant } from '@/lib/actions/product.actions';
import { Eye, Edit, Image as ImageIcon, Filter } from 'lucide-react';

type VariantRow = {
  _id: string;
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  reservedQuantity?: number;
  lowStockThreshold?: number;
  primaryImage?: { url: string; altText?: string };
  productId?: { _id: string; name: string; slug: string } | string;
};

function getStockStatus(item: VariantRow) {
  const available = Math.max(0, (item.stock || 0) - (item.reservedQuantity || 0));
  return available === 0 ? 'OUT_OF_STOCK' : available <= (item.lowStockThreshold || 5) ? 'LOW_STOCK' : 'IN_STOCK';
}

export default function ProductVariantsTable({ variants }: { variants: VariantRow[] }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [parentProductFilter, setParentProductFilter] = useState('');

  const uniqueParentProducts = Array.from(
    new Set(
      variants
        .map((v) => (typeof v.productId === 'object' ? v.productId?.name : null))
        .filter(Boolean) as string[]
    )
  );

  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      if (stockStatusFilter && getStockStatus(v) !== stockStatusFilter) return false;
      if (parentProductFilter) {
        const productName = typeof v.productId === 'object' ? v.productId?.name : null;
        if (productName !== parentProductFilter) return false;
      }
      return true;
    });
  }, [variants, stockStatusFilter, parentProductFilter]);

  const renderFilter = () => (
    <div className="relative">
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className={`p-2 border rounded-lg transition-colors flex items-center gap-2 ${stockStatusFilter || parentProductFilter ? 'bg-gold-50 border-gold-300 text-gold-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
      >
        <Filter size={18} />
        {(stockStatusFilter || parentProductFilter) && (
          <span className="w-2 h-2 rounded-none bg-emerald-500"></span>
        )}
      </button>

      {filterOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm">Filter Variants</h4>
            <button
              onClick={() => {
                setStockStatusFilter('');
                setParentProductFilter('');
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Stock Status</label>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Parent Product</label>
            <select
              value={parentProductFilter}
              onChange={(e) => setParentProductFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Products</option>
              {uniqueParentProducts.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const columns = [
    {
      header: 'Variant',
      cell: (item: VariantRow) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-plum-800 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-plum-700 relative">
            {item.primaryImage?.url ? (
              <CldImage src={item.primaryImage.url} alt="" fill sizes="40px" className="object-cover" />
            ) : (
              <ImageIcon size={16} className="text-gray-300" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{item.sku || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Parent Product',
      cell: (item: VariantRow) => {
        const product = typeof item.productId === 'object' ? item.productId : null;
        return product ? (
          <Link href={`/admin/products/${product._id}`} className="text-sm text-gold-700 dark:text-gold-300 hover:underline">
            {product.name}
          </Link>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      },
    },
    {
      header: 'Price',
      cell: (item: VariantRow) => (
        <span className="font-medium text-gray-900 dark:text-white">₹{(item.price || 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: 'Stock',
      cell: (item: VariantRow) => {
        const available = Math.max(0, (item.stock || 0) - (item.reservedQuantity || 0));
        return (
          <span className={available <= (item.lowStockThreshold || 5) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}>
            {available} available
          </span>
        );
      },
    },
    {
      header: 'Status',
      cell: (item: VariantRow) => <StatusBadge status={getStockStatus(item)} />,
    },
    {
      header: 'Actions',
      cell: (item: VariantRow) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/productvarients/${item._id}/view`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-plum-800 transition-colors"
            title="View"
          >
            <Eye size={16} />
          </Link>
          <Link
            href={`/admin/productvarients/${item._id}/edit`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </Link>
          <DeleteConfirmButton
            entityId={item._id}
            entityName={item.name}
            deleteAction={deleteVariant}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns as any}
      data={filteredVariants}
      title="Product Variants"
      renderFilter={renderFilter}
      getSearchText={(item) =>
        [item.name, item.sku, typeof item.productId === 'object' ? item.productId?.name : null]
          .filter(Boolean)
          .join(' ')
      }
    />
  );
}
