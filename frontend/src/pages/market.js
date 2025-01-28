import React, { useEffect, useState } from "react";
import LineChart from "./chart"; // Import the LineChart component
import Candlestick from "./candlestick"; // Import the custom Candlestick component
import axios from "axios";
import BidAskTable from "./bidask";
import PlaceOrder from "./placeorder";

function Market() {
  const [chartData, setChartData] = useState(null);
  const [candlestickData, setCandlestickData] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [ticker, setTicker] = useState("AAPL"); // Default ticker
  const [timeRange, setTimeRange] = useState("1mo"); // Default time range
  const [activeButton, setActiveButton] = useState("1mo"); // Default active button
  const [name, setName] = useState(""); // State for the ticker input
  const [currentPrice, setCurrentPrice] = useState(null); // Track the current price
  const [simulationInterval, setSimulationInterval] = useState(null); // For 5s simulation
  const [is5sChart, setIs5sChart] = useState(false); // Track if it's 5s chart
  const [initialPrice, setInitialPrice] = useState(null); // To store the first price for percent change calculation

  const fetchStockData = async () => {
    try {
      if (timeRange === "5s") {
        // Fetch the 720 simulated prices
        const response = await axios.get("http://127.0.0.1:5000/api/simulate-price-5s", {
          params: {
            symbol: ticker,
          },
        });

        const simulatedPrices = response.data.prices; // Array of 720 prices

        // Initialize candlestick data with the first price
        setCandlestickData([{ start: simulatedPrices[0], end: simulatedPrices[0] }]);

        // Set the initial price (first element)
        setInitialPrice(simulatedPrices[0]);
        setCurrentPrice(simulatedPrices[0]);

        // Track the current index of the simulated prices
        let currentIndex = 1;

        // Clear any existing interval
        clearInterval(simulationInterval);

        // Set up an interval to update the candlestick chart every 5 seconds
        const interval = setInterval(() => {
          if (currentIndex < simulatedPrices.length) {
            // Get the current price and the next price
            const currentPrice = simulatedPrices[currentIndex - 1];
            const nextPrice = simulatedPrices[currentIndex];

            // Update the candlestick data
            setCandlestickData((prevData) => {
              const lastPrice = prevData.at(-1).end;

              // Add a new candlestick data point
              return [
                ...prevData,
                { start: lastPrice, end: nextPrice },
              ].slice(-90); // Keep the last 80 candles (5 minutes)
            });

            setCurrentPrice(nextPrice); // Update current price dynamically
            currentIndex += 1;
          } else {
            clearInterval(interval);
          }
        }, 5000);

        setSimulationInterval(interval);
        setIs5sChart(true);
      } else {
        const response = await axios.get(
          "http://127.0.0.1:5000/api/stock-data",
          { params: { ticker, range: timeRange } }
        );

        const data = response.data;
        const isIncreasing =
          data.prices[data.prices.length - 1] > data.prices[0];

        const companyResponse = await axios.get(
          "http://127.0.0.1:5000/api/company-name",
          { params: { ticker } }
        );
        setCompanyName(companyResponse.data.companyName);

        setChartData({
          labels: data.labels,
          datasets: [
            {
              label: `${ticker} Stock Price (USD)`,
              data: data.prices,
              borderColor: isIncreasing ? "#10b981" : "#ef4444",
              backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;

                const gradient = ctx.createLinearGradient(
                  0,
                  chartArea.top,
                  0,
                  chartArea.bottom
                );
                gradient.addColorStop(
                  0,
                  isIncreasing
                    ? "rgba(16, 185, 129, 0.5)"
                    : "rgba(239, 68, 68, 0.5)"
                );
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                return gradient;
              },
              fill: true,
            },
          ],
        });

        setCurrentPrice(data.prices[data.prices.length - 1]);
        setIs5sChart(false);
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  useEffect(() => {
    fetchStockData();
    if (timeRange !== "5s" && simulationInterval) {
      clearInterval(simulationInterval); // Clear simulation when not in 5s range
      setSimulationInterval(null);
    }

    // Reset the price values when switching to a different time range
    if (timeRange !== "5s") {
      setCurrentPrice(null);
      setInitialPrice(null); // Reset the initial price when not in 5s range
    }
  }, [ticker, timeRange]);

  const handleButtonClick = (range) => {
    setActiveButton(range);
    setTimeRange(range);
  };

  const handleTickerChange = () => {
    setTicker(name.toUpperCase());
  };

  // Percent change calculation based on the initial price for the 5s chart
  const calculatePercentChange = () => {
    if (initialPrice === null || currentPrice === null) return 0;
    const change = ((currentPrice - initialPrice) / initialPrice) * 100;
    return change.toFixed(2);
  };

  const calculateUSDChange = () => {
    if (initialPrice === null || currentPrice === null) return 0;
    let updatedPrice = (currentPrice - initialPrice).toFixed(2);
    if (updatedPrice < 0) return updatedPrice + " USD";
    if (updatedPrice > 0) return "+" + updatedPrice + " USD";
    return updatedPrice;
  };

  return (
    <div className="market">
      <div className="chart-section">
        <div className="chart-header">
          <h2>{companyName ? `${companyName} (${ticker})` : `Loading...`}</h2>
          {chartData && chartData.datasets ? (
            <>
              <h3 className="current-price">
                ${currentPrice ? currentPrice.toFixed(2) : "Loading..."}
              </h3>
              <p
                className="percent-change"
                style={{
                  color:
                    currentPrice &&
                    chartData.datasets[0].data[chartData.datasets[0].data.length - 1] >
                      chartData.datasets[0].data[0]
                      ? "#10b981"
                      : "#ef4444",
                }}
              >
                {timeRange === "5s" ? (
                  <>
                    {/* USD Change */}
                    <span
                      style={{
                        color:
                          currentPrice && currentPrice - initialPrice > 0
                            ? "#10b981" // Green for positive USD change
                            : "#ef4444", // Red for negative USD change
                      }}
                    >
                      {calculateUSDChange()}
                    </span>{" "}
                    {/* Percent Change */}
                    <span
                      style={{
                        color: "#ffffff", // Always white for percent change
                      }}
                    >
                      ({calculatePercentChange()}%)
                    </span>
                  </>
                ) : null}

                {/* For other time ranges */}
                {timeRange !== "5s" && (
                  <>
                    {currentPrice &&
                    chartData.datasets[0].data[chartData.datasets[0].data.length - 1] >
                      chartData.datasets[0].data[0]
                      ? "+"
                      : ""}
                    {currentPrice &&
                      (
                        chartData.datasets[0].data[chartData.datasets[0].data.length - 1] -
                        chartData.datasets[0].data[0]
                      ).toFixed(2)}{" "}
                    USD{" "}
                    <span style={{ color: "white" }}>
                      (
                      {currentPrice &&
                        (
                          ((currentPrice - chartData.datasets[0].data[0]) /
                            chartData.datasets[0].data[0]) *
                        100
                        ).toFixed(2)}
                      %)
                    </span>
                  </>
                )}
              </p>
            </>
          ) : (
            <p>Loading chart...</p>
          )}
        </div>
        {timeRange === "5s" ? (
          candlestickData.length > 0 ? (
            <Candlestick data={candlestickData} />
          ) : (
            <p>Loading candlestick chart...</p>
          )
        ) : chartData ? (
          <LineChart chartData={chartData} is5sChart={is5sChart} />
        ) : (
          <p>Loading chart...</p>
        )}
        <div className="chart-button-group">
          {["5s", "1d", "5d", "1mo", "1y", "max"].map((range) => (
            <button
              key={range}
              onClick={() => handleButtonClick(range)}
              className={`buttons ${activeButton === range ? "active" : ""}`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="exposure"><h2>Net Exposure: Display Long and short data here in green and red</h2></div>
      </div>
      <div className="order-section">
        <div className="search-bar-box">
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            className="search-bar"
            placeholder="Enter ticker..."
          />
          <button onClick={handleTickerChange} className="ticker-submit">Search</button>
        </div>
        <div className="bid-ask-title">Market/Quotes</div>
        <BidAskTable ticker={ticker} price={currentPrice} className="bid-ask" />
        <div className="place-order-title">Place Order</div>
        <PlaceOrder />
      </div>
    </div>
  );
}

export default Market;
