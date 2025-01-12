import React from 'react';
import {
  ChartCanvas,
  Chart,
  XAxis,
  YAxis,
  CandlestickSeries,
  discontinuousTimeScaleProvider,
  MouseCoordinateY,
  MouseCoordinateX,
} from "react-financial-charts";
import { last } from "react-financial-charts/lib/utils";

const Candlestick = ({ data, width, ratio }) => {
  const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(
    (d) => new Date(d.time)
  );

  const {
    data: chartData,
    xScale,
    xAccessor,
    displayXAccessor,
  } = xScaleProvider(data);

  const xExtents = [xAccessor(last(chartData)), xAccessor(chartData[0])];

  return (
    <ChartCanvas
      height={400}
      width={width}
      ratio={ratio}
      data={chartData}
      seriesName="Candlestick"
      xScale={xScale}
      xAccessor={xAccessor}
      displayXAccessor={displayXAccessor}
      xExtents={xExtents}
    >
      <Chart id={1} yExtents={(d) => [d.high, d.low]}>
        <XAxis />
        <YAxis />
        <MouseCoordinateY />
        <MouseCoordinateX />
        <CandlestickSeries />
      </Chart>
    </ChartCanvas>
  );
};

export default Candlestick;
