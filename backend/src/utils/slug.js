export const slugify = (value) => {
  const slug = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || "restaurant";
};

export const isValidSlug = (value) =>
  typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100;

export const normalizeRestaurantSlug = (value) => {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input || input.length > 200 || /(?:https?:\/\/|www\.)|[./?#:@\\]/i.test(input)) return null;
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return isValidSlug(slug) ? slug : null;
};
