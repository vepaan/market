import React, { useState, useEffect, useRef } from "react";

const Candlestick = ({ data }) => {
  const chartHeight = 300;
  const chartWidth = 2000;
  const candleWidth = 10;
  const spacing = 10;
  const axisPadding = 40;
  const maxWidth = 1200;
  const additionalHeight = chartHeight * 0.1;

  const chartMinY = Math.min(...data.map((d) => Math.min(d.start, d.end)));
  const chartMaxY = Math.max(...data.map((d) => Math.max(d.start, d.end)));
  const priceRange = chartMaxY - chartMinY;

  const timeLabels = data.map((_, index) => `${index * 5}s`);
  const totalCandleWidth = candleWidth + spacing;

  const [isZoomed, setIsZoomed] = useState(false);

  const handleZoom = (e) => {
    if (e.deltaY < 0 && chartWidth < maxWidth) {
      setIsZoomed(true);
    } else if (e.deltaY > 0 && chartWidth > 800) {
      setIsZoomed(false);
    }
  };

  // Calculate center points for the trend line
  const centerPoints = data.map((candle, index) => {
    const x = axisPadding + index * totalCandleWidth + candleWidth / 2;
    const centerY =
      chartHeight - 
      (((candle.start + candle.end) / 2 - chartMinY) / priceRange) *
        chartHeight;
    return { x, y: centerY };
  });

  // Random wick height storage
  const wickHeightsRef = useRef([]);

  // Initialize wick heights on first render and store them
  useEffect(() => {
    wickHeightsRef.current = data.map(() =>
      Math.random() * (0.5 - 0.3) + 0.3
    );
  }, [data]);

  return (
    <div
      style={{
        overflow: "auto",
        marginTop: "13px",
        width: "100%",
        height: chartHeight + additionalHeight + axisPadding,
      }}
      onWheel={handleZoom}
    >
      <svg
        width={isZoomed ? maxWidth : chartWidth + axisPadding}
        height={chartHeight + additionalHeight + axisPadding}
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
          const yValue = chartMinY + (priceRange * (5 - i)) / 5;
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
          const x = axisPadding + index * totalCandleWidth;
          const startY =
            chartHeight - ((candle.start - chartMinY) / priceRange) * chartHeight;
          const endY =
            chartHeight - ((candle.end - chartMinY) / priceRange) * chartHeight;
          const height = Math.abs(startY - endY);
          const color = candle.end >= candle.start ? "#10b981" : "#ef4444";

          // Wick calculations: Retrieve the pre-calculated wick height for this candle
          const wickHeight = wickHeightsRef.current[index] * height;

          return (
            <g key={index}>
              {/* Candlestick Body */}
              <rect
                x={x}
                y={Math.min(startY, endY)}
                width={candleWidth}
                height={height}
                fill={color}
              />
              {/* Wick for the start of the candle */}
              <line
                x1={x + candleWidth / 2}
                y1={Math.min(startY, endY) - wickHeight / 2} // Extend above the candle body
                x2={x + candleWidth / 2}
                y2={Math.min(startY, endY) + wickHeight / 2} // Extend below the candle body
                stroke={color}
                strokeWidth={2}
              />
              {/* Wick for the end of the candle */}
              <line
                x1={x + candleWidth / 2}
                y1={Math.max(startY, endY) - wickHeight / 2} // Extend above the candle body
                x2={x + candleWidth / 2}
                y2={Math.max(startY, endY) + wickHeight / 2} // Extend below the candle body
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
