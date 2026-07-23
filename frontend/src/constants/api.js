export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  logout: "/auth/logout",
};

export const SETTINGS_ENDPOINTS = {
  get: "/settings",
  update: "/settings",
};

export const TABLES_ENDPOINTS = {
  getAll: "/tables",
  create: "/tables",
  update: (id) => `/tables/${id}`,
  delete: (id) => `/tables/${id}`,
};

export const AVAILABILITY_ENDPOINTS = {
  getAvailability: "/availability",
  getTimeSlots: "/time-slots",
};
