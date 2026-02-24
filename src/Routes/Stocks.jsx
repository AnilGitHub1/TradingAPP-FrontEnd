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
    <div className=".container-fluid">
      {searchActive && <Screen />}
      <div className="container-fluid blur">
        {searchActive && <Search />}
        <div style={searchActive ? { filter: "blur(2px)" } : {}}>
          <div className="row">
            <StockBar />
          </div>
          <div className="row">
            <div className="col-10">
              <ChartComponent />
              {tradeBoxActive && <TradeBox />}
            </div>
            <div className="col-2">
              <StockList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
