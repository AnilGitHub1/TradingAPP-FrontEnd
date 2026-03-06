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
  const {
    stockData,
    linesData,
    addTrendline,
    editTrendlineByIndex,
    deleteTrendlineByIndex,
    getLinePoints,
  } = useStock();
  const { showTrendline, drawTrendlineMode, setShowTrendline } = useUI();

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const trendlineSeriesRef = useRef([]);
  const seriesIndexMapRef = useRef(new Map());

  const firstPointRef = useRef(null);
  const previewSeriesRef = useRef(null);
  const pendingSeriesRef = useRef(null);
  const pendingLineRef = useRef(null);
  const editingIndexRef = useRef(null);
  const hoveredLineIndexRef = useRef(null);

  const [menuState, setMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: "pending",
  });

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
    seriesIndexMapRef.current.clear();

    if ((!showTrendline && !drawTrendlineMode) || linesData.length === 0) return;

    linesData.forEach((line, index) => {
      const normalizedLine = getLinePoints(line)
        .map((point) => ({ time: point?.time, value: Number(point?.value) }))
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
      seriesIndexMapRef.current.set(series, index);
    });
  }, [showTrendline, drawTrendlineMode, linesData, getLinePoints]);

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
      const hoveredSeries = param?.hoveredSeries;
      if (hoveredSeries && seriesIndexMapRef.current.has(hoveredSeries)) {
        hoveredLineIndexRef.current = seriesIndexMapRef.current.get(hoveredSeries);
      } else {
        hoveredLineIndexRef.current = null;
      }

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
      createPendingSeries([startPoint, endPoint]);
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
      const rect = chartContainerRef.current.getBoundingClientRect();

      if (pendingLineRef.current) {
        event.preventDefault();
        setMenuState({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          type: "pending",
        });
        return;
      }

      if (hoveredLineIndexRef.current !== null) {
        event.preventDefault();
        setMenuState({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
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
  }, []);

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
    if (hoveredLineIndexRef.current === null) return;
    try {
      await deleteTrendlineByIndex(hoveredLineIndexRef.current);
      hoveredLineIndexRef.current = null;
      setMenuState((prev) => ({ ...prev, visible: false }));
    } catch (error) {
      console.error("Failed to delete trendline:", error);
    }
  };

  const handleEditHoveredLine = () => {
    if (hoveredLineIndexRef.current === null) return;
    editingIndexRef.current = hoveredLineIndexRef.current;
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
