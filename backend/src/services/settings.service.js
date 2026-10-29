import { supabaseAdmin } from "../db/index.js";
import { HttpError } from "../utils/httpError.js";
import { createTenantSlugUpdater } from "./tenantSlugUpdater.js";

const SETTINGS_COLUMNS = [
  "opening_time",
  "closing_time",
  "max_guest",
  "status",
  "slug",
].join(", ");

const DEFAULT_SETTINGS = Object.freeze({
  minimum_guests: 1,
  booking_window_days: 30,
  cancellation_hours_before: 1,
  email_confirmation: true,
  whatsapp_confirmation: true,
});

const normalizeSettings = (settings) => ({
  opening_time: settings.opening_time,
  closing_time: settings.closing_time,
  minimum_guests: DEFAULT_SETTINGS.minimum_guests,
  maximum_guests: settings.max_guest,
  booking_window_days: DEFAULT_SETTINGS.booking_window_days,
  cancellation_hours_before: DEFAULT_SETTINGS.cancellation_hours_before,
  email_confirmation: DEFAULT_SETTINGS.email_confirmation,
  whatsapp_confirmation: DEFAULT_SETTINGS.whatsapp_confirmation,
  is_active: settings.status === "active",
  slug: settings.slug,
  public_booking_url: buildPublicBookingUrl(settings.slug),
});

const buildPublicBookingUrl = (slug) => {
  if (!slug || !process.env.PUBLIC_APP_URL) return null;
  try {
    const configuredUrl = new URL(process.env.PUBLIC_APP_URL);
    if (!new Set(["http:", "https:"]).has(configuredUrl.protocol)) return null;
    return `${configuredUrl.toString().replace(/\/$/, "")}/book/${slug}`;
  } catch {
    return null;
  }
};

const saveTenantSlug = createTenantSlugUpdater(supabaseAdmin);

const notFound = () =>
  new HttpError(404, "Restaurant settings were not found", "SETTINGS_NOT_FOUND");

export const getSettings = async ({ tenant_id } = {}) => {
  if (!tenant_id) {
    throw new HttpError(401, "Authenticated user is missing tenant context", "TENANT_REQUIRED");
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select(SETTINGS_COLUMNS)
    .eq("id", tenant_id)
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
    .from("tenants")
    .update({
      opening_time: settings.opening_time,
      closing_time: settings.closing_time,
      max_guest: settings.maximum_guests,
      status: settings.is_active ? "active" : "inactive",
    })
    .eq("id", tenant_id)
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

export const updateSlug = async ({ tenant_id, slug } = {}) => {
  const savedSlug = await saveTenantSlug({ tenantId: tenant_id, slug });
  return { slug: savedSlug, public_booking_url: buildPublicBookingUrl(savedSlug) };
};
