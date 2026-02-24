// authService.js
import api from "./apiClient";

const ACCESS_KEY = "ta_access_token";
const REFRESH_KEY = "ta_refresh_token";

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch (e) {
    return null;
  }
}
export function setAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_KEY, token);
  } catch (e) {}
}
export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch (e) {
    return null;
  }
}
export function setRefreshToken(token) {
  try {
    localStorage.setItem(REFRESH_KEY, token);
  } catch (e) {}
}
export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch (e) {}
}
export async function register(credentials) {
  try {
    const { data } = await api.post("/api/Auth/signup", credentials);

    if (data.access_token) setAccessToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);

    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.response?.data || "Signup failed",
    );
  }
}

// Public methods
export async function login(credentials) {
  try {
    const { data } = await api.post("/api/Auth/signin", credentials);

    setAccessToken(data.access_token);
    return data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.response?.data || "Login failed";

    throw new Error(message);
  }
}

export async function logout() {
  try {
    await api.post("/api/Auth/logout").catch(() => {});
  } finally {
    clearTokens();
    // optional: reload or update app context
    window.location.href = "/login";
  }
}

export async function refresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");
  const res = await api.post("/api/Auth/refresh", { refreshToken });
  const { accessToken, refreshToken: newRefresh } = res.data;
  setAccessToken(accessToken);
  if (newRefresh) setRefreshToken(newRefresh);
  return { accessToken, refreshToken: newRefresh || refreshToken };
}
