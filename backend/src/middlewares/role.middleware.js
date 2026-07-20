import { RESTAURANT_ROLES } from "../config/roles.js";
import { forbidden } from "../utils/httpError.js";

export default (allowedRoles = RESTAURANT_ROLES) => {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user?.role || !allowed.includes(req.user.role)) {
      return next(forbidden("Insufficient role permissions", "ROLE_FORBIDDEN"));
    }

    return next();
  };
};
