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

/**
 * stock list - if you keep dictionary on frontend, you can omit this.
 * If backend has /api/Stocks/list return list of {name, token, ...}
 */
// export async function getStockList() {
//   const res = await api.get(`/api/Stocks/list`);
//   return res.data;
// }

export const getStockList = async (timeFrame, category, sort) => {
  try {
    const response = await api.get(
      `/stocklist/${timeFrame}/${category}/${sort}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching stock list:", error);
    throw error;
  }
};

export const getStockData = async (stockToken, timeFrame) => {
  const basePath = INTRADAY_TIMEFRAMES.includes(timeFrame)
    ? "api/FifteenTF/stockdata"
    : "api/DailyTF/stockdata";
  //query params
  const { data } = await api.get(basePath, {
    params: {
      token: stockToken,
      tf: TIME_FRAMES[timeFrame],
    },
  });

  return data;
};
