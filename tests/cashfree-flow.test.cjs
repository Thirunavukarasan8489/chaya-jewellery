/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { Types } = require("mongoose");
const ts = require("typescript");

const sources = new Map();
function load(file, dependencies, globals) {
  if (!sources.has(file)) {
    sources.set(
      file,
      ts.transpileModule(
        readFileSync(path.resolve(__dirname, "..", file), "utf8"),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
          },
        },
      ).outputText,
    );
  }
  const loaded = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    "fetch",
    "process",
    "console",
    sources.get(file),
  )(
    (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      if (name === "crypto") return crypto;
      throw new Error(`Unexpected dependency: ${name}`);
    },
    loaded,
    loaded.exports,
    globals.fetch,
    globals.process,
    { error() {} },
  );
  return loaded.exports;
}

const localId = "6a0000000000000000000007";
const merchantId = `CHAYA_${localId}`;
const orderNumber = "ORD-2026-0007";
const localCreatedAt = new Date("2026-09-20T16:06:50.338Z");
const activeGatewayOrder = {
  order_id: orderNumber,
  order_status: "ACTIVE",
  order_amount: 1234.5,
  order_currency: "INR",
  cf_order_id: "gateway-7",
  payment_session_id: "test-session",
  created_at: "2026-09-20T16:06:51Z",
  customer_details: {
    customer_email: "customer@example.com",
    customer_phone: "9876543210",
  },
};
const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
const duplicate = () => response(409, { code: "order_already_exists" });
const created = (id = merchantId) =>
  response(200, { ...activeGatewayOrder, order_id: id });

// Real action, service and webhook modules; only HTTP, DB and inventory are fake.
function fixture(responses, changes = {}, options = {}) {
  const calls = [];
  const writes = [];
  const inventory = [];
  let transactions = 0;
  const order = {
    _id: localId,
    orderNumber,
    createdAt: localCreatedAt,
    customerName: "Customer",
    email: "customer@example.com",
    phone: "+91 98765 43210",
    total: 1234.5,
    paymentMethod: "UPI",
    paymentStatus: "PENDING",
    orderStatus: "PAYMENT_PENDING",
    items: [{ productId: "product-7", variantId: "variant-7", quantity: 1 }],
    ...changes,
    async save() {
      writes.push({ saved: true });
    },
  };
  const globals = {
    process: {
      env: {
        CASHFREE_APP_ID: "TEST_fixture",
        CASHFREE_SECRET_KEY: "fixture-secret",
        NEXTAUTH_URL: "https://shop.example",
      },
    },
    fetch: async (url, request) => {
      calls.push({ url, ...request, boundId: order.cashfreeOrderId });
      const next = responses.shift();
      assert.ok(next, "Unexpected gateway request");
      if (next instanceof Error) throw next;
      return next;
    },
  };
  const service = load("lib/services/cashfree.ts", {}, globals);
  const dependencies = {
    "@/lib/db": async () => {},
    "@/lib/services/cashfree": service,
    "@/lib/models/order": {
      Order: {
        findOne: async (query) => {
          if (!query.$or) return order;
          const matches = query.$or.some((filter) =>
            Object.entries(filter).every(([key, value]) =>
              value === null ? order[key] == null : order[key] === value,
            ),
          );
          return matches ? order : null;
        },
        findOneAndUpdate: async (filter, update) => {
          assert.equal(filter.cashfreeOrderId, null);
          if (options.concurrentId) {
            order.cashfreeOrderId = options.concurrentId;
            return null;
          }
          writes.push(update);
          Object.assign(order, update.$set);
          return order;
        },
        findById: async () => order,
        create: async ([data]) => {
          writes.push(data);
          return [data];
        },
      },
    },
    "@/lib/models/customer": {
      Customer: {
        findOne: () => ({ session: async () => null }),
        create: async () => [{ _id: localId }],
      },
    },
    "@/lib/models/product-variant": {
      ProductVariant: {
        find: async () => [
          {
            _id: "variant-7",
            productId: "product-7",
            name: "Ring",
            price: 1000,
          },
        ],
      },
    },
    "@/lib/models/category": { Category: {} },
    "@/lib/models/counter": { findOneAndUpdate: async () => ({ seq: 7 }) },
    "@/lib/auth": { getSession: async () => null },
    "@/lib/inventory": {
      reserveInventory: async () => {},
      finalizeInventory: async (...args) => {
        inventory.push(args);
      },
    },
    mongoose: {
      Types,
      startSession: async () => ({
        startTransaction() {
          transactions++;
        },
        async commitTransaction() {},
        async abortTransaction() {},
        endSession() {},
      }),
    },
    "next/server": {
      NextResponse: { json: (data, init) => Response.json(data, init) },
    },
  };
  const actions = load(
    "lib/actions/checkout.actions.ts",
    dependencies,
    globals,
  );
  const webhook = load(
    "app/api/webhooks/cashfree/route.ts",
    dependencies,
    globals,
  );
  return {
    actions,
    webhook,
    calls,
    writes,
    order,
    inventory,
    get transactions() {
      return transactions;
    },
  };
}

