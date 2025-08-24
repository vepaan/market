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
  ScriptableContext,
  TooltipItem,
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

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
  }[];
}

interface LineChartProps {
  chartData: ChartData | null;
  is5sChart?: boolean;
}

export default function LineChart({ chartData, is5sChart }: LineChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: '#000',
        borderWidth: 1,
        caretSize: 0,
        callbacks: {
          label: function (tooltipItem: TooltipItem<"line">) {
            return `Price: $${(tooltipItem.raw as number).toFixed(2)}`;
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
        backgroundColor: (context: ScriptableContext<"line">) => {
          const chart = context.chart;
          const { data } = chart;
          if (!data || !data.datasets || data.datasets.length === 0 || !data.datasets[0].data || data.datasets[0].data.length === 0) {
            return;
          }
          const isIncreasing = (data.datasets[0].data[data.datasets[0].data.length - 1] as number) > (data.datasets[0].data[0] as number);
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