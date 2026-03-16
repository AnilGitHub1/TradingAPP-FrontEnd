// stockService.js
import api from "./apiClient";
import { TIME_FRAMES, INTRADAY_TIMEFRAMES, URLS } from "../Constants/constants";

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
  const { data } = await api.get("api/StockDetails/stocklist", {
    params: {
      category,
      tf: TIME_FRAMES[timeFrame],
      sort,
    },
  });
  return data;
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


export const getSystemLinesData = async (stockToken, timeFrame) => {
  const { data } = await api.get(`${URLS.SYSTEM_TRENDLINES}/byToken`, {
    params: {
      token: stockToken,
      tf: TIME_FRAMES[timeFrame],
    },
  });

  return data;
};

export const getUserLinesData = async (stockToken, timeFrame) => {
  const { data } = await api.get(`${URLS.USER_TRENDLINES}/byTokenAndTf`, {
    params: {
      token: stockToken,
      tf: TIME_FRAMES[timeFrame],
    },
  });

  return data;
};

export const getAllUserTrendlines = async () => {
  const { data } = await api.get(URLS.USER_TRENDLINES);
  return data;
};

export const saveLineData = async (payload) => {
  const { data } = await api.post(URLS.USER_TRENDLINES, payload);
  return data;
};

export const updateLineData = async (lineId, payload) => {
  const { data } = await api.put(`${URLS.USER_TRENDLINES}/${lineId}`, payload);
  return data;
};

export const deleteLineData = async (lineId) => {
  const { data } = await api.delete(`${URLS.USER_TRENDLINES}/${lineId}`);
  return data;
};

export const saveBookmark = async ({ token, bookmarkType }) => {
  const { data } = await api.post(URLS.USER_BOOKMARKS, {
    token,
    color: bookmarkType,
  });
  return data;
};

export const getUserBookmarks = async () => {
  const { data } = await api.get(URLS.USER_BOOKMARKS);
  return data;
};
