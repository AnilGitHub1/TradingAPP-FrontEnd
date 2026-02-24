import StockBar from "../Features/Stocks/StockBar";
import ChartComponent from "../Features/Stocks/Chart";
import StockList from "../Features/Stocks/StockList";
import Search from "../Features/Stocks/Search";
import Screen from "../Components/Layout/Screen";
import { useUI } from "../Contexts/UIContext";
import TradeBox from "../Features/Trades/TradeBox";

export default function Stocks() {
  const { searchActive, tradeBoxActive } = useUI();

  return (
    <div className="stocks-page container-fluid">
      {searchActive && <Screen />}
      {searchActive && <Search />}

      <div style={searchActive ? { filter: "blur(2px)" } : {}}>
        <div className="row g-0">
          <div className="col">
            <StockBar />
          </div>
        </div>

        <div className="row g-0 stocks-content-row">
          <div className="col-10 chart-panel">
            <ChartComponent />
            {tradeBoxActive && <TradeBox />}
          </div>

          <div className="col-2 stocklist-panel">
            <StockList />
          </div>
        </div>
      </div>
    </div>
  );
}
