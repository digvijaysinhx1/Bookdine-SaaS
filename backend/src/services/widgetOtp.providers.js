import { createHash, randomUUID } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { HttpError } from "../utils/httpError.js";
import { createWidgetOtpService } from "./widgetOtp.service.js";

const CODE_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const hash = (value) => createHash("sha256").update(String(value)).digest("hex");

export const createUpstashOtpStore = (redis) => {
  const sessionKey = (requestId) => `bookdine:widget:otp:session:${requestId}`;
  const bookingKey = (requestId) => `bookdine:widget:booking:${requestId}`;
  const matchesBinding = (state, { tenantId, phoneNumber, email }) =>
    state?.tenantId === String(tenantId) &&
    state.phoneHash === hash(phoneNumber) &&
    state.emailHash === hash(email);

  return {
    async issue({ requestId, tenantId, phoneNumber, email }) {
      const cooldown = await redis.set(
        `bookdine:widget:otp:cooldown:${hash(`${tenantId}:${phoneNumber}`)}`,
        "1",
        { nx: true, ex: RESEND_COOLDOWN_SECONDS },
      );
      if (cooldown !== "OK") {
        throw new HttpError(429, "Please wait before requesting another code", "OTP_RESEND_COOLDOWN");
      }

      const created = await redis.set(
        sessionKey(requestId),
        { tenantId: String(tenantId), phoneHash: hash(phoneNumber), emailHash: hash(email) },
        { nx: true, ex: CODE_TTL_SECONDS },
      );
      if (created !== "OK") throw new HttpError(409, "Could not start verification. Try again.", "OTP_SESSION_CONFLICT");
    },

    async verify({ requestId, tenantId, phoneNumber, email, code }, checkCode) {
      const key = sessionKey(requestId);
      const rawSession = await redis.get(key);
      const session = typeof rawSession === "string" ? JSON.parse(rawSession) : rawSession;
      if (
        !session ||
        session.tenantId !== String(tenantId) ||
        session.phoneHash !== hash(phoneNumber) ||
        session.emailHash !== hash(email)
      ) {
        throw new HttpError(401, "Verification code is invalid or expired", "OTP_EXPIRED");
      }

      const lockKey = `bookdine:widget:otp:verify-lock:${requestId}`;
      const lock = await redis.set(lockKey, randomUUID(), { nx: true, ex: 90 });
      if (lock !== "OK") throw new HttpError(409, "This verification is already being checked", "OTP_CHECK_IN_PROGRESS");

      try {
        const attemptsKey = `bookdine:widget:otp:attempts:${requestId}`;
        const attempts = await redis.incr(attemptsKey);
        if (attempts === 1) await redis.expire(attemptsKey, CODE_TTL_SECONDS);
        if (attempts > MAX_ATTEMPTS) {
          await redis.del(key);
          throw new HttpError(429, "Too many incorrect codes. Request a new code.", "OTP_ATTEMPTS_EXCEEDED");
        }

        let approved;
        try {
          approved = await checkCode({ phoneNumber, code: String(code) });
        } catch {
          throw new HttpError(503, "Phone verification provider is unavailable", "OTP_PROVIDER_ERROR");
        }
        if (!approved) {
          throw new HttpError(401, "Verification code is incorrect", "INVALID_OTP");
        }

        const consumed = await redis.set(
          `bookdine:widget:otp:consumed:${requestId}`,
          "1",
          { nx: true, ex: CODE_TTL_SECONDS },
        );
        if (consumed !== "OK") throw new HttpError(401, "Verification code is invalid or expired", "OTP_EXPIRED");
        await redis.del(key);
        return true;
      } finally {
        await redis.del(lockKey);
      }
    },

    async discard(requestId) {
      await redis.del(sessionKey(requestId));
    },

    async getBookingStatus(binding) {
      const rawState = await redis.get(bookingKey(binding.requestId));
      const state = typeof rawState === "string" ? JSON.parse(rawState) : rawState;
      if (!matchesBinding(state, binding)) return null;
      return { status: state.status, reservationId: state.reservationId };
    },

    async beginBooking(binding) {
      const created = await redis.set(
        bookingKey(binding.requestId),
        {
          status: "processing",
          tenantId: String(binding.tenantId),
          phoneHash: hash(binding.phoneNumber),
          emailHash: hash(binding.email),
        },
        { nx: true, ex: 15 * 60 },
      );
      return created === "OK";
    },

    async completeBooking({ requestId, tenantId, phoneNumber, email, reservationId }) {
      const key = bookingKey(requestId);
      const rawState = await redis.get(key);
      const state = typeof rawState === "string" ? JSON.parse(rawState) : rawState;
      if (!matchesBinding(state, { tenantId, phoneNumber, email }) || state.status !== "processing") {
        throw new HttpError(503, "Could not save the booking retry state", "OTP_STORAGE_UNAVAILABLE");
      }
      await redis.set(key, { ...state, status: "complete", reservationId }, { ex: 24 * 60 * 60 });
    },

    async releaseBooking(binding) {
      const key = bookingKey(binding.requestId);
      const rawState = await redis.get(key);
      const state = typeof rawState === "string" ? JSON.parse(rawState) : rawState;
      if (matchesBinding(state, binding) && state.status === "processing") await redis.del(key);
    },
  };
};

