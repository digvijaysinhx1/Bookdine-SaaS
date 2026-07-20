export class HttpError extends Error {
  constructor(statusCode, message, code = "REQUEST_FAILED") {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace?.(this, HttpError);
  }
}

export const badRequest = (message, code = "BAD_REQUEST") =>
  new HttpError(400, message, code);

export const unauthorized = (message = "Unauthorized", code = "UNAUTHORIZED") =>
  new HttpError(401, message, code);

export const forbidden = (message = "Forbidden", code = "FORBIDDEN") =>
  new HttpError(403, message, code);

export const conflict = (message, code = "CONFLICT") =>
  new HttpError(409, message, code);
