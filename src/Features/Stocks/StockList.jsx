import { useState, useEffect } from "react";
import { getStockList } from "../../Services/stockService";
import { useStock } from "../../Contexts/StockContext";
import StockListFilter from "./StockListFilter";
import { stocksDict } from "../../Constants/constants";

export default function StockList() {
  const {
    setStockToken,
    stockToken,
    timeFrame,
    stockListCategory,
    stockListSort,
  } = useStock();

  const [stockList, setStockList] = useState([]);

  const handleStockClick = (token) => {
    setStockToken(token);
  };

  const fetchStockList = async () => {
    try {
      const data = await getStockList(
        timeFrame,
        stockListCategory,
        stockListSort,
      );
      setStockList(data.tokensList || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStockList();
  }, [timeFrame, stockListCategory, stockListSort]);

  return (
    <div className="stocklist-shell">
      <StockListFilter />

      <div className="stocklist">
        {stockList.map((key) => {
          const isActive = key === stockToken;

          return (
            <button
              type="button"
              key={key}
              id={key}
              className={
                isActive
                  ? "stocklist-item stocklist-item--active"
                  : "stocklist-item"
              }
              onClick={() => handleStockClick(key)}
            >
              <span>{stocksDict[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
