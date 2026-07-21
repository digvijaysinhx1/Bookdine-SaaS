export class ApiError extends Error {
  constructor(message, { status, code, isNetworkError = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.isNetworkError = isNetworkError;
  }
}

export const ERROR_MESSAGES = Object.freeze({
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PASSWORD: "Password must be at least 8 characters.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_INACTIVE: "Your account is inactive. Contact support.",
  ROLE_NOT_ALLOWED: "Your role is not allowed to access this application.",
  TENANT_REQUIRED: "Your account is not assigned to a restaurant.",
  TOKEN_REQUIRED: "Your session has expired. Please sign in again.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  INVALID_TOKEN: "Your session is invalid. Please sign in again.",
  STALE_TOKEN: "Your session is no longer valid. Please sign in again.",
  USER_NOT_FOUND: "Your account was not found. Please sign in again.",
  INVALID_TOKEN_TYPE: "Your session is invalid. Please sign in again.",
  INVALID_TOKEN_CLAIMS: "Your session is invalid. Please sign in again.",
  DUPLICATE_EMAIL: "Multiple accounts use this email. Contact support.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
  DEFAULT: "Something went wrong. Please try again.",
});

export const getErrorMessage = (code, fallbackMessage) =>
  ERROR_MESSAGES[code] || fallbackMessage || ERROR_MESSAGES.DEFAULT;

export const mapApiError = (error) => {
  if (error instanceof ApiError) {
    return getErrorMessage(error.code, error.message);
  }

  return ERROR_MESSAGES.DEFAULT;
};
