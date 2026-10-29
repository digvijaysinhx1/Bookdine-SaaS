import { HttpError } from "../utils/httpError.js";

export const createTenantSlugResolver = (db) => async (slug) => {
  const { data, error } = await db
    .from("tenants")
    .select("id, slug, name, opening_time, closing_time, max_guest, status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, "Restaurant was not found", "RESTAURANT_NOT_FOUND");
  return data;
};
