"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import CandlestickChart, { CandleData } from './chart';
import BidAskTable from './bidask';
import PlaceOrder from './placeorder';
import PortfolioChart from './portfoliochart';
import PositionsTab from './positionstab';
import PortfolioMetrics from './portfoliometrics';
import PortfolioDiversity from './portfoliodiversity';
import CompanyDetails from './companydetails';
import TradeHistory from './tradehistory';

const bridgeSocketUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:3001";
const socket = io(bridgeSocketUrl);

interface RawCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function Dashboard() {
  const [ticker, setTicker] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  // LIVE DATA STATES
  const [rawCandles, setRawCandles] = useState<RawCandle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  
  const [timeRange, setTimeRange] = useState("5s");
  const [activeButton, setActiveButton] = useState("5s");
  const prevTicker = useRef<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    if (prevTicker.current !== ticker) {
        setTimeRange('5s');
        setActiveButton('5s');
        prevTicker.current = ticker;
    }

    setRawCandles([]); // Clear old data

    // Fetch company name (Optional, keep if you have the API)
    axios.get<{ companyName: string }>("/api/company-name", { params: { ticker } })
         .then(res => setCompanyName(res.data.companyName))
         .catch(() => setCompanyName(""));

    // 1. Request Historical 5s Candles from SQLite
    socket.emit("get_chart_history", ticker);

    // 2. Listen for the initial history payload
    const handleHistory = (data: { ticker: string, candles: RawCandle[] }) => {
      if (data.ticker === ticker) {
        setRawCandles(data.candles);
        if (data.candles.length > 0) {
          setCurrentPrice(data.candles[data.candles.length - 1].close);
        }
      }
    };

    // 3. Listen for live candle updates
    const handleCandleUpdate = (data: RawCandle & { ticker: string }) => {
      if (data.ticker !== ticker) return;
      
      setCurrentPrice(data.close);
      
      setRawCandles(prev => {
        const copy = [...prev];
        const lastIndex = copy.length - 1;
        
        // If it's the same 5s bucket, update it. Otherwise, push a new candle.
        if (lastIndex >= 0 && copy[lastIndex].timestamp === data.timestamp) {
          copy[lastIndex] = data; 
        } else {
          copy.push(data);
        }
        return copy;
      });
    };

    socket.on("chart_history", handleHistory);
    socket.on("candle_update", handleCandleUpdate);

