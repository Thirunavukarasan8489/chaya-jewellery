"use client";

import Link from 'next/link';
import Image from 'next/image';
import DataTable from '@/components/admin/ui/DataTable';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { Eye, Edit, Image as ImageIcon } from 'lucide-react';

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

export default function ProductVariantsTable({ variants }: { variants: VariantRow[] }) {
  const columns = [
    {
      header: 'Variant',
      cell: (item: VariantRow) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-plum-800 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-plum-700 relative">
            {item.primaryImage?.url ? (
              <Image src={item.primaryImage.url} alt="" fill sizes="40px" className="object-cover" />
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
      cell: (item: VariantRow) => {
        const available = Math.max(0, (item.stock || 0) - (item.reservedQuantity || 0));
        const status = available === 0 ? 'OUT_OF_STOCK' : available <= (item.lowStockThreshold || 5) ? 'LOW_STOCK' : 'IN_STOCK';
        return <StatusBadge status={status} />;
      },
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
        </div>
      ),
    },
  ];

  return <DataTable columns={columns as any} data={variants} title="Product Variants" />;
}
