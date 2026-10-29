import { badRequest } from "../utils/httpError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const validateEmail = (email) => {
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    throw badRequest("A valid email address is required", "INVALID_EMAIL");
  }

  return email.trim().toLowerCase();
};

export const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      "INVALID_PASSWORD"
    );
  }

  return password;
};

export const validateLoginRequest = (req, res, next) => {
  try {
    req.body = {
      email: validateEmail(req.body?.email),
      password: validatePassword(req.body?.password),
    };

    next();
  } catch (err) {
    next(err);
  }
};

const validateText = (value, field, { max = 120 } = {}) => {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`${field} is required`, "VALIDATION_ERROR");
  }

  const trimmed = value.trim();

  if (trimmed.length > max) {
    throw badRequest(`${field} must be ${max} characters or fewer`, "VALIDATION_ERROR");
  }

  return trimmed;
};

export const validateRegisterRequest = (req, res, next) => {
  try {
    req.body = {
      owner_name: validateText(req.body?.owner_name ?? req.body?.name, "owner_name"),
      owner_email: validateEmail(req.body?.owner_email ?? req.body?.email),
      password: validatePassword(req.body?.password),
      restaurant_name: validateText(
        req.body?.restaurant_name ?? req.body?.tenant_name,
        "restaurant_name"
      ),
    };

    next();
  } catch (err) {
    next(err);
  }
};
