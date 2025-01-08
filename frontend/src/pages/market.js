import React, { useEffect, useState } from 'react';
import LineChart from './chart'; // Import the new LineChart component
import axios from 'axios';
import BidAskTable from './bidask';

function Market() {
  const [chartData, setChartData] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [ticker, setTicker] = useState('AAPL'); // Default ticker
  const [timeRange, setTimeRange] = useState('1mo'); // Default to 1 month
  const [activeButton, setActiveButton] = useState('1mo'); // Default active button
  const [name, setName] = useState(''); // State for the ticker input
  const [currentPrice, setCurrentPrice] = useState(null); // Track the current price

  // Function to fetch stock data
  const fetchStockData = async () => {
    try {
      if (timeRange === '5s') {
        // Fetch simulated price data for 5s chart
        const simulateResponse = await axios.get('http://127.0.0.1:5000/api/simulate-price', {
          params: { symbol: ticker }, // Pass ticker symbol for simulation
        });
        const simulatedPrices = simulateResponse.data.simulated_prices;

        // Update the chart data state for 5s simulation
        setChartData({
          labels: Array.from({ length: simulatedPrices.length }, (_, i) => `${i * 5}s`), // 5s intervals
          datasets: [
            {
              label: `${ticker} Simulated Price (USD)`,
              data: simulatedPrices,
              borderColor: '#3b82f6', // Blue color for simulated chart
              backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;

                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // Light blue
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)'); // Transparent
                return gradient;
              },
              fill: true,
            },
          ],
        });

        // Set the last price as the current price from simulated data
        setCurrentPrice(simulatedPrices[simulatedPrices.length - 1]);
      } else {
        // Fetch stock data and company name for other time ranges
        const response = await axios.get('http://127.0.0.1:5000/api/stock-data', {
          params: { ticker, range: timeRange },
        });

        const data = response.data;
        const isIncreasing = data.prices[data.prices.length - 1] > data.prices[0];

        const companyResponse = await axios.get('http://127.0.0.1:5000/api/company-name', {
          params: { ticker },
        });
        setCompanyName(companyResponse.data.companyName);

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

        // Set the last price as the current price from stock data
        setCurrentPrice(data.prices[data.prices.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  // Fetch data whenever the ticker or time range changes
  useEffect(() => {
    fetchStockData();
    if (timeRange === '5s') {
      const interval = setInterval(fetchStockData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval); // Cleanup on unmount or range change
    }
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
          {chartData && chartData.datasets ? (
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
          ) : (
            <p>Loading chart...</p>
          )}
        </div>
        {chartData ? (
          <LineChart chartData={chartData} />
        ) : (
          <p>Loading chart...</p>
        )}
        <div className="chart-button-group">
          {['5s', '1d', '5d', '1mo', '1y', 'max'].map((range) => (
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
        <BidAskTable ticker={ticker} price={currentPrice} className='bid-ask'/>
        <div className='place-order-title'>Place Order</div>
        <div className='order-form'>Haha</div>
      </div>
    </div>
  );
}

export default Market;
