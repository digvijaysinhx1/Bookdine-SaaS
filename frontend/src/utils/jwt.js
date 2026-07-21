export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token, bufferSeconds = 30) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  const expiresAtMs = payload.exp * 1000;
  return Date.now() >= expiresAtMs - bufferSeconds * 1000;
};

export const getTokenExpiryMs = (token) => {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
};
