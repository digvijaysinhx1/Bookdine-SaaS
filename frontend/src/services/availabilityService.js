import { AVAILABILITY_ENDPOINTS } from "../constants/api.js";
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

export const getAvailability = async (token, { date, guests, source }) => {
  const url = buildUrlWithParams(AVAILABILITY_ENDPOINTS.getAvailability, { date, guests, source });
  const response = await apiClient(url, {
    method: "GET",
    token,
  });

  return response.data;
};

export const getTimeSlots = async (token, { date, guests, source }) => {
  const url = buildUrlWithParams(AVAILABILITY_ENDPOINTS.getTimeSlots, { date, guests, source });
  const response = await apiClient(url, {
    method: "GET",
    token,
  });

  return response.data;
};
