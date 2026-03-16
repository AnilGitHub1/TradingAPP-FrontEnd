import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  getStockData,
  getUserLinesData,
  getSystemLinesData,
  saveLineData,
  updateLineData,
  deleteLineData,
  saveBookmark,
  getUserBookmarks,
} from "../Services/stockService";
import { TIME_FRAMES } from "../Constants/constants";

export const StockContext = createContext();

const sortByTime = (points) => {
  if (!Array.isArray(points)) return [];

  const sorted = [...points].sort((a, b) => {
    const at = typeof a.time === "number" ? a.time : Number(a.time);
    const bt = typeof b.time === "number" ? b.time : Number(b.time);
    if (Number.isNaN(at) || Number.isNaN(bt)) return 0;
    return at - bt;
  });

  if (sorted.length >= 2 && sorted[0].time === sorted[1].time) {
    const secondTime = sorted[1].time;
    if (typeof secondTime === "number") {
      sorted[1] = { ...sorted[1], time: secondTime + 1 };
    }
  }

  return sorted;
};

const getLinePoints = (line) => {
  if (Array.isArray(line)) return line;
  if (Array.isArray(line?.points)) return line.points;
  if (line?.startTime !== undefined && line?.endTime !== undefined) {
    return [
      { time: line.startTime, value: Number(line.startValue) },
      { time: line.endTime, value: Number(line.endValue) },
    ];
  }
  return [];
};

const getLineId = (line) =>
  line?.id || line?.trendlineId || line?.lineId || line?._id || null;

const mergeLineWithPoints = (line, points) => {
  if (Array.isArray(line)) return points;
  return { ...line, points };
};

