import { supabaseAdmin } from "../db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const isSupabaseAuthEnabled = () => process.env.SUPABASE_AUTH_ENABLED === "true";

const createSupabaseAuthUser = async ({ email, password, name, phone, role, tenant_id }) => {
  if (!isSupabaseAuthEnabled()) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    phone,
    email_confirm: true,
    user_metadata: {
      name,
      role,
      tenant_id,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
};

export const register = async (data) => {
  const { tenant_id, name, email, phone, role, password } = data;

  if (!tenant_id || !name || !email || !password || !role) {
    throw new Error("All fields are required");
  }

  // Check if email already exists
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    throw new Error("Email already registered");
  }

  await createSupabaseAuthUser({
    email,
    password,
    name,
    phone,
    role,
    tenant_id,
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  const payload = {
    tenant_id,
    name,
    email,
    phone,
    role,
    password: hashedPassword,
  };

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .insert(payload)
    .select("id, tenant_id, name, email, phone, role")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return user;
};

export const login = async (data) => {
  const { email, password, tenant_id } = data;

  if (!email || !password || !tenant_id) {
    throw new Error("Email, password and tenant_id are required");
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, tenant_id: user.tenant_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};
