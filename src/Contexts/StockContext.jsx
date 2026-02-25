import React, { createContext, useState, useEffect, useCallback } from "react";
import { getStockData, getLinesData } from "../Services/stockService";

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

      setLinesData(trendlineResponse.trendlineData || []);
    } catch (err) {
      console.error("Stock fetch error:", err);
      setError("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  }, [stockToken, timeFrame]);

  const fetchLineData = useCallback(async () => {
    if (!stockToken || !timeFrame) return;
    try {
      setLoading(true);
      setError(null);

      const [stockResponse, trendlineResponse] = await Promise.all([
        getStockData(stockToken, timeFrame),
        getLinesData(stockToken, timeFrame),
      ]);
      // console.log(trendlineResponse);
      setLinesData(trendlineResponse.linesData || []);
    } catch (err) {
      console.error("lines fetch error:", err);
      setError("Failed to fetch trendlines data");
    } finally {
      setLoading(false);
    }
  }, [stockToken, timeFrame]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  useEffect(() => {
    fetchLineData();
  }, [fetchLineData]);

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
