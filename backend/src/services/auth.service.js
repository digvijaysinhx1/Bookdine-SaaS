import { supabaseAdmin } from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isRestaurantRole } from "../config/roles.js";
import { conflict, forbidden, unauthorized } from "../utils/httpError.js";

const getJwtOptions = () => ({
  expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  issuer: process.env.JWT_ISSUER || "bookdine-api",
  audience: process.env.JWT_AUDIENCE || "bookdine-restaurant",
});

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return process.env.JWT_SECRET;
};

const isInactiveUser = (user) =>
  user.is_active === false ||
  user.active === false ||
  ["INACTIVE", "DISABLED", "SUSPENDED"].includes(
    String(user.status || "").toUpperCase()
  );

const getPasswordHash = (user) => user.password_hash || user.password;

const buildPublicUser = (user) => ({
  id: user.id,
  tenant_id: user.tenant_id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const login = async ({ email, password }) => {
  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .limit(2);

  if (error) {
    throw new Error(error.message);
  }

  if (!users?.length) {
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (users.length > 1) {
    throw conflict(
      "Multiple accounts use this email. Contact support to resolve account ownership.",
      "DUPLICATE_EMAIL"
    );
  }

  const [user] = users;
  const passwordHash = getPasswordHash(user);

  if (!passwordHash) {
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, passwordHash);
  if (!isMatch) {
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (isInactiveUser(user)) {
    throw forbidden("Account is inactive", "ACCOUNT_INACTIVE");
  }

  if (!user.tenant_id) {
    throw forbidden("User is not assigned to a restaurant", "TENANT_REQUIRED");
  }

  if (!isRestaurantRole(user.role)) {
    throw forbidden("Role is not allowed for restaurant access", "ROLE_NOT_ALLOWED");
  }

  const accessToken = jwt.sign(
    {
      sub: String(user.id),
      user_id: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      token_type: "access",
    },
    getJwtSecret(),
    getJwtOptions()
  );

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    user: buildPublicUser(user),
  };
};

export const logout = async () => ({
  message: "Logged out successfully. Discard the access token on the client.",
});
