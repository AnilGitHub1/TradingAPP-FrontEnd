import React, { useEffect, useState } from "react";
import { useStock } from "../../Contexts/StockContext";
import { useUI } from "../../Contexts/UIContext";
import { stocksDict } from "../../Constants/constants";

export default function Search() {
  const { setStockToken } = useStock();
  const { setSearchActive } = useUI();
  const stocks = Object.values(stocksDict).sort();
  const keys = Object.keys(stocksDict);
  const [searchList, setSearchList] = useState([]);
  const [search, setSearch] = useState("");

  const handleOnChangeInput = (value) => {
    setSearch(value.toUpperCase());
    value !== "" ? filterSearchList(value) : getInitialList();
  };

  const handleOnClickSearchItem = (value) => {
    for (let i = 0; i <= stocks.length; i++) {
      if (stocksDict[keys[i]] === value) {
        setStockToken(keys[i]);
        setSearchActive(false);
        break;
      }
    }
  };

  const filterSearchList = (value) => {
    const filteredList = [];
    let count = 0;
    for (let i = 0; i < stocks.length; i++) {
      if (stocks[i].toLowerCase().includes(value.toLowerCase())) {
        filteredList.push(stocks[i]);
        count++;
      }
      if (count >= 10) {
        break;
      }
    }
    setSearchList(filteredList);
  };

  const getInitialList = () => {
    const filteredList = [];
    for (let i = 0; i < 10; i++) {
      filteredList.push(stocks[i]);
    }
    setSearchList(filteredList);
  };

  useEffect(() => {
    getInitialList();
  }, []);

  return (
    <div className="searchBoxActive p-0 m-0">
      <div className="search-box-title">Search Stock Symbol</div>
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Type stock name (e.g. RELIANCE, INFY)"
          value={search}
          onChange={(event) => handleOnChangeInput(event.target.value)}
        />
      </div>
      {searchList &&
        searchList.map((value) => {
          return (
            <p
              key={value}
              className="p-1 m-0 search-item"
              onClick={() => handleOnClickSearchItem(value)}
            >
              {value}
            </p>
          );
        })}
    </div>
  );
}
