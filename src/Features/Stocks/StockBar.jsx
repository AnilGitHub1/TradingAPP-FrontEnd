import { useStock } from "../../Contexts/StockContext";
import { useUI } from "../../Contexts/UIContext";
import TimeFrames from "../Chart/TimeFrames";
import { stocksDict } from "../../Constants/constants";

export default function StockBar() {
  const { stockToken } = useStock();
  const { setSearchActive, setTradeBoxActive, showTrendline, setShowTrendline } =
    useUI();

  const handleOnClickName = () => {
    setSearchActive(true);
  };

  const handleOnClickTrade = () => {
    setTradeBoxActive(true);
  };

  const handleToggleTrendline = () => {
    setShowTrendline((prev) => !prev);
  };

  return (
    <div className="stock-toolbar">
      <div className="stock-toolbar__left">
        <button
          type="button"
          className="stock-symbol-button"
          onClick={handleOnClickName}
        >
          <span className="stock-symbol-button__label">Search / Change Symbol</span>
          <span className="stock-symbol-button__value">{stocksDict[stockToken]}</span>
        </button>

        <TimeFrames />
      </div>

      <div className="stock-toolbar__actions">
        <button
          type="button"
          className={
            showTrendline
              ? "btn btn-outline-primary stock-toolbar__trend-btn stock-toolbar__trend-btn--active"
              : "btn btn-outline-secondary stock-toolbar__trend-btn"
          }
          onClick={handleToggleTrendline}
        >
          {showTrendline ? "Hide Trendlines" : "Show Trendlines"}
        </button>

        <button
          type="button"
          className="btn btn-primary stock-toolbar__trade-btn"
          onClick={handleOnClickTrade}
        >
          Add Trade
        </button>
      </div>
    </div>
  );
}
