import crypto from "crypto";

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
const CASHFREE_API_VERSION = "2023-08-01";

export type CashfreeOrder = {
  order_id: string;
  order_status: string;
  order_amount: number;
  order_currency: string;
  cf_order_id: string;
  payment_session_id?: string;
  created_at?: string;
  order_expiry_time?: string;
  customer_details?: {
    customer_phone?: string;
    customer_email?: string;
  };
};

export type CashfreePayment = {
  cf_payment_id: string | number;
  order_id?: string;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  payment_time?: string;
  bank_reference?: string;
};

export class CashfreeApiError extends Error {
  constructor(
    message: string,
    public response?: unknown,
  ) {
    super(message);
  }
}

type CashfreeCheckout = {
  orderId: string;
  amount: number;
  customerEmail?: string;
  customerPhone: string;
  // Used only when checking an unbound, legacy sequential order ID.
  createdAt?: Date;
};

/** Stable across retries, unique even when display-order counters are reset. */
export function cashfreeMerchantOrderId(localOrderId: string) {
  return `CHAYA_${localOrderId}`;
}

export function cashfreeOrderMatchesCheckout(
  existing: Pick<
    CashfreeOrder,
    | "order_id"
    | "order_amount"
    | "order_currency"
    | "customer_details"
    | "created_at"
  >,
  expected: CashfreeCheckout,
) {
  const expectedEmail = expected.customerEmail?.trim().toLowerCase() || "";
  const existingEmail =
    existing.customer_details?.customer_email?.trim().toLowerCase() || "";
  // Cashfree timestamps have second precision. A gateway order created before
  // this local purchase cannot belong to it, even if the customer/total match.
  const createdForThisPurchase =
    !expected.createdAt ||
    (!!existing.created_at &&
      Date.parse(existing.created_at) >=
        Math.floor(expected.createdAt.getTime() / 1000) * 1000);

  return (
    existing.order_id === expected.orderId &&
    existing.order_currency === "INR" &&
    Number.isFinite(existing.order_amount) &&
    Math.round(existing.order_amount * 100) ===
      Math.round(expected.amount * 100) &&
    !!existing.customer_details?.customer_phone &&
    sanitizePhone(existing.customer_details.customer_phone) ===
      sanitizePhone(expected.customerPhone) &&
    existingEmail === expectedEmail &&
    createdForThisPurchase
  );
}

export function cashfreeMode(): "sandbox" | "production" {
  return process.env.CASHFREE_APP_ID?.startsWith("TEST")
    ? "sandbox"
    : "production";
}

function baseUrl() {
  return cashfreeMode() === "sandbox"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";
}

function authHeaders() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new Error(
      "Cashfree is not configured (CASHFREE_APP_ID / CASHFREE_SECRET_KEY).",
    );
  }
  return {
    "Content-Type": "application/json",
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": CASHFREE_API_VERSION,
  };
}

/** Cashfree's customer_id only allows alphanumeric/underscore/hyphen. */
function sanitizeCustomerId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50) || "guest-customer";
}

/** Cashfree requires a valid 10-digit customer phone number. */
function sanitizePhone(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits || "9999999999";
}

type CreateOrderParams = CashfreeCheckout & {
  customerName: string;
  returnUrl: string;
  notifyUrl: string;
  expiresAt?: Date;
};

export function cashfreeCreateOrderRequest(params: CreateOrderParams) {
  const cleanPhone = sanitizePhone(params.customerPhone);
  return {
    order_id: params.orderId,
    // Cashfree takes the amount in the currency's major unit (rupees),
    // not paise — unlike Razorpay, do not multiply by 100 here.
    order_amount: Math.max(1, Math.round(params.amount * 100) / 100),
    order_currency: "INR",
    order_expiry_time: params.expiresAt?.toISOString(),
    customer_details: {
      customer_id: sanitizeCustomerId(cleanPhone || params.customerName),
      customer_name: params.customerName?.trim() || "Customer",
      customer_email: params.customerEmail?.trim() || undefined,
      customer_phone: cleanPhone,
    },
    order_meta: {
      return_url: params.returnUrl,
      notify_url: params.notifyUrl,
    },
  };
}

