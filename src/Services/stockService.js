// stockService.js
import api from "./apiClient";
import { TIME_FRAMES, INTRADAY_TIMEFRAMES } from "../Constants/constants";

/**
 * getCandles(token, timeframeKey, limit)
 * timeframeKey: e.g. "DailyTF" or "FifteenTF" (if your backend uses these routes),
 * or pass tf like "1D"/"15m" depending on API.
 */
export async function getCandlesByToken(
  token,
  timeframeKey = "DailyTF",
  limit = 300,
) {
  const res = await api.get(`/api/${timeframeKey}/byToken`, {
    params: { token, limit },
  });
  return res.data;
}

export const getStockList = async (timeFrame, category, sort) => {
  try {
    const { data } = await api.get(`api/StockDetails/stocklist`, {
      params: {
        category,
        tf: TIME_FRAMES[timeFrame],
        sort,
      },
    });
    return data;
  } catch (error) {
    console.error("Error fetching stock list:", error);
    throw error;
  }
};

export const getStockData = async (stockToken, timeFrame) => {
  const basePath = INTRADAY_TIMEFRAMES.includes(timeFrame)
    ? "api/FifteenTF/stockdata"
    : "api/DailyTF/stockdata";

  const { data } = await api.get(basePath, {
    params: {
      token: stockToken,
      tf: TIME_FRAMES[timeFrame],
    },
  });

  return data;
};

export const getLinesData = async (stockToken, timeFrame) => {
  const { data } = await api.get("api/Trendline/byToken", {
    params: {
      token: stockToken,
      tf: TIME_FRAMES[timeFrame],
    },
  });

  return data;
};

export const saveLineData = async (payload) => {
  const { data } = await api.post("api/Trendline", payload);
  return data;
};

export const updateLineData = async (lineId, payload) => {
  const { data } = await api.put(`api/Trendline/${lineId}`, payload);
  return data;
};

export const deleteLineData = async (lineId) => {
  const { data } = await api.delete(`api/Trendline/${lineId}`);
  return data;
};

export const saveBookmark = async ({ token, bookmarkType }) => {
  const { data } = await api.post("api/Bookmarks", { token, bookmarkType });
  return data;
};
