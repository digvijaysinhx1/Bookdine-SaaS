import { apiClient } from "../utils/apiClient.js";

export const getDashboardOverview = async (token) => {
  const response = await apiClient("/dashboard", { method: "GET", token });
  return response.data;
};
