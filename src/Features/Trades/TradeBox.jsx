import React, { useRef, useState } from "react";
import TradeForm from "./TradeForm";

const TradeBox = () => {
  const [position, setPosition] = useState({ x: 200, y: 100 });
  const childRef = useRef(null);

  const handleMouseDown = (event) => {
    const initialX = event.clientX;
    const initialY = event.clientY;

    const initialPosition = { x: position.x, y: position.y };

    const handleMouseMove = (event) => {
      const deltaX = event.clientX - initialX;
      const deltaY = event.clientY - initialY;

      setPosition({
        x: initialPosition.x + deltaX,
        y: initialPosition.y + deltaY,
      });
    };

    document.addEventListener("mousemove", handleMouseMove);

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };

    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleOnClickDeleteTradeBox = () => {
    childRef.current.removeTradeBox(true);
  };

  return (
    <div
      className="trade-box-active border border-primary rounded bg-white"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        cursor: "move",
      }}
    >
      <div className="container p-3 rounded">
        <div>
          <span>
            <h2 onMouseDown={handleMouseDown}>Trade Parameters</h2>
          </span>
          <span>
            <i
              class="fa-solid fa-xmark"
              onClick={() => handleOnClickDeleteTradeBox()}
            ></i>
          </span>
        </div>
        <TradeForm ref={childRef} />
      </div>
    </div>
  );
};

export default TradeBox;
