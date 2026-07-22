import { SETTINGS_ENDPOINTS } from "../constants/api.js";
import { apiClient } from "../utils/apiClient.js";

export const getSettings = async (token) => {
  const response = await apiClient(SETTINGS_ENDPOINTS.get, {
    method: "GET",
    token,
  });

  return response.data;
};

export const updateSettings = async (token, settingsData) => {
  const response = await apiClient(SETTINGS_ENDPOINTS.update, {
    method: "PUT",
    token,
    body: settingsData,
  });

  return response.data;
};
