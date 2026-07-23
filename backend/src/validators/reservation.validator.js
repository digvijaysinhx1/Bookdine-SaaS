import { badRequest } from "../utils/httpError.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLOT_INTERVAL_MINUTES = 30;
const VALID_STATUSES = new Set(["SEATED", "COMPLETED", "NO_SHOW"]);

const parseString = (value, field, { required = true, max = 255 } = {}) => {
  if (value == null || value === "") {
    if (!required) {
      return null;
    }

    throw badRequest(`${field} is required`, "VALIDATION_ERROR");
  }

  if (typeof value !== "string") {
    throw badRequest(`${field} must be a string`, "VALIDATION_ERROR");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    if (!required) {
      return null;
    }

    throw badRequest(`${field} is required`, "VALIDATION_ERROR");
  }

  if (trimmed.length > max) {
    throw badRequest(`${field} must be ${max} characters or fewer`, "VALIDATION_ERROR");
  }

  return trimmed;
};

const parseDate = (value) => {
  const date = parseString(value, "date", { max: 10 });

  if (!DATE_REGEX.test(date)) {
    throw badRequest("date must be a valid YYYY-MM-DD date", "INVALID_DATE");
  }

  const parsed = new Date(`${date}T00:00:00`);
  const [year, month, day] = date.split("-").map(Number);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw badRequest("date must be a valid calendar date", "INVALID_DATE");
  }

  return date;
};

const parseSlot = (value) => {
  const slot = parseString(value, "slot", { max: 5 });
  const match = slot.match(SLOT_REGEX);

  if (!match) {
    throw badRequest("slot must be a valid HH:mm time", "INVALID_SLOT");
  }

  const minutes = Number(match[1]) * 60 + Number(match[2]);

  if (minutes % SLOT_INTERVAL_MINUTES !== 0) {
    throw badRequest("slot must align to a 30 minute interval", "INVALID_SLOT");
  }

  return slot;
};

const parseGuests = (value) => {
  const guests = Number(value);

  if (!Number.isInteger(guests)) {
    throw badRequest("guests must be an integer", "INVALID_GUEST_COUNT");
  }

  return guests;
};

const parseEmail = (value) => {
  const email = parseString(value, "email", { max: 255 }).toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    throw badRequest("email must be a valid email address", "INVALID_EMAIL");
  }

  return email;
};

const parseId = (value) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("id must be a positive integer", "INVALID_ID");
  }

  return id;
};

export const validateReservationCreate = (req, res, next) => {
  try {
    const guestName = parseString(
      req.body?.guest_name ?? req.body?.name,
      "guest_name",
      { max: 120 }
    );
    const phoneNumber = parseString(
      req.body?.phone_number ?? req.body?.phone,
      "phone_number",
      { max: 30 }
    );
    const source = parseString(req.body?.source ?? "Walk In", "source", {
      required: false,
      max: 80,
    });

    req.body = {
      guest_name: guestName,
      phone_number: phoneNumber,
      email: parseEmail(req.body?.email),
      guests: parseGuests(req.body?.guests),
      date: parseDate(req.body?.date),
      slot: parseSlot(req.body?.slot ?? req.body?.time),
      source: source || "Walk In",
      special_notes: parseString(req.body?.special_notes, "special_notes", {
        required: false,
        max: 1000,
      }),
    };

    next();
  } catch (err) {
    next(err);
  }
};

export const validateReservationId = (req, res, next) => {
  try {
    req.params.id = parseId(req.params.id);
    next();
  } catch (err) {
    next(err);
  }
};

export const validateReservationStatus = (req, res, next) => {
  try {
    const status = parseString(req.body?.status, "status", { max: 20 }).toUpperCase();

    if (!VALID_STATUSES.has(status)) {
      throw badRequest("status must be SEATED, COMPLETED, or NO_SHOW", "INVALID_STATUS");
    }

    req.body = { status };
    next();
  } catch (err) {
    next(err);
  }
};
