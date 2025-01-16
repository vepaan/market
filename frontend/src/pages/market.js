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
  const [trendState, setTrendState] = useState("none"); // Tracks the current trend
  const [trendCounter, setTrendCounter] = useState(0); // Tracks the remaining trend duration

  const fetchStockData = async () => {
    try {
      if (timeRange === "5s") {
        // Fetch the initial price
        const response = await axios.get(
          "http://127.0.0.1:5000/api/simulate-price-5s",
          {
            params: {
              symbol: ticker,
              trend_state: trendState,
              trend_counter: trendCounter,
            },
          }
        );

        const closePrice = response.data.new_price; // Extract initial price
        setCandlestickData([{ start: closePrice, end: closePrice }]);
        setTrendState(response.data.trend);
        setTrendCounter(response.data.trend_counter);

        clearInterval(simulationInterval); // Clear any existing interval

        const interval = setInterval(async () => {
          try {
            // Fetch the next simulated price from the API
            const simulatedResponse = await axios.get(
              "http://127.0.0.1:5000/api/simulate-price-5s",
              {
                params: {
                  symbol: ticker,
                  trend_state: trendState,
                  trend_counter: trendCounter,
                },
              }
            );

            const simulatedPrice = simulatedResponse.data.new_price;

            // Update candlestick data
            setCandlestickData((prevData) => {
              const lastPrice = prevData.at(-1).end;

              // Use the simulated price directly
              return [
                ...prevData,
                { start: lastPrice, end: simulatedPrice },
              ].slice(-60); // Keep the last 60 candles (5 minutes)
            });

            // Update trend state and counter for the next API call
            setTrendState(simulatedResponse.data.trend);
            setTrendCounter(simulatedResponse.data.trend_counter);
          } catch (error) {
            console.error("Error fetching simulated price:", error);
          }
        }, 5000);

        setSimulationInterval(interval);
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
                    chartData.datasets[0].data.at(-1) >
                    chartData.datasets[0].data[0]
                      ? "#10b981"
                      : "#ef4444",
                }}
              >
                {chartData.datasets[0].data.at(-1) >
                chartData.datasets[0].data[0]
                  ? "+"
                  : ""}
                {(
                  chartData.datasets[0].data.at(-1) -
                  chartData.datasets[0].data[0]
                ).toFixed(2)}{" "}
                USD{" "}
                <span style={{ color: "white" }}>
                  (
                  {chartData.datasets[0].data.at(-1) >
                  chartData.datasets[0].data[0]
                    ? "+"
                    : ""}
                  {(
                    ((chartData.datasets[0].data.at(-1) -
                      chartData.datasets[0].data[0]) /
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
        {timeRange === "5s" ? (
          candlestickData.length > 0 ? (
            <Candlestick data={candlestickData} />
          ) : (
            <p>Loading candlestick chart...</p>
          )
        ) : chartData ? (
          <LineChart chartData={chartData} />
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
        <PlaceOrder />
      </div>
    </div>
  );
}

export default Market;
