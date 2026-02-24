import React from "react";
import { useStock } from "../../Contexts/StockContext";

export const TimeFrame = (props) => {
  const { setTimeFrame, timeFrame } = useStock();

  const handleOnCLickTimeFrame = (selectedTimeFrame) => {
    setTimeFrame(selectedTimeFrame);
  };

  const isActive = timeFrame === props.timeFrame;

  return (
    <button
      type="button"
      className={isActive ? "timeframe-chip timeframe-chip--active" : "timeframe-chip"}
      onClick={() => handleOnCLickTimeFrame(props.timeFrame)}
    >
      {props.displayTimeFrame}
    </button>
  );
};