function webhookRequest(id = merchantId, changes = {}) {
  const raw = JSON.stringify({
    type: "PAYMENT_SUCCESS_WEBHOOK",
    data: {
      order: { order_id: id, order_amount: 1234.5, order_currency: "INR" },
      customer_details: activeGatewayOrder.customer_details,
      payment: { payment_status: "SUCCESS", cf_payment_id: "payment-7" },
      ...changes,
    },
  });
  const timestamp = "1790000000000";
  const signature = crypto
    .createHmac("sha256", "fixture-secret")
    .update(timestamp + raw)
    .digest("base64");
  return new Request("https://shop.example/api/webhooks/cashfree", {
    method: "POST",
    body: raw,
    headers: {
      "x-webhook-timestamp": timestamp,
      "x-webhook-signature": signature,
    },
  });
}

test("new purchases persist different merchant IDs even when display numbers repeat", async () => {
  const f = fixture([]);
  const input = {
    _id: localId,
    cashfreeOrderId: "client-supplied-id",
    customerName: "Customer",
    email: "customer@example.com",
    phone: "9876543210",
    shippingAddress: {
      street: "Test",
      city: "Test",
      pincode: "400001",
      state: "Maharashtra",
    },
    paymentMethod: "UPI",
    items: [{ productId: "product-7", variantId: "variant-7", quantity: 1 }],
  };
  const first = await f.actions.placeOrder(input);
  const second = await f.actions.placeOrder(input);
  assert.equal(first.success, true, first.error);
  assert.equal(second.success, true, second.error);
  assert.equal(first.data.orderNumber, second.data.orderNumber);
  assert.notEqual(first.data._id, localId);
  assert.equal(first.data.cashfreeOrderId, `CHAYA_${first.data._id}`);
  assert.notEqual(first.data.cashfreeOrderId, second.data.cashfreeOrderId);
});

test("a saved merchant ID is used directly, with display number retained in the return URL", async () => {
  const f = fixture([created()], { cashfreeOrderId: merchantId });
  assert.equal(
    (await f.actions.createCashfreePaymentSession(orderNumber)).success,
    true,
  );
  assert.equal(f.calls.length, 1);
  const sent = JSON.parse(f.calls[0].body);
  assert.equal(sent.order_id, merchantId);
  assert.equal(
    sent.order_meta.return_url,
    `https://shop.example/checkout/success?order=${orderNumber}`,
  );
});

test("a colliding legacy ID gets a persisted unique ID before creating its session", async () => {
  const f = fixture([
    response(200, {
      ...activeGatewayOrder,
      order_amount: 999,
      created_at: "2026-09-19T03:48:08Z",
      customer_details: {
        customer_phone: "9000000000",
        customer_email: "older@example.com",
      },
    }),
    created(),
  ]);
  const result = await f.actions.createCashfreePaymentSession(orderNumber);
  assert.equal(result.success, true);
  assert.equal(f.order.orderNumber, orderNumber);
  assert.equal(f.order.cashfreeOrderId, merchantId);
  assert.equal(f.calls[1].boundId, merchantId);
  assert.equal(JSON.parse(f.calls[1].body).order_id, merchantId);
});

test("an absent legacy order also receives the stable unique ID", async () => {
  const f = fixture([response(404, {}), created()]);
  assert.equal(
    (await f.actions.createCashfreePaymentSession(orderNumber)).success,
    true,
  );
  assert.equal(f.order.cashfreeOrderId, merchantId);
});

test("a matching legacy session is preserved", async () => {
  const f = fixture([
    response(200, activeGatewayOrder),
    duplicate(),
    created(orderNumber),
  ]);
  const result = await f.actions.createCashfreePaymentSession(orderNumber);
  assert.equal(result.paymentSessionId, activeGatewayOrder.payment_session_id);
  assert.equal(f.order.cashfreeOrderId, orderNumber);
  assert.equal(JSON.parse(f.calls[1].body).order_id, orderNumber);
});

test("a matching paid legacy order never receives a new merchant ID", async () => {
  const paid = { ...activeGatewayOrder, order_status: "PAID" };
  const f = fixture([response(200, paid), duplicate(), response(200, paid)]);
  const result = await f.actions.createCashfreePaymentSession(orderNumber);
  assert.equal(result.success, false);
  assert.match(result.error, /already been paid/);
  assert.equal(f.order.cashfreeOrderId, orderNumber);
});

test("legacy lookup failures do not persist an ID or create another payment", async () => {
  for (const failure of [
    response(401, {}),
    response(500, {}),
    new Error("Timeout"),
  ]) {
    const f = fixture([failure]);
    assert.equal(
      (await f.actions.createCashfreePaymentSession(orderNumber)).success,
      false,
    );
    assert.equal(f.writes.length, 0);
    assert.deepEqual(
      f.calls.map((call) => call.method),
      ["GET"],
    );
  }
});

