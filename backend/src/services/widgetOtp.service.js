import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { HttpError, badRequest } from "../utils/httpError.js";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const E164 = /^\+[1-9]\d{6,14}$/;
const rateLimitIdentifier = (value) => createHash("sha256").update(String(value)).digest("hex");

export const normalizePhoneNumber = (value) => {
  if (typeof value !== "string") throw badRequest("Phone number must be a string", "INVALID_PHONE");
  const phone = value.trim();
  if (!E164.test(phone)) throw badRequest("Phone number must use E.164 format, such as +14155552671", "INVALID_PHONE");
  return phone;
};

const hashOtp = (secret, code) => createHmac("sha256", secret).update(code).digest();

export const createMemoryOtpStore = ({
  secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "development-only-otp-hash-secret",
  now = () => Date.now(),
  generateCode = () => String(randomInt(100000, 1000000)),
} = {}) => {
  const entries = new Map();
  const cooldowns = new Map();
  const bookingStates = new Map();

  return {
    async issue({ requestId, tenantId, phoneNumber, email }) {
      const cooldownKey = `${tenantId}:${phoneNumber}`;
      const allowedAt = cooldowns.get(cooldownKey) || 0;
      if (now() < allowedAt) {
        throw new HttpError(429, "Please wait before requesting another code", "OTP_RESEND_COOLDOWN");
      }

      const code = generateCode();
      entries.set(requestId, {
        tenantId,
        phoneNumber,
        email,
        codeHash: hashOtp(secret, code),
        expiresAt: now() + CODE_TTL_MS,
        attemptsLeft: MAX_ATTEMPTS,
      });
      cooldowns.set(cooldownKey, now() + RESEND_COOLDOWN_MS);
      return { code };
    },

    async verify({ requestId, tenantId, phoneNumber, email, code }) {
      const entry = entries.get(requestId);
      if (!entry || entry.tenantId !== tenantId || entry.phoneNumber !== phoneNumber || entry.email !== email) {
        throw new HttpError(401, "Verification code is invalid or expired", "INVALID_OTP");
      }
      if (now() >= entry.expiresAt) {
        entries.delete(requestId);
        throw new HttpError(401, "Verification code is invalid or expired", "OTP_EXPIRED");
      }
      if (entry.attemptsLeft <= 0) {
        entries.delete(requestId);
        throw new HttpError(429, "Too many incorrect codes. Request a new code.", "OTP_ATTEMPTS_EXCEEDED");
      }

      const submittedHash = hashOtp(secret, String(code));
      const valid = submittedHash.length === entry.codeHash.length && timingSafeEqual(submittedHash, entry.codeHash);
      if (!valid) {
        entry.attemptsLeft -= 1;
        if (entry.attemptsLeft === 0) entries.delete(requestId);
        throw new HttpError(entry.attemptsLeft === 0 ? 429 : 401,
          entry.attemptsLeft === 0 ? "Too many incorrect codes. Request a new code." : "Verification code is incorrect",
          entry.attemptsLeft === 0 ? "OTP_ATTEMPTS_EXCEEDED" : "INVALID_OTP");
      }

      entries.delete(requestId);
      return true;
    },

    async discard(requestId) { entries.delete(requestId); },

    async getBookingStatus({ requestId, tenantId, phoneNumber, email }) {
      const state = bookingStates.get(requestId);
      if (!state || state.tenantId !== tenantId || state.phoneNumber !== phoneNumber || state.email !== email) return null;
      return { status: state.status, reservationId: state.reservationId };
    },

    async beginBooking({ requestId, tenantId, phoneNumber, email }) {
      if (bookingStates.has(requestId)) return false;
      bookingStates.set(requestId, { status: "processing", tenantId, phoneNumber, email });
      return true;
    },

    async completeBooking({ requestId, tenantId, phoneNumber, email, reservationId }) {
      const state = bookingStates.get(requestId);
      if (!state || state.status !== "processing" || state.tenantId !== tenantId || state.phoneNumber !== phoneNumber || state.email !== email) {
        throw new HttpError(503, "Could not save the booking retry state", "OTP_STORAGE_UNAVAILABLE");
      }
      bookingStates.set(requestId, { ...state, status: "complete", reservationId });
    },

    async releaseBooking({ requestId, tenantId, phoneNumber, email }) {
      const state = bookingStates.get(requestId);
      if (state?.status === "processing" && state.tenantId === tenantId && state.phoneNumber === phoneNumber && state.email === email) {
        bookingStates.delete(requestId);
      }
    },
  };
};

