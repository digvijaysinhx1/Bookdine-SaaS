import { badRequest } from "../utils/httpError.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parseDate = (value) => {
  if (typeof value !== "string" || !DATE_REGEX.test(value.trim())) {
    throw badRequest("date must be a valid YYYY-MM-DD date", "INVALID_DATE");
  }

  const date = value.trim();
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

const parseGuests = (value) => {
  const guests = Number(value);

  if (!Number.isInteger(guests)) {
    throw badRequest("guests must be an integer", "INVALID_GUEST_COUNT");
  }

  return guests;
};

const parseSource = (value) =>
  value === "dashboard" ? "dashboard" : "widget";

export const validateAvailabilityQuery = (req, res, next) => {
  try {
    req.query = {
      ...req.query,
      date: parseDate(req.query?.date),
      guests: parseGuests(req.query?.guests),
      source: parseSource(req.query?.source),
    };

    next();
  } catch (err) {
    next(err);
  }
};
