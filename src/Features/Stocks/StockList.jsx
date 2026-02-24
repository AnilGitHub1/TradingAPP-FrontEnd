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
  const [divHeight, setDivHeight] = useState(window.innerHeight - 200);

  const [stockList, setStockList] = useState([]);
  useEffect(() => {
    const handleResize = () => {
      setDivHeight(window.innerHeight - 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const divStyle = {
    height: `${divHeight}px`,
    overflow: "auto",
  };

  const handleStockClick = (event) => {
    if (event.target.hasAttribute("data-stocktoken")) {
      setStockToken(event.target.getAttribute("data-stocktoken"));
      return;
    }
    setStockToken(
      event.target
        .querySelector("span[data-stocktoken]")
        .getAttribute("data-stocktoken"),
    );
  };

  const fetchStockList = async () => {
    try {
      const data = await getStockList(
        timeFrame,
        stockListCategory,
        stockListSort,
      );
      setStockList(data.tokensList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStockList();
  }, [timeFrame, stockListCategory, stockListSort]);

  return (
    <div>
      <StockListFilter />

      <div
        className="col stocklist"
        style={divStyle}
        onClick={(event) => {
          handleStockClick(event);
        }}
      >
        {stockList &&
          stockList.map((key) => {
            return (
              <div
                id={key}
                className={
                  key === stockToken
                    ? "row px-3 border border-primary"
                    : "row px-3"
                }
              >
                <div>
                  <div className="float-start">
                    <span className=" m-1" data-stocktoken={key}>
                      {stocksDict[key]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
