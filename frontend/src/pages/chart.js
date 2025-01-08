import React from 'react';
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
// Register the necessary chart elements
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

function LineChart({ chartData }) {
  // Chart.js options for customization
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true },
      text: 'Line Chart Example',
      zoom: {
        zoom: {
          wheel: { enabled: true }, // Enable zooming with mouse wheel
          pinch: { enabled: true }, // Enable zooming with pinch gestures
          mode: 'x', // Zoom only on the x-axis
        },
        pan: {
          enabled: true,
          mode: 'x', // Pan only on the x-axis
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

  return (
    <div className="line-chart-container">
      <Line data={chartData} options={options} />
    </div>
  );
}

export default LineChart;
