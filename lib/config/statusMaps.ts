export const orderStatusConfig = {
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-amber-100 text-amber-700', nextAllowed: ['CONFIRMED', 'CANCELLED'] },
  CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', nextAllowed: ['PROCESSING', 'CANCELLED'] },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-700', nextAllowed: ['PACKED', 'CANCELLED'] },
  PACKED: { label: 'Packed', color: 'bg-indigo-100 text-indigo-700', nextAllowed: ['SHIPPED'] },
  SHIPPED: { label: 'Shipped', color: 'bg-purple-100 text-purple-700', nextAllowed: ['OUT_FOR_DELIVERY'] },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-teal-100 text-teal-700', nextAllowed: ['DELIVERED', 'DELIVERY_FAILED'] },
  DELIVERED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', nextAllowed: ['RETURNED'] },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', nextAllowed: [] },
  DELIVERY_FAILED: { label: 'Delivery Failed', color: 'bg-red-100 text-red-700', nextAllowed: ['RETURNED'] },
  RETURNED: { label: 'Returned', color: 'bg-slate-100 text-slate-700', nextAllowed: [] }
};

export const paymentStatusConfig = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700' }
};

export const leadStatusConfig = {
  NEW: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  CONTACTED: { label: 'Contacted', color: 'bg-amber-100 text-amber-700' },
  FOLLOW_UP: { label: 'Follow Up', color: 'bg-orange-100 text-orange-700' },
  QUALIFIED: { label: 'Qualified', color: 'bg-emerald-100 text-emerald-700' },
  CONVERTED: { label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-700' },
  SPAM: { label: 'Spam', color: 'bg-red-100 text-red-700' }
};
