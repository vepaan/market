import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
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

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

function Market() {
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState('1mo'); // Default to 1 month

  const fetchStockData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/stock-data', {
        params: { ticker: 'AAPL', range: timeRange },
      });

      const data = response.data;
      const isIncreasing = data.prices[data.prices.length - 1] > data.prices[0];

      setChartData({
        labels: data.labels,
        datasets: [
          {
            label: 'AAPL Stock Price (USD)',
            data: data.prices,
            borderColor: isIncreasing ? '#10b981' : '#ef4444', // Line color
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return null;

              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              if (isIncreasing) {
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)'); // Light green
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0)'); // Transparent
              } else {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)'); // Light red
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Transparent
              }
              return gradient;
            },
            fill: true,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [timeRange]);

  return (
    <div className="market">
      <div className="chart-section">
        {chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'AAPL Stock Price (USD)' },
              },
              scales: {
                x: { title: { display: true }, grid: { display: false } },
                y: { title: { display: true }, grid: { display: true, color: 'rgba(192, 190, 190, 0.1)' } },
              },
              elements: {
                line: { borderWidth: 2 },
                point: { radius: 0, hoverRadius: 5 },
              },
            }}
          />
        ) : (
          <p>Loading chart...</p>
        )}
        <div className='chart-button-group'>
          <button onClick={() => setTimeRange('1d')}>1 Day</button>
          <button onClick={() => setTimeRange('5d')}>5 Days</button>
          <button onClick={() => setTimeRange('1mo')}>1 Month</button>
          <button onClick={() => setTimeRange('1y')}>1 Year</button>
          <button onClick={() => setTimeRange('max')}>Max</button>
        </div>
      </div>
      <div className='order-section'></div>
    </div>
  );
}

export default Market;
