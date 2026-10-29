import { apiClient } from "../utils/apiClient.js";

export const getStaff = async (token) => (await apiClient("/staff", { method: "GET", token })).data;
export const createStaff = async (token, staff) => (await apiClient("/staff", { method: "POST", token, body: staff })).data;
