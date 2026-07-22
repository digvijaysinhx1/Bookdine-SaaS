import { supabaseAdmin } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";

const SETTINGS_COLUMNS = [
  "opening_time",
  "closing_time",
  "minimum_guests",
  "maximum_guests",
  "booking_window_days",
  "cancellation_hours_before",
  "email_confirmation",
  "whatsapp_confirmation",
  "is_active",
].join(", ");

const normalizeSettings = (settings) => ({
  opening_time: settings.opening_time,
  closing_time: settings.closing_time,
  minimum_guests: settings.minimum_guests,
  maximum_guests: settings.maximum_guests,
  booking_window_days: settings.booking_window_days,
  cancellation_hours_before: settings.cancellation_hours_before,
  email_confirmation: settings.email_confirmation,
  whatsapp_confirmation: settings.whatsapp_confirmation,
  is_active: settings.is_active,
});

const notFound = () =>
  new HttpError(404, "Restaurant settings were not found", "SETTINGS_NOT_FOUND");

export const getSettings = async ({ tenant_id } = {}) => {
  if (!tenant_id) {
    throw new HttpError(401, "Authenticated user is missing tenant context", "TENANT_REQUIRED");
  }

  const { data, error } = await supabaseAdmin
    .from("restaurant_settings")
    .select(SETTINGS_COLUMNS)
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw notFound();
  }

  return normalizeSettings(data);
};

export const updateSettings = async ({ tenant_id, settings } = {}) => {
  if (!tenant_id) {
    throw new HttpError(401, "Authenticated user is missing tenant context", "TENANT_REQUIRED");
  }

  const { data, error } = await supabaseAdmin
    .from("restaurant_settings")
    .update(settings)
    .eq("tenant_id", tenant_id)
    .select(SETTINGS_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw notFound();
  }

  return normalizeSettings(data);
};
