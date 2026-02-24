import { useStock } from "../../Contexts/StockContext";
import { useUI } from "../../Contexts/UIContext";
import TimeFrames from "../Chart/TimeFrames";
import { stocksDict } from "../../Constants/constants";

export default function StockBar() {
  const { stockToken } = useStock();
  const { setSearchActive, setTradeBoxActive } = useUI();

  const handleOnClickName = () => {
    setSearchActive(true);
  };

  const handleOnClickTrade = () => {
    setTradeBoxActive(true);
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

      <button
        type="button"
        className="btn btn-primary stock-toolbar__trade-btn"
        onClick={handleOnClickTrade}
      >
        Add Trade
      </button>
    </div>
  );
}
