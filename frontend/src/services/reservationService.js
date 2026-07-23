import { apiClient } from "../utils/apiClient.js";

const buildUrlWithParams = (endpoint, params) => {
  const url = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.append(key, value);
    }
  });
  
  const query = url.toString();
  return query ? `${endpoint}?${query}` : endpoint;
};

export const getReservations = async (token, { status, date, phone } = {}) => {
  const url = buildUrlWithParams("/reservations", { status, date, phone });
  const response = await apiClient(url, {
    method: "GET",
    token,
  });

  return response.data;
};

export const getReservationById = async (token, id) => {
  const response = await apiClient(`/reservations/${id}`, {
    method: "GET",
    token,
  });

  return response.data;
};

export const createReservation = async (token, reservationData) => {
  const response = await apiClient("/reservations", {
    method: "POST",
    token,
    body: reservationData,
  });

  return response.data;
};

export const updateReservationStatus = async (token, id, status) => {
  const response = await apiClient(`/reservations/${id}/status`, {
    method: "PUT",
    token,
    body: { status },
  });

  return response.data;
};

export const cancelReservation = async (token, id) => {
  const response = await apiClient(`/reservations/${id}/cancel`, {
    method: "POST",
    token,
  });

  return response.data;
};
