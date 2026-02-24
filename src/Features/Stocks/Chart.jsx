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
  const { stockData } = useStock();
  const { showTrendline } = useUI();

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const trendlineSeriesRef = useRef([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      ...chartoptions,
      width: chartContainerRef.current.clientWidth,
      height: window.innerHeight - 100,
    });

    chart.timeScale().applyOptions(timeScaleOptions);

    const candleSeries = chart.addCandlestickSeries(candleoptions);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: window.innerHeight - 100,
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
    }
  }, [stockData.candleData]);

  useEffect(() => {
    if (!chartRef.current) return;

    trendlineSeriesRef.current.forEach((series) => {
      chartRef.current.removeSeries(series);
    });
    trendlineSeriesRef.current = [];

    if (showTrendline && stockData.trendlineData.length > 0) {
      stockData.trendlineData.forEach((line) => {
        const series = chartRef.current.addLineSeries(lineoptions);
        series.setData(line);
        trendlineSeriesRef.current.push(series);
      });
    }
  }, [showTrendline, stockData.trendlineData]);

  return (
    <div
      id="chart-container"
      ref={chartContainerRef}
      style={{ width: "100%", height: "600px" }}
    />
  );
}
