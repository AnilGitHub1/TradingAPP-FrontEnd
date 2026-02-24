import React, { createContext, useState } from "react";

export const UIContext = createContext();

export default function UIProvider({ children }) {
  const [searchActive, setSearchActive] = useState(false);
  const [tradeBoxActive, setTradeBoxActive] = useState(false);
  const [showTrendline, setShowTrendline] = useState(true);
  const [linesData, setLinesData] = useState("");

  return (
    <UIContext.Provider
      value={{
        searchActive,
        setSearchActive,
        tradeBoxActive,
        setTradeBoxActive,
        showTrendline,
        setShowTrendline,
        linesData,
        setLinesData,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
import { useContext } from "react";

export const useUI = () => useContext(UIContext);
