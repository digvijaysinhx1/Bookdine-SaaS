import { apiClient } from "../utils/apiClient.js";

export const getWidgetRestaurant = async (slug) => (await apiClient(`/public/restaurants/${encodeURIComponent(slug)}`)).data;
export const getWidgetSlots = async (slug, { date, guests }) => {
  const query = new URLSearchParams({ date, guests: String(guests) });
  return (await apiClient(`/public/restaurants/${encodeURIComponent(slug)}/slots?${query}`)).data;
};
export const requestWidgetOtp = async (slug, { email, phone_number }) =>
  (await apiClient(`/public/restaurants/${encodeURIComponent(slug)}/otp`, { method: "POST", body: { email, phone_number } })).data;
export const createWidgetBooking = async (slug, data) =>
  (await apiClient(`/public/restaurants/${encodeURIComponent(slug)}/bookings`, { method: "POST", body: data })).data;
