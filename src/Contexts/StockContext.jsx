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

  const fetchStockData = useCallback(async () => {
    if (!stockToken || !timeFrame) return;

    try {
      setLoading(true);
      setError(null);

      const [stockResponse, trendlineResponse] = await Promise.all([
        getStockData(stockToken, timeFrame),
        getLinesData(stockToken, timeFrame),
      ]);

      setStockData({ candleData: stockResponse.stockData || [] });
      setLinesData(normalizeLinesPayload(trendlineResponse));
    } catch (err) {
      console.error("Stock fetch error:", err);
      setError("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  }, [stockToken, timeFrame]);

  const buildTrendlinePayload = (startPoint, endPoint) => ({
    token: stockToken,
    tf: TIME_FRAMES[timeFrame],
    startTime: startPoint.time,
    startValue: startPoint.value,
    endTime: endPoint.time,
    endValue: endPoint.value,
  });

  const addTrendline = useCallback(
    async ({ startPoint, endPoint }) => {
      if (!startPoint || !endPoint) return;

      const payload = buildTrendlinePayload(startPoint, endPoint);
      const optimisticLine = {
        id: `temp-${Date.now()}-${Math.random()}`,
        points: [startPoint, endPoint],
      };
      setLinesData((prev) => [...prev, optimisticLine]);

      try {
        const savedLine = await saveLineData(payload);
        const normalizedSaved = normalizeLinesPayload(savedLine);

        setLinesData((prev) => {
          const withoutOptimistic = prev.filter((line) => line !== optimisticLine);
          if (normalizedSaved.length > 0) {
            return [...withoutOptimistic, ...normalizedSaved];
          }
          if (savedLine && typeof savedLine === "object") {
            return [...withoutOptimistic, savedLine];
          }
          return [...withoutOptimistic, optimisticLine];
        });
      } catch (saveError) {
        setLinesData((prev) => prev.filter((line) => line !== optimisticLine));
        console.error("Trendline save error:", saveError);
        throw saveError;
      }

      return payload;
    },
    [stockToken, timeFrame],
  );

  const editTrendlineByIndex = useCallback(
    async (lineIndex, startPoint, endPoint) => {
      if (!Number.isInteger(lineIndex) || !startPoint || !endPoint) return;

      const payload = buildTrendlinePayload(startPoint, endPoint);
      const nextPoints = [startPoint, endPoint];

      setLinesData((prev) =>
        prev.map((line, index) =>
          index === lineIndex ? mergeLineWithPoints(line, nextPoints) : line,
        ),
      );

      const existingLine = linesData[lineIndex];
      const existingLineId = getLineId(existingLine);

      try {
        if (existingLineId) {
          await updateLineData(existingLineId, payload);
        } else {
          await saveLineData(payload);
        }
      } catch (updateError) {
        console.error("Trendline update error:", updateError);
        throw updateError;
      }
    },
    [linesData, stockToken, timeFrame],
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
        throw deleteError;
      }
    },
    [linesData],
  );

  const setBookmarkColor = useCallback(async (token, bookmarkType) => {
    if (!token || !bookmarkType) return;

    setBookmarksByToken((prev) => ({ ...prev, [token]: bookmarkType }));

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
