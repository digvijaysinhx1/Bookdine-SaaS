export const STORAGE_KEYS = Object.freeze({
  accessToken: "bookdine_access_token",
  user: "bookdine_user",
  rememberMe: "bookdine_remember_me",
});

const getStorage = (rememberMe) =>
  rememberMe ? localStorage : sessionStorage;

export const getRememberMePreference = () =>
  localStorage.getItem(STORAGE_KEYS.rememberMe) === "true";

export const setRememberMePreference = (rememberMe) => {
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEYS.rememberMe, "true");
  } else {
    localStorage.removeItem(STORAGE_KEYS.rememberMe);
  }
};

export const saveAuthSession = ({ accessToken, user, rememberMe }) => {
  const storage = getStorage(rememberMe);
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem(STORAGE_KEYS.accessToken);
  otherStorage.removeItem(STORAGE_KEYS.user);

  storage.setItem(STORAGE_KEYS.accessToken, accessToken);
  storage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  setRememberMePreference(rememberMe);
};

export const getStoredAuthSession = () => {
  const rememberMe = getRememberMePreference();
  const primaryStorage = getStorage(rememberMe);
  const fallbackStorage = rememberMe ? sessionStorage : localStorage;

  let accessToken = primaryStorage.getItem(STORAGE_KEYS.accessToken);
  let userRaw = primaryStorage.getItem(STORAGE_KEYS.user);

  if (!accessToken) {
    accessToken = fallbackStorage.getItem(STORAGE_KEYS.accessToken);
    userRaw = fallbackStorage.getItem(STORAGE_KEYS.user);
  }

  if (!accessToken || !userRaw) {
    return null;
  }

  try {
    return {
      accessToken,
      user: JSON.parse(userRaw),
      rememberMe,
    };
  } catch {
    clearAuthSession();
    return null;
  }
};

export const clearAuthSession = () => {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(STORAGE_KEYS.accessToken);
    storage.removeItem(STORAGE_KEYS.user);
  }
  localStorage.removeItem(STORAGE_KEYS.rememberMe);
};
