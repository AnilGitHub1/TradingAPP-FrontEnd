import React from "react";
import { TimeFrame } from "./TimeFrame";
import { TIME_FRAMES } from "../../Constants/constants";

export default function TimeFrames() {
  return (
    <div className="timeframe-list" role="tablist" aria-label="Chart timeframes">
      {Object.keys(TIME_FRAMES).map((key) => {
        return (
          <TimeFrame
            key={key}
            timeFrame={key}
            displayTimeFrame={TIME_FRAMES[key]}
          />
        );
      })}
    </div>
  );
}
