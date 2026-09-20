/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

// Use the real service with isolated HTTP fixtures, never live credentials/orders.
const source = ts.transpileModule(
  readFileSync(path.resolve(__dirname, "../lib/services/cashfree.ts"), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  },
).outputText;

const params = {
  orderId: "CHAYA_6a0000000000000000000100",
  amount: 1234.5,
  customerName: "Test Customer",
  customerPhone: "+91 98765 43210",
  customerEmail: " Customer@example.com ",
  returnUrl: "https://shop.example/checkout/success?order=ORD-2026-0100",
  notifyUrl: "https://shop.example/api/webhooks/cashfree",
};

const activeOrder = {
  order_id: params.orderId,
  order_status: "ACTIVE",
  order_amount: params.amount,
  order_currency: "INR",
  cf_order_id: "gateway-order-100",
  payment_session_id: "existing-payment-session",
  customer_details: {
    customer_phone: "9876543210",
    customer_email: "customer@example.com",
  },
};

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
const duplicate = () =>
  response(409, {
    code: "order_already_exists",
    message: "order with same id is already present",
  });

function fixture(responses) {
  const calls = [];
  const loaded = { exports: {} };
  const fakeFetch = async (url, options) => {
    calls.push({ url, ...options });
    const next = responses.shift();
    assert.ok(next, "Unexpected extra gateway request");
    if (next instanceof Error) throw next;
    return next;
  };
  new Function(
    "require",
    "module",
    "exports",
    "fetch",
    "process",
    "console",
    source,
  )(
    require,
    loaded,
    loaded.exports,
    fakeFetch,
    {
      env: {
        CASHFREE_APP_ID: "TEST_fixture",
        CASHFREE_SECRET_KEY: "fixture-only",
      },
    },
    { error() {} },
  );
  return { ...loaded.exports, calls };
}

test("a new order still returns the created session with one POST", async () => {
  const service = fixture([response(200, activeOrder)]);
  const result = await service.createCashfreeOrder(params);
  assert.equal(result.payment_session_id, activeOrder.payment_session_id);
  assert.deepEqual(
    service.calls.map((call) => call.method),
    ["POST"],
  );
  const sent = JSON.parse(service.calls[0].body);
  assert.equal(sent.order_id, params.orderId);
  assert.equal(sent.order_amount, params.amount);
  assert.equal(sent.customer_details.customer_phone, "9876543210");
});

test("duplicate creation retrieves and reuses the matching active session", async () => {
  const service = fixture([duplicate(), response(200, activeOrder)]);
  const result = await service.createCashfreeOrder(params);
  assert.equal(result.payment_session_id, activeOrder.payment_session_id);
  assert.equal(result.order_id, params.orderId);
  assert.deepEqual(
    service.calls.map((call) => call.method),
    ["POST", "GET"],
  );
  assert.equal(
    service.calls[1].url,
    `https://sandbox.cashfree.com/pg/orders/${params.orderId}`,
  );
  assert.equal(service.calls[1].cache, "no-store");
});

test("repeated duplicate requests reuse the same session without changing the order ID", async () => {
  const service = fixture([
    duplicate(),
    response(200, activeOrder),
    duplicate(),
    response(200, activeOrder),
  ]);
  const first = await service.createCashfreeOrder(params);
  const second = await service.createCashfreeOrder(params);
  assert.equal(first.payment_session_id, second.payment_session_id);
  for (const call of service.calls.filter((call) => call.method === "POST")) {
    assert.equal(JSON.parse(call.body).order_id, params.orderId);
  }
});

test("already-paid duplicates do not return a payment session", async () => {
  const service = fixture([
    duplicate(),
    response(200, { ...activeOrder, order_status: "PAID" }),
  ]);
  await assert.rejects(
    service.createCashfreeOrder(params),
    /already been paid/,
  );
});

test("expired and terminated duplicates give a clear restart message", async () => {
  for (const order_status of ["EXPIRED", "TERMINATED"]) {
    const service = fixture([
      duplicate(),
      response(200, { ...activeOrder, order_status }),
    ]);
    await assert.rejects(
      service.createCashfreeOrder(params),
      /expired or closed/,
    );
  }
});