test("a concurrent binding wins over the request’s proposed merchant ID", async () => {
  const winner = "CHAYA_6a0000000000000000000099";
  const f = fixture(
    [response(404, {}), created(winner)],
    {},
    { concurrentId: winner },
  );
  assert.equal(
    (await f.actions.createCashfreePaymentSession(orderNumber)).success,
    true,
  );
  assert.equal(JSON.parse(f.calls[1].body).order_id, winner);
});

test("retry after a lost create response uses the saved ID and recovers the session", async () => {
  const f = fixture([
    response(404, {}),
    new Error("Response lost"),
    duplicate(),
    created(),
  ]);
  assert.equal(
    (await f.actions.createCashfreePaymentSession(orderNumber)).success,
    false,
  );
  assert.equal(
    (await f.actions.createCashfreePaymentSession(orderNumber)).success,
    true,
  );
  assert.deepEqual(
    f.calls.map((call) => call.method),
    ["GET", "POST", "POST", "GET"],
  );
  assert.equal(
    JSON.parse(f.calls[1].body).order_id,
    JSON.parse(f.calls[2].body).order_id,
  );
});

test("reconciliation fetches and confirms the saved merchant ID", async () => {
  const f = fixture(
    [
      response(200, {
        ...activeGatewayOrder,
        order_id: merchantId,
        order_status: "PAID",
      }),
    ],
    { cashfreeOrderId: merchantId },
  );
  assert.equal(
    (await f.actions.finalizeCashfreePayment(orderNumber)).success,
    true,
  );
  assert.ok(f.calls[0].url.endsWith("/" + merchantId));
  assert.equal(f.order.paymentStatus, "CONFIRMED");
  assert.equal(f.inventory.length, 1);
});

test("reconciliation rejects a paid collision even if customer and amount are identical", async () => {
  const f = fixture([
    response(200, {
      ...activeGatewayOrder,
      order_status: "PAID",
      created_at: "2026-09-19T03:48:08Z",
    }),
  ]);
  assert.equal(
    (await f.actions.finalizeCashfreePayment(orderNumber)).success,
    false,
  );
  assert.equal(f.order.paymentStatus, "PENDING");
  assert.equal(f.inventory.length, 0);
  assert.equal(f.transactions, 0);
});

test("caller-supplied payment proof cannot bypass the gateway binding check", async () => {
  const f = fixture([created()], { cashfreeOrderId: merchantId });
  assert.equal(
    (
      await f.actions.finalizeCashfreePayment(orderNumber, {
        order_status: "PAID",
      })
    ).success,
    false,
  );
  assert.equal(f.calls.length, 1);
  assert.equal(f.inventory.length, 0);
});

test("webhook confirms the order using the saved merchant ID", async () => {
  const f = fixture([], { cashfreeOrderId: merchantId });
  assert.equal((await f.webhook.POST(webhookRequest())).status, 200);
  assert.equal(f.order.paymentStatus, "CONFIRMED");
  assert.equal(f.order.gatewayPaymentId, "payment-7");
  assert.equal(f.inventory.length, 1);
});

test("old sequential-ID webhooks cannot affect a purchase with a new binding", async () => {
  const f = fixture([], { cashfreeOrderId: merchantId });
  assert.equal((await f.webhook.POST(webhookRequest(orderNumber))).status, 200);
  assert.equal(f.order.paymentStatus, "PENDING");
  assert.equal(f.writes.length, 0);
});

test("legacy webhook checks creation time before touching an unbound purchase", async () => {
  const f = fixture([
    response(200, {
      ...activeGatewayOrder,
      created_at: "2026-09-19T03:48:08Z",
    }),
  ]);
  assert.equal((await f.webhook.POST(webhookRequest(orderNumber))).status, 200);
  assert.equal(f.order.paymentStatus, "PENDING");
  assert.equal(f.inventory.length, 0);
});

test("matching legacy webhooks still confirm and bind their original ID", async () => {
  const f = fixture([response(200, activeGatewayOrder)]);
  assert.equal((await f.webhook.POST(webhookRequest(orderNumber))).status, 200);
  assert.equal(f.order.paymentStatus, "CONFIRMED");
  assert.equal(f.order.cashfreeOrderId, orderNumber);
});

test("webhook rejects a mismatched customer on a saved merchant ID", async () => {
  const f = fixture([], { cashfreeOrderId: merchantId });
  const result = await f.webhook.POST(
    webhookRequest(merchantId, {
      customer_details: {
        ...activeGatewayOrder.customer_details,
        customer_email: "different@example.com",
      },
    }),
  );
  assert.equal(result.status, 400);
  assert.equal(f.inventory.length, 0);
});