/** PGCreateOrder: persist its response before handing the session to the SDK. */
export async function createCashfreeOrder(
  params: CreateOrderParams,
): Promise<CashfreeOrder> {
  const request = cashfreeCreateOrderRequest(params);
  const res = await fetch(`${baseUrl()}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 409 && data?.code === "order_already_exists") {
      // A previous request may have created the gateway order even when the
      // browser never received its session. Keep the persisted merchant ID.
      const existing = await fetchCashfreeOrder(params.orderId);
      if (!existing) {
        throw new Error(
          "Unable to retrieve the existing payment session. Please try again.",
        );
      }

      // Order numbers can collide after a database reset or across environments.
      // Never hand out a session belonging to a different customer or amount.
      if (
        !cashfreeOrderMatchesCheckout(existing, {
          ...params,
          amount: request.order_amount,
        })
      ) {
        throw new CashfreeApiError(
          "The existing payment order does not match this checkout. Please contact us for help.",
        );
      }

      if (existing.order_status === "PAID") {
        return existing;
      }
      if (
        existing.order_status === "EXPIRED" ||
        existing.order_status === "TERMINATED"
      ) {
        throw new CashfreeApiError(
          "This payment session has expired or closed. Please start checkout again.",
          existing,
        );
      }
      if (existing.order_status !== "ACTIVE" || !existing.payment_session_id) {
        throw new CashfreeApiError(
          "This order has no active payment session. Please contact us for help.",
          existing,
        );
      }

      return { ...existing, payment_session_id: existing.payment_session_id };
    }

    throw new CashfreeApiError(
      data?.message || "Failed to create Cashfree order",
      data,
    );
  }

  if (
    !cashfreeOrderMatchesCheckout(data, {
      ...params,
      amount: request.order_amount,
    })
  ) {
    throw new CashfreeApiError(
      "Cashfree returned an order that does not match this checkout.",
    );
  }
  return data as CashfreeOrder;
}

export async function fetchCashfreePayments(
  orderId: string,
): Promise<CashfreePayment[]> {
  const response = await fetch(
    `${baseUrl()}/orders/${encodeURIComponent(orderId)}/payments`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(
      "Unable to verify Cashfree payment attempts. Please try again.",
    );
  const payments = await response.json();
  if (!Array.isArray(payments))
    throw new Error("Invalid Cashfree payments response.");
  return payments;
}

/**
 * Verifies a Cashfree webhook signature: base64(HMAC-SHA256(secretKey,
 * timestamp + rawBody)) — the raw, unparsed request body, timestamp first
 * with no separator. Uses `CASHFREE_SECRET_KEY` (Cashfree doesn't require a
 * separate webhook secret for this signature scheme).
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
): boolean {
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!secretKey || !timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(timestamp + rawBody)
    .digest("base64");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  return (
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf)
  );
}

/**
 * Fetches order details directly from Cashfree Orders API.
 * Used for immediate payment verification when webhooks cannot reach
 * the server (e.g. local development) or as a real-time fallback check.
 */
export async function fetchCashfreeOrder(orderId: string) {
  try {
    const res = await fetch(
      `${baseUrl()}/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: authHeaders(),
        cache: "no-store",
      },
    );

    // A failed lookup is not evidence that an order doesn't exist. Never
    // create a replacement after a timeout, authentication or server error.
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Cashfree lookup returned HTTP ${res.status}`);

    const data = await res.json();
    return data as CashfreeOrder;
  } catch (err) {
    console.error(`Error fetching Cashfree order ${orderId}:`, err);
    throw new Error(
      "Unable to retrieve the existing payment session. Please try again.",
    );
  }
}
