import { createChart } from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";
import { useStock } from "../../Contexts/StockContext";
import { useUI } from "../../Contexts/UIContext";
import {
  candleoptions,
  chartoptions,
  lineoptions,
  timeScaleOptions,
} from "../../Constants/constants";

const HOVER_DISTANCE_PX = 8;
const ENDPOINT_PICK_DISTANCE_PX = 12;

export default function ChartComponent() {
  const {
    stockData,
    linesData,
    addTrendline,
    editTrendlineByIndex,
    deleteTrendlineByIndex,
    getLinePoints,
  } = useStock();
  const { showTrendline, drawTrendlineMode, setShowTrendline, setDrawTrendlineMode } =
    useUI();

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const trendlineSeriesRef = useRef([]);

  const firstPointRef = useRef(null);
  const previewSeriesRef = useRef(null);
  const pendingSeriesRef = useRef(null);
  const pendingLineRef = useRef(null);
  const editingIndexRef = useRef(null);
  const movingEndpointRef = useRef(null);

  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);
  const [menuState, setMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: "pending",
  });

  const normalizeLineToPoints = (line) =>
    getLinePoints(line)
      .map((point) => ({ time: point?.time, value: Number(point?.value) }))
      .filter(
        (point) =>
          point.time !== undefined &&
          point.time !== null &&
          Number.isFinite(point.value),
      );

  const toScreenPoint = (point) => {
    if (!chartRef.current || !candleSeriesRef.current) return null;
    const x = chartRef.current.timeScale().timeToCoordinate(point.time);
    const y = candleSeriesRef.current.priceToCoordinate(point.value);
    if (x === null || y === null || x === undefined || y === undefined) return null;
    return { x, y };
  };

  const pointToSegmentDistance = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  };

  const findNearestLineIndex = (point) => {
    if (!point) return null;

    let bestIndex = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    linesData.forEach((line, index) => {
      const points = normalizeLineToPoints(line);
      if (points.length < 2) return;

      const s1 = toScreenPoint(points[0]);
      const s2 = toScreenPoint(points[1]);
      if (!s1 || !s2) return;

      const distance = pointToSegmentDistance(point.x, point.y, s1.x, s1.y, s2.x, s2.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestDistance <= HOVER_DISTANCE_PX ? bestIndex : null;
  };

  const clearPreview = () => {
    if (!chartRef.current || !previewSeriesRef.current) return;
    chartRef.current.removeSeries(previewSeriesRef.current);
    previewSeriesRef.current = null;
  };

  const clearPending = () => {
    pendingLineRef.current = null;
    movingEndpointRef.current = null;
    if (chartRef.current && pendingSeriesRef.current) {
      chartRef.current.removeSeries(pendingSeriesRef.current);
    }
    pendingSeriesRef.current = null;
  };

  const drawPendingLine = () => {
    if (!chartRef.current || !pendingLineRef.current) return;

    if (!pendingSeriesRef.current) {
      pendingSeriesRef.current = chartRef.current.addLineSeries({
        ...lineoptions,
        color: "rgba(255, 140, 0, 1)",
        lineWidth: 2,
      });
    }

    pendingSeriesRef.current.setData(pendingLineRef.current);
    pendingSeriesRef.current.setMarkers(
      pendingLineRef.current.map((point) => ({
        time: point.time,
        position: "inBar",
        color: "rgba(255, 140, 0, 1)",
        shape: "circle",
        text: "",
      })),
    );
  };

  const resetViewport = (candleCount) => {
    if (!chartRef.current || !candleSeriesRef.current || candleCount === 0) return;

    const timeScale = chartRef.current.timeScale();
    const rightOffset = 8;
    const visibleBars = Math.min(300, Math.max(60, candleCount));
    const from = Math.max(0, candleCount - visibleBars);
    const to = candleCount - 1 + rightOffset;

    chartRef.current.priceScale("right").applyOptions({ autoScale: true });

    requestAnimationFrame(() => {
      timeScale.applyOptions({ rightOffset, barSpacing: 8 });
      timeScale.setVisibleLogicalRange({ from, to });
    });
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      ...chartoptions,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chart.timeScale().applyOptions(timeScaleOptions);

    const candleSeries = chart.addCandlestickSeries(candleoptions);
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (candleSeriesRef.current && stockData.candleData.length > 0) {
      candleSeriesRef.current.setData(stockData.candleData);
      resetViewport(stockData.candleData.length);
    }
  }, [stockData.candleData]);

  useEffect(() => {
    if (!chartRef.current) return;

    trendlineSeriesRef.current.forEach((series) => {
      chartRef.current.removeSeries(series);
    });
    trendlineSeriesRef.current = [];

    if ((!showTrendline && !drawTrendlineMode) || linesData.length === 0) return;

    linesData.forEach((line, index) => {
      const normalizedLine = normalizeLineToPoints(line);
      if (normalizedLine.length < 2) return;

      const series = chartRef.current.addLineSeries(lineoptions);
      series.setData(normalizedLine);

      if (index === hoveredLineIndex) {
        series.setMarkers(
          normalizedLine.map((point) => ({
            time: point.time,
            position: "inBar",
            color: "rgba(37, 99, 235, 1)",
            shape: "circle",
            text: "",
          })),
        );
      }

      trendlineSeriesRef.current.push(series);
    });
  }, [showTrendline, drawTrendlineMode, linesData, hoveredLineIndex]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    const createPreviewSeriesIfNeeded = () => {
      if (!chartRef.current || previewSeriesRef.current) return;
      previewSeriesRef.current = chartRef.current.addLineSeries({
        ...lineoptions,
        color: "rgba(255, 140, 0, 1)",
        lineWidth: 2,
      });
    };

    const getPointFromParam = (param) => {
      if (!param?.point || !chartRef.current || !candleSeriesRef.current) return null;
      const time = chartRef.current.timeScale().coordinateToTime(param.point.x);
      const value = candleSeriesRef.current.coordinateToPrice(param.point.y);
      if (time === null || time === undefined || !Number.isFinite(value)) return null;
      return { time, value };
    };

    const tryPickEditableEndpoint = (mousePoint) => {
      if (!pendingLineRef.current || pendingLineRef.current.length < 2) return false;
      const [startPoint, endPoint] = pendingLineRef.current;
      const s1 = toScreenPoint(startPoint);
      const s2 = toScreenPoint(endPoint);
      if (!s1 || !s2) return false;

      const d1 = Math.hypot(mousePoint.x - s1.x, mousePoint.y - s1.y);
      const d2 = Math.hypot(mousePoint.x - s2.x, mousePoint.y - s2.y);

      const minDistance = Math.min(d1, d2);
      if (minDistance > ENDPOINT_PICK_DISTANCE_PX) return false;

      movingEndpointRef.current = d1 <= d2 ? 0 : 1;
      return true;
    };

    const handleCrosshairMove = (param) => {
      if (param?.point) {
        setHoveredLineIndex(findNearestLineIndex(param.point));
      } else {
        setHoveredLineIndex(null);
      }

      if (!drawTrendlineMode || !firstPointRef.current) return;
      const secondPoint = getPointFromParam(param);
      if (!secondPoint) return;

      createPreviewSeriesIfNeeded();
      previewSeriesRef.current.setData([firstPointRef.current, secondPoint]);
    };

    const handleChartClick = (param) => {
      const canDrawOrEdit = drawTrendlineMode || editingIndexRef.current !== null;
      if (!canDrawOrEdit) return;

      setMenuState((prev) => ({ ...prev, visible: false }));
      const clickedPoint = getPointFromParam(param);
      if (!clickedPoint || !param?.point) return;

      if (editingIndexRef.current !== null && pendingLineRef.current) {
        if (movingEndpointRef.current === null) {
          tryPickEditableEndpoint(param.point);
          return;
        }

        const updated = [...pendingLineRef.current];
        updated[movingEndpointRef.current] = clickedPoint;
        pendingLineRef.current = updated;
        movingEndpointRef.current = null;
        drawPendingLine();
        return;
      }

      if (!firstPointRef.current) {
        clearPending();
        firstPointRef.current = clickedPoint;
        createPreviewSeriesIfNeeded();
        previewSeriesRef.current.setData([clickedPoint, clickedPoint]);
        return;
      }

      const startPoint = firstPointRef.current;
      const endPoint = clickedPoint;

      firstPointRef.current = null;
      clearPreview();

      pendingLineRef.current = [startPoint, endPoint];
      drawPendingLine();
    };

    chartRef.current.subscribeCrosshairMove(handleCrosshairMove);
    chartRef.current.subscribeClick(handleChartClick);

    return () => {
      firstPointRef.current = null;
      clearPreview();
      clearPending();
      if (!chartRef.current) return;
      chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
      chartRef.current.unsubscribeClick(handleChartClick);
    };
  }, [drawTrendlineMode, linesData]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleContextMenu = (event) => {
      const rect = chartContainerRef.current.getBoundingClientRect();
      const localPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      if (pendingLineRef.current) {
        event.preventDefault();
        setMenuState({
          visible: true,
          x: localPoint.x,
          y: localPoint.y,
          type: "pending",
        });
        return;
      }

      const nearestIndex = findNearestLineIndex(localPoint);
      if (nearestIndex !== null) {
        event.preventDefault();
        setHoveredLineIndex(nearestIndex);
        setMenuState({
          visible: true,
          x: localPoint.x,
          y: localPoint.y,
          type: "saved",
        });
      }
    };

    const handleOutsideClick = () => {
      setMenuState((prev) => ({ ...prev, visible: false }));
    };

    chartContainerRef.current.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", handleOutsideClick);

    return () => {
      chartContainerRef.current?.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [linesData]);

  const handleSavePendingLine = async () => {
    if (!pendingLineRef.current || pendingLineRef.current.length < 2) return;
    const [startPoint, endPoint] = pendingLineRef.current;

    try {
      if (editingIndexRef.current !== null) {
        await editTrendlineByIndex(editingIndexRef.current, startPoint, endPoint);
        editingIndexRef.current = null;
      } else {
        await addTrendline({ startPoint, endPoint });
      }

      setShowTrendline(true);
      clearPending();
      setMenuState((prev) => ({ ...prev, visible: false }));
      setDrawTrendlineMode(false);
    } catch (error) {
      console.error("Failed to save trendline:", error);
    }
  };

  const handleDiscardPendingLine = () => {
    clearPending();
    editingIndexRef.current = null;
    setMenuState((prev) => ({ ...prev, visible: false }));
  };

  const handleDeleteHoveredLine = async () => {
    if (hoveredLineIndex === null) return;
    try {
      await deleteTrendlineByIndex(hoveredLineIndex);
      setHoveredLineIndex(null);
      setMenuState((prev) => ({ ...prev, visible: false }));
    } catch (error) {
      console.error("Failed to delete trendline:", error);
    }
  };

  const handleEditHoveredLine = () => {
    if (hoveredLineIndex === null) return;

    const targetLine = linesData[hoveredLineIndex];
    const points = normalizeLineToPoints(targetLine);
    if (points.length < 2) return;

    editingIndexRef.current = hoveredLineIndex;
    pendingLineRef.current = [points[0], points[1]];
    drawPendingLine();

    setMenuState((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="chart-shell">
      <div id="chart-container" ref={chartContainerRef} className="chart-container" />

      {menuState.visible && menuState.type === "pending" && (
        <div
          className="trendline-context-menu"
          style={{ left: `${menuState.x}px`, top: `${menuState.y}px` }}
        >
          <button type="button" onClick={handleSavePendingLine}>
            Save trendline
          </button>
          <button type="button" onClick={handleDiscardPendingLine}>
            Discard
          </button>
        </div>
      )}

      {menuState.visible && menuState.type === "saved" && (
        <div
          className="trendline-context-menu"
          style={{ left: `${menuState.x}px`, top: `${menuState.y}px` }}
        >
          <button type="button" onClick={handleEditHoveredLine}>
            Edit line
          </button>
          <button type="button" onClick={handleDeleteHoveredLine}>
            Delete line
          </button>
        </div>
      )}
    </div>
  );
}
