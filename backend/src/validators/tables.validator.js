import { badRequest } from "../utils/httpError.js";

const TABLE_FIELDS = Object.freeze([
  "table_number",
  "capacity",
  "location",
  "is_active",
]);

const normalizeString = (value, fieldName, code) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${fieldName} is required`, code);
  }

  return value.trim();
};

const parseCapacity = (value) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest("capacity must be greater than 0", "INVALID_TABLE_CAPACITY");
  }

  return value;
};

const parseBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw badRequest(`${fieldName} must be true or false`, "INVALID_BOOLEAN");
  }

  return value;
};

const hasOwn = (body, field) =>
  Object.prototype.hasOwnProperty.call(body || {}, field);

const requireCreateFields = (body) => {
  const missingFields = ["table_number", "capacity", "location"].filter(
    (field) => !hasOwn(body, field) || body[field] == null
  );

  if (missingFields.length) {
    throw badRequest(
      `Missing required fields: ${missingFields.join(", ")}`,
      "MISSING_TABLE_FIELDS"
    );
  }
};

export const validateCreateTablePayload = (body) => {
  requireCreateFields(body);

  return {
    table_number: normalizeString(
      body.table_number,
      "table_number",
      "INVALID_TABLE_NUMBER"
    ),
    capacity: parseCapacity(body.capacity),
    location: normalizeString(body.location, "location", "INVALID_TABLE_LOCATION"),
    is_active: hasOwn(body, "is_active")
      ? parseBoolean(body.is_active, "is_active")
      : true,
  };
};

export const validateUpdateTablePayload = (body) => {
  const submittedFields = TABLE_FIELDS.filter((field) => hasOwn(body, field));

  if (!submittedFields.length) {
    throw badRequest(
      "At least one table field must be provided",
      "MISSING_TABLE_FIELDS"
    );
  }

  const table = {};

  if (hasOwn(body, "table_number")) {
    table.table_number = normalizeString(
      body.table_number,
      "table_number",
      "INVALID_TABLE_NUMBER"
    );
  }

  if (hasOwn(body, "capacity")) {
    table.capacity = parseCapacity(body.capacity);
  }

  if (hasOwn(body, "location")) {
    table.location = normalizeString(
      body.location,
      "location",
      "INVALID_TABLE_LOCATION"
    );
  }

  if (hasOwn(body, "is_active")) {
    table.is_active = parseBoolean(body.is_active, "is_active");
  }

  return table;
};

export const validateCreateTableRequest = (req, res, next) => {
  try {
    req.body = validateCreateTablePayload(req.body);
    next();
  } catch (err) {
    next(err);
  }
};

export const validateUpdateTableRequest = (req, res, next) => {
  try {
    req.body = validateUpdateTablePayload(req.body);
    next();
  } catch (err) {
    next(err);
  }
};

export const validateTableIdRequest = (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      throw badRequest("id must be a valid table id", "INVALID_TABLE_ID");
    }

    next();
  } catch (err) {
    next(err);
  }
};
