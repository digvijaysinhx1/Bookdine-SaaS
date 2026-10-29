import { conflict, HttpError } from "../utils/httpError.js";

const isUniqueSlugError = (error) =>
  error?.code === "23505" ||
  String(error?.message || "").includes("tenants_slug_unique");

export const createTenantSlugUpdater = (db) => async ({ tenantId, slug }) => {
  if (!tenantId) throw new HttpError(401, "Authenticated user is missing tenant context", "TENANT_REQUIRED");

  const { data, error } = await db
    .from("tenants")
    .update({ slug })
    .eq("id", tenantId)
    .select("slug")
    .maybeSingle();

  if (error) {
    if (isUniqueSlugError(error)) throw conflict("That restaurant slug is already in use", "DUPLICATE_SLUG");
    throw new Error(error.message);
  }
  if (!data) throw new HttpError(404, "Restaurant settings were not found", "SETTINGS_NOT_FOUND");
  return data.slug;
};
