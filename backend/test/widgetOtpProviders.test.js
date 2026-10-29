import test from "node:test";
import assert from "node:assert/strict";
import {
  createTwilioVerifyDelivery,
  createUpstashOtpStore,
  createProductionWidgetOtpService,
} from "../src/services/widgetOtp.providers.js";

const createFakeRedis = () => {
  const values = new Map();
  const counts = new Map();
  return {
    values,
    async set(key, value, options = {}) {
      if (options.nx && values.has(key)) return null;
      values.set(key, value);
      return "OK";
    },
    async get(key) { return values.get(key) ?? null; },
    async incr(key) {
      const value = (counts.get(key) || 0) + 1;
      counts.set(key, value);
      return value;
    },
    async expire() { return 1; },
    async del(key) { return values.delete(key) ? 1 : 0; },
  };
};

test("Upstash OTP state is temporary, contact-bound, and consumed once", async () => {
  const redis = createFakeRedis();
  const store = createUpstashOtpStore(redis);
  const flow = {
    requestId: "c8b1653a-72ab-49d8-a89e-9fb707427621",
    tenantId: 42,
    phoneNumber: "+14155552671",
    email: "guest@example.com",
  };
  await store.issue(flow);
  const sessionKey = `bookdine:widget:otp:session:${flow.requestId}`;
  assert.equal(JSON.stringify(redis.values.get(sessionKey)).includes(flow.phoneNumber), false);
  assert.equal(JSON.stringify(redis.values.get(sessionKey)).includes(flow.email), false);
  let checkedCode;
  assert.equal(await store.verify({ ...flow, code: "319224" }, async ({ code }) => {
    checkedCode = code;
    return true;
  }), true);
  assert.equal(checkedCode, "319224");
  await assert.rejects(store.verify({ ...flow, code: "319224" }, async () => true), { code: "OTP_EXPIRED" });
});

test("Upstash OTP state enforces resend cooldown and verification attempt limit", async () => {
  const redis = createFakeRedis();
  const store = createUpstashOtpStore(redis);
  const flow = {
    requestId: "c8b1653a-72ab-49d8-a89e-9fb707427621",
    tenantId: 42,
    phoneNumber: "+14155552671",
    email: "guest@example.com",
  };
  await store.issue(flow);
  await assert.rejects(store.issue({ ...flow, requestId: "d8b1653a-72ab-49d8-a89e-9fb707427621" }), { code: "OTP_RESEND_COOLDOWN" });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(store.verify({ ...flow, code: "000000" }, async () => false), { code: "INVALID_OTP" });
  }
  await assert.rejects(store.verify({ ...flow, code: "000000" }, async () => false), { code: "OTP_ATTEMPTS_EXCEEDED" });
});

test("Upstash booking state locks duplicate submissions and caches only the reservation reference", async () => {
  const redis = createFakeRedis();
  const store = createUpstashOtpStore(redis);
  const binding = {
    requestId: "c8b1653a-72ab-49d8-a89e-9fb707427621",
    tenantId: 42,
    phoneNumber: "+14155552671",
    email: "guest@example.com",
  };
  assert.equal(await store.getBookingStatus(binding), null);
  assert.equal(await store.beginBooking(binding), true);
  assert.equal(await store.beginBooking(binding), false);
  assert.deepEqual(await store.getBookingStatus(binding), { status: "processing", reservationId: undefined });
  await store.completeBooking({ ...binding, reservationId: 917 });
  assert.deepEqual(await store.getBookingStatus(binding), { status: "complete", reservationId: 917 });
  assert.equal(await store.getBookingStatus({ ...binding, email: "other@example.com" }), null);
});

test("Twilio Verify adapter sends and checks SMS codes through Verify endpoints", async () => {
  const calls = [];
  const delivery = createTwilioVerifyDelivery({
    accountSid: "AC_TEST",
    authToken: "test-secret",
    serviceSid: "VA_TEST",
    fetchImpl: async (url, request) => {
      calls.push({ url, request });
      return { ok: true, json: async () => ({ status: "approved", valid: true }) };
    },
  });
  await delivery.sendVerification({ phoneNumber: "+14155552671" });
  assert.equal(await delivery.checkVerification({ phoneNumber: "+14155552671", code: "123456" }), true);
  assert.match(calls[0].url, /\/Services\/VA_TEST\/Verifications$/);
  assert.match(calls[1].url, /\/Services\/VA_TEST\/VerificationCheck$/);
  assert.equal(calls[0].request.body.get("Channel"), "sms");
  assert.equal(calls[1].request.body.get("Code"), "123456");
  assert.equal(calls[0].request.headers.Authorization, `Basic ${Buffer.from("AC_TEST:test-secret").toString("base64")}`);
});

test("production OTP stays disabled when Twilio or Upstash configuration is missing", () => {
  assert.throws(
    () => createProductionWidgetOtpService({ NODE_ENV: "production" }),
    { code: "OTP_PROVIDER_NOT_CONFIGURED", statusCode: 503 },
  );
});
