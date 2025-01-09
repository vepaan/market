import React, { useEffect, useState } from 'react';
import LineChart from './chart'; // Import the LineChart component
import axios from 'axios';
import BidAskTable from './bidask';

function Market() {
  const [chartData, setChartData] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [ticker, setTicker] = useState('AAPL'); // Default ticker
  const [timeRange, setTimeRange] = useState('1mo'); // Default time range
  const [activeButton, setActiveButton] = useState('1mo'); // Default active button
  const [name, setName] = useState(''); // State for the ticker input
  const [currentPrice, setCurrentPrice] = useState(null); // Track the current price
  const [simulationInterval, setSimulationInterval] = useState(null); // For 5s simulation

  const fetchStockData = async () => {
    try {
      if (timeRange === '5s') {
        // Fetch the close price for the day as the initial point
        const response = await axios.get('http://127.0.0.1:5000/api/stock-data', {
          params: { ticker, range: '1d' },
        });

        const closePrice = response.data.prices.at(-1);

        setChartData({
          labels: ['0s'],
          datasets: [
            {
              label: `${ticker} Simulated Price (USD)`,
              data: [closePrice],
              borderColor: '#3b82f6',
              backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;

                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                return gradient;
              },
              fill: true,
            },
          ],
        });

        // Simulate updates every 5 seconds
        let currentTime = 0;
        clearInterval(simulationInterval); // Clear any existing interval
        const interval = setInterval(() => {
          currentTime += 5;

          setChartData((prevData) => {
            const lastPrice = prevData.datasets[0].data.at(-1);
            const simulatedPrice = lastPrice + (Math.random() * 2 - 1);

            const newLabels = [...prevData.labels, `${currentTime}s`];
            const newData = [...prevData.datasets[0].data, simulatedPrice];

            // Limit to last 30 seconds (6 points for 5s intervals)
            if (newLabels.length > 6) {
              newLabels.shift();
              newData.shift();
            }

            return {
              labels: newLabels,
              datasets: [
                {
                  ...prevData.datasets[0],
                  data: newData,
                },
              ],
            };
          });

          if (currentTime >= 3600) clearInterval(interval); // Stop after 1 hour
        }, 5000);

        setSimulationInterval(interval);
      } else {
        // Fetch stock data for other ranges
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
              borderColor: isIncreasing ? '#10b981' : '#ef4444',
              backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;

                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(
                  0,
                  isIncreasing ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
                );
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                return gradient;
              },
              fill: true,
            },
          ],
        });

        setCurrentPrice(data.prices[data.prices.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  useEffect(() => {
    fetchStockData();
    if (timeRange !== '5s' && simulationInterval) {
      clearInterval(simulationInterval); // Clear simulation when not in 5s range
      setSimulationInterval(null);
    }
  }, [ticker, timeRange]);

  const handleButtonClick = (range) => {
    setActiveButton(range);
    setTimeRange(range);
  };

  const handleTickerChange = () => {
    setTicker(name.toUpperCase());
  };

  return (
    <div className="market">
      <div className="chart-section">
        <div className="chart-header">
          <h2>{companyName ? `${companyName} (${ticker})` : `Loading...`}</h2>
          {chartData && chartData.datasets ? (
            <>
              <h3 className="current-price">
                ${chartData.datasets[0].data.at(-1).toFixed(2)}
              </h3>
              <p
                className="percent-change"
                style={{
                  color:
                    chartData.datasets[0].data.at(-1) > chartData.datasets[0].data[0]
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
        {chartData ? <LineChart chartData={chartData} /> : <p>Loading chart...</p>}
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
        <div className="bid-ask-title">Market</div>
        <BidAskTable ticker={ticker} price={currentPrice} className="bid-ask" />
        <div className="place-order-title">Place Order</div>
        <div className="order-form">Order form here</div>
      </div>
    </div>
  );
}

export default Market;
