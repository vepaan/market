import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend);

const BarChart = ({ chartData }) => {
  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price (USD)',
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;
