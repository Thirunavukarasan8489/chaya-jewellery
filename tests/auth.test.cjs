/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const { encode, decode } = require("next-auth/jwt");

// Compile the real TS modules using the already-installed TypeScript compiler.
// Dependencies are injected per test: no live database or credentials are used.
const testEnv = {
  GOOGLE_CLIENT_ID: "test-client",
  GOOGLE_CLIENT_SECRET: "test-google-secret",
  AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
};
function loadTS(file, mocks = {}, env = testEnv) {
  const filename = path.resolve(__dirname, "..", file);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith("@/")) return loadTS(`${id.slice(2)}.ts`, mocks, env);
    return require(id);
  };
  new Function("require", "module", "exports", "process", "console", code)(
    localRequire,
    loadedModule,
    loadedModule.exports,
    { env },
    { error() {} },
  );
  return loadedModule.exports;
}

function authFixture({ users = [], customers = [], failSave = false } = {}) {
  let nextId = 10;
  let dbReads = 0;
  const matches = (doc, filter) =>
    Object.entries(filter).every(
      ([key, value]) =>
        key
          .split(".")
          .reduce((result, part) => result?.[part], doc)
          ?.toString() === value?.toString(),
    );
  function model(records) {
    return class {
      constructor(data) {
        Object.assign(this, { _id: String(nextId++).padStart(24, "0") }, data);
      }
      static findOne(filter) {
        dbReads++;
        const doc = records.find((record) => matches(record, filter));
        return {
          session: async () => doc || null,
          lean: async () => doc || null,
        };
      }
      static findById(id) {
        return this.findOne({ _id: id });
      }
      static db = { transaction: async (fn) => fn({}) };
      async save() {
        if (failSave) throw new Error("Simulated database failure");
        if (!records.includes(this)) records.push(this);
      }
    };
  }
  const userRecords = [];
  const customerRecords = [];
  const User = model(userRecords);
  const Customer = model(customerRecords);
  userRecords.push(...users.map((data) => new User(data)));
  customerRecords.push(...customers.map((data) => new Customer(data)));
  const { authOptions } = loadTS("lib/authOptions.ts", {
    "@/lib/models/user": { User },
    "@/lib/models/customer": { Customer },
    "@/lib/db": { default: async () => {}, __esModule: true },
  });
  return { authOptions, userRecords, customerRecords, reads: () => dbReads };
}

function googleLogin(overrides = {}) {
  return {
    user: {
      id: "google-subject",
      name: "Test Customer",
      email: "customer@example.com",
      image: "https://lh3.googleusercontent.com/test",
    },
    account: {
      provider: "google",
      providerAccountId: "google-subject",
      type: "oauth",
    },
    profile: {
      sub: "google-subject",
      email: "customer@example.com",
      email_verified: true,
      hd: "example.com",
    },
    ...overrides,
  };
}
const existingUser = {
  _id: "000000000000000000000001",
  name: "Existing Customer",
  email: "customer@example.com",
  role: "CUSTOMER",
  status: "ACTIVE",
  password: "existing-password-hash",
  customerProfileId: "000000000000000000000002",
};
const existingCustomer = {
  _id: existingUser.customerProfileId,
  userId: existingUser._id,
  contact: { email: existingUser.email },
  addresses: [{ street1: "Saved address" }],
  metrics: { totalOrders: 3 },
};

test("required config fails clearly without printing secrets, in development too", () => {
  for (const name of Object.keys(testEnv)) {
    const env = { ...testEnv, [name]: "", NODE_ENV: "development" };
    const config = loadTS("lib/env.ts", {}, env);
    assert.throws(
      () =>
        name === "AUTH_SECRET"
          ? config.getAuthSecret()
          : config.requireEnv(name),
      new RegExp(name),
    );
  }
  assert.throws(
    () => loadTS("lib/env.ts", {}, { AUTH_SECRET: "short" }).getAuthSecret(),
    /at least 32/,
  );
  assert.equal(loadTS("lib/env.ts").getAuthSecret(), testEnv.AUTH_SECRET);
});

test("client redirects reject external, protocol-relative, backslash and control-character URLs", () => {
  const { getSafeCallbackUrl } = loadTS("lib/auth-redirect.ts");
  for (const url of [
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\n/evil.example",
    "javascript:alert(1)",
    "/safe/..//evil.example",
  ]) {
    assert.equal(getSafeCallbackUrl(url), "/cart");
  }
  assert.equal(
    getSafeCallbackUrl("/checkout?step=payment#summary"),
    "/checkout?step=payment#summary",
  );
});

test("Google keeps state and PKCE checks; server redirects stay on the app origin", async () => {
  const { authOptions } = authFixture();
  assert.deepEqual(authOptions.providers[0].checks, ["pkce", "state"]);
  for (const url of [
    "//evil.example",
    "https://evil.example",
    "/\\evil.example",
  ]) {
    assert.equal(
      await authOptions.callbacks.redirect({
        url,
        baseUrl: "https://shop.example",
      }),
      "https://shop.example/cart",
    );
  }
  assert.equal(
    await authOptions.callbacks.redirect({
      url: "/login",
      baseUrl: "https://shop.example",
    }),
    "https://shop.example/login",
  );
});

