import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type StatusType = 
  | 'PENDING' | 'PAYMENT_PENDING' 
  | 'CONFIRMED' | 'COMPLETED'
  | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  | 'FAILED' | 'CANCELLED' | 'RETURNED'
  | 'ACTIVE' | 'INACTIVE';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || '').toString().toUpperCase();

  let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200'; // default

  switch (normalized) {
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'DELIVERED':
    case 'ACTIVE':
      colorClasses = 'bg-green-50 text-green-700 border-green-200';
      break;
    case 'PENDING':
    case 'PAYMENT_PENDING':
    case 'PROCESSING':
    case 'PACKED':
      colorClasses = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      break;
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'FAILED':
    case 'CANCELLED':
    case 'RETURNED':
    case 'INACTIVE':
      colorClasses = 'bg-red-50 text-red-700 border-red-200';
      break;
  }

  return (
    <span className={cn('px-2.5 py-1 text-xs font-medium border rounded-full whitespace-nowrap', colorClasses, className)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
