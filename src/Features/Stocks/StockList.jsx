import { useState, useEffect } from "react";
import { getStockList } from "../../Services/stockService";
import { useStock } from "../../Contexts/StockContext";
import StockListFilter from "./StockListFilter";
import { stocksDict, BOOKMARK_FILTER_TO_COLOR, BOOKMARK_COLORS } from "../../Constants/constants";

export default function StockList() {
  const {
    setStockToken,
    stockToken,
    timeFrame,
    stockListCategory,
    stockListSort,
    bookmarksByToken,
    setBookmarkColor,
  } = useStock();

  const [stockList, setStockList] = useState([]);

  const selectedBookmarkFilter = BOOKMARK_FILTER_TO_COLOR[stockListCategory] || null;

  const handleStockClick = (token) => {
    setStockToken(token);
  };

  const fetchStockList = async () => {
    try {
      const apiCategory = selectedBookmarkFilter ? "all" : stockListCategory;
      const data = await getStockList(timeFrame, apiCategory, stockListSort);
      setStockList(data.tokensList || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmarkSelect = async (event, token, color) => {
    event.stopPropagation();
    try {
      await setBookmarkColor(token, color);
    } catch {
      // handled in context logs
    }
  };

  useEffect(() => {
    fetchStockList();
  }, [timeFrame, stockListCategory, stockListSort]);

  const visibleStockList = selectedBookmarkFilter
    ? stockList.filter((token) => bookmarksByToken[token] === selectedBookmarkFilter)
    : stockList;

  return (
    <div className="stocklist-shell">
      <StockListFilter />

      <div className="stocklist">
        {visibleStockList.map((key) => {
          const isActive = key === stockToken;
          const bookmarkColor = bookmarksByToken[key] || "transparent";

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
              <div className="stocklist-item__bookmark-wrap" onClick={(e) => e.stopPropagation()}>
                <span
                  className="stocklist-item__bookmark"
                  style={{ backgroundColor: bookmarkColor }}
                  title="Bookmark"
                />
                <div className="stocklist-item__bookmark-palette">
                  {BOOKMARK_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="stocklist-item__bookmark-color"
                      style={{ backgroundColor: color }}
                      onClick={(event) => handleBookmarkSelect(event, key, color)}
                      aria-label={`Set ${stocksDict[key]} bookmark to ${color}`}
                    />
                  ))}
                </div>
              </div>

              <span>{stocksDict[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
