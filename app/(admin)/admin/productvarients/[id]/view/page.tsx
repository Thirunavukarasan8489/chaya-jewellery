import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Image as ImageIcon, Package, Tag, FileText } from 'lucide-react';
import { getProductVariantById } from '@/lib/actions/product.actions';
import StatusBadge from '@/components/admin/ui/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function ViewProductVariantPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const variantRes = await getProductVariantById(params.id);
  if (!variantRes.success || !variantRes.data) notFound();

  const variant = variantRes.data;
  const product = typeof variant.productId === 'object' ? variant.productId : null;

  const available = Math.max(0, (variant.stock || 0) - (variant.reservedQuantity || 0));
  const threshold = variant.lowStockThreshold || 5;
  const stockStatus = available === 0 ? 'OUT_OF_STOCK' : available <= threshold ? 'LOW_STOCK' : 'IN_STOCK';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/productvarients" className="inline-flex items-center gap-2 text-sm text-gold-500 hover:text-gold-700 dark:hover:text-gold-300 mb-2 transition-colors">
            <ArrowLeft size={16} /> Back to Product Variants
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gold-800 dark:text-white">{variant.name}</h1>
            <StatusBadge status={stockStatus} />
          </div>
          <p className="text-sm text-gold-500 dark:text-gold-400 mt-1 flex items-center gap-2">
            <span>SKU: {variant.sku || 'N/A'}</span>
            <span className="text-gold-300 dark:text-gold-600">•</span>
            <span>
              Variant of{' '}
              {product ? (
                <Link href={`/admin/products/${product._id}`} className="text-gold-600 hover:underline">
                  {product.name}
                </Link>
              ) : 'product'}
            </span>
          </p>
        </div>

        <Link
          href={`/admin/productvarients/${variant._id}/edit`}
          className="inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Edit size={16} />
          Edit Variant
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Pricing & Stock */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <Package size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">Pricing & Stock</h2>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gold-50 dark:bg-gold-800/50 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Price</h3>
                <p className="text-gold-800 dark:text-gold-200 font-semibold">₹{(variant.price || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-gold-50 dark:bg-gold-800/50 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Compare Price</h3>
                <p className="text-gold-800 dark:text-gold-200 font-semibold">{variant.comparePrice ? `₹${variant.comparePrice.toLocaleString('en-IN')}` : '—'}</p>
              </div>
              <div className="bg-gold-50 dark:bg-gold-800/50 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">In Stock</h3>
                <p className="text-gold-800 dark:text-gold-200 font-semibold">{variant.stock || 0}</p>
              </div>
              <div className="bg-gold-50 dark:bg-gold-800/50 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Available</h3>
                <p className="text-gold-800 dark:text-gold-200 font-semibold">{available}</p>
              </div>
              <div className="bg-gold-50 dark:bg-gold-800/50 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Variant Value</h3>
                <p className="text-gold-800 dark:text-gold-200 font-semibold">{variant.variantValue ?? '—'}</p>
              </div>
              <div className="bg-gold-50 dark:bg-gold-800/50 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Size</h3>
                <p className="text-gold-800 dark:text-gold-200 font-semibold">{variant.size || '—'}</p>
              </div>
            </div>
          </div>

          {/* Cover Image & Gallery */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <ImageIcon size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">Cover Image & Gallery</h2>
            </div>
            <div className="p-5 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 shrink-0">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-3">Cover</h3>
                <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-gold-200 dark:border-gold-700 bg-gold-50 dark:bg-gold-800 shadow-sm">
                  {variant.primaryImage?.url ? (
                    <Image src={variant.primaryImage.url} alt={variant.primaryImage.altText || variant.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gold-400 text-sm">
                      <ImageIcon size={24} className="mb-2 opacity-50" />
                      No cover image
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 border-l border-gold-100 dark:border-gold-800 pl-0 md:pl-6 pt-6 md:pt-0 mt-6 md:mt-0">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-3">Gallery ({variant.gallery?.length || 0})</h3>
                {variant.gallery && variant.gallery.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {variant.gallery.map((img: any, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gold-200 dark:border-gold-700 bg-gold-50 dark:bg-gold-800 shadow-sm">
                        {img.url && <Image src={img.url} alt={img.altText || `Gallery image ${idx + 1}`} fill sizes="15vw" className="object-cover" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-gold-200 dark:border-gold-800 rounded-xl bg-gold-50/50 dark:bg-gold-900/20">
                    <p className="text-sm text-gold-500 dark:text-gold-400">No gallery images uploaded.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discount Rules */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <Tag size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">Discount Rules</h2>
            </div>
            {variant.discountRules && variant.discountRules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gold-50 dark:bg-gold-800/50 text-gold-600 dark:text-gold-400 text-xs border-b border-gold-200 dark:border-gold-700">
                    <tr>
                      <th className="px-4 py-3 font-medium">Min Qty</th>
                      <th className="px-4 py-3 font-medium">Max Qty</th>
                      <th className="px-4 py-3 font-medium">Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-100 dark:divide-gold-800">
                    {variant.discountRules.map((rule: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-gold-800 dark:text-gold-200">{rule.minQty}</td>
                        <td className="px-4 py-3 text-gold-800 dark:text-gold-200">{rule.maxQty}</td>
                        <td className="px-4 py-3 text-gold-800 dark:text-gold-200 font-semibold">{rule.discountPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-gold-500 dark:text-gold-400">No discount rules for this variant.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Purchase Rules */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <Tag size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">Purchase Rules</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3 bg-gold-50 dark:bg-gold-800/50 rounded-lg border border-gold-200 dark:border-gold-700">
                <p className="text-sm font-semibold text-gold-800 dark:text-gold-200">
                  {variant.purchaseType === 'BUY_ONLY' ? 'Buy Only' : variant.purchaseType === 'ENQUIRE_ONLY' ? 'Enquire Only' : 'Buy & Enquire'}
                </p>
              </div>
              <p className="text-xs text-gold-500 dark:text-gold-400">
                WhatsApp Consultation: <span className="font-medium">{variant.whatsappEnabled ? 'Enabled' : 'Disabled'}</span>
              </p>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <FileText size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">SEO</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Meta Title</h4>
                <p className="text-gold-800 dark:text-gold-200 text-sm font-medium">{variant.metaTitle || variant.name}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Meta Description</h4>
                <p className="text-gold-600 dark:text-gold-400 text-sm bg-gold-50 dark:bg-gold-800/30 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                  {variant.metaDescription || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
