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

export default function ChartComponent() {
  const { stockData, linesData, addTrendline } = useStock();
  const { showTrendline, drawTrendlineMode, setShowTrendline } = useUI();

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const trendlineSeriesRef = useRef([]);
  const firstPointRef = useRef(null);
  const previewSeriesRef = useRef(null);
  const pendingSeriesRef = useRef(null);
  const pendingLineRef = useRef(null);

  const [menuState, setMenuState] = useState({ visible: false, x: 0, y: 0 });

  const clearPreview = () => {
    if (!chartRef.current || !previewSeriesRef.current) return;
    chartRef.current.removeSeries(previewSeriesRef.current);
    previewSeriesRef.current = null;
  };

  const clearPending = () => {
    pendingLineRef.current = null;
    if (chartRef.current && pendingSeriesRef.current) {
      chartRef.current.removeSeries(pendingSeriesRef.current);
    }
    pendingSeriesRef.current = null;
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
      timeScale.applyOptions({
        rightOffset,
        barSpacing: 8,
      });
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

    linesData.forEach((line) => {
      if (!Array.isArray(line) || line.length < 2) return;

      const normalizedLine = line
        .map((point) => ({
          time: point?.time,
          value: Number(point?.value),
        }))
        .filter(
          (point) =>
            point.time !== undefined &&
            point.time !== null &&
            Number.isFinite(point.value),
        );

      if (normalizedLine.length < 2) return;

      const series = chartRef.current.addLineSeries(lineoptions);
      series.setData(normalizedLine);
      trendlineSeriesRef.current.push(series);
    });
  }, [showTrendline, drawTrendlineMode, linesData]);

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

    const createPendingSeries = (lineData) => {
      if (!chartRef.current) return;
      if (pendingSeriesRef.current) {
        chartRef.current.removeSeries(pendingSeriesRef.current);
      }
      pendingSeriesRef.current = chartRef.current.addLineSeries({
        ...lineoptions,
        color: "rgba(255, 140, 0, 1)",
        lineWidth: 2,
      });
      pendingSeriesRef.current.setData(lineData);
    };

    const getPointFromParam = (param) => {
      if (!param?.point || !chartRef.current || !candleSeriesRef.current) return null;

      const time = chartRef.current.timeScale().coordinateToTime(param.point.x);
      const value = candleSeriesRef.current.coordinateToPrice(param.point.y);

      if (time === null || time === undefined || !Number.isFinite(value)) return null;
      return { time, value };
    };

    const handleCrosshairMove = (param) => {
      if (!drawTrendlineMode || !firstPointRef.current) return;

      const secondPoint = getPointFromParam(param);
      if (!secondPoint) return;

      createPreviewSeriesIfNeeded();
      previewSeriesRef.current.setData([firstPointRef.current, secondPoint]);
    };

    const handleChartClick = (param) => {
      if (!drawTrendlineMode) return;

      setMenuState((prev) => ({ ...prev, visible: false }));
      const clickedPoint = getPointFromParam(param);
      if (!clickedPoint) return;

      if (!firstPointRef.current) {
        clearPending();
        pendingLineRef.current = null;

        firstPointRef.current = clickedPoint;
        createPreviewSeriesIfNeeded();
        previewSeriesRef.current.setData([clickedPoint, clickedPoint]);
        return;
      }

      const startPoint = firstPointRef.current;
      const endPoint = clickedPoint;

      firstPointRef.current = null;
      clearPreview();

      const pendingLine = [startPoint, endPoint];
      pendingLineRef.current = pendingLine;
      createPendingSeries(pendingLine);
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
  }, [drawTrendlineMode]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleContextMenu = (event) => {
      if (!pendingLineRef.current) return;
      event.preventDefault();

      const rect = chartContainerRef.current.getBoundingClientRect();
      setMenuState({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
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
  }, []);

  const handleSavePendingLine = async () => {
    if (!pendingLineRef.current || pendingLineRef.current.length < 2) return;

    const [startPoint, endPoint] = pendingLineRef.current;

    try {
      await addTrendline({ startPoint, endPoint });
      setShowTrendline(true);
      clearPending();
      setMenuState((prev) => ({ ...prev, visible: false }));
    } catch (error) {
      console.error("Failed to save trendline:", error);
    }
  };

  const handleDiscardPendingLine = () => {
    clearPending();
    setMenuState((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="chart-shell">
      <div id="chart-container" ref={chartContainerRef} className="chart-container" />

      {menuState.visible && (
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
    </div>
  );
}
