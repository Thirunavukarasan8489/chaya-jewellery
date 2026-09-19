import crypto from 'crypto';

/**
 * Cashfree Payment Gateway (Orders API). Docs:
 * https://www.cashfree.com/docs/api-reference/payments/latest/orders/create
 * https://www.cashfree.com/docs/payments/online/webhooks/signature-verification
 *
 * Sandbox vs production is derived from the App ID itself (Cashfree's own
 * convention: test/sandbox App IDs are prefixed "TEST...") rather than a
 * separate env flag that could be left pointing the wrong way after a key
 * rotation.
 */
const CASHFREE_API_VERSION = '2023-08-01';

function baseUrl() {
  const appId = process.env.CASHFREE_APP_ID || '';
  return appId.startsWith('TEST')
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg';
}

function authHeaders() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new Error('Cashfree is not configured (CASHFREE_APP_ID / CASHFREE_SECRET_KEY).');
  }
  return {
    'Content-Type': 'application/json',
    'x-client-id': appId,
    'x-client-secret': secretKey,
    'x-api-version': CASHFREE_API_VERSION,
  };
}

/** Cashfree's customer_id only allows alphanumeric/underscore/hyphen. */
function sanitizeCustomerId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'guest-customer';
}

/** Cashfree requires a valid 10-digit customer phone number. */
function sanitizePhone(phone: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits || '9999999999';
}

export async function createCashfreeOrder(params: {
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
}) {
  const cleanPhone = sanitizePhone(params.customerPhone);
  const cleanAmount = Math.max(1, Math.round(params.amount * 100) / 100);

  const res = await fetch(`${baseUrl()}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      order_id: params.orderNumber,
      // Cashfree takes the amount in the currency's major unit (rupees),
      // not paise — unlike Razorpay, do not multiply by 100 here.
      order_amount: cleanAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: sanitizeCustomerId(cleanPhone || params.customerName),
        customer_name: params.customerName?.trim() || 'Customer',
        customer_email: params.customerEmail?.trim() || undefined,
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: params.returnUrl,
        notify_url: params.notifyUrl,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Cashfree order creation failed:', data);
    throw new Error(data?.message || 'Failed to create Cashfree order');
  }

  return data as {
    payment_session_id: string;
    cf_order_id: string;
    order_id: string;
    order_status: string;
  };
}

/**
 * Verifies a Cashfree webhook signature: base64(HMAC-SHA256(secretKey,
 * timestamp + rawBody)) — the raw, unparsed request body, timestamp first
 * with no separator. Uses `CASHFREE_SECRET_KEY` (Cashfree doesn't require a
 * separate webhook secret for this signature scheme).
 */
export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!secretKey || !timestamp || !signature) return false;

  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(timestamp + rawBody)
    .digest('base64');

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Fetches order details directly from Cashfree Orders API.
 * Used for immediate payment verification when webhooks cannot reach
 * the server (e.g. local development) or as a real-time fallback check.
 */
export async function fetchCashfreeOrder(orderNumber: string) {
  try {
    const res = await fetch(`${baseUrl()}/orders/${orderNumber}`, {
      method: 'GET',
      headers: authHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data as {
      order_id: string;
      order_status: 'ACTIVE' | 'PAID' | 'EXPIRED' | string;
      order_amount: number;
      order_currency: string;
      cf_order_id: string;
      payment_session_id?: string;
    };
  } catch (err) {
    console.error(`Error fetching Cashfree order ${orderNumber}:`, err);
    return null;
  }
}

