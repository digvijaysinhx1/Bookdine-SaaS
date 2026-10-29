import { badRequest } from "../utils/httpError.js";
import { ROLES } from "../config/roles.js";

export const validateCreateStaff = (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 120) throw badRequest("name is required and must be at most 120 characters", "VALIDATION_ERROR");
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw badRequest("A valid email is required", "INVALID_EMAIL");
    if (typeof password !== "string" || password.length < 12 || password.length > 128) throw badRequest("password must be between 12 and 128 characters", "INVALID_PASSWORD");
    if (![ROLES.STAFF, ROLES.MANAGER].includes(role)) throw badRequest("role must be STAFF or MANAGER", "INVALID_ROLE");
    req.body = { name: name.trim(), email: email.trim().toLowerCase(), password, role };
    next();
  } catch (error) {
    next(error);
  }
};