export const createTwilioVerifyDelivery = ({ accountSid, authToken, serviceSid, fetchImpl = fetch }) => {
  const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
  const baseUrl = `https://verify.twilio.com/v2/Services/${encodeURIComponent(serviceSid)}`;
  const post = async (path, values, { expiredCheck = false } = {}) => {
    const response = await fetchImpl(`${baseUrl}/${path}`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(values),
    });
    if (!response.ok) {
      if (expiredCheck && response.status === 404) {
        throw new HttpError(401, "Verification code is invalid or expired", "OTP_EXPIRED");
      }
      throw new HttpError(503, "Phone verification provider is unavailable", "OTP_PROVIDER_ERROR");
    }
    return response.json();
  };

  return {
    async sendVerification({ phoneNumber }) {
      await post("Verifications", { To: phoneNumber, Channel: "sms" });
    },
    async checkVerification({ phoneNumber, code }) {
      const result = await post("VerificationCheck", { To: phoneNumber, Code: code }, { expiredCheck: true });
      return result.status === "approved" && result.valid === true;
    },
  };
};

export const createProductionWidgetOtpService = (environment = process.env) => {
  const required = [
    "TWILIO_SERVICE_SID",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];
  if (required.some((name) => !environment[name])) {
    throw new HttpError(503, "Phone verification is not configured. Configure Twilio Verify and Upstash Redis.", "OTP_PROVIDER_NOT_CONFIGURED");
  }

  const redis = new Redis({
    url: environment.UPSTASH_REDIS_REST_URL,
    token: environment.UPSTASH_REDIS_REST_TOKEN,
  });
  const phoneRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "bookdine:widget:otp:rate:phone",
    analytics: false,
  });
  const ipRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    prefix: "bookdine:widget:otp:rate:ip",
    analytics: false,
  });

  const unsafeStore = createUpstashOtpStore(redis);
  const store = Object.fromEntries(
    Object.entries(unsafeStore).map(([name, operation]) => [name, async (...args) => {
      try {
        return await operation(...args);
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(503, "Phone verification storage is unavailable", "OTP_STORAGE_UNAVAILABLE");
      }
    }]),
  );

  return createWidgetOtpService({
    store,
    delivery: createTwilioVerifyDelivery({
      accountSid: environment.TWILIO_ACCOUNT_SID,
      authToken: environment.TWILIO_AUTH,
      serviceSid: environment.TWILIO_SERVICE_SID,
    }),
    rateLimiters: [phoneRateLimit, ipRateLimit],
    environment: { NODE_ENV: "production" },
  });
};
