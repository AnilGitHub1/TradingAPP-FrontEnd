import React, { useContext } from "react";
import { useStock } from "../../Contexts/StockContext";

export const TimeFrame = (props) => {
  const { setTimeFrame, timeFrame } = useStock();

  const handleOnCLickTimeFrame = (timeFrame) => {
    setTimeFrame(timeFrame);
  };
  return (
    <li
      className="nav-item px-1"
      onClick={() => handleOnCLickTimeFrame(props.timeFrame)}
    >
      <p
        className={
          timeFrame === props.timeFrame ? "bg-primary rounded p-1" : "p-1"
        }
      >
        {props.displayTimeFrame}
      </p>
    </li>
  );
};
