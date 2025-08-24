"use client"

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LineChart from './chart';
import BidAskTable from './bidask';
import PlaceOrder from './placeorder';
import PortfolioChart from './portfoliochart';
import PositionsTab from './positionstab';

export default function Dashboard() {
  const [ticker, setTicker] = useState(null); // Null for portfolio view, string for stock view
  const [name, setName] = useState("");
  const [chartData, setChartData] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [timeRange, setTimeRange] = useState("1mo");
  const [activeButton, setActiveButton] = useState("1mo");
  const [currentPrice, setCurrentPrice] = useState(null);
  const prevTicker = useRef(null);

  const fetchStockData = async (stock) => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:5000/api/stock-data",
        { params: { ticker: stock, range: timeRange } }
      );
      const data = response.data;
      const isIncreasing = data.prices[data.prices.length - 1] > data.prices[0];

      const companyResponse = await axios.get(
        "http://127.0.0.1:5000/api/company-name",
        { params: { ticker: stock } }
      );
      setCompanyName(companyResponse.data.companyName);

      setChartData({
        labels: data.labels,
        datasets: [
          {
            label: `${stock} Stock Price (USD)`,
            data: data.prices,
            borderColor: isIncreasing ? "#10b981" : "#ef4444",
            backgroundColor: isIncreasing ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
            fill: true,
          },
        ],
      });
      setCurrentPrice(data.prices[data.prices.length - 1]);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setChartData(null);
      setCurrentPrice(null);
    }
  };

  useEffect(() => {
    if (ticker) {
      if (prevTicker.current !== ticker) {
        setTimeRange('1mo');
        setActiveButton('1mo');
        prevTicker.current = ticker;
      }
      fetchStockData(ticker);
    }
  }, [ticker, timeRange]);

  const handleButtonClick = (range) => {
    setActiveButton(range);
    setTimeRange(range);
  };

  const handleTickerChange = async () => {
    const newTicker = name.toUpperCase();
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/valid-ticker', {
        params: { ticker: newTicker },
      });
      if (response.data.is_valid) {
        setTicker(newTicker);
      } else {
        alert("Invalid ticker symbol. Please try again.");
      }
    } catch (error) {
      alert("Error validating ticker. Please try again.");
    }
  };

  return (
    <div className='flex flex-col md:flex-row w-full h-full p-5 gap-5'>
      <div className='flex-grow flex flex-col bg-zinc-900 rounded-xl p-5 overflow-y-auto'>
        <div className='w-full mb-5'>
          <div className='w-full'>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              type="text"
              className="w-full md:w-1/3 px-3 py-2 text-white bg-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Search for stocks..."
            />
            <button onClick={handleTickerChange} className="mt-2 md:mt-0 md:ml-3 px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-600 transition duration-300">
              Search
            </button>
          </div>
        </div>

        {ticker ? (
          <>
            <div className='flex flex-col mb-5'>
              <h2 className='text-4xl font-bold'>{companyName ? `${companyName} (${ticker})` : `Loading...`}</h2>
              <div className='flex items-baseline gap-2 mt-2'>
                <span className='text-3xl font-bold text-white'>${currentPrice ? currentPrice.toFixed(2) : "Loading..."}</span>
                {chartData && (
                  <span className={`text-lg ${chartData.datasets[0].data[chartData.datasets[0].data.length - 1] > chartData.datasets[0].data[0] ? 'text-green-500' : 'text-red-500'}`}>
                    ({(((currentPrice - chartData.datasets[0].data[0]) / chartData.datasets[0].data[0]) * 100).toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
            <div className='w-full h-96 mb-5 bg-zinc-950 rounded-lg p-5 flex items-center justify-center'>
              {chartData ? <LineChart chartData={chartData} /> : <p className='text-gray-400'>Loading chart...</p>}
            </div>
            <div className='flex justify-between w-full mb-5'>
              {["1d", "5d", "1mo", "1y", "max"].map((range) => (
                <button
                  key={range}
                  onClick={() => handleButtonClick(range)}
                  className={`px-4 py-1 rounded-full text-sm font-semibold transition duration-300 ${activeButton === range ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'}`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              <div className='bg-zinc-800 rounded-lg p-5'>
                <h3 className='text-xl font-bold mb-3'>Your Position</h3>
                <p>Shares: 10</p>
                <p>Average Cost: $160.00</p>
                <p>Total Value: ${(10 * (currentPrice || 0)).toFixed(2)}</p>
                <p>Today's Return: ${(((currentPrice || 0) - 160.00) * 10).toFixed(2)}</p>
              </div>
              <div className='bg-zinc-800 rounded-lg p-5'>
                <h3 className='text-xl font-bold mb-3'>Place Order</h3>
                <PlaceOrder />
              </div>
            </div>
            <div className='mt-5 bg-zinc-800 rounded-lg p-5'>
              <h3 className='text-xl font-bold mb-3'>Market/Quotes</h3>
              <BidAskTable ticker={ticker} price={currentPrice} />
            </div>
          </>
        ) : (
          <>
            <div className='mb-5'>
              <h2 className='text-4xl font-bold'>My Portfolio</h2>
              <div className='flex items-baseline gap-2 mt-2'>
                <span className='text-3xl font-bold text-white'>$1,755.00</span>
                <span className={`text-lg text-green-500`}>(+1.25%)</span>
              </div>
            </div>
            <div className='w-full h-96 mb-5 bg-zinc-950 rounded-lg p-5 flex items-center justify-center'>
              <PortfolioChart />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                <div className='bg-zinc-800 rounded-lg p-5'>
                    <h3 className='text-xl font-bold mb-3'>Place an Order</h3>
                    <PlaceOrder />
                </div>
                <div className='bg-zinc-800 rounded-lg p-5'>
                  <h3 className='text-xl font-bold mb-3'>Your Positions</h3>
                  <PositionsTab onTickerClick={setTicker} />
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}