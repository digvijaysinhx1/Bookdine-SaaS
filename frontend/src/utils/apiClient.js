import { API_BASE_URL } from "../constants/api.js";
import { ApiError } from "./errorMapper.js";

let authFailureHandler = null;

export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

const AUTH_FAILURE_CODES = new Set([
  "TOKEN_REQUIRED",
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
  "STALE_TOKEN",
  "USER_NOT_FOUND",
  "INVALID_TOKEN_TYPE",
  "INVALID_TOKEN_CLAIMS",
]);

const buildUrl = (endpoint) => {
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

export const apiClient = async (
  endpoint,
  { method = "GET", body, token, headers = {}, skipAuthFailure = false } = {}
) => {
  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(buildUrl(endpoint), {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Network request failed", {
      isNetworkError: true,
      code: "NETWORK_ERROR",
    });
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const code = payload?.error?.code;
    const message = payload?.error?.message || "Request failed";

    if (
      !skipAuthFailure &&
      response.status === 401 &&
      code &&
      AUTH_FAILURE_CODES.has(code) &&
      typeof authFailureHandler === "function"
    ) {
      authFailureHandler(code);
    }

    throw new ApiError(message, {
      status: response.status,
      code,
    });
  }

  return payload;
};
