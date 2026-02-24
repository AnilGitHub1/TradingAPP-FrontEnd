import React, { createContext, useState, useEffect, useCallback } from "react";
import { getStockData } from "../Services/stockService";

export const StockContext = createContext();

export default function StockProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stockToken, setStockToken] = useState(474);
  const [timeFrame, setTimeFrame] = useState("ONE_HOUR");

  const [stockListCategory, setStockListCategory] = useState("all");
  const [stockListSort, setStockListSort] = useState("alphabets");

  const [stockData, setStockData] = useState({
    candleData: [],
    trendlineData: [],
  });

  const [linesData, setLinesData] = useState([]);
  const fetchStockData = useCallback(async () => {
    if (!stockToken || !timeFrame) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getStockData(stockToken, timeFrame);

      setStockData({
        candleData: response.stockData || [],
        trendlineData: response.trendlineData || [],
      });

      setLinesData(response.linesData || []);
    } catch (err) {
      console.error("Stock fetch error:", err);
      setError("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  }, [stockToken, timeFrame]);

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
        loading,
        error,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => React.useContext(StockContext);