export const createWidgetOtpService = ({
  store,
  delivery,
  rateLimiters = [],
  environment = process.env,
} = {}) => ({
  async request({ requestId, tenantId, phoneNumber, email, ipAddress }) {
    const localMode = environment.OTP_DEV_MODE === "true" && environment.NODE_ENV === "development";
    if (!store || (localMode ? !delivery?.isDevelopmentMock : typeof delivery?.sendVerification !== "function")) {
      throw new HttpError(503, "Phone verification is not configured. Set up Redis OTP storage and Twilio SMS delivery.", "OTP_PROVIDER_NOT_CONFIGURED");
    }
    if (!localMode) {
      if (!rateLimiters.length) throw new HttpError(503, "Phone verification is not configured", "OTP_PROVIDER_NOT_CONFIGURED");
      try {
        const phoneLimit = await rateLimiters[0].limit(rateLimitIdentifier(`${tenantId}:${phoneNumber}`));
        if (!phoneLimit.success) throw new HttpError(429, "Too many verification requests. Try again later.", "OTP_RATE_LIMITED");
        if (ipAddress && rateLimiters[1]) {
          const ipLimit = await rateLimiters[1].limit(rateLimitIdentifier(ipAddress));
          if (!ipLimit.success) throw new HttpError(429, "Too many verification requests. Try again later.", "OTP_RATE_LIMITED");
        }
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(503, "Phone verification rate limiting is unavailable", "OTP_STORAGE_UNAVAILABLE");
      }
    }
    const generated = await store.issue({ requestId, tenantId, phoneNumber, email });
    if (localMode) return { developmentCode: generated.code };
    try {
      await delivery.sendVerification({ phoneNumber });
      return {};
    } catch (error) {
      await store.discard(requestId);
      throw error;
    }
  },

  async verify(args) {
    const localMode = environment.OTP_DEV_MODE === "true" && environment.NODE_ENV === "development";
    if (!store || (!localMode && typeof delivery?.checkVerification !== "function")) throw new HttpError(503, "Phone verification is not configured", "OTP_PROVIDER_NOT_CONFIGURED");
    return store.verify(args, localMode ? undefined : delivery.checkVerification.bind(delivery));
  },

  async getBookingStatus(args) {
    if (typeof store?.getBookingStatus !== "function") throw new HttpError(503, "Phone verification state is unavailable", "OTP_PROVIDER_NOT_CONFIGURED");
    return store.getBookingStatus(args);
  },

  async beginBooking(args) {
    if (typeof store?.beginBooking !== "function") throw new HttpError(503, "Phone verification state is unavailable", "OTP_PROVIDER_NOT_CONFIGURED");
    return store.beginBooking(args);
  },

  async completeBooking(args) {
    if (typeof store?.completeBooking !== "function") throw new HttpError(503, "Phone verification state is unavailable", "OTP_PROVIDER_NOT_CONFIGURED");
    return store.completeBooking(args);
  },

  async releaseBooking(args) {
    if (typeof store?.releaseBooking !== "function") throw new HttpError(503, "Phone verification state is unavailable", "OTP_PROVIDER_NOT_CONFIGURED");
    return store.releaseBooking(args);
  },
});

const developmentStore = createMemoryOtpStore();
const developmentDelivery = Object.freeze({ isDevelopmentMock: true });
const otpService = createWidgetOtpService({ store: developmentStore, delivery: developmentDelivery });

let productionOtpService;
const getProductionOtpService = async () => {
  if (!productionOtpService) {
    const { createProductionWidgetOtpService } = await import("./widgetOtp.providers.js");
    productionOtpService = createProductionWidgetOtpService(process.env);
  }
  return productionOtpService;
};

export const requestWidgetOtp = async (args) => {
  if (process.env.OTP_DEV_MODE === "true" && process.env.NODE_ENV === "development") return otpService.request(args);
  return (await getProductionOtpService()).request(args);
};
export const verifyWidgetOtp = async (args) => {
  if (process.env.OTP_DEV_MODE === "true" && process.env.NODE_ENV === "development") return otpService.verify(args);
  return (await getProductionOtpService()).verify(args);
};
export const getWidgetBookingStatus = async (args) => {
  if (process.env.OTP_DEV_MODE === "true" && process.env.NODE_ENV === "development") return otpService.getBookingStatus(args);
  return (await getProductionOtpService()).getBookingStatus(args);
};
export const beginWidgetBooking = async (args) => {
  if (process.env.OTP_DEV_MODE === "true" && process.env.NODE_ENV === "development") return otpService.beginBooking(args);
  return (await getProductionOtpService()).beginBooking(args);
};
export const completeWidgetBooking = async (args) => {
  if (process.env.OTP_DEV_MODE === "true" && process.env.NODE_ENV === "development") return otpService.completeBooking(args);
  return (await getProductionOtpService()).completeBooking(args);
};
export const releaseWidgetBooking = async (args) => {
  if (process.env.OTP_DEV_MODE === "true" && process.env.NODE_ENV === "development") return otpService.releaseBooking(args);
  return (await getProductionOtpService()).releaseBooking(args);
};
export const discardWidgetOtp = (requestId) => developmentStore.discard(requestId);
