// trendlineService.js
import api from "./apiClient";

/**
 * Get trendlines for token and tf string (1D, 15m, etc)
 */
export async function getTrendlines(token, tf) {
  const res = await api.get("/api/Trendline/byToken", {
    params: { token, tf },
  });
  return res.data;
}

/**
 * Save a trendline (expects shape that backend accepts)
 */
export async function saveTrendline(payload) {
  // payload: { token, tf, index1, index2, slope, intercept, hl? }
  const res = await api.post("/api/Trendline", payload);
  return res.data;
}
