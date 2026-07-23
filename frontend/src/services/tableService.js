import { TABLES_ENDPOINTS } from "../constants/api.js";
import { apiClient } from "../utils/apiClient.js";

export const getTables = async (token) => {
  const response = await apiClient(TABLES_ENDPOINTS.getAll, {
    method: "GET",
    token,
  });

  return response.data;
};

export const createTable = async (token, tableData) => {
  const response = await apiClient(TABLES_ENDPOINTS.create, {
    method: "POST",
    token,
    body: tableData,
  });

  return response.data;
};

export const updateTable = async (token, tableId, tableData) => {
  const response = await apiClient(TABLES_ENDPOINTS.update(tableId), {
    method: "PUT",
    token,
    body: tableData,
  });

  return response.data;
};

export const deleteTable = async (token, tableId) => {
  const response = await apiClient(TABLES_ENDPOINTS.delete(tableId), {
    method: "DELETE",
    token,
  });

  return response.data;
};
