import React, { createContext, useState } from "react";

export const UIContext = createContext();

export default function UIProvider({ children }) {
  const [searchActive, setSearchActive] = useState(false);
  const [tradeBoxActive, setTradeBoxActive] = useState(false);
  const [showTrendline, setShowTrendline] = useState(false);

  return (
    <UIContext.Provider
      value={{
        searchActive,
        setSearchActive,
        tradeBoxActive,
        setTradeBoxActive,
        showTrendline,
        setShowTrendline,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
import { useContext } from "react";

export const useUI = () => useContext(UIContext);
