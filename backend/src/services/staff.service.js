import bcrypt from "bcrypt";
import { supabaseAdmin } from "../db/index.js";
import { conflict, forbidden, HttpError } from "../utils/httpError.js";
import { ROLES } from "../config/roles.js";

const SALT_ROUNDS = 10;
const STAFF_COLUMNS = "name, email, role, is_active, created_at";

const requireOwner = (role) => {
  if (role !== ROLES.RESTAURANT_ADMIN) throw forbidden("Only restaurant owners can manage staff", "OWNER_REQUIRED");
};

const requireTenant = (tenant_id) => {
  if (!tenant_id) throw new HttpError(401, "Authenticated user is missing tenant context", "TENANT_REQUIRED");
};

export const listStaff = async ({ tenant_id, role } = {}) => {
  requireOwner(role);
  requireTenant(tenant_id);
  const { data, error } = await supabaseAdmin.from("users").select(STAFF_COLUMNS).eq("tenant_id", tenant_id).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

export const createStaff = async ({ tenant_id, actor_role, name, email, password, role } = {}) => {
  requireOwner(actor_role);
  requireTenant(tenant_id);
  if (![ROLES.STAFF, ROLES.MANAGER].includes(role)) throw forbidden("Owners cannot assign the owner role", "ROLE_ASSIGNMENT_FORBIDDEN");

  const { data: existing, error: lookupError } = await supabaseAdmin.from("users").select("id").eq("email", email).limit(1);
  if (lookupError) throw new Error(lookupError.message);
  if (existing?.length) throw conflict("An account with this email already exists", "DUPLICATE_EMAIL");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { data, error } = await supabaseAdmin.from("users").insert({
    tenant_id,
    name,
    email,
    role,
    password: passwordHash,
    is_active: true,
  }).select(STAFF_COLUMNS).single();

  if (error) {
    if (error.code === "23505") throw conflict("An account with this email already exists", "DUPLICATE_EMAIL");
    throw new Error(error.message);
  }
  return data;
};
