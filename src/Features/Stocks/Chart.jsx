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

const LINE_HIT_DISTANCE = 8;
const ENDPOINT_HIT_DISTANCE = 12;

const sortByTime = (points) => {
  if (!Array.isArray(points)) return [];
  return [...points].sort((a, b) => {
    const at = typeof a.time === "number" ? a.time : Number(a.time);
    const bt = typeof b.time === "number" ? b.time : Number(b.time);
    if (Number.isNaN(at) || Number.isNaN(bt)) return 0;
    return at - bt;
  });
};

export default function ChartComponent() {
  const {
    stockData,
    linesData,
    setLinesData,
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
  const previewSeriesRef = useRef(null);
  const firstPointRef = useRef(null);
  const linesDataRef = useRef(linesData);
  const draggingRef = useRef({ active: false, lineIndex: null, endpointIndex: null });
  const candleRangeRef = useRef({ minTime: null, maxTime: null, minPrice: null, maxPrice: null });

  const [hoverState, setHoverState] = useState({ lineIndex: null, endpointIndex: null });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, lineIndex: null });

  const normalizeLinePoints = (line) =>
    sortByTime(
      getLinePoints(line)
        .map((point) => ({ time: point?.time, value: Number(point?.value) }))
        .filter(
          (point) =>
            point.time !== undefined &&
            point.time !== null &&
            Number.isFinite(point.value),
        ),
    );

  const toScreenPoint = (point) => {
    if (!chartRef.current || !candleSeriesRef.current) return null;
    const x = chartRef.current.timeScale().timeToCoordinate(point.time);
    const y = candleSeriesRef.current.priceToCoordinate(point.value);
    if (x === null || y === null || x === undefined || y === undefined) return null;
    return { x, y };
  };

  const getChartPointFromPixel = (pixelPoint) => {
    if (!chartRef.current || !candleSeriesRef.current || !pixelPoint) return null;
    const time = chartRef.current.timeScale().coordinateToTime(pixelPoint.x);
    const value = candleSeriesRef.current.coordinateToPrice(pixelPoint.y);
    if (time === null || time === undefined || !Number.isFinite(value)) return null;
    return { time, value };
  };

  const clampPointToCandleRange = (point) => {
    if (!point) return null;

    const { minTime, maxTime, minPrice, maxPrice } = candleRangeRef.current;
    const next = { ...point };

    if (Number.isFinite(minTime) && Number.isFinite(maxTime)) {
      next.time = Math.max(minTime, Math.min(maxTime, Number(point.time)));
    }

    if (Number.isFinite(minPrice) && Number.isFinite(maxPrice)) {
      next.value = Math.max(minPrice, Math.min(maxPrice, Number(point.value)));
    }

    return next;
  };

  const distanceToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  };

  const getHitLine = (pixelPoint) => {
    if (!pixelPoint) return { lineIndex: null, endpointIndex: null };

    let nearestLineIndex = null;
    let nearestLineDistance = Number.POSITIVE_INFINITY;
    let nearestEndpointLineIndex = null;
    let nearestEndpointIndex = null;
    let nearestEndpointDistance = Number.POSITIVE_INFINITY;

    linesDataRef.current.forEach((line, index) => {
      const points = normalizeLinePoints(line);
      if (points.length < 2) return;

      const p1 = toScreenPoint(points[0]);
      const p2 = toScreenPoint(points[1]);
      if (!p1 || !p2) return;

      const d1 = Math.hypot(pixelPoint.x - p1.x, pixelPoint.y - p1.y);
      const d2 = Math.hypot(pixelPoint.x - p2.x, pixelPoint.y - p2.y);

      if (d1 < nearestEndpointDistance) {
        nearestEndpointDistance = d1;
        nearestEndpointLineIndex = index;
        nearestEndpointIndex = 0;
      }

      if (d2 < nearestEndpointDistance) {
        nearestEndpointDistance = d2;
        nearestEndpointLineIndex = index;
        nearestEndpointIndex = 1;
      }

      const lineDistance = distanceToSegment(pixelPoint.x, pixelPoint.y, p1.x, p1.y, p2.x, p2.y);
      if (lineDistance < nearestLineDistance) {
        nearestLineDistance = lineDistance;
        nearestLineIndex = index;
      }
    });

    if (nearestEndpointDistance <= ENDPOINT_HIT_DISTANCE) {
      return { lineIndex: nearestEndpointLineIndex, endpointIndex: nearestEndpointIndex };
    }

    if (nearestLineDistance <= LINE_HIT_DISTANCE) {
      return { lineIndex: nearestLineIndex, endpointIndex: null };
    }

    return { lineIndex: null, endpointIndex: null };
  };

  const updateHoverState = (next) => {
    setHoverState((prev) => {
      if (
        prev.lineIndex === next.lineIndex &&
        prev.endpointIndex === next.endpointIndex
      ) {
        return prev;
      }
      return next;
    });
  };

  const clearPreview = () => {
    if (!chartRef.current || !previewSeriesRef.current) return;
    chartRef.current.removeSeries(previewSeriesRef.current);
    previewSeriesRef.current = null;
  };

  const ensurePreviewSeries = () => {
    if (!chartRef.current || previewSeriesRef.current) return;
    previewSeriesRef.current = chartRef.current.addLineSeries({
      ...lineoptions,
      color: "rgba(255, 140, 0, 1)",
      lineWidth: 2,
    });
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
    linesDataRef.current = linesData;
  }, [linesData]);

  useEffect(() => {
    if (candleSeriesRef.current && stockData.candleData.length > 0) {
      candleSeriesRef.current.setData(stockData.candleData);

      const times = stockData.candleData
        .map((candle) => Number(candle.time))
        .filter((time) => Number.isFinite(time));
      const lows = stockData.candleData
        .map((candle) => Number(candle.low))
        .filter((value) => Number.isFinite(value));
      const highs = stockData.candleData
        .map((candle) => Number(candle.high))
        .filter((value) => Number.isFinite(value));

      const minPrice = lows.length > 0 ? Math.min(...lows) : null;
      const maxPrice = highs.length > 0 ? Math.max(...highs) : null;
      const padding =
        Number.isFinite(minPrice) && Number.isFinite(maxPrice)
          ? (maxPrice - minPrice || maxPrice || 1) * 0.25
          : 0;

      candleRangeRef.current = {
        minTime: times.length > 0 ? Math.min(...times) : null,
        maxTime: times.length > 0 ? Math.max(...times) : null,
        minPrice: Number.isFinite(minPrice) ? minPrice - padding : null,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice + padding : null,
      };

      resetViewport(stockData.candleData.length);
    }
  }, [stockData.candleData]);

  useEffect(() => {
    if (!chartRef.current) return;

    trendlineSeriesRef.current.forEach((series) => chartRef.current.removeSeries(series));
    trendlineSeriesRef.current = [];

    if ((!showTrendline && !drawTrendlineMode) || linesData.length === 0) return;

    linesData.forEach((line, index) => {
      const points = normalizeLinePoints(line);
      if (points.length < 2) return;

      const series = chartRef.current.addLineSeries(lineoptions);
      series.setData(points);

      if (hoverState.lineIndex === index) {
        series.setMarkers(
          points.map((point, endpointIndex) => ({
            time: point.time,
            position: "inBar",
            color:
              hoverState.endpointIndex === null || hoverState.endpointIndex === endpointIndex
                ? "rgba(37, 99, 235, 1)"
                : "rgba(99, 102, 241, 0.7)",
            shape: "circle",
            text: "",
          })),
        );
      }

      trendlineSeriesRef.current.push(series);
    });
  }, [showTrendline, drawTrendlineMode, linesData, hoverState]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    const handleCrosshairMove = (param) => {
      const pixelPoint = param?.point;

      if (draggingRef.current.active) {
        const updatedPoint = getChartPointFromPixel(pixelPoint);
        if (!updatedPoint) return;

        const { lineIndex, endpointIndex } = draggingRef.current;

        setLinesData((prev) =>
          prev.map((line, index) => {
            if (index !== lineIndex) return line;

            const points = normalizeLinePoints(line);
            if (points.length < 2) return line;

            const next = [...points];
            const clampedPoint = clampPointToCandleRange(updatedPoint);

            if (!clampedPoint) return line;

            const otherPoint = next[endpointIndex === 0 ? 1 : 0];
            const adjustedPoint = { ...clampedPoint };

            if (endpointIndex === 0) {
              adjustedPoint.time = Math.min(adjustedPoint.time, Number(otherPoint.time) - 1);
            } else {
              adjustedPoint.time = Math.max(adjustedPoint.time, Number(otherPoint.time) + 1);
            }

            next[endpointIndex] = adjustedPoint;
            const sorted = sortByTime(next);
            return Array.isArray(line) ? sorted : { ...line, points: sorted };
          }),
        );

        updateHoverState({ lineIndex, endpointIndex: null });
        return;
      }

      updateHoverState(getHitLine(pixelPoint));

      if (!drawTrendlineMode || !firstPointRef.current) return;

      const secondPoint = getChartPointFromPixel(pixelPoint);
      if (!secondPoint) return;

      ensurePreviewSeries();
      previewSeriesRef.current.setData(sortByTime([firstPointRef.current, secondPoint]));
    };

    const handleChartClick = async (param) => {
      if (!drawTrendlineMode) return;

      const clickedPoint = getChartPointFromPixel(param?.point);
      if (!clickedPoint) return;

      const clampedClickedPoint = clampPointToCandleRange(clickedPoint);
      if (!clampedClickedPoint) return;

      if (!firstPointRef.current) {
        firstPointRef.current = clampedClickedPoint;
        ensurePreviewSeries();
        previewSeriesRef.current.setData([clampedClickedPoint, clampedClickedPoint]);
        return;
      }

      const linePoints = sortByTime([firstPointRef.current, clampedClickedPoint]);
      firstPointRef.current = null;
      clearPreview();

      try {
        await addTrendline({ startPoint: linePoints[0], endPoint: linePoints[1] });
        setShowTrendline(true);
        setDrawTrendlineMode(false);
      } catch (error) {
        console.error("Failed to save trendline:", error);
      }
    };

    chartRef.current.subscribeCrosshairMove(handleCrosshairMove);
    chartRef.current.subscribeClick(handleChartClick);

    return () => {
      firstPointRef.current = null;
      clearPreview();
      if (!chartRef.current) return;
      chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
      chartRef.current.unsubscribeClick(handleChartClick);
    };
  }, [drawTrendlineMode, addTrendline, setLinesData, setShowTrendline, setDrawTrendlineMode]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handlePointerDown = (event) => {
      const rect = chartContainerRef.current.getBoundingClientRect();
      const localPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const hit = getHitLine(localPoint);

      if (Number.isInteger(hit.lineIndex) && Number.isInteger(hit.endpointIndex)) {
        draggingRef.current = {
          active: true,
          lineIndex: hit.lineIndex,
          endpointIndex: hit.endpointIndex,
        };
      }
    };

    const handlePointerUp = async () => {
      if (!draggingRef.current.active) return;

      const { lineIndex } = draggingRef.current;
      draggingRef.current = { active: false, lineIndex: null, endpointIndex: null };

      const line = linesDataRef.current[lineIndex];
      const points = normalizeLinePoints(line);
      if (points.length < 2) return;

      try {
        await editTrendlineByIndex(lineIndex, points[0], points[1]);
      } catch (error) {
        console.error("Failed to update trendline:", error);
      }
    };

    const handleContextMenu = async (event) => {
      const rect = chartContainerRef.current.getBoundingClientRect();
      const localPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const hit = getHitLine(localPoint);
      if (!Number.isInteger(hit.lineIndex)) {
        setContextMenu({ visible: false, x: 0, y: 0, lineIndex: null });
        return;
      }

      event.preventDefault();
      setContextMenu({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        lineIndex: hit.lineIndex,
      });
    };

    const handlePointerDownOutsideContextMenu = () => {
      setContextMenu({ visible: false, x: 0, y: 0, lineIndex: null });
    };

    chartContainerRef.current.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    chartContainerRef.current.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("pointerdown", handlePointerDownOutsideContextMenu);

    return () => {
      chartContainerRef.current?.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      chartContainerRef.current?.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("pointerdown", handlePointerDownOutsideContextMenu);
    };
  }, [deleteTrendlineByIndex, editTrendlineByIndex]);

  const handleDeleteFromContextMenu = async () => {
    if (!Number.isInteger(contextMenu.lineIndex)) return;

    try {
      await deleteTrendlineByIndex(contextMenu.lineIndex);
      updateHoverState({ lineIndex: null, endpointIndex: null });
    } catch (error) {
      console.error("Failed to delete trendline:", error);
    } finally {
      setContextMenu({ visible: false, x: 0, y: 0, lineIndex: null });
    }
  };

  return (
    <div id="chart-container" ref={chartContainerRef} className="chart-container">
      {contextMenu.visible ? (
        <div
          className="trendline-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={handleDeleteFromContextMenu}>
            Delete trendline
          </button>
        </div>
      ) : null}
    </div>
  );
}
