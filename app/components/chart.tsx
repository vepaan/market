"use clinet"

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LineChart({ chartData, is5sChart }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: '#000',
        borderWidth: 1,
        caretSize: 0,
        callbacks: {
          label: function (tooltipItem) {
            return `Price: $${tooltipItem.raw.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
          maxTicksLimit: 7
        },
      },
      y: {
        display: true,
        grid: {
          color: "rgba(100, 100, 100, 0.2)",
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { data } = chart;
          if (!data || !data.datasets || !data.datasets.length) return;
          const isIncreasing = data.datasets[0].data[data.datasets[0].data.length - 1] > data.datasets[0].data[0];
          return isIncreasing ? "#10b981" : "#ef4444";
        },
      },
    },
    tension: 0.4,
  };

  if (!chartData) {
    return <p className="text-gray-400">Loading chart...</p>;
  }

  return <Line data={chartData} options={options} />;
}