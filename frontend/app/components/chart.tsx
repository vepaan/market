"use client"

import React, { useEffect, useRef } from "react";
// NEW: Import CandlestickSeries directly from the library
import { createChart, ColorType, Time, CandlestickSeries } from "lightweight-charts";

export interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[] | null;
}

export default function CandlestickChart({ data }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Initialize the Chart only once
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(100, 100, 100, 0.1)" },
        horzLines: { color: "rgba(100, 100, 100, 0.1)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: true, // Crucial for our 5s chart!
      },
      crosshair: {
        mode: 0, // Normal crosshair mode
      }
    });

    // 2. THE V5 FIX: Use addSeries and pass CandlestickSeries as the first argument
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    chartRef.current = { chart, series: candlestickSeries };

    // 3. Handle window resizing smoothly
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.chart.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Update data dynamically whenever the data prop changes
  useEffect(() => {
    if (chartRef.current && chartRef.current.series && data && data.length > 0) {
      chartRef.current.series.setData(data);
    }
  }, [data]);

  if (!data || data.length === 0) {
    return <p className="text-gray-400 w-full h-full flex items-center justify-center">Awaiting Market Data...</p>;
  }

  return <div ref={chartContainerRef} className="w-full h-full" />;
}