test("unverified or mismatched Google identities fail before a database lookup", async () => {
  for (const changes of [
    { email_verified: false },
    { email_verified: undefined },
    { sub: "wrong-subject" },
    { email: "someone-else@example.com" },
  ]) {
    const fixture = authFixture();
    const login = googleLogin();
    Object.assign(login.profile, changes);
    assert.equal(await fixture.authOptions.callbacks.signIn(login), false);
    assert.equal(fixture.reads(), 0);
  }
});

test("first Google login creates linked customer/user records with a MongoDB session ID", async () => {
  const fixture = authFixture();
  const login = googleLogin();
  assert.equal(await fixture.authOptions.callbacks.signIn(login), true);
  assert.equal(fixture.userRecords.length, 1);
  assert.equal(fixture.customerRecords.length, 1);
  const user = fixture.userRecords[0];
  const customer = fixture.customerRecords[0];
  assert.equal(user.customerProfileId, customer._id);
  assert.equal(customer.userId, user._id);
  assert.equal(login.user.id, user._id);
  assert.equal(login.user.role, "CUSTOMER");
  assert.equal(user.password, undefined);
});

test("repeat Google login reuses customer identity, addresses and password", async () => {
  const fixture = authFixture({
    users: [existingUser],
    customers: [existingCustomer],
  });
  for (let count = 0; count < 2; count++) {
    const login = googleLogin();
    login.user.email = " CUSTOMER@example.com ";
    assert.equal(await fixture.authOptions.callbacks.signIn(login), true);
    assert.equal(login.user.id, existingUser._id);
    assert.equal(login.user.email, existingUser.email);
  }
  assert.equal(fixture.userRecords.length, 1);
  assert.equal(fixture.customerRecords.length, 1);
  assert.equal(fixture.userRecords[0].password, existingUser.password);
  assert.deepEqual(
    fixture.customerRecords[0].addresses,
    existingCustomer.addresses,
  );
});

test("Google rejects inactive users, staff roles and conflicting linked subjects", async () => {
  for (const changes of [
    { status: "INACTIVE" },
    { role: "SUPER_ADMIN" },
    { role: "CONTENT_MANAGER" },
    { role: "LEAD_MANAGER" },
    { googleId: "other-subject" },
  ]) {
    const fixture = authFixture({ users: [{ ...existingUser, ...changes }] });
    assert.equal(
      await fixture.authOptions.callbacks.signIn(googleLogin()),
      false,
    );
    assert.equal(fixture.customerRecords.length, 0);
  }
});

test("Google cannot claim a customer profile owned by another user", async () => {
  const fixture = authFixture({
    users: [existingUser],
    customers: [{ ...existingCustomer, userId: "different-user" }],
  });
  assert.equal(
    await fixture.authOptions.callbacks.signIn(googleLogin()),
    false,
  );
  assert.equal(fixture.customerRecords[0].userId, "different-user");
});

test("a verified third-party email cannot automatically link an existing account", async () => {
  const fixture = authFixture({
    users: [existingUser],
    customers: [existingCustomer],
  });
  const login = googleLogin();
  delete login.profile.hd;
  assert.equal(await fixture.authOptions.callbacks.signIn(login), false);
  assert.equal(fixture.userRecords[0].googleId, undefined);
});

test("database failure denies sign-in instead of issuing a Google subject as the app ID", async () => {
  const fixture = authFixture({ failSave: true });
  const login = googleLogin();
  assert.equal(await fixture.authOptions.callbacks.signIn(login), false);
  assert.equal(login.user.id, "google-subject");
});

test("session survives JWT encryption/refresh and only exposes intended profile fields", async () => {
  const { authOptions } = authFixture();
  const login = googleLogin();
  await authOptions.callbacks.signIn(login);
  const token = await authOptions.callbacks.jwt({
    token: {},
    user: login.user,
  });
  const cookie = await encode({ token, secret: testEnv.AUTH_SECRET });
  const refreshed = await authOptions.callbacks.jwt({
    token: await decode({ token: cookie, secret: testEnv.AUTH_SECRET }),
  });
  const session = await authOptions.callbacks.session({
    session: { user: {} },
    token: refreshed,
  });
  assert.deepEqual(session.user, {
    id: login.user.id,
    role: "CUSTOMER",
    name: login.user.name,
    email: login.user.email,
    image: login.user.image,
  });
  assert.equal(
    await decode({ token: undefined, secret: testEnv.AUTH_SECRET }),
    null,
  );
});

test("credential login still authenticates active staff and rejects inactive accounts", async () => {
  const bcrypt = require("bcryptjs");
  const password = await bcrypt.hash("test-password", 4);
  const fixture = authFixture({
    users: [{ ...existingUser, role: "SUPER_ADMIN", password }],
  });
  const authorize = fixture.authOptions.providers[1].options.authorize;
  const credentials = {
    email: " CUSTOMER@example.com ",
    password: "test-password",
  };
  assert.equal((await authorize(credentials)).role, "SUPER_ADMIN");
  fixture.userRecords[0].status = "INACTIVE";
  await assert.rejects(authorize(credentials), /Invalid email or password/);
});
