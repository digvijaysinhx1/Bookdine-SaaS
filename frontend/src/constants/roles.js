export const ROLES = Object.freeze({
  RESTAURANT_ADMIN: "RESTAURANT_ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
});

export const RESTAURANT_ROLES = Object.freeze(Object.values(ROLES));

export const ROLE_LABELS = Object.freeze({
  [ROLES.RESTAURANT_ADMIN]: "Admin",
  [ROLES.MANAGER]: "Manager",
  [ROLES.STAFF]: "Staff",
});

export const isRestaurantRole = (role) => RESTAURANT_ROLES.includes(role);
