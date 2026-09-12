import StatusBadge from './StatusBadge';

const LEAD_STATUS_MAP: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  FOLLOW_UP: 'warning',
  QUALIFIED: 'success',
  CONVERTED: 'success',
  CLOSED: 'neutral',
  SPAM: 'danger',
};

const ORDER_STATUS_MAP: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  PAYMENT_PENDING: 'warning',
  CONFIRMED: 'success',
  PROCESSING: 'info',
  PACKED: 'info',
  SHIPPED: 'info',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  PAYMENT_FAILED: 'danger',
  CANCELLED: 'danger',
  DELIVERY_FAILED: 'danger',
  RETURNED: 'danger',
};

const STATUS_MAPS: Record<string, Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'>> = {
  lead: LEAD_STATUS_MAP,
  order: ORDER_STATUS_MAP,
};

interface StatusPillProps {
  status: string;
  type?: 'lead' | 'order' | 'payment' | 'return' | 'refund';
}

export default function StatusPill({ status, type = 'lead' }: StatusPillProps) {
  const map = STATUS_MAPS[type] || {};
  const variant = map[status] || 'neutral';
  
  // Format string for display (e.g. FOLLOW_UP -> Follow Up)
  const displayLabel = status.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });

  return <StatusBadge label={displayLabel} variant={variant} />;
}
