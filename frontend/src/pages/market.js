import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import BidAskTable from './bidask';
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
  const [companyName, setCompanyName] = useState('');
  const [ticker, setTicker] = useState('AAPL'); // Default ticker
  const [timeRange, setTimeRange] = useState('1mo'); // Default to 1 month
  const [activeButton, setActiveButton] = useState('1mo'); // Default active button
  const [name, setName] = useState(''); // State for the ticker input

  // Function to fetch stock data
  const fetchStockData = async () => {
    try {
      // Fetch stock data and company name from backend
      const response = await axios.get('http://127.0.0.1:5000/api/stock-data', {
        params: { ticker, range: timeRange },
      });

      const data = response.data;
      const isIncreasing = data.prices[data.prices.length - 1] > data.prices[0];

      // Fetch company name using Yahoo Finance API
      const companyResponse = await axios.get('http://127.0.0.1:5000/api/company-name', {
        params: { ticker },
      });
      setCompanyName(companyResponse.data.companyName);

      // Update the chart data state
      setChartData({
        labels: data.labels,
        datasets: [
          {
            label: `${ticker} Stock Price (USD)`,
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

  // Fetch data whenever the ticker or time range changes
  useEffect(() => {
    fetchStockData();
  }, [ticker, timeRange]);

  // Button click handler for time range
  const handleButtonClick = (range) => {
    setActiveButton(range); // Update the active button
    setTimeRange(range); // Update the time range for fetching data
  };

  // Handle ticker change when input field is updated
  const handleTickerChange = () => {
    setTicker(name.toUpperCase()); // Set ticker from input value
  };

  return (
    <div className="market">
      <div className="chart-section">
        <div className="chart-header">
          <h2>{companyName ? `${companyName} (${ticker})` : `Loading...`}</h2>
          {chartData && (
            <>
              <h3 className="current-price">
                ${chartData.datasets[0].data.at(-1).toFixed(2)} {/* Last point as current price */}
              </h3>
              <p
                className="percent-change"
                style={{
                  color: chartData.datasets[0].data.at(-1) > chartData.datasets[0].data[0]
                    ? '#10b981'
                    : '#ef4444',
                }}
              >
                {/* Calculate price change */}
                {chartData.datasets[0].data.at(-1) > chartData.datasets[0].data[0] ? '+' : ''}
                {(
                  chartData.datasets[0].data.at(-1) - chartData.datasets[0].data[0]
                ).toFixed(2)}{' '}
                USD{' '}
                <span style={{ color: 'white' }}>
                  (
                  {chartData.datasets[0].data.at(-1) > chartData.datasets[0].data[0] ? '+' : ''}
                  {(
                    ((chartData.datasets[0].data.at(-1) - chartData.datasets[0].data[0]) /
                      chartData.datasets[0].data[0]) *
                    100
                  ).toFixed(2)}
                  %)
                </span>
              </p>
            </>
          )}
        </div>
        {chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: true },
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
        <div className="chart-button-group">
          {['1d', '5d', '1mo', '1y', 'max'].map((range) => (
            <button
              key={range}
              onClick={() => handleButtonClick(range)}
              className={`buttons ${activeButton === range ? 'active' : ''}`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="search-bar-box">
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            className="search-bar"
            placeholder="Enter ticker..."
          />
          <button onClick={handleTickerChange}>Search</button>
        </div>
      </div>
      <div className="order-section">
        <div className='bid-ask-title'>Market</div>
        <BidAskTable ticker={ticker} className='bid-ask'/>
        <div className='place-order-title'>Place Order</div>
        <div className='order-form'></div>
      </div>
    </div>
  );
}

export default Market;
