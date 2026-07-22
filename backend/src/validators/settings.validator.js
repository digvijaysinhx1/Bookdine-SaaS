import { badRequest } from "../utils/httpError.js";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const SETTINGS_FIELDS = Object.freeze([
  "opening_time",
  "closing_time",
  "minimum_guests",
  "maximum_guests",
  "booking_window_days",
  "cancellation_hours_before",
  "email_confirmation",
  "whatsapp_confirmation",
  "is_active",
]);

const normalizeTime = (value, fieldName) => {
  if (typeof value !== "string" || !TIME_REGEX.test(value.trim())) {
    throw badRequest(`${fieldName} must be a valid HH:mm time`, "INVALID_OPENING_HOURS");
  }

  return value.trim().slice(0, 5);
};

const parseInteger = (value, fieldName, code) => {
  if (!Number.isInteger(value)) {
    throw badRequest(`${fieldName} must be an integer`, code);
  }

  return value;
};

const parseBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw badRequest(`${fieldName} must be true or false`, "INVALID_BOOLEAN");
  }

  return value;
};

const requireFields = (body) => {
  const missingFields = SETTINGS_FIELDS.filter((field) => body?.[field] == null);

  if (missingFields.length) {
    throw badRequest(
      `Missing required fields: ${missingFields.join(", ")}`,
      "MISSING_SETTINGS_FIELDS"
    );
  }
};

export const validateSettingsPayload = (body) => {
  requireFields(body);

  const settings = {
    opening_time: normalizeTime(body.opening_time, "opening_time"),
    closing_time: normalizeTime(body.closing_time, "closing_time"),
    minimum_guests: parseInteger(
      body.minimum_guests,
      "minimum_guests",
      "INVALID_GUEST_LIMITS"
    ),
    maximum_guests: parseInteger(
      body.maximum_guests,
      "maximum_guests",
      "INVALID_GUEST_LIMITS"
    ),
    booking_window_days: parseInteger(
      body.booking_window_days,
      "booking_window_days",
      "INVALID_BOOKING_WINDOW"
    ),
    cancellation_hours_before: parseInteger(
      body.cancellation_hours_before,
      "cancellation_hours_before",
      "INVALID_CANCELLATION_POLICY"
    ),
    email_confirmation: parseBoolean(
      body.email_confirmation,
      "email_confirmation"
    ),
    whatsapp_confirmation: parseBoolean(
      body.whatsapp_confirmation,
      "whatsapp_confirmation"
    ),
    is_active: parseBoolean(body.is_active, "is_active"),
  };

  if (settings.closing_time <= settings.opening_time) {
    throw badRequest(
      "closing_time must be greater than opening_time",
      "INVALID_OPENING_HOURS"
    );
  }

  if (settings.minimum_guests <= 0) {
    throw badRequest("minimum_guests must be greater than 0", "INVALID_GUEST_LIMITS");
  }

  if (settings.maximum_guests < settings.minimum_guests) {
    throw badRequest(
      "maximum_guests must be greater than or equal to minimum_guests",
      "INVALID_GUEST_LIMITS"
    );
  }

  if (settings.booking_window_days <= 0) {
    throw badRequest(
      "booking_window_days must be greater than 0",
      "INVALID_BOOKING_WINDOW"
    );
  }

  if (settings.cancellation_hours_before < 0) {
    throw badRequest(
      "cancellation_hours_before cannot be negative",
      "INVALID_CANCELLATION_POLICY"
    );
  }

  if (!settings.email_confirmation && !settings.whatsapp_confirmation) {
    throw badRequest(
      "At least one confirmation channel must be enabled",
      "INVALID_NOTIFICATION_PREFERENCES"
    );
  }

  return settings;
};

export const validateUpdateSettingsRequest = (req, res, next) => {
  try {
    req.body = validateSettingsPayload(req.body);
    next();
  } catch (err) {
    next(err);
  }
};
