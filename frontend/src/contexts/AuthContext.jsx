import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService.js";
import { isRestaurantRole } from "../constants/roles.js";
import { setAuthFailureHandler } from "../utils/apiClient.js";
import { mapApiError } from "../utils/errorMapper.js";
import { isTokenExpired } from "../utils/jwt.js";
import {
  clearAuthSession,
  getStoredAuthSession,
  saveAuthSession,
} from "../utils/tokenStorage.js";

export const AuthContext = createContext(null);

const dashboardUser = (user) => {
  if (!user) return user;
  const safeUser = { ...user };
  delete safeUser.tenant_id;
  delete safeUser.tenantId;
  return safeUser;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  const clearSession = useCallback((message = null) => {
    clearAuthSession();
    setUser(null);
    setAccessToken(null);
    setAuthError(message);
  }, []);

  const restoreSession = useCallback(() => {
    const session = getStoredAuthSession();

    if (!session) {
      setUser(null);
      setAccessToken(null);
      return false;
    }

    if (isTokenExpired(session.accessToken)) {
      clearSession("Your session has expired. Please sign in again.");
      return false;
    }

    if (!isRestaurantRole(session.user?.role)) {
      clearSession("Your role is not allowed to access this application.");
      return false;
    }

    const safeUser = dashboardUser(session.user);
    saveAuthSession({ accessToken: session.accessToken, user: safeUser, rememberMe: session.rememberMe });
    setUser(safeUser);
    setAccessToken(session.accessToken);
    return true;
  }, [clearSession]);

  useEffect(() => {
    restoreSession();
    setIsInitializing(false);
  }, [restoreSession]);

  useEffect(() => {
    setAuthFailureHandler((code) => {
      clearSession(
        code === "TOKEN_EXPIRED"
          ? "Your session has expired. Please sign in again."
          : "Your session is no longer valid. Please sign in again."
      );
    });

    return () => setAuthFailureHandler(null);
  }, [clearSession]);

  const login = useCallback(async ({ email, password, rememberMe = false }) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const data = await authService.login({ email, password });

      if (!isRestaurantRole(data.user?.role)) {
        throw new Error("Your role is not allowed to access this application.");
      }

      const safeUser = dashboardUser(data.user);
      saveAuthSession({
        accessToken: data.access_token,
        user: safeUser,
        rememberMe,
      });

      setUser(safeUser);
      setAccessToken(data.access_token);
      return data;
    } catch (error) {
      const message = mapApiError(error);
      setAuthError(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await authService.logout(accessToken);
    } finally {
      clearSession();
      setIsSubmitting(false);
    }
  }, [accessToken, clearSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isInitializing,
      isSubmitting,
      authError,
      login,
      logout,
      clearAuthError: () => setAuthError(null),
    }),
    [
      user,
      accessToken,
      isInitializing,
      isSubmitting,
      authError,
      login,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
