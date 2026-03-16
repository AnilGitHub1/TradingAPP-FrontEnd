import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  getStockData,
  getLinesData,
  saveLineData,
  updateLineData,
  deleteLineData,
  saveBookmark,
} from "../Services/stockService";
import { TIME_FRAMES } from "../Constants/constants";

export const StockContext = createContext();

const LOCAL_TRENDLINE_PREFIX = "ta_trendlines";

const sortByTime = (points) => {
  if (!Array.isArray(points)) return [];

  const sorted = [...points].sort((a, b) => {
    const at = typeof a.time === "number" ? a.time : Number(a.time);
    const bt = typeof b.time === "number" ? b.time : Number(b.time);
    if (Number.isNaN(at) || Number.isNaN(bt)) return 0;
    return at - bt;
  });

  // lightweight-charts line series expects strictly increasing time values.
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

const buildTrendlineStorageKey = (stockToken, timeFrame) =>
  `${LOCAL_TRENDLINE_PREFIX}:${stockToken}:${timeFrame}`;

const readLocalTrendlines = (stockToken, timeFrame) => {
  try {
    const key = buildTrendlineStorageKey(stockToken, timeFrame);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalTrendlines = (stockToken, timeFrame, lines) => {
  try {
    const key = buildTrendlineStorageKey(stockToken, timeFrame);
    localStorage.setItem(key, JSON.stringify(lines));
  } catch {
    // localStorage failure should not block UI.
  }
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

  const fetchStockData = useCallback(async () => {
    if (!stockToken || !timeFrame) return;

    const localLines = readLocalTrendlines(stockToken, timeFrame);

    try {
      setLoading(true);
      setError(null);

      const [stockResponse, trendlineResponse] = await Promise.all([
        getStockData(stockToken, timeFrame),
        getLinesData(stockToken, timeFrame),
      ]);

      setStockData({ candleData: stockResponse.stockData || [] });

      const serverLines = normalizeLinesPayload(trendlineResponse);
      const mergedLines = localLines.length > 0 ? localLines : serverLines;
      setLinesData(mergedLines);
      writeLocalTrendlines(stockToken, timeFrame, mergedLines);
    } catch (err) {
      console.error("Stock fetch error:", err);
      setError("Failed to fetch stock data");

      try {
        const stockResponse = await getStockData(stockToken, timeFrame);
        setStockData({ candleData: stockResponse.stockData || [] });
      } catch (stockErr) {
        console.error("Stock data fetch fallback error:", stockErr);
      }

      setLinesData(localLines);
    } finally {
      setLoading(false);
    }
  }, [stockToken, timeFrame]);

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
      index2: 0,
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

      setLinesData((prev) => {
        const next = [...prev, optimisticLine];
        writeLocalTrendlines(stockToken, timeFrame, next);
        return next;
      });

      try {
        const savedLine = await saveLineData(payload);
        const normalizedSaved = normalizeLinesPayload(savedLine);

        setLinesData((prev) => {
          const withoutOptimistic = prev.filter(
            (line) => line !== optimisticLine,
          );
          let next = withoutOptimistic;

          if (normalizedSaved.length > 0) {
            next = [...withoutOptimistic, ...normalizedSaved];
          } else if (savedLine && typeof savedLine === "object") {
            next = [...withoutOptimistic, savedLine];
          } else {
            next = [...withoutOptimistic, optimisticLine];
          }

          writeLocalTrendlines(stockToken, timeFrame, next);
          return next;
        });
      } catch (saveError) {
        // API can fail while backend is not ready; keep UI/local data intact.
        console.error("Trendline save error (non-blocking):", saveError);
      }

      return payload;
    },
    [stockToken, timeFrame],
  );

  const editTrendlineByIndex = useCallback(
    async (lineIndex, startPoint, endPoint) => {
      if (!Number.isInteger(lineIndex) || !startPoint || !endPoint) return;

      const nextPoints = sortByTime([startPoint, endPoint]);
      const payload = buildTrendlinePayload(nextPoints[0], nextPoints[1]);

      const existingLine = linesData[lineIndex];
      const existingLineId = getLineId(existingLine);

      setLinesData((prev) => {
        const next = prev.map((line, index) =>
          index === lineIndex ? mergeLineWithPoints(line, nextPoints) : line,
        );
        writeLocalTrendlines(stockToken, timeFrame, next);
        return next;
      });

      try {
        if (existingLineId && !String(existingLineId).startsWith("temp-")) {
          await updateLineData(existingLineId, payload);
        } else {
          await saveLineData(payload);
        }
      } catch (updateError) {
        // Non-blocking while backend endpoints are not ready.
        console.error("Trendline update error (non-blocking):", updateError);
      }
    },
    [linesData, stockToken, timeFrame],
  );

  const deleteTrendlineByIndex = useCallback(
    async (lineIndex) => {
      if (!Number.isInteger(lineIndex)) return;

      const existingLine = linesData[lineIndex];
      const existingLineId = getLineId(existingLine);

      setLinesData((prev) => {
        const next = prev.filter((_, index) => index !== lineIndex);
        writeLocalTrendlines(stockToken, timeFrame, next);
        return next;
      });

      try {
        if (existingLineId && !String(existingLineId).startsWith("temp-")) {
          await deleteLineData(existingLineId);
        }
      } catch (deleteError) {
        // Non-blocking while backend endpoints are not ready.
        console.error("Trendline delete error (non-blocking):", deleteError);
      }
    },
    [linesData, stockToken, timeFrame],
  );

  const setBookmarkColor = useCallback(async (token, bookmarkType) => {
    if (!token || !bookmarkType) return;

    setBookmarksByToken((prev) => {
      const updated = { ...prev };

      // if same bookmark exists -> remove it
      if (updated[token] === bookmarkType) {
        delete updated[token];
      } else {
        // otherwise set/update it
        updated[token] = bookmarkType;
      }

      return updated;
    });

    try {
      await saveBookmark({ token, bookmarkType });
    } catch (bookmarkError) {
      console.error("Bookmark save error:", bookmarkError);
      throw bookmarkError;
    }
  }, []);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

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
