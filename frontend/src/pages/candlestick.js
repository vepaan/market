import React, { useState } from "react";

const Candlestick = ({ data }) => {
  const chartHeight = 300; // Adjusted height to make room for axes
  const chartWidth = 2000; // Total width of the chart
  const candleWidth = 10; // Width of each candle
  const spacing = 10; // Spacing between candles
  const axisPadding = 40; // Space for axes and labels
  const maxWidth = 1200; // Maximum width before scrolling is triggered
  const additionalHeight = chartHeight * 0.1; // 10% extra height for vertical scroll

  // Determine the vertical position of each candle
  const chartMinY = Math.min(...data.map((d) => Math.min(d.start, d.end)));
  const chartMaxY = Math.max(...data.map((d) => Math.max(d.start, d.end)));
  const priceRange = chartMaxY - chartMinY;

  // Determine the horizontal scale for time labels
  const timeLabels = data.map((_, index) => `${index * 5}s`);
  const totalCandleWidth = candleWidth + spacing;

  // Horizontal scrolling logic
  const [isZoomed, setIsZoomed] = useState(false);

  const handleZoom = (e) => {
    if (e.deltaY < 0 && chartWidth < maxWidth) {
      setIsZoomed(true);
    } else if (e.deltaY > 0 && chartWidth > 800) {
      setIsZoomed(false);
    }
  };

  return (
    <div
      style={{
        overflow: "auto", // Allow both horizontal and vertical scroll
        marginTop: "13px",
        width: "100%",
        height: chartHeight + additionalHeight + axisPadding, // Allow for 10% extra space vertically
      }}
      onWheel={handleZoom}
    >
      <svg
        width={isZoomed ? maxWidth : chartWidth + axisPadding}
        height={chartHeight + additionalHeight + axisPadding} // Adjusted height with additional space
      >
        {/* Y-Axis */}
        <line
          x1={axisPadding}
          y1={0}
          x2={axisPadding}
          y2={chartHeight + additionalHeight}
          stroke="red"
          strokeWidth={1}
        />
        {/* Y-Axis Ticks and Labels */}
        {[...Array(6)].map((_, i) => {
          const yValue = chartMinY + (priceRange * (5 - i)) / 5; // Divide into 5 intervals
          const yPos = (chartHeight * i) / 5;
          return (
            <g key={i}>
              <line
                x1={axisPadding - 5}
                y1={yPos}
                x2={axisPadding}
                y2={yPos}
                stroke="red"
                strokeWidth={1}
              />
              <text
                x={axisPadding - 10}
                y={yPos + 4}
                textAnchor="end"
                fontSize={10}
                fill="red"
              >
                {yValue.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X-Axis */}
        <line
          x1={axisPadding}
          y1={chartHeight + additionalHeight}
          x2={chartWidth + axisPadding}
          y2={chartHeight + additionalHeight}
          stroke="red"
          strokeWidth={1}
        />
        {/* X-Axis Ticks and Labels */}
        {timeLabels.map((label, i) => {
          const xPos = axisPadding + i * totalCandleWidth;
          return (
            <g key={i}>
              <line
                x1={xPos}
                y1={chartHeight + additionalHeight}
                x2={xPos}
                y2={chartHeight + additionalHeight + 5}
                stroke="red"
                strokeWidth={1}
              />
              <text
                x={xPos}
                y={chartHeight + additionalHeight + 15}
                textAnchor="middle"
                fontSize={10}
                fill="red"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {data.map((candle, index) => {
          const x = axisPadding + index * totalCandleWidth; // Horizontal position
          const startY =
            chartHeight -
            ((candle.start - chartMinY) / priceRange) * chartHeight; // Start price position
          const endY =
            chartHeight -
            ((candle.end - chartMinY) / priceRange) * chartHeight; // End price position
          const height = Math.abs(startY - endY); // Height of the candle
          const color = candle.end >= candle.start ? "#10b981" : "#ef4444"; // Green for upward, red for downward

          return (
            <rect
              key={index}
              x={x}
              y={Math.min(startY, endY)}
              width={candleWidth}
              height={height}
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default Candlestick;
