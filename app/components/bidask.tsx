"use client"

import React, { useState, useEffect } from "react";
import axios from "axios";

interface BidAskData {
  bid_size: number;
  bid: number;
  ask: number;
  ask_size: number;
}

interface BidAskTableProps {
  ticker: string | null;
  price: number | null;
}

export default function BidAskTable({ ticker, price }: BidAskTableProps) {
  const [bidAskData, setBidAskData] = useState<BidAskData[]>([]);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const fetchBidAskData = async () => {
    try {
      if (!ticker || price === null) {
        setBidAskData([]);
        return;
      }
      const response = await axios.get(
        `/api/bid-ask`,
        {
          params: { symbol: ticker, price: price },
        }
      );
      // The Flask API returns a single object, so we wrap it in an array
      setBidAskData([response.data]);
    } catch (error) {
      console.error("Error fetching bid-ask data:", error);
      setBidAskData([]); // Reset data on error to prevent issues
    }
  };

  useEffect(() => {
    // Clear any existing interval
    if (intervalId) {
      clearInterval(intervalId);
    }

    if (ticker && price !== null) {
      fetchBidAskData(); // Fetch immediately
      const newIntervalId = setInterval(fetchBidAskData, 5000); // Fetch every 5 seconds
      setIntervalId(newIntervalId);
    } else {
      setBidAskData([]);
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
                <td className="py-2 px-4 text-green-500 font-bold">${data.bid.toFixed(2)}</td>
                <td className="py-2 px-4 text-red-500 font-bold">${data.ask.toFixed(2)}</td>
                <td className="py-2 px-4 text-gray-400">{data.ask_size}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-400">Loading market data...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}