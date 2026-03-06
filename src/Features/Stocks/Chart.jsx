import { createChart } from "lightweight-charts";
import React, { useEffect, useRef } from "react";
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

  const resetViewport = (candleCount) => {
    if (!chartRef.current || !candleSeriesRef.current || candleCount === 0)
      return;

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

    const containerHeight = chartContainerRef.current.clientHeight;

    const chart = createChart(chartContainerRef.current, {
      ...chartoptions,
      width: chartContainerRef.current.clientWidth,
      height: containerHeight,
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

    const clearPreview = () => {
      if (!chartRef.current || !previewSeriesRef.current) return;
      chartRef.current.removeSeries(previewSeriesRef.current);
      previewSeriesRef.current = null;
    };

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

    const handleCrosshairMove = (param) => {
      if (!drawTrendlineMode || !firstPointRef.current) return;

      const secondPoint = getPointFromParam(param);
      if (!secondPoint) return;

      createPreviewSeriesIfNeeded();
      previewSeriesRef.current.setData([firstPointRef.current, secondPoint]);
    };

    const handleChartClick = async (param) => {
      if (!drawTrendlineMode) return;

      const clickedPoint = getPointFromParam(param);
      if (!clickedPoint) return;

      if (!firstPointRef.current) {
        firstPointRef.current = clickedPoint;
        createPreviewSeriesIfNeeded();
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
  }, [drawTrendlineMode, addTrendline, setShowTrendline]);

  return (
    <div
      id="chart-container"
      ref={chartContainerRef}
      className="chart-container"
    />
  );
}