export default function StockProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stockToken, setStockToken] = useState(474);
  const [timeFrame, setTimeFrame] = useState("ONE_HOUR");

  const [stockListCategory, setStockListCategory] = useState("n50");
  const [stockListSort, setStockListSort] = useState("alphabetic");

  const [stockData, setStockData] = useState({ candleData: [] });
  const [linesData, setLinesData] = useState([]);
  const [bookmarksByToken, setBookmarksByToken] = useState({});

  const normalizeLinesPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    if (Array.isArray(payload.linesData)) return payload.linesData;
    if (Array.isArray(payload.trendlineData)) return payload.trendlineData;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const mergeUniqueLines = (...lineSets) => {
    const merged = [];
    const seenIds = new Set();

    lineSets.flat().forEach((line) => {
      const lineId = getLineId(line);
      if (lineId) {
        if (seenIds.has(lineId)) return;
        seenIds.add(lineId);
      }
      merged.push(line);
    });

    return merged;
  };

  const normalizeBookmarksPayload = (payload) => {
    const list = Array.isArray(payload)
      ? payload
      : payload?.bookmarks || payload?.data || payload?.tokensList || [];

    if (!Array.isArray(list)) return {};

    return list.reduce((acc, item) => {
      if (item && typeof item === "object") {
        const token = item.token ?? item.stockToken;
        const color = item.color ?? item.bookmarkType;
        if (token && color) acc[token] = color;
      }
      return acc;
    }, {});
  };

  const fetchStockData = useCallback(async () => {
    if (!stockToken || !timeFrame) return;

    try {
      setLoading(true);
      setError(null);

      const [stockResponse, userTrendlineResponse, systemTrendlineResponse] =
        await Promise.all([
          getStockData(stockToken, timeFrame),
          getUserLinesData(stockToken, timeFrame),
          getSystemLinesData(stockToken, timeFrame),
        ]);

      setStockData({ candleData: stockResponse.stockData || [] });

      const userLines = normalizeLinesPayload(userTrendlineResponse);
      const systemLines = normalizeLinesPayload(systemTrendlineResponse);
      setLinesData(mergeUniqueLines(systemLines, userLines));
    } catch (err) {
      console.error("Stock fetch error:", err);
      setError("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  }, [stockToken, timeFrame]);

  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await getUserBookmarks();
      setBookmarksByToken(normalizeBookmarksPayload(response));
    } catch (bookmarkError) {
      console.error("Bookmarks fetch error:", bookmarkError);
    }
  }, []);

  const buildTrendlinePayload = (startPoint, endPoint) => {
    const sorted = sortByTime([startPoint, endPoint]);
    return {
      token: stockToken,
      tf: TIME_FRAMES[timeFrame],
      startTime: sorted[0].time,
      startValue: sorted[0].value,
      endTime: sorted[1].time,
      endValue: sorted[1].value,
      slope: 0,
      intercepet: 0,
      index1: 0,
      index2: 1,
    };
  };

  const addTrendline = useCallback(
    async ({ startPoint, endPoint }) => {
      if (!startPoint || !endPoint) return;

      const sortedPoints = sortByTime([startPoint, endPoint]);
      const payload = buildTrendlinePayload(sortedPoints[0], sortedPoints[1]);
      const optimisticLine = {
        id: `temp-${Date.now()}-${Math.random()}`,
        points: sortedPoints,
      };

      setLinesData((prev) => [...prev, optimisticLine]);

      try {
        const savedLine = await saveLineData(payload);
        const normalizedSaved = normalizeLinesPayload(savedLine);

        if (normalizedSaved.length > 0) {
          setLinesData((prev) => {
            const withoutOptimistic = prev.filter(
              (line) => line !== optimisticLine,
            );
            return [...withoutOptimistic, ...normalizedSaved];
          });
        } else if (savedLine && typeof savedLine === "object") {
          setLinesData((prev) => {
            const withoutOptimistic = prev.filter(
              (line) => line !== optimisticLine,
            );
            return [...withoutOptimistic, savedLine];
          });
        } else {
          await fetchStockData();
        }
      } catch (saveError) {
        console.error("Trendline save error:", saveError);
        await fetchStockData();
        throw saveError;
      }

      return payload;
    },
    [stockToken, timeFrame, fetchStockData],
  );

  const editTrendlineByIndex = useCallback(
    async (lineIndex, startPoint, endPoint) => {
      if (!Number.isInteger(lineIndex) || !startPoint || !endPoint) return;

      const nextPoints = sortByTime([startPoint, endPoint]);
      const payload = buildTrendlinePayload(nextPoints[0], nextPoints[1]);

      const existingLine = linesData[lineIndex];
      const existingLineId = getLineId(existingLine);

      setLinesData((prev) =>
        prev.map((line, index) =>
          index === lineIndex ? mergeLineWithPoints(line, nextPoints) : line,
        ),
      );

      try {
        if (existingLineId && !String(existingLineId).startsWith("temp-")) {
          await updateLineData(existingLineId, payload);
        } else {
          await saveLineData(payload);
        }
      } catch (updateError) {
        console.error("Trendline update error:", updateError);
        await fetchStockData();
        throw updateError;
      }
    },
    [linesData, stockToken, timeFrame, fetchStockData],
  );

  const deleteTrendlineByIndex = useCallback(
    async (lineIndex) => {
      if (!Number.isInteger(lineIndex)) return;

      const existingLine = linesData[lineIndex];
      const existingLineId = getLineId(existingLine);

      setLinesData((prev) => prev.filter((_, index) => index !== lineIndex));

      try {
        if (existingLineId && !String(existingLineId).startsWith("temp-")) {
          await deleteLineData(existingLineId);
        }
      } catch (deleteError) {
        console.error("Trendline delete error:", deleteError);
        await fetchStockData();
        throw deleteError;
      }
    },
    [linesData, fetchStockData],
  );

  const setBookmarkColor = useCallback(
    async (token, bookmarkType) => {
      if (!token || !bookmarkType) return;

      setBookmarksByToken((prev) => {
        const updated = { ...prev };
        if (updated[token] === bookmarkType) {
          delete updated[token];
        } else {
          updated[token] = bookmarkType;
        }
        return updated;
      });

      try {
        await saveBookmark({ token, bookmarkType });
      } catch (bookmarkError) {
        console.error("Bookmark save error:", bookmarkError);
        await fetchBookmarks();
        throw bookmarkError;
      }
    },
    [fetchBookmarks],
  );

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return (
    <StockContext.Provider
      value={{
        stockToken,
        setStockToken,
        timeFrame,
        setTimeFrame,
        stockListCategory,
        setStockListCategory,
        stockListSort,
        setStockListSort,
        stockData,
        linesData,
        setLinesData,
        fetchStockData,
        addTrendline,
        editTrendlineByIndex,
        deleteTrendlineByIndex,
        getLinePoints,
        bookmarksByToken,
        setBookmarkColor,
        loading,
        error,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => React.useContext(StockContext);
