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