    return () => {
      socket.off("chart_history", handleHistory);
      socket.off("candle_update", handleCandleUpdate);
    };
  }, [ticker]);

  // --- DYNAMIC TIME AGGREGATION FOR TRADINGVIEW ---
  const chartData = useMemo<CandleData[] | null>(() => {
    if (rawCandles.length === 0) return null;

    let bucketSizeMs = 5000; // default 5s
    if (timeRange === "1m") bucketSizeMs = 60000;
    else if (timeRange === "1h") bucketSizeMs = 3600000;
    else if (timeRange === "1d" || timeRange === "max") bucketSizeMs = 86400000; 

    const aggregated: RawCandle[] = [];
    
    rawCandles.forEach(candle => {
      const bucketTime = Math.floor(candle.timestamp / bucketSizeMs) * bucketSizeMs;
      
      if (aggregated.length === 0 || aggregated[aggregated.length - 1].timestamp !== bucketTime) {
        aggregated.push({ ...candle, timestamp: bucketTime });
      } else {
        const last = aggregated[aggregated.length - 1];
        last.high = Math.max(last.high, candle.high);
        last.low = Math.min(last.low, candle.low);
        last.close = candle.close; // Latest close wins
        last.volume += candle.volume;
      }
    });

    // Map to the strict format TradingView Lightweight Charts expects
    return aggregated.map(c => ({
      time: Math.floor(c.timestamp / 1000) as import('lightweight-charts').Time, // Convert ms to seconds
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
  }, [rawCandles, timeRange, ticker]);

  const handleButtonClick = (range: string) => {
    setActiveButton(range);
    setTimeRange(range);
  };

  const handleTickerChange = () => {
    if (name.trim()) setTicker(name.toUpperCase());
  };

  // --- DUMMY DATA RESTORED ---
  const positions = [
      { ticker: 'AAPL', shares: 10, price: 175.00 },
      { ticker: 'MSFT', shares: 5, price: 350.00 },
      { ticker: 'GOOG', shares: 8, price: 2600.00 },
  ];
  const totalEquity = positions.reduce((sum, pos) => sum + pos.shares * pos.price, 0);
  const totalPnL = 205.00; 
  const buyingPower = 500.00; 
  const tradeHistory = [
      { type: 'buy' as const, shares: 5, price: 155.00, date: 'Jul 20, 2023' },
      { type: 'sell' as const, shares: 2, price: 165.00, date: 'Aug 01, 2023' },
      { type: 'buy' as const, shares: 7, price: 170.00, date: 'Aug 15, 2023' },
  ];
  
  const currentPositionValue = (currentPrice || 0) * 10;
  const portfolioDiversity = totalEquity > 0 ? (currentPositionValue / totalEquity) * 100 : 0;
  const totalReturn = ((currentPrice || 0) - 160.00) * 10;
  const isPositiveReturn = totalReturn >= 0;

  return (
    <div className='flex flex-col md:flex-row w-full h-full p-5 gap-5'>
      <div className='flex-grow flex flex-col bg-zinc-900 rounded-xl p-5 overflow-y-auto'>
        <div className='w-full mb-5'>
          <div className='w-full'>
            <input
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTickerChange()}
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
              <h2 className='text-4xl font-bold'>{companyName ? `${companyName} (${ticker})` : `${ticker}`}</h2>
              <div className='flex items-baseline gap-2 mt-2'>
                <span className='text-3xl font-bold text-white'>${currentPrice ? currentPrice.toFixed(2) : "Loading..."}</span>
                {chartData && currentPrice !== null && chartData.length > 0 && (
                  <span className={`text-lg ${currentPrice >= chartData[0].close ? 'text-green-500' : 'text-red-500'}`}>
                    ({(((currentPrice - chartData[0].close) / chartData[0].close) * 100).toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5'>
              <div className='col-span-1'>
                <div className='w-full h-96 bg-zinc-950 rounded-lg p-5 flex items-center justify-center'>
                  {chartData ? <CandlestickChart data={chartData} /> : <p className='text-gray-400'>Loading chart...</p>}
                </div>
                <div className='flex justify-between w-full mt-5'>
                  {["5s", "1m", "1h", "1d", "max"].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleButtonClick(range)}
                      className={`px-4 py-1 rounded-full text-sm font-semibold transition duration-300 ${activeButton === range ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'}`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className='col-span-1 bg-zinc-800 rounded-lg p-5'>
                <h3 className='text-xl font-bold mb-3 text-white'>Place an Order</h3>
                <PlaceOrder currentPrice={currentPrice} />
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mt-5'>
                <div className='bg-zinc-800 rounded-lg p-5 flex flex-col justify-between' style={{ minHeight: '400px' }}>
                    <div>
                        <h3 className='text-xl font-bold mb-3 text-white'>Your Position</h3>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-gray-400 text-sm">Shares</p>
                                <p className="text-white text-lg font-bold">10</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Average Cost</p>
                                <p className="text-white text-lg font-bold">${(160.00).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Value</p>
                                <p className="text-white text-lg font-bold">${(10 * (currentPrice || 0)).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Today's Return</p>
                                <p className={`text-lg font-bold ${((currentPrice || 0) - 160.00) >= 0 ? 'text-green-500' : 'text-red-500'}`}>${(((currentPrice || 0) - 160.00) * 10).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Return</p>
                                <p className={`text-lg font-bold ${isPositiveReturn ? 'text-green-500' : 'text-red-500'}`}>${totalReturn.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Portfolio Diversity</p>
                                <p className="text-white text-lg font-bold">{portfolioDiversity.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                    <TradeHistory trades={tradeHistory} />
                </div>
                <div className='bg-zinc-800 rounded-lg p-5 flex flex-col' style={{ minHeight: '400px' }}>
                    <h3 className='text-xl font-bold mb-3'>Market/Quotes</h3>
                    <div className="flex-grow">
                        <BidAskTable ticker={ticker} price={currentPrice} />
                    </div>
                </div>
            </div>
            <div className="mt-5 bg-zinc-800 rounded-lg p-5">
              <CompanyDetails ticker={ticker} />
            </div>
          </>
        ) : (
          <>
            <div className='mb-5'>
              <h2 className='text-4xl font-bold'>My Portfolio</h2>
              <div className='flex items-baseline gap-2 mt-2'>
                <span className='text-3xl font-bold text-white'>${totalEquity.toFixed(2)}</span>
                <span className={`text-lg ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ({((totalPnL / (totalEquity - totalPnL)) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className='w-full h-96 mb-5 bg-zinc-950 rounded-lg p-5 flex items-center justify-center'>
              <PortfolioChart />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              <div className='col-span-1 md:col-span-2 lg:col-span-1'>
                <PortfolioMetrics totalEquity={totalEquity} buyingPower={buyingPower} totalPnL={totalPnL} />
              </div>
              <div className='bg-zinc-800 rounded-lg p-5'>
                <h3 className='text-xl font-bold mb-3'>Your Positions</h3>
                <PositionsTab onTickerClick={setTicker} />
              </div>
              <div className='col-span-1'>
                <PortfolioDiversity positions={positions} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}