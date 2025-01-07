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

// Register the necessary chart elements
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

function LineChart({ chartData }) {
  // Chart.js options for customization
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hide legend
      },
      title: {
        display: true,
        //text: 'Stock Price Over Time', // Chart title
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          //text: 'Time',
        },
        grid: {
          display: false, // Hide grid on x-axis
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price (USD)',
        },
        grid: {
          display: true,
          color: 'rgba(192, 190, 190, 0.1)', // Subtle grid lines
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2, // Line thickness
      },
      point: {
        radius: 0, // Hide points on the line
        hoverRadius: 5, // Increase hover radius for points
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
