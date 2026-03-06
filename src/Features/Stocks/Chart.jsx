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
  const firstPointRef = useRef(null);
  const previewSeriesRef = useRef(null);
  const linesDataRef = useRef(linesData);

  const draggingRef = useRef({ active: false, lineIndex: null, endpointIndex: null });
  const [hoverState, setHoverState] = useState({ lineIndex: null, endpointIndex: null });

  const normalizeLinePoints = (line) =>
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

  const getChartPointFromPixel = (pixelPoint) => {
    if (!chartRef.current || !candleSeriesRef.current || !pixelPoint) return null;
    const time = chartRef.current.timeScale().coordinateToTime(pixelPoint.x);
    const value = candleSeriesRef.current.coordinateToPrice(pixelPoint.y);
    if (time === null || time === undefined || !Number.isFinite(value)) return null;
    return { time, value };
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

    let bestLineIndex = null;
    let bestLineDistance = Number.POSITIVE_INFINITY;
    let endpointLineIndex = null;
    let endpointIndex = null;
    let bestEndpointDistance = Number.POSITIVE_INFINITY;

    linesDataRef.current.forEach((line, index) => {
      const points = normalizeLinePoints(line);
      if (points.length < 2) return;

      const p1 = toScreenPoint(points[0]);
      const p2 = toScreenPoint(points[1]);
      if (!p1 || !p2) return;

      const d1 = Math.hypot(pixelPoint.x - p1.x, pixelPoint.y - p1.y);
      const d2 = Math.hypot(pixelPoint.x - p2.x, pixelPoint.y - p2.y);

      if (d1 < bestEndpointDistance) {
        bestEndpointDistance = d1;
        endpointLineIndex = index;
        endpointIndex = 0;
      }
      if (d2 < bestEndpointDistance) {
        bestEndpointDistance = d2;
        endpointLineIndex = index;
        endpointIndex = 1;
      }

      const lineDistance = distanceToSegment(pixelPoint.x, pixelPoint.y, p1.x, p1.y, p2.x, p2.y);
      if (lineDistance < bestLineDistance) {
        bestLineDistance = lineDistance;
        bestLineIndex = index;
      }
    });

    if (bestEndpointDistance <= ENDPOINT_HIT_DISTANCE) {
      return { lineIndex: endpointLineIndex, endpointIndex };
    }
    if (bestLineDistance <= LINE_HIT_DISTANCE) {
      return { lineIndex: bestLineIndex, endpointIndex: null };
    }
    return { lineIndex: null, endpointIndex: null };
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
      resetViewport(stockData.candleData.length);
    }
  }, [stockData.candleData]);

  useEffect(() => {
    if (!chartRef.current) return;

    trendlineSeriesRef.current.forEach((series) => chartRef.current.removeSeries(series));
    trendlineSeriesRef.current = [];

    if (!showTrendline || linesData.length === 0) return;

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
  }, [showTrendline, linesData, hoverState]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    const ensurePreviewSeries = () => {
      if (!chartRef.current || previewSeriesRef.current) return;
      previewSeriesRef.current = chartRef.current.addLineSeries({
        ...lineoptions,
        color: "rgba(255, 140, 0, 1)",
        lineWidth: 2,
      });
    };

    const clearPreview = () => {
      if (!chartRef.current || !previewSeriesRef.current) return;
      chartRef.current.removeSeries(previewSeriesRef.current);
      previewSeriesRef.current = null;
    };

    const handleCrosshairMove = (param) => {
      const pixelPoint = param?.point;

      if (draggingRef.current.active) {
        const updatedPoint = getChartPointFromPixel(pixelPoint);
        if (!updatedPoint) return;

        const { lineIndex, endpointIndex } = draggingRef.current;
        setLinesData((prev) => {
          if (!Number.isInteger(lineIndex) || !Number.isInteger(endpointIndex)) return prev;
          return prev.map((line, index) => {
            if (index !== lineIndex) return line;
            const points = normalizeLinePoints(line);
            if (points.length < 2) return line;
            const next = [...points];
            next[endpointIndex] = updatedPoint;
            return Array.isArray(line) ? next : { ...line, points: next };
          });
        });

        setHoverState({ lineIndex, endpointIndex });
        return;
      }

      setHoverState(getHitLine(pixelPoint));

      if (!drawTrendlineMode || !firstPointRef.current) return;
      const secondPoint = getChartPointFromPixel(pixelPoint);
      if (!secondPoint) return;
      ensurePreviewSeries();
      previewSeriesRef.current.setData([firstPointRef.current, secondPoint]);
    };

    const handleChartClick = async (param) => {
      if (!drawTrendlineMode) return;
      const clickedPoint = getChartPointFromPixel(param?.point);
      if (!clickedPoint) return;

      if (!firstPointRef.current) {
        firstPointRef.current = clickedPoint;
        ensurePreviewSeries();
        previewSeriesRef.current.setData([clickedPoint, clickedPoint]);
        return;
      }

      const startPoint = firstPointRef.current;
      const endPoint = clickedPoint;
      firstPointRef.current = null;
      clearPreview();

      try {
        await addTrendline({ startPoint, endPoint });
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
      if (!Number.isInteger(hit.lineIndex)) return;

      event.preventDefault();
      try {
        await deleteTrendlineByIndex(hit.lineIndex);
        setHoverState({ lineIndex: null, endpointIndex: null });
      } catch (error) {
        console.error("Failed to delete trendline:", error);
      }
    };

    chartContainerRef.current.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    chartContainerRef.current.addEventListener("contextmenu", handleContextMenu);

    return () => {
      chartContainerRef.current?.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      chartContainerRef.current?.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [deleteTrendlineByIndex, editTrendlineByIndex]);

  return <div id="chart-container" ref={chartContainerRef} className="chart-container" />;
}
