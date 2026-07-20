import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../db/index.js";
import { isRestaurantRole } from "../config/roles.js";
import { forbidden, unauthorized } from "../utils/httpError.js";

export default async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw unauthorized("Bearer access token is required", "TOKEN_REQUIRED");
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || "bookdine-api",
      audience: process.env.JWT_AUDIENCE || "bookdine-restaurant",
    });

    if (decoded.token_type !== "access") {
      throw unauthorized("Invalid token type", "INVALID_TOKEN_TYPE");
    }

    if (!decoded.sub || !decoded.tenant_id || !decoded.role) {
      throw unauthorized("Invalid token claims", "INVALID_TOKEN_CLAIMS");
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", decoded.sub)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      throw unauthorized("User no longer exists", "USER_NOT_FOUND");
    }

    const inactive =
      user.is_active === false ||
      user.active === false ||
      ["INACTIVE", "DISABLED", "SUSPENDED"].includes(
        String(user.status || "").toUpperCase()
      );

    if (inactive) {
      throw forbidden("Account is inactive", "ACCOUNT_INACTIVE");
    }

    if (
      String(user.tenant_id) !== String(decoded.tenant_id) ||
      user.role !== decoded.role
    ) {
      throw unauthorized("Token claims are no longer valid", "STALE_TOKEN");
    }

    if (!isRestaurantRole(user.role)) {
      throw forbidden("Role is not allowed for restaurant access", "ROLE_NOT_ALLOWED");
    }

    req.user = {
      id: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    };

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(unauthorized("Access token has expired", "TOKEN_EXPIRED"));
    }

    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      return next(unauthorized("Invalid access token", "INVALID_TOKEN"));
    }

    return next(err);
  }
};
