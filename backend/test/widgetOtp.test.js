import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryOtpStore, createWidgetOtpService, normalizePhoneNumber } from "../src/services/widgetOtp.service.js";

test("phone numbers must use E.164 format", () => {
  assert.equal(normalizePhoneNumber(" +14155552671 "), "+14155552671");
  for (const value of ["4155552671", "+0123456789", "+123", "https://example.com"]) {
    assert.throws(() => normalizePhoneNumber(value), { code: "INVALID_PHONE" });
  }
});

test("development OTP expires and cannot be verified afterward", async () => {
  let now = 1_000_000;
  const store = createMemoryOtpStore({ secret: "test-only", now: () => now, generateCode: () => "123456" });
  await store.issue({ requestId: "request-1", tenantId: 1, phoneNumber: "+14155552671" });
  now += 10 * 60 * 1000;
  await assert.rejects(
    store.verify({ requestId: "request-1", tenantId: 1, phoneNumber: "+14155552671", code: "123456" }),
    { statusCode: 401, code: "OTP_EXPIRED" }
  );
});

test("a code is bound to its request, restaurant tenant, and phone", async () => {
  const store = createMemoryOtpStore({ secret: "test-only", generateCode: () => "123456" });
  await store.issue({ requestId: "request-1", tenantId: 1, phoneNumber: "+14155552671" });
  await assert.rejects(
    store.verify({ requestId: "request-1", tenantId: 2, phoneNumber: "+14155552671", code: "123456" }),
    { code: "INVALID_OTP" }
  );
  await assert.rejects(
    store.verify({ requestId: "request-1", tenantId: 1, phoneNumber: "+14155552672", code: "123456" }),
    { code: "INVALID_OTP" }
  );
  assert.equal(await store.verify({ requestId: "request-1", tenantId: 1, phoneNumber: "+14155552671", code: "123456" }), true);
});

test("development OTP enforces resend cooldown and five attempts", async () => {
  let now = 1_000_000;
  const store = createMemoryOtpStore({ secret: "test-only", now: () => now, generateCode: () => "123456" });
  await store.issue({ requestId: "request-1", tenantId: 1, phoneNumber: "+14155552671" });
  await assert.rejects(
    store.issue({ requestId: "request-2", tenantId: 1, phoneNumber: "+14155552671" }),
    { statusCode: 429, code: "OTP_RESEND_COOLDOWN" }
  );

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await assert.rejects(
      store.verify({ requestId: "request-1", tenantId: 1, phoneNumber: "+14155552671", code: "000000" }),
      { statusCode: 401, code: "INVALID_OTP" }
    );
  }
  await assert.rejects(
    store.verify({ requestId: "request-1", tenantId: 1, phoneNumber: "+14155552671", code: "000000" }),
    { statusCode: 429, code: "OTP_ATTEMPTS_EXCEEDED" }
  );
  now += 60 * 1000;
  await store.issue({ requestId: "request-2", tenantId: 1, phoneNumber: "+14155552671" });
  assert.equal(await store.verify({ requestId: "request-2", tenantId: 1, phoneNumber: "+14155552671", code: "123456" }), true);
});

test("local code is exposed only when explicit development mode is enabled", async () => {
  const store = createMemoryOtpStore({ secret: "test-only", generateCode: () => "123456" });
  const devOtp = createWidgetOtpService({
    store,
    delivery: { isDevelopmentMock: true },
    environment: { OTP_DEV_MODE: "true", NODE_ENV: "development" },
  });
  assert.deepEqual(await devOtp.request({ requestId: "local", tenantId: 2, phoneNumber: "+14155552671" }), { developmentCode: "123456" });

  const productionOtp = createWidgetOtpService({
    store,
    delivery: { isDevelopmentMock: true },
    environment: { OTP_DEV_MODE: "true", NODE_ENV: "production" },
  });
  await assert.rejects(productionOtp.request({ requestId: "prod", tenantId: 2, phoneNumber: "+14155552671" }), { code: "OTP_PROVIDER_NOT_CONFIGURED" });
  await assert.rejects(productionOtp.verify({ requestId: "prod", tenantId: 2, phoneNumber: "+14155552671", code: "123456" }), { code: "OTP_PROVIDER_NOT_CONFIGURED" });
});
