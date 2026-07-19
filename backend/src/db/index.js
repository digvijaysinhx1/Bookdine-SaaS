import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const getEnv = (name, { required = true } = {}) => {
  const value = process.env[name];

  if (required && !value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

const getFirstEnv = (names, { required = true } = {}) => {
  for (const name of names) {
    if (process.env[name]) {
      return process.env[name];
    }
  }

  if (required) {
    throw new Error(`${names.join(" or ")} is required`);
  }

  return undefined;
};

const supabaseUrl = getEnv("SUPABASE_URL");
const supabaseServiceRoleKey = getFirstEnv([
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
]);
const supabaseAnonKey = getFirstEnv(
  ["SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY"],
  { required: false }
);

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || supabaseServiceRoleKey,
  clientOptions
);

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  clientOptions
);

export default supabaseAdmin;
