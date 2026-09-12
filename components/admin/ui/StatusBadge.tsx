import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type StatusVariant = 
  | 'success' // e.g. Delivered, Active, Paid
  | 'warning' // e.g. Pending, Low Stock
  | 'danger'  // e.g. Cancelled, Failed, Out of Stock
  | 'info'    // e.g. Processing, Shipped
  | 'neutral'; // e.g. Draft, Inactive

interface StatusBadgeProps {
  label?: string;
  status?: string;
  variant?: StatusVariant;
  className?: string;
}

export default function StatusBadge({ label, status, variant, className }: StatusBadgeProps) {
  
  const variantStyles = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
    info: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400 border border-gold-200 dark:border-gold-800',
    neutral: 'bg-gold-100 text-gold-700 dark:bg-gold-800 dark:text-gold-300 border border-gold-200 dark:border-gold-700',
  };

  const displayLabel = label || status || 'Unknown';
  
  // Auto-map status to variant if variant is not explicitly provided
  let activeVariant: StatusVariant = variant || 'neutral';
  
  if (!variant && status) {
    const s = status.toUpperCase();
    if (['ACTIVE', 'IN_STOCK', 'QUALIFIED', 'CONVERTED', 'DELIVERED', 'COMPLETED', 'SUCCESS'].includes(s)) activeVariant = 'success';
    else if (['PENDING', 'LOW_STOCK', 'CONTACTED', 'FOLLOW_UP', 'PROCESSING'].includes(s)) activeVariant = 'warning';
    else if (['INACTIVE', 'OUT_OF_STOCK', 'CANCELLED', 'CLOSED', 'SPAM', 'FAILED'].includes(s)) activeVariant = 'danger';
    else if (['NEW', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(s)) activeVariant = 'info';
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-semibold", variantStyles[activeVariant], className)}>
      {displayLabel.replace(/_/g, ' ')}
    </span>
  );
}
