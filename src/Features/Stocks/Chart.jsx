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
  const { stockData, linesData } = useStock();
  const { showTrendline } = useUI();

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const trendlineSeriesRef = useRef([]);

  const resetViewport = () => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    chartRef.current.priceScale("right").applyOptions({ autoScale: true });

    requestAnimationFrame(() => {
      chartRef.current.timeScale().fitContent();
      chartRef.current.timeScale().scrollToRealTime();
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
      resetViewport();
    }
  }, [stockData.candleData]);

  useEffect(() => {
    if (!chartRef.current) return;

    trendlineSeriesRef.current.forEach((series) => {
      chartRef.current.removeSeries(series);
    });
    trendlineSeriesRef.current = [];

    if (!showTrendline || linesData.length === 0) return;

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
  }, [showTrendline, linesData]);

  return (
    <div
      id="chart-container"
      ref={chartContainerRef}
      className="chart-container"
    />
  );
}
