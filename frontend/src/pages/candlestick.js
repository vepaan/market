import React, { useState, useEffect, useRef } from "react";
import "../candle.css";

const Candlestick = ({ data }) => {
  const chartHeight = 360; // Visible height
  const chartFullHeight = 600; // Total scrollable height
  const chartWidth = 2000;
  const candleWidth = 10;
  const spacing = 10;
  const axisPadding = 40;
  const maxWidth = 1200;

  const totalCandleWidth = candleWidth + spacing;

  const [isZoomed, setIsZoomed] = useState(false);
  const [localMin, setLocalMin] = useState(0);
  const [localMax, setLocalMax] = useState(0);

  // Random wick heights storage
  const wickHeightsRef = useRef([]);

  // Initialize wick heights on first render and store them
  useEffect(() => {
    wickHeightsRef.current = data.map(() => Math.random() * (0.5 - 0.3) + 0.3);
  }, [data]);

  useEffect(() => {
    // Calculate the local min and max values dynamically
    const visibleData = data.slice(0, chartWidth / totalCandleWidth); // Adjust for visible width
    const visibleMin = Math.min(...visibleData.map((d) => Math.min(d.start, d.end)));
    const visibleMax = Math.max(...visibleData.map((d) => Math.max(d.start, d.end)));

    const extendedMin = visibleMin - (visibleMin * 0.0005);
    const extendedMax = visibleMax + (visibleMax * 0.0005);

    setLocalMin(extendedMin);
    setLocalMax(extendedMax);
  }, [data, chartWidth]);

  const handleZoom = (e) => {
    if (e.deltaY < 0 && chartWidth < maxWidth) {
      setIsZoomed(true);
    } else if (e.deltaY > 0 && chartWidth > 800) {
      setIsZoomed(false);
    }
  };

  // Generate dynamic Y-axis labels
  const yAxisLabels = [...Array(10)].map((_, i) =>
    (localMax - ((localMax - localMin) * i) / 9).toFixed(2)
  );

  // Calculate center points for the polyline (trend line)
  const centerPoints = data.map((candle, index) => {
    const x = axisPadding + index * totalCandleWidth + candleWidth / 2;
    const centerY =
      chartFullHeight -
      (((candle.start + candle.end) / 2 - localMin) / (localMax - localMin)) *
        chartFullHeight;
    return { x, y: centerY };
  });

  return (
    <div
      style={{
        overflow: "auto",
        marginTop: "13px",
        width: "100%",
        height: chartHeight + 40, // Limit visible height
      }}
      onWheel={handleZoom}
      className="scroll-container"
    >
      <svg
        width={isZoomed ? maxWidth : chartWidth + axisPadding}
        height={chartFullHeight + 40} // Full scrollable height
      >
        {/* Y-Axis */}
        <line
          x1={axisPadding}
          y1={0}
          x2={axisPadding}
          y2={chartFullHeight}
          stroke="gray"
          strokeWidth={1}
        />

        {/* Dynamic Y-Axis Ticks and Labels */}
        {yAxisLabels.map((label, i) => {
          const yPos = (chartFullHeight * i) / 9;
          return (
            <g key={i}>
              {/* Horizontal Gridline */}
              <line
                x1={axisPadding}
                y1={yPos}
                x2={chartWidth + axisPadding}
                y2={yPos}
                stroke="#a49895"
                strokeWidth={1}
                opacity={0.2}
              />
              {/* Tick */}
              <line
                x1={axisPadding - 5}
                y1={yPos}
                x2={axisPadding}
                y2={yPos}
                stroke="gray"
                strokeWidth={1}
              />
              {/* Label */}
              <text
                x={axisPadding - 10}
                y={yPos + 4}
                textAnchor="end"
                fontSize={10}
                fill="gray"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* X-Axis */}
        <line
          x1={axisPadding}
          y1={chartFullHeight}
          x2={chartWidth + axisPadding}
          y2={chartFullHeight}
          stroke="gray"
          strokeWidth={1}
        />

        {/* X-Axis Ticks and Labels */}
        {data.map((_, i) => {
          const xPos = axisPadding + i * totalCandleWidth;
          return (
            <g key={i}>
              <line
                x1={xPos}
                y1={chartFullHeight}
                x2={xPos}
                y2={chartFullHeight + 5}
                stroke="gray"
                strokeWidth={1}
              />
              <text
                x={xPos}
                y={chartFullHeight + 15}
                textAnchor="middle"
                fontSize={10}
                fill="gray"
              >
                {`${i * 5}s`}
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {data.map((candle, index) => {
          const x = axisPadding + index * totalCandleWidth;
          const startY =
            chartFullHeight -
            ((candle.start - localMin) / (localMax - localMin)) * chartFullHeight;
          const endY =
            chartFullHeight -
            ((candle.end - localMin) / (localMax - localMin)) * chartFullHeight;
          const height = Math.abs(startY - endY);
          const color = candle.end >= candle.start ? "#10b981" : "#ef4444";

          // Wick calculations: Retrieve the pre-calculated wick height for this candle
          const wickHeight = wickHeightsRef.current[index] * height;

          return (
            <g key={index}>
              <rect
                x={x}
                y={Math.min(startY, endY)}
                width={candleWidth}
                height={height}
                fill={color}
              />
              <line
                x1={x + candleWidth / 2}
                y1={Math.min(startY, endY) - wickHeight / 2}
                x2={x + candleWidth / 2}
                y2={Math.min(startY, endY) + wickHeight / 2}
                stroke={color}
                strokeWidth={2}
              />
              <line
                x1={x + candleWidth / 2}
                y1={Math.max(startY, endY) - wickHeight / 2}
                x2={x + candleWidth / 2}
                y2={Math.max(startY, endY) + wickHeight / 2}
                stroke={color}
                strokeWidth={2}
              />
            </g>
          );
        })}

        {/* Trend Line */}
        <polyline
          points={centerPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke="lightblue"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
};

export default Candlestick;
