import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(zoomPlugin);
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

function LineChart({ chartData, is5sChart }) {
  const chartRef = useRef(null);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true},
      zoom: {
        pan: {
          enabled: true,
          mode: 'x', // Allow horizontal panning
        },
        zoom: {
          wheel: {
            enabled: true, // Allow zooming with the mouse wheel
          },
          pinch: {
            enabled: true, // Allow zooming with pinch gestures
          },
          mode: 'x', // Zoom horizontally
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Time' },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: 'Price (USD)' },
        grid: { display: true, color: 'rgba(192, 190, 190, 0.1)' },
      },
    },
    elements: {
      point: {
        radius: 0, // Removes the circles on the chart
      },
    },
  };

  useEffect(() => {
    if (is5sChart && chartRef.current) {
      const chartInstance = chartRef.current;

      // Ensure the entire dataset is available
      const fullRange = chartData.labels;
      chartInstance.options.scales.x.min = fullRange[0];
      chartInstance.options.scales.x.max = fullRange[fullRange.length - 1];

      chartInstance.update();
    }
  }, [chartData, is5sChart]);

  return (
    <div className="line-chart-container">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}

export default LineChart;
