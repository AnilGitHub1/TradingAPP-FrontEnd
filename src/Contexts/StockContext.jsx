import React, { createContext, useState, useEffect, useCallback } from "react";
import { getStockData, getLinesData, saveLineData } from "../Services/stockService";
import { TIME_FRAMES } from "../Constants/constants";

export const StockContext = createContext();

export default function StockProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stockToken, setStockToken] = useState(474);
  const [timeFrame, setTimeFrame] = useState("ONE_HOUR");

  const [stockListCategory, setStockListCategory] = useState("n50");
  const [stockListSort, setStockListSort] = useState("alphabetic");

  const [stockData, setStockData] = useState({
    candleData: [],
  });

  const [linesData, setLinesData] = useState([]);

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
      setStockData({
        candleData: stockResponse.stockData || [],
      });

      setLinesData(normalizeLinesPayload(trendlineResponse));
    } catch (err) {
      console.error("Stock fetch error:", err);
      setError("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  }, [stockToken, timeFrame]);

  const addTrendline = useCallback(
    async ({ startPoint, endPoint }) => {
      if (!startPoint || !endPoint) return;

      const payload = {
        token: stockToken,
        tf: TIME_FRAMES[timeFrame],
        startTime: startPoint.time,
        startValue: startPoint.value,
        endTime: endPoint.time,
        endValue: endPoint.value,
      };

      // Optimistic update so the newly drawn line remains visible immediately.
      setLinesData((prev) => [...prev, [startPoint, endPoint]]);

      try {
        await saveLineData(payload);
      } catch (saveError) {
        console.error("Trendline save error:", saveError);
        throw saveError;
      }

      return payload;
    },
    [stockToken, timeFrame],
  );

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
        loading,
        error,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => React.useContext(StockContext);
