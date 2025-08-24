"use client"

import React, { useState, useEffect } from "react";
import axios from "axios";

export default function BidAskTable({ ticker, price }) {
  const [bidAskData, setBidAskData] = useState([]);
  const [intervalId, setIntervalId] = useState(null);

  const fetchBidAskData = async () => {
    try {
      if (!ticker) {
        setBidAskData([]);
        return;
      }
      const response = await axios.get(
        `http://127.0.0.1:5000/api/bid-ask`,
        {
          params: { ticker: ticker, price: price },
        }
      );
      setBidAskData(response.data.bid_ask_data);
    } catch (error) {
      console.error("Error fetching bid-ask data:", error);
    }
  };

  useEffect(() => {
    // Clear any existing interval
    if (intervalId) {
      clearInterval(intervalId);
    }

    if (ticker && price) {
      fetchBidAskData(); // Fetch immediately
      const newIntervalId = setInterval(fetchBidAskData, 5000); // Fetch every 5 seconds
      setIntervalId(newIntervalId);
    }

    return () => {
      // Cleanup on unmount
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [ticker, price]);

  if (!ticker) {
    return <div className="text-gray-400">Select a ticker to see market data.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-zinc-800">
          <tr>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Bid Size</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Bid</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Ask</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Ask Size</th>
          </tr>
        </thead>
        <tbody>
          {bidAskData.length > 0 ? (
            bidAskData.map((data, index) => (
              <tr key={index} className="hover:bg-zinc-700 transition duration-200">
                <td className="py-2 px-4 text-gray-400">{data.bid_size}</td>
                <td className="py-2 px-4 text-green-500 font-bold">${data.bid_price.toFixed(2)}</td>
                <td className="py-2 px-4 text-red-500 font-bold">${data.ask_price.toFixed(2)}</td>
                <td className="py-2 px-4 text-gray-400">{data.ask_size}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-400">Loading market data...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}