test("missing sessions and other non-active states cannot be reused", async () => {
  for (const changes of [
    { payment_session_id: undefined },
    { payment_session_id: "" },
    { order_status: "TERMINATION_REQUESTED" },
    { order_status: "UNKNOWN" },
  ]) {
    const service = fixture([
      duplicate(),
      response(200, { ...activeOrder, ...changes }),
    ]);
    await assert.rejects(
      service.createCashfreeOrder(params),
      /no active payment session/,
    );
  }
});

test("duplicate lookup refuses mismatched order identity, currency, amount or customer", async () => {
  for (const changes of [
    { order_id: "another-order" },
    { order_currency: "USD" },
    { order_amount: 1234.51 },
    { order_amount: NaN },
    {
      customer_details: {
        ...activeOrder.customer_details,
        customer_phone: "9000000000",
      },
    },
    {
      customer_details: {
        ...activeOrder.customer_details,
        customer_email: "another@example.com",
      },
    },
    { customer_details: undefined },
  ]) {
    const service = fixture([
      duplicate(),
      response(200, { ...activeOrder, ...changes }),
    ]);
    await assert.rejects(
      service.createCashfreeOrder(params),
      /does not match this checkout/,
    );
  }
});

test("a failed lookup reports a retriable error without creating another order", async () => {
  for (const failedLookup of [
    response(404, {}),
    response(500, {}),
    new Error("Network unavailable"),
  ]) {
    const service = fixture([duplicate(), failedLookup]);
    await assert.rejects(
      service.createCashfreeOrder(params),
      /Unable to retrieve.*try again/,
    );
    assert.deepEqual(
      service.calls.map((call) => call.method),
      ["POST", "GET"],
    );
  }
});

test("other gateway errors keep their existing behavior and do not trigger recovery", async () => {
  for (const status of [400, 401, 409, 422, 429, 500]) {
    const service = fixture([
      response(status, {
        code: "request_failed",
        message: "Other gateway error",
      }),
    ]);
    await assert.rejects(
      service.createCashfreeOrder(params),
      /Other gateway error/,
    );
    assert.deepEqual(
      service.calls.map((call) => call.method),
      ["POST"],
    );
  }
});

test("merchant IDs are stable per purchase and independent of reused display numbers", () => {
  const service = fixture([]);
  const first = service.cashfreeMerchantOrderId("6a0000000000000000000100");
  const second = service.cashfreeMerchantOrderId("6a0000000000000000000101");
  assert.equal(
    first,
    service.cashfreeMerchantOrderId("6a0000000000000000000100"),
  );
  assert.notEqual(first, second);
  assert.match(first, /^[a-zA-Z0-9_-]{3,45}$/);
});

test("formatted gateway phone and email still match the same customer", () => {
  const service = fixture([]);
  assert.equal(
    service.cashfreeOrderMatchesCheckout(
      {
        ...activeOrder,
        customer_details: {
          customer_phone: "+91 98765 43210",
          customer_email: " Customer@Example.com ",
        },
      },
      params,
    ),
    true,
  );
});

test("legacy IDs require a gateway creation time belonging to this purchase", () => {
  const service = fixture([]);
  const expected = {
    ...params,
    createdAt: new Date("2026-09-20T16:06:50.338Z"),
  };
  for (const created_at of [
    "2026-09-19T16:06:50Z",
    undefined,
    "invalid-date",
  ]) {
    assert.equal(
      service.cashfreeOrderMatchesCheckout(
        { ...activeOrder, created_at },
        expected,
      ),
      false,
    );
  }
  assert.equal(
    service.cashfreeOrderMatchesCheckout(
      { ...activeOrder, created_at: "2026-09-20T16:06:50Z" },
      expected,
    ),
    true,
  );
});

test("only a 404 lookup means there is no existing gateway order", async () => {
  assert.equal(
    await fixture([response(404, {})]).fetchCashfreeOrder(params.orderId),
    null,
  );
  for (const failure of [
    response(401, {}),
    response(429, {}),
    response(500, {}),
    new Error("Timeout"),
  ]) {
    await assert.rejects(
      fixture([failure]).fetchCashfreeOrder(params.orderId),
      /Unable to retrieve/,
    );
  }
});
