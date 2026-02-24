// apiClient.js
import axios from "axios";
import { getAccessToken, clearTokens, setAccessToken } from "./authService";
import { parseApiError } from "../utils/apiError";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5264";

const api = axios.create({
  baseURL: BASE,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// Attach token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err),
);

// Simple response interceptor to centralize 401 handling
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token),
  );
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // If network error or no response, normalize
    if (!error.response) return Promise.reject(parseApiError(error));

    // 401 handling: try token refresh once
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // queue the request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        // call refresh endpoint - implement this in authService
        const { refresh } = await import("./authService");
        const refreshResult = await refresh();
        if (refreshResult?.accessToken) {
          setAccessToken(refreshResult.accessToken);
          processQueue(null, refreshResult.accessToken);
          originalRequest.headers.Authorization =
            "Bearer " + refreshResult.accessToken;
          return api(originalRequest);
        }
        // if refresh failed, fallthrough to logout
        await import("./authService").then((mod) => mod.logout());
        processQueue(new Error("Session expired"), null);
        return Promise.reject(parseApiError(error));
      } catch (err) {
        processQueue(err, null);
        await import("./authService").then((mod) => mod.logout());
        return Promise.reject(parseApiError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(parseApiError(error));
  },
);

export default api;
