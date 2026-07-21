import { AUTH_ENDPOINTS } from "../constants/api.js";
import { apiClient } from "../utils/apiClient.js";

export const login = async ({ email, password }) => {
  const response = await apiClient(AUTH_ENDPOINTS.login, {
    method: "POST",
    body: { email, password },
    skipAuthFailure: true,
  });

  return response.data;
};

export const logout = async (token) => {
  if (!token) {
    return { message: "Logged out successfully." };
  }

  try {
    const response = await apiClient(AUTH_ENDPOINTS.logout, {
      method: "POST",
      token,
      skipAuthFailure: true,
    });
    return response.data;
  } catch {
    return { message: "Logged out locally." };
  }
};
