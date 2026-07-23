import { AVAILABILITY_ENDPOINTS } from "../constants/api.js";
import { API_BASE_URL } from "../constants/api.js";
import { apiClient } from "../utils/apiClient.js";

const buildUrlWithParams = (endpoint, params) => {
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${base}${path}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.pathname + url.search;
};

export const getAvailability = async (token, { date, guests }) => {
  const url = buildUrlWithParams(AVAILABILITY_ENDPOINTS.getAvailability, { date, guests });
  const response = await apiClient(url, {
    method: "GET",
    token,
  });

  return response.data;
};

export const getTimeSlots = async (token, { date, guests }) => {
  const url = buildUrlWithParams(AVAILABILITY_ENDPOINTS.getTimeSlots, { date, guests });
  const response = await apiClient(url, {
    method: "GET",
    token,
  });

  return response.data;
};
