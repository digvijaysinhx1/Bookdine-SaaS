export const ROLES = Object.freeze({
  RESTAURANT_ADMIN: "RESTAURANT_ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
});

export const RESTAURANT_ROLES = Object.freeze(Object.values(ROLES));

const ROLE_ALIASES = Object.freeze({
  owner: ROLES.RESTAURANT_ADMIN,
  manager: ROLES.MANAGER,
  staff: ROLES.STAFF,
  RESTAURANT_ADMIN: ROLES.RESTAURANT_ADMIN,
  MANAGER: ROLES.MANAGER,
  STAFF: ROLES.STAFF,
});

export const normalizeRole = (role) => ROLE_ALIASES[String(role || "")];

export const isRestaurantRole = (role) => RESTAURANT_ROLES.includes(normalizeRole(role));
