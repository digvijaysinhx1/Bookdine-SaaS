import { supabase, supabaseAdmin } from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isRestaurantRole, normalizeRole, ROLES } from "../config/roles.js";
import { conflict, forbidden, unauthorized } from "../utils/httpError.js";
import { slugify } from "../utils/slug.js";
import { randomUUID } from "node:crypto";

const PASSWORD_SALT_ROUNDS = 10;

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

const buildPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
});

const getPasswordHash = (user) => user.password_hash || user.password;

const getUsersByEmail = async (email) => {
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
  return user;
};

const getUserByAuthIdOrEmail = async ({ authUserId, email }) => {
  const { data: userById, error: idError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", authUserId)
    .maybeSingle();

  if (idError) {
    throw new Error(idError.message);
  }

  if (userById) {
    return userById;
  }

  return getUsersByEmail(email);
};

const buildAuthResponse = (user) => {
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
      role: normalizeRole(user.role),
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

const verifySupabasePassword = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user?.id) {
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  return getUserByAuthIdOrEmail({
    authUserId: data.user.id,
    email,
  });
};

export const login = async ({ email, password }) => {
  const user = await getUsersByEmail(email);
  const passwordHash = getPasswordHash(user);

  if (!passwordHash) {
    const supabaseUser = await verifySupabasePassword({ email, password });
    return buildAuthResponse(supabaseUser);
  }

  const isMatch = await bcrypt.compare(password, passwordHash);
  if (!isMatch) {
    try {
      const supabaseUser = await verifySupabasePassword({ email, password });
      return buildAuthResponse(supabaseUser);
    } catch {
      throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }
  }

  return buildAuthResponse(user);
};

const ensureEmailIsAvailable = async (email) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (data?.length) {
    throw conflict("An account with this email already exists", "DUPLICATE_EMAIL");
  }
};

export const register = async ({
  owner_name,
  owner_email,
  password,
  restaurant_name,
}) => {
  await ensureEmailIsAvailable(owner_email);

  const baseSlug = slugify(restaurant_name);
  let tenant;
  let tenantError;
  // The unique database index is the concurrency guard. Retry only slug conflicts.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomUUID().slice(0, 8)}`;
    const inserted = await supabaseAdmin.from("tenants").insert({
      name: restaurant_name,
      slug,
      opening_time: "09:00",
      closing_time: "22:00",
      max_guest: 15,
      status: "active",
    }).select("id").single();
    tenant = inserted.data;
    tenantError = inserted.error;
    if (!tenantError || tenantError.code !== "23505") break;
  }

  if (tenantError) {
    throw new Error(tenantError.message);
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const userPayload = {
    tenant_id: tenant.id,
    name: owner_name,
    email: owner_email,
    role: ROLES.RESTAURANT_ADMIN,
    password: passwordHash,
    is_active: true,
  };

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .insert(userPayload)
    .select("*")
    .single();

  if (userError) {
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);

    if (userError.code === "23505") {
      throw conflict("An account with this email already exists", "DUPLICATE_EMAIL");
    }

    throw new Error(userError.message);
  }

  return buildAuthResponse(user);
};

export const logout = async () => ({
  message: "Logged out successfully. Discard the access token on the client.",
});
